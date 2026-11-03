async function findLiveTournaments() {
  const currentYear = new Date().getFullYear();
  console.log(`Checking MatchScorerLive for ${currentYear} tournaments...`);

  // Let's check a few event IDs from our calendarData
  const fs = require('fs');
  const calendar = JSON.parse(fs.readFileSync('src/assets/data/calendar_2026.json', 'utf8'));
  console.log(`Loaded ${calendar.length} events from calendar.`);

  // Let's find events that are close to today (Nov 2026 or 2025/2026)
  const now = new Date();
  console.log('Current date:', now.toISOString());

  // Filter events by month or around now
  const upcomingOrRecent = calendar.filter(ev => {
    return ev.eventId;
  });

  console.log(`Found ${upcomingOrRecent.length} events with eventId.`);

  // Test 10 events around the calendar to see if any have active OOP or results
  for (let i = 0; i < Math.min(upcomingOrRecent.length, 25); i++) {
    const ev = upcomingOrRecent[i];
    const cleanId = ev.eventId.replace(/^FIP-\d{4}-/, '');
    const url = `https://widget.matchscorerlive.com/screen/oopbyday/FIP-${currentYear}-${cleanId}/1?t=tol`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const text = await res.text();
      const hasMatches = text.includes('player-names');
      const isLive = text.includes('scorebox-header-live') || text.includes('live-point') || text.includes('LIVE') || text.includes('ball_green.png');
      if (hasMatches) {
        console.log(`Event [${ev.name}] (${ev.eventId}) has matches! Live indicators: ${isLive}`);
      }
    } catch (e) {
      // ignore
    }
  }
}

findLiveTournaments();
