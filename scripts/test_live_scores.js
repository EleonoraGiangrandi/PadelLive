const fs = require('fs');

const oopHtml = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');
const resultsHtml = fs.readFileSync('scripts/riyadh_results.html', 'utf8');

console.log('OOP HTML length:', oopHtml.length);
console.log('Results HTML length:', resultsHtml.length);

// Check for live-related tokens
const liveKeywords = ['live', 'point', 'serving', 'ball_green', 'match-live', 'score-live', 'active'];
liveKeywords.forEach(kw => {
  const matchesOop = (oopHtml.match(new RegExp(kw, 'gi')) || []).length;
  console.log(`Keyword "${kw}" in OOP:`, matchesOop);
});
