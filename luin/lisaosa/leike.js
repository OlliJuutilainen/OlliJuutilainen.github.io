/* Lisää lukimeen: leikkuri. Ajetaan sivulla kirjastojen (Readability, Turndown, GFM) jälkeen; viimeisen lausekkeen arvo
   (lupaus) palaa ponnahdusikkunalle. IIFE, koska tiedosto ajetaan uudelleen joka kerta, kun ikkuna avataan samalla sivulla.

   Tulos noudattaa Latomon ohjeen suosittelemia MarkDownload-asetuksia (latomo-ohje.html#markdownload), jotta Latomon
   MarkDownload-tila siivoaa sen samoin: etukentässä korvamerkki leikattu:, Atx-otsikot, viiva ___, luettelo -,
   aidattu koodi, *kursiivi*, **lihavointi**, viitelinkit lopussa, kuvat pois, Markdown-merkit suojattuina,
   yläindeksit HTML:nä (Latomo muuntaa ne ^1^-muotoon). Lisäksi kaksi asiaa, joihin MarkDownload ei pysty:
   tunnettujen sivujen sisältö ilman Readabilityn karsintaa (sovite) ja toiselle sivulle viittaavat alaviitteet
   haettuina Luinin alaviitteiksi. Omat sovitteet: SEP, Blogger, Ensyklopedia Logos (filosofia.fi) ja Wikipedia
   (käyttäjän pyyntö 10.11.2026). */
