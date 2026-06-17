// ══════════════════════════════════════════════════════════════════════════
// puzzleEngine.js — Structured 20-level piano difficulty progression
// Philosophy: early levels are fast to improve, later levels are brutal.
// Each level introduces or seriously escalates ONE new skill dimension.
// Difficulty is scored 1–100 (Chopin Mode: 101–120).
// ══════════════════════════════════════════════════════════════════════════

// ── Note frequencies ──────────────────────────────────────────────────────
export const NOTES_BY_NAME = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  "C#2": 69.30, "D#2": 77.78, "F#2": 92.50, "G#2": 103.83, "A#2": 116.54,
  "C#3": 138.59, "D#3": 155.56, "F#3": 185.0, "G#3": 207.65, "A#3": 233.08,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  "C#4": 277.18, "D#4": 311.13, "F#4": 369.99, "G#4": 415.3, "A#4": 466.16,
  "C#5": 554.37, "D#5": 622.25, "F#5": 739.99, "G#5": 830.61, "A#5": 932.33,
};

// ── Staff positions ───────────────────────────────────────────────────────
export const TREBLE_STAFF_POSITIONS = {
  C4: -2, D4: -1, E4: 0, F4: 1, G4: 2,
  A4: 3, B4: 4, C5: 5, D5: 6, E5: 7,
  F5: 8, G5: 9, A5: 10, B5: 11,
  "C#4": -2, "D#4": -1, "F#4": 1, "G#4": 2, "A#4": 3,
  "C#5": 5, "D#5": 6, "F#5": 8, "G#5": 9, "A#5": 10,
};
export const BASS_STAFF_POSITIONS = {
  G2: 0, A2: 1, B2: 2, C3: 3, D3: 4,
  E3: 5, F3: 6, G3: 7, A3: 8, B3: 9,
  C4: 10, D4: 11,
  "G#2": 0, "A#2": 1, "C#3": 3, "D#3": 4, "F#3": 6, "G#3": 7, "A#3": 8,
};
export const SHARPS_SET = new Set([
  "C#4","D#4","F#4","G#4","A#4","C#5","D#5","F#5","G#5","A#5",
  "C#2","D#2","F#2","G#2","A#2","C#3","D#3","F#3","G#3","A#3",
]);

// ── Chromatic scales ──────────────────────────────────────────────────────
const CHROMATIC_TREBLE = [
  "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
  "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5",
];
const CHROMATIC_BASS = [
  "G2","G#2","A2","A#2","B2","C3","C#3","D3","D#3","E3","F3","F#3",
  "G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4",
];

// ── Note pools ────────────────────────────────────────────────────────────
export const TREBLE_WHITE_NOTES_4 = ["C4","D4","E4","F4","G4","A4","B4"];
export const TREBLE_WHITE_NOTES_5 = ["C5","D5","E5","F5","G5","A5","B5"];
export const ALL_WHITE_NOTES = [...TREBLE_WHITE_NOTES_4, ...TREBLE_WHITE_NOTES_5];
export const BLACK_NOTES = ["C#4","D#4","F#4","G#4","A#4","C#5","D#5","F#5","G#5","A#5"];
export const BASS_WHITE_NOTES = ["G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4"];
export const BASS_BLACK_NOTES = ["G#2","A#2","C#3","D#3","F#3","G#3","A#3"];

// ── Scale intervals ───────────────────────────────────────────────────────
const MAJOR       = [0,2,4,5,7,9,11];
const MINOR       = [0,2,3,5,7,8,10];
const HARMONIC_M  = [0,2,3,5,7,8,11];
const MELODIC_M   = [0,2,3,5,7,9,11];
const PENTATONIC  = [0,2,4,7,9];
const PENT_MINOR  = [0,3,5,7,10];
const WHOLE_TONE  = [0,2,4,6,8,10];
const DIMINISHED  = [0,2,3,5,6,8,9,11];
const CHROMATIC12 = [0,1,2,3,4,5,6,7,8,9,10,11,12];

// ── XP gate to unlock level-up test ──────────────────────────────────────
export const XP_TO_TEST = {
  1:  900,  2:  1050, 3:  1225, 4:  1425,  5:  1650,
  6:  1900, 7: 2200, 8: 2550, 9: 2950, 10: 3400,
  11: 3900, 12: 4450, 13: 5050, 14: 5700, 15: 6400,
  16: 7150, 17: 7950, 18: 8800, 19: 9700, 20: Infinity,
};

// ── Difficulty tier picker ────────────────────────────────────────────────
export const DIFFICULTY_TIERS = {
  beginner:     { label: "Beginner",     emoji: "🌱", startLevel: 1,  description: "Single notes — just getting started" },
  intermediate: { label: "Intermediate", emoji: "🎵", startLevel: 5,  description: "Chords, sequences & wider range" },
  hard:         { label: "Advanced",     emoji: "🔥", startLevel: 10, description: "Inversions, 7ths & two-hand coordination" },
  chopin:       { label: "Chopin Mode",  emoji: "💀", startLevel: 20, description: "Absurdly hard. You were warned." },
};

