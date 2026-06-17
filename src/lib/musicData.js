// ══════════════════════════════════════════════════════════════════════════
// musicData.js — Structured ScoreExercise format + all note/pitch data
// ══════════════════════════════════════════════════════════════════════════

// MIDI note number → note info
export const MIDI_TO_NOTE = {};
export const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

for (let midi = 21; midi <= 108; midi++) {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  const key = `${name}${octave}`;
  MIDI_TO_NOTE[midi] = { midi, pitch: name.replace("#",""), accidental: name.includes("#") ? "#" : null, octave, key };
}

export function midiToKey(midi) {
  const n = MIDI_TO_NOTE[midi];
  return n ? n.key : null;
}

export function keyToMidi(key) {
  const m = key.match(/^([A-G]#?)(\d)$/);
  if (!m) return 60;
  const noteIdx = NOTE_NAMES.indexOf(m[1]);
  return (parseInt(m[2]) + 1) * 12 + noteIdx;
}

// Duration: "whole"=4, "half"=2, "quarter"=1, "eighth"=0.5, "sixteenth"=0.25
export const DURATION_BEATS = {
  whole: 4, half: 2, "dotted-half": 3,
  quarter: 1, "dotted-quarter": 1.5,
  eighth: 0.5, "dotted-eighth": 0.75,
  sixteenth: 0.25, triplet: 1/3,
};

/**
 * Create a note event
 * @param {string[]} keys - array of note keys e.g. ["C4"], ["E4","G4","C5"]
 * @param {string} duration - "quarter", "eighth", etc.
 * @param {number} beat - beat position (1-based)
 */
export function note(keys, duration = "quarter", beat = 1) {
  return { keys, duration, beat, rest: false };
}

export function rest(duration = "quarter", beat = 1) {
  return { keys: [], duration, beat, rest: true };
}

/**
 * Create a ScoreExercise
 */
export function makeExercise({
  level, mode, type, title, keySignature = "C",
  timeSignature = "4/4", difficultyScore = 50,
  measures, hint = "", requiredAccuracy = 0.8, maxMistakes = 3, timeLimit = null,
}) {
  return {
    id: Math.random().toString(36).slice(2),
    level, mode, type, title, keySignature, timeSignature,
    difficultyScore, measures, hint, requiredAccuracy, maxMistakes, timeLimit,
    // flat note list for pitch detection compat
    notes: extractNotes(measures, mode),
    trebleNotes: extractNotes(measures, mode, "right"),
    bassNotes: extractNotes(measures, mode, "left"),
    description: title,
  };
}

function extractNotes(measures, mode, hand = null) {
  const out = [];
  for (const m of measures) {
    const events = hand === "left" ? m.leftHand : (hand === "right" ? m.rightHand : [...(m.rightHand||[]), ...(m.leftHand||[])]);
    for (const ev of (events || [])) {
      if (!ev.rest) for (const k of ev.keys) if (!out.includes(k)) out.push(k);
    }
  }
  return out;
}

// ── Score analysis helpers ────────────────────────────────────────────────
export function analyzeExercise(ex) {
  let noteCount = 0, chordCount = 0, accidentalCount = 0;
  let maxLeap = 0, rhythmTypes = new Set();
  let prevMidi = null;

  for (const m of ex.measures) {
    for (const hand of ["rightHand", "leftHand"]) {
      for (const ev of (m[hand] || [])) {
        if (ev.rest) continue;
        rhythmTypes.add(ev.duration);
        if (ev.keys.length > 1) chordCount++;
        for (const k of ev.keys) {
          noteCount++;
          if (k.includes("#")) accidentalCount++;
          const midi = keyToMidi(k);
          if (prevMidi !== null) maxLeap = Math.max(maxLeap, Math.abs(midi - prevMidi));
          prevMidi = midi;
        }
      }
    }
  }

  const rhythmComplexity = [
    rhythmTypes.has("sixteenth"), rhythmTypes.has("eighth"),
    rhythmTypes.has("triplet"), rhythmTypes.has("dotted-quarter"),
    rhythmTypes.size > 3,
  ].filter(Boolean).length;

  const leftHasNotes = ex.measures.some(m => m.leftHand?.some(e => !e.rest && e.keys.length > 0));
  const rightHasNotes = ex.measures.some(m => m.rightHand?.some(e => !e.rest && e.keys.length > 0));

  return {
    noteCount,
    measureCount: ex.measures.length,
    chordCount,
    avgNotesPerBeat: noteCount / (ex.measures.length * (ex.timeSignature === "4/4" ? 4 : 3)),
    maxLeap,
    rhythmComplexityScore: rhythmComplexity,
    handIndependenceScore: leftHasNotes && rightHasNotes ? 3 : 1,
    accidentalDensity: noteCount > 0 ? (accidentalCount / noteCount).toFixed(2) : 0,
    hands: leftHasNotes && rightHasNotes ? "both" : leftHasNotes ? "left" : "right",
  };
}