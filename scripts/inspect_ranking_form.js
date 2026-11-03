const https = require('https');

function get(url) {
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      get(res.headers.location);
      return;
    }
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      const match = body.match(/<script[^>]*src=\"([^\"]*ranking[^\"]*\.js[^\"]*)\"/i);
      console.log('Ranking script src:', match ? match[1] : 'not found');
      // Also look for any select elements in the HTML (filters for circuit, year, week, etc.)
      const selects = [...body.matchAll(/<select[^>]*name=\"([^\"]*)\"[^>]*>([\s\S]*?)<\/select>/gi)];
      for (const sel of selects) {
        console.log('Select name:', sel[1]);
        const options = [...sel[2].matchAll(/<option[^>]*value=\"([^\"]*)\"[^>]*>([\s\S]*?)<\/option>/gi)];
        console.log('  options:', options.map(o => `${o[1]}: ${o[2].trim()}`));
      }
    });
  });
}

get('https://www.padelfip.com/ranking-male/');
