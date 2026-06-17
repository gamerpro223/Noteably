import { note, rest, makeExercise, DURATION_BEATS, midiToKey, keyToMidi } from "./musicData.js";
import { getCurriculumLevel, measureCountFor, minNotesFor } from "./curriculum.js";

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
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

const MOTIFS = [
  { title: "Ode-style seed", levels: [1, 4], degrees: [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3] },
  { title: "Folk round seed", levels: [2, 5], degrees: [1, 2, 3, 1, 1, 2, 3, 1, 3, 4, 5, 3, 4, 5] },
  { title: "Aura Lee-style seed", levels: [3, 6], degrees: [5, 6, 5, 3, 2, 3, 4, 3, 2, 1, 2, 3] },
  { title: "Minuet contour", levels: [5, 9], degrees: [5, 1, 2, 3, 4, 5, 1, 1, 6, 4, 5, 6, 7, 8] },
  { title: "Sonatina figure", levels: [8, 13], degrees: [1, 3, 5, 8, 7, 5, 6, 4, 5, 3, 4, 2, 1] },
  { title: "Invention exchange", levels: [12, 16], degrees: [1, 2, 3, 5, 4, 3, 6, 5, 4, 2, 3, 1, 5, 4, 3, 2] },
  { title: "Velocity etude", levels: [15, 20], degrees: [1, 3, 5, 8, 10, 8, 5, 3, 2, 4, 6, 9, 11, 9, 6, 4] },
];

