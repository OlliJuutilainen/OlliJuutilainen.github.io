// Tusinasään kuvake (käyttäjän linjaukset 17.11.2026): musta kiekko, paksu kehä, sen ulkopuolella kellotaulun
// paikoilla 12 ulospäin osoittavaa kolmiota irti kehästä, ja kehän sisällä babylonialainen luku 12 nuolenpääkirjoituksella:
// kulmakiila (10) ja kaksi pystykiilaa (1 + 1). Kulmakiila täyttää kehän sisäympyrän vasemman puolikkaan (kärki ja
// selän kulmat ympyrällä, selkä keskilinjan tuntumassa); pystykiilat ovat huomattavasti pienemmät oikean puolikkaan
// keskellä, jolloin keskilinjan eri puolille syntyy päivän ja yön vaikutelma (käyttäjän ajatus).
// Sama muoto kaikkialla (välilehti, kotivalikko, linkin esikatselu, Android); vain rajaus vaihtelee.
//
// Tuottaa:
//   icons/tusinasaa.svg, -32.png         välilehden kuvake (32 px PNG Big Surin Safarille)
//   icons/tusinasaa-180.png              apple-touch-icon (iOS täyttää läpinäkyvän mustalla, joten musta neliö)
//   icons/tusinasaa-192.png, -512.png    manifest.webmanifest, any
//   icons/tusinasaa-maskable-512.png     manifest, maskable: kolmioiden kärjet maskin turva-alueen (säde 40 %) sisällä
//   icons/tusinasaa-jako-N.png           linkin esikatselu (og:image; WhatsApp, Signal ym.), 600 × 600. Kun kuva muuttuu,
//                                        nosta JAKO-numeroa ja päivitä og:image tusinapaja.html:ssä ja index.html:ssä:
//                                        viestimet pitävät vanhan osoitteen kuvan välimuistissa.
//   android/app/src/main/res/…           käynnistyskuvake: adaptiivinen (Android 8+), monokromi (13+ teemakuvake) ja
//                                        Android 7:lle pyöreä layer-list
//
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node android/scripts/tusinasaa-kuvake.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const IKONIT = path.join(JUURI, 'icons');
const RES = path.join(JUURI, 'android/app/src/main/res');
const JAKO = 2;

// tusinapaja.html:n tumman teeman --color-bg ja --color-text.
const POHJA = '#000000', MUSTE = '#e8e8e8';

// Kangas 32 × 32, keskipiste 16: 32 px:n välilehdessä yksikkö on pikseli.
const C = 16;
const R = 8.1, KEHA = 2.2;                       // kehän säde viivan keskeltä ja viivan paksuus
const RAKO = 1, KOLMIO_K = 5, KOLMIO_L = 4;      // kehästä kolmion kantaan, kolmion korkeus ja kanta
const VALI = .75;                                // kehän sisäreunasta merkkeihin
const U = R - KEHA / 2 - VALI;                   // merkkien ympyrä
// Kulmakiila: kärki vasemmalla ympyrällä, selkä x = SELKA (kulmat ympyrällä), lovi LOVI selästä sisään.
const SELKA = -.4, LOVI = 1.5;
// Pystykiilat: keskikohdat, koko korkeus, pään leveys ja korkeus, varren leveys (pyöreä pää). Pystysuunnassa keskellä.
const PYST = [2, 4], PYST_K = 4.6, PAA = 1.7, PAA_K = 1.4, VARSI = .8;
const KARKI = R + KEHA / 2 + RAKO + KOLMIO_K;    // kolmioiden kärkien säde (15,2)

const n = x => +x.toFixed(3);
const ymp = x => Math.sqrt(Math.max(0, U * U - x * x));   // merkkiympyrän puolikorkeus kohdassa x

function kolmiot() {
  const kanta = R + KEHA / 2 + RAKO;
  let d = '';
  for (let t = 0; t < 12; t++) {
    const a = t * Math.PI / 6;                 // 0 = klo 12
    const ux = Math.sin(a), uy = -Math.cos(a); // ulos
    const vx = Math.cos(a), vy = Math.sin(a);  // tangentti
    const p = (r, s) => `${n(C + ux * r + vx * s)},${n(C + uy * r + vy * s)}`;
    d += `M${p(kanta + KOLMIO_K, 0)}L${p(kanta, KOLMIO_L / 2)}L${p(kanta, -KOLMIO_L / 2)}Z`;
  }
  return d;
}

function kiilat() {
  const sy = ymp(SELKA);
  let d = `M${n(C - U)},${C}L${n(C + SELKA)},${n(C - sy)}L${n(C + SELKA - LOVI)},${C}L${n(C + SELKA)},${n(C + sy)}Z`;
  for (const x of PYST) {
    const w = PAA / 2, v = VARSI / 2, yla = -PYST_K / 2, kaula = yla + PAA_K, ala = yla + PYST_K - v;
    d += `M${n(C + x - w)},${n(C + yla)}H${n(C + x + w)}L${n(C + x + v)},${n(C + kaula)}V${n(C + ala)}` +
      `A${v},${v} 0 0 1 ${n(C + x - v)},${n(C + ala)}V${n(C + kaula)}Z`;
  }
  return d;
}

