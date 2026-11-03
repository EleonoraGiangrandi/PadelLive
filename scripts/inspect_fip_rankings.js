const https = require('https');

https.get('https://www.padelfip.com/fip-rankings/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Length:', d.length);
    // Find table rows or api/widget embeds
    const iframes = d.match(/<iframe[^>]+>/gi) || [];
    console.log('Iframes:', iframes);
    const scripts = d.match(/<script[^>]+src=[\"'][^\"']+[\"']/gi) || [];
    console.log('Scripts:', scripts.filter(s => s.includes('ranking') || s.includes('widget') || s.includes('table')));
    // Check if table exists
    const tables = d.match(/<table[\s\S]*?<\/table>/gi) || [];
    console.log('Tables found:', tables.length);
    if (tables.length > 0) {
      console.log('Table preview:', tables[0].slice(0, 300));
    }
  });
});
