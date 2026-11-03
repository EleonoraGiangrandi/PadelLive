const fs = require('fs');
const oop = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

// Test the regex in src/api/matchScorerLive.ts on Riyadh
const trContent = oop.match(/<tr class="scorebox-sep-bottom">[\s\S]*?<\/tr>/i)[0];
const playerBlocks = [...trContent.matchAll(/<div class=\"d-flex align-items-center\">([\s\S]*?)<\/div>\s*<\/div>/gi)];
console.log('playerBlocks count with current regex:', playerBlocks.length);
