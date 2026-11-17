// Veivikammen napaehdokkaat ja vertailusivu luin/kehitys/veivinavat.html (käyttäjän pyyntö 16.11.2026).
// Aja: node luin/kehitys/veivinavat.js  (kirjoittaa veivinavat.html tämän tiedoston viereen)
const cx = 1, cy = 0.953;
const f = v => +v.toFixed(4) + '';
const P = (x, y) => f(x) + ' ' + f(y);
const ULKO = 'M1 1.953A1 1 0 1 1 1.7071 .2459';      // ulkokaari ennallaan
const NE = Math.SQRT1_2;
// Kampi päättyy pisteeseen, joka on matkan d päässä keskeltä koillisen suunnassa (d = 0: keskelle).
const kampi = (d = 0) => 'L' + P(cx + d * NE, cy - d * NE);
// Ympyrän piste kompassikulmassa (0 = pohjoinen, myötäpäivään).
const kp = (r, deg, x0 = cx, y0 = cy) => { const a = deg * Math.PI / 180; return [x0 + r * Math.sin(a), y0 - r * Math.cos(a)]; };
// Kaari kompassikulmasta a kulmaan b (vastapäivään, jos ccw).
function kaari(r, a, b, ccw, x0 = cx, y0 = cy) {
  const sweep = ccw ? (a - b + 360) % 360 || 360 : (b - a + 360) % 360 || 360;
  const [x, y] = kp(r, b, x0, y0);
  return 'A' + f(r) + ' ' + f(r) + ' 0 ' + (sweep > 180 ? 1 : 0) + ' ' + (ccw ? 0 : 1) + ' ' + P(x, y);
}
// Arkhimedeen kierre keskeltä: lähtee ylös, kiertää vastapäivään (ccw) tai myötäpäivään, säde kasvaa 0 → rmax kulmassa T.
function kierre(rmax, T, ccw = true, n = 48) {
  let s = '';
  for (let i = 1; i <= n; i++) {
    const t = T * i / n, r = rmax * i / n, deg = ccw ? -t : t;
    const [x, y] = kp(r, deg); s += 'L' + P(x, y);
  }
  return s;
}
const ympyra = (r, x0 = cx, y0 = cy) => { const [x1, y1] = kp(r, 0, x0, y0), [x2, y2] = kp(r, 180, x0, y0);
  return 'M' + P(x1, y1) + 'A' + f(r) + ' ' + f(r) + ' 0 1 0 ' + P(x2, y2) + 'A' + f(r) + ' ' + f(r) + ' 0 1 0 ' + P(x1, y1) + 'Z'; };
const salmiakki = (w, x0 = cx, y0 = cy) => 'M' + P(x0, y0 - 1.3 * w) + 'L' + P(x0 + w, y0) + 'L' + P(x0, y0 + 1.3 * w) + 'L' + P(x0 - w, y0) + 'Z';
// Salmiakin oikean yläsivun ja koillisen säteen leikkaus: x/w + y/(1.3w) = 1 ja x = y → t = 1.3w/2.3.
const salmiakinReuna = w => Math.SQRT2 * 1.3 * w / 2.3;

const viiva = d => ({ d });            // piirretään reunaviivana
const tayte = d => ({ d, tayte: 1 });  // piirretään täytettynä, ilman reunaviivaa

const E = [];
const lisaa = (id, ryhma, nimi, osat, huom = '') => E.push({ id, ryhma, nimi, osat, huom });

lisaa('nolla', 'Lähtökohta', 'Nykyinen: kampi päättyy keskelle', [viiva(ULKO + kampi())]);

// Käyttäjän toive: keskeltä tasan ylös, sitten vastapäivään, ei kiinni.
for (const r of [.2, .28, .344, .36, .3915, .4, .45]) {
  lisaa('kiep-225-' + r, 'Kiepsahdus (keskeltä ylös, vastapäivään)', 'Peilikehä 225°, r = ' + r,
    [viiva(ULKO + kampi() + 'L' + P(cx, cy - r) + kaari(r, 0, 135, true))],
    'Sisäkehä on ulkokehän peilikuva: ulko 225° myötäpäivään etelästä, sisä 225° vastapäivään pohjoisesta. Molempien aukko on idässä; kampi tulee sisään aukosta.');
}
for (const r of [.28, .36]) {
  lisaa('kiep-270-' + r, 'Kiepsahdus (keskeltä ylös, vastapäivään)', 'Kehä 270° (pohjoinen → itä), r = ' + r,
    [viiva(ULKO + kampi() + 'L' + P(cx, cy - r) + kaari(r, 0, 90, true))]);
  lisaa('kiep-180-' + r, 'Kiepsahdus (keskeltä ylös, vastapäivään)', 'Puolikehä 180° (pohjoinen → etelä), r = ' + r,
    [viiva(ULKO + kampi() + 'L' + P(cx, cy - r) + kaari(r, 0, 180, true))]);
}
lisaa('kiep-315-36', 'Kiepsahdus (keskeltä ylös, vastapäivään)', 'Melkein umpeen 315° (pohjoinen → koillinen), r = .36',
  [viiva(ULKO + kampi() + 'L' + P(cx, cy - .36) + kaari(.36, 0, 45, true))], 'Päättyy kammen viereen: näyttää umpeutuvan.');
