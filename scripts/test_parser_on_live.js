const fs = require('fs');

// We copy the parseMatchScorerLiveHtml function logic from src/api/matchScorerLive.ts
function parseMatchScorerLiveHtml(html) {
  const MATCHSCORER_BASE = 'https://widget.matchscorerlive.com';
  const matches = [];

  const courtSections = html.split(/<div class=\"(?:schedule-header|court-header|court-title)[^>]*>/i);
  const sections = courtSections.length > 1 ? courtSections.slice(1) : [html];

  for (const section of sections) {
    const courtNameMatch = section.match(
      /<(?:div|span|h\d)[^>]*class=\"(?:oop-court|court-name|header-court)[^>]*>([\s\S]*?)<\/(?:div|span|h\d)>/i
    );
    const sectionCourtName = courtNameMatch
      ? courtNameMatch[1].replace(/<[^>]+>/g, '').trim()
      : '';

    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(section)) !== null) {
      const tableContent = tableMatch[1];
      if (!tableContent.includes('player-names') && !tableContent.includes('team')) continue;

      try {
        const idMatch =
          tableContent.match(/data-id=["']([^'"]+)["']/i) ||
          tableContent.match(/showMatchStat\(['"]([^'"]+)['"]\)/i);
        const matchId = idMatch ? idMatch[1] : '';

        const timeMatch = tableContent.match(
          /class=\"(?:court-name|scheduled-time)\">([\s\S]*?)<\/span>/i
        ) || tableContent.match(/<th[^>]*class=\"[^\"]*scheduled-time[^\"]*\"[^>]*>([\s\S]*?)<\/th>/i);
        const startDate = timeMatch
          ? timeMatch[1].replace(/<[^>]+>/g, '').trim()
          : '';

        const roundMatch = tableContent.match(/<div class=\"round-name[^>]*>([\s\S]*?)<\/div>/i);
        let roundName = '';
        if (roundMatch) {
          roundName = roundMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Check if table contains live markers
        const isLiveTable =
          tableContent.includes('scorebox-header-live') ||
          tableContent.includes('live-point') ||
          /In Progress/i.test(tableContent) ||
          /LIVE/i.test(startDate);

        // Find <tr> that are team rows (not header or summary)
        const teamRows = [...tableContent.matchAll(/<tr[^>]*>([\s\S]*?(?:player-names|class=\"team\")[\s\S]*?)<\/tr>/gi)];

        if (teamRows.length >= 2 && teamRows[0] && teamRows[1]) {
          const team1 = parseTeamRow(teamRows[0][1], MATCHSCORER_BASE);
          const team2 = parseTeamRow(teamRows[1][1], MATCHSCORER_BASE);

          matches.push({
            matchId,
            courtName: sectionCourtName || 'Campo',
            startDate,
            roundName,
            team1,
            team2,
            isLive: isLiveTable || team1.isServing || team2.isServing || (!!team1.points || !!team2.points),
          });
        }
      } catch (err) {
        console.warn('Error parsing match table:', err);
      }
    }
  }

  return matches;
}

function parseTeamRow(trContent, MATCHSCORER_BASE) {
  const players = [];

  const playerBlocks = [...trContent.matchAll(/<div class=\"d-flex align-items-center\">([\s\S]*?)<\/div>/gi)];

  for (const block of playerBlocks) {
    const pContent = block[1];

    const flagMatch =
      pContent.match(/<img[^>]*class=\"flags\"[^>]*src=\"([^\"]+)\"/i) ||
      pContent.match(/<img[^>]*src=\"([^\"]*flags[^\"]*)\"/i);
    let flag = flagMatch ? flagMatch[1] : '';
    if (flag && flag.startsWith('/')) {
      flag = `${MATCHSCORER_BASE}${flag}`;
    }

    const spans = [...pContent.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((s) => s[1].replace(/<[^>]+>/g, '').trim())
      .filter((s) => s.length > 0 && !s.includes('class'));

    const name = spans.join(' ').trim();
    if (name) {
      players.push({ name, flag });
    }
  }

  if (players.length === 0) {
    const genericNames = [...trContent.matchAll(/<span class=\"(?:name|player-name)\">([\s\S]*?)<\/span>/gi)];
    for (const gm of genericNames) {
      players.push({ name: gm[1].replace(/<[^>]+>/g, '').trim(), flag: '' });
    }
  }

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

  const pointCell = trContent.match(/<td[^>]*class=\"[^\"]*(?:point|live-point)[^\"]*\"[^>]*>([\s\S]*?)<\/td>/i);
  const points = pointCell ? pointCell[1].replace(/<[^>]+>/g, '').trim() : '';

  const isWinner =
    trContent.includes('check-primary') ||
    trContent.includes('winner') ||
    trContent.includes('fa-check');

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

const sampleLiveHtml = `
<div class="schedule-header">
  <div class="court-header"><span class="oop-court">CENTER COURT</span></div>
  <table class="w-100 mb-4" data-id="MD01" data-status="live">
    <tr class="scorebox-header-live">
      <th colspan="4"><div class="round-name">Men Final</div></th>
      <th class="scheduled-time">LIVE</th>
    </tr>
    <tr>
      <td class="team" colspan="4">
        <div class="d-flex align-items-center">
          <img class="flags" src="/images/flags/ESP.jpg" />
          <span class="ml-2">A. Galan</span>
          <img class="flags" src="/images/flags/ARG.jpg" />
          <span class="ml-2">F. Chingotto</span>
        </div>
      </td>
      <td><img src="/images/ball_green.png" class="ballg" /></td>
      <td class="set set-completed">6</td>
      <td class="set">4</td>
      <td class="set">-</td>
      <td class="points live-point">40</td>
    </tr>
    <tr>
      <td class="team" colspan="4">
        <div class="d-flex align-items-center">
          <img class="flags" src="/images/flags/ESP.jpg" />
          <span class="ml-2">A. Coello</span>
          <img class="flags" src="/images/flags/ARG.jpg" />
          <span class="ml-2">A. Tapia</span>
        </div>
      </td>
      <td></td>
      <td class="set set-completed">4</td>
      <td class="set">5</td>
      <td class="set">-</td>
      <td class="points live-point">30</td>
    </tr>
    <tr class="summary">
      <td colspan="8">
        <div class="live-status-summary d-flex justify-content-between">
          <div><span>01:15</span> <span>In Progress</span></div>
          <a class="open" data-id="MD01" data-year="2026" data-tid="902" data-org="FIP">MATCH STATS</a>
        </div>
      </td>
    </tr>
  </table>
</div>
`;

const res = parseMatchScorerLiveHtml(sampleLiveHtml);
console.log('Result:', JSON.stringify(res, null, 2));
