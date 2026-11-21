// Osanvaihtojen kohdat Sisälmyksessä (käyttäjän toive 21.11.2026: otsikottomat viivoin erotetut lohkot navigaattoriin). Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/sisalmys-vali-testi.js [kuvakansio]
// Otsikottomassa luennossa (neljä –––) Sisälmys näkyy ja listaa (i)–(v) alkusanoineen; luvun sisäiset * * * ovat luvun alla
// tasoa alempana; pelkkien otsikoiden tekstin Sisälmys on ennallaan; kohdan napautus vie lohkoon.
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

const KPL = 'Tieteiden järjestelmä on ajatuksen oma liike, joka ei ole ulkoa tuotu luokittelu vaan itsensä tietävän hengen kehitys, ja sen esittäminen vaatii kärsivällisyyttä.';
const ALUT = ['Arvoisat kuulijat, kun nyt ensimmäistä kertaa astun tähän', 'Mutta jos tieteen käsite on tämä, niin', 'Kolmanneksi on huomattava', 'Lyhyesti', 'Lopuksi sallittakoon minun kiittää'];
const TEKSTIT = {
  luento: '# Tieteiden järjestelmästä\n\n' + ALUT.map(a => a + ' ' + KPL + '\n\n' + KPL).join('\n\n–––\n\n') + '\n',
  luvut: '# Kirja\n\n## Ensimmäinen luku\n\n' + KPL + '\n\n* * *\n\n' + KPL + '\n\n* * *\n\nToinen jakso alkaa näin. ' + KPL +
    '\n\n## Toinen luku\n\n' + KPL + '\n\n### Osio\n\n' + KPL + '\n',
  otsikot: '# Artikkeli\n\n## Johdanto\n\n' + KPL + '\n\n## Tulokset\n\n' + KPL + '\n\n### Ensimmäinen\n\n' + KPL + '\n'
};

(async () => {
  await new Promise(r => palvelin.listen(0, r));
  const BASE = 'http://localhost:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const kk = await b.newContext({ viewport: { width: 1200, height: 900 } });
  const p = await kk.newPage();
  const sivuvirheet = [];
  p.on('pageerror', e => sivuvirheet.push(e.message));
  const avaa = async md => {
    await p.goto(BASE + 'luin.html');
    await p.evaluate(md => {
      localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' }));
      localStorage.setItem('luin-asetukset', JSON.stringify({ av: 11, teema: 'vaalea', sivutus: 'vieritys', koko: 18, kokoKasin: 1 }));
    }, md);
    await p.goto('about:blank'); await p.goto(BASE + 'luin.html#tuo');
    await p.waitForFunction(() => window.__luin && window.__luin.nyt() && document.querySelector('#teksti [data-b]'));
    await p.waitForTimeout(600);
  };
  const lista = async () => {
    const nakyy = await p.evaluate(() => !document.getElementById('sis-avaa').hidden);
    if (!nakyy) return { nakyy, rivit: [] };
    await p.evaluate(() => document.getElementById('sis-avaa').click());
    await p.waitForTimeout(300);
    const rivit = await p.$$eval('#sisalmys button.s-kohta', bs => bs.map(x => ({ t: x.className.replace('s-kohta ', ''), nimi: x.querySelector('.s-nimi').textContent, b: +x.dataset.b,
      alku: x.querySelector('.s-alku') ? getComputedStyle(x.querySelector('.s-alku')).fontStyle : '' })));
    return { nakyy, rivit };
  };

  await avaa(TEKSTIT.luento);
  let L = await lista();
  tulos('luento: Sisälmys näkyy', L.nakyy);
  tulos('luento: viisi kohtaa (i)–(v)', L.rivit.length === 5 && L.rivit.map(r => r.nimi.split(' ')[0]).join(' ') === '(i) (ii) (iii) (iv) (v)', L.rivit.map(r => r.nimi).join(' | '));
  tulos('luento: alkusanat kursiivilla, ensimmäinen taso', L.rivit.every(r => r.alku === 'italic' && r.t === 't1'));
  tulos('luento: lyhyt alku ilman katkoa, pitkä katkottu', /^\(ii\) Mutta jos tieteen käsite on tämä,?…$/.test(L.rivit[1] && L.rivit[1].nimi) && L.rivit[3] && /^\(iv\) Lyhyesti Tieteiden/.test(L.rivit[3].nimi), L.rivit[1] && L.rivit[1].nimi + ' / ' + (L.rivit[3] && L.rivit[3].nimi));
  if (KUVAT) await p.screenshot({ path: path.join(KUVAT, 'sisalmys-luento.png') });
  // Napautus vie lohkoon.
  const kohde = L.rivit[2] && L.rivit[2].b;
  await p.evaluate(b => document.querySelector('#sisalmys button.s-kohta[data-b="' + b + '"]').click(), kohde);
  await p.waitForTimeout(600);
  const paikka = await p.evaluate(() => window.__luin.tila.ankkuri);
  tulos('luento: (iii) vie lohkoon', paikka && paikka.b === kohde, JSON.stringify(paikka) + ' / ' + kohde);

  await avaa(TEKSTIT.luvut);
  L = await lista();
  tulos('luvut: luku, kohdat (i)–(iii) luvun alla, luku, osio', L.rivit.map(r => r.t + ':' + r.nimi.split(' ')[0]).join(' ') === 't1:Ensimmäinen t2:(i) t2:(ii) t2:(iii) t1:Toinen t2:Osio', L.rivit.map(r => r.t + ':' + r.nimi).join(' | '));
  tulos('luvut: lyhyt kokonainen virke ilman katkoa', L.rivit[3] && L.rivit[3].nimi === '(iii) Toinen jakso alkaa näin.', L.rivit[3] && L.rivit[3].nimi);

  await avaa(TEKSTIT.otsikot);
  L = await lista();
  tulos('otsikot: ennallaan, ei alkusanoja', L.rivit.map(r => r.t + ':' + r.nimi).join(' ') === 't1:Johdanto t1:Tulokset t2:Ensimmäinen' && L.rivit.every(r => !r.alku), L.rivit.map(r => r.t + ':' + r.nimi).join(' | '));

  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join(' | '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