// Irrallinen versio: kampi keskelle, kehä erikseen (ei vartta ylös).
lisaa('kiep-irti-36', 'Kiepsahdus (keskeltä ylös, vastapäivään)', 'Ilman pystyvartta: peilikehä erillään, r = .36',
  [viiva(ULKO + kampi()), viiva('M' + P(cx, cy - .36) + kaari(.36, 0, 135, true))]);

// Kierre: kasvava säde keskeltä.
for (const [rm, T] of [[.32, 270], [.42, 270], [.42, 360], [.5, 405], [.36, 225]]) {
  lisaa('kierre-' + rm + '-' + T, 'Kierre (keskeltä ylös, vastapäivään, säde kasvaa)', 'Kierre ' + T + '°, loppusäde ' + rm,
    [viiva(ULKO + kampi() + kierre(rm, T, true))]);
}
lisaa('kierre-mp-42-270', 'Kierre (keskeltä ylös, vastapäivään, säde kasvaa)', 'Vertailu: myötäpäivään 270°, loppusäde .42',
  [viiva(ULKO + kampi() + kierre(.42, 270, false))], 'Myötäpäivään kierre kulkee ulkokehän suuntaan ja törmää kampeen.');

// Umpinaiset ja ontot keskiöt.
for (const r of [.16, .24, .32]) {
  lisaa('rengas-' + r, 'Rengas (umpinainen kehä, kampi päättyy kehään)', 'Rengas r = ' + r,
    [viiva(ULKO + kampi(r)), viiva(ympyra(r))]);
}
lisaa('rengas-tapla', 'Rengas (umpinainen kehä, kampi päättyy kehään)', 'Rengas r = .32 ja täplä', [viiva(ULKO + kampi(.32)), viiva(ympyra(.32)), tayte(ympyra(.09))]);
for (const r of [.08, .12, .17]) {
  lisaa('tapla-' + r, 'Täplä (täytetty)', 'Täplä r = ' + r, [viiva(ULKO + kampi()), tayte(ympyra(r))]);
}
for (const w of [.14, .2, .26]) {
  lisaa('sal-ontto-' + w, 'Salmiakki (Luinin oma merkki, korkeus 1,30 × leveys)', 'Ontto salmiakki, puolileveys ' + w,
    [viiva(ULKO + kampi(salmiakinReuna(w))), viiva(salmiakki(w))]);
}
for (const w of [.09, .13, .17]) {
  lisaa('sal-taysi-' + w, 'Salmiakki (Luinin oma merkki, korkeus 1,30 × leveys)', 'Täytetty salmiakki, puolileveys ' + w,
    [viiva(ULKO + kampi()), tayte(salmiakki(w))]);
}
// Muut tyylit.
lisaa('kahva', 'Muut', 'Kahva: poikkiviiva kammen päässä', [viiva(ULKO + kampi() + 'M' + P(cx - .2 * NE, cy - .2 * NE) + 'L' + P(cx + .2 * NE, cy + .2 * NE))],
  'Oikean veivin kädensija on kammen päässä poikittain.');
lisaa('lapi', 'Muut', 'Kampi jatkuu keskipisteen yli', [viiva(ULKO + kampi() + 'L' + P(cx - .22 * NE, cy + .22 * NE))]);
lisaa('koukku', 'Muut', 'Koukku: pystyvarsi ja silmukka sivussa', [viiva(ULKO + kampi() + 'L' + P(cx, cy - .12) + kaari(.2, 90, 180, true, cx - .2, cy - .12))],
  'Ylös ja vastapäivään, mutta silmukan keskipiste on vasemmalla, ei navassa.');
