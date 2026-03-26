import React, { useRef, useState, useCallback, useEffect } from "react";
import { Player, PositionedPlayer } from "@/types/player";
import JerseyCard from "@/components/JerseyCard";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";

interface CampogramaProps {
  players: Player[];
}

const FIELD_W = 1200;
const FIELD_H = 820;

// Position zones matching the Keynote layout (top to bottom)
const ZONES = [
  { label: "GK", y: 0, h: 80, color: "rgba(255,255,255,0.95)", textColor: "#333" },
  { label: "DEFENSA CENTRAL", y: 80, h: 90, color: "rgba(255,200,200,0.4)", textColor: "#666" },
  { label: "MEDIO CENTRO CONTENCIÓN", y: 170, h: 90, color: "rgba(200,255,200,0.35)", textColor: "#666" },
  { label: "MEDIO CENTRO MIXTO", y: 260, h: 80, color: "rgba(200,255,200,0.25)", textColor: "#666" },
  { label: "INTERIOR DERECHO", y: 340, h: 70, color: "rgba(180,220,210,0.35)", textColor: "#666", align: "left" as const },
  { label: "INTERIOR IZQUIERDO", y: 340, h: 70, color: "rgba(180,220,210,0.35)", textColor: "#666", align: "right" as const },
  { label: "MEDIA PUNTA", y: 410, h: 70, color: "rgba(180,220,210,0.3)", textColor: "#666" },
  { label: "DELANTERO CENTRO", y: 480, h: 80, color: "rgba(255,240,200,0.4)", textColor: "#666" },
];

const SIDE_ZONES = [
  { label: "LATERAL\nDERECHO", y: 80, h: 90, side: "left" as const },
  { label: "LATERAL\nIZQUIERDO", y: 80, h: 90, side: "right" as const },
  { label: "BANDA", y: 260, h: 80, side: "left" as const },
  { label: "BANDA", y: 260, h: 80, side: "right" as const },
  { label: "EXTREMO\nDERECHO", y: 410, h: 70, side: "left" as const },
  { label: "EXTREMO\nIZQUIERDO", y: 410, h: 70, side: "right" as const },
];

const MAIN_AREA_LEFT = 160;
const MAIN_AREA_RIGHT = FIELD_W - 160;
const FIELD_CONTENT_H = 560;

const Campograma: React.FC<CampogramaProps> = ({ players }) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [positioned, setPositioned] = useState<PositionedPlayer[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPositioned((prev) => {
      const existing = new Map(prev.map((p) => [p.id, p]));
      return players.map((p, i) => {
        if (existing.has(p.id)) {
          const old = existing.get(p.id)!;
          return { ...p, x: old.x, y: old.y };
        }
        // Stack new players on the left side
        const col = Math.floor(i / 8);
        const row = i % 8;
        return { ...p, x: 10 + col * 80, y: 90 + row * 65 };
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
      const x = Math.max(0, Math.min(FIELD_W - 80, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(FIELD_H - 90, e.clientY - rect.top - dragOffset.y));
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
      prev.map((p, i) => {
        const col = Math.floor(i / 8);
        const row = i % 8;
        return { ...p, x: 10 + col * 80, y: 90 + row * 65 };
      })
    );
  };

  const exportImage = async () => {
    if (!fieldRef.current) return;
    try {
      const dataUrl = await toPng(fieldRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
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
          className="relative select-none"
          style={{
            width: FIELD_W,
            height: FIELD_H,
            background: "#f5f5f5",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Header bar */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-4"
            style={{
              height: 50,
              background: "linear-gradient(135deg, #1a1a1a 60%, #cc0000 100%)",
            }}
          >
            <div className="font-display text-white text-2xl tracking-widest italic">
              <span className="font-bold">PLANTEL</span>
              <span className="ml-4 font-normal">POR POSICIONES</span>
            </div>
          </div>

          {/* Main field area */}
          <div
            className="absolute"
            style={{
              top: 55,
              left: MAIN_AREA_LEFT,
              right: MAIN_AREA_LEFT,
              height: FIELD_CONTENT_H,
              border: "2px solid #999",
              background: "#fff",
            }}
          >
            {/* Zone bands */}
            {ZONES.map((zone, i) => {
              const zoneTop = (zone.y / FIELD_CONTENT_H) * 100;
              const zoneH = (zone.h / FIELD_CONTENT_H) * 100;
              const isHalf = zone.align === "left" || zone.align === "right";
              return (
                <div
                  key={i}
                  className="absolute flex items-center justify-center"
                  style={{
                    top: `${zoneTop}%`,
                    height: `${zoneH}%`,
                    left: isHalf && zone.align === "right" ? "50%" : 0,
                    right: isHalf && zone.align === "left" ? "50%" : 0,
                    width: isHalf ? "50%" : "100%",
                    background: zone.color,
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <span
                    className="font-display tracking-wider text-center"
                    style={{
                      fontSize: 18,
                      color: zone.textColor,
                      opacity: 0.7,
                    }}
                  >
                    {zone.label}
                  </span>
                </div>
              );
            })}

            {/* Goal arc at top */}
            <div
              className="absolute"
              style={{
                top: -2,
                left: "50%",
                transform: "translateX(-50%)",
                width: 180,
                height: 50,
                borderBottom: "2px solid #999",
                borderLeft: "2px solid #999",
                borderRight: "2px solid #999",
                borderRadius: "0 0 50% 50%",
              }}
            />

            {/* Goal arc at bottom */}
            <div
              className="absolute"
              style={{
                bottom: -2,
                left: "50%",
                transform: "translateX(-50%)",
                width: 180,
                height: 50,
                borderTop: "2px solid #999",
                borderLeft: "2px solid #999",
                borderRight: "2px solid #999",
                borderRadius: "50% 50% 0 0",
              }}
            />
          </div>

          {/* Side zone labels */}
          {SIDE_ZONES.map((sz, i) => {
            const top = 55 + (sz.y / FIELD_CONTENT_H) * FIELD_CONTENT_H;
            const height = (sz.h / FIELD_CONTENT_H) * FIELD_CONTENT_H;
            return (
              <div
                key={i}
                className="absolute flex items-center justify-center"
                style={{
                  top,
                  height,
                  left: sz.side === "left" ? 0 : FIELD_W - MAIN_AREA_LEFT,
                  width: MAIN_AREA_LEFT,
                  background: "rgba(200,200,200,0.2)",
                }}
              >
                <span
                  className="font-display tracking-wider text-center whitespace-pre-line"
                  style={{ fontSize: 16, color: "#555" }}
                >
                  {sz.label}
                </span>
              </div>
            );
          })}

          {/* Draggable jerseys */}
          {positioned.map((player) => (
            <div
              key={player.id}
              className="absolute"
              style={{
                left: player.x,
                top: player.y,
                cursor: dragging === player.id ? "grabbing" : "grab",
                zIndex: dragging === player.id ? 50 : 10,
                filter: dragging === player.id ? "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" : "none",
              }}
              onMouseDown={(e) => handleMouseDown(e, player.id)}
            >
              <JerseyCard player={player} />
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
