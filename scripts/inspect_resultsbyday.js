const https = require('https');

https.get('https://widget.matchscorerlive.com/screen/resultsbyday/FIP-2026-0201/1?t=tol', res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log(body.slice(0, 2000));
  });
});
