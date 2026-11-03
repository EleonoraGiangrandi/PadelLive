const fs = require('fs');
const { parseMatchScorerLiveHtml } = require('../src/api/matchScorerLive');

const oop = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');
const results = fs.readFileSync('scripts/riyadh_results.html', 'utf8');

console.log('Testing parseMatchScorerLiveHtml on OOP:');
const oopMatches = parseMatchScorerLiveHtml(oop);
console.log(`Parsed ${oopMatches.length} matches from OOP.`);
if (oopMatches.length > 0) {
  console.log('Sample match 0:', JSON.stringify(oopMatches[0], null, 2));
}

console.log('\nTesting parseMatchScorerLiveHtml on Results:');
const resMatches = parseMatchScorerLiveHtml(results);
console.log(`Parsed ${resMatches.length} matches from Results.`);
if (resMatches.length > 0) {
  console.log('Sample match 0:', JSON.stringify(resMatches[0], null, 2));
}
