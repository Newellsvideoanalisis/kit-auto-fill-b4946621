import React, { useState } from "react";
import { MatchData } from "@/types/match";
import { Player } from "@/types/player";
import MatchForm from "@/components/match/MatchForm";
import MatchPlate from "@/components/match/MatchPlate";
import ProjectManager from "@/components/match/ProjectManager";
import TransfermarktImporter from "@/components/match/TransfermarktImporter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClipboardPaste } from "lucide-react";

const defaultMatch: MatchData = {
  homeTeam: "",
  awayTeam: "",
  homeScore: "0",
  awayScore: "0",
  homeColor1: "#1e3a5f",
  homeColor2: "#000000",
  awayColor1: "#ef4444",
  awayColor2: "#7f1d1d",
  tournament: "",
  matchday: "",
  date: "",
  time: "",
  stadium: "",
  referee: "",
  formation: "4-3-3",
  players: [],
  substitutions: [],
};

interface PartidosProps {
  campogramaPlayers?: Player[];
  campogramaColor1?: string;
  campogramaColor2?: string;
  copiedCampogramaPlayers?: Player[];
  onClearCopied?: () => void;
}

const Partidos: React.FC<PartidosProps> = ({
  campogramaPlayers = [],
  campogramaColor1 = "#0f3460",
  campogramaColor2 = "#1a1a2e",
  copiedCampogramaPlayers = [],
  onClearCopied,
}) => {
  const [match, setMatch] = useState<MatchData>(defaultMatch);

  const handlePlayersChange = (players: MatchData["players"]) => {
    setMatch((prev) => ({ ...prev, players }));
  };

  const handleFormationChange = (formation: string) => {
    setMatch((prev) => ({ ...prev, formation }));
  };

  const handleLoadMatch = (data: MatchData) => {
    setMatch(data);
  };

  const handleImport = (data: Partial<MatchData>) => {
    setMatch((prev) => ({
      ...prev,
      ...data,
      homeColor1: prev.homeColor1,
      homeColor2: prev.homeColor2,
      awayColor1: prev.awayColor1,
      awayColor2: prev.awayColor2,
    }));
  };

  const pasteCampogramaAsTeam = (team: "home" | "away") => {
    if (copiedCampogramaPlayers.length === 0) {
      toast.error("No hay formas copiadas desde Campograma. Seleccioná y copiá jugadores primero.");
      return;
    }
    const newPlayers = copiedCampogramaPlayers.map((p, i) => ({
      id: crypto.randomUUID(),
      number: p.number || "",
      name: p.name || "",
      isStarter: i < 11,
      team,
      events: [],
    }));
    setMatch((prev) => ({
      ...prev,
      players: [...prev.players.filter(pp => pp.team !== team), ...newPlayers],
    }));
    toast.success(`${newPlayers.length} jugadores pegados como ${team === "home" ? "Local" : "Visitante"}`);
    onClearCopied?.();
  };

  return (
    <div className="space-y-8">
      <TransfermarktImporter onImport={handleImport} />
      <ProjectManager currentMatch={match} onLoad={handleLoadMatch} />

      {/* Paste from Campograma */}
      {copiedCampogramaPlayers.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
          <span className="text-sm text-foreground">
            <ClipboardPaste className="w-4 h-4 inline mr-2" />
            {copiedCampogramaPlayers.length} formas copiadas desde Campograma
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => pasteCampogramaAsTeam("home")} className="text-xs h-7">
              Pegar como Local
            </Button>
            <Button size="sm" variant="outline" onClick={() => pasteCampogramaAsTeam("away")} className="text-xs h-7">
              Pegar como Visitante
            </Button>
            <Button size="sm" variant="ghost" onClick={onClearCopied} className="text-xs h-7">
              Descartar
            </Button>
          </div>
        </div>
      )}

      <MatchForm match={match} onChange={setMatch} />
      <MatchPlate match={match} onPlayersChange={handlePlayersChange} onFormationChange={handleFormationChange} />
    </div>
  );
};

export default Partidos;
