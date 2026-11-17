// Mustin, TCF-valkaisu ja sähköpapyrosointi (käyttäjän pyynnöt 17.11.2026). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sahkopaperi-testi.js [kuvakansio]
// Tarkistaa: 1) Sähköpapyrosoi asetukset on suorakaidenappi Ulkoasu-otsikon rivillä (työpöytä ja 360 px) eikä peitä raksia;
// 2) painallus tanssittaa vain napin (tausta, teksti, kehä) Mustin–TCF-vuorottelua neljä vaihetta lopputilaan, asetukset
// vaihtuvat neljännessä vaiheessa, leveys pysyy, toinen painallus kesken ei tee mitään, ja lopuksi nappi tarjoaa
// Oletusasetukset, joka palauttaa laitteen oletukset samalla vatkauksella; 3) kontrastikytkin muuttaa vain taustan
// (ja vaalean musteen täysmustaksi): muuttujat ja tyylisäännöt; nimi Mustin tai TCF-valkaisu teeman mukaan;
// 4) TCF-vihje hiiren viipymästä ja kosketuksella päällä olevan kytkimen napautuksesta, ja ohi napautus vain sulkee sen.
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

const MD = `# Koeteksti

## Ensimmäinen luku

Ensimmäinen kappale, jossa on alaviite.[^1]

${'Täytettä kappaleeksi. '.repeat(60)}

[^1]: Alaviitteen teksti.
`;
const SAHKOPAPERI = { teema: 'vaalea', kontrasti: 1, sivutus: 'sivut', sivuReuna: 1, sivuPyyhka: 0, sivunapit: 1 };
// Tanssin värit: tausta, teksti ja kehä (Mustimman vitivalkoinen teksti on tanssin poikkeus).
const VARIT = { mustin: 'rgb(0, 0, 0) rgb(255, 255, 255) rgb(255, 255, 255)', tcf: 'rgb(255, 255, 255) rgb(0, 0, 0) rgb(0, 0, 0)' };
const MUUTTUJAT = ['--paperi', '--muste', '--harmaa', '--viiva', '--ruoste', '--okra', '--huomio', '--sitaatti', '--hius', '--valo'];

// Kirjaa napin vaiheet (data-vaihe, teksti, tausta, leveys, asetukset) jokaisesta muutoksesta.
function kirjaaVaiheet() {
  const n = document.getElementById('papyrosoi'), t0 = performance.now();
  window.__vaiheet = [];
  const kirjaa = () => window.__vaiheet.push({ t: Math.round(performance.now() - t0), vaihe: n.dataset.vaihe || '', teksti: n.textContent,
    tausta: getComputedStyle(n).backgroundColor, varit: [getComputedStyle(n).backgroundColor, getComputedStyle(n).color, getComputedStyle(n).borderTopColor].join(' '), leveys: Math.round(n.getBoundingClientRect().width * 10) / 10,
    papyrus: ['teema', 'kontrasti', 'sivutus', 'sivuReuna', 'sivuPyyhka', 'sivunapit'].map(k => window.__luin.aset[k]).join(',') });
  window.__havainnoija && window.__havainnoija.disconnect();
  window.__havainnoija = new MutationObserver(kirjaa);
  window.__havainnoija.observe(n, { attributes: true, attributeFilter: ['data-vaihe'], childList: true, characterData: true, subtree: true });
  kirjaa();
}

