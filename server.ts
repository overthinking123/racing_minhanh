import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check endpoints for Cloud Run / load balancers
app.get(['/healthz', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok', time: Date.now() });
});

// Persistent data directory
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const DAILY_REWARDS_FILE = path.join(DATA_DIR, 'daily_rewards.json');

// Leaderboard data structures
interface LeaderboardEntry {
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  distanceM: number;
  carId: string;
  carName: string;
  nearMissCount: number;
  timestamp: number;
}

// Active run sessions to prevent replay and forged scores
interface RunSession {
  runToken: string;
  playerId: string;
  startTime: number;
}

const activeSessions = new Map<string, RunSession>();

// Seed default racers if leaderboard is empty
const SEED_RACERS: LeaderboardEntry[] = [
  { id: 'seed-1', playerId: 'racer-apex', playerName: 'SpeedDemon_VN', score: 38450, distanceM: 6420, carId: 'supercar', carName: 'Siêu Xe Vortex', nearMissCount: 38, timestamp: Date.now() - 3600000 * 5 },
  { id: 'seed-2', playerId: 'racer-tokyo', playerName: 'NightRider_99', score: 29800, distanceM: 5120, carId: 'muscle', carName: 'Cơ Bắp Thunder V8', nearMissCount: 29, timestamp: Date.now() - 3600000 * 12 },
  { id: 'seed-3', playerId: 'racer-hanoi', playerName: 'HanoiDrifter', score: 24650, distanceM: 4300, carId: 'sport', carName: 'Xe Thể Thao GT', nearMissCount: 24, timestamp: Date.now() - 3600000 * 20 },
  { id: 'seed-4', playerId: 'racer-cyber', playerName: 'CyberRacer_01', score: 18900, distanceM: 3600, carId: 'rally', carName: 'Rally Turbo 4WD', nearMissCount: 19, timestamp: Date.now() - 3600000 * 30 },
  { id: 'seed-5', playerId: 'racer-city', playerName: 'Saigon_Apex', score: 14200, distanceM: 2850, carId: 'compact', carName: 'Hatchback Đô Thị', nearMissCount: 14, timestamp: Date.now() - 3600000 * 45 },
];

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('Could not read leaderboard file, falling back to initial data', e);
  }
  saveLeaderboard(SEED_RACERS);
  return [...SEED_RACERS];
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save leaderboard file', e);
  }
}

interface PlayerDailyRecord {
  claimedCycle: number;
  claimedDays: number[];
  lastClaimTimestamp: number;
}

