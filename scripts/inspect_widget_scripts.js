async function inspectWidgetScripts() {
  const url = 'https://widget.matchscorerlive.com/screen/oopbyday/FIP-2026-902/1?t=tol';
  const res = await fetch(url);
  const html = await res.text();

  // Find all <script src="...">
  const scripts = [...html.matchAll(/<script[^>]*src=["']([^"']+)["']/gi)].map(m => m[1]);
  console.log('Scripts found:', scripts);

  // Also inline scripts
  const inlineScripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  console.log(`Inline scripts count: ${inlineScripts.length}`);
  inlineScripts.forEach((s, i) => {
    console.log(`--- Inline script ${i} (len ${s.length}) ---`);
    console.log(s.slice(0, 300));
  });
}

inspectWidgetScripts();
