// Sivutetun aikajanan vedon portaat ja napautus (luin.html janaPysakit(), janaKohde(); käyttäjän säännöt). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/jana-porras-testi.js
// Portaat ovat tekstin alku, viimeisen sivun alku, luvut ja osiot (myös yläindeksien osiot), kirjanmerkit, majakka ja
// voimassa oleva kohta; kohdat eivät ole portaita. Yli 25 %:n portaanväli jaetaan floor(väli / 12,5 %) yhtä suureen osaan.
// Veto (vähintään 10 px sivusuunnassa) pysähtyy vain portaille eikä kirjoita mitään, kun porras ei vaihdu; napautus vie
// mihin kohtaan tahansa, paitsi näkyvän salmiakin musteelle napautus vie salmiakin kohtaan (myös kohdan). Veto ja napautus
// sekä hiirellä että kosketuksella.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const JUURI = path.resolve(__dirname, '../..');
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
});
let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const KPL = 'Lukija kulkee tekstissä omaa vauhtiaan, ja aikajana näyttää, missä hän on ja mitä on vielä edessä. Sivu kerrallaan ' +
  'eteneminen on sähköpaperilla luontevaa, mutta pitkä matka taittuu vetämällä osoitinta portaalta toiselle.';
const kpl = n => Array(n).fill(KPL).join('\n\n');
// Luku 2 on pitkä ja siinä on vain kohtia (####), luku 3 jakautuu osioihin, luku 4 on pitkä ilman alaotsikoita.
const KIRJA = '# Portaat\n\n## 1. Alku\n\n' + kpl(3) + '\n\n## 2. Pitkä luku\n\n' +
  Array.from({ length: 6 }, (_, i) => `#### 2.0.${i + 1} Kohta\n\n` + kpl(4)).join('\n\n') +
  '\n\n## 3. Osioitu luku\n\n### 3.1 Ensimmäinen osio\n\n' + kpl(3) + '\n\n#### 3.1.1 Kohta\n\n' + kpl(3) +
  '\n\n### 3.2 Toinen osio\n\n' + kpl(6) + '\n\n## 4. Loppu\n\n' + kpl(20) + '\n';
