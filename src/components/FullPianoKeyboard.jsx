import React from "react";

// Full 88-key piano A0–C8, 52 white keys, 36 black keys
// Note names used here match puzzleEngine: C4, D#4, G3, etc.

const WHITE_NOTES_ORDER = ["C","D","E","F","G","A","B"];

function buildAllWhiteKeys() {
  // A0, B0, then C1–B7, then C8
  const keys = ["A0","B0"];
  for (let oct = 1; oct <= 7; oct++) {
    for (const n of WHITE_NOTES_ORDER) keys.push(`${n}${oct}`);
  }
  keys.push("C8");
  return keys; // 52
}

function buildAllBlackKeys() {
  // A#0, then for each octave 1–7: C#,D#,F#,G#,A#
  const keys = ["A#0"];
  for (let oct = 1; oct <= 7; oct++) {
    keys.push(`C#${oct}`,`D#${oct}`,`F#${oct}`,`G#${oct}`,`A#${oct}`);
  }
  return keys; // 36
}

const ALL_WHITE = buildAllWhiteKeys();
const ALL_BLACK = buildAllBlackKeys();

// Map black key → its x position as a fractional white-key index
function buildBlackKeyPositions() {
  const pos = {};
  // A#0 sits between white index 0 (A0) and 1 (B0)
  pos["A#0"] = 0.65;
  for (let oct = 1; oct <= 7; oct++) {
    const base = 2 + (oct - 1) * 7; // index of C in this octave
    pos[`C#${oct}`] = base + 0.65;
    pos[`D#${oct}`] = base + 1.65;
    pos[`F#${oct}`] = base + 3.65;
    pos[`G#${oct}`] = base + 4.65;
    pos[`A#${oct}`] = base + 5.65;
  }
  return pos;
}

const BLACK_POS = buildBlackKeyPositions();

const WKW = 14;  // white key width px
const WKH = 70;  // white key height px
const BKW = 9;   // black key width px
const BKH = 44;  // black key height px

export default function FullPianoKeyboard({ highlightNotes = [] }) {
  const highlighted = new Set(highlightNotes);
  const totalWidth = ALL_WHITE.length * WKW;

  return (
    <div className="w-full overflow-x-auto rounded-xl">
      <svg
        viewBox={`0 0 ${totalWidth} ${WKH + 6}`}
        width="100%"
        style={{ minWidth: 520, display: "block" }}
      >
        {/* White keys */}
        {ALL_WHITE.map((note, i) => {
          const isHighlight = highlighted.has(note);
          return (
            <g key={note}>
              <rect
                x={i * WKW + 0.5} y={2}
                width={WKW - 1} height={WKH - 2}
                rx={2}
                fill={isHighlight ? "hsl(45, 80%, 68%)" : "hsl(0, 0%, 94%)"}
                stroke="hsl(220, 15%, 35%)"
                strokeWidth={0.5}
              />
              {isHighlight && (
                <circle
                  cx={i * WKW + WKW / 2}
                  cy={WKH - 9}
                  r={3.5}
                  fill="hsl(220, 20%, 15%)"
                />
              )}
            </g>
          );
        })}

        {/* Black keys */}
        {ALL_BLACK.map((note) => {
          const pos = BLACK_POS[note];
          if (pos === undefined) return null;
          const isHighlight = highlighted.has(note);
          const x = pos * WKW - BKW / 2;
          return (
            <g key={note}>
              <rect
                x={x} y={2}
                width={BKW} height={BKH}
                rx={1.5}
                fill={isHighlight ? "hsl(45, 75%, 50%)" : "hsl(220, 20%, 10%)"}
                stroke="hsl(220, 15%, 5%)"
                strokeWidth={0.5}
              />
              {isHighlight && (
                <circle
                  cx={x + BKW / 2}
                  cy={BKH - 5}
                  r={2.5}
                  fill="hsl(220, 20%, 10%)"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}