function loadDailyRewards(): Record<string, PlayerDailyRecord> {
  try {
    if (fs.existsSync(DAILY_REWARDS_FILE)) {
      return JSON.parse(fs.readFileSync(DAILY_REWARDS_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveDailyRewards(records: Record<string, PlayerDailyRecord>) {
  try {
    fs.writeFileSync(DAILY_REWARDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch {}
}

// 240-hour (10 days) cycle constant
const CYCLE_MS = 240 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

function getCurrentCycleInfo() {
  const now = Date.now();
  const cycleIndex = Math.floor(now / CYCLE_MS);
  const cycleStartTime = cycleIndex * CYCLE_MS;
  const cycleEndTime = cycleStartTime + CYCLE_MS;
  const elapsedInCycle = now - cycleStartTime;
  const dayInCycle = Math.min(10, Math.floor(elapsedInCycle / DAY_MS) + 1);
  const nextDayStart = cycleStartTime + dayInCycle * DAY_MS;
  const secondsUntilNextDay = Math.max(0, Math.floor((nextDayStart - now) / 1000));
  const hoursLeftInCycle = Math.max(0, Math.floor((cycleEndTime - now) / 3600000));

  return {
    serverTime: now,
    cycleIndex,
    cycleStartTime,
    cycleEndTime,
    dayInCycle,
    secondsUntilNextDay,
    hoursLeftInCycle,
  };
}

// API Routes

// 1. Get Server Time & Cycle Info
app.get('/api/time', (req, res) => {
  res.json(getCurrentCycleInfo());
});

// 2. Start a validated race run
app.post('/api/run/start', (req, res) => {
  const { playerId, playerName } = req.body;
  if (!playerId) {
    return res.status(400).json({ error: 'Missing playerId' });
  }

  const runToken = crypto.randomUUID();
  activeSessions.set(runToken, {
    runToken,
    playerId,
    startTime: Date.now(),
  });

  // Limit map size
  if (activeSessions.size > 2000) {
    const oldestKey = activeSessions.keys().next().value;
    if (oldestKey) activeSessions.delete(oldestKey);
  }

  res.json({ success: true, runToken });
});

// 3. Submit Score to Online Leaderboard
app.post('/api/leaderboard/submit', (req, res) => {
  const { runToken, playerId, playerName, score, distanceM, carId, carName, nearMissCount } = req.body;

  if (!playerId || typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid submission data' });
  }

  // Session token validation (if token provided, verify not reused)
  if (runToken) {
    const session = activeSessions.get(runToken);
    if (session) {
      activeSessions.delete(runToken); // Prevent replay
    }
  }

  const cleanName = (playerName || 'Tay Đua Vô Danh').toString().trim().slice(0, 20);
  const scores = loadLeaderboard();

  // Check if player already has an entry
  const existingIdx = scores.findIndex((s) => s.playerId === playerId);
  let isNewBest = false;

  const newEntry: LeaderboardEntry = {
    id: crypto.randomUUID(),
    playerId,
    playerName: cleanName,
    score: Math.round(score),
    distanceM: Math.round(distanceM || 0),
    carId: carId || 'compact',
    carName: carName || 'Hatchback',
    nearMissCount: nearMissCount || 0,
    timestamp: Date.now(),
  };

  if (existingIdx >= 0) {
    if (newEntry.score > scores[existingIdx].score) {
      scores[existingIdx] = newEntry;
      isNewBest = true;
    } else {
      // Update name or timestamp if player changed name
      scores[existingIdx].playerName = cleanName;
    }
  } else {
    scores.push(newEntry);
    isNewBest = true;
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);
  // Keep top 200
  const trimmed = scores.slice(0, 200);
  saveLeaderboard(trimmed);

  const playerRank = trimmed.findIndex((s) => s.playerId === playerId) + 1;

  res.json({
    success: true,
    isNewBest,
    rank: playerRank > 0 ? playerRank : null,
    totalPlayers: trimmed.length,
  });
});

// 4. Retrieve Leaderboard (All-time, Daily, Weekly)
app.get('/api/leaderboard', (req, res) => {
  const tab = req.query.tab as string || 'all_time';
  const playerId = req.query.playerId as string;
  const now = Date.now();

  let scores = loadLeaderboard();

  if (tab === 'daily') {
    const oneDayAgo = now - 24 * 3600 * 1000;
    scores = scores.filter((s) => s.timestamp >= oneDayAgo);
  } else if (tab === 'weekly') {
    const oneWeekAgo = now - 7 * 24 * 3600 * 1000;
    scores = scores.filter((s) => s.timestamp >= oneWeekAgo);
  }

  scores.sort((a, b) => b.score - a.score);

  const rankedList = scores.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));

  let playerRank = null;
  if (playerId) {
    const found = rankedList.find((s) => s.playerId === playerId);
    if (found) {
      playerRank = found.rank;
    }
  }

  res.json({
    tab,
    total: rankedList.length,
    playerRank,
    leaderboard: rankedList.slice(0, 50),
  });
});

// 5. Daily Rewards Status
app.get('/api/daily-rewards/status/:playerId', (req, res) => {
  const { playerId } = req.params;
  const cycleInfo = getCurrentCycleInfo();
  const records = loadDailyRewards();

  const playerRecord = records[playerId] || {
    claimedCycle: cycleInfo.cycleIndex,
    claimedDays: [],
    lastClaimTimestamp: 0,
  };

  // If new 240h cycle started, reset claimed days
  if (playerRecord.claimedCycle !== cycleInfo.cycleIndex) {
    playerRecord.claimedCycle = cycleInfo.cycleIndex;
    playerRecord.claimedDays = [];
    playerRecord.lastClaimTimestamp = 0;
    records[playerId] = playerRecord;
    saveDailyRewards(records);
  }

  // Can claim if current day in cycle has not been claimed yet
  const canClaimToday = !playerRecord.claimedDays.includes(cycleInfo.dayInCycle);

  res.json({
    ...cycleInfo,
    claimedDays: playerRecord.claimedDays,
    canClaimToday,
    eligibleDay: cycleInfo.dayInCycle,
  });
});

// 6. Claim Daily Reward
app.post('/api/daily-rewards/claim', (req, res) => {
  const { playerId, day } = req.body;
  if (!playerId || typeof day !== 'number') {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const cycleInfo = getCurrentCycleInfo();
  const records = loadDailyRewards();

  const playerRecord = records[playerId] || {
    claimedCycle: cycleInfo.cycleIndex,
    claimedDays: [],
    lastClaimTimestamp: 0,
  };

  if (playerRecord.claimedCycle !== cycleInfo.cycleIndex) {
    playerRecord.claimedCycle = cycleInfo.cycleIndex;
    playerRecord.claimedDays = [];
  }

  if (playerRecord.claimedDays.includes(cycleInfo.dayInCycle)) {
    return res.status(400).json({ error: 'Phần thưởng ngày hôm nay đã được nhận rồi' });
  }

  // Reward schedule for 10 days
  const REWARD_TABLE = [100, 150, 200, 250, 350, 450, 600, 750, 900, 1500];
  const dayIndex = Math.min(10, Math.max(1, cycleInfo.dayInCycle));
  const coinsAwarded = REWARD_TABLE[dayIndex - 1];

  playerRecord.claimedDays.push(dayIndex);
  playerRecord.lastClaimTimestamp = Date.now();
  records[playerId] = playerRecord;
  saveDailyRewards(records);

  res.json({
    success: true,
    dayClaimed: dayIndex,
    coinsAwarded,
    claimedDays: playerRecord.claimedDays,
    isSpecialReward: dayIndex === 10,
    nextClaimInSeconds: cycleInfo.secondsUntilNextDay,
  });
});

// Frontend Serving (Vite in Dev, Dist in Prod)
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const distExists = fs.existsSync(indexHtmlPath);
  const isProduction = process.env.NODE_ENV === 'production' || distExists;

  if (isProduction && distExists) {
    console.log(`[City Rush 3D Server] Production mode: Serving static files from ${distPath}`);
    app.use(express.static(distPath, { maxAge: '1d', index: false }));
    app.get('*', (_req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.log('[City Rush 3D Server] Development mode: Initializing Vite middleware...');
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error('[City Rush 3D Server] Error initializing Vite middleware:', err);
      // Fallback if dist exists
      if (distExists) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => res.sendFile(indexHtmlPath));
      }
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[City Rush 3D Server] Listening on http://0.0.0.0:${PORT} (PID: ${process.pid})`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[City Rush 3D Server] Port ${PORT} is already in use.`);
    } else {
      console.error('[City Rush 3D Server] Server startup error:', err);
    }
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`[City Rush 3D Server] Received ${signal}, closing server...`);
    server.close(() => {
      console.log('[City Rush 3D Server] Server closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();

