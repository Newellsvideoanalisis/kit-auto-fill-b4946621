import React from "react";
import { Player } from "@/types/player";

interface JerseyCardProps {
  player: Player;
  variant?: "dark" | "light";
  size?: "sm" | "md";
}

const JerseyCard: React.FC<JerseyCardProps> = ({ player, variant = "dark", size = "md" }) => {
  const isSmall = size === "sm";
  const isDark = variant === "dark";

  return (
    <div className="flex flex-col items-center select-none" style={{ width: isSmall ? 70 : 90 }}>
      {/* Info bubbles */}
      <div className="flex gap-1 mb-0.5">
        <span
          className="rounded-full text-center font-body font-semibold leading-none"
          style={{
            fontSize: isSmall ? 6 : 7,
            padding: isSmall ? "2px 4px" : "2px 5px",
            backgroundColor: isDark ? "hsl(var(--foreground))" : "hsl(var(--jersey-dark))",
            color: isDark ? "hsl(var(--jersey-dark))" : "hsl(var(--foreground))",
          }}
        >
          {player.birthDate || "—"}
        </span>
        <span
          className="rounded-full text-center font-body font-semibold leading-none"
          style={{
            fontSize: isSmall ? 6 : 7,
            padding: isSmall ? "2px 4px" : "2px 5px",
            backgroundColor: isDark ? "hsl(var(--foreground))" : "hsl(var(--jersey-dark))",
            color: isDark ? "hsl(var(--jersey-dark))" : "hsl(var(--foreground))",
          }}
        >
          {player.height || "—"}
        </span>
      </div>

      {/* Jersey SVG */}
      <div className="relative" style={{ width: isSmall ? 50 : 65, height: isSmall ? 40 : 52 }}>
        <svg viewBox="0 0 80 65" className="w-full h-full">
          {/* Jersey shape */}
          <path
            d="M15 5 L5 20 L15 25 L15 60 L65 60 L65 25 L75 20 L65 5 L50 10 L40 8 L30 10 Z"
            fill={isDark ? "hsl(220, 20%, 15%)" : "hsl(0, 0%, 92%)"}
            stroke={isDark ? "hsl(0, 0%, 40%)" : "hsl(0, 0%, 60%)"}
            strokeWidth="1"
          />
          {/* Collar */}
          <path
            d="M30 10 Q40 15 50 10"
            fill="none"
            stroke={isDark ? "hsl(0, 0%, 40%)" : "hsl(0, 0%, 60%)"}
            strokeWidth="1"
          />
        </svg>
        {/* Number */}
        <span
          className="absolute inset-0 flex items-center justify-center font-display font-bold"
          style={{
            fontSize: isSmall ? 18 : 24,
            color: isDark ? "hsl(0, 0%, 95%)" : "hsl(220, 20%, 15%)",
            paddingTop: isSmall ? 4 : 6,
          }}
        >
          {player.number}
        </span>
      </div>

      {/* Name */}
      <span
        className="font-body font-bold text-center leading-tight mt-0.5 uppercase"
        style={{
          fontSize: isSmall ? 6 : 7,
          color: isDark ? "hsl(0, 0%, 95%)" : "hsl(220, 20%, 15%)",
          maxWidth: isSmall ? 65 : 85,
        }}
      >
        {player.name || "NOMBRE"}
      </span>

      {/* Foot */}
      <span
        className="font-body text-center leading-tight uppercase"
        style={{
          fontSize: isSmall ? 5 : 6,
          color: "hsl(var(--muted-foreground))",
        }}
      >
        {player.foot || "—"}
      </span>
    </div>
  );
};

export default JerseyCard;
