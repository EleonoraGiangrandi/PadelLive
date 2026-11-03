const fs = require('fs');
const html = fs.readFileSync('scripts/riyadh_oop.html', 'utf8');

const scoreboxHeaders = [...html.matchAll(/scorebox-header-([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
console.log('Scorebox header variants:', [...new Set(scoreboxHeaders)]);

const summaryStatuses = [...html.matchAll(/class="text-uppercase">([^<]+)<\/span>/g)].map(m => m[1].trim());
console.log('Summary status texts:', [...new Set(summaryStatuses)]);
