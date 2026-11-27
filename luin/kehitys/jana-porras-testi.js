// Sivutetun aikajanan vedon portaat ja napautus (luin.html janaPysakit(), janaKohde(); käyttäjän säännöt). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/jana-porras-testi.js
// Portaiden laki: porras on sivu, ja sivulla on yksi porras. Merkkipaalut ovat tekstin alku, luvut ja osiot (myös yläindeksien
// osiot); kohdat eivät ole portaita. Askel A on pienin kahden potenssi, jolla (N − 1) / A < 10 (kymmenkanta: veto
// ensimmäiseltä sivulta viimeiselle tekee alle kymmenen hyppyä). Merkkipaaluväli (viimeinen viimeiselle sivulle) jaetaan
// floor(väli / A) yhtä suureen osaan lähimmille sivuille. Lisäksi viimeinen sivu, kirjanmerkit, majakka ja voimassa oleva
// kohta, joista vain viimeinen sivu on välin pää. Merkkipaaluton kirja: 10 sivua joka sivu, 11 sivua joka toinen sivu.
// Samalla sivulla etusija: majakka, voimassa oleva kohta, merkkipaalu, kirjanmerkki, viimeinen sivu, väliporras.
// Veto (vähintään 10 px sivusuunnassa) pysähtyy vain portaille (ei salmiakkiosumaa) eikä kirjoita mitään, kun porras ei
// vaihdu; napautus vie mihin kohtaan tahansa, paitsi näkyvän salmiakin musteelle napautus vie salmiakin kohtaan (myös kohdan).
// Veto ja napautus sekä hiirellä että kosketuksella.
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
const ILMAN = m => '# Ilman otsikoita\n\n' + kpl(m) + '\n';
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
  // Portaat ja odotus lain mukaan. Sivu, jolle porras vie, mitataan siirtymällä sinne (mene()); voimassa oleva kohta palautetaan.
  const portaat = () => p.evaluate(() => {
    const L = window.__luin, n = L.nyt(), T = L.tila, N = T.sivuja, key = k => k.b + ':' + k.o;
    const o = k => Math.min(1, Math.max(0, (n.cum[k.b] + k.o) / n.total));
    const S = L.janaPysakit().map(m => ({ k: m.k, key: key(m.k) }));
    const a0 = Object.assign({}, T.ankkuri), ankkuriSivu = T.sivu, sivu = k => { L.mene(k); return T.sivu; };
    let A = 1;
    while ((N - 1) / A >= 10) A *= 2;
    const paalut = [0, Math.max(0, N - 1)];
    n.doc.toc.forEach(t => { if (t.lvl <= 2) paalut.push(sivu({ b: t.b, o: 0 })); });
    (n.kohdat || []).forEach(y => { if (y.lvl <= 2) paalut.push(sivu(y.k)); });
    const P = [...new Set(paalut)].sort((a, b) => a - b), E = new Set(P), jaot = [];
    for (let i = 1; i < P.length; i++) {
      const V = P[i] - P[i - 1], m = Math.max(1, Math.floor(V / A));
      if (m > 1) jaot.push(V + ' s. → ' + m);
      for (let j = 1; j < m; j++) E.add(P[i - 1] + Math.round(V * j / m));
    }
    if (N > 1) E.add(N - 1);
    E.add(ankkuriSivu);
    n.merk.km.forEach(k => { if (!k.orpo) E.add(sivu(k)); });
    if (L.majakka()) E.add(sivu(L.majakka().k));
    const sivut = S.map(s => sivu(s.k));
    // Kohta, joka on samassa kohdassa kuin osio (Stephanus-sivun ensimmäinen kirjain), on osion porras.
    const osiot = new Set(n.doc.toc.filter(t => t.lvl <= 2).map(t => t.b + ':0').concat((n.kohdat || []).filter(y => y.lvl <= 2).map(y => key(y.k))));
    const kohdat = new Set(n.doc.toc.filter(t => t.lvl >= 3).map(t => t.b + ':0').concat((n.kohdat || []).filter(y => y.lvl >= 3).map(y => key(y.k)))
      .filter(x => !osiot.has(x)));
    const kohtaPortaat = S.filter((s, i) => kohdat.has(s.key) && s.key !== key(L.sivunAlku(sivut[i]))).length;
    L.mene(a0);
    const Es = [...E].sort((a, b) => a - b), Ss = sivut.slice().sort((a, b) => a - b);
    return { N, A, F: S.map(s => o(s.k)).sort((a, b) => a - b), E: Es, sivut: Ss, jaot, kohtaPortaat, kohtia: kohdat.size,
      yksi: new Set(sivut).size === sivut.length, sama: Es.length === Ss.length && Es.every((x, i) => x === Ss[i]) };
  });
  const sivulista = A => A.map(x => x + 1).join(' ');
  const jana = () => p.evaluate(() => { const b = document.querySelector('#jana-svg').getBoundingClientRect(), L = window.__luin, xr = L.janaRajat(b.width);
    return { l: b.left, y: b.top + L.JANA.y, x0: xr[0], x1: xr[1] }; });
  const ankkuriX = r => p.evaluate(r => { const L = window.__luin, n = L.nyt(), a = L.tila.ankkuri;
    return { k: a.b + ':' + a.o, x: r.l + r.x0 + (n.cum[a.b] + a.o) / n.total * (r.x1 - r.x0) }; }, r);

  // 1. Kirja: luku- ja osiotason portaat, väliportaat.
  await avaa(KIRJA);
  const k = await portaat();
  console.log(`  kirja: ${k.N} sivua, askel ${k.A}, portaat sivuilla ${sivulista(k.sivut)}, jaot ${k.jaot.join(', ')}; kohtia ${k.kohtia}`);
  tulos('kirja: portaat lain mukaan', k.sama, 'odotus ' + sivulista(k.E));
  tulos('kirja: yksi porras sivua kohden', k.yksi);
  tulos('kirja: kohdat eivät ole portaita', k.kohtia > 0 && k.kohtaPortaat === 0, `kohtia ${k.kohtia}, portaina ${k.kohtaPortaat}`);
  tulos('kirja: väli jaettu', k.jaot.length > 0, k.jaot.join(', '));

  // Kirjanmerkki luvun 4 sivulla: sivun porras on luku (merkkipaalu ennen kirjanmerkkiä), ja portaiden sivut pysyvät.
  const km = await p.evaluate(() => {
    const L = window.__luin, n = L.nyt(), t = n.doc.toc.find(t => /^4\./.test(t.text)), b = t.b + 2;
    L.mene({ b: t.b, o: 0 }); const s1 = L.tila.sivu; L.mene({ b, o: 0 }); const s2 = L.tila.sivu; L.mene({ b: 0, o: 0 });
    n.merk.km.push({ id: 'testikm', b, o: 0, s: n.txt[b].slice(0, 40), t: 1, osio: t.text });
    const P = L.janaPysakit().filter(m => m.sivu === s1);
    return { samalla: s1 === s2, luku: t.b + ':0', porras: P.map(m => m.k.b + ':' + m.k.o).join(), n: P.length };
  });
  await p.waitForTimeout(200);
  const kmP = await portaat();
  tulos('kirja: kirjanmerkki luvun sivulla, porras on luku', km.samalla && km.n === 1 && km.porras === km.luku && kmP.sama && kmP.sivut.join() === k.sivut.join(),
    `luku ${km.luku}, sivun porras ${km.porras}, portaat ${sivulista(kmP.sivut)}`);

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
  const lappu = await p.evaluate(() => document.querySelector('#jana-pros').textContent);
  await p.mouse.up(); await p.waitForTimeout(300);
  const lappuOk = lappu === (await p.evaluate(() => (window.__luin.tila.sivu + 1) + ' / ' + window.__luin.tila.sivuja));
  const vain = paikat.every(x => portaatX.some(y => Math.abs(x - y) < .01));
  const kohtaSal = salmiakit.filter(s => s.lvl === 3), ohiKohdista = paikat.every(x => !kohtaSal.some(s => Math.abs(r.l + s.x - x) < .01 && !portaatX.some(y => Math.abs(y - x) < .01)));
  const eri = [...new Set(paikat.map(x => x.toFixed(2)))].length;
  const perilla = await ankkuriX(r);
  tulos('kirja: veto pysähtyy vain portaille', vain && ohiKohdista && kohtaSal.length > 0, `${eri} eri paikkaa ${askelia} askeleella, portaita ${k.F.length}, näkyviä kohtasalmiakkeja ${kohtaSal.length}`);
  tulos('kirja: veto ei kirjoita, kun porras ei vaihdu', turhat === 0, `porras vaihtui ${vaihdot} kertaa, turhia kirjoituksia ${turhat}, muutoksia yhteensä ${muutoksia}`);
  tulos('kirja: irrotus portaalle', portaatX.some(y => Math.abs(y - perilla.x) < .5), 'perillä ' + perilla.k);
  await p.evaluate(() => window.__luin.mene({ b: 0, o: 0 })); await p.waitForTimeout(200);
  await p.mouse.move(x0, r.y); await p.mouse.down();
  for (let i = 1; i <= 40; i++) { await p.mouse.move(x0 + (x1 - x0) * .55 * i / 40, r.y); await p.waitForTimeout(30); }
  const lappu2 = await p.evaluate(() => document.querySelector('#jana-pros').textContent);
  await p.mouse.up(); await p.waitForTimeout(300);
  const sivu2 = await p.evaluate(() => (window.__luin.tila.sivu + 1) + ' / ' + window.__luin.tila.sivuja);
  tulos('kirja: vedon sivunumero on irrotuksen sivu', lappuOk && lappu2 === sivu2, `loppu ${lappu}, keskellä ${lappu2} → ${sivu2}`);

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

  // 5. Merkkipaaluton kirja: 10 sivua joka sivu, 11 sivua joka toinen, 21 sivua joka neljäs. Kappalemäärä haetaan
  // sivumäärän mukaan. Voimassa oleva kohta tulee portaaksi muuttamatta väliportaita.
  const loyda = async N => {
    let m = Math.round(N * 3.5);
    for (let t = 0; t < 16; t++) { await avaa(ILMAN(m)); const s = await p.evaluate(() => window.__luin.tila.sivuja); if (s === N) return m; m += s < N ? 1 : -1; }
    return null;
  };
  for (const N of [5, 10, 11, 12, 20, 21]) {
    const m = await loyda(N);
    if (m === null) { tulos(`ilman otsikoita ${N} sivua: tekstiä ei löytynyt`, false); continue; }
    const i = await portaat();
    console.log(`  ilman otsikoita: ${m} kappaletta, ${i.N} sivua, askel ${i.A}, portaat sivuilla ${sivulista(i.sivut)}`);
    const odotus = { 5: '1 2 3 4 5', 10: '1 2 3 4 5 6 7 8 9 10', 11: '1 3 5 7 9 11', 12: '1 3 5 8 10 12',
      20: '1 3 5 7 9 12 14 16 18 20', 21: '1 5 9 13 17 21' }[N];
    tulos(`ilman otsikoita ${N} sivua`, i.sama && i.yksi && sivulista(i.sivut) === odotus, 'odotus ' + odotus);
    if (N === 12) {
      await p.evaluate(() => { const L = window.__luin; L.mene(L.sivunAlku(5)); }); await p.waitForTimeout(200);
      const h = await portaat();
      tulos('ilman otsikoita 12 sivua, sivulla 6: väliportaat ennallaan', h.sama && sivulista(h.sivut) === '1 3 5 6 8 10 12', 'portaat ' + sivulista(h.sivut));
    }
  }

  // 6. Yläindeksit: Stephanus-sivut (osio) ovat portaita, kirjaimet (kohta) eivät.
  await avaa(VALTIO);
  const v = await portaat();
  console.log(`  valtio: ${v.N} sivua, portaat sivuilla ${sivulista(v.sivut)}, kohtia ${v.kohtia}`);
  tulos('valtio: osiot portaita, kohdat eivät', v.sama && v.yksi && v.kohtia === 20 && v.kohtaPortaat === 0, `odotus ${sivulista(v.E)}; kohtia osioiden ulkopuolella ${v.kohtia}, portaina ${v.kohtaPortaat}`);

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
