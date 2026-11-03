const https = require('https');

const url = 'https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const idx = d.indexOf('$(".open").click');
    if (idx !== -1) {
      console.log('Script contents:\n', d.slice(idx, idx + 1000));
    }
    // Also look for match tables or cards in HTML
    const matches = d.match(/<div class=\"match[\s\S]*?<\/div>/gi) || [];
    console.log('Matches div count:', matches.length);
    if (matches.length > 0) {
      console.log('Match sample:', matches[0].slice(0, 500));
    }
  });
});
