const https = require('https');

https.get('https://www.padelfip.com/events/fip-bronze-melbourne-padel-open-2026/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Event page length:', body.length);
    // Find any matchscorer or iframe or script
    const iframes = body.match(/<iframe[^>]*src="[^"]*matchscorer[^"]*"[^>]*>/gi);
    console.log('Iframes:', iframes);
    const links = body.match(/href="[^"]*matchscorer[^"]*"/gi);
    console.log('Links:', links);
    const scripts = body.match(/https?:\/\/[^"'\s]*matchscorer[^"'\s]*/gi);
    console.log('MatchScorer occurrences:', [...new Set(scripts)]);
  });
});