async function aja(selain, U, kosketus) {
  const laji = kosketus ? '360 px kosketus' : 'työpöytä';
  const ctx = await selain.newContext(kosketus ? { viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true }
    : { viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const virheet = [];
  page.on('pageerror', e => virheet.push(e.message));
  await page.goto(U + 'luin.html#');
  await page.evaluate((md) => {
    localStorage.clear();
    localStorage.setItem('luin-lista', JSON.stringify([{ id: 'p-koe', added: 1, title: 'Koeteksti', src: 'paikallinen' }]));
    localStorage.setItem('luin-teksti:p-koe', JSON.stringify(md));
    // Lähtötila tahallaan papyrosoinnin vastakohta: tumma, rullaus, pyyhkäisy päällä, painikkeet pois.
    localStorage.setItem('luin-asetukset', JSON.stringify({ teema: 'tumma', sivutus: 'vieritys', sivuReuna: 0, sivuPyyhka: 1, sivunapit: 0, av: 8 }));
  }, MD);
  await page.reload(); await page.waitForSelector('#nimikkeet li');
  const napauta = async (sel) => { if (kosketus) await page.tap(sel); else await page.click(sel); };
  const nappi = () => page.evaluate(() => document.getElementById('papyrosoi').textContent);

  await napauta('.lhead .ratas');
  await page.waitForSelector('#asetukset:not([hidden])');
  // 1. Paikka ja muoto.
  const p = await page.evaluate(() => {
    const n = document.getElementById('papyrosoi'), h = document.querySelector('.aset-ots h3'), s = document.querySelector('#asetukset .sulje');
    const nr = n.getBoundingClientRect(), hr = h.getBoundingClientRect(), sr = s.getBoundingClientRect(), pr = document.getElementById('asetukset').getBoundingClientRect();
    const o = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
    const cs = getComputedStyle(n);
    const ens = document.querySelector('#asetukset .asetus[data-a="teema"]').getBoundingClientRect();
    return { samaRivi: Math.abs((nr.top + nr.bottom) / 2 - (hr.top + hr.bottom) / 2) < 4, oikea: Math.round(pr.right - nr.right), leveys: Math.round(nr.width),
      korkeus: Math.round(nr.height), raksi: !!(o && s.contains(o)), tyyli: [cs.fontStyle, cs.fontWeight, cs.textTransform].join(' '),
      reunus: cs.borderTopWidth + ' ' + cs.borderTopStyle, teksti: n.textContent, alla: Math.round(ens.top - nr.bottom) };
  });
  tulos(`${laji}: nappi Ulkoasu-otsikon rivillä`, p.samaRivi, JSON.stringify(p));
  tulos(`${laji}: nappi ei peitä raksia`, p.raksi);
  tulos(`${laji}: suorakaide, kursiivi, ohut, versaali, ei hakasulkeita`, /^italic 380 uppercase$/.test(p.tyyli) && p.reunus === '1px solid' && p.teksti === 'Sähköpapyrosoi asetukset', p.tyyli + ' | ' + p.reunus + ' | ' + p.teksti);
  tulos(`${laji}: nappi ei osu Teema-riviin`, p.alla >= 4, p.alla + ' px');
  tulos(`${laji}: kytkimen nimi tummassa Mustin`, await page.evaluate(() => document.querySelector('button[data-kytkin="kontrasti"]').textContent) === 'Mustin');
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-ennen-${kosketus ? 'kapea' : 'levea'}.png`) });

  // 2. Papyrosointi tummasta.
  await page.evaluate(kirjaaVaiheet);
  await napauta('#papyrosoi');
  await page.waitForTimeout(700);
  await napauta('#papyrosoi'); // kesken: ei saa vaikuttaa
  if (KUVAT) { await page.waitForTimeout(1500); await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-kuittaus-${kosketus ? 'kapea' : 'levea'}.png`) }); }
  await page.waitForTimeout(KUVAT ? 2400 : 3900);
  let v = await page.evaluate(() => window.__vaiheet);
  const jarj = v.filter(x => x.vaihe).reduce((a, x) => (a[a.length - 1] && a[a.length - 1].vaihe === x.vaihe && a[a.length - 1].t === x.t ? a : a.concat(x)), []);
  const vaiheet = [...new Set(v.map((x, i) => i + ':' + x.vaihe))].map(s => s.split(':')[1]);
  const pelkat = vaiheet.filter((x, i) => x !== vaiheet[i - 1]);
  tulos(`${laji}: vaiheet tummasta`, pelkat.join(' ') === ' mustin tcf mustin tcf ', pelkat.join(' '));
  const tausta = v.filter(x => x.vaihe).every(x => x.varit === VARIT[x.vaihe]);
  tulos(`${laji}: tausta, teksti ja kehä tanssivat`, tausta, JSON.stringify(v.filter(x => x.vaihe).map(x => x.vaihe + ' ' + x.varit)));
  const leveys = new Set(v.filter(x => x.vaihe).map(x => x.leveys));
  tulos(`${laji}: leveys pysyy vatkauksen ajan`, leveys.size === 1 && [...leveys][0] === v[0].leveys, [...leveys].join(', ') + ' / ' + v[0].leveys);
  const ennen4 = v.filter(x => x.t < 1900);
  const papStr = Object.values(SAHKOPAPERI).join(',');
  tulos(`${laji}: asetukset vasta neljännessä vaiheessa`, ennen4.every(x => x.papyrus !== papStr) && v.some(x => x.teksti === 'Sähköpapyrosoitu' && x.papyrus === papStr),
    JSON.stringify(v.map(x => x.t + ' ' + x.vaihe + ' ' + x.teksti + ' ' + x.papyrus)));
  const k4 = v.find(x => x.teksti === 'Sähköpapyrosoitu'), loppu = v[v.length - 1];
  tulos(`${laji}: vaiheet 700 ms, kuittaus noin 2,2 s`, k4 && k4.vaihe === 'tcf' && Math.abs(k4.t - 2100) < 150 && Math.abs(loppu.t - k4.t - 2200) < 200, k4 && (k4.t + ' → ' + loppu.t));
  tulos(`${laji}: lopuksi Oletusasetukset`, loppu.vaihe === '' && loppu.teksti === 'Oletusasetukset', JSON.stringify(loppu));
  const tallessa = await page.evaluate(() => JSON.parse(localStorage.getItem('luin-asetukset')));
  tulos(`${laji}: papyrosoitu tallessa`, Object.keys(SAHKOPAPERI).every(k => tallessa[k] === SAHKOPAPERI[k]));
  const kytkimet = await page.evaluate(() => [...document.querySelectorAll('#asetukset button[data-kytkin="kontrasti"], #asetukset button[data-kytkin^="sivu"], #asetukset .asetus[data-a="teema"] .valinnat button[data-arvo], #asetukset .asetus[data-a="sivutus"] .valinnat button[data-arvo]')].map(b => (b.dataset.kytkin || b.dataset.arvo) + '=' + b.getAttribute('aria-pressed')).join(' '));
  tulos(`${laji}: kytkimet näyttävät uuden tilan`, kytkimet === 'vaalea=true tumma=false kontrasti=true vieritys=false sivut=true sivuReuna=true sivuPyyhka=false sivunapit=true', kytkimet);
  tulos(`${laji}: kytkimen nimi vaaleassa TCF-valkaisu`, await page.evaluate(() => document.querySelector('button[data-kytkin="kontrasti"]').textContent) === 'TCF-valkaisu');
  const pv = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).color);
  tulos(`${laji}: TCF: valkoinen tausta, musta muste`, pv === 'rgb(255, 255, 255) rgb(0, 0, 0)', pv);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-papyrosoitu-${kosketus ? 'kapea' : 'levea'}.png`) });

  // 3. Kontrastikytkin muuttaa vain taustan (ja vaalean musteen).
  const vertaa = await page.evaluate((M) => {
    const r = document.documentElement, lue = () => { const cs = getComputedStyle(r); return M.map(m => cs.getPropertyValue(m).trim()); };
    const tulos = {};
    for (const t of ['vaalea', 'tumma']) {
      r.dataset.teema = t;
      r.classList.remove('kontrasti'); const a = lue();
      r.classList.add('kontrasti'); const b = lue();
      tulos[t] = M.filter((m, i) => a[i] !== b[i]).map((m, i) => m + '=' + b[M.indexOf(m)]).join(' ');
    }
    r.dataset.teema = window.__luin.aset.teema; r.classList.toggle('kontrasti', !!window.__luin.aset.kontrasti);
    const saannot = [];
    for (const ss of document.styleSheets) { try { for (const sr of ss.cssRules) if (sr.selectorText && /kontrasti/.test(sr.selectorText)) saannot.push(sr.selectorText); } catch (e) {} }
    tulos.saannot = saannot.join(' | ');
    return tulos;
  }, MUUTTUJAT);
  tulos(`${laji}: vaaleassa muuttuu vain paperi ja muste`, vertaa.vaalea === '--paperi=#ffffff --muste=#000000', vertaa.vaalea);
  tulos(`${laji}: tummassa muuttuu vain paperi`, vertaa.tumma === '--paperi=#000000', vertaa.tumma);
  tulos(`${laji}: ei muita kontrastisääntöjä`, vertaa.saannot === ':root.kontrasti:not([data-teema="tumma"]) | :root.kontrasti[data-teema="tumma"]', vertaa.saannot);

  // 4. TCF-vihje.
  const vihje = () => page.evaluate(() => { const v = document.getElementById('tcf-vihje'); return v.hidden ? '' : v.textContent; });
  const TEKSTI = 'TCF: total chlorine free bleaching eli TÄYSIN klooriton taustapaperin valkaisu';
  if (!kosketus) {
    await page.hover('button[data-kytkin="kontrasti"]');
    await page.waitForTimeout(600);
    tulos(`${laji}: vihje ei vielä 0,6 s:ssa`, (await vihje()) === '');
    await page.waitForTimeout(600);
    tulos(`${laji}: vihje hiiren viipymästä`, (await vihje()) === TEKSTI, await vihje());
    const vr = await page.evaluate(() => { const v = document.getElementById('tcf-vihje').getBoundingClientRect(), p = document.getElementById('asetukset').getBoundingClientRect(); return { sisalla: v.left >= p.left && v.right <= p.right }; });
    tulos(`${laji}: vihje paneelin sisällä`, vr.sisalla);
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'sahkopaperi-tcf-vihje-levea.png') });
    await page.click('#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]');
    const t = await page.evaluate(() => window.__luin.aset.teema);
    tulos(`${laji}: ohi napsautus vain sulkee vihjeen`, (await vihje()) === '' && t === 'vaalea', t);
    await page.click('button[data-kytkin="kontrasti"]');
    tulos(`${laji}: hiirellä napsautus sammuttaa`, (await page.evaluate(() => window.__luin.aset.kontrasti)) === 0 && (await vihje()) === '');
    await page.click('button[data-kytkin="kontrasti"]');
    await page.click('#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]');
    await page.hover('button[data-kytkin="kontrasti"]'); await page.waitForTimeout(1300);
    tulos(`${laji}: Mustin ei avaa vihjettä`, (await vihje()) === '');
    await page.click('#asetukset .asetus[data-a="teema"] button[data-arvo="vaalea"]');
  } else {
    await napauta('button[data-kytkin="kontrasti"]');
    tulos(`${laji}: päällä olevan napautus avaa vihjeen`, (await vihje()) === TEKSTI && (await page.evaluate(() => window.__luin.aset.kontrasti)) === 1, await vihje());
    if (KUVAT) await page.screenshot({ path: path.join(KUVAT, 'sahkopaperi-tcf-vihje-kapea.png') });
    await napauta('#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]');
    const t = await page.evaluate(() => window.__luin.aset.teema);
    tulos(`${laji}: ohi napautus vain sulkee vihjeen`, (await vihje()) === '' && t === 'vaalea', t);
    await napauta('button[data-kytkin="kontrasti"]');
    tulos(`${laji}: seuraava napautus sammuttaa`, (await page.evaluate(() => window.__luin.aset.kontrasti)) === 0 && (await vihje()) === '');
    await napauta('button[data-kytkin="kontrasti"]');
    tulos(`${laji}: päälle ilman vihjettä`, (await page.evaluate(() => window.__luin.aset.kontrasti)) === 1 && (await vihje()) === '');
    await napauta('button[data-kytkin="kontrasti"]');
    tulos(`${laji}: uusi päällekytkentä, vihje taas`, (await vihje()) === TEKSTI);
    await napauta('#tcf-vihje');
    tulos(`${laji}: vihjeen oma napautus sulkee`, (await vihje()) === '' && (await page.evaluate(() => window.__luin.aset.kontrasti)) === 1);
  }

  // 5. Oletusasetukset vaaleasta.
  tulos(`${laji}: nappi yhä Oletusasetukset`, (await nappi()) === 'Oletusasetukset', await nappi());
  await page.evaluate(kirjaaVaiheet);
  await napauta('#papyrosoi');
  await page.waitForTimeout(4700);
  v = await page.evaluate(() => window.__vaiheet);
  const vv = v.map(x => x.vaihe).filter((x, i, a) => x !== a[i - 1]);
  tulos(`${laji}: vaiheet vaaleaan oletukseen`, vv.join(' ') === ' mustin tcf mustin tcf ', vv.join(' '));
  tulos(`${laji}: kuittaus Palautettu`, v.some(x => x.teksti === 'Palautettu' && x.vaihe === 'tcf'));
  const oletus = await page.evaluate(() => ['teema', 'kontrasti', 'sivutus', 'sivuReuna', 'sivuPyyhka', 'sivunapit'].map(k => window.__luin.aset[k]).join(','));
  const odotettu = kosketus ? 'vaalea,0,sivut,1,1,1' : 'vaalea,0,vieritys,1,1,1';
  tulos(`${laji}: laitteen oletukset palautettu`, oletus === odotettu, oletus);
  tulos(`${laji}: nappi taas Sähköpapyrosoi asetukset`, (await nappi()) === 'Sähköpapyrosoi asetukset', await nappi());
  const tav = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).color);
  tulos(`${laji}: tavallinen vaalea`, tav === 'rgb(250, 245, 234) rgb(35, 28, 20)', tav);

  // 6. Mustin lukimessa: musta tausta, lämmin teksti.
  await napauta('#asetukset .asetus[data-a="teema"] button[data-arvo="tumma"]');
  await napauta('button[data-kytkin="kontrasti"]');
  await napauta('#asetukset .sulje');
  await page.evaluate(() => { location.hash = '#id=p-koe'; });
  await page.waitForSelector('#lukija:not([hidden])', { state: 'attached' }); await page.waitForTimeout(600);
  await page.evaluate(() => { const o = document.getElementById('palkkiopas'); if (o) o.hidden = true; });
  const tp = await page.evaluate(() => getComputedStyle(document.body).backgroundColor + ' ' + getComputedStyle(document.body).color);
  tulos(`${laji}: Mustin lukimessa`, tp === 'rgb(0, 0, 0) rgb(235, 223, 202)', tp);
  if (KUVAT) await page.screenshot({ path: path.join(KUVAT, `sahkopaperi-lukin-mustin-${kosketus ? 'kapea' : 'levea'}.png`) });
  tulos(`${laji}: ei sivuvirheitä`, !virheet.length, virheet.join(' | '));
  await ctx.close();
}

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const U = `http://127.0.0.1:${palvelin.address().port}/`;
  const selain = await chromium.launch();
  try { await aja(selain, U, false); await aja(selain, U, true); }
  finally { await selain.close(); palvelin.close(); }
  console.log(virheita ? `\n${virheita} vikaa` : '\nKaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})();
