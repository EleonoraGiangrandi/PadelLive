const https = require('https');

https.get('https://www.padelfip.com/calendar-cupra-fip-tour/?events-year=2026', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Calendar page length:', d.length);
    // Find tournament cards
    const cards = d.match(/<article[\s\S]*?<\/article>/gi) || [];
    console.log('Article tags count:', cards.length);
    if (cards.length > 0) {
      console.log('Sample article:', cards[0].slice(0, 500));
    } else {
      // search for event containers
      const divs = d.match(/<div class=\"[^\"]*calendar[^\"]*\"[\s\S]*?<\/div>/gi) || [];
      console.log('Calendar divs:', divs.length);
      const rows = d.match(/<div class=\"row[^\"]*\"[\s\S]*?<\/div>/gi) || [];
      console.log('Rows count:', rows.length);
    }
  });
});
