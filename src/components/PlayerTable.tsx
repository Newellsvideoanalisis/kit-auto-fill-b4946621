import React, { useState } from "react";
import { Player } from "@/types/player";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload } from "lucide-react";

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

const POSITIONS = [
  "Portero",
  "Defensa central",
  "Lateral derecho",
  "Lateral izquierdo",
  "Pivote",
  "Mediocentro",
  "Mediocentro ofensivo",
  "Mediapunta",
  "Extremo derecho",
  "Extremo izquierdo",
  "Delantero centro",
];
const FEET = ["Derecho", "Izquierdo", "Ambidiestro"];

const parseTransfermarktCSV = (text: string): Player[] => {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Skip header row
  const dataLines = lines.slice(1);
  return dataLines.map((line) => {
    // Parse CSV with quoted fields
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());

    // Extract birth date - format "01/09/1998 (27)" → "01/09/1998 (27)"
    const rawDate = cols[5] || "";
    // Extract height - format "1,84m" → "1,84m"  
    const rawHeight = cols[7] || "";
    // Map foot: Izquierdo stays, Derecho stays
    const rawFoot = cols[8] || "";

    return {
      id: crypto.randomUUID(),
      number: cols[0] || "",
      name: cols[2] || "",
      birthDate: rawDate,
      height: rawHeight,
      position: cols[4] || "",
      foot: rawFoot,
    };
  });
};

const PlayerTable: React.FC<PlayerTableProps> = ({ players, onPlayersChange }) => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const newPlayers = parseTransfermarktCSV(text);
      if (newPlayers.length > 0) {
        onPlayersChange([...players, ...newPlayers]);
      }
    };
    reader.readAsText(file, "utf-8");
    // Reset input so same file can be uploaded again
    e.target.value = "";
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
          <label>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer" asChild>
              <span>
                <Upload className="w-4 h-4" />
                Importar CSV
              </span>
            </Button>
          </label>
          <Button size="sm" onClick={addPlayer} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">Nº</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">NOMBRE</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">POSICIÓN</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">PIE</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">ALTURA</th>
              <th className="px-3 py-2 text-left font-display text-base tracking-wider">EDAD</th>
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
                  <input
                    className={inputClass}
                    style={{ width: 70 }}
                    value={player.height}
                    onChange={(e) => updatePlayer(player.id, "height", e.target.value)}
                    placeholder="1.80"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    style={{ width: 160 }}
                    value={player.birthDate}
                    onChange={(e) => updatePlayer(player.id, "birthDate", e.target.value)}
                    placeholder="01/09/1998 (27)"
                  />
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
            No hay jugadores. Importá un CSV de Transfermarkt o agregá manualmente.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerTable;
