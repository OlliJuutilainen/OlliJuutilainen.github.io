/* Lisää lukimeen: leikkuri. Ajetaan sivulla kirjastojen (Readability, Turndown, GFM) jälkeen; viimeisen lausekkeen arvo
   (lupaus) palaa ponnahdusikkunalle. IIFE, koska tiedosto ajetaan uudelleen joka kerta, kun ikkuna avataan samalla sivulla.

   Tulos noudattaa Latomon ohjeen suosittelemia MarkDownload-asetuksia (latomo-ohje.html#markdownload), jotta Latomon
   MarkDownload-tila siivoaa sen samoin: etukentässä korvamerkki leikattu:, Atx-otsikot, viiva ___, luettelo -,
   aidattu koodi, *kursiivi*, **lihavointi**, viitelinkit lopussa, kuvat pois, Markdown-merkit suojattuina,
   yläindeksit HTML:nä (Latomo muuntaa ne ^1^-muotoon). Lisäksi kaksi asiaa, joihin MarkDownload ei pysty:
   tunnettujen sivujen sisältö ilman Readabilityn karsintaa (sovite) ja toiselle sivulle viittaavat alaviitteet
   haettuina Luinin alaviitteiksi. Omat sovitteet: SEP, Blogger, Ensyklopedia Logos (filosofia.fi) ja Wikipedia
   (käyttäjän pyyntö 10.11.2026) sekä marxists.org, Wait But Why ja Open Encyclopedia of Cognitive Science (11.11.2026) sekä Encyclopedia.com ja IPA:n Inter-Regional Encyclopedic Dictionary of Psychoanalysis (13.11.2026) sekä St Andrews Encyclopaedia of Theology ja Project Gutenberg (14.11.2026). */
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
      // Hakasulkeet linkin sisällä tai ympärillä (SEP: [<a>7</a>], marxists.org: <a>[20]</a>).
      const nro = a.length === 1 ? a[0].textContent.trim().replace(/^\[\s*(.*?)\s*\]$/, '$1') : '';
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
      // Ankkuri id:nä tai vanhan HTML:n nimenä (marxists.org: <a name="fn20">).
      let el = sd && (sd.getElementById(m.id) || [...sd.getElementsByName(m.id)].find(x => x.tagName === 'A'));
      if (!el) continue;
      // Tyhjä ankkuri kappaleen sisällä tai sen edellä (marxists.org: <a name="fn20"> </a><p>20. …</p>).
      if (rivi(el.textContent).length < 4 && el.parentElement) {
        const seur = el.nextElementSibling;
        el = el.closest('p, li, dd') || (seur && /^(P|LI|DD|BLOCKQUOTE)$/.test(seur.tagName) ? seur : null) || el.closest('p, li, div') || el;
      }
      const k = el.cloneNode(true);
      k.querySelectorAll('a[href]').forEach(x => { try { x.setAttribute('href', new URL(x.getAttribute('href'), m.sivu).href); } catch (e) {} });
      // Paluulinkki (SEP: <a href="index.html#ref-1">1.</a>) pois.
      const paluu = [...k.querySelectorAll('a[href]')].find(x => /^\[?\d+[a-z]?\.?\]?$/i.test(x.textContent.trim()));
      if (paluu) paluu.remove();
      // Linkin ulkopuolelle jäänyt piste (SEP:n Heraclitus: <a …>1</a>. The B prefix …) pois alusta.
      let teksti = muunna(k.innerHTML, 'inlined').trim();
      if (paluu) teksti = teksti.replace(/^\\?[.):\]]\s*/, '');
      // Numero tekstin alussa ilman paluulinkkiä (marxists.org: <span class="term">20.</span> The term …).
      else teksti = teksti.replace(new RegExp('^\\\\?\\[?' + m.nro + '\\\\?\\]?\\\\?[.)]?\\s+'), '');
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

  /* Viitemerkki ja sen kohde samalla sivulla (marxists.org, Wait But Why): merkki on #-linkki, jonka teksti on pelkkä
     tunnus ([1], 1*, (2), [note], *), ja kohde on sen jälkeen. Kohteen lohko (p, li, dd, div) on alaviitteen teksti, kun se
     alkaa samalla tunnuksella tai siinä on paluulinkki (#-linkki taaksepäin). Jatkokappaleet ovat seuraavia sisaruksia,
     kunnes vastaan tulee toinen viite, otsikko tai viiva. Palauttaa määritelmät; merkit korvautuvat ja lohkot poistuvat. */
  const TUNNUS = /^[[(]?\s*(\d{1,3}[a-z]?\*?|\*{1,3}|[†‡§]|[a-z]|note|n\.?\s?\d{1,3})\s*[\])]?\.?$/i;
  const tunnusOf = t => (TUNNUS.exec(rivi(t)) || [])[1];
  // jatkuu(lohko, seuraava): saako viitettä seuraava elementti olla sen jatkokappale (Gutenberg: vain saman viitelaatikon;
  // oletuksena kaikki seuraavaan viitteeseen, otsikkoon tai viivaan asti).
  function samanSivunViitteet(juuri, etuliite, jatkuu = null) {
    const kohde = id => { try { return juuri.querySelector('[id="' + CSS.escape(id) + '"], a[name="' + CSS.escape(id) + '"]'); } catch (e) { return null; } };
    const merkit = [];
    juuri.querySelectorAll('a[href^="#"]').forEach(a => {
      const tunnus = tunnusOf(a.textContent);
      let id = a.getAttribute('href').slice(1);
      try { id = decodeURIComponent(id); } catch (e) {}
      const k = tunnus && id && kohde(id);
      if (!k || !(a.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      const seur = !rivi(k.textContent) && !k.closest('p, li, dd') && k.nextElementSibling;
      const lohko = seur && /^(P|LI|DD|DIV)$/.test(seur.tagName) ? seur : k.closest('p, li, dd, div, td');
      if (!lohko || lohko === juuri || !juuri.contains(lohko) || lohko.contains(a) || lohko.closest('h1, h2, h3, h4, h5, h6')) return;
      merkit.push({ a, tunnus, lohko });
    });
    // Alkaako lohko tunnuksella tai onko siinä paluulinkki taaksepäin.
    const kelpaa = m => {
      const alku = rivi(m.lohko.textContent).slice(0, 12).replace(/^[[(]?\s*/, '');
      if (alku.toLowerCase().startsWith(m.tunnus.toLowerCase())) return true;
      return [...m.lohko.querySelectorAll('a[href^="#"]')].some(x => {
        const t = kohde(x.getAttribute('href').slice(1));
        return t && (t.compareDocumentPosition(m.lohko) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
    };
    const ok = merkit.filter(kelpaa);
    // Kohde puuttuu (Capitalin [11]: sivulta puuttuu ankkuri 11): sama tunnus muiden viitteiden lohkojen joukosta, kun
    // lohko alkaa tunnuksella (11. …) ja sillä on sama luokka kuin löydetyillä viitteillä.
    const luokat = new Set(ok.map(m => m.lohko.tagName + '.' + m.lohko.className));
    if (luokat.size) juuri.querySelectorAll('a[href^="#"]').forEach(a => {
      const tunnus = tunnusOf(a.textContent);
      if (!tunnus || merkit.some(m => m.a === a) || kohde(a.getAttribute('href').slice(1))) return;
      const lohko = [...juuri.querySelectorAll('p, li, dd, div')].find(b => luokat.has(b.tagName + '.' + b.className) &&
        (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && new RegExp('^[[(]?' + tunnus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\])]?[.:)]?\\s', 'i').test(rivi(b.textContent) + ' '));
      if (lohko && !ok.some(m => m.lohko === lohko)) ok.push({ a, tunnus, lohko });
    });
    ok.sort((x, y) => x.a.compareDocumentPosition(y.a) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const lohkot = new Set(ok.map(m => m.lohko));
    const alkaaTunnuksella = e => {
      const a = e.querySelector('a[href^="#"]');
      return a && tunnusOf(a.textContent) && rivi(e.textContent).startsWith(rivi(a.closest('sup, span') && e.contains(a.closest('sup, span')) ? a.closest('sup, span').textContent : a.textContent));
    };
    const tunnukset = new Map(), maar = [];
    for (const m of ok) {
      if (!tunnukset.has(m.lohko)) {
        const osat = [m.lohko];
        for (let n = m.lohko.nextElementSibling; n && !lohkot.has(n) && !/^(H[1-6]|HR)$/.test(n.tagName) && !alkaaTunnuksella(n) && (!jatkuu || jatkuu(m.lohko, n)); n = n.nextElementSibling) {
          if (n.querySelector('h1, h2, h3, h4, h5, h6, hr')) break;
          osat.push(n);
        }
        const k = m.lohko.cloneNode(true);
        // Tunnus pois alusta: tunnuksen sisältävä elementti (sup, span, a) ja sen perään jäävä piste tai sulku.
        const ens = [...k.querySelectorAll('a, sup, span')].find(x => tunnusOf(x.textContent) && rivi(k.textContent).startsWith(rivi(x.textContent).slice(0, 1)));
        let pois = ens;
        while (pois && pois.parentElement !== k && /^(SUP|SPAN|A|B|STRONG)$/.test(pois.parentElement.tagName) && rivi(pois.parentElement.textContent) === rivi(pois.textContent)) pois = pois.parentElement;
        if (pois && rivi(k.textContent).startsWith(rivi(pois.textContent))) pois.remove();
        const palat = [k, ...osat.slice(1).map(x => x.cloneNode(true))].map(x => {
          // Luettelon kohta (Wait But Why: <li class="footnote">) lohkoksi, ettei siitä tule luetteloa; lainaus lainaukseksi.
          const uusi = /^BLOCKQUOTE$/.test(x.tagName) || /\bquote/.test(x.className) ? 'blockquote' : /^(LI|DD|TD)$/.test(x.tagName) ? 'div' : '';
          if (!uusi) return x;
          const q = document.createElement(uusi);
          while (x.firstChild) q.appendChild(x.firstChild);
          return q;
        });
        const kaare = document.createElement('div');
        palat.forEach(x => kaare.appendChild(x));
        // Paluulinkki (↩) pois, muut saman sivun linkit tekstiksi.
        kaare.querySelectorAll('a[href^="#"]').forEach(x => /^[↩↑⏎^]︎?$/.test(rivi(x.textContent)) ? x.remove() : x.replaceWith(...x.childNodes));
        kaare.querySelectorAll('a[href]').forEach(x => x.setAttribute('href', x.href));
        let t = muunna(kaare.innerHTML, 'inlined').trim()
          .replace(new RegExp('^\\\\?[\\[(]?\\s*' + m.tunnus.replace(/[.*+?^${}()|[\]\\]/g, '\\\\?\\$&') + '\\s*\\\\?[\\])]?(?:\\\\?[.):])?\\s+'), '')
          .replace(/^\\?[.):\]]\s*/, '');
        // Lainaus jatkokappaleena: alaviitteessä ei ole lainauslohkoa, joten > pois (maaritelma()).
        const tunnus = etuliite + (tunnukset.size + 1);
        tunnukset.set(m.lohko, t ? tunnus : '');
        if (t) maar.push(maaritelma(tunnus, t));
        osat.forEach(x => x.remove());
      }
      const t = tunnukset.get(m.lohko);
      if (!t) continue;
      // Merkin kääre (sup, span.note) lähtee mukana, jos siinä ei ole muuta.
      let kohta = m.a;
      while (/^(SUP|SPAN)$/.test(kohta.parentElement.tagName) && rivi(kohta.parentElement.textContent).replace(/[[\]()]/g, '') === rivi(m.a.textContent).replace(/[[\]()]/g, '')) kohta = kohta.parentElement;
      kohta.replaceWith(merkki(t));
    }
    return maar;
  }

  /* Marxists Internet Archive (marxists.org ja peilit, käyttäjän pyyntö 11.11.2026). Käsin tehtyjä sivuja kolmelta
     vuosikymmeneltä: ei yhtä runkoa, vaan works.css-luokat. Sivun ylälaidan nimiö (tekijä, teos, osa, vuosi) on otsikoina
     ja p.title-kappaleina ennen ensimmäistä viivaa; luvun nimi on viivojen välissä tai heti tekstin edellä. Nimiöstä
     etukenttään tekijä, teos ja vuosi (Written/Kirjoitettu, muuten osoitteen vuosi), otsikoksi luvun nimi tai koko teoksen
     sivulla teoksen nimi. Tietolohko (p.information: lähde, käännös, litterointi, Copyleft) siirtyy tekstin loppuun omaksi
     osiokseen ja Copyleft-rivi tekijänoikeusmerkinnäksi. Lainaukset ovat sivulla sisennettyjä kappaleita (p.quote, quoteb):
     ne ovat lainauksia. Viitteet (samalla sivulla, [1] ↔ #fw01) ovat alaviitteitä. Navigointi, sisällysluettelo ja
     kopiointirivit (Last updated) pois. */
  const MIA_NIMI = 'Marxists Internet Archive';
  const MIA_NIMIO = 'p.title, p.title2, p.header';
  const MIA_LAINAUS = 'p.quote, p.quoteb, p.quotec, p.quote-list, p.indentb, p.indentc';
  const MIA_VIITEOSIO = /^(notes?|footnotes|endnotes|notes on .*|editor'?s? notes?|viitteet|alaviitteet|huomautukset|selitykset)\s*:?$/i;
  const MIA_NAVI = /^(?:next|previous|prev|back|forward|up|top|home|index|contents|table of contents|download( pdf)?|pdf|seuraava|edellinen|takaisin|sisällys(?:luettelo)?|alkuun|ylös|archive|[|:·•<>\-–—»«[\]()\s.,])*$/i;
  // Otsikon rivinvaihto: numero tai luvun nimitys pisteellä (I. Porvarit…), muuten kaksoispiste (Chapter I: The Opportunist Method).
  const MIA_NUMERO = /^(?:[IVXLC]+|\d+[a-z]?|[A-Z])\.?$/;
  const MIA_LUKU = /^(?:(?:chapter|part|book|volume|section|luku|osa|kirja|kapitel|teil|buch)\s+(?:[IVXLC]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten)|(?:[IVXLC]+|\d+)\.?(?:\s+(?:luku|osa|kirja))?)\.?$/i;
  const otsikkoRivit = e => {
    const k = e.cloneNode(true);
    k.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
    k.querySelectorAll('sup').forEach(s => { if (tunnusOf(s.textContent)) s.remove(); });
    return k.textContent.replace(MERKKI, '').split('\n').map(rivi).filter(Boolean);
  };
  const yhdista = rivit => rivit.reduce((s, r) => !s ? r : s + (MIA_NUMERO.test(s) ? (/\.$/.test(s) ? ' ' : '. ') : /[.:!?]$/.test(s) || /^[([]/.test(r) ? ' ' : ': ') + r, '');
  async function marxists() {
    if (!/(^|\.)marxists\.(org|net)$/.test(location.hostname) && !document.querySelector('link[href*="css/works.css" i]')) return null;
    const el = document.body.cloneNode(true);
    el.querySelectorAll('script, style, noscript, link, meta, iframe, form, img, table.footer, p.footer, p.next, p.updat, p.skip, p.toc, div.toc, .toc')
      .forEach(x => x.remove());
    const kokoTeksti = rivi(el.textContent).length || 1;
    // Kääreet auki: blockquote, div.border tai center, jonka sisällä on otsikoita tai viivoja ja suuri osa tekstistä.
    for (let muuttui = true; muuttui;) {
      muuttui = false;
      for (const k of el.querySelectorAll('blockquote, div, center, table, tbody, tr, td')) {
        if (k.querySelector('h1, h2, h3, h4, hr, p.information') && rivi(k.textContent).length >= 0.4 * kokoTeksti) {
          k.replaceWith(...k.childNodes); muuttui = true; break;
        }
      }
    }
    // Sisällysluettelot ja navigointi: kappale (myös otsikoksi merkitty), jossa on vain linkkejä ja navigointisanoja.
    el.querySelectorAll('p, div, ul, ol, table, center, h1, h2, h3, h4, h5, h6').forEach(b => {
      if (!el.contains(b)) return;
      const linkit = [...b.querySelectorAll('a[href]')];
      // Viitteen tunnuslinkki (11.) ja pelkkä viittauslinkki (K. Marx. l.c., p.6.) eivät ole navigointia.
      if (!linkit.length || rivi(b.textContent).length > 600 || linkit.some(a => tunnusOf(a.textContent))) return;
      const k = b.cloneNode(true);
      k.querySelectorAll('a[href]').forEach(a => a.remove());
      if (MIA_NAVI.test(rivi(k.textContent))) b.remove();
    });
    // Sisällysluettelo: vain saman sivun #-linkkejä, ja linkit ovat suurin osa tekstistä (Capital: p.index ja p.indentb).
    el.querySelectorAll('p, div, ul, ol, table').forEach(b => {
      if (!el.contains(b)) return;
      const linkit = [...b.querySelectorAll('a[href]')];
      if (linkit.length && linkit.every(a => a.getAttribute('href').startsWith('#') && !tunnusOf(a.textContent)) &&
        linkit.reduce((n, a) => n + rivi(a.textContent).length, 0) >= 0.5 * rivi(b.textContent).length) b.remove();
    });
    // Taulukot: asettelutaulukko (sisäkkäisiä, Capitalin arvomuodon yhtälöt) riveiksi, otsikkorivitön taulukko otsikkoriviksi
    // (GFM:n taulukko tarvitsee otsikkorivin, muuten Turndown jättää sen HTML:ksi), yksisarakkeinen kappaleiksi.
    const rivitOf = t => [...t.rows].flatMap(r => [...r.cells].some(c => c.querySelector('table'))
      ? [...r.cells].flatMap(c => c.querySelector('table')
        ? [...c.querySelectorAll('table')].filter(x => x.parentElement.closest('table') === t).flatMap(rivitOf) : [rivi(c.textContent)])
      : [[...r.cells].map(c => rivi(c.textContent)).filter(Boolean).join(' ')]).filter(Boolean);
    [...el.querySelectorAll('table')].filter(t => !t.parentElement.closest('table')).forEach(t => {
      const sarakkeita = Math.max(0, ...[...t.rows].map(r => r.cells.length));
      if (t.querySelector('table') || sarakkeita < 2 || t.rows.length < 2) {
        const p = document.createElement('p');
        rivitOf(t).forEach((r, i) => { if (i) p.appendChild(document.createElement('br')); p.appendChild(document.createTextNode(r)); });
        return rivi(p.textContent) ? t.replaceWith(p) : t.remove();
      }
      if (!t.querySelector('th')) [...t.rows[0].cells].forEach(c => {
        const th = document.createElement('th'); while (c.firstChild) th.appendChild(c.firstChild); c.replaceWith(th);
      });
    });
    const maar = samanSivunViitteet(el, 'mia');
    // Tyhjiksi jääneet viiteosioiden otsikot pois.
    el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      if (!MIA_VIITEOSIO.test(rivi(h.textContent))) return;
      let tyhja = true;
      for (let n = h.nextElementSibling; n && !/^(H[1-6]|HR)$/.test(n.tagName); n = n.nextElementSibling) if (rivi(n.textContent)) { tyhja = false; break; }
      if (tyhja) h.remove();
    });

    // Nimiö ja luvun nimi: ensimmäiseen sisältökappaleeseen asti.
    const lapset = () => [...el.children].filter(x => x.tagName !== 'BR' && !(x.tagName === 'A' && !rivi(x.textContent)));
    const nimioLuokka = x => x.matches(MIA_NIMIO + ', p.information, p.from, p.transcriber, p.sub, p.date, p.index, p.indexa, p.indexb');
    const sisaltoa = x => !/^(H[1-6]|HR)$/.test(x.tagName) && !nimioLuokka(x) && rivi(x.textContent);
    const kaikki = lapset();
    let s = kaikki.findIndex(sisaltoa);
    if (s < 0) s = kaikki.length;
    const alku = kaikki.slice(0, s);
    const ekaViiva = alku.findIndex(x => x.tagName === 'HR');
    const nimio = alku.filter((x, i) => (ekaViiva < 0 ? x.matches(MIA_NIMIO) : i < ekaViiva) && x.tagName !== 'HR' && !x.matches('p.information'));
    const johto = alku.filter(x => !nimio.includes(x));
    const tiedot = alku.filter(x => x.matches('p.information'));
    // Tekijä: meta author, muuten <title>-rivin alku, kun nimiössä on sama rivi (suomenkielinen osasto).
    const metaTekija = rivi((document.querySelector('meta[name="author" i]') || {}).content);
    const otsTekija = (/^([^:]{3,60}):\s/.exec(document.title) || [])[1] || '';
    const nimioRivit = nimio.flatMap(otsikkoRivit);
    let tekija = metaTekija || (nimioRivit.includes(rivi(otsTekija)) ? rivi(otsTekija) : '');
    const suku = tekija.split(/\s+/).pop() || '\u0000';
    // Pelkkä nimi (Vladimir Ilyich Lenin, V. I. Lenin), ei nimi ja teos (Karl Marx. Capital Volume One).
    const tekijaRivi = r => r === tekija || r.split(/\s+/).length <= 5 && r.includes(suku) && !/\d|[:;]|\p{L}{2,}\.\s/u.test(r) &&
      r.split(/\s+/).every(w => /^[\p{Lu}&]/u.test(w) || /^(von|van|de|der|la|le|du)$/.test(w));
    // Nimiörivi tekijän nimestä ja arkiston nimestä vapaana (Karl Marx. Capital Volume One → Capital Volume One).
    const eiTekijaa = r => {
      if (tekija) {
        const e = tekija.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        r = r.replace(new RegExp('^' + e + '\\s*[.:,–—-]?\\s*'), '').replace(new RegExp('\\s*[.,:–—-]?\\s*' + e + '$'), '');
      }
      return rivi(r);
    };
    const vuosiRivi = r => /^(1[5-9]\d\d|20\d\d)$/.test(r);
    const arkistoa = r => /internet archive|^MIA\b|marxists\.org|arkisto$/i.test(r);
    let nimioVuosi = '';
    const teosRivit = [];
    let h1 = '';
    nimio.forEach(x => otsikkoRivit(x).forEach((r, i, k) => {
      if (tekijaRivi(r) || arkistoa(r)) return;
      r = eiTekijaa(r);
      if (!r) return;
      if (vuosiRivi(r)) { nimioVuosi = nimioVuosi || r; return; }
      if (x.tagName === 'H1' && !h1) { h1 = yhdista(otsikkoRivit(x).filter(y => !tekijaRivi(y))); return; }
      if (x.tagName !== 'H1') teosRivit.push(r);
    }));
    if (!h1) h1 = '';
    // Luvun nimi: johdon ensimmäinen samantasoisten otsikoiden ryhmä. Koko teoksen sivulla (nimiön h1 toistuu johdossa) otsikko
    // on teoksen nimi ja toistoa seuraava otsikko alaotsikko.
    const johtoOts = johto.filter(x => /^H[1-6]$/.test(x.tagName));
    let otsikko = '', alaotsikko = '', poistettavat = [];
    const toisto = h1 && johtoOts.find(x => rivi(yhdista(otsikkoRivit(x))).toLowerCase() === h1.toLowerCase());
    if (toisto) {
      otsikko = h1;
      poistettavat.push(toisto);
      const seur = lapset()[lapset().indexOf(toisto) + 1];
      if (seur && /^H[1-6]$/.test(seur.tagName) && johto.includes(seur)) { alaotsikko = yhdista(otsikkoRivit(seur)); poistettavat.push(seur); }
    } else if (johtoOts.length) {
      const eka = johtoOts[0], ryhma = [eka];
      for (let n = eka.nextElementSibling; n && n.tagName === eka.tagName && johto.includes(n); n = n.nextElementSibling) ryhma.push(n);
      const viimeinen = ryhma[ryhma.length - 1];
      let jalkeen = viimeinen.nextElementSibling;
      while (jalkeen && jalkeen.tagName === 'A' && !rivi(jalkeen.textContent)) jalkeen = jalkeen.nextElementSibling;
      const kaista = jalkeen && jalkeen.tagName === 'HR';
      const myohemmat = [...el.querySelectorAll(eka.tagName)].filter(h => !ryhma.includes(h) && !nimio.includes(h) && !MIA_VIITEOSIO.test(rivi(h.textContent)));
      if (kaista || !myohemmat.length) {
        otsikko = yhdista(ryhma.flatMap(otsikkoRivit));
        poistettavat = ryhma;
        // Otsikon viitemerkki ei mahdu #-riville leikkeessä; se jää otsikon perään.
        ryhma.forEach(h => (h.textContent.match(MERKKI) || []).forEach(x => { otsikko += x; }));
      }
    }
    if (!otsikko) otsikko = h1 || teosRivit.shift() || '';
    else if (h1 && !toisto) teosRivit.unshift(h1);
    const teos = otsikko === h1 && toisto ? '' : teosRivit.filter(r => r !== otsikko).join('. ');
    // Nimiö, johdon otsikot ja tietolohko pois tekstistä; tietolohko loppuun.
    nimio.forEach(x => x.remove());
    poistettavat.forEach(x => x.remove());
    tiedot.forEach(x => x.remove());
    // Viivat: vain tekstin keskellä kahden kappaleen välissä (osanvaihto); alku, loppu ja otsikon viereiset pois.
    [...el.querySelectorAll('hr')].forEach(h => {
      const ed = h.previousElementSibling, se = h.nextElementSibling;
      const kpl = x => x && !/^(H[1-6]|HR)$/.test(x.tagName) && rivi(x.textContent);
      if (!kpl(ed) || !kpl(se)) h.remove();
    });
    while (el.lastElementChild && !rivi(el.lastElementChild.textContent)) el.lastElementChild.remove();
    // Kappaleen lopun rivinvaihdot (<br><br> ennen </p>) olisivat Markdownissa kovia rivinvaihtoja.
    el.querySelectorAll('p, blockquote, li, dd').forEach(p => {
      for (let n = p.lastChild; n && (n.nodeName === 'BR' || n.nodeType === 3 && !n.data.trim() || n.nodeName === 'A' && !rivi(n.textContent)); n = p.lastChild) n.remove();
    });
    // Irralliset rivinvaihdot ja tyhjät kappaleet (<br />, <p>&nbsp;</p>) jäivät Markdowniin kovina rivinvaihtoina.
    [...el.children].forEach(x => { if (x.tagName === 'BR' || /^(P|DIV)$/.test(x.tagName) && !rivi(x.textContent.replace(/\u00a0/g, ' ')) && !x.querySelector('hr, table')) x.remove(); });
    // Kappaleen numero linkkinä (Hegel: [Φ](saksankielinen) [1.](Findlayn selitys)) tekstiksi.
    el.querySelectorAll('a[href]').forEach(a => { if (/^(?:Φ|§|¶|\d{1,4}\.?)$/.test(rivi(a.textContent))) a.replaceWith(...a.childNodes); });
    // Lainaukset: peräkkäiset sisennetyt kappaleet yhdeksi lainaukseksi.
    el.querySelectorAll(MIA_LAINAUS).forEach(p => {
      if (!el.contains(p)) return;
      const ed = p.previousElementSibling;
      const q = ed && ed.tagName === 'BLOCKQUOTE' && ed.dataset.mia ? ed : document.createElement('blockquote');
      if (q !== ed) { q.dataset.mia = '1'; p.before(q); }
      const uusi = document.createElement('p');
      while (p.firstChild) uusi.appendChild(p.firstChild);
      q.appendChild(uusi); p.remove();
    });
    // Otsikoiden rivinvaihdot (Chapter I<br>The Opportunist Method): Markdown-otsikko on yksi rivi.
    el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const r = otsikkoRivit(h);
      if (r.length < 2) return;
      const merkit = h.textContent.match(MERKKI) || [];
      h.textContent = yhdista(r) + merkit.join('');
    });
    // Luvun nimitys omana otsikkonaan (I luku / Luokkayhteiskunta ja valtio, I / Porvarit ja proletaarit) yhdeksi otsikoksi.
    const vaihda = (h, taso) => { const u = document.createElement('h' + taso); while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u); return u; };
    const luvut = [];
    [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].forEach(h => {
      if (!el.contains(h) || !MIA_LUKU.test(rivi(h.textContent.replace(MERKKI, '')))) return;
      let n = h.nextElementSibling;
      while (n && n.tagName === 'A' && !rivi(n.textContent)) n = n.nextElementSibling;
      if (!n || !/^H[1-6]$/.test(n.tagName) || MIA_LUKU.test(rivi(n.textContent.replace(MERKKI, '')))) return;
      const merkit = (h.textContent + n.textContent).match(MERKKI) || [];
      const t = yhdista([rivi(h.textContent.replace(MERKKI, '')), rivi(n.textContent.replace(MERKKI, ''))]) + merkit.join('');
      const u = vaihda(h, Math.min(+h.tagName[1], +n.tagName[1]));
      u.textContent = t; n.remove(); luvut.push(u);
    });
    // Luvut sivun omaa osiotasoa alempana (suomenkielinen Valtio ja vallankumous: luku h3, osiot h2): luvut ylimmiksi.
    if (luvut.length > 1) {
      const lt = Math.min(...luvut.map(h => +h.tagName[1]));
      const muut = [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(h => !luvut.includes(h) && !MIA_VIITEOSIO.test(rivi(h.textContent)) && rivi(h.textContent) !== MIA_NIMI);
      if (muut.some(h => +h.tagName[1] <= lt)) {
        muut.forEach(h => vaihda(h, Math.min(6, Math.max(3, +h.tagName[1] + 1))));
        luvut.forEach(h => vaihda(h, 2));
      }
    }
    // Otsikkotasot peräkkäisiksi ##:sta alkaen (sivut hyppivät h2:sta h5:een; Luinissa tasoja on neljä).
    const kaytetyt = [...new Set([...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => +h.tagName[1]))].sort();
    if (kaytetyt.some((t, i) => t !== i + 2)) el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => vaihda(h, Math.min(6, kaytetyt.indexOf(+h.tagName[1]) + 2)));
    // Tähtirivi (* * *) taulukkona tai kappaleena on osanvaihto.
    el.querySelectorAll('table, p, div').forEach(t => {
      if (el.contains(t) && /^[*⁂∗\s]+$/.test(t.textContent.replace(/ /g, ' ')) && /\*.*\*/.test(t.textContent)) t.replaceWith(document.createElement('hr'));
    });
    // Tietolohko tekstin loppuun omaksi osiokseen tekstin ylimmän otsikkotason mukaan.
    const tietoRivit = tiedot.flatMap(x => { const k = x.cloneNode(true); k.querySelectorAll('br').forEach(b => b.replaceWith('\n')); return k.textContent.split('\n'); }).map(rivi).filter(Boolean);
    if (tiedot.length) {
      const tasot = [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => +h.tagName[1]);
      const h = document.createElement('h' + Math.max(2, tasot.length ? Math.min(...tasot) : 2));
      h.textContent = MIA_NIMI;
      el.appendChild(h);
      tiedot.forEach(x => el.appendChild(x));
    }
    if (alaotsikko) { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = alaotsikko; p.appendChild(em); el.prepend(p); }
    // Vuosi: kirjoitusvuosi tietolohkosta, muuten osoitteen vuosi (arkiston oma luokitus), muuten nimiön vuosi.
    const kirj = tietoRivit.find(r => /^(written|kirjoitettu|geschrieben)\b/i.test(r));
    const vuosi = (kirj && (/(1[5-9]\d\d|20\d\d)/.exec(kirj) || [])[1]) || (/\/(1[5-9]\d\d|20\d\d)(?:[-/]|$)/.exec(location.pathname) || [])[1] || nimioVuosi;
    // Copyleft- tai Public Domain -rivi; arkiston CC-sivu on Creative Commons BY-SA 2.0.
    let oikeus = null;
    const ol = tiedot.length && tietoRivit.find(r => /^(copyleft|public domain|copyright|tekijänoikeu)/i.test(r));
    if (ol) {
      const a = tiedot.map(x => x.querySelector('a[href*="legal/cc/"]')).find(Boolean);
      const cc = a && /legal\/cc\/(by(?:-nc)?(?:-sa|-nd)?)\.htm/i.exec(a.getAttribute('href'));
      oikeus = { teksti: ol, lahde: cc && cc[1].toLowerCase() === 'by-sa' ? 'https://creativecommons.org/licenses/by-sa/2.0/' : a ? a.href : location.origin + '/admin/legal/index.htm' };
    }
    return { html: irrota([el]).innerHTML, otsikko: rivi(otsikko.replace(MERKKI, '')), otsikkoMerkit: (otsikko.match(MERKKI) || []).join(''),
      tekija, teos, sivusto: MIA_NIMI, julkaistu: vuosi || '', maar, oikeus };
  }

  /* Wait But Why (waitbutwhy.com, käyttäjän pyyntö 11.11.2026). WordPress: runko article .entry-content. Viitteitä on
     kahta lajia (sininen rel=footnote: lisätieto, harmaa rel=footnote2: lähde), kumpikin numeroitu ykkösestä; molemmat
     ovat alaviitteitä. Väliotsikot ovat usein isolla kirjasinkoolla lihavoituja kappaleita: ne ovat otsikoita koon mukaan.
     Pois: PDF-mainos, kuvien lähderivit (pieni kirjasin), sisällysluettelo, viivat ______ (osanvaihto), lopun Related
     posts -luettelot, uutiskirje ja Patreon. Kuvat jäävät pois kuten muualla (Luin ei hae kuvia). */
  const WBW_NIMI = 'Wait But Why';
  const fontPt = e => {
    let pt = 0;
    [e, ...e.querySelectorAll('[style*="font-size"]')].forEach(x => {
      const m = /font-size:\s*([\d.]+)\s*(pt|px|em)/i.exec(x.getAttribute && x.getAttribute('style') || '');
      if (m) pt = Math.max(pt, m[2] === 'px' ? m[1] * 0.75 : m[2] === 'em' ? m[1] * 12 : +m[1]);
    });
    return pt;
  };
  async function waitbutwhy() {
    const runko = /(^|\.)waitbutwhy\.com$/.test(location.hostname) && document.querySelector('article .entry-content');
    if (!runko) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('script, style, noscript, iframe, form, img, .sharedaddy, .jp-relatedposts, .wp-block-spacer, .convertkit-form, .wp-block-buttons, [id*="social" i], [id*="share" i], [class*="share" i], #fb-root')
      .forEach(x => x.remove());
    // Viitepallojen käyttöohje yläindeksinä (<sup>← open these</sup>): Luinissa viitteet ovat reunushuomioita.
    el.querySelectorAll('sup').forEach(x => { if (/[←→]|open these|click (on )?(the|these)/i.test(x.textContent)) x.remove(); });
    // Viitteet ovat runkoon kuuluvissa div.footnotes- ja div.footnotes2-luetteloissa.
    const maar = samanSivunViitteet(el, 'wbw');
    el.querySelectorAll('.footnotes, .footnotes2').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
    // Sisällysluettelo (Neuralink: Contents ja #part-linkit).
    el.querySelectorAll('p, li, ul, ol').forEach(b => {
      if (!el.contains(b)) return;
      const linkit = [...b.querySelectorAll('a[href]')];
      if (linkit.length && linkit.every(a => a.getAttribute('href').startsWith('#') && !tunnusOf(a.textContent)) &&
        linkit.reduce((n, a) => n + rivi(a.textContent).length, 0) >= 0.8 * rivi(b.textContent).length) b.remove();
    });
    // Lähteet (Sound, Fermi Paradox): lihavoitu Sources ja rivit rivinvaihdoin → otsikko ja kappale kohtaa kohden
    // (Luinin kirjallisuusluettelo syntyy kappaleista).
    el.querySelectorAll('p').forEach(p => {
      let eka = [...p.querySelectorAll('strong, b')].find(b => /^(sources|references|bibliography)\s*:?$/i.test(rivi(b.textContent)));
      if (!eka || !rivi(p.textContent).startsWith(rivi(eka.textContent)) || !p.querySelector('br')) return;
      while (eka.parentElement !== p && rivi(eka.parentElement.textContent) === rivi(eka.textContent)) eka = eka.parentElement;
      const h = document.createElement('h2'); h.textContent = rivi(eka.textContent).replace(/:$/, ''); h.dataset.lahteet = '1';
      eka.remove();
      const kpl = [[]];
      [...p.childNodes].forEach(c => c.nodeName === 'BR' ? kpl.push([]) : kpl[kpl.length - 1].push(c));
      p.replaceWith(h, ...kpl.filter(k => k.some(c => rivi(c.textContent))).map(k => { const u = document.createElement('p'); k.forEach(c => u.appendChild(c)); return u; }));
    });
    // Tilauskehotus, Patreon ja PDF-mainos pois kaikkialta.
    const mainos = x => rivi(x.textContent).length < 300 && /email list|newsletter|patreon|sign up for|^PDF:|fancy PDF|buy (a|the) PDF|PDF of this post|store\.waitbutwhy\.com|gum\.co\//i
      .test(rivi(x.textContent) + ' ' + [...x.querySelectorAll('a[href]')].map(a => a.href).join(' '));
    // Viitemerkillinen kappale jää (Your Life in Weeks: kaupan linkkinä oleva kuva ja sen alla Sources: 1 2 3 4 5).
    el.querySelectorAll('p').forEach(p => { if (mainos(p) && !p.textContent.includes('XLUINVIITE')) p.remove(); });
    // Lopun Related posts -luettelot: otsikkomainen kappale (… Wait But Why posts, More things to reflect on) ja sen perään
    // pelkät linkkikappaleet; vain tekstin loppupuolella, jottei kirjoituksen sisältö katoa.
    const linkkiKpl = x => { const a = x.querySelector('a[href]'); return !!a && rivi(x.textContent).startsWith(rivi(a.textContent).slice(0, 20)) && rivi(x.textContent).length < 300; };
    const kokoPit = rivi(el.textContent).length;
    let kertyma = 0;
    [...el.children].forEach(x => {
      kertyma += rivi(x.textContent).length;
      if (!el.contains(x) || kertyma < 0.6 * kokoPit || rivi(x.textContent).length > 120 || linkkiKpl(x)) return;
      if (!/(wait but why|\bposts?\b|reflect on|you might|if you lik|explainers|mind-benders|more from|more ways)/i.test(x.textContent)) return;
      const pois = [];
      // Luettelon kohta alkaa linkillä tai on lyhyt maininta toisesta kirjoituksesta (Or for something totally different …).
      const kohta = n => linkkiKpl(n) || !rivi(n.textContent) || rivi(n.textContent).length < 250 &&
        [...n.querySelectorAll('a[href]')].some(a => /(^|\.)waitbutwhy\.com$/.test(a.hostname) || /wait but why/i.test(n.textContent));
      for (let n = x.nextElementSibling; n && kohta(n); n = n.nextElementSibling) pois.push(n);
      if (!pois.some(n => rivi(n.textContent)) && x.nextElementSibling) return;
      [x, ...pois].forEach(y => y.remove());
    });
    // Kuvien lähderivit (Galaxy image: …, Source: …) pienellä kirjasimella: kuva itse on poissa.
    el.querySelectorAll('p').forEach(p => { const pt = fontPt(p); if (pt && pt < 10 && rivi(p.textContent).length < 200) p.remove(); });
    // Kuvatekstit kursiivikappaleiksi (figcaption, .wp-caption-text).
    el.querySelectorAll('figcaption, .wp-caption-text').forEach(c => {
      const t = rivi(c.textContent); const fig = c.closest('figure, .wp-caption') || c;
      if (!t) return fig.remove();
      const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); fig.replaceWith(p);
    });
    // Viivat (______) osanvaihdoksi.
    el.querySelectorAll('p').forEach(p => { if (/^_{3,}$/.test(rivi(p.textContent))) p.replaceWith(document.createElement('hr')); });
    // Isolla kirjasimella lihavoitu lyhyt kappale ilman virkkeen loppumerkkiä on väliotsikko: koko 24 pt → ##, 18 pt → ###,
    // 14 pt → ####. Varsinaiset h2–h4 pysyvät; isompi koko on ylempi taso.
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent), pt = fontPt(p);
      if (!t || t.length > 120 || /[.!?,;…]$/.test(t) && !/:$/.test(t) || p.querySelector('a[href]:not([href^="#"])')) return;
      const vahva = rivi([...p.querySelectorAll('strong, b')].map(x => x.textContent).join('')) === t;
      if (!(pt >= 14 && (vahva || pt >= 16))) return;
      const h = document.createElement(pt >= 24 ? 'h2' : pt >= 18 ? 'h3' : 'h4');
      h.textContent = t.replace(/:$/, '');
      p.replaceWith(h);
    });
    // Otsikoiden lihavointi ja tyhjät kappaleet pois; Contents-otsikko, jonka alta luettelo poistui.
    el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => h.querySelectorAll('b, strong').forEach(b => b.replaceWith(...b.childNodes)));
    [...el.querySelectorAll('p, div')].reverse().forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' ')) && !p.querySelector('hr, table')) p.remove(); });
    // Contents-otsikko, jonka alta sisällysluettelo poistui (Neuralink).
    el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      if (!/^(contents|table of contents)$/i.test(rivi(h.textContent))) return;
      let n = h.nextElementSibling;
      while (n && !/^H[1-6]$/.test(n.tagName) && !rivi(n.textContent)) n = n.nextElementSibling;
      if (!n || /^H[1-6]$/.test(n.tagName)) h.remove();
    });
    [...el.querySelectorAll('hr')].forEach(h => { const e = h.previousElementSibling, s = h.nextElementSibling; if (!e || !s || e.tagName === 'HR' || /^H[1-6]$/.test(s.tagName)) h.remove(); });
    while (el.lastElementChild && (el.lastElementChild.tagName === 'HR' || !rivi(el.lastElementChild.textContent))) el.lastElementChild.remove();
    // Lähdeotsikko kirjoituksen ylimmälle otsikkotasolle (Sound: väliotsikot ovat pienellä koolla).
    const muutTasot = [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(h => !h.dataset.lahteet).map(h => +h.tagName[1]);
    el.querySelectorAll('[data-lahteet]').forEach(h => {
      const u = document.createElement('h' + (muutTasot.length ? Math.min(...muutTasot) : 2)); u.textContent = h.textContent; h.replaceWith(u);
    });
    const kaytetyt = [...new Set([...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => +h.tagName[1]))].sort();
    if (kaytetyt.some((t, i) => t !== i + 2)) el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const u = document.createElement('h' + Math.min(6, kaytetyt.indexOf(+h.tagName[1]) + 2));
      while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u);
    });
    // Tekijä ja päiväys: schema.org-tiedot, muuten kirjoituksen ylätunniste (January 22, 2015 · By Tim Urban).
    let tekija = '', julkaistu = '';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const j = JSON.parse(s.textContent), osat = j['@graph'] || [j];
        osat.forEach(o => {
          if (/Article|BlogPosting/.test(o['@type'])) julkaistu = julkaistu || String(o.datePublished || '').slice(0, 10);
          if (o['@type'] === 'Person' && !tekija) tekija = rivi(o.name);
          if (o.author && o.author.name && !tekija) tekija = rivi(o.author.name);
        });
      } catch (e) {}
    });
    const meta = document.querySelector('article .entry-meta');
    if (!tekija && meta) tekija = (/\bBy\s+([^\n]+?)\s*$/m.exec(meta.textContent) || [])[1] || '';
    if (!julkaistu && meta) { const d = new Date(rivi((meta.querySelector('.date') || {}).textContent)); if (!isNaN(d)) julkaistu = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    return { html: irrota([el]).innerHTML, otsikko: rivi((document.querySelector('article h1, h1.entry-title') || {}).textContent),
      tekija: rivi(tekija), sivusto: WBW_NIMI, julkaistu, maar };
  }

  /* Open Encyclopedia of Cognitive Science (OECS, MIT Press; käyttäjän pyyntö 11.11.2026: psykologian SEP:n kaltainen
     hakuteos). Artikkelin runko on PubPubin ProseMirror-HTML:ää: osiot h1 ja h2, tekstiviittaukset a.citation
     (Mitchell, 2009), kuvat figure[data-node-type=image], kaavat KaTeXina. Mitattu oecs.knowledgefutures.org-sivustolla
     (Knowledge Futuresin uusi julkaisualusta, kanoninen osoite oecs.mit.edu). oecs.mit.edu on yhä PubPubissa, joka estää
     pilvikontin, joten sen rungon valitsimet (.pub-body-component) ovat todentamatta. Kirjallisuus (References, Further
     reading) kappaleiksi, viittaukset tekstiksi (md.js linkittää tekijä–vuoden luetteloon), kuvat kuvateksteiksi, taulukoille
     otsikkorivi, kaavat TeX-koodina. Tekijät, julkaisupäivä ja DOI citation_*-metatiedoista, lisenssi artikkelin License-osiosta. */
  const OECS_NIMI = 'Open Encyclopedia of Cognitive Science';
  async function oecs() {
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const lehti = meta('citation_journal_title')[0] || '';
    if (!/open encyclopedia of cognitive science/i.test(lehti) && !/^oecs\./.test(location.hostname)) return null;
    const runko = document.querySelector('.article-body > article, .article-body, .pub-body-component .editor, .pub-body-component');
    if (!runko) return null;
    const el = runko.cloneNode(true);
    // PubPubissa viitteet ovat rungon ulkopuolella (todentamatta); uudella alustalla rungon sisällä.
    if (!el.querySelector('.pub-notes')) document.querySelectorAll('.pub-notes').forEach(n => el.appendChild(n.cloneNode(true)));
    let oikeus = null;
    const lis = el.querySelector('.pub-license a[href*="creativecommons.org"]') || document.querySelector('.pub-license a[href*="creativecommons.org"], a[rel~="license"][href*="creativecommons.org"]');
    if (lis) oikeus = { teksti: rivi(lis.textContent), lahde: lis.href };
    el.querySelectorAll('script, style, noscript, svg, button, aside, nav, .pub-footer, .pub-attributions, .pub-license, astro-island').forEach(x => x.remove());
    // Kaavat: TeX koodina; yksinkertainen symboli (σ, d′) kursiivina.
    el.querySelectorAll('math-inline, math-display, .katex-display, .katex').forEach(m => {
      if (!el.contains(m)) return;
      const tex = m.querySelector('annotation[encoding="application/x-tex"]');
      const t = rivi(tex ? tex.textContent : m.textContent);
      const e = document.createElement(/^[\p{L}\p{N}′'*]+$/u.test(t) ? 'em' : 'code');
      e.textContent = t.replace(/^\{\\displaystyle\s*(.*)\}$/, '$1');
      if (/^(MATH-DISPLAY)$/.test(m.tagName) || m.classList.contains('katex-display')) { const p = document.createElement('p'); p.appendChild(e); m.replaceWith(p); } else m.replaceWith(e);
    });
    // Kuvat: kuva pois, kuvateksti (Figure 1 …) kursiivikappaleeksi.
    el.querySelectorAll('figure').forEach(f => {
      const c = f.querySelector('figcaption');
      const t = c ? [...c.querySelectorAll('strong, p')].map(x => rivi(x.textContent)).filter(Boolean) : [];
      const teksti = t.length ? t[0] + (t.length > 1 ? '. ' + t.slice(1).join(' ') : '') : rivi(f.getAttribute('data-caption') ? jasenna(f.getAttribute('data-caption')).body.textContent : '');
      if (!teksti) return f.remove();
      const p = document.createElement('p'), em = document.createElement('em'); em.textContent = teksti.replace(/\.\s*\./, '.'); p.appendChild(em); f.replaceWith(p);
    });
    // Taulukot: kuvateksti kappaleeksi taulukon edelle, ensimmäinen rivi otsikkoriviksi, solujen kappaleet auki.
    el.querySelectorAll('table').forEach(t => {
      t.querySelectorAll('td p, th p').forEach(p => p.replaceWith(...p.childNodes, ' '));
      // Kuvateksti kappaleeksi, ellei sama teksti ole jo taulukon edellä (Table 1 kirjoitettuna otsikoksi).
      const cap = t.querySelector('caption'), ct = cap && rivi(cap.textContent);
      if (cap) {
        cap.remove();
        let k = t;
        while (k.parentElement && k.parentElement !== el && k.parentElement.children.length === 1) k = k.parentElement;
        const ed = [k.previousElementSibling, k.previousElementSibling && k.previousElementSibling.previousElementSibling].filter(Boolean).map(x => rivi(x.textContent)).join(' ');
        if (ct && !ed.includes(ct)) { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = ct; t.before(p); p.appendChild(em); }
      }
      // Koko leveyden yläotsikkorivi (yksi solu) kappaleeksi taulukon edelle: GFM:n otsikkorivi on taulukon ensimmäinen rivi.
      while (t.rows.length > 1 && t.rows[0].cells.length === 1 && t.rows[1].cells.length > 1) {
        const p = document.createElement('p'); p.append(...t.rows[0].cells[0].childNodes); t.before(p); t.rows[0].remove();
      }
      if (!t.querySelector('th') && t.rows.length > 1) [...t.rows[0].cells].forEach(c => {
        const th = document.createElement('th'); while (c.firstChild) th.appendChild(c.firstChild); c.replaceWith(th);
      });
    });
    // Tekstiviittaukset (a.citation) ja ristiviittaukset (Table 2, Figure 1) tekstiksi. APA:n pilkku tekijän ja vuoden
    // välistä pois (Mitchell, 2009 → Mitchell 2009): md.js linkittää tekijä–vuoden luettelon kohtaan SEP:n muodossa.
    // Viitteen koko tieto on myös merkissä (data-unstructured-value): varaluettelo, jos sivulla ei ole References-osiota
    // (PubPubin oma sivu, todentamatta).
    const vara = new Map();
    el.querySelectorAll('a.citation, a[data-node-type="citation"]').forEach(a => {
      const k = (a.getAttribute('href') || '').split('#')[1] || a.getAttribute('data-custom-label') || '';
      const u = a.getAttribute('data-unstructured-value'), v = a.getAttribute('data-value');
      if (k && !vara.has(k) && (u || v)) vara.set(k, u ? jasenna(u).body.innerHTML : rivi(a.textContent) + '. ' + v);
      a.replaceWith(rivi(a.textContent).replace(/,\s+((?:1[5-9]\d\d|20\d\d)[a-z]?)$/, ' $1'));
    });
    if (vara.size && !el.querySelector('.pub-notes') && ![...el.querySelectorAll('h1, h2, h3')].some(h => /^references$/i.test(rivi(h.textContent)))) {
      const h = document.createElement('h1'); h.textContent = 'References'; el.appendChild(h);
      [...vara.values()].sort((x, y) => rivi(jasenna(x).body.textContent).localeCompare(rivi(jasenna(y).body.textContent)))
        .forEach(x => { const d = jasenna(x).body; const p = document.createElement('p'); p.append(...(d.querySelector('p') || d).childNodes); el.appendChild(p); });
    }
    el.querySelectorAll('a.reference, a[data-node-type="reference"]').forEach(a => a.replaceWith(...a.childNodes));
    // Alaviitteet (PubPubin footnote-solmut), jos artikkelissa on niitä.
    const maar = samanSivunViitteet(el, 'oecs');
    // Kirjallisuus: References-luettelo ja Further reading kappaleiksi; paluulinkit pois.
    el.querySelectorAll('.pub-notes').forEach(n => n.replaceWith(...n.childNodes));
    el.querySelectorAll('a.return-link').forEach(a => a.remove());
    el.querySelectorAll('.pub-note-content-component, .csl-bib-body, .csl-entry').forEach(x => {
      if (!el.contains(x)) return;
      if (x.matches('.csl-entry')) { const p = document.createElement('p'); while (x.firstChild) p.appendChild(x.firstChild); x.replaceWith(p); } else x.replaceWith(...x.childNodes);
    });
    const BIB = /^(references|further reading|bibliography|key references)$/i;
    el.querySelectorAll('h1, h2, h3').forEach(h => {
      if (!BIB.test(rivi(h.textContent))) return;
      for (let n = h.nextElementSibling; n && !/^H[1-6]$/.test(n.tagName); n = n.nextElementSibling) {
        if (!/^(UL|OL)$/.test(n.tagName)) continue;
        const kpl = [...n.children].filter(li => li.tagName === 'LI').flatMap(li => {
          const ps = [...li.querySelectorAll('p')];
          if (ps.length) return ps;
          const p = document.createElement('p'); while (li.firstChild) p.appendChild(li.firstChild); return [p];
        });
        const ens = kpl[0];
        n.replaceWith(...kpl);
        n = ens || h;
      }
    });
    el.querySelectorAll('span').forEach(s => { if (!s.attributes.length || s.closest('p, li')) s.replaceWith(...s.childNodes); });
    [...el.querySelectorAll('p, div')].reverse().forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' ')) && !p.querySelector('hr, table')) p.remove(); });
    // Otsikkotasot: PubPubin h1 on artikkelin luku → ##.
    const kaytetyt = [...new Set([...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(h => +h.tagName[1]))].sort();
    el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const u = document.createElement('h' + Math.min(6, kaytetyt.indexOf(+h.tagName[1]) + 2));
      while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u);
    });
    const tekijat = meta('citation_author');
    const pv = (/^(\d{4})[/-](\d\d)[/-](\d\d)/.exec(meta('citation_publication_date')[0] || meta('citation_date')[0] || '') || []).slice(1).join('-');
    const otsikko = meta('citation_title')[0] || rivi((document.querySelector('article header h1, h1') || {}).textContent);
    return { html: irrota([el]).innerHTML, otsikko, tekija: tekijat.length > 2 ? tekijat.join(', ').replace(/, ([^,]*)$/, ' & $1') : tekijat.join(' & '),
      sivusto: OECS_NIMI, julkaistu: pv, doi: meta('citation_doi')[0] || '', maar, oikeus };
  }

  /* Encyclopedia.com (käyttäjän pyyntö 13.11.2026: koko sivusto, psykoanalyysin vuoksi erityisesti International Dictionary
     of Psychoanalysis). Sivusto kantaa Galen ja Oxfordin hakuteoksia: aihesivulla on usein monta artikkelia eri teoksista
     (.articleWrapper, Carl Gustav Jung -sivulla 10), ja jokaisella on oma osoitteensa, jolla se on yksin (sitaattiruudun
     osoite). Leikataan yksi artikkeli: se, jossa valinta on, muuten se, joka on lukukohdalla (ruudun kolmanneksen korkeudella),
     muuten ensimmäinen. lähde on artikkelin oma osoite, teos hakuteos ja sivusto Encyclopedia.com (md.js:n kantajasivusto).
     Tekijä bylinestä (Kirsch, Thomas → Thomas Kirsch), mutta artikkelin oma allekirjoitus menee edelle, kun byline on katkennut
     (IDP: byline "Tr", allekirjoitus "David I. TrÉsan"); ilman bylineä allekirjoitukset ("Jolande Jacobi", "Alasdair MacIntyre
     (1967)", "[p. nolan]"; IESS:n neliosaisessa Psychoanalysis-artikkelissa neljä). Julkaisupäivää ei ole: "updated 2018" on sivuston päiväys, ei teoksen. Sivuston sisäiset
     linkit (a.interlinked, data-topic, data-article) tekstiksi kuten Wikipedian wikilinkit; artikkelin oma sisällysluettelo
     (IESS: kappaleita, joissa vain #-linkki) ja otsikon toisto pois. Mitattu 13.11.2026 seitsemältä sivulta. */
  const ENC_NIMI = 'Encyclopedia.com';
  function encNimi(s) {
    s = rivi(s).replace(/^\[|\]$/g, '').replace(/\s*\((?:1[5-9]|20)\d\d\)$/, '').replace(/\s+\./g, '.');
    const k = /^([^,]+),\s*(.+)$/.exec(s);
    if (k) s = k[2] + ' ' + k[1];
    // Versaalit tai gemenat (EVANS, R. I.; [p. nolan]) sanan alkukirjaimin; sekamuoto sellaisenaan.
    if (s === s.toUpperCase() || s === s.toLowerCase()) s = s.toLowerCase().replace(/(^|[\s.'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
    return s;
  }
  const ENC_ALLEKIRJOITUS = /^\[?(?:(?:\p{Lu}\.|\p{L}[\p{L}'’-]*\.?|de|van|von|der|la|du)\s+){1,4}\p{L}[\p{L}'’-]*\]?(?:\s+\((?:1[5-9]|20)\d\d\))?$/u;
  async function encyclopediaCom() {
    if (!/(^|\.)encyclopedia\.com$/.test(location.hostname)) return null;
    const artikkelit = [...document.querySelectorAll('.articleWrapper')].filter(w => w.querySelector('.doccontentwrapper'));
    if (!artikkelit.length) return null;
    const s = window.getSelection(), valittu = s && s.rangeCount && !s.isCollapsed && s.anchorNode;
    const korkeus = innerHeight / 3;
    const w = valittu && artikkelit.find(a => a.contains(valittu)) ||
      artikkelit.find(a => { const r = a.getBoundingClientRect(); return r.height && r.top <= korkeus && r.bottom > korkeus; }) ||
      artikkelit.find(a => { const r = a.getBoundingClientRect(); return r.height && r.top > korkeus; }) || artikkelit[0];
    const el = w.querySelector('.doccontentwrapper').cloneNode(true);
    el.querySelectorAll('script, style, noscript, iframe, ins, .article-content-ad').forEach(x => x.remove());
    const by = [...w.querySelectorAll('.bylinecontainer > span')].map(x => rivi(x.textContent));
    const teos = by[0] || '';
    const otsikko = rivi((w.querySelector('h1.doctitle') || {}).textContent) || rivi((el.querySelector('h1') || {}).textContent);
    // Otsikon toisto rungon alussa (JUNG, CARL GUSTAV (1875-1961); IESS 2008: Freud, Sigmund <em>1856-1939</em>).
    const h1 = el.querySelector('h1'), tiivis = t => rivi(t).replace(/\s/g, '').toLowerCase();
    if (h1 && otsikko && tiivis(h1.textContent).startsWith(tiivis(otsikko))) h1.remove();
    el.querySelectorAll('h1').forEach(h => { const u = document.createElement('h2'); while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u); });
    // Artikkelin oma sisällysluettelo: kappale, jossa on vain linkki saman artikkelin ankkuriin.
    el.querySelectorAll('p').forEach(p => {
      const a = p.querySelectorAll('a'), h = a.length === 1 && a[0].getAttribute('href') || '';
      if (/^#./.test(h) && rivi(p.textContent) === rivi(a[0].textContent) && el.querySelector('[id="' + CSS.escape(h.slice(1)) + '"], a[name="' + CSS.escape(h.slice(1)) + '"]')) p.remove();
    });
    el.querySelectorAll('a').forEach(a => {
      let sisainen = !a.getAttribute('href') || a.classList.contains('interlinked') || a.hasAttribute('data-topic') || a.hasAttribute('data-article');
      try { sisainen = sisainen || /^#/.test(a.getAttribute('href')) || /(^|\.)encyclopedia\.com$/.test(new URL(a.getAttribute('href'), osoite).hostname); } catch (e) {}
      if (sisainen) a.replaceWith(...a.childNodes);
    });
    // Lucida Sans Unicode -kääreet (Burgh<span>ö</span>lzli) pois, jotta teksti ei katkea.
    el.querySelectorAll('span').forEach(x => x.replaceWith(...x.childNodes));
    el.normalize();
    [...el.querySelectorAll('p, div')].reverse().forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' ')) && !p.querySelector('hr, table')) p.remove(); });
    const kaytetyt = [...new Set([...el.querySelectorAll('h2, h3, h4, h5, h6')].map(h => +h.tagName[1]))].sort();
    el.querySelectorAll('h2, h3, h4, h5, h6').forEach(h => {
      const u = document.createElement('h' + Math.min(6, kaytetyt.indexOf(+h.tagName[1]) + 2));
      while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u);
    });
    const allek = [...el.querySelectorAll(':scope > p')].map(p => rivi(p.textContent))
      .filter(t => t.length <= 60 && ENC_ALLEKIRJOITUS.test(t) && !/^(see also|bibliography|works|further)/i.test(t)).map(encNimi);
    const bt = by[1] ? encNimi(by[1]) : '';
    const sukunimi = by[1] ? rivi(by[1].split(',')[0]).toLowerCase() : '';
    let tekija = bt;
    const ehja = sukunimi && allek.find(a => a.toLowerCase().includes(sukunimi) && a.length > bt.length);
    if (ehja) tekija = ehja;
    else if (!bt && allek.length) { const k = [...new Set(allek)]; tekija = k.length > 2 ? k.join(', ').replace(/, ([^,]*)$/, ' & $1') : k.join(' & '); }
    // Artikkelin oma osoite sitaattiruudun otsikkolinkistä (href päättyy rivinvaihtoon, jonka URL-jäsennys poistaa).
    let lahde = osoite;
    const ca = w.querySelector('.citation-container .cittext a[href]');
    try { if (ca) { const u = new URL(ca.getAttribute('href').trim(), location.origin); if (u.pathname.length > 1) lahde = u.origin + u.pathname; } } catch (e) {}
    return { html: irrota([el]).innerHTML, otsikko, tekija, teos, sivusto: ENC_NIMI, lahde,
      naytto: [ENC_NIMI, teos].filter(Boolean).join(' · ') + (artikkelit.length > 1 ? ' (' + (artikkelit.indexOf(w) + 1) + '/' + artikkelit.length + ')' : '') };
  }

  /* St Andrews Encyclopaedia of Theology (SAET; käyttäjän pyyntö 14.11.2026: hyvin pitkät, vertaisarvioidut artikkelit
     kristinuskosta, buddhalaisuudesta, islamista, hindulaisuudesta ja juutalaisuudesta, 8 000–17 000 sanaa). Readability
     ottaisi sisällysluettelon, sitaattiruudun ja avainsanat. Runko: tiivistelmä (#abstract ilman otsikkoa ja tekijää)
     johdannoksi kuten SEP:n preamble, luvut h2[id^=section]-otsikoiden lohkoista (alaluvut h3, h4 sisäkkäisinä div:eina),
     sitten #bibliography_div. Otsikon numero span.heading_label (1 → 1., 2.1 ennallaan). Tekstiviittaukset ovat jo SEP:n
     muotoa (span.bibref > span.citation: Moriya 1995) ja tekstiksi; ristiviittaus a.citation[href^="#section"] jää
     linkiksi. Kirjallisuus on sisäkkäinen luettelo (li > h3 Further reading / Works cited + ul): alaotsikot ja kohdat
     kappaleiksi, cite kursiiviksi. #attrib: Copyright-rivi ja CC-linkki etukenttään, muut kappaleet (lähdepainos,
     käännökset) Attributions-osioksi ennen kirjallisuutta. Mitattu 14.11.2026. */
  const SAET_NIMI = 'St Andrews Encyclopaedia of Theology';
  async function saet() {
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    if (!/st andrews encyclopaedia of theology/i.test(meta('citation_journal_title')[0] || '') && !/(^|\.)saet\.ac\.uk$/.test(location.hostname)) return null;
    const luvut = [...document.querySelectorAll('h2[id^="section"]')].map(h => h.parentElement)
      .filter((x, i, kaikki) => x && kaikki.indexOf(x) === i && !kaikki.some(y => y !== x && y.contains(x)));
    if (!luvut.length) return null;
    const el = document.createElement('div');
    const tiiv = document.getElementById('abstract');
    if (tiiv) {
      const k = tiiv.cloneNode(true);
      k.querySelectorAll('h1, #author').forEach(x => x.remove());
      el.append(...k.childNodes);
    }
    luvut.forEach(l => el.appendChild(l.cloneNode(true)));
    let oikeus = null;
    const attr = document.getElementById('attrib');
    if (attr) {
      const ps = [...attr.querySelectorAll('p')];
      const cp = ps.find(p => /copyright/i.test(p.textContent)), cc = cp && cp.querySelector('a[href*="creativecommons.org"]');
      if (cp) oikeus = { teksti: rivi(cp.textContent), lahde: cc ? cc.href : osoite };
      const muut = ps.filter(p => p !== cp && rivi(p.textContent));
      if (muut.length) { const h = document.createElement('h2'); h.textContent = 'Attributions'; el.append(h, ...muut.map(p => p.cloneNode(true))); }
    }
    const bib = document.getElementById('bibliography_div');
    if (bib) {
      const k = bib.cloneNode(true);
      // li > h3 + ul → h3 ja kappaleet; ilman alaotsikkoa suoraan kappaleiksi.
      const kohdat = ul => [...ul.children].filter(li => li.tagName === 'LI').flatMap(li => {
        const sis = li.querySelector(':scope > ul'), ots = li.querySelector(':scope > h3, :scope > h4');
        if (sis) return [...(ots ? [ots] : []), ...kohdat(sis)];
        const p = document.createElement('p'); while (li.firstChild) p.appendChild(li.firstChild); return [p];
      });
      k.querySelectorAll(':scope > ul').forEach(ul => ul.replaceWith(...kohdat(ul)));
      el.append(...k.childNodes);
    }
    el.querySelectorAll('script, style, noscript, button, nav, .modal, #toc, #keywords').forEach(x => x.remove());
    el.querySelectorAll('span.heading_label').forEach(s => s.replaceWith(rivi(s.textContent).replace(/^(\d+)$/, '$1.')));
    el.querySelectorAll('span.bibref, span.citation').forEach(s => s.replaceWith(...s.childNodes));
    el.querySelectorAll('cite').forEach(c => { const e = document.createElement('em'); while (c.firstChild) e.appendChild(c.firstChild); c.replaceWith(e); });
    el.querySelectorAll('img').forEach(x => x.remove());
    el.querySelectorAll('div').forEach(d => d.replaceWith(...d.childNodes));
    el.normalize();
    const tekijat = meta('citation_author');
    const pv = (/^(\d{4})[/-](\d\d)[/-](\d\d)/.exec(meta('citation_publication_date')[0] || meta('DC.issued')[0] || '') || []).slice(1).join('-');
    const otsikko = meta('citation_title')[0] || rivi(((tiiv && tiiv.querySelector('h1')) || document.querySelector('h1') || {}).textContent);
    return { html: irrota([el]).innerHTML, otsikko, tekija: tekijat.length > 2 ? tekijat.join(', ').replace(/, ([^,]*)$/, ' & $1') : tekijat.join(' & '),
      sivusto: SAET_NIMI, julkaistu: pv, lahde: osoite.split('?')[0], oikeus };
  }

  /* Project Gutenberg (käyttäjän pyyntö 14.11.2026: alkuteokset). Kirjojen HTML on tehty käsin, ja rakenne vaihtelee
     kirjasta toiseen; yhteistä on Ebookmakerin kehys: sisältö on #pg-start-separatorin ja #pg-end-separatorin välissä
     (lisenssiteksti ja otsake jäävät pois) ja metatiedot Dublin Corea (dc.title, dc.creator, marcrel.trl, dc.language,
     dc.rights). Sivunumerot pois: DP:n span.pagenum ja TEI:n span.tei-pb. Sisällysluettelo pois (Luinissa on Sisälmys):
     lohko, jonka teksti on lähes kokonaan linkkejä otsikoihin (sivunumerot ja numerointi eivät laske), sekä TEI:n
     .tei-index-toc; muut linkit otsikoihin tekstiksi. Alaviitteet samanSivunViitteet():llä: DP:n a.fnanchor → div.footnote,
     vanhojen kirjojen p.footnote ja TEI:n dt/dd-parit (dt:n numero, dd:n teksti) kappaleiksi ensin. Kirjan nimi rungon h1:nä
     pois (tulee #-riviksi). Tekijä dc.creatorista käänteisestä muodosta (Kant, Immanuel, 1724-1804 → Immanuel Kant), kääntäjä
     marcrel.trl:stä (suomenkielisessä kirjassa nimi, muuten Kääntänyt …), julkaisuvuotta ei: dcterms.created on Gutenbergin
     julkaisu. lähde on kirjan sivu /ebooks/<n>. Mitattu 14.11.2026. */
  const PG_NIMI = 'Project Gutenberg';
  const PG_ARVO = /^(Saint|St\.|Emperor|Empress|King|Queen|Pope|Sir|Lord|Lady|Baron|Baroness|Count|Countess|Duke|Prince|Princess|Bishop|Archbishop|Cardinal|Graf|Freiherr|Rev\.|Mrs?\.|Dr\.)(\s|$)/i;
  function pgNimi(s) {
    // Päiväykset (1724-1804, 428? BCE-348? BCE, active 1st century) ja koko nimi sulkeissa ((John Miller Dow)) pois.
    const osat = rivi(s).replace(/\s*\([^)]*\)/g, '').split(/\s*,\s*/).filter(o => o && !/\d/.test(o) && !/^(active|approximately|ca\.|fl\.)\s/i.test(o));
    if (osat.length < 2) return osat[0] || '';
    let etu = '', pera = '';
    for (const o of osat.slice(1)) {
      if (/^\p{Ll}/u.test(o)) pera += ' ' + o;
      else if (!PG_ARVO.test(o) && !etu) etu = o;
    }
    return rivi(etu + ' ' + osat[0] + pera);
  }
  const pgLuettelo = nimet => nimet.length > 2 ? nimet.slice(0, -1).join(', ') + ' & ' + nimet[nimet.length - 1] : nimet.join(' & ');
  async function gutenberg() {
    const alku = document.getElementById('pg-start-separator'), loppu = document.getElementById('pg-end-separator');
    if (!alku || !loppu || !(alku.compareDocumentPosition(loppu) & Node.DOCUMENT_POSITION_FOLLOWING)) return null;
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const alue = document.createRange();
    alue.setStartAfter(alku); alue.setEndBefore(loppu);
    const el = document.createElement('div');
    el.appendChild(alue.cloneContents());
    el.querySelectorAll('script, style, noscript, .tei-index-toc').forEach(x => x.remove());
    // Sivunumerot: niiden ankkureihin osoittavat linkit (hakemisto, sisällysluettelon sivunumerot) tekstiksi.
    const sivuIdt = new Set();
    el.querySelectorAll('span.pagenum, .tei-pb, span.pageno, span.page-num').forEach(x => {
      if (x.id) sivuIdt.add(x.id);
      x.querySelectorAll('[id], a[name]').forEach(a => sivuIdt.add(a.id || a.getAttribute('name')));
      x.remove();
    });
    const kohde = id => { try { return el.querySelector('[id="' + CSS.escape(id) + '"], a[name="' + CSS.escape(id) + '"]'); } catch (e) { return null; } };
    const kieli = (meta('dc.language')[0] || '').toLowerCase();
    let tekijat = meta('dc.creator');
    if (!tekijat.length) tekijat = meta('marcrel.aut');
    if (!tekijat.length) tekijat = meta('marcrel.com');
    const otsikko = meta('dc.title')[0] || rivi(document.title);
    // Kirjan nimi rungon h1:nä (Kalevala<br>[1849 edition] ym.).
    const h1 = el.querySelector('h1'), tiivis = t => rivi(t).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (h1 && tiivis(otsikko) && tiivis(h1.textContent).startsWith(tiivis(otsikko).slice(0, 20))) h1.remove();
    const OTS = 'h1, h2, h3, h4, h5, h6';
    // Linkki otsikkoon: kohde on otsikko tai sen sisällä, sisältää otsikon tai on (tyhjä ankkuri) heti otsikon edellä.
    const otsikkoon = a => {
      const id = (a.getAttribute('href') || '').slice(1);
      if (!id) return false;
      let k = kohde(decodeURIComponent(id));
      if (!k) return false;
      if (k.closest(OTS) || k.querySelector(OTS)) return true;
      for (let i = 0; i < 3 && k && !rivi(k.textContent); i++) {
        const s = k.nextElementSibling || (k.parentElement && k.parentElement !== el ? k.parentElement.nextElementSibling : null);
        if (s && (s.matches(OTS) || (s.firstElementChild && s.firstElementChild.matches(OTS)))) return true;
        k = s;
      }
      return false;
    };
    const sisalto = new Set([...el.querySelectorAll('a[href^="#"]')].filter(otsikkoon));
    const pois = new Set();
    sisalto.forEach(a => {
      const lohko = a.closest('p, li, tr, dd, dt, td, div');
      if (!lohko || lohko === el || pois.has(lohko)) return;
      const linkit = [...lohko.querySelectorAll('a[href^="#"]')].filter(x => sisalto.has(x)).map(x => rivi(x.textContent)).join('');
      const muu = rivi(lohko.textContent).replace(/[\s\d.,:;–—\-()[\]]|\b[IVXLCDM]+\b/g, '');
      const kaikki = rivi(lohko.textContent).replace(/[\s\d.,:;–—\-()[\]]|\b[IVXLCDM]+\b/g, '');
      const linkkeja = linkit.replace(/[\s\d.,:;–—\-()[\]]|\b[IVXLCDM]+\b/g, '').length;
      if (kaikki.length && (linkkeja >= kaikki.length * 0.6 || muu.length - linkkeja <= 3)) pois.add(lohko.closest('tr') || lohko);
    });
    // Sisällysluettelo, jonka linkit vievät sivunumeroihin (DP: Critique of Judgement) tai jonka kohteet puuttuvat: taulukko,
    // jonka riveistä vähintään puolet on tällaisia, ja vähintään kolmen lyhyen linkkirivin jakso (p.toc).
    const sisaLinkki = a => { const id = (a.getAttribute('href') || '').slice(1); return sisalto.has(a) || sivuIdt.has(id) || !kohde(id); };
    el.querySelectorAll('table').forEach(t => {
      const rivit = [...t.rows].filter(r => rivi(r.textContent));
      const toc = rivit.filter(r => [...r.querySelectorAll('a[href^="#"]')].some(sisaLinkki)).length;
      if (rivit.length && (toc >= Math.max(2, rivit.length / 2) || /^(contents|table of contents|index|sisällys)/i.test(t.getAttribute('data-summary') || t.getAttribute('summary') || ''))) pois.add(t);
    });
    const linkkirivi = x => x && /^(P|LI|DIV)$/.test(x.tagName) && rivi(x.textContent).replace(/[\s\d.,:;–—\-()[\]]/g, '').length <= 100 &&
      [...x.querySelectorAll('a[href^="#"]')].some(sisaLinkki);
    let jakso = [];
    const paata = () => { if (jakso.length >= 3) jakso.forEach(x => pois.add(x)); jakso = []; };
    el.querySelectorAll('p, li, div').forEach(x => {
      if (!linkkirivi(x)) return;
      const ed = jakso[jakso.length - 1];
      let v = ed && ed.nextElementSibling;
      while (v && v !== x && !rivi(v.textContent)) v = v.nextElementSibling;
      if (ed && v !== x) paata();
      jakso.push(x);
    });
    paata();
    pois.forEach(x => x.remove());
    el.querySelectorAll('a[href^="#"]').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      if (sisalto.has(a) || sivuIdt.has(id)) a.replaceWith(...a.childNodes);
    });
    // Tyhjiksi jääneet taulukot ja luettelot sekä niitä edeltänyt Contents-otsikko.
    [...el.querySelectorAll('table, ul, ol, div')].reverse().forEach(x => { if (!rivi(x.textContent) && !x.querySelector('hr')) x.remove(); });
    el.querySelectorAll(OTS).forEach(h => {
      if (!/^(table of )?contents\.?$|^sisällys(luettelo)?\.?$|^inhalt(sverzeichnis)?\.?$|^table des matières\.?$/i.test(rivi(h.textContent))) return;
      let s = h.nextElementSibling;
      while (s && !rivi(s.textContent) && !s.matches(OTS)) s = s.nextElementSibling;
      if (!s || s.matches(OTS)) h.remove();
    });
    // TEI:n viitteet dt/dd-pareina: <dt><a id="note_1">1.</a></dt><dd><p>…</p></dd> → <div><p><a id="note_1">1.</a> …</p></div>.
    el.querySelectorAll('dt').forEach(dt => {
      const dd = dt.nextElementSibling, a = dt.querySelector('a[id], a[name]');
      if (!dd || dd.tagName !== 'DD' || !a || !tunnusOf(dt.textContent)) return;
      const d = document.createElement('div');
      d.className = 'pg-viite';
      const ps = [...dd.children].filter(x => x.tagName === 'P');
      if (ps.length) { ps.forEach(p => d.appendChild(p)); }
      else { const p = document.createElement('p'); while (dd.firstChild) p.appendChild(dd.firstChild); d.appendChild(p); }
      const ens = d.firstElementChild;
      ens.insertBefore(document.createTextNode(' '), ens.firstChild);
      ens.insertBefore(a, ens.firstChild);
      dt.replaceWith(d); dd.remove();
    });
    el.querySelectorAll('dl').forEach(dl => { if (!dl.querySelector('dt, dd')) dl.replaceWith(...dl.childNodes); });
    // Jatkokappale vain samasta viitelaatikosta: vanhoissa kirjoissa p.footnote on heti kappaleensa perässä, ja sitä seuraava
    // leipäteksti valui viitteeseen (Kantin Critique of Pure Reason: 47 000 sanaa).
    const laatikko = x => x.parentElement && x.parentElement.matches('.footnote, .footnotes, .pg-viite, .tei-list-footnotes, .notes');
    const maar = samanSivunViitteet(el, 'pg', (l, n) => n.tagName === l.tagName && (l.className ? n.className === l.className && !/^(|tei tei-p)$/.test(l.className) : laatikko(l) && n.parentElement === l.parentElement));
    // Viitemerkki <pre>-kaaviossa (Kantin paralogismien taulu): md.js ei lue alaviitteitä koodilohkosta, joten merkit kaavion perään.
    el.querySelectorAll('pre').forEach(pre => {
      const merkit = pre.textContent.match(MERKKI);
      if (!merkit) return;
      const w = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
      for (let t; (t = w.nextNode());) t.nodeValue = t.nodeValue.replace(MERKKI, '');
      const p = document.createElement('p'); p.textContent = merkit.join(''); pre.after(p);
    });
    // Linkittömät viitteet (Spinozan Ethics): tekstissä [1], perässä <p class="footnote">[1] "Affectiones"</p>. Merkki haetaan
    // viitettä edeltävistä enintään kuudesta lohkosta (viimeinen osuma), otsikko katkaisee haun.
    let pgt = 0;
    el.querySelectorAll('p.footnote, div.footnote > p, p.note').forEach(p => {
      const m = /^\s*(\[(\d{1,3}|\*{1,3}|[†‡])\])\s*/.exec(p.textContent);
      if (!m || !el.contains(p) || p.querySelector('a[href^="#"]')) return;
      let osuma = null;
      for (let e = p.previousElementSibling, i = 0; e && i < 6 && !osuma; e = e.previousElementSibling, i++) {
        if (e.matches(OTS)) break;
        if (e.matches('.footnote, .note')) continue;
        const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        for (let t; (t = w.nextNode());) if (t.nodeValue.includes(m[1])) osuma = t;
      }
      if (!osuma) return;
      const tunnus = 'pgt' + (++pgt);
      const k = osuma.nodeValue.lastIndexOf(m[1]);
      const loput = osuma.splitText(k);
      loput.nodeValue = loput.nodeValue.slice(m[1].length);
      loput.before(merkki(tunnus));
      const kopio = p.cloneNode(true);
      const w = document.createTreeWalker(kopio, NodeFilter.SHOW_TEXT);
      for (let t, poistettu = false; !poistettu && (t = w.nextNode());) {
        const i = t.nodeValue.indexOf(m[1]);
        if (i >= 0) { t.nodeValue = t.nodeValue.slice(i + m[1].length).replace(/^\s+/, ''); poistettu = true; }
      }
      const teksti = muunna(kopio.innerHTML, 'inlined').trim();
      if (teksti) maar.push(maaritelma(tunnus, teksti));
      p.remove();
    });
    // Yhdistettyjä soluja sisältävä taulukko jäisi Markdownissa HTML:ksi: rivit kappaleiksi, solut ' · ':llä.
    el.querySelectorAll('table').forEach(t => {
      if (!t.querySelector('[colspan], [rowspan]')) return;
      const kpl = [...t.rows].map(r => [...r.cells].map(c => rivi(c.textContent)).filter(Boolean)).filter(r => r.length).map(r => {
        const p = document.createElement('p'); p.textContent = r.join(' · '); return p;
      });
      t.replaceWith(...kpl);
    });
    // Nimiösivun otsikot (By Immanuel Kant, Translated by …, 1788, ALEKSIS KIVI) kappaleiksi: ensimmäinen varsinainen otsikko on
    // ensimmäinen, joka ei ole nimiörivi ja jota seuraa vähintään 40 sanaa ennen seuraavaa otsikkoa. Sitä edeltävistä
    // sisällys- ja kirjan nimen otsikot pois, muut kappaleiksi.
    const SISALLYS = /^(table of )?contents\.?$|^books\.?$|^chapters\.?$|^index\.?$|^sisällys(luettelo)?\.?$|^inhalt(sverzeichnis)?\.?$|^table des matières\.?$/i;
    const nimet = tekijat.map(pgNimi).filter(Boolean).map(tiivis);
    const nimiorivi = t => /^(by|kirj\.?|kirjoittanut|translated|transl\.|suomentanut|suomennos|übersetzt|von|par|edited)(?![\p{L}])/iu.test(t) ||
      /^\d{3,4}\.?$/.test(t) || SISALLYS.test(t) || (tiivis(t) && (tiivis(otsikko).startsWith(tiivis(t)) || nimet.some(n => n && tiivis(t).startsWith(n))));
    const otsikot = [...el.querySelectorAll(OTS)];
    const sanojaPerassa = h => {
      let n = 0;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      w.currentNode = h;
      for (let x = w.nextNode(); x && n < 40; x = w.nextNode()) {
        if (x.nodeType === 1 && x.matches(OTS)) break;
        if (x.nodeType === 3 && !(x.parentElement && x.parentElement.closest(OTS))) n += (x.nodeValue.match(/\S+/g) || []).length;
      }
      return n;
    };
    const ensimmainen = otsikot.findIndex(h => !nimiorivi(rivi(h.textContent)) && sanojaPerassa(h) >= 40);
    // Ilman varsinaista otsikkoa (Kalevala: runot eivät ole otsikoita) vain nimiörivit.
    (ensimmainen < 0 ? otsikot.filter(h => nimiorivi(rivi(h.textContent))) : otsikot.slice(0, ensimmainen)).forEach(h => {
      const t = rivi(h.textContent);
      if (SISALLYS.test(t) || tiivis(t) === tiivis(otsikko)) return h.remove();
      const p = document.createElement('p'); while (h.firstChild) p.appendChild(h.firstChild); h.replaceWith(p);
    });
    // Nimiön ja sisällyksen jäänteet ennen ensimmäistä varsinaista otsikkoa: CONTENTS-kappale ja pelkät rivinvaihdot.
    const raja = ensimmainen >= 0 ? otsikot[ensimmainen] : null;
    el.querySelectorAll('p').forEach(p => {
      if (raja && !(p.compareDocumentPosition(raja) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      if (SISALLYS.test(rivi(p.textContent))) p.remove();
    });
    [...el.querySelectorAll('p, div')].reverse().forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' ')) && !p.querySelector('hr, table, img')) p.remove(); });
    // Peräkkäiset viivat (poistetun nimiön tai sisällyksen molemmin puolin) yhdeksi.
    el.querySelectorAll('hr').forEach(hr => {
      let e = hr.previousElementSibling;
      while (e && !rivi(e.textContent) && e.tagName !== 'HR' && !e.querySelector('hr, img, table')) e = e.previousElementSibling;
      if (e && e.tagName === 'HR') hr.remove();
    });
    const kaytetyt = [...new Set([...el.querySelectorAll(OTS)].map(h => +h.tagName[1]))].sort();
    el.querySelectorAll(OTS).forEach(h => {
      const u = document.createElement('h' + Math.min(4, kaytetyt.indexOf(+h.tagName[1]) + 2));
      while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u);
    });
    const kaantajat = meta('marcrel.trl').map(pgNimi).filter(Boolean);
    const suomentaja = !kaantajat.length ? '' : kieli === 'fi' ? pgLuettelo(kaantajat).replace(/ & ([^&]*)$/, ' ja $1')
      : (kaantajat.length > 1 ? 'Kääntäneet ' : 'Kääntänyt ') + pgLuettelo(kaantajat).replace(/ & ([^&]*)$/, ' ja $1');
    const nro = /(?:\/ebooks\/|\/cache\/epub\/|\/files\/)(\d+)/.exec(location.pathname + ' ' + (meta('dcterms.source')[0] || '')) ;
    const lahde = nro && /(^|\.)gutenberg\.org$/.test(location.hostname) ? 'https://www.gutenberg.org/ebooks/' + nro[1] : osoite;
    const oik = meta('dc.rights')[0];
    return { html: irrota([el]).innerHTML, otsikko, tekija: pgLuettelo(tekijat.map(pgNimi).filter(Boolean)), suomentaja,
      sivusto: PG_NIMI, lahde, maar, oikeus: oik ? { teksti: oik, lahde: 'https://www.gutenberg.org/policy/license.html' } : null };
  }

  /* IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis (IRED; käyttäjän pyyntö 13.11.2026). Hakuteos on vain
     FlippingBook-kirjana (englanniksi online.flippingbook.com/view/544664, 1258 sivua, 21 hakusanaa), lataus estetty, lisenssi
     CC BY-NC-ND. Katselin piirtää sivut kuvina, mutta jokaisen sivun oma osoite /view/<kirja>/<n>/ antaa hakukoneille sivun
     tekstin HTML:nä (#text-container, kappaleet p:inä). Leikataan hakusana, jolla katselija on: sisällysluettelo (sivu, jolla
     pistejonot ja sivunumerot) antaa painetut aloitussivut, osoite = painettu + numerationOffset (1). Hakusanan sivut haetaan
     samalta sivustolta. Sivun sisäinen kappalejako puuttuu lähteestä (sivu on usein yksi kappale); sivunvaihdossa jatkuva virke
     yhdistetään, tavuviivaan päättyvä ilman väliä. Otsikot ovat omia versaalikappaleitaan (II. ORIGINS OF THE CONCEPT; VII. A.
     INFANT RESEARCH alkaa joskus samassa kappaleessa tekstin kanssa) → ## / ###. REFERENCES-osion sivut ovat yksi kappale:
     pilkotaan kohdiksi tekijä–vuoden alusta. Pois: Back to Table of Contents, sivunumero, lisenssikappale (etukenttään).
     Tekijä on IPA (lisenssi vaatii nimeämään sen), julkaistu hakusanan uusimman painoksen vuosi. Mitattu 13.11.2026. */
  const IRED_NIMI = 'IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis';
  // Kirjallisuuden kohdan alku: tekijäyksiköitä (Sukunimi, I. I. tai Bion W.R.), välissä pilkku, and tai &, sitten (vuosi).
  const IRED_TEKIJA = String.raw`(?:(?:van|von|de|da|di|le|la|du|del|der)\s)?\p{Lu}[\p{L}'’-]+(?:\s\p{Lu}[\p{L}'’-]+)?,?\s(?:-?\p{Lu}\.\s?){1,4}`;
  const IRED_KOHTA = new RegExp(String.raw`(?<=[.)\d])(?<![\s,.-]\p{Lu}\.)\s+(?=${IRED_TEKIJA}(?:(?:,|;)?\s?(?:and\s|&\s)?${IRED_TEKIJA})*(?:\(Eds?\.\)\s?)?\((?:1[6-9]|20)\d\d\s?[a-z]?(?:\s*\[[^\]]*\])?\))`, 'u');
  const ired = { haku: new Map() };
  function iredSivu(u) {
    if (!ired.haku.has(u)) ired.haku.set(u, hae(u).then(d => {
      const t = d && d.getElementById('text-container');
      if (!t) return null;
      const ps = [...t.querySelectorAll(':scope > p:not(.powered-by)')].map(p => rivi(p.textContent)).filter(Boolean);
      // Kirjan viimeinen sivu navigaatiosta: sen jälkeiset osoitteet antavat 200:n ja kansisivun.
      ps.viim = +((/\/(\d+)\/?$/.exec((d.querySelector('.nav-links a.last') || {}).getAttribute ? d.querySelector('.nav-links a.last').getAttribute('href') : '') || [])[1] || 0);
      return ps;
    }));
    return ired.haku.get(u);
  }
  // Versaaliotsikko sanan alkukirjaimin: DRIVE(S) → Drive(s), (ORT) ja roomalaiset numerot ennallaan, pikkusanat pienin.
  function iredOtsikko(s) {
    const pienet = /^(of|the|and|in|on|a|an|to|for|or|as|at|by|with|from|vs)$/;
    return rivi(s).split(' ').map((w, i, k) => {
      if (/^\(?[A-Z]{2,4}\)[:,]?$/.test(w) || /^[IVX]+\.$/.test(w) || /^[A-Z]\.$/.test(w) || /^(US|UK|USA)[:,]?$/.test(w)) return w;
      const l = w.toLowerCase();
      if (i > 0 && pienet.test(l) && !/[:(]$|^[IVX]+\.$|^[A-Z]\.$/.test(k[i - 1])) return l;
      return l.replace(/(^\(?|[-/])(\p{L})/gu, (x, a, b) => a + b.toUpperCase());
    }).join(' ');
  }
  async function iredLeike() {
    if (location.hostname !== 'online.flippingbook.com' || !/IPA Inter-Regional Encyclopedic Dictionary/i.test(document.title)) return null;
    const m = /^\/view\/(\d+)\/?(\d+)?/.exec(location.pathname);
    if (!m) return null;
    const kirja = '/view/' + m[1] + '/', sivuOsoite = n => location.origin + kirja + n + '/';
    const nyt = +(m[2] || 1);
    const siirto = +((/"numerationOffset"\s*:\s*(\d+)/.exec(document.documentElement.innerHTML) || [, 1])[1]);
    // Sisällysluettelo: ensimmäisiltä sivuilta kappale, jossa on vähintään viisi pistejonoa ja sivunumeroa.
    let sis = [], viim = 0;
    for (let n = 1; n <= 6 && sis.length < 2; n++) {
      const ps = await iredSivu(sivuOsoite(n)) || [];
      viim = viim || ps.viim || 0;
      for (const p of ps) {
        const k = [...p.matchAll(/(\S[^.]*?)\s*\.{5,}\s*(\d+)/g)].map(x => ({ nimi: rivi(x[1]), alku: +x[2] + siirto }));
        if (k.length >= 5) { sis = k; break; }
      }
    }
    if (!sis.length) return null;
    sis.sort((a, b) => a.alku - b.alku);
    let i = sis.length - 1;
    while (i >= 0 && sis[i].alku > nyt) i--;
    // Kansi tai sisällysluettelo: ei hakusanaa (leike ilmoittaa, ettei sivulta löytynyt artikkelia).
    if (i < 0) return { html: '', tyhja: true, otsikko: IRED_NIMI, sivusto: IRED_NIMI };
    const alku = sis[i].alku, loppu = i + 1 < sis.length ? sis[i + 1].alku - 1 : viim || null;
    const sivut = [];
    for (let n = alku; loppu ? n <= loppu : n < alku + 300; n += 6) {
      const era = await Promise.all([0, 1, 2, 3, 4, 5].filter(k => !loppu || n + k <= loppu).map(k => iredSivu(sivuOsoite(n + k))));
      sivut.push(...era);
      if (!loppu && era.some(x => !x)) break;
    }
    // Kappaleet sivuittain; Back to Table of Contents ja sivunumero pois.
    const kpl = [];
    let jatkuu = false;
    for (const ps of sivut) {
      if (!ps) { kpl.push({ puuttuu: true }); jatkuu = false; continue; }
      const sis2 = ps.filter(p => !/^back to table of contents$/i.test(p) && !/^\d{1,4}$/.test(p));
      sis2.forEach((p, j) => {
        const ed = kpl[kpl.length - 1];
        if (j === 0 && jatkuu && ed && ed.t) {
          ed.t = /\p{L}-$/u.test(ed.t) ? ed.t + p : ed.t + ' ' + p;
        } else kpl.push({ t: p });
      });
      const viim = kpl[kpl.length - 1];
      jatkuu = !!(viim && viim.t && !/[.!?:”"’)\]]$/.test(viim.t) && !/^[A-Z0-9 .,:;’'()\-–&/]+$/.test(viim.t));
    }
    const nimi = iredOtsikko(sis[i].nimi);
    const el = document.createElement('div');
    const lisaa = (tag, teksti) => { const e = document.createElement(tag); e.textContent = teksti; el.appendChild(e); return e; };
    let lahteet = false, oikeus = null, painos = '';
    // Versaalisanoja välilyönnein (ei sisäkkäistä valinnaista välilyöntiä: pitkä versaalikappale jumitti välilehden).
    const OTS = /^((?:[IVX]+\.\s+)?(?:[A-Z]\.\s+)?[A-Z0-9(][A-Z0-9’'()\-–&/,:.]*(?:\s+[A-Z0-9(][A-Z0-9’'()\-–&/,:.]*)*)(?:\s+(?=\p{Lu}\p{Ll})|$)/u;
    // See also -luettelo on versaalinimiä peräkkäin (EGO PSYCHOLOGY ENACTMENT …): nimet sisällysluettelosta, pisin ensin.
    // Muunnelmat: TRANSFORMATION(S) myös TRANSFORMATIONS ja TRANSFORMATION, SETTING, (THE …) myös ilman pilkkua.
    // Myös lyhyet muodot, joita See also -luettelot käyttävät: CONTAINMENT, SETTING, DRIVES, FIELD THEORIES.
    const nimet = sis.flatMap(x => [x.nimi, x.nimi.replace(/[()]/g, ''), x.nimi.replace(/\s*\([^)]*\)/g, ''), x.nimi.replace(/,/g, ''),
      x.nimi.split(/[:,]/)[0], x.nimi.replace(/\(S\)$/, 'S'), x.nimi.replace(/\(S\)$/, ' (S)'), x.nimi.replace(/^PSYCHOANALYTIC\s+/, '').replace(/\s+AND CONCEPTS$/, '')]
      .map(v => ({ v: rivi(v).toUpperCase(), n: x.nimi }))).sort((a, b) => b.v.length - a.v.length);
    // Palauttaa nimet ja loput (REFERENCES Abend, S. … samassa kappaleessa).
    const katso = t => { const k = []; let r = rivi(t);
      while (r) {
        const n = nimet.find(x => r.toUpperCase().startsWith(x.v) && !/^[\p{L}]/u.test(r.slice(x.v.length)));
        // Tuntematon versaalisana (REGRESSION (coming soon)) omaksi kohdakseen.
        const u = !n && !/^REFERENCES\b/.test(r) && /^([A-ZÄÖÅ][A-ZÄÖÅ-]+(?:\s\(coming soon\))?)(?=[\s;,]|$)/.exec(r);
        if (!n && !u) break;
        k.push(n ? iredOtsikko(n.n) : iredOtsikko(u[1].replace(/\s\(coming soon\)$/, '')) + (/coming soon/.test(u[1]) ? ' (coming soon)' : ''));
        r = rivi(r.slice(n ? n.v.length : u[1].length).replace(/^[;,]/, ''));
      }
      return { k: k.join('; '), loput: r }; };
    let katsoP = null;
    kpl.forEach((k, j) => {
      if (k.puuttuu) { lisaa('p', '[Sivu ei latautunut.]'); return; }
      // Rivinvaihdon katkaisema yhdyssana (self- representation) yhteen; self- and object jää.
      let t = k.t.replace(/^([IVX]+\.)(?=[A-Z])/, '$1 ').replace(/(\p{Ll})- (?!(?:and|or|to|nor|as well)\b)(\p{Ll})/gu, '$1-$2').replace(/(\d) (st|nd|rd|th)\b/g, '$1$2').replace(/\s+([.,;:](?:\s|$))/g, '$1').replace(/\s+([.,;:])$/, '$1');
      if (j === 0) {
        // Hakusanan alku: NIMI Tri-Regional Entry First Edition 2017: Inter-Regional Editorial Board: …
        const pois = t.toUpperCase().startsWith(sis[i].nimi.toUpperCase()) ? t.slice(sis[i].nimi.length).trim() : t;
        painos = ([...pois.matchAll(/Edition[^0-9]{0,20}((?:19|20)\d\d)/gi)].map(x => x[1]).sort().pop()) || '';
        if (pois) lisaa('p', pois).dataset.tieto = '1';
        return;
      }
      if (/is licensed under Creative Commons/i.test(t)) { oikeus = { teksti: t.replace(/\s*Please click here for terms\.?$/i, ''), lahde: 'https://www.ipa.world/IPA/Encyclopedic_Dictionary' }; return; }
      if (katsoP && /^[^a-z]*$/.test(t.split(/\bREFERENCES\b/)[0]) && !/^REFERENCES/.test(t)) {
        const k = katso(t);
        const vali = () => /:\s*$/.test(katsoP.textContent) ? '' : '; ';
        if (k.k) katsoP.textContent += vali() + k.k;
        if (!k.loput || k.loput === t) { if (k.loput) katsoP.textContent += vali() + k.loput; return; }
        t = k.loput;
      }
      const o = OTS.exec(t);
      const ots = o && rivi(o[1]).replace(/[:,]$/, '');
      if (ots && ots.length >= 4 && /[A-Z]{3}/.test(ots.replace(/^[IVX]+\.\s*(?:[A-Z]\.\s*)?/, '')) && (ots === t.replace(/[:,]$/, '') || /^[IVX]+\.|^REFERENCES|^SEE ALSO/i.test(ots))) {
        const ala = /^[IVX]+\.\s*[A-Z]\.\s/.test(ots);
        lisaa(ala ? 'h3' : 'h2', iredOtsikko(ots));
        lahteet = /^(references|bibliography)/i.test(ots);
        t = rivi(t.slice(o[0].length));
        if (!t) return;
      }
      if (/^see also\b:?/i.test(t)) {
        const k = katso(t.replace(/^see also\b:?\s*/i, ''));
        katsoP = lisaa('p', 'See also: ' + k.k);
        if (!k.loput) return;
        if (!/^REFERENCES|^[IVX]+\./.test(k.loput)) { katsoP.textContent += (k.k ? '; ' : '') + k.loput; return; }
        t = k.loput;
        const o2 = OTS.exec(t), ots2 = o2 && rivi(o2[1]).replace(/[:,]$/, '');
        if (ots2) { lisaa('h2', iredOtsikko(ots2)); lahteet = /^(references|bibliography)/i.test(ots2); t = rivi(t.slice(o2[0].length)); if (!t) return; }
      } else katsoP = null;
      if (lahteet) {
        // Kohdat: tekijä(t), vuosi sulkeissa (Bion, W. R. (1962a); Bion W.R. (1959)).
        t.split(IRED_KOHTA)
          .forEach(x => { if (rivi(x)) lisaa('p', rivi(x)); });
        return;
      }
      // Alaluku kappaleen keskellä (III. Be. Thomas Ogden and Judith Mitrani Two other …): otsikkoa ei erota tekstistä
      // luotettavasti, joten alaluku aloittaa vain uuden kappaleen.
      t.split(/\s+(?=[IVX]+\.\s[A-Z][a-z]?\.\s+\p{Lu})/u).forEach(x => lisaa('p', x));
    });
    // Ensimmäinen kappale (painokset ja toimituskunta) tietoriviksi kursiivilla.
    const tieto = el.querySelector('p[data-tieto]');
    if (tieto) { tieto.removeAttribute('data-tieto'); const em = document.createElement('em'); em.textContent = tieto.textContent; tieto.textContent = ''; tieto.appendChild(em); }
    return { html: el.innerHTML, otsikko: nimi, tekija: 'International Psychoanalytical Association', sivusto: IRED_NIMI,
      julkaistu: painos, lahde: sivuOsoite(alku), oikeus,
      naytto: IRED_NIMI + ' (' + (loppu ? loppu - alku + 1 : sivut.length) + ' sivua)' };
  }

  async function valmista(html, omat = [], otsikkoMd = '') {
    const d = jasenna(html);
    // Sivun sisäinen linkki (#viite-1) sivun osoitteeksi kuten MarkDownloadissa: Latomo tekee leikkeen omalle
    // sivulle vievästä yläindeksilinkistä pelkän numeron. Readability jättää #-linkit ennalleen.
    d.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', osoite + a.getAttribute('href')));
    const maar = await viitteet(d);
    let md = muunna(d.body.innerHTML).replace(MERKKI, '[^viite-$1]');
    // Sovitteen omat alaviitteet vain, jos niiden merkki on mukana (valinta voi olla osa tekstistä).
    const kaikki = maar.concat(omat.filter(x => (md + otsikkoMd).includes('[^viite-' + /^\[\^viite-([^\]]+)\]/.exec(x)[1] + ']')));
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

  /* Tekijänoikeusmerkintä (käyttäjän pyyntö 10.11.2026): etukenttään `oikeudet:` merkintä sellaisena kuin lähde sen
     ilmaisee ja `oikeudet-lähde:` sivu, jolla se on. Vain kun tieto löytyy kohtalaisen varmasti: SEP:n artikkelin
     ©-rivi, Ensyklopedia Logoksen tekijänoikeussivun artikkeleita koskeva ehto, Wikipedian alatunnisteen lisenssi tai
     sivun lisenssilinkki (rel="license", esim. Creative Commons -merkki blogissa). Selitys ja otsikko syntyvät md.js:ssä. */
  function oikeudet() {
    const ac = document.getElementById('article-copyright');
    if (ac && document.getElementById('aueditable')) {
      const k = ac.cloneNode(true);
      k.querySelectorAll('a[href^="mailto:"], em, abbr').forEach(x => x.remove());
      const t = rivi(k.textContent).replace(/\s*<\s*>\s*$/, '').replace(/\s*<[^>]*>\s*$/, '');
      if (/copyright/i.test(t)) return { teksti: t, lahde: location.origin + '/info.html#terms' };
    }
    if (/(^|\.)filosofia\.fi$/.test(location.hostname) && /\/ensyklopedia\/[^/]+/.test(location.pathname) && document.querySelector('.node-ensyklopedia')) {
      return { teksti: 'Tekijänoikeus on alkuperäisellä tekijällä, joka on luovuttanut Filosofia.fi-portaalille luvan kertajulkaisuun. ' +
        'Muusta julkaisemisesta on sovittava tekijän kanssa.', lahde: 'https://filosofia.fi/fi/tekijanoikeudet-ja-filosofiafi' };
    }
    const wf = /(^|\.)wikipedia\.org$/.test(location.hostname) && document.getElementById('footer-info-copyright');
    if (wf) {
      const a = wf.querySelector('a[href]');
      // Ensimmäinen virke; versionumeron piste (4.0) ei lopeta sitä.
      const t = (rivi(wf.textContent).match(/^.*?\.(?=\s|$)/) || [''])[0];
      if (a && /creative commons/i.test(a.textContent)) return { teksti: t || rivi(a.textContent), lahde: a.href };
    }
    const l = document.querySelector('link[rel~="license"][href], a[rel~="license"][href]');
    if (l) {
      const u = l.href, cc = /creativecommons\.org\/(?:licenses\/([a-z-]+)\/(\d\.\d)|publicdomain\/(zero|mark))/i.exec(u);
      const t = rivi(l.textContent || l.getAttribute('title') || '');
      if (cc) return { teksti: t && /creative|cc|nimeä|attribution/i.test(t) ? t : cc[3] ? (cc[3] === 'zero' ? 'CC0 1.0' : 'Public Domain Mark') : 'CC ' + cc[1].toUpperCase() + ' ' + cc[2], lahde: u };
    }
    return null;
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
  if (!sep) for (const f of [logos, wikipedia, oecs, encyclopediaCom, saet, gutenberg, iredLeike, marxists, waitbutwhy, blogger]) {
    try { blogi = await f(); } catch (e) { blogi = null; }
    if (blogi) break;
  }
  // Sovitteen tyhjä runko (IRED:n kansi) on tyhjä leike, ei Readabilityn arvaus katselimen sivusta.
  const sisalto = sep || (blogi && blogi.html) || (blogi && blogi.tyhja ? '' : artikkeli && artikkeli.content) || '';
  const omat = (blogi && blogi.maar) || [];

  const otsikko = blogi ? blogi.otsikko || osoite
    : siisti(rivi(artikkeli && artikkeli.title || document.title), rivi(artikkeli && artikkeli.siteName)) || osoite;
  const p = new Date(), pv = n => String(n).padStart(2, '0');
  const etu = ['---'];
  const kentta = (avain, arvo) => { if (rivi(arvo)) etu.push(avain + ': ' + rivi(arvo)); };
  kentta('tekijä', blogi ? blogi.tekija : artikkeli && artikkeli.byline);
  kentta('teos', blogi && blogi.teos);
  kentta('suomentaja', blogi && blogi.suomentaja);
  kentta('sivusto', blogi ? blogi.sivusto : artikkeli && artikkeli.siteName);
  kentta('julkaistu', blogi ? blogi.julkaistu : artikkeli && artikkeli.publishedTime);
  kentta('doi', blogi && blogi.doi);
  kentta('lähde', blogi && blogi.lahde || osoite);
  let oikeus = null;
  try { oikeus = blogi && blogi.oikeus || oikeudet(); } catch (e) { oikeus = null; }
  if (oikeus) { kentta('oikeudet', oikeus.teksti); kentta('oikeudet-lähde', oikeus.lahde); }
  kentta('leikattu', p.getFullYear() + '-' + pv(p.getMonth() + 1) + '-' + pv(p.getDate()));
  // Otsikon oma viitemerkki (marxists.org: Porvarit ja proletaarit[23]) #-rivin perään.
  const otsikkoMd = blogi && blogi.otsikkoMerkit ? blogi.otsikkoMerkit.replace(MERKKI, '[^viite-$1]') : '';
  etu.push('---', '# ' + otsikko + otsikkoMd, '', '');
  const alku = etu.join('\n');

  const [koko, valinta] = await Promise.all([sisalto ? valmista(sisalto, omat, otsikkoMd) : null, valintaHtml ? valmista(valintaHtml) : null]);
  const sanoja = s => (s.match(/\S+/g) || []).length;
  return {
    otsikko, sivusto: (blogi && (blogi.naytto || blogi.sivusto || blogi.otsikko)) || rivi(artikkeli && artikkeli.siteName) || location.hostname.replace(/^www\./, ''),
    koko: koko && koko.md ? alku + koko.md + '\n' : '', kokoSanoja: koko ? sanoja(koko.md) : 0, kokoViitteita: koko ? koko.viitteita : 0,
    valinta: valinta && valinta.md ? alku + valinta.md + '\n' : '', valintaSanoja: valinta ? sanoja(valinta.md) : 0,
    valintaViitteita: valinta ? valinta.viitteita : 0
  };
})();
