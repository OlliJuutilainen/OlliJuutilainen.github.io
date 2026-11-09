// Luinin kuvakkeet: Lisää lukimeen -lisäosan logo eli Latomon kytkimen salmiakki (ulkoreuna ja täytetty sisus)
// ruosteella. Samasta lähteestä syntyvät lisäosan kuvakkeet (luin/lisaosa/kuvakkeet/) ja Luinin sivujen välilehti- ja
// kotivalikkokuvakkeet sekä linkin esikatselukuva (luin/kuvakkeet/: kuvake.svg, 32.png, 180.png, jako.png).
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-kuvakkeet.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const LISAOSA = path.resolve(__dirname, '../lisaosa/kuvakkeet');
const SIVUT = path.resolve(__dirname, '../kuvakkeet');
const RUOSTE = '#8c5426', RUOSTE_TUMMA = '#b8794a', PAPERI = '#faf5ea';   // luin.html:n --ruoste ja --paperi
// Salmiakin keskipiste on (4, 5.5); neliö -1.6 -.1 11.2 11.2 rajaa sen tiiviisti.
const salmiakki = (v, vari) => `<path d="M4 .9L7.2 5.5L4 10.1L.8 5.5Z" fill="none" stroke="${vari}" stroke-width="${v}" stroke-linejoin="miter"/>
  <path d="M4 3.2L5.6 5.5L4 7.8L2.4 5.5Z" fill="${vari}"/>`;
// Pienissä koossa paksumpi reuna, jotta salmiakki ei katoa työkalupalkkiin tai välilehteen.
const reuna = k => k <= 16 ? 1.25 : k <= 32 ? 1.05 : .9;
(async () => {
  fs.mkdirSync(SIVUT, { recursive: true });
  // Välilehden SVG: selain piirtää sen 16 tai 32 pikseliin, joten reuna kuten 16 px:n kuvakkeessa. Tummassa teemassa
  // tumman teeman ruoste (Chrome ja Firefox noudattavat SVG-kuvakkeen prefers-color-schemea).
  fs.writeFileSync(path.join(SIVUT, 'kuvake.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.6 -.1 11.2 11.2">
<style>.r { fill: none; stroke: ${RUOSTE} } .s { fill: ${RUOSTE} }
@media (prefers-color-scheme: dark) { .r { stroke: ${RUOSTE_TUMMA} } .s { fill: ${RUOSTE_TUMMA} } }</style>
<path class="r" d="M4 .9L7.2 5.5L4 10.1L.8 5.5Z" stroke-width="1.25" stroke-linejoin="miter"/>
<path class="s" d="M4 3.2L5.6 5.5L4 7.8L2.4 5.5Z"/>
</svg>
`);
  const b = await chromium.launch();
  const p = await b.newPage();
  const kuva = async (k, viewBox, v, tausta, tiedosto) => {
    await p.setViewportSize({ width: k, height: k });
    await p.setContent(`<html><body style="margin:0;background:${tausta || 'transparent'}"><svg xmlns="http://www.w3.org/2000/svg"
      width="${k}" height="${k}" viewBox="${viewBox}" style="display:block">${salmiakki(v, RUOSTE)}</svg></body></html>`);
    await p.screenshot({ path: tiedosto, omitBackground: !tausta, clip: { x: 0, y: 0, width: k, height: k } });
  };
  for (const k of [16, 32, 48, 96, 128]) await kuva(k, '-1.6 -.1 11.2 11.2', reuna(k), null, path.join(LISAOSA, k + '.png'));
  // Safarin välilehti (ei SVG-kuvakkeita Big Surin Safarissa).
  await kuva(32, '-1.6 -.1 11.2 11.2', reuna(32), null, path.join(SIVUT, '32.png'));
  // Kotivalikko (apple-touch-icon, Androidin pikakuvake): paperitausta, koska iOS täyttää läpinäkyvän mustalla, ja
  // väljä reunus, koska kuvake pyöristetään tai rajataan; salmiakki on noin 60 % korkeudesta.
  await kuva(180, '-3.65 -1.85 15.3 15.3', .9, PAPERI, path.join(SIVUT, '180.png'));
  // Linkin esikatselu (og:image; WhatsApp, Signal ym.): sama kuin kotivalikossa, mutta niin iso, että palvelut kelpuuttavat sen.
  await kuva(600, '-3.65 -1.85 15.3 15.3', .9, PAPERI, path.join(SIVUT, 'jako.png'));
  await b.close();
})();
