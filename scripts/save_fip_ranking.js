const https = require('https');
const fs = require('fs');

https.get('https://www.padelfip.com/wp-content/themes/padelfiptheme-v2026-10-14/assets/js/ranking.js?ver=1793179032', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    fs.writeFileSync('scripts/ranking_fip.js', body);
    console.log('Saved ranking_fip.js, length:', body.length);
  });
});
