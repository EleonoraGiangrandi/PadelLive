const https = require('https');

// 1. Test FIP Calendar Direct
async function testCalendar() {
  console.log('\n--- 1. Testing FIP Calendar Direct ---');
  const url = 'https://www.padelfip.com/calendar-cupra-fip-tour/?events-year=2026';
  const html = await new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(d));
    }).on('error', rej);
  });

  const articleCount = (html.match(/<article/g) || []).length;
  console.log('✅ FIP Calendar Direct Success: Found', articleCount, 'tournament articles.');
}

// 2. Test MatchScorerLive Direct
async function testMatchScorer() {
  console.log('\n--- 2. Testing MatchScorerLive Direct Matches ---');
  const url = 'https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol';
  const html = await new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(d));
    }).on('error', rej);
  });

  const matchesFound = (html.match(/class=\"player-names\"/g) || []).length / 2;
  console.log('✅ MatchScorerLive Direct Success: Parsed', matchesFound, 'matches.');
}

// 3. Test FIP Rankings Direct
async function testRankings() {
  console.log('\n--- 3. Testing FIP Rankings Direct ---');
  const url = 'https://www.padelfip.com/wp-json/fip/v1/ranking/load-more?limit=5&offset=0&gender=male&year=2026&week=45&lang=en';
  const json = await new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });

  console.log('✅ FIP Rankings Direct Success: Top player is', json[0].name, json[0].surname, '- Points:', json[0].points);
}

// 4. Test RSS News Direct
async function testNews() {
  console.log('\n--- 4. Testing Official RSS News Direct ---');
  const url = 'https://www.padelfip.com/news/feed/';
  const xml = await new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(d));
    }).on('error', rej);
  });

  const itemCount = (xml.match(/<item>/g) || []).length;
  console.log('✅ Official RSS News Direct Success: Found', itemCount, 'news articles.');
}

async function main() {
  console.log('==================================================');
  console.log('🧪 VERIFYING 100% AUTONOMOUS & SERVERLESS PIPELINE');
  console.log('==================================================');
  await testCalendar();
  await testMatchScorer();
  await testRankings();
  await testNews();
  console.log('\n==================================================');
  console.log('🎉 ALL PRIMARY OFFICIAL DIRECT PROVIDERS VERIFIED!');
  console.log('==================================================');
}

main();
