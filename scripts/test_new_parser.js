const fs = require('fs');

function parseMatchScorerLiveHtml(html) {
  const matches = [];

  // Split by court section or table
  // Look for court header if present
  const courtSections = html.split(/<div class=\"(?:schedule-header|court-header|court-title)[^>]*>/i);

  // If no court headers, treat whole HTML as single section
  const sections = courtSections.length > 1 ? courtSections.slice(1) : [html];

  for (const section of sections) {
    // Extract court name if available
    const courtNameMatch = section.match(/<(?:div|span|h\d)[^>]*class=\"(?:oop-court|court-name|header-court)[^>]*>([\s\S]*?)<\/(?:div|span|h\d)>/i);
    const sectionCourtName = courtNameMatch ? courtNameMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Match all scorebox tables
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(section)) !== null) {
      const tableContent = tableMatch[1];
      if (!tableContent.includes('player-names')) continue;

      try {
        // matchId & eventId
        const idMatch = tableContent.match(/data-id=["']([^'"]+)["']/i) ||
                        tableContent.match(/showMatchStat\(['"]([^'"]+)['"]\)/i);
        const matchId = idMatch ? idMatch[1] : '';

        // Scheduled time
        const timeMatch = tableContent.match(/class=\"(?:court-name|scheduled-time)\">([\s\S]*?)<\/span>/i);
        const startDate = timeMatch ? timeMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // Round name (e.g. "Men Q1" or "Round of 32")
        const roundMatch = tableContent.match(/<div class=\"round-name[^>]*>([\s\S]*?)<\/div>/i);
        let roundName = '';
        if (roundMatch) {
          roundName = roundMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Team rows
        // Look for rows with class="team" or rows containing player-names
        const teamRows = [...tableContent.matchAll(/<tr[^>]*>([\s\S]*?player-names[\s\S]*?)<\/tr>/gi)];

        if (teamRows.length >= 2) {
          const team1 = parseTeamRow(teamRows[0][1]);
          const team2 = parseTeamRow(teamRows[1][1]);

          matches.push({
            matchId,
            courtName: sectionCourtName || 'Court',
            startDate,
            roundName,
            team1,
            team2,
          });
        }
      } catch (err) {
        console.warn('Error parsing match table:', err);
      }
    }
  }

  return matches;
}

function parseTeamRow(trContent) {
  const players = [];

  // Match each player container: <div class="d-flex align-items-center">
  const playerBlocks = [...trContent.matchAll(/<div class=\"d-flex align-items-center\">([\s\S]*?)<\/div>\s*<\/div>/gi)];

  for (const block of playerBlocks) {
    const pContent = block[1];

    // Flag
    const flagMatch = pContent.match(/<img[^>]*class=\"flags\"[^>]*src=\"([^\"]+)\"/i) ||
                      pContent.match(/<img[^>]*src=\"([^\"]*flags[^\"]*)\"/i);
    let flag = flagMatch ? flagMatch[1] : '';
    if (flag && flag.startsWith('/')) {
      flag = `https://widget.matchscorerlive.com${flag}`;
    }

    // Name: spans inside
    const spans = [...pContent.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
      .map(s => s[1].replace(/<[^>]+>/g, '').trim())
      .filter(s => s.length > 0 && !s.includes('class'));

    const name = spans.join(' ').trim();
    if (name) {
      players.push({ name, flag });
    }
  }

  // Fallback if playerBlocks missed
  if (players.length === 0) {
    const rawNames = [...trContent.matchAll(/<div class=\"player-names\">([\s\S]*?)<\/div>/gi)];
    // simple fallback
    players.push({ name: 'Player 1', flag: '' });
  }

  // Sets: <td class="set ...">6<sup>0</sup></td>
  const setCells = [...trContent.matchAll(/<td[^>]*class=\"[^\"]*set[^\"]*\"[^>]*>([\s\S]*?)<\/td>/gi)]
    .map(c => {
      let val = c[1].replace(/<sup>(.*?)<\/sup>/i, '($1)').replace(/<[^>]+>/g, '').trim();
      return val === '-' ? '' : val;
    });

  const set1 = setCells[0] || '';
  const set2 = setCells[1] || '';
  const set3 = setCells[2] || '';

  // Points (game in progress)
  const pointCell = trContent.match(/<td[^>]*class=\"[^\"]*(?:point|live-point)[^\"]*\"[^>]*>([\s\S]*?)<\/td>/i);
  const points = pointCell ? pointCell[1].replace(/<[^>]+>/g, '').trim() : '';

  // Winner check
  const isWinner = trContent.includes('check-primary') ||
                   trContent.includes('winner') ||
                   trContent.includes('fa-check');

  // Serving check
  const isServing = trContent.includes('ball_green.png') ||
                    trContent.includes('serving') ||
                    trContent.includes('is-serving');

  return {
    player1: players[0] || { name: 'Player 1', flag: '' },
    player2: players[1] || { name: 'Player 2', flag: '' },
    points,
    set1,
    set2,
    set3,
    isWinner,
    isServing,
  };
}

const html = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');
const matches = parseMatchScorerLiveHtml(html);
console.log('Matches parsed:', matches.length);
if (matches.length > 0) {
  console.log('Sample parsed match:');
  console.log(JSON.stringify(matches[0], null, 2));
  console.log('Second parsed match:');
  console.log(JSON.stringify(matches[1], null, 2));
}
