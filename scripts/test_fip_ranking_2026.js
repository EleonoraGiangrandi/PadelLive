const https = require('https');

const url = 'https://www.padelfip.com/wp-json/fip/v1/ranking/load-more?limit=10&offset=0&gender=male&year=2026&week=45&lang=en';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(d);
      console.log('Is Array?', Array.isArray(json), 'Count:', json.length);
      console.log('Top player:', json[0]);
    } catch(e) {
      console.log('Raw:', d.slice(0, 300));
    }
  });
});
