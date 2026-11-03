const fs = require('fs');
const html = fs.readFileSync('scripts/match_stats_sample.html', 'utf8');

const blocks = html.split('<div class="d-flex w-100 justify-content-between">').slice(1);
for (const b of blocks.slice(0, 5)) {
  const labelMatch = b.match(/class=\"stats-data-points\">([\s\S]*?)<\/div>/i);
  if (!labelMatch) continue;
  const label = labelMatch[1].replace(/<[^>]+>/g, '').trim();

  const valMatches = [...b.matchAll(/<div class=\"stats-l1-values[^>]*>([\s\S]*?)<\/div>/gi)];
  const v1 = valMatches[0] ? valMatches[0][1].replace(/<[^>]+>/g, '').trim() : '';
  const v2 = valMatches[1] ? valMatches[1][1].replace(/<[^>]+>/g, '').trim() : '';
  console.log(`[${label}]: T1 = "${v1}", T2 = "${v2}"`);
}
