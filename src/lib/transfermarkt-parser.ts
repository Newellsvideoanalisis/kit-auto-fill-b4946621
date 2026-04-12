import { MatchData, MatchPlayer, MatchEvent, Substitution } from "@/types/match";

export function parseTransfermarktMarkdown(markdown: string): Partial<MatchData> {
  const result: Partial<MatchData> = {
    players: [],
    substitutions: [],
  };

  // Extract teams from title
  const titleMatch = markdown.match(/^# (.+?) - (.+)$/m);
  if (titleMatch) {
    result.homeTeam = titleMatch[1].trim();
    result.awayTeam = titleMatch[2].trim();
  }

  // Extract score
  const scoreMatch = markdown.match(/\n(\d+):(\d+)\n/);
  if (scoreMatch) {
    result.homeScore = scoreMatch[1];
    result.awayScore = scoreMatch[2];
  }

  // Extract matchday - multiple patterns
  const matchdayPatterns = [
    /(\d+)\.\s*Jornada/i,
    /Jornada\s*(\d+)/i,
    /(\d+)\.\s*(?:Spieltag|Matchday|Fecha)/i,
    /Fecha\s*(\d+)/i,
  ];
  for (const pattern of matchdayPatterns) {
    const m = markdown.match(pattern);
    if (m) {
      result.matchday = `F${m[1].padStart(2, '0')}`;
      break;
    }
  }

  // Extract date
  const dateMatch = markdown.match(/\|\s*(\d{2}\/\d{2}\/\d{2,4})/);
  if (dateMatch) {
    result.date = dateMatch[1];
  }

  // Extract time
  const timeMatch = markdown.match(/(\d{2}:\d{2})\s*H/i);
  if (timeMatch) {
    result.time = timeMatch[1];
  }

  // Extract tournament
  const tournamentMatch = markdown.match(/##\s*\[([^\]]+)\]/);
  if (tournamentMatch) {
    result.tournament = tournamentMatch[1].trim();
  }

  // Extract stadium
  const stadiumMatch = markdown.match(/\[([^\]]+)\]\(https:\/\/www\.transfermarkt[^\)]*\/stadion\//);
  if (stadiumMatch) {
    result.stadium = stadiumMatch[1].trim();
  }

  // Extract referee
  const refereeMatch = markdown.match(/\*\*(?:Árbitro|Referee):\*\*\s*\n\n\[([^\]]+)\]/);
  if (refereeMatch) {
    result.referee = refereeMatch[1].trim();
  }

  // Extract formations
  const formationMatches = [...markdown.matchAll(/Formación inicial:\s*(.+)/g)];
  if (formationMatches.length > 0) {
    const formStr = formationMatches[0][1].trim().replace(/\s*ofensivo/i, '').replace(/\s*defensivo/i, '');
    result.formation = normalizeFormation(formStr);
  }

  // Parse players
  const homeSection = extractTeamSection(markdown, 0);
  const awaySection = extractTeamSection(markdown, 1);

  const homePlayers = parseTeamPlayers(homeSection, "home");
  const awayPlayers = parseTeamPlayers(awaySection, "away");

  result.players = [...homePlayers, ...awayPlayers];

  // Parse goals and cards
  parseGoals(markdown, result.players);
  parseCards(markdown, result.players);

  // Parse substitutions with team assignment
  result.substitutions = parseSubstitutions(markdown, result.homeTeam, result.awayTeam, result.players);

  return result;
}

function normalizeFormation(f: string): string {
  const clean = f.replace(/[^0-9-]/g, '').trim();
  const knownFormations = ["4-3-3", "4-4-2", "3-5-2", "5-3-2", "4-2-3-1", "4-1-4-1", "3-4-3"];
  if (knownFormations.includes(clean)) return clean;
  return clean || "4-3-3";
}

function extractTeamSection(markdown: string, teamIndex: number): string {
  const formationIdx: number[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = markdown.indexOf("Formación inicial:", searchFrom);
    if (idx === -1) break;
    formationIdx.push(idx);
    searchFrom = idx + 1;
  }

  if (formationIdx.length <= teamIndex) return "";

  const start = formationIdx[teamIndex];
  const end = teamIndex + 1 < formationIdx.length
    ? formationIdx[teamIndex + 1]
    : markdown.indexOf("## Goles", start) || markdown.length;

  return markdown.substring(start, end);
}

function parseTeamPlayers(section: string, team: "home" | "away"): MatchPlayer[] {
  const players: MatchPlayer[] = [];
  if (!section) return players;

  const benchIdx = section.indexOf("Banquillo");
  const startersSection = benchIdx > -1 ? section.substring(0, benchIdx) : section;
  const benchSection = benchIdx > -1 ? section.substring(benchIdx) : "";

  const starterPattern = /\n(\d+)\n\n\[([^\]]+)\]/g;
  let match;

  while ((match = starterPattern.exec(startersSection)) !== null) {
    players.push({
      id: crypto.randomUUID(),
      number: match[1],
      name: match[2],
      isStarter: true,
      team,
      events: [],
    });
  }

  const benchTablePattern = /\|\s*(\d+)\s*\|\s*\[([^\]]+)\]/g;
  while ((match = benchTablePattern.exec(benchSection)) !== null) {
    players.push({
      id: crypto.randomUUID(),
      number: match[1],
      name: match[2],
      isStarter: false,
      team,
      events: [],
    });
  }

  if (players.filter(p => p.isStarter).length === 0) {
    const tablePattern = /\|\s*(\d+)\s*\|\s*\[([^\]]+)\]/g;
    while ((match = tablePattern.exec(startersSection)) !== null) {
      players.push({
        id: crypto.randomUUID(),
        number: match[1],
        name: match[2],
        isStarter: true,
        team,
        events: [],
      });
    }
  }

  return players;
}

