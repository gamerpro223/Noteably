import { note, rest, makeExercise, DURATION_BEATS, midiToKey } from "./musicData.js";

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];

const KEYS = [
  { name: "C", mode: "major", rightRoot: 60, leftRoot: 48, scale: MAJOR },
  { name: "G", mode: "major", rightRoot: 67, leftRoot: 43, scale: MAJOR },
  { name: "F", mode: "major", rightRoot: 65, leftRoot: 41, scale: MAJOR },
  { name: "D", mode: "major", rightRoot: 62, leftRoot: 50, scale: MAJOR },
  { name: "A minor", mode: "minor", rightRoot: 57, leftRoot: 45, scale: HARMONIC_MINOR },
  { name: "E minor", mode: "minor", rightRoot: 64, leftRoot: 40, scale: HARMONIC_MINOR },
  { name: "D minor", mode: "minor", rightRoot: 62, leftRoot: 50, scale: HARMONIC_MINOR },
];

const PROGRESSIONS = [
  { name: "I-IV-V-I", degrees: [1, 4, 5, 1] },
  { name: "I-vi-IV-V", degrees: [1, 6, 4, 5] },
  { name: "i-VI-iv-V", degrees: [1, 6, 4, 5], minorOnly: true },
  { name: "I-V-vi-IV", degrees: [1, 5, 6, 4] },
  { name: "ii-V-I-vi", degrees: [2, 5, 1, 6] },
];

