// Lomitetun käännöksen kopio (opas 3.2, Kielet): kopiointi vie vain näkyvästi valitun tekstin (käyttäjän päätös). Kielet-asetuksen
// piilottama kieli on DOMissa (display: none), ja valinta alkutekstin kappaleesta seuraavaan kattaa sen välissä olevan käännöksen.
// Tilat Alkuteksti, Käännös ja Molemmat; reitit Ctrl+C (selaimen maalaus; copy-tapahtuman text/plain ja text/html sekä leikepöytä),
// valinnan valikon Kopioi, Kopioi viittauksen kanssa ja Kopioi koko lähteen kanssa (molemmat maalaustavat, aset.maalaus) sekä
// sukkelan alleviivauksen valikon kopio. Työpöytä 1280 px (Molemmat rinnakkain) ja 412 px (allekkain). Molemmat-tilan kopio on
// koko valinta kuten ennen, ja alleviivauksen palat ovat samat tilasta riippumatta (piilotettu teksti pysyy DOMissa).
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node luin/kehitys/lomitus-kopio-testi.js [kuvakansio]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2] || '';
const MD = '---\nladonta: lomitettu käännös\n---\n\n# Lettera a Francesco Vettori\n\n' +
  'Venuta la sera, mi ritorno a casa ed entro nel mio scrittoio; e in sull’uscio mi spoglio quella veste cotidiana, piena di fango e di loto.\n\n' +
  '> At nightfall I return home and seek my writing room, and, divesting myself on its threshold of my rustic garments, stained with mud and mire.\n\n' +
  'E rivestito condecentemente, entro nelle antique corti delli antiqui huomini.\n\n' +
  '> And thus suitably clothed, enter within the ancient courts of ancient men.\n';
const I1 = 'Venuta la sera, mi ritorno a casa ed entro nel mio scrittoio; e in sull’uscio mi spoglio quella veste cotidiana, piena di fango e di loto.';
const E1 = 'At nightfall I return home and seek my writing room, and, divesting myself on its threshold of my rustic garments, stained with mud and mire.';
// Veto: Alkuteksti ja Molemmat ensimmäisestä italian kappaleesta toiseen (sanasta antique), Käännös ensimmäisestä englannin
// kappaleesta toiseen (sanasta ancient). Maalaus tarttuu kokonaisiin sanoihin, joten valikon ote tiedetään tarkasti.
const VETO = { alku: ['Venuta', 'antique'], molemmat: ['Venuta', 'antique'], kaannos: ['nightfall', 'ancient'] };
const OTE = {
  alku: I1 + '\n\nE rivestito condecentemente, entro nelle antique',
  molemmat: I1 + '\n\n' + E1 + '\n\nE rivestito condecentemente, entro nelle antique',
  kaannos: E1.slice(3) + '\n\nAnd thus suitably clothed, enter within the ancient'
};
// Piilotetun kielen tunnussanat (eivät saa olla kopiossa) ja näkyvän valinnan sanat (pitää olla).
const PIILO = { alku: /nightfall|mire|suitably/, kaannos: /Venuta|loto|rivestito|antique/, molemmat: null };
const NAKYY = { alku: ['sera', 'loto', 'condecentemente'], kaannos: ['return', 'mire', 'suitably'], molemmat: ['sera', 'loto', 'nightfall', 'mire', 'condecentemente'] };

const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.md': 'text/markdown; charset=utf-8' };
const palvelin = http.createServer((q, r) => {
  const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
  if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(r);
}).listen(0);
let virheita = 0;
const tulos = (nimi, ok, tieto) => { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto !== undefined ? ' – ' + tieto : '')); };
const shy = s => String(s == null ? '' : s).replace(/­/g, '');
const nakyva = (lom, t) => { t = shy(t); return !!t && !(PIILO[lom] && PIILO[lom].test(t)) && NAKYY[lom].every(w => t.includes(w)); };
const lyh = s => JSON.stringify(shy(s).replace(/(.{40}).{20,}(.{40})/s, '$1…$2'));

