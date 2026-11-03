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
    console.log('Status with correct params:', res.statusCode);
    console.log('Body length:', body.length);
    if (body.length > 0) {
      console.log('Body preview:');
      console.log(body.slice(0, 2000));
    }
  });
});

req.write(postData);
req.end();
