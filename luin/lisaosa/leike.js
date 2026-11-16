/* Lukimeen-lisäosa: leikkuri. Ajetaan sivulla kirjastojen (Readability, Turndown, GFM) jälkeen; viimeisen lausekkeen arvo
   (lupaus) palaa ponnahdusikkunalle. IIFE, koska tiedosto ajetaan uudelleen joka kerta, kun ikkuna avataan samalla sivulla.

   Tulos noudattaa Latomon ohjeen suosittelemia MarkDownload-asetuksia (latomo-ohje.html#markdownload), jotta Latomon
   MarkDownload-tila siivoaa sen samoin: etukentässä korvamerkki leikattu:, Atx-otsikot, viiva ___, luettelo -,
   aidattu koodi, *kursiivi*, **lihavointi**, viitelinkit lopussa, kuvat pois, Markdown-merkit suojattuina,
   yläindeksit HTML:nä (Latomo muuntaa ne ^1^-muotoon). Lisäksi kaksi asiaa, joihin MarkDownload ei pysty:
   tunnettujen sivujen sisältö ilman Readabilityn karsintaa (sovite) ja toiselle sivulle viittaavat alaviitteet
   haettuina Luinin alaviitteiksi. Omat sovitteet: SEP, Blogger, Ensyklopedia Logos (filosofia.fi) ja Wikipedia
   (käyttäjän pyyntö 10.11.2026) sekä marxists.org, Wait But Why ja Open Encyclopedia of Cognitive Science (11.11.2026) sekä Encyclopedia.com ja IPA:n Inter-Regional Encyclopedic Dictionary of Psychoanalysis (13.11.2026) sekä St Andrews Encyclopaedia of Theology, Project Gutenberg, New Advent, Christian Classics Ethereal Library sekä Psyche ja Aeon (14.11.2026) sekä European Journal of Psychoanalysis (15.11.2026) sekä Open Journal Systems -lehdet, ensimmäisenä Vilnan yliopiston Problemos, LacusCurtius, Korpora.org/kant, dhammatalks.org, Wikisource, Substack, Internet Encyclopedia of Philosophy, Open Yale Courses, Notre Dame Philosophical Reviews, Il Tascabile, Doppiozero ja Bryn Mawr Classical Review (16.11.2026). */
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

  /* Wikipedia (fi ja en, käyttäjän pyyntö 10.11.2026; liettuan nimiavaruudet, ohjausrivit ja luettelot 16.11.2026). Luettavaksi siistitty: muokkauslinkit, kuvat kuvateksteineen,
     tietolaatikot, navigointi, sivupalkit ja ohjausrivit (”… redirects here”, Pääartikkeli) pois. Viitteet ovat
     alaviitteitä, samoin Wikipedian omat merkinnät (lähde?, citation needed). Ylläpito- ja tynkähuomautukset
     (”Tämä artikkeli tai sen osa on käännetty …”) ovat alaviite lähimmän kappaleen perässä, koska ne eivät ole
     leipätekstiä eivätkä lainauksia. Lähde- ja kirjallisuusluettelot kappaleiksi (md.js:n kirjallisuusluettelo).
     Wikilinkit ovat tekstissä pelkkää tekstiä. Loppuun tulevat linkkeineen vain toimittajien valitsemat artikkelit
     (Pääartikkeli- ja Katso myös -ohjausrivit, Katso myös -osio): verkkoon pääsee vain sieltä ja vain, kun Luinin
     verkkolinkit ovat päällä. Tekstin sisäinen linkki luettelon kohtaan vaatisi md.js:n muutosta (ei nyt). Tekijää ei
     ole (viite alkaa otsikolla), julkaistu on luetun version muokkauspäivä. */
  const WIKI_NIMIAVARUUS = /^(file|image|special|help|wikipedia|category|portal|template|talk|user|module|draft|mediawiki|wikt|wiktionary|tiedosto|kuva|toiminnot|ohje|luokka|teemasivu|malline|keskustelu|käyttäjä|moduuli|wikiprojekti|wikisanakirja|vaizdas|failas|specialus|pagalba|vikipedija|kategorija|portalas|šablonas|aptarimas|naudotojas|modulis|vikižodynas)(\s|_)*:/i;
  /* Wikisource (käyttäjän pyyntö 16.11.2026, pahvin A2: en, de, la, fi; sama sovite kuin Wikipediassa). Lisäksi: painetun
     lähteen sivunumerot yläindekseiksi [483] (en span.ws-pagenum[data-page-number], de span.PageNumber), otsake- ja
     tietolaatikot (.ws-header, #headertemplate, de:n #textdaten), lisenssilaatikko (ensimmäinen virke etukenttään) ja
     .ws-noexport pois. Metatiedot Wikisourcen yhteisistä tunnisteista #ws-author, #ws-title, #ws-year, #ws-publisher,
     #ws-place, #ws-translator. */
  const WS_LAATIKOT = '.ws-header, .wst-header, #headertemplate, .headertemplate, #textdaten, .licenseContainer, .wst-license, ' +
    '.ws-license, #ws-data, .wst-footer, #footertemplate, .ws-noexport, table.otsikkomalline, table.otsikkomalline-huomiot';
  function wsTiedot() {
    const t = id => rivi((document.getElementById(id) || {}).textContent);
    const lis = document.querySelector('.licenseContainer, .wst-license, .ws-license');
    const lt = lis && rivi((lis.querySelector('.licenseText, .wst-license-text, td:last-child, p') || lis).textContent);
    // fi: otsikkomalline (Kirjoittanut Juhani Aho).
    const om = document.querySelector('table.otsikkomalline');
    const omi = om && [...om.querySelectorAll('i, em')].find(x => /^\s*Kirjoittanut\s/.test(x.textContent));
    const fiTek = omi ? rivi(omi.textContent).replace(/^Kirjoittanut\s+/, '') : '';
    return { tekija: t('ws-author') || fiTek, otsikko: t('ws-title').split(/\s+[—–]\s+/)[0], vuosi: (/(1[0-9]\d\d|20\d\d)/.exec(t('ws-year')) || [])[1] || '',
      kustantaja: t('ws-publisher'), paikka: t('ws-place'), suomentaja: t('ws-translator'),
      lisenssi: lt ? (lt.match(/^.*?\.(?=\s|$)/) || [lt])[0] : '' };
  }
  function wsSivunumerot(el) {
    el.querySelectorAll('span.ws-pagenum, span.pagenum[data-page-number], span.PageNumber').forEach(x => {
      const n = rivi(x.getAttribute('data-page-number') || x.textContent).replace(/^\[\s*|\s*\]$/g, '');
      if (!n || n.length > 12) { x.remove(); return; }
      const sup = document.createElement('sup');
      sup.textContent = '[' + n + ']';
      x.replaceWith(sup);
      if (sup.nextSibling && sup.nextSibling.nodeType === 3) sup.nextSibling.nodeValue = sup.nextSibling.nodeValue.replace(/^\s*/, ' ');
    });
  }
  async function wikipedia() {
    const ws = /(^|\.)wikisource\.org$/.test(location.hostname);
    const alku = (ws || /(^|\.)wikipedia\.org$/.test(location.hostname)) && /^\/wiki\/./.test(location.pathname) &&
      document.querySelector('#mw-content-text .mw-parser-output');
    if (!alku) return null;
    const fi = /^fi\b/i.test(document.documentElement.lang || '');
    const PROJ = ws ? 'Wikisource' : 'Wikipedia', projRe = ws ? /(^|\.)wikisource\.org$/ : /(^|\.)wikipedia\.org$/;
    const wst = ws ? wsTiedot() : null;
    const el = alku.cloneNode(true);
    if (ws) {
      wsSivunumerot(el);
      el.querySelectorAll(WS_LAATIKOT).forEach(x => x.remove());
      // Mallineeton otsake ja selausrivi (la: ◄ Synopsis … | Meditatio II ►): lyhyet laatikot ennen ensimmäistä pitkää kappaletta
      // ja nuolilla merkityt selausrivit.
      const pitka = [...el.querySelectorAll('p')].find(p => rivi(p.textContent).length >= 200);
      if (pitka) [...el.querySelectorAll('div, table, center')].forEach(x => {
        if (!el.contains(x) || x.contains(pitka) || !(x.compareDocumentPosition(pitka) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
        // Viitteellinen otsikkolohko (de: Was ist Aufklärung?*) jää.
        if (rivi(x.textContent).length < 400 && !x.querySelector('sup.reference, sup.mw-ref')) x.remove();
      });
      el.querySelectorAll('div, table, center, p').forEach(x => { if (el.contains(x) && /[◄►]/.test(x.textContent) && x.querySelector('a') && rivi(x.textContent).length < 300) x.remove(); });
    }
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
      if (t && ed) ed.appendChild(merkki(lisaa('*' + (fi ? PROJ + 'n huomautus' : PROJ + ' notice') + ':* ' + t)));
    });
    // Loppuluettelon artikkelit (käyttäjän valinta 10.11.2026: kaikki wikilinkit tekivät satojen rivien luettelon, Age of
    // Enlightenment 547): vain toimittajien omat valinnat eli Pääartikkeli-, Katso myös- ja Lisätietoja-ohjausrivien
    // artikkelit esiintymisjärjestyksessä ja Katso myös -osio, joka siirtyy kokonaan luetteloon. Muut wikilinkit tekstiksi.
    const artikkelit = new Map();
    const artikkeli = a => {
      let u; try { u = new URL(a.getAttribute('href'), osoite); } catch (e) { return null; }
      const sisainen = u.hostname === location.hostname || projRe.test(u.hostname) && u.hostname.split('.')[0] === location.hostname.split('.')[0];
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
      if (/^\s*(pääartikkeli|pääartikkelit|katso myös|lisätietoja|main articles?|see also|further information|pagrindinis straipsnis|pagrindiniai straipsniai|taip pat skaitykite|taip pat žiūrėkite)(?![\p{L}\p{N}])/iu.test(h.textContent)) talteen(h);
    });
    const KATSO = /^(katso myös|see also|taip pat skaitykite|taip pat žiūrėkite)$/i;
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
      const sisainen = u.hostname === location.hostname || projRe.test(u.hostname) && u.hostname.split('.')[0] === location.hostname.split('.')[0];
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
    const BIB = /^(lähteet|lähdeteokset|kirjallisuus|kirjallisuutta|lähdekirjallisuus|aiheesta muualla kirjallisuutta|references|sources|bibliography|works cited|cited works|further reading|citations|primary sources|secondary sources|general and cited (references|sources)|selected bibliography|šaltiniai|literatūra|bibliografija)$/i;
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
      h.textContent = ws ? (fi ? 'Wikisource-sivut' : 'Wikisource pages') : fi ? 'Wikipedia-artikkelit' : 'Wikipedia articles';
      artikkelit.forEach((nimi, u) => { const li = document.createElement('li'), a = document.createElement('a'); a.href = u; a.textContent = nimi; li.appendChild(a); ul.appendChild(li); });
      el.append(h, ul);
    }
    let julkaistu = '';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try { const j = JSON.parse(s.textContent); julkaistu = julkaistu || String(j.dateModified || '').slice(0, 10); } catch (e) {}
    });
    const otsikko = rivi((document.querySelector('#firstHeading, h1') || {}).textContent);
    // Alasivu (Critique of Pure Reason (Meiklejohn)/Introduction): otsikoksi viimeinen osa, teokseksi teoksen nimi.
    const palat = otsikko.split('/'), ala = palat.length > 1;
    if (ws) return { html: el.innerHTML, otsikko: ala ? palat[palat.length - 1] : wst.otsikko || otsikko,
      teos: ala ? wst.otsikko || palat[0] : '', tekija: wst.tekija, sivusto: PROJ, julkaistu: wst.vuosi,
      kustantaja: wst.kustantaja, paikka: wst.paikka, suomentaja: wst.suomentaja ? kkKaantaja(kkNimet(wst.suomentaja)) : '',
      oikeus: wst.lisenssi ? { teksti: wst.lisenssi, lahde: osoite } : null, maar: maar.map(([t, x]) => maaritelma(t, x)) };
    return { html: el.innerHTML, otsikko, tekija: '', sivusto: 'Wikipedia', julkaistu, maar: maar.map(([t, x]) => maaritelma(t, x)) };
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

  /* Psyche ja Aeon (käyttäjän pyyntö 14.11.2026: psykoterapiaa, psykoanalyysia, Jungia ja kiintymyssuhdetta pitkinä
     esseinä; sama julkaisija Aeon Media ja sama alusta). Readability antaa tekstin, mutta nostolainaukset (p.pullquote)
     toistuvat kesken kappaleiden, osanvaihdot katoavat, oppaan (Psyche Guide) väliotsikot What to do, Learn more ja Links
     and books sekä Key points -laatikko putoavat, ja dialogin jokainen repliikki on oma lainauksensa. Runko on sivun
     .article-content-lohkot ja niiden väliset h2/h3-otsikot (opas: Key points -laatikko on h3 ja oma lohkonsa, joten se
     tulee ##-luvuksi sivun järjestyksessä). Pois: uutiskirjelaatikko (figure.ld-newsletter-block-wrapper), You may like
     -sivulaatikko (aside), kuvat, napit ja Aeonin loppuosa (.no-pagemarks: aiheet, päiväys, jakonapit). Anfangi
     (span.ld-dropcap) aloittaa osan, joten sen kappaleen eteen tulee osanvaihto (ei ensimmäiseen kappaleeseen). Peräkkäiset
     blockquotet yhdeksi lainaukseksi. Otsikko on sivun h1 (Aeonissa painettu lyhyt otsikko, esim. When hope gets in the
     way; og:title on pidempi hakukoneotsikko). Ingressi jää pois: kursiivina se olisi Luinissa alaotsikko ja lähdeviitteessä,
     ja sivuston nimi näkyy kehyksenä. Tekijän esittely (Psychen #authorBio, Aeonin aside) ja Edited by loppuun osanvaihdon
     jälkeen. Etukenttään tekijät ja julkaisupäivä schema.org-tiedoista. Mitattu 14.11.2026. */
  async function aeonPsyche() {
    const sivusto = /(^|\.)psyche\.co$/.test(location.hostname) ? 'Psyche' : /(^|\.)aeon\.co$/.test(location.hostname) ? 'Aeon' : '';
    if (!sivusto) return null;
    const juuret = [...document.querySelectorAll('.article-content')].filter(r => !r.parentElement.closest('.article-content'));
    if (!juuret.length) return null;
    let yhteinen = juuret[0];
    while (!juuret.every(r => yhteinen.contains(r))) yhteinen = yhteinen.parentElement;
    const el = document.createElement('div');
    if (juuret.length === 1) el.append(...[...juuret[0].childNodes].map(n => n.cloneNode(true)));
    else {
      // Lohkot ja niiden väliset otsikot sivun järjestyksessä.
      const osat = [...yhteinen.querySelectorAll('.article-content, h2, h3')].filter(e =>
        e.matches('.article-content') ? juuret.includes(e) : !e.closest('.article-content, aside'));
      for (const e of osat) {
        if (e.matches('.article-content')) el.append(...[...e.childNodes].map(n => n.cloneNode(true)));
        else { const h = document.createElement('h2'); h.textContent = rivi(e.textContent); if (h.textContent) el.appendChild(h); }
      }
    }
    el.querySelectorAll('script, style, noscript, button, svg, aside, figure, img, template, audio, video, .pullquote, .no-pagemarks')
      .forEach(x => x.remove());
    let ensimmainen = true;
    el.querySelectorAll('p, .ld-dropcap').forEach(e => {
      if (e.matches('p')) { if (rivi(e.textContent)) ensimmainen = false; return; }
      const kpl = e.closest('p');
      e.replaceWith(e.textContent);
      if (kpl && !ensimmainen && kpl.previousElementSibling && kpl.previousElementSibling.tagName !== 'HR')
        kpl.before(document.createElement('hr'));
    });
    // Peräkkäiset lainaukset (dialogi, jonka jokainen repliikki on oma blockquotensa) yhdeksi.
    el.querySelectorAll('blockquote').forEach(b => {
      let n = b.nextSibling;
      while (n && n.nodeType === 3 && !n.textContent.trim()) n = n.nextSibling;
      if (n && n.nodeName === 'BLOCKQUOTE' && b.parentNode) { n.prepend(...b.childNodes); b.remove(); }
    });
    el.querySelectorAll('blockquote').forEach(b => [...b.childNodes].forEach(c => {
      if (c.nodeType === 3 && c.textContent.trim()) { const p = document.createElement('p'); c.replaceWith(p); p.appendChild(c); }
    }));
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent)) p.remove(); });
    // Tekijän esittely: nimilinkki ja sen perässä oleva esittely, sitten Edited by.
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent); } catch (e) { return null; } })
      .find(d => d && /Article/.test(d['@type']));
    const tekijat = ld && [].concat(ld.author || []).map(a => rivi(a && a.name)).filter(Boolean) || [];
    const bio = document.querySelector('#authorBio') || document.querySelector('aside a[href*="/users/"]') && document.querySelector('aside a[href*="/users/"]').closest('aside');
    if (bio) {
      const kpl = [];
      bio.querySelectorAll('a[href*="/authors/"], a[href*="/users/"]').forEach(a => {
        const esit = a.nextElementSibling;
        if (!esit || !rivi(esit.textContent) || /^edited by/i.test(rivi(esit.textContent))) return;
        const p = document.createElement('p'); p.textContent = rivi(a.textContent) + ' ';
        p.append(...[...(esit.querySelector('p') || esit).childNodes].map(n => n.cloneNode(true)));
        kpl.push(p);
      });
      const toim = [...bio.querySelectorAll('div, p')].find(x => /^edited by\s*\S/i.test(rivi(x.textContent)) && !x.querySelector('div, p'));
      if (toim) { const p = document.createElement('p'); p.textContent = rivi(toim.textContent).replace(/^edited by\s*/i, 'Edited by '); kpl.push(p); }
      if (kpl.length) el.append(document.createElement('hr'), ...kpl);
    }
    el.querySelectorAll('div, span').forEach(d => d.replaceWith(...d.childNodes));
    el.normalize();
    const h1 = document.querySelector('main h1') || document.querySelector('h1');
    const pv = (/^(\d{4}-\d\d-\d\d)/.exec(ld && ld.datePublished || '') || [])[1] || '';
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1 && h1.textContent) || rivi(ld && ld.headline), sivusto,
      tekija: tekijat.length > 2 ? tekijat.slice(0, -1).join(', ') + ' & ' + tekijat[tekijat.length - 1] : tekijat.join(' & '),
      julkaistu: pv, lahde: osoite.split('?')[0] };
  }

  /* European Journal of Psychoanalysis (journal-psychoanalysis.eu, käyttäjän pyyntö 15.11.2026). WordPress, oma teema.
     Readability antaa leipätekstin, mutta tiivistelmä (.article_intro), kirjallisuus, viitteet, tekijän esittely ja
     julkaisupäivä putoavat: ne ovat artikkelin alla lohkoissa .article_notes_box (otsikko h3.article_notes_title:
     Bibliography/References, Notes/Note, Bio/Bios, Publication Date). Lohkojen numerointi ja järjestys vaihtelevat, joten
     lohko tunnistetaan otsikkosanasta. Runko .article_text: väliotsikot ovat kokonaan lihavoituja kappaleita (##; lihavoitu
     kursiivi ###; kaksoispisteeseen päättyvä tai pitkä virke ei ole otsikko), kuvatekstit h6:na ja .wp-caption-textinä
     (kursiivikappaleiksi, kuvat pois), lainaukset sisennettyinä kappaleina (style padding-left). Viitemerkit ovat tekstissä
     linkittöminä [1]; ne yhdistetään Notes-lohkon [1]-kappaleisiin järjestyksessä. Viite, jolle ei löydy merkkiä
     (Consciousness: merkit puuttuvat sivulta, numerot ilman hakasulkeita), jää Notes-osioksi. Tekstiviittaukset ovat APA:n
     muotoa (Badiou, 2017, p. 61): pilkku tekijän ja vuoden välistä pois kuten OECS:ssä, jotta md.js linkittää ne
     kirjallisuusluetteloon. Kirjallisuus kappaleina (p.bib). Tiivistelmä alkuun ennen osanvaihtoa, sen Summary:-otsake
     kappaleen alkuun. Etukenttään tyyppi tieteellinen, teos (lehti) ja numero sivupalkista (Vol. 12, No. 1, 2025 → 12:1),
     julkaistu Publication Date -lohkosta (article:published_time on WordPressin aika, ei julkaisupäivä; ilman lohkoa vuosi
     numerosta, vanhoissa artikkeleissa ei mitään), tekijät .article_authorista. Mitattu 15.11.2026. */
  const EJP_NIMI = 'European Journal of Psychoanalysis';
  const EJP_KUUT = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
  // APA:n pilkku sulkujen sisällä tekijän ja vuoden välistä pois: (Freud, 1925/1998, p. 11) → (Freud 1925/1998, p. 11).
  const ejpViittaukset = juuri => {
    const w = document.createTreeWalker(juuri, NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) {
      if (!/\(/.test(t.nodeValue)) continue;
      t.nodeValue = t.nodeValue.replace(/\([^()]*\)/g, s => s.replace(/(\p{Lu}[\p{L}’'-]+(?:\s+et\s+al\.?)?),\s+((?:1[5-9]\d\d|20\d\d)[a-z]?)(?=[\s,;:)/]|$)/gu, '$1 $2'));
    }
  };
  async function ejp() {
    if (!/(^|\.)journal-psychoanalysis\.eu$/.test(location.hostname)) return null;
    const runko = document.querySelector('article.article_post .article_text');
    if (!runko) return null;
    const art = runko.closest('article');
    const el = runko.cloneNode(true);
    const tyhja = p => !rivi(p.textContent);
    // Kuvat pois, kuvatekstit (h6, .wp-caption-text) kursiivikappaleiksi.
    const kursiivi = x => { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = rivi(x.textContent); p.appendChild(em); return p; };
    el.querySelectorAll('.wp-caption').forEach(d => { const c = d.querySelector('.wp-caption-text'); c && !tyhja(c) ? d.replaceWith(kursiivi(c)) : d.remove(); });
    el.querySelectorAll('h6').forEach(h => tyhja(h) ? h.remove() : h.replaceWith(kursiivi(h)));
    el.querySelectorAll('script, style, noscript, button, svg, img, figure, iframe').forEach(x => x.remove());
    // Wordin tyhjät viiteankkurit (<a href="#_ftnref1" name="_ftn1"></a>).
    el.querySelectorAll('a').forEach(a => { if (tyhja(a)) a.remove(); });
    // Väliotsikot: kappale, jonka koko teksti on lihavoitu.
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent);
      if (!t || t.length > 200 || /:$/.test(t) || (/\.$/.test(t) && t.split(' ').length > 8)) return;
      const osa = sel => [...p.querySelectorAll(sel)].filter(x => !x.parentElement.closest(sel) || !p.contains(x.parentElement.closest(sel))).map(x => x.textContent).join('');
      if (rivi(osa('b, strong')).replace(/\s/g, '') !== t.replace(/\s/g, '')) return;
      const h = document.createElement(rivi(osa('i, em')).replace(/\s/g, '') === t.replace(/\s/g, '') ? 'h3' : 'h2');
      h.textContent = t;
      p.replaceWith(h);
    });
    // Sisennetyt kappaleet lainauksiksi, peräkkäiset yhdeksi.
    el.querySelectorAll('p[style*="padding-left"]').forEach(p => {
      const ed = p.previousElementSibling;
      const b = ed && ed.tagName === 'BLOCKQUOTE' ? ed : document.createElement('blockquote');
      if (b !== ed) p.before(b);
      p.removeAttribute('style');
      b.appendChild(p);
    });
    el.querySelectorAll('p').forEach(p => { if (tyhja(p)) p.remove(); });
    // Lohkot otsikkosanasta.
    const lohkot = [...art.querySelectorAll('.article_notes_box')].map(b => ({
      nimi: rivi((b.querySelector('.article_notes_title') || {}).textContent).replace(/:$/, ''),
      kpl: [...b.querySelectorAll('.article_notes_text p')].filter(p => !tyhja(p) && !p.querySelector('p'))
    }));
    // Viitteet: [n]-kappale aloittaa viitteen, numeroton kappale jatkaa edellistä.
    // Merkki voi jakautua elementtien kesken (<b>[</b>2]), joten haku tehdään rungon yhdistetystä tekstistä.
    const solmut = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) solmut.push(t);
    let koko = '';
    const alut = solmut.map(t => { const a = koko.length; koko += t.nodeValue; return a; });
    const maar = [], jaljelle = [], poistot = [];
    let kohta = 0;
    for (const l of lohkot.filter(l => /^notes?$/i.test(l.nimi))) {
      const viitteet = [];
      for (const p of l.kpl) {
        const m = /^\s*\[(\d{1,3})\]\s*/.exec(p.textContent);
        if (m) viitteet.push({ n: m[1], kpl: [p] });
        else if (viitteet.length && !/^\s*\d{1,3}\s/.test(p.textContent)) viitteet[viitteet.length - 1].kpl.push(p);
        else viitteet.push({ n: '', kpl: [p] });
      }
      for (const v of viitteet) {
        const i = v.n ? koko.indexOf('[' + v.n + ']', kohta) : -1;
        if (i < 0) { jaljelle.push(...v.kpl); continue; }
        kohta = i + v.n.length + 2;
        const tunnus = 'ejp' + (maar.length + 1);
        poistot.push({ i, loppu: kohta, tunnus });
        const k = document.createElement('div');
        v.kpl.forEach(p => k.appendChild(p.cloneNode(true)));
        ejpViittaukset(k);
        const t = muunna(k.innerHTML, 'inlined').trim().replace(/^\\\[\d{1,3}\\\]\s*/, '');
        if (t) maar.push(maaritelma(tunnus, t)); else poistot.pop();
      }
    }
    // Merkit lopusta alkuun, jotta aiemmat paikat pysyvät: merkin merkit pois solmuista, alaviitemerkki alun paikalle.
    for (const m of poistot.reverse()) {
      solmut.forEach((t, j) => {
        const a = alut[j], l = a + t.nodeValue.length;
        if (l <= m.i || a >= m.loppu) return;
        const x = Math.max(m.i, a) - a, y = Math.min(m.loppu, l) - a;
        if (a <= m.i) {
          const loput = t.splitText(x);
          loput.nodeValue = loput.nodeValue.slice(y - x);
          loput.before(m.solmu = merkki(m.tunnus));
        } else t.nodeValue = t.nodeValue.slice(0, x) + t.nodeValue.slice(y);
      });
    }
    // Merkki pois muotoilusta, jossa ei ole muuta (<b>[</b>2] → **[^viite-…]**).
    poistot.forEach(m => {
      let e = m.solmu.parentElement;
      while (e && e !== el && /^(B|STRONG|I|EM|SPAN|SUP)$/.test(e.tagName) && e.textContent === m.solmu.nodeValue) { e.replaceWith(m.solmu); e = m.solmu.parentElement; }
    });
    ejpViittaukset(el);
    // Tiivistelmä alkuun: Summary:-otsake kappaleen alkuun.
    const intro = art.querySelector('.article_intro');
    const alku = intro ? [...intro.querySelectorAll('p')].filter(p => !tyhja(p)).map(p => p.cloneNode(true)) : [];
    if (alku.length > 1 && /^summary:?$/i.test(rivi(alku[0].textContent)) && alku[0].querySelector('b, strong')) {
      const s = document.createElement('strong'); s.textContent = rivi(alku[0].textContent);
      alku[1].prepend(s, ' ');
      alku.shift();
    }
    if (alku.length) { alku.forEach(ejpViittaukset); el.prepend(...alku, document.createElement('hr')); }
    // Muut lohkot sivun järjestyksessä: kirjallisuus kappaleina, kohdistamattomat viitteet, esittely ja muut.
    let julkaistu = '';
    for (const l of lohkot) {
      if (/^publication date$/i.test(l.nimi)) {
        const m = /([A-Z][a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/.exec(rivi(l.kpl.map(p => p.textContent).join(' ')));
        if (m && EJP_KUUT[m[1].toLowerCase()]) julkaistu = m[3] + '-' + String(EJP_KUUT[m[1].toLowerCase()]).padStart(2, '0') + '-' + m[2].padStart(2, '0');
        continue;
      }
      const kpl = /^notes?$/i.test(l.nimi) ? jaljelle : l.kpl;
      if (!kpl.length) continue;
      const h = document.createElement('h2'); h.textContent = l.nimi;
      el.append(h, ...kpl.map(p => { const k = p.cloneNode(true); k.removeAttribute('style'); return k; }));
    }
    el.querySelectorAll('div, span').forEach(d => d.replaceWith(...d.childNodes));
    el.normalize();
    // Sivupalkki: Vol. 12, No. 1, 2025 → numero 12:1, vuosi julkaisupäivän varalle.
    const vol = rivi((document.querySelector('.article_details_description') || {}).textContent);
    const vm = /Vol\.?\s*(\d+)\s*,\s*No\.?\s*(\d+)(?:\s*,\s*(\d{4}))?/i.exec(vol);
    const tekija = rivi((art.querySelector('.article_author') || {}).textContent).replace(/\s+and\s+/g, ' & ');
    return { html: irrota([el]).innerHTML, otsikko: rivi((art.querySelector('h1.article_title') || document.querySelector('h1') || {}).textContent),
      tekija, tyyppi: 'tieteellinen', teos: EJP_NIMI, numero: vm ? vm[1] + ':' + vm[2] : '', naytto: EJP_NIMI,
      julkaistu: julkaistu || (vm && vm[3]) || '', lahde: osoite.split('?')[0], maar };
  }

  /* Open Journal Systems (PKP:n lehtialusta), käyttäjän pyyntö 16.11.2026: liettuankieliset lähteet, ykkösenä Problemos.
     Tunnistus alustasta, ei verkkotunnuksesta: artikkelin sivulla generator-meta *Open Journal Systems* ja citation_*-tiedot,
     kokotekstin sivulla osoite …/article/(view|download)/<artikkeli>/<galleria>, jonka artikkelisivu on OJS:n. Artikkelin
     sivulta (tiivistelmä) haetaan HTML-kokoteksti (citation_fulltext_html_url; OJS:n oletusnäkymässä kehyksen osoite), ja
     kokotekstin sivulta artikkelisivun tiedot etukenttään. Vain pdf:nä julkaistu artikkeli jää Readabilitylle.
     Vilniaus universitetas (journals.vu.lt: Problemos, Literatūra, Religija ir kultūra, Politologija, Kalbotyra ym.) julkaisee
     kokotekstin InDesignin HTML:nä ilman OJS:n kehystä: alussa lehden tiedot, otsikko h1:nä, tekijä ja laitos, tiivistelmä
     artikkelin kielellä, toisen kielen otsikko (h3, vuoden 2019 numeroissa h2) ja tiivistelmä, Received/Copyright-kappale.
     Alku leikataan oikeuskappaleeseen asti: tiivistelmät jäävät lähteen järjestyksessä (toisen kielen otsikko kursiivina
     otsakkeen perään) ja avainsanat omaksi kappaleekseen. Alaviitteet kolmella tavalla: 2024– li#footnote-NNN, jonka merkki
     viittaa tiedostonimeen (1_Aleksandravicius.html#footnote-016) eikä sivun omaan ankkuriin; 2021–2023 div.footnote ja
     sup; 2019 div.footnotes. Kirjallisuusluettelon otsikko on h3 lukujen h2:n alla, joten se nostetaan luvuksi; taulukon ja
     kuvan otsikot (h4: *1 lentelė.*) ovat kuvatekstejä. Lehden citation_title voi olla toisella kielellä kuin artikkeli
     (Problemos 109: liettuankielinen artikkeli, englanninkielinen citation_title ja citation_language en), joten otsikko on
     kokotekstin h1. Mitattu 16.11.2026 Problemosin vuosikerroilla 2019–2026 sekä Literatūrassa, Religija ir kultūrassa,
     Politologijassa ja Kalbotyrassa. Problemos: ei mainoksia eikä lahjoituspyyntöä, CC BY 4.0. */
  const OJS_ABSTRAKTI = /^(santrauka|anotacija|abstract|summary|résumé|resume|zusammenfassung|tiivistelmä|аннотация|резюме)$/i;
  const OJS_AVAINSANAT = /^(pagrindiniai žodžiai|reikšminiai žodžiai|raktiniai žodžiai|raktažodžiai|esminiai žodžiai|keywords|key words|schlüsselwörter|mots-clés|avainsanat|asiasanat|ключевые слова)$/i;
  const OJS_LUETTELO = /^(literatūra|literatūros sąrašas|naudota literatūra|cituota literatūra|šaltiniai|šaltinių sąrašas|šaltiniai ir literatūra|literatūra ir šaltiniai|bibliografija|references|reference list|bibliography|literature|sources|works cited|kirjallisuus|lähteet|literatur|bibliographie)$/i;
  const OJS_KUVATEKSTI = /^(\d+\s*(lentelė|pav\.|paveikslas|schema|diagrama|grafikas)|(table|figure|fig\.|chart|diagram)\s*\d+)/i;
  const OJS_OIKEUS = /copyright\s*©|creative commons|open access article/i;
  // OJS:n vika (revistas.ucm.es 89492): tekijänä PHP:n taulukon tyyppinimi Array Array; tyhjäksi.
  const ojsMeta = (d, n) => [...d.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.getAttribute('content'))).filter(x => x && !/^Array(\s+Array)*$/.test(x));
  const ojsSivu = d => !!d && /^open journal systems/i.test(rivi((d.querySelector('meta[name="generator"]') || {}).content)) && ojsMeta(d, 'citation_title').length > 0;
  const ojsKehys = d => d.querySelector('iframe[name="htmlFrame"], iframe[src*="/article/download/"]');
  // Taulukko ruudukoksi (yhdistetyt solut tyhjiksi soluiksi, solun kappaleet yhdeksi riviksi), ensimmäinen rivi otsikoksi:
  // GFM:n taulukko tarvitsee tasasarakkeisen ruudukon ja otsikkorivin, muuten Turndown jättää sen HTML:ksi. Yksisarakkeinen tai
  // yksirivinen kappaleeksi.
  function ojsTaulukko(t) {
    const ruudukko = [];
    [...t.rows].forEach((r, i) => {
      const rv = ruudukko[i] = ruudukko[i] || [];
      let j = 0;
      [...r.cells].forEach(c => {
        while (rv[j] !== undefined) j++;
        const cs = Math.max(1, c.colSpan || 1), rs = Math.max(1, c.rowSpan || 1);
        for (let a = 0; a < rs; a++) for (let b = 0; b < cs; b++) (ruudukko[i + a] = ruudukko[i + a] || [])[j + b] = a || b ? '' : rivi(c.textContent);
        j += cs;
      });
    });
    const n = Math.max(0, ...ruudukko.map(r => r.length));
    if (n < 2 || ruudukko.length < 2) {
      const p = document.createElement('p');
      ruudukko.map(r => r.filter(Boolean).join(' ')).filter(Boolean).forEach((x, i) => { if (i) p.appendChild(document.createElement('br')); p.append(x); });
      return rivi(p.textContent) ? t.replaceWith(p) : t.remove();
    }
    const u = document.createElement('table'), tb = document.createElement('tbody');
    ruudukko.forEach((r, i) => {
      const tr = document.createElement('tr');
      for (let j = 0; j < n; j++) { const c = document.createElement(i ? 'td' : 'th'); c.textContent = r[j] || ''; tr.appendChild(c); }
      tb.appendChild(tr);
    });
    u.appendChild(tb);
    t.replaceWith(u);
  }
  // Vain pdf:nä julkaistu artikkeli (Problemos 1968–2018): artikkelisivun tiedoista tiivistelmät otsikoineen ja avainsanoineen,
  // kirjallisuus (citation_reference) ja pdf:n osoite näkyvänä tekstinä (Luinin verkkolinkit ovat oletuksena pois).
  function ojsTiivistelma(L) {
    const kieli = m => m.getAttribute('xml:lang') || m.getAttribute('lang') || '';
    const metat = n => [...L.querySelectorAll('meta[name="' + n + '"]')].filter(m => rivi(m.getAttribute('content')));
    const alt = metat('DC.Title.Alternative'), tiiv = metat('DC.Description').length ? metat('DC.Description') : metat('citation_abstract');
    if (!tiiv.length) return null;
    const el = document.createElement('div');
    const sanat = metat('citation_keywords').length ? metat('citation_keywords') : metat('DC.Subject');
    const otsikko = ojsMeta(L, 'citation_title')[0] || ojsMeta(L, 'DC.Title')[0] || '';
    // Sivun omat otsakkeet (käyttöliittymän kielellä), varalla englanti.
    const nimi = (sel, v) => rivi((L.querySelector(sel) || {}).textContent) || v;
    // Otsakkeet tiivistelmän kielellä (VU:n kokotekstien sanoin), muuten sivun omat.
    const OTSAKE = { lt: ['Santrauka', 'Pagrindiniai žodžiai'], en: ['Abstract', 'Keywords'], fi: ['Tiivistelmä', 'Avainsanat'],
      de: ['Zusammenfassung', 'Schlüsselwörter'], fr: ['Résumé', 'Mots-clés'], ru: ['Аннотация', 'Ключевые слова'] };
    const otsake = (k, i, sel, v) => (OTSAKE[k.slice(0, 2).toLowerCase()] || [])[i] || nimi(sel, v).replace(/[.:]$/, '');
    // Artikkelin kielen tiivistelmä ensin: se, jolla ei ole toisen kielen otsikkoa.
    const toinen = m => alt.some(a => kieli(a) && kieli(a) === kieli(m));
    tiiv.sort((x, y) => toinen(x) - toinen(y)).forEach(m => {
      const k = kieli(m), ots = alt.find(a => kieli(a) && kieli(a) === k);
      const p = document.createElement('p'), st = document.createElement('strong');
      st.textContent = otsake(k, 0, '.item.abstract .label, section.abstract h2', 'Abstract') + '.';
      p.append(st, ' ');
      if (ots) { const em = document.createElement('em'); const t = rivi(ots.getAttribute('content')); em.textContent = /[.?!…]$/.test(t) ? t : t + '.'; p.append(em, ' '); }
      p.append(rivi(m.getAttribute('content')));
      el.appendChild(p);
      let av = sanat.filter(x => kieli(x) === k);
      if (!av.length) av = metat('DC.Subject').filter(x => kieli(x) === k);
      av = av.map(x => rivi(x.getAttribute('content')));
      if (av.length) {
        const q = document.createElement('p'), s2 = document.createElement('strong');
        s2.textContent = otsake(k, 1, '.item.keywords .label', 'Keywords') + ':';
        q.append(s2, ' ', av.join(', '));
        el.appendChild(q);
      }
    });
    const viitteet = ojsMeta(L, 'citation_reference');
    if (viitteet.length) {
      const h = document.createElement('h2'); h.textContent = nimi('.item.references .label, section.references h2', 'References');
      el.appendChild(h);
      viitteet.forEach(v => { const p = document.createElement('p'); p.textContent = v; el.appendChild(p); });
    }
    const pdf = ojsMeta(L, 'citation_pdf_url')[0];
    if (pdf) { const p = document.createElement('p'), a = document.createElement('a'); a.href = pdf; a.textContent = pdf; p.append('PDF: ', a); el.appendChild(p); }
    const teos = ojsMeta(L, 'citation_journal_title')[0] || '';
    return Object.assign(ojsTiedot(L), { html: el.innerHTML, otsikko, naytto: teos, maar: [] });
  }
  function ojsTiedot(L) {
    const vol = ojsMeta(L, 'citation_volume')[0] || '', nro = ojsMeta(L, 'citation_issue')[0] || '';
    const s1 = ojsMeta(L, 'citation_firstpage')[0] || '', s2 = ojsMeta(L, 'citation_lastpage')[0] || '';
    const r = ojsMeta(L, 'DC.Rights'), u = r.find(x => /creativecommons\.org\/licenses\/[a-z-]+\/\d/i.test(x));
    const cc = u && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(u);
    return { tekija: ojsMeta(L, 'citation_author').join(' & '), tyyppi: 'tieteellinen', teos: ojsMeta(L, 'citation_journal_title')[0] || '',
      numero: vol && nro ? vol + ':' + nro : vol || nro, sivut: s1 && s2 && s1 !== s2 ? s1 + '–' + s2 : s1,
      julkaistu: (ojsMeta(L, 'citation_date')[0] || ojsMeta(L, 'citation_publication_date')[0] || '').replace(/\//g, '-'),
      doi: ojsMeta(L, 'citation_doi')[0] || '', lahde: ojsMeta(L, 'citation_abstract_html_url')[0] || osoite,
      oikeus: cc ? { teksti: r.filter(x => x !== u).concat('CC ' + cc[1].toUpperCase() + ' ' + cc[2]).join('. '), lahde: u } : null };
  }
  async function ojs() {
    const gal = /^(.*\/article\/)(?:view|download)\/(\d+)\/(\d+)\/?$/.exec(location.pathname);
    let L = null, G = null, gOs = '';
    if (gal) {
      L = ojsSivu(document) ? document : await hae(location.origin + gal[1] + 'view/' + gal[2]);
      if (!ojsSivu(L)) return null;
      const k = ojsKehys(document);
      if (k) gOs = k.src; else { G = document; gOs = osoite; }
    } else {
      if (!/\/article\/view\/\d+\/?$/.test(location.pathname) || !ojsSivu(document)) return null;
      L = document;
      gOs = ojsMeta(L, 'citation_fulltext_html_url')[0] || '';
      // Ilman metaa (Con-Textos Kantianos, revistas.ucm.es) galleriaa kuvaava linkki HTML (Spanish).
      if (!gOs) { const g = [...L.querySelectorAll('a.obj_galley_link')].find(a => /\bhtml\b/i.test(rivi(a.textContent)) || a.classList.contains('html')); if (g) gOs = g.href; }
      if (!gOs) return ojsTiivistelma(L);
    }
    if (!G) {
      if (!gOs) return null;
      G = await hae(gOs);
      const k = G && ojsKehys(G);
      if (k) { gOs = new URL(k.getAttribute('src'), gOs).href; G = await hae(gOs); }
      if (!G) return null;
    }
    const h1 = [...G.querySelectorAll('h1')].find(h => rivi(h.textContent));
    const el = document.importNode(h1 ? h1.parentElement : G.body, true);
    if (!rivi(el.textContent)) return null;
    // Väärä tiedosto galleriassa (Con-Textos Kantianos 89488: Felojin artikkelin HTML on Lazosin artikkeli): kun yhdenkään
    // tekijän sukunimeä ei ole kokotekstissä, leikkeeksi tiivistelmä artikkelisivun tiedoista.
    const sukunimet = ojsMeta(L, 'citation_author').map(t => (t.includes(',') ? t.split(',')[0] : t.split(/\s+/).pop()).trim()).filter(x => x.length > 1);
    if (sukunimet.length && !sukunimet.some(n => el.textContent.includes(n))) return ojsTiivistelma(L);
    // Linkit: alaviitemerkin tiedostonimi (1_X.html#footnote-016) sivun omaksi ankkuriksi, muut absoluuttisiksi.
    const onId = id => { try { return !!el.querySelector('[id="' + CSS.escape(id) + '"], a[name="' + CSS.escape(id) + '"]'); } catch (e) { return false; } };
    el.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href'), m = /^[^/?#:]+\.x?html?#(.+)$/i.exec(h);
      if (m && onId(m[1])) a.setAttribute('href', '#' + m[1]);
      else if (!h.startsWith('#')) { try { a.setAttribute('href', new URL(h.trim(), gOs).href); } catch (e) {} }
    });
    el.querySelectorAll('script, style, noscript, img, iframe, svg, button').forEach(x => x.remove());
    const tyhja = p => !rivi(p.textContent.replace(/_/g, ''));
    const otsikko = rivi(h1 ? h1.textContent : ojsMeta(L, 'citation_title')[0]);
    const tekijat = ojsMeta(L, 'citation_author');
    const tunnetut = new Set(tekijat.map(t => t.toLowerCase()));
    // Alku oikeuskappaleeseen asti: tiivistelmät ja avainsanat talteen, muu (lehden tiedot, rubriikki, tekijä, laitos,
    // rahoitus, päivämäärät) pois.
    const lapset = [...el.children];
    let oi = lapset.findIndex(e => e.tagName === 'P' && OJS_OIKEUS.test(e.textContent));
    const alku = [];
    let oikeus = null;
    if (oi >= 0) {
      // Oikeuskappale voi jatkua seuraavaan (Kalbotyra: Copyright ja Open Access -lause erikseen); viivat ja tyhjät mukaan.
      const oa = oi;
      while (lapset[oi + 1] && lapset[oi + 1].tagName === 'P' && (OJS_OIKEUS.test(lapset[oi + 1].textContent) || tyhja(lapset[oi + 1]))) oi++;
      const etu = lapset.slice(0, oi + 1);
      etu.forEach((e, i) => {
        if (e.tagName !== 'P') return;
        const s = e.querySelector('strong, b'), nimi = s && rivi(s.textContent).replace(/\s*[.:]\s*$/, '');
        if (!nimi || !OJS_ABSTRAKTI.test(nimi) || !rivi(e.textContent).startsWith(rivi(s.textContent))) return;
        // Tiivistelmän otsikko: edeltävä väliotsikko, jos se ei ole artikkelin otsikko eikä tekijä (2019: tekijä h3:na).
        let ots = '';
        for (let j = i - 1; j >= 0; j--) {
          if (!/^H[1-6]$/.test(etu[j].tagName)) continue;
          const t = rivi(etu[j].textContent);
          if (etu[j].tagName !== 'H1' && t && !tunnetut.has(t.toLowerCase())) ots = t;
          break;
        }
        const k = e.cloneNode(true);
        k.querySelector('strong, b').remove();
        const av = [...k.querySelectorAll('strong, b')].find(x => OJS_AVAINSANAT.test(rivi(x.textContent).replace(/\s*[.:]\s*$/, '')));
        let avp = null;
        if (av) {
          const avNimi = rivi(av.textContent).replace(/\s*[.:]\s*$/, '');
          const r = document.createRange();
          r.setStartBefore(av); r.setEndAfter(k.lastChild);
          const loput = r.extractContents();
          loput.querySelector('strong, b').remove();
          avp = document.createElement('p');
          const st = document.createElement('strong'); st.textContent = avNimi + ':';
          avp.append(st, ' ', loput);
        }
        // Otsakkeen jälkeinen piste tai kaksoispiste ja loppujen rivinvaihdot pois.
        const siisti = p => {
          const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          for (let t; (t = w.nextNode());) { if (!t.nodeValue.trim()) continue; t.nodeValue = t.nodeValue.replace(/^\s*[.:]?\s*/, ''); break; }
          // Rivinvaihto, jonka jälkeen ei ole tekstiä (myös kääreen sisällä: <span>…life.<br /></span>).
          [...p.querySelectorAll('br')].reverse().forEach(b => {
            const r = document.createRange(); r.setStartAfter(b); r.setEnd(p, p.childNodes.length);
            if (!r.toString().trim()) b.remove();
          });
        };
        const p = document.createElement('p'), st = document.createElement('strong');
        st.textContent = nimi + '.';
        p.append(st, ' ');
        if (ots) { const em = document.createElement('em'); em.textContent = /[.?!…]$/.test(ots) ? ots : ots + '.'; p.append(em, ' '); }
        const sisus = document.createElement('span');
        sisus.append(...k.childNodes);
        siisti(sisus);
        p.append(...sisus.childNodes);
        alku.push(p);
        if (avp) {
          const sp = document.createElement('span'); sp.append(...[...avp.childNodes].slice(2)); siisti(sp);
          avp.append(...sp.childNodes); alku.push(avp);
        }
      });
      const oik = document.createElement('div');
      lapset.slice(oa, oi + 1).forEach(e => { const k = e.cloneNode(true); k.querySelectorAll('br').forEach(b => b.replaceWith(' ')); oik.append(k, ' '); });
      const cc = oik.querySelector('a[href*="creativecommons.org"]');
      const t = rivi(oik.textContent), c = t.search(/copyright/i);
      if (c >= 0) oikeus = { teksti: t.slice(c), lahde: cc ? cc.getAttribute('href') : osoite };
      etu.forEach(e => e.remove());
    }
    el.querySelectorAll('h1').forEach(h => h.remove());
    el.querySelectorAll('p').forEach(p => { if (tyhja(p)) p.remove(); });
    // Väliotsikot lihavoituina kappaleina (Kalbotyra: 1 Įvadas, 2.1 …), vain jos oikeita otsikoita ei ole; taso numeroinnista.
    // Lihavoitu luettelon otsikko (Politologija: Literatūra ir šaltiniai) aina.
    // Alaviitemerkki otsikossa (Kalbotyra: 4.1 …<sup>13</sup>) jää otsikkoon; md.js tekee siitä otsikon alaviitteen.
    const merkitOf = x => [...x.querySelectorAll('a[href^="#"]')].filter(a => tunnusOf(a.textContent)).map(a => {
      let k = a;
      while (k.parentElement !== x && /^(SUP|SPAN)$/.test(k.parentElement.tagName) && rivi(k.parentElement.textContent) === rivi(a.textContent)) k = k.parentElement;
      return k;
    });
    const ilmanMerkkeja = x => { const merkit = merkitOf(x), k = x.cloneNode(true); merkitOf(k).forEach(m => m.remove()); return { t: rivi(k.textContent), merkit }; };
    const otsikoita = !!el.querySelector('h2, h3, h4, h5, h6');
    el.querySelectorAll('p').forEach(p => {
      const { t, merkit } = ilmanMerkkeja(p);
      if (otsikoita && !OJS_LUETTELO.test(t.replace(/\s*[.:]$/, ''))) return;
      if (!t || t.length > 160 || /[:;,]$/.test(t) || (/\.$/.test(t) && t.split(' ').length > 8) || p.closest('li, td, th, blockquote, .footnote, .footnotes, section')) return;
      const b = [...p.querySelectorAll('strong, b')].filter(x => !x.parentElement.closest('strong, b')).map(x => ilmanMerkkeja(x).t).join('');
      if (rivi(b).replace(/\s/g, '') !== t.replace(/\s/g, '')) return;
      const nro = /^(\d+(?:\.\d+)*)\.?\s/.exec(t);
      const h = document.createElement('h' + Math.min(6, 1 + (nro ? nro[1].split('.').length : 1)));
      h.append(t, ...merkit);
      p.replaceWith(h);
    });
    // Otsikot tekstiksi (lihavoinnit pois); kuvien ja taulukoiden otsikot kursiivikappaleiksi; kirjallisuus luvuksi; muut
    // tasot järjestyksessä luvuiksi, osioiksi ja kohdiksi (Religija ir kultūra: h2 ja h4 ilman h3:a).
    const tasot = new Set();
    [...el.querySelectorAll('h2, h3, h4, h5, h6')].forEach(h => {
      const { t, merkit } = ilmanMerkkeja(h);
      if (!t) return h.remove();
      if (OJS_KUVATEKSTI.test(t)) { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.append(em, ...merkit); return h.replaceWith(p); }
      const u = document.createElement(h.tagName);
      u.append(t, ...merkit);
      if (OJS_LUETTELO.test(t.replace(/\s*[.:]$/, ''))) u.dataset.luettelo = '1'; else tasot.add(+h.tagName[1]);
      h.replaceWith(u);
    });
    const jarjestys = [...tasot].sort();
    el.querySelectorAll('h2, h3, h4, h5, h6').forEach(h => {
      const n = h.dataset.luettelo ? 2 : Math.min(6, 2 + jarjestys.indexOf(+h.tagName[1]));
      if (n === +h.tagName[1] && !h.dataset.luettelo) return;
      const u = document.createElement('h' + n); u.append(...h.childNodes); h.replaceWith(u);
    });
    // Yläindeksit ilman attribuutteja (InDesign: <sup xml:lang="en-GB">th</sup>), muuten md.js näyttäisi ne tekstinä; ennen
    // alaviitteitä, koska niiden teksti muunnetaan heti.
    el.querySelectorAll('sup, sub').forEach(x => [...x.attributes].forEach(a => x.removeAttribute(a.name)));
    // Otsikot ennen tiivistelmää (revistas.ucm.es: h2 toistaa otsikon, seuraava h2 on toisen kielen otsikko): toisto pois,
    // toisen kielen otsikko kursiivikappaleeksi.
    const vrt = x => rivi(x).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    const alkuOts = [...el.querySelectorAll(OTSIKOT)];
    if (alkuOts.some(x => OJS_ABSTRAKTI.test(rivi(x.textContent).replace(/\s*[.:]$/, '')))) for (const h of alkuOts) {
      const t = rivi(h.textContent).replace(/\s*[.:]$/, '');
      if (OJS_ABSTRAKTI.test(t) || OJS_AVAINSANAT.test(t)) break;
      if (vrt(t) === vrt(otsikko)) { h.remove(); continue; }
      const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); h.replaceWith(p);
    }
    ejpViittaukset(el);
    const maar = samanSivunViitteet(el, 'ojs');
    // Tyhjiksi jääneet alaviitelohkot ja niiden edellä oleva viiva pois.
    [...el.querySelectorAll('section, ol, ul, div')].reverse().forEach(x => { if (!rivi(x.textContent) && !x.querySelector('table')) x.remove(); });
    while (el.lastElementChild && /^HR$/.test(el.lastElementChild.tagName)) el.lastElementChild.remove();
    el.querySelectorAll('table').forEach(t => { if (!t.parentElement.closest('table')) ojsTaulukko(t); });
    if (alku.length) el.prepend(...alku, document.createElement('hr'));
    const tiedot = ojsTiedot(L);
    return Object.assign(tiedot, { html: irrota([el]).innerHTML, otsikko, oikeus: oikeus || tiedot.oikeus, naytto: tiedot.teos, maar });
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

  /* Kirkkoisät: New Advent ja CCEL (käyttäjän pyyntö 14.11.2026: varhaiskristillisyyden ja Paavalin vastaanoton tutkimukseen).
     Kumpikin pilkkoo osan teoksista lukuihin omille sivuilleen (CCEL kauttaaltaan, New Advent esim. Irenaeuksen Against Heresies),
     joten lyhyen luvun sivulta leikataan koko kirja: sivut haetaan samalta sivustolta kuuden erissä kuten IRED:ssä, enintään
     KK_RAJA sivua (muuten vain tämä sivu). */
  const KK_RAJA = 250, KK_LYHYT = 2500;
  const kkSanoja = el => (rivi(el.textContent).match(/\S+/g) || []).length;
  async function kkHae(osoitteet) {
    const tulos = [];
    for (let i = 0; i < osoitteet.length; i += 6) tulos.push(...await Promise.all(osoitteet.slice(i, i + 6).map(hae)));
    return tulos;
  }
  // <q> lainausmerkeiksi (Turndown jättäisi pelkän tekstin): uloimmat ”…” suomalaisittain ei, vaan lähteen englannin “…”, sisemmät ‘…’.
  function kkLainaukset(el) {
    [...el.querySelectorAll('q')].reverse().forEach(q => {
      let syva = 0;
      for (let x = q.parentElement; x && x !== el; x = x.parentElement) if (x.tagName === 'Q') syva++;
      const [a, b] = syva % 2 ? ['‘', '’'] : ['“', '”'];
      q.replaceWith(a, ...q.childNodes, b);
    });
  }
  // Sivuston sisäinen linkki (sanastoartikkeli, Raamatun jae, toinen luku) tekstiksi kuten Wikipedian wikilinkit; ulkoiset jäävät.
  function kkLinkit(el, isanta) {
    el.querySelectorAll('a').forEach(a => {
      const h = a.getAttribute('href') || '';
      if (!h || /^(#|\.|\/|javascript:)/i.test(h) || !/^[a-z][a-z0-9+.-]*:/i.test(h) || isanta.test(h)) a.replaceWith(...a.childNodes);
    });
  }
  // Käytetyt otsikkotasot järjestyksessä h2…h4:ksi (kuten Gutenbergissä).
  function kkTasoita(el) {
    const ots = [...el.querySelectorAll(OTSIKOT)];
    ots.forEach(h => { if (!rivi(h.textContent)) h.remove(); });
    const kaytetyt = [...new Set([...el.querySelectorAll(OTSIKOT)].map(h => +h.tagName[1]))].sort();
    el.querySelectorAll(OTSIKOT).forEach(h => {
      const u = document.createElement('h' + Math.min(4, kaytetyt.indexOf(+h.tagName[1]) + 2));
      while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u);
    });
  }
  // Otsikon taso: sivun ylin otsikko tasolle 1 + syvyys, alemmat suhteessa siihen.
  function kkSiirra(el, syvyys) {
    const hs = [...el.querySelectorAll(OTSIKOT)];
    if (!hs.length) return;
    const ylin = Math.min(...hs.map(h => +h.tagName[1]));
    hs.forEach(h => {
      const u = document.createElement('h' + Math.min(6, Math.max(2, 1 + syvyys + (+h.tagName[1] - ylin))));
      while (h.firstChild) u.appendChild(h.firstChild); h.replaceWith(u);
    });
  }
  // Otsikkoteksti: rivinvaihto (<br>) kaksoispisteeksi (The Epistle of Ignatius to the Ephesians<br>Shorter and Longer Versions).
  function kkOtsikkoTeksti(h) {
    const k = h.cloneNode(true);
    k.querySelectorAll('br').forEach(b => b.replaceWith('\u0001'));
    return k.textContent.split('\u0001').map(rivi).filter(Boolean).reduce((s, x) => !s ? x : s + (/[.:;!?]$/.test(s) ? ' ' : ': ') + x, '');
  }
  const kkLuettelo = nimet => nimet.length > 2 ? nimet.slice(0, -1).join(', ') + ' & ' + nimet[nimet.length - 1] : nimet.join(' & ');
  const kkNimet = s => rivi(s).split(/\s*,\s*(?:and\s+)?|\s+and\s+/).map(rivi).filter(Boolean);
  const kkKaantaja = nimet => !nimet.length ? '' : (nimet.length > 1 || /^(the\s+)?fathers\b/i.test(nimet[0]) ? 'Kääntäneet ' : 'Kääntänyt ') +
    kkLuettelo(nimet).replace(/ & ([^&]*)$/, ' ja $1');
  // Pelkkä osan nimi (Book I., Homily 3): otsikoksi tarvitaan teoksen nimi eteen.
  const KK_OSA = /^(book|part|chapter|homily|sermon|letter|epistle|section|tractate|lecture|discourse|question|article|kirja|osa|luku)\s+([\dIVXLCDM]+)\.?$/i;

  /* New Advent (newadvent.org): kirkkoisät (ANF- ja NPNF-käännökset, Kevin Knightin tarkistamina), Catholic Encyclopedia (1907–1913)
     ja Summa theologiae. Runko #springfield2 ilman mainoksia (catholicadnet, CMtag), tukipyyntöä (gumroad), h1:tä ja tietolohkoa
     (.pub). Sanastolinkit (../cathen/…) ja muut sivuston linkit tekstiksi. Raamatunkohdat ovat isien teksteissä lainauksen perässä
     omina span.stiki-merkintöinään (ANF:ssä ne olivat alaviitteitä): alaviitteiksi. <q> lainausmerkeiksi. Irenaeuksen luvun
     kuvaus (span.h1a) kursiiviksi. Summan artikkeliluettelo (#article1 …) pois.
     Koko teos: isien sisällysluettelosivulta (Stromata, Homilies on Romans: lapsitiedostot alkavat sivun numerolla 0210 → 02101)
     kaikki osat ja luvun sivulta (murupolku … > Book I, Chapter 1) sisällysluettelon saman väliotsikon (Book I) luvut; osan otsikko
     on sisällysluettelon linkkiteksti. Etukenttään tietolohkosta: isät tekijä (otsikon sulkeista ilman St.), suomentaja,
     teos, numero (Vol.), toimittaja, paikka, kustantaja ja vuosi; Catholic Encyclopedia MLA-viitteestä tekijä, teos, numero,
     paikka, kustantaja ja vuosi; Summa tekijä, teos (Prima Pars ym.), suomentaja, vuosi ja verkkoversion tekijänoikeusrivi.
     Raamattu (jakeet rinnakkain kolmella kielellä) ja hakemistosivut jäävät Readabilitylle. Mitattu 14.11.2026. */
  const NA_NIMI = 'New Advent';
  const NA_ISANTA = /^https?:\/\/([a-z0-9-]+\.)*newadvent\.org(\/|$)/i;
  function naRunko(d, maar, laskuri) {
    const juuri = d.getElementById('springfield2');
    if (!juuri) return null;
    const el = juuri.cloneNode(true);
    el.querySelectorAll('script, style, noscript, ins, iframe, form, .pub, .breadcrumbs, h1, [class^="catholicadnet"], [class*="CMtag"]').forEach(x => x.remove());
    el.querySelectorAll('a[href*="gumroad.com"]').forEach(a => { const p = a.closest('p'); if (el.contains(a)) (p && el.contains(p) ? p : a).remove(); });
    el.querySelectorAll('ol, ul').forEach(l => {
      const lit = [...l.children].filter(li => li.tagName === 'LI');
      if (lit.length && lit.every(li => { const a = li.querySelectorAll('a[href]'); return a.length === 1 && /#article\d+$/.test(a[0].getAttribute('href')); })) l.remove();
    });
    el.querySelectorAll('span.h1a').forEach(s => {
      const p = d.createElement('p'), em = d.createElement('em');
      while (s.firstChild) em.appendChild(s.firstChild);
      p.appendChild(em); s.replaceWith(p);
    });
    kkLainaukset(el);
    el.querySelectorAll('span.stiki').forEach(s => {
      const k = s.cloneNode(true);
      kkLinkit(k, NA_ISANTA);
      const t = muunna(k.innerHTML, 'inlined').trim();
      const ed = s.previousSibling;
      if (ed && ed.nodeType === 3) ed.nodeValue = ed.nodeValue.replace(/\s+$/, '');
      if (!t) { s.remove(); return; }
      const tunnus = 'na' + (++laskuri.n);
      s.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    kkLinkit(el, NA_ISANTA);
    return el;
  }
  async function newadvent() {
    if (!/(^|\.)newadvent\.org$/i.test(location.hostname)) return null;
    const osasto = (/^\/(fathers|cathen|summa)\/([^/]+)\.htm$/i.exec(location.pathname) || []);
    if (!osasto[1] || !document.getElementById('springfield2')) return null;
    const maar = [], laskuri = { n: 0 };
    const h1 = document.querySelector('#springfield2 h1');
    let otsikko = h1 ? rivi(h1.textContent) : '';
    // Sisällysluettelon osat ryhmiksi väliotsikoittain: [{ nimi, linkit: [{ u, nimi }] }].
    const ryhmat = (d, oma) => {
      const r = [{ nimi: '', linkit: [] }];
      const juuri = d.getElementById('springfield2');
      if (!juuri) return r;
      const w = d.createTreeWalker(juuri, NodeFilter.SHOW_ELEMENT);
      for (let x = w.nextNode(); x; x = w.nextNode()) {
        if (/^H[2-4]$/.test(x.tagName)) r.push({ nimi: rivi(x.textContent), linkit: [] });
        if (x.tagName !== 'A' || !x.getAttribute('href')) continue;
        let u; try { u = new URL(x.getAttribute('href'), oma); } catch (e) { continue; }
        const t = (/^\/fathers\/([^/]+)\.htm$/i.exec(u.pathname) || [])[1];
        if (!t || u.hash || !NA_ISANTA.test(u.href)) continue;
        const ryhma = r[r.length - 1];
        if (!ryhma.linkit.some(l => l.u === u.href)) ryhma.linkit.push({ u: u.href, t, nimi: rivi(x.textContent) });
      }
      return r.filter(g => g.linkit.length);
    };
    let osat = null, nimi = otsikko, lahde = osoite;
    if (osasto[1] === 'fathers') {
      // Sisällysluettelosivu: lapsitiedostot alkavat sivun omalla numerolla, eikä niiden ulkopuolella ole tekstiä.
      const omat = ryhmat(document, osoite).map(g => ({ nimi: g.nimi, linkit: g.linkit.filter(l => l.t.startsWith(osasto[2]) && l.t.length > osasto[2].length) })).filter(g => g.linkit.length);
      if (omat.length) {
        const raaka = document.getElementById('springfield2').cloneNode(true);
        raaka.querySelectorAll('script, style, .pub, h1, h2, h3, h4, [class^="catholicadnet"], [class*="CMtag"]').forEach(x => x.remove());
        raaka.querySelectorAll('a[href*="gumroad.com"]').forEach(a => { if (raaka.contains(a)) (a.closest('p') || a).remove(); });
        raaka.querySelectorAll('p, li, td').forEach(p => { if (raaka.contains(p) && p.querySelector('a[href]')) p.remove(); });
        if (kkSanoja(raaka) < 60) osat = omat;
      }
      // Luvun sivu: murupolun viimeinen linkki on teoksen sisällysluettelo, josta otetaan luvun väliotsikon alla olevat sivut.
      const muru = document.querySelector('.breadcrumbs');
      const ylalinkki = muru && [...muru.querySelectorAll('a[href]')].pop();
      if (!osat && muru && ylalinkki && /\bchapter\b/i.test(rivi(muru.lastChild && muru.lastChild.textContent))) {
        const yla = new URL(ylalinkki.getAttribute('href'), osoite).href, yd = await hae(yla);
        const g = yd && ryhmat(yd, yla).find(x => x.linkit.some(l => l.u === osoite));
        const yh = yd && yd.querySelector('#springfield2 h1');
        if (g && g.linkit.length >= 3) { osat = [g]; nimi = [yh ? rivi(yh.textContent) : '', g.nimi].filter(Boolean).join(', '); lahde = yla; }
      }
    }
    if (osat && osat.reduce((n, g) => n + g.linkit.length, 0) > KK_RAJA) { osat = null; lahde = osoite; }
    const el = document.createElement('div');
    let sivuja = 1;
    if (osat) {
      const kaikki = osat.flatMap(g => g.linkit);
      const docs = await kkHae(kaikki.map(l => l.u));
      sivuja = 0;
      const ryhmaOtsikot = osat.length > 1 && osat.some(g => g.nimi);
      osat.forEach(g => {
        if (ryhmaOtsikot && g.nimi) { const h = document.createElement('h2'); h.textContent = g.nimi; el.appendChild(h); }
        g.linkit.forEach(l => {
          const d = l.u === osoite ? document : docs[kaikki.indexOf(l)];
          const r = d && naRunko(d, maar, laskuri);
          if (!r) return;
          sivuja++;
          kkSiirra(r, ryhmaOtsikot ? 3 : 2);
          const h = document.createElement(ryhmaOtsikot ? 'h3' : 'h2');
          h.textContent = l.nimi;
          el.appendChild(h);
          el.append(...r.childNodes);
        });
      });
      otsikko = nimi;
    } else {
      const r = naRunko(document, maar, laskuri);
      if (!r || kkSanoja(r) < 40) return null;
      // Homilian raamatunkohta ensimmäisenä lyhyenä kappaleena (Romans 1:1-2) kursiiviksi: Luinissa alaotsikko eikä tietorivi.
      const ens = [...r.children].find(x => rivi(x.textContent));
      if (ens && ens.tagName === 'P' && /^(?:[1-3]\s)?\p{Lu}[\p{L}.]+(?:\s\p{Lu}[\p{L}.]+)?\s\d+:\d+(?:[-–]\d+)?(?:,\s?\d+(?:[-–]\d+)?)*$/u.test(rivi(ens.textContent))) {
        const em = document.createElement('em');
        while (ens.firstChild) em.appendChild(ens.firstChild);
        ens.appendChild(em);
      }
      el.append(...r.childNodes);
    }
    kkTasoita(el);
    el.normalize();
    // Tietolohko.
    const pub = id => rivi((document.getElementById(id) || {}).textContent).replace(/[.,;]+$/, '');
    // Kustantajan lyhenteen piste jää (Co.).
    const paikkaJa = id => {
      const s = rivi((document.getElementById(id) || {}).textContent).replace(/[,;]+$/, ''), m = /^(.*?):\s*(.*)$/.exec(s);
      return !s ? {} : m ? { paikka: m[1], kustantaja: m[2] } : { kustantaja: s };
    };
    // Translated by J. Walker, J. Sheppard and H. Browne, and revised by George B. Stevens.
    const kaannos = s => {
      const m = /^(.*?),?\s+(?:and\s+)?revised by\s+(.*)$/i.exec(s.replace(/^.*?translated by\s+/i, ''));
      const k = kkKaantaja(kkNimet(m ? m[1] : s.replace(/^.*?translated by\s+/i, '')));
      return k && m ? k + '; tarkistanut ' + kkLuettelo(kkNimet(m[2])).replace(/ & ([^&]*)$/, ' ja $1') : k;
    };
    const tulos = { html: irrota([el]).innerHTML, otsikko, sivusto: NA_NIMI, lahde, maar,
      naytto: NA_NIMI + (sivuja > 1 ? ' (' + sivuja + ' sivua)' : '') };
    if (osasto[1] === 'fathers') {
      const ots = /\(([^()]*)\)\s*$/.exec(rivi(document.title));
      tulos.tekija = ots ? rivi(ots[1].replace(/^(St\.|Saint|Pope|Blessed|Bl\.)\s+/i, '')) : '';
      tulos.suomentaja = kaannos(pub('srctrans'));
      tulos.teos = pub('srcwork');
      tulos.numero = (/(\d+)/.exec(pub('srcvolume')) || [])[1] || '';
      tulos.toimittaja = kkLuettelo(kkNimet(pub('srced').replace(/^edited by\s+/i, '')));
      Object.assign(tulos, paikkaJa('srcpublisher'));
      tulos.julkaistu = (/\d{4}/.exec(pub('srcyear')) || [])[0] || '';
    } else if (osasto[1] === 'cathen') {
      const t = pub('mlaauthor'), m = /^([^,]+),\s*([^,]+)$/.exec(t);
      tulos.tekija = m ? m[2] + ' ' + m[1] : t;
      tulos.teos = pub('mlawork');
      tulos.numero = (/(\d+)/.exec(pub('mlavolume')) || [])[1] || '';
      Object.assign(tulos, paikkaJa('mlapublisher'));
      tulos.julkaistu = (/\d{4}/.exec(pub('mlayear')) || [])[0] || '';
    } else {
      // Summa: tietolohko on <br>-riveinä.
      const p = document.querySelector('.pub');
      const rivit = p ? p.innerHTML.split(/<br\s*\/?>/i).map(h => rivi(jasenna(h).body.textContent)) : [];
      const osa = /\(([^,()]+),\s*Q\.\s*\d+\)\s*$/.exec(rivi(document.title));
      tulos.tekija = 'Thomas Aquinas';
      tulos.teos = 'Summa Theologiae' + (osa ? ', ' + osa[1] : '');
      const kaant = rivit.find(r => /translated by/i.test(r));
      tulos.suomentaja = kaant ? kkKaantaja([rivi(kaant.replace(/^.*?translated by\s+/i, ''))]) : '';
      tulos.julkaistu = ((rivit.find(r => /edition/i.test(r)) || '').match(/\b(1[89]\d\d|20\d\d)\b/) || [])[0] || '';
      const oik = rivit.find(r => /copyright/i.test(r));
      if (oik) tulos.oikeus = { teksti: oik, lahde: osoite };
    }
    return tulos;
  }

  /* Christian Classics Ethereal Library (ccel.org; käyttäjän pyyntö 14.11.2026). Lukijan sivu (#theText .book-content) on yksi
     sisällysluettelon kohta: ANF- ja NPNF-niteissä luku (Justinoksen 1. apologia 68 sivua), muissa kirjoissa usein luku tai
     osa. Sisällysluettelo tulee osoitteesta /book/menu/<tekijä>/<teos>/<versio>/toc/html (li.TOCn, sisäkkäisyys tasosta).
     Leikattava kohta: sivu, jolla on alakohtia, alakohtineen; lyhyt (alle KK_LYHYT sanaa) lehtisivu, jolla on vähintään
     kaksi sisarta, ylemmän kohdan kanssa (Ignatiuksen Efesolaiskirjeen luku → koko kirje); pitkä lehtisivu (Khrysostomoksen
     homilia) yksin. Alaviitteet: sup.Note → div.footer_note (span.mnote on sama viite marginaalissa, pois). Sivunumerot
     (span.pb), hakemistomerkit (span.index), selauspalkit ja viivakappaleet pois; Raamatun ja muut sivuston linkit tekstiksi.
     Osan otsikko: sivun h1–h4; ilman niitä (NPNF:n Tunnustukset, ANF:n Tertullianus: otsikot luokiteltuina kappaleina)
     sisällysluettelon nimi, kun se ei ole katkaistu (…), ja alun toisto (I. ↔ Chapter I) pois, muuten kappale, jonka
     teksti sisältää katkaistun nimen (lyhyt edeltävä Book I. -kappale menee otsikoksi). Tekijä: ANF:n versaali ylin kohta
     (IGNATIUS, JUSTIN MARTYR), muuten välilehden otsikon alku (Martin Luther: …), paitsi Schaffin kokoelmissa. Teos
     selauspalkin kirjan nimestä (ANF01. The Apostolic Fathers …). Mitattu 14.11.2026. */
  const CCEL_NIMI = 'Christian Classics Ethereal Library';
  const CCEL_ISANTA = /^https?:\/\/([a-z0-9-]+\.)*ccel\.org(\/|$)/i;
  function ccelSivu(d, n, syvyys, maar, laskuri, teosNimi = '') {
    const s = d && (d.querySelector('#theText .book-content') || d.querySelector('.book-content'));
    if (!s) return null;
    const el = s.cloneNode(true);
    el.querySelectorAll('script, style, span.pb, span.index, span.mnote, hr, table.book_navbar').forEach(x => x.remove());
    const viit = new Map();
    el.querySelectorAll('.footer_note[id]').forEach(f => viit.set(f.id, f));
    el.querySelectorAll('sup.Note').forEach(sup => {
      const a = sup.querySelector('a[href^="#"]'), f = a && viit.get(a.getAttribute('href').slice(1));
      const k = f && (f.querySelector('span.Footnote') || f).cloneNode(true);
      if (k) { k.querySelectorAll('sup').forEach(x => { if (x.querySelector('a.NoteRef')) x.remove(); }); kkLinkit(k, CCEL_ISANTA); }
      const t = k ? muunna(k.innerHTML, 'inlined').trim() : '';
      if (!t) { sup.remove(); return; }
      const tunnus = 'cc' + (++laskuri.n);
      sup.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('div.footnotes').forEach(x => x.remove());
    kkLainaukset(el);
    kkLinkit(el, CCEL_ISANTA);
    el.querySelectorAll('p, div').forEach(p => { if (el.contains(p) && !p.querySelector('img, table') && /^[\s—–\-_*·.]*$/.test(p.textContent)) p.remove(); });
    // Otsikko.
    const hs = el.querySelectorAll(OTSIKOT);
    let nimi = '';
    if (hs.length) {
      if (!syvyys) { nimi = kkOtsikkoTeksti(hs[0]); hs[0].remove(); }
      kkSiirra(el, syvyys);
      return { el, nimi };
    }
    const navi = rivi((d.querySelector('.book_navbar_title') || {}).textContent);
    const katkaistu = t => /(\.\.\.|…)$/.test(t) || t.length >= 75;
    const tiivis = x => rivi(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const kpl = [...el.children].filter(x => rivi(x.textContent)).slice(0, 6);
    const nimiT = [n.nimi, navi].find(x => x && !katkaistu(x)) || n.nimi || navi;
    const alku = tiivis(katkaistu(nimiT) ? nimiT.replace(/(\.\.\.|…)$/, '').replace(/\s+\S*$/, '') : nimiT);
    // Kappale, jossa nimi on kokonaisena (Chapter II.—That the God …): se otsikoksi; lyhyt edeltävä osan nimi (Book I.) ensin.
    const i = alku.length >= 4 ? kpl.findIndex(p => rivi(p.textContent).length <= 300 && tiivis(p.textContent).includes(alku)) : -1;
    const ed = i > 0 ? kpl[i - 1] : null;
    if (ed && KK_OSA.test(rivi(ed.textContent))) { nimi = rivi(ed.textContent); ed.remove(); }
    else if (i >= 0) { nimi = rivi(kpl[i].textContent); kpl[i].remove(); }
    else nimi = rivi(nimiT);
    // Toistot pois: alun lyhyet kappaleet, jotka sisältyvät otsikkoon (I. ↔ Chapter I.; Homily I. ja Acts I. 1, 2 ↔ Homily I on Acts i. 1, 2)
    // tai toistavat teoksen nimen (Tertullianuksen Apologian 1. luku: Apology.).
    const t = tiivis(nimi), tn = tiivis(teosNimi);
    kpl.forEach(p => { const x = tiivis(p.textContent); if (el.contains(p) && x && rivi(p.textContent).length <= 60 && (t.includes(x) || x === tn)) p.remove(); });
    if (syvyys && nimi) { const h = document.createElement('h' + Math.min(6, 1 + syvyys)); h.textContent = nimi; el.insertBefore(h, el.firstChild); }
    return { el, nimi };
  }
  async function ccel() {
    if (!/(^|\.)ccel\.org$/i.test(location.hostname)) return null;
    const oma = document.querySelector('#theText .book-content');
    const sid = (document.querySelector('a#book_section_id[name], #book_section_id[name]') || { getAttribute: () => '' }).getAttribute('name');
    const tunnus = k => ((document.querySelector('input[name="' + k + 'ID[]"]') || {}).value || '').trim();
    const tek = tunnus('author'), teos = tunnus('work'), versio = tunnus('version') || teos;
    if (!oma || !sid || !tek || !teos) return null;
    const toc = await hae(location.origin + '/book/menu/' + tek + '/' + teos + '/' + versio + '/toc/html');
    const solmut = [], juuret = [], pino = [];
    if (toc) toc.querySelectorAll('li[class*="TOC"]').forEach(li => {
      const taso = +((/\bTOC(\d+)\b/.exec(li.className) || [])[1] || 0), a = li.querySelector('a.TOC[href]');
      if (!taso || !a) return;
      const n = { id: (li.id || '').replace(/^toc/, ''), href: new URL(a.getAttribute('href'), location.origin).href,
        nimi: rivi(a.getAttribute('title') || a.textContent), taso, lapset: [], yla: null };
      while (pino.length && pino[pino.length - 1].taso >= taso) pino.pop();
      if (pino.length) { n.yla = pino[pino.length - 1]; n.yla.lapset.push(n); } else juuret.push(n);
      pino.push(n); solmut.push(n);
    });
    const tiedosto = u => (/[^/]*$/.exec(u.split(/[?#]/)[0]) || [''])[0];
    // Sisällysluettelon tunniste voi puuttua edestä (NPNF:n Tunnustukset: tocI_1 ↔ vi.I_1).
    const nyk = solmut.find(n => n.id === sid) || solmut.find(n => tiedosto(n.href) === tiedosto(location.pathname)) ||
      solmut.filter(n => n.id && sid.endsWith('.' + n.id)).sort((a, b) => b.id.length - a.id.length)[0] ||
      { id: sid, href: osoite, nimi: '', taso: 1, lapset: [], yla: null };
    const litistä = n => [n, ...n.lapset.flatMap(litistä)];
    let juuri = nyk;
    if (!nyk.lapset.length && nyk.yla && nyk.yla.lapset.length >= 3 && kkSanoja(oma) < KK_LYHYT) juuri = nyk.yla;
    let sivut = litistä(juuri);
    if (sivut.length > KK_RAJA) { juuri = nyk; sivut = litistä(nyk).length <= KK_RAJA ? litistä(nyk) : [nyk]; }
    // Myös nykyinen sivu haetaan: lukijan skriptit muuttavat elävää sivua (viitteiden näyttötapa).
    const docs = sivut.length > 1 || sivut[0] !== nyk ? await kkHae(sivut.map(n => n.href)) : [];
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    let otsikko = '', sivuja = 0;
    sivut.forEach((n, i) => {
      const d = docs[i] || (n === nyk ? document : null);
      let syvyys = 0;
      for (let x = n; x && x !== juuri; x = x.yla) syvyys++;
      const s = ccelSivu(d, n, syvyys, maar, laskuri, otsikko);
      if (!s) return;
      sivuja++;
      if (n === juuri) otsikko = s.nimi;
      el.append(...s.el.childNodes);
    });
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const isoAlku = s => s.toLowerCase().split(/\s+/).map((w, i) => i && /^(of|the|and|de|von)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    // Kirja välilehden otsikosta (Martin Luther: Commentary on … - Christian Classics Ethereal Library); selauspalkissa on lyhenne (NPNF (V1-11)).
    const alku = /^([^:]+):\s/.exec(rivi(document.title));
    const kirja = alku ? rivi(rivi(document.title).slice(alku[0].length).replace(/\s*-\s*Christian Classics Ethereal Library\s*$/i, ''))
      : rivi((document.getElementById('nav-workTitle') || {}).textContent);
    otsikko = otsikko || juuri.nimi;
    // Pelkkä osan nimi (Book I., CHAPTER I): eteen ylemmän kohdan tai kirjan nimi.
    if (KK_OSA.test(otsikko)) {
      const osa = (otsikko === otsikko.toUpperCase() ? isoAlku(otsikko) : otsikko).replace(/\.$/, '');
      const yla = juuri.yla && juuri.yla.nimi && !/(\.\.\.|…)$/.test(juuri.yla.nimi) ? juuri.yla.nimi : kirja;
      otsikko = yla ? yla.replace(/\.$/, '') + ', ' + osa : osa;
    }
    otsikko = otsikko.replace(/(?<!\b(?:etc|St|Co|[A-Za-z]))\.$/, '');
    let ylin = juuri;
    while (ylin.yla) ylin = ylin.yla;
    const versaali = ylin !== juuri && /\p{Lu}/u.test(ylin.nimi) && ylin.nimi === ylin.nimi.toUpperCase() && !/\d/.test(ylin.nimi) && ylin.nimi.split(/\s+/).length <= 4;
    // Schaffin niteen nimessä pyhimys (NPNF1-11. Saint Chrysostom: Homilies …).
    const pyha = /^(?:ANF|NPNF)[\d-]+\.\s+(?:Saint|St\.)\s+([^:]+):/.exec(kirja);
    const tekija = versaali ? isoAlku(ylin.nimi) : tek !== 'schaff' && alku ? rivi(alku[1]) : pyha ? rivi(pyha[1]) : '';
    return { html: irrota([el]).innerHTML, otsikko, tekija, teos: kirja && kirja !== otsikko ? kirja : '', sivusto: CCEL_NIMI, lahde: juuri.href,
      maar, naytto: CCEL_NIMI + (sivuja > 1 ? ' (' + sivuja + ' sivua)' : '') };
  }

  /* Il Tascabile ja Doppiozero (käyttäjän pyyntö 16.11.2026, pahvin B4: italialaiset esseelehdet; kuvat, mainokset ja
     liittyvät artikkelit pois). Il Tascabile (Treccani, WordPress): article.single, otsake .single__header (.single__title,
     .single__author, .single__date, .single__excerpt), teksti .single__content ilman jakonappeja (.single__share).
     Nostolainaukset ovat blockquote.blockquote-lohkoja, joissa on pelkkä lihavointi: Readability jätti ne keskelle tekstiä.
     Haastattelun kysymykset (h3.qa__question) tulivat otsikoiksi: ne ovat lihavoituja kappaleita, vastaukset (div.qa__answer)
     kappaleita. Ei mainoksia (vain Google Analytics) eikä lahjoituspyyntöä. Doppiozero (Drupal): article.articolo-doppiozero,
     h1.titolo-articolo, .autori, .data-articolo (7 Novembre 2026), teksti .field--name-body. Lopun Leggi anche -kappale
     (liittyvät artikkelit) ja kansikuvan tiedot (In copertina …) pois; tukipyyntö on tekstin ulkopuolella. Lahjoituksia
     pyydetään, mainoksia ei ole. Ingressiä ei oteta (kuten Psyche–Aeonissa). Mitattu 16.11.2026. */
  const IT_KUUKAUDET = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  function itPvm(s) {
    const m = /(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u.exec(rivi(s));
    const k = m ? IT_KUUKAUDET.indexOf(m[2].toLowerCase()) : -1;
    return k >= 0 ? m[3] + '-' + String(k + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0') : '';
  }
  function itSiivoa(el) {
    el.querySelectorAll('figure, img, picture, video, iframe, script, style, noscript, form, button, svg, .wp-caption, .single__share').forEach(x => x.remove());
  }
  async function iltascabile() {
    if (!/(^|\.)iltascabile\.com$/i.test(location.hostname)) return null;
    // Teksti ei ole article.singlen sisällä (jäsentäjä sulkee sen aiemmin), joten haetaan koko sivulta.
    const art = document;
    const runko = document.querySelector('article.single') && document.querySelector('.single__content');
    if (!runko) return null;
    const el = runko.cloneNode(true);
    itSiivoa(el);
    // Nostolainaus: lähes koko teksti lihavoitu (myös useana palana, piste lihavoinnin ulkopuolella).
    el.querySelectorAll('blockquote.blockquote').forEach(b => {
      const lih = [...b.querySelectorAll('strong, b')].filter(x => !x.parentElement.closest('strong, b')).reduce((n, x) => n + rivi(x.textContent).length, 0);
      if (lih >= 0.9 * rivi(b.textContent).length) b.remove();
    });
    el.querySelectorAll('.qa__question').forEach(q => {
      const p = document.createElement('p'), s = document.createElement('strong');
      s.textContent = rivi(q.textContent); p.appendChild(s); q.replaceWith(p);
    });
    el.querySelectorAll('.qa__answer').forEach(a => { const p = document.createElement('p'); p.innerHTML = a.innerHTML; a.replaceWith(p); });
    // Kysymys–vastaus-parien väliset <br>:t ja niiden ympärille jääneet tyhjät kappaleet pois.
    el.querySelectorAll('br').forEach(b => { if (b.parentElement && (b.parentElement === el || !b.parentElement.closest('p'))) b.remove(); });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent)) x.remove(); });
    if (kkSanoja(el) < 50) return null;
    const t = sel => rivi((art.querySelector(sel) || {}).textContent);
    const tekijat = [...document.querySelectorAll('.single__header .single__author')].map(a => rivi(a.textContent)).filter(Boolean);
    const aika = (document.querySelector('meta[property="article:published_time"]') || {}).content || '';
    return { html: irrota([el]).innerHTML, otsikko: t('.single__title'), tekija: tekijat.join(' & '), sivusto: 'Il Tascabile',
      julkaistu: aika.slice(0, 10) || itPvm(t('.single__date')), lahde: osoite };
  }
  async function doppiozero() {
    if (!/(^|\.)doppiozero\.com$/i.test(location.hostname)) return null;
    const art = document.querySelector('article.articolo-doppiozero');
    const runko = art && art.querySelector('.field--name-body');
    if (!runko) return null;
    const el = runko.cloneNode(true);
    itSiivoa(el);
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent);
      if (/^leggi anche\b/i.test(t) || /^in copertina\b/i.test(t) && t.length < 300) p.remove();
    });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' '))) x.remove(); });
    if (kkSanoja(el) < 50) return null;
    const t = sel => rivi((art.querySelector(sel) || {}).textContent);
    const tekijat = [...art.querySelectorAll('.autori a')].map(a => rivi(a.textContent)).filter(Boolean);
    return { html: irrota([el]).innerHTML, otsikko: t('h1.titolo-articolo, h1'), tekija: tekijat.join(' & '), sivusto: 'Doppiozero',
      julkaistu: itPvm(t('.data-articolo')), lahde: osoite };
  }

  /* Bryn Mawr Classical Review (bmcr.brynmawr.edu; käyttäjän pyyntö 16.11.2026, pahvin A6: kuten NDPR, kreikka ja latina
     koskemattomina). Arvio: .ref-id (BMCR 2026.10.35), h1.entry-title (kirjan nimi), .entry-citation (kirjan tiedot),
     .meta-affiliation (arvioija span[itemprop=name], yliopisto, sähköposti), meta[itemprop=dateModified] (October 1, 2026) ja
     [itemprop=reviewBody] (Wordin kappaleet, Google Books -esikatselulinkki Preview, lihavoitu Notes ja Wordin viitteet
     _ftnref1 ↔ _ftn1; kokoomateoksessa lihavoitu Authors and titles ja luettelo). Kirjan tiedot ensimmäiseksi kappaleeksi,
     arvioija(t) tekijäksi, BMCR ja numero etukenttään kuten NDPR:ssä. Preview-linkki, tyhjät kappaleet ja Notes-otsake pois,
     viitteet alaviitteiksi, muut lihavoidut otsakekappaleet (Authors and titles) otsikoiksi. Tekstiä ei muuteta, joten
     kreikka ja latina säilyvät sellaisinaan. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 16.11.2026. */
  const BMCR_NIMI = 'Bryn Mawr Classical Review';
  const EN_KUUKAUDET = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  async function bmcr() {
    if (!/(^|\.)bmcr\.brynmawr\.edu$/i.test(location.hostname)) return null;
    const runko = document.querySelector('[itemprop="reviewBody"]');
    const h1 = document.querySelector('h1.entry-title');
    if (!runko || !h1) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('figure, img, script, style, form').forEach(x => x.remove());
    el.querySelectorAll('p').forEach(p => { if (/^preview$/i.test(rivi(p.textContent)) && p.querySelector('a')) p.remove(); });
    const maar = samanSivunViitteet(el, 'bm');
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('br')) x.remove(); });
    // Kokonaan lihavoitu lyhyt kappale on otsake: Notes (viitteet siirtyivät) pois, muut otsikoiksi.
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent), b = p.querySelector('strong, b');
      if (!b || rivi(b.textContent) !== t || t.length > 60) return;
      if (/^(notes?|endnotes|footnotes)$/i.test(t)) { if (!p.nextElementSibling || /^H[1-6]$/.test(p.nextElementSibling.tagName)) p.remove(); return; }
      const h = document.createElement('h2');
      h.textContent = t;
      p.replaceWith(h);
    });
    if (kkSanoja(el) < 50) return null;
    const cit = document.querySelector('.entry-citation');
    if (cit) { const p = document.createElement('p'), s = document.createElement('strong'); s.append(...cit.cloneNode(true).childNodes); p.appendChild(s); el.prepend(p); }
    const tekijat = [...document.querySelectorAll('.meta-affiliation [itemprop="name"]')].map(x => rivi(x.textContent)).filter(Boolean);
    const nro = rivi((document.querySelector('.ref-id') || {}).textContent).replace(/^BMCR\s*/i, '');
    const pm = /(\p{L}+)\s+(\d{1,2}),\s*(\d{4})/u.exec(rivi((document.querySelector('meta[itemprop="dateModified"]') || {}).content));
    const kk = pm ? EN_KUUKAUDET.indexOf(pm[1].toLowerCase()) : -1;
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), tekija: tekijat.join(' & '), tyyppi: 'tieteellinen',
      teos: BMCR_NIMI, numero: nro, julkaistu: kk >= 0 ? pm[3] + '-' + String(kk + 1).padStart(2, '0') + '-' + pm[2].padStart(2, '0') : (/^(\d{4})/.exec(nro) || [''])[0],
      lahde: osoite, maar, naytto: BMCR_NIMI };
  }

  /* Notre Dame Philosophical Reviews (ndpr.nd.edu; käyttäjän pyyntö 16.11.2026, pahvin A5). Arvio: header (h1 arvioitavan kirjan
     nimi, .meta-item__bibliography: kirjan tiedot lihavoituna kappaleena, p.meta-item__reviewer Reviewed by Nimi, Yliopisto,
     p.meta-item__edition 2025.10.3, meta[property=datePublished]) ja .article-content (Wordin kappaleet, kirjan kansikuva,
     REFERENCES lihavoituna kappaleena, Wordin loppuviitteet _ednref1 ↔ _edn1 viivan alla). Kirjan tiedot ensimmäiseksi
     kappaleeksi (lukija näkee, mitä arvioidaan), arvioija tekijäksi ilman yliopistoa, numero ja lehti etukenttään kuten
     European Journal of Psychoanalysisissa (tyyppi tieteellinen, teos ja numero ilman sivustoa). Kansikuva pois, lihavoitu
     References-kappale otsikoksi (md.js:n kirjallisuusluettelo), viitteet alaviitteiksi (samanSivunViitteet). Ei mainoksia;
     lahjoituspyyntöä ei ole. Mitattu 16.11.2026. */
  const NDPR_NIMI = 'Notre Dame Philosophical Reviews';
  async function ndpr() {
    if (!/(^|\.)ndpr\.nd\.edu$/i.test(location.hostname)) return null;
    const runko = document.querySelector('.article-content');
    const h1 = document.querySelector('h1.page-title, article h1');
    if (!runko || !h1) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('figure, img, script, style, form').forEach(x => x.remove());
    // Viiva viitteiden edellä pois (viitteet siirtyvät alaviitteiksi).
    el.querySelectorAll('hr').forEach(x => x.remove());
    // Lihavoitu tai versaalein kirjoitettu kappale (REFERENCES, Works Cited) otsikoksi.
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent);
      if (!/^(references|works cited|bibliography|literature)$/i.test(t) || !p.querySelector('strong, b') && t !== t.toUpperCase()) return;
      const h = document.createElement('h2');
      h.textContent = t.charAt(0) + t.slice(1).toLowerCase();
      p.replaceWith(h);
    });
    const maar = samanSivunViitteet(el, 'nd');
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('br')) x.remove(); });
    if (kkSanoja(el) < 50) return null;
    const bib = document.querySelector('.meta-item__bibliography');
    if (bib) el.prepend(...[...bib.children].map(x => x.cloneNode(true)));
    const arv = rivi((document.querySelector('.meta-item__reviewer meta[property="name"]') || {}).content) ||
      rivi((document.querySelector('.meta-item__reviewer') || {}).textContent).replace(/^Reviewed by\s+/i, '');
    // Arvioija ilman yliopistoa (Lara Ostaric, Temple University); kaksi arvioijaa (A, Univ, and B, Univ).
    const tekijat = arv.split(/\s+and\s+/).map(x => rivi(x.split(',')[0])).filter(Boolean);
    const pv = (document.querySelector('meta[property="datePublished"]') || {}).content || '';
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), tekija: tekijat.join(' & '), tyyppi: 'tieteellinen',
      teos: NDPR_NIMI, numero: rivi((document.querySelector('.meta-item__edition') || {}).textContent), julkaistu: pv.slice(0, 10),
      lahde: osoite, maar, naytto: NDPR_NIMI };
  }

  /* Open Yale Courses (oyc.yale.edu; käyttäjän pyyntö 16.11.2026, pahvin B2): luennon sivu /<ala>/<kurssi>/lecture-N, jolla on
     Overview (.session-full__body) ja litteraatio piilotettuna (#inline_content: h1 kurssin nimi, h2 PHIL 176 - Lecture 1 -
     Course Introduction, luvut h3 Chapter 1. … [00:00:00], puhujat lihavoituina, [end of transcript], Back to Top).
     Readability antoi litteraation, mutta otsikko toistui kolmesti, aikaleimat jäivät otsikoihin, eikä tekijää, kurssia eikä
     tiivistelmää tullut. Jokainen luento omana leikkeenään (pahvin linjaus). Overview omaksi osiokseen, luvut otsikoiksi ilman
     aikaleimaa, loppumerkintä ja paluulinkki pois. Tekijä puhujamerkinnästä (Professor Shelly Kagan:), vuosi kurssisivulta
     (recorded for Open Yale Courses in Spring 2007; yksi sivu samalta sivustolta), lisenssi sivun alatunnisteesta.
     Ei mainoksia eikä lahjoituspyyntöä. Mitattu 16.11.2026. */
  const OYC_NIMI = 'Open Yale Courses';
  async function oyc() {
    if (!/(^|\.)oyc\.yale\.edu$/i.test(location.hostname)) return null;
    const lm = /^(\/[^/]+\/[^/]+)\/lecture-\d+\/?$/.exec(location.pathname);
    const lit = document.getElementById('inline_content');
    if (!lm || !lit) return null;
    const el = document.createElement('div');
    const aika = /\s*\[\d{1,2}:\d\d:\d\d\]\s*/g;
    // Tiivistelmä.
    const yl = document.querySelector('.session-full__body');
    const ylp = yl ? [...yl.querySelectorAll('p')].filter(p => rivi(p.textContent)) : [];
    if (ylp.length) {
      // Samalle tasolle kuin litteraation luvut (h3).
      const h = document.createElement('h3');
      h.textContent = rivi((yl.querySelector('.session-full__body-label') || {}).textContent) || 'Overview';
      el.append(h, ...ylp.map(p => p.cloneNode(true)));
    }
    const k = lit.cloneNode(true);
    const kurssi = rivi((k.querySelector('h1') || {}).textContent);
    const h2 = rivi((k.querySelector('h2') || {}).textContent);
    k.querySelectorAll('h1, h2, a[href="#transcript-top"], script, style').forEach(x => x.remove());
    // <p><h3>…</h3><p>… on rikkinäistä HTML:ää: jäsentäjä tekee tyhjiä kappaleita, jotka poistuvat.
    k.querySelectorAll('p').forEach(p => { if (/^\[\s*end of transcript\s*\]$/i.test(rivi(p.textContent))) p.remove(); });
    k.querySelectorAll('h3, h4').forEach(h => { h.textContent = rivi(h.textContent.replace(aika, ' ')); });
    el.append(...k.childNodes);
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent)) p.remove(); });
    kkTasoita(el);
    if (kkSanoja(el) < 100) return null;
    // Puhuja (Professor Shelly Kagan:) useimmin toistuvasta professorimerkinnästä.
    const puhujat = new Map();
    el.querySelectorAll('strong, b').forEach(b => {
      const m = /^Professor\s+(.+?):?$/.exec(rivi(b.textContent));
      if (m) puhujat.set(m[1].replace(/:$/, ''), (puhujat.get(m[1]) || 0) + 1);
    });
    const tekija = [...puhujat].sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || '';
    // Luennon nimi ilman kurssikoodia (PHIL 176 - Lecture 1 - Course Introduction → Lecture 1 - Course Introduction).
    const nimi = rivi((document.querySelector('.session-full__title') || {}).textContent) || h2.replace(/^[A-Z]{2,5}\s*\d+[a-z]?\s*-\s*/, '');
    const kd = await hae(location.origin + lm[1]);
    const v = kd && /recorded for Open Yale Courses in (?:Spring|Fall|Summer|Winter)?\s*((?:19|20)\d\d)/i.exec(rivi(kd.body && kd.body.textContent));
    const lis = document.querySelector('.footer__cp_wrapper_acc_statement');
    const lt = lis && (rivi(lis.textContent).match(/^.*?\.(?=\s|$)/) || [''])[0];
    return { html: irrota([el]).innerHTML, otsikko: nimi, teos: kurssi && kurssi !== nimi ? kurssi : '', tekija, sivusto: OYC_NIMI,
      julkaistu: v ? v[1] : '', lahde: osoite, maar: [], oikeus: lt ? { teksti: lt, lahde: 'https://oyc.yale.edu/terms' } : null };
  }

  /* Internet Encyclopedia of Philosophy (iep.utm.edu; käyttäjän pyyntö 16.11.2026, pahvin A4). WordPress, runko article
     .entry-content: h1, johdanto, h3 Table of Contents ja sisäkkäinen ol (#H1, #SH1a …), osiot h2 (<a name="H1"> 1. Life),
     alaosiot h3–h5, References and Further Reading luetteloina (merkintöjen kuvaukset sisäkkäisinä ul:ina) ja h3 Author
     Information (nimi, sähköposti, yliopisto, maa). Readability antoi otsikon sivuston nimen kera, sisällysluettelon
     linkkeineen, kirjallisuuden luettelona (Luinin p.bib syntyy kappaleista) ja sähköpostiosoitteen; tekijää ei tullut.
     Sisällysluettelo, kuvat ja tekijälohko pois (tekijä etukenttään, yliopisto ei), kirjallisuus kappaleiksi (kuvaus samaan
     kappaleeseen). Ei mainoksia eikä lahjoituspyyntöä. Mitattu 16.11.2026. */
  const IEP_NIMI = 'Internet Encyclopedia of Philosophy';
  async function iep() {
    if (!/(^|\.)iep\.utm\.edu$/i.test(location.hostname)) return null;
    const runko = document.querySelector('article .entry-content');
    const h1 = runko && runko.querySelector('h1');
    if (!h1) return null;
    const el = runko.cloneNode(true);
    el.querySelector('h1').remove();
    el.querySelectorAll('img, figure, script, style, noscript, .wp-caption').forEach(x => x.remove());
    const OTS = /^H[1-6]$/;
    // Sisällysluettelo: otsikko ja sitä seuraava luettelo.
    el.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      if (!el.contains(h) || !/^table of contents$/i.test(rivi(h.textContent))) return;
      for (let n = h.nextElementSibling; n && /^(OL|UL)$/.test(n.tagName); n = h.nextElementSibling) n.remove();
      h.remove();
    });
    // Tekijälohko: ensimmäinen rivi on nimi.
    let tekija = '';
    el.querySelectorAll('h2, h3, h4').forEach(h => {
      if (!el.contains(h) || !/^author information$/i.test(rivi(h.textContent))) return;
      const p = h.nextElementSibling;
      if (p && p.tagName === 'P') {
        const k = p.cloneNode(true);
        k.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
        tekija = rivi(k.textContent.split('\n')[0]);
        p.remove();
      }
      for (let n = h.nextElementSibling; n && !OTS.test(n.tagName); n = h.nextElementSibling) n.remove();
      h.remove();
    });
    // Osion ankkuri (<a name="H1"></a>) pois otsikosta.
    el.querySelectorAll('h2 a[name], h3 a[name], h4 a[name], h5 a[name]').forEach(a => { if (!rivi(a.textContent)) a.remove(); });
    // Kirjallisuus: luettelon kohdat kappaleiksi, kuvaus (sisäkkäinen luettelo) samaan kappaleeseen.
    let bib = 0;
    [...el.children].forEach(e => {
      if (OTS.test(e.tagName)) {
        const t = +e.tagName[1];
        // Numero pois kirjallisuuden otsikosta (8. References and Further Readings): md.js tunnistaa osion vain nimestä.
        if (/^(\d+\.\s*)?(references|bibliography|further reading)/i.test(rivi(e.textContent))) { bib = t; e.textContent = rivi(e.textContent).replace(/^\d+\.\s*/, ''); }
        else if (bib && t <= bib) bib = 0;
        return;
      }
      if (!bib || !/^(UL|OL)$/.test(e.tagName)) return;
      e.replaceWith(...[...e.children].filter(li => li.tagName === 'LI').map(li => {
        const p = document.createElement('p');
        const kuvaus = [...li.querySelectorAll('ul, ol')].map(l => { const t = rivi(l.textContent); l.remove(); return t; }).filter(Boolean);
        while (li.firstChild) p.appendChild(li.firstChild);
        if (kuvaus.length) p.append(' ' + kuvaus.join(' '));
        return p;
      }));
    });
    // Tyhjät kappaleet (&nbsp;) pois.
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' '))) p.remove(); });
    kkTasoita(el);
    if (kkSanoja(el) < 50) return null;
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), tekija, sivusto: IEP_NIMI, lahde: osoite.replace(/[?#].*$/, '') };
  }

  /* Substack (alusta; käyttäjän pyyntö 16.11.2026, pahvin B3: The Convivial Society, Experimental History). Tunnistus alustasta
     (substackcdn.com-osoitteet ja .available-content .body.markup), joten omat verkkotunnukset käyvät. Readability jätti
     jakonapin (Share), maksullisen äänitteen kehotteen (Upgrade to paid to play voiceover) ja viitteet linkkiketjuiksi
     loppuun ([1][19]). Runko .body.markup: tilaus-, jako- ja sovelluskehotteet (.subscribe-widget, p.button-wrapper,
     .subscription-widget-wrap, .install-substack-app-embed …), upotetut kirjoitukset ja äänestykset, nostolainaukset
     (.pullquote) ja otsikoiden linkkinapit pois; kuvat pois, kuvateksti kursiivikappaleeksi. Viitteet (a.footnote-anchor →
     div.footnote: a.footnote-number, .footnote-content) alaviitteiksi. Etukenttä: otsikko h1.post-title, alaotsikko
     h3.subtitle, tekijä meta[name=author], julkaistu ja julkaisu JSON-LD:stä (datePublished, publisher.name). Maksumuurin
     takana olevasta kirjoituksesta tulee näkyvä osa. Mitattu 16.11.2026. */
  const SS_POIS = ['.subscribe-widget', '.subscription-widget-wrap', '.subscription-widget', 'p.button-wrapper', '.button-wrapper',
    '.captioned-button-wrap', '.install-substack-app-embed', '.digest-post-embed', '.embedded-post-wrap', '.embedded-publication-wrap',
    '.poll-embed', '.pullquote', '.paywall', '.paywall-jump', '.header-anchor-parent', '.image-link-expand', '.audio-player-wrapper',
    '.native-audio-embed', '.footnote', 'form', 'button', 'svg', 'input', 'script', 'style', 'noscript'].join(', ');
  async function substack() {
    const runko = document.querySelector('.available-content .body.markup, article .body.markup');
    if (!runko || !document.querySelector('link[href*="substackcdn.com"], script[src*="substackcdn.com"], img[src*="substackcdn.com"]')) return null;
    const el = runko.cloneNode(true);
    const maar = [];
    let n = 0;
    el.querySelectorAll('a.footnote-anchor[href^="#"]').forEach(a => {
      const id = decodeURIComponent(a.getAttribute('href').slice(1));
      const k = runko.querySelector('[id="' + CSS.escape(id) + '"]');
      const sisalto = k && k.closest('.footnote') && k.closest('.footnote').querySelector('.footnote-content');
      const ulko = a.parentElement && a.parentElement.tagName === 'SPAN' && rivi(a.parentElement.textContent) === rivi(a.textContent) ? a.parentElement : a;
      if (!sisalto) { ulko.remove(); return; }
      const v = sisalto.cloneNode(true);
      v.querySelectorAll(SS_POIS).forEach(x => x.remove());
      const t = muunna(irrota([v]).innerHTML, 'inlined').trim();
      const tunnus = 'ss' + (++n);
      if (t) maar.push(maaritelma(tunnus, t));
      ulko.replaceWith(merkki(tunnus));
    });
    // Kuva pois, kuvateksti kursiivikappaleeksi.
    el.querySelectorAll('.captioned-image-container, figure').forEach(f => {
      if (!el.contains(f)) return;
      const k = rivi((f.querySelector('figcaption, .image-caption') || {}).textContent);
      if (!k) { f.remove(); return; }
      const p = document.createElement('p'), em = document.createElement('em');
      em.textContent = k; p.appendChild(em); f.replaceWith(p);
    });
    el.querySelectorAll(SS_POIS).forEach(x => x.remove());
    // Kuvalinkit ja kuvagalleriat ilman tekstiä.
    el.querySelectorAll('a, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent) && !x.querySelector('br, hr')) x.remove(); });
    if (kkSanoja(el) < 20) return null;
    let julkaistu = '', julkaisu = '';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const j = JSON.parse(s.textContent);
        julkaistu = julkaistu || String(j.datePublished || '').slice(0, 10);
        julkaisu = julkaisu || rivi(j.publisher && j.publisher.name);
      } catch (e) {}
    });
    const t = sel => rivi((document.querySelector(sel) || {}).textContent);
    return { html: irrota([el]).innerHTML, otsikko: t('h1.post-title') || t('h1'), alaotsikko: t('h3.subtitle, .subtitle'),
      tekija: rivi((document.querySelector('meta[name="author"]') || {}).content), julkaistu, maar,
      sivusto: julkaisu || rivi((document.querySelector('meta[property="og:site_name"]') || {}).content) || location.hostname.replace(/^www\./, '') };
  }

  /* dhammatalks.org (Ṭhānissaro Bhikkhun kirjat; käyttäjän pyyntö 16.11.2026, pahvin *20 uutta sivustosovitetta* B1). Kirja on
     e-kirjan luvut omina sivuinaan (/books/<kirja>/SectionNNNN.html, runko main#content > section[epub_type]) ja kirjan
     etusivu (/books/<kirja>/), jolla on nimiö (hgroup: h1, p.subtitle, tekijä, Published <time>) ja sisällysluettelo
     (.book-toc, sisäkkäiset ul:t). Readability antoi yhden luvun, säkeet erillisinä kappaleina ja viitteet numeroina.
     Leikataan koko kirja sisällysluettelon järjestyksessä (sivut kuuden erissä, enintään KK_RAJA); luvun otsikon taso
     sisällysluettelon syvyydestä (osa ##, sen luku ###). Pois: kansi, nimiösivu, tekijänoikeussivu (lisenssi etukenttään),
     hakemistot (index-*.html: painetun kirjan sivunumerot) ja sivunumerot (span[epub_type=pagebreak]). Viitteet
     (a[epub_type=noteref] span.fn:ssä) alaviitteiksi: sivun omat (div.footnotes) ja loppuviitteet (section[epub_type=endnotes],
     li#en1.5), käytetyt pois lopusta. Säkeet (div.verse, rivit p:inä) lainaukseksi riveittäin, lainauksen lähde
     (footer cite) omaksi rivikseen viivan kera, sutta- ja sanastolinkit tekstiksi. Sivusto ei näytä mainoksia eikä pyydä
     lahjoituksia (kaikki jaetaan ilmaiseksi). Mitattu 16.11.2026. */
  const DT_NIMI = 'dhammatalks.org';
  const DT_ISANTA = /^https?:\/\/([a-z0-9-]+\.)*dhammatalks\.org(\/|$)/i;
  const DT_POLKU = /^(\/(?:[a-z]{2}\/)?books\/[^/]+\/)(?:[^/]*\.html)?$/;
  function dtSiivoa(el, d) {
    el.querySelectorAll('script, style, noscript, button, svg, img, figure, span[epub_type="pagebreak"], [role="doc-pagebreak"]').forEach(x => x.remove());
    // Otsikon rivinvaihto (The Road to Nirvāṇa<br>Is Paved …) välilyönniksi.
    el.querySelectorAll('h1 br, h2 br, h3 br, h4 br, h5 br, h6 br').forEach(b => b.replaceWith(' '));
    // Säkeet: rivit (p) yhdeksi kappaleeksi rivinvaihdoin, sisennysluokat (v2, v4) ja jatkosäkeistöt (div.verse-add) mukaan.
    [...el.querySelectorAll('div.verse')].forEach(v => {
      if (!el.contains(v) || v.parentElement.closest('div.verse')) return;
      const sakeistot = [v, ...v.querySelectorAll('div.verse-add, div.verse')];
      const ulos = [];
      sakeistot.forEach(s => {
        const rivit = [...s.children].filter(p => p.tagName === 'P' && rivi(p.textContent)).map(p => p.innerHTML.trim());
        if (rivit.length) { const p = d.createElement('p'); p.innerHTML = rivit.join('<br>'); ulos.push(p); }
      });
      if (v.parentElement && v.parentElement.tagName === 'BLOCKQUOTE') v.replaceWith(...ulos);
      else { const bq = d.createElement('blockquote'); bq.append(...ulos); v.replaceWith(bq); }
    });
    // Lainauksen lähde: — MN 19.
    el.querySelectorAll('blockquote footer').forEach(f => {
      const t = rivi(f.textContent).replace(/^[—–-]\s*/, '');
      if (!t) { f.remove(); return; }
      const p = d.createElement('p');
      p.textContent = '— ' + t;
      f.replaceWith(p);
    });
    // Luvun lopun allekirjoitus (footer: p.signature, address) kappaleiksi.
    el.querySelectorAll('footer').forEach(f => {
      const ps = [...f.querySelectorAll('p, address')].map(x => { const p = d.createElement('p'); p.innerHTML = x.innerHTML; return p; });
      f.replaceWith(...ps);
    });
    kkLinkit(el, DT_ISANTA);
  }
  async function dhammatalks() {
    if (!/(^|\.)dhammatalks\.org$/i.test(location.hostname)) return null;
    const pm = DT_POLKU.exec(decodeURIComponent(location.pathname));
    if (!pm) return null;
    const kirjaU = location.origin + pm[1];
    const kd = osoite === kirjaU ? document : await hae(kirjaU);
    const toc = kd && kd.querySelector('.book-toc');
    if (!toc) return null;
    // Sisällysluettelo: tiedostot järjestyksessä, syvyys ensimmäisestä (tiedostotason) linkistä.
    const tiedostot = [], syvyys = new Map();
    toc.querySelectorAll('a[href]').forEach(a => {
      let u;
      try { u = new URL(a.getAttribute('href'), kirjaU); } catch (e) { return; }
      const f = u.href.split('#')[0];
      if (!f.startsWith(kirjaU) || /\/(cover|index-[^/]*)\.html$/i.test(f) || syvyys.has(f)) return;
      let s = 0;
      for (let x = a.closest('ul'); x && toc.contains(x); x = x.parentElement.closest('ul')) s++;
      syvyys.set(f, Math.max(0, s - 1));
      tiedostot.push(f);
    });
    if (!tiedostot.length || tiedostot.length > KK_RAJA) return null;
    const ds = await kkHae(tiedostot);
    const osat = tiedostot.map((u, i) => ({ u, d: ds[i], s: ds[i] && ds[i].querySelector('main#content section, main section') })).filter(o => o.s);
    if (!osat.length) return null;
    // Viitteiden kohteet kaikilta sivuilta: tiedosto#tunniste → elementti.
    const kohteet = new Map();
    osat.forEach(o => o.s.querySelectorAll('[epub_type="footnote"][id], [role="doc-footnote"][id], [epub_type="endnotes"] li[id], [role="doc-endnotes"] li[id], ol.notes li[id]')
      .forEach(x => kohteet.set(o.u + '#' + x.id, x)));
    const maar = [], kaytetyt = new Set();
    let laskuri = 0, oikeus = null;
    const el = document.createElement('div');
    for (const o of osat) {
      const tyyppi = o.s.getAttribute('epub_type') || '';
      if (/titlepage|cover/.test(tyyppi)) continue;
      if (/copyright/.test(tyyppi)) {
        const l = o.s.querySelector('a[href*="creativecommons.org"]'), p = l && l.closest('p');
        if (l) oikeus = { teksti: (rivi(p.textContent).match(/^.*?\.(?=\s|$)/) || [rivi(p.textContent)])[0], lahde: l.href };
        continue;
      }
      const k = o.s.cloneNode(true);
      // Viitemerkit (span.fn > a, myös toisen sivun loppuviitteisiin).
      k.querySelectorAll('a[epub_type="noteref"], a[role="doc-noteref"]').forEach(a => {
        let avain = '';
        try { const u = new URL(a.getAttribute('href'), o.u); avain = u.href.split('#')[0] + u.hash; } catch (e) {}
        const kohde = kohteet.get(avain);
        const ulko = a.parentElement && a.parentElement.matches('span.fn, sup') && rivi(a.parentElement.textContent) === rivi(a.textContent) ? a.parentElement : a;
        if (!kohde) { ulko.remove(); return; }
        // Loppuviite on luettelon kohta (li#en1.5): sisältö ilman luettelomerkkiä.
        const v = document.createElement('div');
        v.append(...kohde.cloneNode(true).childNodes);
        v.querySelectorAll('a[epub_type="backlink"], a[role="doc-backlink"]').forEach(x => x.remove());
        dtSiivoa(v, document);
        let t = muunna(irrota([v]).innerHTML, 'inlined').trim();
        // Sivun oman viitteen numero tekstin alussa (1. AN 9:41 describes …).
        t = t.replace(new RegExp('^' + rivi(a.textContent).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\\\?\\.\\s+'), '');
        const tunnus = 'dt' + (++laskuri);
        kaytetyt.add(avain);
        if (t) maar.push(maaritelma(tunnus, t));
        const ed = ulko.previousSibling;
        if (ed && ed.nodeType === 3) ed.nodeValue = ed.nodeValue.replace(/\s+$/, '');
        ulko.replaceWith(merkki(tunnus));
      });
      k.querySelectorAll('div.footnotes, [epub_type="footnotes"]').forEach(x => x.remove());
      // Loppuviiteosio: käytetyt pois; jos mitään ei jää, koko osio pois.
      if (/endnotes|rearnotes/.test(tyyppi) || k.querySelector('ol.notes')) {
        k.querySelectorAll('li[id]').forEach(li => { if (kaytetyt.has(o.u + '#' + li.id)) li.remove(); });
        k.querySelectorAll('ol').forEach(ol => { if (!ol.querySelector('li')) ol.remove(); });
        if (!rivi([...k.children].filter(x => !/^H[1-6]$/.test(x.tagName)).map(x => x.textContent).join(' '))) continue;
      }
      dtSiivoa(k, document);
      kkSiirra(k, 1 + (syvyys.get(o.u) || 0));
      el.append(...k.childNodes);
    }
    kkTasoita(el);
    el.normalize();
    if (kkSanoja(el) < 20) return null;
    // Nimiö kirjan etusivulta.
    const hg = kd.querySelector('.book-intro hgroup, hgroup');
    const h1 = hg && hg.querySelector('h1');
    const otsikko = h1 ? kkOtsikkoTeksti(h1).replace(/:\s/, ' ') : rivi(kd.title).replace(/\s*\|.*$/, '');
    const ala = rivi(hg && hg.querySelector('p.subtitle') && hg.querySelector('p.subtitle').textContent);
    const tek = rivi(hg && hg.querySelector('p em') && hg.querySelector('p em').textContent) ||
      rivi((kd.querySelector('meta[name="author"]') || {}).content);
    const aika = hg && hg.querySelector('time[datetime]');
    const tulos = { html: irrota([el]).innerHTML, otsikko, alaotsikko: ala, tekija: tek, sivusto: DT_NIMI, lahde: kirjaU, maar, oikeus,
      julkaistu: aika ? (/^\d{4}/.exec(aika.getAttribute('datetime')) || [''])[0] : '',
      naytto: DT_NIMI + (osat.length > 1 ? ' (' + osat.length + ' sivua)' : '') };
    return tulos;
  }

  /* Korpora.org/kant (Bonnin Kant-korpus; käyttäjän pyyntö 16.11.2026: sivustoehdokkaiden opiskeluryhmän ensimmäinen).
     Akademie-Ausgaben niteet 1–23 painetun sivun mukaan: aaNN/PPP.html on yksi AA:n sivu, rivi rivinä taulukossa (rivinumero,
     teksti, rinnakkaisviittaukset omissa soluissaan). Readability antoi yhden sivun rivinumeroineen. Leikataan koko teos
     sisällysluettelon (InhaltNN.html; teos colspan 9, sen osat 8, 7 …) mukaan, sivut samalta sivustolta kuuden erissä:
     sivu kuuluu teokseen, kun sen <title> (Kant: AA IV, Grundlegung zur Metaphysik der ... , Seite 393) alkaa samoin kuin
     aloitussivun; näin putoavat myös sivuston virhesivut (aa04/386.html on AA III:n sivu). Yli KO_RAJA sivun teoksesta
     (KrV) leikataan suurin sisällysluettelon osa, joka mahtuu rajaan. Sivunumerot yläindekseiksi muodossa osa:sivu (4:393).
     Rivit kappaleiksi: tyhjä taulukkorivi on kappaleraja. Sivunvaihdossa kappale päättyy, kun sivun viimeinen rivi päättyy
     välimerkkiin ja on lyhyt (alle KO_LYHYT sivun pitkistä riveistä; mitattu Grundlegungilla ja KpV:llä: 75 % kappaleen
     loppuriveistä, väärin 4/169 kappaleen sisäisestä välimerkkirivistä). Peräkkäiset otsikkorivit ovat yksi otsikko.
     Viitteet (a[href="#1"] <sup>*</sup>) → <a name="1"> *) …) alaviitteiksi; viite on kokonaan alkusivullaan, ja
     [Seitenumbruch] on sivunvaihto viitteen sisällä. AA:n kaksoisviiva (allgemein=zweckmäßig) yhdysmerkiksi ja ajatusviiva
     ( - ) lyhyeksi ajatusviivaksi. Etusivu on kehyssivu (frameset): tekstikehys luetaan, kun lisäosa avataan sen päällä.
     Ei mainoksia eikä lahjoituspyyntöä. Mitattu 16.11.2026. */
  const KO_NIMI = 'Korpora', KO_RAJA = 250, KO_LYHYT = 0.75;
  const KO_SIVU = /^\/kant\/aa(\d\d)\/(\d{3})\.html$/;
  const koTeksti = x => rivi(x && x.textContent).replace(/ /g, ' ').trim();
  // Sivun nimiön teosnimi: Kant: AA IV, Grundlegung zur Metaphysik der ... , Seite 393 → AA IV, Grundlegung zur Metaphysik der ...
  const koNimio = d => rivi(d && d.title).replace(/^Kant:\s*/, '').replace(/\s*,\s*Seite\s+\d+\s*$/, '');
  function koMerkki(d, osa, sivu) {
    const s = d.createElement('sup');
    s.textContent = osa + ':' + sivu;
    return s;
  }
  // Yksi sivu riveiksi: { laji: 'h' (otsikko, taso), 'r' (tekstirivi, solu), 'tyhja' } ja viitteet tunnisteen mukaan.
  function koSivu(d) {
    const rivit = [], viitteet = new Map();
    let inhalt = '';
    for (const tr of d.querySelectorAll('tr')) {
      const solut = [...tr.cells];
      const nro = solut.find(c => c.querySelector('a[name^="z"]') && /^\d+$/.test(koTeksti(c)));
      const solu = solut.find(c => c.colSpan === 3);
      if (!solu) continue;
      const t = koTeksti(solu);
      const nav = [...solu.querySelectorAll('a[href]')].find(a => /Inhaltsverzeichnis/.test(a.textContent));
      if (nav) { inhalt = nav.getAttribute('href'); continue; }
      if (!nro) {
        if (!t) { rivit.push({ laji: 'tyhja' }); continue; }
        if (/^(Zeile:|Kant:|Text( \(Kant\))?:)/.test(t)) continue;
        // Viite: <a name="1"> *) …</a> (myös ilman ankkuria *)Mehr …).
        if (/^\*+\)/.test(t)) {
          const a = solu.querySelector('a[name]:not([name^="z"])');
          const id = a ? a.getAttribute('name') : String(viitteet.size + 1);
          if (!viitteet.has(id)) viitteet.set(id, { solu, id });
          continue;
        }
      }
      const h = solu.querySelector('h1, h2, h3, h4, h5, h6');
      if (h) { if (koTeksti(h)) rivit.push({ laji: 'h', taso: +h.tagName[1], teksti: koTeksti(h) }); continue; }
      if (t) rivit.push({ laji: 'r', solu });
      else if (!nro) rivit.push({ laji: 'tyhja' });
    }
    // Tyhjät rivit sivun alussa ja lopussa (ennen viitteitä ja alapalkkia) eivät ole kappalerajoja.
    while (rivit.length && rivit[0].laji === 'tyhja') rivit.shift();
    while (rivit.length && rivit[rivit.length - 1].laji === 'tyhja') rivit.pop();
    return { rivit, viitteet, inhalt, nimio: koNimio(d) };
  }
  // Sisällysluettelo: [{ taso, otsikko, sivu, vuosi }] (sivu null, jos linkki puuttuu tai vie muualle).
  function koSisallys(d) {
    const kohdat = [];
    let vuosi = '';
    if (!d) return kohdat;
    for (const tr of d.querySelectorAll('tr')) {
      for (const c of tr.cells) {
        const t = koTeksti(c);
        if (!t || c.colSpan < 2) continue;
        if (c.colSpan >= 12) { const v = /^(1[67]\d\d)\.?$/.exec(t); if (v) vuosi = v[1]; continue; }
        const a = tr.querySelector('a[href]'), m = a && /^(\d{3})\.html$/.exec(a.getAttribute('href') || '');
        kohdat.push({ taso: c.colSpan, otsikko: t.replace(/\s*\[[^\]]*\]\s*$/, ''), sivu: m ? +m[1] : null, vuosi });
      }
    }
    // Linkitön kohta (Einleitung.) alkaa seuraavan linkillisen kohdan sivulta.
    for (let i = kohdat.length - 1, s = null; i >= 0; i--) { if (kohdat[i].sivu == null) kohdat[i].sivu = s; else s = kohdat[i].sivu; }
    return kohdat;
  }
  // Kohdan loppusivu: seuraava vähintään yhtä ylä kohta, joka alkaa myöhemmin (null: niteen loppuun).
  function koLoppu(kohdat, i) {
    for (let j = i + 1; j < kohdat.length; j++) if (kohdat[j].taso >= kohdat[i].taso && kohdat[j].sivu != null && kohdat[j].sivu > kohdat[i].sivu) return kohdat[j].sivu - 1;
    return null;
  }
  const koVertaa = s => String(s || '').toLowerCase().replace(/[^\p{L}]/gu, '');
  async function korpora() {
    if (!/(^|\.)korpora\.org$/i.test(location.hostname)) return null;
    // Kehyssivu: tekstikehyksen asiakirja (sama alkuperä).
    let doc = document, u = osoite;
    const kehys = document.querySelector('frame[name="mainFrame"], frame[src*="aa"], iframe[name="mainFrame"]');
    if (kehys) { try { doc = kehys.contentDocument || doc; u = kehys.contentWindow.location.href.split('#')[0]; } catch (e) { return null; } }
    let polku = '';
    try { polku = new URL(u).pathname; } catch (e) { return null; }
    const pm = KO_SIVU.exec(polku);
    if (!pm) return null;
    const osa = +pm[1], sivu = +pm[2], kansio = u.replace(/[^/]*$/, '');
    const oma = koSivu(doc);
    if (!oma.rivit.some(r => r.laji === 'r' || r.laji === 'h')) return null;
    const sisd = await hae(new URL(oma.inhalt || 'Inhalt' + osa + '.html', u).href);
    const kohdat = koSisallys(sisd);
    // Teos: viimeinen colspan 9 -kohta, joka alkaa tällä sivulla tai ennen.
    let ti = -1;
    kohdat.forEach((k, i) => { if (k.taso === 9 && k.sivu != null && k.sivu <= sivu) ti = i; });
    let alku = sivu, loppu = sivu, otsikko = '', teos = '', vuosi = '', koko = false;
    if (ti >= 0) {
      const tk = kohdat[ti];
      vuosi = tk.vuosi;
      const tl = koLoppu(kohdat, ti);
      // Niteen viimeinen teos (KrV B) jatkuu loppuun: pituus vähintään viimeiseen sisällysluettelon sivuun.
      let ts = tk.sivu;
      for (let i = ti + 1; i < kohdat.length && kohdat[i].taso < 9; i++) if (kohdat[i].sivu != null) ts = Math.max(ts, kohdat[i].sivu);
      const pitkaTeos = tl != null ? tl - tk.sivu >= KO_RAJA : ts - tk.sivu >= KO_RAJA;
      if (!pitkaTeos) { alku = tk.sivu; loppu = tl; otsikko = tk.otsikko; koko = true; }
      else {
        // Suurin osa, joka sisältää sivun ja mahtuu rajaan (taso laskee: 8, 7 …). Teoksen viimeinen osa ilman loppusivua
        // haetaan niteen loppuun asti (puuttuva sivu lopettaa).
        for (let taso = 8; taso >= 2; taso--) {
          let ki = -1;
          for (let i = ti + 1; i < kohdat.length && kohdat[i].taso < 9; i++) if (kohdat[i].taso === taso && kohdat[i].sivu != null && kohdat[i].sivu <= sivu) ki = i;
          if (ki < 0) continue;
          let kl = koLoppu(kohdat, ki);
          if (kl == null || tl != null && kl > tl) kl = tl;
          if (kl != null ? kl < sivu || kl - kohdat[ki].sivu >= KO_RAJA : ts - kohdat[ki].sivu >= KO_RAJA) continue;
          alku = kohdat[ki].sivu; loppu = kl; otsikko = kohdat[ki].otsikko; teos = tk.otsikko;
          break;
        }
      }
    }
    // Sivut: aloitussivun nimiön mukaan; ilman loppusivua erissä, kunnes erässä ei ole teoksen sivua.
    const osoite3 = n => kansio + String(n).padStart(3, '0') + '.html';
    const nimio = (await hae(osoite3(alku)).then(d => d && koNimio(d))) || oma.nimio;
    const sivut = [];
    if (alku === sivu && loppu === sivu) sivut.push({ n: sivu, s: oma });
    else {
      for (let n = alku; loppu == null ? n < alku + KO_RAJA : n <= loppu; n += 6) {
        const nrot = [];
        for (let k = n; k < n + 6 && (loppu == null || k <= loppu) && k < alku + KO_RAJA; k++) nrot.push(k);
        const ds = await kkHae(nrot.map(osoite3));
        const osuvat = ds.map((d, i) => d && koNimio(d) === nimio ? { n: nrot[i], s: koSivu(d) } : null).filter(Boolean);
        sivut.push(...osuvat);
        if (loppu == null && !osuvat.length) break;
      }
      if (!sivut.some(x => x.n === sivu)) { sivut.length = 0; sivut.push({ n: sivu, s: oma }); alku = loppu = sivu; otsikko = ''; koko = false; }
    }
    // Pitkien rivien mitta koko leikkeestä (lyhyen sivun viimeiselle riville).
    const pituus = el => koTeksti(el).length;
    const kaikki = sivut.flatMap(x => x.s.rivit.filter(r => r.laji === 'r').map(r => pituus(r.solu))).sort((a, b) => a - b);
    const pitka = kaikki.length ? kaikki[Math.floor(kaikki.length * 0.8)] : 60;
    const el = document.createElement('div'), maar = [];
    let laskuri = 0, kpl = null, ots = null, odottava = null, tekstia = false, inhalt = false;
    const sulje = () => { kpl = null; ots = null; };
    const otsikkoLohko = (taso, t) => {
      kpl = null;
      // Pelkkä numero omalla rivillään (I, Begriff der Logik.) pisteellä.
      if (/^([IVXLC]+|\d+)$/.test(t)) t += '.';
      if (ots && ots.taso === taso) { ots.h.textContent += ' ' + t; return; }
      const h = document.createElement('h' + Math.min(6, taso));
      h.textContent = t;
      el.appendChild(h);
      ots = { taso, h };
    };
    sivut.forEach((x, si) => {
      const { n, s } = x;
      // Sivun viimeinen tekstirivi edellisellä sivulla: päättyykö kappale?
      if (si && kpl) {
        const ed = sivut[si - 1].s.rivit.filter(r => r.laji !== 'tyhja');
        const vr = ed[ed.length - 1];
        const ens = s.rivit.find(r => r.laji !== 'tyhja');
        if (!vr || vr.laji !== 'r' || !ens || ens.laji !== 'r' || /[.!?:]\)?(\s*\*+\))?$/.test(koTeksti(vr.solu)) && pituus(vr.solu) < pitka * KO_LYHYT) kpl = null;
      }
      odottava = koMerkki(document, osa, n);
      // Viitteiden merkit ja tekstit tämän sivun riveiltä.
      const kaytetyt = new Set();
      const solut = s.rivit.filter(r => r.laji === 'r').map(r => {
        const c = r.solu.cloneNode(true);
        c.querySelectorAll('a[href^="#"]').forEach(a => {
          const id = decodeURIComponent(a.getAttribute('href').slice(1)), v = s.viitteet.get(id);
          if (!v || kaytetyt.has(id)) { if (!v) a.replaceWith(...a.childNodes); else a.remove(); return; }
          kaytetyt.add(id);
          const tunnus = 'ko' + (++laskuri);
          const vk = v.solu.cloneNode(true);
          vk.querySelectorAll('font').forEach(f => { if (/Seitenumbruch/.test(f.textContent)) f.replaceWith(' ', koMerkki(document, osa, n + 1), ' '); });
          vk.querySelectorAll('a[name]').forEach(y => y.replaceWith(...y.childNodes));
          koViivat(vk);
          const t = muunna(irrota([vk]).innerHTML, 'inlined').trim().replace(/^(?:\\?\*)+\\?\)\s*/, '');
          if (t) maar.push(maaritelma(tunnus, t));
          const ed = a.previousSibling;
          if (ed && ed.nodeType === 3) ed.nodeValue = ed.nodeValue.replace(/\s+$/, '');
          a.replaceWith(merkki(tunnus));
        });
        return c;
      });
      let ri = 0;
      ots = null;
      const tekstisivu = s.rivit.some(r => r.laji === 'r');
      // Teoksen oma sisällysluettelo (Inhalt.) on yksi otsikkolohko, joka jatkuu seuraavalle sivulle, kun se alkaa otsikkorivillä
      // (Anthropologie 123–124); tyhjä rivi tai tekstirivi päättää sen.
      if (s.rivit.length && s.rivit[0].laji !== 'h') inhalt = false;
      for (const r of s.rivit) {
        if (r.laji === 'tyhja') { sulje(); inhalt = false; continue; }
        if (r.laji === 'h') {
          // Nimiösivut ennen tekstiä ja ensimmäisen sivun nimiö ja tekijärivi (Beantwortung der Frage: Was ist Aufklärung? von
          // Immanuel Kant.) pois.
          if (koko && !tekstia) {
            const v = koVertaa(r.teksti);
            if (!tekstisivu || koVertaa(otsikko).includes(v) || /^(abgefa(ß|ss)t)?(von)?(m)?immanuelkants?$/.test(v) || v === 'von') { kpl = null; continue; }
          }
          if (inhalt || /^Inhalt\.?$/.test(r.teksti) && !(ots && ots.taso === r.taso)) { inhalt = true; kpl = null; ots = null; continue; }
          otsikkoLohko(r.taso, r.teksti);
          continue;
        }
        inhalt = false;
        ots = null;
        const c = solut[ri++];
        if (!kpl) { kpl = document.createElement('p'); el.appendChild(kpl); }
        else kpl.append(' ');
        if (odottava) { kpl.append(odottava, ' '); odottava = null; }
        kpl.append(...c.childNodes);
        tekstia = true;
      }
      // Viite ilman merkkiä tekstissä: sivun loppuun.
      s.viitteet.forEach((v, id) => {
        const viim = [...el.children].filter(p => p.tagName === 'P').pop();
        if (kaytetyt.has(id) || !viim) return;
        const tunnus = 'ko' + (++laskuri);
        const vk = v.solu.cloneNode(true);
        koViivat(vk);
        const t = muunna(irrota([vk]).innerHTML, 'inlined').trim().replace(/^(?:\\?\*)+\\?\)\s*/, '');
        if (t) { maar.push(maaritelma(tunnus, t)); viim.append(merkki(tunnus)); }
      });
    });
    koViivat(el);
    kkTasoita(el);
    el.normalize();
    if (!tekstia) return null;
    const tekija = 'Immanuel Kant';
    const tulos = { html: irrota([el]).innerHTML, otsikko: otsikko || nimio.replace(/^AA\s+[IVXLC]+,\s*/, ''), tekija, tyyppi: 'tieteellinen', sivusto: KO_NIMI,
      teos: 'Kant’s gesammelte Schriften', numero: String(osa), sivut: sivut.length > 1 ? sivut[0].n + '–' + sivut[sivut.length - 1].n : String(sivu),
      julkaistu: vuosi, lahde: sivut.length > 1 ? osoite3(sivut[0].n) : u, maar, naytto: KO_NIMI + (sivut.length > 1 ? ' (' + sivut.length + ' sivua)' : '') };
    if (teos) tulos.otsikko = teos + ': ' + otsikko;
    return tulos;
  }
  // AA:n kaksoisviiva (allgemein=zweckmäßig) yhdysmerkiksi, välilyöntien ympäröimä viiva ajatusviivaksi.
  function koViivat(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      if (/[=-]/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/(\p{L})=(?=\p{L})/gu, '$1-').replace(/(^|\s)-(?=\s|$)/g, '$1–');
    }
  }

  /* LacusCurtius (penelope.uchicago.edu/Thayer, Bill Thayerin sivusto; käyttäjän pyyntö 16.11.2026: mietintämyssyn
     antiikkiosio, Loebin käännökset). Thayer on litteroinut Loeb Classical Libraryn käännöksiä, joiden tekijänoikeus on
     rauennut (Suetonius, Plutarkhos, Cassius Dio, Tacitus …), ja vanhoja hakuteoksia (Smithin Dictionary of Greek and
     Roman Antiquities). Sivu on litteä: otsake (table.headerbox, hakuteoksissa table.header), h2 (teos), h1 (otsikko),
     kappaleet, hr.endnotes ja viitteet, alapalkki (table.footer). Readability jätti sivunumerot (p5) tekstiin, viitteet
     loppuun numeroina ja säkeet HTML-taulukoiksi, ja otsikko oli välilehden (Suetonius • Life of Julius Caesar).
     Luvut (a.chapter) lihavoiduiksi, pykälät (a.sec) yläindekseiksi (luvun alun pykälä 1 pois), sivunumerot, latinan
     lippulinkit ja ❦-erottimet pois, latinan sanat (span.Latin; sivulla värillä) kursiiviksi, säkeet (table.verse,
     div.verse) lainaukseksi riveittäin, kuvataulukoista teksti ilman kuvia. Viitteet a.ref → a.note jatkokappaleineen
     (div.mynote ym.): Loebin toimittajan numeroidut ja Thayerin omat kirjaimelliset, joiden eteen Thayer's Note: kuten
     Thayerin huomautuksissa Loebin viitteiden sisällä. Viittaamaton osa viiteosiota (Smithin artikkelin Thayer's Note)
     jää tekstin loppuun. Sivun omat linkit tekstiksi (leipätekstissä), viitteissä ne jäävät (lähdeviittauksia).
     Thayerin sivuille jakama kirja (Tacitus Annals/1A…1E*.html, Strabo 1B1, Moralian Isis and Osiris kansiona A…E.html)
     kootaan otsakkeen previous- ja next-linkkejä pitkin, kun tiedostonimi kuuluu samaan kirjaan (enintään LC_OSIA).
     Etukenttä otsakkeesta (This webpage reproduces one of … by X published in Vol. N of the Loeb Classical Library
     edition, 1919; The text is in the public domain), h2:sta (Suetonius, The Lives of the Caesars; (Vol. III) Tacitus
     Annals) ja ylemmän sivun kääntäjästä (The English translation is by J. C. Rolfe; Translation by C. H. Moore
     (Histories) and J. Jackson (Annals); epävarma, esim. for the most part, jätetään pois). Smithin artikkeli h4:stä
     (Article by …, on pp359‑363 of; William Smith, D.C.L., LL.D.: A Dictionary …, John Murray, London, 1875.).
     Ei mainoksia eikä lahjoituspyyntöä. Mitattu 16.11.2026. */
  const LC_NIMI = 'LacusCurtius', LC_OSIA = 40;
  const LC_ISANTA = /^https?:\/\/penelope\.uchicago\.edu\//i;
  const lcRooma = s => {
    const A = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let n = 0;
    s = String(s || '').toUpperCase();
    for (let i = 0; i < s.length; i++) { const a = A[s[i]], b = A[s[i + 1]] || 0; if (!a) return ''; n += a < b ? -a : a; }
    return n ? String(n) : '';
  };
  // Sivun linkki absoluuttiseksi: osoitteet ovat <base>:n suhteen ja rivinvaihtojen ympäröiminä.
  const lcOsoite = (d, a, u) => {
    const b = d.querySelector('base[href]');
    try { return new URL((a.getAttribute('href') || '').trim(), b ? new URL(b.getAttribute('href'), u).href : u).href.split('#')[0]; } catch (e) { return ''; }
  };
  // Samaan kirjaan kuuluvat sivut: 1A*.html, 1B2*.html (kirja 1) tai Isis_and_Osiris*/A.html (teos).
  const lcRyhma = u => {
    let p = '';
    try { p = decodeURIComponent(new URL(u).pathname); } catch (e) { return null; }
    const m = /^(.*\/)(\d+)[A-Z]\d*\*\.html$/.exec(p) || /^(.*\*\/)()[A-Z]\d*\.html$/.exec(p);
    return m ? m[1] + m[2] : null;
  };
  const lcTeksti = x => rivi(x && x.textContent).replace(/\u2060/g, '');
  // Otsikon teksti ilman sivunumeroa (<span class="pagenum"> p3 </span>).
  // Otsikon teksti ilman sivunumeroa ja viitemerkkiä (Sextus<a class="ref">1</a> Julius Frontinus).
  const lcOtsikko = h => { if (!h) return ''; const k = h.cloneNode(true); k.querySelectorAll('.pagenum, a.ref').forEach(x => x.remove()); return lcTeksti(k); };
  function lcSiivoa(el, d, englanti, leipa) {
    // Sanastopallo (a.glossary •) ja jäljelle jääneet ponnahdusmerkit (viitteissä) pois.
    el.querySelectorAll('script, style, noscript, p.ivy, hr, form, a.glossary, a.correction, a.comment, a.conversion').forEach(x => x.remove());
    // Latinan lippulinkki (Vatican.gif) ja sivunumerot ankkureineen.
    el.querySelectorAll('a').forEach(a => { if (!lcTeksti(a) && a.querySelector('img')) a.remove(); });
    el.querySelectorAll('span.pagenum').forEach(s => { const a = s.parentElement; s.remove(); if (a && a.tagName === 'A' && !lcTeksti(a) && el.contains(a)) a.remove(); });
    // Kuvataulukko: solujen teksti kappaleiksi, kuvat ja lyhyet välisanat (and) pois.
    el.querySelectorAll('table').forEach(t => {
      if (!el.contains(t) || t.matches('.verse') || t.querySelector('.verse') || !t.querySelector('img')) return;
      const palat = [...t.querySelectorAll('td, th')].filter(c => !c.querySelector('td, th') && lcTeksti(c).length > 3).map(c => {
        c.querySelectorAll('img').forEach(i => i.remove());
        const div = d.createElement('div');
        while (c.firstChild) div.appendChild(c.firstChild);
        return div;
      });
      t.replaceWith(...palat);
    });
    // Asettelutaulukko, jonka riveillä on enintään kaksi solua: Loebin reunan vuosiluku (B.C. | 44 | Duration of time …) ja
    // kirjan lukuluettelo (I. | On concealing one's plans.). Rivi riviksi, lyhyt rivi (B.C.) seuraavan alkuun.
    el.querySelectorAll('table').forEach(t => {
      if (!el.contains(t) || t.matches('.verse') || t.querySelector('.verse, th, table, img') ||
        [...t.rows].some(r => [...r.cells].filter(c => lcTeksti(c)).length > 2)) return;
      const rivit = [];
      [...t.rows].map(r => [...r.cells].map(lcTeksti).filter(Boolean).join(' ')).filter(Boolean)
        .forEach(x => { const ed = rivit[rivit.length - 1]; if (ed !== undefined && ed.length <= 6) rivit[rivit.length - 1] = ed + ' ' + x; else rivit.push(x); });
      const p = d.createElement('p');
      rivit.forEach((x, i) => { if (i) p.appendChild(d.createElement('br')); p.append(x); });
      const ulko = t.parentElement && t.parentElement !== el && t.parentElement.tagName === 'DIV' && lcTeksti(t.parentElement) === lcTeksti(t) ? t.parentElement : t;
      ulko.replaceWith(p);
    });
    // Säkeet: rivit (p) yhdeksi lainaukseksi rivinvaihdoin.
    el.querySelectorAll('.verse').forEach(v => {
      if (!el.contains(v)) return;
      const kehys = v.closest('table') && el.contains(v.closest('table')) ? v.closest('table') : v;
      const ps = [...kehys.querySelectorAll('p')].filter(p => lcTeksti(p));
      const rivit = ps.length ? ps.map(p => p.innerHTML.trim()) : kehys.innerHTML.split(/<br\s*\/?>/i).map(x => x.trim()).filter(x => rivi(jasenna(x).body.textContent));
      const bq = d.createElement('blockquote'), p = d.createElement('p');
      p.innerHTML = rivit.join('<br>');
      bq.appendChild(p);
      const ulko = kehys.parentElement && kehys.parentElement !== el && kehys.parentElement.tagName === 'DIV' && lcTeksti(kehys.parentElement) === lcTeksti(kehys) ? kehys.parentElement : kehys;
      ulko.replaceWith(bq);
    });
    // Latinan sanat ja lyhyet lauseet kursiiviksi (Thayer erottaa ne värillä); latinankielisellä sivulla ei.
    if (englanti) el.querySelectorAll('span.Latin, span[lang="la"]').forEach(s => {
      if (s.closest('em, i') || s.querySelector('p, div, br') || lcTeksti(s).length > 200) return;
      const em = d.createElement('em');
      while (s.firstChild) em.appendChild(s.firstChild);
      s.replaceWith(em);
    });
    // Sivuston linkit leipätekstissä tekstiksi (sanasto, paikat, muut teokset); ulkoiset ja viitteiden linkit jäävät.
    if (leipa) el.querySelectorAll('a[href]').forEach(a => {
      const h = (a.getAttribute('href') || '').trim();
      if (!/^[a-z][a-z0-9+.-]*:/i.test(h) || LC_ISANTA.test(h)) a.replaceWith(...a.childNodes);
    });
    const w = d.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    // Toimittajan lisäys kulmasulkeissa (<II> legiones) ⟨ ⟩:ksi: Markdownissa < > olisi HTML:ää.
    for (let t = w.nextNode(); t; t = w.nextNode()) if (/[\u2060<>]/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/\u2060/g, '').replace(/<([^<>\n]{1,60})>/g, '⟨$1⟩');
  }
  // Ponnahduksen teksti: Ebox('The Loeb edition has: '+BadF+'and very ocean'+CloseF+'',WIDTH,100). BadF on <BR><SPAN CLASS=goof>;
  // Ebox(INARRAY,Glossary …) on sivuston yhteinen teksti, ei huomautus.
  function lcEbox(s) {
    const m = /Ebox\(\s*([\s\S]*)$/.exec(s || '');
    if (!m) return '';
    const x = m[1], PARI = { BadF: ' “', CloseF: '”' };
    let i = 0, ulos = '';
    for (;;) {
      while (x[i] === ' ') i++;
      if (x[i] === "'" || x[i] === '"') {
        const q = x[i++];
        while (i < x.length && x[i] !== q) { if (x[i] === '\\') i++; ulos += x[i++] || ''; }
        i++;
      } else {
        const id = /^[A-Za-z_]\w*/.exec(x.slice(i));
        if (!id || !(id[0] in PARI)) break;
        ulos += PARI[id[0]];
        i += id[0].length;
      }
      while (x[i] === ' ') i++;
      if (x[i++] !== '+') break;
    }
    return ulos;
  }
  // Yksi sivu: { el, h1, h2, h4, otsake, ylos, ed, seur, oikeus } tai null.
  function lcSivu(d, u, maar, laskuri) {
    const ots = d.querySelector('table.headerbox, table.header');
    const juuri = ots && ots.parentElement;
    if (!juuri) return null;
    const englanti = /\/Thayer\/E\//.test(u);
    const runko = [], loppu = [];
    let alue = null;
    for (let n = ots.nextSibling; n; n = n.nextSibling) {
      if (n.nodeType === 1 && (n.matches('table.footer, #navbar, p.W3C, p.r1') || n.querySelector('table.footer, #navbar'))) break;
      if (n.nodeType === 1 && n.matches('hr.endnotes')) alue = loppu;
      (alue || runko).push(n);
    }
    const el = d.createElement('div'), viit = d.createElement('div');
    runko.forEach(n => el.appendChild(n.cloneNode(true)));
    loppu.forEach(n => viit.appendChild(n.cloneNode(true)));
    // Nimiö: ensimmäinen h1, sitä edeltävä h2 (teos) ja seuraavat h4:t (osa, hakuteoksen tiedot).
    // Ilman h1:tä (Quintilianus) teos on ensimmäinen h2 ja otsikko toinen; h1 Tekijä: Teos ja heti perään h2 (Frontinus:
    // Sextus Julius Frontinus: Stratagems | Book I) on teos ja otsikko.
    let h1 = el.querySelector('h1'), h2 = null;
    const h2t = [...el.querySelectorAll('h2')];
    if (h1) h2 = h2t.find(h => h.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING) || null;
    else if (h2t.length >= 2 && h2t[0].parentElement === el && h2t[1].parentElement === el) [h2, h1] = h2t;
    if (h1 && !h2 && /^[^:]{2,60}:\s+\S/.test(lcOtsikko(h1)) && h1.nextElementSibling && h1.nextElementSibling.tagName === 'H2') { h2 = h1; h1 = h1.nextElementSibling; }
    const h4 = [];
    for (let x = h1 && h1.nextElementSibling; x && x.tagName === 'H4'; x = x.nextElementSibling) h4.push(x);
    const tiedot = { h1: lcOtsikko(h1), h2: lcOtsikko(h2), h4: h4.map(h => { const k = h.cloneNode(true); k.querySelectorAll('br').forEach(b => b.replaceWith(' ')); return lcTeksti(k); }) };
    // Nimiön edellä vain Thayerin sivuhuomautuksia (Before e-mailing me …) ja teoksen h2.
    while (h1 && h1.parentElement === el && h1.previousSibling) h1.previousSibling.remove();
    [h1, h2, ...h4].forEach(x => x && x.remove());
    // Viitteet: a.note[id] ja sen kappale jatkoineen seuraavaan viitteeseen, erottimeen tai otsikkoon asti.
    const kohteet = new Map();
    // Tunniste on ankkurissa (a.note#note1) tai kappaleessa (Strabo: <p id="note37"><a class="note">37a</a> <a class="note">37b</a>).
    const lohkot = new Map();
    viit.querySelectorAll('a.note').forEach(a => {
      const lohko = a.closest('p, div') && viit.contains(a.closest('p, div')) && a.closest('p, div') !== viit ? a.closest('p, div') : null;
      if (!lohko) return;
      if (!lohkot.has(lohko)) {
        const osat = [lohko];
        for (let n = lohko.nextElementSibling; n && !n.matches('p.ivy, hr, h1, h2, h3, h4, h5, h6') && !n.querySelector('a.note'); n = n.nextElementSibling) osat.push(n);
        lohkot.set(lohko, { a, osat });
      }
      const k = lohkot.get(lohko);
      [a.id, lohko.id].forEach(id => { if (id && !kohteet.has(id)) kohteet.set(id, k); });
    });
    // Viitteet ja Thayerin ponnahdukset (a.correction, a.comment º, a.conversion •) samassa järjestyksessä alaviitteiksi.
    el.querySelectorAll('a.ref[href], a.correction, a.comment, a.conversion').forEach(a => {
      if (!a.matches('a.ref')) {
        const t = rivi(muunna(lcEbox(a.getAttribute('onmouseover')), 'inlined'));
        if (!t) { a.remove(); return; }
        const tunnus = 'lc' + (++laskuri.n);
        const u = t.replace(/^\((.*)\)$/, '$1').replace(/^sic$/i, '*sic*');
        maar.push(maaritelma(tunnus, "Thayer's Note: " + u + (/[.!?*)]$/.test(u) ? '' : '.')));
        // Merkki on lähteessä kommentoitavan sanan edellä (marched •two): alaviitemerkiksi edellisen sanan perään.
        const ed = a.previousSibling, m = merkki(tunnus);
        if (ed && ed.nodeType === 3) ed.nodeValue = ed.nodeValue.replace(/\s+$/, '');
        a.replaceWith(m);
        if (m.nextSibling && m.nextSibling.nodeType === 3 && /^\S/.test(m.nextSibling.nodeValue)) m.after(' ');
        return;
      }
      const id = ((a.getAttribute('href') || '').split('#')[1] || '').trim();
      const k = id && kohteet.get(id);
      if (!k) { a.replaceWith(...a.childNodes); return; }
      if (!k.tunnus) {
        const kaare = d.createElement('div');
        k.osat.forEach(x => kaare.appendChild(x.cloneNode(true)));
        kaare.querySelectorAll('a.note').forEach(x => x.remove());
        lcSiivoa(kaare, d, englanti, false);
        let t = muunna(irrota([kaare]).innerHTML, 'inlined').trim();
        // Thayerin oma viite (kirjain, tunniste note:…): kuten Loebin viitteiden sisäiset Thayer's Note -huomautukset.
        if (t && (/^note:/.test(id) || /^[a-z]$/.test(lcTeksti(k.a))) && !/^\W*Thayer/i.test(t)) t = "Thayer's Note: " + t;
        k.tunnus = t ? 'lc' + (++laskuri.n) : '-';
        if (t) maar.push(maaritelma(k.tunnus, t));
      }
      if (k.tunnus === '-') a.remove(); else a.replaceWith(merkki(k.tunnus));
    });
    // Luvut ja pykälät; luvun alun pykälä 1 pois.
    const luvut = [...el.querySelectorAll('a.chapter')].map(a => {
      const b = d.createElement('strong');
      b.textContent = lcTeksti(a);
      a.replaceWith(b);
      let s = b.nextSibling;
      while (s && (s.nodeType === 3 ? !s.nodeValue.trim() : !lcTeksti(s) && !s.matches('a.sec'))) s = s.nextSibling;
      if (s && s.nodeType === 1 && s.matches('a.sec') && lcTeksti(s) === '1') s.remove();
      return b;
    });
    // Pykälät ja Moralian Stephanus-sivut (a.Tsec 351, a.Tsubsec b–e) yläindekseiksi, perään välilyönti (lähteessä eI think).
    el.querySelectorAll('a.sec, a.Tsec, a.Tsubsec').forEach(a => {
      const s = d.createElement('sup');
      s.textContent = lcTeksti(a);
      a.replaceWith(s);
      if (s.nextSibling && s.nextSibling.nodeType === 3 && /^\S/.test(s.nextSibling.nodeValue)) s.after(' ');
    });
    lcSiivoa(el, d, englanti, true);
    // Luvun numeron ja tekstin väliin yksi välilyönti (lippulinkin ympäriltä jäi kaksi).
    luvut.forEach(b => {
      while (b.nextSibling && b.nextSibling.nodeType === 3 && !b.nextSibling.nodeValue.trim()) b.nextSibling.remove();
      const s = b.nextSibling;
      if (s && s.nodeType === 3) s.nodeValue = s.nodeValue.replace(/^\s+/, '');
      b.after(' ');
    });
    // Viittaamaton osa viiteosiota (Smithin artikkelin Thayer's Note): tekstin loppuun ilman pelkkiä viiteotsikoita.
    lohkot.forEach(k => k.osat.forEach(x => x.remove()));
    lcSiivoa(viit, d, englanti, true);
    viit.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      let s = h.nextElementSibling;
      while (s && !lcTeksti(s)) s = s.nextElementSibling;
      if (!s || /^H[1-6]$/.test(s.tagName)) h.remove(); else h.textContent = lcTeksti(h).replace(/:$/, '');
    });
    if (lcTeksti(viit)) el.append(...viit.childNodes);
    // Otsakkeen tiedot.
    const sisus = ots.querySelector('.contents');
    tiedot.otsake = sisus ? lcTeksti(sisus) : '';
    const linkki = sel => { const a = ots.querySelector(sel); return a ? lcOsoite(d, a, u) : ''; };
    const ylos = [...ots.querySelectorAll('a[href]')].find(a => a.querySelector('img[src*="up.gif"]'));
    tiedot.ylos = ylos ? lcOsoite(d, ylos, u) : '';
    tiedot.ed = linkki('td.previouscell a[href]');
    tiedot.seur = linkki('td.nextcell a[href]');
    return { el, ...tiedot };
  }
  // Kääntäjä teoksen etusivulta: The English translation is by J. C. Rolfe; Translation by C. H. Moore (Histories) and
  // J. Jackson (Annals) → teoksen mukaan; H[arold] E[dgeworth] Butler → H. E. Butler.
  function lcKaantaja(d, teos) {
    const b = d && d.body && d.body.cloneNode(true);
    if (!b) return '';
    b.querySelectorAll('script, style, table.header, table.headerbox, table.footer').forEach(x => x.remove());
    const t = lcTeksti(b);
    // Pisteen saa vain alkukirjain (Cary. Now ei ole nimi).
    const NIMI = String.raw`(?:(?:\p{Lu}\.|\p{Lu}\[[^\]]{1,20}\]|\p{Lu}[\p{L}'’-]+)\s+){0,4}\p{Lu}[\p{L}'’-]+`;
    // Toinen käännös (a different, older, translation (by Church and Brodribb)) ohitetaan; epävarma (for the most part) hylkää.
    const re = new RegExp(String.raw`\b(?:English\s+)?[Tt]ranslation\b([^.]{0,140}?)\bby\s+(` + NIMI + String.raw`(?:\s*\(\s*[^()]{1,40}\))?(?:\s*(?:,|and)\s*` + NIMI + String.raw`(?:\s*\(\s*[^()]{1,40}\))?)*)`, 'gu');
    // Väli ilman luettelon merkkejä ([ complete English translation ] De Mulierum …: written by Plutarch) ja vuotta (A 1547 translation by).
    const m = [...t.matchAll(re)].find(x => !/\(\s*$|[:[\]]/.test(x[1]) && x[1].length <= 90 && !/\b1\d\d\d\s*$/.test(t.slice(Math.max(0, x.index - 12), x.index)) &&
      !/\b(different|older|other|another|earlier|later|alternative|previous)\b/i.test(t.slice(Math.max(0, x.index - 60), x.index).split(/[.!?]\)?\s/).pop() + x[1]));
    if (!m || /most part|mostly|except|various|several/i.test(m[1] + m[2])) return '';
    const siisti = s => rivi(s.replace(/(\p{Lu})\[[^\]]*\]/gu, '$1.').replace(/\.(?=\p{Lu})/gu, '. '));
    const parit = [...m[2].matchAll(new RegExp('(' + NIMI + String.raw`)\s*\(\s*([^()]{1,40}?)\s*\)`, 'gu'))];
    if (!parit.length) return siisti(m[2]);
    const p = parit.find(x => teos && new RegExp('\\b' + x[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(teos));
    return p ? siisti(p[1]) : '';
  }
  async function lacuscurtius() {
    if (!/^penelope\.uchicago\.edu$/i.test(location.hostname) || !/^\/Thayer\/[A-Z]\/Roman\/Texts\//.test(decodeURIComponent(location.pathname))) return null;
    const maar = [], laskuri = { n: 0 };
    const oma = lcSivu(document, osoite, [], { n: 0 });
    if (!oma || !oma.h1 || kkSanoja(oma.el) < 20) return null;
    // Sivuille jaettu kirja: edelliset ja seuraavat saman kirjan sivut.
    const ryhma = lcRyhma(osoite), osat = [{ u: osoite, d: document, s: oma }];
    if (ryhma) {
      for (const [suunta, lisaa] of [['ed', x => osat.unshift(x)], ['seur', x => osat.push(x)]]) {
        let s = oma, nahty = new Set([osoite]);
        while (osat.length < LC_OSIA && s[suunta] && lcRyhma(s[suunta]) === ryhma && !nahty.has(s[suunta])) {
          const u = s[suunta], d = await hae(u);
          nahty.add(u);
          s = d && lcSivu(d, u, [], { n: 0 });
          if (!s || !s.h1) break;
          lisaa({ u, d, s });
        }
      }
    }
    // Varsinainen leikkaus (viitteet numeroidaan järjestyksessä).
    const el = document.createElement('div');
    // Koottu kirja: otsikoksi osien yhteinen alku (Book I Chapter 1 … Book I Chapter 4 → Book I; Book I (beginning) → Book I),
    // ja osan oma loppu (Chapter 2) väliotsikoksi, kun se vaihtuu (Chapter 2 (beginning) ja (end) ovat yksi luku).
    const OSA_LOPPU = /\s*\((?:beginning|continued|end|conclusion|concluded|part \d+[^)]*)\)$/i;
    osat.forEach(o => { o.s = lcSivu(o.d, o.u, maar, laskuri); });
    const sanat = osat.map(o => o.s.h1.replace(OSA_LOPPU, '').split(/\s+/));
    let yht = sanat[0].length;
    sanat.forEach(w => { let i = 0; while (i < yht && i < w.length && w[i] === sanat[0][i]) i++; yht = i; });
    if (osat.length > 1) while (yht > 1 && /^(chapter|part|section|book)$/i.test(sanat[0][yht - 1])) yht--;
    const omat = osat.map((o, i) => osat.length > 1 ? sanat[i].slice(yht).join(' ') : '');
    let edOma = '';
    osat.forEach((o, i) => {
      const oma = omat[i];
      if (omat.some(Boolean)) kkSiirra(o.s.el, 2);
      if (oma && oma !== edOma) { const h = document.createElement('h2'); h.textContent = oma; el.appendChild(h); }
      edOma = oma;
      el.append(...o.s.el.childNodes);
    });
    kkTasoita(el);
    el.normalize();
    const ens = osat[0].s;
    let otsikko = osat.length > 1 ? sanat[0].slice(0, yht).join(' ') || ens.h1.replace(OSA_LOPPU, '') : ens.h1;
    // Otsakkeen lause: This webpage reproduces one of The Parallel Lives by Plutarch published in Vol. VII of the Loeb …, 1919.
    const ot = oma.otsake;
    const rm = /reproduces\s+(?:(?:one|a|an|the)\s+(?:[\w-]+\s+){0,2}?of\s+)?(.+?)\s+published\s+in\s+(?:Vol\.\s*([IVXLC]+)\s+of\s+)?(.*?)(?:,\s*|\s+)((?:1[5-9]|20)\d\d)(?!\d)/i.exec(ot);
    let teos = '', tekija = '';
    const h2 = rivi(ens.h2.replace(/^\(\s*Vol\.\s*[IVXLC]+\s*\)\s*/i, ''));
    const h2m = /^([^,:]{2,60})[,:]\s+(.+)$/.exec(h2);
    if (h2m) { tekija = h2m[1]; teos = h2m[2]; }
    else if (rm) {
      const by = /^(.+?)\s+by\s+(.+)$/.exec(rm[1]), of = /^(.+?)\s+of\s+(\p{Lu}\p{L}+(?:\s+\p{Lu}\p{L}+){0,2})$/u.exec(rm[1]);
      if (by) { teos = by[1]; tekija = by[2]; }
      else if (of && h2.startsWith(of[2] + ' ')) { teos = of[1]; tekija = of[2]; }
      else teos = rm[1];
    }
    const loeb = rm && /Loeb Classical Library/i.test(rm[3]);
    const tulos = { html: irrota([el]).innerHTML, otsikko, tekija, teos: teos !== otsikko ? teos : '', sivusto: LC_NIMI, lahde: osat[0].u, maar,
      numero: rm && rm[2] ? lcRooma(rm[2]) : '', sarja: loeb ? 'Loeb Classical Library' : '', julkaistu: rm ? rm[4] : '',
      naytto: LC_NIMI + (osat.length > 1 ? ' (' + osat.length + ' sivua)' : '') };
    // Pelkkä osan nimi (Book XLIV, Book I): eteen teoksen nimi.
    if (KK_OSA.test(otsikko) && teos) tulos.otsikko = teos + ', ' + otsikko;
    // Hakuteoksen artikkeli (Smith): Article by Anthony Rich, Jun. B.A. … on pp359‑363 of / William Smith, D.C.L., LL.D.: A Dictionary …, John Murray, London, 1875.
    const art = ens.h4.find(x => /^Article by\s/i.test(x)), kirja = ens.h4.find(x => /:\s.*,\s*(?:1[5-9]|20)\d\d\.?$/.test(x));
    if (art) {
      tulos.tekija = rivi((/^Article by\s+(.+?)(?:,|\s+on\s+pp?\b|$)/i.exec(art) || [])[1] || '');
      const sv = /\bpp?\.?\s*(\d+)(?:\s*[‑–-]\s*(\d+))?/.exec(art);
      if (sv) tulos.sivut = sv[2] ? sv[1] + '–' + sv[2] : sv[1];
    }
    if (kirja) {
      const i = kirja.indexOf(': '), osat2 = kirja.slice(i + 2).replace(/\.$/, '').split(/\s*,\s*/);
      tulos.toimittaja = rivi(kirja.slice(0, i).split(',')[0]);
      tulos.julkaistu = osat2.pop();
      if (osat2.length >= 3) { tulos.paikka = osat2.pop(); tulos.kustantaja = osat2.pop(); }
      tulos.teos = osat2.join(', ');
    }
    // Kääntäjä teoksen etusivulta (Loebin käännökset).
    if (loeb && oma.ylos) {
      const yd = await hae(oma.ylos);
      const k = lcKaantaja(yd, [teos, ens.h2, rm[1]].join(' '));
      if (k) tulos.suomentaja = kkKaantaja([k]);
    }
    const pd = /The text is in the public domain\.?/i.exec(ot);
    if (pd) tulos.oikeus = { teksti: pd[0].replace(/\.?$/, '.'), lahde: location.origin + '/Thayer/E/HELP/Copyright/home.html' };
    return tulos;
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

  // Readability antaa usein välilehden otsikon (Kirjoitus | Blogi). Poimi lukimeen -polulla kukaan ei paina Latomon
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

  /* Rahoitus (käyttäjän säännöt 15.11.2026, md.js rahoitus()): sovitesivuston mainos- tai lahjoitusrahoitus etukenttään,
     josta Luin tekee tekstin alkuun hakasulkeisen huomautuksen. Vain sovitteille (ei Bloggerille: blogit vaihtelevat, eikä
     yleiselle leikkeelle). Tarkistettu 15.11.2026 sivuston sivuilta ja Chromiumissa ladatuista mainosverkoista:
     Encyclopedia.com (Raptive) ja New Advent (CleanMedia) näyttävät mainoksia ilman lahjoitusnappia (New Adventin
     19,99 dollarin latausta ei laskettu lahjoitukseksi), ja tuettujen sivustojen listassa ne ovat piilossa. Wait But Whyn
     mainosverkkoliikenne tulee Disqus-kommenteista ja Amazonin kumppanilinkeistä, ei sivuston omista mainoksista.
     Logos, OECS, SAET, IRED ja LacusCurtius: ei mainoksia eikä lahjoituspyyntöä. Doppiozero (16.11.2026): lahjoitukset, ei
     mainoksia. Avain on sovitefunktion nimi. */
  const RAHOITUS = {
    sep: { laji: 'lahjoitukset', osoite: 'https://plato.stanford.edu/support/donate.html' },
    wikipedia: { laji: 'lahjoitukset', osoite: 'https://donate.wikimedia.org/' },
    marxists: { laji: 'lahjoitukset', osoite: 'https://www.marxists.org/admin/donate/index.htm' },
    waitbutwhy: { laji: 'lahjoitukset', osoite: 'https://www.patreon.com/waitbutwhy' },
    gutenberg: { laji: 'lahjoitukset', osoite: 'https://www.gutenberg.org/donate/' },
    ccel: { laji: 'lahjoitukset', osoite: 'https://give.calvin.edu/give/583548/#!/donation/checkout' },
    aeonPsyche: { laji: 'lahjoitukset', osoite: () => /(^|\.)aeon\.co$/.test(location.hostname) ? 'https://aeon.co/donate' : 'https://psyche.co/donate' },
    ejp: { laji: 'lahjoitukset', osoite: 'https://www.paypal.com/donate/?hosted_button_id=5KCSPCEPPTCYC' },
    doppiozero: { laji: 'lahjoitukset', osoite: 'https://www.doppiozero.com/sostieni-doppiozero' },
    encyclopediaCom: { laji: 'mainokset' },
    newadvent: { laji: 'mainokset' }
  };

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
  let blogi = null, sovitin = sep ? 'sep' : '';
  if (!sep) for (const f of [logos, wikipedia, oecs, encyclopediaCom, saet, gutenberg, newadvent, ccel, korpora, dhammatalks, lacuscurtius, aeonPsyche, ejp, ojs, iredLeike, iep, ndpr, bmcr, oyc, iltascabile, doppiozero, substack, marxists, waitbutwhy, blogger]) {
    try { blogi = await f(); } catch (e) { blogi = null; }
    if (blogi) { sovitin = f.name; break; }
  }
  // Sovitteen tyhjä runko (IRED:n kansi) on tyhjä leike, ei Readabilityn arvaus katselimen sivusta.
  const sisalto = sep || (blogi && blogi.html) || (blogi && blogi.tyhja ? '' : artikkeli && artikkeli.content) || '';
  const omat = (blogi && blogi.maar) || [];

  const otsikko = blogi ? blogi.otsikko || osoite
    : siisti(rivi(artikkeli && artikkeli.title || document.title), rivi(artikkeli && artikkeli.siteName)) || osoite;
  const p = new Date(), pv = n => String(n).padStart(2, '0');
  const etu = ['---'];
  const kentta = (avain, arvo) => { if (rivi(arvo)) etu.push(avain + ': ' + rivi(arvo)); };
  kentta('tyyppi', blogi && blogi.tyyppi);
  kentta('alaotsikko', blogi && blogi.alaotsikko);
  kentta('tekijä', blogi ? blogi.tekija : artikkeli && artikkeli.byline);
  kentta('teos', blogi && blogi.teos);
  kentta('numero', blogi && blogi.numero);
  kentta('sivut', blogi && blogi.sivut);
  kentta('toimittaja', blogi && blogi.toimittaja);
  kentta('sarja', blogi && blogi.sarja);
  kentta('suomentaja', blogi && blogi.suomentaja);
  kentta('sivusto', blogi ? blogi.sivusto : artikkeli && artikkeli.siteName);
  kentta('julkaistu', blogi ? blogi.julkaistu : artikkeli && artikkeli.publishedTime);
  kentta('paikka', blogi && blogi.paikka);
  kentta('kustantaja', blogi && blogi.kustantaja);
  kentta('doi', blogi && blogi.doi);
  kentta('lähde', blogi && blogi.lahde || osoite);
  let oikeus = null;
  try { oikeus = blogi && blogi.oikeus || oikeudet(); } catch (e) { oikeus = null; }
  if (oikeus) { kentta('oikeudet', oikeus.teksti); kentta('oikeudet-lähde', oikeus.lahde); }
  const raha = RAHOITUS[sovitin];
  if (raha) { kentta('rahoitus', raha.laji); kentta('lahjoitusosoite', typeof raha.osoite === 'function' ? raha.osoite() : raha.osoite); }
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
