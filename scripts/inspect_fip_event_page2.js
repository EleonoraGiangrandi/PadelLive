const https = require('https');

https.get('https://www.padelfip.com/events/fip-bronze-melbourne-padel-open-2026/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    let pos = 0;
    while ((pos = body.indexOf('0201', pos)) !== -1) {
      console.log('--- At', pos, '---');
      console.log(body.slice(pos - 100, pos + 150));
      pos += 4;
    }
    // Also look for oopbyday or widget
    let wPos = 0;
    while ((wPos = body.indexOf('oopbyday', wPos)) !== -1) {
      console.log('--- oopbyday At', wPos, '---');
      console.log(body.slice(wPos - 100, wPos + 150));
      wPos += 8;
    }
  });
});
