// Porrasvalikko (nimikkeen ja valittujen valikko, luin.html naytaPorras()). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/porras-testi.js [kuvakansio]
// Tarkistaa: pääkohdat Exportātiō, Latomo ja Luin. ja alavalikkojen järjestys (lähdeviite Exportātiōn ylimpänä, Poista Luin.-alavalikon
// alimpana punaisena); iso alkukirjain ja loppupiste vain Luin.:ssa; leveällä rinnakkain (pääkohdat eivät liiku, laatikon leveys ei muutu
// alavalikkoa vaihdettaessa, aukko väliviivassa, hiirellä viipymäavaus), napin yllä avautunut kasvaa ylöspäin pääkohtien pysyessä;
// kapealla sisäkkäin (paluu, yläreuna pysyy); kierto vaihtaa tavan avoimen alavalikon säilyessä; Luin.-alavalikko pinossa, kellarin
// kampihyllystössä, ö-mapissa ja käsikirjalle; Merkitse luetuksi himmentää ja palautuu; Vie käsikirjastoon ja Pois silmistä vahvistuksin;
// valittujen valikko; nimikkeen kolme salmiakkia.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

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
const kuva = async (page, n) => { if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'porras-' + n + '.png') }); };

async function kylva(page, U, lisa) {
  await page.goto(U + 'luin.html#');
  await page.evaluate((lisa) => {
    const l = [];
    for (let i = 0; i < 10; i++) l.push({ id: 'p-t' + i, added: 100 - i, title: 'Koeteksti ' + i, src: 'paikallinen' });
    l.push({ id: 'p-kellari', added: 1, title: 'Kellarissa', src: 'paikallinen', luettu: 5 });
    l.push({ id: 'p-omappi', added: 1, title: 'Ö-mapissa', src: 'paikallinen', luettu: 5, omappi: 6 });
    l.push({ id: 'p-kasikirja', added: 1, title: 'Käsikirja', src: 'paikallinen', kasikirja: 1 });
    Object.assign(l[2], lisa || {});
    localStorage.setItem('luin-lista', JSON.stringify(l));
    for (const e of l) localStorage.setItem('luin-teksti:' + e.id, JSON.stringify('---\ntekijä: Testi Kirjoittaja\n---\n\n# ' + e.title + '\n\nKappale.\n'));
  }, lisa);
  await page.reload(); await page.waitForSelector('#nimikkeet li');
}
const tila = (page) => page.evaluate(() => {
  const p = document.getElementById('pop'), r = p.getBoundingClientRect(), pa = p.querySelector('.p-paa'), q = pa && pa.getBoundingClientRect();
  const auki = p.querySelector('.p-ali.auki');
  const nak = (el) => { const cs = getComputedStyle(el), rr = el.getBoundingClientRect(); return cs.visibility !== 'hidden' && cs.display !== 'none' && rr.height > 0; };
  return { auki: !p.hidden, luokka: p.className, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right),
    paa: q && q.height ? [Math.round(q.left), Math.round(q.top)].concat([...pa.querySelectorAll('button.p-ots')].map(b => Math.round(b.getBoundingClientRect().top))) : null,
    ali: auki ? auki.dataset.ali : '', kohdat: auki ? [...auki.querySelectorAll('button[data-k]')].filter(nak).map(b => b.dataset.k + '=' + b.textContent) : [],
    vierii: p.classList.contains('vierii'), iw: innerWidth, ih: innerHeight };
});
const luinKohdat = async (page, id) => {
  await page.click(`#nimikkeet button.jako[data-id="${id}"]`);
  await page.click('#pop button[data-k="ali:luin"]');
  const t = await tila(page), nimi = await page.textContent('#pop button[data-k="ali:luin"]');
  await page.keyboard.press('Escape'); await page.evaluate(() => { document.getElementById('pop').hidden = true; });
  return nimi + ': ' + t.kohdat.filter(k => !k.startsWith('takaisin')).join(' | ');
};

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = 'http://localhost:' + palvelin.address().port + '/';
  const selain = await chromium.launch();
  const virheet = [];

  // 1. Leveä ruutu, hiiri.
  {
    const ctx = await selain.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage(); page.on('pageerror', e => virheet.push(e.message));
    await kylva(page, U);
    // Mitataan sivun sisällä samalla hetkellä: pino piirtyy taustalla uudelleen (alaotsikon täydennys), ja haettu elementti voi irrota.
    await page.waitForTimeout(400);
    const kolme = await page.evaluate(() => { const r = document.querySelector('#nimikkeet button.jako[data-id="p-t0"] svg.kolme').getBoundingClientRect(); return [r.width, r.height].map(x => +x.toFixed(2)); });
    tulos('kolme salmiakkia 4,75 × 16,15 px', Math.abs(kolme[0] - 4.75) < .02 && Math.abs(kolme[1] - 16.15) < .02, kolme.join(' × '));
    await page.click('#nimikkeet button.jako[data-id="p-t2"]');
    const paa = await page.$$eval('#pop .p-paa button', bs => bs.map(b => b.dataset.k + '=' + b.textContent));
    tulos('pääkohdat EXPORTĀTIŌ, LATOMO, Luin.', paa.join(' | ') === 'ali:vienti=EXPORTĀ TIŌ  | ali:latomo=LATOMO | ali:luin=Luin.', paa.join(' | '));
    let t0 = await tila(page);
    tulos('leveällä rinnakkain, ei alavalikkoa auki', /\brinn\b/.test(t0.luokka) && !t0.ali && !t0.vierii, t0.luokka);
    await kuva(page, '1-paa');
    await page.click('#pop button[data-k="ali:vienti"]');
    let t1 = await tila(page);
    tulos('Exportātiō: lähdeviite ylimpänä, sitten kopioi, linkitä, lataa, vie merkinnät, huiluta', t1.ali === 'vienti' &&
      t1.kohdat.map(k => k.split('=')[0]).join() === 'lisa,viite,linkita,lataa,viemerk,huiluta' &&
      await page.$eval('#pop .p-ali.auki', a => a.firstElementChild.nextElementSibling.classList.contains('esi')), t1.kohdat.join(' | '));
    tulos('alavalikko avautuu vasemmalle, pääkohdat paikallaan', JSON.stringify(t1.paa) === JSON.stringify(t0.paa) && t1.right === t0.right && t1.left < t0.left && t1.top === t0.top,
      JSON.stringify([t0.paa, t1.paa, t0.left, t1.left]));
    const aukko = await page.evaluate(() => {
      const b = document.querySelector('#pop button.p-ots[aria-expanded="true"]'), c = getComputedStyle(b, '::before'), pa = getComputedStyle(b.parentNode);
      return { tausta: c.backgroundColor, paperi: getComputedStyle(document.getElementById('pop')).backgroundColor, vasen: c.left, viiva: pa.borderLeftWidth + ' ' + pa.borderLeftStyle };
    });
    tulos('avoimen pääkohdan kohdalla aukko väliviivassa', aukko.tausta === aukko.paperi && aukko.vasen === '-1px' && aukko.viiva === '1px solid', JSON.stringify(aukko));
    await kuva(page, '2-vienti');
    // Hiirellä viipymäavaus.
    const lb = await page.$eval('#pop button[data-k="ali:latomo"]', b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(lb.x, lb.y - 3); await page.mouse.move(lb.x, lb.y, { steps: 3 });
    await page.waitForTimeout(100);
    const kesken = (await tila(page)).ali;
    await page.waitForTimeout(350);
    let t2 = await tila(page);
    tulos('hiiri: Latomo avautuu viipymällä, ei heti', kesken === 'vienti' && t2.ali === 'latomo' && t2.kohdat.join(' | ') === 'luokittele=Luokittele | tiedot=Muuta metatietoja | laitos=Lado uusi laitos',
      kesken + ' → ' + t2.ali + ': ' + t2.kohdat.join(' | '));
    tulos('vaihto ei muuta leveyttä eikä pääkohtia', t2.left === t1.left && t2.right === t1.right && JSON.stringify(t2.paa) === JSON.stringify(t0.paa) && t2.top === t0.top,
      JSON.stringify([t1.left, t2.left, t2.paa]));
    // Napautus avoimeen pääkohtaan ei sulje.
    await page.click('#pop button[data-k="ali:latomo"]');
    tulos('avoimen pääkohdan napautus pitää sen auki', (await tila(page)).ali === 'latomo');
    await page.click('#pop button[data-k="ali:luin"]');
    let t3 = await tila(page);
    tulos('Luin. pinossa: Pois silmistä, Käsikirjastoon, Merkitse luetuksi, Poista', t3.kohdat.join(' | ') ===
      'luin=Pois silmistä | kasikirja=Käsikirjastoon | merk=Merkitse luetuksi | poista=Poista', t3.kohdat.join(' | '));
    const vaara = await page.$eval('#pop button[data-k="poista"]', b => b.classList.contains('vaara') && !b.nextElementSibling);
    tulos('Poista alimpana punaisena', vaara);
    const kaikki = await page.$$eval('#pop button[data-k]:not(.p-ots):not(.p-takaisin):not(.h-viit)', bs => bs.map(b => b.textContent));
    const huono = kaikki.filter(x => !/^[A-ZÄÖ]/.test(x) || /\.$/.test(x));
    tulos('kohdat isolla alkukirjaimella ja ilman loppupistettä', !huono.length, huono.join(' | ') || kaikki.join(' | '));
    await kuva(page, '3-luin');
    await page.click('#pop button[data-k="poista"]');
    tulos('Poista kysyy vahvistuksen', await page.textContent('#pop button[data-k="poista"]') === 'Vahvista: poista myös merkinnät');
    await page.keyboard.press('Escape'); await page.evaluate(() => { document.getElementById('pop').hidden = true; });

    // Napin yllä avautunut valikko kasvaa ylöspäin, pääkohdat paikallaan.
    await page.evaluate(() => { const b = document.querySelector('#nimikkeet button.jako[data-id="p-t9"]'); scrollBy(0, b.getBoundingClientRect().bottom - innerHeight + 40); });
    await page.click('#nimikkeet button.jako[data-id="p-t9"]');
    const a0 = await tila(page);
    await page.click('#pop button[data-k="ali:vienti"]');
    const a1 = await tila(page);
    await page.click('#pop button[data-k="ali:latomo"]');
    const a2 = await tila(page);
    const nappiY = await page.$eval('#nimikkeet button.jako[data-id="p-t9"]', b => Math.round(b.getBoundingClientRect().top));
    tulos('napin yllä: alareuna ja pääkohdat pysyvät', a0.bottom <= nappiY && a1.bottom === a0.bottom && a2.bottom === a0.bottom && a1.top < a0.top &&
      JSON.stringify(a1.paa.slice(2)) === JSON.stringify(a0.paa.slice(2)) && JSON.stringify(a2.paa.slice(2)) === JSON.stringify(a0.paa.slice(2)),
      JSON.stringify({ nappiY, a0: [a0.top, a0.bottom, a0.paa], a1: [a1.top, a1.bottom, a1.paa], a2: [a2.top, a2.bottom, a2.paa] }));
    await kuva(page, '4-ylla');
    await page.keyboard.press('Escape'); await page.evaluate(() => { document.getElementById('pop').hidden = true; scrollTo(0, 0); });

    // Merkitse luetuksi ja takaisin.
    await page.click('#nimikkeet button.jako[data-id="p-t2"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="merk"]');
    const m1 = await page.evaluate(() => {
      const li = document.querySelector('#nimikkeet button.jako[data-id="p-t2"]').closest('li'), o = li.querySelector('.n-ots');
      const v = getComputedStyle(document.documentElement).getPropertyValue('--viiva').trim();
      const d = document.createElement('span'); d.style.color = v; document.body.appendChild(d); const vc = getComputedStyle(d).color; d.remove();
      return { luokka: li.className, vari: getComputedStyle(o).color, viiva: vc, pop: !document.getElementById('pop').hidden,
        e: JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t2') };
    });
    tulos('Merkitse luetuksi: himmeä (viivan väri), pinossa, valikko sulkeutui', /luettu-merk/.test(m1.luokka) && m1.vari === m1.viiva && m1.e.merkLuettu > 0 && !m1.e.luettu && !m1.pop,
      JSON.stringify({ l: m1.luokka, v: m1.vari, vv: m1.viiva, pop: m1.pop }));
    await kuva(page, '5-himmea');
    await page.click('#nimikkeet button.jako[data-id="p-t2"]');
    await page.click('#pop button[data-k="ali:luin"]');
    const mk = await page.textContent('#pop button[data-k="merk"]');
    await page.click('#pop button[data-k="merk"]');
    const m2 = await page.evaluate(() => ({ l: document.querySelector('#nimikkeet button.jako[data-id="p-t2"]').closest('li').className, e: JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t2') }));
    tulos('Merkitse lukemattomaksi palauttaa', mk === 'Merkitse lukemattomaksi' && m2.l === 'nimike' && !m2.e.merkLuettu, mk + ' ' + m2.l);

    // Siirrä kellarin kampihyllystöön (vahvistus Luin.) poistaa luetuksi merkinnän.
    await page.click('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="merk"]');
    await page.click('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="luin"]');
    const kys = await page.evaluate(() => ({ k: document.querySelector('#pop .kys').textContent, ok: document.querySelector('#pop button[data-k="ok"]').textContent }));
    await page.click('#pop button[data-k="ok"]');
    const e3 = await page.evaluate(() => JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t3'));
    tulos('Pois silmistä: Nakataanko kellarin kampihyllystöön? (Nakkaa), luettu, merkki pois', kys.k === 'Nakataanko kellarin kampihyllystöön?' && kys.ok === 'Nakkaa' && e3.luettu > 0 && !e3.merkLuettu, JSON.stringify(kys));
    // Vie käsikirjastoon (pinosta viedään).
    await page.click('#nimikkeet button.jako[data-id="p-t4"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="kasikirja"]');
    const kk = await page.evaluate(() => ({ k: document.querySelector('#pop .kys').textContent, ok: document.querySelector('#pop button[data-k="ok"]').textContent }));
    await page.click('#pop button[data-k="ok"]');
    const e4 = await page.evaluate(() => ({ e: JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t4'), pinossa: !!document.querySelector('#nimikkeet button.jako[data-id="p-t4"]'), v: document.getElementById('viesti').textContent }));
    tulos('Vie käsikirjastoon: vahvistus, käsikirja, pois pinosta', kk.k === 'Viedäänkö teksti käsikirjastoon?' && kk.ok === 'Vie käsikirjastoon' && e4.e.kasikirja === 1 && !e4.pinossa,
      JSON.stringify({ kk, v: e4.v }));

    // Valittujen valikko pinossa.
    await page.click('#nimikkeet button.valitse[data-id="p-t0"]');
    await page.click('#nimikkeet button.valitse[data-id="p-t1"]');
    await page.click('#val-valikko');
    const vp = await page.$$eval('#pop .p-paa > *', xs => xs.map(x => x.dataset.k || x.textContent));
    await page.click('#pop button[data-k="ali:vienti"]');
    const vv = (await tila(page)).kohdat;
    await page.click('#pop button[data-k="ali:luin"]');
    const vl = (await tila(page)).kohdat;
    tulos('valittujen valikko: otsikko, pääkohdat, Exportātiō ja Luin.', vp.join() === '2 tekstiä valittu,ali:vienti,ali:latomo,ali:luin' &&
      vv.join(' | ') === 'viitteet=Kopioi lähdeviitteet | zip=Vie merkinnät (zip)' &&
      vl.join(' | ') === 'luin=Pois silmistä | kasikirja=Käsikirjastoon | merk=Merkitse luetuksi | poista=Poista', [vp.join(), vv.join(' | '), vl.join(' | ')].join(' / '));
    await page.click('#pop button[data-k="poista"]');
    tulos('valittujen Poista: vahvistus kahdelle', await page.textContent('#pop button[data-k="poista"]') === 'Vahvista: poista 2 tekstiä merkintöineen');
    await page.keyboard.press('Escape'); await page.evaluate(() => { document.getElementById('pop').hidden = true; });

    // Kellarin kampihyllystö, ö-mappi ja käsikirja.
    await page.goto(U + 'luin.html#arkisto'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-kellari"]');
    tulos('kellari: pääkohta Hain.; Poimi pinoon, Ö-mappiin, Käsikirjastoon, Poista', (await luinKohdat(page, 'p-kellari')) ===
      'Hain.: luin=Poimi pinoon | omappi=Ö-mappiin | kasikirja=Käsikirjastoon | poista=Poista');
    tulos('käsikirja: vain Poista', (await luinKohdat(page, 'p-kasikirja')) === 'Hain.: poista=Poista');
    await page.goto(U + 'luin.html#omappi'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-omappi"]');
    tulos('ö-mappi: pääkohta Toin.; Poimi kellarin kampihyllystöön, Poimi käsikirjastoon, Poista', (await luinKohdat(page, 'p-omappi')) ===
      'Toin.: omappi=Poimi kellarin kampihyllystöön | kasikirja=Poimi käsikirjastoon | poista=Poista');
    await ctx.close();
  }

  // 2. Kapea kosketusruutu: sisäkkäin, paluu, kierto.
  {
    const ctx = await selain.newContext({ ...devices['Pixel 5'] });
    const page = await ctx.newPage(); page.on('pageerror', e => virheet.push(e.message));
    await kylva(page, U);
    await page.tap('#nimikkeet button.jako[data-id="p-t2"]');
    const k0 = await tila(page);
    tulos('kapealla sisäkkäin', /\bsisak\b/.test(k0.luokka) && k0.right <= k0.iw - 8 && k0.left >= 8, k0.luokka);
    await page.tap('#pop button[data-k="ali:vienti"]');
    const k1 = await tila(page);
    tulos('alavalikko pääkohtien tilalla, paluurivi ylimpänä, yläreuna pysyy', !k1.paa && k1.kohdat[0] === 'takaisin=EXPORTĀ TIŌ ' && k1.top === k0.top &&
      k1.right <= k1.iw - 8 && k1.left >= 8, JSON.stringify([k0.top, k1.top, k1.kohdat[0]]));
    await kuva(page, '6-kapea-vienti');
    await page.tap('#pop .p-ali.auki button[data-k="takaisin"]');
    const k2 = await tila(page);
    tulos('paluu pääkohtiin samaan paikkaan', !k2.ali && JSON.stringify(k2.paa) === JSON.stringify(k0.paa) && k2.top === k0.top, JSON.stringify([k0.paa, k2.paa]));
    await page.tap('#pop button[data-k="ali:vienti"]');
    await page.setViewportSize({ width: 851, height: 393 }); await page.waitForTimeout(300);
    const k3 = await tila(page);
    tulos('kierto vaakaan: rinnakkain, alavalikko yhä auki, mahtuu', /\brinn\b/.test(k3.luokka) && k3.ali === 'vienti' && !!k3.paa && k3.right <= k3.iw - 8 && k3.bottom <= k3.ih - 8,
      JSON.stringify(k3));
    await page.setViewportSize({ width: 393, height: 851 }); await page.waitForTimeout(300);
    const k4 = await tila(page);
    tulos('kierto takaisin: sisäkkäin, alavalikko yhä auki', /\bsisak\b/.test(k4.luokka) && k4.ali === 'vienti' && !k4.paa && k4.right <= k4.iw - 8, JSON.stringify(k4));
    await ctx.close();
  }

  tulos('ei sivuvirheitä', !virheet.length, virheet.join(' | '));
  await selain.close(); palvelin.close();
  console.log(virheita ? virheita + ' virhettä' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
