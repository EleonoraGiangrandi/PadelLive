const https = require('https');

const urls = [
  'https://www.padelfip.com/rankings/',
  'https://www.padelfip.com/fip-rankings/',
  'https://www.padelfip.com/fip-ranking-men/',
  'https://www.padelfip.com/fip-ranking-women/'
];

urls.forEach(url => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    console.log(url, res.statusCode, res.headers.location || '');
  });
});
