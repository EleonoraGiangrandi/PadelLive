const https = require('https');

function get(url) {
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      get(res.headers.location);
      return;
    }
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('Status 200, length:', body.length);
      const allScripts = [...body.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
      for (const s of allScripts) {
        if (s[1].includes('ranking') && (s[1].includes('ajax') || s[1].includes('load-more') || s[1].includes('fip'))) {
          console.log('--- FOUND RELEVANT SCRIPT ---');
          console.log(s[1]);
        }
      }
    });
  });
}

get('https://www.padelfip.com/ranking-male/');
