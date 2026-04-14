import React, { useRef, useState, useCallback, useEffect } from "react";
import { MatchData, MatchPlayer } from "@/types/match";
import MatchPlayerMarker from "./MatchPlayerMarker";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, CheckSquare, LayoutGrid, Copy, ClipboardPaste, Printer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FORMATION_OPTIONS, getFormationPositions } from "@/lib/formations";
import { toast } from "sonner";

interface Props {
  match: MatchData;
  onPlayersChange: (players: MatchPlayer[]) => void;
  onFormationChange?: (formation: string) => void;
}

const PLATE_W = 1920;
const PLATE_H = 1080;

const MAIN_FIELD = { x: 30, y: 150, w: 580, h: 890 };
const SMALL_FIELDS = [
  { x: 640, y: 150, w: 280, h: 420 },
  { x: 940, y: 150, w: 280, h: 420 },
  { x: 640, y: 590, w: 280, h: 420 },
  { x: 940, y: 590, w: 280, h: 420 },
];

const SUBS_AREA = { x: 1260, y: 150, w: 630, h: 880 };

/** Detecta si un jugador está posicionado en la cancha principal */
function isInMainField(x: number, y: number): boolean {
  return (
    x >= MAIN_FIELD.x - 50 &&
    x <= MAIN_FIELD.x + MAIN_FIELD.w + 50 &&
    y >= MAIN_FIELD.y - 30 &&
    y <= MAIN_FIELD.y + MAIN_FIELD.h + 30
  );
}

function getContrastColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

const FieldSVG: React.FC<{ x: number; y: number; w: number; h: number; label?: string }> = ({ x, y, w, h, label }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="#f0f0f0" stroke="#aaa" strokeWidth="1.5" />
    <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke="#999" strokeWidth="1" />
    <line x1={x + 3} y1={y + h / 2} x2={x + w - 3} y2={y + h / 2} stroke="#999" strokeWidth="1" />
    <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.12} fill="none" stroke="#999" strokeWidth="1" />
    <circle cx={x + w / 2} cy={y + h / 2} r="2" fill="#999" />
    <rect x={x + w / 2 - w * 0.22} y={y + 3} width={w * 0.44} height={h * 0.12} fill="none" stroke="#999" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.1} y={y + 3} width={w * 0.2} height={h * 0.05} fill="none" stroke="#999" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.05} y={y} width={w * 0.1} height="4" fill="none" stroke="#999" strokeWidth="1" rx="1" />
    <rect x={x + w / 2 - w * 0.22} y={y + h - 3 - h * 0.12} width={w * 0.44} height={h * 0.12} fill="none" stroke="#999" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.1} y={y + h - 3 - h * 0.05} width={w * 0.2} height={h * 0.05} fill="none" stroke="#999" strokeWidth="1" />
    <rect x={x + w / 2 - w * 0.05} y={y + h - 4} width={w * 0.1} height="4" fill="none" stroke="#999" strokeWidth="1" rx="1" />
    {label && (
      <text
        x={x + w / 2} y={y - 8}
        textAnchor="middle" fill="#555" fontSize="13"
        fontFamily="'Bebas Neue', sans-serif" letterSpacing="1.5"
        fontWeight="700" fontStyle="italic"
      >
        {label}
      </text>
    )}
  </g>
);

