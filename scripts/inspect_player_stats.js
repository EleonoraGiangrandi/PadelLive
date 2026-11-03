const https = require('https');

https.get('https://www.padelfip.com/player/arturo-coello/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    // Search for matches won or matches played
    const matches = [...body.matchAll(/<(?:div|span|p)[^>]*class="[^"]*(?:stat|won|lost|match|played)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/gi)];
    for (const m of matches) {
      console.log(m[0].slice(0, 300));
    }
  });
});
