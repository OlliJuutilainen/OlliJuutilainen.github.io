// Porrasvalikko (nimikkeen ja valittujen valikko, luin.html naytaPorras()). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/porras-testi.js [kuvakansio]
// Tarkistaa: pääkohdat ULOSTUS, SISUSTUS ja HYLLYTYS kaikissa näkymissä ja alavalikkojen järjestys (lähdeviite ULOSTUKSEN ylimpänä,
// Poista HYLLYTYKSEN alimpana punaisena); kohdat isolla alkukirjaimella ilman loppupistettä; leveällä rinnakkain (pääkohdat eivät liiku,
// laatikon leveys ei muutu alavalikkoa vaihdettaessa, aukko väliviivassa, hiirellä viipymäavaus), napin yllä avautunut kasvaa ylöspäin
// pääkohtien pysyessä; kapealla sisäkkäin (paluu, yläreuna pysyy); kierto vaihtaa tavan avoimen alavalikon säilyessä; HYLLYTYS pinossa,
// kellarin veivihyllystössä, ö-mapissa ja käsikirjalle; Anna pölyyntyä himmentää ja Puhalla pölyt palauttaa; pöly säilyy Hyllytä-,
// ö-mappi- ja pinoon poiminnan siirroissa ja lähtee käsikirjastoon nostettaessa; Vie ja Nosta käsikirjastoon, Hyllytä ja Laita
// ö-mappiin vahvistuksin; käsikirjan Poimi pinoon, Laita ö-mappiin ja Irrota käsikirjastosta (pois käsikirjastosta, lukematon
// jää kellariin) ja käsikirjan sisältävä valinta; valittujen valikko; nimikkeen kolme salmiakkia.
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
const paakohdat = async (page, id) => {
  await page.click(`#nimikkeet button.jako[data-id="${id}"]`);
  const t = await page.$$eval('#pop .p-paa button.p-ots', bs => bs.map(b => b.textContent).join(' | '));
  await page.keyboard.press('Escape'); await page.evaluate(() => { document.getElementById('pop').hidden = true; });
  return t;
};
// Vahvistuskysely: kysymys, vahvistus ja peruutus.
const kysely = (page) => page.evaluate(() => ({ k: document.querySelector('#pop .kys').textContent,
  ok: document.querySelector('#pop button[data-k="ok"]').textContent, ei: document.querySelector('#pop button[data-k="ei"]').textContent }));
