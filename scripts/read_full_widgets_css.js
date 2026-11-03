async function readFullWidgetsCss() {
  const cRes = await fetch('https://widget.matchscorerlive.com/css/app/crionet-widgets.css');
  const css = await cRes.text();
  console.log(css);
}

readFullWidgetsCss();
