const https = require('https');

https.get('https://widget.matchscorerlive.com/js/lib/ybq/ybq-core.min.js', res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log(body);
  });
});
