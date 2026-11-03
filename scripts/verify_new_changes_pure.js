const https = require('https');

async function testFetchStats() {
  const postData = 'matchId=MQ023&year=2026&tournamentId=902&organization=FIP';

  return new Promise((resolve) => {
    const req = https.request('https://widget.matchscorerlive.com/screen/getmatchstats?t=tol', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: body.length, hasStats: body.includes('Total points won') });
      });
    });
    req.write(postData);
    req.end();
  });
}

function getHdImageUrl(url) {
  if (!url) return '';
  return url.replace(/-\d+x\d+(\.(?:jpe?g|png|webp))/i, '$1');
}

async function run() {
  console.log('1. Testing Stats endpoint:');
  const statsRes = await testFetchStats();
  console.log('Stats Result:', statsRes);

  console.log('\n2. Testing HD Image resolution URL:');
  const thumb = 'https://www.padelfip.com/wp-content/uploads/2025/12/Premier-Padel-2026-Master-Visual-30-3-225x300.jpg';
  console.log('Thumbnail: ', thumb);
  console.log('HD Image:  ', getHdImageUrl(thumb));
}

run();
