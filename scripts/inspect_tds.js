const fs = require('fs');
const oop = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

// Find a couple of <tr> containing player-names and examine all <td> inside them
const trRegex = /<tr[^>]*>([\s\S]*?player-names[\s\S]*?)<\/tr>/gi;
let m;
let count = 0;
while ((m = trRegex.exec(oop)) !== null && count < 3) {
  count++;
  console.log(`\n=== ROW ${count} ===`);
  const tds = [...m[1].matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/gi)];
  tds.forEach((td, i) => {
    console.log(`  TD[${i}] attrs: [${td[1].trim()}] -> text: [${td[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}]`);
  });
}