const PROGRESSIONS = [
  { name: "I-IV-V-I", degrees: [1, 4, 5, 1] },
  { name: "I-vi-IV-V", degrees: [1, 6, 4, 5] },
  { name: "ii-V-I-vi", degrees: [2, 5, 1, 6] },
  { name: "i-VI-iv-V", degrees: [1, 6, 4, 5], minorOnly: true },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(probability) {
  return Math.random() < probability;
}

function clampMidi(midi) {
  return Math.max(21, Math.min(108, midi));
}

function midiToSafeKey(midi) {
  return midiToKey(clampMidi(midi));
}

function keyFor(level) {
  const pool = level <= 3
    ? KEYS.slice(0, 2)
    : level <= 8
      ? KEYS.slice(0, 4)
      : level <= 12
        ? KEYS.slice(0, 5)
        : KEYS;
  return pick(pool);
}

function diatonicMidi(key, degree, hand = "right", octaveShift = 0) {
  const zeroBased = degree - 1;
  const octave = Math.floor(zeroBased / 7) + octaveShift;
  const index = ((zeroBased % 7) + 7) % 7;
  const root = hand === "left" ? key.leftRoot : key.rightRoot;
  return clampMidi(root + key.scale[index] + octave * 12);
}

function degreeToKey(key, degree, hand = "right", octaveShift = 0) {
  return midiToSafeKey(diatonicMidi(key, degree, hand, octaveShift));
}

function chromatic(keyName, semitones) {
  return midiToSafeKey(keyToMidi(keyName) + semitones);
}

function chordForDegree(key, degree, hand = "right", size = 3, octaveShift = 0) {
  return [degree, degree + 2, degree + 4, degree + 6, degree + 8]
    .slice(0, size)
    .map(d => degreeToKey(key, d, hand, octaveShift));
}

function invertChord(chord, amount) {
  const out = [...chord];
  for (let i = 0; i < amount; i++) {
    const first = out.shift();
    out.push(midiToSafeKey(keyToMidi(first) + 12));
  }
  return out;
}

function rhythmFor(level, depth, index) {
  if (level <= 2) return index % 4 === 3 && depth > 4 ? "half" : "quarter";
  if (level <= 4) return depth > 5 && index % 5 === 2 ? "eighth" : index % 4 === 3 ? "half" : "quarter";
  if (level <= 7) return index % 5 === 0 && depth < 5 ? "quarter" : "eighth";
  if (level <= 10) return index % 6 === 1 && depth >= 4 ? "dotted-quarter" : "eighth";
  if (level <= 14) return index % 7 === 2 ? "dotted-quarter" : index % 4 === 0 ? "quarter" : "eighth";
  return index % 8 === 0 ? "eighth" : "sixteenth";
}

function eventCountTarget(level, depth, handMode) {
  const minNotes = minNotesFor(level, depth);
  const averageChordSize = level >= 15 ? 1.65 : level >= 9 ? 1.45 : level >= 5 ? 1.25 : 1;
  const split = handMode === "both" ? 2 : 1;
  return Math.ceil(minNotes / averageChordSize / split);
}

function motifFor(level) {
  const pool = MOTIFS.filter(motif => level >= motif.levels[0] && level <= motif.levels[1]);
  return pick(pool.length ? pool : MOTIFS);
}

function degreeStream(level, depth, count) {
  const motif = motifFor(level);
  const out = [];
  for (let i = 0; out.length < count; i++) {
    const base = motif.degrees[i % motif.degrees.length];
    const phrase = Math.floor(i / motif.degrees.length);
    const octaveLift = level >= 11 && i % 9 > 5 ? 7 : 0;
    const advancedLift = level >= 17 && i % 11 === 4 ? 9 : 0;
    const depthLift = depth >= 7 && i % 6 === 3 ? 4 : 0;
    out.push(base + (phrase % 2) + octaveLift + advancedLift + depthLift);
  }
  return { motif, degrees: out };
}

function buildOneHandEvents({ level, depth, key, hand, count }) {
  const { degrees } = degreeStream(level, depth, count);
  const progression = pick(PROGRESSIONS.filter(p => !p.minorOnly || key.mode === "minor"));
  const events = [];

  for (let i = 0; events.length < count; i++) {
    const degree = degrees[i % degrees.length] + (i >= degrees.length ? 1 : 0);
    const duration = rhythmFor(level, depth, i);

    if (level >= 18 && i % 6 === 5) {
      const chord = chordForDegree(key, progression.degrees[i % progression.degrees.length], hand, 4, hand === "right" ? 1 : 0);
      events.push({ group: chord, duration: "quarter" });
      continue;
    }

    if (level >= 13 && i % 5 === 3) {
      const chord = chordForDegree(key, progression.degrees[i % progression.degrees.length], hand, level >= 15 ? 4 : 3, hand === "right" && level >= 16 ? 1 : 0);
      events.push({ group: invertChord(chord, i % 3), duration: level >= 15 ? "eighth" : "quarter" });
      continue;
    }

    if (level >= 9 && i % 4 === 2) {
      const chord = chordForDegree(key, progression.degrees[i % progression.degrees.length], hand, level >= 11 ? 4 : 3);
      events.push({ group: invertChord(chord, level >= 10 ? i % 3 : 0), duration: level >= 11 ? "eighth" : "quarter" });
      continue;
    }

    if (level >= 5 && i % 6 === 4) {
      events.push({ group: chordForDegree(key, degree, hand, 3), duration: level >= 8 ? "eighth" : "quarter" });
      continue;
    }

    const octaveShift = hand === "right" && level >= 12 && i % 8 > 4 ? 1 : 0;
    let keyName = degreeToKey(key, degree, hand, octaveShift);
    if (level >= 8 && i % 7 === 1) keyName = chromatic(keyName, chance(0.5) ? 1 : -1);
    if (level >= 11 && i % 9 === 5) keyName = chromatic(keyName, chance(0.5) ? 2 : -2);
    events.push({ group: [keyName], duration });
  }

  return events;
}

function buildLeftAccompaniment({ level, depth, key, count }) {
  const progression = pick(PROGRESSIONS.filter(p => !p.minorOnly || key.mode === "minor"));
  const events = [];
  for (let i = 0; events.length < count; i++) {
    const degree = progression.degrees[i % progression.degrees.length];
    if (level <= 4) {
      events.push({ group: [degreeToKey(key, degree, "left")], duration: i % 2 ? "half" : "quarter" });
    } else if (level <= 8) {
      const pattern = [degree, degree + 4, degree + 2, degree + 4];
      events.push({ group: [degreeToKey(key, pattern[i % pattern.length], "left")], duration: depth > 5 ? "eighth" : "quarter" });
    } else if (level <= 12) {
      const pattern = [degree, degree + 4, degree + 2, degree + 4, degree, degree + 4, degree + 2, degree + 4];
      events.push({ group: [degreeToKey(key, pattern[i % pattern.length], "left")], duration: "eighth" });
    } else if (level <= 16) {
      if (i % 4 === 1) events.push({ group: chordForDegree(key, degree, "left", 3), duration: "quarter" });
      else events.push({ group: [degreeToKey(key, degree + (i % 3) * 2, "left")], duration: i % 2 ? "eighth" : "quarter" });
    } else {
      if (i % 5 === 4) events.push({ group: chordForDegree(key, degree, "left", level >= 19 ? 4 : 3), duration: "eighth" });
      else events.push({ group: [degreeToKey(key, degree + [0, 4, 2, 7][i % 4], "left")], duration: level >= 18 ? "sixteenth" : "eighth" });
    }
  }
  return events;
}

function splitEvents(rawEvents, measureCount) {
  const measures = Array.from({ length: measureCount }, () => []);
  let measureIndex = 0;
  let beat = 1;

  for (const raw of rawEvents) {
    const duration = raw.duration || "quarter";
    const beats = DURATION_BEATS[duration] || 1;
    if (beat + beats > 5 && measures[measureIndex].length) {
      measureIndex += 1;
      beat = 1;
      if (measureIndex >= measureCount) break;
    }
    measures[measureIndex].push(note(raw.group, duration, beat));
    beat += beats;
  }

  for (const measure of measures) {
    if (measure.length === 0) measure.push(rest("whole", 1));
  }
  return measures;
}

function playableNoteCount(measures) {
  let total = 0;
  for (const measure of measures) {
    for (const hand of ["rightHand", "leftHand"]) {
      for (const event of measure[hand] || []) {
        if (!event.rest) total += event.keys?.length || 0;
      }
    }
  }
  return total;
}

function normalizeMode(hand) {
  if (hand === "left") return "left";
  if (hand === "both") return "both";
  return "right";
}

function buildMeasures({ level, depth, key, mode, measureCount }) {
  const perHandTarget = eventCountTarget(level, depth, mode);
  const rightCount = mode === "left" ? 0 : Math.max(2, perHandTarget + (mode === "both" && level >= 12 ? 2 : 0));
  const leftCount = mode === "right" ? 0 : Math.max(2, perHandTarget + (mode === "both" && level >= 12 ? 4 : 0));

  const right = rightCount
    ? splitEvents(buildOneHandEvents({ level, depth, key, hand: "right", count: rightCount }), measureCount)
    : Array.from({ length: measureCount }, () => []);
  const left = leftCount
    ? splitEvents(
      mode === "both"
        ? buildLeftAccompaniment({ level, depth, key, count: leftCount })
        : buildOneHandEvents({ level, depth, key, hand: "left", count: leftCount }),
      measureCount
    )
    : Array.from({ length: measureCount }, () => []);

  return Array.from({ length: measureCount }, (_, index) => ({
    number: index + 1,
    rightHand: right[index] || [],
    leftHand: left[index] || [],
  }));
}

function growUntilMinimum({ measures, level, depth, key, mode, measureCount }) {
  const required = minNotesFor(level, depth);
  let out = measures;
  let guard = 0;
  while (playableNoteCount(out) < required && guard < 8) {
    guard += 1;
    const more = buildMeasures({
      level,
      depth: Math.min(9, depth + guard),
      key,
      mode,
      measureCount,
    });
    out = out.map((measure, index) => ({
      ...measure,
      rightHand: [...(measure.rightHand || []), ...(more[index]?.rightHand || []).slice(0, 2)],
      leftHand: [...(measure.leftHand || []), ...(more[index]?.leftHand || []).slice(0, 2)],
    }));
  }
  return out;
}

export function generateCurriculumExercise(level, hand = "right", options = {}) {
  const l = Math.max(1, Math.min(20, Number(level) || 1));
  const depth = Math.max(0, Math.min(9, Number(options.depth) || 0));
  const mode = normalizeMode(hand);
  const spec = getCurriculumLevel(l);
  const key = keyFor(l);
  const measureCount = measureCountFor(l, depth);
  const motif = motifFor(l);
  let measures = buildMeasures({ level: l, depth, key, mode, measureCount });
  measures = growUntilMinimum({ measures, level: l, depth, key, mode, measureCount });

  return makeExercise({
    level: l,
    mode,
    type: mode === "both" ? (l >= 18 ? "virtuoso" : "two-hand") : spec.type === "two-hand" ? "sequence" : spec.type,
    title: `${spec.name}: ${motif.title} ${depth + 1}`,
    keySignature: key.name,
    difficultyScore: spec.difficultyScore + depth * 3 + (mode === "both" ? 6 : 0),
    measures,
    hint: spec.hint,
    requiredAccuracy: l >= 18 ? 0.92 : l >= 12 ? 0.88 : 0.82,
    maxMistakes: l >= 16 ? 1 : l >= 10 ? 2 : 3,
    timeLimit: l >= 19 ? 30 : null,
  });
}
