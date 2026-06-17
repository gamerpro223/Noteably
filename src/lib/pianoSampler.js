// Grand piano sample player using real piano samples from Soundfont
const BASE_URL = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3";

const NOTE_TO_MIDI = {
  C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, B2: 47,
  "C#2": 37, "D#2": 39, "F#2": 42, "G#2": 44, "A#2": 46,
  C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
  "C#3": 49, "D#3": 51, "F#3": 54, "G#3": 56, "A#3": 58,
  C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
  "C#4": 61, "D#4": 63, "F#4": 66, "G#4": 68, "A#4": 70,
  C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83,
  "C#5": 73, "D#5": 75, "F#5": 78, "G#5": 80, "A#5": 82,
  C6: 84, D6: 86, E6: 88, F6: 89, G6: 91, A6: 93, B6: 95,
  "C#6": 85, "D#6": 87, "F#6": 90, "G#6": 92, "A#6": 94,
};

function midiToFileName(midi) {
  const noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteNames[midi % 12]}${octave}`;
}

let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

const bufferCache = {};
// Track all currently playing sources so we can stop them
const activeSources = new Set();

async function loadSample(noteName) {
  const midi = NOTE_TO_MIDI[noteName];
  if (!midi) return null;
  if (bufferCache[midi]) return bufferCache[midi];
  const fileName = midiToFileName(midi);
  try {
    const res = await fetch(`${BASE_URL}/${fileName}.mp3`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const decoded = await getCtx().decodeAudioData(await res.arrayBuffer());
    bufferCache[midi] = decoded;
    return decoded;
  } catch (e) {
    console.warn(`[pianoSampler] Failed to load ${noteName}:`, e.message);
    return null;
  }
}

// Stop all currently playing piano notes immediately
export function stopAllNotes() {
  for (const src of activeSources) {
    try { src.stop(); } catch {}
  }
  activeSources.clear();
}

export async function playPianoNote(noteName, duration = 3.0, velocity = 0.9) {
  const ctx = getCtx();
  if (ctx.state === "suspended") await ctx.resume();

  const buffer = await loadSample(noteName);
  if (!buffer) {
    // Fallback oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = NOTE_TO_MIDI[noteName]
      ? 440 * Math.pow(2, (NOTE_TO_MIDI[noteName] - 69) / 12)
      : 440;
    gain.gain.setValueAtTime(velocity * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
    activeSources.add(osc);
    osc.onended = () => activeSources.delete(osc);
    return;
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(ctx.destination);

  // Better envelope: full velocity attack, natural sustain, gentle release
  gain.gain.setValueAtTime(velocity, ctx.currentTime);
  gain.gain.setValueAtTime(velocity * 0.85, ctx.currentTime + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration + 0.05);

  activeSources.add(source);
  source.onended = () => activeSources.delete(source);
}

// Preload a set of notes in the background
export function preloadNotes(noteNames) {
  const uniqueNotes = [...new Set(noteNames || [])];
  return Promise.all(uniqueNotes.map(n => loadSample(n).catch(() => null)));
}
