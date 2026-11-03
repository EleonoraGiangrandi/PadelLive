const https = require('https');

const url = 'https://www.padelfip.com/wp-json/fip/v1/ranking/load-more?limit=10&offset=0&gender=male&category=master&circuit=premierpadel&year=2026&week=45&lang=en';

https.get(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const data = JSON.parse(body);
    console.log('Total returned:', data.length);
    data.slice(0, 10).forEach(p => {
      console.log(`Rank ${p.rank}: ${p.name} ${p.surname || ''} - Points: ${p.points}`);
    });
  });
});
