import React from "react";
import { Player } from "@/types/player";

interface PlayerCardProps {
  player: Player;
}

const OUTER_R = 32;
const INNER_R = 20;
const MID_R = (OUTER_R + INNER_R) / 2;
const CARD_SIZE = OUTER_R * 2 + 4; // padding
const CX = CARD_SIZE / 2;
const CY = CARD_SIZE / 2;

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const birthYear = player.birthDate?.match(/(\d{4})/)?.[1] || "—";
  const height = player.height?.replace("m", "").replace(",", ".").trim() || "—";
  const foot = player.foot?.toUpperCase() || "—";
  const lastName = player.name?.split(" ").pop()?.toUpperCase() || "—";
  const number = player.number || "—";

  // Arc text path IDs
  const leftArcId = `arc-left-${player.id}`;
  const rightArcId = `arc-right-${player.id}`;
  const bottomArcId = `arc-bottom-${player.id}`;

  return (
    <div className="flex flex-col items-center select-none" style={{ width: 80 }}>
      <svg
        width={CARD_SIZE}
        height={CARD_SIZE}
        viewBox={`0 0 ${CARD_SIZE} ${CARD_SIZE}`}
        className="overflow-visible"
      >
        {/* Outer circle */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill="#1a1a2e" stroke="#333" strokeWidth="1" />
        {/* Inner circle */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="#0f3460" stroke="#444" strokeWidth="0.5" />

        {/* Number in center */}
        <text
          x={CX}
          y={CY + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize="16"
          fontWeight="bold"
          fontFamily="'Bebas Neue', sans-serif"
          letterSpacing="1"
        >
          {number}
        </text>

        {/* Left arc path for birth year - top-left quarter */}
        <defs>
          <path
            id={leftArcId}
            d={describeArc(CX, CY, MID_R, 200, 270)}
            fill="none"
          />
          <path
            id={rightArcId}
            d={describeArc(CX, CY, MID_R, 270, 340)}
            fill="none"
          />
          <path
            id={bottomArcId}
            d={describeArcReverse(CX, CY, MID_R, 130, 50)}
            fill="none"
          />
        </defs>

        {/* Birth year - left arc */}
        <text fill="#ccc" fontSize="7" fontFamily="'Inter', sans-serif" fontWeight="600">
          <textPath href={`#${leftArcId}`} startOffset="50%" textAnchor="middle">
            {birthYear}
          </textPath>
        </text>

        {/* Height - right arc */}
        <text fill="#ccc" fontSize="7" fontFamily="'Inter', sans-serif" fontWeight="600">
          <textPath href={`#${rightArcId}`} startOffset="50%" textAnchor="middle">
            {height}
          </textPath>
        </text>

        {/* Foot - bottom arc */}
        <text fill="#aaa" fontSize="6" fontFamily="'Inter', sans-serif" fontWeight="500">
          <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
            {foot}
          </textPath>
        </text>
      </svg>

      {/* Name rectangle - overlapping slightly with circle */}
      <div
        className="flex items-center justify-center"
        style={{
          background: "#0f3460",
          padding: "2px 8px",
          marginTop: -8,
          minWidth: 55,
          maxWidth: 80,
          borderRadius: 2,
          border: "1px solid #333",
          zIndex: 1,
        }}
      >
        <span
          className="font-display font-bold text-center leading-tight uppercase truncate"
          style={{
            fontSize: 7,
            color: "#fff",
            letterSpacing: "0.5px",
          }}
        >
          {lastName}
        </span>
      </div>
    </div>
  );
};

// Helper: describe an SVG arc path
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function describeArcReverse(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 0 ${end.x} ${end.y}`;
}

export default PlayerCard;