(async () => {
  // MarkDownload poistaa samat näkymättömät merkit; pehmeä tavuviiva sotkisi Luinin oman tavutuksen.
  const NAKYMATON = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g;
  // Alaviitteen paikka Turndownin läpi: pelkkiä kirjaimia ja numeroita, joita Turndown ei suojaa.
  // Ei-ahne: vierekkäiset merkit (Wikipedia: kolme viitettä peräkkäin) eivät sulaudu yhdeksi.
  const MERKKI = /XLUINVIITE([0-9A-Za-z]+?)X/g;

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
    return [...maar].map(([t, s]) => maaritelma(t, s));
  }
  // Jatkokappaleet sisennettyinä; lainausmerkit pois, koska alaviitteessä ei ole lainauslohkoa (sama kuin md.js:n
  // sivunViitteet(), kun Notes-sivun leike liitetään Latomossa).
  function maaritelma(t, s) {
    return '[^viite-' + t + ']: ' + s.split('\n').map((r, i) => {
      if (!i) return r;
      const k = r.replace(/^ {0,3}(?:>\s?)+/, '');
      return k.trim() ? '    ' + k : '';
    }).join('\n').replace(/\n{3,}/g, '\n\n');
  }
  const merkki = t => document.createTextNode('XLUINVIITE' + t + 'X');

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


  /* Ensyklopedia Logos (filosofia.fi/fi/ensyklopedia/…, käyttäjän pyyntö 10.11.2026). Drupalin runko .field-item:
     luvut ovat lihavoituja kappaleita (yleensä ankkurin kera), osiot kursiivikappaleita, ensimmäinen kursiivirivi on
     tekijä ja päiväys (etukenttään ja kahdeksi tietoriviksi), alun sisällysluettelo ja tyhjät kappaleet pois.
     Viittaus toiseen Logoksen artikkeliin (ks. ”Hobbes, Thomas”) on alaviite, ja artikkelit tulevat kirjallisuusluettelon
     loppuun omaksi osiokseen tekijöineen, vuosineen ja kirjoitettuine osoitteineen: alaviitteen tekijä–vuosi linkittyy
     md.js:n omalla päättelyllä luettelon kohtaan, eikä verkko-osoite ole linkki ilman verkkolinkkejä. */
  const LOGOS_NIMI = 'Ensyklopedia Logos', LOGOS_GEN = 'Ensyklopedia Logoksen', LOGOS_HAKU = 30;
  const pvmIso = s => { const m = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/.exec(s || ''); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : ''; };
  // Tekijärivi: *Lilli Alanen* *(julkaistu 5. 5. 2018)*, *Rauno Huttunen (julkaistu 20.6.2010, muokattu 13.9.2014)* tai
  // *Markku Roinila (19.4.2018)*.
  function logosTekija(runko) {
    for (const p of [...runko.children].slice(0, 3)) {
      const t = rivi(p.textContent);
      const m = t.length < 200 && /^(.*?)\(\s*(?:julkaistu\s+)?(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})\s*(?:,\s*muokattu\s+([^)]*))?\)\s*$/i.exec(t);
      if (m) return { p, tekija: rivi(m[1]), alku: rivi(m[2]), julkaistu: pvmIso(m[2]), muokattu: rivi(m[3]) };
    }
    return null;
  }
  // Lilli Alanen ja Tuomo Aho → Alanen, Lilli & Tuomo Aho (kirjallisuusluettelon tapa).
  function kaanteinen(nimet) {
    return nimet.split(/\s*(?:,|\s&\s|\sja\s)\s*/).filter(Boolean).map((n, i) => {
      const o = n.trim().split(/\s+/);
      return i || o.length < 2 ? n.trim() : o[o.length - 1] + ', ' + o.slice(0, -1).join(' ');
    }).join(' & ');
  }
  const logosLinkki = a => {
    let u; try { u = new URL(a.getAttribute('href'), osoite); } catch (e) { return null; }
    return /(^|\.)filosofia\.fi$/.test(u.hostname) && /^\/(?:fi\/)?(?:node\/\d+|ensyklopedia\/[^/]+)\/?$/.test(u.pathname) ? u.href.split('#')[0] : null;
  };
  async function logos() {
    const runko = /(^|\.)filosofia\.fi$/.test(location.hostname) && /\/ensyklopedia\/[^/]+/.test(location.pathname) &&
      document.querySelector('.node-ensyklopedia .field-name-body .field-item');
    if (!runko) return null;
    const el = runko.cloneNode(true);
    const meta = logosTekija(el);
    // Tekijärivi jää tekstiin tavallisena tietorivinä: kursiivina se olisi Luinissa alaotsikko, ja pois jätettynä
    // otsikkolohkosta puuttuisi tekijä aina, kun tekstissä on muita tietorivejä (Englannista suomentanut …).
    // Nimi ja päiväys omille riveilleen: pelkän julkaisurivin eteen md.js lisäisi etukentän tekijän toiseen kertaan.
    if (meta) {
      const p = document.createElement('p'), pv = x => x.replace(/(\d)\.\s+(?=\d)/g, '$1.');
      if (meta.tekija) p.append(meta.tekija, document.createElement('br'));
      p.append('Julkaistu ' + pv(meta.alku) + (meta.muokattu ? ', muokattu ' + pv(meta.muokattu) : ''));
      meta.p.replaceWith(p);
    }
    // Alun sisällysluettelo (vain #-linkkejä), viivat ja tyhjät kappaleet (&nbsp;, pelkkä kuva).
    [...el.children].forEach(e => {
      const linkit = [...e.querySelectorAll('a[href]')];
      if (/^(OL|UL)$/.test(e.tagName) && linkit.length && linkit.every(a => a.getAttribute('href').startsWith('#'))) e.remove();
      else if (e.tagName === 'HR' || e.tagName === 'P' && !rivi(e.textContent)) e.remove();
    });
    // Otsikot: koko kappale lihavoituna → luku, kursiivina (lyhyt, ei virkkeen loppumerkkiä, ei lainausmerkkiä) → osio.
    const koko = (p, sel) => { const t = [...p.querySelectorAll(sel)].map(x => x.textContent).join(''); return rivi(t) && rivi(t) === rivi(p.textContent); };
    [...el.children].forEach(p => {
      if (p.tagName !== 'P' || p.querySelector('img')) return;
      const t = rivi(p.textContent);
      const taso = koko(p, 'strong, b') && t.length <= 150 && !/[.!?]$/.test(t) ? 2
        : koko(p, 'em, i') && t.length <= 100 && !/[.!?…]$/.test(t) && !/^["”“»„'’]/.test(t) ? 3 : 0;
      if (!taso) return;
      const h = document.createElement('h' + taso); h.textContent = t.replace(/:$/, taso === 3 ? ':' : ''); p.replaceWith(h);
    });
    // Viittaukset Logoksen artikkeleihin: haetaan kerran, tekijä, vuosi, otsikko ja pysyvä osoite.
    const kohteet = new Map();
    el.querySelectorAll('a[href]').forEach(a => {
      const u = logosLinkki(a);
      if (u && u.split('#')[0] !== osoite.split('#')[0] && !kohteet.has(u) && kohteet.size < LOGOS_HAKU) kohteet.set(u, null);
    });
    await Promise.all([...kohteet.keys()].map(async u => {
      const d = await hae(u);
      const r = d && d.querySelector('.node-ensyklopedia .field-name-body .field-item');
      const ots = rivi(d && (d.querySelector('#page-title') || d.querySelector('h1') || {}).textContent);
      if (!ots) return;
      const kan = d.querySelector('link[rel="canonical"]'), node = d.querySelector('.node-ensyklopedia[about]');
      let pysyva = u;
      try { pysyva = new URL(kan ? kan.getAttribute('href') : node ? node.getAttribute('about') : u, u).href; } catch (e) {}
      const t = r && logosTekija(r);
      kohteet.set(u, { ots, osoite: pysyva, tekija: t ? t.tekija : '', vuosi: t && t.julkaistu ? t.julkaistu.slice(0, 4) : '' });
    }));
    const jarjestys = [], maar = [];
    // Viittausmuoto kuten md.js:n kirjallisuusluettelossa: kaksi tekijää A & B, useampi A et al.
    const suvut = k => k.tekija.split(/\s*(?:,|\s&\s|\sja\s)\s*/).filter(Boolean).map(x => x.trim().split(/\s+/).pop());
    const tieto = k => {
      if (!k.tekija || !k.vuosi) return '';
      const s = suvut(k);
      return ' (' + (s.length === 2 ? s.join(' & ') : s[0] + (s.length > 2 ? ' et al.' : '')) + ' ' + k.vuosi + ')';
    };
    const nimeta = k => '”' + k.ots + '”' + tieto(k);
    const luettelona = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ja ' + a[a.length - 1];
    let n = 0;
    const uusiViite = ks => {
      ks.forEach(k => { if (!jarjestys.includes(k)) jarjestys.push(k); });
      const t = 'logos' + (++n);
      maar.push([t, 'Ks. ' + LOGOS_GEN + ' ' + (ks.length > 1 ? 'artikkelit ' : 'artikkeli ') + luettelona(ks.map(nimeta)) + '.']);
      return t;
    };
    // Sulkeet, joissa on vain ks./vrt. ja Logos-linkkejä, korvautuvat alaviitteellä (merkki välimerkin jälkeen); muualla
    // linkki jää tekstiksi ja alaviite tulee sen perään (lainausmerkin jälkeen).
    el.querySelectorAll('p, li, blockquote').forEach(p => {
      if (![...p.querySelectorAll('a[href]')].some(a => kohteet.get(logosLinkki(a)))) return;
      const LINKKI = /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
      let html = p.innerHTML.replace(/\s*\(((?:[^()<]|<(?!\/?p\b)[^>]*>)*)\)([.,;:]?)/g, (koko, sis, valim) => {
        const ks = [];
        const jaljella = sis.replace(LINKKI, (x, h, t) => {
          const k = kohteet.get(logosLinkki({ getAttribute: () => h.replace(/&amp;/g, '&') }));
          if (k) { ks.push(k); return ''; }
          return x;
        }).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
        if (!ks.length || !/^\s*(?:ks\.?|katso|vrt\.?)(?:\s+myös)?(?:\s+(?:ensyklopedia-?)?artikkel\w*)?[\s"”“’'.,;:–-]*(?:(?:ja|sekä)[\s"”“’'.,;:]*)*$/i.test(jaljella)) return koko;
        return valim + 'XLUINVIITE' + uusiViite(ks) + 'X';
      });
      html = html.replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>(["”“’]?)/g, (x, h, t, lm) => {
        const k = kohteet.get(logosLinkki({ getAttribute: () => h.replace(/&amp;/g, '&') }));
        return k ? t + lm + 'XLUINVIITE' + uusiViite([k]) + 'X' : x;
      });
      p.innerHTML = html;
    });
    // Artikkelit kirjallisuusluettelon loppuun (### osio luettelon sisällä, jotta md.js lukee kohdat luetteloksi).
    if (jarjestys.length) {
      const BIB = /^(kirjallisuus|kirjallisuutta|lähteet|lähdekirjallisuus|kirjallisuusluettelo)$/i;
      const otsikot = [...el.children].filter(e => e.tagName === 'H2');
      let bib = otsikot.find(h => BIB.test(rivi(h.textContent)));
      if (!bib) { bib = document.createElement('h2'); bib.textContent = 'Kirjallisuus'; el.appendChild(bib); }
      let loppu = bib;
      while (loppu.nextElementSibling && loppu.nextElementSibling.tagName !== 'H2') loppu = loppu.nextElementSibling;
      const osat = [document.createElement('h3')];
      osat[0].textContent = LOGOS_GEN + ' artikkelit';
      jarjestys.forEach(k => {
        const p = document.createElement('p'), em = document.createElement('em');
        p.append((k.tekija ? kaanteinen(k.tekija) + ' (' + (k.vuosi || 's.a.') + '). ' : '') + k.ots + (/[.?!]$/.test(k.ots) ? ' ' : '. '));
        em.textContent = LOGOS_NIMI; p.append(em, '. ' + k.osoite);
        osat.push(p);
      });
      loppu.after(...osat);
    }
    return { html: irrota([el]).innerHTML, otsikko: rivi((document.querySelector('#page-title') || {}).textContent),
      tekija: meta ? meta.tekija : '', sivusto: LOGOS_NIMI, julkaistu: meta ? meta.julkaistu : '',
      maar: maar.map(([t, x]) => maaritelma(t, x)) };
  }

  /* Wikipedia (fi ja en, käyttäjän pyyntö 10.11.2026). Luettavaksi siistitty: muokkauslinkit, kuvat kuvateksteineen,
     tietolaatikot, navigointi, sivupalkit ja ohjausrivit (”… redirects here”, Pääartikkeli) pois. Viitteet ovat
     alaviitteitä, samoin Wikipedian omat merkinnät (lähde?, citation needed). Ylläpito- ja tynkähuomautukset
     (”Tämä artikkeli tai sen osa on käännetty …”) ovat alaviite lähimmän kappaleen perässä, koska ne eivät ole
     leipätekstiä eivätkä lainauksia. Lähde- ja kirjallisuusluettelot kappaleiksi (md.js:n kirjallisuusluettelo).
     Wikilinkit ovat tekstissä pelkkää tekstiä. Loppuun tulevat linkkeineen vain toimittajien valitsemat artikkelit
     (Pääartikkeli- ja Katso myös -ohjausrivit, Katso myös -osio): verkkoon pääsee vain sieltä ja vain, kun Luinin
     verkkolinkit ovat päällä. Tekstin sisäinen linkki luettelon kohtaan vaatisi md.js:n muutosta (ei nyt). Tekijää ei
     ole (viite alkaa otsikolla), julkaistu on luetun version muokkauspäivä. */
  const WIKI_NIMIAVARUUS = /^(file|image|special|help|wikipedia|category|portal|template|talk|user|module|draft|mediawiki|wikt|wiktionary|tiedosto|kuva|toiminnot|ohje|luokka|teemasivu|malline|keskustelu|käyttäjä|moduuli|wikiprojekti|wikisanakirja)(\s|_)*:/i;
  async function wikipedia() {
    const alku = /(^|\.)wikipedia\.org$/.test(location.hostname) && /^\/wiki\/./.test(location.pathname) &&
      document.querySelector('#mw-content-text .mw-parser-output');
    if (!alku) return null;
    const fi = /^fi\b/i.test(document.documentElement.lang || '');
    const el = alku.cloneNode(true);
    let n = 0;
    const maar = [], viiteTunnus = new Map();
    const lisaa = (teksti, solmu) => { const t = 'w' + (++n); maar.push([t, teksti]); return t; };
    // Viitteet (sup.reference, Parsoid: sup.mw-ref): teksti alkuperäisestä viiteluettelosta. Toistuva nimetty viite saa
    // saman tunnuksen.
    el.querySelectorAll('sup.reference, sup.mw-ref').forEach(sup => {
      const a = sup.querySelector('a[href*="#"]');
      const id = a && decodeURIComponent(a.getAttribute('href').split('#')[1] || '');
      const li = id && document.getElementById(id);
      const rt = li && (li.querySelector('.reference-text, .mw-reference-text') || li);
      if (!rt) return sup.remove();
      if (!viiteTunnus.has(id)) {
        const k = rt.cloneNode(true);
        k.querySelectorAll('.mw-cite-backlink, .Z3988, .cs1-maint, .cs1-hidden-error, style, link, sup.reference, sup.mw-ref').forEach(x => x.remove());
        // Viitteen sisäiset merkinnät (full citation needed) hakasulkeisiin kursiivina; alaviite ei voi sisältää alaviitettä.
        k.querySelectorAll('sup.Inline-Template, sup.noprint, span.noprint').forEach(x => {
          const t = rivi(x.textContent).replace(/^\[|\]$/g, '').trim();
          if (!t) return x.remove();
          const em = document.createElement('em'); em.textContent = t; x.replaceWith(' [', em, ']');
        });
        k.querySelectorAll('sup').forEach(x => x.replaceWith(...x.childNodes));
        k.querySelectorAll('a[href]').forEach(x => {
          let u; try { u = new URL(x.getAttribute('href'), osoite); } catch (e) { return; }
          // Wikilinkit ja sivun omat ankkurit (#CITEREF…) tekstiksi; verkkolinkit jäävät.
          if (u.hostname === location.hostname || x.classList.contains('extiw')) x.replaceWith(...x.childNodes);
          else x.setAttribute('href', u.href);
        });
        const t = muunna(k.innerHTML, 'inlined').trim();
        if (!t) return sup.remove();
        viiteTunnus.set(id, lisaa(t));
      }
      sup.replaceWith(merkki(viiteTunnus.get(id)));
    });
    // Rivinsisäiset merkinnät (lähde?, selvennä, citation needed): alaviitteeksi selityksineen.
    const LAATIKKO = '.ambox, .tmbox, .ombox, .cmbox, .mbox-small, .asbox, .stub, table.metadata, div.metadata, .noprint.noviewer';
    // fi:n Selvennä-malline on myös ilman noprint-luokkaa: yläindeksissä pelkkä linkki mallineeseen.
    const mallineet = [...el.querySelectorAll('sup:not(.reference):not(.mw-ref)')].filter(x => rivi(x.textContent).length < 40 &&
      [...x.querySelectorAll('a[href]')].some(a => /\/wiki\/(Malline|Template|Wikipedia|Ohje):/i.test(decodeURIComponent(a.getAttribute('href')))));
    [...el.querySelectorAll('sup.Inline-Template, sup.noprint, span.noprint'), ...mallineet].forEach(m => {
      if (!el.contains(m) || !m.closest('p, li, dd, td, blockquote') || m.closest(LAATIKKO + ', .infobox, .navbox, .sidebar')) return;
      const nakyva = rivi(m.textContent).replace(/^\[|\]$/g, '').trim();
      const sel = rivi([m, ...m.querySelectorAll('[title]')].map(x => x.getAttribute && x.getAttribute('title') || '').filter(x => x && !/:/.test(x.slice(0, 20)) || /\(/.test(x)).join(' '));
      // fi: <sup style="font-style:italic"><span class="noprint">selvennä</span></sup>: kääre lähtee mukana.
      let kohde = m;
      while (/^(SUP|I|EM|SPAN|A)$/.test(kohde.parentElement.tagName) && rivi(kohde.parentElement.textContent).replace(/^\[|\]$/g, '').trim() === nakyva) kohde = kohde.parentElement;
      if (!nakyva) return kohde.remove();
      kohde.replaceWith(merkki(lisaa('*' + nakyva + '*' + (sel && sel !== nakyva ? ' – ' + sel : ''))));
    });
    // Huomautuslaatikot alaviitteiksi lähimpään edeltävään (alussa seuraavaan) kappaleeseen.
    el.querySelectorAll(LAATIKKO).forEach(b => {
      if (!el.contains(b) || b.parentElement.closest(LAATIKKO)) return;
      const k = (b.querySelector('.mbox-text, .ambox-text, .asbox-body') || b).cloneNode(true);
      k.querySelectorAll('style, link, img, figure, figcaption, .mbox-image, .hide-when-compact, .mw-collapsible-toggle').forEach(x => x.remove());
      k.querySelectorAll('a[href]').forEach(x => x.replaceWith(...x.childNodes));
      const t = muunna(k.innerHTML, 'inlined').replace(/\s*\n+\s*/g, ' ').trim();
      const kaikki = [...el.querySelectorAll('p')].filter(p => rivi(p.textContent) && !b.contains(p));
      const ed = kaikki.filter(p => p.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).pop() || kaikki[0];
      b.remove();
      if (t && ed) ed.appendChild(merkki(lisaa('*' + (fi ? 'Wikipedian huomautus' : 'Wikipedia notice') + ':* ' + t)));
    });
    // Loppuluettelon artikkelit (käyttäjän valinta 10.11.2026: kaikki wikilinkit tekivät satojen rivien luettelon, Age of
    // Enlightenment 547): vain toimittajien omat valinnat eli Pääartikkeli-, Katso myös- ja Lisätietoja-ohjausrivien
    // artikkelit esiintymisjärjestyksessä ja Katso myös -osio, joka siirtyy kokonaan luetteloon. Muut wikilinkit tekstiksi.
    const artikkelit = new Map();
    const artikkeli = a => {
      let u; try { u = new URL(a.getAttribute('href'), osoite); } catch (e) { return null; }
      const sisainen = u.hostname === location.hostname || /(^|\.)wikipedia\.org$/.test(u.hostname) && u.hostname.split('.')[0] === location.hostname.split('.')[0];
      const nimi = decodeURIComponent((/^\/wiki\/(.+)$/.exec(u.pathname) || [])[1] || '').replace(/_/g, ' ');
      const punainen = a.classList.contains('new') || /[?&]redlink=1/.test(u.search) || /[?&]action=edit/.test(u.search);
      if (!sisainen || !nimi || punainen || WIKI_NIMIAVARUUS.test(nimi) || u.pathname === location.pathname) return null;
      return { avain: 'https://' + location.hostname.replace(/\.m\./, '.') + '/wiki/' + u.pathname.slice(6), nimi: rivi(a.getAttribute('title')) || nimi };
    };
    const talteen = juuri => juuri.querySelectorAll('a[href]').forEach(a => {
      const k = artikkeli(a);
      if (k && !artikkelit.has(k.avain)) artikkelit.set(k.avain, k.nimi);
    });
    el.querySelectorAll('.hatnote, .dablink, .rellink').forEach(h => {
      if (/^\s*(pääartikkeli|pääartikkelit|katso myös|lisätietoja|main articles?|see also|further information)\b/i.test(h.textContent)) talteen(h);
    });
    const KATSO = /^(katso myös|see also)$/i;
    el.querySelectorAll('h2').forEach(h => {
      if (!KATSO.test(rivi(h.textContent.replace(/\[(muokkaa|edit)[^\]]*\]/gi, '')))) return;
      const kaare = h.closest('section') && h.closest('section').querySelector('h2') === h ? h.closest('section') : null;
      if (kaare && el.contains(kaare)) { talteen(kaare); kaare.remove(); return; }
      const alku = h.closest('.mw-heading') || h;
      while (alku.nextElementSibling && !/^H2$/.test(alku.nextElementSibling.tagName) && !alku.nextElementSibling.querySelector('h2')) {
        talteen(alku.nextElementSibling); alku.nextElementSibling.remove();
      }
      alku.remove();
    });
    // Kaavat: TeX-teksti koodina.
    el.querySelectorAll('.mwe-math-element').forEach(m => {
      const tex = m.querySelector('annotation[encoding="application/x-tex"]'), img = m.querySelector('img[alt]');
      const c = document.createElement('code');
      c.textContent = rivi(tex ? tex.textContent : img ? img.getAttribute('alt') : m.textContent).replace(/^\{\\displaystyle\s*(.*)\}$/, '$1');
      m.replaceWith(c);
    });
    el.querySelectorAll(['style', 'link', 'meta', 'script', 'noscript', '.mw-editsection', '.mw-empty-elt', '.shortdescription',
      '.hatnote', '.dablink', '.rellink', 'figure', '.thumb', '.gallery', '.mw-gallery-traditional', '.mw-gallery-packed', 'img',
      'audio', 'video', '.infobox', 'table.sidebar', '.sidebar', '.navbox', '.navbox-styles', '.vertical-navbox', '.sistersitebox',
      '.side-box', '.portalbox', '.portal', '#toc', '.toc', '#coordinates', '.geo-default', '.quotebox', '.mw-references-wrap',
      'ol.references', '.reflist', '.viitteet-malline', '.references-small', '.Z3988', '.cs1-maint', '.mw-cite-backlink',
      '.authority-control', '.NavFrame', '.navigaatiomalline', '.noprint', '.mw-kartographer-maplink', '.mw-kartographer-map'].join(', ')).forEach(x => x.remove());
    // Parsoidin osiot ja otsikkokääreet auki, jotta otsikot ja sisältö ovat samalla tasolla.
    el.querySelectorAll('section, div.mw-heading, div.section-heading, .mf-section-0, [class*="mf-section-"]').forEach(x => x.replaceWith(...x.childNodes));
    // Wikilinkit tekstiksi; verkkolinkit jäävät (toimivat vain Luinin verkkolinkit päällä).
    el.querySelectorAll('a[href]').forEach(a => {
      let u; try { u = new URL(a.getAttribute('href'), osoite); } catch (e) { return; }
      const sisainen = u.hostname === location.hostname || /(^|\.)wikipedia\.org$/.test(u.hostname) && u.hostname.split('.')[0] === location.hostname.split('.')[0];
      if (!sisainen && !a.classList.contains('extiw')) { a.setAttribute('href', u.href); return; }
      a.replaceWith(...a.childNodes);
    });
    // Tyhjiksi jääneet otsikot pois (fi: Lähteet, jossa oli vain viiteluettelo; en: Notes, References).
    const ots = h => /^H[2-6]$/.test(h.tagName);
    [...el.querySelectorAll('h2, h3, h4, h5, h6')].reverse().forEach(h => {
      let tyhja = true;
      for (let e = h.nextElementSibling; e && !(ots(e) && +e.tagName[1] <= +h.tagName[1]); e = e.nextElementSibling) {
        if (!ots(e) && rivi(e.textContent)) { tyhja = false; break; }
        if (ots(e)) { tyhja = false; break; }
      }
      if (tyhja) h.remove();
    });
    // Lähde- ja kirjallisuusluettelot kappaleiksi.
    const BIB = /^(lähteet|lähdeteokset|kirjallisuus|kirjallisuutta|lähdekirjallisuus|aiheesta muualla kirjallisuutta|references|sources|bibliography|works cited|cited works|further reading|citations|primary sources|secondary sources|general and cited (references|sources)|selected bibliography)$/i;
    let bib = 0;
    [...el.children].forEach(e => {
      if (ots(e)) { const t = +e.tagName[1]; if (BIB.test(rivi(e.textContent))) bib = t; else if (bib && t <= bib) bib = 0; return; }
      if (!bib) return;
      const listat = /^(UL|OL)$/.test(e.tagName) ? [e] : [...e.querySelectorAll('ul, ol')].filter(l => !l.parentElement.closest('ul, ol'));
      listat.forEach(l => l.replaceWith(...[...l.children].filter(li => li.tagName === 'LI').map(li => {
        const p = document.createElement('p');
        li.querySelectorAll('ul, ol').forEach(x => x.remove());
        while (li.firstChild) p.appendChild(li.firstChild);
        return p;
      })));
      if (/^DIV$/.test(e.tagName) && el.contains(e)) e.replaceWith(...e.childNodes);
    });
    if (artikkelit.size) {
      const h = document.createElement('h2'), ul = document.createElement('ul');
      h.textContent = fi ? 'Wikipedia-artikkelit' : 'Wikipedia articles';
      artikkelit.forEach((nimi, u) => { const li = document.createElement('li'), a = document.createElement('a'); a.href = u; a.textContent = nimi; li.appendChild(a); ul.appendChild(li); });
      el.append(h, ul);
    }
    let julkaistu = '';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try { const j = JSON.parse(s.textContent); julkaistu = julkaistu || String(j.dateModified || '').slice(0, 10); } catch (e) {}
    });
    return { html: el.innerHTML, otsikko: rivi((document.querySelector('#firstHeading, h1') || {}).textContent),
      tekija: '', sivusto: 'Wikipedia', julkaistu, maar: maar.map(([t, x]) => maaritelma(t, x)) };
  }

  async function valmista(html, omat = []) {
    const d = jasenna(html);
    // Sivun sisäinen linkki (#viite-1) sivun osoitteeksi kuten MarkDownloadissa: Latomo tekee leikkeen omalle
    // sivulle vievästä yläindeksilinkistä pelkän numeron. Readability jättää #-linkit ennalleen.
    d.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', osoite + a.getAttribute('href')));
    const maar = await viitteet(d);
    let md = muunna(d.body.innerHTML).replace(MERKKI, '[^viite-$1]');
    // Sovitteen omat alaviitteet vain, jos niiden merkki on mukana (valinta voi olla osa tekstistä).
    const kaikki = maar.concat(omat.filter(x => md.includes('[^viite-' + /^\[\^viite-([^\]]+)\]/.exec(x)[1] + ']')));
    if (kaikki.length) md += '\n\n' + kaikki.join('\n\n');
    return { md, viitteita: kaikki.length };
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
  if (!sep) for (const f of [logos, wikipedia, blogger]) {
    try { blogi = await f(); } catch (e) { blogi = null; }
    if (blogi) break;
  }
  const sisalto = sep || (blogi && blogi.html) || (artikkeli && artikkeli.content) || '';
  const omat = (blogi && blogi.maar) || [];

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

  const [koko, valinta] = await Promise.all([sisalto ? valmista(sisalto, omat) : null, valintaHtml ? valmista(valintaHtml) : null]);
  const sanoja = s => (s.match(/\S+/g) || []).length;
  return {
    otsikko, sivusto: (blogi && (blogi.sivusto || blogi.otsikko)) || rivi(artikkeli && artikkeli.siteName) || location.hostname.replace(/^www\./, ''),
    koko: koko && koko.md ? alku + koko.md + '\n' : '', kokoSanoja: koko ? sanoja(koko.md) : 0, kokoViitteita: koko ? koko.viitteita : 0,
    valinta: valinta && valinta.md ? alku + valinta.md + '\n' : '', valintaSanoja: valinta ? sanoja(valinta.md) : 0,
    valintaViitteita: valinta ? valinta.viitteita : 0
  };
})();
