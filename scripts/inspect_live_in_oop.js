const fs = require('fs');
const html = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

// Find all matches of "live"
const regex = /.{0,100}live.{0,100}/gi;
let match;
let count = 0;
while ((match = regex.exec(html)) !== null && count < 15) {
  console.log(`[${count++}] ...${match[0]}...`);
}
