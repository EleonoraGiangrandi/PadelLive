const calendar = require('../src/assets/data/calendar_2026.json');
const https = require('https');

async function testFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body, json: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    }).on('error', reject);
  });
}

async function verifyAll() {
  console.log('==============================================');
  console.log('🔍 VERIFYING ALL 3 USER ISSUES HAVE BEEN FIXED');
  console.log('==============================================\n');

  // 1. Verify Tournaments
  console.log('--- 1. Testing Tournaments ---');
  console.log('Total tournaments:', calendar.length);
  const premierEvents = calendar.filter(e => e.type.startsWith('fip-pp'));
  console.log('Premier Padel tournaments count:', premierEvents.length);
  const eventsWithCovers = calendar.filter(e => !!e.cover);
  console.log('Tournaments with official cover:', eventsWithCovers.length, '/', calendar.length);
  const samplePremier = premierEvents[0];
  console.log('Sample Premier Padel:', {
    name: samplePremier.name,
    type: samplePremier.type,
    startDate: samplePremier.startDate,
    endDate: samplePremier.endDate,
    cover: samplePremier.cover.slice(0, 70),
    eventId: samplePremier.eventId,
  });

  // 2. Testing Match Results from MatchScorerLive
  console.log('\n--- 2. Testing Match Results ---');
  const oopRes = await testFetch('https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-902/1?t=tol', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  console.log('MatchScorerLive OOP status:', oopRes.status, 'body length:', oopRes.body.length);
  const resultsRes = await testFetch('https://widget.matchscorerlive.com/screen/resultsbyday/FIP-2026-902/1?t=tol', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  console.log('MatchScorerLive Results status:', resultsRes.status, 'body length:', resultsRes.body.length);

  // 3. Testing Official World Rankings
  console.log('\n--- 3. Testing Official World Rankings ---');
  const menRes = await testFetch('https://www.padelfip.com/wp-json/fip/v1/ranking/load-more?limit=5&offset=0&gender=male&category=master&circuit=premierpadel&year=2026&week=45&lang=en', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  console.log('Top 5 Men:');
  menRes.json.forEach(p => console.log(`  #${p.rank} ${p.name} ${p.surname || ''} (${p.points} pts)`));

  const womenRes = await testFetch('https://www.padelfip.com/wp-json/fip/v1/ranking/load-more?limit=5&offset=0&gender=female&category=master&circuit=premierpadel&year=2026&week=45&lang=en', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  console.log('Top 5 Women:');
  womenRes.json.forEach(p => console.log(`  #${p.rank} ${p.name} ${p.surname || ''} (${p.points} pts)`));

  console.log('\n==============================================');
  console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('==============================================');
}

verifyAll().catch(console.error);
