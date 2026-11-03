const https = require('https');

https.get('https://www.padelfip.com/wp-json/wp/v2/events?per_page=3', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(d);
      console.log('Count:', json.length);
      if (json[0]) {
        console.log('Sample event keys:', Object.keys(json[0]));
        console.log('Sample title:', json[0].title);
        console.log('ACF/meta:', Object.keys(json[0].acf || {}));
      }
    } catch(e) {
      console.log(d.slice(0, 200));
    }
  });
});
