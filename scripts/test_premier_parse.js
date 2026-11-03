const https = require('https');

function get(url) {
  https.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  }, res => {
    let html = '';
    res.on('data', c => html += c);
    res.on('end', () => {
      console.log('HTML length:', html.length);
      const articleRegex = /<article[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/article>/gi;
      let match;
      let count = 0;
      while ((match = articleRegex.exec(html)) !== null) {
        count++;
        const classAttr = match[1] || '';
        const content = match[2] || '';
        
        // Categoria Torneo
        const type = classAttr.trim().replace(/^article\s*/, '') || 'fip-tour';

        // Titolo e Link
        const titleMatch = content.match(/<div class="event-title">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        const name = titleMatch ? titleMatch[2].replace(/<[^>]+>/g, '').trim() : 'NO TITLE';
        const href = titleMatch ? titleMatch[1] : 'NO HREF';

        // Date
        const dateMatch = content.match(/From\s+(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/i);
        const startDate = dateMatch ? dateMatch[1] : 'NO START';
        const endDate = dateMatch ? dateMatch[2] : 'NO END';

        // Immagine
        const imgMatch = content.match(/<img[^>]*class="cover-category-event"[^>]*src="([^"]+)"/i);
        const cover = imgMatch ? imgMatch[1] : 'NO COVER';

        // Location
        const locMatch = content.match(/<div class="event-location">([\s\S]*?)<\/div>/i);
        const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : 'NO LOC';

        console.log({ count, name, type, startDate, endDate, cover: cover.slice(0, 50), location });
      }
      console.log('Total parsed:', count);
    });
  });
}

get('https://www.padelfip.com/calendar-premier-padel/?events-year=2026');
