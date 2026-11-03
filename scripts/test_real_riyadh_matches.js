const fs = require('fs');
const assert = require('assert');

// Test with src/api/matchScorerLive logic
const oopHtml = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');
const resultsHtml = fs.readFileSync('scripts/riyadh_results.html', 'utf8');

// Require the compiled or execute the ts function
const { parseMatchScorerLiveHtml } = require('./test_live_scoring_suite');

console.log('Testing Riyadh OOP HTML:');
const oopMatches = parseMatchScorerLiveHtml(oopHtml, 1);
console.log(`Parsed ${oopMatches.length} matches from OOP.`);
assert.strictEqual(oopMatches.length, 23);

console.log('Testing Riyadh Results HTML:');
const resMatches = parseMatchScorerLiveHtml(resultsHtml, 1);
console.log(`Parsed ${resMatches.length} matches from Results.`);
assert.strictEqual(resMatches.length, 23);

console.log('\nSample match verification:');
const m = oopMatches[0];
console.log('Court:', m.courtName);
console.log('Round:', m.roundName);
console.log('Time:', m.startDate);
console.log('MatchId:', m.matchId);
console.log('Team 1:', m.team1.player1.name, '/', m.team1.player2.name);
console.log('Team 2:', m.team2.player1.name, '/', m.team2.player2.name);
console.log('Set 1:', m.team1.set1, '-', m.team2.set1);
console.log('Set 2:', m.team1.set2, '-', m.team2.set2);
console.log('Status:', m.status);

assert(m.matchId.length > 0, 'Match ID should not be empty');
assert(m.courtName.length > 0, 'Court name should not be empty');
assert(m.roundName.length > 0, 'Round name should not be empty');
assert(m.team1.player1.name.length > 0, 'Player 1 name should not be empty');
assert(m.team2.player1.name.length > 0, 'Player 2 name should not be empty');

console.log('\n[PASS] Real-world MatchScorerLive HTML test completely PASSED!');
