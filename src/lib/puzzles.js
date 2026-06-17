// Piano puzzle library
// Level tiers: 1-2=Beginner, 3-4=Intermediate, 5-6=Advanced, 7-8=Expert, 9-10=Master

export const NOTES_BY_NAME = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  "C#4": 277.18, "D#4": 311.13, "F#4": 369.99, "G#4": 415.3, "A#4": 466.16,
  "C#5": 554.37, "D#5": 622.25, "F#5": 739.99, "G#5": 830.61, "A#5": 932.33,
};

export const NOTE_STAFF_POSITIONS = {
  C4: -2, D4: -1, E4: 0, F4: 1, G4: 2,
  A4: 3, B4: 4, C5: 5, D5: 6, E5: 7,
  F5: 8, G5: 9, A5: 10, B5: 11,
  "C#4": -2, "D#4": -1, "F#4": 1, "G#4": 2, "A#4": 3,
  "C#5": 5, "D#5": 6, "F#5": 8, "G#5": 9, "A#5": 10,
};

export const SHARPS = new Set(["C#4","D#4","F#4","G#4","A#4","C#5","D#5","F#5","G#5","A#5"]);

export const WHITE_NOTES_4 = ["C4","D4","E4","F4","G4","A4","B4"];
export const WHITE_NOTES_5 = ["C5","D5","E5","F5","G5","A5","B5"];
export const ALL_WHITE_NOTES = [...WHITE_NOTES_4, ...WHITE_NOTES_5];
export const BLACK_NOTES = ["C#4","D#4","F#4","G#4","A#4","C#5","D#5","F#5","G#5","A#5"];

// Difficulty tiers users can pick at start
export const DIFFICULTY_TIERS = {
  beginner:     { label: "Beginner",     emoji: "🌱", startLevel: 1, description: "Single notes & basic intervals" },
  intermediate: { label: "Intermediate", emoji: "🎵", startLevel: 3, description: "Chords & 3-note sequences" },
  hard:         { label: "Advanced",     emoji: "🔥", startLevel: 5, description: "Scales, sharps & long sequences" },
};

