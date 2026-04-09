import React, { useRef, useState, useCallback, useEffect } from "react";
import { MatchData, MatchPlayer } from "@/types/match";
import MatchPlayerMarker from "./MatchPlayerMarker";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Props {
  match: MatchData;
  onPlayersChange: (players: MatchPlayer[]) => void;
}

const PLATE_W = 1400;
const PLATE_H = 900;

// Field dimensions inside the plate
const MAIN_FIELD = { x: 30, y: 120, w: 520, h: 750 };
const SMALL_FIELDS = [
  { x: 620, y: 120, w: 350, h: 340 },
  { x: 1020, y: 120, w: 350, h: 340 },
  { x: 620, y: 500, w: 350, h: 340 },
  { x: 1020, y: 500, w: 350, h: 340 },
];

function getContrastColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

const FieldSVG: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="#f5f5f5" stroke="#999" strokeWidth="1.5" />
    <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke="#888" strokeWidth="1" />
    <line x1={x + 3} y1={y + h / 2} x2={x + w - 3} y2={y + h / 2} stroke="#888" strokeWidth="1" />
    <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.1} fill="none" stroke="#888" strokeWidth="1" />
    <circle cx={x + w / 2} cy={y + h / 2} r="2" fill="#888" />
    {/* Top box */}
    <rect x={x + w / 2 - w * 0.2} y={y + 3} width={w * 0.4} height={h * 0.1} fill="none" stroke="#888" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.08} y={y + 3} width={w * 0.16} height={h * 0.04} fill="none" stroke="#888" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.04} y={y} width={w * 0.08} height="4" fill="none" stroke="#888" strokeWidth="1" rx="1" />
    {/* Bottom box */}
    <rect x={x + w / 2 - w * 0.2} y={y + h - 3 - h * 0.1} width={w * 0.4} height={h * 0.1} fill="none" stroke="#888" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.08} y={y + h - 3 - h * 0.04} width={w * 0.16} height={h * 0.04} fill="none" stroke="#888" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.04} y={y + h - 4} width={w * 0.08} height="4" fill="none" stroke="#888" strokeWidth="1" rx="1" />
  </g>
);

