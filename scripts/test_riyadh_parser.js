const https = require('https');
const { parseMatchScorerLiveHtml } = require('../src/api/matchScorerLive');

https.get('https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-902/1?t=tol', res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    // Let's test the parser
    console.log('Testing OOP parser on Riyadh:');
    try {
      const matches = parseMatchScorerLiveHtml(body);
      console.log('Parsed matches count:', matches.length);
      if (matches.length > 0) {
        console.log('Sample match:', JSON.stringify(matches[0], null, 2));
      }
    } catch (e) {
      console.error('Error parsing:', e);
    }
  });
});
