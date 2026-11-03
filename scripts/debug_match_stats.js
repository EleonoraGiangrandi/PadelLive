const https = require('https');

const postData = 'id=MQ023&tid=902&year=2026&org=FIP&culture=en-US';

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
    console.log('Status:', res.statusCode);
    console.log('Body length:', body.length);
    console.log('Body snippet:');
    console.log(body.slice(0, 1500));
  });
});

req.write(postData);
req.end();
