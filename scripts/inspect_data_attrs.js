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
      const matches = body.match(/data-(?:circuit|category|year|week-no|gender)="[^"]*"/gi);
      console.log('Attributes found:', matches);
      
      const btns = body.match(/<(?:button|div|a)[^>]*class="[^"]*load__more[^"]*"[^>]*>/gi);
      console.log('Buttons:', btns);
    });
  });
}

get('https://www.padelfip.com/ranking-male/');
