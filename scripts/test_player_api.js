const http = require('http');

http.get('http://fredericosilva.net:8081/padely/player?handler=arturo-coello', {
  headers: { 'User-Agent': 'okhttp/4.12.0' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status padely/player:', res.statusCode);
    console.log('Body length:', body.length);
    console.log(body);
  });
});
