const https = require('https');
const querystring = require('querystring');

const postData = querystring.stringify({
  matchId: 'MQ004',
  year: '2026',
  tournamentId: '0201',
  organization: 'FIP'
});

const options = {
  hostname: 'widget.matchscorerlive.com',
  path: '/screen/getmatchstats?t=tol',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log(d);
  });
});

req.write(postData);
req.end();