const ILMAN = '# Ilman otsikoita\n\n' + kpl(60) + '\n';
// Stephanus-sivut osioina, kirjaimet kohtina (yläindeksit).
const VALTIO = '---\nkohdat: yläindeksit\n---\n\n# Πολιτεία\n\n## Αʹ\n\n' +
  Array.from({ length: 5 }, (_, s) => [...'abcde'].map(k => `^${327 + s}${k}^ ${KPL}`).join('\n\n')).join('\n\n') + '\n';

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 412, height: 824 } })).newPage();
  const sivuvirheet = [];
  p.on('pageerror', e => sivuvirheet.push(e.message));
  const avaa = async md => {
    await p.goto(BASE + 'luin.html');
    await p.evaluate(md => {
      localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' }));
      localStorage.setItem('luin-asetukset', JSON.stringify({ av: 10, teema: 'vaalea', sivutus: 'sivut', sivuReuna: 1, sivuPyyhka: 0, sivunapit: 1, koko: 18, kokoKasin: 1 }));
    }, md);
    await p.goto('about:blank'); await p.goto(BASE + 'luin.html#tuo');
    await p.waitForFunction(() => window.__luin && window.__luin.nyt() && document.querySelector('#teksti [data-b]'));
    await p.waitForTimeout(600);
    if (await p.evaluate(() => document.querySelector('#jana').hidden)) await p.click('#ala-nappi');
    await p.evaluate(() => { const L = window.__luin; L.aset.janaTasot = [1, 2, 3]; L.mene({ b: 0, o: 0 }); });
    await p.waitForTimeout(200);
  };
  // Portaat (osuudet) ja riippumaton odotus: perusportaat koodin ulkopuolelta ja väliportaat säännöstä.
  const portaat = () => p.evaluate(() => {
    const L = window.__luin, n = L.nyt(), o = k => Math.min(1, Math.max(0, (n.cum[k.b] + k.o) / n.total));
    const F = [...new Set(L.janaPysakit().map(m => o(m.k)))].sort((a, b) => a - b);
    const perus = [0, o(L.tila.ankkuri)];
    if (L.tila.sivuja > 1) perus.push(o(L.sivunAlku(L.tila.sivuja - 1)));
    n.doc.toc.forEach(t => { if (t.lvl <= 2) perus.push(o({ b: t.b, o: 0 })); });
    (n.kohdat || []).forEach(y => { if (y.lvl <= 2) perus.push(o(y.k)); });
    n.merk.km.forEach(k => { if (!k.orpo) perus.push(o(k)); });
    if (L.majakka()) perus.push(o(L.majakka().k));
    const P = [...new Set(perus)].sort((a, b) => a - b), E = P.slice(), jaot = [];
    for (let i = 1; i < P.length; i++) {
      const g = P[i] - P[i - 1], m = g > .25 ? Math.floor(g / .125 + 1e-9) : 1;
      if (m > 1) jaot.push(m);
      for (let j = 1; j < m; j++) E.push(P[i - 1] + g * j / m);
    }
    E.sort((a, b) => a - b);
    const tol = 2 / n.total, loytyy = (A, x) => A.some(y => Math.abs(x - y) <= tol);
    const vanhat = 2 + (L.tila.sivuja > 1 ? 1 : 0) + n.doc.toc.length + (n.kohdat || []).length;
    let suurin = 0; for (let i = 1; i < F.length; i++) suurin = Math.max(suurin, F[i] - F[i - 1]);
    const kohtaPortaat = n.doc.toc.filter(t => t.lvl >= 3).concat((n.kohdat || []).filter(y => y.lvl >= 3).map(y => ({ b: y.k.b, o: y.k.o })))
      .filter(t => loytyy(F, o({ b: t.b, o: t.o || 0 })) && !loytyy(P, o({ b: t.b, o: t.o || 0 }))).length;
    return { F, E, jaot, suurin, kohtaPortaat, vanhat, sama: F.length === E.length && F.every(x => loytyy(E, x)) && E.every(x => loytyy(F, x)),
      kohtia: n.doc.toc.filter(t => t.lvl >= 3).length + (n.kohdat || []).filter(y => y.lvl >= 3).length, sivuja: L.tila.sivuja };
  });
  const pros = A => A.map(x => (x * 100).toFixed(1)).join(' ');
  const jana = () => p.evaluate(() => { const b = document.querySelector('#jana-svg').getBoundingClientRect(), L = window.__luin, xr = L.janaRajat(b.width);
    return { l: b.left, y: b.top + L.JANA.y, x0: xr[0], x1: xr[1] }; });
  const ankkuriX = r => p.evaluate(r => { const L = window.__luin, n = L.nyt(), a = L.tila.ankkuri;
    return { k: a.b + ':' + a.o, x: r.l + r.x0 + (n.cum[a.b] + a.o) / n.total * (r.x1 - r.x0) }; }, r);

  // 1. Kirja: luku- ja osiotason portaat, väliportaat.
  await avaa(KIRJA);
  const k = await portaat();
  console.log(`  kirja: ${k.sivuja} sivua, portaat ${pros(k.F)} %, jaot ${k.jaot.join(', ')}; kohtia ${k.kohtia}, vanhalla säännöllä pysäkkejä ${k.vanhat}`);
  tulos('kirja: portaat säännön mukaan', k.sama, 'odotus ' + pros(k.E));
  tulos('kirja: kohdat eivät ole portaita', k.kohtia > 0 && k.kohtaPortaat === 0, `kohtia ${k.kohtia}, portaina ${k.kohtaPortaat}`);
  tulos('kirja: suurin portaanväli enintään 25 %', k.suurin <= .25 + 1e-6, (k.suurin * 100).toFixed(1) + ' %');
  tulos('kirja: sekä kahtia että vähintään kolmeen jaettu väli', k.jaot.includes(2) && k.jaot.some(m => m >= 3), 'jaot ' + k.jaot.join(', '));

  // 2. Veto koko janan yli: vain portaita, ei kirjoituksia ruudulle, kun porras ei vaihdu.
  const r = await jana();
  const salmiakit = await p.evaluate(() => window.__luin.janaSalmiakit().map(s => ({ x: s.x, karki: s.karki, lvl: s.lvl, k: s.k.b + ':' + s.k.o })));
  const portaatX = k.F.map(f => r.l + r.x0 + f * (r.x1 - r.x0));
  await p.evaluate(() => {
    window.__muut = 0;
    const mo = new MutationObserver(l => { window.__muut += l.length; });
    for (const s of ['#jana-svg', '#jana-kohta', '#jana-pros']) mo.observe(document.querySelector(s), { subtree: true, childList: true, attributes: true, characterData: true });
  });
  const x0 = r.l + r.x0 + 2, x1 = r.l + r.x1 - 2, askelia = 120;
  await p.mouse.move(x0, r.y); await p.mouse.down(); await p.waitForTimeout(60);
  await p.evaluate(() => { window.__muut = 0; });
  const paikat = []; let edellinen = null, turhat = 0, vaihdot = 0, muutoksia = 0;
  for (let i = 1; i <= askelia; i++) {
    const x = x0 + (x1 - x0) * i / askelia;
    await p.mouse.move(x, r.y); await p.waitForTimeout(40);
    const t = await p.evaluate(() => { const g = document.querySelector('#j-veto'), m = window.__muut; window.__muut = 0; return { g: g && parseFloat(g.getAttribute('transform').slice(10)), m }; });
    muutoksia += t.m;
    if (x - x0 < 10) { edellinen = t.g; continue; }
    paikat.push(r.l + t.g);
    if (t.g === edellinen) { if (t.m) turhat++; } else vaihdot++;
    edellinen = t.g;
  }
  await p.mouse.up(); await p.waitForTimeout(300);
  const vain = paikat.every(x => portaatX.some(y => Math.abs(x - y) < .01));
  const kohtaSal = salmiakit.filter(s => s.lvl === 3), ohiKohdista = paikat.every(x => !kohtaSal.some(s => Math.abs(r.l + s.x - x) < .01 && !portaatX.some(y => Math.abs(y - x) < .01)));
  const eri = [...new Set(paikat.map(x => x.toFixed(2)))].length;
  const perilla = await ankkuriX(r);
  tulos('kirja: veto pysähtyy vain portaille', vain && ohiKohdista && kohtaSal.length > 0, `${eri} eri paikkaa ${askelia} askeleella, portaita ${k.F.length}, näkyviä kohtasalmiakkeja ${kohtaSal.length}`);
  tulos('kirja: veto ei kirjoita, kun porras ei vaihdu', turhat === 0, `porras vaihtui ${vaihdot} kertaa, turhia kirjoituksia ${turhat}, muutoksia yhteensä ${muutoksia}`);
  tulos('kirja: irrotus portaalle', portaatX.some(y => Math.abs(y - perilla.x) < .5), 'perillä ' + perilla.k);

  // 3. Napautus portaiden välissä vie siihen kohtaan; pieni heilahdus (alle 10 px) on yhä napautus.
  await p.evaluate(() => window.__luin.mene({ b: 0, o: 0 })); await p.waitForTimeout(200);
  const k0 = await portaat(), r0 = await jana(), sal0 = await p.evaluate(() => window.__luin.janaSalmiakit().map(s => ({ x: s.x, karki: s.karki })));
  const X = f => r0.l + r0.x0 + f * (r0.x1 - r0.x0);
  let paras = null;
  for (let f = .03; f < .97; f += .001) {
    const d = Math.min(...k0.F.map(g => Math.abs(X(g) - X(f)))), s = Math.min(...sal0.map(q => Math.abs(r0.l + q.x - X(f)) - q.karki));
    if (s > 8 && (!paras || d > paras.d)) paras = { f, d };
  }
  await p.mouse.click(X(paras.f), r0.y); await p.waitForTimeout(300);
  const n1 = await ankkuriX(r0);
  tulos('kirja: napautus portaiden väliin vie siihen kohtaan', Math.abs(n1.x - X(paras.f)) < 1.5, `napautus ${(paras.f * 100).toFixed(1)} %, lähin porras ${paras.d.toFixed(0)} px, ero ${(n1.x - X(paras.f)).toFixed(2)} px`);
  await p.evaluate(() => window.__luin.mene({ b: 0, o: 0 })); await p.waitForTimeout(200);
  await p.mouse.move(X(paras.f), r0.y); await p.mouse.down(); await p.mouse.move(X(paras.f) + 6, r0.y); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(300);
  const n2 = await ankkuriX(r0);
  tulos('kirja: 6 px:n heilahdus on napautus', Math.abs(n2.x - (X(paras.f) + 6)) < 1.5, `ero ${(n2.x - X(paras.f) - 6).toFixed(2)} px`);

  // 4. Napautus näkyvään kohdan salmiakkiin vie kohtaan, vaikka kohta ei ole porras.
  await p.evaluate(() => window.__luin.mene({ b: 0, o: 0 })); await p.waitForTimeout(200);
  const ks = (await p.evaluate(() => window.__luin.janaSalmiakit().map(s => ({ x: s.x, karki: s.karki, lvl: s.lvl, k: s.k.b + ':' + s.k.o })))).filter(s => s.lvl === 3)[1];
  const r1 = await jana();
  await p.mouse.click(r1.l + ks.x + ks.karki / 2, r1.y); await p.waitForTimeout(300);
  const n3 = await ankkuriX(r1);
  tulos('kirja: napautus kohdan salmiakkiin vie kohtaan', n3.k === ks.k, `kohta ${ks.k}, perillä ${n3.k}`);

  // 5. Ilman otsikoita: alku, viimeinen sivu ja väliportaat.
  await avaa(ILMAN);
  const i = await portaat();
  console.log(`  ilman otsikoita: ${i.sivuja} sivua, portaat ${pros(i.F)} %`);
  tulos('ilman otsikoita: portaat säännön mukaan', i.sama && i.jaot.length === 1 && i.suurin <= .25, 'odotus ' + pros(i.E) + ', suurin väli ' + (i.suurin * 100).toFixed(1) + ' %');

  // 6. Yläindeksit: Stephanus-sivut (osio) ovat portaita, kirjaimet (kohta) eivät.
  await avaa(VALTIO);
  const v = await portaat();
  console.log(`  valtio: ${v.sivuja} sivua, portaat ${pros(v.F)} %, kohtia ${v.kohtia}, vanhalla säännöllä pysäkkejä ${v.vanhat}`);
  tulos('valtio: osiot portaita, kohdat eivät', v.sama && v.kohtia === 25 && v.kohtaPortaat === 0, `portaita ${v.F.length}`);

  // 7. Kosketus (sähköpaperilla sormi tai kynä): veto portaille, napautus kohtaan.
  const kp = await (await b.newContext({ viewport: { width: 412, height: 824 }, hasTouch: true, isMobile: true })).newPage();
  kp.on('pageerror', e => sivuvirheet.push(e.message));
  const cdp = await kp.context().newCDPSession(kp);
  const kosk = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await kp.goto(BASE + 'luin.html');
  await kp.evaluate(md => {
    localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' }));
    localStorage.setItem('luin-asetukset', JSON.stringify({ av: 10, teema: 'vaalea', sivutus: 'sivut', sivuReuna: 1, sivuPyyhka: 0, sivunapit: 1, koko: 18, kokoKasin: 1 }));
  }, KIRJA);
  await kp.goto('about:blank'); await kp.goto(BASE + 'luin.html#tuo');
  await kp.waitForFunction(() => window.__luin && window.__luin.nyt() && document.querySelector('#teksti [data-b]'));
  await kp.waitForTimeout(600);
  if (await kp.evaluate(() => document.querySelector('#jana').hidden)) await kp.click('#ala-nappi');
  await kp.waitForTimeout(200);
  const kr = await kp.evaluate(() => { const b = document.querySelector('#jana-svg').getBoundingClientRect(), L = window.__luin, xr = L.janaRajat(b.width), n = L.nyt();
    const o = k => (n.cum[k.b] + k.o) / n.total;
    return { l: b.left, y: b.top + L.JANA.y, x0: xr[0], x1: xr[1], F: L.janaPysakit().map(m => b.left + xr[0] + o(m.k) * (xr[1] - xr[0])) }; });
  const kx0 = kr.l + kr.x0 + 2, kx1 = kr.l + kr.x1 - 2, kpaikat = [];
  await kosk('touchStart', kx0, kr.y); await kp.waitForTimeout(60);
  for (let i = 1; i <= 60; i++) {
    const x = kx0 + (kx1 - kx0) * i / 60;
    await kosk('touchMove', x, kr.y); await kp.waitForTimeout(40);
    if (x - kx0 >= 10) kpaikat.push(await kp.evaluate(() => { const g = document.querySelector('#j-veto'); return g && document.querySelector('#jana-svg').getBoundingClientRect().left + parseFloat(g.getAttribute('transform').slice(10)); }));
  }
  await kosk('touchEnd'); await kp.waitForTimeout(300);
  const kAnk = await kp.evaluate(r => { const L = window.__luin, n = L.nyt(), a = L.tila.ankkuri; return r.l + r.x0 + (n.cum[a.b] + a.o) / n.total * (r.x1 - r.x0); }, kr);
  tulos('kosketus: veto portaille', kpaikat.length > 0 && kpaikat.every(x => x !== null && kr.F.some(y => Math.abs(x - y) < .01)) && kr.F.some(y => Math.abs(y - kAnk) < .5),
    [...new Set(kpaikat.map(x => x && x.toFixed(1)))].length + ' eri paikkaa, irrotus ' + (kr.F.some(y => Math.abs(y - kAnk) < .5) ? 'portaalle' : 'EI portaalle'));
  await kp.evaluate(() => window.__luin.mene({ b: 0, o: 0 })); await kp.waitForTimeout(200);
  const kt = kr.l + kr.x0 + paras.f * (kr.x1 - kr.x0);
  await kosk('touchStart', kt, kr.y); await kp.waitForTimeout(80); await kosk('touchMove', kt + 4, kr.y); await kp.waitForTimeout(40); await kosk('touchEnd'); await kp.waitForTimeout(300);
  const kAnk2 = await kp.evaluate(r => { const L = window.__luin, n = L.nyt(), a = L.tila.ankkuri; return r.l + r.x0 + (n.cum[a.b] + a.o) / n.total * (r.x1 - r.x0); }, kr);
  tulos('kosketus: napautus kohtaan', Math.abs(kAnk2 - (kt + 4)) < 1.5, 'ero ' + (kAnk2 - kt - 4).toFixed(2) + ' px');

  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
