import React from "react";
import { MatchPlayer } from "@/types/match";

interface Props {
  players: MatchPlayer[];
  homeTeam: string;
  awayTeam: string;
}

const TeamTable: React.FC<{ title: string; starters: MatchPlayer[]; subs: MatchPlayer[]; color: string }> = ({
  title,
  starters,
  subs,
  color,
}) => (
  <div className="space-y-2">
    <h4
      className="text-sm font-display tracking-wider"
      style={{ color }}
    >
      {title}
    </h4>

    {/* Starters */}
    <div>
      <span className="text-xs font-semibold text-foreground">Titulares ({starters.length})</span>
      <table className="w-full text-xs mt-1">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1 px-2 w-12 text-muted-foreground">Nº</th>
            <th className="text-left py-1 px-2 text-muted-foreground">Nombre</th>
          </tr>
        </thead>
        <tbody>
          {starters.map((p) => (
            <tr key={p.id} className="border-b border-border/50">
              <td className="py-1 px-2 font-bold text-foreground">{p.number}</td>
              <td className="py-1 px-2 text-foreground">{p.name}</td>
            </tr>
          ))}
          {starters.length === 0 && (
            <tr>
              <td colSpan={2} className="py-2 px-2 text-muted-foreground italic">Sin jugadores</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Subs */}
    <div>
      <span className="text-xs font-semibold text-muted-foreground">Suplentes ({subs.length})</span>
      <table className="w-full text-xs mt-1">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1 px-2 w-12 text-muted-foreground">Nº</th>
            <th className="text-left py-1 px-2 text-muted-foreground">Nombre</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((p) => (
            <tr key={p.id} className="border-b border-border/50 opacity-70">
              <td className="py-1 px-2 font-bold text-foreground">{p.number}</td>
              <td className="py-1 px-2 text-foreground">{p.name}</td>
            </tr>
          ))}
          {subs.length === 0 && (
            <tr>
              <td colSpan={2} className="py-2 px-2 text-muted-foreground italic">Sin suplentes</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const PlayerListTables: React.FC<Props> = ({ players, homeTeam, awayTeam }) => {
  const homeStarters = players.filter((p) => p.team === "home" && p.isStarter);
  const homeSubs = players.filter((p) => p.team === "home" && !p.isStarter);
  const awayStarters = players.filter((p) => p.team === "away" && p.isStarter);
  const awaySubs = players.filter((p) => p.team === "away" && !p.isStarter);

  if (players.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg border border-border bg-card">
      <TeamTable
        title={homeTeam || "LOCAL"}
        starters={homeStarters}
        subs={homeSubs}
        color="hsl(var(--primary))"
      />
      <TeamTable
        title={awayTeam || "VISITANTE"}
        starters={awayStarters}
        subs={awaySubs}
        color="hsl(var(--muted-foreground))"
      />
    </div>
  );
};

export default PlayerListTables;
