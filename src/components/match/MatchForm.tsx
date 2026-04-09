import React from "react";
import { MatchData, MatchPlayer, MatchEvent, Substitution } from "@/types/match";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Goal, CreditCard, ArrowRightLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  match: MatchData;
  onChange: (match: MatchData) => void;
}

const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#facc15",
  "#8b5cf6", "#f97316", "#ec4899", "#14b8a6", "#1e3a5f", "#7f1d1d",
  "#1a1a2e", "#0f3460", "#6b21a8", "#064e3b",
];

const MatchForm: React.FC<Props> = ({ match, onChange }) => {
  const update = (patch: Partial<MatchData>) => onChange({ ...match, ...patch });

  const addPlayer = (team: "home" | "away", isStarter: boolean) => {
    const p: MatchPlayer = {
      id: crypto.randomUUID(),
      number: "",
      name: "",
      isStarter,
      team,
      events: [],
    };
    update({ players: [...match.players, p] });
  };

  const updatePlayer = (id: string, patch: Partial<MatchPlayer>) => {
    update({
      players: match.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const removePlayer = (id: string) => {
    update({ players: match.players.filter((p) => p.id !== id) });
  };

  const toggleEvent = (playerId: string, type: MatchEvent["type"]) => {
    const player = match.players.find((p) => p.id === playerId);
    if (!player) return;
    const has = player.events.some((e) => e.type === type);
    const events = has
      ? player.events.filter((e) => e.type !== type)
      : [...player.events, { type, minute: "" }];
    updatePlayer(playerId, { events });
  };

  const addSubstitution = () => {
    const sub: Substitution = {
      id: crypto.randomUUID(),
      minuteIn: "",
      playerIn: "",
      playerInNumber: "",
      playerOut: "",
      playerOutNumber: "",
    };
    update({ substitutions: [...match.substitutions, sub] });
  };

  const updateSub = (id: string, patch: Partial<Substitution>) => {
    update({
      substitutions: match.substitutions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const removeSub = (id: string) => {
    update({ substitutions: match.substitutions.filter((s) => s.id !== id) });
  };

  const homePlayers = match.players.filter((p) => p.team === "home");
  const awayPlayers = match.players.filter((p) => p.team === "away");
  const homeStarters = homePlayers.filter((p) => p.isStarter);
  const homeBench = homePlayers.filter((p) => !p.isStarter);
  const awayStarters = awayPlayers.filter((p) => p.isStarter);
  const awayBench = awayPlayers.filter((p) => !p.isStarter);

  const ColorSelect = ({ value, onValueChange, label }: { value: string; onValueChange: (v: string) => void; label: string }) => (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground whitespace-nowrap">{label}</Label>
      <div className="flex gap-1 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`w-5 h-5 rounded-full border-2 transition-all ${value === c ? "border-primary scale-110" : "border-transparent"}`}
            style={{ backgroundColor: c }}
            onClick={() => onValueChange(c)}
          />
        ))}
      </div>
    </div>
  );

  const PlayerRow = ({ p }: { p: MatchPlayer }) => (
    <div className="flex items-center gap-2 py-1">
      <Input
        value={p.number}
        onChange={(e) => updatePlayer(p.id, { number: e.target.value })}
        className="w-14 h-8 text-xs"
        placeholder="Nº"
      />
      <Input
        value={p.name}
        onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
        className="flex-1 h-8 text-xs"
        placeholder="Nombre"
      />
      <button
        onClick={() => toggleEvent(p.id, "goal")}
        className={`p-1 rounded ${p.events.some((e) => e.type === "goal") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
        title="Gol"
      >
        <span className="text-sm">⚽</span>
      </button>
      <button
        onClick={() => toggleEvent(p.id, "yellow_card")}
        className={`p-1 rounded ${p.events.some((e) => e.type === "yellow_card") ? "bg-yellow-500/30" : "text-muted-foreground hover:text-foreground"}`}
        title="Tarjeta Amarilla"
      >
        <CreditCard className="w-3 h-3 text-yellow-400" />
      </button>
      <button
        onClick={() => toggleEvent(p.id, "red_card")}
        className={`p-1 rounded ${p.events.some((e) => e.type === "red_card") ? "bg-red-500/30" : "text-muted-foreground hover:text-foreground"}`}
        title="Tarjeta Roja"
      >
        <CreditCard className="w-3 h-3 text-red-500" />
      </button>
      <button
        onClick={() => toggleEvent(p.id, "substitution_out")}
        className={`p-1 rounded ${p.events.some((e) => e.type === "substitution_out") ? "bg-red-500/30" : "text-muted-foreground hover:text-foreground"}`}
        title="Sustituido"
      >
        <ArrowRightLeft className="w-3 h-3 text-red-400" />
      </button>
      <button onClick={() => removePlayer(p.id)} className="text-muted-foreground hover:text-destructive p-1">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Match info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Equipo Local</Label>
          <Input value={match.homeTeam} onChange={(e) => update({ homeTeam: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Equipo Visitante</Label>
          <Input value={match.awayTeam} onChange={(e) => update({ awayTeam: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Goles Local</Label>
          <Input value={match.homeScore} onChange={(e) => update({ homeScore: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Goles Visitante</Label>
          <Input value={match.awayScore} onChange={(e) => update({ awayScore: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Torneo</Label>
          <Input value={match.tournament} onChange={(e) => update({ tournament: e.target.value })} className="h-8 text-sm" placeholder="APERTURA 2026" />
        </div>
        <div>
          <Label className="text-xs">Jornada</Label>
          <Input value={match.matchday} onChange={(e) => update({ matchday: e.target.value })} className="h-8 text-sm" placeholder="F01" />
        </div>
        <div>
          <Label className="text-xs">Fecha</Label>
          <Input value={match.date} onChange={(e) => update({ date: e.target.value })} className="h-8 text-sm" type="date" />
        </div>
        <div>
          <Label className="text-xs">Hora</Label>
          <Input value={match.time} onChange={(e) => update({ time: e.target.value })} className="h-8 text-sm" type="time" />
        </div>
        <div>
          <Label className="text-xs">Estadio</Label>
          <Input value={match.stadium} onChange={(e) => update({ stadium: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Árbitro</Label>
          <Input value={match.referee} onChange={(e) => update({ referee: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Formación</Label>
          <Input value={match.formation} onChange={(e) => update({ formation: e.target.value })} className="h-8 text-sm" placeholder="4-3-3" />
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg border border-border bg-card">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{match.homeTeam || "Local"}</h4>
          <ColorSelect value={match.homeColor1} onValueChange={(v) => update({ homeColor1: v })} label="Círculo" />
          <ColorSelect value={match.homeColor2} onValueChange={(v) => update({ homeColor2: v })} label="Nombre" />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{match.awayTeam || "Visitante"}</h4>
          <ColorSelect value={match.awayColor1} onValueChange={(v) => update({ awayColor1: v })} label="Círculo" />
          <ColorSelect value={match.awayColor2} onValueChange={(v) => update({ awayColor2: v })} label="Nombre" />
        </div>
      </div>

      {/* Players - Home */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Titulares - {match.homeTeam || "Local"}</h4>
            <Button size="sm" variant="ghost" onClick={() => addPlayer("home", true)} className="h-6 text-xs gap-1">
              <Plus className="w-3 h-3" /> Agregar
            </Button>
          </div>
          {homeStarters.map((p) => <PlayerRow key={p.id} p={p} />)}
          <div className="flex items-center justify-between mt-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Suplentes</h4>
            <Button size="sm" variant="ghost" onClick={() => addPlayer("home", false)} className="h-6 text-xs gap-1">
              <Plus className="w-3 h-3" /> Agregar
            </Button>
          </div>
          {homeBench.map((p) => <PlayerRow key={p.id} p={p} />)}
        </div>

        {/* Players - Away */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Titulares - {match.awayTeam || "Visitante"}</h4>
            <Button size="sm" variant="ghost" onClick={() => addPlayer("away", true)} className="h-6 text-xs gap-1">
              <Plus className="w-3 h-3" /> Agregar
            </Button>
          </div>
          {awayStarters.map((p) => <PlayerRow key={p.id} p={p} />)}
          <div className="flex items-center justify-between mt-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Suplentes</h4>
            <Button size="sm" variant="ghost" onClick={() => addPlayer("away", false)} className="h-6 text-xs gap-1">
              <Plus className="w-3 h-3" /> Agregar
            </Button>
          </div>
          {awayBench.map((p) => <PlayerRow key={p.id} p={p} />)}
        </div>
      </div>

      {/* Substitutions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Cambios</h4>
          <Button size="sm" variant="ghost" onClick={addSubstitution} className="h-6 text-xs gap-1">
            <Plus className="w-3 h-3" /> Agregar
          </Button>
        </div>
        {match.substitutions.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2 py-1">
            <Input value={sub.minuteIn} onChange={(e) => updateSub(sub.id, { minuteIn: e.target.value })} className="w-14 h-8 text-xs" placeholder="Min'" />
            <span className="text-xs text-green-500">▶</span>
            <Input value={sub.playerInNumber} onChange={(e) => updateSub(sub.id, { playerInNumber: e.target.value })} className="w-12 h-8 text-xs" placeholder="Nº" />
            <Input value={sub.playerIn} onChange={(e) => updateSub(sub.id, { playerIn: e.target.value })} className="flex-1 h-8 text-xs" placeholder="Entra" />
            <span className="text-xs text-red-500">◀</span>
            <Input value={sub.playerOutNumber} onChange={(e) => updateSub(sub.id, { playerOutNumber: e.target.value })} className="w-12 h-8 text-xs" placeholder="Nº" />
            <Input value={sub.playerOut} onChange={(e) => updateSub(sub.id, { playerOut: e.target.value })} className="flex-1 h-8 text-xs" placeholder="Sale" />
            <button onClick={() => removeSub(sub.id)} className="text-muted-foreground hover:text-destructive p-1">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchForm;