lisaa('kulma', 'Muut', 'Kulmikas kiepsahdus (ylös, vasemmalle, alas)', [viiva(ULKO + kampi() + 'L' + P(cx, cy - .3) + 'L' + P(cx - .3, cy - .3) + 'L' + P(cx - .3, cy + .3) + 'L' + P(cx + .3, cy + .3))],
  'Neliön kolme sivua: suorakulmainen sukulainen peilikehälle.');
lisaa('kaksoiskehä', 'Muut', 'Kaksi sisäkkäistä peilikaarta', [viiva(ULKO + kampi() + 'L' + P(cx, cy - .22) + kaari(.22, 0, 135, true)), viiva('M' + P(cx, cy - .44) + kaari(.44, 0, 135, true))]);


// Finalistit ja raportit (mitattu Chromiumissa luin.html:n kellarilinkissä, .74rem = 11,84 px, R = 10,58 px).
const FINAALI = [
  ['kiep-225-0.3915', 'Valittu', 'Käyttäjän toive sellaisenaan: keskeltä tasan ylös, kiepsahdus vastapäivään, ei kiinni. Sisäkaari on ulkokaaren vaakapeilikuva (225°, aukko idässä), ja kampi tulee sisään aukosta. Säde 0,35 em: keskiviivan halkaisija on Literatan versaalikorkeus 0,70 em, joten kehä on perusviivan ja versaalilinjan välissä; muste ylittää linjat puoli viivaa kuten pyöreät kirjaimet (mitattu 8× suurennoksesta: kehä 7,75–16,88 px, K 8,00–16,38 px). 1×-tiheydellä vielä luettava; pienemmillä säteillä kammen ja varren V-liitos tukkeutuu.'],
  ['kiep-225-0.344', 'Finalisti', 'Sama kuvio, muste tasan versaalien rajoissa (kehä 8,25–16,38 px). Sisäkehä jää 1×-tiheydellä ahtaaksi: kammen ja pystyvarren 45°:n kulma ja kehä sulautuvat yhdeksi möykyksi.'],
  ['kiep-225-0.45', 'Finalisti', 'Näyttävin kiepsahdus, mutta sisäkehä alkaa kilpailla ulkokehän kanssa ja on versaaleja korkeampi (0,80 em).'],
  ['kiep-270-0.36', 'Finalisti', 'Pidempi kaari (pohjoisesta itään). Aukko on vain koillisneljännes, joten peilikuvan logiikka katoaa; kuvio lähestyy ©-merkkiä.'],
  ['kierre-0.42-270', 'Finalisti', 'Kasvava kierre on liikkeenä veivimäisin, mutta pienenä se lukeutuu koukuksi tai kirjaimeksi (ε, ∂), ja keskusta tukkeutuu 1×-tiheydellä.'],
  ['rengas-0.24', 'Finalisti', 'Umpinainen laakeri: selkein ja mekaanisin, kaikilla tiheyksillä tarkka. Ei heijasta ulkokehää, koska on kiinni.'],
  ['sal-ontto-0.2', 'Finalisti', 'Luinin oma salmiakki (1,30 × leveys). Sopii merkistöön, mutta kammen pää salmiakin kyljessä näyttää osoittimelta, ei navalta.'],
];

const svgSisus = c => c.osat.map(o => o.tayte ? '<path class="t" d="' + o.d + '"/>' : '<path d="' + o.d + '"/>').join('');
const linkki = c => '<span class="ark"><svg class="veivi" viewBox="0 0 2 2" aria-hidden="true">' + svgSisus(c) + '</svg>kellarin veivihyllystö</span>';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const hae = id => E.find(e => e.id === id);
const kortti = (c, ots, teksti) => '<div class="kortti"><div class="nayte"><div class="v">' + linkki(c) + '</div><div class="v tumma">' + linkki(c) + '</div></div>' +
  '<p class="nimi">' + (ots ? '<b>' + ots + '.</b> ' : '') + esc(c.nimi) + ' <code>' + c.id + '</code></p>' + (teksti ? '<p class="huom">' + esc(teksti) + '</p>' : '') + '</div>';

let ryhmat = '', edellinen = '';
const nahty = new Set();   // sama huomautus vain kerran ryhmässä
for (const c of E) {
  if (c.ryhma !== edellinen) { if (edellinen) ryhmat += '</div>'; ryhmat += '<h3>' + esc(c.ryhma) + '</h3><div class="ruudukko">'; edellinen = c.ryhma; }
  ryhmat += kortti(c, '', nahty.has(c.huom) ? '' : c.huom); nahty.add(c.huom);
}
ryhmat += '</div>';

