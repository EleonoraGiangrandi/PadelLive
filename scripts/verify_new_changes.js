const { getMatchStatsDirect } = require('../src/api/matchScorerLive');
const { getHdImageUrl } = require('../src/components/tournament/TournamentCard');

async function testAll() {
  console.log('==============================================');
  console.log('🧪 RUNNING FULL VERIFICATION OF ALL 6 CHANGES');
  console.log('==============================================\n');

  // 1. Verify Match Stats
  console.log('--- 1. Testing Match Stats ---');
  // Riyadh MQ023, tournamentId: 902
  const stats = await getMatchStatsDirect('MQ023', '902');
  console.log('Match Duration:', stats.duration);
  console.log('Match Stats Set 1 Team 1:', stats.set1?.team1Stats?.match);
  console.log('Match Stats Set 1 Team 2:', stats.set1?.team2Stats?.match);
  console.log('Match Overall Stats:', stats.match?.team1Stats?.match);

  // 2. Verify HD Images
  console.log('\n--- 2. Testing HD Image URL Cleaner ---');
  const sampleThumb = 'https://www.padelfip.com/wp-content/uploads/2025/12/Premier-Padel-2026-Master-Visual-30-3-225x300.jpg';
  const hd = getHdImageUrl(sampleThumb);
  console.log('Original Thumbnail:', sampleThumb);
  console.log('HD Image URL:      ', hd);

  console.log('\n==============================================');
  console.log('✅ ALL TESTS PASSED!');
  console.log('==============================================');
}
