const fs = require('fs');
const html = fs.readFileSync('scripts/match_stats_sample.html', 'utf8');

const rows = [...html.matchAll(/<div class="d-flex w-100 justify-content-between">([\s\S]*?)<\/div>\s*<\/div>/gi)];
for (const r of rows) {
  const labelMatch = r[1].match(/class=\"stats-data-points\">([\s\S]*?)<\/div>/i);
  if (!labelMatch) continue;
  const label = labelMatch[1].replace(/<[^>]+>/g, '').trim();

  const values = [...r[1].matchAll(/class=\"stats-l1-values[^"]*\">([\s\S]*?)<\/div>/gi)];
  const v1 = values[0] ? values[0][1].replace(/<[^>]+>/g, '').trim() : '';
  const v2 = values[1] ? values[1][1].replace(/<[^>]+>/g, '').trim() : '';
  console.log(`[${label}]: T1 = "${v1}", T2 = "${v2}"`);
}
