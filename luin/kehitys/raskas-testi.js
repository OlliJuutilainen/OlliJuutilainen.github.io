// Raskas teksti (käyttäjän pyyntö 19.11.2026, sovellaTaiLykkaa()): kun avoimen tekstin asettelu on raskas, ladonnan
// asetukset tehdään kerralla Asetusten sulkiessa. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/raskas-testi.js [kuvakansio]
// Raskauden raja asetetaan testikoukulla (__luin.raskasRaja), joten testi ei riipu koneen nopeudesta. Tarkistaa:
// 1) kevyt teksti: ilmoitus piilossa ja koon napautus asettelee heti; 2) raskas: ilmoitus Asetusten ylälaidassa, koko,
// tavutus ja Kielet eivät asettele eivätkä muuta tekstiä napautuksesta, teema vaihtuu heti, ja sulkiessa asetellaan
// tasan kerran (koko, tavutus, kielten luokka voimaan, lukukohta pysyy); 3) edestakainen muutos ei asettele sulkiessa;
// 4) ei sivuvirheitä.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

// Lomitettu käännös (Perseuksen tapaan), jotta myös Kielet on mukana.
const MD = '---\nladonta: lomitettu käännös\nkohdat: yläindeksit\n---\n\n# Koeteksti\n\n' + Array.from({ length: 40 }, (_, i) =>
  `^${327 + i}a^ κατέβην χθὲς εἰς Πειραιᾶ μετὰ Γλαύκωνος τοῦ Ἀρίστωνος προσευξόμενός τε τῇ θεῷ καὶ ἅμα τὴν ἑορτὴν βουλόμενος θεάσασθαι.\n\n` +
  `> I went down yesterday to the Peiraeus with Glaucon, the son of Ariston, to pay my devotions to the Goddess, and also because I wished to see how they would conduct the festival.\n\n` +
  `Tämä suomenkielinen täytekappale sisältää tavutettavia pitkiä sanoja kuten yhteiskuntafilosofia ja oikeudenmukaisuusteoria.\n`).join('\n');

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = `http://localhost:${palvelin.address().port}/`;
  const selain = await chromium.launch();
  const ctx = await selain.newContext({ viewport: { width: 393, height: 600 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate((md) => {
    localStorage.clear();
    localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-koe', added: 1, title: 'Koeteksti', src: 'paikallinen' }]));
    localStorage.setItem('luin-teksti:p-koe', JSON.stringify(md));
    localStorage.setItem('luin-asetukset', JSON.stringify({ av: 8, sivutus: 'sivut', koko: 16, kokoKasin: 1, tavutus: 'varovainen', lomitus: 'molemmat', teema: 'vaalea' }));
  }, MD);
  await page.goto(U + 'luin.html#id=p-koe');
  await page.reload();
  await page.waitForFunction(() => window.__luin && window.__luin.nyt() && document.querySelector('#teksti [data-b]'));
  await page.waitForTimeout(800); // kirjasinten lataus asettelee
  const ruutu = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))));
  const tila = () => page.evaluate(() => {
    const L = window.__luin, art = document.getElementById('teksti');
    return { as: L.tila.asetteluja, koko: L.aset.koko, fs: getComputedStyle(art).fontSize, shy: (art.textContent.match(/­/g) || []).length,
      alku: art.classList.contains('lomitus-alku'), teema: document.documentElement.dataset.teema, lyk: L.lykatty(),
      tieto: !document.getElementById('raskas-tieto').hidden, tietoTeksti: document.getElementById('raskas-tieto').textContent,
      arvo: document.getElementById('koko-arvo').textContent, b: L.tila.ankkuri && L.tila.ankkuri.b };
  });
  const avaa = async () => { await page.evaluate(() => document.querySelector('#lukija .ratas').click()); await page.waitForSelector('#asetukset:not([hidden])'); };
  const sulje = async () => { await page.evaluate(() => document.querySelector('#asetukset .sulje').click()); await ruutu(); };
  const napauta = async (sel) => { await page.evaluate(s => document.querySelector('#asetukset ' + s).click(), sel); await ruutu(); };
  const KOKO_YLOS = '.asetus[data-a="koko"] button[data-askel="1"]', KOKO_ALAS = '.asetus[data-a="koko"] button[data-askel="-1"]';

  // 1. Kevyt teksti.
  await page.evaluate(() => window.__luin.raskasRaja(1e9));
  await avaa();
  let a = await tila();
  tulos('kevyt: ilmoitus piilossa', !a.tieto);
  await napauta(KOKO_YLOS);
  let b = await tila();
  tulos('kevyt: koon napautus asettelee heti', b.as === a.as + 1 && b.fs === '17px' && !b.lyk, `${a.as}→${b.as}, ${b.fs}`);
  await napauta(KOKO_ALAS);
  await sulje();

  // 2. Raskas teksti.
  await page.evaluate(() => window.__luin.raskasRaja(0));
  // Lukukohta keskelle tekstiä.
  for (let i = 0; i < 6; i++) { await page.keyboard.down('PageDown'); await page.keyboard.up('PageDown'); await page.waitForTimeout(150); }
  await avaa();
  a = await tila();
  tulos('raskas: ilmoitus Asetusten ylälaidassa', a.tieto && /kerralla, kun suljet asetukset/.test(a.tietoTeksti), a.tietoTeksti);
  const paikka = await page.evaluate(() => {
    const t = document.getElementById('raskas-tieto').getBoundingClientRect(), h = document.querySelector('#asetukset header').getBoundingClientRect(),
      o = document.querySelector('#asetukset .aset-ots').getBoundingClientRect();
    return { yla: Math.round(t.top - h.bottom), ala: Math.round(o.top - t.bottom) };
  });
  tulos('raskas: ilmoitus otsikkopalkin ja Ulkoasu-rivin välissä', paikka.yla >= 0 && paikka.ala >= 0, JSON.stringify(paikka));
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'raskas-asetukset.png') });
  await napauta(KOKO_YLOS);
  await napauta(KOKO_YLOS);
  b = await tila();
  tulos('raskas: koon napautus ei asettele', b.as === a.as && b.fs === a.fs && b.lyk, `asetteluja ${a.as}→${b.as}, ${b.fs}`);
  tulos('raskas: paneelin arvo päivittyy', b.koko === 18 && /18/.test(b.arvo), b.arvo);
  await napauta('.asetus[data-a="tavutus"] button[data-arvo="ei"]');
  await napauta('.asetus[data-a="lomitus"] button[data-arvo="alku"]');
  b = await tila();
  tulos('raskas: tavutus ja Kielet eivät muuta tekstiä napautuksesta', b.as === a.as && b.shy === a.shy && !b.alku, `shy ${b.shy}, alku ${b.alku}`);
  await napauta('.asetus[data-a="teema"] button[data-arvo="tumma"]');
  b = await tila();
  tulos('raskas: teema vaihtuu heti asettelematta', b.teema === 'tumma' && b.as === a.as, b.teema);
  await sulje();
  const c = await tila();
  tulos('raskas: sulkiessa asetellaan tasan kerran', c.as === a.as + 1 && !c.lyk, `${a.as}→${c.as}`);
  tulos('raskas: koko, tavutus ja Kielet voimassa sulkemisen jälkeen', c.fs === '18px' && c.shy === 0 && c.alku, `${c.fs}, shy ${c.shy}, alku ${c.alku}`);
  tulos('raskas: lukukohdan lohko pysyy', c.b === a.b, `${a.b}→${c.b}`);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'raskas-suljettu.png') });

  // 3. Edestakainen muutos ei asettele.
  await avaa();
  a = await tila();
  await napauta(KOKO_YLOS);
  await napauta(KOKO_ALAS);
  await sulje();
  b = await tila();
  tulos('raskas: edestakainen muutos ei asettele sulkiessa', b.as === a.as && !b.lyk && b.fs === a.fs, `${a.as}→${b.as}`);

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? `\n${virheita} VIKAA` : '\nKaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})();
