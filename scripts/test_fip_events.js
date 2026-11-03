const https = require('https');

https.get('https://www.padelfip.com/wp-json/wp/v2/events?per_page=2', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const json = JSON.parse(d);
    console.log('Event keys:', Object.keys(json[0]));
    console.log('Event sample:', JSON.stringify(json[0], null, 2));
  });
});