const LEVEL_RULES = {
  1: { difficulty: 5, measures: 1, title: "First note", hint: "One note near Middle C" },
  2: { difficulty: 9, measures: 1, title: "Two-note step", hint: "Move to the next white key" },
  3: { difficulty: 15, measures: 1, title: "Mini phrase", hint: "Read the notes in order" },
  4: { difficulty: 22, measures: 2, title: "Skip pattern", hint: "Watch the distance between notes" },
  5: { difficulty: 30, measures: 1, title: "First chord shape", hint: "Play the notes as one clean shape" },
  6: { difficulty: 36, measures: 2, title: "Notes with chords", hint: "Single notes lead into a chord" },
  7: { difficulty: 44, measures: 2, title: "Melodic phrase", hint: "Keep the rhythm steady" },
  8: { difficulty: 50, measures: 2, title: "Eighth-note run", hint: "Use an even pulse" },
  9: { difficulty: 56, measures: 2, title: "Chord progression", hint: "Move between chord shapes" },
  10: { difficulty: 62, measures: 2, title: "Chord inversions", hint: "Same chord, different shape" },
  11: { difficulty: 68, measures: 2, title: "Accidentals and rhythm", hint: "Notice sharps and dotted rhythms" },
  12: { difficulty: 60, measures: 2, title: "Left hand pattern", hint: "Bass clef, steady motion" },
  13: { difficulty: 70, measures: 2, title: "Two-hand coordination", hint: "Melody over simple bass" },
  14: { difficulty: 74, measures: 2, title: "Two-hand harmony", hint: "Melody over chord support" },
  15: { difficulty: 80, measures: 3, title: "Two-hand challenge", hint: "Both hands change roles" },
  16: { difficulty: 84, measures: 3, title: "Advanced coordination", hint: "Sixteenth notes with bass movement" },
  17: { difficulty: 88, measures: 3, title: "Dense reading", hint: "Accidentals and wider shapes" },
  18: { difficulty: 92, measures: 4, title: "Virtuoso prep", hint: "Fast arpeggios and wide movement" },
  19: { difficulty: 96, measures: 4, title: "Concert etude", hint: "Fast notes, chords, and hand independence" },
  20: { difficulty: 100, measures: 5, title: "Grandmaster trial", hint: "Highest regular level" },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(probability) {
  return Math.random() < probability;
}

function keyForLevel(level) {
  const allowed = level < 5
    ? KEYS.slice(0, 2)
    : level < 7
    ? KEYS.slice(0, 3)
    : level < 12
      ? KEYS.slice(0, 5)
      : KEYS;
  return pick(allowed);
}

function fmt(key) {
  return key.replace("#", " sharp ").replace(/[0-9]/g, "").trim();
}

function diatonicMidi(key, degree, hand = "right", octaveShift = 0) {
  const zeroBased = degree - 1;
  const octave = Math.floor(zeroBased / 7) + octaveShift;
  const index = ((zeroBased % 7) + 7) % 7;
  const root = hand === "left" ? key.leftRoot : key.rightRoot;
  return root + key.scale[index] + octave * 12;
}

function scaleNote(key, degree, hand = "right", octaveShift = 0) {
  return safeMidiToKey(diatonicMidi(key, degree, hand, octaveShift));
}

function safeMidiToKey(midi) {
  return midiToKey(Math.max(21, Math.min(108, midi)));
}

function chordForDegree(key, degree, hand = "right", octaveShift = 0, size = 3) {
  return [degree, degree + 2, degree + 4, degree + 6]
    .slice(0, size)
    .map(d => scaleNote(key, d, hand, octaveShift));
}

function inversion(chord, amount) {
  const out = [...chord];
  for (let i = 0; i < amount; i++) {
    const first = out.shift();
    out.push(safeMidiToKey(midiFromKey(first) + 12));
  }
  return out;
}

function midiFromKey(keyName) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const match = keyName.match(/^([A-G]#?)(\d)$/);
  if (!match) return 60;
  return (Number(match[2]) + 1) * 12 + names.indexOf(match[1]);
}

function chromaticPassing(keyName, semitones) {
  return safeMidiToKey(midiFromKey(keyName) + semitones);
}

function eventList(groups, durations) {
  let beat = 1;
  return groups.map((group, index) => {
    const keys = Array.isArray(group) ? group : [group];
    const duration = durations[index] || "quarter";
    const ev = note(keys, duration, beat);
    beat += DURATION_BEATS[duration] || 1;
    return ev;
  });
}

function oneHandMeasures(hand, measureEvents) {
  return measureEvents.map((events, index) => ({
    number: index + 1,
    rightHand: hand === "left" ? [] : events,
    leftHand: hand === "left" ? events : [],
  }));
}

function makeOneHand(level, hand, key, type, title, measureEvents, hint, overrides = {}) {
  const rule = LEVEL_RULES[level];
  return makeExercise({
    level,
    mode: hand,
    type,
    title,
    keySignature: key.name,
    difficultyScore: rule.difficulty,
    measures: oneHandMeasures(hand, measureEvents),
    hint,
    ...overrides,
  });
}

function makeBoth(level, key, type, title, measurePairs, hint, overrides = {}) {
  const rule = LEVEL_RULES[level];
  return makeExercise({
    level,
    mode: "both",
    type,
    title,
    keySignature: key.name,
    difficultyScore: rule.difficulty,
    measures: measurePairs.map((pair, index) => ({
      number: index + 1,
      rightHand: pair.rightHand || [],
      leftHand: pair.leftHand || [],
    })),
    hint,
    ...overrides,
  });
}

function melodyDegrees(level) {
  const patterns = [
    [1, 2, 3, 4, 5, 4, 3, 2],
    [3, 5, 4, 2, 1, 2, 3, 5],
    [5, 4, 3, 2, 1, 3, 5, 6],
    [1, 3, 5, 6, 5, 4, 2, 1],
    [6, 5, 4, 3, 2, 3, 4, 5],
  ];

  if (level <= 3) return pick([[1, 2, 3, 2], [3, 2, 1, 2], [1, 3, 2, 1]]);
  if (level <= 6) return pick([[1, 3, 5, 3], [5, 3, 1, 2], [1, 4, 2, 5]]);
  return pick(patterns);
}

function runDegrees(level) {
  const shape = pick([
    [1, 2, 3, 4, 5, 6, 5, 4],
    [5, 6, 7, 8, 7, 6, 5, 3],
    [3, 4, 5, 6, 7, 8, 7, 5],
    [8, 7, 6, 5, 4, 3, 2, 1],
    [1, 3, 2, 4, 3, 5, 4, 6],
  ]);
  if (level < 11) return shape;
  return shape.map((degree, index) => index % 3 === 1 && chance(0.45) ? degree + 7 : degree);
}

function progressionFor(key) {
  const options = PROGRESSIONS.filter(p => !p.minorOnly || key.mode === "minor");
  return pick(options);
}

function simpleLevel(level, hand, key) {
  const actualHand = hand === "both" ? "right" : hand;
  const handName = actualHand === "left" ? "left" : "right";
  const rule = LEVEL_RULES[level];

  if (level === 1) {
    const target = scaleNote(key, pick([1, 2, 3, 5]), handName);
    const events = [note([target], "quarter", 1), rest("quarter", 2), rest("half", 3)];
    return makeOneHand(level, actualHand, key, "single-note", `${rule.title}: ${fmt(target)}`, [events], rule.hint);
  }

  if (level === 2) {
    const start = pick([1, 2, 3, 4]);
    const degrees = [start, start + pick([1, 2])];
    const keys = degrees.map(d => scaleNote(key, d, handName));
    return makeOneHand(level, actualHand, key, "sequence", `${fmt(keys[0])} to ${fmt(keys[1])}`, [
      [note([keys[0]], "quarter", 1), note([keys[1]], "quarter", 2), rest("half", 3)],
    ], rule.hint);
  }

  if (level <= 4) {
    const degrees = melodyDegrees(level);
    const keys = degrees.map(d => scaleNote(key, d, handName));
    const first = eventList(keys.slice(0, 4), ["quarter", "quarter", "quarter", "quarter"]);
    const second = level === 4
      ? eventList([keys[1], keys[3], keys[2], keys[0]], ["quarter", "quarter", "quarter", "quarter"])
      : null;
    return makeOneHand(level, actualHand, key, "sequence", `${rule.title} in ${key.name}`, second ? [first, second] : [first], rule.hint);
  }

  const rootDegree = pick([1, 2, 4, 5, 6]);
  const triad = chordForDegree(key, rootDegree, handName);
  if (level === 5) {
    const asChord = chance(0.55);
    const events = asChord
      ? [note(triad, "whole", 1)]
      : eventList([triad[0], triad[1], triad[2], triad[0]], ["quarter", "quarter", "quarter", "quarter"]);
    return makeOneHand(level, actualHand, key, asChord ? "chord" : "sequence", `${key.name} chord shape`, [events], rule.hint);
  }

  const upper = scaleNote(key, rootDegree + 1, handName);
  const lower = scaleNote(key, Math.max(1, rootDegree - 1), handName);
  return makeOneHand(level, actualHand, key, "mixed", `${key.name} notes and chord`, [
    [note([lower], "quarter", 1), note([upper], "quarter", 2), note(triad, "half", 3)],
    [note(triad, "quarter", 1), note([upper], "quarter", 2), note([triad[0]], "half", 3)],
  ], rule.hint);
}

function intermediateOneHand(level, hand, key) {
  const actualHand = hand === "both" ? "right" : hand;
  const handName = actualHand === "left" ? "left" : "right";
  const rule = LEVEL_RULES[level];

  if (level <= 8) {
    const d1 = runDegrees(level);
    const d2 = runDegrees(level).reverse();
    const notes1 = d1.map(d => scaleNote(key, d, handName));
    const notes2 = d2.map((d, i) => {
      const base = scaleNote(key, d, handName);
      return level >= 8 && i === 2 && chance(0.6) ? chromaticPassing(base, 1) : base;
    });
    return makeOneHand(level, actualHand, key, "sequence", `${rule.title} in ${key.name}`, [
      eventList(notes1, Array(8).fill("eighth")),
      eventList(notes2, Array(8).fill("eighth")),
    ], rule.hint);
  }

  const progression = progressionFor(key);
  const chords = progression.degrees.map((degree, index) => {
    const base = chordForDegree(key, degree, handName, 0, level >= 11 && index === 2 ? 4 : 3);
    return level >= 10 ? inversion(base, index % 3) : base;
  });

  if (level === 9) {
    return makeOneHand(level, actualHand, key, "chord", `${key.name} ${progression.name}`, [
      eventList(chords, ["quarter", "quarter", "quarter", "quarter"]),
      eventList([chords[1], chords[2], chords[3]], ["half", "quarter", "quarter"]),
    ], rule.hint);
  }

  if (level === 10) {
    return makeOneHand(level, actualHand, key, "chord", `${key.name} inversions`, [
      eventList([chords[0], chords[1], chords[2], chords[3]], ["quarter", "quarter", "quarter", "quarter"]),
      eventList([chords[2], chords[1], chords[0]], ["quarter", "quarter", "half"]),
    ], rule.hint);
  }

  const melody = runDegrees(level).map((d, index) => {
    const base = scaleNote(key, d, handName, index > 4 ? 1 : 0);
    return index % 3 === 1 ? chromaticPassing(base, chance(0.5) ? 1 : -1) : base;
  });

  return makeOneHand(level, actualHand, key, "sequence", `${rule.title} in ${key.name}`, [
    eventList(melody.slice(0, 4), ["dotted-quarter", "eighth", "quarter", "quarter"]),
    eventList([chords[0], melody[5], melody[6], chords[2]], ["quarter", "eighth", "eighth", "half"]),
  ], rule.hint);
}

function leftHandPattern(key, progression) {
  const degrees = progression.degrees;
  const patterns = degrees.slice(0, 2).map((degree) => {
    const root = scaleNote(key, degree, "left");
    const fifth = scaleNote(key, degree + 4, "left");
    const third = scaleNote(key, degree + 2, "left");
    return eventList([root, fifth, third, fifth, root, fifth, third, fifth], Array(8).fill("eighth"));
  });
  return patterns;
}

function twoHandLevel(level, key) {
  const rule = LEVEL_RULES[level];
  const progression = progressionFor(key);

  if (level === 12) {
    const [m1, m2] = leftHandPattern(key, progression);
    return makeOneHand(level, "left", key, "sequence", `${key.name} left hand pattern`, [m1, m2], rule.hint);
  }

  if (level <= 14) {
    const melody = [...runDegrees(level), ...runDegrees(level).reverse()].slice(0, 8);
    const pairs = [0, 1].map(measureIndex => {
      const degrees = melody.slice(measureIndex * 4, measureIndex * 4 + 4);
      const prog = progression.degrees.slice(measureIndex * 2, measureIndex * 2 + 2);
      return {
        rightHand: eventList(degrees.map(d => scaleNote(key, d, "right")), ["quarter", "quarter", "quarter", "quarter"]),
        leftHand: level === 13
          ? eventList([scaleNote(key, prog[0], "left"), scaleNote(key, prog[1] || prog[0], "left"), scaleNote(key, prog[0], "left"), scaleNote(key, prog[1] || prog[0], "left")], ["quarter", "quarter", "quarter", "quarter"])
          : eventList([chordForDegree(key, prog[0], "left", 0, 2), chordForDegree(key, prog[1] || prog[0], "left", 0, 2), chordForDegree(key, prog[0], "left", 0, 2), chordForDegree(key, 5, "left", 0, 2)], ["quarter", "quarter", "quarter", "quarter"]),
      };
    });
    return makeBoth(level, key, "two-hand", `${key.name} ${rule.title.toLowerCase()}`, pairs, rule.hint);
  }

  const measureCount = LEVEL_RULES[level].measures;
  const pairs = [];
  for (let m = 0; m < measureCount; m++) {
    const degree = progression.degrees[m % progression.degrees.length];
    const nextDegree = progression.degrees[(m + 1) % progression.degrees.length];
    const chord = chordForDegree(key, degree, "right", level >= 18 ? 1 : 0, level >= 17 ? 4 : 3);
    const bassChord = chordForDegree(key, degree, "left", 0, level >= 18 ? 3 : 2);

    if (level === 15) {
      pairs.push({
        rightHand: eventList([scaleNote(key, degree + 2, "right"), scaleNote(key, degree + 4, "right"), chord, scaleNote(key, nextDegree + 1, "right")], ["eighth", "eighth", "half", "quarter"]),
        leftHand: eventList([scaleNote(key, degree, "left"), bassChord, chordForDegree(key, nextDegree, "left", 0, 2)], ["quarter", "quarter", "half"]),
      });
    } else if (level <= 17) {
      const run = runDegrees(level).slice(0, 6).map((d, i) => {
        const base = scaleNote(key, d + degree - 1, "right", i > 3 ? 1 : 0);
        return level >= 17 && i % 2 === 1 ? chromaticPassing(base, chance(0.5) ? 1 : -1) : base;
      });
      pairs.push({
        rightHand: eventList([...run.slice(0, 5), chord], ["sixteenth", "sixteenth", "sixteenth", "sixteenth", "quarter", "half"]),
        leftHand: eventList([scaleNote(key, degree, "left"), scaleNote(key, nextDegree, "left"), bassChord], ["quarter", "quarter", "half"]),
      });
    } else {
      const run = [degree, degree + 2, degree + 4, degree + 7, degree + 9, degree + 7, degree + 4, degree + 2]
        .map((d, i) => {
          const base = scaleNote(key, d, "right", i > 2 ? 1 : 0);
          return level >= 19 && i % 4 === 1 ? chromaticPassing(base, chance(0.5) ? 1 : -1) : base;
        });
      const rightHand = m === measureCount - 1
        ? eventList([chordForDegree(key, 1, "right", 0, 4), chordForDegree(key, 4, "right", 0, 4), chordForDegree(key, 5, "right", 0, 4), chordForDegree(key, 1, "right", 0, 4)], ["quarter", "quarter", "quarter", "quarter"])
        : eventList(run, Array(8).fill("eighth"));
      pairs.push({
        rightHand,
        leftHand: level === 20 && m % 2 === 0
          ? eventList([scaleNote(key, degree, "left"), scaleNote(key, degree + 4, "left"), scaleNote(key, degree + 2, "left"), bassChord], ["eighth", "eighth", "quarter", "half"])
          : eventList([bassChord, chordForDegree(key, nextDegree, "left", 0, level >= 19 ? 3 : 2), scaleNote(key, degree, "left")], ["quarter", "quarter", "half"]),
      });
    }
  }

  return makeBoth(level, key, level >= 18 ? "virtuoso" : "two-hand", `${key.name} ${rule.title.toLowerCase()}`, pairs, rule.hint, {
    requiredAccuracy: level >= 19 ? 0.92 : level >= 17 ? 0.88 : 0.84,
    timeLimit: level === 20 ? 30 : null,
  });
}

export function generateRuleBasedExercise(level, hand = "right") {
  const l = Math.max(1, Math.min(20, Number(level) || 1));
  const key = keyForLevel(l);

  if (l <= 6) return simpleLevel(l, hand, key);
  if (l <= 11) return intermediateOneHand(l, hand, key);
  return twoHandLevel(l, key);
}

export function generateRuleBasedChopinExercise() {
  const key = pick(KEYS.filter(k => k.mode === "minor"));
  const progression = { degrees: [1, 5, 6, 4, 2, 5] };
  const pairs = [];

  for (let m = 0; m < 6; m++) {
    const degree = progression.degrees[m % progression.degrees.length];
    const run = [degree + 4, degree + 6, degree + 8, degree + 11, degree + 13, degree + 11, degree + 8, degree + 6]
      .map((d, i) => {
        const base = scaleNote(key, d, "right", i > 2 ? 1 : 0);
        return i % 3 === 1 ? chromaticPassing(base, chance(0.5) ? 1 : -1) : base;
      });
    const ornament = chordForDegree(key, degree, "right", 1, m >= 4 ? 4 : 3);
    const leftPattern = [
      scaleNote(key, degree, "left"),
      scaleNote(key, degree + 4, "left"),
      scaleNote(key, degree + 2, "left"),
      scaleNote(key, degree + 4, "left"),
      scaleNote(key, degree + 7, "left"),
      scaleNote(key, degree + 4, "left"),
      chordForDegree(key, degree, "left", 0, m >= 3 ? 4 : 3),
    ];

    pairs.push({
      rightHand: m === 5
        ? eventList([chordForDegree(key, 5, "right", 1, 4), chordForDegree(key, 1, "right", 1, 5), chordForDegree(key, 5, "right", 0, 4), chordForDegree(key, 1, "right", 0, 5)], ["quarter", "quarter", "quarter", "quarter"])
        : eventList([...run.slice(0, 6), ornament], ["sixteenth", "sixteenth", "sixteenth", "sixteenth", "eighth", "eighth", "half"]),
      leftHand: eventList(leftPattern, ["eighth", "eighth", "eighth", "eighth", "eighth", "eighth", "quarter"]),
    });
  }

  return makeBoth(20, key, "virtuoso", `Chopin-style ${key.name} study`, pairs, "Chopin Mode - romantic arpeggios, chromatic color, and wide left hand.", {
    difficultyScore: 122,
    requiredAccuracy: 0.95,
    timeLimit: 8,
  });
}
