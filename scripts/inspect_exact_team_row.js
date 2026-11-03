const fs = require('fs');
const oop = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

const match = oop.match(/<tr[^>]*>[\s\S]*?player-names[\s\S]*?<\/tr>/i);
if (match) {
  console.log('=== EXACT ROW FROM RIYADH OOP ===');
  console.log(match[0]);
}
