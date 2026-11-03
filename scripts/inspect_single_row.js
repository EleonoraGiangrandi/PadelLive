const fs = require('fs');
const html = fs.readFileSync('scripts/match_stats_sample.html', 'utf8');

const rowStart = html.indexOf('Total points won');
console.log(html.slice(rowStart - 200, rowStart + 350));
