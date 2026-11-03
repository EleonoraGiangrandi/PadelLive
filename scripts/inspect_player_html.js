const https = require('https');

https.get('https://www.padelfip.com/player/arturo-coello/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    // Look for player info elements
    const matches = [...body.matchAll(/<(?:div|span|p|li)[^>]*class="[^"]*(?:player|personal|info|bio|partner|stat)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p|li)>/gi)];
    for (const m of matches) {
      const text = m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.includes('Height') || text.includes('Birth') || text.includes('Coach') || text.includes('Partner') || text.includes('Position')) {
        console.log('--- FOUND ELEMENT ---');
        console.log(m[0]);
      }
    }
  });
});
