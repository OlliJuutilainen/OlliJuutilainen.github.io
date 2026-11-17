// Tusinasään kuvake (käyttäjän luonnos 17.11.2026): ympyrä, sen ulkopuolella kellotaulun paikoilla 12 pientä
// ulospäin osoittavaa kolmiota hiukan irti kehästä, ja keskellä pikselikirjaimin TS / 12 (ei keskipistettä:
// interpunkti poistettiin käyttäjän pyynnöstä samana päivänä). Kirjaimet ovat omaa 5 × 7 -pikseliruudukkoa (ei fonttitiedostoa), jotta sama muoto
// syntyy vektorina sekä SVG:hen että Androidin VectorDrawableen.
//
// Tuottaa:
//   icons/tusinasaa.svg            välilehden kuvake
//   icons/tusinasaa-180.png        apple-touch-icon (tumma; iOS täyttää läpinäkyvän mustalla)
//   icons/tusinasaa-192.png, -512.png   manifest.webmanifest, any (näkyvä 72 yksikön alue)
//   icons/tusinasaa-maskable-512.png    manifest, maskable: koko 108 kangas, koska maskin turva-alue on säde 40 %
//   icons/tusinasaa-32.png         välilehti selaimille, jotka eivät näytä SVG-kuvaketta (Big Surin Safari)
//   android/app/src/main/res/…     käynnistyskuvake: adaptiivinen (Android 8+) ja monokromi (13+ teemakuvake)
//
// Kaikkialla tumma (vaalea viiva mustalla). Vaalea versio (VAALEA) kokeiltiin 17.11.2026: vaalealla taustakuvalla
// ja vaalealla välilehtipalkilla se hukkui taustaan, tumma erottui joka taustalla. Android 13:n teemakuvake
// (monokromi) sävyttyy järjestelmän väreihin, joten vaalea sävy tulee sitä kautta, jos käyttäjä sen valitsee.
//
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node android/scripts/tusinasaa-kuvake.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const IKONIT = path.join(JUURI, 'icons');
const RES = path.join(JUURI, 'android/app/src/main/res');

// tusinapaja.html:n värit: tumma teema --color-bg / --color-text, vaalea samat.
const TUMMA = { pohja: '#000000', muste: '#e8e8e8' };
const VAALEA = { pohja: '#f7f8fa', muste: '#1c1f22' };

// Kangas 108 × 108 kuten Androidin adaptiivisessa kuvakkeessa (näkyvä alue 72, turva-alue Ø 66).
const K = 108, C = K / 2;
const P = 1.8;                 // pikselin sivu
const R = 23.4;                // kehän säde (viivan keskeltä)
const KEHA = 1.4;              // kehän viiva
const RAKO = 2.4;              // kehän ulkoreunasta kolmion kantaan
const KOLMIO_K = 6;            // kolmion korkeus
const KOLMIO_L = 6.4;          // kolmion kanta

const MERKIT = {
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
};

const n = x => +x.toFixed(3);

// Pikselit yhdeksi poluksi; vaakasuorat jonot yhdistetään. Kaikki samassa polussa, ettei saumoja synny.
function pikselit() {
  const osat = [];
  const merkki = (rivit, x0, y0) => rivit.forEach((rivi, j) => {
    for (let i = 0; i < rivi.length; i++) {
      if (rivi[i] !== '#') continue;
      let l = 1;
      while (rivi[i + l] === '#') l++;
      osat.push([x0 + i * P, y0 + j * P, l * P, P]);
      i += l - 1;
    }
  });
  // Lohko 13 × 17 pikseliä: merkki 5 × 7, väli 3.
  const vas = C - 6.5 * P, oik = C + 1.5 * P, yla = C - 8.5 * P, ala = C + 1.5 * P;
  merkki(MERKIT.T, vas, yla);
  merkki(MERKIT.S, oik, yla);
  merkki(MERKIT[1], vas, ala);
  merkki(MERKIT[2], oik, ala);
  return osat.map(([x, y, w, h]) => `M${n(x)},${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`).join('');
}