(async () => {
  await new Promise(r => palvelin.once('listening', r));
  const BASE = 'http://127.0.0.1:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const sivuvirheet = [];
  const palat = {};
  for (const [laite, vp] of [['työpöytä', { width: 1280, height: 900 }], ['412 px', { width: 412, height: 824 }]]) {
    for (const lom of ['alku', 'kaannos', 'molemmat']) {
      for (const maalaus of ['luin', 'selain']) {
        for (const auto of [0, 1]) {
          const nimi = `${laite}, ${{ alku: 'Alkuteksti', kaannos: 'Käännös', molemmat: 'Molemmat' }[lom]}, ${maalaus === 'luin' ? 'Luinin maalaus' : 'selaimen maalaus'}${auto ? ', sukkela' : ''}`;
          const ctx = await b.newContext({ viewport: vp });
          await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE.slice(0, -1) });
          const p = await ctx.newPage();
          p.on('pageerror', e => sivuvirheet.push(e.message));
          await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
          // copy-tapahtuman sisältö Luinin käsittelijän jälkeen (ikkunan kuuntelija kuplii viimeisenä).
          await p.addInitScript(() => { window.__kopiot = []; window.addEventListener('copy', e => window.__kopiot.push({ plain: e.clipboardData.getData('text/plain'), html: e.clipboardData.getData('text/html') })); });
          await p.goto(BASE + 'luin.html');
          await p.evaluate(([md, a]) => { localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify(a)); },
            [MD, { av: 11, lomitus: lom, maalaus, auto, sivutus: 'vieritys' }]);
          await p.goto('about:blank'); await p.goto(BASE + 'luin.html#tuo');
          await p.waitForFunction(() => window.__luin && window.__luin.nyt() && window.__luin.nyt().blocks.length > 4, null, { timeout: 15000 });
          await p.waitForTimeout(300);
          // Piilotettu kieli on DOMissa ja vain CSS piilottaa sen; rinnakkain vain leveällä ruudulla.
          const dom = await p.evaluate(() => {
            const art = document.querySelector('#teksti'), n = window.__luin.nyt();
            return { luokka: art.className, lohkot: n.txt.length, teksti: n.txt.join('|').replace(/­/g, '').length,
              piilossa: [...art.querySelectorAll('[data-b]')].filter(el => !el.getClientRects().length).length };
          });
          const piiloOdotus = { alku: 2, kaannos: 2, molemmat: 0 }[lom];
          if (!auto) tulos(`${nimi}: tila ja DOM`, dom.lohkot === 5 && dom.piilossa === piiloOdotus && dom.luokka.includes('lomitus-alku') === (lom === 'alku') &&
            dom.luokka.includes('lomitus-kaannos') === (lom === 'kaannos') && dom.luokka.includes('rinnakkain') === (lom === 'molemmat' && vp.width === 1280),
            JSON.stringify(dom));
          // Vetopisteet: sanan toisen merkin vasen reuna (+1 px, kokonaisina pikseleinä), pehmeistä tavuviivoista välittämättä.
          const pt = await p.evaluate(([s1, s2]) => {
            window.scrollTo(0, 0);
            const piste = sana => {
              for (const el of document.querySelectorAll('#teksti [data-b]')) {
                const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
                while ((t = tw.nextNode())) {
                  const raaka = [], puhdas = [...t.data].filter((c, i) => { if (c === '­') return false; raaka.push(i); return true; }).join(''), i = puhdas.indexOf(sana);
                  if (i < 0) continue;
                  const r = document.createRange(); r.setStart(t, raaka[i + 2]); r.setEnd(t, raaka[i + 2] + 1); const q = r.getClientRects()[0];
                  if (q && q.width) return { x: Math.round(q.left + 1), y: Math.round(q.top + q.height / 2) };
                }
              }
              return null;
            };
            return { a: piste(s1), z: piste(s2) };
          }, VETO[lom]);
          if (!pt.a || !pt.z) { tulos(`${nimi}: vetopisteet`, false, JSON.stringify(pt)); await ctx.close(); continue; }
          const veda = async () => { await p.mouse.move(pt.a.x, pt.a.y); await p.mouse.down(); await p.mouse.move(pt.z.x, pt.z.y, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(300); };
          const leike = () => p.evaluate(async () => {
            const o = {};
            for (const i of await navigator.clipboard.read()) for (const t of i.types) o[t] = await (await i.getType(t)).text();
            return o;
          });
          const siivoa = () => p.evaluate(() => {
            getSelection().removeAllRanges();
            const n = window.__luin.nyt();
            n.merk.al.forEach(h => document.querySelectorAll('mark.ali[data-h="' + h.id + '"]').forEach(m => { const q = m.parentNode; while (m.firstChild) q.insertBefore(m.firstChild, m); q.removeChild(m); q.normalize(); }));
            n.merk.al.length = 0;
          });
          const tulokset = {};
          for (const kv of ['ei', 'lyhyt', 'pitka']) {
            await p.evaluate(t => { window.__luin.aset.kopioViite = t; }, kv);
            await p.evaluate(() => navigator.clipboard.writeText('-'));
            await veda();
            if (auto) {
              // Sukkela: veto alleviivaa, valikko alleviivauksen napautuksesta.
              const m = await p.evaluate(() => {
                const al = window.__luin.nyt().merk.al, h = al[al.length - 1], mk = h && document.querySelector('mark.ali[data-h="' + h.id + '"]');
                if (!mk) return null;
                const q = mk.getClientRects()[0];
                return { x: q.left + 3, y: q.top + q.height / 2, segs: h.segs.map(s => [s.b, s.s, s.e].join(':')).join(' ') };
              });
              if (!m) { tulokset[kv] = { virhe: 'ei alleviivausta' }; await siivoa(); continue; }
              palat[`${laite}/${lom}/${maalaus}`] = m.segs;
              await p.mouse.click(m.x, m.y); await p.waitForTimeout(250);
            }
            const nappi = await p.$('#pop:not([hidden]) button[data-k="kopioi"]');
            if (!nappi) { tulokset[kv] = { virhe: 'ei valikkoa' }; await siivoa(); continue; }
            if (KUVAT && kv === 'ei') await p.screenshot({ path: path.join(KUVAT, `lomitus-kopio-${vp.width}-${lom}-${maalaus}${auto ? '-sukkela' : ''}.png`) });
            await nappi.click(); await p.waitForTimeout(250);
            tulokset[kv] = { leike: await leike(), lyhyt: await p.evaluate(() => window.__luin.lyhytViite()) };
            await p.keyboard.press('Escape'); await p.waitForTimeout(100);
            await siivoa();
          }
          const ote = OTE[lom], reitti = auto ? 'alleviivauksen valikko' : 'valinnan valikko';
          const ei = tulokset.ei.leike || {}, ly = tulokset.lyhyt.leike || {}, pi = tulokset.pitka.leike || {};
          tulos(`${nimi}: ${reitti}, Kopioi`, shy(ei['text/plain']) === ote && !ei['text/html'], lyh(ei['text/plain'] || JSON.stringify(tulokset.ei)));
          tulos(`${nimi}: ${reitti}, Kopioi viittauksen kanssa`, shy(ly['text/plain']) === ote + ' (' + tulokset.lyhyt.lyhyt + ')', lyh(ly['text/plain'] || JSON.stringify(tulokset.lyhyt)));
          const kpl = (pi['text/html'] || '').match(/<p>/g) || [];
          tulos(`${nimi}: ${reitti}, Kopioi koko lähteen kanssa (text/plain ja text/html)`, shy(pi['text/plain']).indexOf(ote + '\n\n') === 0 && nakyva(lom, pi['text/html']) &&
            kpl.length === ote.split('\n\n').length + 1, lyh(pi['text/html'] || JSON.stringify(tulokset.pitka)));
          if (maalaus === 'selain' && !auto) {
            // Tavallinen kopiointi (Ctrl+C): Luinin copy-käsittelijä kirjoittaa selaimen valinnan tekstin ilman tavuviivoja.
            await p.evaluate(() => navigator.clipboard.writeText('-'));
            await veda(); await p.keyboard.press('Escape');
            const sel = shy(await p.evaluate(() => getSelection().toString()));
            await p.keyboard.press('Control+c'); await p.waitForTimeout(200);
            const kop = (await p.evaluate(() => window.__kopiot.slice())).pop() || {}, lk = await leike();
            tulos(`${nimi}: Ctrl+C (copy-tapahtuma ja leikepöytä)`, nakyva(lom, sel) && kop.plain === sel && !/­/.test(kop.plain) && (!kop.html || nakyva(lom, kop.html)) &&
              lk['text/plain'] === sel && (!lk['text/html'] || nakyva(lom, lk['text/html'])), lyh(kop.plain) + (kop.html ? ' html ' + lyh(kop.html) : ''));
          }
          await ctx.close();
        }
      }
    }
  }
  // Merkinnät eivät riipu Kielet-tilasta: sama veto alleviivaa samat palat Alkutekstissä ja Molemmissa (myös piilotetun käännöksen).
  for (const laite of ['työpöytä', '412 px']) for (const maalaus of ['luin', 'selain']) {
    const a = palat[`${laite}/alku/${maalaus}`], m = palat[`${laite}/molemmat/${maalaus}`];
    tulos(`${laite}, ${maalaus === 'luin' ? 'Luinin maalaus' : 'selaimen maalaus'}: alleviivauksen palat samat Alkutekstissä ja Molemmissa`, !!a && a === m && a.split(' ').length === 3, `${a} / ${m}`);
  }
  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join('; '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa.' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})();
