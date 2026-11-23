// Lomitetun käännöksen valinta on yhtä kieltä (opas 3.2, Kielet; käyttäjän päätös): valinnan alkupään (ankkurin) kieli, yksikielisessä
// tilassa näkyvä kieli. Luonnos, alleviivaus ja valikon toiminnot (kopio, lausekäännöksen DeepL-osoite, sanaselityksen haku) ovat
// samaa kieltä eivätkä ota piilotettua tekstiä. Tallennettu merkintä näkyy samoissa merkeissä kaikissa Kielet-tiloissa ja on
// piilossa tekstinsä mukana. Selaimen maalauksessa korostus on selaimen oma (Molemmat-tilassa molemmat kielet), mutta valikko ja
// merkintä ovat yhtä kieltä. Tilat Alkuteksti, Käännös ja Molemmat; valinta italiasta seuraavan parin italiaan, englannista
// seuraavaan englantiin ja Molemmat-tilassa kielirajan yli kumpaankin suuntaan; molemmat maalaustavat; 1280 px (rinnakkain) ja
// 412 px (allekkain). Lisäksi valinta, joka kattaa vain piilotetun kappaleen, ei avaa valikkoa.
// Ajo repon juuressa: NODE_PATH=$(npm root -g) node luin/kehitys/lomitus-merkinta-testi.js [kuvakansio]
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
// Vedot: alku- ja loppusana (merkin indeksi sanassa), odotettu ote (palat \n\n:llä), kieli ja sanaselitys (vain yhden palan valinnasta).
const VEDOT = {
  I: { nimi: 'italiasta italiaan', a: ['Venuta', 2], z: ['antique', 3], kieli: 'alku', ote: I1 + '\n\nE rivestito condecentemente, entro nelle antique' },
  E: { nimi: 'englannista englantiin', a: ['nightfall', 2], z: ['ancient', 3], kieli: 'kaannos', ote: E1.slice(3) + '\n\nAnd thus suitably clothed, enter within the ancient' },
  IE: { nimi: 'italiasta englantiin', a: ['fango', 2], z: ['nightfall', 3], kieli: 'alku', ote: 'fango e di loto', sk: true },
  EI: { nimi: 'englannista takaisin italiaan', a: ['nightfall', 3], z: ['fango', 2], kieli: 'kaannos', ote: 'At nightfall', sk: true }
};
const TAPAUKSET = [['alku', 'I'], ['kaannos', 'E'], ['molemmat', 'I'], ['molemmat', 'E'], ['molemmat', 'IE'], ['molemmat', 'EI']];
const TILAT = { alku: 'Alkuteksti', kaannos: 'Käännös', molemmat: 'Molemmat' };
const NAKYVA = { alku: ['alku'], kaannos: ['kaannos'], molemmat: ['alku', 'kaannos'] };
// Toisen kielen tunnussanat (eivät saa olla valikon toiminnoissa).
const TOINEN = { alku: /\bAt\b|nightfall|mire|suitably/i, kaannos: /venuta|loto|fango|rivestito|antique/i };

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
const lyh = s => JSON.stringify(shy(s).replace(/(.{30}).{20,}(.{30})/s, '$1…$2'));
// DeepL-osoitteen teksti: translator#lähde/kohde/teksti, jossa / on \/.
const deeplTeksti = u => { const o = String(u).split('#')[1] || ''; return decodeURIComponent(o.split('/').slice(2).join('/')).replace(/\\\//g, '/'); };

(async () => {
  await new Promise(r => palvelin.once('listening', r));
  const BASE = 'http://127.0.0.1:' + palvelin.address().port + '/';
  const b = await chromium.launch();
  const sivuvirheet = [];
  for (const [laite, vp] of [['työpöytä', { width: 1280, height: 900 }], ['412 px', { width: 412, height: 824 }]]) {
    for (const maalaus of ['luin', 'selain']) {
      const ryhma = `${laite}, ${maalaus === 'luin' ? 'Luinin maalaus' : 'selaimen maalaus'}`;
      const ctx = await b.newContext({ viewport: vp });
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE.slice(0, -1) });
      const p = await ctx.newPage();
      p.on('pageerror', e => sivuvirheet.push(e.message));
      const skHaut = [];
      await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => { if (/wiktionary/.test(r.request().url())) skHaut.push(r.request().url()); r.abort(); });
      await p.addInitScript(() => { window.__avattu = []; window.open = u => { window.__avattu.push(u); return null; }; });
      await p.goto(BASE + 'luin.html');
      await p.evaluate(([md, a]) => { localStorage.clear(); localStorage.setItem('luin-tuonti', JSON.stringify({ md, nimi: 'testi' })); localStorage.setItem('luin-asetukset', JSON.stringify(a)); },
        [MD, { av: 11, lomitus: 'molemmat', maalaus, auto: 0, kaannos: 1, sanakirja: 1, sivutus: 'vieritys' }]);
      await p.goto('about:blank'); await p.goto(BASE + 'luin.html#tuo');
      await p.waitForFunction(() => window.__luin && window.__luin.nyt() && window.__luin.nyt().blocks.length > 4, null, { timeout: 15000 });
      await p.waitForTimeout(300);
      // Kielet-asetus käyttöliittymästä (asettelu suljettaessa); tarkistetaan luokasta.
      const tilaan = async l => {
        await p.keyboard.press('Escape');
        await p.evaluate(() => document.querySelector('#lukija .ratas').click());
        await p.waitForSelector('#asetukset:not([hidden])');
        await p.evaluate(l => document.querySelector('#asetukset .asetus[data-a="lomitus"] button[data-arvo="' + l + '"]').click(), l);
        await p.evaluate(() => document.querySelector('#asetukset .sulje').click());
        await p.waitForTimeout(250);
        return p.evaluate(() => document.querySelector('#teksti').className);
      };
      const piste = (sana, k) => p.evaluate(([sana, k]) => {
        window.scrollTo(0, 0);
        for (const el of document.querySelectorAll('#teksti [data-b]')) {
          if (!el.getClientRects().length) continue;
          const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
          while ((t = tw.nextNode())) {
            const raaka = [], puhdas = [...t.data].filter((c, i) => { if (c === '­') return false; raaka.push(i); return true; }).join(''), i = puhdas.indexOf(sana);
            if (i < 0) continue;
            const r = document.createRange(); r.setStart(t, raaka[i + k]); r.setEnd(t, raaka[i + k] + 1); const q = r.getClientRects()[0];
            if (q && q.width) return { x: Math.round(q.left + 1), y: Math.round(q.top + q.height / 2) };
          }
        }
        return null;
      }, [sana, k]);
      const veda = async v => {
        const a = await piste(...v.a), z = await piste(...v.z);
        if (!a || !z) return false;
        await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(z.x, z.y, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(300);
        return true;
      };
      // Lohkojen kielet ja alleviivauksen merkit lohkoittain (teksti ja näkyykö).
      const lohkot = () => p.evaluate(() => {
        const o = {};
        document.querySelectorAll('#teksti [data-b]').forEach(el => { o[el.dataset.b] = el.closest('blockquote.kaannos') ? 'kaannos' : el.matches('p.alku') ? 'alku' : ''; });
        return o;
      });
      const merkit = sel => p.evaluate(sel => {
        const o = {};
        document.querySelectorAll(sel).forEach(m => {
          const b = m.closest('[data-b]').dataset.b;
          o[b] = o[b] || { t: '', nakyy: false };
          o[b].t += m.textContent.replace(/­/g, ''); o[b].nakyy = o[b].nakyy || m.getClientRects().length > 0;
        });
        return o;
      }, sel);
      const kieli = await lohkot();
      const siivoa = async () => {
        await p.keyboard.press('Escape');
        await p.evaluate(() => {
          getSelection().removeAllRanges();
          const n = window.__luin.nyt();
          n.merk.al.forEach(h => document.querySelectorAll('mark.ali[data-h="' + h.id + '"]').forEach(m => { const q = m.parentNode; while (m.firstChild) q.insertBefore(m.firstChild, m); q.removeChild(m); q.normalize(); }));
          n.merk.al.length = 0;
        });
      };
      for (const [tila, vk] of TAPAUKSET) {
        const v = VEDOT[vk], nimi = `${ryhma}, ${TILAT[tila]}, ${v.nimi}`;
        const luokka = await tilaan(tila);
        await siivoa();
        if (!(await veda(v))) { tulos(`${nimi}: vetopisteet`, false); continue; }
        // Luonnos (Luinin maalaus) tai selaimen korostus.
        const luonnos = await merkit('mark.luonnos');
        const korostus = shy(await p.evaluate(() => getSelection().toString()));
        if (KUVAT) await p.screenshot({ path: path.join(KUVAT, `lomitus-merkinta-${vp.width}-${maalaus}-${tila}-${vk}.png`) });
        const napit = await p.evaluate(() => [...document.querySelectorAll('#pop:not([hidden]) button[data-k]')].map(x => x.dataset.k).join());
        if (!/kopioi/.test(napit)) { tulos(`${nimi}: valikko`, false, napit); continue; }
        // Lausekäännös: DeepL-osoite (valikko pysyy auki), sitten kopio.
        await p.evaluate(() => { window.__avattu.length = 0; });
        await p.click('#pop button[data-k="kaanna"]');
        const dl = deeplTeksti(await p.evaluate(() => window.__avattu.pop() || ''));
        await p.evaluate(() => navigator.clipboard.writeText('-'));
        await p.click('#pop button[data-k="kopioi"]'); await p.waitForTimeout(200);
        const kopio = shy(await p.evaluate(() => navigator.clipboard.readText()));
        // Sanaselitys: haku ikkunan otsikosta ja Wikisanakirjan pyynnöstä; sen jälkeen veto uudelleen alleviivausta varten.
        let sk = null;
        if (/(^|,)sk(,|$)/.test(napit)) {
          skHaut.length = 0;
          await p.click('#pop button[data-k="sk"]'); await p.waitForTimeout(150);
          sk = { o: shy(await p.evaluate(() => (document.querySelector('#pop .sk-o') || {}).textContent || '')), haut: skHaut.map(u => decodeURIComponent(u)).join(' ') };
          await p.keyboard.press('Escape'); await p.evaluate(() => getSelection().removeAllRanges());
          await veda(v);
        }
        await p.click('#pop button[data-k="ali"]'); await p.waitForTimeout(250);
        const h = await p.evaluate(() => { const al = window.__luin.nyt().merk.al; const h = al[al.length - 1]; return h ? { id: h.id, segs: h.segs.map(s => ({ b: s.b, x: s.x.replace(/­/g, '') })) } : null; });
        const oteT = h ? h.segs.map(s => s.x).join('\n\n') : '';
        const yksiKieli = h && h.segs.every(s => !kieli[s.b] || kieli[s.b] === v.kieli);
        if (maalaus === 'luin') {
          const lb = Object.keys(luonnos);
          tulos(`${nimi}: luonnos yhtä kieltä`, lb.length > 0 && lb.every(x => !kieli[x] || kieli[x] === v.kieli) && Object.values(luonnos).map(m => m.t).join('\n\n') === v.ote, lb.map(x => x + ':' + kieli[x]).join(' '));
        } else {
          // Selaimen korostus on selaimen oma: Molemmat-tilassa se kattaa toisenkin kielen, mutta valikko ja merkintä eivät.
          tulos(`${nimi}: selaimen korostus ${tila === 'molemmat' ? 'kattaa molemmat kielet' : 'on vain näkyvää kieltä'}`,
            !!korostus && TOINEN[v.kieli].test(korostus) === (tila === 'molemmat'), lyh(korostus));
        }
        tulos(`${nimi}: alleviivaus yhtä kieltä`, !!h && yksiKieli && oteT === v.ote, h ? h.segs.map(s => s.b + ':' + kieli[s.b]).join(' ') + ' ' + lyh(oteT) : 'ei alleviivausta');
        tulos(`${nimi}: kopio`, kopio === v.ote, lyh(kopio));
        tulos(`${nimi}: lausekäännöksen teksti`, dl === v.ote, lyh(dl));
        tulos(`${nimi}: sanaselitys ${v.sk ? 'hakee valinnan kieltä' : 'ei tarjolla kahden palan valinnalle'}`,
          v.sk ? !!sk && sk.o === v.ote && !TOINEN[v.kieli].test(sk.haut) : !sk, sk ? JSON.stringify(sk.o) + (sk.haut ? ' ' + lyh(sk.haut) : '') : napit);
        if (!h) continue;
        // Tilanvaihto: samat merkit kaikissa tiloissa, näkyvissä vain oman kielen tilassa.
        const kierros = [], muut = ['alku', 'kaannos', 'molemmat'].filter(x => x !== tila).concat([tila]);
        const m0 = await merkit('mark.ali[data-h="' + h.id + '"]');
        for (const t of muut) { await tilaan(t); kierros.push({ t, m: await merkit('mark.ali[data-h="' + h.id + '"]'), al: await p.evaluate(() => window.__luin.nyt().merk.al.length) }); }
        const tekstit = m => Object.keys(m).sort().map(x => x + ':' + m[x].t).join('|');
        const sama = kierros.every(k => tekstit(k.m) === tekstit(m0) && k.al === 1);
        const nakyvyys = kierros.every(k => Object.keys(k.m).every(x => k.m[x].nakyy === (!kieli[x] || NAKYVA[k.t].includes(kieli[x]))));
        tulos(`${nimi}: merkintä samoissa merkeissä kaikissa Kielet-tiloissa`, sama && tekstit(m0) === h.segs.map(s => s.b + ':' + s.x).join('|'),
          kierros.map(k => k.t + ' ' + Object.keys(k.m).join(',')).join('; '));
        tulos(`${nimi}: merkintä näkyy vain kielensä mukana`, nakyvyys, kierros.map(k => k.t + ' ' + Object.keys(k.m).map(x => x + (k.m[x].nakyy ? '+' : '-')).join(',')).join('; '));
        if ((luokka.match(/lomitus-\w+/) || [''])[0] !== (tila === 'molemmat' ? '' : 'lomitus-' + tila)) tulos(`${nimi}: Kielet-tila`, false, luokka);
      }
      // Valinta, joka kattaa vain piilotetun kappaleen (edellisen kappaleen lopusta seuraavan alkuun): ei valikkoa, koska näkyvää
      // valittua tekstiä ei ole. Vain selaimen maalauksella (Luinin maalaus tarttuu näkyviin sanoihin).
      if (maalaus === 'selain') for (const [tila, ed, seur] of [['kaannos', 2, 4], ['alku', 1, 3]]) {
        await tilaan(tila); await siivoa();
        await p.evaluate(() => { window.__avattu.length = 0; });
        const r = await p.evaluate(([ed, seur]) => {
          const A = document.querySelector('#teksti [data-b="' + ed + '"]'), Z = document.querySelector('#teksti [data-b="' + seur + '"]');
          const tw = document.createTreeWalker(A, NodeFilter.SHOW_TEXT); let t, vika = null; while ((t = tw.nextNode())) vika = t;
          const eka = document.createTreeWalker(Z, NodeFilter.SHOW_TEXT).nextNode();
          getSelection().setBaseAndExtent(vika, vika.length, eka, 0);
          window.__luin.valinta();
          const pop = document.querySelector('#pop');
          return { pop: !pop.hidden, napit: pop.hidden ? '' : [...pop.querySelectorAll('button[data-k]')].map(x => x.dataset.k).join() };
        }, [ed, seur]);
        let tieto = r.napit;
        if (r.pop && /kaanna/.test(r.napit)) { await p.click('#pop button[data-k="kaanna"]'); tieto += ' ' + lyh(deeplTeksti(await p.evaluate(() => window.__avattu.pop() || ''))); }
        if (r.pop && /(^|,)sk(,|$)/.test(r.napit)) { await p.click('#pop button[data-k="sk"]'); await p.waitForTimeout(100); tieto += ' sk ' + JSON.stringify(shy(await p.evaluate(() => (document.querySelector('#pop .sk-o') || {}).textContent || ''))); }
        tulos(`${ryhma}, ${TILAT[tila]}: valinta vain piilotetun kappaleen yli ei avaa valikkoa`, !r.pop, tieto || 'ei valikkoa');
      }
      await ctx.close();
    }
  }
  tulos('ei sivuvirheitä', !sivuvirheet.length, sivuvirheet.join('; '));
  await b.close(); palvelin.close();
  console.log(virheita ? virheita + ' vikaa.' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})();
