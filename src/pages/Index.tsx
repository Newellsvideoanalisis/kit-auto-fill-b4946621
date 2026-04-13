import React, { useState, useRef, useCallback } from "react";
import { Player } from "@/types/player";
import PlayerTable from "@/components/PlayerTable";
import Campograma from "@/components/Campograma";
import ColorPicker from "@/components/ColorPicker";
import PlayerCard from "@/components/PlayerCard";
import Partidos from "@/pages/Partidos";
import { Shirt, Download, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const Index: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [color1, setColor1] = useState("#0f3460");
  const [color2, setColor2] = useState("#1a1a2e");
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const playersToExport = selectMode
    ? players.filter((p) => selectedIds.has(p.id))
    : players;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(players.map((p) => p.id)));
  const selectNone = () => setSelectedIds(new Set());

  const exportCards = useCallback(async () => {
    if (playersToExport.length === 0) return;
    setExporting(true);
    await new Promise((r) => setTimeout(r, 200));

    const container = exportContainerRef.current;
    if (!container) { setExporting(false); return; }

    const cards = container.querySelectorAll<HTMLDivElement>("[data-player-card]");
    const zip = new JSZip();

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      try {
        const dataUrl = await toPng(card, {
          pixelRatio: 1,
          width: 300,
          height: 300,
          canvasWidth: 300,
          canvasHeight: 300,
          backgroundColor: "transparent",
          skipAutoScale: true,
          style: { width: "300px", height: "300px", margin: "0" },
        });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const name = playersToExport[i]?.name?.split(" ").pop() || `jugador_${i + 1}`;
        zip.file(`${playersToExport[i]?.number || i + 1}_${name}.png`, blob);
      } catch (err) {
        console.error("Error exporting card", i, err);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, selectMode ? "formas_seleccionadas.zip" : "plantilla_formas.zip");
    setExporting(false);
  }, [playersToExport, selectMode]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shirt className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-foreground tracking-wider leading-none">
              CAMPOGRAMA
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              Informe Rival — Plantel por posiciones
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="campograma" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="campograma" className="font-display tracking-wider">CAMPOGRAMA</TabsTrigger>
            <TabsTrigger value="partidos" className="font-display tracking-wider">PARTIDOS</TabsTrigger>
          </TabsList>

          <TabsContent value="campograma" className="space-y-8">
            <PlayerTable players={players} onPlayersChange={setPlayers} />

            {/* Color picker + export */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <ColorPicker color1={color1} color2={color2} onColor1Change={setColor1} onColor2Change={setColor2} />
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={selectMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectMode(!selectMode); if (!selectMode) selectAll(); }}
                  disabled={players.length === 0}
                  className="gap-1.5"
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectMode ? "Cancelar selección" : "Seleccionar formas"}
                </Button>
                <Button size="sm" onClick={exportCards} disabled={exporting || playersToExport.length === 0} className="gap-1.5">
                  <Download className="w-4 h-4" />
                  {exporting ? "Exportando..." : selectMode ? `Exportar ${selectedIds.size} forma(s)` : "Exportar todas (ZIP)"}
                </Button>
              </div>
            </div>

            {/* Selection grid */}
            {selectMode && players.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Seleccioná las formas a exportar ({selectedIds.size}/{players.length})
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>Todas</Button>
                    <Button variant="ghost" size="sm" onClick={selectNone}>Ninguna</Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {players.map((p) => (
                    <label
                      key={p.id}
                      className={`relative cursor-pointer rounded-lg border-2 p-1 transition-all ${
                        selectedIds.has(p.id) ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                        className="absolute top-1 right-1 z-10"
                      />
                      <div className="pointer-events-none">
                        <PlayerCard player={p} color1={color1} color2={color2} width={80} />
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground truncate mt-1">
                        {p.name?.split(" ").pop()}
                      </p>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Campograma players={players} color1={color1} color2={color2} />
          </TabsContent>

          <TabsContent value="partidos">
            <Partidos
              campogramaPlayers={players}
              campogramaColor1={color1}
              campogramaColor2={color2}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Hidden container for export */}
      {exporting && (
        <div ref={exportContainerRef} className="fixed -left-[9999px] top-0" style={{ opacity: 0 }}>
          {playersToExport.map((p) => (
            <div key={p.id} data-player-card style={{ display: "block", width: 300, height: 300, lineHeight: 0, margin: 0, padding: 0 }}>
              <PlayerCard player={p} color1={color1} color2={color2} width={300} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
