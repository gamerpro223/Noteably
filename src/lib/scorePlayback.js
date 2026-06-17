// ══════════════════════════════════════════════════════════════════════════
// scorePlayback.js — Real score playback engine
// Reads ScoreExercise data directly and schedules every note event using
// the Web Audio API clock for sample-accurate timing.
// ══════════════════════════════════════════════════════════════════════════

import { DURATION_BEATS, keyToMidi } from "./musicData.js";
import { playPianoNote, stopAllNotes } from "./pianoSampler.js";

// Default tempo if not specified
const DEFAULT_TEMPO = 76; // BPM

// How long (in beats) a note sounds relative to its notated duration
const LEGATO = 0.88;

// Pre-warm audio context and pre-fetch samples for notes in an exercise
async function prewarmExercise(exercise) {
  const keys = new Set();
  for (const m of (exercise.measures || [])) {
    for (const ev of [...(m.rightHand || []), ...(m.leftHand || [])]) {
      if (!ev.rest) ev.keys.forEach(k => keys.add(k));
    }
  }
  const { preloadNotes } = await import("./pianoSampler.js");
  await preloadNotes([...keys]);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build a flat list of scheduled events from a ScoreExercise.
 * Returns Array<{ startBeat, durationBeats, keys, hand }>
 */
function buildSchedule(exercise) {
  const events = [];
  const beatsPerMeasure = exercise.timeSignature === "3/4" ? 3 : 4;
  let measureOffset = 0; // cumulative beats before this measure

  for (const measure of (exercise.measures || [])) {
    // Process both hands
    for (const [handKey, hand] of [["right", measure.rightHand], ["left", measure.leftHand]]) {
      for (const ev of (hand || [])) {
        if (ev.rest || !ev.keys || ev.keys.length === 0) continue;
        const durBeats = DURATION_BEATS[ev.duration] || 1;
        const startBeat = measureOffset + (ev.beat - 1); // beat is 1-based
        events.push({
          startBeat,
          durationBeats: durBeats,
          keys: ev.keys,
          hand: handKey,
        });
      }
    }
    measureOffset += beatsPerMeasure;
  }

  // Sort by start time so debug output is clean
  events.sort((a, b) => a.startBeat - b.startBeat);
  return events;
}

/**
 * Convert beats to seconds.
 */
function beatsToSeconds(beats, tempo) {
  return beats * (60 / tempo);
}

/**
 * Playback controller returned by playExercise().
 * .stop() cancels all pending scheduled notes.
 */
class PlaybackController {
  constructor() {
    this._stopped = false;
    this._timeouts = [];
  }
  _schedule(fn, delayMs) {
    if (this._stopped) return;
    const id = setTimeout(fn, delayMs);
    this._timeouts.push(id);
  }
  stop() {
    this._stopped = true;
    this._timeouts.forEach(id => clearTimeout(id));
    this._timeouts = [];
    stopAllNotes();
  }
  get stopped() { return this._stopped; }
}

/**
 * Play a ScoreExercise end-to-end.
 *
 * @param {object} exercise   - ScoreExercise from exerciseBank
 * @param {object} options
 *   tempo          {number}   BPM (default 72)
 *   onBeat         {function} called with currentBeat (for highlighting)
 *   onFinish       {function} called when all notes have been played
 *   onNoteOn       {function} called with { keys, hand, beat } for each event
 *
 * @returns {PlaybackController}
 */
export function playExercise(exercise, options = {}) {
  // Scale tempo by level — higher levels play faster, feels more musical
  const levelTempo = exercise.level
    ? Math.min(120, DEFAULT_TEMPO + (exercise.level - 1) * 3)
    : DEFAULT_TEMPO;
  const tempo = options.tempo || exercise.tempo || levelTempo;
  const onBeat = options.onBeat || null;
  const onFinish = options.onFinish || null;
  const onNoteOn = options.onNoteOn || null;
  const onReady = options.onReady || null;
  const maxPreloadMs = options.maxPreloadMs ?? 900;

  // Stop anything currently playing
  stopAllNotes();

  const controller = new PlaybackController();

  const schedule = buildSchedule(exercise);

  if (options.debug) {
    console.log(`[scorePlayback] Exercise: "${exercise.title}" | key: ${exercise.keySignature} | tempo: ${tempo} | measures: ${exercise.measures?.length} | events: ${schedule.length}`);
    schedule.forEach(ev => {
      console.log(`  beat ${ev.startBeat.toFixed(2)} [${ev.hand}] keys: ${ev.keys.join(",")} dur: ${ev.durationBeats}b`);
    });
  }

  if (schedule.length === 0) {
    onFinish?.();
    return controller;
  }

  const totalBeats = schedule.reduce((max, ev) => Math.max(max, ev.startBeat + ev.durationBeats), 0);
  const totalMs = beatsToSeconds(totalBeats, tempo) * 1000;

  async function startScheduledPlayback() {
    await Promise.race([
      prewarmExercise(exercise).catch(() => {}),
      delay(maxPreloadMs),
    ]);
    if (controller.stopped) return;
    onReady?.();

    // Small lead-in after preload so the UI can update before the first note.
    const LEAD_IN_MS = 120;

    for (const ev of schedule) {
      const delayMs = LEAD_IN_MS + beatsToSeconds(ev.startBeat, tempo) * 1000;
      const durationSec = beatsToSeconds(ev.durationBeats * LEGATO, tempo);

      controller._schedule(() => {
        if (controller.stopped) return;
        onNoteOn?.({ keys: ev.keys, hand: ev.hand, beat: ev.startBeat });
        for (const key of ev.keys) {
          playPianoNote(key, Math.max(durationSec, 0.35), 0.88);
        }
      }, delayMs);
    }

    const beatsPerMeasure = exercise.timeSignature === "3/4" ? 3 : 4;
    const totalQBeats = exercise.measures.length * beatsPerMeasure;
    for (let b = 0; b < totalQBeats; b += 0.25) {
      const beatMs = LEAD_IN_MS + beatsToSeconds(b, tempo) * 1000;
      controller._schedule(() => {
        if (!controller.stopped) onBeat?.(b);
      }, beatMs);
    }

    controller._schedule(() => {
      if (!controller.stopped) {
        onFinish?.();
      }
    }, LEAD_IN_MS + totalMs + 200);
  }

  startScheduledPlayback();

  return controller;
}

/**
 * Get all unique note keys scheduled at a given beat (for highlighting).
 * Returns { right: string[], left: string[] }
 */
export function getNotesAtBeat(schedule, beat, tolerance = 0.13) {
  const right = [], left = [];
  for (const ev of schedule) {
    if (Math.abs(ev.startBeat - beat) <= tolerance) {
      if (ev.hand === "right") right.push(...ev.keys);
      else left.push(...ev.keys);
    }
  }
  return { right, left };
}

/**
 * Pre-build schedule for highlighting without playing.
 */
export { buildSchedule };
