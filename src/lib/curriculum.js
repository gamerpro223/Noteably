export const CURRICULUM = {
  1: {
    name: "Keyboard Orientation",
    description: "Single notes around middle C, then tiny two-note moves.",
    stage: "First month",
    type: "single-note",
    minMeasures: 1,
    maxMeasures: 2,
    minNotes: [1, 2, 3, 4],
    difficultyScore: 6,
    hint: "Find the note first, then play with a steady pulse.",
  },
  2: {
    name: "Five-Finger Reading",
    description: "C-G and G-D positions with short stepwise patterns.",
    stage: "First month",
    type: "sequence",
    minMeasures: 1,
    maxMeasures: 2,
    minNotes: [3, 4, 5, 6],
    difficultyScore: 12,
    hint: "Stay in one five-finger position and read direction.",
  },
  3: {
    name: "Beginner Melodies",
    description: "Short public-domain style phrases using steps and repeats.",
    stage: "First 1-2 months",
    type: "sequence",
    minMeasures: 1,
    maxMeasures: 2,
    minNotes: [4, 5, 7, 9],
    difficultyScore: 20,
    hint: "Read the whole phrase, not just one note.",
  },
  4: {
    name: "Skips And Landings",
    description: "Thirds, fourths, fifths, and simple phrase endings.",
    stage: "First 2-3 months",
    type: "sequence",
    minMeasures: 2,
    maxMeasures: 3,
    minNotes: [6, 8, 10, 12],
    difficultyScore: 29,
    hint: "Watch how far each note jumps.",
  },
  5: {
    name: "First Chord Shapes",
    description: "Intervals, blocked triads, and broken triads.",
    stage: "Early beginner",
    type: "mixed",
    minMeasures: 2,
    maxMeasures: 3,
    minNotes: [8, 10, 12, 15],
    difficultyScore: 38,
    hint: "Recognize the chord shape before playing.",
  },
  6: {
    name: "Notes Into Chords",
    description: "Simple melodies that resolve into chords.",
    stage: "Late beginner",
    type: "mixed",
    minMeasures: 2,
    maxMeasures: 3,
    minNotes: [10, 12, 15, 18],
    difficultyScore: 46,
    hint: "Switch cleanly between single notes and chords.",
  },
  7: {
    name: "Song Phrases",
    description: "Public-domain style melodies with eighth notes.",
    stage: "Late beginner",
    type: "sequence",
    minMeasures: 2,
    maxMeasures: 3,
    minNotes: [12, 15, 18, 22],
    difficultyScore: 54,
    hint: "Keep the phrase moving without guessing.",
  },
  8: {
    name: "Wider Reading",
    description: "Larger range, accidentals, and faster note recognition.",
    stage: "Late beginner",
    type: "sequence",
    minMeasures: 2,
    maxMeasures: 3,
    minNotes: [14, 18, 22, 26],
    difficultyScore: 62,
    hint: "Look ahead for black keys and position changes.",
  },
  9: {
    name: "Triads In Motion",
    description: "Chord progressions, broken triads, and inversions begin.",
    stage: "Early intermediate",
    type: "chord",
    minMeasures: 2,
    maxMeasures: 4,
    minNotes: [16, 20, 24, 30],
    difficultyScore: 70,
    hint: "See each chord as a shape, then move to the next one.",
  },
  10: {
    name: "Inversion Control",
    description: "Root, first, and second inversions in short progressions.",
    stage: "Early intermediate",
    type: "chord",
    minMeasures: 3,
    maxMeasures: 4,
    minNotes: [20, 24, 30, 36],
    difficultyScore: 78,
    hint: "Same chord, different shape.",
  },
  11: {
    name: "Rhythm And Accidentals",
    description: "Syncopation, dotted rhythms, accidentals, and leaps.",
    stage: "Intermediate",
    type: "sequence",
    minMeasures: 3,
    maxMeasures: 4,
    minNotes: [22, 28, 34, 42],
    difficultyScore: 86,
    hint: "Count the rhythm and check every accidental.",
  },
  12: {
    name: "Two-Hand Coordination",
    description: "Melody plus bass patterns, with both hands truly active.",
    stage: "Intermediate",
    type: "two-hand",
    minMeasures: 3,
    maxMeasures: 4,
    minNotes: [28, 36, 44, 54],
    difficultyScore: 94,
    hint: "Keep the bass steady while the melody moves.",
  },
  13: {
    name: "Sevenths And Broken Bass",
    description: "Seventh chords, Alberti bass, and denser coordination.",
    stage: "Intermediate",
    type: "two-hand",
    minMeasures: 3,
    maxMeasures: 5,
    minNotes: [34, 42, 52, 64],
    difficultyScore: 102,
    hint: "Read the chord color and the accompaniment together.",
  },
  14: {
    name: "Repertoire Passages",
    description: "Longer classical-style passages with memory pressure.",
    stage: "Solid intermediate",
    type: "two-hand",
    minMeasures: 4,
    maxMeasures: 5,
    minNotes: [42, 52, 64, 78],
    difficultyScore: 110,
    hint: "Chunk the passage into musical gestures.",
  },
  15: {
    name: "Independent Hands",
    description: "Different rhythms in each hand, syncopation, and sevenths.",
    stage: "Late intermediate",
    type: "two-hand",
    minMeasures: 4,
    maxMeasures: 5,
    minNotes: [50, 62, 76, 92],
    difficultyScore: 118,
    hint: "Hands no longer move together. Count carefully.",
  },
  16: {
    name: "Advanced Harmony",
    description: "Complex progressions, chromatic color, and wider leaps.",
    stage: "Early advanced",
    type: "two-hand",
    minMeasures: 4,
    maxMeasures: 5,
    minNotes: [58, 72, 88, 106],
    difficultyScore: 126,
    hint: "Notice the harmonic direction before playing.",
  },
  17: {
    name: "Key Changes",
    description: "Dense chromatic reading, shifting keys, and advanced rhythm.",
    stage: "Advanced",
    type: "two-hand",
    minMeasures: 4,
    maxMeasures: 6,
    minNotes: [68, 84, 104, 126],
    difficultyScore: 136,
    hint: "Slow down for accidentals and key changes.",
  },
  18: {
    name: "Virtuoso Passages",
    description: "Rapid arpeggios, wide leaps, and difficult two-hand textures.",
    stage: "Advanced",
    type: "virtuoso",
    minMeasures: 5,
    maxMeasures: 6,
    minNotes: [82, 102, 124, 150],
    difficultyScore: 146,
    hint: "Group fast notes into patterns.",
  },
  19: {
    name: "Concert Study",
    description: "Multi-octave figuration, dense chords, and chromatic passages.",
    stage: "Very advanced",
    type: "virtuoso",
    minMeasures: 5,
    maxMeasures: 6,
    minNotes: [96, 118, 142, 170],
    difficultyScore: 156,
    hint: "This is concert-study territory. Accuracy first.",
  },
  20: {
    name: "Grandmaster Trial",
    description: "Everything at once: speed, harmony, leaps, rhythm, and density.",
    stage: "Elite",
    type: "virtuoso",
    minMeasures: 6,
    maxMeasures: 7,
    minNotes: [112, 138, 166, 198],
    difficultyScore: 168,
    hint: "No shortcuts. Read, group, and execute.",
  },
};

export function getCurriculumLevel(level) {
  const l = Math.max(1, Math.min(20, Number(level) || 1));
  return CURRICULUM[l];
}

export function depthBand(depth = 0) {
  const d = Math.max(0, Math.min(9, Number(depth) || 0));
  if (d >= 8) return 3;
  if (d >= 5) return 2;
  if (d >= 2) return 1;
  return 0;
}

export function minNotesFor(level, depth = 0) {
  const spec = getCurriculumLevel(level);
  return spec.minNotes[depthBand(depth)];
}

export function measureCountFor(level, depth = 0) {
  const spec = getCurriculumLevel(level);
  const d = Math.max(0, Math.min(9, Number(depth) || 0));
  const raw = spec.minMeasures + Math.round(((spec.maxMeasures - spec.minMeasures) * d) / 9);
  return Math.max(spec.minMeasures, Math.min(spec.maxMeasures, raw));
}

export const LEVEL_META_FROM_CURRICULUM = Object.fromEntries(
  Object.entries(CURRICULUM).map(([level, spec]) => [
    level,
    { name: spec.name, description: spec.description },
  ])
);
