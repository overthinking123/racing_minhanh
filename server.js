import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
app.get(["/healthz", "/api/health"], (_req, res) => {
  res.status(200).json({ status: "ok", time: Date.now() });
});
const DATA_DIR = path.resolve(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const LEADERBOARD_FILE = path.join(DATA_DIR, "leaderboard.json");
const DAILY_REWARDS_FILE = path.join(DATA_DIR, "daily_rewards.json");
const activeSessions = /* @__PURE__ */ new Map();
const SEED_RACERS = [
  { id: "seed-1", playerId: "racer-apex", playerName: "SpeedDemon_VN", score: 38450, distanceM: 6420, carId: "supercar", carName: "Si\xEAu Xe Vortex", nearMissCount: 38, timestamp: Date.now() - 36e5 * 5 },
  { id: "seed-2", playerId: "racer-tokyo", playerName: "NightRider_99", score: 29800, distanceM: 5120, carId: "muscle", carName: "C\u01A1 B\u1EAFp Thunder V8", nearMissCount: 29, timestamp: Date.now() - 36e5 * 12 },
  { id: "seed-3", playerId: "racer-hanoi", playerName: "HanoiDrifter", score: 24650, distanceM: 4300, carId: "sport", carName: "Xe Th\u1EC3 Thao GT", nearMissCount: 24, timestamp: Date.now() - 36e5 * 20 },
  { id: "seed-4", playerId: "racer-cyber", playerName: "CyberRacer_01", score: 18900, distanceM: 3600, carId: "rally", carName: "Rally Turbo 4WD", nearMissCount: 19, timestamp: Date.now() - 36e5 * 30 },
  { id: "seed-5", playerId: "racer-city", playerName: "Saigon_Apex", score: 14200, distanceM: 2850, carId: "compact", carName: "Hatchback \u0110\xF4 Th\u1ECB", nearMissCount: 14, timestamp: Date.now() - 36e5 * 45 }
];
function loadLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, "utf-8"));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn("Could not read leaderboard file, falling back to initial data", e);
  }
  saveLeaderboard(SEED_RACERS);
  return [...SEED_RACERS];
}
function saveLeaderboard(entries) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save leaderboard file", e);
  }
}
function loadDailyRewards() {
  try {
    if (fs.existsSync(DAILY_REWARDS_FILE)) {
      return JSON.parse(fs.readFileSync(DAILY_REWARDS_FILE, "utf-8"));
    }
  } catch {
  }
  return {};
}
function saveDailyRewards(records) {
  try {
    fs.writeFileSync(DAILY_REWARDS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch {
  }
}
const CYCLE_MS = 240 * 3600 * 1e3;
const DAY_MS = 24 * 3600 * 1e3;
function getCurrentCycleInfo() {
  const now = Date.now();
  const cycleIndex = Math.floor(now / CYCLE_MS);
  const cycleStartTime = cycleIndex * CYCLE_MS;
  const cycleEndTime = cycleStartTime + CYCLE_MS;
  const elapsedInCycle = now - cycleStartTime;
  const dayInCycle = Math.min(10, Math.floor(elapsedInCycle / DAY_MS) + 1);
  const nextDayStart = cycleStartTime + dayInCycle * DAY_MS;
  const secondsUntilNextDay = Math.max(0, Math.floor((nextDayStart - now) / 1e3));
  const hoursLeftInCycle = Math.max(0, Math.floor((cycleEndTime - now) / 36e5));
  return {
    serverTime: now,
    cycleIndex,
    cycleStartTime,
    cycleEndTime,
    dayInCycle,
    secondsUntilNextDay,
    hoursLeftInCycle
  };
}
app.get("/api/time", (req, res) => {
  res.json(getCurrentCycleInfo());
});
app.post("/api/run/start", (req, res) => {
  const { playerId, playerName } = req.body;
  if (!playerId) {
    return res.status(400).json({ error: "Missing playerId" });
  }
  const runToken = crypto.randomUUID();
  activeSessions.set(runToken, {
    runToken,
    playerId,
    startTime: Date.now()
  });
  if (activeSessions.size > 2e3) {
    const oldestKey = activeSessions.keys().next().value;
    if (oldestKey) activeSessions.delete(oldestKey);
  }
  res.json({ success: true, runToken });
});
app.post("/api/leaderboard/submit", (req, res) => {
  const { runToken, playerId, playerName, score, distanceM, carId, carName, nearMissCount } = req.body;
  if (!playerId || typeof score !== "number" || score < 0) {
    return res.status(400).json({ error: "Invalid submission data" });
  }
  if (runToken) {
    const session = activeSessions.get(runToken);
    if (session) {
      activeSessions.delete(runToken);
    }
  }
  const cleanName = (playerName || "Tay \u0110ua V\xF4 Danh").toString().trim().slice(0, 20);
  const scores = loadLeaderboard();
  const existingIdx = scores.findIndex((s) => s.playerId === playerId);
  let isNewBest = false;
  const newEntry = {
    id: crypto.randomUUID(),
    playerId,
    playerName: cleanName,
    score: Math.round(score),
    distanceM: Math.round(distanceM || 0),
    carId: carId || "compact",
    carName: carName || "Hatchback",
    nearMissCount: nearMissCount || 0,
    timestamp: Date.now()
  };
  if (existingIdx >= 0) {
    if (newEntry.score > scores[existingIdx].score) {
      scores[existingIdx] = newEntry;
      isNewBest = true;
    } else {
      scores[existingIdx].playerName = cleanName;
    }
  } else {
    scores.push(newEntry);
    isNewBest = true;
  }
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, 200);
  saveLeaderboard(trimmed);
  const playerRank = trimmed.findIndex((s) => s.playerId === playerId) + 1;
  res.json({
    success: true,
    isNewBest,
    rank: playerRank > 0 ? playerRank : null,
    totalPlayers: trimmed.length
  });
});
app.get("/api/leaderboard", (req, res) => {
  const tab = req.query.tab || "all_time";
  const playerId = req.query.playerId;
  const now = Date.now();
  let scores = loadLeaderboard();
  if (tab === "daily") {
    const oneDayAgo = now - 24 * 3600 * 1e3;
    scores = scores.filter((s) => s.timestamp >= oneDayAgo);
  } else if (tab === "weekly") {
    const oneWeekAgo = now - 7 * 24 * 3600 * 1e3;
    scores = scores.filter((s) => s.timestamp >= oneWeekAgo);
  }
  scores.sort((a, b) => b.score - a.score);
  const rankedList = scores.map((entry, index) => ({
    rank: index + 1,
    ...entry
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
    leaderboard: rankedList.slice(0, 50)
  });
});
app.get("/api/daily-rewards/status/:playerId", (req, res) => {
  const { playerId } = req.params;
  const cycleInfo = getCurrentCycleInfo();
  const records = loadDailyRewards();
  const playerRecord = records[playerId] || {
    claimedCycle: cycleInfo.cycleIndex,
    claimedDays: [],
    lastClaimTimestamp: 0
  };
  if (playerRecord.claimedCycle !== cycleInfo.cycleIndex) {
    playerRecord.claimedCycle = cycleInfo.cycleIndex;
    playerRecord.claimedDays = [];
    playerRecord.lastClaimTimestamp = 0;
    records[playerId] = playerRecord;
    saveDailyRewards(records);
  }
  const canClaimToday = !playerRecord.claimedDays.includes(cycleInfo.dayInCycle);
  res.json({
    ...cycleInfo,
    claimedDays: playerRecord.claimedDays,
    canClaimToday,
    eligibleDay: cycleInfo.dayInCycle
  });
});
app.post("/api/daily-rewards/claim", (req, res) => {
  const { playerId, day } = req.body;
  if (!playerId || typeof day !== "number") {
    return res.status(400).json({ error: "Missing parameters" });
  }
  const cycleInfo = getCurrentCycleInfo();
  const records = loadDailyRewards();
  const playerRecord = records[playerId] || {
    claimedCycle: cycleInfo.cycleIndex,
    claimedDays: [],
    lastClaimTimestamp: 0
  };
  if (playerRecord.claimedCycle !== cycleInfo.cycleIndex) {
    playerRecord.claimedCycle = cycleInfo.cycleIndex;
    playerRecord.claimedDays = [];
  }
  if (playerRecord.claimedDays.includes(cycleInfo.dayInCycle)) {
    return res.status(400).json({ error: "Ph\u1EA7n th\u01B0\u1EDFng ng\xE0y h\xF4m nay \u0111\xE3 \u0111\u01B0\u1EE3c nh\u1EADn r\u1ED3i" });
  }
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
    nextClaimInSeconds: cycleInfo.secondsUntilNextDay
  });
});
async function startServer() {
  const distPath = path.resolve(__dirname, "dist");
  const indexHtmlPath = path.join(distPath, "index.html");
  const distExists = fs.existsSync(indexHtmlPath);
  const isProduction = process.env.NODE_ENV === "production" || distExists;
  if (isProduction && distExists) {
    console.log(`[City Rush 3D Server] Production mode: Serving static files from ${distPath}`);
    app.use(express.static(distPath, { maxAge: "1d", index: false }));
    app.get("*", (_req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.log("[City Rush 3D Server] Development mode: Initializing Vite middleware...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("[City Rush 3D Server] Error initializing Vite middleware:", err);
      if (distExists) {
        app.use(express.static(distPath));
        app.get("*", (_req, res) => res.sendFile(indexHtmlPath));
      }
    }
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[City Rush 3D Server] Listening on http://0.0.0.0:${PORT} (PID: ${process.pid})`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[City Rush 3D Server] Port ${PORT} is already in use.`);
    } else {
      console.error("[City Rush 3D Server] Server startup error:", err);
    }
  });
  const shutdown = (signal) => {
    console.log(`[City Rush 3D Server] Received ${signal}, closing server...`);
    server.close(() => {
      console.log("[City Rush 3D Server] Server closed cleanly.");
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
startServer();
