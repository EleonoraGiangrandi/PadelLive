const https = require('https');

function follow(url) {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
    console.log('URL:', url, 'Status:', res.statusCode, 'Location:', res.headers.location);
    if (res.headers.location) {
      follow(res.headers.location);
      return;
    }
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('Final page length:', d.length);
      const rows = d.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      console.log('Rows count:', rows.length);
      if (rows.length > 1) {
        console.log('Row 1:', rows[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      }
    });
  });
}

follow('https://www.padelfip.com/ranking-fip/');
