const https = require('https');

const url = 'https://www.padelfip.com/wp-json/fip/v1/player/search?gender=male&category=master&circuit=premierpadel&year=2026&week=45&q=galan&lang=en';

https.get(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Search Status:', res.statusCode);
    const data = JSON.parse(body);
    console.log('Search results count:', data.length);
    if (data.length > 0) {
      console.log('Found:', data[0].name, data[0].surname, 'rank:', data[0].rank);
    }
  });
});
