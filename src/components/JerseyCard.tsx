import React from "react";
import { Player } from "@/types/player";

interface JerseyCardProps {
  player: Player;
}

const JerseyCard: React.FC<JerseyCardProps> = ({ player }) => {
  // Extract just the age part from "01/09/1998 (27)" → "1998"
  const birthYear = player.birthDate?.match(/(\d{4})/)?.[1] || "—";
  const height = player.height?.replace("m", " Cm").replace(",", ".") || "—";
  const lastName = player.name?.split(" ").pop()?.toUpperCase() || "—";
  const foot = player.foot?.toUpperCase() || "—";

  return (
    <div className="flex flex-col items-center select-none" style={{ width: 75 }}>
      {/* Info bubbles - birth year and height */}
      <div className="flex gap-1 mb-0.5">
        <span
          className="rounded text-center font-body font-bold leading-none"
          style={{
            fontSize: 7,
            padding: "2px 4px",
            backgroundColor: "#fff",
            color: "#333",
            border: "1px solid #ccc",
            minWidth: 20,
          }}
        >
          {birthYear}
        </span>
        <span
          className="rounded text-center font-body font-bold leading-none"
          style={{
            fontSize: 7,
            padding: "2px 4px",
            backgroundColor: "#fff",
            color: "#333",
            border: "1px solid #ccc",
            minWidth: 20,
          }}
        >
          {height}
        </span>
      </div>

      {/* Jersey SVG - dark crescent/shirt shape like in Keynote */}
      <div className="relative" style={{ width: 55, height: 35 }}>
        <svg viewBox="0 0 80 50" className="w-full h-full">
          {/* Jersey body - dark curved shape */}
          <path
            d="M5 40 C5 15, 20 5, 40 8 C60 5, 75 15, 75 40 C65 45, 55 48, 40 48 C25 48, 15 45, 5 40 Z"
            fill="#1a1a1a"
            stroke="#333"
            strokeWidth="0.5"
          />
          {/* Sleeve curves */}
          <path
            d="M8 35 C3 25, 8 15, 18 12"
            fill="none"
            stroke="#333"
            strokeWidth="0.5"
          />
          <path
            d="M72 35 C77 25, 72 15, 62 12"
            fill="none"
            stroke="#333"
            strokeWidth="0.5"
          />
        </svg>
        {/* Number centered on jersey */}
        <span
          className="absolute inset-0 flex items-center justify-center font-display font-bold"
          style={{
            fontSize: 18,
            color: "#fff",
            paddingTop: 2,
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {player.number || "—"}
        </span>
      </div>

      {/* Name banner - dark background like Keynote */}
      <div
        className="flex items-center justify-center"
        style={{
          background: "#1a5e1a",
          padding: "2px 6px",
          marginTop: -2,
          minWidth: 60,
          maxWidth: 75,
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

      {/* Foot label */}
      <div
        className="flex items-center justify-center"
        style={{
          background: "#1a5e1a",
          padding: "1px 6px",
          marginTop: 1,
          minWidth: 40,
        }}
      >
        <span
          className="font-body text-center leading-tight uppercase"
          style={{
            fontSize: 5.5,
            color: "#ccc",
          }}
        >
          {foot}
        </span>
      </div>
    </div>
  );
};

export default JerseyCard;