const MatchPlate: React.FC<Props> = ({ match, onPlayersChange }) => {
  const plateRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Initialize positions for players
  useEffect(() => {
    const updated = match.players.map((p, i) => {
      if (p.x !== undefined && p.y !== undefined) return p;
      // Default: starters on main field, bench on side
      if (p.isStarter) {
        const teamOffset = p.team === "home" ? 0 : MAIN_FIELD.w / 2;
        const row = match.players.filter((pp) => pp.team === p.team && pp.isStarter).indexOf(p);
        const col = Math.floor(row / 6);
        const r = row % 6;
        return { ...p, x: MAIN_FIELD.x + teamOffset + 30 + col * 80, y: MAIN_FIELD.y + 40 + r * 110 };
      } else {
        const benchIdx = match.players.filter((pp) => pp.team === p.team && !pp.isStarter).indexOf(p);
        const bx = p.team === "home" ? SMALL_FIELDS[0].x : SMALL_FIELDS[1].x;
        const by = SMALL_FIELDS[0].y;
        return { ...p, x: bx + 30 + (benchIdx % 4) * 80, y: by + 30 + Math.floor(benchIdx / 4) * 90 };
      }
    });
    if (JSON.stringify(updated) !== JSON.stringify(match.players)) {
      onPlayersChange(updated);
    }
  }, [match.players.length]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      const rect = plateRef.current?.getBoundingClientRect();
      if (!rect) return;
      const p = match.players.find((pp) => pp.id === id);
      if (!p || p.x === undefined) return;
      const scaleX = PLATE_W / rect.width;
      const scaleY = PLATE_H / rect.height;
      setDragging(id);
      setDragOffset({
        x: (e.clientX - rect.left) * scaleX - p.x,
        y: (e.clientY - rect.top) * scaleY - p.y,
      });
    },
    [match.players]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !plateRef.current) return;
      const rect = plateRef.current.getBoundingClientRect();
      const scaleX = PLATE_W / rect.width;
      const scaleY = PLATE_H / rect.height;
      const x = Math.max(0, Math.min(PLATE_W - 60, (e.clientX - rect.left) * scaleX - dragOffset.x));
      const y = Math.max(0, Math.min(PLATE_H - 70, (e.clientY - rect.top) * scaleY - dragOffset.y));
      onPlayersChange(
        match.players.map((p) => (p.id === dragging ? { ...p, x, y } : p))
      );
    },
    [dragging, dragOffset, match.players, onPlayersChange]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const exportPlate = async () => {
    if (!plateRef.current) return;
    try {
      const dataUrl = await toPng(plateRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${match.homeTeam}_vs_${match.awayTeam}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportSelected = async () => {
    if (selectedIds.size === 0 || !plateRef.current) return;
    const container = plateRef.current;
    const cards = container.querySelectorAll<HTMLDivElement>("[data-match-player]");
    const zip = new JSZip();

    for (const card of cards) {
      const pid = card.getAttribute("data-match-player");
      if (!pid || !selectedIds.has(pid)) continue;
      try {
        const dataUrl = await toPng(card, { pixelRatio: 2, backgroundColor: "transparent" });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const player = match.players.find((p) => p.id === pid);
        const name = player?.name?.split(" ").pop() || "jugador";
        zip.file(`${player?.number || "0"}_${name}.png`, blob);
      } catch (err) {
        console.error("Export player error:", err);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "formas_seleccionadas.zip");
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const homeColor1 = match.homeColor1;
  const homeColor2 = match.homeColor2;
  const awayColor1 = match.awayColor1;
  const awayColor2 = match.awayColor2;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-display text-foreground tracking-wider">PLACA DEL PARTIDO</h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectMode(!selectMode);
              if (!selectMode) setSelectedIds(new Set(match.players.map((p) => p.id)));
            }}
            className="gap-1.5"
            disabled={match.players.length === 0}
          >
            <CheckSquare className="w-4 h-4" />
            {selectMode ? "Cancelar" : "Seleccionar formas"}
          </Button>
          {selectMode && (
            <Button size="sm" onClick={exportSelected} disabled={selectedIds.size === 0} className="gap-1.5">
              <Download className="w-4 h-4" />
              Exportar {selectedIds.size} forma(s)
            </Button>
          )}
          <Button size="sm" onClick={exportPlate} className="gap-1.5">
            <Download className="w-4 h-4" />
            Exportar Placa PNG
          </Button>
        </div>
      </div>

      {/* Selection grid */}
      {selectMode && match.players.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Seleccioná las formas ({selectedIds.size}/{match.players.length})
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set(match.players.map((p) => p.id)))}>
                Todas
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Ninguna
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {match.players.map((p) => (
              <label
                key={p.id}
                className={`relative cursor-pointer rounded border-2 p-1 transition-all ${
                  selectedIds.has(p.id) ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                }`}
              >
                <Checkbox
                  checked={selectedIds.has(p.id)}
                  onCheckedChange={() => toggleSelect(p.id)}
                  className="absolute top-0.5 right-0.5 z-10 w-3 h-3"
                />
                <div className="pointer-events-none">
                  <MatchPlayerMarker
                    player={p}
                    color1={p.team === "home" ? homeColor1 : awayColor1}
                    color2={p.team === "home" ? homeColor2 : awayColor2}
                    size={40}
                  />
                </div>
                <p className="text-[8px] text-center text-muted-foreground truncate">{p.name?.split(" ").pop()}</p>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-lg border border-border">
        <div
          ref={plateRef}
          className="relative select-none"
          style={{ width: PLATE_W, height: PLATE_H, background: "#ffffff" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Header - Black band */}
          <div
            className="absolute"
            style={{
              left: 0, top: 0, width: PLATE_W, height: 50,
              background: "#000000",
              clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
            }}
          >
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-3">
                <span className="text-white font-display text-lg tracking-wider italic font-bold">VS</span>
              </div>
              <div className="text-white font-display text-lg tracking-wider">
                {match.homeTeam?.toUpperCase() || "LOCAL"} vs {match.awayTeam?.toUpperCase() || "VISITANTE"}
              </div>
              <div className="text-white text-xs opacity-80">
                {match.matchday} — {match.tournament?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Sub-header with matchday info */}
          <div
            className="absolute"
            style={{
              left: 0, top: 50, width: PLATE_W, height: 30,
              background: "#1a1a1a",
              clipPath: "polygon(0 0, 95% 0, 92% 100%, 0 100%)",
            }}
          >
            <div className="flex items-center h-full px-6">
              <span className="text-white/80 font-display text-sm tracking-wider">
                {match.matchday}
              </span>
              <span className="text-white font-display text-sm tracking-wider ml-16">
                {match.tournament?.toUpperCase() || "TORNEO"}
              </span>
            </div>
          </div>

          {/* Red triangle with result */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              right: 0, top: 0, width: 200, height: 80,
              background: "#ef4444",
              clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)",
            }}
          >
            <span className="text-white font-display text-2xl tracking-wider font-bold ml-8">
              {match.homeScore || "0"} : {match.awayScore || "0"}
            </span>
          </div>

          {/* Stadium & Referee info */}
          <div className="absolute" style={{ left: PLATE_W - 380, top: 85, width: 360 }}>
            <div className="flex justify-end gap-6 text-xs">
              <span style={{ color: "#666" }}>{match.stadium}</span>
              <span style={{ color: "#666" }}>Árbitro: {match.referee}</span>
            </div>
          </div>

          {/* Formation label */}
          <div className="absolute" style={{ left: MAIN_FIELD.x, top: MAIN_FIELD.y - 25 }}>
            <span className="font-display text-sm tracking-wider font-bold italic" style={{ color: "#333" }}>
              FORMACIÓN INICIAL: {match.formation}
            </span>
          </div>

          {/* Fields as SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${PLATE_W} ${PLATE_H}`} preserveAspectRatio="none">
            <FieldSVG {...MAIN_FIELD} />
            {SMALL_FIELDS.map((f, i) => (
              <FieldSVG key={i} {...f} />
            ))}
          </svg>

          {/* Substitutions box */}
          {match.substitutions.length > 0 && (
            <div className="absolute" style={{ left: 620, top: PLATE_H - 120, width: PLATE_W - 650 }}>
              <div className="border border-gray-300 rounded p-2 bg-white">
                <span className="text-[10px] font-bold text-gray-700 block mb-1">CAMBIOS</span>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {match.substitutions.map((sub) => (
                    <span key={sub.id} className="text-[9px] text-gray-600">
                      <span className="text-green-600 font-semibold">{sub.playerInNumber} {sub.playerIn}</span>
                      {" ⇄ "}
                      <span className="text-red-500">{sub.playerOutNumber} {sub.playerOut}</span>
                      {sub.minuteIn && <span className="text-gray-400"> ({sub.minuteIn}')</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Draggable player markers */}
          {match.players.map((player) => {
            if (player.x === undefined || player.y === undefined) return null;
            const c1 = player.team === "home" ? homeColor1 : awayColor1;
            const c2 = player.team === "home" ? homeColor2 : awayColor2;
            return (
              <div
                key={player.id}
                data-match-player={player.id}
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
                <MatchPlayerMarker player={player} color1={c1} color2={c2} size={55} />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Arrastrá cada jugador a su posición. Exportá la placa completa o seleccioná formas individuales.
      </p>
    </div>
  );
};

export default MatchPlate;
