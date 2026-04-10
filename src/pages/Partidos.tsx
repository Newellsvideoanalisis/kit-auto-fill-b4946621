import React, { useState } from "react";
import { MatchData } from "@/types/match";
import MatchForm from "@/components/match/MatchForm";
import MatchPlate from "@/components/match/MatchPlate";

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

const Partidos: React.FC = () => {
  const [match, setMatch] = useState<MatchData>(defaultMatch);

  const handlePlayersChange = (players: MatchData["players"]) => {
    setMatch((prev) => ({ ...prev, players }));
  };

  const handleFormationChange = (formation: string) => {
    setMatch((prev) => ({ ...prev, formation }));
  };

  return (
    <div className="space-y-8">
      <MatchForm match={match} onChange={setMatch} />
      <MatchPlate match={match} onPlayersChange={handlePlayersChange} onFormationChange={handleFormationChange} />
    </div>
  );
};

export default Partidos;
