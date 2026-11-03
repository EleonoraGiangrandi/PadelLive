async function inspectOtherEvents() {
  const events = [
    { name: 'GIJON P2', id: '0905', day: 1 },
    { name: 'MARSEILLE', id: '0601', day: 1 },
    { name: 'CAEN', id: '0401', day: 1 },
    { name: 'MELBOURNE', id: '0201', day: 1 },
  ];

  for (const ev of events) {
    const url = `https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-${ev.id}/${ev.day}?t=tol`;
    console.log(`\nFetching ${ev.name}: ${url}`);
    try {
      const res = await fetch(url);
      const html = await res.text();
      console.log(`Length: ${html.length}`);
      const headers = [...html.matchAll(/scorebox-header-([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
      console.log(`Scorebox header classes:`, [...new Set(headers)]);
      const summaries = [...html.matchAll(/class="text-uppercase">([^<]+)<\/span>/g)].map(m => m[1].trim());
      console.log(`Summary statuses:`, [...new Set(summaries)]);
      const livePoints = [...html.matchAll(/class="[^"]*live-point[^"]*">([^<]+)<\/td>/g)].map(m => m[1].trim());
      console.log(`Live points:`, livePoints);
      const balls = (html.match(/ball_green\.png/g) || []).length;
      console.log(`Ball green images:`, balls);
    } catch (e) {
      console.error(e);
    }
  }
}

inspectOtherEvents();
