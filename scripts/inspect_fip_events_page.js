const https = require('https');

https.get('https://www.padelfip.com/events/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Events page length:', d.length);
    // Find event cards or links
    const eventCards = d.match(/class=\"[^\"]*event[^\"]*\"/gi) || [];
    console.log('Event classes:', [...new Set(eventCards)].slice(0, 10));
    const ajaxCalls = d.match(/https?:\/\/[^\s\"']+(?:event|calendar|load)[^\s\"']*/gi) || [];
    console.log('Ajax/Api in events page:', [...new Set(ajaxCalls)].slice(0, 10));
  });
});
