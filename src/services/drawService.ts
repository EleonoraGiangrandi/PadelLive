import { FipEvent, Match } from '../types/models';
import { getMatches } from '../api/events';

export interface DrawPlayer {
  name: string;
  flag?: string;
}

export interface DrawTeam {
  player1: DrawPlayer;
  player2: DrawPlayer;
  seed?: string;
  isWinner: boolean;
  sets: string[];
}

export interface DrawMatch {
  matchId: string;
  roundId: string;
  order: number;
  team1: DrawTeam;
  team2: DrawTeam;
}

export interface DrawRound {
  roundId: string;
  roundClass?: string;
  titleKey: 'round32' | 'round16' | 'quarterFinals' | 'semiFinals' | 'final' | 'roundOther';
  titleFallback: string;
  matches: DrawMatch[];
}

export interface TournamentDraw {
  tournamentName: string;
  gender: 'men' | 'women';
  pdfUrl?: string;
  rounds: DrawRound[];
}

/**
 * Translates a round ID (e.g. "16", "8", "4", "2", "1") or string into standard i18n key
 */
export function getRoundKey(roundId: string): {
  titleKey: DrawRound['titleKey'];
  titleFallback: string;
} {
  const clean = roundId.toLowerCase().trim();
  if (clean === '1' || clean.includes('final') && !clean.includes('semi') && !clean.includes('quarter')) {
    return { titleKey: 'final', titleFallback: 'Final' };
  }
  if (clean === '2' || clean.includes('semi')) {
    return { titleKey: 'semiFinals', titleFallback: 'Semifinals' };
  }
  if (clean === '4' || clean.includes('quarter') || clean.includes('quarti')) {
    return { titleKey: 'quarterFinals', titleFallback: 'Quarterfinals' };
  }
  if (clean === '8' || clean.includes('16') && (clean.includes('round of') || clean.includes('ottav'))) {
    return { titleKey: 'round16', titleFallback: 'Round of 16' };
  }
  if (clean === '16' || clean.includes('32') || clean.includes('sedicesim')) {
    return { titleKey: 'round32', titleFallback: 'Round of 32' };
  }
  return { titleKey: 'roundOther', titleFallback: roundId || 'Round' };
}

/**
 * Parse the two teams of a match from HTML snippet
 */
