// Rebuilt audio detection engine
// Uses YIN-style normalized autocorrelation (NSDF) on time-domain data
// Exports: PitchDetector class, getRMS, playTone

import { NOTES_BY_NAME } from './puzzleEngine';

const NOTE_FREQUENCIES = Object.entries(NOTES_BY_NAME).map(([name, freq]) => ({ name, freq }));

// Compute RMS of a float32 buffer
export function getRMS(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

// Normalized Square Difference Function (NSDF) — more robust than simple autocorrelation
// Returns estimated fundamental frequency in Hz, or -1 if not found
function nsdPitch(buffer, sampleRate) {
  const N = buffer.length;
  const maxLag = Math.floor(N / 2);

  // Step 1: compute NSDF
  const nsdf = new Float32Array(maxLag);
  for (let tau = 0; tau < maxLag; tau++) {
    let acf = 0;
    let norm = 0;
    for (let i = 0; i < N - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      norm += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    nsdf[tau] = norm < 1e-8 ? 0 : (2 * acf) / norm;
  }

  // Step 2: find peaks (positive-zero-crossing to negative-zero-crossing maxima)
  const peaks = [];
  let i = 1;
  while (i < maxLag - 1) {
    // find start of positive region
    if (nsdf[i] > 0 && nsdf[i - 1] <= 0) {
      let peakVal = nsdf[i];
      let peakIdx = i;
      while (i < maxLag - 1 && nsdf[i] > 0) {
        if (nsdf[i] > peakVal) { peakVal = nsdf[i]; peakIdx = i; }
        i++;
      }
      if (peakVal > 0.1) peaks.push({ tau: peakIdx, val: peakVal });
    }
    i++;
  }

  if (peaks.length === 0) return -1;

  // Step 3: pick the best peak — first peak that is >= 0.8 * global max
  const globalMax = Math.max(...peaks.map(p => p.val));
  const threshold = 0.8 * globalMax;
  const best = peaks.find(p => p.val >= threshold);
  if (!best) return -1;

  // Step 4: parabolic interpolation for sub-sample accuracy
  const t = best.tau;
  const y0 = nsdf[Math.max(0, t - 1)];
  const y1 = nsdf[t];
  const y2 = nsdf[Math.min(maxLag - 1, t + 1)];
  const denom = y0 - 2 * y1 + y2;
  const refined = denom !== 0 ? t - 0.5 * (y2 - y0) / denom : t;

  return refined > 0 ? sampleRate / refined : -1;
}

// Find the closest note to a frequency, return { name, cents } or null
// tolerance in cents (100 = 1 semitone)
// calibrationOffsets: optional { noteName: centsOffset } map from piano calibration
function closestNote(frequency, toleranceCents = 100, calibrationOffsets = null) {
  if (frequency <= 0) return null;
  let best = null;
  let minCents = Infinity;
  for (const { name, freq } of NOTE_FREQUENCIES) {
    // Apply per-note calibration offset if available
    const offsetCents = calibrationOffsets?.[name] ?? 0;
    // Adjust the expected frequency by the calibration offset
    const adjustedFreq = freq * Math.pow(2, offsetCents / 1200);
    const cents = Math.abs(1200 * Math.log2(frequency / adjustedFreq));
    if (cents < minCents) { minCents = cents; best = name; }
  }
  return minCents <= toleranceCents ? { name: best, cents: minCents } : null;
}

export class PitchDetector {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
    this.source = null;
    this.isRunning = false;
    this.buffer = null;
    this.onNote = null;
    this.onRawFreq = null;
    this._animFrame = null;
    this._lastFiredNote = null;
    this._silenceFrames = 0;
    this._noteFrames = 0;
  }

  // deviceId: optional specific microphone device id
  // calibrationOffsets: optional { noteName: centsOffset } from piano calibration
  async start(onNote, onRawFreq, deviceId, calibrationOffsets) {
    this.calibrationOffsets = calibrationOffsets || null;
    this.onNote = onNote;
    this.onRawFreq = onRawFreq || null;

    const constraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
      video: false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 8192;
    this.analyser.smoothingTimeConstant = 0;
    // Boost mic input so quiet instruments (acoustic piano, soft playing) register
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 6;
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.buffer = new Float32Array(this.analyser.fftSize);
    this.isRunning = true;
    this._detect();
  }

  _detect() {
    if (!this.isRunning) return;
    this.analyser.getFloatTimeDomainData(this.buffer);
    const rms = getRMS(this.buffer);
    const freq = rms > 0.002 ? nsdPitch(this.buffer, this.audioContext.sampleRate) : -1;
    if (this.onRawFreq) this.onRawFreq({ freq, rms });

    const match = freq > 0 ? closestNote(freq, 100, this.calibrationOffsets) : null;

    if (match) {
      this._silenceFrames = 0;
      this._noteFrames++;
      if (this._noteFrames >= 2) {
        if (match.name !== this._lastFiredNote) {
          this._lastFiredNote = match.name;
          this.onNote(match.name);
        }
        this._noteFrames = 3;
      }
    } else {
      this._noteFrames = 0;
      this._silenceFrames++;
      if (this._silenceFrames >= 10) this._lastFiredNote = null;
    }

    this._animFrame = requestAnimationFrame(() => this._detect());
  }

  get sampleRate() {
    return this.audioContext?.sampleRate ?? null;
  }

  get contextState() {
    return this.audioContext?.state ?? 'none';
  }

  get deviceLabel() {
    if (!this.stream) return null;
    const track = this.stream.getAudioTracks()[0];
    return track ? track.label : null;
  }

  stop() {
    this.isRunning = false;
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.audioContext) this.audioContext.close();
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
    this.source = null;
  }
}

export function playTone(frequency, duration = 0.5) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}