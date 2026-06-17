import React from "react";
import { ALL_WHITE_NOTES, BLACK_NOTES, getFrequency } from "@/lib/puzzleEngine";
import { playTone } from "@/lib/audioDetector";

// Black key positions: offset from the left of each white key group
const BLACK_KEY_MAP = {
  "C#4": { afterWhite: 0 },
  "D#4": { afterWhite: 1 },
  "F#4": { afterWhite: 3 },
  "G#4": { afterWhite: 4 },
  "A#4": { afterWhite: 5 },
  "C#5": { afterWhite: 7 },
  "D#5": { afterWhite: 8 },
  "F#5": { afterWhite: 10 },
  "G#5": { afterWhite: 11 },
  "A#5": { afterWhite: 12 },
};

const WHITE_KEY_WIDTH = 36;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_WIDTH = 22;
const BLACK_KEY_HEIGHT = 72;

export default function PianoKeyboard({ activeNotes = [], onKeyPress, highlightNotes = [], className = "" }) {
  const totalWidth = ALL_WHITE_NOTES.length * WHITE_KEY_WIDTH;

  function getWhiteKeyX(index) {
    return index * WHITE_KEY_WIDTH;
  }

  function getBlackKeyX(blackNote) {
    const { afterWhite } = BLACK_KEY_MAP[blackNote];
    return afterWhite * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH * 0.65;
  }

  function handleKeyClick(note) {
    if (onKeyPress) onKeyPress(note);
    // Play the tone
    const freq = getFrequency ? getFrequency(note) : 440;
    try {
      playTone(freq, 0.6);
    } catch (e) {}
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <svg
        width="100%"
        viewBox={`0 0 ${totalWidth} ${WHITE_KEY_HEIGHT + 4}`}
        style={{ maxWidth: totalWidth, minWidth: Math.min(totalWidth, 300) }}
      >
        {/* White keys */}
        {ALL_WHITE_NOTES.map((note, i) => {
          const isActive = activeNotes.includes(note);
          const isHighlight = highlightNotes.includes(note);
          const x = getWhiteKeyX(i);

          return (
            <g key={note} onClick={() => handleKeyClick(note)} style={{ cursor: "pointer" }}>
              <rect
                x={x + 1} y={2}
                width={WHITE_KEY_WIDTH - 2}
                height={WHITE_KEY_HEIGHT - 2}
                rx={3}
                fill={isActive ? "hsl(45, 60%, 78%)" : isHighlight ? "hsl(45, 50%, 88%)" : "hsl(0, 0%, 95%)"}
                stroke="hsl(220, 15%, 30%)"
                strokeWidth={0.5}
                style={{ transition: "fill 0.1s" }}
              />
              {/* Note label */}
              <text
                x={x + WHITE_KEY_WIDTH / 2} y={WHITE_KEY_HEIGHT - 8}
                textAnchor="middle" fontSize="9"
                fill={isActive || isHighlight ? "hsl(220, 20%, 15%)" : "hsl(220, 10%, 55%)"}
                fontFamily="Inter, sans-serif"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {note.replace("4", "").replace("5", "'")}
              </text>
            </g>
          );
        })}

        {/* Black keys (drawn on top) */}
        {BLACK_NOTES.map((note) => {
          const isActive = activeNotes.includes(note);
          const isHighlight = highlightNotes.includes(note);
          const x = getBlackKeyX(note);

          return (
            <g key={note} onClick={() => handleKeyClick(note)} style={{ cursor: "pointer" }}>
              <rect
                x={x} y={2}
                width={BLACK_KEY_WIDTH}
                height={BLACK_KEY_HEIGHT}
                rx={2}
                fill={isActive ? "hsl(45, 60%, 55%)" : isHighlight ? "hsl(45, 40%, 30%)" : "hsl(220, 20%, 12%)"}
                stroke="hsl(220, 15%, 8%)"
                strokeWidth={0.5}
                style={{ transition: "fill 0.1s" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}