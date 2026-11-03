const https = require('https');

https.get('https://www.padelfip.com/wp-json/wp/v2/types', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(d);
      console.log('Custom post types in FIP WordPress:', Object.keys(json));
    } catch(e) {
      console.log(d.slice(0, 200));
    }
  });
});
