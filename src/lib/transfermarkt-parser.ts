import { MatchData, MatchPlayer, MatchEvent, Substitution } from "@/types/match";

export function parseTransfermarktMarkdown(markdown: string, html?: string, pageTitle?: string): Partial<MatchData> {
  const result: Partial<MatchData> = {
    players: [],
    substitutions: [],
  };

  // Extract teams from explicit Page Title metadata, fallback to Header or Startseite links
  let extractedHome, extractedAway;

  if (pageTitle) {
      const pMatch = pageTitle.match(/(.+?)\s*-\s*(.+?)(?:,|\s+-)/);
      if (pMatch) {
          extractedHome = pMatch[1].trim();
          extractedAway = pMatch[2].trim();
      }
  }

  if (!extractedHome) {
    const titleMatch = markdown.match(/^# (.+?) - (.+)$/m) || markdown.match(/Title:\s*(.+?)\s*-\s*(.+?)(?:,|\s+-)/i);
    if (titleMatch) {
      extractedHome = titleMatch[1].trim();
      extractedAway = titleMatch[2].trim();
    } else {
      const vereinMatches = [...markdown.matchAll(/\[([^\]]+)\]\([^)]*startseite\/verein\/\d+[^)]*\)/g)];
      if (vereinMatches.length >= 2) {
        extractedHome = vereinMatches[0][1].trim();
        const awayMatch = vereinMatches.find(m => m[1].trim() !== extractedHome);
        if (awayMatch) extractedAway = awayMatch[1].trim();
      }
    }
  }

  if (extractedHome && extractedAway) {
     result.homeTeam = extractedHome;
     result.awayTeam = extractedAway;
  }

  // Extract team badges from markdown - look for wappen images near team names
  const badgePattern = /\[!\[([^\]]*)\]\((https:\/\/tmssl\.akamaized\.net\/\/images\/wappen\/normquad\/[^)]+)\)\]/g;
  const badges: { name: string; url: string }[] = [];
  let bm;
  while ((bm = badgePattern.exec(markdown)) !== null) {
    badges.push({ name: bm[1], url: bm[2] });
  }
  if (badges.length >= 1) result.homeBadge = badges[0].url;
  if (badges.length >= 2) result.awayBadge = badges[1].url;

  // Extract score
  const scoreMatch = markdown.match(/\n(\d+):(\d+)\n/);
  if (scoreMatch) {
    result.homeScore = scoreMatch[1];
    result.awayScore = scoreMatch[2];
  }

  // Extract matchday
  const matchdayPatterns = [
    /(\d+)\.\s*Jornada/i,
    /(\d+)\.\s*Spieltag/i,
    /(\d+)\.\s*Matchday/i,
    /(\d+)\.\s*Fecha/i,
    /Jornada\s*(\d+)/i,
    /Fecha\s*(\d+)/i,
    /Matchday\s*(\d+)/i,
  ];
  for (const pattern of matchdayPatterns) {
    const m = markdown.match(pattern);
    if (m) {
      const num = m[1].padStart(2, '0');
      result.matchday = `F${num}`;
      break;
    }
  }

  // Extract date
  const datePatterns = [
    /(\d{2}\/\d{2}\/\d{2,4})/,
    /(\d{2}\.\d{2}\.\d{2,4})/,
  ];
  for (const pattern of datePatterns) {
    const m = markdown.match(pattern);
    if (m) {
      result.date = m[1];
      break;
    }
  }

  // Extract time
  const timeMatch = markdown.match(/(\d{1,2}:\d{2})\s*H/i);
  if (timeMatch) {
    result.time = timeMatch[1];
  }

  // Extract tournament
  const tournamentMatch = markdown.match(/##\s*\[([^\]]+)\]/);
  if (tournamentMatch) {
    result.tournament = tournamentMatch[1].trim();
  }

  // Extract stadium
  const stadiumMatch = markdown.match(/\[([^\]]+)\]\(https:\/\/www\.transfermarkt[^)]*\/stadion\//);
  if (stadiumMatch) {
    result.stadium = stadiumMatch[1].trim();
  }

  // Extract referee
  const refereeMatch = markdown.match(/\*\*(?:Árbitro|Referee):\*\*\s*\n\n\[([^\]]+)\]/);
  if (refereeMatch) {
    result.referee = refereeMatch[1].trim();
  }

  // Extract formations recursively
  const formationMatches = [...markdown.matchAll(/Formaci[oó]n(?: inicial)?:\s*(.+)/gi)];
  if (formationMatches.length > 0) {
    result.homeFormation = normalizeFormation(formationMatches[0][1]);
  }
  if (formationMatches.length > 1) {
    result.awayFormation = normalizeFormation(formationMatches[1][1]);
  }

  // Parse players and extract Coaches from sections
  const homeSection = extractTeamSection(markdown, 0, result.homeTeam, result.awayTeam);
  const awaySection = extractTeamSection(markdown, 1, result.homeTeam, result.awayTeam);

  const homeCoachMatch = [...homeSection.matchAll(/\[([^\]]+)\]\([^)]*profil\/trainer\/\d+[^)]*\)/g)];
  if (homeCoachMatch.length > 0) result.homeCoach = homeCoachMatch[homeCoachMatch.length - 1][1].trim();

  const awayCoachMatch = [...awaySection.matchAll(/\[([^\]]+)\]\([^)]*profil\/trainer\/\d+[^)]*\)/g)];
  if (awayCoachMatch.length > 0) result.awayCoach = awayCoachMatch[awayCoachMatch.length - 1][1].trim();

  const homePlayers = parseTeamPlayers(homeSection, "home");
  const awayPlayers = parseTeamPlayers(awaySection, "away");

  result.players = [...homePlayers, ...awayPlayers];

  // Parse goals and cards
  parseGoals(markdown, result.players);
  parseCards(markdown, result.players);

  // Parse substitutions - try HTML first for minutes, then fallback to markdown
  result.substitutions = parseSubstitutions(markdown, html, result.homeTeam, result.awayTeam, result.players);

  return result;
}

