import React, { useState, useRef, useCallback } from "react";
import { Player } from "@/types/player";
import PlayerTable from "@/components/PlayerTable";
import Campograma from "@/components/Campograma";
import ColorPicker from "@/components/ColorPicker";
import PlayerCard from "@/components/PlayerCard";
import { Shirt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const Index: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [color1, setColor1] = useState("#0f3460");
  const [color2, setColor2] = useState("#1a1a2e");
  const [exporting, setExporting] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const exportAllCards = useCallback(async () => {
    if (players.length === 0) return;
    setExporting(true);

    // Wait for render
    await new Promise((r) => setTimeout(r, 200));

    const container = exportContainerRef.current;
    if (!container) { setExporting(false); return; }

    const cards = container.querySelectorAll<HTMLDivElement>("[data-player-card]");
    const zip = new JSZip();

    // 145pt x 149pt → 145*1.333 ≈ 193px, 149*1.333 ≈ 199px at 1x
    const exportW = 193;
    const exportH = 199;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      try {
        const dataUrl = await toPng(card, { pixelRatio: 2, backgroundColor: "transparent", width: exportW, height: exportH });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const name = players[i]?.name?.split(" ").pop() || `jugador_${i + 1}`;
        zip.file(`${players[i]?.number || i + 1}_${name}.png`, blob);
      } catch (err) {
        console.error("Error exporting card", i, err);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "plantilla_formas.zip");
    setExporting(false);
  }, [players]);

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

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
        <PlayerTable players={players} onPlayersChange={setPlayers} />

        {/* Color picker + export */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <ColorPicker color1={color1} color2={color2} onColor1Change={setColor1} onColor2Change={setColor2} />
          <Button size="sm" onClick={exportAllCards} disabled={exporting || players.length === 0} className="gap-1.5">
            <Download className="w-4 h-4" />
            {exporting ? "Exportando..." : "Exportar formas (ZIP)"}
          </Button>
        </div>

        <Campograma players={players} color1={color1} color2={color2} />
      </main>

      {/* Hidden container for individual card export */}
      {exporting && (
        <div ref={exportContainerRef} className="fixed -left-[9999px] top-0" style={{ opacity: 0 }}>
          {players.map((p) => (
            <div key={p.id} data-player-card style={{ padding: 4, display: "inline-block" }}>
              <PlayerCard player={p} color1={color1} color2={color2} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
