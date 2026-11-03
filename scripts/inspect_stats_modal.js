const fs = require('fs');
const html = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

// Find all occurrences of modalStats or stats or ajax
const matches = [...html.matchAll(/modalStats[\s\S]*?<\/script>/gi)];
console.log('modalStats scripts count:', matches.length);
for (const m of matches) {
  console.log(m[0].slice(0, 1000));
}

// Search for any url in scripts
const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
for (const s of scriptMatches) {
  if (s[1].includes('modalStats') || s[1].includes('data-id') || s[1].includes('stats')) {
    console.log('--- SCRIPT WITH STATS ---');
    console.log(s[1]);
  }
}
