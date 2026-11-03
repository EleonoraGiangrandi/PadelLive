const https = require('https');

const url = 'https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Find lines that mention MQ004 or Court or players
    const lines = d.split('\n');
    const interesting = lines.filter(l => l.includes('MQ00') || l.includes('Achkar') || l.includes('open') || l.includes('data-id'));
    console.log('Interesting lines count:', interesting.length);
    console.log(interesting.slice(0, 15).join('\n'));
  });
});
