import React from "react";
import { MatchPlayer } from "@/types/match";

interface Props {
  player: MatchPlayer;
  color1: string;
  color2: string;
  size?: number;
  variant?: "full" | "compact";
  isSelected?: boolean;
}

function getContrastColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

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

// ─── FULL VARIANT (igual a PlayerCard, adaptado a MatchPlayer) ────────────────
const VB_W = 300;
const VB_H = 300;
const CX = VB_W / 2;
const CY = 120;
const OUTER_R = 112;
const INNER_R = 72;
const TOP_TEXT_R = 92;
const BOTTOM_TEXT_R = 92;

const FullMarker: React.FC<Props> = ({ player, color1, color2, size = 90, isSelected }) => {
  const birthYear = player.birthDate?.match(/(\d{4})/)?.[1] || "—";
  const foot = (player.foot || "—").toUpperCase();
  const isLeftFoot = foot === "IZQUIERDA" || foot === "IZQUIERDO";
  const lastName = player.name?.split(" ").pop()?.toUpperCase() || "—";
  const number = player.number || "—";

  const ringTextColor = getContrastColor(color2);
  const centerTextColor = getContrastColor(color1);

  const id = player.id;
  const topLeftArcId = `farc-tl-${id}`;
  const topRightArcId = `farc-tr-${id}`;
  const bottomArcId = `farc-bot-${id}`;

  const nameY = CY + OUTER_R - 16;
  const nameH = 48;
  const nameW = 190;
  const footFontSize = foot.length > 7 ? 18 : 22;

  const hasGoal = player.events?.some((e) => e.type === "goal");
  const hasYellow = player.events?.some((e) => e.type === "yellow_card");
  const hasRed = player.events?.some((e) => e.type === "red_card");

  return (
    <svg
      width={size}
      height={size * (VB_H / VB_W)}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{ overflow: "visible" }}
    >
      {/* Highlight ring cuando está seleccionado */}
      {isSelected && (
        <circle cx={CX} cy={CY} r={OUTER_R + 8} fill="none" stroke="#facc15" strokeWidth="6" strokeDasharray="12 6" />
      )}

      {/* Anillo exterior */}
      <circle cx={CX} cy={CY} r={OUTER_R} fill={color2} stroke="#555" strokeWidth="0.8" />
      {/* Círculo interior */}
      <circle cx={CX} cy={CY} r={INNER_R} fill={color1} stroke="#666" strokeWidth="0.4" />

      {/* Número */}
      <text
        x={CX} y={CY + 3}
        textAnchor="middle" dominantBaseline="central"
        fill={centerTextColor} fontSize="84" fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif" letterSpacing="2"
      >
        {number}
      </text>

      <defs>
        <path id={topLeftArcId} d={describeArc(CX, CY, TOP_TEXT_R, 300, 350)} fill="none" />
        <path id={topRightArcId} d={describeArc(CX, CY, TOP_TEXT_R, 10, 60)} fill="none" />
        <path id={bottomArcId} d={describeArcCCW(CX, CY, BOTTOM_TEXT_R, 230, 130)} fill="none" />
      </defs>

      {/* Año — arriba izquierda */}
      <text fill={ringTextColor} fontSize="22" fontFamily="'Inter', sans-serif" fontWeight="700">
        <textPath href={`#${topLeftArcId}`} startOffset="50%" textAnchor="middle">
          {birthYear}
        </textPath>
      </text>

      {/* Pie — abajo */}
      <text fill={isLeftFoot ? "#22c55e" : ringTextColor} fontSize={footFontSize} fontFamily="'Inter', sans-serif" fontWeight="700">
        <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
          {foot}
        </textPath>
      </text>

      {/* Rectángulo con apellido */}
      <rect
        x={CX - nameW / 2} y={nameY}
        width={nameW} height={nameH}
        rx="2" fill={color1} stroke="#555" strokeWidth="0.6"
      />
      <text
        x={CX} y={nameY + nameH / 2 + 1}
        textAnchor="middle" dominantBaseline="central"
        fill={centerTextColor} fontSize="32" fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif" letterSpacing="1.5"
      >
        {lastName}
      </text>

      {/* Badges de eventos */}
      {hasGoal && (
        <>
          <circle cx={40} cy={30} r="18" fill="white" stroke="#333" strokeWidth="0.8" />
          <text x={40} y={31} textAnchor="middle" dominantBaseline="central" fontSize="18" fill="#333">⚽</text>
        </>
      )}
      {hasYellow && (
        <rect x={240} y={14} width="22" height="32" rx="2" fill="#facc15" stroke="#333" strokeWidth="0.6" />
      )}
      {hasRed && (
        <rect x={240} y={14} width="22" height="32" rx="2" fill="#ef4444" stroke="#333" strokeWidth="0.6" />
      )}
    </svg>
  );
};

