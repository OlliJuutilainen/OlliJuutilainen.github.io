// Luinin kuvakkeet: Lukimeen-lisäosan logo eli Latomon kytkimen salmiakki (ulkoreuna ja täytetty sisus)
// ruosteella. Samasta lähteestä syntyvät lisäosan kuvakkeet (luin/lisaosa/kuvakkeet/) ja Luinin sivujen välilehti- ja
// kotivalikkokuvakkeet (luin/kuvakkeet/: kuvake.svg, 32.png, 180.png) sekä Android-kääreen käynnistyskuvake (android/luin/).
// Linkin esikatselukuva jako-logo-tumma-4.png on LUiN.HTML-logo (logo.js) tumman teeman väreillä.
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
  // (käyttäjän linjaus 9.11.2026). Kaikilla sivuilla LUiN.HTML-logo, myös Latomossa (salmiakkineliö oli korttina liian
  // korkea, käyttäjä 9.11.2026). 1200 × 630 eli palveluiden leveän kortin mitta. Logo on 520 px leveä, jotta se säilyy
  // kokonaisena, jos palvelu rajaa kuvasta keskineliön.
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.setContent(`<html><body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;justify-content:center;
    background:${PAPERI_TUMMA};color:${MUSTE_TUMMA};--ruoste:${RUOSTE_TUMMA}">${logo().replace('<svg ', '<svg style="width:520px;height:auto;display:block;fill:currentColor;overflow:visible" ')}</body></html>`);
  await p.screenshot({ path: path.join(SIVUT, 'jako-logo-tumma-4.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await b.close();
  android();
})();

// Android-kääreen (android/luin/) käynnistyskuvake vektorina: sama salmiakki samoissa mittasuhteissa kuin kotivalikon
// 180.png (näkyvä 72 dp:n ruutu vastaa sen 15,3 yksikön viewBoxia, joten koko 108 dp:n kangas on 15,3 · 108 / 72 yksikköä).
// Värit ovat resursseja @color/kuvake_ruoste ja @color/kuvake_paperi, jotka on määritelty vain values/colors.xml:ssä:
// kuvake on vaalealla paperilla myös tummassa järjestelmäteemassa (käyttäjän pyyntö 21.11.2026). Älä vaihda niitä
// @color/paperi-resurssiin, jolla on values-night-vastine. Monokromi (Android 13:n teemakuvake) on sama salmiakki.
function android() {
  const RES = path.resolve(__dirname, '../../android/luin/src/main/res');
  const K = 15.3 * 108 / 72, siirto = n => +(K / 2 - n).toFixed(3);
  const huom = '<!-- Tuottaa luin/kehitys/lisaosa-kuvakkeet.js; älä muokkaa käsin. -->\n';
  fs.writeFileSync(path.join(RES, 'drawable/ic_luin_salmiakki.xml'), `<?xml version="1.0" encoding="utf-8"?>
${huom}<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="${+K.toFixed(3)}"
    android:viewportHeight="${+K.toFixed(3)}">
    <group
        android:translateX="${siirto(4)}"
        android:translateY="${siirto(5.5)}">
        <path
            android:pathData="M4,0.9L7.2,5.5L4,10.1L0.8,5.5Z"
            android:strokeColor="@color/kuvake_ruoste"
            android:strokeLineJoin="miter"
            android:strokeWidth="0.9" />
        <path
            android:fillColor="@color/kuvake_ruoste"
            android:pathData="M4,3.2L5.6,5.5L4,7.8L2.4,5.5Z" />
    </group>
</vector>
`);
  fs.writeFileSync(path.join(RES, 'mipmap-anydpi-v26/ic_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>
${huom}<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/kuvake_paperi" />
    <foreground android:drawable="@drawable/ic_luin_salmiakki" />
    <monochrome android:drawable="@drawable/ic_luin_salmiakki" />
</adaptive-icon>
`);
  // Android 7 (ennen mukautuvia kuvakkeita): paperinen pyöreäkulmainen ruutu, jonka koko vastaa mukautuvan kuvakkeen
  // näkyvää osaa.
  fs.writeFileSync(path.join(RES, 'mipmap/ic_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>
${huom}<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:bottom="18dp"
        android:left="18dp"
        android:right="18dp"
        android:top="18dp">
        <shape android:shape="rectangle">
            <solid android:color="@color/kuvake_paperi" />
            <corners android:radius="12dp" />
        </shape>
    </item>
    <item android:drawable="@drawable/ic_luin_salmiakki" />
</layer-list>
`);
}
