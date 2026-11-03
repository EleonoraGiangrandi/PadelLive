const https = require('https');

https.get('https://www.padelfip.com/player/arturo-coello/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    let pos = 0;
    while ((pos = body.indexOf('Place of Birth', pos)) !== -1) {
      console.log('--- At', pos, '---');
      console.log(body.slice(pos - 100, pos + 250));
      pos += 14;
    }
    let cPos = 0;
    while ((cPos = body.indexOf('Gustavo', cPos)) !== -1) {
      console.log('--- Gustavo At', cPos, '---');
      console.log(body.slice(cPos - 100, cPos + 250));
      cPos += 7;
    }
  });
});
