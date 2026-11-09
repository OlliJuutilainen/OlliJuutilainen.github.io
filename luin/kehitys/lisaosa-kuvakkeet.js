// Luinin kuvakkeet: Lisää lukimeen -lisäosan logo eli Latomon kytkimen salmiakki (ulkoreuna ja täytetty sisus)
// ruosteella. Samasta lähteestä syntyvät lisäosan kuvakkeet (luin/lisaosa/kuvakkeet/) ja Luinin sivujen välilehti- ja
// kotivalikkokuvakkeet (luin/kuvakkeet/: kuvake.svg, 32.png, 180.png).
// Linkin esikatselukuvat ovat tumman teeman väreillä: jako-salmiakki-tumma.png (Latomo) ja LUiN.HTML-logo (logo.js)
// jako-logo-tumma.png (muut sivut).
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-kuvakkeet.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const logo = require('./logo.js');
const LISAOSA = path.resolve(__dirname, '../lisaosa/kuvakkeet');
const SIVUT = path.resolve(__dirname, '../kuvakkeet');
const RUOSTE = '#8c5426', RUOSTE_TUMMA = '#b8794a', PAPERI = '#faf5ea', MUSTE = '#231c14';   // luin.html:n värit
const PAPERI_TUMMA = '#120e0b', MUSTE_TUMMA = '#ebdfca';                                      // ja tumman teeman
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
  const kuva = async (k, viewBox, v, tausta, tiedosto, vari = RUOSTE) => {
    await p.setViewportSize({ width: k, height: k });
    await p.setContent(`<html><body style="margin:0;background:${tausta || 'transparent'}"><svg xmlns="http://www.w3.org/2000/svg"
      width="${k}" height="${k}" viewBox="${viewBox}" style="display:block">${salmiakki(v, vari)}</svg></body></html>`);
    await p.screenshot({ path: tiedosto, omitBackground: !tausta, clip: { x: 0, y: 0, width: k, height: k } });
  };
  for (const k of [16, 32, 48, 96, 128]) await kuva(k, '-1.6 -.1 11.2 11.2', reuna(k), null, path.join(LISAOSA, k + '.png'));
  // Safarin välilehti (ei SVG-kuvakkeita Big Surin Safarissa).
  await kuva(32, '-1.6 -.1 11.2 11.2', reuna(32), null, path.join(SIVUT, '32.png'));
  // Kotivalikko (apple-touch-icon, Androidin pikakuvake): paperitausta, koska iOS täyttää läpinäkyvän mustalla, ja
  // väljä reunus, koska kuvake pyöristetään tai rajataan; salmiakki on noin 60 % korkeudesta.
  await kuva(180, '-3.65 -1.85 15.3 15.3', .9, PAPERI, path.join(SIVUT, '180.png'));
  // Linkin esikatselu (og:image; WhatsApp, Signal ym.) tumman teeman väreillä, koska viestimet ovat useimmiten tummia
  // (käyttäjän linjaus 9.11.2026). Latomo: salmiakki neliönä (käyttäjän pyyntö), sommitelma kuin kotivalikossa.
  await kuva(600, '-3.65 -1.85 15.3 15.3', .9, PAPERI_TUMMA, path.join(SIVUT, 'jako-salmiakki-tumma.png'), RUOSTE_TUMMA);
  // Muut sivut: LUiN.HTML-logo, 1200 × 630 eli palveluiden leveän kortin mitta. Logo on 520 px leveä, jotta se säilyy
  // kokonaisena, jos palvelu rajaa kuvasta keskineliön.
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.setContent(`<html><body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;justify-content:center;
    background:${PAPERI_TUMMA};color:${MUSTE_TUMMA};--ruoste:${RUOSTE_TUMMA}">${logo().replace('<svg ', '<svg style="width:520px;height:auto;display:block;fill:currentColor;overflow:visible" ')}</body></html>`);
  await p.screenshot({ path: path.join(SIVUT, 'jako-logo-tumma.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await b.close();
})();
