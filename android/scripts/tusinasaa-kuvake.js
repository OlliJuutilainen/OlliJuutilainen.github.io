// Tusinasään kuvake (käyttäjän päätös): musta kiekko, paksu kuusikulmainen kehä kärki ylhäällä ja alhaalla, sen ulkopuolella
// kellotaulun paikoilla 12 ulospäin osoittavaa kolmiota kapean raon päässä kehästä, ja kehän sisällä babylonialainen luku 12
// nuolenpääkirjoituksella: kulmakiila (10) ja kaksi pystykiilaa (1 + 1).
// Rako on kaikille säteille sama, joten kuusikulmion kulmien kohdalla (klo 12, 2, 4, 6, 8, 10) säteen tyveen tulee kulman
// muotoinen V-lovi; sivujen keskelle osuvien säteiden tyvi on sivun suuntainen. Kaikkien säteiden kärjet ovat samalla
// ympyrällä. Kulmakiila täyttää kehän sisäalueen vasemman puolikkaan (kärki vasenta pystysivua vasten, selän kulmat vinoja
// sivuja vasten, selkä keskilinjan tuntumassa); pystykiilat ovat huomattavasti pienemmät oikean puolikkaan keskellä, jolloin
// keskilinjan eri puolille syntyy päivän ja yön vaikutelma (käyttäjän päätös).
// Sama muoto kaikkialla (välilehti, kotivalikko, linkin esikatselu, Android, sivujen logot); vain rajaus vaihtelee.
//
// Tuottaa:
//   icons/tusinasaa.svg, -32.png         välilehden kuvake (32 px PNG Big Surin Safarille)
//   icons/tusinasaa-180.png              apple-touch-icon (iOS täyttää läpinäkyvän mustalla, joten musta neliö)
//   icons/tusinasaa-192.png, -512.png    manifest.webmanifest, any
//   icons/tusinasaa-maskable-512.png     manifest, maskable: kolmioiden kärjet maskin turva-alueen (säde 40 %) sisällä
//   icons/tusinasaa-jako-N.png           linkin esikatselu (og:image; WhatsApp, Signal ym.), 600 × 600. Kun kuva muuttuu,
//                                        nosta JAKO-numeroa: viestimet pitävät vanhan osoitteen kuvan välimuistissa.
//                                        Skripti päivittää og:image-osoitteet ja poistaa vanhan numeron kuvan.
//   ?v=<SHA-1:n alku>                    SIVUT-taulukon sivujen ja manifestin kuvakeosoitteisiin (paitsi jako, jolla oma
//                                        numero): selaimet pitävät välilehden kuvaketta muistissa osoitteen mukaan
//                                        eivätkä hae uutta, vaikka palvelin antaisi (Big Surin selaimet)
//   <svg class="logo" viewBox="0 0 32 32"> SIVUT-taulukon sivuilla upotettu logo
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
const JAKO = 4;
const SIVUT = ['index.html', 'tusinapaja.html', 'oma-tusinasaa.html', 'minun-tusinasaa.html', 'tusinasaa-koodi.html', 'manifest.webmanifest'];

// tusinapaja.html:n tumman teeman --color-bg ja --color-text.
const POHJA = '#000000', MUSTE = '#e8e8e8';

// Kangas 32 × 32, keskipiste 16: 32 px:n välilehdessä yksikkö on pikseli. Muoto piirretään suunnitteluyksiköissä
// keskipisteen ympärille, ja MITTA skaalaa sen niin, että säteiden kärjet ovat säteellä KARKI.
const C = 16, KARKI = 15.2;
const T30 = Math.tan(Math.PI / 6), S60 = Math.sin(Math.PI / 3);
const R = 8.9, KEHA = 2.2;                       // kehän keskiviivan ympäryssäde ja kehän paksuus (sivua vastaan kohtisuoraan)
const RAKO = .55, LEVEYS = 4, KULMA_PITUUS = 4.4; // kehästä säteiden tyveen; tyven leveys; kulmasäteen pituus tyven kulmista
const VALI = .75;                                // kehän sisäreunasta merkkeihin
const ULKO = R + KEHA / 2 / S60, SISA = R - KEHA / 2 / S60;   // kehän reunojen ympäryssäteet (terävät kulmat)
const LOVI = ULKO + RAKO / S60;                  // kulmasäteen loven pohja: RAKO kummastakin kulman sivusta
const KANTA_K = LOVI - LEVEYS / 2 * T30;         // kulmasäteen tyven kulmat
const KANTA_S = ULKO * S60 + RAKO;               // sivusäteen tyvi (ULKO · cos 30° = kehän ulkoreunan sisäsäde)
const KARKI_S = KANTA_K + KULMA_PITUUS;          // kärkien säde suunnitteluyksiköissä
const MITTA = KARKI / KARKI_S;
const U = SISA - VALI / S60;                     // merkkialueen (kuusikulmio) ympäryssäde
// Kulmakiila: kärki vasenta pystysivua vasten, selkä x = SELKA (kulmat vinoilla sivuilla), lovi KIILA_LOVI selästä sisään.
const SELKA = -.4, KIILA_LOVI = 1.5;
// Pystykiilat: keskikohdat, koko korkeus, pään leveys ja korkeus, varren leveys (pyöreä pää). Pystysuunnassa keskellä.
const PYST = [2, 4], PYST_K = 4.6, PAA = 1.7, PAA_K = 1.4, VARSI = .8;

