import React, { useState } from "react";
import { MatchData } from "@/types/match";
import { Player } from "@/types/player";
import MatchForm from "@/components/match/MatchForm";
import MatchPlate from "@/components/match/MatchPlate";
import ProjectManager from "@/components/match/ProjectManager";
import TransfermarktImporter from "@/components/match/TransfermarktImporter";
import PlayerListTables from "@/components/match/PlayerListTables";
import { Button } from "@/components/ui/button";
import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

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
}

const Partidos: React.FC<PartidosProps> = ({
  campogramaPlayers = [],
  campogramaColor1 = "#0f3460",
  campogramaColor2 = "#1a1a2e",
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

  const pasteFromCampograma = (team: "home" | "away") => {
    if (campogramaPlayers.length === 0) {
      toast.error("No hay jugadores cargados en Campograma. Cargá jugadores primero.");
      return;
    }

    const matchPlayers = campogramaPlayers.map((p, i) => ({
      id: crypto.randomUUID(),
      number: p.number,
      name: p.name,
      isStarter: i < 11,
      team,
      events: [],
    }));

    // Merge with existing players of the OTHER team
    const otherTeamPlayers = match.players.filter((p) => p.team !== team);
    const colors = team === "home"
      ? { homeColor1: campogramaColor1, homeColor2: campogramaColor2 }
      : { awayColor1: campogramaColor1, awayColor2: campogramaColor2 };

    setMatch((prev) => ({
      ...prev,
      ...colors,
      players: [...otherTeamPlayers, ...matchPlayers],
    }));

    toast.success(
      `${campogramaPlayers.length} jugadores pegados como ${team === "home" ? "Local" : "Visitante"}`
    );
  };

  return (
    <div className="space-y-8">
      <TransfermarktImporter onImport={handleImport} />

      {/* Paste from Campograma */}
      {campogramaPlayers.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
          <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-foreground">
            Pegar {campogramaPlayers.length} jugadores de Campograma como:
          </span>
          <Button size="sm" variant="outline" onClick={() => pasteFromCampograma("home")}>
            Equipo Local
          </Button>
          <Button size="sm" variant="outline" onClick={() => pasteFromCampograma("away")}>
            Equipo Visitante
          </Button>
        </div>
      )}

      <ProjectManager currentMatch={match} onLoad={handleLoadMatch} />

      <PlayerListTables
        players={match.players}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
      />

      <MatchForm match={match} onChange={setMatch} />
      <MatchPlate match={match} onPlayersChange={handlePlayersChange} onFormationChange={handleFormationChange} />
    </div>
  );
};

export default Partidos;
