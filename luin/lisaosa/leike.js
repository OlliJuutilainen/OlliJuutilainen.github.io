/* Lisää lukimeen: leikkuri. Ajetaan sivulla kirjastojen (Readability, Turndown, GFM) jälkeen; viimeisen lausekkeen arvo
   (lupaus) palaa ponnahdusikkunalle. IIFE, koska tiedosto ajetaan uudelleen joka kerta, kun ikkuna avataan samalla sivulla.

   Tulos noudattaa Latomon ohjeen suosittelemia MarkDownload-asetuksia (latomo-ohje.html#markdownload), jotta Latomon
   MarkDownload-tila siivoaa sen samoin: etukentässä korvamerkki leikattu:, Atx-otsikot, viiva ___, luettelo -,
   aidattu koodi, *kursiivi*, **lihavointi**, viitelinkit lopussa, kuvat pois, Markdown-merkit suojattuina,
   yläindeksit HTML:nä (Latomo muuntaa ne ^1^-muotoon). Lisäksi kaksi asiaa, joihin MarkDownload ei pysty:
   tunnettujen sivujen sisältö ilman Readabilityn karsintaa (sovite) ja toiselle sivulle viittaavat alaviitteet
   haettuina Luinin alaviitteiksi. */
(async () => {
  // MarkDownload poistaa samat näkymättömät merkit; pehmeä tavuviiva sotkisi Luinin oman tavutuksen.
  const NAKYMATON = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g;
  // Alaviitteen paikka Turndownin läpi: pelkkiä kirjaimia ja numeroita, joita Turndown ei suojaa.
  const MERKKI = /XLUINVIITE([0-9A-Za-z]+)X/g;

  function muunna(html, linkit = 'referenced') {
    const td = new TurndownService({ headingStyle: 'atx', hr: '___', bulletListMarker: '-', codeBlockStyle: 'fenced',
      fence: '```', emDelimiter: '*', strongDelimiter: '**', linkStyle: linkit, linkReferenceStyle: 'full' });
    td.use(turndownPluginGfm.gfm);
    td.keep(['sub', 'sup']);
    td.remove(['script', 'style', 'noscript', 'iframe', 'button', 'form', 'svg']);
    td.addRule('kuvat', { filter: 'img', replacement: () => '' });
    // Kuvan poistuttua linkistä jäisi [](…) tai [][4].
    td.addRule('tyhjaLinkki', { filter: n => n.nodeName === 'A' && !n.textContent.trim(), replacement: () => '' });
    td.addRule('pre', {
      filter: n => n.nodeName === 'PRE' && (!n.firstChild || n.firstChild.nodeName !== 'CODE'),
      replacement: (s, n) => '\n\n```\n' + n.textContent.replace(/\n$/, '') + '\n```\n\n'
    });
    return td.turndown(html).replace(NAKYMATON, '');
  }

  const rivi = s => String(s || '').replace(/\s+/g, ' ').trim();
  const osoite = location.href.split('#')[0];
  // DOMParser eikä innerHTML: erillinen asiakirja ei hae kuvia sivun nimissä.
  const jasenna = html => new DOMParser().parseFromString(html, 'text/html');

  // Irrotetun palan osoitteet absoluuttisiksi (kopio kuuluu yhä tähän asiakirjaan, joten a.href ratkeaa sivun osoitteesta).
  function irrota(solmut) {
    const pala = document.createElement('div');
    for (const s of solmut) pala.appendChild(s);
    pala.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', a.href));
    return pala;
  }

  // Sovitteet: sivut, joiden rakenne tunnetaan ja joilta Readability karsii sisältöä. Stanford Encyclopedia of
  // Philosophy (myös peilit): Readability valitsee pelkän #main-textin, jolloin johdanto, bibliografia ja
  // muut lähteet putoavat pois, ja otsikon, jonka tunnisteessa on sana meta (#ExpeMeta), se poistaa.
  // Academic Tools ja Related Entries ovat sivuston navigointia.
  function sovite() {
    if (document.getElementById('aueditable') && document.getElementById('main-text') && document.getElementById('preamble')) {
      const osat = ['preamble', 'main-text', 'bibliography', 'other-internet-resources']
        .map(id => document.getElementById(id)).filter(Boolean).map(e => e.cloneNode(true));
      // Bibliografia on luettelo, mutta Luinin kirjallisuusluettelo (p.bib, opas 3.4) syntyy kappaleista.
      const bib = osat.find(e => e.id === 'bibliography');
      if (bib) bib.querySelectorAll('ul').forEach(ul => {
        const kpl = [...ul.children].filter(li => li.nodeName === 'LI').map(li => {
          const p = document.createElement('p');
          while (li.firstChild) p.appendChild(li.firstChild);
          return p;
        });
        ul.replaceWith(...kpl);
      });
      return irrota(osat).innerHTML;
    }
    return '';
  }

  // Alaviitteet toisella sivulla (SEP:n notes.html): yläindeksi, jossa on vain numerolinkki saman sivuston toiselle
  // sivulle ankkurin kera. Sivu haetaan kerran; ankkurin elementistä tulee alaviitteen teksti ilman paluulinkkiä, ja
  // merkki korvataan tunnuksella [^viite-7] kuten md.js:n sivunViitteet() tekee. Löytymätön jää yläindeksiksi
  // (Latomo ja md.js tekevät siitä alaviitteen, joka kertoo tekstin olevan lähteen sivulla).
  const sivut = new Map();
  function hae(u) {
    if (!sivut.has(u)) {
      const ohi = new AbortController(), ajastin = setTimeout(() => ohi.abort(), 8000);
      sivut.set(u, fetch(u, { credentials: 'same-origin', signal: ohi.signal })
        .then(r => r.ok ? r.text() : '').then(t => t ? jasenna(t) : null).catch(() => null)
        .finally(() => clearTimeout(ajastin)));
    }
    return sivut.get(u);
  }
  async function viitteet(d) {
    const merkit = [];
    d.querySelectorAll('sup').forEach(sup => {
      const a = sup.querySelectorAll('a[href]');
      const nro = a.length === 1 ? a[0].textContent.trim() : '';
      if (!/^\d+[a-z]?$/i.test(nro) || sup.textContent.replace(/[\s[\]]/g, '') !== nro) return;
      let u; try { u = new URL(a[0].getAttribute('href'), osoite); } catch (e) { return; }
      const sivu = u.href.split('#')[0];
      if (!u.hash || u.origin !== location.origin || sivu === osoite) return;
      merkit.push({ sup, sivu, id: decodeURIComponent(u.hash.slice(1)), nro });
    });
    const sivuja = [...new Set(merkit.map(m => m.sivu))];
    if (!merkit.length || sivuja.length > 3) return [];
    const maar = new Map();
    for (const m of merkit) {
      const sd = await hae(m.sivu);
      let el = sd && sd.getElementById(m.id);
      if (!el) continue;
      if (rivi(el.textContent).length < 4 && el.parentElement) el = el.closest('p, li, div') || el;
      const k = el.cloneNode(true);
      k.querySelectorAll('a[href]').forEach(x => { try { x.setAttribute('href', new URL(x.getAttribute('href'), m.sivu).href); } catch (e) {} });
      // Paluulinkki (SEP: <a href="index.html#ref-1">1.</a>) pois.
      const paluu = [...k.querySelectorAll('a[href]')].find(x => /^\[?\d+[a-z]?\.?\]?$/i.test(x.textContent.trim()));
      if (paluu) paluu.remove();
      // Linkin ulkopuolelle jäänyt piste (SEP:n Heraclitus: <a …>1</a>. The B prefix …) pois alusta.
      let teksti = muunna(k.innerHTML, 'inlined').trim();
      if (paluu) teksti = teksti.replace(/^\\?[.):\]]\s*/, '');
      if (!teksti) continue;
      const tunnus = m.nro.replace(/[^0-9A-Za-z]/g, '');
      m.sup.replaceWith(d.createTextNode('XLUINVIITE' + tunnus + 'X'));
      if (!maar.has(tunnus)) maar.set(tunnus, teksti);
    }
    // Jatkokappaleet sisennettyinä; lainausmerkit pois, koska alaviitteessä ei ole lainauslohkoa (sama kuin md.js:n
    // sivunViitteet(), kun Notes-sivun leike liitetään Latomossa).
    return [...maar].map(([t, s]) => '[^viite-' + t + ']: ' + s.split('\n').map((r, i) => {
      if (!i) return r;
      const k = r.replace(/^ {0,3}(?:>\s?)+/, '');
      return k.trim() ? '    ' + k : '';
    }).join('\n').replace(/\n{3,}/g, '\n\n'));
  }

  // Blogger-sovite (blogspot.com ja omat verkkotunnukset, klassinen ja Contempo-pohja). Readability ottaa etusivulta
  // kaikki kirjoitukset otsikkolinkkeineen, Featured Postin ja Popular Postsin katkelmat, eikä se löydä päiväystä,
  // tekijää eikä blogin nimeä. Kirjoitukset otetaan .widget.Blogin .post-bodysta. Yksittäisen kirjoituksen sivulla
  // etukenttään tulevat tekijä, blogin nimi ja päiväys; etusivulla, arkistossa ja tunnistesivulla otsikko on blogin
  // nimi ja kirjoitukset ovat lukuja (##) päiväyksineen. Katkaistu kirjoitus (Lue lisää, Contempon katkelma)
  // haetaan kokonaan sen omalta sivulta.
  const BLOG_HAKU = 20;
  const OTSIKOT = 'h1, h2, h3, h4, h5, h6';
  function blogPvm(post) {
    const e = post.querySelector('.published, [itemprop="datePublished"]');
    const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(e && (e.getAttribute('datetime') || e.getAttribute('title') || e.getAttribute('content')) || '');
    // Päivä kirjoittajan aikavyöhykkeellä sellaisenaan (Bloggerin aikaleima on paikallista aikaa poikkeamineen).
    return m ? { iso: m[0], fi: +m[3] + '.' + +m[2] + '.' + m[1] } : null;
  }
  function blogTekija(post) {
    const e = post.querySelector('.post-author [itemprop="name"], .post-author .fn, .post-author');
    return rivi(e && e.textContent).replace(/^(?:posted by|lähettänyt|kirjoittanut|by)\s+/i, '');
  }
  function blogSiivoa(el, siirto) {
    el.querySelectorAll('.jump-link, .post-share-buttons, .snippet-fade, script, style').forEach(x => x.remove());
    // Kirjoittajan itse lisäämä jakonappi kirjoituksen alussa (Philosophical Disquisitions: <a class="twitter-share-button">Tweet</a>)
    // jäi otsikon alle yksin riville, ja Latomo luki sen tietoriviksi tekijän ja päiväyksen paikalle.
    el.querySelectorAll('.twitter-share-button, .fb-share-button, .fb-like, .g-plusone, a[href*="twitter.com/share"], a[href*="facebook.com/sharer"]')
      .forEach(x => x.remove());
    // Kuvateksti taulukossa: kuva jää pois, ja kuvan ja tekstin taulukosta tulisi Markdown-taulukko.
    el.querySelectorAll('table.tr-caption-container').forEach(t => {
      const k = rivi(t.querySelector('.tr-caption') && t.querySelector('.tr-caption').textContent);
      if (!k) return t.remove();
      const p = document.createElement('p'), em = document.createElement('em');
      em.textContent = k; p.appendChild(em); t.replaceWith(p);
    });
    // Bloggerin editori kirjoittaa sisennykset ja tuplavälit sitovina välilyönteinä; kappaleen alun sitova välilyönti
    // jäi Markdowniin, ja rivillinen niitä teki kuvatekstistä koodilohkon.
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (!n.parentElement.closest('pre, code')) n.data = n.data.replace(/ /g, ' ');
    // Otsikkotyyli korostuksena: yli 200 merkin "otsikko" on kappaleita, lainausmerkillä alkava lainaus.
    el.querySelectorAll(OTSIKOT).forEach(h => {
      const t = rivi(h.textContent);
      if (t.length <= 200) return;
      const palat = [[]];
      for (const c of [...h.childNodes]) if (c.nodeName === 'BR') palat.push([]); else palat[palat.length - 1].push(c);
      const kpl = palat.filter(p => p.some(c => rivi(c.textContent))).map(p => {
        const e = document.createElement('p'); p.forEach(c => e.appendChild(c)); return e;
      });
      if (/^["“”«»„]/.test(t)) {
        const bq = document.createElement('blockquote'); kpl.forEach(p => bq.appendChild(p)); h.replaceWith(bq);
      } else h.replaceWith(...kpl);
    });
    // Lihavoitu otsikko (### **1. Values …**): lihavointi on otsikon tyyli, ei korostus.
    el.querySelectorAll(OTSIKOT).forEach(h => h.querySelectorAll('b, strong').forEach(b => b.replaceWith(...b.childNodes)));
    // Tyhjät kappaleet (<p><br></p>, kuvan kehys) jäivät Markdowniin kovina rivinvaihtoina.
    [...el.querySelectorAll('p, div')].reverse().forEach(p => { if (!rivi(p.textContent) && !p.querySelector('hr, table')) p.remove(); });
    if (siirto) el.querySelectorAll(OTSIKOT).forEach(h => {
      const u = document.createElement('h' + Math.min(6, +h.tagName[1] + siirto));
      while (h.firstChild) u.appendChild(h.firstChild);
      h.replaceWith(u);
    });
    return el;
  }
  async function blogger() {
    const gen = document.querySelector('meta[name="generator"]');
    if (!/blogger/i.test(gen && gen.content || '') && !/\.blogspot\.[a-z.]+$/.test(location.hostname)) return null;
    const postit = [...document.querySelectorAll('.widget.Blog .post-outer, .widget.Blog .post')]
      .filter((p, i, k) => p.querySelector('.post-body') && !k.some(q => q !== p && q.contains(p)));
    if (!postit.length) return null;
    const syote = document.querySelector('link[rel="alternate"][type="application/atom+xml"][href$="/feeds/posts/default"]');
    const nimi = rivi(syote && syote.getAttribute('title')).replace(/\s+-\s+Atom$/, '');
    const otsikkoOf = p => rivi(p.querySelector('.post-title') && p.querySelector('.post-title').textContent);

    if (postit.length === 1) {
      const p = postit[0], pvm = blogPvm(p);
      return { html: irrota([blogSiivoa(p.querySelector('.post-body').cloneNode(true), 0)]).innerHTML,
        otsikko: otsikkoOf(p) || nimi, tekija: blogTekija(p), sivusto: nimi, julkaistu: pvm ? pvm.iso : '' };
    }
    // Contempon etusivulla uusin kirjoitus on vain Featured Postissa; klassisessa pohjassa se toistaa listan kirjoitusta.
    const linkkiOf = p => p.querySelector('.post-title a[href], a.timestamp-link[href], .jump-link a[href]');
    const osoitteet = new Set(postit.map(p => linkkiOf(p) && linkkiOf(p).href));
    for (const f of document.querySelectorAll('.widget.FeaturedPost')) {
      const l = linkkiOf(f), pf = blogPvm(f);
      if (!l || osoitteet.has(l.href) || !f.querySelector('.post-body')) continue;
      osoitteet.add(l.href);
      const j = pf ? postit.findIndex(p => (blogPvm(p) || { iso: '' }).iso < pf.iso) : 0;
      postit.splice(j < 0 ? postit.length : j, 0, f);
    }
    const osat = await Promise.all(postit.map(async (p, i) => {
      let body = p.querySelector('.post-body').cloneNode(true);
      const linkki = linkkiOf(p);
      if (linkki && p.querySelector('.jump-link, .post-snippet, .snippet-item')) {
        const sd = i < BLOG_HAKU ? await hae(linkki.href) : null;
        const koko = sd && sd.querySelector('.widget.Blog .post-body');
        if (koko) {
          body = document.importNode(koko, true);
          body.querySelectorAll('a[href]').forEach(x => { try { x.setAttribute('href', new URL(x.getAttribute('href'), linkki.href).href); } catch (e) {} });
        } else {
          const r = document.createElement('p'), em = document.createElement('em');
          em.textContent = 'Katkelma: koko kirjoitus ei latautunut.'; r.appendChild(em); body.appendChild(r);
        }
      }
      const tasot = [...body.querySelectorAll(OTSIKOT)].map(h => +h.tagName[1]);
      const siirto = tasot.length ? Math.max(0, 3 - Math.min(...tasot)) : 0;
      const kehys = document.createElement('div');
      const h = document.createElement('h2'); h.textContent = otsikkoOf(p) || (blogPvm(p) || {}).fi || '';
      if (h.textContent) kehys.appendChild(h);
      const pvm = blogPvm(p);
      if (pvm) { const r = document.createElement('p'), em = document.createElement('em'); em.textContent = pvm.fi; r.appendChild(em); kehys.appendChild(r); }
      kehys.appendChild(blogSiivoa(body, siirto));
      return kehys;
    }));
    const tekijat = [...new Set(postit.map(blogTekija).filter(Boolean))];
    return { html: irrota(osat).innerHTML, otsikko: nimi, tekija: tekijat.length === 1 ? tekijat[0] : '', sivusto: '', julkaistu: '' };
  }

  async function valmista(html) {
    const d = jasenna(html);
    // Sivun sisäinen linkki (#viite-1) sivun osoitteeksi kuten MarkDownloadissa: Latomo tekee leikkeen omalle
    // sivulle vievästä yläindeksilinkistä pelkän numeron. Readability jättää #-linkit ennalleen.
    d.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', osoite + a.getAttribute('href')));
    const maar = await viitteet(d);
    let md = muunna(d.body.innerHTML).replace(MERKKI, '[^viite-$1]');
    if (maar.length) md += '\n\n' + maar.join('\n\n');
    return { md, viitteita: maar.length };
  }

  // Readability antaa usein välilehden otsikon (Kirjoitus | Blogi). Lisää lukimeen -polulla kukaan ei paina Latomon
  // erotusnappia, joten sivuston nimi erotetaan tässä: h1, jolla otsikko alkaa, tai sivuston nimi lopussa.
  function siisti(otsikko, sivusto) {
    const h1 = rivi(document.querySelector('h1') && document.querySelector('h1').textContent);
    const loppu = /^\s*[|\-–—:·»(]/;
    // Sivuston logona toimiva h1 (Blogi | Kirjoitus) ei kelpaa otsikoksi.
    if (h1 && h1 !== sivusto && otsikko.length > h1.length && otsikko.startsWith(h1) && loppu.test(otsikko.slice(h1.length))) return h1;
    if (sivusto && otsikko.endsWith('(' + sivusto + ')')) return otsikko.slice(0, -sivusto.length - 2).trim() || otsikko;
    if (sivusto && otsikko.endsWith(sivusto)) {
      const alku = otsikko.slice(0, -sivusto.length).replace(/\s*[|\-–—:·»]\s*$/, '');
      if (alku && alku !== otsikko.slice(0, -sivusto.length)) return alku.trim();
    }
    return otsikko;
  }

  // Valinta ennen Readabilityä.
  let valintaHtml = '';
  const sel = window.getSelection();
  if (sel && sel.rangeCount && !sel.isCollapsed) {
    const palat = [];
    for (let i = 0; i < sel.rangeCount; i++) palat.push(sel.getRangeAt(i).cloneContents());
    const pala = irrota(palat);
    if (pala.textContent.trim()) valintaHtml = pala.innerHTML;
  }

  let artikkeli = null;
  try { artikkeli = new Readability(document.cloneNode(true)).parse(); } catch (e) { artikkeli = null; }
  const sep = sovite();
  let blogi = null;
  if (!sep) try { blogi = await blogger(); } catch (e) { blogi = null; }
  const sisalto = sep || (blogi && blogi.html) || (artikkeli && artikkeli.content) || '';

  const otsikko = blogi ? blogi.otsikko || osoite
    : siisti(rivi(artikkeli && artikkeli.title || document.title), rivi(artikkeli && artikkeli.siteName)) || osoite;
  const p = new Date(), pv = n => String(n).padStart(2, '0');
  const etu = ['---'];
  const kentta = (avain, arvo) => { if (rivi(arvo)) etu.push(avain + ': ' + rivi(arvo)); };
  kentta('tekijä', blogi ? blogi.tekija : artikkeli && artikkeli.byline);
  kentta('sivusto', blogi ? blogi.sivusto : artikkeli && artikkeli.siteName);
  kentta('julkaistu', blogi ? blogi.julkaistu : artikkeli && artikkeli.publishedTime);
  kentta('lähde', osoite);
  kentta('leikattu', p.getFullYear() + '-' + pv(p.getMonth() + 1) + '-' + pv(p.getDate()));
  etu.push('---', '# ' + otsikko, '', '');
  const alku = etu.join('\n');

  const [koko, valinta] = await Promise.all([sisalto ? valmista(sisalto) : null, valintaHtml ? valmista(valintaHtml) : null]);
  const sanoja = s => (s.match(/\S+/g) || []).length;
  return {
    otsikko, sivusto: (blogi && (blogi.sivusto || blogi.otsikko)) || rivi(artikkeli && artikkeli.siteName) || location.hostname.replace(/^www\./, ''),
    koko: koko && koko.md ? alku + koko.md + '\n' : '', kokoSanoja: koko ? sanoja(koko.md) : 0, kokoViitteita: koko ? koko.viitteita : 0,
    valinta: valinta && valinta.md ? alku + valinta.md + '\n' : '', valintaSanoja: valinta ? sanoja(valinta.md) : 0,
    valintaViitteita: valinta ? valinta.viitteita : 0
  };
})();
