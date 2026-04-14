import React, { useRef, useState, useCallback, useEffect } from "react";
import { Player, PositionedPlayer } from "@/types/player";
import PlayerCard from "@/components/PlayerCard";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";

interface CampogramaProps {
  players: Player[];
  color1?: string;
  color2?: string;
  // Props opcionales para integración con selección en Index
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

const FIELD_W = 1000;
const FIELD_H = 750;

const POSITION_LABELS = [
  { label: "ARQUERO", x: 50, y: 8 },
  { label: "DEFENSA CENTRAL", x: 50, y: 22 },
  { label: "MEDIO CENTRO\nCONTENCIÓN", x: 50, y: 38 },
  { label: "MEDIO CENTRO\nMIXTO", x: 50, y: 52 },
  { label: "MEDIA PUNTA", x: 50, y: 68 },
  { label: "DELANTERO\nCENTRO", x: 50, y: 82 },
  { label: "LATERAL\nDERECHO", x: 12, y: 22 },
  { label: "BANDA", x: 12, y: 50 },
  { label: "EXTREMO\nDERECHO", x: 12, y: 75 },
  { label: "LATERAL\nIZQUIERDO", x: 88, y: 22 },
  { label: "BANDA", x: 88, y: 50 },
  { label: "EXTREMO\nIZQUIERDO", x: 88, y: 75 },
  { label: "INTERIOR\nDERECHO", x: 30, y: 60 },
  { label: "INTERIOR\nIZQUIERDO", x: 70, y: 60 },
];

const Campograma: React.FC<CampogramaProps> = ({
  players,
  color1 = "#0f3460",
  color2 = "#1a1a2e",
  selectedIds,
  onToggleSelect,
}) => {
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
        const col = Math.floor(i / 8);
        const row = i % 8;
        return { ...p, x: 10 + col * 85, y: 80 + row * 80 };
      });
    });
  }, [players]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, playerId: string) => {
      // Cmd+Click / Ctrl+Click → toggle selección sin arrastrar
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        onToggleSelect?.(playerId);
        return;
      }

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
    [positioned, onToggleSelect]
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
        return { ...p, x: 10 + col * 85, y: 80 + row * 80 };
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

  const hasExternalSelection = selectedIds !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-foreground tracking-wider">
            PLANTEL POR POSICIONES
          </h2>
          {hasExternalSelection && (
            <p className="text-xs text-muted-foreground mt-0.5">
              <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+Click</kbd> sobre una forma para seleccionarla y copiarla a Partidos
            </p>
          )}
        </div>
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
          style={{ width: FIELD_W, height: FIELD_H, background: "#2d8a4e" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Half-pitch SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} preserveAspectRatio="none">
            <rect x="30" y="20" width={FIELD_W - 60} height={FIELD_H - 40} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <line x1="30" y1={FIELD_H - 20} x2={FIELD_W - 30} y2={FIELD_H - 20} stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <path d={`M ${FIELD_W / 2 - 100} ${FIELD_H - 20} A 100 100 0 0 1 ${FIELD_W / 2 + 100} ${FIELD_H - 20}`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <circle cx={FIELD_W / 2} cy={FIELD_H - 20} r="4" fill="rgba(255,255,255,0.5)" />
            <rect x={FIELD_W / 2 - 70} y="20" width="140" height="40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <rect x={FIELD_W / 2 - 170} y="20" width="340" height="110" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <path d={`M ${FIELD_W / 2 - 80} 130 A 80 80 0 0 0 ${FIELD_W / 2 + 80} 130`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <circle cx={FIELD_W / 2} cy="95" r="3" fill="rgba(255,255,255,0.5)" />
            <rect x={FIELD_W / 2 - 35} y="8" width="70" height="14" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" rx="2" />
          </svg>

          {/* Etiquetas de posición */}
          {POSITION_LABELS.map((lbl, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center pointer-events-none"
              style={{ left: `${lbl.x}%`, top: `${lbl.y}%`, transform: "translate(-50%, -50%)", opacity: 0.5 }}
            >
              <span className="font-display tracking-wider text-center whitespace-pre-line uppercase" style={{ fontSize: 13, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                {lbl.label}
              </span>
            </div>
          ))}

          {/* Formas arrastrables */}
          {positioned.map((player) => {
            const isSelected = selectedIds?.has(player.id) ?? false;
            return (
              <div
                key={player.id}
                className="absolute"
                style={{
                  left: player.x,
                  top: player.y,
                  cursor: dragging === player.id ? "grabbing" : "grab",
                  zIndex: dragging === player.id ? 50 : 10,
                  filter: dragging === player.id ? "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" : "none",
                }}
                onMouseDown={(e) => handleMouseDown(e, player.id)}
              >
                {/* Ring de selección */}
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      outline: "3px dashed #facc15",
                      outlineOffset: "4px",
                      zIndex: 20,
                      borderRadius: "50%",
                    }}
                  />
                )}
                <PlayerCard player={player} color1={color1} color2={color2} />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Arrastrá cada jugador a su posición. <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+Click</kbd> para seleccionar y copiar a Partidos. Luego exportá como PNG.
      </p>
    </div>
  );
};

export default Campograma;
