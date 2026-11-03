const fs = require('fs');

function parseMatchScorerLiveHtml(html) {
  const matches = [];

  // Suddivide per sezioni campo (<div class="oop-court">)
  const courtSections = html.split(/<div class=\"schedule-header/i);

  for (const section of courtSections) {
    if (!section.includes('player-names')) continue;

    // Estrae nome del campo (es. "Court 1", "Central")
    const courtMatch = section.match(/<div class=\"oop-court\">([\s\S]*?)<\/div>/i);
    const courtName = courtMatch ? courtMatch[1].replace(/<[^>]+>/g, '').trim() : 'Campo';

    // Estrae le tabelle incontro all'interno del campo
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(section)) !== null) {
      const tableContent = tableMatch[1];
      if (!tableContent.includes('player-names')) continue;

      try {
        // Estrai matchId da onclick o data attribute (es. showMatchStat('...'))
        const matchIdMatch = tableContent.match(/showMatchStat\(['"]([^'"]+)['"]\)/i) ||
                             tableContent.match(/data-matchid=["']([^'"]+)["']/i);
        const matchId = matchIdMatch ? matchIdMatch[1] : '';

        // Estrai orario e round
        const timeMatch = tableContent.match(/<span class=\"scheduled-time\">([\s\S]*?)<\/span>/i);
        const startDate = timeMatch ? timeMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        const roundMatch = tableContent.match(/<div class=\"oop-round\">([\s\S]*?)<\/div>/i);
        const roundName = roundMatch ? roundMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // Estrai righe dei due team (tr)
        const teamRows = [...tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
        if (teamRows.length >= 2 && teamRows[0] && teamRows[1]) {
          const team1 = parseTeamRow(teamRows[0][1]);
          const team2 = parseTeamRow(teamRows[1][1]);

          matches.push({
            matchId,
            courtName,
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
  // Giocatori e bandiere
  const players = [];
  const playerBlocks = [...trContent.matchAll(/<div class=\"player-row\">([\s\S]*?)<\/div>/gi)];

  for (const block of playerBlocks) {
    const pContent = block[1];
    const flagMatch = pContent.match(/<img[^>]*src=\"([^\"]+)\"/i);
    const nameMatch = pContent.match(/<span class=\"player-name\">([\s\S]*?)<\/span>/i);

    const flag = flagMatch ? flagMatch[1] : '';
    const name = nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    if (name) {
      players.push({ name, flag });
    }
  }

  // Se i playerBlocks falliscono, cerca span o player-names generici
  if (players.length === 0) {
    const genericNames = [...trContent.matchAll(/<span class=\"(?:name|player-name)\">([\s\S]*?)<\/span>/gi)];
    for (const gm of genericNames) {
      players.push({ name: gm[1].replace(/<[^>]+>/g, '').trim(), flag: '' });
    }
  }

  // Punteggi Set 1, Set 2, Set 3
  const setCells = [...trContent.matchAll(/<td class=\"(?:set-cell|score-set)[^>]*>([\s\S]*?)<\/td>/gi)];
  const set1 = setCells[0] ? setCells[0][1].replace(/<[^>]+>/g, '').trim() : '';
  const set2 = setCells[1] ? setCells[1][1].replace(/<[^>]+>/g, '').trim() : '';
  const set3 = setCells[2] ? setCells[2][1].replace(/<[^>]+>/g, '').trim() : '';

  // Punti del game in corso (15, 30, 40, AD, o 0)
  const pointCell = trContent.match(/<td class=\"(?:point-cell|live-points)[^>]*>([\s\S]*?)<\/td>/i);
  const points = pointCell ? pointCell[1].replace(/<[^>]+>/g, '').trim() : '';

  // Indicatore servizio (palla da tennis verde o icona serving)
  const isServing = trContent.includes('ball_green.png') || trContent.includes('is-serving') || trContent.includes('serving-indicator');

  // Vincitore
  const isWinner = trContent.includes('winner-check') || trContent.includes('is-winner') || trContent.includes('class=\"winner\"');

  return {
    player1: players[0] || { name: 'Player 1' },
    player2: players[1] || { name: 'Player 2' },
    points,
    set1,
    set2,
    set3,
    isWinner,
    isServing,
  };
}

const oopHtml = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');
const oopMatches = parseMatchScorerLiveHtml(oopHtml);
console.log('OOP Matches parsed:', oopMatches.length);
if (oopMatches.length > 0) {
  console.log('Sample OOP match:', JSON.stringify(oopMatches[0], null, 2));
}

const resHtml = fs.readFileSync('scripts/riyadh_results.html', 'utf8');
const resMatches = parseMatchScorerLiveHtml(resHtml);
console.log('Results Matches parsed:', resMatches.length);
if (resMatches.length > 0) {
  console.log('Sample Result match:', JSON.stringify(resMatches[0], null, 2));
}
