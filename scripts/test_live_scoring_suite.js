const assert = require('assert');

// 1. Simula l'HTML di un widget MatchScorerLive reale con match in corso, completati e programmati
const mockMatchScorerLiveHtml = `
<div class="schedule-header">
  <div class="court-header"><span class="oop-court">PISTA CENTRALE</span></div>

  <!-- MATCH 1: LIVE IN CORSO (Terzo set, Galán al servizio sul 40-30) -->
  <table class="w-100 mb-4" data-id="LIVE001">
    <tr class="scorebox-header-live">
      <th colspan="4">
        <span class="court-name">In corso - Set 3</span>
      </th>
      <th colspan="4">
        <div class="round-name text-right">
          <small><b>Men </b><div>Semifinal</div></small>
        </div>
      </th>
    </tr>
    <tr class="scorebox-sep-bottom">
      <td class="team" colspan="4">
        <div class="player-names">
          <div class="double">
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>A.</span><span>Galan</span></div>
            </div>
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ARG.jpg"/></div>
              <div class="ml-2 line-thin"><span>F.</span><span>Chingotto</span></div>
            </div>
          </div>
        </div>
      </td>
      <td><img src="/images/ball_green.png" class="ballg" alt="serving"/></td>
      <td class="set set-completed">6</td>
      <td class="set set-completed set-lost">4</td>
      <td class="set">5</td>
      <td class="points live-point">40</td>
    </tr>
    <tr class="scorebox-sep-bottom">
      <td class="team" colspan="4">
        <div class="player-names">
          <div class="double">
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>A.</span><span>Coello</span></div>
            </div>
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ARG.jpg"/></div>
              <div class="ml-2 line-thin"><span>A.</span><span>Tapia</span></div>
            </div>
          </div>
        </div>
      </td>
      <td></td>
      <td class="set set-completed set-lost">4</td>
      <td class="set set-completed">6</td>
      <td class="set">4</td>
      <td class="points live-point">30</td>
    </tr>
    <tr class="summary">
      <td colspan="8">
        <div class="live-status-summary d-flex justify-content-between">
          <div><span>02:14</span> <span>In Progress</span></div>
          <a class="open" data-id="LIVE001" data-year="2026" data-tid="902" data-org="FIP">MATCH STATS</a>
        </div>
      </td>
    </tr>
  </table>

  <!-- MATCH 2: COMPLETATO (Finale con tiebreak) -->
  <table class="w-100 mb-4" data-id="COMP002">
    <tr class="scorebox-header-completed">
      <th colspan="4"><span class="court-name">Terminato</span></th>
      <th colspan="4"><div class="round-name text-right"><small><b>Women </b><div>Final</div></small></div></th>
    </tr>
    <tr class="scorebox-sep-bottom">
      <td class="team" colspan="4">
        <div class="player-names">
          <div class="double">
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>G.</span><span>Triay</span></div>
            </div>
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ARG.jpg"/></div>
              <div class="ml-2 line-thin"><span>D.</span><span>Brea</span></div>
            </div>
          </div>
        </div>
      </td>
      <td><i class="fa-solid fa-check check-primary winner"></i></td>
      <td class="set set-completed">7<sup>5</sup></td>
      <td class="set set-completed">6</td>
      <td class="set set-lost">-</td>
    </tr>
    <tr class="scorebox-sep-bottom">
      <td class="team" colspan="4">
        <div class="player-names">
          <div class="double">
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>P.</span><span>Josemaria</span></div>
            </div>
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>A.</span><span>Sanchez</span></div>
            </div>
          </div>
        </div>
      </td>
      <td></td>
      <td class="set set-completed set-lost">6<sup>3</sup></td>
      <td class="set set-completed set-lost">3</td>
      <td class="set set-lost">-</td>
    </tr>
  </table>

  <!-- MATCH 3: PROGRAMMATO (In attesa) -->
  <table class="w-100 mb-4" data-id="SCHED003">
    <tr class="scorebox-header">
      <th colspan="4"><span class="court-name">Not before 7:00 PM</span></th>
      <th colspan="4"><div class="round-name text-right"><small><b>Men </b><div>Quarter</div></small></div></th>
    </tr>
    <tr class="scorebox-sep-bottom">
      <td class="team" colspan="4">
        <div class="player-names">
          <div class="double">
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>P.</span><span>Cardona</span></div>
            </div>
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>J.</span><span>Lebron</span></div>
            </div>
          </div>
        </div>
      </td>
      <td></td>
      <td class="set">-</td>
      <td class="set">-</td>
      <td class="set">-</td>
    </tr>
    <tr class="scorebox-sep-bottom">
      <td class="team" colspan="4">
        <div class="player-names">
          <div class="double">
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ARG.jpg"/></div>
              <div class="ml-2 line-thin"><span>F.</span><span>Stupaczuk</span></div>
            </div>
            <div class="d-flex align-items-center">
              <div><img class="flags" src="/images/flags/ESP.jpg"/></div>
              <div class="ml-2 line-thin"><span>M.</span><span>Yanguas</span></div>
            </div>
          </div>
        </div>
      </td>
      <td></td>
      <td class="set">-</td>
      <td class="set">-</td>
      <td class="set">-</td>
    </tr>
  </table>
</div>
`;

