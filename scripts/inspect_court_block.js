const https = require('https');

https.get('https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const idx = d.indexOf('data-id="MQ004"');
    if (idx !== -1) {
      console.log('Header before Team 1:');
      console.log(d.slice(idx - 6200, idx - 4700));
    }
  });
});
