import React, { useState } from "react";
import { MatchData } from "@/types/match";
import { Player } from "@/types/player";
import MatchForm from "@/components/match/MatchForm";
import MatchPlate from "@/components/match/MatchPlate";
import ProjectManager from "@/components/match/ProjectManager";
import TransfermarktImporter from "@/components/match/TransfermarktImporter";
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

  return (
    <div className="space-y-8">
      <TransfermarktImporter onImport={handleImport} />
      <ProjectManager currentMatch={match} onLoad={handleLoadMatch} />
      <MatchForm match={match} onChange={setMatch} />
      <MatchPlate match={match} onPlayersChange={handlePlayersChange} onFormationChange={handleFormationChange} />
    </div>
  );
};

export default Partidos;