const html = `<!DOCTYPE html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Veivinavat</title>
<!-- Tuotettu: node luin/kehitys/veivinavat.js. Kellarin veivihyllystön linkin veivin napaehdokkaat samoilla mitoilla kuin
     luin.html:ssä (.ark-linkki svg.veivi). Valittu napa on luin.html:ssä. -->
<style>
  @font-face { font-family: Literata; src: url(../fontit/literata.woff2) format("woff2"); font-weight: 380 700; font-style: normal; }
  :root { --paperi: #faf5ea; --muste: #231c14; --harmaa: #67553f; --viiva: #cbb99c; }
  body { margin: 0 auto; max-width: 980px; padding: 16px; background: var(--paperi); color: var(--muste); font: 15px/1.5 Literata, Georgia, serif; }
  h1 { font-weight: 400; font-size: 1rem; letter-spacing: .18em; text-transform: uppercase; color: var(--harmaa); margin: 8px 0 4px; }
  h2, h3 { font-weight: 400; font-size: .74rem; letter-spacing: .18em; text-transform: uppercase; color: var(--harmaa);
    border-bottom: 1px solid var(--viiva); padding-bottom: 6px; margin: 34px 0 12px; }
  p.alku { color: var(--harmaa); font-size: .9rem; max-width: 46em; }
  .ruudukko { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px 22px; }
  .kortti { min-width: 0; }
  .nayte { display: flex; flex-wrap: wrap; gap: 6px; }
  .v { flex: 1 1 130px; padding: 14px 8px 12px 30px; background: var(--paperi); border: 1px solid var(--viiva); color: var(--harmaa); }
  .v.tumma { --paperi: #120e0b; --harmaa: #b09b7e; --viiva: #4b3e2f; background: #120e0b; color: #b09b7e; }
  .finaali .v { flex-basis: 220px; font-size: 1.6em; padding-left: 46px; }
  /* Kuten luin.html:n .ark-linkki a: sama koko, harvennus, alleviivauksen jatke ja veivi. */
  .ark { position: relative; display: inline-block; font-size: .74rem; line-height: 1.8; letter-spacing: .14em; text-transform: uppercase;
    border-bottom: 1px solid currentColor; white-space: nowrap; }
  .finaali .ark { font-size: .74em; }
  .ark::before { content: ""; position: absolute; right: 100%; bottom: -1px; width: calc(1.294em + .5px); border-bottom: 1px solid currentColor; }
  .ark svg.veivi { position: absolute; right: calc(100% + .4em); bottom: -1px; width: 1.788em; height: 1.788em; overflow: visible;
    fill: none; stroke: currentColor; stroke-width: 1; stroke-linejoin: miter; }
  .ark svg.veivi path { vector-effect: non-scaling-stroke; }
  .ark svg.veivi path.t { fill: currentColor; stroke: none; }
  p.nimi { margin: 6px 0 0; font-size: .82rem; }
  p.nimi code { font-size: .72rem; color: var(--harmaa); }
  p.huom { margin: 2px 0 0; font-size: .78rem; color: var(--harmaa); line-height: 1.45; }
  .finaali .kortti { margin-bottom: 18px; }
  .foot { margin: 48px 0 8px; text-align: center; font-size: .62rem; letter-spacing: .2em; color: var(--viiva); }
</style>
</head>
<body>
<h1>Veivikammen navat</h1>
<p class="alku">Kellarin veivihyllystön linkin veivi: ulkokaari kiertää myötäpäivään etelästä koilliseen, ja kampi tulee napaan. Alla napaehdokkaat elävinä samoilla mitoilla kuin pinossa (kirjasinkoko .74rem, ulkokehän säde 0,894 em, viiva 1 px), vaalealla ja tummalla teemalla. Finalistit myös suurennettuina. Yksikkö on ulkokehän säde.</p>
<h2>Finalistit</h2>
<div class="finaali">${FINAALI.map(([id, ots, t]) => kortti(hae(id), ots, t)).join('')}</div>
<h2>Kaikki ehdokkaat (${E.length})</h2>
${ryhmat}
<p class="foot">© TUSINASOFT 2026</p>
</body>
</html>
`;
require('fs').writeFileSync(require('path').join(__dirname, 'veivinavat.html'), html);
console.log('veivinavat.html:', E.length, 'ehdokasta,', FINAALI.length, 'finalistia');
