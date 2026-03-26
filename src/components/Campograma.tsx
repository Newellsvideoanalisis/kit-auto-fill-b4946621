import React, { useRef, useState, useCallback, useEffect } from "react";
import { Player, PositionedPlayer } from "@/types/player";
import JerseyCard from "@/components/JerseyCard";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";

interface CampogramaProps {
  players: Player[];
}

const FIELD_W = 900;
const FIELD_H = 600;

const Campograma: React.FC<CampogramaProps> = ({ players }) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [positioned, setPositioned] = useState<PositionedPlayer[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Sync players into positioned list
  useEffect(() => {
    setPositioned((prev) => {
      const existing = new Map(prev.map((p) => [p.id, p]));
      return players.map((p, i) => {
        if (existing.has(p.id)) {
          const old = existing.get(p.id)!;
          return { ...p, x: old.x, y: old.y };
        }
        // Default position: sidebar area on the right
        return { ...p, x: FIELD_W - 100, y: 30 + i * 85 };
      });
    });
  }, [players]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, playerId: string) => {
      e.preventDefault();
      const rect = fieldRef.current?.getBoundingClientRect();
      if (!rect) return;
      const player = positioned.find((p) => p.id === playerId);
      if (!player) return;
      setDragging(playerId);
      setDragOffset({
        x: e.clientX - rect.left - player.x,
        y: e.clientY - rect.top - player.y,
      });
    },
    [positioned]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(FIELD_W - 70, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(FIELD_H - 80, e.clientY - rect.top - dragOffset.y));
      setPositioned((prev) =>
        prev.map((p) => (p.id === dragging ? { ...p, x, y } : p))
      );
    },
    [dragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const resetPositions = () => {
    setPositioned((prev) =>
      prev.map((p, i) => ({ ...p, x: FIELD_W - 100, y: 30 + i * 85 }))
    );
  };

  const exportImage = async () => {
    if (!fieldRef.current) return;
    try {
      const dataUrl = await toPng(fieldRef.current, {
        pixelRatio: 2,
        backgroundColor: "hsl(220, 15%, 10%)",
      });
      const link = document.createElement("a");
      link.download = "campograma.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error exporting:", err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground tracking-wider">
          PLANTEL POR POSICIONES
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetPositions} className="gap-1.5">
            <RotateCcw className="w-4 h-4" />
            Resetear
          </Button>
          <Button size="sm" onClick={exportImage} className="gap-1.5">
            <Download className="w-4 h-4" />
            Exportar PNG
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-border">
        <div
          ref={fieldRef}
          className="relative cursor-crosshair select-none"
          style={{
            width: FIELD_W,
            height: FIELD_H,
            background: "linear-gradient(180deg, hsl(120, 40%, 28%) 0%, hsl(120, 45%, 32%) 50%, hsl(120, 40%, 28%) 100%)",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Field markings */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={FIELD_W}
            height={FIELD_H}
            viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
          >
            {/* Field outline */}
            <rect
              x={40} y={20} width={FIELD_W - 80} height={FIELD_H - 40}
              fill="none" stroke="hsla(0,0%,100%,0.35)" strokeWidth={2}
            />
            {/* Center line */}
            <line
              x1={FIELD_W / 2} y1={20} x2={FIELD_W / 2} y2={FIELD_H - 20}
              stroke="hsla(0,0%,100%,0.35)" strokeWidth={2}
            />
            {/* Center circle */}
            <circle
              cx={FIELD_W / 2} cy={FIELD_H / 2} r={60}
              fill="none" stroke="hsla(0,0%,100%,0.35)" strokeWidth={2}
            />
            {/* Center dot */}
            <circle cx={FIELD_W / 2} cy={FIELD_H / 2} r={3} fill="hsla(0,0%,100%,0.5)" />
            {/* Left penalty area */}
            <rect
              x={40} y={FIELD_H / 2 - 110} width={120} height={220}
              fill="none" stroke="hsla(0,0%,100%,0.35)" strokeWidth={2}
            />
            {/* Left goal area */}
            <rect
              x={40} y={FIELD_H / 2 - 50} width={45} height={100}
              fill="none" stroke="hsla(0,0%,100%,0.35)" strokeWidth={2}
            />
            {/* Right penalty area */}
            <rect
              x={FIELD_W - 160} y={FIELD_H / 2 - 110} width={120} height={220}
              fill="none" stroke="hsla(0,0%,100%,0.35)" strokeWidth={2}
            />
            {/* Right goal area */}
            <rect
              x={FIELD_W - 85} y={FIELD_H / 2 - 50} width={45} height={100}
              fill="none" stroke="hsla(0,0%,100%,0.35)" strokeWidth={2}
            />
            {/* Left goal */}
            <rect
              x={25} y={FIELD_H / 2 - 30} width={15} height={60}
              fill="none" stroke="hsla(0,0%,100%,0.3)" strokeWidth={1.5}
            />
            {/* Right goal */}
            <rect
              x={FIELD_W - 40} y={FIELD_H / 2 - 30} width={15} height={60}
              fill="none" stroke="hsla(0,0%,100%,0.3)" strokeWidth={1.5}
            />
            {/* Field stripes */}
            {Array.from({ length: 9 }, (_, i) => (
              <rect
                key={i}
                x={40 + i * ((FIELD_W - 80) / 9)}
                y={20}
                width={(FIELD_W - 80) / 9}
                height={FIELD_H - 40}
                fill={i % 2 === 0 ? "hsla(120,45%,30%,0.15)" : "transparent"}
              />
            ))}
          </svg>

          {/* Title overlay */}
          <div
            className="absolute top-2 left-3 font-display text-lg tracking-widest"
            style={{ color: "hsla(0,0%,100%,0.6)" }}
          >
            PLANTEL POR POSICIONES
          </div>

          {/* Draggable jerseys */}
          {positioned.map((player) => (
            <div
              key={player.id}
              className="absolute transition-shadow"
              style={{
                left: player.x,
                top: player.y,
                cursor: dragging === player.id ? "grabbing" : "grab",
                zIndex: dragging === player.id ? 50 : 10,
                filter: dragging === player.id ? "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" : "none",
              }}
              onMouseDown={(e) => handleMouseDown(e, player.id)}
            >
              <JerseyCard player={player} variant="dark" size="sm" />
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Arrastrá cada camiseta a su posición en el campo. Luego exportá como imagen PNG.
      </p>
    </div>
  );
};

export default Campograma;