export const PUZZLES = [
  // ── LEVEL 1 — single notes ──
  { id: 1,  level: 1, type: "single",   notes: ["C4"],                          description: "Middle C",              hint: "The white key in the very center of a standard piano" },
  { id: 2,  level: 1, type: "single",   notes: ["E4"],                          description: "E",                     hint: "Two white keys to the right of middle C" },
  { id: 3,  level: 1, type: "single",   notes: ["G4"],                          description: "G",                     hint: "Four white keys to the right of middle C" },
  { id: 4,  level: 1, type: "single",   notes: ["A4"],                          description: "A (Concert 440 Hz)",    hint: "Five white keys to the right of middle C" },
  { id: 5,  level: 1, type: "single",   notes: ["D4"],                          description: "D",                     hint: "One white key to the right of middle C" },
  { id: 6,  level: 1, type: "single",   notes: ["F4"],                          description: "F",                     hint: "Three white keys to the right of middle C" },
  { id: 7,  level: 1, type: "single",   notes: ["B4"],                          description: "B",                     hint: "Six white keys to the right of middle C" },
  { id: 8,  level: 1, type: "single",   notes: ["C5"],                          description: "High C",                hint: "The C one octave above middle C" },

  // ── LEVEL 2 — two-note intervals ──
  { id: 9,  level: 2, type: "sequence", notes: ["C4","G4"],                     description: "C–G: Perfect 5th",      hint: "Think first two notes of 'Twinkle Twinkle'" },
  { id: 10, level: 2, type: "sequence", notes: ["C4","E4"],                     description: "C–E: Major 3rd",        hint: "Bright and happy sounding" },
  { id: 11, level: 2, type: "sequence", notes: ["G4","D5"],                     description: "G–D: Perfect 5th",      hint: "Same shape as C–G starting on G" },
  { id: 12, level: 2, type: "sequence", notes: ["A4","E5"],                     description: "A–E: Perfect 5th",      hint: "Common in many songs" },
  { id: 13, level: 2, type: "sequence", notes: ["E4","G4"],                     description: "E–G: Minor 3rd",        hint: "The somber, expressive interval" },
  { id: 14, level: 2, type: "sequence", notes: ["F4","A4"],                     description: "F–A: Major 3rd",        hint: "Warm and open sounding" },
  { id: 15, level: 2, type: "sequence", notes: ["C4","F4"],                     description: "C–F: Perfect 4th",      hint: "Opening of 'Here Comes the Bride'" },
  { id: 16, level: 2, type: "sequence", notes: ["D4","A4"],                     description: "D–A: Perfect 5th",      hint: "The core of a D chord" },

  // ── LEVEL 3 — triads ──
  { id: 17, level: 3, type: "chord",    notes: ["C4","E4","G4"],                description: "C Major",               hint: "C, E, G — the most fundamental chord" },
  { id: 18, level: 3, type: "chord",    notes: ["G4","B4","D5"],                description: "G Major",               hint: "G, B, D — very common in pop" },
  { id: 19, level: 3, type: "chord",    notes: ["F4","A4","C5"],                description: "F Major",               hint: "F, A, C — the IV chord in C major" },
  { id: 20, level: 3, type: "chord",    notes: ["A4","C5","E5"],                description: "A minor",               hint: "A, C, E — melancholy but beautiful" },
  { id: 21, level: 3, type: "chord",    notes: ["D4","F4","A4"],                description: "D minor",               hint: "D, F, A — soulful and expressive" },
  { id: 22, level: 3, type: "chord",    notes: ["E4","G4","B4"],                description: "E minor",               hint: "E, G, B — dreamy and introspective" },

  // ── LEVEL 4 — 3-note sequences ──
  { id: 23, level: 4, type: "sequence", notes: ["C4","D4","E4"],                description: "C–D–E ascending",       hint: "Three consecutive white keys" },
  { id: 24, level: 4, type: "sequence", notes: ["G4","A4","B4"],                description: "G–A–B ascending",       hint: "Three notes ascending in G major" },
  { id: 25, level: 4, type: "sequence", notes: ["E4","D4","C4"],                description: "E–D–C descending",      hint: "Common descending phrase — think lullabies" },
  { id: 26, level: 4, type: "sequence", notes: ["C4","E4","G4"],                description: "C arpeggio up",         hint: "C major played one note at a time" },
  { id: 27, level: 4, type: "sequence", notes: ["G4","B4","D5"],                description: "G arpeggio up",         hint: "G major arpeggiated" },
  { id: 28, level: 4, type: "sequence", notes: ["A4","C5","E5"],                description: "Am arpeggio up",        hint: "A minor chord as arpeggio" },

  // ── LEVEL 5 — sharps introduced ──
  { id: 29, level: 5, type: "single",   notes: ["F#4"],                         description: "F# (F sharp)",          hint: "The black key just to the right of F" },
  { id: 30, level: 5, type: "single",   notes: ["C#4"],                         description: "C# (C sharp)",          hint: "The black key just to the right of C" },
  { id: 31, level: 5, type: "chord",    notes: ["D4","F#4","A4"],               description: "D Major",               hint: "D, F#, A — bright and strong" },
  { id: 32, level: 5, type: "chord",    notes: ["E4","G#4","B4"],               description: "E Major",               hint: "E, G#, B — energetic and full" },
  { id: 33, level: 5, type: "sequence", notes: ["G4","A4","B4","C5"],           description: "G major scale (4)",     hint: "Start of the G major scale ascending" },
  { id: 34, level: 5, type: "sequence", notes: ["C4","D4","E4","F4","G4"],      description: "C major scale (5)",     hint: "First five notes of C major" },

  // ── LEVEL 6 — 4-note sequences & seventh chords ──
  { id: 35, level: 6, type: "sequence", notes: ["C4","E4","G4","B4"],           description: "Cmaj7 arpeggio",        hint: "C major seventh chord arpeggiated" },
  { id: 36, level: 6, type: "sequence", notes: ["D4","F4","A4","C5"],           description: "Dm7 arpeggio",          hint: "D minor seventh — jazzy sound" },
  { id: 37, level: 6, type: "sequence", notes: ["G4","F4","E4","D4"],           description: "G–F–E–D descending",    hint: "Descending run in G major" },
  { id: 38, level: 6, type: "chord",    notes: ["C4","E4","G4","B4"],           description: "Cmaj7 chord",           hint: "C, E, G, B all at once" },
  { id: 39, level: 6, type: "sequence", notes: ["A4","G4","F4","E4"],           description: "A–G–F–E descending",    hint: "Common descending melody fragment" },
  { id: 40, level: 6, type: "sequence", notes: ["E4","F4","G4","A4"],           description: "E–F–G–A ascending",     hint: "Four-note ascending phrase in C major" },

  // ── LEVEL 7 — pentatonic & modal sequences ──
  { id: 41, level: 7, type: "sequence", notes: ["C4","D4","E4","G4","A4"],      description: "C pentatonic scale",    hint: "The famous five-note scale — no F or B" },
  { id: 42, level: 7, type: "sequence", notes: ["A4","C5","D5","E5","G5"],      description: "A minor pentatonic",    hint: "Blues and rock staple" },
  { id: 43, level: 7, type: "sequence", notes: ["G4","A4","B4","C5","D5"],      description: "G major scale (5)",     hint: "Five notes of the G major scale" },
  { id: 44, level: 7, type: "chord",    notes: ["G4","B4","D5","F5"],           description: "G7 chord",              hint: "G dominant seventh — strong tension" },
  { id: 45, level: 7, type: "sequence", notes: ["D4","E4","F#4","G4","A4"],     description: "D major scale (5)",     hint: "First five notes of D major — note the F#" },

  // ── LEVEL 8 — full octave runs ──
  { id: 46, level: 8, type: "sequence", notes: ["C4","D4","E4","F4","G4","A4","B4"], description: "C major scale (7)", hint: "Seven notes of C major — one full octave minus one" },
  { id: 47, level: 8, type: "sequence", notes: ["G4","A4","B4","C5","D5","E5","F#5"], description: "G major scale (7)", hint: "Seven notes of G major — watch for the F#" },
  { id: 48, level: 8, type: "sequence", notes: ["A4","B4","C5","D5","E5"],      description: "A natural minor (5)",   hint: "Five notes of natural A minor" },
  { id: 49, level: 8, type: "chord",    notes: ["D4","F#4","A4","C5"],          description: "D7 chord",              hint: "D dominant seventh" },

  // ── LEVEL 9 — complex chords & longer sequences ──
  { id: 50, level: 9, type: "sequence", notes: ["C4","E4","G4","B4","D5"],      description: "Cmaj9 arpeggio",        hint: "C major 9th — lush extended chord" },
  { id: 51, level: 9, type: "sequence", notes: ["D4","F#4","A4","C5","E5"],     description: "D9 arpeggio",           hint: "D dominant 9th" },
  { id: 52, level: 9, type: "sequence", notes: ["G4","B4","D5","F5","A5"],      description: "G9 arpeggio",           hint: "G dominant 9th — jazz voicing" },
  { id: 53, level: 9, type: "sequence", notes: ["E4","F#4","G#4","A4","B4"],    description: "E major scale (5)",     hint: "First five notes of E major — two sharps" },

  // ── LEVEL 10 — master sequences ──
  { id: 54, level: 10, type: "sequence", notes: ["C4","D4","E4","F4","G4","A4","B4","C5"], description: "C major — full octave", hint: "The complete C major scale from middle C to high C" },
  { id: 55, level: 10, type: "sequence", notes: ["A4","G#4","F#4","E4","D4","C#4","B4","A4"], description: "A harmonic minor descend", hint: "A harmonic minor scale descending — note G# and C#" },
  { id: 56, level: 10, type: "chord",    notes: ["C4","E4","G4","B4","D5"],     description: "Cmaj9 chord",           hint: "C major 9th chord — five notes at once" },
];

export function getPuzzlesForLevel(level) {
  // Include all puzzles up to current level
  return PUZZLES.filter(p => p.level <= level);
}

export function getNextPuzzle(completedIds, level) {
  const available = getPuzzlesForLevel(level);
  const unplayed = available.filter(p => !completedIds.includes(p.id));
  if (unplayed.length > 0) {
    return unplayed[Math.floor(Math.random() * unplayed.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export function getFrequency(noteName) {
  return NOTES_BY_NAME[noteName] || 440;
}

export function getNoteDisplayName(note) {
  const map = {
    "C4": "C", "D4": "D", "E4": "E", "F4": "F", "G4": "G", "A4": "A", "B4": "B",
    "C5": "C'", "D5": "D'", "E5": "E'", "F5": "F'", "G5": "G'", "A5": "A'", "B5": "B'",
    "C#4": "C#", "D#4": "D#", "F#4": "F#", "G#4": "G#", "A#4": "A#",
    "C#5": "C#'", "D#5": "D#'", "F#5": "F#'", "G#5": "G#'", "A#5": "A#'",
  };
  return map[note] || note;
}