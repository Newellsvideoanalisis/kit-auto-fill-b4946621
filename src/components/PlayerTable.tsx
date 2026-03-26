import React, { useState, useCallback, useMemo } from "react";
import { Player } from "@/types/player";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ClipboardPaste } from "lucide-react";

interface PlayerTableProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
}

const EMPTY_PLAYER = (): Player => ({
  id: crypto.randomUUID(),
  number: "",
  name: "",
  birthDate: "",
  height: "",
  position: "",
  foot: "",
});

const POSITIONS = ["Arquero", "Defensor", "Mediocampista", "Delantero"];
const FEET = ["Derecho", "Zurdo", "Ambidiestro"];

const PlayerTable: React.FC<PlayerTableProps> = ({ players, onPlayersChange }) => {
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const addPlayer = () => {
    onPlayersChange([...players, EMPTY_PLAYER()]);
  };

  const removePlayer = (id: string) => {
    onPlayersChange(players.filter((p) => p.id !== id));
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    onPlayersChange(
      players.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split("\n");
    const newPlayers: Player[] = lines.map((line) => {
      const cols = line.split("\t");
      return {
        id: crypto.randomUUID(),
        number: cols[0]?.trim() || "",
        name: cols[1]?.trim() || "",
        birthDate: cols[2]?.trim() || "",
        height: cols[3]?.trim() || "",
        position: cols[4]?.trim() || "",
        foot: cols[5]?.trim() || "",
      };
    });
    onPlayersChange([...players, ...newPlayers]);
    setPasteText("");
    setPasteMode(false);
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-body";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-foreground tracking-wider">
          PLANTILLA DE JUGADORES
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasteMode(!pasteMode)}
            className="gap-1.5"
          >
            <ClipboardPaste className="w-4 h-4" />
            Pegar desde planilla
          </Button>
          <Button size="sm" onClick={addPlayer} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </div>

      {pasteMode && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Pegá datos desde una planilla (Nº, Nombre, Fecha Nac., Altura, Posición, Pie) separados por tabs:
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="w-full h-32 bg-secondary border border-border rounded p-3 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={"1\tGonzález\t15/03/1998\t1.85\tArquero\tDerecho\n4\tPérez\t22/07/2000\t1.78\tDefensor\tZurdo"}
          />
          <Button size="sm" onClick={handlePaste}>
            Importar datos
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">Nº</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">NOMBRE</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">FECHA NAC.</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">ALTURA</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">POSICIÓN</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">PIE</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <tr
                key={player.id}
                className={`border-t border-border ${
                  idx % 2 === 0 ? "bg-card" : "bg-secondary/50"
                }`}
              >
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    style={{ width: 50 }}
                    value={player.number}
                    onChange={(e) => updatePlayer(player.id, "number", e.target.value)}
                    placeholder="1"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, "name", e.target.value)}
                    placeholder="Apellido"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    style={{ width: 110 }}
                    value={player.birthDate}
                    onChange={(e) => updatePlayer(player.id, "birthDate", e.target.value)}
                    placeholder="dd/mm/aaaa"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    style={{ width: 70 }}
                    value={player.height}
                    onChange={(e) => updatePlayer(player.id, "height", e.target.value)}
                    placeholder="1.80"
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    className={inputClass}
                    value={player.position}
                    onChange={(e) => updatePlayer(player.id, "position", e.target.value)}
                  >
                    <option value="">—</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select
                    className={inputClass}
                    value={player.foot}
                    onChange={(e) => updatePlayer(player.id, "foot", e.target.value)}
                  >
                    <option value="">—</option>
                    {FEET.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay jugadores. Agregá jugadores o pegá desde una planilla.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerTable;
