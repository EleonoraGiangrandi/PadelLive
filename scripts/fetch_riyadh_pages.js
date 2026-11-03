const https = require('https');
const fs = require('fs');

https.get('https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-902/1?t=tol', res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    fs.writeFileSync('scripts/riyadh_oop.html', body);
    console.log('Saved riyadh_oop.html, length:', body.length);
  });
});

https.get('https://widget.matchscorerlive.com/screen/resultsbyday/FIP-2026-902/1?t=tol', res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    fs.writeFileSync('scripts/riyadh_results.html', body);
    console.log('Saved riyadh_results.html, length:', body.length);
  });
});
