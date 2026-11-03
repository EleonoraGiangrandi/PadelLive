const https = require('https');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function parseMatchScorerLive(html, courtNameDefault = 'Court') {
  const matches = [];

  // Match tables are typically delimited by <table class="w-100 mb-4"> or similar tables
  // Let's find every table containing `scorebox-header` or `player-names`
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;

  while ((match = tableRegex.exec(html)) !== null) {
    const tableContent = match[1];
    if (!tableContent.includes('player-names')) continue;

    try {
      // 1. Round Name
      const roundMatch = tableContent.match(/class=\"round-name[^\"]*\"[\s\S]*?<small>([\s\S]*?)<\/small>/i);
      let roundName = 'Round';
      if (roundMatch) {
        roundName = roundMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }

      // 2. Start Time / Court Name
      const courtSpanMatch = tableContent.match(/<span class=\"court-name\">([\s\S]*?)<\/span>/i);
      const startTime = courtSpanMatch ? courtSpanMatch[1].trim() : '';

      // 3. Match ID
      const btnMatch = tableContent.match(/data-id=\"([^\"]+)\"/i);
      const matchId = btnMatch ? btnMatch[1] : `M_${matches.length + 1}`;

      // 4. Teams - split into Team 1 and Team 2 rows
      const teamRows = tableContent.match(/<tr[^>]*>[\s\S]*?player-names[\s\S]*?<\/tr>/gi) || [];
      if (teamRows.length >= 2) {
        const team1 = parseTeamRow(teamRows[0]);
        const team2 = parseTeamRow(teamRows[1]);

        matches.push({
          matchId,
          courtName: courtNameDefault,
          roundName,
          startDate: startTime,
          team1,
          team2
        });
      }
    } catch (e) {
      console.warn('Error parsing match table:', e);
    }
  }

  return matches;
}

function parseTeamRow(rowHtml) {
  // Players
  const players = [];
  const playerBlocks = rowHtml.match(/<div class=\"d-flex align-items-center\">([\s\S]*?)<\/div>\s*<\/div>/gi) || [];
  
  // Extract all flags and names
  const flagMatches = [...rowHtml.matchAll(/<img[^>]*class=\"flags\"[^>]*src=\"([^\"]+)\"/gi)];
  const nameBlocks = rowHtml.match(/<div class=\"ml-2[^\"]*line-thin\">([\s\S]*?)<\/div>/gi) || [];

  for (let i = 0; i < Math.max(nameBlocks.length, 2); i++) {
    const flag = flagMatches[i] ? 'https://widget.matchscorerlive.com' + flagMatches[i][1] : '';
    let name = 'TBD';
    if (nameBlocks[i]) {
      name = nameBlocks[i].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    players.push({ name, flag });
  }

  // Winner indicator: checks if 'winner' class or 'check-primary' icon is present
  const isWinner = rowHtml.includes('winner') || rowHtml.includes('check-primary');

  // Serving indicator: checks for tennis ball or fa-baseball or serving icon
  const isServing = rowHtml.includes('serving') || rowHtml.includes('ball');

  // Sets
  const setMatches = [...rowHtml.matchAll(/<td[^>]*class=\"set[^\"]*\"[^>]*>([\s\S]*?)<\/td>/gi)];
  const sets = setMatches.map(m => {
    let raw = m[1].replace(/<sup>(.*?)<\/sup>/gi, '($1)').replace(/<[^>]+>/g, '').trim();
    return raw;
  });

  return {
    player1: players[0] || { name: 'TBD', flag: '' },
    player2: players[1] || { name: 'TBD', flag: '' },
    points: '',
    set1: sets[0] || '',
    set2: sets[1] || '',
    set3: sets[2] || '',
    isWinner,
    isServing
  };
}

async function run() {
  const html = await fetchHtml('https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol');
  const matches = parseMatchScorerLive(html);
  console.log('Matches parsed successfully:', matches.length);
  console.log(JSON.stringify(matches, null, 2));
}

run();
