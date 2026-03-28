import React from "react";
import { Player } from "@/types/player";

interface PlayerCardProps {
  player: Player;
  color1?: string;
  color2?: string;
  width?: number; // display width in px, default 120
}

// ViewBox matches pt dimensions for perfect export
const VB_W = 145;
const VB_H = 149;
const CX = VB_W / 2;
const CY = 60;
const OUTER_R = 56;
const INNER_R = 36;
const TOP_TEXT_R = 46;
const BOTTOM_TEXT_R = 46;

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
  width = 120,
}) => {
  const birthYear = player.birthDate?.match(/(\d{4})/)?.[1] || "—";
  const rawHeight = player.height?.replace("m", "").replace(",", ".").trim() || "";
  const heightDisplay = rawHeight ? `${rawHeight} mts` : "—";
  const foot = player.foot?.toUpperCase() || "—";
  const lastName = player.name?.split(" ").pop()?.toUpperCase() || "—";
  const number = player.number || "—";

  const ringTextColor = getContrastColor(color2);
  const centerTextColor = getContrastColor(color1);

  const id = player.id;
  const topLeftArcId = `arc-tl-${id}`;
  const topRightArcId = `arc-tr-${id}`;
  const bottomArcId = `arc-bot-${id}`;

  const nameY = CY + OUTER_R - 10;
  const nameH = 28;
  const nameW = 100;

  return (
    <svg
      width={width}
      height={width * (VB_H / VB_W)}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
    >
      {/* Outer circle (ring) */}
      <circle cx={CX} cy={CY} r={OUTER_R} fill={color2} stroke="#555" strokeWidth="0.8" />
      {/* Inner circle (number bg) */}
      <circle cx={CX} cy={CY} r={INNER_R} fill={color1} stroke="#666" strokeWidth="0.4" />

      {/* Number in center */}
      <text
        x={CX}
        y={CY + 1.5}
        textAnchor="middle"
        dominantBaseline="central"
        fill={centerTextColor}
        fontSize="42"
        fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif"
        letterSpacing="1"
      >
        {number}
      </text>

      <defs>
        {/* Top-left arc for birth year (clockwise, reads L-to-R) */}
        <path id={topLeftArcId} d={describeArc(CX, CY, TOP_TEXT_R, 300, 350)} fill="none" />
        {/* Top-right arc for height (clockwise, reads L-to-R) */}
        <path id={topRightArcId} d={describeArc(CX, CY, TOP_TEXT_R, 10, 60)} fill="none" />
        {/* Bottom arc for foot (counterclockwise so text reads L-to-R) */}
        <path id={bottomArcId} d={describeArcCCW(CX, CY, BOTTOM_TEXT_R, 220, 140)} fill="none" />
      </defs>

      {/* Birth year — top left — 11pt */}
      <text fill={ringTextColor} fontSize="14" fontFamily="'Inter', sans-serif" fontWeight="700">
        <textPath href={`#${topLeftArcId}`} startOffset="50%" textAnchor="middle">
          {birthYear}
        </textPath>
      </text>

      {/* Height — top right — 14pt */}
      <text fill={ringTextColor} fontSize="14" fontFamily="'Inter', sans-serif" fontWeight="700">
        <textPath href={`#${topRightArcId}`} startOffset="50%" textAnchor="middle">
          {heightDisplay}
        </textPath>
      </text>

      {/* Foot — bottom — 14pt */}
      <text fill={ringTextColor} fontSize="14" fontFamily="'Inter', sans-serif" fontWeight="700">
        <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
          {foot}
        </textPath>
      </text>

      {/* Name rectangle */}
      <rect
        x={CX - nameW / 2}
        y={nameY}
        width={nameW}
        height={nameH}
        rx="2"
        fill={color1}
        stroke="#555"
        strokeWidth="0.6"
      />
      <text
        x={CX}
        y={nameY + nameH / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={centerTextColor}
        fontSize="19"
        fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif"
        letterSpacing="0.8"
      >
        {lastName}
      </text>
    </svg>
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

function describeArcCCW(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const angleDiff = (startAngle - endAngle + 360) % 360;
  const largeArc = angleDiff > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default PlayerCard;
