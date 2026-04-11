import React, { useState } from "react";
import { MatchData } from "@/types/match";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { parseTransfermarktMarkdown } from "@/lib/transfermarkt-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link, Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onImport: (data: Partial<MatchData>) => void;
}

const TransfermarktImporter: React.FC<Props> = ({ onImport }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Ingresá una URL de Transfermarkt");
      return;
    }

    if (!url.includes("transfermarkt")) {
      toast.error("La URL debe ser de Transfermarkt");
      return;
    }

    setLoading(true);
    try {
      const response = await firecrawlApi.scrape(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2000,
      });

      if (!response.success) {
        toast.error(response.error || "Error al obtener datos");
        return;
      }

      const markdown = response.data?.markdown || response.markdown;
      if (!markdown) {
        toast.error("No se pudo extraer contenido de la página");
        return;
      }

      const parsed = parseTransfermarktMarkdown(markdown);

      if (!parsed.homeTeam && !parsed.awayTeam) {
        toast.error("No se pudieron identificar los equipos. Verificá la URL.");
        return;
      }

      onImport(parsed);
      toast.success(
        `Importado: ${parsed.homeTeam} vs ${parsed.awayTeam} — ${parsed.players?.length || 0} jugadores`
      );
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Error al importar. Verificá la URL e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-display tracking-wider text-foreground flex items-center gap-2">
        <Link className="w-4 h-4" /> IMPORTAR DESDE TRANSFERMARKT
      </h3>
      <p className="text-xs text-muted-foreground">
        Pegá el enlace del informe de partido de Transfermarkt para cargar automáticamente equipos, jugadores, goles, tarjetas y cambios.
      </p>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-9 text-sm flex-1"
          placeholder="https://www.transfermarkt.com.ar/spielbericht/index/spielbericht/..."
          onKeyDown={(e) => e.key === "Enter" && handleImport()}
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="h-9 gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Importar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TransfermarktImporter;