const n = x => +x.toFixed(3);
const p = (x, y) => `${n(C + x * MITTA)},${n(C + y * MITTA)}`;
const reuna = x => U - Math.abs(x) * T30;       // merkkialueen yläreuna kohdassa x (vinojen sivujen kohdalla)

// Kuusikulmio kärki ylhäällä; vastapäivään piirretty on reikä (nollasta poikkeava täyttösääntö, toimii myös Androidissa).
function kuusikulmio(r, vastapaivaan) {
  const k = vastapaivaan ? [0, 5, 4, 3, 2, 1] : [0, 1, 2, 3, 4, 5];
  return 'M' + k.map(i => p(r * Math.sin(i * Math.PI / 3), -r * Math.cos(i * Math.PI / 3))).join('L') + 'Z';
}

// Säde t (0 = klo 12) paikallisina koordinaatteina [r ulos, s myötäpäivään].
function sakara(t, pisteet) {
  const a = t * Math.PI / 6, ux = Math.sin(a), uy = -Math.cos(a), vx = Math.cos(a), vy = Math.sin(a);
  return 'M' + pisteet.map(([r, s]) => p(ux * r + vx * s, uy * r + vy * s)).join('L') + 'Z';
}

function sateet() {
  const h = LEVEYS / 2;
  let d = '';
  for (let t = 0; t < 12; t++) d += t % 2
    ? sakara(t, [[KARKI_S, 0], [KANTA_S, h], [KANTA_S, -h]])
    : sakara(t, [[KARKI_S, 0], [KANTA_K, h], [LOVI, 0], [KANTA_K, -h]]);
  return d;
}

function kiilat() {
  const sy = reuna(SELKA);
  let d = `M${p(-U * S60, 0)}L${p(SELKA, -sy)}L${p(SELKA - KIILA_LOVI, 0)}L${p(SELKA, sy)}Z`;
  const v = VARSI / 2, rv = n(v * MITTA);
  for (const x of PYST) {
    const w = PAA / 2, yla = -PYST_K / 2, kaula = yla + PAA_K, ala = yla + PYST_K - v;
    d += `M${p(x - w, yla)}L${p(x + w, yla)}L${p(x + v, kaula)}L${p(x + v, ala)}` +
      `A${rv},${rv} 0 0 1 ${p(x - v, ala)}L${p(x - v, kaula)}Z`;
  }
  return d;
}

const TAYTE = kuusikulmio(ULKO) + kuusikulmio(SISA, true) + sateet() + kiilat();

// tausta: 'kiekko' (välilehti) tai 'nelio' (koko viewBox; kotivalikko, manifest, esikatselu)
function svg({ viewBox = '0 0 32 32', tausta = 'kiekko' } = {}) {
  const [x, y, w] = viewBox.split(' ').map(Number);
  const t = tausta === 'kiekko' ? `<circle cx="${C}" cy="${C}" r="16" fill="${POHJA}"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${POHJA}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${t}
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
  for (const f of fs.readdirSync(IKONIT)) if (/^tusinasaa-jako-\d+\.png$/.test(f) && f !== `tusinasaa-jako-${JAKO}.png`) fs.unlinkSync(path.join(IKONIT, f));
  android();
  versioi();
})();

// Kuvakeosoitteiden versiotunniste tiedoston sisällöstä: muuttuu vain, kun kuva muuttuu. Samalla og:image-numero ja
// sivuille upotettu logo.
function versioi() {
  const crypto = require('crypto');
  const logo = `<circle cx="16" cy="16" r="16" fill="#000"/><path fill="${MUSTE}" d="${TAYTE}"/>`;
  for (const f of SIVUT) {
    const p = path.join(JUURI, f);
    const s = fs.readFileSync(p, 'utf8').replace(/icons\/(tusinasaa(?!-jako)[\w-]*\.(?:svg|png))(?:\?v=[0-9a-f]+)?"/g, (m, nimi) => {
      const v = crypto.createHash('sha1').update(fs.readFileSync(path.join(IKONIT, nimi))).digest('hex').slice(0, 8);
      return `icons/${nimi}?v=${v}"`;
    }).replace(/icons\/tusinasaa-jako-\d+\.png/g, `icons/tusinasaa-jako-${JAKO}.png`)
      .replace(/(<svg class="logo" viewBox="0 0 32 32"[^>]*>)[\s\S]*?(<\/svg>)/g, (m, alku, loppu) => alku + logo + loppu);
    fs.writeFileSync(p, s);
  }
}

module.exports = { svg, KOTI, MASKI, ESIKATSELU };
