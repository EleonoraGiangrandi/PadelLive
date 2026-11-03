const https = require('https');

const url = 'https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('MatchScorerLive Status:', res.statusCode, 'Length:', d.length);
    // Find script tags or API calls
    const scripts = d.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
    console.log('Scripts count:', scripts.length);
    for (const s of scripts) {
      if (s.includes('http') || s.includes('api') || s.includes('data') || s.includes('json') || s.includes('matches')) {
        console.log('Script preview:', s.slice(0, 300));
      }
    }
    // Also check for embedded json
    const jsonMatches = d.match(/\{[\s\S]*\"matchId\"[\s\S]*\}/);
    if (jsonMatches) {
      console.log('Found matchId in page!');
    }
  });
}).on('error', e => console.error(e));