const polyinen = (page, id) => page.evaluate((id) => {
  const b = document.querySelector(`#nimikkeet button.jako[data-id="${id}"]`);
  return !!b && b.closest('li').classList.contains('luettu-merk');
}, id);

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
    tulos('pääkohdat ULOSTUS, SISUSTUS, HYLLYTYS', paa.join(' | ') === 'ali:vienti=ULOSTUS | ali:latomo=SISUSTUS | ali:luin=HYLLYTYS', paa.join(' | '));
    let t0 = await tila(page);
    tulos('leveällä rinnakkain, ei alavalikkoa auki', /\brinn\b/.test(t0.luokka) && !t0.ali && !t0.vierii, t0.luokka);
    await kuva(page, '1-paa');
    await page.click('#pop button[data-k="ali:vienti"]');
    let t1 = await tila(page);
    tulos('ULOSTUS: lähdeviite ylimpänä, sitten kopioi, linkitä, lataa, vie merkinnät, huiluta', t1.ali === 'vienti' &&
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
    tulos('hiiri: SISUSTUS avautuu viipymällä, ei heti', kesken === 'vienti' && t2.ali === 'latomo' && t2.kohdat.join(' | ') === 'luokittele=Luokittele | tiedot=Muuta metatietoja | laitos=Lado uusi laitos',
      kesken + ' → ' + t2.ali + ': ' + t2.kohdat.join(' | '));
    tulos('vaihto ei muuta leveyttä eikä pääkohtia', t2.left === t1.left && t2.right === t1.right && JSON.stringify(t2.paa) === JSON.stringify(t0.paa) && t2.top === t0.top,
      JSON.stringify([t1.left, t2.left, t2.paa]));
    // Napautus avoimeen pääkohtaan ei sulje.
    await page.click('#pop button[data-k="ali:latomo"]');
    tulos('avoimen pääkohdan napautus pitää sen auki', (await tila(page)).ali === 'latomo');
    await page.click('#pop button[data-k="ali:luin"]');
    let t3 = await tila(page);
    tulos('HYLLYTYS pinossa: Hyllytä, Vie käsikirjastoon, Anna pölyyntyä, Poista', t3.kohdat.join(' | ') ===
      'luin=Hyllytä | kasikirja=Vie käsikirjastoon | merk=Anna pölyyntyä | poista=Poista', t3.kohdat.join(' | '));
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

    // Anna pölyyntyä ja Puhalla pölyt.
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
    tulos('Anna pölyyntyä: himmeä (viivan väri), pinossa, valikko sulkeutui', /luettu-merk/.test(m1.luokka) && m1.vari === m1.viiva && m1.e.merkLuettu > 0 && !m1.e.luettu && !m1.pop,
      JSON.stringify({ l: m1.luokka, v: m1.vari, vv: m1.viiva, pop: m1.pop }));
    await kuva(page, '5-himmea');
    await page.click('#nimikkeet button.jako[data-id="p-t2"]');
    await page.click('#pop button[data-k="ali:luin"]');
    const mk = await page.textContent('#pop button[data-k="merk"]');
    await page.click('#pop button[data-k="merk"]');
    const m2 = await page.evaluate(() => ({ l: document.querySelector('#nimikkeet button.jako[data-id="p-t2"]').closest('li').className, e: JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t2') }));
    tulos('Puhalla pölyt palauttaa', mk === 'Puhalla pölyt' && m2.l === 'nimike' && !m2.e.merkLuettu, mk + ' ' + m2.l);

    // Hyllytä (vahvistus Oletko aivan hylly?, Olen / En): pöly säilyy.
    await page.click('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="merk"]');
    await page.click('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="luin"]');
    const kys = await kysely(page);
    await page.click('#pop button[data-k="ok"]');
    const e3 = await page.evaluate(() => JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t3'));
    tulos('Hyllytä: Oletko aivan hylly? (Olen / En), kellariin, pöly säilyy', kys.k === 'Oletko aivan hylly?' && kys.ok === 'Olen' && kys.ei === 'En' && e3.luettu > 0 && e3.merkLuettu > 0, JSON.stringify(kys));
    // Vie käsikirjastoon (pinosta viedään).
    await page.click('#nimikkeet button.jako[data-id="p-t4"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="kasikirja"]');
    const kk = await kysely(page);
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
    tulos('valittujen valikko: otsikko, pääkohdat, ULOSTUS ja HYLLYTYS', vp.join() === '2 tekstiä valittu,ali:vienti,ali:latomo,ali:luin' &&
      vv.join(' | ') === 'viitteet=Kopioi lähdeviitteet | zip=Vie merkinnät (zip)' &&
      vl.join(' | ') === 'luin=Hyllytä | kasikirja=Vie käsikirjastoon | merk=Anna pölyyntyä | poista=Poista', [vp.join(), vv.join(' | '), vl.join(' | ')].join(' / '));
    await page.click('#pop button[data-k="poista"]');
    tulos('valittujen Poista: vahvistus kahdelle', await page.textContent('#pop button[data-k="poista"]') === 'Vahvista: poista 2 tekstiä merkintöineen');
    await page.keyboard.press('Escape'); await page.evaluate(() => { document.getElementById('pop').hidden = true; });

    // Kellarin veivihyllystö, ö-mappi ja käsikirja: pääkohdat samat kaikissa näkymissä, HYLLYTYKSEN kohdat näkymän mukaan.
    await page.goto(U + 'luin.html#arkisto'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-kellari"]');
    tulos('kellari: pääkohdat samat', (await paakohdat(page, 'p-kellari')) === 'ULOSTUS | SISUSTUS | HYLLYTYS');
    tulos('kellari: Poimi pinoon, Laita ö-mappiin, Nosta käsikirjastoon, Anna pölyyntyä, Poista', (await luinKohdat(page, 'p-kellari')) ===
      'HYLLYTYS: luin=Poimi pinoon | omappi=Laita ö-mappiin | kasikirja=Nosta käsikirjastoon | merk=Anna pölyyntyä | poista=Poista');
    tulos('käsikirja: Poimi pinoon, Laita ö-mappiin, Irrota käsikirjastosta, Poista (ei pölyä)', (await luinKohdat(page, 'p-kasikirja')) ===
      'HYLLYTYS: luin=Poimi pinoon | omappi=Laita ö-mappiin | kasikirja=Irrota käsikirjastosta | poista=Poista');
    tulos('käsikirja: pääkohdat samat', (await paakohdat(page, 'p-kasikirja')) === 'ULOSTUS | SISUSTUS | HYLLYTYS');
    tulos('kellari: pöly näkyy', await polyinen(page, 'p-t3'));
    tulos('kellari: pölyiselle Puhalla pölyt', (await luinKohdat(page, 'p-t3')).includes('merk=Puhalla pölyt'));
    // Laita ö-mappiin (Laitetaanko mappiin ö?, Joo / Öö ei): pöly säilyy.
    await page.click('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="omappi"]');
    const om = await kysely(page);
    await page.click('#pop button[data-k="ok"]');
    const e5 = await page.evaluate(() => JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t3'));
    tulos('Laita ö-mappiin: Laitetaanko mappiin ö? (Joo / Öö ei), pöly säilyy', om.k === 'Laitetaanko mappiin ö?' && om.ok === 'Joo' && om.ei === 'Öö ei' &&
      e5.omappi > 0 && e5.merkLuettu > 0, JSON.stringify(om));
    await page.goto(U + 'luin.html#omappi'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-omappi"]');
    tulos('ö-mappi: pääkohdat samat', (await paakohdat(page, 'p-omappi')) === 'ULOSTUS | SISUSTUS | HYLLYTYS');
    tulos('ö-mappi: Poimi kellarin veivihyllystöön, Poimi käsikirjastoon, Anna pölyyntyä, Poista', (await luinKohdat(page, 'p-omappi')) ===
      'HYLLYTYS: omappi=Poimi kellarin veivihyllystöön | kasikirja=Poimi käsikirjastoon | merk=Anna pölyyntyä | poista=Poista');
    tulos('ö-mappi: pöly näkyy', await polyinen(page, 'p-t3'));
    // Takaisin kellariin ja sieltä pinoon: pöly säilyy, ja pölyinen on pinon pohjalla.
    await page.click('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="omappi"]');
    await page.click('#pop button[data-k="ok"]');
    await page.goto(U + 'luin.html#arkisto'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#nimikkeet button.jako[data-id="p-t3"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="luin"]');
    await page.click('#pop button[data-k="ok"]');
    await page.goto(U + 'luin.html#'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-t3"]');
    const p3 = await page.evaluate(() => ({ viim: [...document.querySelectorAll('#nimikkeet li.nimike button.jako')].pop().dataset.id,
      e: JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-t3') }));
    tulos('pinoon poimittu: pöly säilyy, pinon pohjalla', await polyinen(page, 'p-t3') && p3.viim === 'p-t3' && p3.e.merkLuettu > 0 && !p3.e.luettu, JSON.stringify(p3.viim));
    // Nosta käsikirjastoon kellarista (Nostetaanko teksti käsikirjastoon?): käsikirjalla ei ole pölyä.
    await page.goto(U + 'luin.html#arkisto'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-kellari"]');
    await page.click('#nimikkeet button.jako[data-id="p-kellari"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="merk"]');
    await page.click('#nimikkeet button.jako[data-id="p-kellari"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="kasikirja"]');
    const nk = await kysely(page);
    await page.click('#pop button[data-k="ok"]');
    const e6 = await page.evaluate(() => JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-kellari'));
    tulos('Nosta käsikirjastoon: vahvistus, käsikirja, pöly pois', nk.k === 'Nostetaanko teksti käsikirjastoon?' && nk.ok === 'Nosta käsikirjastoon' &&
      e6.kasikirja === 1 && !e6.merkLuettu && !(await polyinen(page, 'p-kellari')), JSON.stringify(nk));

    // Käsikirjan siirrot (käyttäjän päätös): Poimi pinoon ja Laita ö-mappiin vievät pois käsikirjastosta, Irrota käsikirjastosta
    // jättää kellarin veivihyllystöön. Kaikki kolme lukemattomia käsikirjoja (ei e.luettu-aikaa).
    await page.evaluate(() => {
      const l = JSON.parse(localStorage.getItem('luin-lista'));
      for (const id of ['p-kk-pino', 'p-kk-om', 'p-kk-irti']) {
        l.push({ id, added: 1, title: id, src: 'paikallinen', kasikirja: 1 });
        localStorage.setItem('luin-teksti:' + id, JSON.stringify('# ' + id + '\n\nKappale.\n'));
      }
      localStorage.setItem('luin-lista', JSON.stringify(l));
    });
    await page.reload(); await page.waitForSelector('#nimikkeet button.jako[data-id="p-kk-pino"]');
    const kkSiirto = async (id, k) => {
      await page.click(`#nimikkeet button.jako[data-id="${id}"]`);
      await page.click('#pop button[data-k="ali:luin"]');
      await page.click(`#pop button[data-k="${k}"]`);
      const ky = await kysely(page);
      await page.click('#pop button[data-k="ok"]');
      const r = await page.evaluate((id) => ({ e: JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === id),
        v: document.getElementById('viesti').textContent, kk: [...document.querySelectorAll('#nimikkeet li')].map(li => li.classList.contains('valiots') ? '[' + li.textContent + ']' : li.querySelector('.n-ots').textContent.trim()) }), id);
      return Object.assign(r, { ky });
    };
    const kp = await kkSiirto('p-kk-pino', 'luin');
    tulos('käsikirja Poimi pinoon: vahvistus, pois käsikirjastosta pinoon', kp.ky.k === 'Poimitaanko teksti pinoon?' && kp.ky.ok === 'Poimi pinoon' &&
      !kp.e.kasikirja && !kp.e.luettu && kp.e.pinoon > 0 && kp.e.lkT > 0 && !kp.kk.includes('p-kk-pino') && /palasi pinoon/.test(kp.v), JSON.stringify(kp));
    const ko = await kkSiirto('p-kk-om', 'omappi');
    tulos('käsikirja Laita ö-mappiin: vahvistus, pois käsikirjastosta ö-mappiin, luettu-aika', ko.ky.k === 'Laitetaanko mappiin ö?' && ko.ky.ok === 'Joo' &&
      !ko.e.kasikirja && ko.e.omappi > 0 && ko.e.luettu > 0 && ko.e.lkT > 0 && !ko.kk.includes('p-kk-om'), JSON.stringify(ko));
    const ki = await kkSiirto('p-kk-irti', 'kasikirja');
    tulos('Irrota käsikirjastosta: vahvistus, kellarin veivihyllystöön tavalliseksi', ki.ky.k === 'Irrotetaanko teksti käsikirjastosta?' &&
      ki.ky.ok === 'Irrota käsikirjastosta' && ki.ky.ei === 'älä!' && !ki.e.kasikirja && ki.e.luettu > 0 && !ki.e.omappi && ki.e.lkT > 0 &&
      ki.kk.indexOf('p-kk-irti') > ki.kk.findIndex(x => /^\[Luetut/.test(x)) && /irtosi käsikirjastosta/.test(ki.v), JSON.stringify(ki));
    // Pinossa ja ö-mapissa ne ovat tavallisia: Hyllytä ja Poimi kellarin veivihyllystöön; ö-mapista poimittu palaa kellariin.
    await page.goto(U + 'luin.html#omappi'); await page.waitForSelector('#nimikkeet button.jako[data-id="p-kk-om"]');
    await page.click('#nimikkeet button.jako[data-id="p-kk-om"]');
    await page.click('#pop button[data-k="ali:luin"]');
    await page.click('#pop button[data-k="omappi"]');
    await page.click('#pop button[data-k="ok"]');
    const ko2 = await page.evaluate(() => JSON.parse(localStorage.getItem('luin-lista')).find(e => e.id === 'p-kk-om'));
    tulos('käsikirjastosta ö-mappiin laitettu palaa ö-mapista kellariin, ei pinoon', !ko2.omappi && ko2.luettu > 0 && !ko2.kasikirja, JSON.stringify(ko2));
    // Käsikirjan ja kellarin tekstin valinta: Poimi pinoon ja Laita ö-mappiin, ei käsikirjaston kohtaa eikä pölyä.
    await page.goto(U + 'luin.html#arkisto'); await page.waitForSelector('#nimikkeet button.valitse[data-id="p-kasikirja"]');
    await page.click('#nimikkeet button.valitse[data-id="p-kasikirja"]');
    await page.click('#nimikkeet button.valitse[data-id="p-kk-irti"]');
    await page.click('#val-valikko');
    await page.click('#pop button[data-k="ali:luin"]');
    const sv = (await tila(page)).kohdat.filter(k => !k.startsWith('takaisin'));
    tulos('käsikirjan ja kellarin tekstin valinta: Poimi pinoon, Laita ö-mappiin, Poista', sv.join(' | ') === 'luin=Poimi pinoon | omappi=Laita ö-mappiin | poista=Poista', sv.join(' | '));
    await page.keyboard.press('Escape'); await page.evaluate(() => { document.getElementById('pop').hidden = true; });
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
    tulos('alavalikko pääkohtien tilalla, paluurivi ylimpänä, yläreuna pysyy', !k1.paa && k1.kohdat[0] === 'takaisin=ULOSTUS' && k1.top === k0.top &&
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
