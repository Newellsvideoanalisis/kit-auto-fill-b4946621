import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MatchData } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  color1: string;
  color2: string;
}

interface Match {
  id: string;
  team_id: string;
  title: string;
  match_data: MatchData;
}

interface Props {
  currentMatch: MatchData;
  onLoad: (match: MatchData) => void;
}

const ProjectManager: React.FC<Props> = ({ currentMatch, onLoad }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newMatchTitle, setNewMatchTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) fetchMatches(selectedTeamId);
    else setMatches([]);
  }, [selectedTeamId]);

  const fetchTeams = async () => {
    const { data, error } = await supabase.from("teams").select("*").order("name");
    if (error) { console.error(error); return; }
    setTeams((data as Team[]) || []);
  };

  const fetchMatches = async (teamId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setMatches((data as unknown as Match[]) || []);
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .insert({ name: newTeamName.trim(), color1: "#1e3a5f", color2: "#000000" })
      .select()
      .single();
    setLoading(false);
    if (error) { toast.error("Error al crear equipo"); return; }
    setNewTeamName("");
    await fetchTeams();
    if (data) setSelectedTeamId(data.id);
    toast.success("Equipo creado");
  };

  const deleteTeam = async () => {
    if (!selectedTeamId) return;
    const { error } = await supabase.from("teams").delete().eq("id", selectedTeamId);
    if (error) { toast.error("Error al eliminar"); return; }
    setSelectedTeamId("");
    await fetchTeams();
    toast.success("Equipo eliminado");
  };

  const saveMatch = async () => {
    if (!selectedTeamId) { toast.error("Seleccioná un equipo primero"); return; }
    setLoading(true);

    const title = newMatchTitle.trim() ||
      `${currentMatch.homeTeam || "Local"} vs ${currentMatch.awayTeam || "Visitante"}`;

    if (selectedMatchId) {
      // Update existing
      const { error } = await supabase
        .from("matches")
        .update({ title, match_data: currentMatch as unknown as Record<string, unknown> })
        .eq("id", selectedMatchId);
      setLoading(false);
      if (error) { toast.error("Error al guardar"); return; }
      toast.success("Partido actualizado");
    } else {
      // Create new
      const { data, error } = await supabase
        .from("matches")
        .insert({ team_id: selectedTeamId, title, match_data: currentMatch as unknown as Record<string, unknown> })
        .select()
        .single();
      setLoading(false);
      if (error) { toast.error("Error al guardar"); return; }
      if (data) setSelectedMatchId(data.id);
      toast.success("Partido guardado");
    }

    setNewMatchTitle("");
    await fetchMatches(selectedTeamId);
  };

  const loadMatch = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      onLoad(match.match_data);
      setSelectedMatchId(matchId);
      toast.success("Partido cargado");
    }
  };

  const deleteMatch = async () => {
    if (!selectedMatchId) return;
    const { error } = await supabase.from("matches").delete().eq("id", selectedMatchId);
    if (error) { toast.error("Error al eliminar"); return; }
    setSelectedMatchId("");
    if (selectedTeamId) await fetchMatches(selectedTeamId);
    toast.success("Partido eliminado");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-display tracking-wider text-foreground flex items-center gap-2">
        <FolderOpen className="w-4 h-4" /> PROYECTOS
      </h3>

      {/* Team management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Equipo</Label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Seleccionar equipo..." />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Nuevo equipo</Label>
          <div className="flex gap-1">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="h-8 text-sm"
              placeholder="Nombre del equipo"
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
            />
            <Button size="sm" variant="outline" onClick={createTeam} disabled={loading} className="h-8">
              <Plus className="w-3 h-3" />
            </Button>
            {selectedTeamId && (
              <Button size="sm" variant="ghost" onClick={deleteTeam} className="h-8 text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Match management */}
      {selectedTeamId && (
        <div className="space-y-2 border-t border-border pt-3">
          <Label className="text-xs">Partidos guardados</Label>
          <div className="flex gap-2 flex-wrap">
            {matches.map((m) => (
              <Button
                key={m.id}
                size="sm"
                variant={selectedMatchId === m.id ? "default" : "outline"}
                onClick={() => loadMatch(m.id)}
                className="h-7 text-xs"
              >
                {m.title}
              </Button>
            ))}
            {matches.length === 0 && (
              <span className="text-xs text-muted-foreground">Sin partidos guardados</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Input
              value={newMatchTitle}
              onChange={(e) => setNewMatchTitle(e.target.value)}
              className="h-8 text-sm flex-1"
              placeholder="Título del partido (opcional)"
            />
            <Button size="sm" onClick={saveMatch} disabled={loading} className="h-8 gap-1">
              <Save className="w-3 h-3" />
              {selectedMatchId ? "Actualizar" : "Guardar"}
            </Button>
            {selectedMatchId && (
              <Button size="sm" variant="ghost" onClick={deleteMatch} className="h-8 text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
