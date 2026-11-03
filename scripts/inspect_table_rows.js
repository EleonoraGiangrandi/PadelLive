const https = require('https');

https.get('https://www.padelfip.com/fip-rankings/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const rows = d.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    console.log('Total rows:', rows.length);
    for (let i = 1; i < Math.min(5, rows.length); i++) {
      console.log(`Row ${i}:`, rows[i].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
  });
});
