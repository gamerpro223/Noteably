// ══════════════════════════════════════════════════════════════════════════
// exerciseBank.js — Realistic multi-measure exercise generators per level
// Each generator returns a ScoreExercise with full measures/rhythms/grand staff
// ══════════════════════════════════════════════════════════════════════════

import { note, rest, makeExercise } from "./musicData.js";
import { generateRuleBasedExercise, generateRuleBasedChopinExercise } from "./levelGenerator.js";
import { generateCurriculumExercise } from "./curriculumGenerator.js";
import { minNotesFor } from "./curriculum.js";

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const c = [...arr]; const out = [];
  for (let i = 0; i < n && c.length; i++) out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]);
  return out;
}
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ── Level 1: First Notes ──────────────────────────────────────────────────
// Single notes C4–G4, quarter notes only, 1 measure
export function gen1(hand) {
  const pool = hand === "left" ? ["C3","D3","E3","F3","G3"] : ["C4","D4","E4","F4","G4"];
  const n = pick(pool);
  return makeExercise({
    level: 1, mode: hand, type: "single-note",
    title: `Play ${fmt(n)}`,
    difficultyScore: 5,
    measures: [{ number: 1,
      rightHand: hand !== "left" ? [note([n], "quarter", 1), rest("quarter",2), rest("quarter",3), rest("quarter",4)] : [],
      leftHand:  hand === "left"  ? [note([n], "quarter", 1), rest("quarter",2), rest("quarter",3), rest("quarter",4)] : [],
    }],
    hint: `Find ${fmt(n)} near Middle C`,
  });
}

// ── Level 2: Wider Notes ──────────────────────────────────────────────────
// Single notes C4–C5 / full octave, 1 measure
export function gen2(hand) {
  const pool = hand === "left" ? ["C3","D3","E3","F3","G3","A3","B3","C4"] : ["C4","D4","E4","F4","G4","A4","B4","C5"];
  const n = pick(pool);
  return makeExercise({
    level: 2, mode: hand, type: "single-note",
    title: `Play ${fmt(n)}`,
    difficultyScore: 8,
    measures: [{ number: 1,
      rightHand: hand !== "left" ? [note([n],"quarter",1), rest("quarter",2), rest("half",3)] : [],
      leftHand:  hand === "left"  ? [note([n],"quarter",1), rest("quarter",2), rest("half",3)] : [],
    }],
    hint: `White key — ${fmt(n)}`,
  });
}

// ── Level 3: Mini Sequences ───────────────────────────────────────────────
// 3–4 note stepwise, quarter + half notes, 1–2 measures
export function gen3(hand) {
  const whites = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","B3"]
    : ["C4","D4","E4","F4","G4","A4","B4","C5"];
  const start = Math.floor(Math.random() * (whites.length - 3));
  const dir = Math.random() > 0.5 ? 1 : -1;
  const seq = [whites[start], whites[start+dir], whites[start+2*dir]].filter(Boolean);
  const events1 = seq.map((n,i) => note([n], i===seq.length-1?"half":"quarter", i+1));
  return makeExercise({
    level: 3, mode: hand, type: "sequence",
    title: `${dir>0?"Ascending":"Descending"} steps`,
    difficultyScore: 14,
    measures: [{ number: 1,
      rightHand: hand !== "left" ? events1 : [],
      leftHand:  hand === "left"  ? events1 : [],
    }],
    hint: seq.map(fmt).join(" → "),
  });
}

