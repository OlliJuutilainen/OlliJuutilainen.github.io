// Tuettujen sivustojen sivun haku ja korit (luin/sivustot.html). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sivustot-testi.js [kuvakansio]
// Tarkistaa: kaikki sivustot alussa; korit mukaan (tai saman rivin sisällä, ja rivien välillä), pois karsii pääkorin tai
// pääkielen; tyhjät kirjainryhmät piiloon ja kirjain himmeäksi; haku tarkkeetta; tyhjennä; kirjainhyppy; 360 px ilman
// vaakavieritystä ja suodatus alle 400 px (supistettuna alle 200 px; rivit aihe, laji ja kieli supistettuina, nimi avaa, supistettuna
// näkyvät vain valitut korit); ilman skriptiä lista sellaisenaan. Otsikkohaku: luettelo ladataan vasta haettaessa,
// Gutenberg sen jälkeen, osoitteet purkautuvat (slug ja etuliite), korit rajaavat osumia, alle kolme kirjainta piilottaa osumat.
// Osumat sivustoittain: yksi rivi sivustoa kohden (nimi ja määrä), napautus avaa ja sulkee, näytä lisää, ainoa ryhmä auki.
// Haku-rivi: tekijä mukaan tai pois, asiasana. Supersalmiakki kieli-rivin alla kuten kori (mukaan, pois, ennalleen; myös
// otsikko-osumat; rivinimien tekstit ja salmiakki oikealle tasattuina; himmeä ilman sertifioituja; selite pelkkää tekstiä). Hakukieli: lainausmerkit, OR, NOT ja sulut. Korien nimet (uskonto, L&L = Laki & Lääketiede, yleiset, fennomaanit) ja Problemoksen
// alkukieliset otsikot.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const JUURI = path.resolve(__dirname, '../..'), ULOS = process.argv[2];
const palvelin = http.createServer((q, r) => { const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8' }[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
let viat = 0; const t = (n, ok, x) => { if (!ok) viat++; console.log((ok ? 'OK   ' : 'VIKA ') + n + (x ? ' – ' + x : '')); };
(async () => {
  await new Promise(r => palvelin.listen(0, r)); const U = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch(), virheet = [];
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage();
  page.on('pageerror', e => virheet.push(e.message));
  let luettelo = 0, gutenberg = 0, pohjola = 0;
  page.on('request', r => { if (r.url().endsWith('/hakemisto/otsikot.txt')) luettelo++; if (r.url().endsWith('/hakemisto/otsikot-gutenberg.txt')) gutenberg++;
    if (r.url().endsWith('/hakemisto/otsikot-pohjola.txt')) pohjola++; });
  await page.goto(U + 'luin/sivustot.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  const nak = () => page.$$eval('ul.sivustot li:not([hidden])', l => l.length);
  const nimet = () => page.$$eval('ul.sivustot li:not([hidden]) > a:first-of-type', l => l.map(x => x.textContent.trim()));
  // Koririvit aihe, laji ja kieli ovat supistettuina: nappi() avaa rivin ensin.
  const rivi = f => page.click('button.ots[aria-controls="kk-' + f + '"]');
  const auki = f => page.getAttribute('button.ots[aria-controls="kk-' + f + '"]', 'aria-expanded').then(x => x === 'true');
  const nappi = async (f, v) => { if (f !== 'kentta' && !(await auki(f))) await rivi(f); await page.click('button.kori[data-f="' + f + '"][data-v="' + v + '"]'); };
  const kaikki = await page.$$eval('ul.sivustot li', l => l.length);
  t('alussa kaikki näkyvissä', await nak() === kaikki, String(kaikki));
  const m = await page.evaluate(() => { const r = document.getElementById('suodatus').getBoundingClientRect(); return { korkeus: Math.round(r.height), vaaka: document.documentElement.scrollWidth - innerWidth }; });
  // Raja: haku, neljä riviä, supersalmiakin rivi (30 px) ja tilarivi.
  t('360 px: supistettu suodatus matala, ei vaakavieritystä', m.korkeus < 235 && !m.vaaka, JSON.stringify(m));
  const nakyvatKorit = f => page.$$eval('button.kori[data-f="' + f + '"]', l => l.filter(b => b.getClientRects().length).length);
  t('aihe, laji ja kieli supistettuina, haku auki', !(await auki('aihe')) && !(await auki('laji')) && !(await auki('kieli')) &&
    await nakyvatKorit('aihe') + await nakyvatKorit('laji') + await nakyvatKorit('kieli') === 0 && await nakyvatKorit('kentta') === 3);
  await rivi('aihe');
  const aiheKorit = await page.$$eval('button.kori[data-f="aihe"]', l => l.length);
  t('rivin nimi avaa rivin', await auki('aihe') && await nakyvatKorit('aihe') === aiheKorit && await nakyvatKorit('laji') === 0, String(aiheKorit));
  const m2 = await page.evaluate(() => { const r = document.getElementById('suodatus').getBoundingClientRect(); return { korkeus: Math.round(r.height), vaaka: document.documentElement.scrollWidth - innerWidth }; });
  await rivi('laji'); await rivi('kieli');
  const m3 = await page.evaluate(() => { const r = document.getElementById('suodatus').getBoundingClientRect(); return { korkeus: Math.round(r.height), vaaka: document.documentElement.scrollWidth - innerWidth }; });
  t('360 px: kaikki auki alle 400 px, ei vaakavieritystä', m3.korkeus < 400 && !m3.vaaka && m2.korkeus < m3.korkeus, JSON.stringify([m2, m3]));
  await rivi('laji'); await rivi('kieli'); await rivi('aihe');

  await nappi('aihe', 'filosofia');
  const filo = await nak(); t('filosofia mukaan', filo === 31, String(filo));
  await nappi('laji', 'alkuteksti'); await nappi('laji', 'kirjeet');
  t('filosofia × alkuteksti/kirjeet = 13', await nak() === 13, String(await nak()));
  await rivi('aihe'); await rivi('laji');
  t('supistetulla rivillä vain valitut korit', await nakyvatKorit('aihe') === 1 && await nakyvatKorit('laji') === 2 &&
    await page.isVisible('button.kori[data-f="aihe"][data-v="filosofia"]') && await nak() === 13);
  await page.click('button.kori[data-f="aihe"][data-v="filosofia"]');
  t('valitun korin napautus supistetulla rivillä vaihtaa tilan', await page.getAttribute('button.kori[data-f="aihe"][data-v="filosofia"]', 'data-tila') === 'pois' &&
    await nakyvatKorit('aihe') === 1);
  await page.click('button.kori[data-f="aihe"][data-v="filosofia"]');
  t('ennalleen palautettu kori katoaa supistetulta riviltä', await nakyvatKorit('aihe') === 0 && !(await auki('aihe')));
  await nappi('aihe', 'filosofia');
  t('tyhjät kirjainryhmät piilossa ja kirjain himmeä', await page.evaluate(() => { const h = [...document.querySelectorAll('h2.kirjain')]; const piilo = h.filter(x => x.hidden);
    return piilo.length > 0 && piilo.every(x => document.querySelector('nav.aakkoset a[href="#' + x.id + '"]').classList.contains('tyhja')); }));
  await page.click('#s-tyhjenna');
  t('tyhjennä palauttaa kaikki', await nak() === kaikki);
  await nappi('kieli', 'englanti'); await nappi('kieli', 'englanti');
  const eiEn = await nak(); t('englanti pois (pääkieli) jättää muut', eiEn > 30 && eiEn < kaikki, String(eiEn));
  t('Perseus jää (pääkieli kreikka)', (await nimet()).includes('Perseus Digital Library'));
  await page.click('#s-tyhjenna');
  await page.fill('#s-haku', 'nagarjuna'); await page.waitForTimeout(50);
  t('haku nagarjuna (tarkkeeton) löytää GRETILin', (await nimet()).join('|').includes('GRETIL'), (await nimet()).join(' | '));
  await page.fill('#s-haku', 'liettua'); await page.waitForTimeout(50);
  const lt = await nimet(); t('haku liettua: Wikipedia muilla kielillä mukana', lt.some(x => /Wikipedia/.test(x)) || (await page.$$eval('ul.sivustot li:not([hidden])', l => l.some(x => /Wikipedia muilla/.test(x.textContent)))), lt.join(' | '));
  await page.fill('#s-haku', 'kant'); await page.waitForTimeout(50);
  t('haku kant', (await nimet()).length >= 2, (await nimet()).join(' | '));
  await page.click('#s-tyhjenna');
  t('hakukenttä tyhjenee', await page.inputValue('#s-haku') === '' && await nak() === kaikki);
  // Supersalmiakki: pelkkä salmiakki kieli-rivin alla, toimii kuten kori.
  const superNimet = await page.$$eval('ul.sivustot li', l => l.filter(x => x.querySelector('.super')).map(x => x.querySelector('a').textContent.trim()));
  const superFilo = await page.$$eval('ul.sivustot li', l => l.filter(x => x.querySelector('.super') && x.dataset.aihe.split(',').includes('filosofia')).length);
  const sm = () => page.$eval('button.salmiakki', b => b.getAttribute('aria-pressed') + ' ' + (b.getAttribute('data-tila') || '') + ' ' + b.classList.contains('nolla'));
  // Väri: lepotilassa haalea ruoste, mukaan täysi ruoste, pois harmaa (käyttäjän päätös).
  const smVari = () => page.$eval('button.salmiakki', b => { const v = n => { const e = document.createElement('i'); e.style.color = 'var(' + n + ')'; document.body.appendChild(e);
    const c = getComputedStyle(e).color; e.remove(); return c; }; const c = getComputedStyle(b).color;
    return c === v('--ruoste-haalea') ? 'haalea' : c === v('--ruoste') ? 'ruoste' : c === v('--harmaa') ? 'harmaa' : c === v('--viiva') ? 'viiva' : c; });
  t('supersalmiakki lepotilassa haalea ruoste', await smVari() === 'haalea', await smVari());
  t('supersalmiakki: oma rivi kieli-rivin alla, ei tekstiä, selitteessä ei nappia', await page.evaluate(() => {
    const b = document.querySelector('button.salmiakki'), r = b && b.closest('.krivi');
    return !!r && r.previousElementSibling.querySelector('button.ots[aria-controls="kk-kieli"]') !== null && r.children.length === 1 &&
      b.textContent.trim() === '' && !!b.querySelector('svg') && !document.querySelector('.selite button'); }));
  // Rivinimien tekstit ja salmiakki tasattuina oikealle: musteen oikea reuna kuvasta (rivin alue, korien vasemmalla puolella),
  // kulmat piilotettuina, koska ne riippuvat tekstin jälkeen eivätkä kuulu tasaukseen.
  const musteReunat = async () => {
    const a = await page.evaluate(() => { const s = document.getElementById('suodatus').getBoundingClientRect();
      return { x: s.left, y: s.top + scrollY, w: document.querySelector('#suodatus .krivi .kk').getBoundingClientRect().left - s.left - 1,
        rivit: [...document.querySelectorAll('#suodatus .krivi')].map(k => { const r = k.firstElementChild.getBoundingClientRect(); return [r.top - s.top - 3, r.bottom - s.top + 3]; }),
        tausta: getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number) }; });
    const h = a.rivit[a.rivit.length - 1][1];
    const piilo = await page.addStyleTag({ content: '.krivi button.ots::after { visibility: hidden !important; }' });
    const kuva = (await page.screenshot({ clip: { x: a.x, y: a.y, width: a.w, height: h }, fullPage: true })).toString('base64');
    await piilo.evaluate(x => x.remove());
    return page.evaluate(async ({ kuva, a, h }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + kuva; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data, D = img.width / a.w;
      return a.rivit.map(([y0, y1]) => { let o = -1;
        for (let y = Math.max(0, Math.round(y0 * D)); y < Math.min(img.height, Math.round(y1 * D)); y++) for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4; if (Math.abs(d[i] - a.tausta[0]) + Math.abs(d[i + 1] - a.tausta[1]) + Math.abs(d[i + 2] - a.tausta[2]) > 90) o = Math.max(o, x); }
        return (o + 1) / D; });
    }, { kuva, a, h });
  };
  const reunat = await musteReunat();
  t('rivinimien tekstit ja salmiakki: musteen oikeat reunat tasan (enintään 0,5 px)', reunat.length === 5 && Math.max(...reunat) - Math.min(...reunat) <= .5, reunat.join(' '));
  t('korit alkavat kaikilla riveillä samasta x:stä (haku-rivin otsikko kulmien oikealla)', await page.evaluate(() => {
    const x = [...document.querySelectorAll('#suodatus .krivi .kk')].map(k => k.getBoundingClientRect().left);
    const kulma = Math.max(...[...document.querySelectorAll('#suodatus .krivi button.ots')].map(b => b.getBoundingClientRect().right));
    return x.length === 4 && x.every(v => v === x[0]) && kulma + 2 < x[0]; }));
  await page.click('button.salmiakki');
  t('supersalmiakki mukaan: vain sertifioidut', JSON.stringify(await nimet()) === JSON.stringify(superNimet) && superNimet.length >= 6 && await sm() === 'true mukaan false',
    (await nimet()).join(' | ') + ' / ' + await sm());
  t('supersalmiakki mukaan: täysi ruoste', await smVari() === 'ruoste', await smVari());
  t('supersalmiakki: tilarivi ja tyhjennä', await page.textContent('#s-nakyy') === 'sivustoja näkyvissä ' + superNimet.length + ' / ' + kaikki && await page.isVisible('#s-tyhjenna'));
  t('supersalmiakki: korin luku seuraa', Number(await page.textContent('button.kori[data-f="aihe"][data-v="filosofia"] .n')) === superFilo);
  await nappi('aihe', 'filosofia');
  t('supersalmiakki × filosofia', await nak() === superFilo, String(await nak()));
  await nappi('aihe', 'filosofia'); await nappi('aihe', 'filosofia');
  await page.click('button.salmiakki');
  t('supersalmiakki pois: harmaa', await smVari() === 'harmaa', await smVari());
  t('supersalmiakki pois: ei sertifioituja', await nak() === kaikki - superNimet.length && !(await nimet()).some(x => superNimet.includes(x)) && await sm() === 'mixed pois false', await sm());
  await page.click('button.salmiakki');
  t('supersalmiakki: kolmas napautus palauttaa', await nak() === kaikki && await sm() === 'false  false');
  await nappi('kieli', 'saksa');
  t('supersalmiakki himmeä, kun sertifioituja ei näy', await sm() === 'false  true');
  await page.click('button.salmiakki'); await page.click('#s-tyhjenna');
  t('tyhjennä nollaa supersalmiakin', await nak() === kaikki && await sm() === 'false  false');
  // Otsikkohaku. osumat() avaa kaikki ryhmät ja palauttaa niiden näkyvät osumat (s = ryhmän sivusto, t = tekijä tai asiasana).
  const odota = async () => { await page.waitForTimeout(300);
    await page.waitForFunction(() => !/ladataan|latautu/.test(document.getElementById('o-tila').textContent), null, { timeout: 30000 }); };
  const ryhmat = () => page.$$eval('#osumat > li', l => l.map(x => ({ s: x.getAttribute('data-sivu'), n: +x.querySelector('.r-otsake .n').textContent,
    auki: x.querySelector('.r-otsake').getAttribute('aria-expanded') === 'true', nak: x.querySelectorAll('ol.osumat > li').length })));
  const nakyvat = () => page.$$eval('#osumat ol.osumat > li', l => l.map(x => ({ o: x.querySelector('a').textContent, h: x.querySelector('a').href,
    s: x.closest('li[data-sivu]').getAttribute('data-sivu'), t: (x.querySelector('.mika') || {}).textContent || '' })));
  const avaaKaikki = () => page.$$eval('#osumat button.r-otsake[aria-expanded="false"]', l => l.forEach(b => b.click()));
  const osumat = async q => { if (q != null) await page.fill('#s-haku', q); await odota(); await avaaKaikki(); return nakyvat(); };
  t('otsikkoluetteloa ei ladata ennen hakua', luettelo + gutenberg + pohjola === 0, String(luettelo + gutenberg + pohjola));
  let o = await osumat('hegel logic');
  t('hegel logic: NDPR:n arvio, slug purkautuu', o.some(x => x.o === 'Hegel’s Logic and Metaphysics' && x.h === 'https://ndpr.nd.edu/reviews/hegels-logic-and-metaphysics/'), o.slice(0, 3).map(x => x.h).join(' '));
  t('ydin, Gutenberg ja pohjoismaiset ladattiin kerran', luettelo === 1 && gutenberg === 1 && pohjola === 1, luettelo + ' ' + gutenberg + ' ' + pohjola);
  o = await osumat('kalevala');
  t('kalevala: Gutenbergin teksti mukana', o.some(x => /^https:\/\/www\.gutenberg\.org\/ebooks\/\d+$/.test(x.h) && x.s === 'Project Gutenberg'), o.slice(0, 4).map(x => x.h).join(' '));
  o = await osumat('cicero de officiis');
  t('cicero de officiis: Latin Library, etuliite purkautuu', o.some(x => x.h === 'https://www.thelatinlibrary.com/cicero/off.shtml'), o.map(x => x.h).join(' '));
  t('osoitteet ehjiä', o.every(x => /^https?:\/\/[^\s\u0001]+$/.test(x.h)));
  o = await osumat('kant');
  const kantKaikki = (await ryhmat()).reduce((n, r) => n + r.n, 0);
  t('tilarivi: osumat ja sivustot', new RegExp('^' + kantKaikki + ' osumaa \\d+ sivustolla').test(await page.textContent('#o-tila')), await page.textContent('#o-tila'));
  await nappi('kieli', 'suomi'); await odota();
  const kantFi = await ryhmat(), kantFiN = kantFi.reduce((n, r) => n + r.n, 0);
  t('kant + suomi: vain suomenkielisiä sivustoja', kantFiN > 0 && kantFiN < kantKaikki && kantFi.every(x => /Ensyklopedia Logos|Snellman|SLS|Project Gutenberg/.test(x.s)), kantFi.map(x => x.s + ' ' + x.n).join(' | '));
  t('korin luku seuraa otsikko-osumia', Number(await page.textContent('button.kori[data-f="kieli"][data-v="suomi"] .n')) === kantFiN);
  await page.click('#s-tyhjenna');
  await page.fill('#s-haku', 'kant'); await page.click('button.salmiakki'); await odota();
  const kantSuper = await ryhmat();
  t('kant + supersalmiakki: vain sertifioitujen osumat', kantSuper.length > 1 && kantSuper.every(x => superNimet.includes(x.s)) &&
    kantSuper.reduce((n, r) => n + r.n, 0) < kantKaikki, kantSuper.map(x => x.s + ' ' + x.n).join(' | '));
  await page.click('#s-tyhjenna');
  // Ryhmät: Kierkegaard ei huku tekstiportaalin alle.
  await page.fill('#s-haku', 'kierkegaard'); await odota();
  let r = await ryhmat();
  const kb = r.find(x => x.s === 'Det Kgl. Biblioteks tekstportal');
  t('kierkegaard: sivusto kerran, nimi ja määrä', kb && kb.n > 50 && r.filter(x => x.s === kb.s).length === 1 && r.length > 3, r.map(x => x.s + ' ' + x.n).join(' | '));
  t('ryhmät aluksi kiinni', r.every(x => !x.auki && !x.nak));
  t('sivustojen nimet ovat listan nimiä', await page.evaluate(() => [...document.querySelectorAll('#osumat > li')].every(li =>
    [...document.querySelectorAll('ul.sivustot li a')].some(a => a.textContent === li.getAttribute('data-sivu')))));
  await page.click('#osumat > li[data-sivu="Det Kgl. Biblioteks tekstportal"] button.r-otsake');
  r = await ryhmat(); let k = r.find(x => x.s === kb.s);
  t('napautus avaa 25', k.auki && k.nak === 25 && r.filter(x => x.auki).length === 1, JSON.stringify(k));
  await page.click('#osumat > li[data-sivu="Det Kgl. Biblioteks tekstportal"] button.r-lisaa');
  k = (await ryhmat()).find(x => x.s === kb.s);
  t('näytä lisää: 50', k.nak === 50, String(k.nak));
  t('avattu ryhmä säilyy kentän vaihdossa', await (async () => { await nappi('kentta', 'otsikko'); await odota(); await nappi('kentta', 'otsikko'); await nappi('kentta', 'otsikko'); await odota();
    const x = (await ryhmat()).find(y => y.s === kb.s); return x && x.auki; })());
  await page.click('#osumat > li[data-sivu="Det Kgl. Biblioteks tekstportal"] button.r-otsake');
  k = (await ryhmat()).find(x => x.s === kb.s);
  t('toinen napautus sulkee', !k.auki && !k.nak);
  // Haku-rivi: tekijä mukaan vain tekijäosumat, tekijä pois karsii ne (tutkimus esiin).
  await nappi('kentta', 'tekijä'); await odota();
  o = await osumat(); r = await ryhmat();
  t('tekijä mukaan: tekstiportaalin teokset, kaikilla tekijänä Kierkegaard', r.find(x => x.s === kb.s).n > 50 && o.length > 25 && o.every(x => /kierkegaard/i.test(x.t)), o.filter(x => !/kierkegaard/i.test(x.t)).slice(0, 3).map(x => x.s + ': ' + x.o + ' / ' + x.t).join(' | ') + ' (' + o.length + ')');
  await nappi('kentta', 'tekijä'); await odota();
  o = await osumat(); r = await ryhmat();
  t('tekijä pois: ei tekijäosumia, tutkimus jää', o.length > 10 && o.every(x => !/kierkegaard/i.test(x.t)) && !r.some(x => x.s === kb.s) && r.some(x => x.s === 'Stanford Encyclopedia of Philosophy'),
    r.map(x => x.s + ' ' + x.n).join(' | '));
  t('pois-kentän luku 0', await page.textContent('button.kori[data-f="kentta"][data-v="tekijä"] .n') === '0');
  await nappi('kentta', 'tekijä'); await nappi('kentta', 'asiasana'); await odota();
  o = await osumat();
  t('asiasana mukaan: asiasana näkyy osumassa', o.length > 0 && o.every(x => /asiasana .*Kierkegaard/i.test(x.t)), o.map(x => x.o + ' / ' + x.t).slice(0, 3).join(' | '));
  await page.click('#s-tyhjenna');
  t('tyhjennä nollaa kentät', await page.$$eval('button.kori[data-f="kentta"][data-tila]', l => l.length) === 0);
  // Korien nimet ja fennomaanit.
  t('korit: uskonto, L&L = Laki & Lääketiede, yleiset, fennomaanit, luonnontieteet; ei vanhoja', await page.evaluate(() => { const v = [...document.querySelectorAll('button.kori[data-f="aihe"]')].map(b => b.getAttribute('data-v'));
    return ['uskonto', 'L&L = Laki & Lääketiede', 'yleiset', 'fennomaanit', 'luonnontieteet'].every(x => v.includes(x)) && !v.some(x => /perimmäisyys|jämäkori|kaikkiruokainen|tietosanakirjat|^tiede$|^luonnontiede$|^laki ja lääketiede$/.test(x)); }));
  await nappi('aihe', 'yleiset');
  t('yleiset: Wikipedia ja kaikkiruokaiset', (await page.$$eval('ul.sivustot li:not([hidden])', l => l.map(x => x.textContent))).filter(x => /Wikipedia|Project Gutenberg|Substack|Visuotinė/.test(x)).length >= 5);
  await page.click('#s-tyhjenna');
  await nappi('aihe', 'fennomaanit');
  // Fennomaanit (26.11.2026): piirin sivustot ja sivustot, joilla on piirin tekstejä (Runebergin teokset Gutenbergissa,
  // Wikisourcessa, Projekt Runebergissa ja Litteraturbankenissa).
  const fenno = await nimet();
  t('fennomaanit: Snellman, SLS ja neljä sivustoa, joilla on piirin tekstejä', ['J. V. Snellmanin kootut teokset', 'SLS:n digitaaliset editiot', 'Project Gutenberg',
    'Wikisource', 'Projekt Runeberg', 'Litteraturbanken'].every(n => fenno.includes(n)) && fenno.length === 6, fenno.join(' | '));
  o = await osumat('runeberg');
  t('runeberg + fennomaanit: Gutenberg, SLS, Wikisource, Projekt Runeberg ja Litteraturbanken', ['Project Gutenberg', 'SLS:n digitaaliset editiot', 'Wikisource',
    'Projekt Runeberg', 'Litteraturbanken'].every(n => o.some(x => x.s === n)) && o.every(x => x.s !== 'Det Kgl. Biblioteks tekstportal'), [...new Set(o.map(x => x.s))].join(' | '));
  o = await osumat('fänrik ståls');
  t('fänrik ståls + fennomaanit: alkukielinen Wikisourcessa, Projekt Runebergissa ja Litteraturbankenissa', ['Wikisource', 'Projekt Runeberg', 'Litteraturbanken']
    .every(n => o.some(x => x.s === n && /Fänrik Ståls sägner/i.test(x.o))), o.map(x => x.s + ': ' + x.o).slice(0, 8).join(' | '));
  await page.click('#s-tyhjenna');
  // Hakukieli (käyttäjän päätös: perus-boolean): lainausmerkeissä kokonainen sana tai fraasi, OR sitoo tiukemmin kuin AND,
  // NOT karsii, pienet and/or ovat hakusanoja ja irrallinen operaattori ohitetaan.
  const lkm = async q => { await osumat(q); return (await ryhmat()).reduce((n, x) => n + x.n, 0); };
  await nappi('kentta', 'otsikko');
  const pSt = await lkm('"paul" st'), pSa = await lkm('"paul" saint'), pMol = await lkm('"paul" st saint'), pTai = await lkm('"paul" st OR saint');
  t('"paul" st OR saint: yhdiste', pTai > pSt && pTai > pSa && pTai === pSt + pSa - pMol, [pSt, pSa, pMol, pTai].join(' / '));
  t('sulut: "paul" (st OR saint) ja ("paul" st) OR ("paul" saint) samat', await lkm('"paul" (st OR saint)') === pTai && await lkm('("paul" st) OR ("paul" saint)') === pTai);
  o = await osumat('"paul" st OR saint');
  t('lainausmerkeissä kokonainen sana (ei Pauline, Paula)', o.length > 0 && o.every(x => /(^|[^\p{L}\p{N}])paul(?![\p{L}\p{N}])/iu.test(x.o)), o.filter(x => !/paul(?![\p{L}])/i.test(x.o)).map(x => x.o).slice(0, 3).join(' | '));
  t('ilman lainausmerkkejä sanan alku (Pauline mukana)', (await osumat('paul st')).some(x => /pauline/i.test(x.o)));
  o = await osumat('"st paul"');
  t('fraasi: "st paul" osuu St. Pauliin ja St Pauliin', o.length > 0 && o.some(x => /St\. Paul/.test(x.o)) && o.every(x => /(^|[^\p{L}])st[^\p{L}\p{N}]+paul(?![\p{L}\p{N}])/iu.test(x.o)), o.map(x => x.o).slice(0, 4).join(' | '));
  const eiKat = await lkm('"paul" st OR saint NOT cathedral');
  t('NOT karsii', eiKat > 0 && eiKat < pTai && !(await nakyvat()).some(x => /cathedral/i.test(x.o)), eiKat + ' < ' + pTai);
  const pS = await lkm('paul st');
  t('paul AND st = paul st; irrallinen OR ja NOT ohitetaan', await lkm('paul AND st') === pS && await lkm('paul st OR') === pS && await lkm('paul st NOT') === pS);
  t('pienet and/or ovat hakusanoja', await lkm('paul or st') < pS);
  await page.click('#s-tyhjenna');
  await page.fill('#s-haku', 'NOT paul'); await page.waitForTimeout(300);
  t('pelkkä NOT ei hae otsikoita', await page.evaluate(() => document.getElementById('otsikot').hidden));
  await page.fill('#s-haku', 'wiki NOT wikisource'); await page.waitForTimeout(300);
  const wn = await nimet();
  t('sivustolista: NOT ja OR', wn.length === 2 && !wn.includes('Wikisource') && (await (async () => { await page.fill('#s-haku', 'wikisource OR gutenberg'); await page.waitForTimeout(300); return nimet(); })()).length === 3, wn.join(' | '));
  await page.click('#s-tyhjenna');
  // Problemos: liettuankielinen artikkeli alkukielisellä otsikolla, englanninkielinen otsikko löytää sen.
  o = await osumat('efficiency training specialists');
  t('Problemos: englanninkielinen otsikko löytää liettuankielisen', o.some(x => x.o === 'Apie specialistų rengimo efektyvumą' && /\/problemos\/lt\/article\/view\/5770$/.test(x.h)), o.map(x => x.o + ' ' + x.h).join(' | '));
  await nappi('kieli', 'englanti'); await odota();
  t('Problemos: liettuankielinen ei ole englantia', !(await nakyvat()).some(x => x.o === 'Apie specialistų rengimo efektyvumą'));
  await page.click('#s-tyhjenna'); await page.fill('#s-haku', 'he'); await page.waitForTimeout(300);
  t('alle kolme kirjainta: osumat piilossa', await page.evaluate(() => document.getElementById('otsikot').hidden));
  await page.click('#s-tyhjenna');
  // Kirjainhyppy toimii yhä.
  await page.click('nav.aakkoset a[href="#k-S"]'); await page.waitForTimeout(150);
  t('kirjainhyppy S', await page.evaluate(() => { const h = document.getElementById('k-S').getBoundingClientRect(); return h.top >= 0 && h.top < 300; }));
  await page.evaluate(() => scrollTo(0, 0));
  await nappi('aihe', 'uskonto');
  const clip = await page.evaluate(() => { const a = document.getElementById('suodatus').getBoundingClientRect(); return { x: 0, y: a.top + scrollY - 8, width: innerWidth, height: a.height + 330 }; });
  if (ULOS) await page.screenshot({ path: path.join(ULOS, 'sivustot-suodatus-360.png'), clip, fullPage: true });
  t('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  // Ilman skriptiä lista näkyy sellaisenaan.
  const p2 = await (await b.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } })).newPage();
  await p2.goto(U + 'luin/sivustot.html');
  t('ilman skriptiä lista näkyy, suodatus piilossa', await p2.$$eval('#sivustot li', l => l.length) === kaikki && !(await p2.isVisible('#suodatus')));
  console.log(viat ? viat + ' vikaa.' : 'Kaikki kunnossa.');
  process.exitCode = viat ? 1 : 0;
  await b.close(); palvelin.close();
})();