// ─── COMPACT VARIANT (comportamiento actual mejorado) ─────────────────────────
const CompactMarker: React.FC<Props> = ({ player, color1, color2, size = 55, isSelected }) => {
  const textColor1 = getContrastColor(color1);
  const textColor2 = getContrastColor(color2);
  const lastName = player.name?.split(" ").pop()?.toUpperCase() || "—";
  const hasGoal = player.events?.some((e) => e.type === "goal");
  const hasYellow = player.events?.some((e) => e.type === "yellow_card");
  const hasRed = player.events?.some((e) => e.type === "red_card");
  const wasSubbed = player.events?.some((e) => e.type === "substitution_out");
  const cameIn = player.events?.some((e) => e.type === "substitution_in");

  const vb = 100;
  const cx = 50;
  const cy = 28;
  const r = 22;
  const nameY = 56;
  const nameH = 28;
  const nameW = 96;

  const displayName = lastName.length > 14 ? lastName.substring(0, 13) + "." : lastName;
  const nameFontSize = displayName.length > 10 ? 13 : displayName.length > 7 ? 15 : 17;

  return (
    <svg width={size} height={size * 1.1} viewBox={`0 0 ${vb} ${vb * 1.1}`} style={{ overflow: "visible" }}>
      {/* Highlight cuando seleccionado */}
      {isSelected && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#facc15" strokeWidth="2.5" strokeDasharray="6 3" />
      )}

      <circle cx={cx} cy={cy} r={r} fill={color1} stroke="#555" strokeWidth="0.5" />
      <text
        x={cx} y={cy + 1}
        textAnchor="middle" dominantBaseline="central"
        fill={textColor1} fontSize="22" fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif"
      >
        {player.number}
      </text>

      <rect x={cx - nameW / 2} y={nameY} width={nameW} height={nameH} rx="3" fill={color2} stroke="#555" strokeWidth="0.3" />
      <text
        x={cx} y={nameY + nameH / 2 + 1}
        textAnchor="middle" dominantBaseline="central"
        fill={textColor2} fontSize={nameFontSize} fontWeight="bold"
        fontFamily="'Bebas Neue', sans-serif" letterSpacing="0.8"
      >
        {displayName}
      </text>

      {hasGoal && (
        <>
          <circle cx={14} cy={12} r="7" fill="white" stroke="#333" strokeWidth="0.5" />
          <text x={14} y={13} textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#333">⚽</text>
        </>
      )}
      {hasYellow && (
        <rect x={78} y={5} width="8" height="12" rx="1" fill="#facc15" stroke="#333" strokeWidth="0.4" />
      )}
      {hasRed && (
        <rect x={78} y={5} width="8" height="12" rx="1" fill="#ef4444" stroke="#333" strokeWidth="0.4" />
      )}
      {wasSubbed && (
        <g transform="translate(86, 45)">
          <polygon points="0,0 6,4 0,8" fill="#ef4444" />
        </g>
      )}
      {cameIn && (
        <g transform="translate(6, 45)">
          <polygon points="6,0 0,4 6,8" fill="#22c55e" />
        </g>
      )}
    </svg>
  );
};

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────────────────
const MatchPlayerMarker: React.FC<Props> = (props) => {
  if (props.variant === "full") return <FullMarker {...props} />;
  return <CompactMarker {...props} />;
};

export default MatchPlayerMarker;