// ── Level identity ────────────────────────────────────────────────────────
export const LEVEL_META = {
  1:  { name: "First Notes",          description: "Single white keys near middle C. Very slow." },
  2:  { name: "Finding Your Range",   description: "Single notes across the full C4–C5 octave." },
  3:  { name: "Step By Step",         description: "Short 2–3 note stepwise sequences." },
  4:  { name: "Bigger Leaps",         description: "Larger interval skips — 4ths, 5ths, 6ths." },
  5:  { name: "First Chords",         description: "Simple two-note and major/minor triads." },
  6:  { name: "Mixed Singles & Chords", description: "Alternating single notes and basic chords." },
  7:  { name: "Melodic Phrases",      description: "Short melodic phrases, rhythm variation introduced." },
  8:  { name: "Speed Reading",        description: "Faster note recognition, wider keyboard range." },
  9:  { name: "Triad Mastery",        description: "Root-position triads, all qualities, chord progressions." },
  10: { name: "Inversion Training",   description: "First and second inversions — same chord, new shape." },
  11: { name: "Rhythm & Surprise",    description: "Mixed rhythms, syncopation, unpredictable intervals." },
  12: { name: "Two Hands",            description: "Left-hand bass + right-hand melody coordination." },
  13: { name: "Seventh Chords",       description: "Faster chord changes, 7th chords, more accidentals." },
  14: { name: "Memory Passages",      description: "Longer sequences — sight-reading and memory required." },
  15: { name: "Two-Hand Control",     description: "Independent hands with uneven rhythmic demands." },
  16: { name: "Advanced Harmony",     description: "Complex progressions, large leaps, fast recognition." },
  17: { name: "Key Changes",          description: "Dense sequences, shifting keys, inversions, rhythm." },
  18: { name: "Virtuoso Passages",    description: "Rapid arpeggios, wide leaps, complex two-hand patterns." },
  19: { name: "Concert Pianist",      description: "Multi-octave patterns, chromatic, dense chords, little time." },
  20: { name: "Grandmaster Trial",    description: "Everything at once. Elite difficulty. Very little mercy." },
};

// ── Helpers ───────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function noteIndex(note, chromatic) { return chromatic.indexOf(note); }
function noteAt(idx, chromatic) {
  return chromatic[Math.max(0, Math.min(chromatic.length - 1, idx))];
}

function buildScale(root, intervals, chromatic) {
  const ri = noteIndex(root, chromatic);
  if (ri === -1) return [root];
  return intervals.map(o => noteAt(ri + o, chromatic)).filter(Boolean);
}

function dispNote(note) {
  return note
    .replace("C#","C♯").replace("D#","D♯").replace("F#","F♯")
    .replace("G#","G♯").replace("A#","A♯")
    .replace(/[0-9]/g,"");
}

function countAccidentals(notes) {
  return notes.filter(n => n.includes("#")).length;
}

function leapSize(notes) {
  let max = 0;
  for (let i = 1; i < notes.length; i++) {
    const a = CHROMATIC_TREBLE.indexOf(notes[i-1]) !== -1
      ? CHROMATIC_TREBLE.indexOf(notes[i-1]) : CHROMATIC_BASS.indexOf(notes[i-1]);
    const b = CHROMATIC_TREBLE.indexOf(notes[i]) !== -1
      ? CHROMATIC_TREBLE.indexOf(notes[i]) : CHROMATIC_BASS.indexOf(notes[i]);
    max = Math.max(max, Math.abs(b - a));
  }
  return max;
}

// ── Puzzle factory ────────────────────────────────────────────────────────
function mkPuzzle(type, notes, description, hint, hand = "right", diffScore = 50) {
  return {
    id: Math.random().toString(36).slice(2),
    type, notes, description, hint, hand,
    diffScore,
    trebleNotes: hand === "both" ? [] : (hand === "left" ? [] : notes),
    bassNotes: hand === "left" ? notes : [],
  };
}

// ── Difficulty scoring ────────────────────────────────────────────────────
// Returns 1–100 for regular levels, 101–120 for Chopin mode
function scoreDifficulty({
  noteCount = 1,
  chordSize = 1,
  leapDistance = 0,
  accidentalCount = 0,
  hasInversion = false,
  hasLeftHand = false,
  rhythmComplexity = 0,    // 0–5
  memoryLength = 0,        // extra notes beyond 2
  levelBand = 1,
  chopinBonus = 0,
}) {
  let score = 0;
  score += noteCount * 2;
  score += chordSize * 3;
  score += leapDistance * 0.5;
  score += accidentalCount * 3;
  score += hasInversion ? 6 : 0;
  score += hasLeftHand ? 8 : 0;
  score += rhythmComplexity * 4;
  score += memoryLength * 2;
  score += (levelBand - 1) * 4;
  score += chopinBonus;
  return Math.round(Math.min(120, Math.max(1, score)));
}

// ── Level 1: First Notes ──────────────────────────────────────────────────
// Single white key notes, C4–G4 only, very slow
function gen1(hand) {
  const pool = hand === "left" ? ["C3","D3","E3","F3","G3"] : ["C4","D4","E4","F4","G4"];
  const note = pick(pool);
  const diff = scoreDifficulty({ noteCount:1, levelBand:1 });
  return mkPuzzle("single", [note], `Play ${dispNote(note)}`, `Find ${dispNote(note)} near Middle C`, hand, diff);
}

// ── Level 2: Finding Your Range ───────────────────────────────────────────
// Single notes C4–C5, all white keys
function gen2(hand) {
  const pool = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","B3","C4"]
    : ["C4","D4","E4","F4","G4","A4","B4","C5"];
  const note = pick(pool);
  const diff = scoreDifficulty({ noteCount:1, levelBand:2 });
  return mkPuzzle("single", [note], `Play ${dispNote(note)}`, `${dispNote(note)} — white key`, hand, diff);
}

