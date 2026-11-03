const https = require('https');

https.get('https://www.padelfip.com/calendar-cupra-fip-tour/?events-year=2026', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const cards = d.match(/<article[\s\S]*?<\/article>/gi) || [];
    if (cards.length > 0) {
      console.log('Sample full article:\n', cards[0]);
    }
  });
});
