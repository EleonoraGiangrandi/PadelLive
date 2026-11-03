const https = require('https');

function test(path) {
  const url = 'https://widget.matchscorerlive.com/screen/' + path;
  https.get(url, res => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log(path, 'Status:', res.statusCode, 'Length:', body.length);
      if (body.includes('player-names') || body.includes('set-cell') || body.includes('score')) {
        console.log('   -> Found match data in', path);
      }
    });
  });
}

test('oopbyday/FIP-2026-0201/1?t=tol');
test('resultsbyday/FIP-2026-0201/1?t=tol');
