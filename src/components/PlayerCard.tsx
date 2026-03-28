import React from "react";
import { Player } from "@/types/player";

interface PlayerCardProps {
  player: Player;
  color1?: string; // inner circle / number bg
  color2?: string; // outer ring
  exportMode?: boolean; // when true, use pt-based sizes
}

// 145pt x 149pt export size. 1pt ≈ 1.333px, but we work in a viewBox so it scales.
const OUTER_R = 54;
const INNER_R = 34;
const MID_R = (OUTER_R + INNER_R) / 2;
const CARD_SIZE = OUTER_R * 2 + 6;
const CX = CARD_SIZE / 2;
const CY = CARD_SIZE / 2;

function getContrastColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  color1 = "#0f3460",
  color2 = "#1a1a2e",
}) => {
  const birthYear = player.birthDate?.match(/(\d{4})/)?.[1] || "—";
  const rawHeight = player.height?.replace("m", "").replace(",", ".").trim() || "";
  const heightDisplay = rawHeight ? `${rawHeight} mts` : "—";
  const foot = player.foot?.toUpperCase() || "—";
  const lastName = player.name?.split(" ").pop()?.toUpperCase() || "—";
  const number = player.number || "—";

  const ringTextColor = getContrastColor(color2);
  const centerTextColor = getContrastColor(color1);

  const topLeftArcId = `arc-tl-${player.id}`;
  const topRightArcId = `arc-tr-${player.id}`;
  const bottomArcId = `arc-bot-${player.id}`;

  return (
    <div className="flex flex-col items-center select-none" style={{ width: 120 }}>
      <svg
        width={CARD_SIZE}
        height={CARD_SIZE}
        viewBox={`0 0 ${CARD_SIZE} ${CARD_SIZE}`}
        className="overflow-visible"
      >
        {/* Outer circle (ring) */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill={color2} stroke="#555" strokeWidth="1" />
        {/* Inner circle (number bg) */}
        <circle cx={CX} cy={CY} r={INNER_R} fill={color1} stroke="#666" strokeWidth="0.5" />

        {/* Number in center — 33pt */}
        <text
          x={CX}
          y={CY + 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={centerTextColor}
          fontSize="33"
          fontWeight="bold"
          fontFamily="'Bebas Neue', sans-serif"
          letterSpacing="1.5"
        >
          {number}
        </text>

        <defs>
          {/* Top-left arc for birth year */}
          <path
            id={topLeftArcId}
            d={describeArc(CX, CY, MID_R, 210, 270)}
            fill="none"
          />
          {/* Top-right arc for height */}
          <path
            id={topRightArcId}
            d={describeArc(CX, CY, MID_R, 270, 330)}
            fill="none"
          />
          {/* Bottom arc for foot */}
          <path
            id={bottomArcId}
            d={describeArc(CX, CY, MID_R, 30, 150)}
            fill="none"
          />
        </defs>

        {/* Birth year — top left — 11pt */}
        <text fill={ringTextColor} fontSize="11" fontFamily="'Inter', sans-serif" fontWeight="700">
          <textPath href={`#${topLeftArcId}`} startOffset="50%" textAnchor="middle">
            {birthYear}
          </textPath>
        </text>

        {/* Height — top right — 11pt */}
        <text fill={ringTextColor} fontSize="11" fontFamily="'Inter', sans-serif" fontWeight="700">
          <textPath href={`#${topRightArcId}`} startOffset="50%" textAnchor="middle">
            {heightDisplay}
          </textPath>
        </text>

        {/* Foot — bottom — 11pt */}
        <text fill={ringTextColor} fontSize="11" fontFamily="'Inter', sans-serif" fontWeight="600">
          <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
            {foot}
          </textPath>
        </text>
      </svg>

      {/* Name rectangle — 16pt */}
      <div
        className="flex items-center justify-center"
        style={{
          background: color1,
          padding: "3px 10px",
          marginTop: -12,
          minWidth: 70,
          maxWidth: 120,
          borderRadius: 3,
          border: "1px solid #555",
          zIndex: 1,
        }}
      >
        <span
          className="font-display font-bold text-center leading-tight uppercase truncate"
          style={{
            fontSize: 16,
            color: centerTextColor,
            letterSpacing: "0.8px",
          }}
        >
          {lastName}
        </span>
      </div>
    </div>
  );
};

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

export default PlayerCard;
