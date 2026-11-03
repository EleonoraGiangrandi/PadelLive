const https = require('https');

const url = 'https://www.padelfip.com/wp-json/fip/v1/ranking/load-more?limit=10&offset=0&gender=M&circuit=fip&lang=en';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(d);
      console.log('Keys:', Object.keys(json));
      if (json.players || Array.isArray(json)) {
        const players = json.players || json;
        console.log('Players count:', players.length);
        console.log('Top player:', players[0]);
      } else {
        console.log('Response sample:', d.slice(0, 300));
      }
    } catch (e) {
      console.log('Raw:', d.slice(0, 300));
    }
  });
});
