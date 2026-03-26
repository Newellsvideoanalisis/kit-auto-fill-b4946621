import React, { useState } from "react";
import { Player } from "@/types/player";
import PlayerTable from "@/components/PlayerTable";
import Campograma from "@/components/Campograma";
import { Shirt } from "lucide-react";

const SAMPLE_PLAYERS: Player[] = [];

const Index: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(SAMPLE_PLAYERS);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
        <PlayerTable players={players} onPlayersChange={setPlayers} />
        <Campograma players={players} />
      </main>
    </div>
  );
};

export default Index;
