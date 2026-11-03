const fs = require('fs');
const html = fs.readFileSync('scripts/match_stats_sample.html', 'utf8');

// Print tab contents
const tabPanes = [...html.matchAll(/<div[^>]*class="[^"]*tab-pane[^"]*"[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*tab-pane|$)/gi)];
console.log('Tab panes found:', tabPanes.length);
for (const tp of tabPanes) {
  console.log('=== Tab pane ID:', tp[1], '===');
  // Find all stat rows
  const rows = [...tp[2].matchAll(/<div class="row[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi)];
  // Let's print the first 500 chars of this tab pane
  console.log(tp[2].slice(0, 1000));
}