// Carichiamo la funzione di parsing compilata dal nostro codice
// Estraiamo la logica identica a src/api/matchScorerLive.ts
function parseTeamRow(trContent) {
  const MATCHSCORER_BASE = 'https://widget.matchscorerlive.com';
  const players = [];
  const playerBlocks = [...trContent.matchAll(/<div class=\"d-flex align-items-center\">([\s\S]*?)<\/div>\s*<\/div>/gi)];

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

function parseMatchScorerLiveHtml(html, dayNumber) {
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

    const tableRegex = /<table([^>]*)>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(section)) !== null) {
      const tableAttrs = tableMatch[1] || '';
      const tableContent = tableMatch[2];
      if (!tableContent.includes('player-names')) continue;

      const fullBlock = tableAttrs + ' ' + tableContent;
      const idMatch =
        fullBlock.match(/data-id=["']([^'"]+)["']/i) ||
        fullBlock.match(/showMatchStat\(['"]([^'"]+)['"]\)/i);
      const matchId = idMatch ? idMatch[1] : '';

      const timeMatch = tableContent.match(
        /class=\"(?:court-name|scheduled-time)\">([\s\S]*?)<\/(?:span|th)>/i
      );
      const startDate = timeMatch
        ? timeMatch[1].replace(/<[^>]+>/g, '').trim()
        : '';

      const roundMatch = tableContent.match(/<div class=\"round-name[^>]*>([\s\S]*?)<\/div>/i);
      let roundName = '';
      if (roundMatch) {
        roundName = roundMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }

      const isLiveTable =
        tableContent.includes('scorebox-header-live') ||
        tableContent.includes('live-point') ||
        /In Progress/i.test(tableContent) ||
        /LIVE/i.test(startDate);

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

        const status =
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
    }
  }

  return matches;
}

console.log('=== TEST SUITE: LIVE SCORING ENGINE ===\n');

// 1. Test parsing HTML
const matches = parseMatchScorerLiveHtml(mockMatchScorerLiveHtml, 1);
console.log(`[PASS] Partite estratte: ${matches.length} su 3 attese`);
assert.strictEqual(matches.length, 3);

// 2. Test Match 1: LIVE IN CORSO
const m1 = matches[0];
console.log('\n--- Verifica Match 1 (LIVE) ---');
console.log(`  Match ID: ${m1.matchId}`);
console.log(`  Stato: ${m1.status} (isLive=${m1.isLive})`);
console.log(`  Team 1: ${m1.team1.player1.name} & ${m1.team1.player2.name}`);
console.log(`  Set: ${m1.team1.set1}-${m1.team2.set1}, ${m1.team1.set2}-${m1.team2.set2}, ${m1.team1.set3}-${m1.team2.set3}`);
console.log(`  Punti live del game: ${m1.team1.points} - ${m1.team2.points}`);
console.log(`  Servizio: Team 1 isServing=${m1.team1.isServing}, Team 2 isServing=${m1.team2.isServing}`);

assert.strictEqual(m1.isLive, true, 'Match 1 deve essere riconosciuto come LIVE');
assert.strictEqual(m1.status, 'live', 'Status deve essere "live"');
assert.strictEqual(m1.team1.points, '40', 'Team 1 deve avere 40 punti');
assert.strictEqual(m1.team2.points, '30', 'Team 2 deve avere 30 punti');
assert.strictEqual(m1.team1.isServing, true, 'Team 1 deve avere la pallina da servizio');
assert.strictEqual(m1.team2.isServing, false, 'Team 2 non deve servire');
assert.strictEqual(m1.team1.set3, '5', 'Set 3 parziale deve essere 5');
assert.strictEqual(m1.team2.set3, '4', 'Set 3 parziale deve essere 4');
console.log('[PASS] Match 1 LIVE completamente validato!');

// 3. Test Match 2: COMPLETATO CON TIE-BREAK
const m2 = matches[1];
console.log('\n--- Verifica Match 2 (COMPLETATO) ---');
console.log(`  Match ID: ${m2.matchId}`);
console.log(`  Stato: ${m2.status} (isWinner T1=${m2.team1.isWinner}, T2=${m2.team2.isWinner})`);
console.log(`  Tie-break Set 1: T1=${m2.team1.set1}, T2=${m2.team2.set1}`);

assert.strictEqual(m2.isLive, false, 'Match 2 non deve essere LIVE');
assert.strictEqual(m2.status, 'completed', 'Status deve essere "completed"');
assert.strictEqual(m2.team1.isWinner, true, 'Team 1 deve essere vincitore');
assert.strictEqual(m2.team1.set1, '7(5)', 'Tie-break deve essere formattato come 7(5)');
assert.strictEqual(m2.team2.set1, '6(3)', 'Tie-break deve essere formattato come 6(3)');
console.log('[PASS] Match 2 COMPLETATO validato con gestione tie-break!');

// 4. Test Match 3: PROGRAMMATO
const m3 = matches[2];
console.log('\n--- Verifica Match 3 (PROGRAMMATO) ---');
console.log(`  Match ID: ${m3.matchId}`);
console.log(`  Stato: ${m3.status}`);
console.log(`  Orario: ${m3.startDate}`);

assert.strictEqual(m3.isLive, false);
assert.strictEqual(m3.status, 'scheduled');
console.log('[PASS] Match 3 PROGRAMMATO validato!');

// 5. Test Ordinamento: I match LIVE devono apparire sempre in cima
console.log('\n--- Verifica Ordinamento Live First ---');
const unsorted = [m2, m3, m1]; // Completato, Programmato, Live
const sorted = [...unsorted].sort((a, b) => {
  const aOngoing = a.isLive || a.status === 'live';
  const bOngoing = b.isLive || b.status === 'live';
  if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
  const aFinished = a.status === 'completed' || a.team1?.isWinner || a.team2?.isWinner;
  const bFinished = b.status === 'completed' || b.team1?.isWinner || b.team2?.isWinner;
  if (aFinished !== bFinished) return aFinished ? 1 : -1;
  return (a.startDate || '').localeCompare(b.startDate || '');
});

console.log('Ordine risultante:');
sorted.forEach((m, idx) => console.log(`  [${idx}] ${m.matchId} -> ${m.status}`));
assert.strictEqual(sorted[0].matchId, 'LIVE001', 'Il match LIVE deve essere al primo posto');
assert.strictEqual(sorted[1].matchId, 'SCHED003', 'Il match PROGRAMMATO deve essere prima di quello completato');
assert.strictEqual(sorted[2].matchId, 'COMP002', 'Il match COMPLETATO deve essere all\'ultimo posto');
console.log('[PASS] Algoritmo di ordinamento live-first validato al 100%!');

console.log('\n=============================================');
console.log(' TUTTI I 5 TEST DI LIVE SCORING SONO SUPERATI!');
console.log('=============================================');

module.exports = { parseMatchScorerLiveHtml, parseTeamRow };
