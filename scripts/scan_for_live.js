async function scanAllCalendarForLive() {
  const fs = require('fs');
  const calendar = JSON.parse(fs.readFileSync('src/assets/data/calendar_2026.json', 'utf8'));

  console.log(`Scanning calendar events... total: ${calendar.length}`);
  let foundUpcoming = 0;
  let foundLive = 0;

  for (let i = 0; i < calendar.length; i++) {
    const ev = calendar[i];
    if (!ev.eventId) continue;
    const cleanId = ev.eventId.replace(/^FIP-\d{4}-/, '');
    const url = `https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-${cleanId}/1?t=tol`;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const html = await res.text();
      if (!html.includes('player-names')) continue;

      const hasLiveHeader = html.includes('scorebox-header-live') || html.includes('In Progress');
      const hasUpcoming = html.includes('scorebox-header') && !html.includes('scorebox-header-completed');
      const summaries = [...html.matchAll(/class="text-uppercase">([^<]+)<\/span>/g)].map(m => m[1].trim());
      const nonCompleted = summaries.filter(s => s.toLowerCase() !== 'completed');

      if (hasLiveHeader || nonCompleted.length > 0) {
        console.log(`[LIVE FOUND!] Event: ${ev.name} (${ev.eventId})`);
        console.log(`  Summaries: ${summaries.join(', ')}`);
        foundLive++;
      } else {
        // Just print progress every 30 events
        if (i % 30 === 0) {
          console.log(`Checked ${i}/${calendar.length}... sample has matches: ${ev.name}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  console.log(`Scan completed. Live found: ${foundLive}, Upcoming found: ${foundUpcoming}`);
}

scanAllCalendarForLive();
