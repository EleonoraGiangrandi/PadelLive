const fs = require('fs');
const html = fs.readFileSync('scripts/match_stats_sample.html', 'utf8');

function parseMatchStatsHtml(html) {
  // Score & Duration
  const scoreMatch = html.match(/class=\"stats-score\">([\s\S]*?)<\/div>/i);
  const score = scoreMatch ? scoreMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  const durationMatch = html.match(/class=\"stats-matchtime\">([\s\S]*?)<\/div>/i);
  const duration = durationMatch ? durationMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // Parse each period tab: period-0 (Match), period-1 (Set 1), period-2 (Set 2), period-3 (Set 3)
  function parsePeriod(periodId) {
    const paneRegex = new RegExp(`<div[^>]*id="${periodId}"[^>]*>([\\s\\S]*?)(?=<div[^>]*class="[^"]*tab-pane|$)`, 'i');
    const paneMatch = html.match(paneRegex);
    if (!paneMatch) return undefined;

    const content = paneMatch[1];
    const statRows = [...content.matchAll(/<div class="d-flex w-100 justify-content-between">([\s\S]*?)<\/div>\s*<\/div>/gi)];

    const statsMap = {};
    for (const r of statRows) {
      const rowHtml = r[1];
      const labelMatch = rowHtml.match(/class=\"stats-data-points\">([\s\S]*?)<\/div>/i);
      if (!labelMatch) continue;
      const label = labelMatch[1].replace(/<[^>]+>/g, '').trim().toLowerCase();

      // Values
      const values = [...rowHtml.matchAll(/class=\"stats-l1-values[^"]*\">([\s\S]*?)<\/div>/gi)];
      const v1 = values[0] ? values[0][1].replace(/<[^>]+>/g, '').trim() : '';
      const v2 = values[1] ? values[1][1].replace(/<[^>]+>/g, '').trim() : '';

      statsMap[label] = { t1: v1, t2: v2 };
    }

    const getVal = (name) => statsMap[name] || { t1: '', t2: '' };

    return {
      team1Stats: {
        match: {
          totalPointsWon: getVal('total points won').t1,
          breakingPointsConverted: getVal('break points converted').t1,
          longestStreak: getVal('longest streak of points won').t1,
        },
        serve: {
          aces: getVal('aces').t1,
          doubleFaults: getVal('double faults').t1,
          serviceGames: getVal('service games played').t1,
          wonOnFirstServe: getVal('points won on 1st serve').t1,
          wonOnSecondServe: getVal('points won on 2nd serve').t1,
        },
        returnStats: {
          returnGames: getVal('return games played').t1,
          wonOnFirstReturn: getVal('points won on 1st return').t1,
          wonOnSecondReturn: getVal('points won on 2nd return').t1,
        },
        totalPoints: {
          totalWonOnServe: getVal('points won on serve').t1,
          totalWonOnReturn: getVal('points won on return').t1,
        },
      },
      team2Stats: {
        match: {
          totalPointsWon: getVal('total points won').t2,
          breakingPointsConverted: getVal('break points converted').t2,
          longestStreak: getVal('longest streak of points won').t2,
        },
        serve: {
          aces: getVal('aces').t2,
          doubleFaults: getVal('double faults').t2,
          serviceGames: getVal('service games played').t2,
          wonOnFirstServe: getVal('points won on 1st serve').t2,
          wonOnSecondServe: getVal('points won on 2nd serve').t2,
        },
        returnStats: {
          returnGames: getVal('return games played').t2,
          wonOnFirstReturn: getVal('points won on 1st return').t2,
          wonOnSecondReturn: getVal('points won on 2nd return').t2,
        },
        totalPoints: {
          totalWonOnServe: getVal('points won on serve').t2,
          totalWonOnReturn: getVal('points won on return').t2,
        },
      },
    };
  }

  const matchStats = parsePeriod('period-0');
  const set1Stats = parsePeriod('period-1');
  const set2Stats = parsePeriod('period-2');
  const set3Stats = parsePeriod('period-3');

  return {
    duration,
    match: matchStats,
    set1: set1Stats,
    set2: set2Stats,
    set3: set3Stats,
  };
}

const parsed = parseMatchStatsHtml(html);
console.log('Duration:', parsed.duration);
console.log('Match stats team 1:', parsed.match.team1Stats);
console.log('Match stats team 2:', parsed.match.team2Stats);
console.log('Set 1 team 1:', parsed.set1 ? parsed.set1.team1Stats.match : 'null');
console.log('Set 2 team 1:', parsed.set2 ? parsed.set2.team1Stats.match : 'null');
