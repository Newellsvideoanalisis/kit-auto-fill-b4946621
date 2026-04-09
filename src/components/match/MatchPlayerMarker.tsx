import React from "react";
import { MatchPlayer } from "@/types/match";

interface Props {
  player: MatchPlayer;
  color1: string;
  color2: string;
  size?: number;
}

function getContrastColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

const MatchPlayerMarker: React.FC<Props> = ({ player, color1, color2, size = 60 }) => {
  const textColor1 = getContrastColor(color1);
  const textColor2 = getContrastColor(color2);
  const lastName = player.name?.split(" ").pop()?.toUpperCase() || "—";
  const hasGoal = player.events.some((e) => e.type === "goal");
  const hasYellow = player.events.some((e) => e.type === "yellow_card");
  const hasRed = player.events.some((e) => e.type === "red_card");
  const wasSubbed = player.events.some((e) => e.type === "substitution_out");
  const cameIn = player.events.some((e) => e.type === "substitution_in");

  const vb = 100;
  const cx = 50;
  const cy = 32;
  const r = 26;
  const nameY = 64;
  const nameH = 18;
  const nameW = 80;

  return (
    <svg width={size} height={size * 1.1} viewBox={`0 0 ${vb} ${vb * 1.1}`}>
      {/* Circle */}
      <circle cx={cx} cy={cy} r={r} fill={color1} stroke="#555" strokeWidth="0.5" />
      {/* Number */}
      <text
        x={cx} y={cy + 1}
        textAnchor="middle" dominantBaseline="central"
        fill={textColor1} fontSize="24" fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif"
      >
        {player.number}
      </text>

      {/* Name rect */}
      <rect x={cx - nameW / 2} y={nameY} width={nameW} height={nameH} rx="2" fill={color2} stroke="#555" strokeWidth="0.3" />
      <text
        x={cx} y={nameY + nameH / 2 + 1}
        textAnchor="middle" dominantBaseline="central"
        fill={textColor2} fontSize="9" fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif" letterSpacing="0.5"
      >
        {lastName.length > 12 ? lastName.substring(0, 11) + "." : lastName}
      </text>

      {/* Event icons */}
      {hasGoal && (
        <circle cx={14} cy={14} r="7" fill="white" stroke="#333" strokeWidth="0.5">
          <title>Gol</title>
        </circle>
      )}
      {hasGoal && (
        <text x={14} y={15} textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#333">⚽</text>
      )}

      {hasYellow && (
        <rect x={78} y={7} width="8" height="12" rx="1" fill="#facc15" stroke="#333" strokeWidth="0.4">
          <title>Tarjeta Amarilla</title>
        </rect>
      )}

      {hasRed && (
        <rect x={78} y={7} width="8" height="12" rx="1" fill="#ef4444" stroke="#333" strokeWidth="0.4">
          <title>Tarjeta Roja</title>
        </rect>
      )}

      {wasSubbed && (
        <g transform="translate(86, 50)">
          <polygon points="0,0 6,4 0,8" fill="#ef4444" />
          <title>Sustituido</title>
        </g>
      )}

      {cameIn && (
        <g transform="translate(6, 50)">
          <polygon points="6,0 0,4 6,8" fill="#22c55e" />
          <title>Ingresó</title>
        </g>
      )}
    </svg>
  );
};

export default MatchPlayerMarker;
