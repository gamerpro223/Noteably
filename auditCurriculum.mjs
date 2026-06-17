import { generateExercise } from "../src/lib/exerciseBank.js";
import { analyzeExercise } from "../src/lib/musicData.js";
import { getCurriculumLevel, measureCountFor, minNotesFor } from "../src/lib/curriculum.js";

const HANDS = ["right", "left", "both"];
const DEPTHS = [0, 4, 9];
const SAMPLES = 10;
const failures = [];

function fail(message, details) {
  failures.push(`${message}: ${details}`);
}

for (let level = 1; level <= 20; level += 1) {
  const spec = getCurriculumLevel(level);
  for (const hand of HANDS) {
    for (const depth of DEPTHS) {
      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const exercise = generateExercise(level, hand, { depth });
        const analysis = analyzeExercise(exercise);
        const minMeasures = measureCountFor(level, depth);
        const minNotes = minNotesFor(level, depth);

        if (exercise.mode !== hand) {
          fail("hand mode mismatch", `level ${level}, hand ${hand}, got ${exercise.mode}`);
        }
        if (analysis.hands !== hand) {
          fail("rendered hands mismatch", `level ${level}, hand ${hand}, got ${analysis.hands}, ${exercise.title}`);
        }
        if (analysis.measureCount < minMeasures) {
          fail("too few measures", `level ${level}, depth ${depth}, got ${analysis.measureCount}, expected ${minMeasures}`);
        }
        if (analysis.noteCount < minNotes) {
          fail("too few notes", `level ${level}, depth ${depth}, got ${analysis.noteCount}, expected ${minNotes}, ${exercise.title}`);
        }
        if (level >= 9 && analysis.noteCount <= 6) {
          fail("advanced level collapsed", `level ${level}, got ${analysis.noteCount} notes, ${exercise.title}`);
        }
        if (level >= 12 && hand === "both" && analysis.handIndependenceScore < 3) {
          fail("two-hand level missing both hands", `level ${level}, ${exercise.title}`);
        }
        if (level >= 11 && !["sequence", "two-hand", "virtuoso", "chord", "mixed"].includes(exercise.type)) {
          fail("unexpected type", `level ${level}, type ${exercise.type}, expected ${spec.type}-style material`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`Curriculum audit failed with ${failures.length} issue(s).`);
  for (const item of failures.slice(0, 50)) console.error(`- ${item}`);
  if (failures.length > 50) console.error(`...and ${failures.length - 50} more.`);
  process.exit(1);
}

console.log(`Curriculum audit passed: ${20 * HANDS.length * DEPTHS.length * SAMPLES} generated exercises checked.`);