// ── Level 4: Skips ────────────────────────────────────────────────────────
// 2-measure phrase with 3rd/4th/5th skips, quarter notes
export function gen4(hand) {
  const whites = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","B3"]
    : ["C4","D4","E4","F4","G4","A4","B4"];
  const skipSizes = [2, 3, 4]; // white key skips
  const root = whites[Math.floor(Math.random()*4)];
  const ri = whites.indexOf(root);
  const sk = pick(skipSizes);
  const top = whites[Math.min(whites.length-1, ri+sk)];
  const back = whites[Math.max(0, ri+sk-1)];
  const m1 = [root, top, root, back].map((n,i) => note([n],"quarter",i+1));
  const m2 = [back, root, top, root].map((n,i) => note([n],"quarter",i+1));
  return makeExercise({
    level: 4, mode: hand, type: "sequence",
    title: `Skip pattern — ${fmt(root)} to ${fmt(top)}`,
    difficultyScore: 20,
    measures: [
      { number: 1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number: 2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: `Skip of a ${sk===2?"3rd":sk===3?"4th":"5th"}`,
  });
}

// ── Level 5: First Chords ─────────────────────────────────────────────────
// Two-note intervals and basic triads, root position only
export function gen5(hand) {
  const roots = hand === "left"
    ? ["C3","D3","E3","F3","G3"]
    : ["C4","D4","F4","G4","A4"];
  const r = pick(roots);
  const whites = ["C","D","E","F","G","A","B"];
  const oct = parseInt(r.slice(-1));
  const ridx = whites.indexOf(r[0]);
  const third = whites[(ridx+2)%7]+(ridx+2>6?oct+1:oct);
  const fifth = whites[(ridx+4)%7]+(ridx+4>6?oct+1:oct);
  const triad = [r, third, fifth];
  const isMaj = Math.random() > 0.4;
  return makeExercise({
    level: 5, mode: hand, type: "chord",
    title: `${fmt(r)} ${isMaj?"Major":"minor"} triad`,
    difficultyScore: 28,
    measures: [{ number: 1,
      rightHand: hand!=="left"?[note(triad,"whole",1)]:[],
      leftHand:  hand==="left" ?[note(triad,"whole",1)]:[],
    }],
    hint: triad.map(fmt).join(" – "),
  });
}

// ── Level 6: Mixed Notes and Chords ───────────────────────────────────────
// Alternates single note and chord, 2 measures
export function gen6(hand) {
  const roots = hand==="left"?["C3","D3","G3"]:["C4","D4","E4","G4","A4"];
  const r = pick(roots);
  const whites = ["C","D","E","F","G","A","B"];
  const oct = parseInt(r.slice(-1));
  const ridx = whites.indexOf(r[0]);
  const third = whites[(ridx+2)%7]+(ridx+2>6?oct+1:oct);
  const fifth = whites[(ridx+4)%7]+(ridx+4>6?oct+1:oct);
  const above = whites[(ridx+1)%7]+(ridx+1>6?oct+1:oct);
  const m1 = [note([r],"quarter",1), note([above],"quarter",2), note([r,third,fifth],"half",3)];
  const m2 = [note([r,third,fifth],"quarter",1), note([above],"quarter",2), note([r],"half",3)];
  return makeExercise({
    level: 6, mode: hand, type: "mixed",
    title: `Notes and chords: ${fmt(r)}`,
    difficultyScore: 35,
    measures: [
      { number:1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number:2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: `${fmt(r)} triad mixed with melody`,
  });
}

// ── Level 7: Real Phrases ─────────────────────────────────────────────────
// 2 measures, quarter + eighth notes, small jumps, occasional accidental
export function gen7(hand) {
  const patterns = [
    { notes:["E4","F4","G4","A4","G4","F4","E4","D4"], durations:["quarter","eighth","eighth","quarter","eighth","eighth","quarter","quarter"] },
    { notes:["C4","E4","G4","A4","F4","E4","D4","C4"], durations:["quarter","quarter","eighth","eighth","quarter","quarter","eighth","eighth"] },
    { notes:["G4","A4","B4","C5","B4","A4","G4","F4"], durations:["quarter","eighth","eighth","quarter","quarter","eighth","eighth","half"] },
    { notes:["D4","E4","F4","G4","A4","G4","F4","E4"], durations:["eighth","eighth","quarter","quarter","quarter","eighth","eighth","quarter"] },
    { notes:["C4","D4","E4","F#4","G4","A4","G4","E4"], durations:["quarter","quarter","eighth","eighth","quarter","eighth","eighth","quarter"] },
  ];
  const p = pick(patterns);
  const half = Math.floor(p.notes.length/2);
  function toEvents(ns, ds, startBeat=1) {
    let b = startBeat;
    return ns.map((n,i) => { const ev = note([n],ds[i],b); b += ds[i]==="eighth"?0.5:1; return ev; });
  }
  const ev1 = toEvents(p.notes.slice(0,half), p.durations.slice(0,half), 1);
  const ev2 = toEvents(p.notes.slice(half), p.durations.slice(half), 1);
  return makeExercise({
    level: 7, mode: hand==="both"?"right":hand, type: "sequence",
    title: "Melodic phrase with rhythm",
    difficultyScore: 42,
    measures: [
      { number:1, rightHand: hand!=="left"?ev1:[], leftHand: hand==="left"?ev1:[] },
      { number:2, rightHand: hand!=="left"?ev2:[], leftHand: hand==="left"?ev2:[] },
    ],
    hint: p.notes.map(fmt).join(" "),
  });
}

// ── Level 8: Faster Recognition ───────────────────────────────────────────
// Longer sequences, eighth notes, position changes, black keys
export function gen8(hand) {
  const patterns = [
    ["C4","D4","E4","F4","G4","A4","G4","F4","E4","D4","C4","E4"],
    ["G4","F#4","E4","D4","C4","B4","A4","G4","F#4","E4","D4","C4"],
    ["C5","B4","A4","G4","F4","E4","D4","C4","D4","E4","F4","G4"],
    ["E4","F#4","G4","A4","B4","C5","D5","E5","D5","C5","B4","A4"],
  ];
  const seq = pick(patterns);
  function toEighths(notes) {
    let b = 1;
    return notes.map(n => { const ev = note([n],"eighth",b); b+=0.5; return ev; });
  }
  const ev1 = toEighths(seq.slice(0,8));
  const ev2 = toEighths(seq.slice(8));
  return makeExercise({
    level: 8, mode: hand==="both"?"right":hand, type: "sequence",
    title: "Eighth-note run",
    difficultyScore: 48,
    measures: [
      { number:1, rightHand: hand!=="left"?ev1:[], leftHand: hand==="left"?ev1:[] },
      { number:2, rightHand: hand!=="left"?ev2:[], leftHand: hand==="left"?ev2:[] },
    ],
    hint: "Steady eighth notes — watch for sharps",
  });
}

// ── Level 9: Triads and Progressions ─────────────────────────────────────
// 2-measure I–IV–V–I progression, root position triads, quarter notes
export function gen9(hand) {
  const progressions = [
    { key:"C", chords:[["C4","E4","G4"],["F4","A4","C5"],["G4","B4","D5"],["C4","E4","G4"]] },
    { key:"G", chords:[["G3","B3","D4"],["C4","E4","G4"],["D4","F#4","A4"],["G3","B3","D4"]] },
    { key:"F", chords:[["F3","A3","C4"],["A#3","D4","F4"],["C4","E4","G4"],["F3","A3","C4"]] },
    { key:"D", chords:[["D4","F#4","A4"],["G4","B4","D5"],["A4","C#5","E5"],["D4","F#4","A4"]] },
  ];
  const prog = pick(progressions);
  const m1 = [note(prog.chords[0],"quarter",1), note(prog.chords[1],"quarter",2), note(prog.chords[2],"quarter",3), note(prog.chords[3],"quarter",4)];
  const m2 = [note(prog.chords[1],"half",1), note(prog.chords[2],"quarter",3), note(prog.chords[0],"quarter",4)];
  return makeExercise({
    level: 9, mode: hand==="both"?"right":hand, type: "chord",
    title: `${prog.key} major: I–IV–V–I`,
    keySignature: prog.key, difficultyScore: 54,
    measures: [
      { number:1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number:2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: "Play each chord cleanly",
  });
}

// ── Level 10: Inversions ──────────────────────────────────────────────────
// 2 measures with root, 1st inversion, 2nd inversion, back; with rhythm
export function gen10(hand) {
  const sets = [
    { name:"C major",  root:["C4","E4","G4"], inv1:["E4","G4","C5"],  inv2:["G4","C5","E5"] },
    { name:"G major",  root:["G3","B3","D4"], inv1:["B3","D4","G4"],  inv2:["D4","G4","B4"] },
    { name:"F major",  root:["F4","A4","C5"], inv1:["A4","C5","F5"],  inv2:["C5","F5","A5"] },
    { name:"D minor",  root:["D4","F4","A4"], inv1:["F4","A4","D5"],  inv2:["A4","D5","F5"] },
    { name:"A minor",  root:["A3","C4","E4"], inv1:["C4","E4","A4"],  inv2:["E4","A4","C5"] },
    { name:"E minor",  root:["E4","G4","B4"], inv1:["G4","B4","E5"],  inv2:["B4","E5","G5"] },
  ];
  const s = pick(sets);
  const m1 = [
    note(s.root,"quarter",1), note(s.inv1,"quarter",2),
    note(s.inv2,"quarter",3), note(s.root,"quarter",4),
  ];
  const m2 = [
    note(s.inv2,"quarter",1), note(s.inv1,"quarter",2),
    note(s.root,"half",3),
  ];
  return makeExercise({
    level: 10, mode: hand==="both"?"right":hand, type: "chord",
    title: `${s.name} inversions`,
    difficultyScore: 60,
    measures: [
      { number:1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number:2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: `Root → 1st inv → 2nd inv → root`,
  });
}

// ── Level 11: Accidentals and Rhythm ──────────────────────────────────────
// Syncopation, dotted rhythms, sharps/flats, 2 measures
export function gen11(hand) {
  const patterns = [
    { notes:["C4","E4","G4","A4","F#4","E4","D4","C4"], dur:["quarter","dotted-quarter","eighth","quarter","quarter","eighth","eighth","quarter"] },
    { notes:["G4","F#4","E4","D4","C4","B3","A3","G3"], dur:["dotted-quarter","eighth","quarter","quarter","dotted-quarter","eighth","quarter","quarter"] },
    { notes:["D4","F#4","A4","C5","B4","A#4","G4","F#4"], dur:["eighth","eighth","quarter","quarter","dotted-quarter","eighth","quarter","quarter"] },
    { notes:["A4","G#4","F#4","E4","D#4","E4","F#4","A4"], dur:["quarter","eighth","eighth","dotted-quarter","eighth","eighth","eighth","quarter"] },
  ];
  const p = pick(patterns);
  function toEvents(notes, durs) {
    let b=1; return notes.map((n,i)=>{ const ev=note([n],durs[i],b); b+=durs[i]==="dotted-quarter"?1.5:durs[i]==="eighth"?0.5:1; return ev; });
  }
  const half = Math.floor(p.notes.length/2);
  const ev1 = toEvents(p.notes.slice(0,half), p.durs.slice(0,half));
  const ev2 = toEvents(p.notes.slice(half), p.durs.slice(half));
  return makeExercise({
    level: 11, mode: hand==="both"?"right":hand, type: "sequence",
    title: "Syncopation and accidentals",
    difficultyScore: 65,
    measures: [
      { number:1, rightHand: hand!=="left"?ev1:[], leftHand: hand==="left"?ev1:[] },
      { number:2, rightHand: hand!=="left"?ev2:[], leftHand: hand==="left"?ev2:[] },
    ],
    hint: "Watch for dotted rhythms and sharps",
  });
}

// ── Level 12: Left Hand Foundation ────────────────────────────────────────
// Left hand bass patterns only (Alberti bass / broken chords / octaves)
export function gen12(_hand) {
  const patterns = [
    { name:"C Alberti", notes:["C3","G3","E3","G3","C3","G3","E3","G3","F3","C4","A3","C4","G3","D4","B3","D4"] },
    { name:"G broken triad", notes:["G2","B2","D3","G3","B3","D4","G3","B3","G2","D3","B2","G2","D3","G3","B3","D4"] },
    { name:"F Alberti", notes:["F2","C3","A2","C3","F2","C3","A2","C3","C3","G3","E3","G3","F2","C3","A2","C3"] },
  ];
  const p = pick(patterns);
  function toEighths(notes) { let b=1; return notes.map(n=>{const ev=note([n],"eighth",b);b+=0.5;return ev;}); }
  const ev1=toEighths(p.notes.slice(0,8)), ev2=toEighths(p.notes.slice(8));
  return makeExercise({
    level: 12, mode: "left", type: "sequence",
    title: `Left hand: ${p.name}`,
    difficultyScore: 58,
    measures: [
      { number:1, rightHand:[], leftHand:ev1 },
      { number:2, rightHand:[], leftHand:ev2 },
    ],
    hint: "Bass clef — Alberti bass pattern",
  });
}

// ── Level 13: First Two-Hand Coordination ─────────────────────────────────
// Grand staff: right hand simple melody, left hand bass quarter notes
export function gen13(_hand) {
  const sets = [
    {
      name:"C major duet",
      rh:[["E4"],["F4"],["G4"],["A4"],["G4"],["F4"],["E4"],["D4"]],
      lh:[["C3"],["G3"],["C3"],["F3"],["C3"],["G3"],["C3"],["G3"]],
      dur:["quarter","quarter","quarter","quarter","quarter","quarter","quarter","quarter"],
    },
    {
      name:"G major duet",
      rh:[["D4"],["E4"],["F#4"],["G4"],["A4"],["B4"],["A4"],["G4"]],
      lh:[["G2"],["D3"],["G2"],["D3"],["G2"],["D3"],["G2"],["B2"]],
      dur:["quarter","quarter","quarter","quarter","quarter","quarter","quarter","quarter"],
    },
    {
      name:"A minor duet",
      rh:[["E4"],["D4"],["C4"],["B3"],["A3"],["B3"],["C4"],["E4"]],
      lh:[["A2"],["E3"],["A2"],["E3"],["A2"],["E3"],["A2"],["E3"]],
      dur:["quarter","quarter","quarter","quarter","quarter","quarter","quarter","quarter"],
    },
  ];
  const s = pick(sets);
  function toEvents(nn,dd) { let b=1; return nn.map((n,i)=>{const ev=note(n,dd[i],b);b+=dd[i]==="eighth"?0.5:1;return ev;}); }
  const rh1=toEvents(s.rh.slice(0,4), s.dur.slice(0,4));
  const rh2=toEvents(s.rh.slice(4), s.dur.slice(4));
  const lh1=toEvents(s.lh.slice(0,4), s.dur.slice(0,4));
  const lh2=toEvents(s.lh.slice(4), s.dur.slice(4));
  return makeExercise({
    level:13, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 68,
    measures: [
      { number:1, rightHand:rh1, leftHand:lh1 },
      { number:2, rightHand:rh2, leftHand:lh2 },
    ],
    hint: "Right hand melody, left hand bass",
  });
}

// ── Level 14: Two-Hand Chords ──────────────────────────────────────────────
// Both hands: melody + chord + bass, 2 measures
export function gen14(_hand) {
  const sets = [
    {
      name:"C – Am – F – G",
      rh:[ [["C5"],["B4"],["A4"],["G4"]], [["A4"],["G4"],["F4"],["E4"]] ],
      lh:[ [["C3","G3"],["A2","E3"],["F2","C3"],["G2","D3"]], [["A2","E3"],["F2","C3"],["G2","D3"],["C3","G3"]] ],
    },
    {
      name:"G – Em – C – D",
      rh:[ [["D5"],["C5"],["B4"],["A4"]], [["G4"],["F#4"],["E4"],["D4"]] ],
      lh:[ [["G2","D3"],["E2","B2"],["C3","G3"],["D2","A2"]], [["G2","D3"],["E2","B2"],["C3","G3"],["D2","A2"]] ],
    },
  ];
  const s = pick(sets);
  function toEvents(nn) { return nn.map((n,i)=>note(n,"quarter",i+1)); }
  return makeExercise({
    level:14, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 72,
    measures: [
      { number:1, rightHand:toEvents(s.rh[0]), leftHand:toEvents(s.lh[0]) },
      { number:2, rightHand:toEvents(s.rh[1]), leftHand:toEvents(s.lh[1]) },
    ],
    hint: "Melody over chord accompaniment",
  });
}

// ── Level 15: Real Two-Hand Challenge ─────────────────────────────────────
// Contrary motion, 7th chords, rhythm differences, 3 measures
export function gen15(_hand) {
  const sets = [
    {
      name:"Contrary motion with 7ths",
      rh:[
        [note(["E4","G4","B4","D5"],"quarter",1), note(["D5"],"eighth",2), note(["E5"],"eighth",2.5), note(["C5"],"quarter",3), note(["D5"],"quarter",4)],
        [note(["B4","D5","F5"],"quarter",1), note(["A4"],"eighth",2), note(["G4"],"eighth",2.5), note(["F4","A4","C5","E5"],"half",3)],
        [note(["G4","B4","D5"],"quarter",1), note(["A4"],"eighth",2), note(["B4"],"eighth",2.5), note(["C5"],"quarter",3), note(["G4"],"quarter",4)],
      ],
      lh:[
        [note(["G2","B2"],"quarter",1), note(["C3","E3","G3"],"quarter",2), note(["F2","A2"],"quarter",3), note(["G2","B2","D3"],"quarter",4)],
        [note(["G2","B2","D3","F3"],"half",1), note(["C3","E3","G3"],"quarter",3), note(["G2","D3"],"quarter",4)],
        [note(["C3","E3","G3"],"quarter",1), note(["F2","A2","C3"],"quarter",2), note(["G2","B2","D3","F3"],"half",3)],
      ],
    },
    {
      name:"Two-hand with syncopation",
      rh:[
        [note(["G4","B4","D5"],"eighth",1), note(["A4"],"eighth",1.5), note(["F#4","A4","C5"],"quarter",2), note(["E4"],"eighth",3), note(["F#4"],"eighth",3.5), note(["G4","B4","D5"],"quarter",4)],
        [note(["A4"],"dotted-quarter",1), note(["G4"],"eighth",2.5), note(["F#4","A4","C5"],"quarter",3), note(["G4","B4"],"quarter",4)],
        [note(["D5","F#5"],"quarter",1), note(["C5","E5"],"quarter",2), note(["B4","D5","G5"],"half",3)],
      ],
      lh:[
        [note(["G2","D3"],"quarter",1), note(["G2","B2"],"quarter",2), note(["C3","E3"],"quarter",3), note(["D3","F#3"],"quarter",4)],
        [note(["G2","D3","B3"],"half",1), note(["A2","E3"],"quarter",3), note(["D3","A3"],"quarter",4)],
        [note(["G2","D3","B3"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:15, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 77,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Both hands — different rhythms per hand",
  });
}

// ── Level 16: Advanced Coordination ───────────────────────────────────────
// 3 measures, eighth + sixteenth notes in RH, jumping LH bass
export function gen16(_hand) {
  const sets = [
    {
      name:"Sixteenth-note melody over jumping bass",
      rh:[
        [note(["E4"],"eighth",1),note(["F#4"],"eighth",1.5),note(["G4"],"eighth",2),note(["A4"],"eighth",2.5),note(["B4"],"eighth",3),note(["A4"],"eighth",3.5),note(["G4"],"eighth",4),note(["F#4"],"eighth",4.5)],
        [note(["E5"],"sixteenth",1),note(["D5"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["B4"],"sixteenth",1.75),note(["A4"],"quarter",2),note(["G4","B4","D5"],"quarter",3),note(["F#4"],"quarter",4)],
        [note(["G4","B4","D5"],"quarter",1),note(["A4"],"eighth",2),note(["B4"],"eighth",2.5),note(["C5","E5","G5"],"half",3)],
      ],
      lh:[
        [note(["G2"],"eighth",1),note(["D3"],"eighth",2),note(["G2"],"eighth",3),note(["B2"],"eighth",4)],
        [note(["C3"],"quarter",1),note(["G2"],"quarter",2),note(["D3"],"quarter",3),note(["G2"],"quarter",4)],
        [note(["G2","B2","D3"],"whole",1)],
      ],
    },
    {
      name:"Cross-rhythm challenge",
      rh:[
        [note(["C5"],"eighth",1),note(["D5"],"eighth",1.5),note(["E5"],"eighth",2),note(["F5"],"eighth",2.5),note(["G5"],"eighth",3),note(["F5"],"eighth",3.5),note(["E5"],"eighth",4),note(["D5"],"eighth",4.5)],
        [note(["E5"],"sixteenth",1),note(["D5"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["B4"],"sixteenth",1.75),note(["G4","C5","E5"],"quarter",2),note(["A4"],"eighth",3),note(["B4"],"eighth",3.5),note(["C5"],"quarter",4)],
        [note(["G4","C5","E5"],"quarter",1),note(["F4","A4","C5"],"quarter",2),note(["G4","B4","D5","F5"],"half",3)],
      ],
      lh:[
        [note(["C3","G3"],"quarter",1),note(["G2","D3"],"quarter",2),note(["A2","E3"],"quarter",3),note(["G2","D3"],"quarter",4)],
        [note(["C3","E3","G3"],"half",1),note(["F2","C3","A3"],"quarter",3),note(["G2","D3"],"quarter",4)],
        [note(["C3","G3","E4"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:16, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 82,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Sixteenth-note runs — keep the beat steady",
  });
}

// ── Level 17: Dense Reading ───────────────────────────────────────────────
// Sharps/flats, key changes, arpeggios in RH, chromatic LH, 3 measures
export function gen17(_hand) {
  const sets = [
    {
      name:"D minor with arpeggios",
      rh:[
        [note(["D4"],"eighth",1),note(["F4"],"eighth",1.5),note(["A4"],"eighth",2),note(["D5"],"eighth",2.5),note(["C5"],"eighth",3),note(["A4"],"eighth",3.5),note(["F4"],"eighth",4),note(["E4"],"eighth",4.5)],
        [note(["E4","G#4","B4"],"quarter",1),note(["F4"],"eighth",2),note(["G4"],"eighth",2.5),note(["A4","C5","E5"],"quarter",3),note(["D4"],"eighth",4),note(["F4"],"eighth",4.5)],
        [note(["G#4","B4","D5"],"quarter",1),note(["A4","C5","E5"],"quarter",2),note(["D4","F4","A4","C5"],"half",3)],
      ],
      lh:[
        [note(["D3"],"eighth",1),note(["A3"],"eighth",2),note(["D3"],"eighth",3),note(["A3"],"eighth",4)],
        [note(["E3","G#3"],"quarter",1),note(["A2","E3"],"quarter",2),note(["D3","F3"],"quarter",3),note(["A2","E3"],"quarter",4)],
        [note(["G2","B2","D3","F3"],"quarter",1),note(["C3","E3","G#3"],"quarter",2),note(["D3","A3","F4"],"half",3)],
      ],
    },
    {
      name:"Chromatic descent over arpeggios",
      rh:[
        [note(["C5"],"sixteenth",1),note(["B4"],"sixteenth",1.25),note(["A#4"],"sixteenth",1.5),note(["A4"],"sixteenth",1.75),note(["G#4"],"eighth",2),note(["G4"],"eighth",2.5),note(["F#4"],"quarter",3),note(["F4","A4","C5"],"quarter",4)],
        [note(["E4"],"eighth",1),note(["G4"],"eighth",1.5),note(["C5"],"eighth",2),note(["E5"],"eighth",2.5),note(["D5"],"quarter",3),note(["C5"],"quarter",4)],
        [note(["B4","D5","G5"],"quarter",1),note(["A4","C5","F5"],"quarter",2),note(["G4","B4","E5"],"half",3)],
      ],
      lh:[
        [note(["C3"],"quarter",1),note(["G2"],"quarter",2),note(["A2"],"quarter",3),note(["G2"],"quarter",4)],
        [note(["C3","G3"],"eighth",1),note(["E3"],"eighth",2),note(["G3"],"eighth",3),note(["C4"],"eighth",4)],
        [note(["G2","B2","D3","F3"],"quarter",1),note(["A2","C3","E3"],"quarter",2),note(["G2","D3","G3"],"half",3)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:17, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 86,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Dense accidentals — read carefully",
  });
}

// ── Level 18: Virtuoso Prep ───────────────────────────────────────────────
// 4 measures, fast arpeggios, wide leaps, chromatic runs, dense both hands
export function gen18(_hand) {
  const sets = [
    {
      name:"Arpeggio storm",
      rh:[
        [note(["C4"],"sixteenth",1),note(["E4"],"sixteenth",1.25),note(["G4"],"sixteenth",1.5),note(["C5"],"sixteenth",1.75),note(["E5"],"sixteenth",2),note(["G5"],"sixteenth",2.25),note(["E5"],"sixteenth",2.5),note(["C5"],"sixteenth",2.75),note(["G4"],"sixteenth",3),note(["E4"],"sixteenth",3.25),note(["C4"],"sixteenth",3.5),note(["E4"],"sixteenth",3.75)],
        [note(["F4"],"sixteenth",1),note(["A4"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["F5"],"sixteenth",1.75),note(["E5"],"sixteenth",2),note(["C5"],"sixteenth",2.25),note(["A4"],"sixteenth",2.5),note(["F4"],"sixteenth",2.75),note(["G4"],"sixteenth",3),note(["B4"],"sixteenth",3.25),note(["D5"],"sixteenth",3.5),note(["G5"],"sixteenth",3.75)],
        [note(["A4"],"sixteenth",1),note(["C5"],"sixteenth",1.25),note(["E5"],"sixteenth",1.5),note(["A5"],"sixteenth",1.75),note(["G5"],"sixteenth",2),note(["E5"],"sixteenth",2.25),note(["C5"],"sixteenth",2.5),note(["A4"],"sixteenth",2.75),note(["D5"],"quarter",3),note(["B4"],"quarter",4)],
        [note(["C5","E5","G5"],"quarter",1),note(["F4","A4","C5"],"quarter",2),note(["G4","B4","D5","F5"],"quarter",3),note(["C4","E4","G4","C5"],"quarter",4)],
      ],
      lh:[
        [note(["C3"],"eighth",1),note(["G3"],"eighth",2),note(["C3"],"eighth",3),note(["G3"],"eighth",4)],
        [note(["F2"],"eighth",1),note(["C3"],"eighth",2),note(["A2"],"eighth",3),note(["G2"],"eighth",4)],
        [note(["A2","E3"],"quarter",1),note(["A2","C3"],"quarter",2),note(["D3","F3"],"quarter",3),note(["E3","G#3"],"quarter",4)],
        [note(["C3","G3","E4"],"whole",1)],
      ],
    },
    {
      name:"Wide-leap passage",
      rh:[
        [note(["C5"],"eighth",1),note(["G4"],"eighth",1.5),note(["E5"],"eighth",2),note(["C4"],"eighth",2.5),note(["D5"],"eighth",3),note(["A4"],"eighth",3.5),note(["F5"],"eighth",4),note(["C4"],"eighth",4.5)],
        [note(["E5"],"sixteenth",1),note(["C5"],"sixteenth",1.25),note(["A4"],"sixteenth",1.5),note(["F#4"],"sixteenth",1.75),note(["G4"],"quarter",2),note(["D5","F#5","A5"],"quarter",3),note(["G4"],"quarter",4)],
        [note(["G5"],"eighth",1),note(["E5"],"eighth",1.5),note(["D5"],"eighth",2),note(["C5"],"eighth",2.5),note(["B4","D5","G5"],"quarter",3),note(["G4"],"quarter",4)],
        [note(["C5","G5"],"quarter",1),note(["A4","E5"],"quarter",2),note(["F4","C5","A5"],"quarter",3),note(["G4","B4","D5","G5"],"quarter",4)],
      ],
      lh:[
        [note(["C3","G3"],"quarter",1),note(["G2"],"quarter",2),note(["A2","E3"],"quarter",3),note(["G2"],"quarter",4)],
        [note(["C3","E3","G3"],"quarter",1),note(["D3","F#3"],"quarter",2),note(["G2","D3","B3"],"quarter",3),note(["G2"],"quarter",4)],
        [note(["C3"],"eighth",1),note(["G3"],"eighth",1.5),note(["E3"],"eighth",2),note(["G3"],"eighth",2.5),note(["G2","D3","B3"],"half",3)],
        [note(["C3","G3","E4"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:18, mode:"both", type:"virtuoso",
    title: s.name,
    difficultyScore: 90,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Virtuoso level — precise articulation required",
  });
}

// ── Level 19: Concert-Level Trial ─────────────────────────────────────────
// 4 measures, sixteenth-note runs, LH arpeggios, RH leaps, accidentals
export function gen19(_hand) {
  const sets = [
    {
      name:"Concert etude in D minor",
      key:"d",
      rh:[
        [note(["D5"],"sixteenth",1),note(["C5"],"sixteenth",1.25),note(["B4"],"sixteenth",1.5),note(["A4"],"sixteenth",1.75),note(["G#4"],"sixteenth",2),note(["A4"],"sixteenth",2.25),note(["B4"],"sixteenth",2.5),note(["C5"],"sixteenth",2.75),note(["D5"],"eighth",3),note(["E5"],"eighth",3.5),note(["F5","A5"],"quarter",4)],
        [note(["E5"],"sixteenth",1),note(["F5"],"sixteenth",1.25),note(["G5"],"sixteenth",1.5),note(["A5"],"sixteenth",1.75),note(["G5"],"eighth",2),note(["F5"],"eighth",2.5),note(["E5","G#5","B5"],"quarter",3),note(["A5"],"quarter",4)],
        [note(["A5"],"eighth",1),note(["G5"],"eighth",1.5),note(["F5"],"eighth",2),note(["E5"],"eighth",2.5),note(["D5"],"eighth",3),note(["C5"],"eighth",3.5),note(["B4"],"eighth",4),note(["A4"],"eighth",4.5)],
        [note(["G#4","B4","D5","F5"],"quarter",1),note(["A4","C5","E5"],"quarter",2),note(["D4","F4","A4","C5"],"half",3)],
      ],
      lh:[
        [note(["D3"],"eighth",1),note(["A3"],"eighth",1.5),note(["F3"],"eighth",2),note(["A3"],"eighth",2.5),note(["D3"],"eighth",3),note(["A3"],"eighth",3.5),note(["G3"],"eighth",4),note(["F3"],"eighth",4.5)],
        [note(["C3"],"eighth",1),note(["G3"],"eighth",1.5),note(["E3"],"eighth",2),note(["G3"],"eighth",2.5),note(["A2","E3"],"quarter",3),note(["E3","G#3"],"quarter",4)],
        [note(["D3","F3","A3"],"quarter",1),note(["E3","G#3","B3"],"quarter",2),note(["A2","E3","C4"],"quarter",3),note(["D3","F3","A3"],"quarter",4)],
        [note(["G2","B2","D3","F3"],"quarter",1),note(["A2","C3","E3"],"quarter",2),note(["D3","A3","F4"],"half",3)],
      ],
    },
    {
      name:"Grand chromatic passage",
      key:"C",
      rh:[
        [note(["C5"],"sixteenth",1),note(["C#5"],"sixteenth",1.25),note(["D5"],"sixteenth",1.5),note(["D#5"],"sixteenth",1.75),note(["E5"],"sixteenth",2),note(["F5"],"sixteenth",2.25),note(["F#5"],"sixteenth",2.5),note(["G5"],"sixteenth",2.75),note(["G#5"],"sixteenth",3),note(["A5"],"sixteenth",3.25),note(["A#5"],"sixteenth",3.5),note(["B5"],"sixteenth",3.75)],
        [note(["B5"],"eighth",1),note(["A5"],"eighth",1.5),note(["G#5"],"eighth",2),note(["G5"],"eighth",2.5),note(["F#5"],"eighth",3),note(["F5"],"eighth",3.5),note(["E5"],"eighth",4),note(["D#5"],"eighth",4.5)],
        [note(["D5"],"eighth",1),note(["C5"],"eighth",1.5),note(["B4"],"eighth",2),note(["A#4"],"eighth",2.5),note(["A4","C5","E5"],"quarter",3),note(["G4","B4","D5","F5"],"quarter",4)],
        [note(["C5","E5","G5"],"quarter",1),note(["A4","C5","F5"],"quarter",2),note(["G4","B4","D5","F5"],"quarter",3),note(["C4","E4","G4","C5"],"quarter",4)],
      ],
      lh:[
        [note(["C3"],"sixteenth",1),note(["D3"],"sixteenth",1.25),note(["E3"],"sixteenth",1.5),note(["F3"],"sixteenth",1.75),note(["G3"],"eighth",2),note(["A3"],"eighth",2.5),note(["G3"],"eighth",3),note(["F3"],"eighth",3.5)],
        [note(["E3"],"eighth",1),note(["D3"],"eighth",1.5),note(["C3"],"eighth",2),note(["G2"],"eighth",2.5),note(["C3","E3","G3"],"quarter",3),note(["G2","D3","B3"],"quarter",4)],
        [note(["A2","C3","E3"],"quarter",1),note(["F2","C3","A3"],"quarter",2),note(["G2","B2","D3","F3"],"quarter",3),note(["E2","G#2","B2"],"quarter",4)],
        [note(["F2","A2","C3","E3"],"quarter",1),note(["G2","B2","D3"],"quarter",2),note(["C3","E3","G3","C4"],"half",3)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:19, mode:"both", type:"virtuoso",
    title: s.name,
    keySignature: s.key,
    difficultyScore: 95,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Concert-level — every note counts",
    requiredAccuracy: 0.92,
  });
}

// ── Level 20: Grandmaster Trial ───────────────────────────────────────────
// 5 measures, extreme difficulty, fast sixteenths, dense chords, large leaps
export function gen20(_hand) {
  const sets = [
    {
      name:"Grandmaster: Chromatic Torrent",
      rh:[
        [note(["G4"],"sixteenth",1),note(["G#4"],"sixteenth",1.25),note(["A4"],"sixteenth",1.5),note(["A#4"],"sixteenth",1.75),note(["B4"],"sixteenth",2),note(["C5"],"sixteenth",2.25),note(["C#5"],"sixteenth",2.5),note(["D5"],"sixteenth",2.75),note(["D#5"],"sixteenth",3),note(["E5"],"sixteenth",3.25),note(["F5"],"sixteenth",3.5),note(["F#5"],"sixteenth",3.75)],
        [note(["G5"],"eighth",1),note(["F#5"],"eighth",1.5),note(["F5"],"eighth",2),note(["E5"],"eighth",2.5),note(["D#5","G5","B5"],"quarter",3),note(["D5"],"quarter",4)],
        [note(["C5"],"sixteenth",1),note(["E5"],"sixteenth",1.25),note(["G5"],"sixteenth",1.5),note(["C6"],"sixteenth",1.75),note(["B5"],"sixteenth",2),note(["G5"],"sixteenth",2.25),note(["E5"],"sixteenth",2.5),note(["C5"],"sixteenth",2.75),note(["D5"],"eighth",3),note(["F#5"],"eighth",3.5),note(["A5"],"quarter",4)],
        [note(["G5","B5","D6"],"eighth",1),note(["F#5"],"eighth",1.5),note(["E5","G#5","B5"],"eighth",2),note(["D5"],"eighth",2.5),note(["C5","E5","G5","B5"],"quarter",3),note(["F4","A4","C5","E5"],"quarter",4)],
        [note(["E5","G5","B5"],"quarter",1),note(["D5","F#5","A5"],"quarter",2),note(["C5","E5","G5","B5"],"quarter",3),note(["G4","B4","D5","G5"],"quarter",4)],
      ],
      lh:[
        [note(["G2"],"sixteenth",1),note(["A2"],"sixteenth",1.25),note(["B2"],"sixteenth",1.5),note(["C3"],"sixteenth",1.75),note(["D3"],"eighth",2),note(["E3"],"eighth",2.5),note(["F3"],"eighth",3),note(["G3"],"eighth",3.5)],
        [note(["G2","D3"],"quarter",1),note(["C3","G3"],"quarter",2),note(["A2","E3","C4"],"quarter",3),note(["D3","A3","F4"],"quarter",4)],
        [note(["C3"],"sixteenth",1),note(["E3"],"sixteenth",1.25),note(["G3"],"sixteenth",1.5),note(["C4"],"sixteenth",1.75),note(["B3"],"eighth",2),note(["G3"],"eighth",2.5),note(["D3","F#3","A3"],"quarter",3),note(["G2","D3","G3"],"quarter",4)],
        [note(["E3","G#3","B3"],"quarter",1),note(["A2","E3","C4"],"quarter",2),note(["F3","A3","C4","E4"],"quarter",3),note(["G2","D3","B3","F4"],"quarter",4)],
        [note(["C3","G3","E4"],"quarter",1),note(["G2","D3","B3"],"quarter",2),note(["A2","C3","E3","G3"],"quarter",3),note(["G2","B2","D3","F3","G3"],"quarter",4)],
      ],
    },
  ];
  const s = sets[0];
  return makeExercise({
    level:20, mode:"both", type:"virtuoso",
    title: s.name,
    difficultyScore: 100,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Grandmaster — no mercy",
    requiredAccuracy: 0.95,
    timeLimit: 30,
  });
}

// ── Chopin Mode ───────────────────────────────────────────────────────────
// 6 measures of Romantic-inspired chaos
export function genChopin(_hand) {
  const sets = [
    {
      name:"Romantic Nightmare in A minor",
      rh:[
        [note(["E5"],"sixteenth",1),note(["D#5"],"sixteenth",1.25),note(["E5"],"sixteenth",1.5),note(["D#5"],"sixteenth",1.75),note(["E5"],"sixteenth",2),note(["B4"],"sixteenth",2.25),note(["D5"],"sixteenth",2.5),note(["C5"],"sixteenth",2.75),note(["A4","E5","C6"],"quarter",3),note(["E5"],"quarter",4)],
        [note(["F5"],"sixteenth",1),note(["E5"],"sixteenth",1.25),note(["D5"],"sixteenth",1.5),note(["C5"],"sixteenth",1.75),note(["B4","D5","G5"],"eighth",2),note(["A4"],"eighth",2.5),note(["G#4","B4","E5"],"quarter",3),note(["A4","C5","E5"],"quarter",4)],
        [note(["A5"],"eighth",1),note(["G#5"],"eighth",1.5),note(["F5"],"eighth",2),note(["E5"],"eighth",2.5),note(["D5"],"sixteenth",3),note(["C5"],"sixteenth",3.25),note(["B4"],"sixteenth",3.5),note(["A4"],"sixteenth",3.75),note(["G#4","B4","E5"],"quarter",4)],
        [note(["A4"],"sixteenth",1),note(["C5"],"sixteenth",1.25),note(["E5"],"sixteenth",1.5),note(["A5"],"sixteenth",1.75),note(["G5"],"sixteenth",2),note(["E5"],"sixteenth",2.25),note(["C5"],"sixteenth",2.5),note(["A4"],"sixteenth",2.75),note(["B4"],"sixteenth",3),note(["D5"],"sixteenth",3.25),note(["F5"],"sixteenth",3.5),note(["G#5"],"sixteenth",3.75)],
        [note(["A5","C6","E6"],"eighth",1),note(["G#5"],"eighth",1.5),note(["F5","A5","C6"],"eighth",2),note(["E5"],"eighth",2.5),note(["D5","F5","B5"],"quarter",3),note(["C5","E5","A5"],"quarter",4)],
        [note(["E5","G#5","B5","D6"],"quarter",1),note(["A4","C5","E5","A5"],"quarter",2),note(["E4","G#4","B4","E5"],"quarter",3),note(["A3","E4","A4","C5","E5"],"quarter",4)],
      ],
      lh:[
        [note(["A2"],"eighth",1),note(["E3"],"eighth",1.5),note(["A3"],"eighth",2),note(["E3"],"eighth",2.5),note(["A2"],"eighth",3),note(["C3"],"eighth",3.5),note(["E3"],"eighth",4),note(["A3"],"eighth",4.5)],
        [note(["D3"],"eighth",1),note(["A3"],"eighth",1.5),note(["F3"],"eighth",2),note(["A3"],"eighth",2.5),note(["E3"],"eighth",3),note(["G#3"],"eighth",3.5),note(["B3"],"eighth",4),note(["E3"],"eighth",4.5)],
        [note(["A2"],"sixteenth",1),note(["E3"],"sixteenth",1.25),note(["C3"],"sixteenth",1.5),note(["E3"],"sixteenth",1.75),note(["A3"],"sixteenth",2),note(["E3"],"sixteenth",2.25),note(["C3"],"sixteenth",2.5),note(["E3"],"sixteenth",2.75),note(["A2"],"eighth",3),note(["G#2","B2","D3"],"quarter",3.5)],
        [note(["E3","G#3","B3"],"quarter",1),note(["A2","E3","C4"],"quarter",2),note(["D3","F3","A3"],"quarter",3),note(["E2","G#2","B2","D3"],"quarter",4)],
        [note(["A2"],"eighth",1),note(["E3"],"eighth",1.5),note(["A3"],"eighth",2),note(["C4"],"eighth",2.5),note(["E4"],"eighth",3),note(["C4"],"eighth",3.5),note(["A3"],"eighth",4),note(["E3"],"eighth",4.5)],
        [note(["A2","E3","A3","C4","E4"],"whole",1)],
      ],
    },
  ];
  const s = sets[0];
  return makeExercise({
    level: 20, mode:"both", type:"virtuoso",
    title: s.name,
    difficultyScore: 120,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Chopin Mode — Romantic nightmare. No time limit on difficulty.",
    requiredAccuracy: 0.95,
    timeLimit: 8,
  });
}

function fmt(k) { return k.replace("#","♯").replace(/[0-9]/g,""); }

// ── Additional variant generators ─────────────────────────────────────────
// These extend existing levels with more variety, same object shape, safe fallbacks.

// Level 1 extra: vary rhythm so not every card is identical
function gen1b(hand) {
  const pools = {
    left:  [["C3","E3"],["D3","F3"],["E3","G3"],["C3","D3"],["G3","E3"]],
    right: [["C4","E4"],["D4","F4"],["E4","G4"],["C4","D4"],["G4","E4"]],
  };
  const pair = pick(pools[hand] || pools.right);
  const [n1, n2] = pair;
  return makeExercise({
    level: 1, mode: hand, type: "sequence",
    title: `Play ${fmt(n1)} then ${fmt(n2)}`,
    difficultyScore: 6,
    measures: [{ number: 1,
      rightHand: hand !== "left" ? [note([n1],"quarter",1), note([n2],"quarter",2), rest("half",3)] : [],
      leftHand:  hand === "left"  ? [note([n1],"quarter",1), note([n2],"quarter",2), rest("half",3)] : [],
    }],
    hint: `${fmt(n1)} then ${fmt(n2)} — both near Middle C`,
  });
}

// Level 2 extra: two-note ascending/descending
function gen2b(hand) {
  const whites = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","B3","C4"]
    : ["C4","D4","E4","F4","G4","A4","B4","C5"];
  const i = Math.floor(Math.random() * (whites.length - 2));
  const dir = Math.random() > 0.5 ? 1 : -1;
  const n1 = whites[i], n2 = whites[Math.min(whites.length - 1, Math.max(0, i + dir))];
  return makeExercise({
    level: 2, mode: hand, type: "sequence",
    title: `${fmt(n1)} to ${fmt(n2)}`,
    difficultyScore: 9,
    measures: [{ number: 1,
      rightHand: hand !== "left" ? [note([n1],"quarter",1), note([n2],"quarter",2), rest("half",3)] : [],
      leftHand:  hand === "left"  ? [note([n1],"quarter",1), note([n2],"quarter",2), rest("half",3)] : [],
    }],
    hint: `Step from ${fmt(n1)} to ${fmt(n2)}`,
  });
}

// Level 3 extra: 4-note stepwise with a mix of up/down
function gen3b(hand) {
  const whites = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","B3"]
    : ["C4","D4","E4","F4","G4","A4","B4","C5"];
  const start = Math.floor(Math.random() * (whites.length - 4));
  // arch shape: up 2, then back 1
  const seq = [whites[start], whites[start+1], whites[start+2], whites[start+1]];
  const events = seq.map((n, i) => note([n], "quarter", i + 1));
  return makeExercise({
    level: 3, mode: hand, type: "sequence",
    title: "Arch phrase",
    difficultyScore: 15,
    measures: [{ number: 1,
      rightHand: hand !== "left" ? events : [],
      leftHand:  hand === "left"  ? events : [],
    }],
    hint: seq.map(fmt).join(" → "),
  });
}

// Level 4 extra: three-note skip with return
function gen4b(hand) {
  const whites = hand === "left"
    ? ["C3","D3","E3","F3","G3","A3","B3"]
    : ["C4","D4","E4","F4","G4","A4","B4"];
  const i = Math.floor(Math.random() * (whites.length - 4));
  const skip = 2 + Math.floor(Math.random() * 2); // skip 3rd or 4th
  const a = whites[i], b = whites[Math.min(whites.length-1, i+skip)], c = whites[i+1];
  const m1 = [note([a],"quarter",1), note([b],"quarter",2), note([c],"half",3)];
  const m2 = [note([c],"quarter",1), note([a],"quarter",2), note([b],"half",3)];
  return makeExercise({
    level: 4, mode: hand, type: "sequence",
    title: `Three-note skip from ${fmt(a)}`,
    difficultyScore: 22,
    measures: [
      { number: 1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number: 2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: `${fmt(a)} → ${fmt(b)} → ${fmt(c)}`,
  });
}

// Level 5 extra: broken triad (arpeggio-style single notes)
function gen5b(hand) {
  const roots = hand === "left" ? ["C3","D3","E3","G3"] : ["C4","D4","E4","F4","G4","A4"];
  const r = pick(roots);
  const whites = ["C","D","E","F","G","A","B"];
  const oct = parseInt(r.slice(-1));
  const ridx = whites.indexOf(r[0]);
  const third = whites[(ridx+2)%7]+(ridx+2>6?oct+1:oct);
  const fifth = whites[(ridx+4)%7]+(ridx+4>6?oct+1:oct);
  const isMaj = Math.random() > 0.4;
  const events = [r, third, fifth, r].map((n, i) => note([n], "quarter", i+1));
  return makeExercise({
    level: 5, mode: hand, type: "sequence",
    title: `${fmt(r)} ${isMaj?"Major":"minor"} broken`,
    difficultyScore: 30,
    measures: [{ number: 1,
      rightHand: hand!=="left"?events:[],
      leftHand:  hand==="left"?events:[],
    }],
    hint: `Broken: ${[r,third,fifth].map(fmt).join(" – ")}`,
  });
}

// Level 6 extra: note → chord → note
function gen6b(hand) {
  const roots = hand==="left"?["C3","D3","G3"]:["C4","D4","E4","G4","A4"];
  const r = pick(roots);
  const whites = ["C","D","E","F","G","A","B"];
  const oct = parseInt(r.slice(-1));
  const ridx = whites.indexOf(r[0]);
  const third = whites[(ridx+2)%7]+(ridx+2>6?oct+1:oct);
  const fifth = whites[(ridx+4)%7]+(ridx+4>6?oct+1:oct);
  const below = whites[(ridx+6)%7]+(ridx-1<0?oct-1:oct);
  const m1 = [note([below],"quarter",1), note([r,third,fifth],"quarter",2), note([r],"half",3)];
  const m2 = [note([r,third,fifth],"half",1), note([below],"quarter",3), note([r],"quarter",4)];
  return makeExercise({
    level: 6, mode: hand, type: "mixed",
    title: `Approach ${fmt(r)} chord`,
    difficultyScore: 36,
    measures: [
      { number:1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number:2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: `Approach note → ${fmt(r)} triad`,
  });
}

// Level 7 extra patterns
function gen7b(hand) {
  const patterns = [
    { notes:["A4","G4","F4","E4","D4","C4","D4","E4"], durations:["eighth","eighth","quarter","eighth","eighth","quarter","quarter","quarter"] },
    { notes:["C4","D4","E4","G4","E4","D4","C4","B3"], durations:["quarter","eighth","eighth","quarter","quarter","eighth","eighth","half"] },
    { notes:["F4","G4","A4","B4","A4","G4","F4","E4"], durations:["eighth","eighth","eighth","eighth","quarter","quarter","eighth","eighth"] },
    { notes:["G4","A4","G4","F#4","E4","D4","E4","F#4"], durations:["quarter","eighth","eighth","quarter","eighth","eighth","quarter","quarter"] },
    { notes:["D4","F4","E4","G4","F4","A4","G4","C5"], durations:["eighth","eighth","quarter","eighth","eighth","quarter","quarter","quarter"] },
    { notes:["B3","C4","D4","E4","F#4","G4","A4","B4"], durations:["eighth","eighth","eighth","eighth","eighth","eighth","eighth","quarter"] },
  ];
  const p = pick(patterns);
  const half = Math.floor(p.notes.length/2);
  function toEvents(ns, ds) {
    let b=1; return ns.map((n,i)=>{const ev=note([n],ds[i],b); b+=ds[i]==="eighth"?0.5:1; return ev;});
  }
  return makeExercise({
    level: 7, mode: hand==="both"?"right":hand, type: "sequence",
    title: "Varied melodic phrase",
    difficultyScore: 44,
    measures: [
      { number:1, rightHand: hand!=="left"?toEvents(p.notes.slice(0,half),p.durations.slice(0,half)):[], leftHand: hand==="left"?toEvents(p.notes.slice(0,half),p.durations.slice(0,half)):[] },
      { number:2, rightHand: hand!=="left"?toEvents(p.notes.slice(half),p.durations.slice(half)):[], leftHand: hand==="left"?toEvents(p.notes.slice(half),p.durations.slice(half)):[] },
    ],
    hint: p.notes.map(fmt).join(" "),
  });
}

// Level 8 extra: mix of eighth + dotted patterns
function gen8b(hand) {
  const patterns = [
    ["D4","F#4","E4","G4","F#4","A4","G4","B4","A4","C5","B4","G4"],
    ["C5","A4","G4","E4","F4","D4","E4","C4","D4","B3","C4","E4"],
    ["A4","B4","C5","B4","A4","G4","F4","E4","D4","C4","B3","C4"],
    ["E4","G4","F#4","A4","G4","B4","A4","C5","B4","D5","C5","A4"],
  ];
  const seq = pick(patterns);
  function toEighths(notes) {
    let b=1; return notes.map(n=>{const ev=note([n],"eighth",b);b+=0.5;return ev;});
  }
  return makeExercise({
    level: 8, mode: hand==="both"?"right":hand, type: "sequence",
    title: "Wider eighth-note run",
    difficultyScore: 50,
    measures: [
      { number:1, rightHand: hand!=="left"?toEighths(seq.slice(0,8)):[], leftHand: hand==="left"?toEighths(seq.slice(0,8)):[] },
      { number:2, rightHand: hand!=="left"?toEighths(seq.slice(8)):[], leftHand: hand==="left"?toEighths(seq.slice(8)):[] },
    ],
    hint: "Watch for skips between notes",
  });
}

// Level 9 extra: IV–V–I and ii–V–I progressions
function gen9b(hand) {
  const progressions = [
    { key:"A", chords:[["A3","C#4","E4"],["D4","F#4","A4"],["E4","G#4","B4"],["A3","C#4","E4"]] },
    { key:"E", chords:[["E4","G#4","B4"],["A4","C#5","E5"],["B4","D#5","F#5"],["E4","G#4","B4"]] },
    { key:"Bb", chords:[["A#3","D4","F4"],["D#4","G4","A#4"],["F4","A4","C5"],["A#3","D4","F4"]] },
    { key:"Am", chords:[["A3","C4","E4"],["D4","F4","A4"],["E4","G#4","B4"],["A3","C4","E4"]] },
  ];
  const prog = pick(progressions);
  const m1 = [note(prog.chords[0],"half",1), note(prog.chords[1],"half",3)];
  const m2 = [note(prog.chords[2],"quarter",1), note(prog.chords[3],"quarter",2), note(prog.chords[0],"half",3)];
  return makeExercise({
    level: 9, mode: hand==="both"?"right":hand, type: "chord",
    title: `${prog.key}: half-note progression`,
    difficultyScore: 56,
    measures: [
      { number:1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number:2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: "Chord change on beat 1 and 3",
  });
}

// Level 10 extra: broken chord inversion patterns
function gen10b(hand) {
  const sets = [
    { name:"C major broken", root:["C4","E4","G4"], inv1:["E4","G4","C5"], inv2:["G4","C5","E5"] },
    { name:"D minor broken", root:["D4","F4","A4"], inv1:["F4","A4","D5"], inv2:["A4","D5","F5"] },
    { name:"G major broken", root:["G3","B3","D4"], inv1:["B3","D4","G4"], inv2:["D4","G4","B4"] },
    { name:"B minor broken", root:["B3","D4","F#4"], inv1:["D4","F#4","B4"], inv2:["F#4","B4","D5"] },
  ];
  const s = pick(sets);
  // Broken (arpeggiated) version: play notes one by one then inversion as chord
  function broken(arr) { return arr.map((n,i) => note([n],"quarter",i+1)); }
  const m1 = broken(s.root);
  const m2 = [note(s.inv1,"quarter",1), note(s.inv2,"quarter",2), note(s.root,"half",3)];
  return makeExercise({
    level: 10, mode: hand==="both"?"right":hand, type: "sequence",
    title: `${s.name} (arpeggiated)`,
    difficultyScore: 62,
    measures: [
      { number:1, rightHand: hand!=="left"?m1:[], leftHand: hand==="left"?m1:[] },
      { number:2, rightHand: hand!=="left"?m2:[], leftHand: hand==="left"?m2:[] },
    ],
    hint: "Root position broken, then inversions",
  });
}

// Level 11 extra: wider range accidentals
function gen11b(hand) {
  const patterns = [
    { notes:["F#4","G4","A4","B4","C5","B4","A#4","G4"], dur:["eighth","eighth","quarter","quarter","dotted-quarter","eighth","quarter","quarter"] },
    { notes:["E4","F#4","G#4","A4","B4","C5","B4","G#4"], dur:["quarter","eighth","eighth","quarter","dotted-quarter","eighth","quarter","quarter"] },
    { notes:["C5","B4","A#4","A4","G#4","G4","F#4","F4"], dur:["dotted-quarter","eighth","eighth","eighth","eighth","quarter","quarter","quarter"] },
    { notes:["D4","E4","F#4","G#4","A4","B4","C#5","D5"], dur:["eighth","eighth","eighth","eighth","quarter","quarter","quarter","quarter"] },
  ];
  const p = pick(patterns);
  function toEvents(notes, durs) {
    let b=1; return notes.map((n,i)=>{const ev=note([n],durs[i],b); b+=durs[i]==="dotted-quarter"?1.5:durs[i]==="eighth"?0.5:1; return ev;});
  }
  const half = Math.floor(p.notes.length/2);
  return makeExercise({
    level: 11, mode: hand==="both"?"right":hand, type: "sequence",
    title: "Chromatic phrase",
    difficultyScore: 67,
    measures: [
      { number:1, rightHand: hand!=="left"?toEvents(p.notes.slice(0,half),p.durs.slice(0,half)):[], leftHand: hand==="left"?toEvents(p.notes.slice(0,half),p.durs.slice(0,half)):[] },
      { number:2, rightHand: hand!=="left"?toEvents(p.notes.slice(half),p.durs.slice(half)):[], leftHand: hand==="left"?toEvents(p.notes.slice(half),p.durs.slice(half)):[] },
    ],
    hint: "Chromatic passing tones",
  });
}

// Level 12 extra: octave bass + melody
function gen12b(_hand) {
  const patterns = [
    { name:"D Alberti", notes:["D3","A3","F3","A3","D3","A3","F3","A3","G3","D4","B3","D4","A3","E4","C4","E4"] },
    { name:"A broken triad", notes:["A2","C#3","E3","A3","C#4","E3","A3","C#3","E3","A2","E3","C#3","A2","E3","A3","E3"] },
    { name:"C octave bass", notes:["C3","E3","G3","E3","C3","E3","G3","E3","F3","A3","C4","A3","G3","B3","D4","B3"] },
  ];
  const p = pick(patterns);
  function toEighths(notes) { let b=1; return notes.map(n=>{const ev=note([n],"eighth",b);b+=0.5;return ev;}); }
  const ev1=toEighths(p.notes.slice(0,8)), ev2=toEighths(p.notes.slice(8));
  return makeExercise({
    level: 12, mode: "left", type: "sequence",
    title: `Left hand: ${p.name}`,
    difficultyScore: 60,
    measures: [
      { number:1, rightHand:[], leftHand:ev1 },
      { number:2, rightHand:[], leftHand:ev2 },
    ],
    hint: "Bass clef — steady eighth notes",
  });
}

// Level 13 extra: more two-hand duets
function gen13b(_hand) {
  const sets = [
    {
      name:"F major duet",
      rh:[["F4"],["G4"],["A4"],["A#4"],["A4"],["G4"],["F4"],["E4"]],
      lh:[["F2"],["C3"],["F2"],["A#2"],["F2"],["C3"],["F2"],["C3"]],
      dur:["quarter","quarter","quarter","quarter","quarter","quarter","quarter","quarter"],
    },
    {
      name:"D minor duet",
      rh:[["D4"],["E4"],["F4"],["G4"],["A4"],["G4"],["F4"],["E4"]],
      lh:[["D3"],["A3"],["D3"],["A2"],["D3"],["A3"],["D3"],["A3"]],
      dur:["quarter","quarter","quarter","quarter","quarter","quarter","quarter","quarter"],
    },
    {
      name:"E minor duet",
      rh:[["E4"],["F#4"],["G4"],["A4"],["B4"],["A4"],["G4"],["F#4"]],
      lh:[["E3"],["B2"],["E3"],["G3"],["E3"],["B2"],["E3"],["B2"]],
      dur:["quarter","quarter","quarter","quarter","quarter","quarter","quarter","quarter"],
    },
  ];
  const s = pick(sets);
  function toEvents(nn,dd) { let b=1; return nn.map((n,i)=>{const ev=note(n,dd[i],b);b+=dd[i]==="eighth"?0.5:1;return ev;}); }
  return makeExercise({
    level:13, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 70,
    measures: [
      { number:1, rightHand:toEvents(s.rh.slice(0,4),s.dur.slice(0,4)), leftHand:toEvents(s.lh.slice(0,4),s.dur.slice(0,4)) },
      { number:2, rightHand:toEvents(s.rh.slice(4),s.dur.slice(4)), leftHand:toEvents(s.lh.slice(4),s.dur.slice(4)) },
    ],
    hint: "Melody over steady bass",
  });
}

// Level 14 extra: contrasting hand rhythms
function gen14b(_hand) {
  const sets = [
    {
      name:"Am – F – G – Am",
      rh:[ [["C5"],["E5"],["D5"],["C5"]], [["B4"],["A4"],["G4"],["A4"]] ],
      lh:[ [["A2","E3"],["F2","C3"],["G2","D3"],["A2","E3"]], [["F2","C3"],["G2","D3"],["A2","E3"],["E3","B3"]] ],
    },
    {
      name:"F – G – Am – C",
      rh:[ [["F4"],["G4"],["A4"],["B4"]], [["C5"],["B4"],["A4"],["G4"]] ],
      lh:[ [["F2","C3"],["G2","D3"],["A2","E3"],["C3","G3"]], [["F2","A2"],["G2","D3"],["A2","E3"],["C3","E3"]] ],
    },
  ];
  const s = pick(sets);
  function toEvents(nn) { return nn.map((n,i)=>note(n,"quarter",i+1)); }
  return makeExercise({
    level:14, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 74,
    measures: [
      { number:1, rightHand:toEvents(s.rh[0]), leftHand:toEvents(s.lh[0]) },
      { number:2, rightHand:toEvents(s.rh[1]), leftHand:s.lh[1].map((n,i)=>note(n,"quarter",i+1)) },
    ],
    hint: "Melody over two-note bass",
  });
}

// Level 15 extra: more complex two-hand
function gen15b(_hand) {
  const sets = [
    {
      name:"Seventh chord arpeggios",
      rh:[
        [note(["G4"],"eighth",1),note(["B4"],"eighth",1.5),note(["D5"],"eighth",2),note(["F5"],"eighth",2.5),note(["G5"],"quarter",3),note(["F5"],"quarter",4)],
        [note(["E5","G5","B5"],"quarter",1),note(["D5"],"eighth",2),note(["C5"],"eighth",2.5),note(["B4","D5","G5"],"half",3)],
        [note(["A4"],"eighth",1),note(["C5"],"eighth",1.5),note(["E5"],"eighth",2),note(["G5"],"eighth",2.5),note(["F5"],"quarter",3),note(["E5"],"quarter",4)],
      ],
      lh:[
        [note(["G2","D3"],"quarter",1),note(["G2","B2"],"quarter",2),note(["C3","G3"],"quarter",3),note(["D3","A3"],"quarter",4)],
        [note(["G2","D3","B3"],"half",1),note(["C3","E3","G3"],"quarter",3),note(["D3","F#3","A3"],"quarter",4)],
        [note(["A2","E3","C4"],"quarter",1),note(["F2","C3","A3"],"quarter",2),note(["G2","D3","B3"],"half",3)],
      ],
    },
    {
      name:"Flowing contrary motion",
      rh:[
        [note(["C5"],"eighth",1),note(["D5"],"eighth",1.5),note(["E5"],"eighth",2),note(["F5"],"eighth",2.5),note(["G5"],"quarter",3),note(["F5"],"quarter",4)],
        [note(["E5"],"quarter",1),note(["D5"],"quarter",2),note(["C5","E5","G5"],"half",3)],
        [note(["F5"],"eighth",1),note(["E5"],"eighth",1.5),note(["D5"],"eighth",2),note(["C5"],"eighth",2.5),note(["B4","D5"],"half",3)],
      ],
      lh:[
        [note(["C3"],"eighth",1),note(["B2"],"eighth",1.5),note(["A2"],"eighth",2),note(["G2"],"eighth",2.5),note(["F2"],"quarter",3),note(["G2"],"quarter",4)],
        [note(["A2"],"quarter",1),note(["B2"],"quarter",2),note(["C3","E3","G3"],"half",3)],
        [note(["G2"],"eighth",1),note(["A2"],"eighth",1.5),note(["B2"],"eighth",2),note(["C3"],"eighth",2.5),note(["G2","D3"],"half",3)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:15, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 79,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Both hands — watch the interplay",
  });
}

// Level 16 extra: arpeggios with wide bass
function gen16b(_hand) {
  const sets = [
    {
      name:"Broken seventh arpeggio",
      rh:[
        [note(["E4"],"sixteenth",1),note(["G4"],"sixteenth",1.25),note(["B4"],"sixteenth",1.5),note(["D5"],"sixteenth",1.75),note(["F5"],"sixteenth",2),note(["D5"],"sixteenth",2.25),note(["B4"],"sixteenth",2.5),note(["G4"],"sixteenth",2.75),note(["E4"],"quarter",3),note(["F#4","A4","C5"],"quarter",4)],
        [note(["D5"],"eighth",1),note(["C5"],"eighth",1.5),note(["B4"],"eighth",2),note(["A4"],"eighth",2.5),note(["G4","B4","D5"],"quarter",3),note(["A4"],"quarter",4)],
        [note(["G4","B4","D5","F5"],"quarter",1),note(["A4","C5","E5"],"quarter",2),note(["D4","F#4","A4","C5"],"half",3)],
      ],
      lh:[
        [note(["E3"],"eighth",1),note(["B3"],"eighth",2),note(["E3"],"eighth",3),note(["G3"],"eighth",4)],
        [note(["A2","E3"],"quarter",1),note(["D3","A3"],"quarter",2),note(["E3","B3"],"quarter",3),note(["A2"],"quarter",4)],
        [note(["D3","A3","F4"],"whole",1)],
      ],
    },
    {
      name:"Descending chromatic with bass",
      rh:[
        [note(["D5"],"sixteenth",1),note(["C#5"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["B4"],"sixteenth",1.75),note(["A#4"],"sixteenth",2),note(["A4"],"sixteenth",2.25),note(["G#4"],"eighth",2.5),note(["G4"],"quarter",3),note(["F#4","A4"],"quarter",4)],
        [note(["F4","A4","C5"],"quarter",1),note(["E4"],"eighth",2),note(["F4"],"eighth",2.5),note(["G4","B4","D5"],"quarter",3),note(["G4"],"quarter",4)],
        [note(["C5","E5","G5"],"quarter",1),note(["B4","D5","F5"],"quarter",2),note(["A4","C5","E5","G5"],"half",3)],
      ],
      lh:[
        [note(["D3","A3"],"quarter",1),note(["G2","D3"],"quarter",2),note(["C3","G3"],"quarter",3),note(["G2"],"quarter",4)],
        [note(["F2","C3","A3"],"half",1),note(["G2","D3"],"quarter",3),note(["C3","G3"],"quarter",4)],
        [note(["A2","E3","C4"],"whole",1)],
      ],
    },
    {
      name:"Syncopated both hands",
      rh:[
        [note(["G4"],"dotted-quarter",1),note(["A4"],"eighth",2.5),note(["B4"],"dotted-quarter",3),note(["C5"],"eighth",4.5)],
        [note(["D5"],"eighth",1),note(["C5"],"eighth",1.5),note(["B4","D5","G5"],"quarter",2),note(["A4"],"eighth",3),note(["B4"],"eighth",3.5),note(["G4","B4","D5"],"quarter",4)],
        [note(["E5","G5","B5"],"quarter",1),note(["D5","F#5","A5"],"quarter",2),note(["G4","B4","D5","G5"],"half",3)],
      ],
      lh:[
        [note(["G2"],"quarter",1),note(["D3"],"quarter",2),note(["G2"],"quarter",3),note(["D3"],"quarter",4)],
        [note(["G2","D3"],"half",1),note(["C3","G3"],"quarter",3),note(["D3","A3"],"quarter",4)],
        [note(["G2","D3","B3"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:16, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 84,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Advanced — mixed rhythms both hands",
  });
}

// Level 17 extra: more key/modal variety
function gen17b(_hand) {
  const sets = [
    {
      name:"G major with modulation",
      rh:[
        [note(["G4"],"eighth",1),note(["A4"],"eighth",1.5),note(["B4"],"eighth",2),note(["C5"],"eighth",2.5),note(["D5"],"eighth",3),note(["E5"],"eighth",3.5),note(["F#5"],"quarter",4)],
        [note(["G5"],"eighth",1),note(["F5"],"eighth",1.5),note(["E5"],"eighth",2),note(["D5"],"eighth",2.5),note(["E5","G5","B5"],"quarter",3),note(["A4"],"quarter",4)],
        [note(["D5","F#5","A5"],"quarter",1),note(["C5","E5","G5"],"quarter",2),note(["B4","D5","G5","F5"],"half",3)],
      ],
      lh:[
        [note(["G2","D3"],"quarter",1),note(["G2","B2"],"quarter",2),note(["C3","G3"],"quarter",3),note(["D3","A3"],"quarter",4)],
        [note(["G2","D3","B3"],"half",1),note(["A2","E3"],"quarter",3),note(["D3","F#3"],"quarter",4)],
        [note(["G2","B2","D3"],"quarter",1),note(["C3","E3","G3"],"quarter",2),note(["G2","D3","G3","B3"],"half",3)],
      ],
    },
    {
      name:"E minor passage",
      rh:[
        [note(["E5"],"sixteenth",1),note(["D5"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["B4"],"sixteenth",1.75),note(["A4"],"eighth",2),note(["G#4"],"eighth",2.5),note(["A4","C5","E5"],"quarter",3),note(["B4"],"quarter",4)],
        [note(["D5","F#5"],"quarter",1),note(["C5","E5"],"quarter",2),note(["B4","D5","G5"],"half",3)],
        [note(["E5","G5","B5"],"quarter",1),note(["D5","F#5","A5"],"quarter",2),note(["C5","E5","G5","B5"],"half",3)],
      ],
      lh:[
        [note(["E3"],"eighth",1),note(["B3"],"eighth",1.5),note(["G3"],"eighth",2),note(["B3"],"eighth",2.5),note(["E3"],"eighth",3),note(["G#3"],"eighth",3.5),note(["B3"],"eighth",4),note(["E3"],"eighth",4.5)],
        [note(["D3","A3"],"quarter",1),note(["G2","D3","B3"],"quarter",2),note(["A2","E3","C4"],"half",3)],
        [note(["E3","B3","G4"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:17, mode:"both", type:"two-hand",
    title: s.name,
    difficultyScore: 88,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Dense — read every accidental",
  });
}

// Level 18 extra: more virtuoso variety
function gen18b(_hand) {
  const sets = [
    {
      name:"Rolling arpeggios",
      rh:[
        [note(["G4"],"sixteenth",1),note(["B4"],"sixteenth",1.25),note(["D5"],"sixteenth",1.5),note(["G5"],"sixteenth",1.75),note(["F5"],"sixteenth",2),note(["D5"],"sixteenth",2.25),note(["B4"],"sixteenth",2.5),note(["G4"],"sixteenth",2.75),note(["A4"],"sixteenth",3),note(["C5"],"sixteenth",3.25),note(["E5"],"sixteenth",3.5),note(["A5"],"sixteenth",3.75)],
        [note(["F5"],"sixteenth",1),note(["A5"],"sixteenth",1.25),note(["C6"],"sixteenth",1.5),note(["F5"],"sixteenth",1.75),note(["E5"],"sixteenth",2),note(["C5"],"sixteenth",2.25),note(["A4"],"sixteenth",2.5),note(["F4"],"sixteenth",2.75),note(["E4"],"quarter",3),note(["D5","F5","A5"],"quarter",4)],
        [note(["G4","B4","D5"],"quarter",1),note(["A4","C5","E5"],"quarter",2),note(["D4","F#4","A4","C5"],"quarter",3),note(["G4","B4","D5","G5"],"quarter",4)],
        [note(["C5","E5","G5"],"quarter",1),note(["A4","C5","F5"],"quarter",2),note(["G4","B4","D5","F5"],"quarter",3),note(["C4","E4","G4","C5"],"quarter",4)],
      ],
      lh:[
        [note(["G2"],"eighth",1),note(["D3"],"eighth",2),note(["B2"],"eighth",3),note(["D3"],"eighth",4)],
        [note(["F2"],"eighth",1),note(["C3"],"eighth",2),note(["A2"],"eighth",3),note(["C3"],"eighth",4)],
        [note(["D3","A3"],"quarter",1),note(["A2","E3"],"quarter",2),note(["D3","F#3","A3"],"quarter",3),note(["G2","D3"],"quarter",4)],
        [note(["C3","G3","E4"],"whole",1)],
      ],
    },
    {
      name:"Chromatic fury",
      rh:[
        [note(["E4"],"sixteenth",1),note(["F4"],"sixteenth",1.25),note(["F#4"],"sixteenth",1.5),note(["G4"],"sixteenth",1.75),note(["G#4"],"sixteenth",2),note(["A4"],"sixteenth",2.25),note(["A#4"],"sixteenth",2.5),note(["B4"],"sixteenth",2.75),note(["C5"],"sixteenth",3),note(["C#5"],"sixteenth",3.25),note(["D5"],"sixteenth",3.5),note(["D#5"],"sixteenth",3.75)],
        [note(["E5"],"eighth",1),note(["D#5"],"eighth",1.5),note(["D5"],"eighth",2),note(["C#5"],"eighth",2.5),note(["C5","E5","G5"],"quarter",3),note(["B4"],"quarter",4)],
        [note(["A#4"],"eighth",1),note(["A4"],"eighth",1.5),note(["G#4"],"eighth",2),note(["G4"],"eighth",2.5),note(["F#4","A4","C#5"],"quarter",3),note(["E4","G#4","B4"],"quarter",4)],
        [note(["C5","E5","G5","B5"],"quarter",1),note(["A4","C5","F5"],"quarter",2),note(["G4","B4","D5","F5"],"quarter",3),note(["C4","E4","G4","C5"],"quarter",4)],
      ],
      lh:[
        [note(["E3","B3"],"quarter",1),note(["A2","E3"],"quarter",2),note(["D3","A3"],"quarter",3),note(["G2","D3"],"quarter",4)],
        [note(["C3","G3","E4"],"half",1),note(["G2","D3","B3"],"half",3)],
        [note(["A2","E3","C4"],"quarter",1),note(["D3","F#3","A3"],"quarter",2),note(["E3","G#3","B3"],"quarter",3),note(["A2","E3","A3"],"quarter",4)],
        [note(["C3","G3","E4"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:18, mode:"both", type:"virtuoso",
    title: s.name,
    difficultyScore: 92,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Virtuoso — precision required",
  });
}

// Level 19 extra
function gen19b(_hand) {
  const sets = [
    {
      name:"Concert etude in A minor",
      key:"a",
      rh:[
        [note(["A4"],"sixteenth",1),note(["B4"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["D5"],"sixteenth",1.75),note(["E5"],"sixteenth",2),note(["F5"],"sixteenth",2.25),note(["G#5"],"sixteenth",2.5),note(["A5"],"sixteenth",2.75),note(["G#5"],"eighth",3),note(["F5"],"eighth",3.5),note(["E5","G#5"],"quarter",4)],
        [note(["D5","F5","A5"],"quarter",1),note(["C5"],"eighth",2),note(["B4"],"eighth",2.5),note(["A4","C5","E5"],"quarter",3),note(["G#4","B4","E5"],"quarter",4)],
        [note(["A4"],"sixteenth",1),note(["C5"],"sixteenth",1.25),note(["E5"],"sixteenth",1.5),note(["A5"],"sixteenth",1.75),note(["B5"],"sixteenth",2),note(["A5"],"sixteenth",2.25),note(["G#5"],"sixteenth",2.5),note(["F5"],"sixteenth",2.75),note(["E5"],"eighth",3),note(["D5"],"eighth",3.5),note(["C5"],"quarter",4)],
        [note(["B4","D5","G#5"],"quarter",1),note(["A4","C5","E5"],"quarter",2),note(["E4","G#4","B4","E5"],"half",3)],
      ],
      lh:[
        [note(["A2"],"eighth",1),note(["E3"],"eighth",1.5),note(["A3"],"eighth",2),note(["E3"],"eighth",2.5),note(["A2"],"eighth",3),note(["E3"],"eighth",3.5),note(["G#3"],"eighth",4),note(["E3"],"eighth",4.5)],
        [note(["F3","A3","C4"],"quarter",1),note(["E3","G#3","B3"],"quarter",2),note(["A2","E3","C4"],"quarter",3),note(["E3","G#3","B3"],"quarter",4)],
        [note(["A2","E3","A3"],"quarter",1),note(["D3","F3","A3"],"quarter",2),note(["E3","B3","G#4"],"quarter",3),note(["A2","E3","A3"],"quarter",4)],
        [note(["E3","G#3","B3","D4"],"quarter",1),note(["A2","C3","E3","A3"],"quarter",2),note(["A2","E3","A3","C4","E4"],"half",3)],
      ],
    },
    {
      name:"Grand arpeggio fantasy",
      key:"C",
      rh:[
        [note(["C5"],"sixteenth",1),note(["E5"],"sixteenth",1.25),note(["G5"],"sixteenth",1.5),note(["B5"],"sixteenth",1.75),note(["D6"],"sixteenth",2),note(["B5"],"sixteenth",2.25),note(["G5"],"sixteenth",2.5),note(["E5"],"sixteenth",2.75),note(["D5"],"sixteenth",3),note(["B4"],"sixteenth",3.25),note(["G4"],"sixteenth",3.5),note(["E4"],"sixteenth",3.75)],
        [note(["F4"],"sixteenth",1),note(["A4"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["E5"],"sixteenth",1.75),note(["G5"],"sixteenth",2),note(["E5"],"sixteenth",2.25),note(["C5"],"sixteenth",2.5),note(["A4"],"sixteenth",2.75),note(["G4","B4","D5"],"quarter",3),note(["G4"],"quarter",4)],
        [note(["A4"],"sixteenth",1),note(["C5"],"sixteenth",1.25),note(["E5"],"sixteenth",1.5),note(["G5"],"sixteenth",1.75),note(["F5"],"sixteenth",2),note(["D5"],"sixteenth",2.25),note(["B4"],"sixteenth",2.5),note(["G4"],"sixteenth",2.75),note(["E4","G4","C5","E5"],"quarter",3),note(["F4","A4","C5","E5"],"quarter",4)],
        [note(["G4","B4","D5","G5"],"quarter",1),note(["F4","A4","C5","F5"],"quarter",2),note(["E4","G4","B4","E5"],"quarter",3),note(["C4","E4","G4","C5"],"quarter",4)],
      ],
      lh:[
        [note(["C3"],"eighth",1),note(["G3"],"eighth",1.5),note(["E3"],"eighth",2),note(["G3"],"eighth",2.5),note(["C3"],"eighth",3),note(["G3"],"eighth",3.5),note(["B3"],"eighth",4),note(["G3"],"eighth",4.5)],
        [note(["F2","C3"],"eighth",1),note(["A3"],"eighth",2),note(["F3"],"eighth",3),note(["C4"],"eighth",4)],
        [note(["A2","E3","C4"],"quarter",1),note(["F2","C3","A3"],"quarter",2),note(["G2","D3","B3"],"quarter",3),note(["C3","G3","E4"],"quarter",4)],
        [note(["C3","E3","G3","C4"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:19, mode:"both", type:"virtuoso",
    title: s.name,
    keySignature: s.key,
    difficultyScore: 96,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Concert-level — every note counts",
    requiredAccuracy: 0.92,
  });
}

// Level 20 extra
function gen20b(_hand) {
  const sets = [
    {
      name:"Grandmaster: Arpeggio Tempest",
      rh:[
        [note(["C5"],"sixteenth",1),note(["E5"],"sixteenth",1.25),note(["G5"],"sixteenth",1.5),note(["C6"],"sixteenth",1.75),note(["B5"],"sixteenth",2),note(["G5"],"sixteenth",2.25),note(["E5"],"sixteenth",2.5),note(["C5"],"sixteenth",2.75),note(["D5"],"sixteenth",3),note(["F5"],"sixteenth",3.25),note(["A5"],"sixteenth",3.5),note(["C6"],"sixteenth",3.75)],
        [note(["B5"],"eighth",1),note(["A5"],"eighth",1.5),note(["G5"],"eighth",2),note(["F5"],"eighth",2.5),note(["E5","G5","B5"],"quarter",3),note(["D5"],"quarter",4)],
        [note(["G5"],"sixteenth",1),note(["F#5"],"sixteenth",1.25),note(["F5"],"sixteenth",1.5),note(["E5"],"sixteenth",1.75),note(["D#5"],"sixteenth",2),note(["D5"],"sixteenth",2.25),note(["C#5"],"sixteenth",2.5),note(["C5"],"sixteenth",2.75),note(["B4","D5","G5"],"quarter",3),note(["A4","C5","F#5"],"quarter",4)],
        [note(["G5","B5","D6"],"eighth",1),note(["F5"],"eighth",1.5),note(["E5","G5","C6"],"eighth",2),note(["D5"],"eighth",2.5),note(["C5","E5","G5","B5"],"quarter",3),note(["F4","A4","C5","E5"],"quarter",4)],
        [note(["E5","G5","B5"],"quarter",1),note(["D5","F#5","A5"],"quarter",2),note(["C5","E5","G5","B5"],"quarter",3),note(["G4","B4","D5","G5"],"quarter",4)],
      ],
      lh:[
        [note(["C3"],"sixteenth",1),note(["G3"],"sixteenth",1.25),note(["E3"],"sixteenth",1.5),note(["G3"],"sixteenth",1.75),note(["C3"],"eighth",2),note(["G2"],"eighth",2.5),note(["C3"],"eighth",3),note(["G3"],"eighth",3.5)],
        [note(["G2","D3"],"quarter",1),note(["A2","E3"],"quarter",2),note(["D3","A3","F4"],"quarter",3),note(["G2","D3","B3"],"quarter",4)],
        [note(["C3"],"sixteenth",1),note(["E3"],"sixteenth",1.25),note(["G3"],"sixteenth",1.5),note(["B3"],"sixteenth",1.75),note(["A3"],"eighth",2),note(["F3"],"eighth",2.5),note(["D3","F#3","A3"],"quarter",3),note(["G2","D3","G3"],"quarter",4)],
        [note(["E3","G#3","B3"],"quarter",1),note(["A2","E3","C4"],"quarter",2),note(["F3","A3","C4","E4"],"quarter",3),note(["G2","D3","B3","F4"],"quarter",4)],
        [note(["C3","G3","E4"],"quarter",1),note(["G2","D3","B3"],"quarter",2),note(["A2","C3","E3","G3"],"quarter",3),note(["C3","G3","E4","G4"],"quarter",4)],
      ],
    },
    {
      name:"Grandmaster: Modal Storm",
      rh:[
        [note(["D5"],"sixteenth",1),note(["E5"],"sixteenth",1.25),note(["F5"],"sixteenth",1.5),note(["G5"],"sixteenth",1.75),note(["A5"],"sixteenth",2),note(["A#5"],"sixteenth",2.25),note(["C6"],"sixteenth",2.5),note(["D6"],"sixteenth",2.75),note(["C6"],"sixteenth",3),note(["A#5"],"sixteenth",3.25),note(["A5"],"sixteenth",3.5),note(["G5"],"sixteenth",3.75)],
        [note(["F5"],"eighth",1),note(["E5"],"eighth",1.5),note(["D5"],"eighth",2),note(["C5"],"eighth",2.5),note(["D5","F5","A5"],"quarter",3),note(["C5"],"quarter",4)],
        [note(["A#4"],"sixteenth",1),note(["C5"],"sixteenth",1.25),note(["D5"],"sixteenth",1.5),note(["F5"],"sixteenth",1.75),note(["G5"],"sixteenth",2),note(["A5"],"sixteenth",2.25),note(["A#5"],"sixteenth",2.5),note(["C6"],"sixteenth",2.75),note(["A#5","D6"],"quarter",3),note(["G5","A#5","D6"],"quarter",4)],
        [note(["F5","A5","C6"],"eighth",1),note(["E5"],"eighth",1.5),note(["D5","F5","A5"],"eighth",2),note(["C5"],"eighth",2.5),note(["A#4","D5","F5","A5"],"quarter",3),note(["F4","A4","C5","F5"],"quarter",4)],
        [note(["D5","F5","A5"],"quarter",1),note(["C5","E5","G5"],"quarter",2),note(["A#4","D5","F5","A5"],"quarter",3),note(["F4","A4","C5","F5"],"quarter",4)],
      ],
      lh:[
        [note(["D3"],"sixteenth",1),note(["F3"],"sixteenth",1.25),note(["A3"],"sixteenth",1.5),note(["C4"],"sixteenth",1.75),note(["A#3"],"eighth",2),note(["G3"],"eighth",2.5),note(["F3"],"eighth",3),note(["D3"],"eighth",3.5)],
        [note(["C3","G3"],"quarter",1),note(["D3","A3"],"quarter",2),note(["A#2","F3","D4"],"quarter",3),note(["C3","G3","E4"],"quarter",4)],
        [note(["D3","A3"],"sixteenth",1),note(["F3"],"sixteenth",1.25),note(["A3"],"sixteenth",1.5),note(["C4"],"sixteenth",1.75),note(["A#3"],"eighth",2),note(["G3"],"eighth",2.5),note(["A#2","F3","D4"],"quarter",3),note(["C3","G3"],"quarter",4)],
        [note(["F2","A2","C3","F3"],"quarter",1),note(["D2","A2","D3","F3"],"quarter",2),note(["A#2","F3","A3","C4"],"quarter",3),note(["F2","C3","F3","A3"],"quarter",4)],
        [note(["D3","F3","A3","C4"],"quarter",1),note(["A#2","F3","D4"],"quarter",2),note(["C3","G3","E4","A#4"],"quarter",3),note(["F2","C3","F3","A3","C4"],"quarter",4)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level:20, mode:"both", type:"virtuoso",
    title: s.name,
    difficultyScore: 100,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Grandmaster — no mercy",
    requiredAccuracy: 0.95,
    timeLimit: 30,
  });
}

// Chopin extra sets
function genChopinB(_hand) {
  const sets = [
    {
      name:"Nocturne Fragment in C# minor",
      rh:[
        [note(["C#5"],"sixteenth",1),note(["D#5"],"sixteenth",1.25),note(["E5"],"sixteenth",1.5),note(["F#5"],"sixteenth",1.75),note(["G#5"],"eighth",2),note(["F#5"],"eighth",2.5),note(["E5","G#5","B5"],"quarter",3),note(["C#5"],"quarter",4)],
        [note(["F#5"],"sixteenth",1),note(["E5"],"sixteenth",1.25),note(["D#5"],"sixteenth",1.5),note(["C#5"],"sixteenth",1.75),note(["B4","D#5","F#5"],"eighth",2),note(["A#4"],"eighth",2.5),note(["G#4","B4","E5"],"quarter",3),note(["A4","C#5","E5"],"quarter",4)],
        [note(["G#5"],"eighth",1),note(["F#5"],"eighth",1.5),note(["E5"],"eighth",2),note(["D#5"],"eighth",2.5),note(["C#5"],"sixteenth",3),note(["B4"],"sixteenth",3.25),note(["A#4"],"sixteenth",3.5),note(["G#4"],"sixteenth",3.75),note(["G#4","B4","E5"],"quarter",4)],
        [note(["C#5"],"sixteenth",1),note(["E5"],"sixteenth",1.25),note(["G#5"],"sixteenth",1.5),note(["C#6"],"sixteenth",1.75),note(["B5"],"sixteenth",2),note(["G#5"],"sixteenth",2.25),note(["E5"],"sixteenth",2.5),note(["C#5"],"sixteenth",2.75),note(["D#5"],"sixteenth",3),note(["F#5"],"sixteenth",3.25),note(["A#5"],"sixteenth",3.5),note(["C#6"],"sixteenth",3.75)],
        [note(["C#6","E6","G#6"],"eighth",1),note(["B5"],"eighth",1.5),note(["A#5","C#6","F6"],"eighth",2),note(["G#5"],"eighth",2.5),note(["F#5","A#5","C#6"],"quarter",3),note(["E5","G#5","C#6"],"quarter",4)],
        [note(["G#5","B5","D#6","F#6"],"quarter",1),note(["C#5","E5","G#5","C#6"],"quarter",2),note(["G#4","B4","D#5","G#5"],"quarter",3),note(["C#4","E4","G#4","B4","C#5"],"quarter",4)],
      ],
      lh:[
        [note(["C#3"],"eighth",1),note(["G#3"],"eighth",1.5),note(["C#4"],"eighth",2),note(["G#3"],"eighth",2.5),note(["C#3"],"eighth",3),note(["E3"],"eighth",3.5),note(["G#3"],"eighth",4),note(["C#4"],"eighth",4.5)],
        [note(["F#2"],"eighth",1),note(["C#3"],"eighth",1.5),note(["A#3"],"eighth",2),note(["C#3"],"eighth",2.5),note(["G#2"],"eighth",3),note(["D#3"],"eighth",3.5),note(["B3"],"eighth",4),note(["G#2"],"eighth",4.5)],
        [note(["C#3"],"sixteenth",1),note(["G#3"],"sixteenth",1.25),note(["E3"],"sixteenth",1.5),note(["G#3"],"sixteenth",1.75),note(["C#4"],"sixteenth",2),note(["G#3"],"sixteenth",2.25),note(["E3"],"sixteenth",2.5),note(["G#3"],"sixteenth",2.75),note(["C#3"],"eighth",3),note(["B2","D#3","F#3"],"quarter",3.5)],
        [note(["G#3","B3","D#4"],"quarter",1),note(["C#3","G#3","E4"],"quarter",2),note(["F#3","A#3","C#4"],"quarter",3),note(["G#2","D#3","B3","F3"],"quarter",4)],
        [note(["C#3"],"eighth",1),note(["G#3"],"eighth",1.5),note(["C#4"],"eighth",2),note(["E4"],"eighth",2.5),note(["G#4"],"eighth",3),note(["E4"],"eighth",3.5),note(["C#4"],"eighth",4),note(["G#3"],"eighth",4.5)],
        [note(["C#3","G#3","C#4","E4","G#4"],"whole",1)],
      ],
    },
    {
      name:"Ballade-style passage",
      rh:[
        [note(["G4"],"eighth",1),note(["A4"],"eighth",1.5),note(["B4"],"eighth",2),note(["D5"],"eighth",2.5),note(["C5"],"eighth",3),note(["A4"],"eighth",3.5),note(["B4","D5","G5"],"quarter",4)],
        [note(["A5"],"eighth",1),note(["G5"],"eighth",1.5),note(["F#5"],"eighth",2),note(["E5"],"eighth",2.5),note(["D5"],"sixteenth",3),note(["C5"],"sixteenth",3.25),note(["B4"],"sixteenth",3.5),note(["A4"],"sixteenth",3.75),note(["G4","B4","D5"],"quarter",4)],
        [note(["E5"],"sixteenth",1),note(["D5"],"sixteenth",1.25),note(["C5"],"sixteenth",1.5),note(["B4"],"sixteenth",1.75),note(["A4"],"sixteenth",2),note(["G#4"],"sixteenth",2.25),note(["A4"],"sixteenth",2.5),note(["B4"],"sixteenth",2.75),note(["C5","E5","G5"],"quarter",3),note(["A4","C5","E5"],"quarter",4)],
        [note(["B4"],"sixteenth",1),note(["D5"],"sixteenth",1.25),note(["F#5"],"sixteenth",1.5),note(["A5"],"sixteenth",1.75),note(["G5"],"sixteenth",2),note(["E5"],"sixteenth",2.25),note(["D5"],"sixteenth",2.5),note(["B4"],"sixteenth",2.75),note(["C5"],"sixteenth",3),note(["E5"],"sixteenth",3.25),note(["G5"],"sixteenth",3.5),note(["B5"],"sixteenth",3.75)],
        [note(["A5","C6","E6"],"eighth",1),note(["G5"],"eighth",1.5),note(["F#5","A5","D6"],"eighth",2),note(["E5"],"eighth",2.5),note(["D5","F#5","A5"],"quarter",3),note(["G4","B4","D5"],"quarter",4)],
        [note(["G5","B5","D6","F#6"],"quarter",1),note(["D5","F#5","A5","C6"],"quarter",2),note(["G4","B4","D5","G5"],"quarter",3),note(["G3","D4","G4","B4","D5"],"quarter",4)],
      ],
      lh:[
        [note(["G2"],"eighth",1),note(["D3"],"eighth",1.5),note(["B3"],"eighth",2),note(["D3"],"eighth",2.5),note(["G2"],"eighth",3),note(["D3"],"eighth",3.5),note(["B3"],"eighth",4),note(["D3"],"eighth",4.5)],
        [note(["C3"],"eighth",1),note(["G3"],"eighth",1.5),note(["E4"],"eighth",2),note(["G3"],"eighth",2.5),note(["A2"],"eighth",3),note(["E3"],"eighth",3.5),note(["C4"],"eighth",4),note(["E3"],"eighth",4.5)],
        [note(["A2"],"sixteenth",1),note(["E3"],"sixteenth",1.25),note(["A3"],"sixteenth",1.5),note(["C4"],"sixteenth",1.75),note(["E4"],"sixteenth",2),note(["C4"],"sixteenth",2.25),note(["A3"],"sixteenth",2.5),note(["E3"],"sixteenth",2.75),note(["A2"],"eighth",3),note(["G#2","B2","D3"],"quarter",3.5)],
        [note(["G2","D3"],"quarter",1),note(["D3","A3","F#4"],"quarter",2),note(["G2","D3","B3"],"quarter",3),note(["A2","E3","C4"],"quarter",4)],
        [note(["A2"],"eighth",1),note(["E3"],"eighth",1.5),note(["A3"],"eighth",2),note(["C4"],"eighth",2.5),note(["E4"],"eighth",3),note(["C4"],"eighth",3.5),note(["A3"],"eighth",4),note(["E3"],"eighth",4.5)],
        [note(["G2","D3","G3","B3","D4"],"whole",1)],
      ],
    },
  ];
  const s = pick(sets);
  return makeExercise({
    level: 20, mode:"both", type:"virtuoso",
    title: s.name,
    difficultyScore: 122,
    measures: s.rh.map((rh,i)=>({ number:i+1, rightHand:rh, leftHand:s.lh[i] })),
    hint: "Chopin Mode — Romantic fury.",
    requiredAccuracy: 0.95,
    timeLimit: 8,
  });
}

// ── Anti-repetition fingerprint memory ────────────────────────────────────
const RECENT_FINGERPRINTS = [];
const MAX_RECENT = 20;

function fingerprint(ex) {
  if (!ex) return "";
  const tokens = [];
  for (const measure of ex.measures || []) {
    for (const hand of ["rightHand", "leftHand"]) {
      for (const event of measure[hand] || []) {
        if (event.rest || !event.keys?.length) continue;
        tokens.push(`${hand[0]}:${event.beat}:${event.duration}:${event.keys.join("+")}`);
      }
    }
  }
  const sequence = tokens.slice(0, 36).join("|");
  const level = ex.level || 0;
  const type = ex.type || "";
  const measures = (ex.measures || []).length;
  return `${level}|${type}|${measures}|${sequence}`;
}

// Validate exercise before showing — returns true if safe to display
function hasHandNotes(ex, hand) {
  const handKey = hand === "left" ? "leftHand" : "rightHand";
  return ex?.measures?.some(m => (m[handKey] || []).some(e => !e.rest && e.keys.length > 0));
}

function validateExercise(ex, requestedHand = "right") {
  if (!ex || !ex.measures || ex.measures.length === 0) return false;
  const notes = ex.notes || [];
  if (notes.length === 0) return false;
  const noteCount = (ex.measures || []).reduce((total, measure) => {
    return total + ["rightHand", "leftHand"].reduce((sum, handKey) => {
      return sum + (measure[handKey] || []).reduce((eventTotal, event) => {
        return eventTotal + (!event.rest ? event.keys?.length || 0 : 0);
      }, 0);
    }, 0);
  }, 0);
  const hasRH = hasHandNotes(ex, "right");
  const hasLH = hasHandNotes(ex, "left");
  if (requestedHand === "both") {
    if (!hasRH || !hasLH || ex.mode !== "both") return false;
  } else if (requestedHand === "left") {
    if (!hasLH || hasRH || ex.mode !== "left") return false;
  } else {
    if (!hasRH || hasLH || ex.mode !== "right") return false;
  }
  // High levels (10+) must have more than 1 unique note
  if ((ex.level || 0) >= 10 && notes.length <= 1) return false;
  if (noteCount < minNotesFor(ex.level || 1, 0)) return false;
  return true;
}

function isRecentDuplicate(ex) {
  const fp = fingerprint(ex);
  return RECENT_FINGERPRINTS.includes(fp);
}

function trackFingerprint(ex) {
  const fp = fingerprint(ex);
  RECENT_FINGERPRINTS.push(fp);
  if (RECENT_FINGERPRINTS.length > MAX_RECENT) RECENT_FINGERPRINTS.shift();
}

// ── Expanded pools for levels 6-8 (song-like phrases) ────────────────────
const POOL_6 = [gen6, gen6b];
const POOL_7 = [gen7, gen7b];
const POOL_8 = [gen8, gen8b];

// ── Level dispatcher ──────────────────────────────────────────────────────
const GENERATORS = [null, gen1, gen2, gen3, gen4, gen5, gen6, gen7, gen8, gen9, gen10,
  gen11, gen12, gen13, gen14, gen15, gen16, gen17, gen18, gen19, gen20];

// Variant generators — interleaved with originals for variety
const VARIANT_GENERATORS = [null, gen1b, gen2b, gen3b, gen4b, gen5b, gen6b, gen7b, gen8b, gen9b, gen10b,
  gen11b, gen12b, gen13b, gen14b, gen15b, gen16b, gen17b, gen18b, gen19b, gen20b];

export function generateExercise(level, hand = "right", options = {}) {
  const l = Math.max(1, Math.min(20, level));
  const requestedHand = hand === "left" ? "left" : hand === "both" ? "both" : "right";
  const depth = Math.max(0, Math.min(9, Number(options.depth) || 0));

  let exercise = null;
  const candidates = [
    () => generateCurriculumExercise(l, requestedHand, { depth }),
    () => generateCurriculumExercise(l, requestedHand, { depth: Math.min(9, depth + 1) }),
    () => generateCurriculumExercise(l, requestedHand, { depth: Math.max(0, depth - 1) }),
    () => generateCurriculumExercise(l, requestedHand, { depth: Math.min(9, depth + 2) }),
    () => generateRuleBasedExercise(l, requestedHand, { depth: Math.min(9, depth + 2) }),
  ].filter(Boolean);

  try {
    exercise = candidates[0] ? candidates[0]() : null;
  } catch (e) {
    exercise = null;
  }

  // Anti-repetition + validation: stay on the strict curriculum path unless
  // the generated score passes the hand, level, and note-count contract.
  for (let attempt = 0; attempt < 24; attempt++) {
    const valid = validateExercise(exercise, requestedHand);
    const dup = exercise ? isRecentDuplicate(exercise) : true;
    if (valid && !dup) break;
    try {
      const altGen = candidates[attempt % candidates.length];
      exercise = altGen ? altGen() : null;
    } catch (e) { exercise = null; }
  }

  // Final fallback stays strict so harder levels cannot collapse into a
  // beginner single-note exercise.
  if (!validateExercise(exercise, requestedHand)) {
    try {
      exercise = generateCurriculumExercise(l, requestedHand, { depth: 9 });
    } catch (e) {
      exercise = generateCurriculumExercise(1, requestedHand, { depth: 0 });
    }
  }

  trackFingerprint(exercise);
  return exercise;
}

export function generateChopinExercise(hand = "both") {
  // Prefer rule-based Chopin studies; fixed collections remain fallback anchors.
  const useVariant = Math.random() > 0.5;
  let exercise = null;
  try {
    exercise = generateRuleBasedChopinExercise(hand);
  } catch (e) {
    try {
      exercise = useVariant ? genChopinB(hand) : genChopin(hand);
    } catch (inner) {
      exercise = genChopin(hand);
    }
  }
  // Anti-repetition
  for (let attempt = 0; attempt < 8 && isRecentDuplicate(exercise); attempt++) {
    try {
      const alt = attempt < 5
        ? generateRuleBasedChopinExercise(hand)
        : useVariant ? genChopin(hand) : genChopinB(hand);
      if (!isRecentDuplicate(alt)) {
        exercise = alt;
        break;
      }
    } catch (e) { /* use original */ }
  }
  trackFingerprint(exercise);
  return exercise;
}
