const fs = require('fs');
const oop = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

const headers = [...oop.matchAll(/<tr class="scorebox-header[^"]*">([\s\S]*?)<\/tr>/gi)].map(m => m[1]);
console.log(`Found ${headers.length} headers.`);
headers.slice(0, 10).forEach((h, i) => {
  console.log(`Header ${i}:`, h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
});