function parseGoals(markdown: string, players: MatchPlayer[]) {
  const goalsSection = extractSection(markdown, "## Goles", "## Cambios");
  if (!goalsSection) return;

  const goalPattern = /\*\*\d+:\d+\*\*[\s\S]*?\[([^\]]+)\]\([^)]*leistungsdatendetails[^)]*\)/g;
  let match;

  while ((match = goalPattern.exec(goalsSection)) !== null) {
    const scorerName = match[1].trim();
    const player = findPlayerByName(players, scorerName);
    if (player && !player.events.some(e => e.type === "goal")) {
      player.events.push({ type: "goal", minute: "" });
    }
  }
}

function parseCards(markdown: string, players: MatchPlayer[]) {
  const cardsSection = extractSection(markdown, "## Amonestaciones", "## ");
  if (!cardsSection) {
    const idx = markdown.indexOf("## Amonestaciones");
    if (idx === -1) return;
    const section = markdown.substring(idx);
    parseCardsFromSection(section, players);
    return;
  }
  parseCardsFromSection(cardsSection, players);
}

function parseCardsFromSection(section: string, players: MatchPlayer[]) {
  const yellowPattern = /\[([^\]]+)\]\([^)]*leistungsdatendetails[^)]*\)[\s\S]*?Tarjeta amarilla/g;
  let match;
  while ((match = yellowPattern.exec(section)) !== null) {
    const player = findPlayerByName(players, match[1].trim());
    if (player) {
      player.events.push({ type: "yellow_card", minute: "" });
    }
  }

  const redPattern = /\[([^\]]+)\]\([^)]*leistungsdatendetails[^)]*\)[\s\S]*?Tarjeta roja/g;
  while ((match = redPattern.exec(section)) !== null) {
    const player = findPlayerByName(players, match[1].trim());
    if (player) {
      player.events.push({ type: "red_card", minute: "" });
    }
  }
}

function parseSubstitutions(
  markdown: string,
  homeTeam?: string,
  awayTeam?: string,
  players?: MatchPlayer[]
): Substitution[] {
  const subs: Substitution[] = [];
  const subsSection = extractSection(markdown, "## Cambios", "## Amonestaciones");
  if (!subsSection) return subs;

  // Try to extract with minutes: "**minute'** [PlayerIn](...)[PlayerOut](...)" or similar
  // Pattern 1: minute + two player links
  const subWithMinutePattern = /(?:\*\*)?(\d+)'?\*?\*?[^[]*\[([^\]]+)\]\([^)]*leistungsdatendetails[^)]*\)[^[]*\[([^\]]+)\]\([^)]*leistungsdatendetails[^)]*\)/g;
  let match;

  while ((match = subWithMinutePattern.exec(subsSection)) !== null) {
    const minuteIn = match[1];
    const playerIn = match[2].trim();
    const playerOut = match[3].trim();

    // Determine team by checking if playerOut is in home or away players
    let team: "home" | "away" | undefined;
    if (players) {
      const outPlayer = findPlayerByName(players, playerOut);
      if (outPlayer) team = outPlayer.team;
      else {
        const inPlayer = findPlayerByName(players, playerIn);
        if (inPlayer) team = inPlayer.team;
      }
    }

    // Find player numbers from parsed players
    const inPlayer = players ? findPlayerByName(players, playerIn) : undefined;
    const outPlayerObj = players ? findPlayerByName(players, playerOut) : undefined;

    subs.push({
      id: crypto.randomUUID(),
      minuteIn,
      playerIn,
      playerInNumber: inPlayer?.number || "",
      playerOut,
      playerOutNumber: outPlayerObj?.number || "",
      team,
    });
  }

  // Fallback: old pattern without minutes
  if (subs.length === 0) {
    const subPattern = /\[([^\]]+)\]\([^)]*leistungsdatendetails[^)]*\)\s*\[([^\]]+)\]\([^)]*leistungsdatendetails[^)]*\)/g;
    while ((match = subPattern.exec(subsSection)) !== null) {
      const playerIn = match[1].trim();
      const playerOut = match[2].trim();

      let team: "home" | "away" | undefined;
      if (players) {
        const outPlayer = findPlayerByName(players, playerOut);
        if (outPlayer) team = outPlayer.team;
      }

      subs.push({
        id: crypto.randomUUID(),
        minuteIn: "",
        playerIn,
        playerInNumber: "",
        playerOut,
        playerOutNumber: "",
        team,
      });
    }
  }

  return subs;
}

function extractSection(markdown: string, startHeader: string, endHeader: string): string {
  const startIdx = markdown.indexOf(startHeader);
  if (startIdx === -1) return "";

  const afterStart = startIdx + startHeader.length;
  let endIdx = markdown.indexOf(endHeader, afterStart);
  if (endIdx === -1) endIdx = markdown.length;

  return markdown.substring(startIdx, endIdx);
}

function findPlayerByName(players: MatchPlayer[], name: string): MatchPlayer | undefined {
  let player = players.find(p => p.name === name);
  if (player) return player;

  const lastName = name.split(" ").pop()?.toLowerCase();
  if (!lastName) return undefined;

  return players.find(p => {
    const pLastName = p.name.split(" ").pop()?.toLowerCase();
    return pLastName === lastName;
  });
}
