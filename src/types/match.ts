export interface MatchEvent {
  type: "goal" | "yellow_card" | "red_card" | "substitution_in" | "substitution_out";
  minute: string;
}

export interface MatchPlayer {
  id: string;
  number: string;
  name: string;
  isStarter: boolean;
  team?: "home" | "away";
  events: MatchEvent[];
  x?: number;
  y?: number;
  // Datos preservados desde Campograma para formas completas
  birthDate?: string;
  height?: string;
  foot?: string;
  position?: string;
  isDuplicate?: boolean;
}

export interface Substitution {
  id: string;
  minuteIn: string;
  playerIn: string;
  playerInNumber: string;
  playerOut: string;
  playerOutNumber: string;
  team?: "home" | "away";
}

export interface MatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  homeColor1: string;
  homeColor2: string;
  awayColor1: string;
  awayColor2: string;
  homeBadge?: string;
  awayBadge?: string;
  tournament: string;
  matchday: string;
  date: string;
  time: string;
  stadium: string;
  referee: string;
  formation: string;
  players: MatchPlayer[];
  substitutions: Substitution[];
}
