const https = require('https');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function parseMatchScorerLiveHtml(html) {
  const matches = [];

  // Match blocks in MatchScorerLive
  // In the page, each court table or match is contained inside tables or cards
  // Let's find each match via <a class="open" data-id="..."> or table
  const buttonRegex = /<a[^>]*class=\"open\"[^>]*data-id=\"([^\"]+)\"[^>]*data-year=\"([^\"]+)\"[^>]*data-tid=\"([^\"]+)\"[^>]*data-org=\"([^\"]+)\"/gi;
  
  // Find all matches in HTML by splitting around match tables
  // Let's inspect the table structure in the HTML
  const tableRegex = /<table[^>]*class=\"[^\"]*table-match[^\"]*\"[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) || [];
  console.log('table-match count:', tables.length);

  return tables.length;
}

async function test() {
  const html = await fetchHtml('https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-0201/1?t=tol');
  console.log('HTML length:', html.length);
  // find class names for tables
  const classes = html.match(/class=\"([^\"]+)\"/g) || [];
  const uniqueClasses = [...new Set(classes)].filter(c => c.includes('table') || c.includes('match') || c.includes('court') || c.includes('player'));
  console.log('Relevant classes found:', uniqueClasses);
}

test();