const MatchPlate: React.FC<Props> = ({ match, onPlayersChange, onFormationChange }) => {
  const plateRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showHomeSubs, setShowHomeSubs] = useState(true);
  const [showAwaySubs, setShowAwaySubs] = useState(true);
  const [showHomeRoster, setShowHomeRoster] = useState(true);
  const [showAwayRoster, setShowAwayRoster] = useState(true);
  const [copiedMarkers, setCopiedMarkers] = useState<MatchPlayer[]>([]);

  // Escape para cancelar selección
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectMode(false);
        setSelectedIds(new Set());
      }
      // Cmd+C / Ctrl+C: copiar seleccionados
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && selectedIds.size > 0) {
        copySelectedMarkers();
      }
      // Cmd+V / Ctrl+V: pegar
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && copiedMarkers.length > 0) {
        pasteMarkers();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, copiedMarkers]);

  const applyFormation = useCallback((formation: string) => {
    const homeStarters = match.players.filter(p => p.team === "home" && p.isStarter);
    const awayStarters = match.players.filter(p => p.team === "away" && p.isStarter);
    const positions = getFormationPositions(formation, MAIN_FIELD.x, MAIN_FIELD.y, MAIN_FIELD.w, MAIN_FIELD.h);

    let updated = [...match.players];

    homeStarters.forEach((p, i) => {
      if (i < positions.length) {
        const idx = updated.findIndex(pp => pp.id === p.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x: positions[i].x, y: positions[i].y };
      }
    });

    const awayField = SMALL_FIELDS[0];
    const awayPositions = getFormationPositions(formation, awayField.x, awayField.y, awayField.w, awayField.h);
    awayStarters.forEach((p, i) => {
      if (i < awayPositions.length) {
        const idx = updated.findIndex(pp => pp.id === p.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x: awayPositions[i].x, y: awayPositions[i].y };
      }
    });

    const homeBench = updated.filter(p => p.team === "home" && !p.isStarter);
    const awayBench = updated.filter(p => p.team === "away" && !p.isStarter);

    homeBench.forEach((p, i) => {
      const sf = SMALL_FIELDS[2];
      const idx = updated.findIndex(pp => pp.id === p.id);
      if (idx >= 0) updated[idx] = { ...updated[idx], x: sf.x + 20 + (i % 5) * 50, y: sf.y + 30 + Math.floor(i / 5) * 65 };
    });

    awayBench.forEach((p, i) => {
      const sf = SMALL_FIELDS[3];
      const idx = updated.findIndex(pp => pp.id === p.id);
      if (idx >= 0) updated[idx] = { ...updated[idx], x: sf.x + 20 + (i % 5) * 50, y: sf.y + 30 + Math.floor(i / 5) * 65 };
    });

    onPlayersChange(updated);
  }, [match.players, onPlayersChange]);

  useEffect(() => {
    const needsPositioning = match.players.some(p => p.x === undefined || p.y === undefined);
    if (needsPositioning && match.players.length > 0) {
      applyFormation(match.formation || "4-3-3");
    }
  }, [match.players.length]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      // Cmd+Click / Ctrl+Click → toggle selección sin arrastrar
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        setSelectMode(true);
        return;
      }

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

  // ─── EXPORTAR PNG ────────────────────────────────────────────────────────────
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

  // ─── IMPRIMIR / PDF A4 ───────────────────────────────────────────────────────
  const printPlate = async () => {
    if (!plateRef.current) return;
    try {
      toast.info("Generando imagen para impresión...");
      const dataUrl = await toPng(plateRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.");
        return;
      }
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${match.homeTeam || "Local"} vs ${match.awayTeam || "Visitante"}</title>
          <style>
            @page { size: A4 landscape; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { width: 297mm; height: 210mm; display: flex; align-items: center; justify-content: center; background: #fff; }
            img { max-width: 297mm; max-height: 210mm; width: 100%; height: auto; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.error("Print error:", err);
      toast.error("Error al generar imagen para impresión");
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

  const copySelectedMarkers = () => {
    const selected = match.players.filter(p => selectedIds.has(p.id));
    if (selected.length === 0) {
      toast.error("Seleccioná al menos una forma para copiar");
      return;
    }
    setCopiedMarkers(selected);
    toast.success(`${selected.length} formas copiadas. Cmd+V o botón Pegar para duplicarlas.`);
  };

  const pasteMarkers = () => {
    if (copiedMarkers.length === 0) return;
    const newPlayers = copiedMarkers.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      x: (p.x || 0) + 40,
      y: (p.y || 0) + 40,
    }));
    onPlayersChange([...match.players, ...newPlayers]);
    toast.success(`${newPlayers.length} formas pegadas`);
  };

  const homeColor1 = match.homeColor1;
  const homeColor2 = match.homeColor2;
  const awayColor1 = match.awayColor1;
  const awayColor2 = match.awayColor2;

  const homeSubs = match.substitutions.filter(s => s.team === "home");
  const awaySubs = match.substitutions.filter(s => s.team === "away");
  const unassignedSubs = match.substitutions.filter(s => !s.team);

  const SubsTable: React.FC<{ subs: typeof match.substitutions; teamLabel: string; color: string }> = ({ subs, teamLabel, color }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "2px", fontWeight: 700, color, marginBottom: 6, fontStyle: "italic" }}>
        {teamLabel}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Bebas Neue', sans-serif" }}>
        <thead>
          <tr>
            <th style={{ background: "#333", color: "#fff", padding: "6px 12px", textAlign: "left", letterSpacing: "1.5px", fontSize: 16, width: 90 }}>MIN</th>
            <th style={{ background: "#22c55e", color: "#fff", padding: "6px 12px", textAlign: "left", letterSpacing: "1.5px", fontSize: 16 }}>ENTRA</th>
            <th style={{ background: "#ef4444", color: "#fff", padding: "6px 12px", textAlign: "left", letterSpacing: "1.5px", fontSize: 16 }}>SALE</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((sub) => (
            <tr key={sub.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "5px 12px", color: "#333", fontSize: 18, fontWeight: 700 }}>{sub.minuteIn ? `${sub.minuteIn}'` : "—"}</td>
              <td style={{ padding: "5px 12px", color: "#16a34a", fontSize: 18, fontWeight: 600 }}>{sub.playerInNumber} {sub.playerIn}</td>
              <td style={{ padding: "5px 12px", color: "#dc2626", fontSize: 18 }}>{sub.playerOutNumber} {sub.playerOut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const RosterTable: React.FC<{ players: MatchPlayer[]; teamLabel: string; color: string }> = ({ players: teamPlayers, teamLabel, color }) => {
    const starters = teamPlayers.filter(p => p.isStarter);
    const subs = teamPlayers.filter(p => !p.isStarter);
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: "2px", fontWeight: 700, color, marginBottom: 6, fontStyle: "italic" }}>
          {teamLabel}
        </div>
        {starters.length > 0 && (
          <>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "#555", letterSpacing: "1.5px", marginBottom: 4 }}>TITULARES ({starters.length})</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Bebas Neue', sans-serif", marginBottom: 10 }}>
              <thead>
                <tr>
                  <th style={{ background: "#333", color: "#fff", padding: "4px 10px", textAlign: "left", fontSize: 14, width: 60 }}>Nº</th>
                  <th style={{ background: "#333", color: "#fff", padding: "4px 10px", textAlign: "left", fontSize: 14 }}>NOMBRE</th>
                </tr>
              </thead>
              <tbody>
                {starters.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "3px 10px", color: "#333", fontSize: 16, fontWeight: 700 }}>{p.number}</td>
                    <td style={{ padding: "3px 10px", color: "#333", fontSize: 16 }}>{p.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {subs.length > 0 && (
          <>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: "#888", letterSpacing: "1.5px", marginBottom: 4 }}>SUPLENTES ({subs.length})</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Bebas Neue', sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ background: "#555", color: "#fff", padding: "4px 10px", textAlign: "left", fontSize: 14, width: 60 }}>Nº</th>
                  <th style={{ background: "#555", color: "#fff", padding: "4px 10px", textAlign: "left", fontSize: 14 }}>NOMBRE</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "3px 10px", color: "#666", fontSize: 16, fontWeight: 700 }}>{p.number}</td>
                    <td style={{ padding: "3px 10px", color: "#666", fontSize: 16 }}>{p.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* ─── TOOLBAR ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-display text-foreground tracking-wider">PLACA DEL PARTIDO</h2>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Formación */}
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <Select value={match.formation} onValueChange={(v) => { onFormationChange?.(v); applyFormation(v); }}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="Formación" />
              </SelectTrigger>
              <SelectContent>
                {FORMATION_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => applyFormation(match.formation || "4-3-3")} className="h-8 text-xs">
              Aplicar
            </Button>
          </div>

          {/* Cambios / plantel toggles */}
          <div className="flex items-center gap-3 px-2 border-l border-border pl-3">
            <span className="text-xs text-muted-foreground font-semibold">Cambios:</span>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <Checkbox checked={showHomeSubs} onCheckedChange={(v) => setShowHomeSubs(!!v)} className="w-3.5 h-3.5" />
              {match.homeTeam || "Local"}
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <Checkbox checked={showAwaySubs} onCheckedChange={(v) => setShowAwaySubs(!!v)} className="w-3.5 h-3.5" />
              {match.awayTeam || "Visitante"}
            </label>
          </div>
          <div className="flex items-center gap-3 px-2 border-l border-border pl-3">
            <span className="text-xs text-muted-foreground font-semibold">Plantel:</span>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <Checkbox checked={showHomeRoster} onCheckedChange={(v) => setShowHomeRoster(!!v)} className="w-3.5 h-3.5" />
              {match.homeTeam || "Local"}
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer">
              <Checkbox checked={showAwayRoster} onCheckedChange={(v) => setShowAwayRoster(!!v)} className="w-3.5 h-3.5" />
              {match.awayTeam || "Visitante"}
            </label>
          </div>

          {/* Seleccionar */}
          <Button
            variant={selectMode ? "default" : "outline"} size="sm"
            onClick={() => { setSelectMode(!selectMode); if (!selectMode) setSelectedIds(new Set(match.players.map((p) => p.id))); }}
            className="gap-1.5" disabled={match.players.length === 0}
          >
            <CheckSquare className="w-4 h-4" />
            {selectMode ? "Cancelar (Esc)" : "Seleccionar"}
          </Button>

          {/* Copiar / Pegar */}
          {selectMode && (
            <Button size="sm" variant="secondary" onClick={copySelectedMarkers} disabled={selectedIds.size === 0} className="gap-1.5">
              <Copy className="w-4 h-4" />
              Copiar {selectedIds.size}
            </Button>
          )}
          {copiedMarkers.length > 0 && (
            <Button size="sm" variant="secondary" onClick={pasteMarkers} className="gap-1.5">
              <ClipboardPaste className="w-4 h-4" />
              Pegar ({copiedMarkers.length})
            </Button>
          )}

          {/* Exportar selección */}
          {selectMode && (
            <Button size="sm" onClick={exportSelected} disabled={selectedIds.size === 0} className="gap-1.5">
              <Download className="w-4 h-4" />
              Exportar {selectedIds.size}
            </Button>
          )}

          {/* Exportar PNG + Imprimir A4 */}
          <Button size="sm" variant="outline" onClick={exportPlate} className="gap-1.5">
            <Download className="w-4 h-4" />
            Exportar PNG
          </Button>
          <Button size="sm" onClick={printPlate} className="gap-1.5">
            <Printer className="w-4 h-4" />
            Imprimir A4
          </Button>
        </div>
      </div>

      {/* Hint de atajos */}
      <p className="text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+Click</kbd> seleccionar ·{" "}
        <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+C</kbd> copiar ·{" "}
        <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+V</kbd> pegar ·{" "}
        <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Esc</kbd> cancelar selección ·
        Cancha principal → formas grandes · Ventanas → formas compactas
      </p>

      {/* Selection grid */}
      {selectMode && match.players.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Seleccioná las formas ({selectedIds.size}/{match.players.length})
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set(match.players.map((p) => p.id)))}>Todas</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Ninguna</Button>
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
                    variant="compact"
                  />
                </div>
                <p className="text-[8px] text-center text-muted-foreground truncate">{p.name?.split(" ").pop()}</p>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ─── PLACA ─── */}
      <div className="overflow-auto rounded-lg border border-border">
        <div
          ref={plateRef}
          className="relative select-none"
          style={{ width: PLATE_W, height: PLATE_H, background: "#ffffff" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* HEADER */}
          <div className="absolute" style={{ left: 0, top: 0, width: PLATE_W, height: 65, background: "#000000", clipPath: "polygon(0 0, 100% 0, 93% 100%, 0 100%)" }}>
            <div className="flex items-center h-full px-8 gap-4">
              {match.homeBadge && <img src={match.homeBadge} alt="" style={{ height: 40, width: 40, objectFit: "contain" }} crossOrigin="anonymous" />}
              <span style={{ color: "#ffffff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "3px", fontWeight: 700, fontStyle: "italic" }}>
                {match.homeTeam?.toUpperCase() || "LOCAL"}
              </span>
              <span style={{ color: "#ffffff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "3px", fontWeight: 700, fontStyle: "italic", margin: "0 12px", opacity: 0.5 }}>VS</span>
              <span style={{ color: "#ffffff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "3px", fontWeight: 700, fontStyle: "italic" }}>
                {match.awayTeam?.toUpperCase() || "VISITANTE"}
              </span>
              {match.awayBadge && <img src={match.awayBadge} alt="" style={{ height: 40, width: 40, objectFit: "contain", marginLeft: 8 }} crossOrigin="anonymous" />}
            </div>
          </div>

          {/* Sub-header */}
          <div className="absolute" style={{ left: 0, top: 65, width: PLATE_W, height: 35, background: "#1a1a1a", clipPath: "polygon(0 0, 93% 0, 89% 100%, 0 100%)" }}>
            <div className="flex items-center h-full px-8 gap-12">
              <span style={{ color: "#ffffff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: "2px", fontStyle: "italic", opacity: 0.8 }}>{match.matchday || "F01"}</span>
              <span style={{ color: "#ffffff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "4px", fontWeight: 700 }}>{match.tournament?.toUpperCase() || "TORNEO"}</span>
            </div>
          </div>

          {/* Third band */}
          <div className="absolute" style={{ left: 0, top: 100, width: PLATE_W, height: 30, background: "#2a2a2a", clipPath: "polygon(0 0, 89% 0, 86% 100%, 0 100%)" }}>
            <div className="flex items-center h-full px-8 gap-10">
              {match.stadium && <span style={{ color: "#ccc", fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "1.5px" }}>🏟️ {match.stadium}</span>}
              {match.referee && <span style={{ color: "#ccc", fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "1.5px" }}>👤 {match.referee}</span>}
              {match.date && <span style={{ color: "#999", fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "1px" }}>{match.date}</span>}
              {match.time && <span style={{ color: "#999", fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: "1px" }}>{match.time}</span>}
            </div>
          </div>

          {/* Resultado */}
          <div className="absolute flex items-center justify-center" style={{ right: 0, top: 0, width: 300, height: 100, background: "#ef4444", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 8% 100%)" }}>
            <span style={{ color: "#ffffff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: "6px", fontWeight: 700, marginLeft: 50 }}>
              {match.homeScore || "0"} - {match.awayScore || "0"}
            </span>
          </div>

          {/* Formación label */}
          <div className="absolute" style={{ left: MAIN_FIELD.x, top: MAIN_FIELD.y - 18 }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: "2px", fontWeight: 700, fontStyle: "italic", color: "#333" }}>
              FORMACIÓN INICIAL: {match.formation}
            </span>
          </div>

          {/* Fields SVG */}
          <svg className="absolute inset-0 pointer-events-none" width={PLATE_W} height={PLATE_H} viewBox={`0 0 ${PLATE_W} ${PLATE_H}`}>
            <FieldSVG {...MAIN_FIELD} />
            {SMALL_FIELDS.map((f, i) => (
              <FieldSVG key={i} {...f} label={`VENTANA ${i + 1}`} />
            ))}
          </svg>

          {/* Sustituciones y plantel */}
          <div className="absolute overflow-y-auto" style={{ left: SUBS_AREA.x, top: SUBS_AREA.y, width: SUBS_AREA.w, maxHeight: SUBS_AREA.h }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "3px", fontWeight: 700, color: "#333", marginBottom: 12, fontStyle: "italic" }}>CAMBIOS</div>
            {showHomeSubs && homeSubs.length > 0 && <SubsTable subs={homeSubs} teamLabel={match.homeTeam?.toUpperCase() || "LOCAL"} color="#333" />}
            {showAwaySubs && awaySubs.length > 0 && <SubsTable subs={awaySubs} teamLabel={match.awayTeam?.toUpperCase() || "VISITANTE"} color="#555" />}
            {unassignedSubs.length > 0 && (showHomeSubs || showAwaySubs) && <SubsTable subs={unassignedSubs} teamLabel="SIN EQUIPO" color="#999" />}

            {(showHomeRoster || showAwayRoster) && match.players.length > 0 && (
              <>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "3px", fontWeight: 700, color: "#333", marginBottom: 12, marginTop: 16, fontStyle: "italic" }}>PLANTEL</div>
                {showHomeRoster && <RosterTable players={match.players.filter(p => p.team === "home")} teamLabel={match.homeTeam?.toUpperCase() || "LOCAL"} color="#333" />}
                {showAwayRoster && <RosterTable players={match.players.filter(p => p.team === "away")} teamLabel={match.awayTeam?.toUpperCase() || "VISITANTE"} color="#555" />}
              </>
            )}
          </div>

          {/* ─── JUGADORES ARRASTRABLES ─── */}
          {match.players.map((player) => {
            if (player.x === undefined || player.y === undefined) return null;
            const c1 = player.team === "home" ? homeColor1 : awayColor1;
            const c2 = player.team === "home" ? homeColor2 : awayColor2;
            const inMain = isInMainField(player.x, player.y);
            const markerSize = inMain ? 90 : 42;
            const variant = inMain ? "full" : "compact";
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
                <MatchPlayerMarker
                  player={player}
                  color1={c1}
                  color2={c2}
                  size={markerSize}
                  variant={variant}
                  isSelected={selectedIds.has(player.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchPlate;
