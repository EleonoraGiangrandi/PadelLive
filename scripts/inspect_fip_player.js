const https = require('https');

https.get('https://www.padelfip.com/player/arturo-coello/', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status FIP player page:', res.statusCode);
    console.log('Body length:', body.length);
    // Find playingPosition, height, bornIn, coach, partner
    const texts = body.match(/Right|Left|Valladolid|Gustavo|Agustin Tapia|Playing Position|Coach|Height|Born in/gi);
    console.log('Matched keywords:', texts);
    // Print snippet around Playing Position
    const posIdx = body.indexOf('Playing Position');
    if (posIdx !== -1) {
      console.log('Around Playing Position:');
      console.log(body.slice(posIdx - 100, posIdx + 300));
    }
  });
});
