const https = require('https');

https.get('https://www.padelfip.com/wp-json/fip/v1/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('FIP WP-JSON Status:', res.statusCode);
    try {
      const json = JSON.parse(d);
      console.log('Endpoints registered in fip/v1:');
      console.log(Object.keys(json.routes || {}));
    } catch(e) {
      console.log(d.slice(0, 300));
    }
  });
});