function parseMatchTeams(matchHtml: string): DrawTeam[] {
  const teamSplits = matchHtml.split(/<div class=["']singleMatch__team[\s"'][^>]*>/i);
  const teams: DrawTeam[] = [];

  for (let i = 1; i < teamSplits.length; i++) {
    const teamContent = teamSplits[i];

    // Player names
    const names = [...teamContent.matchAll(/class=["']singleMatch__team--itemName["'][^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);

    // Flags
    const flags = [...teamContent.matchAll(/class=["']singleMatch__team--itemFlag["'][^>]*src=["']([^"']+)["']/gi)]
      .map((m) => m[1]);
    if (flags.length === 0) {
      const fallbackFlags = [...teamContent.matchAll(/src=["']([^"']+)["'][^>]*class=["']singleMatch__team--itemFlag["']/gi)].map((m) => m[1]);
      flags.push(...fallbackFlags);
    }

    // Winner
    const isWinner =
      teamContent.includes('winner') ||
      teamContent.includes('&#10003;') ||
      teamContent.includes('✓');

    // Seed (e.g. "(1)")
    const seedMatch = teamContent.match(/<small>([\s\S]*?)<\/small>/i);
    const seed = seedMatch ? seedMatch[1].replace(/&nbsp;/g, '').trim() : '';

    // Set scores
    const sets = [...teamContent.matchAll(/class=["']singleMatch__tableSet[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);

    teams.push({
      player1: { name: names[0] || 'TBD', flag: flags[0] },
      player2: { name: names[1] || 'TBD', flag: flags[1] },
      seed,
      isWinner,
      sets,
    });
  }

  return teams;
}

/**
 * Parse full draw bracket structure (columns and rounds)
 */
export function parseDrawHtml(html: string): DrawRound[] {
  const colParts = html.split(/<div class=["']colDraw\s+([^"']*)["']\s+data-round=["']([^"']*)["'][^>]*>/i);
  const rounds: DrawRound[] = [];

  // colParts: [prefix, class1, round1, content1, class2, round2, content2, ...]
  for (let i = 1; i < colParts.length; i += 3) {
    const roundClass = colParts[i] || '';
    const roundId = colParts[i + 1] || '';
    const colContent = colParts[i + 2] || '';

    const matchBlocks = colContent.split(/<div class=["']singleMatch["']\s*(?:data-match-id=["']([^"']*)["'])?[^>]*>/i);
    const matches: DrawMatch[] = [];

    for (let j = 1; j < matchBlocks.length; j += 2) {
      const matchId = matchBlocks[j] || '';
      const matchHtml = matchBlocks[j + 1] || '';

      const teams = parseMatchTeams(matchHtml);
      if (teams.length >= 2) {
        matches.push({
          matchId: matchId || `match-${roundId}-${Math.floor(j / 2)}`,
          roundId,
          order: Math.floor(j / 2),
          team1: teams[0],
          team2: teams[1],
        });
      }
    }

    if (matches.length > 0) {
      const { titleKey, titleFallback } = getRoundKey(roundId);
      rounds.push({
        roundId,
        roundClass,
        titleKey,
        titleFallback,
        matches,
      });
    }
  }

  // Sort rounds from Round of 32 (most matches) to Final (1 match)
  rounds.sort((a, b) => b.matches.length - a.matches.length);

  return rounds;
}

/**
 * Builds a fallback draw structure aggregating MatchScorerLive daily matches by round
 */
async function buildDrawFromMatches(event: FipEvent, gender: 'men' | 'women'): Promise<TournamentDraw> {
  try {
    const eventIdentifier = event.eventId || event.id;
    // Collects matches from tournament days
    const daysToQuery = [1, 2, 3, 4, 5, 6, 7];
    const matchPromises = daysToQuery.map((d) => getMatches(eventIdentifier, d).catch(() => []));
    const allDaysMatches = await Promise.all(matchPromises);
    const flatMatches = allDaysMatches.flat();

    // Filter by gender
    const isWomenTarget = gender === 'women';
    const genderMatches = flatMatches.filter((m) => {
      const isWomen = m.roundName?.toLowerCase().includes('women');
      return isWomenTarget ? isWomen : !isWomen;
    });

    // Group by round name
    const roundMap = new Map<string, Match[]>();
    for (const m of genderMatches) {
      const rName = m.roundName || 'Round';
      if (!roundMap.has(rName)) roundMap.set(rName, []);
      roundMap.get(rName)!.push(m);
    }

    const rounds: DrawRound[] = [];
    for (const [rName, mList] of roundMap.entries()) {
      const { titleKey, titleFallback } = getRoundKey(rName);
      const drawMatches: DrawMatch[] = mList.map((m, idx) => ({
        matchId: m.matchId || `match-${idx}`,
        roundId: rName,
        order: idx,
        team1: {
          player1: { name: m.team1.player1.name, flag: m.team1.player1.flag },
          player2: { name: m.team1.player2.name, flag: m.team1.player2.flag },
          isWinner: m.team1.isWinner,
          sets: [m.team1.set1, m.team1.set2, m.team1.set3].filter((s) => s && s !== '-'),
        },
        team2: {
          player1: { name: m.team2.player1.name, flag: m.team2.player1.flag },
          player2: { name: m.team2.player2.name, flag: m.team2.player2.flag },
          isWinner: m.team2.isWinner,
          sets: [m.team2.set1, m.team2.set2, m.team2.set3].filter((s) => s && s !== '-'),
        },
      }));

      rounds.push({
        roundId: rName,
        titleKey,
        titleFallback,
        matches: drawMatches,
      });
    }

    rounds.sort((a, b) => b.matches.length - a.matches.length);

    return {
      tournamentName: event.name,
      gender,
      rounds,
    };
  } catch {
    return {
      tournamentName: event.name,
      gender,
      rounds: [],
    };
  }
}

/**
 * Retrieves official tournament draw (Men or Women) directly from FIP
 */
export async function fetchTournamentDraw(
  event: FipEvent,
  gender: 'men' | 'women'
): Promise<TournamentDraw> {
  const isFemale = gender === 'women';
  const drawType = isFemale ? 'WD' : 'MD';
  const genderCode = isFemale ? 'F' : 'M';

  if (!event.href) {
    return buildDrawFromMatches(event, gender);
  }

  try {
    // 1. Download event page from padelfip.com
    const pageRes = await fetch(event.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!pageRes.ok) {
      return buildDrawFromMatches(event, gender);
    }

    const pageHtml = await pageRes.text();

    // Extract postId and nonce for AJAX call
    const postMatch = pageHtml.match(/post_id["']?\s*:\s*["']?(\d+)/i);
    const postId = postMatch ? postMatch[1] : '';

    const nonceMatch = pageHtml.match(/["']nonce["']?\s*:\s*["']([a-f0-9]+)["']/i);
    const nonce = nonceMatch ? nonceMatch[1] : '';

    // Extract potential PDF link
    let pdfUrl = '';
    const pdfRegex = isFemale
      ? /href=["']([^"']*(?:WD|women|fem)[^"']*\.pdf)["']/i
      : /href=["']([^"']*(?:MD|men|masc)[^"']*\.pdf)["']/i;
    const directPdfMatch = pageHtml.match(pdfRegex);
    if (directPdfMatch) {
      pdfUrl = directPdfMatch[1];
    } else {
      const anyPdf = pageHtml.match(/href=["']([^"']*DRAW[^"']*\.pdf)["']/i);
      if (anyPdf) pdfUrl = anyPdf[1];
    }

    let drawHtmlToParse = '';

    // If men, MD draw may already be directly embedded in section#mainDraw
    if (!isFemale && pageHtml.includes('class="colDraw')) {
      drawHtmlToParse = pageHtml;
    }

    // If women or not present on page, invoke admin-ajax.php with nonce
    if (!drawHtmlToParse && postId && nonce) {
      const postBody = new URLSearchParams({
        action: 'handle_ajax_request',
        drawType,
        gender: genderCode,
        postID: postId,
        security: nonce,
      }).toString();

      const ajaxRes = await fetch('https://www.padelfip.com/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': event.href,
        },
        body: postBody,
      });

      if (ajaxRes.ok) {
        const ajaxJson = await ajaxRes.json();
        if (ajaxJson.html) {
          drawHtmlToParse = ajaxJson.html;
        }
        if (ajaxJson.pdf) {
          pdfUrl = ajaxJson.pdf;
        }
      }
    }

    // If valid HTML is available, parse it
    if (drawHtmlToParse) {
      const rounds = parseDrawHtml(drawHtmlToParse);
      if (rounds.length > 0) {
        return {
          tournamentName: event.name,
          gender,
          pdfUrl,
          rounds,
        };
      }
    }

    // If no FIP bracket found, fallback to match aggregation
    return buildDrawFromMatches(event, gender);
  } catch (err) {
    console.warn('Error fetching FIP draw:', err);
    return buildDrawFromMatches(event, gender);
  }
}