function normalizeFormation(f: string): string {
  const clean = f.replace(/[^0-9-]/g, '').trim();
  const knownFormations = ["4-3-3", "4-4-2", "3-5-2", "5-3-2", "4-2-3-1", "4-1-4-1", "3-4-3"];
  if (knownFormations.includes(clean)) return clean;
  return clean || "4-3-3";
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTeamSection(markdown: string, teamIndex: number, homeTeam?: string, awayTeam?: string): string {
  // Use stricter patterns for section headers to avoid matching nav bars
  const benchIdxs = [...markdown.matchAll(/(?:\n|^)[#\s]*Banquillo/gi)].map(m => m.index!);
  const coachIdxs = [...markdown.matchAll(/(?:\n|^)[#\s]*Entrenador/gi)].map(m => m.index!);

  if (benchIdxs.length >= 2) {
    if (teamIndex === 0) {
      let endOfHome = markdown.length;
      if (coachIdxs.length >= 1 && coachIdxs[0] > benchIdxs[0] && coachIdxs[0] < benchIdxs[1]) {
        endOfHome = coachIdxs[0] + 100;
      } else {
        endOfHome = benchIdxs[0] + (benchIdxs[1] - benchIdxs[0]) / 2;
      }
      return markdown.substring(0, endOfHome);
    } else {
      let startOfAway = 0;
      if (coachIdxs.length >= 1 && coachIdxs[0] > benchIdxs[0] && coachIdxs[0] < benchIdxs[1]) {
        startOfAway = coachIdxs[0] + 100;
      } else {
        startOfAway = benchIdxs[0] + (benchIdxs[1] - benchIdxs[0]) / 2;
      }
      let endOfAway = markdown.search(/(?:\n|^)[#\s]*Goles/i);
      if (endOfAway === -1) endOfAway = markdown.length;
      return markdown.substring(startOfAway, endOfAway);
    }
  }

  // Fallback for flat lists: split by Away Team name if available
  if (awayTeam) {
    const awayRegex = new RegExp(`\\[${escapeRegex(awayTeam)}\\]`, "gi");
    const awayIdxs = [...markdown.matchAll(awayRegex)].map(m => m.index!);
    if (awayIdxs.length > 0) {
       const firstPlayerIdx = markdown.search(/profil\/spieler\/\d+/);
       let splitIdx = awayIdxs.find(idx => idx > (firstPlayerIdx + 50));
       if (!splitIdx) splitIdx = awayIdxs.length > 1 ? awayIdxs[1] : awayIdxs[0];
       
       if (teamIndex === 0) {
           return markdown.substring(0, splitIdx);
       } else {
           let endOfAway = markdown.search(/(?:\n|^)[#\s]*Goles/i);
           if (endOfAway === -1) endOfAway = markdown.length;
           return markdown.substring(splitIdx, endOfAway);
       }
    }
  }

  // Complete fallback: half string
  if (teamIndex === 0) return markdown.substring(0, markdown.length / 2);
  return markdown.substring(markdown.length / 2);
}

function parseTeamPlayers(section: string, team: "home" | "away"): MatchPlayer[] {
  const players: MatchPlayer[] = [];
  if (!section) return players;

  // Stricter bench separator
  let benchIdx = section.search(/(?:\n|^)[#\s]*Banquillo/i);
  if (benchIdx === -1) benchIdx = section.indexOf("Banquillo");
  
  const startersSection = benchIdx > -1 ? section.substring(0, benchIdx) : section;
  const benchSection = benchIdx > -1 ? section.substring(benchIdx) : "";

  const spielerLinkPattern = /\[([^\]]+)\]\([^)]*profil\/spieler\/\d+[^)]*\)/g;
  let match;
  
  // Extract Starters First
  let startersFound = 0;
  while ((match = spielerLinkPattern.exec(startersSection)) !== null) {
    const name = match[1].trim();
    if (name && !players.some(p => p.name === name)) {
      players.push({
        id: crypto.randomUUID(),
        number: "",
        name,
        // If there's no visible "Banquillo", the string is a flat list, restrict starters to 11
        isStarter: benchIdx > -1 ? true : (startersFound < 11),
        team,
        events: [],
      });
      startersFound++;
    }
  }

  // If we couldn't find any starters but found bench players, maybe the layout flipped or missed Banquillo.
  // We'll enforce the "first 11 are starters" rule if startersSection yielded nothing.
  let isFallbackToFirst11 = false;
  if (players.length === 0) {
      isFallbackToFirst11 = true;
  }

  // Parse Bench robusto
  spielerLinkPattern.lastIndex = 0;
  while ((match = spielerLinkPattern.exec(benchSection)) !== null) {
    const name = match[1].trim();
    if (name && !players.some(p => p.name === name)) {
      players.push({
        id: crypto.randomUUID(),
        number: "",
        name,
        // If we found NO starters above, treat the first 11 found here as starters!
        isStarter: isFallbackToFirst11 && players.length < 11 ? true : false,
        team,
        events: [],
      });
    }
  }

  // Find numbers using table format or list format
  const numberPattern = /(?:\|\s*(\d+)\s*\|\s*|^\s*(\d+)\s*\n\s*|(?<=^|\s)(\d+)\s+)\[([^\]]+)\]/gm;
  while ((match = numberPattern.exec(section)) !== null) {
    const num = match[1] || match[2] || match[3];
    const name = match[4].trim();
    const p = players.find((x) => x.name === name);
    if (p && num) p.number = num;
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
  html: string | undefined,
  homeTeam?: string,
  awayTeam?: string,
  players?: MatchPlayer[]
): Substitution[] {
  const subs: Substitution[] = [];

  const subsSection = extractSection(markdown, "## Cambios", "## Amonestaciones");
  if (!subsSection) return subs;

  // Pattern: optional minute before two consecutive profiling links
  const subPattern = /(?:(?:^|\n|\||\*\*)\s*(\d{1,3})['′]?[^\w\[\]]*)?\[([^\]]+)\]\([^)]*profil\/spieler[^)]*\)\s*\[([^\]]+)\]\([^)]*profil\/spieler[^)]*\)/gi;
  let match;

  while ((match = subPattern.exec(subsSection)) !== null) {
    let minuteIn = match[1] ? match[1].trim() : "";
    const playerIn = match[2].trim();
    const playerOut = match[3].trim();

    let team: "home" | "away" | undefined;
    if (players) {
      const outPlayer = findPlayerByName(players, playerOut);
      if (outPlayer) team = outPlayer.team;
      else {
        const inPlayer = findPlayerByName(players, playerIn);
        if (inPlayer) team = inPlayer.team;
      }
    }

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

  return subs;
}

// No html minute extraction needed anymore

function extractSection(markdown: string, startHeader: string, endHeader: string): string {
  const startIdx = markdown.indexOf(startHeader);
  if (startIdx === -1) return "";

  const afterStart = startIdx + startHeader.length;
  let endIdx = markdown.indexOf(endHeader, afterStart);
  if (endIdx === -1) endIdx = markdown.length;

  return markdown.substring(startIdx, endIdx);
}

function findPlayerByName(players: MatchPlayer[], name: string): MatchPlayer | undefined {
  const player = players.find(p => p.name === name);
  if (player) return player;

  const lastName = name.split(" ").pop()?.toLowerCase();
  if (!lastName) return undefined;

  return players.find(p => {
    const pLastName = p.name.split(" ").pop()?.toLowerCase();
    return pLastName === lastName;
  });
}
