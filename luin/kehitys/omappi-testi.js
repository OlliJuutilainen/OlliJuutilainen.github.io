// Ö-mappi ja kellarin kampihyllystön otsikon kampi. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/omappi-testi.js [kuvakansio]
// Tarkistaa: linkit (pinosta kellariin, kellarista ö-mappiin vain kun siellä on jotain), siirto ja palautus nimikkeen ja
// valittujen valikosta, ö-mapin tekstit eivät näy pinossa eikä kellarissa, lukijan paluumerkki, otsikon kammen napa
// samalla korkeudella perusviivasta kuin kellarilinkin kammen napa, Ö-mappiin-linkin rengas, alleviivaus ja nuoli.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { avaaOsa } = require('./porras-apu');
const JUURI = path.resolve(__dirname, '../..'), KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
});
let vik = 0; const t = (n, ok, x) => { if (!ok) vik++; console.log((ok ? 'OK   ' : 'VIKA ') + n + (x ? ' – ' + x : '')); };
(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })).newPage();
  const virheet = []; page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate(() => {
    localStorage.clear();
    const lista = [];
    [['a', 'Ensimmäinen', { luettu: 3 }], ['b', 'Toinen', { luettu: 2 }], ['c', 'Pinossa', {}]].forEach(([id, ot, l], i) => {
      localStorage.setItem('luin-teksti:p-' + id, JSON.stringify('# ' + ot + '\n\nTeksti.\n'));
      lista.push(Object.assign({ id: 'p-' + id, title: ot, added: 1000 + i, src: 'paikallinen', ala: '' }, l));
    });
    localStorage.setItem('luin-lista', JSON.stringify(lista));
  });
  await page.reload(); await page.waitForTimeout(300);
  t('pino: kellarilinkki näkyy', await page.isVisible('#ark-linkki') && (await page.textContent('#ark-linkki')) === 'kellarin kampihyllystöön');
  t('pino: ö-linkki piilossa', !(await page.isVisible('#om-linkki')));
  if (KUVAT) await page.locator('#ark-linkki').screenshot({ path: KUVAT + '/linkki.png' });
  // Merkin keskikohdan (kammessa napa, viewBoxin y .953 / 2) korkeus perusviivasta.
  const napa = (sel, f = .953 / 2) => page.evaluate(([sel, f]) => {
    const s = document.querySelector(sel), el = s.parentNode, pr = document.createElement('span');
    pr.style.cssText = 'display:inline-block;width:0;height:0'; el.appendChild(pr);
    const bl = pr.getBoundingClientRect().bottom; pr.remove(); const r = s.getBoundingClientRect();
    return (bl - (r.top + r.height * f)) / parseFloat(getComputedStyle(el).fontSize);
  }, [sel, f]);
  // Napat em:inä omasta kirjasinkoostaan (21.11.2026: kellarilinkki .64rem, otsikko .74rem; ennen samat, joten px riitti).
  // Toleranssi .3 px otsikon koossa.
  const EMTOL = .3 / 11.84, emx = x => (x * 11.84).toFixed(2);
  // Rako: merkin vasen reuna viimeisen kirjaimen musteesta (Range-laatikko ilman loppuharvennusta).
  const rako = (sel) => page.evaluate(sel => {
    const s = document.querySelector(sel), tn = s.parentNode.firstChild, rg = document.createRange();
    rg.setStart(tn, tn.length - 1); rg.setEnd(tn, tn.length);
    const ls = parseFloat(getComputedStyle(s.parentNode).letterSpacing);
    return { px: s.getBoundingClientRect().left - (rg.getBoundingClientRect().right - ls), em: parseFloat(getComputedStyle(s).fontSize) };
  }, sel);
  // Vertailukohta: kellarilinkin kammen napa versaalien keskellä .64rem:n koossa (mitattu ö-mapin entisestä paluulinkistä, jossa oli
  // sama kampi peilattuna; paluulinkki on nyt symboli ja teksti, joten luku on vakio).
  const linkinNapa = .3083;
  t('pino: otsikko', (await page.textContent('#lista-ots')) === 'Pino');
  const pNapa = await napa('h2.ots svg.pinom', .5), pRako = await rako('h2.ots svg.pinom');
  t('pinon otsikon pinomerkki versaalien keskellä', Math.abs(pNapa - linkinNapa) < EMTOL, emx(pNapa) + ' / ' + emx(linkinNapa) + ' px perusviivasta (11,84 px:n koossa)');
  t('pinomerkin rako 1 em', Math.abs(pRako.px / pRako.em - 1) < .02, (pRako.px / pRako.em).toFixed(3) + ' em');
  t('pinomerkki ei kasvata otsikkoriviä', (await page.evaluate(() => document.querySelector('.ots-rivi').getBoundingClientRect().height)) <= 31);
  if (KUVAT) await page.locator('.ots-rivi').screenshot({ path: KUVAT + '/otsikko-pino.png' });
  await page.click('#ark-linkki a'); await page.waitForTimeout(200);
  t('kellari: otsikko', (await page.textContent('#lista-ots')) === 'Kellarin kampihyllystö');
  t('kellari: ö-linkki piilossa (tyhjä)', !(await page.isVisible('#om-linkki')));
  if (KUVAT) await page.locator('.ots-rivi').screenshot({ path: KUVAT + '/otsikko.png' });
  const m = await page.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect();
    const k = r('h2.ots svg.kampi'), sp = r('h2.ots .ots-merkki');
    return { kTop: k.top - sp.top, kLeft: k.left - sp.right, kH: k.height, spH: sp.height, rivi: r('.ots-rivi').height, oikea: k.right, ruutu: innerWidth };
  });
  const otsNapa = await napa('h2.ots svg.kampi');
  t('otsikon kammen napa linkin kammen korkeudella', Math.abs(otsNapa - linkinNapa) < EMTOL, emx(otsNapa) + ' / ' + emx(linkinNapa) + ' px perusviivasta (11,84 px:n koossa)');
  t('kampi ei kasvata otsikkoriviä', m.rivi <= 31, m.rivi + ' px');
  const kRako = await rako('h2.ots svg.kampi');
  t('kammen rako 1 em', Math.abs(kRako.px / kRako.em - 1) < .02, (kRako.px / kRako.em).toFixed(3) + ' em');
  await page.click('#nimikkeet li.nimike >> nth=0 >> button.jako');
  const nap = await page.$$eval('#pop button', bs => bs.map(x => x.textContent));
  t('valikossa poiminta ja siirto', nap.includes('Poimi pinoon') && nap.includes('Ö-mappiin'), nap.slice(-4).join(' | '));
  if (KUVAT) await page.screenshot({ path: KUVAT + '/valikko.png' });
  await avaaOsa(page, 'omappi');
  await page.click('#pop button[data-k="omappi"]'); await page.click('#pop button[data-k="ok"]'); await page.waitForTimeout(150);
  t('siirron viesti', (await page.textContent('#viesti')) === 'Teksti siirtyi ö-mappiin.');
  t('kellarissa 1 nimike', (await page.$$('#nimikkeet li.nimike')).length === 1);
  t('kellari: ö-linkki näkyy', await page.isVisible('#om-linkki'));
  // Kellarin vasemmassa alakulmassa paluu pinoon (pinomerkki ja teksti) samalla rivillä kuin ö-mappiin, viivat samalla korkeudella.
  const pn = await page.evaluate(() => { const a = document.querySelector('#ark-pinoon a'), b = document.querySelector('#om-linkki a');
    return { nakyy: !document.getElementById('ark-pinoon').hidden, teksti: a.textContent, href: a.getAttribute('href'), viivat: a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom,
      vasen: a.getBoundingClientRect().left < innerWidth / 2, oikea: b.getBoundingClientRect().left > innerWidth / 2 }; });
  t('kellari: paluu pinoon vasemmalla, ö-mappiin oikealla, viivat samalla korkeudella', pn.nakyy && pn.teksti === 'pinoon' && pn.href === '#' && Math.abs(pn.viivat) < .05 && pn.vasen && pn.oikea, JSON.stringify(pn));
  // Ö-mappiin-linkki kuten kellarilinkki: kammen paikalla Ö-rengas, jonka litteästä pohjasta alleviivaus (reunaviiva) jatkuu
  // nuoleen. Renkaan laki versaalikorkeuden yläpuolella .2 px ja pohja alleviivauksen alareunassa; pohjan paksuus = alleviivaus;
  // svg kokonaisen pikselin korkuinen; ::before renkaan keskelle; nuoli viimeisen kirjaimen perässä; yhdysviiva versaalien ja
  // renkaan keskikohtien puolivälissä.
  const R = require('./orengas.js');
  const om = await page.evaluate(([CAP, YLI, KORK, L]) => {
    const a = document.querySelector('#om-linkki a'), ar = a.getBoundingClientRect(), sv = a.querySelector('svg.orengas'),
      em = parseFloat(getComputedStyle(a).fontSize), sp = a.querySelector(':scope > span'), s = em / 10.24;
    const pr = document.createElement('span'); pr.style.cssText = 'display:inline-block;width:0;height:0'; sp.appendChild(pr);
    const bl = pr.getBoundingClientRect().bottom; pr.remove();
    const rr = sv.getBoundingClientRect(), vb = sv.viewBox.baseVal, k = rr.height / vb.height, jalki = getComputedStyle(a, '::after'), bb = parseFloat(jalki.height), viivaAla = ar.bottom - parseFloat(jalki.bottom);
    // Alleviivaus on ::after-taustapalkki (ei reunaviiva): alareuna viivaAla.
    const ennen = getComputedStyle(a, '::before'), yv = a.querySelector('.oyv rect').getBoundingClientRect(), n = a.querySelector('svg.nuoli').getBoundingClientRect();
    // Viimeisen kirjaimen (span.vika, ei harvennusta) oikea muste: merkin alku + N:n musteen oikea reuna.
    const tn = sp.querySelector('.vika').firstChild, rg = document.createRange(); rg.setStart(tn, 0); rg.setEnd(tn, 1);
    const cs = getComputedStyle(a), cv = document.createElement('canvas').getContext('2d'); cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const muste = rg.getBoundingClientRect().left + cv.measureText('N').actualBoundingBoxRight;
    const keski = bl - (rr.bottom - KORK / 2 * k), ob = sv.getBBox(), okYla = rr.top + (ob.y - vb.y) * k, okAla = rr.top + (ob.y + ob.height - vb.y) * k;
    return { s, em, cap: CAP * s, laki: bl - (rr.bottom - KORK * k), pohja: rr.bottom - bl, reuna: viivaAla, svgAla: rr.bottom, bb,
      reunaVari: jalki.backgroundColor, korkeus: rr.height, rako: ar.left - rr.right,
      ennenVas: ar.left - parseFloat(ennen.width), keskus: rr.left + rr.width / 2, ennenAla: parseFloat(ennen.bottom),
      yv: { keski: bl - (yv.top + yv.bottom) / 2, paksu: yv.height, tavoite: keski },
      nuoli: { yli: n.right - ar.right, palsta: n.right - a.parentNode.getBoundingClientRect().right, musteYli: n.right - muste,
        keski: (n.top + n.bottom) / 2 - (viivaAla - bb / 2) }, teksti: a.getAttribute('aria-label') };
  }, [R.CAP, .2, R.LINKKI.kork, R.NUOLI.L]);
  t('rengas tekstin vasemmalla, rako .27 em', Math.abs(om.rako / om.em - .27) < .01, (om.rako / om.em).toFixed(3) + ' em');
  t('renkaan laki generaattorin mukaan', Math.abs(om.laki - (R.LINKKI.kork - R.ALA) * om.s) < .3, om.laki.toFixed(2) + ' / ' + om.cap.toFixed(2) + ' px');
  t('renkaan pohja alleviivauksen alareunassa', Math.abs(om.svgAla - om.reuna) < .01 && Math.abs(om.bb - om.s) < .01 && !/0\)$|transparent/.test(om.reunaVari), om.svgAla + ' / ' + om.reuna + ', ' + om.reunaVari);
  t('pohja ALA px perusviivan alla (4,86 px: nuolen sakarat perusviivan alle)', Math.abs(om.pohja - R.ALA * om.s) < .2, om.pohja.toFixed(2) + ' px');
  // Koko seuraa etusivun kellarilinkkiä (--kk-koko), joten pikselimitat ovat linkin koon mukaan (s = koko / 10,24 px).
  t('svg 24 px linkin 10,24 px:n koossa', Math.abs(om.korkeus - 24 * om.s) < .05, om.korkeus + ' px');
  t('alleviivaus jatkuu renkaan keskeltä', Math.abs(om.ennenVas - om.keskus) < .1 && Math.abs(om.ennenAla + om.s) < .01, (om.ennenVas - om.keskus).toFixed(2) + ' px');
  // Oma nuolen kärki: kärki .47 px varren pään yli ja palstan reunassa, ja se ylittää tekstin oikean musteen yhtä vähän kuin
  // kellarilinkin nuoli (käyttäjän pyyntö; kellarilinkissä mitattu .3 px), svg keskellä reunaviivaa.
  t('nuolen kärki palstan reunassa, .47 px varren yli (10,24 px:n koossa)', Math.abs(om.nuoli.yli - .47 * om.s) < .2 && Math.abs(om.nuoli.palsta) < .1, JSON.stringify(om.nuoli));
  t('nuolen kärki ylittää musteen vähän (0–1 px)', om.nuoli.musteYli >= 0 && om.nuoli.musteYli <= 1, om.nuoli.musteYli.toFixed(2) + ' px');
  t('nuolen kärki keskellä alleviivausta', Math.abs(om.nuoli.keski) < .05, om.nuoli.keski.toFixed(3) + ' px');
  // Selaimen suurennettu tekstikoko (vain teksti kasvaa, px ei): rengas, alleviivaus ja nuoli kasvavat yhdessä (mitat em:einä).
  for (const kerroin of [1.3, 1.8]) {
    const sk = await page.evaluate((kerroin) => {
      document.documentElement.style.fontSize = 16 * kerroin + 'px';
      const a = document.querySelector('#om-linkki a'), ar = a.getBoundingClientRect(), j = getComputedStyle(a, '::after');
      const ala = ar.bottom - parseFloat(j.bottom), pk = parseFloat(j.height), rr = a.querySelector('svg.orengas').getBoundingClientRect(), n = a.querySelector('svg.nuoli').getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(a).fontSize);
      document.documentElement.style.fontSize = '';
      return { pohja: rr.bottom - ala, keski: (n.top + n.bottom) / 2 - (ala - pk / 2), paksuus: pk / fs * 10.24, nuoli: n.height / fs * 10.24 };
    }, kerroin);
    t('tekstikoko ×' + kerroin + ': renkaan pohja ja nuoli alleviivauksella, mitat tekstin mukana', Math.abs(sk.pohja) < .02 && Math.abs(sk.keski) < .05 &&
      Math.abs(sk.paksuus - 1) < .01 && Math.abs(sk.nuoli - 9) < .02, JSON.stringify(sk));
  }
  // Yhdysviiva renkaan korkeuden keskellä (käyttäjän valinta: iso Ö).
  t('yhdysviiva renkaan korkeuden keskellä, 1 px', Math.abs(om.yv.keski - om.yv.tavoite) < .15 && Math.abs(om.yv.paksu - om.s) < .05,
    om.yv.keski.toFixed(2) + ' / ' + om.yv.tavoite.toFixed(2) + ' px, ' + om.yv.paksu.toFixed(2) + ' px');
  t('nimi illatiivissa', om.teksti === 'ö-mappiin' && (await page.textContent('#om-linkki a')) === 'mappiin', om.teksti);
  if (KUVAT) await page.locator('#om-linkki').screenshot({ path: KUVAT + '/om-linkki.png' });
  if (KUVAT) await page.screenshot({ path: KUVAT + '/kellari.png', fullPage: true });
  await page.click('#om-linkki a'); await page.waitForTimeout(200);
  t('ö-mappi: hash', page.url().endsWith('#omappi'));
  t('ö-mappi: otsikko Mappi ö', (await page.textContent('#lista-ots')) === 'Mappi ' && (await page.getAttribute('#lista-ots', 'aria-label')) === 'Mappi ö');
  t('ö-mappi: 1 nimike', (await page.$$('#nimikkeet li.nimike')).length === 1);
  t('ö-mappi: linkit piilossa', !(await page.isVisible('#om-linkki')) && !(await page.isVisible('#ark-linkki')) && !(await page.isVisible('#jarj-rivi')));
  t('ö-mappi: ei Takaisin pinoon -tekstiä eikä pinomerkkiä', !(await page.isVisible('#ark-takaisin')) && !(await page.isVisible('#ark-koti')));
  // Otsikon ö mappirenkaana kirjaimena: runko 1,43 × versaali-O, alakaaren sisäreuna .9 px perusviivan alla.
  const oM = await page.evaluate(KORK => {
    const h = document.querySelector('#lista-ots'), r = [...h.querySelectorAll('svg.orengas')];
    const pr = document.createElement('span'); pr.style.cssText = 'display:inline-block;width:0;height:0'; h.appendChild(pr);
    const bl = pr.getBoundingClientRect().bottom; pr.remove();
    const q = r[0].getBoundingClientRect(), k = q.height / r[0].viewBox.baseVal.height;
    return { n: r.length, k, pohja: q.bottom - bl, laki: bl - (q.bottom - KORK * k) };
  }, R.OTS.kork);
  t('ö-mappi: otsikon ö mappirenkaana', oM.n === 1, JSON.stringify(oM));
  t('ö-mappi: renkaan runko 1,43 × versaali-O, alakaaren sisäreuna .9 px perusviivan alla', Math.abs(oM.pohja - R.OTS.tb * oM.k - .9) < .1 && Math.abs(oM.laki + oM.pohja - 1.43 * (R.OCAP + .3)) < .3, oM.pohja.toFixed(2) + ' / ' + oM.laki.toFixed(2) + ' px');
  t('ö-mappi: rengas ei kasvata otsikkoriviä', (await page.evaluate(() => document.querySelector('.ots-rivi').getBoundingClientRect().height)) <= 31);
  if (KUVAT) await page.locator('.ots-rivi').screenshot({ path: KUVAT + '/otsikko-omappi.png' });
  // Peilattu kellarilinkki vasemmassa alakulmassa: nuoli vasemmalla, kampi tekstin oikealla puolella.
  t('ö-mappi: paluulinkki näkyy', await page.isVisible('#ark-paluu') && (await page.textContent('#ark-paluu')) === 'kellarin kampihyllystöön');
  // Paluu ö-mapista (käyttäjän design): kellarilinkki peilattuna, nuoli vasemmalle ja kampi tekstin oikealla.
  const pl = await page.evaluate(() => {
    const a = document.querySelector('#ark-paluu a').getBoundingClientRect(), v = document.querySelector('#ark-paluu svg.veivi'),
      n = document.querySelector('#ark-paluu svg.nuoli').getBoundingClientRect(), sis = document.querySelector('#ark-paluu').getBoundingClientRect();
    return { vasen: a.left - sis.left, nuoli: n.left - a.left, kampi: v.getBoundingClientRect().left - a.right, peili: getComputedStyle(v).transform };
  });
  t('ö-mappi: paluulinkki peilattu', Math.abs(pl.vasen) < 1 && pl.nuoli < 1 && pl.kampi > 0 && /^matrix\(-1, 0, 0, 1/.test(pl.peili), JSON.stringify(pl));
  if (KUVAT) await page.screenshot({ path: KUVAT + '/omappi.png', fullPage: true });
  await page.click('#valitse-kaikki'); await page.click('#val-valikko');
  const v = await page.$$eval('#pop .p-ali[data-ali="luin"] button[data-k]:not(.p-takaisin)', bs => bs.map(x => x.textContent));
  t('valittujen valikko ö-mapissa', v.includes('Poimi kellarin kampihyllystöön') && !v.some(x => /kampihyllystöstä|Luin\./.test(x)), v.join(' | '));
  t('pino ei näytä ö-mappia', await page.evaluate(() => { location.hash = ''; return new Promise(r => setTimeout(() => r(document.querySelectorAll('#nimikkeet li.nimike').length === 1), 200)); }));
  await page.goto(U + 'luin.html#id=p-a'); await page.waitForTimeout(400);
  t('lukijan paluu ö-mappiin', (await page.getAttribute('.takaisin', 'href')) === '#omappi');
  await page.goto(U + 'luin.html#omappi'); await page.waitForTimeout(200);
  await page.click('#nimikkeet li.nimike >> nth=0 >> button.jako');
  await avaaOsa(page, 'omappi');
  await page.click('#pop button[data-k="omappi"]'); await page.click('#pop button[data-k="ok"]'); await page.waitForTimeout(150);
  t('palautus', (await page.textContent('#viesti')) === 'Teksti palasi kellarin kampihyllystöön.' && (await page.$$('#nimikkeet li.nimike')).length === 0);
  await page.goto(U + 'luin.html#arkisto'); await page.waitForTimeout(200);
  t('kellarissa taas 2', (await page.$$('#nimikkeet li.nimike')).length === 2);
  await page.click('#valitse-kaikki'); await page.click('#val-valikko');
  const v2 = await page.$$eval('#pop .p-ali[data-ali="luin"] button[data-k]:not(.p-takaisin)', bs => bs.map(x => x.textContent));
  t('valittujen valikko kellarissa', v2.includes('Ö-mappiin') && v2.includes('Poimi pinoon'), v2.join(' | '));
  t('ei sivuvirheitä', !virheet.length, virheet.join('; '));
  await b.close(); palvelin.close(); process.exit(vik ? 1 : 0);
})();
