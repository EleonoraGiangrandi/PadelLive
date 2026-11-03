const https = require('https');

https.get('https://www.padelfip.com/wp-content/themes/padelfiptheme-v2026-10-14/assets/js/ranking.js', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const idx = d.indexOf('ENDPOINTS.RANKING');
    console.log(d.slice(idx, idx + 1000));
  });
});
