const https = require('https');

async function testPlayer(handler) {
  return new Promise((resolve) => {
    https.get(`https://www.padelfip.com/player/${handler}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, res => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        const metaMatch = html.match(/name=\"description\"\s*content=\"([\s\S]*?)\"/i);
        const desc = metaMatch ? metaMatch[1] : '';

        // Extract metadata items
        const pointsMatch = desc.match(/Points:\s*(\d+)/i);
        const rankMatch = desc.match(/Ranking:\s*(\d+)/i);
        const heightMatch = desc.match(/Height:\s*([^;]+)/i);
        const bornInMatch = desc.match(/Place of Birth:\s*([^;]+)/i);
        const dobMatch = desc.match(/Birth Date:\s*([^;]+)/i);
        const posMatch = desc.match(/Playing Position:\s*([^;]+)/i);

        // Coaches
        const coachMatches = [...html.matchAll(/class=\"overview__text\">([\s\S]*?)<\/p>/gi)]
          .map(c => c[1].replace(/<[^>]+>/g, '').trim())
          .filter(c => c.length > 0 && !c.includes('<'));
        const coach = coachMatches.join(', ');

        // Partner
        const partnerMatch = html.match(/<a[^>]*href=\"https:\/\/www\.padelfip\.com\/player\/([^/"]+)\/\"[^>]*title=\"([^"]+)\"/i);
        const partnerImgMatch = html.match(/<img[^>]*class=\"paired__img\"[^>]*src=\"([^"]+)\"/i);

        // Effectiveness
        const effMatch = html.match(/class=\"stats__bar\"[^>]*style=\"width:([\d.]+%)\"/i);

        resolve({
          handler,
          rank: rankMatch ? parseInt(rankMatch[1], 10) : undefined,
          points: pointsMatch ? parseInt(pointsMatch[1], 10) : undefined,
          height: heightMatch ? heightMatch[1].trim() : undefined,
          bornIn: bornInMatch ? bornInMatch[1].trim() : undefined,
          dob: dobMatch ? dobMatch[1].trim() : undefined,
          playingPosition: posMatch ? posMatch[1].trim() : undefined,
          coach: coach || undefined,
          partner: partnerMatch ? {
            handler: partnerMatch[1],
            name: partnerMatch[2],
            imageUrl: partnerImgMatch ? partnerImgMatch[1] : undefined,
          } : undefined,
          effectiveness: effMatch ? effMatch[1] : undefined,
        });
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const p1 = await testPlayer('arturo-coello');
  console.log('Arturo Coello:', p1);
  const p2 = await testPlayer('agustin-tapia');
  console.log('Agustin Tapia:', p2);
  const p3 = await testPlayer('gemma-triay');
  console.log('Gemma Triay:', p3);
}

run();
