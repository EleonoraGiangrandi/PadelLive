const fs = require('fs');
const html = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

const tableStart = html.indexOf('<table');
const tableEnd = html.indexOf('</table>', tableStart);
console.log('--- FIRST TABLE IN RIYADH OOP ---');
console.log(html.slice(tableStart, tableEnd + 8));
