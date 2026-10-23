/**
 * City Rush 3D - Procedural Web Audio Sound Engine
 * Zero external audio files, real-time procedural synthesis.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning = false;

  // Screech sound
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;

  // Nitro sound
  private nitroGain: GainNode | null = null;

  private isMuted = false;
  private masterVol = 0.8;
  private engineVol = 0.8;
  private sfxVol = 0.85;

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVol;
      this.masterGain.connect(this.ctx.destination);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = this.engineVol * 0.35;
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, engine: number, sfx: number) {
    this.masterVol = master;
    this.engineVol = engine;
    this.sfxVol = sfx;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVol, this.ctx.currentTime, 0.05);
    }
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(this.engineVol * 0.35, this.ctx.currentTime, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.05);
    }
  }

  public startEngine() {
    this.initContext();
    if (!this.ctx || !this.engineGain || this.isEngineRunning) return;

    try {
      const now = this.ctx.currentTime;
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(350, now);
      this.engineFilter.connect(this.engineGain);

      // Low rumble sawtooth
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(55, now);
      this.engineOsc1.connect(this.engineFilter);

      // Sub-harmonic triangle for exhaust growl
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(27.5, now);
      this.engineOsc2.connect(this.engineFilter);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Failed to start engine audio:', e);
    }
  }

  public updateEngine(speedKmh: number, isAccelerating: boolean, isBraking: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const now = this.ctx.currentTime;

    // Simulated 6-speed gearbox RPM computation
    const maxSpeed = 300;
    const normSpeed = Math.min(1.0, Math.max(0, speedKmh / maxSpeed));

    // Gear shift sawtooth wave based on speed
    const gearCount = 6;
    const gearProgress = (normSpeed * gearCount) % 1;
    const currentGear = Math.floor(normSpeed * gearCount) + 1;

    // Base pitch varies with gear + rev
    const idlePitch = 48; // Hz
    const maxRevPitch = 140; // Hz
    const pitch = idlePitch + (currentGear * 6) + (gearProgress * (maxRevPitch - idlePitch));

    this.engineOsc1.frequency.setTargetAtTime(pitch, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(pitch * 0.5, now, 0.08);

    // Throttle opens filter cutoff
    const cutoff = isAccelerating ? 650 + (gearProgress * 800) : 280 + (gearProgress * 300);
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.08);

    // Tire screech handling
    if (isBraking && speedKmh > 35) {
      this.playTireScreech();
    } else {
      this.stopTireScreech();
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc1?.disconnect();
      this.engineOsc2?.disconnect();
      this.engineFilter?.disconnect();
    } catch {}
    this.isEngineRunning = false;
    this.stopTireScreech();
    this.stopNitro();
  }

  public playTireScreech() {
    if (!this.ctx || !this.sfxGain || this.screechGain) return;
    try {
      const now = this.ctx.currentTime;
      // White noise buffer
      const bufferSize = this.ctx.sampleRate * 1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      this.screechFilter = this.ctx.createBiquadFilter();
      this.screechFilter.type = 'bandpass';
      this.screechFilter.frequency.setValueAtTime(2200, now);
      this.screechFilter.Q.setValueAtTime(4.0, now);

      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.setValueAtTime(0.01, now);
      this.screechGain.gain.exponentialRampToValueAtTime(0.18, now + 0.1);

      noise.connect(this.screechFilter);
      this.screechFilter.connect(this.screechGain);
      this.screechGain.connect(this.sfxGain);

      noise.start();
    } catch {}
  }

  public stopTireScreech() {
    if (!this.ctx || !this.screechGain) return;
    try {
      const now = this.ctx.currentTime;
      this.screechGain.gain.setValueAtTime(this.screechGain.gain.value, now);
      this.screechGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      setTimeout(() => {
        this.screechGain?.disconnect();
        this.screechGain = null;
      }, 120);
    } catch {
      this.screechGain = null;
    }
  }

  public playHorn() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Classic dual-tone automotive horn (F4 & A4: ~349Hz and ~440Hz)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(370, now);
      osc2.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {}
  }

  public startNitro() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.nitroGain) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(2.5, now);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0.01, now);
      this.nitroGain.gain.exponentialRampToValueAtTime(0.35, now + 0.2);

      noise.connect(filter);
      filter.connect(this.nitroGain);
      this.nitroGain.connect(this.sfxGain);

      noise.start();
    } catch {}
  }

  public stopNitro() {
    if (!this.ctx || !this.nitroGain) return;
    try {
      const now = this.ctx.currentTime;
      this.nitroGain.gain.setValueAtTime(this.nitroGain.gain.value, now);
      this.nitroGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      setTimeout(() => {
        this.nitroGain?.disconnect();
        this.nitroGain = null;
      }, 160);
    } catch {
      this.nitroGain = null;
    }
  }

  public playCrash() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Metal crunch noise + heavy low punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      oscGain.gain.setValueAtTime(0.6, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.5);

      // White noise explosion crunch
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1200, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.7, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.6);
    } catch {}
  }

  public playNearMissDing() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5 note
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 note

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
