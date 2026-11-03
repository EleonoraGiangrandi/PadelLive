const https = require('https');

https.get('https://www.padelfip.com/fip-rankings/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const yearSelect = d.match(/<select[^>]*name=[\"']year[\"'][\s\S]*?<\/select>/i);
    if (yearSelect) console.log('Year select:', yearSelect[0].slice(0, 300));
    const weekSelect = d.match(/<select[^>]*name=[\"']week[\"'][\s\S]*?<\/select>/i);
    if (weekSelect) console.log('Week select:', weekSelect[0].slice(0, 300));
    const dataAttrs = d.match(/data-[a-zA-Z0-9_\-]+=\"[^\"]*\"/g);
    console.log('Sample data attrs:', (dataAttrs || []).filter(a => a.includes('year') || a.includes('week') || a.includes('gender') || a.includes('ranking')).slice(0, 10));
  });
});
