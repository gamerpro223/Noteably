import { DURATION_BEATS } from "./musicData.js";

function uniquePush(list, value) {
  if (!list.includes(value)) list.push(value);
}

function beatKey(beat) {
  return String(Math.round(beat * 1000));
}

function beatsPerMeasure(exercise) {
  return exercise?.timeSignature === "3/4" ? 3 : 4;
}

export function buildAnswerSteps(exercise) {
  if (!exercise?.measures?.length) {
    return (exercise?.notes || []).map((key, index) => ({
      index,
      beat: index,
      keys: [key],
      hands: ["right"],
      events: [{ hand: "right", keys: [key], beat: index }],
    }));
  }

  const groups = new Map();
  const measureBeats = beatsPerMeasure(exercise);

  exercise.measures.forEach((measure, measureIndex) => {
    const measureOffset = measureIndex * measureBeats;

    for (const [hand, events] of [["right", measure.rightHand || []], ["left", measure.leftHand || []]]) {
      for (const event of events) {
        if (event.rest || !event.keys?.length) continue;

        const absoluteBeat = measureOffset + ((event.beat || 1) - 1);
        const key = beatKey(absoluteBeat);
        const group = groups.get(key) || {
          beat: absoluteBeat,
          keys: [],
          hands: [],
          events: [],
        };

        event.keys.forEach(noteName => uniquePush(group.keys, noteName));
        uniquePush(group.hands, hand);
        group.events.push({
          hand,
          keys: [...event.keys],
          beat: absoluteBeat,
          duration: event.duration,
          durationBeats: DURATION_BEATS[event.duration] || 1,
        });

        groups.set(key, group);
      }
    }
  });

  return [...groups.values()]
    .sort((a, b) => a.beat - b.beat)
    .map((step, index) => ({ ...step, index }));
}

export function createAnswerState() {
  return {
    stepIndex: 0,
    currentKeys: [],
    completedKeys: [],
  };
}

export function getAnswerProgressNotes(state) {
  const notes = [];
  for (const noteName of [...(state?.completedKeys || []), ...(state?.currentKeys || [])]) {
    uniquePush(notes, noteName);
  }
  return notes;
}

export function getAnswerPreviewNotes(exercise) {
  return buildAnswerSteps(exercise).flatMap(step => step.keys);
}

function completeCurrentStep(state, step) {
  return {
    stepIndex: state.stepIndex + 1,
    currentKeys: [],
    completedKeys: [...state.completedKeys, ...step.keys],
  };
}

function startFromFirstStep(steps, noteName) {
  const first = steps[0];
  if (!first?.keys.includes(noteName)) {
    return createAnswerState();
  }

  const state = {
    stepIndex: 0,
    currentKeys: [noteName],
    completedKeys: [],
  };

  return first.keys.every(key => state.currentKeys.includes(key))
    ? completeCurrentStep(state, first)
    : state;
}

export function applyAnswerNote(exercise, state, noteName) {
  const steps = buildAnswerSteps(exercise);
  const safeState = state || createAnswerState();

  if (!steps.length || !noteName) {
    return {
      state: safeState,
      complete: false,
      accepted: false,
      detectedNotes: getAnswerProgressNotes(safeState),
      steps,
    };
  }

  const currentStep = steps[safeState.stepIndex];
  if (!currentStep) {
    return {
      state: safeState,
      complete: true,
      accepted: false,
      detectedNotes: getAnswerProgressNotes(safeState),
      steps,
    };
  }

  let nextState = safeState;
  let accepted = false;

  if (currentStep.keys.includes(noteName)) {
    accepted = true;
    const currentKeys = [...safeState.currentKeys];
    uniquePush(currentKeys, noteName);
    nextState = { ...safeState, currentKeys };

    if (currentStep.keys.every(key => currentKeys.includes(key))) {
      nextState = completeCurrentStep(nextState, currentStep);
    }
  } else {
    nextState = startFromFirstStep(steps, noteName);
  }

  const complete = nextState.stepIndex >= steps.length;

  return {
    state: nextState,
    complete,
    accepted,
    detectedNotes: getAnswerProgressNotes(nextState),
    steps,
  };
}
