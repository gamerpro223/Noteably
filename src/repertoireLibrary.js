import { note, rest, makeExercise, DURATION_BEATS, midiToKey } from "./musicData.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const KEYS = [
  { name: "C", rightRoot: 60, leftRoot: 48, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: "G", rightRoot: 67, leftRoot: 43, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: "F", rightRoot: 65, leftRoot: 41, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: "D", rightRoot: 62, leftRoot: 50, scale: [0, 2, 4, 5, 7, 9, 11] },
  { name: "A minor", rightRoot: 57, leftRoot: 45, scale: [0, 2, 3, 5, 7, 8, 11] },
  { name: "E minor", rightRoot: 64, leftRoot: 40, scale: [0, 2, 3, 5, 7, 8, 11] },
  { name: "D minor", rightRoot: 62, leftRoot: 50, scale: [0, 2, 3, 5, 7, 8, 11] },
];

const REPERTOIRE_MOTIFS = [
  { level: [1, 3], title: "Ode to Joy seed", degrees: [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3], durations: ["quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter"] },
  { level: [1, 3], title: "Twinkle seed", degrees: [1, 1, 5, 5, 6, 6, 5, 4, 4, 3, 3, 2, 2, 1], durations: ["quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "half", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "half"] },
  { level: [2, 4], title: "French folk round seed", degrees: [1, 2, 3, 1, 1, 2, 3, 1, 3, 4, 5], durations: ["quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "half"] },
  { level: [3, 5], title: "Aura Lee seed", degrees: [5, 6, 5, 3, 2, 3, 4, 3, 2, 1], durations: ["quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "quarter", "half"] },
  { level: [4, 6], title: "Hanon-style five finger study", degrees: [1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8], durations: [] },
  { level: [5, 7], title: "Bach minuet contour", degrees: [5, 1, 2, 3, 4, 5, 1, 1, 6, 4, 5, 6, 7, 8], durations: ["quarter", "eighth", "eighth", "eighth", "eighth", "quarter", "quarter", "quarter", "eighth", "eighth", "eighth", "eighth", "quarter", "quarter"] },
  { level: [6, 8], title: "Czerny turn study", degrees: [1, 2, 3, 5, 4, 3, 2, 1, 3, 4, 5, 7, 6, 5, 4, 3], durations: [] },
  { level: [7, 9], title: "Greensleeves-style minor phrase", degrees: [6, 1, 2, 3, 4, 3, 2, 7, 5, 6, 7, 1], durations: ["eighth", "quarter", "eighth", "quarter", "quarter", "eighth", "eighth", "quarter", "eighth", "quarter", "eighth", "half"], minor: true },
  { level: [8, 10], title: "Fur Elise turn fragment", degrees: [5, 4, 5, 4, 5, 7, 4, 3, 1, 3, 5, 7], durations: ["eighth", "eighth", "eighth", "eighth", "eighth", "eighth", "eighth", "eighth", "quarter", "quarter", "quarter", "quarter"], minor: true, chromatic: true },
  { level: [9, 11], title: "Pachelbel progression study", progression: [1, 5, 6, 3, 4, 1, 4, 5] },
  { level: [10, 12], title: "Burgmuller-style arioso", degrees: [1, 5, 3, 8, 7, 5, 6, 4, 5, 3, 4, 2, 1], durations: ["eighth", "eighth", "eighth", "quarter", "eighth", "eighth", "eighth", "quarter", "eighth", "eighth", "eighth", "quarter", "half"] },
  { level: [11, 13], title: "Sonatina broken-chord study", progression: [1, 4, 2, 5, 1, 6, 2, 5] },
  { level: [12, 14], title: "Bach invention-style exchange", degrees: [1, 2, 3, 5, 4, 3, 6, 5, 4, 2, 3, 1], durations: [] },
  { level: [13, 15], title: "Chopin prelude-style accompaniment", progression: [1, 5, 6, 4, 2, 5, 1, 1], minor: true },
  { level: [14, 16], title: "Mozart sonata-style passage", degrees: [1, 3, 5, 8, 7, 6, 5, 4, 3, 5, 4, 2, 1, 7, 1, 3], durations: [] },
  { level: [15, 17], title: "Czerny velocity etude", degrees: [1, 3, 5, 8, 10, 8, 5, 3, 2, 4, 6, 9, 11, 9, 6, 4], durations: [] },
  { level: [16, 18], title: "Bach prelude arpeggio study", progression: [1, 2, 5, 1, 6, 2, 5, 1] },
  { level: [17, 19], title: "Chopin etude-style figuration", progression: [1, 5, 6, 3, 4, 2, 5, 1], minor: true },
  { level: [18, 20], title: "Liszt-style octave and chord study", progression: [1, 6, 4, 2, 5, 1, 3, 6] },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(probability) {
  return Math.random() < probability;
}

function midiFromKey(keyName) {
  const match = keyName.match(/^([A-G]#?)(\d)$/);
  if (!match) return 60;
  return (Number(match[2]) + 1) * 12 + NOTE_NAMES.indexOf(match[1]);
}

function safeMidiToKey(midi) {
  return midiToKey(Math.max(21, Math.min(108, midi)));
}

function keyFor(level, depth, preferMinor = false) {
  const candidates = KEYS.filter(key => !preferMinor || key.name.includes("minor"));
  const pool = level < 4
    ? candidates.filter(key => ["C", "G"].includes(key.name))
    : level < 8
      ? candidates.filter(key => ["C", "G", "F", "D"].includes(key.name))
      : candidates;
  return pick(pool.length ? pool : candidates);
}

function diatonicMidi(key, degree, hand = "right", octaveShift = 0) {
  const zeroBased = degree - 1;
  const octave = Math.floor(zeroBased / 7) + octaveShift;
  const index = ((zeroBased % 7) + 7) % 7;
  const root = hand === "left" ? key.leftRoot : key.rightRoot;
  return root + key.scale[index] + octave * 12;
}

function degreeToKey(key, degree, hand = "right", octaveShift = 0) {
  return safeMidiToKey(diatonicMidi(key, degree, hand, octaveShift));
}

function chromaticNeighbor(keyName, direction = 1) {
  return safeMidiToKey(midiFromKey(keyName) + direction);
}

function chordForDegree(key, degree, hand = "right", size = 3, octaveShift = 0) {
  return [degree, degree + 2, degree + 4, degree + 6, degree + 8]
    .slice(0, size)
    .map(d => degreeToKey(key, d, hand, octaveShift));
}

function durationsFor(level, depth, length, motifDurations = []) {
  if (motifDurations.length >= length && depth < 3) return motifDurations.slice(0, length);
  if (level <= 2 && depth < 3) return Array(length).fill("quarter");
  if (level <= 4 && depth < 6) return Array.from({ length }, (_, index) => index % 4 === 3 ? "half" : "quarter");
  if (level <= 8) return Array.from({ length }, (_, index) => index % 4 === 0 && depth > 5 ? "quarter" : "eighth");
  if (level <= 12) return Array.from({ length }, (_, index) => index % 6 === 0 ? "quarter" : "eighth");
  if (level <= 15) return Array.from({ length }, (_, index) => index % 5 === 0 ? "eighth" : "sixteenth");
  return Array.from({ length }, (_, index) => index % 7 === 0 ? "eighth" : "sixteenth");
}

function splitEvents(groups, durations, maxMeasures) {
  const measures = [];
  let current = [];
  let beat = 1;

  for (let index = 0; index < groups.length; index++) {
    const duration = durations[index] || "quarter";
    const durationBeats = DURATION_BEATS[duration] || 1;
    if (beat + durationBeats > 5 && current.length) {
      measures.push(current);
      current = [];
      beat = 1;
    }
    current.push(note(Array.isArray(groups[index]) ? groups[index] : [groups[index]], duration, beat));
    beat += durationBeats;
    if (measures.length >= maxMeasures) break;
  }

  if (current.length && measures.length < maxMeasures) measures.push(current);
  while (measures.length < maxMeasures) measures.push([rest("whole", 1)]);
  return measures;
}

function shapeDegrees(motif, level, depth) {
  const source = motif.degrees || [1, 2, 3, 5, 4, 3, 2, 1];
  const targetLength = Math.min(48, Math.max(source.length, 4 + level + depth * 2));
  const out = [];
  for (let index = 0; out.length < targetLength; index++) {
    const base = source[index % source.length];
    const phraseShift = Math.floor(index / source.length);
    const depthShift = depth >= 6 && index % 5 === 2 ? 7 : 0;
    const levelShift = level >= 14 && index % 7 === 3 ? 7 : 0;
    out.push(base + phraseShift % 2 + depthShift + levelShift);
  }
  return out;
}

function melodyMeasures({ motif, key, level, depth, hand }) {
  const degrees = shapeDegrees(motif, level, depth);
  const notes = degrees.map((degree, index) => {
    const octaveShift = level >= 12 && index % 6 > 3 ? 1 : 0;
    const base = degreeToKey(key, degree, hand, octaveShift);
    if ((motif.chromatic || level >= 9) && depth >= 4 && index % 6 === 1) {
      return chromaticNeighbor(base, chance(0.5) ? 1 : -1);
    }
    return base;
  });
  const measureCount = Math.min(6, Math.max(1, Math.ceil((level + depth) / 5)));
  return splitEvents(notes, durationsFor(level, depth, notes.length, motif.durations), measureCount);
}

function accompanimentFor({ motif, key, level, depth, measureCount }) {
  const progression = motif.progression || [1, 4, 5, 1, 6, 2, 5, 1];
  return Array.from({ length: measureCount }, (_, measureIndex) => {
    const degree = progression[measureIndex % progression.length];
    if (level <= 4) return [note([degreeToKey(key, degree, "left")], "whole", 1)];
    if (level <= 7) {
      return [
        note([degreeToKey(key, degree, "left")], "half", 1),
        note([degreeToKey(key, degree + 4, "left")], "half", 3),
      ];
    }
    if (level <= 12) {
      return [
        note([degreeToKey(key, degree, "left")], "eighth", 1),
        note([degreeToKey(key, degree + 4, "left")], "eighth", 1.5),
        note([degreeToKey(key, degree + 2, "left")], "eighth", 2),
        note([degreeToKey(key, degree + 4, "left")], "eighth", 2.5),
        note([degreeToKey(key, degree, "left")], "eighth", 3),
        note([degreeToKey(key, degree + 4, "left")], "eighth", 3.5),
        note([degreeToKey(key, degree + 2, "left")], "eighth", 4),
        note([degreeToKey(key, degree + 4, "left")], "eighth", 4.5),
      ];
    }
    if (level <= 16) {
      return [
        note(chordForDegree(key, degree, "left", 3), "quarter", 1),
        note([degreeToKey(key, degree + 7, "left")], "eighth", 2),
        note([degreeToKey(key, degree + 4, "left")], "eighth", 2.5),
        note(chordForDegree(key, degree + 3, "left", 3), "quarter", 3),
        note(chordForDegree(key, degree + 5, "left", 3), "quarter", 4),
      ];
    }
    return [
      note([degreeToKey(key, degree, "left")], "sixteenth", 1),
      note([degreeToKey(key, degree + 4, "left")], "sixteenth", 1.25),
      note([degreeToKey(key, degree + 2, "left")], "sixteenth", 1.5),
      note([degreeToKey(key, degree + 7, "left")], "sixteenth", 1.75),
      note(chordForDegree(key, degree, "left", level >= 18 ? 4 : 3), "quarter", 2),
      note([degreeToKey(key, degree + 9, "left")], "eighth", 3),
      note(chordForDegree(key, degree + 4, "left", level >= 19 ? 4 : 3), "quarter", 4),
    ];
  });
}

function progressionStudy({ motif, key, level, depth, hand }) {
  const progression = motif.progression || [1, 4, 5, 1];
  const measureCount = Math.min(6, Math.max(2, Math.ceil((level + depth) / 5)));
  const right = Array.from({ length: measureCount }, (_, measureIndex) => {
    const degree = progression[measureIndex % progression.length];
    if (level < 12) {
      return [
        note(chordForDegree(key, degree, "right", level >= 10 ? 4 : 3), "quarter", 1),
        note(chordForDegree(key, progression[(measureIndex + 1) % progression.length], "right", 3), "quarter", 2),
        note([degreeToKey(key, degree + 7, "right")], "quarter", 3),
        note(chordForDegree(key, degree, "right", 3), "quarter", 4),
      ];
    }
    return [
      note(chordForDegree(key, degree, "right", 4, level >= 16 ? 1 : 0), "eighth", 1),
      note([degreeToKey(key, degree + 8, "right", 1)], "sixteenth", 1.5),
      note([degreeToKey(key, degree + 6, "right", 1)], "sixteenth", 1.75),
      note(chordForDegree(key, progression[(measureIndex + 1) % progression.length], "right", 4), "quarter", 2),
      note([chromaticNeighbor(degreeToKey(key, degree + 4, "right", 1), 1)], "eighth", 3),
      note(chordForDegree(key, degree + 2, "right", 4), "quarter", 4),
    ];
  });

  const left = accompanimentFor({ motif, key, level, depth, measureCount });
  if (hand === "right") return right.map((events, index) => ({ number: index + 1, rightHand: events, leftHand: [] }));
  if (hand === "left") return left.map((events, index) => ({ number: index + 1, rightHand: [], leftHand: events }));
  return right.map((events, index) => ({ number: index + 1, rightHand: events, leftHand: left[index] || [] }));
}

export function generateRepertoireExercise({ level, hand = "right", depth = 0 } = {}) {
  const l = Math.max(1, Math.min(20, Number(level) || 1));
  const d = Math.max(0, Math.min(9, Number(depth) || 0));
  const requestedHand = hand === "left" ? "left" : hand === "both" ? "both" : "right";
  const pool = REPERTOIRE_MOTIFS.filter(motif => l >= motif.level[0] && l <= motif.level[1]);
  const motif = pick(pool.length ? pool : REPERTOIRE_MOTIFS);
  const key = keyFor(l, d, motif.minor);
  const measureCountHint = Math.min(6, Math.max(1, Math.ceil((l + d) / 5)));

  let measures;
  if (motif.progression) {
    measures = progressionStudy({ motif, key, level: l, depth: d, hand: requestedHand });
  } else {
    const rightMeasures = melodyMeasures({ motif, key, level: l, depth: d, hand: "right" });
    const leftMeasures = requestedHand === "left"
      ? melodyMeasures({ motif, key, level: l, depth: d, hand: "left" })
      : accompanimentFor({ motif, key, level: l, depth: d, measureCount: Math.max(measureCountHint, rightMeasures.length) });

    if (requestedHand === "right") {
      measures = rightMeasures.map((events, index) => ({ number: index + 1, rightHand: events, leftHand: [] }));
    } else if (requestedHand === "left") {
      measures = leftMeasures.map((events, index) => ({ number: index + 1, rightHand: [], leftHand: events }));
    } else {
      const count = Math.max(rightMeasures.length, leftMeasures.length);
      measures = Array.from({ length: count }, (_, index) => ({
        number: index + 1,
        rightHand: rightMeasures[index] || [],
        leftHand: leftMeasures[index] || [],
      }));
    }
  }

  return makeExercise({
    level: l,
    mode: requestedHand,
    type: requestedHand === "both" ? (l >= 15 ? "virtuoso" : "two-hand") : l >= 9 ? "sequence" : "single-note",
    title: `${motif.title} - depth ${d + 1}`,
    keySignature: key.name,
    difficultyScore: Math.min(120, l * 5 + d * 4 + (requestedHand === "both" ? 10 : 0)),
    measures,
    hint: "Public-domain repertoire style, transformed for practice.",
    requiredAccuracy: l >= 16 ? 0.9 : l >= 10 ? 0.86 : 0.8,
    timeLimit: l >= 18 ? 30 : null,
  });
}
