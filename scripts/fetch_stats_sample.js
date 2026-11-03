const fs = require('fs');
const https = require('https');

const postData = 'matchId=MQ023&year=2026&tournamentId=902&organization=FIP';

const req = https.request('https://widget.matchscorerlive.com/screen/getmatchstats?t=tol', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    fs.writeFileSync('scripts/match_stats_sample.html', body);
    console.log('Saved match_stats_sample.html');
  });
});

req.write(postData);
req.end();
