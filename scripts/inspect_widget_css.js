async function inspectWidgetCss() {
  const url = 'https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-902/1?t=tol';
  const res = await fetch(url);
  const html = await res.text();

  const links = [...html.matchAll(/<link[^>]*href=["']([^"']+\.css[^"']*)["']/gi)].map(m => m[1]);
  console.log('CSS links:', links);

  for (const link of links) {
    const fullUrl = link.startsWith('http') ? link : `https://widget.matchscorerlive.com${link}`;
    try {
      const cRes = await fetch(fullUrl);
      const css = await cRes.text();
      console.log(`\n=== CSS from ${link} (length: ${css.length}) ===`);
      // Find rules with scorebox, live, point, ball, serving, winner
      const matches = css.match(/[^{}]+{(?:[^{}]*?(?:live|scorebox|point|ball|serving|winner|status)[^{}]*?)}/gi) || [];
      console.log(`Found ${matches.length} relevant rules.`);
      matches.slice(0, 30).forEach(m => console.log(m.replace(/\s+/g, ' ').slice(0, 150)));
    } catch (e) {
      console.error(e);
    }
  }
}

inspectWidgetCss();
