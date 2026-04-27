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

const parseCsvLine = (line: string): string[] => {
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
  return cols.map(c => c.replace(/^"|"$/g, ""));
};

const parseTransfermarktCSV = (text: string): Player[] => {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const dataLines = lines.slice(1);

  // Initialize indices
  let numIdx = -1;
  let nameIdx = -1;
  let posIdx = -1;
  let birthIdx = -1;
  let heightIdx = -1;
  let footIdx = -1;

  // 1. Try to find by header names
  numIdx = headers.findIndex(h => h === "#" || h === "nº" || h === "number");
  nameIdx = headers.findIndex(h => h.includes("jugador") || h.includes("player") || h.includes("nombre"));
  posIdx = headers.findIndex(h => h.includes("pos") || h.includes("posición") || h.includes("position"));
  birthIdx = headers.findIndex(h => h.includes("nacimiento") || h.includes("f. nac.") || h.includes("fecha") || h.includes("age") || h === "zentriert");
  heightIdx = headers.findIndex(h => h.includes("altura") || h.includes("height") || h.includes("talla") || h === "zentriert 2");
  footIdx = headers.findIndex(h => h.includes("pie") || h.includes("foot") || h === "zentriert 3");

  // 2. Data analysis heuristics if needed or to verify
  if (dataLines.length > 0) {
    const firstRowData = parseCsvLine(dataLines[0]);
    
    // Find Birth Date: contains date format like 01/01/1990
    if (birthIdx === -1 || !/\d{2}\/\d{2}\/\d{4}/.test(firstRowData[birthIdx])) {
      const found = firstRowData.findIndex(c => /\d{2}\/\d{2}\/\d{4}/.test(c));
      if (found !== -1) birthIdx = found;
    }

    // Find Height: looks like "1,80 m" or "1.80 m"
    if (heightIdx === -1 || !/\d[.,]\d{2}\s*m/.test(firstRowData[heightIdx])) {
      const found = firstRowData.findIndex(c => /\d[.,]\d{2}\s*m/.test(c));
      if (found !== -1) heightIdx = found;
    }

    // Find Foot: "Derecho", "Izquierdo", "Ambidiestro"
    const footValues = ["derecho", "izquierdo", "ambidiestro", "right", "left", "both"];
    if (footIdx === -1 || !footValues.includes(firstRowData[footIdx].toLowerCase())) {
      const found = firstRowData.findIndex(c => footValues.includes(c.toLowerCase()));
      if (found !== -1) footIdx = found;
    }

    // Find Number: single or double digit
    if (numIdx === -1) {
      const found = firstRowData.findIndex(c => /^\d{1,2}$/.test(c));
      if (found !== -1) numIdx = found;
    }

    // Find Name: string longer than 3 chars, not a URL, not a date, not a digit
    if (nameIdx === -1) {
      const found = firstRowData.findIndex((c, i) => 
        i < 5 && 
        c.length > 3 && 
        !c.includes("http") && 
        !c.includes("/") && 
        isNaN(Number(c))
      );
      if (found !== -1) nameIdx = found;
    }

    // Find Position
    const posKeywords = ["portero", "defensa", "lateral", "pivote", "mediocentro", "extremo", "delantero", "mediapunta", "goalkeeper", "defender", "midfield", "striker"];
    if (posIdx === -1) {
      const found = firstRowData.findIndex(c => posKeywords.some(k => c.toLowerCase().includes(k)));
      if (found !== -1) posIdx = found;
    }
  }

  return dataLines.map((line) => {
    const cols = parseCsvLine(line);
    return {
      id: crypto.randomUUID(),
      number: numIdx !== -1 ? cols[numIdx] || "" : "",
      name: nameIdx !== -1 ? cols[nameIdx] || "" : "",
      birthDate: birthIdx !== -1 ? cols[birthIdx] || "" : "",
      height: heightIdx !== -1 ? cols[heightIdx] || "" : "",
      position: posIdx !== -1 ? cols[posIdx] || "" : "",
      foot: footIdx !== -1 ? cols[footIdx] || "" : "",
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
