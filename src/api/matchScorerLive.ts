import { Match, StatsResponse, Team } from '../types/models';

const MATCHSCORER_BASE = 'https://widget.matchscorerlive.com';

/**
 * Recupera direttamente le partite del torneo e della giornata selezionata
 * interrogando il motore ufficiale FIP MatchScorerLive senza server terzi.
 */
export async function getMatchesDirect(
  eventId: string,
  day: number,
  year: number = new Date().getFullYear()
): Promise<Match[]> {
  try {
    const cleanId = eventId.replace(/^FIP-\d{4}-/, '');

    // 1. Prova prima oopbyday (Order of Play / Live in corso)
    const oopUrl = `${MATCHSCORER_BASE}/screen/oopbyday/FIP-${year}-${cleanId}/${day}?t=tol`;
    const oopRes = await fetch(oopUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    let matches: Match[] = [];
    if (oopRes.ok) {
      const oopHtml = await oopRes.text();
      matches = parseMatchScorerLiveHtml(oopHtml, day);
    }

    // 2. Se non ci sono partite in oopbyday (o sono tutte concluse/in archivio), interroga resultsbyday
    if (matches.length === 0) {
      const resUrl = `${MATCHSCORER_BASE}/screen/resultsbyday/FIP-${year}-${cleanId}/${day}?t=tol`;
      const resResponse = await fetch(resUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (resResponse.ok) {
        const resHtml = await resResponse.text();
        matches = parseMatchScorerLiveHtml(resHtml, day);
      }
    }

    return matches;
  } catch (err) {
    console.warn('getMatchesDirect error:', err);
    return [];
  }
}

/**
 * Parser per estrarre le partite dal widget HTML di MatchScorerLive.
 */
export function parseMatchScorerLiveHtml(html: string, dayNumber?: number): Match[] {
  const matches: Match[] = [];

  // Suddivide per sezioni campo (schedule-header o court-header)
  const courtSections = html.split(/<div class=\"(?:schedule-header|court-header|court-title)[^>]*>/i);
  const sections = courtSections.length > 1 ? courtSections.slice(1) : [html];

  for (const section of sections) {
    // Estrae nome del campo se disponibile
    const courtNameMatch = section.match(
      /<(?:div|span|h\d)[^>]*class=\"(?:oop-court|court-name|header-court)[^>]*>([\s\S]*?)<\/(?:div|span|h\d)>/i
    );
    const sectionCourtName = courtNameMatch
      ? courtNameMatch[1].replace(/<[^>]+>/g, '').trim()
      : '';

    // Estrae le tabelle incontro all'interno della sezione (cattura sia gli attributi che il contenuto)
    const tableRegex = /<table([^>]*)>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(section)) !== null) {
      const tableAttrs = tableMatch[1] || '';
      const tableContent = tableMatch[2];
      if (!tableContent.includes('player-names')) continue;

      try {
        // matchId (su tag table, a.open data-id="..." o showMatchStat('...'))
        const fullBlock = tableAttrs + ' ' + tableContent;
        const idMatch =
          fullBlock.match(/data-id=["']([^'"]+)["']/i) ||
          fullBlock.match(/showMatchStat\(['"]([^'"]+)['"]\)/i);
        const matchId = idMatch ? idMatch[1] : '';

        // Orario di inizio o indicatore LIVE
        const timeMatch = tableContent.match(
          /class=\"(?:court-name|scheduled-time)\">([\s\S]*?)<\/(?:span|th)>/i
        );
        const startDate = timeMatch
          ? timeMatch[1].replace(/<[^>]+>/g, '').trim()
          : '';

        // Round (es. "Men Q1", "Round of 32", "Final")
        const roundMatch = tableContent.match(/<div class=\"round-name[^>]*>([\s\S]*?)<\/div>/i);
        let roundName = '';
        if (roundMatch) {
          roundName = roundMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Indicatori partita in corso / live dal widget
        const isLiveTable =
          tableContent.includes('scorebox-header-live') ||
          tableContent.includes('live-point') ||
          /In Progress/i.test(tableContent) ||
          /LIVE/i.test(startDate);

        // Righe dei due team
        const teamRows = [...tableContent.matchAll(/<tr[^>]*>([\s\S]*?player-names[\s\S]*?)<\/tr>/gi)];

        if (teamRows.length >= 2 && teamRows[0] && teamRows[1]) {
          const team1 = parseTeamRow(teamRows[0][1]);
          const team2 = parseTeamRow(teamRows[1][1]);

          const isFinished = team1.isWinner || team2.isWinner;
          const isWalkover = isFinished && (team1.set1 === '-' || team2.set1 === '-');
          const isLive = !isFinished && (
            isLiveTable ||
            team1.isServing ||
            team2.isServing ||
            (team1.points !== '' || team2.points !== '')
          );

          const status: 'live' | 'completed' | 'scheduled' | 'walkover' =
            isWalkover
              ? 'walkover'
              : isFinished
              ? 'completed'
              : isLive
              ? 'live'
              : 'scheduled';

          matches.push({
            matchId,
            courtName: sectionCourtName || 'Campo',
            startDate,
            roundName,
            team1,
            team2,
            isLive,
            status,
            dayNumber,
          });
        }
      } catch (err) {
        console.warn('Error parsing match table:', err);
      }
    }
  }

  return matches;
}

function parseTeamRow(trContent: string): Team {
  const players: { name: string; flag?: string }[] = [];

  // Trova ogni blocco giocatore: <div class="d-flex align-items-center">
  const playerBlocks = [...trContent.matchAll(/<div class=\"d-flex align-items-center\">([\s\S]*?)<\/div>\s*<\/div>/gi)];

  for (const block of playerBlocks) {
    const pContent = block[1];

    // Bandiera
    const flagMatch =
      pContent.match(/<img[^>]*class=\"flags\"[^>]*src=\"([^\"]+)\"/i) ||
      pContent.match(/<img[^>]*src=\"([^\"]*flags[^\"]*)\"/i);
    let flag = flagMatch ? flagMatch[1] : '';
    if (flag && flag.startsWith('/')) {
      flag = `${MATCHSCORER_BASE}${flag}`;
    }

    // Nome: unione degli span di testo (es. "R." + "Coello Manso")
    const spans = [...pContent.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((s) => s[1].replace(/<[^>]+>/g, '').trim())
      .filter((s) => s.length > 0 && !s.includes('class'));

    const name = spans.join(' ').trim();
    if (name) {
      players.push({ name, flag });
    }
  }

  // Fallback se la struttura è leggermente diversa
  if (players.length === 0) {
    const genericNames = [...trContent.matchAll(/<span class=\"(?:name|player-name)\">([\s\S]*?)<\/span>/gi)];
    for (const gm of genericNames) {
      players.push({ name: gm[1].replace(/<[^>]+>/g, '').trim(), flag: '' });
    }
  }

  // Punteggi Set 1, Set 2, Set 3
  const setCells = [...trContent.matchAll(/<td[^>]*class=\"[^\"]*set[^\"]*\"[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => {
    const val = c[1]
      .replace(/<sup>(.*?)<\/sup>/i, '($1)')
      .replace(/<[^>]+>/g, '')
      .trim();
    return val === '-' ? '' : val;
  });

  const set1 = setCells[0] || '';
  const set2 = setCells[1] || '';
  const set3 = setCells[2] || '';

  // Punti live del game in corso (15, 30, 40, AD, 0)
  const pointCell = trContent.match(/<td[^>]*class=\"[^\"]*(?:point|live-point)[^\"]*\"[^>]*>([\s\S]*?)<\/td>/i);
  const points = pointCell ? pointCell[1].replace(/<[^>]+>/g, '').trim() : '';

  // Indicatore vincitore
  const isWinner =
    trContent.includes('check-primary') ||
    trContent.includes('winner') ||
    trContent.includes('fa-check');

  // Indicatore battuta / servizio
  const isServing =
    trContent.includes('ball_green.png') ||
    trContent.includes('ballg') ||
    trContent.includes('serving') ||
    trContent.includes('is-serving');

  return {
    player1: players[0] ? { name: players[0].name, flag: players[0].flag || '' } : { name: 'Player 1', flag: '' },
    player2: players[1] ? { name: players[1].name, flag: players[1].flag || '' } : { name: 'Player 2', flag: '' },
    points,
    set1,
    set2,
    set3,
    isWinner,
    isServing,
  };
}

/**
 * Recupera le statistiche dettagliate di un match interrogando direttamente MatchScorerLive.
 */
export async function getMatchStatsDirect(
  matchId: string,
  eventId: string,
  year: number = new Date().getFullYear()
): Promise<StatsResponse> {
  try {
    const cleanId = eventId.replace(/^FIP-\d{4}-/, '');
    const url = `${MATCHSCORER_BASE}/screen/getmatchstats?t=tol`;

    const body = new URLSearchParams({
      matchId: matchId,
      year: year.toString(),
      tournamentId: cleanId,
      organization: 'FIP',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`MatchScorerLive stats HTTP ${response.status}`);
    }

    const html = await response.text();
    return parseMatchStatsHtml(html);
  } catch (err) {
    console.warn('getMatchStatsDirect error:', err);
    return { duration: '' };
  }
}

/**
 * Parser per estrarre le statistiche dalla risposta HTML del modal MatchScorerLive.
 */
export function parseMatchStatsHtml(html: string): StatsResponse {
  try {
    // Durata
    const durationMatch = html.match(/class=\"stats-matchtime\">([\s\S]*?)<\/div>/i);
    const duration = durationMatch ? durationMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Funzione helper per parsare ciascun tab periodo (period-0 = Match, period-1 = Set 1, etc.)
    const parsePeriod = (periodId: string) => {
      const paneRegex = new RegExp(
        `<div[^>]*id="${periodId}"[^>]*>([\\s\\S]*?)(?=<div[^>]*class="[^"]*tab-pane|$)`,
        'i'
      );
      const paneMatch = html.match(paneRegex);
      if (!paneMatch) return undefined;

      const paneHtml = paneMatch[1];
      const blocks = paneHtml.split('<div class="d-flex w-100 justify-content-between">').slice(1);

      const statsMap: Record<string, { t1: string; t2: string }> = {};

      for (const b of blocks) {
        const labelMatch = b.match(/class=\"stats-data-points\">([\s\S]*?)<\/div>/i);
        if (!labelMatch) continue;
        const label = labelMatch[1].replace(/<[^>]+>/g, '').trim().toLowerCase();

        const valMatches = [...b.matchAll(/<div class=\"stats-l1-values[^>]*>([\s\S]*?)<\/div>/gi)];
        const v1 = valMatches[0] ? valMatches[0][1].replace(/<[^>]+>/g, '').trim() : '';
        const v2 = valMatches[1] ? valMatches[1][1].replace(/<[^>]+>/g, '').trim() : '';

        statsMap[label] = { t1: v1, t2: v2 };
      }

      const getVal = (name: string) => statsMap[name] || { t1: '', t2: '' };

      return {
        team1Stats: {
          match: {
            totalPointsWon: getVal('total points won').t1,
            breakingPointsConverted: getVal('break points converted').t1,
            longestStreak: getVal('longest streak of points won').t1 || getVal('longest streak').t1,
          },
          serve: {
            aces: getVal('aces').t1,
            doubleFaults: getVal('double faults').t1,
            serviceGames: getVal('service games played').t1 || getVal('service games').t1,
            wonOnFirstServe: getVal('points won on 1st serve').t1 || getVal('won on 1st serve').t1,
            wonOnSecondServe: getVal('points won on 2nd serve').t1 || getVal('won on 2nd serve').t1,
          },
          returnStats: {
            returnGames: getVal('return games played').t1 || getVal('return games').t1,
            wonOnFirstReturn: getVal('points won on 1st return').t1 || getVal('won on 1st return').t1,
            wonOnSecondReturn: getVal('points won on 2nd return').t1 || getVal('won on 2nd return').t1,
          },
          totalPoints: {
            totalWonOnServe: getVal('points won on serve').t1 || getVal('total won on serve').t1,
            totalWonOnReturn: getVal('points won on return').t1 || getVal('total won on return').t1,
          },
        },
        team2Stats: {
          match: {
            totalPointsWon: getVal('total points won').t2,
            breakingPointsConverted: getVal('break points converted').t2,
            longestStreak: getVal('longest streak of points won').t2 || getVal('longest streak').t2,
          },
          serve: {
            aces: getVal('aces').t2,
            doubleFaults: getVal('double faults').t2,
            serviceGames: getVal('service games played').t2 || getVal('service games').t2,
            wonOnFirstServe: getVal('points won on 1st serve').t2 || getVal('won on 1st serve').t2,
            wonOnSecondServe: getVal('points won on 2nd serve').t2 || getVal('won on 2nd serve').t2,
          },
          returnStats: {
            returnGames: getVal('return games played').t2 || getVal('return games').t2,
            wonOnFirstReturn: getVal('points won on 1st return').t2 || getVal('won on 1st return').t2,
            wonOnSecondReturn: getVal('points won on 2nd return').t2 || getVal('won on 2nd return').t2,
          },
          totalPoints: {
            totalWonOnServe: getVal('points won on serve').t2 || getVal('total won on serve').t2,
            totalWonOnReturn: getVal('points won on return').t2 || getVal('total won on return').t2,
          },
        },
      };
    };

    return {
      duration,
      match: parsePeriod('period-0'),
      set1: parsePeriod('period-1'),
      set2: parsePeriod('period-2'),
      set3: parsePeriod('period-3'),
    };
  } catch (err) {
    console.warn('parseMatchStatsHtml error:', err);
    return { duration: '' };
  }
}
