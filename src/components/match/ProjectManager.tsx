import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Plus, Save, Trash2, FolderOpen, CheckCircle2 } from "lucide-react";
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
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) fetchMatches(selectedTeamId);
    else setMatches([]);
  }, [selectedTeamId]);

  // Auto-save: debounce 2 seconds after any match data change
  useEffect(() => {
    if (!selectedMatchId || !selectedTeamId) return;

    const serialized = JSON.stringify(currentMatch);
    if (serialized === lastSavedRef.current) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const { error } = await supabase
          .from("matches")
          .update({ match_data: JSON.parse(serialized) })
          .eq("id", selectedMatchId);
        if (!error) {
          lastSavedRef.current = serialized;
        }
      } catch (e) {
        console.error("Auto-save error:", e);
      } finally {
        setAutoSaving(false);
      }
    }, 2000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [currentMatch, selectedMatchId, selectedTeamId]);

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
    const serialized = JSON.stringify(currentMatch);

    if (selectedMatchId) {
      const { error } = await supabase
        .from("matches")
        .update({ title, match_data: JSON.parse(serialized) })
        .eq("id", selectedMatchId);
      setLoading(false);
      if (error) { toast.error("Error al guardar"); return; }
      lastSavedRef.current = serialized;
      toast.success("Partido actualizado");
    } else {
      const { data, error } = await supabase
        .from("matches")
        .insert([{ team_id: selectedTeamId, title, match_data: JSON.parse(serialized) }])
        .select()
        .single();
      setLoading(false);
      if (error) { toast.error("Error al guardar"); return; }
      if (data) {
        setSelectedMatchId(data.id);
        lastSavedRef.current = serialized;
      }
      toast.success("Partido guardado");
    }

    setNewMatchTitle("");
    await fetchMatches(selectedTeamId);
  };

  const loadMatch = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      lastSavedRef.current = JSON.stringify(match.match_data);
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
    lastSavedRef.current = "";
    if (selectedTeamId) await fetchMatches(selectedTeamId);
    toast.success("Partido eliminado");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h3 className="text-sm font-display tracking-wider text-foreground flex items-center gap-2">
        <FolderOpen className="w-4 h-4" /> PROYECTOS
        {autoSaving && (
          <span className="text-xs text-muted-foreground animate-pulse ml-2">Guardando...</span>
        )}
        {!autoSaving && selectedMatchId && lastSavedRef.current && (
          <span className="text-xs text-green-500 ml-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Guardado
          </span>
        )}
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