function kolmiot() {
  const kanta = R + KEHA / 2 + RAKO, karki = kanta + KOLMIO_K;   // kärki ulospäin
  let d = '';
  for (let t = 0; t < 12; t++) {
    const a = t * Math.PI / 6;                 // 0 = klo 12
    const ux = Math.sin(a), uy = -Math.cos(a); // ulos
    const vx = Math.cos(a), vy = Math.sin(a);  // tangentti
    const p = (r, s) => `${n(C + ux * r + vx * s)},${n(C + uy * r + vy * s)}`;
    d += `M${p(karki, 0)}L${p(kanta, KOLMIO_L / 2)}L${p(kanta, -KOLMIO_L / 2)}Z`;
  }
  return d;
}

const KEHA_D = `M${C},${n(C - R)}a${R},${R} 0 1,1 0,${2 * R}a${R},${R} 0 1,1 0,${-2 * R}Z`;
const TAYTE = kolmiot() + pikselit();

// SVG-sisältö; viewBox valitsee rajauksen. tausta: 'nelio' | 'ympyra' | null
function svg({ pohja, muste }, { viewBox = `0 0 ${K} ${K}`, tausta = 'nelio' } = {}) {
  const [x, y, w] = viewBox.split(' ').map(Number);
  const t = tausta === 'nelio' ? `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${pohja}"/>`
    : tausta === 'ympyra' ? `<circle cx="${C}" cy="${C}" r="${w / 2}" fill="${pohja}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${t}
<path fill="none" stroke="${muste}" stroke-width="${KEHA}" d="${KEHA_D}"/>
<path fill="${muste}" d="${TAYTE}"/>
</svg>
`;
}

// Kotivalikon ja manifestin kuvakkeet: näkyvä 72 yksikön alue (Androidin maski) koko kuvaksi.
const NAKYVA = `${C - 36} ${C - 36} 72 72`;
// Välilehti: ympyrä tiiviisti, pieni reunus kolmioiden kärkien (säde 32,5) ulkopuolelle.
const VALILEHTI = `${C - 34} ${C - 34} 68 68`;

async function png(sivu, sisalto, koko, tiedosto) {
  await sivu.setViewportSize({ width: koko, height: koko });
  await sivu.setContent(`<html><body style="margin:0">${sisalto.replace('<svg ', `<svg width="${koko}" height="${koko}" style="display:block" `)}</body></html>`);
  await sivu.screenshot({ path: tiedosto, omitBackground: true, clip: { x: 0, y: 0, width: koko, height: koko } });
}

function android() {
  const huom = '<!-- Tuottaa android/scripts/tusinasaa-kuvake.js; älä muokkaa käsin. -->\n';
  const kirjoita = (p, s) => { fs.mkdirSync(path.dirname(path.join(RES, p)), { recursive: true }); fs.writeFileSync(path.join(RES, p), s); };
  kirjoita('drawable/ic_tusinasaa_merkki.xml', `<?xml version="1.0" encoding="utf-8"?>
${huom}<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="${K}"
    android:viewportHeight="${K}">
    <path
        android:pathData="${KEHA_D.replace(/ /g, ',')}"
        android:strokeColor="@color/kuvake_muste"
        android:strokeWidth="${KEHA}" />
    <path
        android:fillColor="@color/kuvake_muste"
        android:pathData="${TAYTE}" />
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
    <color name="kuvake_pohja">${TUMMA.pohja}</color>
    <color name="kuvake_muste">${TUMMA.muste}</color>
</resources>
`);
}

if (require.main === module) (async () => {
  fs.mkdirSync(IKONIT, { recursive: true });
  fs.writeFileSync(path.join(IKONIT, 'tusinasaa.svg'), svg(TUMMA, { viewBox: VALILEHTI, tausta: 'ympyra' }));
  const b = await chromium.launch();
  const s = await b.newPage();
  await png(s, svg(TUMMA, { viewBox: VALILEHTI, tausta: 'ympyra' }), 32, path.join(IKONIT, 'tusinasaa-32.png'));
  for (const k of [180, 192, 512]) await png(s, svg(TUMMA, { viewBox: NAKYVA }), k, path.join(IKONIT, `tusinasaa-${k}.png`));
  await png(s, svg(TUMMA), 512, path.join(IKONIT, 'tusinasaa-maskable-512.png'));
  await b.close();
  android();
})();

module.exports = { svg, TUMMA, VAALEA, K, C, NAKYVA, VALILEHTI };