const KEHA_D = `M${C},${n(C - R)}A${R},${R} 0 1 1 ${C},${n(C + R)}A${R},${R} 0 1 1 ${C},${n(C - R)}Z`;
const TAYTE = kolmiot() + kiilat();

// tausta: 'kiekko' (välilehti) tai 'nelio' (koko viewBox; kotivalikko, manifest, esikatselu)
function svg({ viewBox = '0 0 32 32', tausta = 'kiekko' } = {}) {
  const [x, y, w] = viewBox.split(' ').map(Number);
  const t = tausta === 'kiekko' ? `<circle cx="${C}" cy="${C}" r="16" fill="${POHJA}"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${POHJA}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${t}
<path fill="none" stroke="${MUSTE}" stroke-width="${KEHA}" d="${KEHA_D}"/>
<path fill="${MUSTE}" d="${TAYTE}"/>
</svg>
`;
}

const ruutu = puoli => `${n(C - puoli)} ${n(C - puoli)} ${n(2 * puoli)} ${n(2 * puoli)}`;
const KOTI = ruutu(18);                    // kärjet 15,2 / 18 = 84 % puolikkaasta; iOS pyöristää kulmat
const MASKI = ruutu(KARKI / .8);           // kärjet tasan turva-alueen reunalla (säde 40 % leveydestä)
const ESIKATSELU = ruutu(22);

async function png(sivu, sisalto, koko, tiedosto) {
  await sivu.setViewportSize({ width: koko, height: koko });
  await sivu.setContent(`<html><body style="margin:0">${sisalto.replace('<svg ', `<svg width="${koko}" height="${koko}" style="display:block" `)}</body></html>`);
  await sivu.screenshot({ path: tiedosto, omitBackground: true, clip: { x: 0, y: 0, width: koko, height: koko } });
}

// Android: 108 dp:n kangas, turva-alue säde 33 dp. Kärjet skaalataan 33 dp:hen.
function android() {
  const S = 33 / KARKI, siirto = n(54 - C * S);
  const huom = '<!-- Tuottaa android/scripts/tusinasaa-kuvake.js; älä muokkaa käsin. -->\n';
  const kirjoita = (p, s) => { fs.mkdirSync(path.dirname(path.join(RES, p)), { recursive: true }); fs.writeFileSync(path.join(RES, p), s); };
  kirjoita('drawable/ic_tusinasaa_merkki.xml', `<?xml version="1.0" encoding="utf-8"?>
${huom}<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group
        android:scaleX="${n(S)}"
        android:scaleY="${n(S)}"
        android:translateX="${siirto}"
        android:translateY="${siirto}">
        <path
            android:pathData="${KEHA_D.replace(/ /g, ',')}"
            android:strokeColor="@color/kuvake_muste"
            android:strokeWidth="${KEHA}" />
        <path
            android:fillColor="@color/kuvake_muste"
            android:pathData="${TAYTE.replace(/ /g, ',')}" />
    </group>
</vector>
`);
  kirjoita('mipmap-anydpi-v26/ic_launcher.xml', `<?xml version="1.0" encoding="utf-8"?>
${huom}<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/kuvake_pohja" />
    <foreground android:drawable="@drawable/ic_tusinasaa_merkki" />
    <monochrome android:drawable="@drawable/ic_tusinasaa_merkki" />
</adaptive-icon>
`);
  // Android 7 (minSdk 24): ei adaptiivista kuvaketta, joten pyöreä pohja itse. 18 dp reunus = 72 dp:n näkyvä alue.
  kirjoita('mipmap/ic_launcher.xml', `<?xml version="1.0" encoding="utf-8"?>
${huom}<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:bottom="18dp"
        android:left="18dp"
        android:right="18dp"
        android:top="18dp">
        <shape android:shape="oval">
            <solid android:color="@color/kuvake_pohja" />
        </shape>
    </item>
    <item android:drawable="@drawable/ic_tusinasaa_merkki" />
</layer-list>
`);
  kirjoita('values/kuvake.xml', `<?xml version="1.0" encoding="utf-8"?>
${huom}<resources>
    <!-- tusinapaja.html:n tumma teema -->
    <color name="kuvake_pohja">${POHJA}</color>
    <color name="kuvake_muste">${MUSTE}</color>
</resources>
`);
}

if (require.main === module) (async () => {
  fs.mkdirSync(IKONIT, { recursive: true });
  fs.writeFileSync(path.join(IKONIT, 'tusinasaa.svg'), svg());
  const b = await chromium.launch();
  const s = await b.newPage();
  await png(s, svg(), 32, path.join(IKONIT, 'tusinasaa-32.png'));
  for (const k of [180, 192, 512]) await png(s, svg({ viewBox: KOTI, tausta: 'nelio' }), k, path.join(IKONIT, `tusinasaa-${k}.png`));
  await png(s, svg({ viewBox: MASKI, tausta: 'nelio' }), 512, path.join(IKONIT, 'tusinasaa-maskable-512.png'));
  await png(s, svg({ viewBox: ESIKATSELU, tausta: 'nelio' }), 600, path.join(IKONIT, `tusinasaa-jako-${JAKO}.png`));
  await b.close();
  android();
})();

module.exports = { svg, KOTI, MASKI, ESIKATSELU };
