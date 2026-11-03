const https = require('https');

https.get('https://www.padelfip.com/fip-rankings/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const match = d.match(/var\s+FipRanking\s*=\s*({[\s\S]*?});/);
    if (match) {
      console.log('FipRanking:', match[1]);
    } else {
      const match2 = d.match(/FipRanking\s*=\s*({[\s\S]*?});/);
      if (match2) console.log('FipRanking 2:', match2[1]);
      else console.log('Not found directly, searching substring...');
      const idx = d.indexOf('rankingApi');
      if (idx !== -1) {
        console.log('Context around rankingApi:', d.slice(idx - 100, idx + 300));
      }
    }
  });
});
