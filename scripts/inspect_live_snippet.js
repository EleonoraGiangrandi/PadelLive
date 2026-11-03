const fs = require('fs');
const html = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

const idx = html.indexOf('live-status-summary');
if (idx !== -1) {
  console.log(html.substring(idx - 200, idx + 1200));
}