// ── Level 3: Step By Step ─────────────────────────────────────────────────
// 2–3 note stepwise sequences (intervals of 1–2 semitones, no skips)
function gen3(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const whiteTreble = ["C4","D4","E4","F4","G4","A4","B4"];
  const whiteBass = ["C3","D3","E3","F3","G3","A3"];
  const starts = hand === "left" ? whiteBass : whiteTreble;
  const root = pick(starts);
  const ri = noteIndex(root, chromatic);
  // stepwise motion only: steps of 1 or 2 semitones
  const stepOptions = [1, 2];
  const len = pick([2, 3]);
  const notes = [root];
  let cur = ri;
  for (let i = 1; i < len; i++) {
    const step = pick(stepOptions) * (Math.random() > 0.5 ? 1 : -1);
    const next = Math.max(0, Math.min(chromatic.length - 1, cur + step));
    notes.push(chromatic[next]);
    cur = next;
  }
  const diff = scoreDifficulty({ noteCount: notes.length, levelBand:3 });
  return mkPuzzle("sequence", notes, `${notes.length}-note stepwise`, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 4: Bigger Leaps ─────────────────────────────────────────────────
// 2-note sequences with 4th, 5th, 6th, 7th interval jumps
function gen4(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const roots = hand === "left" ? ["C3","D3","E3","G3"] : ["C4","D4","E4","F4","G4","A4"];
  const root = pick(roots);
  const ri = noteIndex(root, chromatic);
  const interval = pick([5, 7, 8, 9, 10]); // 4th, 5th, min6, maj6, min7
  const goUp = Math.random() > 0.35;
  const top = noteAt(ri + (goUp ? interval : -interval), chromatic);
  const intervalNames = { 5:"Perfect 4th", 7:"Perfect 5th", 8:"Minor 6th", 9:"Major 6th", 10:"Minor 7th" };
  const notes = goUp ? [root, top] : [top, root];
  const diff = scoreDifficulty({ noteCount:2, leapDistance: interval, levelBand:4 });
  return mkPuzzle("sequence", notes, `${intervalNames[interval]} leap`, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 5: First Chords ─────────────────────────────────────────────────
// Two-note harmonic intervals and basic major/minor triads, white keys only
function gen5(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const roots = hand === "left" ? ["C3","D3","E3","G3","A3"] : ["C4","D4","E4","F4","G4","A4"];
  const root = pick(roots);
  const type = pick(["interval3","interval5","triad_maj","triad_min"]);
  let notes, desc, hint;
  if (type === "interval3") {
    notes = buildScale(root, [0,4], chromatic);
    desc = `${dispNote(root)} + ${dispNote(notes[1])} (Major 3rd)`;
    hint = "Play both notes at once";
  } else if (type === "interval5") {
    notes = buildScale(root, [0,7], chromatic);
    desc = `${dispNote(root)} + ${dispNote(notes[1])} (Perfect 5th)`;
    hint = "Power chord — root and fifth";
  } else {
    const maj = type === "triad_maj";
    notes = buildScale(root, maj ? [0,4,7] : [0,3,7], chromatic);
    desc = `${dispNote(root)} ${maj ? "Major" : "minor"} triad`;
    hint = notes.map(dispNote).join(" – ");
  }
  const diff = scoreDifficulty({ chordSize: notes.length, levelBand:5 });
  return mkPuzzle("chord", notes, desc, hint, hand, diff);
}

// ── Level 6: Mixed Singles & Chords ──────────────────────────────────────
// Alternates single note then chord, introduces one accidental
function gen6(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  // roots with one possible accidental
  const roots = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","D#3","A#3"]
    : ["C4","D4","E4","F4","G4","A4","B4","C#4","F#4"];
  const root = pick(roots);
  const type = pick(["single_then_chord","chord_then_single","pure_chord"]);
  const isMaj = Math.random() > 0.4;
  const triad = buildScale(root, isMaj ? [0,4,7] : [0,3,7], chromatic);
  const singleNote = pick(hand === "left" ? BASS_WHITE_NOTES.slice(0,6) : TREBLE_WHITE_NOTES_4);

  let notes, desc, hint, pType;
  if (type === "single_then_chord") {
    notes = [singleNote, ...triad];
    desc = `Note then ${dispNote(root)} ${isMaj?"Major":"minor"}`;
    hint = `${dispNote(singleNote)} → chord`;
    pType = "sequence";
  } else if (type === "chord_then_single") {
    notes = triad;
    desc = `${dispNote(root)} ${isMaj?"Major":"minor"} chord`;
    hint = notes.map(dispNote).join(" – ");
    pType = "chord";
  } else {
    notes = triad;
    desc = `${dispNote(root)} ${isMaj?"Major":"minor"}`;
    hint = notes.map(dispNote).join(" – ");
    pType = "chord";
  }
  const diff = scoreDifficulty({
    chordSize: triad.length,
    accidentalCount: countAccidentals(notes),
    levelBand:6,
  });
  return mkPuzzle(pType, notes, desc, hint, hand, diff);
}

// ── Level 7: Melodic Phrases ──────────────────────────────────────────────
// 3–5 note phrases from major/minor scale fragments, rhythm-like variety (ascending, descending, arch)
function gen7(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const roots = hand === "left" ? ["C3","D3","E3","G3","A3"] : ["C4","D4","E4","F4","G4","A4"];
  const root = pick(roots);
  const isMinor = Math.random() > 0.5;
  const scale = buildScale(root, isMinor ? MINOR : MAJOR, chromatic);
  const pattern = pick(["ascending","descending","arch","valley"]);
  let notes;
  const len = 4 + Math.floor(Math.random() * 2); // 4–5 notes
  switch (pattern) {
    case "ascending":  notes = scale.slice(0, len); break;
    case "descending": notes = scale.slice(0, len).reverse(); break;
    case "arch":       notes = [...scale.slice(0, Math.ceil(len/2)), ...scale.slice(0, Math.floor(len/2)).reverse()]; break;
    case "valley":     notes = [...scale.slice(0, Math.ceil(len/2)).reverse(), ...scale.slice(0, Math.floor(len/2))]; break;
    default:           notes = scale.slice(0, len);
  }
  const diff = scoreDifficulty({
    noteCount: notes.length,
    accidentalCount: countAccidentals(notes),
    rhythmComplexity: 1,
    levelBand: 7,
  });
  return mkPuzzle("sequence", notes, `${dispNote(root)} ${isMinor?"minor":"major"} phrase (${pattern})`, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 8: Speed Reading ────────────────────────────────────────────────
// Single notes across wider range (C4–B5), includes black keys
function gen8(hand) {
  const widePool = hand === "left"
    ? [...BASS_WHITE_NOTES, ...BASS_BLACK_NOTES]
    : [...TREBLE_WHITE_NOTES_4, ...TREBLE_WHITE_NOTES_5, ...BLACK_NOTES];
  const note = pick(widePool);
  const isBlack = note.includes("#");
  const diff = scoreDifficulty({
    noteCount: 1,
    accidentalCount: isBlack ? 1 : 0,
    rhythmComplexity: 1,
    levelBand: 8,
  });
  return mkPuzzle("single", [note], `Quick read: ${dispNote(note)}`, isBlack ? "Black key!" : "White key", hand, diff);
}

// ── Level 9: Triad Mastery ────────────────────────────────────────────────
// All triad qualities, all natural roots, sometimes two in sequence (progression feel)
const TRIAD_TYPES = [
  { intervals:[0,4,7], name:"Major",      symbol:"" },
  { intervals:[0,3,7], name:"minor",      symbol:"m" },
  { intervals:[0,4,8], name:"augmented",  symbol:"+" },
  { intervals:[0,3,6], name:"diminished", symbol:"°" },
];
function gen9(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const allRoots = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","B3"]
    : ["C4","D4","E4","F4","G4","A4","B4","C5"];
  const root = pick(allRoots);
  const triad = pick(TRIAD_TYPES);
  const notes = buildScale(root, triad.intervals, chromatic);
  const diff = scoreDifficulty({
    chordSize: notes.length,
    accidentalCount: countAccidentals(notes),
    levelBand: 9,
  });
  return mkPuzzle("chord", notes, `${dispNote(root)} ${triad.name} triad`, notes.map(dispNote).join(" – "), hand, diff);
}

// ── Level 10: Inversion Training ─────────────────────────────────────────
// Root position, first inversion, second inversion of major/minor triads
function gen10(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const roots = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3"]
    : ["C4","D4","E4","F4","G4","A4","B4"];
  const root = pick(roots);
  const isMaj = Math.random() > 0.4;
  const base = buildScale(root, isMaj ? [0,4,7] : [0,3,7], chromatic);
  const inv = pick([0,1,2]); // 0=root, 1=1st inv, 2=2nd inv
  const invNames = ["Root position","1st inversion","2nd inversion"];
  const notes = inv === 0 ? base
    : inv === 1 ? [base[1], base[2], ...buildScale(base[0], [12], chromatic)]
    : [base[2], ...buildScale(base[0], [12], chromatic), ...buildScale(base[1], [12], chromatic)];
  const clean = notes.filter(n => chromatic.includes(n)).slice(0, 3);
  const diff = scoreDifficulty({
    chordSize: clean.length,
    hasInversion: inv > 0,
    accidentalCount: countAccidentals(clean),
    levelBand: 10,
  });
  return mkPuzzle("chord", clean, `${dispNote(root)} ${isMaj?"Major":"minor"} — ${invNames[inv]}`, clean.map(dispNote).join(" – "), hand, diff);
}

// ── Level 11: Rhythm & Surprise ───────────────────────────────────────────
// Mixed sequences — unpredictable intervals, scale fragments from non-obvious roots
function gen11(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const allNotes = hand === "left" ? CHROMATIC_BASS.slice(0, 18) : CHROMATIC_TREBLE;
  const root = pick(allNotes.slice(0, allNotes.length - 8));
  const ri = noteIndex(root, chromatic);
  const pattern = pick(["zigzag","skip_and_step","random_phrase"]);
  let notes;
  if (pattern === "zigzag") {
    // Up 2, down 1, up 3, down 1...
    const offsets = [0, 2, -1, 4, -1, 3];
    notes = offsets.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
  } else if (pattern === "skip_and_step") {
    const offsets = [0, 5, 6, 7, 3, 4];
    notes = offsets.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
  } else {
    // Randomly sample 4–5 notes around the root
    const span = 8;
    const indices = pickN(Array.from({length:span},(_,i)=>ri+i), 4+Math.floor(Math.random()*2));
    indices.sort((a,b) => a-b);
    notes = indices.map(i => noteAt(i, chromatic)).filter(n => chromatic.includes(n));
  }
  notes = notes.slice(0, 6);
  const diff = scoreDifficulty({
    noteCount: notes.length,
    accidentalCount: countAccidentals(notes),
    leapDistance: leapSize(notes),
    rhythmComplexity: 2,
    levelBand: 11,
  });
  return mkPuzzle("sequence", notes, `Surprise phrase (${pattern.replace(/_/g," ")})`, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 12: Two Hands ───────────────────────────────────────────────────
// Right hand plays a melody fragment, left hand plays bass note or fifth
function gen12(_hand) {
  const trebleRoots = ["C4","D4","E4","F4","G4","A4","B4"];
  const bassRoots = ["C3","D3","E3","F3","G3","A3","B3"];
  const tRoot = pick(trebleRoots);
  const bRoot = pick(bassRoots);
  const isMinor = Math.random() > 0.5;
  const trebleScale = buildScale(tRoot, isMinor ? MINOR : MAJOR, CHROMATIC_TREBLE).slice(0, 5);
  const bassNotes = Math.random() > 0.4
    ? buildScale(bRoot, [0,7], CHROMATIC_BASS)  // root + 5th drone
    : buildScale(bRoot, isMinor ? [0,3,7] : [0,4,7], CHROMATIC_BASS); // triad

  const diff = scoreDifficulty({
    noteCount: trebleScale.length,
    chordSize: bassNotes.length,
    hasLeftHand: true,
    accidentalCount: countAccidentals([...trebleScale, ...bassNotes]),
    levelBand: 12,
  });
  return {
    id: Math.random().toString(36).slice(2),
    type: "sequence",
    notes: [...trebleScale, ...bassNotes],
    trebleNotes: trebleScale,
    bassNotes,
    description: `${dispNote(tRoot)} melody + ${dispNote(bRoot)} bass`,
    hint: `Right: ${trebleScale.map(dispNote).join(" ")} | Left: ${bassNotes.map(dispNote).join(" ")}`,
    hand: "both",
    diffScore: diff,
  };
}

// ── Level 13: Seventh Chords ─────────────────────────────────────────────
// maj7, min7, dom7, half-dim, dim7 — all roots including accidentals
const SEVENTH_TYPES = [
  { intervals:[0,4,7,11],  name:"maj7",     label:"Major 7th" },
  { intervals:[0,3,7,10],  name:"min7",     label:"minor 7th" },
  { intervals:[0,4,7,10],  name:"dom7",     label:"Dominant 7th" },
  { intervals:[0,3,6,10],  name:"ø7",       label:"Half-dim 7th" },
  { intervals:[0,3,6,9],   name:"°7",       label:"Diminished 7th" },
];
function gen13(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const allRoots = hand === "left"
    ? CHROMATIC_BASS.slice(2, 14)
    : CHROMATIC_TREBLE.slice(0, 12);
  const root = pick(allRoots);
  const chord = pick(SEVENTH_TYPES);
  const ri = noteIndex(root, chromatic);
  const notes = chord.intervals.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
  const diff = scoreDifficulty({
    chordSize: notes.length,
    accidentalCount: countAccidentals(notes),
    levelBand: 13,
  });
  return mkPuzzle("chord", notes, `${dispNote(root)} ${chord.label}`, notes.map(dispNote).join(" – "), hand, diff);
}

// ── Level 14: Memory Passages ─────────────────────────────────────────────
// 6–8 note sequences from harmonic/melodic minor, pentatonic, whole tone
function gen14(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const allRoots = hand === "left" ? CHROMATIC_BASS.slice(2, 12) : CHROMATIC_TREBLE.slice(0, 14);
  const root = pick(allRoots);
  const scaleType = pick(["harmonic_minor","melodic_minor","whole_tone","pentatonic_minor"]);
  const iMap = {
    harmonic_minor: HARMONIC_M,
    melodic_minor: MELODIC_M,
    whole_tone: WHOLE_TONE,
    pentatonic_minor: PENT_MINOR,
  };
  const scale = buildScale(root, iMap[scaleType], chromatic);
  const len = 6 + Math.floor(Math.random() * 3); // 6–8
  let notes = scale.slice(0, Math.min(len, scale.length));
  if (Math.random() > 0.4) notes = [...notes].reverse();
  const diff = scoreDifficulty({
    noteCount: notes.length,
    accidentalCount: countAccidentals(notes),
    memoryLength: notes.length - 2,
    levelBand: 14,
  });
  return mkPuzzle("sequence", notes, `${dispNote(root)} ${scaleType.replace(/_/g," ")} (${notes.length} notes)`, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 15: Two-Hand Control ────────────────────────────────────────────
// Independent hands: treble plays 7th chord arpeggios, bass plays contrary motion
function gen15(_hand) {
  const tRoots = ["C4","D4","E4","F#4","G4","A4","B4","A#4"];
  const bRoots = ["C3","D3","E3","F3","G3","A3","A#3","B3"];
  const tRoot = pick(tRoots);
  const bRoot = pick(bRoots);
  const chordType = pick(SEVENTH_TYPES);
  const ri = noteIndex(tRoot, CHROMATIC_TREBLE);
  const trebleNotes = chordType.intervals.map(o => noteAt(ri + o, CHROMATIC_TREBLE)).filter(n => CHROMATIC_TREBLE.includes(n));
  // Bass moves contrary: descending scale fragment
  const bri = noteIndex(bRoot, CHROMATIC_BASS);
  const bassNotes = HARMONIC_M.slice(0, 4).map(o => noteAt(bri - o, CHROMATIC_BASS)).filter(n => CHROMATIC_BASS.includes(n));

  const diff = scoreDifficulty({
    chordSize: trebleNotes.length,
    noteCount: trebleNotes.length,
    hasLeftHand: true,
    hasInversion: true,
    accidentalCount: countAccidentals([...trebleNotes, ...bassNotes]),
    rhythmComplexity: 2,
    levelBand: 15,
  });
  return {
    id: Math.random().toString(36).slice(2),
    type: "chord",
    notes: [...trebleNotes, ...bassNotes],
    trebleNotes,
    bassNotes,
    description: `${dispNote(tRoot)} ${chordType.label} + contrary bass`,
    hint: `Right: ${trebleNotes.map(dispNote).join(" ")} | Left: ${bassNotes.map(dispNote).join(" ")}`,
    hand: "both",
    diffScore: diff,
  };
}

// ── Level 16: Advanced Harmony ────────────────────────────────────────────
// Complex chord voicings with wide leaps + altered extensions
const EXT_CHORDS = [
  { intervals:[0,4,7,11,14],    name:"maj9" },
  { intervals:[0,3,7,10,14],    name:"min9" },
  { intervals:[0,4,7,10,13],    name:"7♭9" },
  { intervals:[0,4,7,10,15],    name:"7♯9" },
  { intervals:[0,4,6,10],       name:"7♭5" },
  { intervals:[0,3,6,10],       name:"ø9" },
];
function gen16(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const allRoots = hand === "left" ? CHROMATIC_BASS.slice(2, 16) : CHROMATIC_TREBLE.slice(0, 14);
  const root = pick(allRoots);
  const chord = pick(EXT_CHORDS);
  const ri = noteIndex(root, chromatic);
  const notes = chord.intervals.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
  const diff = scoreDifficulty({
    chordSize: notes.length,
    accidentalCount: countAccidentals(notes),
    leapDistance: 14,
    levelBand: 16,
  });
  return mkPuzzle("chord", notes, `${dispNote(root)} ${chord.name}`, notes.map(dispNote).join(" – "), hand, diff);
}

// ── Level 17: Key Changes ─────────────────────────────────────────────────
// 7–9 note passages that shift key mid-sequence (two scale fragments back to back)
function gen17(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const allRoots = hand === "left" ? CHROMATIC_BASS.slice(1, 14) : CHROMATIC_TREBLE.slice(0, 16);
  const root1 = pick(allRoots);
  const root2 = pick(allRoots.filter(n => n !== root1));
  const scale1Type = pick([MAJOR, HARMONIC_M, MELODIC_M, DIMINISHED]);
  const scale2Type = pick([MINOR, WHOLE_TONE, PENT_MINOR, HARMONIC_M]);
  const seg1 = buildScale(root1, scale1Type, chromatic).slice(0, 4);
  const seg2 = buildScale(root2, scale2Type, chromatic).slice(0, 4);
  const notes = [...seg1, ...seg2];
  const diff = scoreDifficulty({
    noteCount: notes.length,
    accidentalCount: countAccidentals(notes),
    leapDistance: leapSize(notes),
    memoryLength: notes.length - 2,
    rhythmComplexity: 3,
    levelBand: 17,
  });
  return mkPuzzle("sequence", notes, `Key change: ${dispNote(root1)} → ${dispNote(root2)}`, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 18: Virtuoso Passages ───────────────────────────────────────────
// Long chromatic or arpeggio runs, wide leaps, complex extended chord then run
function gen18(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const type = pick(["chromatic_run","arpeggio_run","leaping_phrase"]);
  let notes, desc;

  if (type === "chromatic_run") {
    const start = Math.floor(Math.random() * (chromatic.length - 10));
    const ascending = Math.random() > 0.4;
    notes = chromatic.slice(start, start + 9);
    if (!ascending) notes = [...notes].reverse();
    desc = `Chromatic 9-note ${ascending?"↑":"↓"}`;
  } else if (type === "arpeggio_run") {
    const root = pick(chromatic.slice(0, 14));
    const ri = noteIndex(root, chromatic);
    const chord = pick(EXT_CHORDS);
    notes = chord.intervals.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
    if (Math.random() > 0.4) notes = [...notes].reverse();
    desc = `${dispNote(root)} ${chord.name} arpeggio`;
  } else {
    // Leaping phrase: big jumps between scale degrees
    const root = pick(chromatic.slice(0, 10));
    const ri = noteIndex(root, chromatic);
    const offsets = [0, 7, 2, 9, 4, 11, 5, 12].slice(0, 7);
    notes = offsets.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
    desc = `Wide-leap phrase from ${dispNote(root)}`;
  }
  const diff = scoreDifficulty({
    noteCount: notes.length,
    accidentalCount: countAccidentals(notes),
    leapDistance: leapSize(notes),
    memoryLength: notes.length - 2,
    rhythmComplexity: 3,
    levelBand: 18,
  });
  return mkPuzzle("sequence", notes, desc, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 19: Concert Pianist ─────────────────────────────────────────────
// Long multi-type sequences with dense accidentals, both directions, any root
function gen19(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const root = pick(chromatic.slice(0, 16));
  const ri = noteIndex(root, chromatic);
  const type = pick(["full_diminished","full_whole_tone","chromatic_then_chord","alt_scale_fragment"]);
  let notes, desc;

  if (type === "full_diminished") {
    notes = buildScale(root, DIMINISHED, chromatic);
    if (Math.random() > 0.4) notes = [...notes].reverse();
    desc = `${dispNote(root)} diminished scale (full)`;
  } else if (type === "full_whole_tone") {
    notes = buildScale(root, WHOLE_TONE, chromatic);
    if (Math.random() > 0.4) notes = [...notes].reverse();
    desc = `${dispNote(root)} whole tone scale`;
  } else if (type === "chromatic_then_chord") {
    const run = chromatic.slice(ri, ri + 5);
    const chord = buildScale(root, [0,4,8,11,14], chromatic).slice(0, 5);
    notes = [...run, ...chord.filter(n => !run.includes(n))];
    desc = `Chromatic run into ${dispNote(root)} chord`;
  } else {
    // Alternate scale fragments
    const s1 = buildScale(root, MELODIC_M, chromatic).slice(0, 5);
    const ri2 = Math.max(0, ri - 3);
    const s2 = buildScale(chromatic[ri2], HARMONIC_M, chromatic).slice(2, 6);
    notes = [...s1, ...s2];
    desc = `Alternate scale: ${dispNote(root)} melodic + harmonic`;
  }
  notes = notes.slice(0, 10);
  const diff = scoreDifficulty({
    noteCount: notes.length,
    accidentalCount: countAccidentals(notes),
    leapDistance: leapSize(notes),
    memoryLength: notes.length - 2,
    rhythmComplexity: 4,
    levelBand: 19,
  });
  return mkPuzzle("sequence", notes, desc, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Level 20: Grandmaster Trial ───────────────────────────────────────────
// Everything: sight-read, big leaps, two-hand independence, complex rhythm,
// fast tempo, accidentals, extended chords, unpredictable rhythm
function gen20(hand) {
  if (hand === "both") {
    // Two-hand grand challenge
    const tRoot = pick(CHROMATIC_TREBLE.slice(0, 14));
    const bRoot = pick(CHROMATIC_BASS.slice(2, 14));
    const chordType = pick(EXT_CHORDS);
    const scaleType = pick([DIMINISHED, WHOLE_TONE, HARMONIC_M, MELODIC_M]);

    const tri = noteIndex(tRoot, CHROMATIC_TREBLE);
    const trebleNotes = chordType.intervals.map(o => noteAt(tri + o, CHROMATIC_TREBLE)).filter(n => CHROMATIC_TREBLE.includes(n));
    const bri = noteIndex(bRoot, CHROMATIC_BASS);
    const bassNotes = scaleType.slice(0, 6).map(o => noteAt(bri + o, CHROMATIC_BASS)).filter(n => CHROMATIC_BASS.includes(n));

    const diff = scoreDifficulty({
      noteCount: trebleNotes.length + bassNotes.length,
      chordSize: trebleNotes.length,
      hasLeftHand: true, hasInversion: true,
      accidentalCount: countAccidentals([...trebleNotes, ...bassNotes]),
      leapDistance: 14, rhythmComplexity: 4, memoryLength: 8,
      levelBand: 20,
    });
    return {
      id: Math.random().toString(36).slice(2),
      type: "chord",
      notes: [...trebleNotes, ...bassNotes],
      trebleNotes, bassNotes,
      description: `${dispNote(tRoot)} ${chordType.name} + bass scale`,
      hint: `Right: ${trebleNotes.map(dispNote).join(" ")} | Left: ${bassNotes.map(dispNote).join(" ")}`,
      hand: "both",
      diffScore: diff,
    };
  }

  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const type = pick(["grand_arpeggio","extreme_leap_phrase","chromatic_descent_then_chord","dense_modal"]);
  const root = pick(chromatic.slice(0, 14));
  const ri = noteIndex(root, chromatic);
  let notes, desc;

  if (type === "grand_arpeggio") {
    const chord = pick(EXT_CHORDS);
    notes = chord.intervals.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
    const reversed = Math.random() > 0.5;
    if (reversed) notes = [...notes].reverse();
    desc = `${dispNote(root)} ${chord.name} grand arpeggio`;
  } else if (type === "extreme_leap_phrase") {
    const offsets = [0, 11, 1, 12, 3, 14, 2, 13, 4];
    notes = offsets.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n)).slice(0, 8);
    desc = `Extreme leap phrase from ${dispNote(root)}`;
  } else if (type === "chromatic_descent_then_chord") {
    const descend = chromatic.slice(Math.max(0, ri - 4), ri + 1).reverse();
    const chord = buildScale(root, [0,3,7,10,14], chromatic).slice(0, 4);
    notes = [...descend, ...chord];
    desc = `Descend then ${dispNote(root)} min9`;
  } else {
    // Dense modal: two different scale types interleaved
    const s1 = buildScale(root, DIMINISHED, chromatic).slice(0, 4);
    const s2 = buildScale(root, CHROMATIC12.slice(0,6), chromatic).slice(0, 4);
    notes = s1.map((n,i) => [n, s2[i]]).flat().filter(Boolean);
    desc = `${dispNote(root)} modal blend`;
  }
  notes = notes.slice(0, 10);
  const diff = scoreDifficulty({
    noteCount: notes.length,
    accidentalCount: countAccidentals(notes),
    leapDistance: leapSize(notes),
    memoryLength: notes.length - 2,
    rhythmComplexity: 4,
    levelBand: 20,
  });
  return mkPuzzle("sequence", notes, desc, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Chopin Mode ───────────────────────────────────────────────────────────
// Romantic virtuoso style: huge arpeggios, runs, rubato-like surprises,
// dense extended chords, awkward hand shifts, chromatic ornamentation.
// Difficulty 101–120.
const CHOPIN_CHORDS = [
  { intervals:[0,4,7,11,14,17],  name:"maj11" },
  { intervals:[0,3,7,10,14,17],  name:"min11" },
  { intervals:[0,4,7,10,13,17],  name:"7♭9♯11" },
  { intervals:[0,4,7,10,14,21],  name:"dom13" },
  { intervals:[0,3,6,10,14],     name:"ø9" },
  { intervals:[0,3,6,9,12],      name:"dim9" },
  { intervals:[0,4,8,11,14],     name:"aug-maj9" },
  { intervals:[0,4,7,11,14,18],  name:"maj♯11" },
];
const CHOPIN_RUNS = [
  CHROMATIC12.slice(0, 13),
  DIMINISHED,
  WHOLE_TONE,
  HARMONIC_M,
  MELODIC_M,
  [0,2,3,5,7,8,10,11,12],  // Phrygian dominant
  [0,1,3,5,6,8,10,11,12],  // Double harmonic
];

export function generateChopinPuzzle(hand) {
  const chromatic = hand === "left" ? CHROMATIC_BASS : CHROMATIC_TREBLE;
  const allRoots = hand === "left"
    ? CHROMATIC_BASS.slice(2, 16)
    : CHROMATIC_TREBLE.slice(0, 14);
  const root = pick(allRoots);
  const ri = noteIndex(root, chromatic);
  const mode = pick(["chord","run","approach_run","two_hand_fury"]);

  if (mode === "two_hand_fury") {
    const tRoot = pick(CHROMATIC_TREBLE.slice(0, 12));
    const bRoot = pick(CHROMATIC_BASS.slice(4, 16));
    const tri = noteIndex(tRoot, CHROMATIC_TREBLE);
    const bri = noteIndex(bRoot, CHROMATIC_BASS);
    const chord = pick(CHOPIN_CHORDS);
    const run = pick(CHOPIN_RUNS);
    const trebleNotes = chord.intervals.map(o => noteAt(tri + o, CHROMATIC_TREBLE)).filter(n => CHROMATIC_TREBLE.includes(n));
    const bassNotes = run.slice(0, 7).map(o => noteAt(bri + o, CHROMATIC_BASS)).filter(n => CHROMATIC_BASS.includes(n));
    const diff = scoreDifficulty({ noteCount: trebleNotes.length + bassNotes.length, chordSize: trebleNotes.length, hasLeftHand:true, hasInversion:true, accidentalCount: countAccidentals([...trebleNotes,...bassNotes]), leapDistance:16, rhythmComplexity:5, memoryLength:10, chopinBonus:25 });
    return {
      id: Math.random().toString(36).slice(2),
      type: "chord",
      notes: [...trebleNotes, ...bassNotes],
      trebleNotes, bassNotes,
      description: `${dispNote(tRoot)} ${chord.name} + ${dispNote(bRoot)} bass fury`,
      hint: `Right: ${trebleNotes.map(dispNote).join(" ")} | Left: ${bassNotes.map(dispNote).join(" ")}`,
      hand: "both",
      diffScore: diff,
    };
  }

  if (mode === "chord") {
    const chord = pick(CHOPIN_CHORDS);
    const notes = chord.intervals.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
    const diff = scoreDifficulty({ chordSize: notes.length, accidentalCount: countAccidentals(notes), leapDistance: 17, levelBand: 20, chopinBonus: 20 });
    return mkPuzzle("chord", notes, `${dispNote(root)} ${chord.name}`, notes.map(dispNote).join(" – "), hand, diff);
  }

  if (mode === "run") {
    const runIntervals = pick(CHOPIN_RUNS);
    const reversed = Math.random() > 0.5;
    let notes = runIntervals.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
    if (reversed) notes = [...notes].reverse();
    const diff = scoreDifficulty({ noteCount: notes.length, accidentalCount: countAccidentals(notes), leapDistance: leapSize(notes), memoryLength: notes.length, rhythmComplexity: 4, levelBand: 20, chopinBonus: 22 });
    return mkPuzzle("sequence", notes, `${dispNote(root)} Romantic run ${reversed?"↓":"↑"} (${notes.length} notes)`, notes.map(dispNote).join(" → "), hand, diff);
  }

  // Approach run: chromatic approach then land on big chord
  const approachLen = 4 + Math.floor(Math.random() * 3);
  const startIdx = Math.max(0, ri - approachLen);
  const approach = chromatic.slice(startIdx, ri + 1);
  const chord = pick(CHOPIN_CHORDS);
  const chordNotes = chord.intervals.map(o => noteAt(ri + o, chromatic)).filter(n => chromatic.includes(n));
  const notes = [...approach, ...chordNotes];
  const diff = scoreDifficulty({ noteCount: notes.length, chordSize: chordNotes.length, accidentalCount: countAccidentals(notes), leapDistance: leapSize(notes), memoryLength: notes.length - 2, rhythmComplexity: 5, levelBand: 20, chopinBonus: 28 });
  return mkPuzzle("sequence", notes, `Chromatic approach → ${dispNote(root)} ${chord.name}`, notes.map(dispNote).join(" → "), hand, diff);
}

// ── Adaptive difficulty ───────────────────────────────────────────────────
// recentTypes: array of last 2–3 puzzle types, used to avoid repetition
const recentTypes = [];
function trackRecent(type) {
  recentTypes.push(type);
  if (recentTypes.length > 3) recentTypes.shift();
}
function isDuplicate(type) {
  return recentTypes.filter(t => t === type).length >= 2;
}

// ── Main entry point ──────────────────────────────────────────────────────
const LEVEL_GENERATORS = [null, gen1, gen2, gen3, gen4, gen5, gen6, gen7, gen8, gen9, gen10,
  gen11, gen12, gen13, gen14, gen15, gen16, gen17, gen18, gen19, gen20];

export function generatePuzzle(level, hand = "right") {
  const l = Math.max(1, Math.min(20, level));

  // Chopin mode uses dedicated generator
  if (l === 20 && hand === "both") return gen20("both");

  const generator = LEVEL_GENERATORS[l];
  if (!generator) return gen1(hand);

  // Levels 12 and 15 are always two-hand
  if (l === 12 || l === 15) return generator("both");

  let puzzle = generator(hand);

  // Anti-repetition: if we've seen this type twice in a row, regenerate once
  const typeKey = `${puzzle.type}-${l}`;
  if (isDuplicate(typeKey)) {
    // Try up to 3 times to get variety
    for (let attempt = 0; attempt < 3; attempt++) {
      const alt = generator(hand);
      if (alt.type !== puzzle.type || Math.random() > 0.5) { puzzle = alt; break; }
    }
  }
  trackRecent(`${puzzle.type}-${l}`);
  return puzzle;
}

// ── Utility exports ───────────────────────────────────────────────────────
export function getNoteDisplayName(note) { return dispNote(note); }
export function getFrequency(note) { return NOTES_BY_NAME[note] || 440; }

// Legacy compat
export { TREBLE_STAFF_POSITIONS as NOTE_STAFF_POSITIONS, SHARPS_SET as SHARPS };
