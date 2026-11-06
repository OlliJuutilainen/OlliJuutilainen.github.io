// Lisää lukimeen -lisäosan kuvakkeet: Latomon kytkimen salmiakki (ulkoreuna ja täytetty sisus) ruosteella.
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-kuvakkeet.js
const path = require('path');
const { chromium } = require('playwright');
const KANSIO = path.resolve(__dirname, '../lisaosa/kuvakkeet');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const k of [16, 32, 48, 96, 128]) {
    // Pienissä koossa paksumpi reuna, jotta salmiakki ei katoa työkalupalkkiin.
    const v = k <= 16 ? 1.25 : k <= 32 ? 1.05 : .9;
    await p.setViewportSize({ width: k, height: k });
    await p.setContent(`<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="${k}" height="${k}"
      viewBox="-1.6 -.1 11.2 11.2"><path d="M4 .9L7.2 5.5L4 10.1L.8 5.5Z" fill="none" stroke="#8c5426" stroke-width="${v}" stroke-linejoin="miter"/>
      <path d="M4 3.2L5.6 5.5L4 7.8L2.4 5.5Z" fill="#8c5426"/></svg></body></html>`);
    await p.screenshot({ path: path.join(KANSIO, k + '.png'), omitBackground: true, clip: { x: 0, y: 0, width: k, height: k } });
  }
  await b.close();
})();
