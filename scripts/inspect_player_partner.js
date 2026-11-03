const https = require('https');

https.get('https://www.padelfip.com/player/arturo-coello/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    let pIdx = body.indexOf('Agustin Tapia');
    if (pIdx !== -1) {
      console.log('Around Agustin Tapia:');
      console.log(body.slice(pIdx - 150, pIdx + 300));
    }
    // Also look for stats (matches won, played, etc.)
    const statsMatches = body.match(/(\d+)\s*(?:Matches|Won|Lost|Vittorie|Giocate|Efficacia|%)/gi);
    console.log('Stats matches:', statsMatches);
  });
});
