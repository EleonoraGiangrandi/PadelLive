const https = require('https');

const url = 'https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const idx = d.indexOf('data-id="MQ004"');
    if (idx !== -1) {
      console.log('Block around MQ004:');
      console.log(d.slice(idx - 600, idx + 800));
    }
  });
});
