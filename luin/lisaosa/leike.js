/* Lukimeen-lisäosa: leikkuri. Ajetaan sivulla kirjastojen (Readability, Turndown, GFM) jälkeen; viimeisen lausekkeen arvo
   (lupaus) palaa ponnahdusikkunalle. IIFE, koska tiedosto ajetaan uudelleen joka kerta, kun ikkuna avataan samalla sivulla.

   Tulos noudattaa Latomon ohjeen suosittelemia MarkDownload-asetuksia (latomo-ohje.html#markdownload), jotta Latomon
   MarkDownload-tila siivoaa sen samoin: etukentässä korvamerkki leikattu:, Atx-otsikot, viiva ___, luettelo -,
   aidattu koodi, *kursiivi*, **lihavointi**, viitelinkit lopussa, kuvat pois, Markdown-merkit suojattuina,
   yläindeksit HTML:nä (Latomo muuntaa ne ^1^-muotoon). Lisäksi kaksi asiaa, joihin MarkDownload ei pysty:
   tunnettujen sivujen sisältö ilman Readabilityn karsintaa (sovite) ja toiselle sivulle viittaavat alaviitteet
   haettuina Luinin alaviitteiksi. Omat sovitteet: SEP, Blogger, Ensyklopedia Logos (filosofia.fi) ja Wikipedia
   (käyttäjän pyyntö 10.11.2026) sekä marxists.org, Wait But Why ja Open Encyclopedia of Cognitive Science (11.11.2026) sekä Encyclopedia.com ja IPA:n Inter-Regional Encyclopedic Dictionary of Psychoanalysis (13.11.2026) sekä St Andrews Encyclopaedia of Theology, Project Gutenberg, New Advent, Christian Classics Ethereal Library sekä Psyche ja Aeon (14.11.2026) sekä European Journal of Psychoanalysis (15.11.2026) sekä Open Journal Systems -lehdet, ensimmäisenä Vilnan yliopiston Problemos, LacusCurtius, Korpora.org/kant, dhammatalks.org, Wikisource, Substack, Internet Encyclopedia of Philosophy, Open Yale Courses, Notre Dame Philosophical Reviews, Il Tascabile, Doppiozero, Bryn Mawr Classical Review, Noema, Emergence Magazine, Andy Matuschakin esseet, Five Books, Perseus, Paul Grahamin esseet ja Tertullian Project (16.11.2026) sekä Pressbooks, OpenEdition, Hypotheses.org, Manifold, ForumMagnum (LessWrong, EA Forum) Janeway (Open Library of Humanities), SciELO, Open Book Publishers, Faded Page, Internet Archiven tekstiversiot, Folger Shakespeare, Gwern.net, Los Angeles Review of Books ja 3:16 (17.11.2026) sekä EUR-Lex, Find Case Law, PubMed Central, Ubiquity Press, SPIP, Political Concepts, Project Vox, Embryo Project, CDLI:n lehdet, Журнальный зал, Fabula, Folktexts, A Celebration of Women Writers, Center for Hellenic Studies, Zeithistorische Forschungen, BOMB ja PsychOpen GOLD (18.11.2026) sekä Projekt Gutenberg-DE, SLS:n digitaaliset editiot, Snellmanin kootut teokset, PoPuPS, Religion Online, isidore.co:n Akvinolainen, Det Kgl. Biblioteks tekstportal, The Philological Museum, Book of Concord, Nova Vulgata, Edition Open Sources ja MPRL, The Newton Project ja The Latin Library (20.11.2026) sekä Springer Nature (BMC, Springer Link, nature.com), PLOS ja Frontiers (21.11.2026). */
(async () => {
  // MarkDownload poistaa samat näkymättömät merkit; pehmeä tavuviiva sotkisi Luinin oman tavutuksen.
  const NAKYMATON = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g;
  // Alaviitteen paikka Turndownin läpi: pelkkiä kirjaimia ja numeroita, joita Turndown ei suojaa.
  // Ei-ahne: vierekkäiset merkit (Wikipedia: kolme viitettä peräkkäin) eivät sulaudu yhdeksi.
  const MERKKI = /XLUINVIITE([0-9A-Za-z]+?)X/g;
  // Perseuksen valinnat (kielet, kirjat; käyttäjän pyyntö 19.11.2026): ponnahdusikkuna asettaa ne ennen ajoa. Luetaan ja
  // nollataan heti, jotta seuraava ajo samalla sivulla alkaa oletuksista. Muut sovitteet eivät katso niitä.
  const PS_VALINNAT = globalThis.__lukimeenPs || null;
  globalThis.__lukimeenPs = null;
  // Numero tekstinä (Snellman-sovite 21.11.2026): Turndown suojaa rivin alun 1. vain välilyönnin kanssa, ei 1):tä eikä
  // yksinäistä 2.:tä, jotka md.js lukee luettelon merkiksi. Sovite asettaa tämän, ja muunna() suojaa silloin nekin.
  let SULKUNUMEROT = false;

  function muunna(html, linkit = 'referenced') {
    // Rivinvaihto kenoviivalla (iA Writer, md.js; 21.11.2026): Turndownin oletus oli kaksi välilyöntiä, jotka eivät näy
    // editorissa ja katoavat rivien lopun siivouksessa.
    const td = new TurndownService({ headingStyle: 'atx', hr: '___', bulletListMarker: '-', codeBlockStyle: 'fenced',
      fence: '```', emDelimiter: '*', strongDelimiter: '**', linkStyle: linkit, linkReferenceStyle: 'full', br: '\\' });
    td.use(turndownPluginGfm.gfm);
    // Tekstin < kirjaimen edellä (OCR-roska <rca>, a<b) ei saa näyttää md.js:lle HTML-merkinnältä (Internet Archive 17.11.2026).
    // Myös tekstisolmun lopussa ilman edeltävää välilyöntiä: MathML:n <mo>&lt;</mo> on oma solmunsa, ja kirjain tulee
    // seuraavasta (eLife: ⟨r̄⟩ → <r¯n,c,t>). SEP:n URL = <linkki> jää ennalleen.
    td.escape = s => {
      const e = TurndownService.prototype.escape.call(td, s).replace(/<(?=[A-Za-z/!?])|(^|[^\s])<$/g, (x, a) => a === undefined ? '\\<' : a + '\\<');
      return SULKUNUMEROT ? e.replace(/^(\s*\d{1,3})([.)])(?=\s|$)/, '$1\\$2') : e;
    };
    td.keep(['sub', 'sup']);
    // Taulukon solu (22.11.2026, IRSP:n Table X1: brm(Specificity | trunc(…) ja solujen <br>): pystyviiva suojataan (\|), koska
    // md.js ja muut GFM-lukijat jakavat rivin siitä, ja rivinvaihto välilyönniksi, koska taulukon rivi ei voi jakautua. GFM:n
    // oma solusääntö ei tehnyt kumpaakaan; tämä sääntö on lisätty sen jälkeen, joten se voittaa.
    td.addRule('taulukonSolu', {
      filter: ['th', 'td'],
      replacement: (s, n) => {
        const i = Array.prototype.indexOf.call(n.parentNode.childNodes, n);
        const t = s.replace(/\s*\\\n\s*/g, ' ').replace(/\s*\n+\s*/g, ' ').replace(/\\\|/g, '\u0000').replace(/\|/g, '\\|').replace(/\u0000/g, '\\|');
        return (i === 0 ? '| ' : ' ') + t + ' |';
      }
    });
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
  const WIKI_NIMIAVARUUS = /^(file|image|special|help|wikipedia|category|portal|template|talk|user|module|draft|mediawiki|wikt|wiktionary|tiedosto|kuva|toiminnot|ohje|luokka|teemasivu|malline|keskustelu|käyttäjä|moduuli|wikiprojekti|wikisanakirja|vaizdas|failas|specialus|pagalba|vikipedija|kategorija|portalas|šablonas|aptarimas|naudotojas|modulis|vikižodynas|immagine|speciale|aiuto|categoria|portale|discussioni|utente|progetto|datei|bild|spezial|hilfe|kategorie|vorlage|diskussion|benutzer|fichier|spécial|aide|catégorie|portail|modèle|utilisateur|projet|fil|speciel|hjælp|kategori|skabelon|bruger|archivo|especial|ayuda|categoría|plantilla|discusión|usuario|anexo|fail|eri|juhend|kategooria|portaal|mall|arutelu|kasutaja|hjälp|användare|αρχείο|εικόνα|ειδικό|βοήθεια|κατηγορία|πύλη|πρότυπο|συζήτηση|χρήστης|βικιπαίδεια)(\s|_)*:/i;
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
      [...x.querySelectorAll('a[href]')].some(a => /\/wiki\/(Malline|Template|Wikipedia|Ohje|Aide|Modèle|Hilfe|Vorlage|Aiuto|Ayuda|Plantilla|Mall|Hjälp|Skabelon|Hjælp|Juhend):/i.test(decodeURIComponent(a.getAttribute('href')))));
    [...el.querySelectorAll('sup.Inline-Template, sup.noprint, span.noprint, sup.need_ref_tag'), ...mallineet].forEach(m => {
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
    // Ohjausrivit kielittäin (17.11.2026, pahvin *20 sivustosovitetta* 14: it, de, fr, da, es, et, sv, el); luokat vaihtelevat
    // (de .hauptartikel/.sieheauch, fr .bandeau-section, da .detail, es .rellink), joten tunnistus myös alkusanasta.
    el.querySelectorAll('.hatnote, .dablink, .rellink, .hauptartikel, .sieheauch, .detail, .bandeau-section, .huvudartikel, .vedi-anche').forEach(h => {
      if (/^\s*(pääartikkeli|pääartikkelit|katso myös|lisätietoja|main articles?|see also|further information|pagrindinis straipsnis|pagrindiniai straipsniai|taip pat skaitykite|taip pat žiūrėkite|lo stesso argomento in dettaglio|voce principale|vedi anche|hauptartikel|siehe auch|articles? détaillés?|voir aussi|uddybende artikel|hovedartikel|se også|artículos? principal(es)?|véase también|põhiartikkel|pikemalt artiklis|vaata ka|huvudartikel|se även|utförligare artikel|κύριο άρθρο|δείτε επίσης)(?![\p{L}\p{N}])/iu.test(h.textContent)) talteen(h);
    });
    const KATSO = /^(katso myös|see also|taip pat skaitykite|taip pat žiūrėkite|voci correlate|siehe auch|articles connexes|se også|véase también|vaata ka|se även|δείτε επίσης)$/i;
    // Sisarprojektien luettelo (it: Altri progetti) on navigointia.
    const POIS_OSIO = /^(altri progetti|autres projets|andere projekte)$/i;
    el.querySelectorAll('h2, h3').forEach(h => {
      const nimi = rivi(h.textContent.replace(/\[(muokkaa|edit)[^\]]*\]/gi, ''));
      const pois = POIS_OSIO.test(nimi);
      if (!el.contains(h) || !pois && !KATSO.test(nimi)) return;
      const taso = +h.tagName[1];
      const kaare = h.closest('section') && h.closest('section').querySelector('h2, h3') === h ? h.closest('section') : null;
      if (kaare && el.contains(kaare)) { if (!pois) talteen(kaare); kaare.remove(); return; }
      const alku = h.closest('.mw-heading') || h;
      const raja = e => { const x = /^H[1-6]$/.test(e.tagName) ? e : e.querySelector('h1, h2, h3, h4, h5, h6'); return x && +x.tagName[1] <= taso; };
      while (alku.nextElementSibling && !raja(alku.nextElementSibling)) {
        if (!pois) talteen(alku.nextElementSibling); alku.nextElementSibling.remove();
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
      '.authority-control', '.NavFrame', '.navigaatiomalline', '.noprint', '.mw-kartographer-maplink', '.mw-kartographer-map',
      // Muut kielet (17.11.2026): it Controllo di autorità ja alanavigaatio, de sisarprojektit ja Normdaten, fr portaalit ja
      // auktoriteettitiedot, da sisarprojektit.
      'table.CdA', '.subnavbox', '.schwesterbox', '#normdaten', '.normdaten', '#bandeau-portail', '.bandeau-portail', '.liste-portails',
      '.honsedesign-soster', '.honsedesign-portal'].join(', ')).forEach(x => x.remove());
    // Ruotsin lainausmalline (table.cquote) lainaukseksi: lainaus ja sen alla lähde.
    el.querySelectorAll('table.cquote').forEach(t => {
      const q = document.createElement('blockquote');
      [...t.querySelectorAll('td')].map(c => rivi(c.textContent)).filter(x => x && !/^[«»“”"„]$/.test(x)).forEach(x => { const p = document.createElement('p'); p.textContent = x; q.appendChild(p); });
      t.replaceWith(q);
    });
    // Taulukko ilman otsikkoriviä jäisi Turndownissa HTML:ksi (de, es: teosluettelot): ruudukoksi.
    el.querySelectorAll('table').forEach(t => {
      if (!el.contains(t) || t.parentElement.closest('table')) return;
      const r = t.rows[0];
      if (!r || ![...r.cells].every(c => c.tagName === 'TH') || t.querySelector('caption')) ojsTaulukko(t);
    });
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
    // Parsoidin tunnisteet pois ylä- ja alaindekseistä (it: Metaphysik L<sub id="mwBfY">1</sub>): Latomo muuntaa vain paljaan merkinnän.
    el.querySelectorAll('sup, sub').forEach(x => [...x.attributes].forEach(at => x.removeAttribute(at.name)));
    // Lähde- ja kirjallisuusluettelot kappaleiksi.
    const BIB = /^(lähteet|lähdeteokset|kirjallisuus|kirjallisuutta|lähdekirjallisuus|aiheesta muualla kirjallisuutta|references|sources|bibliography|works cited|cited works|further reading|citations|primary sources|secondary sources|general and cited (references|sources)|selected bibliography|šaltiniai|literatūra|bibliografija|bibliografia|literatur|bibliographie|bibliografi|litteratur|litteratur på dansk|bibliografía|kirjandus|källor|vidare läsning|βιβλιογραφία|προτεινόμενη βιβλιογραφία)$/i;
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

  /* Visuotinė lietuvių enciklopedija (vle.lt; mietintämyssyn liettuankielisten lähteiden seuraava kohde, toteutettu 17.11.2026).
     Liettuan yleisenkyklopedia: toimitettu, tekijät nimetty. Sivun skripti kirjoittaa artikkelin uudelleen ajax-tiedoista:
     .z-content (johdanto div.top-article-block, kappaleet div.text-in > div.cont, kuvat figure, väliotsikot h3), tekijät
     .author:not(.temp) .author-name, päiväykset td[data-published] (Publikuota) ja kirjallisuus [data-lit] .accord. Ennen
     skriptiä sama sisältö on .content-before-ajax-kappaleina (p.pav kuvateksti, p.lit kirjallisuus, p.aut tekijän numero);
     silloin tekijä ja päiväys haetaan samasta ajax.php:stä kuin sivu itse (LoadVleNews; vastaus 0,7 Mt, koska siinä on
     kaikki tekijät). Readability ottaisi välilehden nimen Apie autorių tekijäksi, kuvatekstin leipätekstiin ja kirjallisuuden
     yhtenä virkkeenä. Johdannon syntymä- ja kuolinaika saavat sivun CSS:n merkit (* ja †, paikan eteen väli), hakusanat
     (span.term) lihavoidaan kuten sivulla. Ristiviittaukset (a.rod) tekstiksi kuten Wikipediassa. Väliotsikot h3 → ##.
     Kirjallisuus: R: (raštai, kohteen omat teokset) ja L: (literatūra) alaluvuiksi ### Raštai ja ### Literatūra otsikon
     Literatūros sąrašas alle, kohdat puolipisteistä; lihavoidut tekijännimet tavalliseksi tekstiksi. Pois: Kiti šaltiniai
     (elokuvat ja tv-ohjelmat linkkeinä), Susiję straipsniai, galleria ja Citata-laatikko. Oikeudet käyttöehdoista
     (tarkistettu 17.11.2026). Ei mainoksia eikä lahjoituspyyntöä: ilman evästesuostumusta sivu lataa vain reCAPTCHAn,
     Pinterestin jakonapin ja Cloudflaren tilaston. Mitattu 17.11.2026: Kant, Platonas, Vydūnas, Greimas, fenomenologija. */
  const VLE_NIMI = 'Visuotinė lietuvių enciklopedija';
  async function vle() {
    if (!/(^|\.)vle\.lt$/i.test(location.hostname) || !/^\/straipsnis\/[^/]+/.test(location.pathname)) return null;
    const z = document.querySelector('[data-main-content] .z-content'), raaka = document.querySelector('[data-main-content] .content-before-ajax');
    const runko = z || raaka;
    if (!runko || !rivi(runko.textContent)) return null;
    const el = runko.cloneNode(true);
    const litLahde = z ? document.querySelector('[data-lit] .accord') : el.querySelector('p.lit');
    // Tekijän numero, monen tekijän artikkelissa kukin omana kappaleenaan (Vydūnas: 2896, 415).
    const autId = [...el.querySelectorAll('p.aut')].map(p => rivi(p.textContent));
    el.querySelectorAll('script, style, noscript, figure, img, p.pav, p.aut, p.lit, button').forEach(x => x.remove());
    el.querySelectorAll('.top-article-block, .text-in > .cont').forEach(d => {
      const p = document.createElement('p'); while (d.firstChild) p.appendChild(d.firstChild); d.replaceWith(p);
    });
    el.querySelectorAll('.bio-gim').forEach(s => s.prepend('*'));
    el.querySelectorAll('.bio-mir').forEach(s => s.prepend('†'));
    el.querySelectorAll('.bio-gim-vt, .bio-mir-vt').forEach(s => s.prepend(' '));
    el.querySelectorAll('span.term').forEach(s => { const b = document.createElement('strong'); while (s.firstChild) b.appendChild(s.firstChild); s.replaceWith(b); });
    el.querySelectorAll('a.rod').forEach(a => a.replaceWith(...a.childNodes));
    // Väliotsikot tasoa ylemmäs (h3 → ##, h4 → ###); yksi kierros, jotta h4 ei nouse kahta tasoa.
    el.querySelectorAll('h3, h4').forEach(h => { const n = document.createElement(h.tagName === 'H3' ? 'h2' : 'h3'); n.append(...h.childNodes); h.replaceWith(n); });
    el.querySelectorAll('div').forEach(d => d.replaceWith(...d.childNodes));
    // Kirjallisuus: <b>R:</b> teokset. <b>L: A. Gulyga</b> <i>Kantas</i> Vilnius 1989; <b>J. Baranova</b> …
    const lit = litLahde && litLahde.innerHTML.replace(/&nbsp;/g, '\u00a0');
    if (lit && rivi(litLahde.textContent)) {
      // Muu kirjainmerkki (Greimas: P: kirjeet) aloittaa oman kohtansa merkkeineen ilman otsikkoa: merkitystä ei arvata.
      const palat = lit.replace(/<(b|strong)>\s*(\p{Lu}):[\s\u00a0]*/gu, '\u0001$2\u0001<$1>').split(/\u0001(\p{Lu})\u0001/u);
      const ryhmat = [];
      if (rivi(palat[0].replace(/<[^>]*>/g, ''))) ryhmat.push(['', palat[0]]);
      for (let i = 1; i < palat.length; i += 2) ryhmat.push([palat[i], palat[i + 1] || '']);
      const h = document.createElement('h2'); h.textContent = 'Literatūros sąrašas'; el.append(h);
      const nimetty = ryhmat.some(([r]) => r === 'R');
      for (const [r, html] of ryhmat) {
        const tuttu = r === 'R' || r === 'L';
        if (nimetty && tuttu) { const h3 = document.createElement('h3'); h3.textContent = r === 'R' ? 'Raštai' : 'Literatūra'; el.append(h3); }
        // Puolipiste erottaa kohdat; entiteetin (&amp;) puolipiste ei.
        html.split(/(?<!&#?\w+);/).forEach((k, i) => {
          const p = document.createElement('p'); p.append(...document.importNode(jasenna((i === 0 && r && !tuttu ? r + ': ' : '') + k.trim()).body, true).childNodes);
          p.querySelectorAll('div').forEach(d => d.replaceWith(...d.childNodes));
          p.querySelectorAll('b, strong').forEach(b => b.replaceWith(...b.childNodes));
          p.normalize();
          if (rivi(p.textContent)) el.append(p);
        });
      }
    }
    el.normalize();
    let tekijat = [...document.querySelectorAll('.author-container .author:not(.temp) .author-name')].map(a => rivi(a.textContent)).filter(Boolean);
    let pv = rivi((document.querySelector('td[data-published]') || {}).textContent);
    const id = (document.querySelector('[data-load-news-id]') || { dataset: {} }).dataset.loadNewsId;
    if ((!tekijat.length || !pv) && id) {
      try {
        const ohi = new AbortController(), ajastin = setTimeout(() => ohi.abort(), 8000);
        const v = await fetch(location.origin + '/ajax.php', { method: 'POST', credentials: 'same-origin', signal: ohi.signal,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'module=News&action=LoadVleNews&news_id=' + encodeURIComponent(id) })
          .then(r => r.json()).finally(() => clearTimeout(ajastin));
        const r = v && v.return || {}, a = r.article && r.article.main_article || {};
        if (!pv) pv = a.news_date || '';
        if (!tekijat.length && r.authors) tekijat = autId.map(n => r.authors[n]).filter(Boolean).map(t => rivi(t.FirstName + ' ' + t.LastName));
      } catch (e) {}
    }
    const otsikko = rivi((document.querySelector('.titled-line h1 > span') || document.querySelector('h1') || {}).textContent) || rivi((document.querySelector('meta[property="og:title"]') || {}).content);
    return { html: irrota([el]).innerHTML, otsikko, tekija: tekijat.length > 2 ? tekijat.join(', ').replace(/, ([^,]*)$/, ' & $1') : tekijat.join(' & '),
      sivusto: VLE_NIMI, julkaistu: /^\d{4}-\d\d-\d\d$/.test(pv) ? pv : '', lahde: (document.querySelector('meta[property="og:url"]') || {}).content || osoite,
      oikeus: { teksti: '© LNB Mokslo ir enciklopedijų leidybos centras. Draudžiama atgaminti, saugoti ar perduoti šios svetainės turinį ar bet kurią jo dalį be Mokslo ir enciklopedijų leidybos centro sutikimo. Skatintina šios svetainės turinį naudoti mokslo, mokymosi ir tyrimų tikslais.',
        lahde: 'https://www.vle.lt/teises-ir-naudojimo-salygos/' } };
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
  // Solun teksti: rivinvaihdot ja solun kappaleet välilyönneiksi (IRSP: Core Hypothesis 1<br>High- … liimautui Hypothesis 1High-:ksi).
  function ojsSolu(c) {
    if (!c.querySelector('br, p, div, li')) return rivi(c.textContent);
    const k = c.cloneNode(true);
    k.querySelectorAll('br').forEach(b => b.replaceWith(' '));
    k.querySelectorAll('p, div, li').forEach(p => p.append(' '));
    return rivi(k.textContent);
  }
  function ojsTaulukko(t) {
    const ruudukko = [];
    [...t.rows].forEach((r, i) => {
      const rv = ruudukko[i] = ruudukko[i] || [];
      let j = 0;
      [...r.cells].forEach(c => {
        while (rv[j] !== undefined) j++;
        const cs = Math.max(1, c.colSpan || 1), rs = Math.max(1, c.rowSpan || 1);
        for (let a = 0; a < rs; a++) for (let b = 0; b < cs; b++) (ruudukko[i + a] = ruudukko[i + a] || [])[j + b] = a || b ? '' : ojsSolu(c);
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
    // Pelkkä DOI omana kohtanaan (journal.fi:n pdf-lehti: doi: 10.2307/2136404, 21.11.2026) edellisen perään.
    const viitteet = ojsMeta(L, 'citation_reference').reduce((k, v) => {
      if (k.length && /^(doi:\s*|https?:\/\/(dx\.)?doi\.org\/)\S+$/i.test(v)) k[k.length - 1] += ' ' + v; else k.push(v);
      return k;
    }, []);
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

  /* Projekt Gutenberg-DE (projekt-gutenberg.org; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 8). Sivusto uudistettiin
     2026 WordPressiksi: kirja on luvuittain osoitteissa /authors/<tekijä>/books/<kirja>/chapter/N, ja kirjan sivu näyttää luvun 1.
     Leikkuri kokoaa koko kirjan sivupalkin sisällysluettelosta (aside.book-reader__chapter-nav, enintään KK_RAJA lukua) kuten CCEL.
     Luvun teksti on .book-reader__chapter-content-wrapper (sama teksti on toisen kerran lukutilassa #gl-reading-mode, ei siitä),
     otsikko h2.book-reader__chapter-heading. Alaviitteet ovat tekstin sisällä span.footnote-elementteinä (title on numero):
     alaviitteiksi. Harvennus ja korostus span.em ja span.spaced kursiiviksi. Sivumerkit (a[name^=page], a.pageref) pois kuten
     Gutenbergissä. Titelseite-luku pois (nimiö toistaa otsikon), samoin luvut, joissa on vain kuvia (Hegelin Lesarten). Luvun
     alun otsikko pois, kun se toistaa luvun nimen; sivuston lukuotsikossa on sivunumero ja se katkeaa <br>:ään (Freud: 151 IV), joten
     silloin nimeksi siivottu sisäotsikko (IV. Die Traumentstellung). Pelkkä osan nimi (Kapitel I, Erster Abschnitt) yhdistetään luvun
     alun otsikkoon (Kapitel I. Grundeinteilung). Otsikoton asettelutaulukko riveittäin kappaleiksi. Etukenttään tekijä
     (.book-reader__author-link), kustantaja ja vuosi kuvausriviltä (Verlag: … | Jahr: …; painos, josta teksti on otettu).
     Rahoitus: lahjoitukset (Unterstützen); kumppanilinkit (Amazon, Thalia) eivät ole mainoksia (vrt. Wait But Why).
     Mitattu 20.11.2026. */
  const PGDE_NIMI = 'Projekt Gutenberg-DE';
  const PGDE_ISANTA = /^https?:\/\/([a-z0-9-]+\.)*projekt-gutenberg\.org(\/|$)/i;
  const PGDE_OSA = /^(?:(?:kapitel|teil|buch|abschnitt|band|book|chapter|part)\s+(?:[IVXLC]+|\d+)|(?:erster|zweiter|dritter|vierter|fünfter|sechster|siebenter|siebter|achter|neunter|zehnter)\s+(?:abschnitt|teil|band|buch))\.?$/i;
  function pgdeLuku(d, maar, laskuri) {
    const w = d && [...d.querySelectorAll('.book-reader__chapter-content-wrapper')].find(x => !x.closest('#gl-reading-mode'));
    if (!w) return null;
    const el = w.cloneNode(true);
    // Sisäotsikon raaka teksti ennen sivunumeron poistoa: sivuston lukuotsikko katkeaa <br>:ään ja sisältää numeron (Freud: 29 I).
    const ens0 = [...el.querySelectorAll('*')].find(x => /^H[1-6]$/.test(x.tagName) || (x.tagName === 'P' && rivi(x.textContent)));
    const ensRaaka = ens0 && /^H[1-6]$/.test(ens0.tagName) ? rivi(ens0.textContent) : '';
    el.querySelectorAll('script, style, img, a.pageref, a[name^="page"]').forEach(x => x.remove());
    // Otsikon rivinvaihto: numero tai kirjain ja nimi (IV<br>Die Traumentstellung → IV. Die Traumentstellung), muuten kaksoispiste.
    el.querySelectorAll(OTSIKOT).forEach(h => {
      if (!h.querySelector('br')) return;
      h.querySelectorAll('br').forEach(b => b.replaceWith('\u0001'));
      const osat = h.textContent.split('\u0001').map(rivi).filter(Boolean);
      h.textContent = osat.reduce((a, x) => !a ? x : /^([IVXLC]+|\d+|[A-Z])\.?$/.test(a) ? a.replace(/\.?$/, '. ') + x : a + (/[.:;!?]$/.test(a) ? ' ' : ': ') + x, '');
    });
    el.querySelectorAll('span.footnote').forEach(s => {
      if (!el.contains(s)) return;
      const k = s.cloneNode(true);
      k.querySelectorAll('a[name]').forEach(a => a.replaceWith(...a.childNodes));
      const t = muunna(k.innerHTML, 'inlined').trim();
      const ed = s.previousSibling;
      if (ed && ed.nodeType === 3) ed.nodeValue = ed.nodeValue.replace(/\s+$/, '');
      if (!t) { s.remove(); return; }
      const tunnus = 'gd' + (++laskuri.n);
      s.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('span.em, span.spaced').forEach(s => {
      const em = document.createElement('em');
      while (s.firstChild) em.appendChild(s.firstChild);
      s.replaceWith(em);
    });
    el.querySelectorAll('a[name]').forEach(a => a.replaceWith(...a.childNodes));
    // Vaihtoehtoiset sanat murtolukuna (die/ein): tekstiksi, koska sup ja sub jäisivät Luinissa raaoiksi merkinnöiksi.
    el.querySelectorAll('sup.fract, sub.fract').forEach(x => x.replaceWith(...x.childNodes));
    // Otsikoton asettelutaulukko (Freudin unitekstin vaihtoehdot) riveittäin kappaleiksi: Luinissa raaka HTML näkyisi tekstinä.
    el.querySelectorAll('table').forEach(t => {
      if (t.querySelector('th, table')) return;
      const kpl = [...t.querySelectorAll('tr')].map(tr => {
        const p = document.createElement('p');
        [...tr.children].forEach((td, i) => {
          if (i && rivi(td.textContent)) p.append(' ');
          [...td.childNodes].forEach(n => { if (n.nodeName === 'P') p.append(...n.childNodes, ' '); else p.append(n); });
        });
        return p;
      }).filter(p => rivi(p.textContent));
      t.replaceWith(...kpl);
    });
    kkLinkit(el, PGDE_ISANTA);
    return { el, otsikko: rivi((d.querySelector('h2.book-reader__chapter-heading') || {}).textContent), ensRaaka };
  }
  async function gutenbergDe() {
    if (!/(^|\.)projekt-gutenberg\.org$/i.test(location.hostname)) return null;
    const polku = /^(\/authors\/[^/]+\/books\/[^/]+)\/?(?:chapter\/(\d+)\/?)?$/.exec(location.pathname);
    if (!polku || !document.querySelector('.book-reader__chapter-content-wrapper')) return null;
    const nykyNro = polku[2] ? +polku[2] : 1, luvut = [];
    document.querySelectorAll('aside.book-reader__chapter-nav li a[href]').forEach(a => {
      const u = new URL(a.getAttribute('href'), osoite).href, nro = (/\/chapter\/(\d+)\/?$/.exec(u) || [])[1];
      if (nro && !luvut.some(l => l.u === u)) luvut.push({ u, nro: +nro, nimi: rivi((a.querySelector('.book-reader__chapter-title') || a).textContent) });
    });
    const valitut = luvut.length && luvut.length <= KK_RAJA ? luvut : [{ u: osoite, nro: nykyNro, nimi: '' }];
    const haettavat = valitut.filter(l => l.nro !== nykyNro);
    const haetut = await kkHae(haettavat.map(l => l.u));
    const doc = l => l.nro === nykyNro ? document : haetut[haettavat.indexOf(l)];
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    const tiivis = x => rivi(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    let sivuja = 0;
    for (const l of valitut) {
      if (/^(titelseite|titelblatt|impressum|inhalt|inhaltsverzeichnis)\.?$/i.test(l.nimi)) continue;
      const r = pgdeLuku(doc(l), maar, laskuri);
      if (!r || kkSanoja(r.el) < 3) continue;
      sivuja++;
      let nimi = r.otsikko || l.nimi;
      const ens = [...r.el.querySelectorAll('*')].find(x => /^H[1-6]$/.test(x.tagName) || (x.tagName === 'P' && rivi(x.textContent)));
      if (ens && /^H[1-6]$/.test(ens.tagName) && nimi) {
        const a = tiivis(ens.textContent), b = tiivis(nimi), raaka = tiivis(r.ensRaaka);
        // Sivuston otsikko on sisäotsikon alku tai sama sivunumeroineen (Freud: 29 I Die wissenschaftliche …): luvun nimeksi
        // siivottu sisäotsikko (I. Die wissenschaftliche …).
        if (raaka && b && raaka.startsWith(b) && a) { nimi = rivi(ens.textContent); ens.remove(); }
        else if (a && (a === b || b.includes(a) || a.includes(b))) ens.remove();
        // Pelkkä osan nimi (Kapitel I, Erster Abschnitt) ja varsinainen nimi luvun alussa yhdeksi: Kapitel I. Grundeinteilung.
        else if (a && PGDE_OSA.test(nimi)) { nimi = nimi.replace(/\.?$/, '. ') + rivi(ens.textContent); ens.remove(); }
      }
      kkSiirra(r.el, 2);
      if (valitut.length > 1 && nimi) { const h = document.createElement('h2'); h.textContent = nimi; el.appendChild(h); }
      el.append(...r.el.childNodes);
    }
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const kuvaus = rivi((document.querySelector('.book-reader__description') || {}).textContent);
    const kust = (/Verlag:\s*([^|]+)/.exec(kuvaus) || [])[1], vuosi = (/Jahr:\s*(\d{4})/.exec(kuvaus) || [])[1];
    return { html: irrota([el]).innerHTML, otsikko: rivi((document.querySelector('h1.book-reader__title') || {}).textContent) || rivi(document.title),
      tekija: rivi((document.querySelector('.book-reader__author-link') || {}).textContent),
      kustantaja: kust && !/gutenberg/i.test(kust) ? rivi(kust) : '', julkaistu: vuosi || '',
      sivusto: PGDE_NIMI, lahde: valitut.length > 1 ? location.origin + polku[1] + '/' : osoite, maar,
      naytto: PGDE_NIMI + (sivuja > 1 ? ' (' + sivuja + ' lukua)' : '') };
  }

  /* SLS:n digitaaliset editiot (topelius.sls.fi, westermarck.sls.fi, vonwright.sls.fi; käyttäjän pyyntö 20.11.2026,
     sivustoehdokkaat-3 kärki 6). Yhteinen Angular-alusta, jonka palvelin renderöi: lukuteksti <reading-text>-komponentissa
     (.teiContainer) ja toimittajan kommentit samalla sivulla <comments>-komponentissa (p.teiComment.note.en<ID>: notePosition,
     noteLemma, noteText). Kommentin paikka tekstissä on kuvake img.comment[data-id=end<ID>]: kommentit alaviitteiksi muodossa
     *lemma* – selitys. Tekijän alaviitteet: span.footnoteindicator[data-id=ftnN] → loppuluettelon li[data-id] .footnoteText.
     Työkaluvihjeet (span.tooltip: henkilöt, paikat, kielet, korjaukset ”original: …”), lemman alkumerkit, sivunvaihdot (pb_orig,
     pb_edition) ja tyhjät ankkurit pois; korjattu teksti (corr) jää. Kappalenumero (span.paragraph_number, editiossa viittaamisen
     yksikkö *stycke*, johon kommentit viittaavat) yläindeksiksi kuten OpenEditionissa. Westermarckin uudempi renderöinti: span.pNumber,
     sivunvaihto [role=doc-pagebreak] (||), harvennus span.expanded, ajoitusrivi div.milestone ja motto p.epigraph. Säkeet (p.l) yhdeksi kappaleeksi rivinvaihdoin,
     motto (h5.motto) lainaukseksi. Johdanto ja esipuhe (/introduction, /foreword: article .teiContainer) leikataan sellaisinaan.
     Kokoaminen: sivun staattisesta sisällyksestä (.static-collection-toc) kokoelman tekstisivut (/text/<id>, ilman ?position-
     linkkejä); kirjana vain, jos sisällyksessä on nimiösivu (/title) ja tekstisivuja on enintään 30 (Topeliuksen romaani kolmessa
     osassa, Westermarckin Sex år i Marocko 12 lukua). Artikkelikokoelma (ei nimiötä) ja kirjeenvaihto (von Wright: 86 kirjettä)
     leikataan teksti kerrallaan. Palvelin ei aina renderöi muiden osien lukutekstiä (Topelius 20.11.2026: osat 2 ja 3 virheilmoituksena;
     selain hakee tekstin rajapinnasta, jota sovite ei käytä): silloin vain avattu teksti. Johdannon taulukot ruudukoiksi (ojsTaulukko),
     otsikko kappaleeksi. Johdantoa ei liitetä kirjaan (Topeliuksessa 40 000 sanaa). Etukenttään tekijä sivuston mukaan,
     teos (kokoelman nimi), sivusto (editio) ja kustantaja SLS. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 20.11.2026. */
  const SLS_TEKIJAT = { topelius: 'Zacharias Topelius', westermarck: 'Edvard Westermarck', vonwright: 'Georg Henrik von Wright' };
  const SLS_EDITIOT = { topelius: 'Zacharias Topelius Skrifter', westermarck: 'Edvard Westermarck', vonwright: 'Den okände von Wright' };
  function slsRunko(d, maar, laskuri) {
    const juuri = d && (d.querySelector('reading-text .teiContainer') ||
      [...d.querySelectorAll('article .teiContainer, .teiContainer')].find(x => !x.matches('.toolTip, .infoOverlay') && !x.closest('comments')));
    if (!juuri) return null;
    const el = juuri.cloneNode(true);
    // Tekijän alaviitteet loppuluettelosta.
    const ftn = new Map();
    el.querySelectorAll('li.footnoteItem[data-id]').forEach(li => ftn.set(li.getAttribute('data-id'), li.querySelector('.footnoteText')));
    el.querySelectorAll('section[role="doc-endnotes"], ol.footnotesList').forEach(x => x.remove());
    // Toimittajan kommentit samalta sivulta.
    const kom = new Map();
    const kd = d.querySelector('comments .teiContainer');
    if (kd) kd.querySelectorAll('p.teiComment.note').forEach(p => {
      const id = (/\ben(\d+)\b/.exec(p.className) || [])[1];
      if (id) kom.set(id, { lemma: rivi((p.querySelector('.noteLemma') || {}).textContent), teksti: p.querySelector('.noteText') });
    });
    el.querySelectorAll('span.tooltip, .anchor_lemma, span.pb_orig, span.pb_edition, [role="doc-pagebreak"], a.anchor, img[alt="tomt"]').forEach(x => x.remove());
    const viite = (x, html) => {
      const k = jasenna('<div>' + html + '</div>').body.firstChild;
      k.querySelectorAll('span.tooltip').forEach(t => t.remove());
      const t = muunna(k.innerHTML, 'inlined').trim();
      if (!t) { x.remove(); return; }
      const tunnus = 'sls' + (++laskuri.n);
      x.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    };
    el.querySelectorAll('span.footnoteindicator[data-id]').forEach(s => {
      const f = ftn.get(s.getAttribute('data-id'));
      if (f) viite(s, f.innerHTML); else s.remove();
    });
    el.querySelectorAll('img.comment[data-id]').forEach(img => {
      const k = kom.get((/^end(\d+)$/.exec(img.getAttribute('data-id')) || [])[1]);
      if (k && k.teksti) viite(img, (k.lemma ? '<em>' + k.lemma.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;') + '</em> – ' : '') + k.teksti.innerHTML.trim());
      else img.remove();
    });
    el.querySelectorAll('img').forEach(x => x.remove());
    el.querySelectorAll('span.paragraph_number, span.pNumber').forEach(s => {
      const n = rivi(s.textContent);
      if (!n) { s.remove(); return; }
      const sup = document.createElement('sup'); sup.textContent = n; s.replaceWith(sup, ' ');
    });
    // Uudempi renderöinti (Westermarck): ajoitusrivi div.milestone kappaleeksi, motto p.quote.epigraph lainaukseksi.
    el.querySelectorAll('div.milestone').forEach(x => { if (!rivi(x.textContent)) { x.remove(); return; } const p = document.createElement('p'); while (x.firstChild) p.appendChild(x.firstChild); x.replaceWith(p); });
    el.querySelectorAll('p.epigraph').forEach(x => { const q = document.createElement('blockquote'); x.replaceWith(q); q.appendChild(x); });
    el.querySelectorAll('span.italics, span.expanded').forEach(s => { const em = document.createElement('em'); while (s.firstChild) em.appendChild(s.firstChild); s.replaceWith(em); });
    el.querySelectorAll('span.bold').forEach(s => { const b = document.createElement('strong'); while (s.firstChild) b.appendChild(s.firstChild); s.replaceWith(b); });
    // Säkeet: peräkkäiset p.l yhdeksi kappaleeksi.
    el.querySelectorAll('p.l').forEach(p => {
      const ed = p.previousElementSibling;
      if (ed && ed.tagName === 'P' && ed.classList.contains('l')) { ed.append(document.createElement('br'), ...p.childNodes); p.remove(); }
    });
    el.querySelectorAll('h5.motto').forEach(h => { const q = document.createElement('blockquote'), p = document.createElement('p'); while (h.firstChild) p.appendChild(h.firstChild); q.appendChild(p); h.replaceWith(q); });
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent) && !p.querySelector('br')) p.remove(); });
    // Johdannon taulukot: otsikko (caption, jossa voi olla alaviitemerkki) kappaleeksi ja taulukko ruudukoksi kuten OJS:ssä.
    el.querySelectorAll('table').forEach(t => {
      if (!rivi(t.textContent)) { t.remove(); return; }
      const cap = t.querySelector('caption');
      if (cap) { const p = document.createElement('p'); while (cap.firstChild) p.appendChild(cap.firstChild); cap.remove(); t.before(p); }
      ojsTaulukko(t);
    });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*sls\.fi(\/|$)/i);
    return el;
  }
  async function sls() {
    const sivu = (/^([a-z0-9-]+)\.sls\.fi$/i.exec(location.hostname) || [])[1];
    const polku = /^\/([a-z]{2})\/collection\/(\d+)\/(text\/\d+(?:\/[^/?#]+)?|introduction|foreword)\/?$/.exec(location.pathname);
    if (!sivu || !SLS_TEKIJAT[sivu] || !polku || !document.querySelector('.teiContainer')) return null;
    const toc = document.querySelector('.static-collection-toc');
    const kokoelma = rivi((toc && toc.querySelector('p b, p strong, p') || {}).textContent);
    const tekstit = [];
    if (toc) toc.querySelectorAll('a[href]').forEach(a => {
      const u = new URL(a.getAttribute('href'), osoite);
      if (u.search || !/\/collection\/\d+\/text\/\d+/.test(u.pathname)) return;
      if (!tekstit.some(t => t.u === u.href)) tekstit.push({ u: u.href, nimi: rivi(a.textContent) });
    });
    const nimio = !!(toc && toc.querySelector('a[href$="/title"]'));
    let kirja = /^text\//.test(polku[3]) && nimio && tekstit.length > 1 && tekstit.length <= 30;
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    let otsikko = '', sivuja = 0;
    const oma = osoite.split('?')[0];
    let muut = [], haetut = [];
    if (kirja) {
      muut = tekstit.filter(t => t.u !== oma);
      haetut = await kkHae(muut.map(t => t.u));
      // Palvelin ei aina renderöi lukutekstiä (Topelius, osat 2 ja 3: Ett fel har uppstått. Lästexten kunde inte hämtas.); selain
      // hakee sen silloin rajapinnasta. Jos yksikin osa puuttuu, leikataan vain avattu teksti, jonka selain on jo näyttänyt.
      const ehja = d => { const r = d && d.querySelector('reading-text');
        return !!r && kkSanoja(r) >= 50 && !/kunde inte hämtas|ei voitu hakea|could not be (retrieved|fetched)/i.test(rivi(r.textContent).slice(0, 200)); };
      if (!tekstit.every(t => ehja(t.u === oma ? document : haetut[muut.indexOf(t)]))) kirja = false;
    }
    if (kirja) {
      for (const t of tekstit) {
        const r = slsRunko(t.u === oma ? document : haetut[muut.indexOf(t)], maar, laskuri);
        if (!r || kkSanoja(r) < 3) continue;
        sivuja++;
        r.querySelectorAll('h1').forEach(h => h.remove());
        // Luvun nimi toistuu tekstin alussa otsikkona (Westermarck: Förord, I. Min första resa …): pois.
        const ens = [...r.querySelectorAll('*')].find(x => /^H[1-6]$/.test(x.tagName) || (x.tagName === 'P' && rivi(x.textContent)));
        const tv = x => rivi(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        if (ens && /^H[1-6]$/.test(ens.tagName) && tv(ens.textContent) && (tv(t.nimi).includes(tv(ens.textContent)) || tv(ens.textContent).includes(tv(t.nimi)))) ens.remove();
        kkSiirra(r, 2);
        const h = document.createElement('h2'); h.textContent = t.nimi.replace(/\.$/, ''); el.appendChild(h);
        el.append(...r.childNodes);
      }
      otsikko = kokoelma;
    } else {
      const r = slsRunko(document, maar, laskuri);
      if (!r) return null;
      // Tekstin omat h1-rivit (Första delen. / Nattens barn.) otsikoksi.
      const h1 = [...r.querySelectorAll('h1')];
      otsikko = h1.map(h => rivi(h.textContent).replace(/\.$/, '')).filter(Boolean).join('. ');
      h1.forEach(h => h.remove());
      if (!otsikko) otsikko = rivi(document.title).split(/\s+-\s+/)[0];
      const tv = x => rivi(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      r.querySelectorAll(OTSIKOT).forEach(h => { if (tv(h.textContent) && tv(h.textContent) === tv(otsikko)) h.remove(); });
      el.append(...r.childNodes);
      sivuja = 1;
    }
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const osat = rivi(document.title).split(/\s+-\s+/);
    return { html: irrota([el]).innerHTML, otsikko: otsikko || osat[0], tekija: SLS_TEKIJAT[sivu],
      teos: !kirja && kokoelma && kokoelma !== otsikko ? kokoelma : '', sivusto: SLS_EDITIOT[sivu],
      kustantaja: 'Svenska litteratursällskapet i Finland', lahde: kirja ? oma.replace(/\/text\/.*$/, '/title') : oma,
      maar, naytto: SLS_EDITIOT[sivu] + (sivuja > 1 ? ' (' + sivuja + ' tekstiä)' : '') };
  }

  /* J. V. Snellmanin kootut teokset (snellman.kootutteokset.fi; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 7; Drupal 7).
     Asiakirja (/fi/dokumentit/<nimi>) on yksi lehtikirjoitus, kirje tai lausunto: suomennos .field-name-field-suomi, alaviitteet
     a.see-footnote → ul.footnotes li (Drupalin footnotes-moduuli), ruotsinkielinen alkuteksti .field-name-field-ruotsi (usein vielä
     TULOSSA) ja alkukielinen pdf. Suomennos ja, jos alkuteksti on jo tekstinä, se omana lukunaan (Ruotsiksi). Tyhjät kappaleet ja
     kappaleiden tyylit pois. Otsikko .page-title-headerista, julkaistu päiväyskentästä (28.4.1840 → 1840-04-28), laji
     asiakirjatyypistä (Lehtikirjoitus, Kirje). Ei mainoksia eikä lahjoituspyyntöä. Mitattu 20.11.2026. */
  const SN_NIMI = 'J. V. Snellmanin kootut teokset';
  /* Väliotsikot (käyttäjän havainto 21.11.2026: asiakirjat on tekstiksi tehty vaihtelevasti, ja joissain on väliotsikoita
     tavallisina kappaleina). Mitattu 81 asiakirjasta, osumat vain otsikoihin: 1) versaalirivi (Neljä avioliittoa:
     KAHDENLAISTA RAKKAUTTA, II. NIIN SIINÄ KÄY) on ##, ja sitä edeltävä pelkkä roomalainen numero (I.) liitetään siihen;
     2) pelkkä roomalainen numero (Litteraturbladin I–III, romaanin luvut) on ###, kun versaaliotsikoita on, muuten ##;
     3) muissa kuin kirjeissä, sähkeissä ja runoissa enintään kuuden sanan rivi ilman numeroita ja päätevälimerkkiä pitkien
     (väh. 25 sanaa) kappaleiden välissä tai alussa (Teosofia: Maailma ja ihminen) on ##. Kirjeiden päiväykset, puhuttelut ja
     allekirjoitukset sekä runojen säkeet eivät täytä ehtoja. */
  const SN_ROOM = /^(?=[IVXL])(XL|L?X{0,3})(IX|IV|V?I{0,3})\.?$/;
  // Sarjaotsikko: 1–4 sanan alku, roomalainen numero, muut numerot (& III, , V, ja VI) ja toimittajan huomautus hakasulkeissa.
  const SN_SARJA = /^(\p{Lu}[\p{L}-]*(?:\s+\p{L}[\p{L}-]*){0,3})\s+(?=[IVXL])(?:XL|L?X{0,3})(?:IX|IV|V?I{0,3})(?![\p{L}\p{N}])(?:\s*(?:,|&|ja|–|-)\s*(?=[IVXL])(?:XL|L?X{0,3})(?:IX|IV|V?I{0,3})(?![\p{L}\p{N}]))*\.?(?:\s*\[[^\]]*\])?$/u;
  // Kappaleen teksti: <br> välilyönniksi (säkeiksi yhdistetyt rivit, snRivit).
  const snTx = p => { const k = p.cloneNode(true); k.querySelectorAll('br').forEach(b => b.replaceWith(' ')); return rivi(k.textContent.replace(/ /g, ' ')); };
  const snSanoja = t => (t.match(/\S+/g) || []).length;
  /* Rivit säkeiksi (21.11.2026, Snellman kunniallisesti): sivuston tekstit on tehty painetusta kirjasta rivi kappaleeksi
     runoissa, romaanien ja näytelmän laulunsäkeissä, väitöskirjan mottossa ja luetteloissa (a) …, metallirahana 8 985 277).
     Pienellä alkava enintään 12 sanan kappale liitetään edelliseen rivinvaihdolla, kun edellinen rivi on lyhyt eikä pääty
     virkkeen loppuun; runossa ja laulussa säkeistön kaikki rivit. Tyhjä kappale on säkeistöraja. 89 asiakirjan otoksessa
     osumat olivat säkeitä, luetteloita, taulukkorivejä ja kirjeiden loppukohteliaisuuksia; proosakappaleita 0.
     Lisäksi (käyttäjän linjaus 21.11.2026: rivinvaihto kenoviivalla, kun ei ole otsikkoa eikä osanvaihtoa; sisennys vain
     leipätekstiin) peräkkäiset lyhyet rivit, jotka eivät pääty virkkeeseen eivätkä ole otsikkoehdokkaita: kirjeen alku
     (Kokkolassa 26.9.1827 | Herra Joh. Wilh. Snellman | Turku), sähkeen vastaanottaja, loppukohteliaisuus ja allekirjoitus,
     näytelmän henkilöluettelo. */
  const snVersaali = t => snSanoja(t) <= 12 && t === t.toUpperCase() && !/\d/.test(t) &&
    (t.match(/\p{Lu}{3,}/gu) || []).some(w => !SN_ROOM.test(w));
  const snLyhyt = t => snSanoja(t) <= 8 && !/[.!?…]["”’)]?$/.test(t) && !/^["”“–—-]/.test(t) && !SN_ROOM.test(t) && !snVersaali(t);
  /* Pykälät ja luennot (käyttäjän havainto 22.11.2026: Historiallinen esitys Hegelin logiikan suhteesta järjestelmän muihin
     osiin, luentoluonnos 1843: luennot ja pykälät eivät olleet väliotsikoita). Painetun laitoksen pykälä on oma kappaleensa
     (§ 1, § 2.), ja teksti alkaa seuraavasta; luentokäsikirjoituksissa samoin luento (1. luento, 7. luento. Kuulustelu,
     Kertaus 4. ja 5. luento, § 3). Koko korpuksessa (2 949 asiakirjaa) 562 pykälää ja 42 luentoa 23 asiakirjassa:
     Filosofian alkeiskurssin vihot, väitöskirjat, luentojen käsikirjoitukset, säännöt, pöytäkirjat ja hallitusmuotoesitys.
     Ennen ne jäivät tekstiksi tai snRivit() liitti ne seuraavaan lyhyeen riviin (väitöskirjan § 1). Nimellinen pykälä vain
     pisteellä ja enintään 12 sanan nimellä ilman pilkkua (§ 19. Logiikasta); sääntötekstin pykälä (§ 6 Näihin kokoontumisiin
     kutsutaan …), viittaus (§ 6, jälkimmäinen momentti:) ja § 86. – Zusatz 1:n loppu … jäävät tekstiksi. */
  const SN_PYKALA = /^§\s*\d{1,3}[a-z]?(?:\.?|\.\s+\p{Lu}[^,;:–—§]*)$/u;
  const SN_LUENTO = /^(?:\d{1,2}\.\s+luento\b|Kertaus\s+\d{1,2}\.(?:\s+ja\s+\d{1,2}\.)?\s+luento\b)/iu;
  const snOts = t => SN_LUENTO.test(t) && snSanoja(t) <= 8 ? 'lu' : SN_PYKALA.test(t) && snSanoja(t) <= 14 ? 'p' : '';
  function snRivit(el, laji) {
    const runo = /runo|laulu/i.test(laji || '');
    let ed = null;
    [...el.children].forEach(p => {
      if (p.tagName !== 'P') { ed = null; return; }
      const t = snTx(p);
      if (!t) { ed = null; return; }
      // Pykälä ja luento eivät liity edelliseen eikä seuraava niihin.
      if (snOts(t)) { ed = null; return; }
      // Edellisen kappaleen viimeinen rivi (viimeisen <br>:n jälkeen).
      let edRivi = '';
      for (let n = ed && ed.lastChild; n && n.nodeName !== 'BR'; n = n.previousSibling) edRivi = n.textContent + edRivi;
      edRivi = rivi(edRivi.replace(/\u00a0/g, ' '));
      if (ed && snSanoja(t) <= 12 && snSanoja(edRivi) <= 12 && (runo || (/^\p{Ll}/u.test(t) && !/[.!?…]["”’)]?$/.test(edRivi)) ||
        snLyhyt(t) && snLyhyt(edRivi) && !ed.querySelector('h1, h2, h3'))) {
        ed.append(document.createElement('br'), ...p.childNodes);
        p.remove();
        return;
      }
      ed = p;
    });
  }
  /* Väliotsikot (käyttäjän havainto 21.11.2026: asiakirjat on tekstiksi tehty vaihtelevasti, ja joissain on väliotsikoita
     tavallisina kappaleina). Mitattu 81 asiakirjasta, osumat vain otsikoihin: 1) versaalirivi (Neljä avioliittoa:
     KAHDENLAISTA RAKKAUTTA, II. NIIN SIINÄ KÄY) on ##, ja sitä edeltävä pelkkä roomalainen numero (I.) liitetään siihen;
     2) pelkkä roomalainen numero (Litteraturbladin I–III, romaanin luvut) on ###, kun versaaliotsikoita on, muuten ##;
     3) muissa kuin kirjeissä, sähkeissä ja runoissa enintään kuuden sanan rivi ilman numeroita ja päätevälimerkkiä pitkien
     (väh. 25 sanaa) kappaleiden välissä tai alussa (Teosofia: Maailma ja ihminen) on ##. Kirjeiden päiväykset, puhuttelut ja
     allekirjoitukset sekä runojen säkeet eivät täytä ehtoja.
     Tarkennukset (21.11.2026, 89 asiakirjan otos): versaalissa pitää olla muu kolmen kirjaimen sana kuin roomalainen numero
     (oikeusopin § III ei ole otsikko); roomalainen numero, piste ja versaalinimi pienellä jatkettuna (III. JOSKUS KÄY TOISINKIN,
     hahmotelma romaanikäsikirjoitukseksi) on versaaliotsikko; versaalirivi, joka päättyy sanaan ELI, JA tai pilkkuun, jatkuu
     seuraavalla versaalirivillä (KOLMAS OSA. … ELI | YHTEISKUNTAOPPI); kirjan oman sisällysluettelon (SISÄLLYS, [SISÄLTÖ)
     versaalirivit eivät ole otsikoita ennen kuin luettelon ensimmäinen nimi toistuu (JOHDANTO), muuten oppikirjojen
     sisällysluettelo toistui otsikkoina. Säkeiksi yhdistetty kappale ei ole pitkä kappale (väitöskirjan moton perässä
     Cornelius Agrippa ei ole otsikko). */
  function snOtsikot(el, laji) {
    const ps = [...el.children].filter(x => x.tagName === 'P'), tx = ps.map(snTx);
    const sanoja = snSanoja;
    const versaali = snVersaali;
    const versaaliAlku = t => sanoja(t) <= 10 && !/[.]$/.test(t) && /^(?=[IVXL])(XL|L?X{0,3})(IX|IV|V?I{0,3})\.\s+\p{Lu}{2,}(\s+\p{Lu}{2,})+,?\s+\p{Ll}/u.test(t);
    const vapaa = !/kirje|sähke|runo|laulu/i.test(laji || '');
    const kaikki = ps.map((p, k) => {
      const t = tx[k];
      if (p.querySelector('br')) return '';
      if (snOts(t)) return snOts(t);
      if (SN_ROOM.test(t)) return 'r';
      if (versaali(t) || versaaliAlku(t)) return 'v';
      // Lainauksen perässä oleva nimi (vähintään kaksi sanaa) on allekirjoitus, ei otsikko (21.11.2026: Finlands Allmänna
      // Tidningin kirjoituksessa lainattu ilmoitus ja sen alla Carl Zuhr; yksisanainen Paradokseja on otsikko).
      if (vapaa && sanoja(t) <= 6 && /^\p{Lu}/u.test(t) && !/\d/.test(t) && !/[.,;:!?…”"\])]$/.test(t) &&
        (k === 0 || sanoja(tx[k - 1]) >= 25 && !ps[k - 1].querySelector('br') && !(/[”"»]$/.test(tx[k - 1]) && /\s/.test(t) && SN_NIMI_RIVI.test(t))) &&
        k + 1 < ps.length && sanoja(tx[k + 1]) >= 25) return 'l';
      return '';
    });
    /* Sarjaotsikot (21.11.2026, koko korpuksen pesu): luentosarjojen käsikirjoituksissa luennot ovat riveinä Siveysoppi I,
       Siveysoppi II & III, Siveysoppi IV, V ja Akateeminen opiskelu VII [luvun numero kahteen kertaan]. Pituussääntö tunnisti
       niistä vain ne, joiden naapurikappaleet olivat pitkiä (Siveysopin 18 otsikosta 9, Akateemisen opiskelun 30:stä 18). Sama alku ja roomalainen numero
       vähintään kahdesti omina riveinään → kaikki otsikoiksi. */
    if (vapaa) {
      const sarja = {};
      ps.forEach((p, k) => {
        const m = !p.querySelector('br') && sanoja(tx[k]) <= 9 && SN_SARJA.exec(tx[k]);
        if (m) (sarja[m[1]] = sarja[m[1]] || []).push(k);
      });
      Object.values(sarja).forEach(ks => { if (ks.length >= 2) ks.forEach(k => { if (!kaikki[k]) kaikki[k] = 'l'; }); });
    }
    // Kirjan oma sisällysluettelo: sen rivit tekstiksi, kunnes ensimmäinen nimi toistuu.
    const nimi = t => t.replace(/[[\]().]/g, '').replace(/\s+/g, ' ').trim();
    for (let k = 0; k < ps.length; k++) {
      if (kaikki[k] !== 'v' || !/^\[?\s*(SISÄLLYS|SISÄLTÖ|SISÄLLYSLUETTELO)(?!\p{L})/u.test(tx[k])) continue;
      const nahty = new Set();
      let j = k + 1;
      for (; j < ps.length; j++) {
        if (kaikki[j] === 'v' && nahty.has(nimi(tx[j]))) break;
        if (kaikki[j]) { nahty.add(nimi(tx[j])); kaikki[j] = ''; }
      }
      if (j === ps.length) break;
      k = j - 1;
    }
    // Katkennut versaaliotsikko yhdeksi.
    for (let k = 1; k < ps.length; k++) {
      if (kaikki[k] === 'v' && kaikki[k - 1] === 'v' && /(\s(ELI|JA|TAI|SEKÄ)|[,–-])$/.test(tx[k - 1])) {
        tx[k] = tx[k - 1] + ' ' + tx[k];
        ps[k - 1].remove();
        kaikki[k - 1] = '';
      }
    }
    const vers = kaikki.includes('v');
    ps.forEach((p, k) => {
      const l = kaikki[k];
      if (!l || !p.parentNode) return;
      let t = tx[k];
      // Pykälä on ####, kuten md.js:n pykäläsarja (pykalaSarjat(): enintään alaluvun alaluku); luento ##.
      if (l === 'p' || l === 'lu') {
        const h = document.createElement(l === 'p' ? 'h4' : 'h2');
        // Pelkän numeron piste pois (§ 2. → § 2, 15. luento. → 15. luento); nimellinen pitää tekstinsä (… teossa on jne.).
        h.textContent = /^(?:§\s*\d+[a-z]?|\d{1,2}\.\s+luento)\.$/u.test(t) ? t.slice(0, -1) : t;
        p.replaceWith(h);
        return;
      }
      if (l === 'r' && kaikki[k + 1] === 'v') return;
      if (l === 'v' && kaikki[k - 1] === 'r') { t = tx[k - 1].replace(/\.?$/, '.') + ' ' + t; ps[k - 1].remove(); }
      const h = document.createElement(l === 'r' && vers ? 'h3' : 'h2');
      // Versaalit tavalliseksi kuten nimekkeessä (21.11.2026): ENSIMMÄINEN OSA. OPPI KÄSITTEESTÄ → Ensimmäinen osa. Oppi
      // käsitteestä; erisnimet tekstin kirjoitusasun mukaan (KERTOMUS MARI APPELBERGISTA. → Kertomus Mari Appelbergista.).
      h.textContent = snOtsikko(t, tx);
      p.replaceWith(h);
    });
  }
  /* Taulukot (21.11.2026): sivuston taulukot ovat painetun laitoksen asetelmia ilman otsikkoriviä (logiikan luentojen
     kaavio Metodi | oleminen – olemassaoleminen, rahajärjestelmän kolikkotaulukko), ja solussa on monta riviä kappaleina
     (5 markkaa | 2 markkaa | 1 markka). Turndown jättää otsikkorivittömän taulukon HTML:ksi, joka näkyi Luinissa merkintöinä.
     Ruudukoksi (yhdistetyt solut tyhjiksi, solun rivit kauttaviivoin), tyhjät sarakkeet pois ja tyhjä otsikkorivi, jotta
     rivien järjestys säilyy; yksisarakkeinen tai yksirivinen riveiksi. */
  function snTaulukko(t) {
    const solu = c => { const k = c.cloneNode(true); k.querySelectorAll('br').forEach(b => b.replaceWith('\u0001'));
      k.querySelectorAll('p, div').forEach(p => p.append('\u0001'));
      return k.textContent.replace(/\u00a0/g, ' ').split('\u0001').map(rivi).filter(Boolean).join(' / '); };
    const ruudukko = [];
    [...t.rows].forEach((r, i) => {
      const rv = ruudukko[i] = ruudukko[i] || [];
      let j = 0;
      [...r.cells].forEach(c => {
        while (rv[j] !== undefined) j++;
        const cs = Math.max(1, c.colSpan || 1), rs = Math.max(1, c.rowSpan || 1);
        for (let a = 0; a < rs; a++) for (let b = 0; b < cs; b++) (ruudukko[i + a] = ruudukko[i + a] || [])[j + b] = a || b ? '' : solu(c);
        j += cs;
      });
    });
    const n = Math.max(0, ...ruudukko.map(r => r.length));
    const kaytetyt = [...Array(n).keys()].filter(j => ruudukko.some(r => r[j]));
    const rivit = ruudukko.map(r => kaytetyt.map(j => r[j] || '')).filter(r => r.some(Boolean));
    if (kaytetyt.length < 2 || rivit.length < 2) {
      const p = document.createElement('p');
      rivit.map(r => r.filter(Boolean).join(' ')).forEach((x, i) => { if (i) p.appendChild(document.createElement('br')); p.append(x); });
      return rivi(p.textContent) ? t.replaceWith(p) : t.remove();
    }
    const u = document.createElement('table'), th = document.createElement('thead'), tb = document.createElement('tbody'), o = document.createElement('tr');
    kaytetyt.forEach(() => o.appendChild(document.createElement('th')));
    th.appendChild(o);
    rivit.forEach(r => { const tr = document.createElement('tr'); r.forEach(x => { const c = document.createElement('td'); c.textContent = x; tr.appendChild(c); }); tb.appendChild(tr); });
    u.append(th, tb);
    t.replaceWith(u);
  }
  /* Lainaukset lähteineen (käyttäjän havainto 21.11.2026: väitöskirjan motto Cornelius Agrippalta näkyi tavallisina riveinä):
     säkeistö (vähintään kaksi riviä, joista jokin muu kuin ensimmäinen alkaa pienellä; ei numeroita eikä luettelon kohtia),
     jota seuraa pelkkä nimirivi (enintään kolme isolla alkavaa sanaa, ei versaalia eikä pisteeseen päättyvää: Cornelius
     Agrippa, Stagnelius), on lainaus, ja nimi sen viimeiseksi riviksi muodossa – Nimi (md.js: lainauksen lähde,
     otsikon jälkeen motto). Samoin tekstin ensimmäinen lyhyt virke, jonka perässä on nimi sulkeissa (Mikään ei ole joka
     suhteessa onnellista. (Horatius)). 98 asiakirjan otoksessa kolme osumaa; allekirjoitus (Konsistorin puolesta | Nils
     Abrah. Ursin | A. V. Wegelius.), oppikirjan sisällysluettelo ennen JOHDANTO-otsikkoa ja taulukon otsikko (… 1.
     maaliskuuta … | Vastattavaa) eivät täytä ehtoja. */
  const SN_NIMI_RIVI = /^\p{Lu}[\p{L}’'-]*\.?(?:\s+(?:\p{Lu}[\p{L}’'-]*\.?|von|af|de|van)){0,2}$/u;
  function snLainaukset(el) {
    const lainaus = (p, nimi) => {
      const bq = document.createElement('blockquote');
      p.replaceWith(bq);
      p.append(document.createElement('br'), '– ' + nimi);
      bq.appendChild(p);
    };
    [...el.children].forEach(p => {
      const n = p.nextElementSibling;
      if (p.tagName !== 'P' || !n || n.tagName !== 'P' || n.querySelector('br') || !p.querySelector('br') || /\d/.test(snTx(p))) return;
      // Säkeet: jokin rivi ensimmäisen jälkeen alkaa pienellä, eikä mikään rivi ole luettelon kohta (a. …, C. …).
      const rivit = p.innerHTML.split(/<br\s*\/?>/i).map(h => rivi(jasenna(h).body.textContent));
      if (!rivit.slice(1).some(r => /^\p{Ll}/u.test(r)) || rivit.some(r => /^[\p{L}\d]{1,3}[.)]\s/u.test(r))) return;
      const nimi = snTx(n);
      // Nimi, ei otsikko (JOHDANTO) eikä virkkeeseen päättyvä allekirjoitus (A. V. Wegelius.).
      if (!SN_NIMI_RIVI.test(nimi) || nimi === nimi.toUpperCase() || /\p{L}{2}\.$/u.test(nimi)) return;
      n.remove();
      lainaus(p, nimi);
    });
    const eka = el.firstElementChild;
    const m = eka && eka.tagName === 'P' && !eka.querySelector('br') && /^(.{5,200}?[.!?…”])\s*\((\p{Lu}[^()]{1,40})\)$/u.exec(snTx(eka));
    if (m && snSanoja(m[1]) <= 25 && m[2].split(/\s+/).every(w => /^(\p{Lu}|von$|af$|de$|van$)/u.test(w))) {
      eka.textContent = m[1];
      lainaus(eka, m[2]);
    }
  }
  function snTeksti(kentta, maar, laskuri, laji) {
    const f = kentta && kentta.querySelector('.field-item');
    if (!f) return null;
    const el = f.cloneNode(true);
    const viit = new Map();
    el.querySelectorAll('ul.footnotes li[id]').forEach(li => viit.set(li.id, li));
    el.querySelectorAll('ul.footnotes').forEach(x => x.remove());
    el.querySelectorAll('a.see-footnote').forEach(a => {
      const li = viit.get((a.getAttribute('href') || '').replace(/^#/, ''));
      const k = li && li.cloneNode(true);
      if (k) k.querySelectorAll('a.footnote-label').forEach(x => x.remove());
      const t = k ? muunna(k.innerHTML, 'inlined').trim() : rivi(a.getAttribute('title'));
      if (!t) { a.remove(); return; }
      const tunnus = 'sn' + (++laskuri.n);
      a.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('table').forEach(t => { if (!t.querySelector('table')) snTaulukko(t); });
    el.querySelectorAll('[style], [align]').forEach(x => { x.removeAttribute('style'); x.removeAttribute('align'); });
    snRivit(el, laji);
    el.querySelectorAll('p').forEach(p => { if (!snTx(p)) p.remove(); });
    snLainaukset(el);
    snOtsikot(el, laji);
    // Lyhytkin teksti kelpaa (sähke 28.8.1863: 9 sanaa; runo 12 sanaa putosivat ennen 15 sanan rajaan yleiseen leikkeeseen,
    // joka toi sivuston valikot ja hakemistot). Tyhjä kenttä on ruotsinkielisessä usein TULOSSA.
    const t = rivi(el.textContent);
    return t && !/^TULOSSA\.?$/i.test(t) ? el : null;
  }
  /* Otsikko (21.11.2026, 89 asiakirjan otos ja koko luettelo): sivuston nimekkeissä on painetun nimiölehden versaaleja
     (NELJÄ AVIOLIITTOA. TAULUJA TERBURGIN TAPAAN; FILOSOFIAN ALKEISKURSSI Ensimmäinen vihko PSYKOLOGIA Tukholma 1837) ja
     tavutusvihjeitä (valta­istuin). Versaalijakso tavalliseksi: jakson ensimmäinen sana isolla, muut sen mukaan, miten sana
     kirjoitetaan asiakirjan tekstissä keskellä virkettä (Terburgin, Hegelin, Leibnizin), tuntematon pienellä. Yhden
     kirjaimen sanat (J. V.) ja roomalaiset numerot jäävät. */
  function snOtsikko(t, kappaleet) {
    t = rivi(String(t || '').replace(/\u00ad/g, ''));
    const versa = w => w.length >= 2 && w === w.toUpperCase() && w !== w.toLowerCase() && !SN_ROOM.test(w);
    const sanat = t.match(/\p{L}+/gu) || [];
    if (!sanat.some(w => versa(w) && w.length >= 4)) return t;
    // Sanan kirjoitusasu keskellä virkettä: [isolla, pienellä].
    const asu = new Map();
    kappaleet.forEach(k => {
      let alku = true;
      for (const x of k.matchAll(/(\p{L}+)|([.!?:]+)/gu)) {
        if (x[2]) { alku = true; continue; }
        const w = x[1];
        if (!alku && w !== w.toUpperCase()) {
          const v = asu.get(w.toLowerCase()) || [0, 0];
          v[w[0] === w[0].toUpperCase() ? 0 : 1]++;
          asu.set(w.toLowerCase(), v);
        }
        alku = false;
      }
    });
    const todiste = a => {
      let v = asu.get(a);
      if (!v) {
        // Taivutusmuoto (TERBURGIN – Terburg): sama alku, vähintään viisi kirjainta.
        const n = Math.max(5, a.length - 3);
        v = [0, 0];
        asu.forEach((x, k) => { if (k.length >= n && k.slice(0, n) === a.slice(0, n)) { v[0] += x[0]; v[1] += x[1]; } });
      }
      return v;
    };
    /* Nimirivi (21.11.2026, väliotsikot koko korpuksessa): kun mikään keskellä riviä oleva versaalisana ei esiinny tekstissä
       pienellä ja jokin rivin sanoista esiintyy isolla, tuntematonkin sana on nimeä (TRI DAVID FRIEDRICH STRAUSS → Tri David
       Friedrich Strauss, HELSINGFORS' MORGONBLAD → Helsingfors' Morgonblad; ennen Tri david, Helsingfors' morgonblad). */
    const asema = [];
    {
      let alku = true, ed = '';
      for (const x of t.match(/\p{L}+|[^\p{L}]+/gu) || []) {
        if (!/\p{L}/u.test(x)) { if (/[.!?:]/.test(x)) alku = true; continue; }
        if (versa(x)) asema.push({ v: todiste(x.toLowerCase()), alkaa: alku || (ed && !versa(ed)) });
        alku = false; ed = x;
      }
    }
    const nimet = asema.some(s => s.v[0] > s.v[1]) && asema.every(s => s.alkaa || s.v[0] >= s.v[1]);
    const iso = a => { const v = todiste(a); return v[0] > v[1] || (nimet && !v[0] && !v[1]); };
    let alku = true, ed = '';
    return t.replace(/\p{L}+|[^\p{L}]+/gu, x => {
      if (!/\p{L}/u.test(x)) { if (/[.!?:]/.test(x)) alku = true; return x; }
      const w = x;
      if (!versa(w)) { alku = false; ed = w; return x; }
      const a = w.toLowerCase();
      // Versaalijakson alku: otsikon alku, virkkeen alku tai versaalisana tavallisen sanan jälkeen (nimiölehden rivi).
      const alkaa = alku || (ed && !versa(ed));
      alku = false; ed = w;
      return alkaa || iso(a) ? a[0].toUpperCase() + a.slice(1) : a;
    });
  }
  /* Lehtikirjoituksen nimeke (21.11.2026): sivusto nimeää kirjoitukset lehden mukaan (Freja nro 97, 6.12.1839: Hegel
     Fyrisjoen rannalla; Litteraturblad nro 1, 2, 3 ja 4, tammi-, helmi-, maalis-ja huhtikuu 1848: Ruotsalaisia siluetteja).
     Otsikoksi kaksoispisteen jälkeinen nimi, teokseksi lehti ja numeroksi numerot, jotta lähdeviite on muotoa
     Snellman, J. V. (1839). Hegel Fyrisjoen rannalla. Freja 97. Päiväys on etukentän julkaistu-avaimessa. Luettelon
     2 949 asiakirjasta (21.11.2026) 607 jakautuu näin (myös lehdessä julkaistut puheet); lehtien kokonaiset numerot
     (Saima nro 1, 2.1.1845) ja Kallaveden liitteet ovat ilman kaksoispistettä ja jäävät ennalleen. */
  function snLehti(t) {
    const m = /^(\p{Lu}[\p{L} ]*?) nro (\d{1,3}[a-z]?(?:(?:, | ja )\d{1,3}[a-z]?(?![.\d]))*)\b[^:]*:\s*(.+)$/u.exec(t);
    if (!m) return null;
    // Numerot 1, 2, 3 ja 4 → 1–4; 92, 93 ja 96 → 92, 93, 96.
    const n = m[2].split(/, | ja /), per = n.every((x, i) => !i || +x === +n[i - 1] + 1);
    return { otsikko: m[3], teos: m[1], numero: n.length > 1 && per ? n[0] + '–' + n[n.length - 1] : n.join(', ') };
  }
  async function snellman() {
    if (!/(^|\.)snellman\.kootutteokset\.fi$/i.test(location.hostname)) return null;
    /* Rivin alun 1) ja kappaleen pelkkä 2. ovat painetun laitoksen numerointia, ei Markdownin luetteloa (21.11.2026, koko
       korpuksen pesu): md.js teki niistä luettelon, jolloin numero muuttui pisteelliseksi tai tyhjäksi kohdaksi ja Logiikan
       sisällysluettelon rivit (B. Refleksioarvostelma | a. … | 1) Singulaarinen arvostelma | 2) …) hajosivat luetteloksi,
       johon seuraavat rivit valuivat. Ennen 232 numeroa 32 asiakirjassa. */
    SULKUNUMEROT = true;
    const fi = document.querySelector('.field-name-field-suomi');
    if (!fi) return null;
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    // Asiakirjalla voi olla useampi tyyppi (Virkakirje, Sähke): kaikki, jälkimmäiset pienellä.
    const laji = [...document.querySelectorAll('.field-name-field-dokumentin-tyyppi .field-item')].map(x => rivi(x.textContent)).filter(Boolean)
      .map((x, i) => i ? x.toLowerCase() : x).join(', ');
    const s = snTeksti(fi, maar, laskuri, laji), sv = snTeksti(document.querySelector('.field-name-field-ruotsi'), maar, laskuri, laji);
    if (!s && !sv) return null;
    const kappaleet = [...fi.querySelectorAll('p')].map(p => rivi(p.textContent.replace(/ /g, ' '))).filter(Boolean);
    if (s) el.append(...s.childNodes);
    if (sv) {
      if (s) { const h = document.createElement('h2'); h.textContent = 'Ruotsiksi'; el.appendChild(h); }
      el.append(...sv.childNodes);
    }
    el.normalize();
    const pv = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(rivi((document.querySelector('.field-name-tekstilahde-daterange .field-item') || {}).textContent));
    // Epätarkka päiväys (Pvm ei ole tarkka; Teosofia [1826–28] on 31.12.1826): vain vuosi. 32/79 asiakirjaa 21.11.2026.
    const epatarkka = /ei ole tarkka|ei (ole )?tiedossa|tarkka pvm ei/i.test(rivi((document.querySelector('.field-name-field-pvm-kommenti .field-item') || {}).textContent));
    // Alkukielinen pdf (78/79 asiakirjaa 21.11.2026) lähdeosioon (md.js lahdeOsio()): alkuteksti on sivulla tekstinä
    // 0/79:ssä, ja pdf:n tekstikerros on huonoa OCR:ää (Veriden, ali dess poiitik) tai tyhjä (käsin kirjoitetut kirjeet),
    // joten sitä ei leikata eikä lomiteta.
    const pdf = document.querySelector('.field-name-field-alkukielinen-pdf a[href$=".pdf"]');
    const nimi = snOtsikko(rivi((document.querySelector('.page-title-header') || {}).textContent) || rivi(document.title).split('|')[0], kappaleet);
    const lehti = snLehti(nimi);
    /* Snellmanille tullut kirje (21.11.2026): nimeke on lähettäjän nimi ablatiivissa (Alexander Armfeltilta, sähke 28.8.1863;
       Anna Christina Snellmanilta), ja lähettäjä on Kirjeenvaihto-kentässä. Tekijäksi lähettäjä; ennen kaikkien tekijä oli
       J. V. Snellman. Luettelon 2 949 asiakirjasta noin 600 on tällaisia. Snellmanin omat kirjeet ovat allatiivissa
       (Adolf Fredrik Waseniukselle). */
    const kv = [...document.querySelectorAll('.field-name-field-kirjeenvaihto .field-item')].map(x => rivi(x.textContent)).filter(Boolean).join(' & ');
    const tullut = kv && /kirje|sähke/i.test(laji) && /^(?:[\p{Lu}][\p{L}'’-]*\.?\s+|(?:von|af|de|van|zu)\s+)*\p{Lu}[\p{L}'’-]*?(lta|ltä)(?!\p{L})/u.test(nimi);
    /* Tyyppi (21.11.2026): runot, laulut, romaanit, kertomukset ja näytelmä kaunokirjallisiksi (otsikon alla sivuston nimi,
       kellarissa Kaunokirjallisuus), muut tieteellisiksi: kootut teokset on toimitettu laitos, ja blogin muodossa (oletus)
       lähdeviitteessä toistui päiväys sivuston perässä. Lehtikirjoituksen tietorivillä lehti (Freja, 6.12.1839) eikä
       laji Lehtikirjoitus; osastona se säilyy. */
    const kauno = /runo|laulu|romaani|kertomus|näytelmä/i.test(laji) || /näytelmä/i.test(nimi);
    const laji2 = lehti ? laji.split(', ').filter(x => !/^lehtikirjoitus$/i.test(x)).join(', ').replace(/^\p{Ll}/u, c => c.toUpperCase()) : laji;
    return { html: irrota([el]).innerHTML, otsikko: lehti ? lehti.otsikko : nimi,
      tekija: tullut ? kv : 'J. V. Snellman', tyyppi: kauno ? 'kaunokirjallinen' : 'tieteellinen', teos: lehti ? lehti.teos : '', numero: lehti ? lehti.numero : '',
      sivusto: SN_NIMI, julkaistu: pv ? (epatarkka ? pv[3] : pv[3] + '-' + pv[2].padStart(2, '0') + '-' + pv[1].padStart(2, '0')) : '',
      laji: laji2, lahde: osoite, maar, yllapitaja: 'Snellman-instituutti', ladonta: 'asiakirja', polku: 'Dokumentit' + (laji ? ' › ' + laji.split(', ')[0] : ''),
      alkuteksti: pdf ? pdf.href : '' };
  }

  /* Religion Online (religion-online.org; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 3: Whitehead ja prosessiajattelu,
     Bonhoeffer, Girard, Eckhart ym.). WordPress: article.type-article (artikkeli), type-book (kirjan sivu: kuvaus ja Chapters-luettelo
     /book-chapter/-sivuihin), type-book_chapter (luku: h1:ssä kirjan nimi linkkinä ja by-tekijä, sitten h2-otsikot). Kirja kootaan
     luvun tai kirjan sivulta kirjan luetteloon (enintään KK_RAJA lukua), luvun toistuva h2-nimi pois. Luvut ovat painetusta kirjasta
     OCR:llä: sivunumerot omina kappaleinaan ([xi], [14]) katkaisevat kappaleen kesken virkkeen, ja viitteet ovat sivun alalaidan
     kappaleina (<p><sup>1</sup> Koyré … <br><sup>2</sup> Barth …</p>) linkittömien <sup>N</sup>-merkkien jälkeen. Sovite: viitekappale
     paloiksi (br), kukin pala lähimpään edeltävään samanumeroiseen merkkiin alaviitteeksi (pariton pala jää kappaleeksi), sivunumerot
     pois ja katkennut kappale yhdistetään seuraavaan, kun se ei pääty välimerkkiin ja seuraava alkaa pienellä kirjaimella. Artikkeleissa
     WordPressin alaviitteet (sup a#post-N-footnote-ref-K → ol li#post-N-footnote-K, paluunuoli pois) ja Notes-otsikko pois.
     Kolmas muoto (Omnipotence and Other Theological Mistakes): luvun lopussa Notes ja kappaleet 1. …, jotka pariutetaan luvun
     <sup>N</sup>-merkkeihin. Luvun alussa toistuvat kirjan nimi (by-rivi) ja luvun nimi otsikkoina pois; sivunumero voi olla
     katkennut ([95). Luku, jonka oma kirjalinkki osoittaa toiseen kirjaan, ohitetaan (sivuston virhe: Omnipotencen Preface-linkki
     vie Anselm's Discoveryn esipuheeseen, koska molempien osoite on /book-chapter/preface/).
     Sisäkkäiset kappaleet (<p><p>) puretaan. Tekijä by-linkistä. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 20.11.2026. */
  const RO_NIMI = 'Religion Online';
  const RO_SIVU = /^\[\s*(?:[ivxlcdm]+|\d+)\s*\]?$/i;
  function roRunko(d, maar, laskuri) {
    const juuri = d && d.querySelector('article .entry-content');
    if (!juuri) return null;
    const el = juuri.cloneNode(true);
    el.querySelectorAll('script, style, noscript, iframe, form, .sharedaddy, .jp-relatedposts').forEach(x => x.remove());
    // <p><p>…</p></p> purkautuu jäsentimessä sisaruksiksi; tyhjät pois.
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent) && !p.querySelector('img, br')) p.remove(); });
    // WordPressin alaviitteet.
    el.querySelectorAll('sup a[href*="-footnote-"]').forEach(a => {
      const id = (a.getAttribute('href') || '').replace(/^.*#/, '');
      const li = id && el.querySelector('li[id="' + id + '"]');
      const sup = a.closest('sup');
      if (!li) return;
      const k = li.cloneNode(true);
      k.querySelectorAll('a[href*="-footnote-ref-"]').forEach(x => x.remove());
      const t = muunna(k.innerHTML, 'inlined').trim();
      if (!t) { sup.remove(); return; }
      const tunnus = 'ro' + (++laskuri.n);
      sup.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('ol').forEach(ol => { if (ol.querySelector('li[id*="-footnote-"]')) { const h = ol.previousElementSibling; if (h && /^H[1-6]$/.test(h.tagName) && /^(notes?|footnotes|endnotes)$/i.test(rivi(h.textContent))) h.remove(); ol.remove(); } });
    // OCR-kirjan sivun alalaidan viitteet: kappale, joka alkaa <sup>N</sup>:llä.
    const odottaa = new Map();
    let paritettu = 0;
    [...el.querySelectorAll('sup, p')].forEach(x => {
      if (x.tagName === 'SUP') {
        const n = rivi(x.textContent), p = x.closest('p');
        if (!/^\d{1,3}$/.test(n) || (p && p.firstChild === x) || (p && p.dataset.roViite)) return;
        odottaa.set(n, x);
        return;
      }
      if (x.firstChild && x.firstChild.nodeName === 'SUP' && /^\d{1,3}$/.test(rivi(x.firstChild.textContent))) {
        x.dataset.roViite = '1';
        const palat = [];
        let nyk = null;
        [...x.childNodes].forEach(n => {
          if (n.nodeName === 'SUP' && /^\d{1,3}$/.test(rivi(n.textContent))) { nyk = { n: rivi(n.textContent), solmut: [] }; palat.push(nyk); }
          else if (n.nodeName !== 'BR' && nyk) nyk.solmut.push(n.cloneNode(true));
        });
        const jaa = [];
        palat.forEach(pl => {
          const ref = odottaa.get(pl.n), div = document.createElement('div');
          pl.solmut.forEach(n => div.appendChild(n));
          const t = muunna(div.innerHTML, 'inlined').trim();
          if (ref && t) {
            const tunnus = 'ro' + (++laskuri.n);
            ref.replaceWith(merkki(tunnus));
            maar.push(maaritelma(tunnus, t));
            odottaa.delete(pl.n); paritettu++;
          } else if (t) { const p = document.createElement('p'); const s = document.createElement('sup'); s.textContent = pl.n; p.append(s, ' ', ...div.childNodes); jaa.push(p); }
        });
        x.replaceWith(...jaa);
      }
    });
    // Luvun lopun viitteet: kappale tai otsikko Notes ja sen jälkeen kappaleet 1. …, 2. … (Omnipotence and Other Theological Mistakes).
    const notes = [...el.children].find(x => /^(P|H[1-6])$/.test(x.tagName) && /^(notes?|footnotes|endnotes)$/i.test(rivi(x.textContent)));
    if (notes && odottaa.size) {
      let kaikki = true;
      for (let n = notes.nextElementSibling; n; ) {
        const seur = n.nextElementSibling, m = n.tagName === 'P' && /^(\d{1,3})\.\s/.exec(rivi(n.textContent));
        if (!m) { if (rivi(n.textContent) && !RO_SIVU.test(rivi(n.textContent))) kaikki = false; n = seur; continue; }
        const ref = odottaa.get(m[1]);
        if (ref) {
          const k = n.cloneNode(true);
          const ens = k.firstChild;
          if (ens && ens.nodeType === 3) ens.nodeValue = ens.nodeValue.replace(/^\s*\d{1,3}\.\s*/, '');
          const t = muunna(k.innerHTML, 'inlined').trim();
          if (t) { const tunnus = 'ro' + (++laskuri.n); ref.replaceWith(merkki(tunnus)); maar.push(maaritelma(tunnus, t)); odottaa.delete(m[1]); paritettu++; n.remove(); }
          else kaikki = false;
        } else kaikki = false;
        n = seur;
      }
      if (kaikki) notes.remove();
    }
    // Sivunumerot pois ja sivunvaihdossa katkenneet kappaleet yhteen.
    el.querySelectorAll('p').forEach(p => { if (RO_SIVU.test(rivi(p.textContent))) p.remove(); });
    [...el.querySelectorAll('p')].forEach(p => {
      const ed = p.previousElementSibling;
      if (!ed || ed.tagName !== 'P' || !p.parentNode) return;
      const a = rivi(ed.textContent), b = rivi(p.textContent);
      if (a && b && !/[.!?:;"”’»)\]]$/.test(a) && /^\p{Ll}/u.test(b)) { ed.append(' ', ...p.childNodes); p.remove(); }
    });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*religion-online\.org(\/|$)/i);
    return { el, paritettu };
  }
  async function religionOnline() {
    if (!/(^|\.)religion-online\.org$/i.test(location.hostname)) return null;
    const art = document.querySelector('main article');
    if (!art || !art.querySelector('.entry-content')) return null;
    const laji = /\btype-book_chapter\b/.test(art.className) ? 'luku' : /\btype-book\b/.test(art.className) ? 'kirja' : /\btype-article\b/.test(art.className) ? 'artikkeli' : '';
    if (!laji) return null;
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    const tekijaLinkki = d => [...d.querySelectorAll('.entry-content a[href*="/author/"], .entry-content a[href*="post_type=author"]')].map(a => rivi(a.textContent)).filter(Boolean)[0] || '';
    if (laji === 'artikkeli') {
      const r = roRunko(document, maar, laskuri);
      if (!r) return null;
      // by-rivi pois (tekijä etukenttään).
      const ens = [...r.el.children].find(x => rivi(x.textContent));
      if (ens && /^by\s/i.test(rivi(ens.textContent)) && rivi(ens.textContent).length < 120) ens.remove();
      el.append(...r.el.childNodes);
      if (kkSanoja(el) < 50) return null;
      kkTasoita(el);
      el.normalize();
      return { html: irrota([el]).innerHTML, otsikko: rivi((art.querySelector('.entry-title') || {}).textContent), tekija: tekijaLinkki(document),
        sivusto: RO_NIMI, lahde: osoite, maar };
    }
    // Kirja: luettelo kirjan sivulta (luvun sivulla h1:n linkki kirjaan).
    let kirjaU = osoite, kd = document;
    if (laji === 'luku') {
      const a = art.querySelector('.entry-content h1 a[href*="/book/"]');
      kirjaU = a ? new URL(a.getAttribute('href'), osoite).href : '';
      kd = kirjaU ? await hae(kirjaU) : null;
    }
    const luvut = kd ? [...kd.querySelectorAll('article .entry-content a[href*="/book-chapter/"]')].map(a => ({ u: new URL(a.getAttribute('href'), kirjaU).href, nimi: rivi(a.getAttribute('title') || a.textContent) }))
      .filter((l, i, k) => k.findIndex(x => x.u === l.u) === i) : [];
    const valitut = luvut.length && luvut.length <= KK_RAJA ? luvut : laji === 'luku' ? [{ u: osoite, nimi: rivi((art.querySelector('.entry-title') || {}).textContent) }] : [];
    if (!valitut.length) return null;
    const muut = valitut.filter(l => l.u !== osoite), haetut = await kkHae(muut.map(l => l.u));
    const tv = x => rivi(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    let sivuja = 0, paritettu = 0;
    for (const l of valitut) {
      const d = l.u === osoite ? document : haetut[muut.indexOf(l)];
      // Luvun osoite voi olla toisen kirjan (sivuston virhe: Omnipotencen Preface → /book-chapter/preface/ on Anselm's Discoveryn).
      const oma = d && d.querySelector('article .entry-content h1 a[href*="/book/"]');
      if (oma && kirjaU && new URL(oma.getAttribute('href'), l.u).pathname.replace(/\/$/, '') !== new URL(kirjaU).pathname.replace(/\/$/, '')) continue;
      const r = roRunko(d, maar, laskuri);
      if (!r || kkSanoja(r.el) < 3) continue;
      sivuja++; paritettu += r.paritettu;
      r.el.querySelectorAll('h1').forEach(h => { if (h.querySelector('a[href*="/book/"]')) h.remove(); });
      // Luvun alussa toistuvat kirjan nimi (by-tekijän kanssa) ja luvun nimi otsikkoina pois.
      const kirjaNimi = tv(((kd || document).querySelector('article .entry-title') || {}).textContent);
      for (let i = 0; i < 3; i++) {
        const ens = [...r.el.children].find(x => rivi(x.textContent));
        if (!ens || !/^H[1-6]$/.test(ens.tagName)) break;
        const t = tv(ens.textContent);
        if (t === tv(l.nimi) || (kirjaNimi && t.startsWith(kirjaNimi))) ens.remove(); else break;
      }
      kkSiirra(r.el, 2);
      if (valitut.length > 1) { const h = document.createElement('h2'); h.textContent = l.nimi; el.appendChild(h); }
      el.append(...r.el.childNodes);
    }
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    el.normalize();
    const nimi = rivi(((kd || document).querySelector('article .entry-title') || {}).textContent);
    return { html: irrota([el]).innerHTML, otsikko: valitut.length > 1 ? nimi : valitut[0].nimi, teos: valitut.length > 1 ? '' : nimi,
      tekija: tekijaLinkki(kd || document) || tekijaLinkki(document), sivusto: RO_NIMI, lahde: valitut.length > 1 ? kirjaU : osoite, maar,
      naytto: RO_NIMI + (sivuja > 1 ? ' (' + sivuja + ' lukua)' : '') };
  }

  /* Tuomas Akvinolainen latinaksi ja englanniksi (isidore.co/aquinas: Joseph Kennyn HTML-laitos, ylläpitäjä Geremia; käyttäjän
     pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 2). Teokset ovat taulukoina, rivi kerrallaan latina | englanti (De veritate q. 1:
     321 riviparia, Contra Gentiles I: 1 049 riviä yhdellä sivulla, Summa kysymys kerrallaan): suoraan lukimen lomitetuksi
     käännökseksi kuten Perseuksessa (latinan kappale ja perään käännös lainauksena, etukentässä ladonta: lomitettu käännös).
     Otsikot kolmella tavalla: keskitetty lihavoitu rivipari (Caput 1 | Chapter 1, Quod sit officium sapientis | THE OFFICE …:
     peräkkäiset yhdeksi, englanniksi), koko rivin solu (ARTICLE I … What is truth?: lihavoidun ensimmäinen ja viimeinen rivi,
     viittaukset [Cf. S.T. …] omaksi kappaleekseen) ja taulukoiden välinen h3 (Summan artiklat). Sisällysluettelotaulukko (englanti
     pääosin #-linkkejä) ja Summan siirtymärivit (p[align=right]) pois, sivuston sisäiset linkit tekstiksi. Versaaliotsikot
     isoAlku-muotoon. Otsikko: h2 (De veritate: Question One: Truth), Contra Gentilesissa kirjan h2, Summassa ensimmäisen h3:n
     viimeinen rivi kysymysnumeron kanssa; teos <title>istä tai h1:stä, kääntäjä translated by -riviltä. Ei mainoksia eikä
     lahjoituspyyntöä. Mitattu 20.11.2026. */
  const AQ_PIENET = /^(of|the|and|in|on|to|a|an|by|for|or|with|de|in|et|from|as|at|is)$/i;
  const aqIso = t => t !== t.toUpperCase() || !/\p{Lu}{3}/u.test(t) ? t : t.toLowerCase().replace(/\p{L}[\p{L}'’]*/gu, (w, i) => i && AQ_PIENET.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).replace(/\b(Ii|Iii|Iv|Vi|Vii|Viii|Ix|Xi|Xii)\b/g, x => x.toUpperCase());
  function aqRivit(solu) {
    const k = solu.cloneNode(true);
    k.querySelectorAll('br').forEach(b => b.replaceWith('\u0001'));
    return k.textContent.split('\u0001').map(rivi).filter(Boolean);
  }
  async function aquinas() {
    if (!/(^|\.)isidore\.co$/i.test(location.hostname) || !/^\/aquinas\//.test(location.pathname)) return null;
    const runko = document.body.cloneNode(true);
    runko.querySelectorAll('script, style').forEach(x => x.remove());
    const kaksi = [...runko.querySelectorAll('tr')].filter(tr => tr.cells.length === 2 && rivi(tr.cells[0].textContent) && rivi(tr.cells[1].textContent));
    if (kaksi.length < 5) return null;
    runko.querySelectorAll('p[align="right"]').forEach(p => { if (p.querySelector('a[href*="index"]')) p.remove(); });
    const el = document.createElement('div');
    const sisainen = a => { const h = a.getAttribute('href') || ''; return /^#|^[^:/]+\.html?(#|$)|isidore\.co/i.test(h); };
    const kappale = (solu, tag = 'p') => {
      const p = document.createElement(tag);
      p.append(...solu.cloneNode(true).childNodes);
      p.querySelectorAll('a[href]').forEach(a => { if (sisainen(a)) a.replaceWith(...a.childNodes); });
      p.querySelectorAll('font, center').forEach(f => f.replaceWith(...f.childNodes));
      const tyhja = n => n && (n.nodeName === 'BR' || (n.nodeType === 3 && !rivi(n.nodeValue)));
      while (tyhja(p.lastChild)) p.lastChild.remove();
      while (tyhja(p.firstChild)) p.firstChild.remove();
      return p;
    };
    // Solun <br>-rivit kappaleiksi (Contra Gentiles: kaksi kappaletta samassa solussa); kursiivi- ja lihavointirajat säilyvät,
    // koska jako tehdään vain solun ylimmän tason rivinvaihdoista.
    const kappaleet = solu => {
      const p = kappale(solu), tulos = [];
      let nyk = document.createElement('p');
      [...p.childNodes].forEach(n => {
        if (n.nodeName === 'BR') { if (rivi(nyk.textContent)) tulos.push(nyk); nyk = document.createElement('p'); }
        else nyk.appendChild(n);
      });
      if (rivi(nyk.textContent)) tulos.push(nyk);
      return tulos;
    };
    const otsikko = t => { const h = document.createElement('h2'); h.textContent = t; el.appendChild(h); };
    let edLatina = null, odottavaOts = [], h3maara = 0, summaOts = '';
    const purkaOts = () => { if (odottavaOts.length) { otsikko(odottavaOts.join('. ').replace(/\.\./g, '.')); odottavaOts = []; } };
    const lihava = solu => { const t = rivi(solu.textContent); if (!t) return false; const b = [...solu.querySelectorAll('b, strong')].map(x => rivi(x.textContent)).join(' '); return rivi(b).length >= t.length * 0.9; };
    const kasittele = solmu => {
      if (solmu.nodeType !== 1) return;
      const t = solmu.tagName;
      if (t === 'TABLE') {
        const rivit = [...solmu.rows];
        // Sisällysluettelo: englannin puolen teksti pääosin #-linkkeinä.
        const eng = rivit.map(r => r.cells[r.cells.length - 1]).filter(Boolean);
        const kaikki = eng.reduce((n, c) => n + rivi(c.textContent).length, 0);
        const linkit = eng.reduce((n, c) => n + [...c.querySelectorAll('a[href*="#"]')].reduce((m, a) => m + rivi(a.textContent).length, 0), 0);
        if (kaikki && linkit > kaikki * 0.5) return;
        rivit.forEach(r => {
          const c = [...r.cells];
          if (c.length === 2) {
            const [la, en] = c, tl = rivi(la.textContent), te = rivi(en.textContent);
            if (!tl && !te) return;
            const keski = c.every(x => /center/i.test((x.getAttribute('style') || '') + (x.getAttribute('align') || '')));
            if ((keski || (lihava(en) && (!tl || lihava(la)))) && te.split(/\s+/).length <= 20 && tl.split(/\s+/).length <= 20) {
              odottavaOts.push(aqIso(te || tl).replace(/\.$/, '')); edLatina = null; return;
            }
            purkaOts();
            if (tl) { const ps = kappaleet(la); el.append(...ps); edLatina = ps[ps.length - 1] || null; }
            if (te) {
              const ps = kappaleet(en);
              if (tl || edLatina) { const q = document.createElement('blockquote'); q.append(...ps); el.appendChild(q); } else el.append(...ps);
            }
          } else if (c.length === 1 && rivi(c[0].textContent)) {
            purkaOts();
            const solu = c[0], b = solu.querySelector('b, strong');
            if (b && rivi(b.textContent).length > 3 && solu.firstElementChild === b) {
              const r = aqRivit(b).map(aqIso);
              otsikko(r.length > 1 ? r[0].replace(/[.:]$/, '') + ': ' + r[r.length - 1] : r[0]);
              const loput = solu.cloneNode(true); loput.querySelector('b, strong').remove();
              if (rivi(loput.textContent)) el.appendChild(kappale(loput));
            } else el.appendChild(kappale(solu));
            edLatina = null;
          }
        });
        purkaOts();
        return;
      }
      if (t === 'H3') {
        h3maara++;
        const r = aqRivit(solmu);
        if (/\/summa\//.test(location.pathname) && h3maara === 1) { summaOts = r[r.length - 1] || ''; return; }
        if (/translated/i.test(rivi(solmu.textContent))) return;
        purkaOts(); otsikko(aqIso(r.join(': '))); edLatina = null;
        return;
      }
      if (/^(H1|H2|CENTER|HR|A|FONT|FORM)$/.test(t)) { if (t === 'A' && !solmu.getAttribute('href') && solmu.children.length) [...solmu.children].forEach(kasittele); return; }
      if (t === 'P' && rivi(solmu.textContent)) { purkaOts(); el.appendChild(kappale(solmu)); edLatina = null; return; }
      if (/^(BLOCKQUOTE|DIV|TBODY|BODY)$/.test(t)) [...solmu.children].forEach(kasittele);
    };
    [...runko.children].forEach(kasittele);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    el.normalize();
    // Otsikko, teos ja kääntäjä.
    const nimi = rivi(document.title).replace(/^Thomas Aquinas:\s*/i, '').replace(/:\s*(English|Latin|Latin & English)$/i, '');
    const h1 = rivi((document.querySelector('h1') || {}).textContent), h2 = rivi((document.querySelector('h2') || {}).textContent);
    let ots = '', teos = '';
    const summa = /\/summa\/([A-Z]+\d?)\/\1?(\d+)\.html?$/i.exec(location.pathname) || /\/summa\/[A-Z0-9]+\/([A-Z]+)(\d+)\.html?$/i.exec(location.pathname);
    if (summa) {
      const osa = rivi(([...document.querySelectorAll('a[href*="../"]')].find(a => /part|supplement/i.test(a.textContent)) || {}).textContent);
      teos = 'Summa Theologiae' + (osa ? ', ' + aqIso(osa) : '');
      ots = 'Question ' + (+summa[2]) + (summaOts ? ': ' + aqIso(summaOts.replace(/\s*\([^)]*articles?\)\s*$/i, '')) : '');
    } else if (/^contra gentiles$/i.test(h1)) { teos = 'Summa contra Gentiles'; ots = aqIso(h2); }
    else { teos = nimi; ots = h2 && !/aquinas/i.test(h2) ? aqIso(h2) : nimi; }
    const kaant = [...document.querySelectorAll('h3, h4, center, p')].map(x => rivi(x.textContent)).find(x => /translated by/i.test(x) && x.length < 300) || '';
    const km = /translated by\s+(.+?)(?:\s+(?:Chicago|New York|London|Notre Dame|Garden City|Html|\(|\d{4})|\s+[A-Z]{4,}\b|$)/.exec(kaant.replace(/translated by/i, 'translated by'));
    return { html: irrota([el]).innerHTML, otsikko: ots, tekija: 'Thomas Aquinas', teos: teos !== ots ? teos : '',
      suomentaja: km ? kkKaantaja([rivi(km[1]).replace(/[,.;]+$/, '')]) : '', sivusto: 'isidore.co', ladonta: 'lomitettu käännös', lahde: osoite };
  }

  /* Det Kgl. Biblioteks tekstportal (tekster.kb.dk; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 1): Søren Kierkegaards
     Skrifter (sks.dk ohjaa tänne), Arkiv for Dansk Litteratur ym. Rails/Blacklight, palvelin renderöi koko teoksen yhdelle sivulle
     (/text/<kokoelma>-…-root; Frygt og Bæven 40 996 sanaa). Teksti #root.collection-<kokoelma>. Merkinnät: henkilöt, paikat,
     teokset, kommentit ja lainauslinkit symboleina (span.symbol: 👤, 📌, ►, ✂) ja a.quote-linkkeinä: pois, teksti jää. SKS:n sivut
     (a.pagination > small.symbol.pagination.edition) yläindeksiksi niteen kanssa kuten Korporassa (4:99; nide käytetystä laitoksesta
     Bd. 4), ensipainoksen sivut (pagination.other) ja ADL:n sivunvaihdot (span.pageBreak, p.eg) pois, otsikoissa myös SKS:n.
     Alaviitteet: tekijän viitteet SKS:ssä sup[id^=ref] > a[href=#fb.1] → span.note_content#fb.1 (luettelo div:ssä kappaleen perässä,
     pois), ADL:ssä a.note ja piilotettu span.note_content heti perässä. Tekstikritiikki span.apparatus-criticus (piilotettu, lemma
     ] lukutapa ja todistaja em.witness) alaviitteeksi; ⓘ-symboli ja sen skripti pois. SKS:n selitykset: a.comment (#fb-N) on
     lemman ympärillä, selitys on erillisellä sivulla (a#Tekstkommentarer, yksi haku): p#fb-N, jossa ◄-linkki lemmaan ja : selitys;
     alaviitteeksi muodossa *lemma*: selitys. Tekijän viitteet käsitellään ensin ja niistä puretaan selitys- ja tekstikritiikkimerkinnät
     (viite viitteessä ei toimi), otsikon viitemerkki siirretään seuraavan kappaleen alkuun (Luin ei näytä otsikon alaviitettä).
     ADL:n nimiösivu (div.title-page) pois. Etukenttään tekijä, teos (Søren Kierkegaards
     Skrifter, Bd. 4), toimittajat (udg. af …), kustantaja ja vuosi (Udgiver) ja CC0 (rel=license). Ei mainoksia eikä
     lahjoituspyyntöä. Mitattu 20.11.2026. */
  const KB_NIMI = 'Det Kgl. Biblioteks tekstportal';
  async function kbTeksti() {
    if (!/(^|\.)tekster\.kb\.dk$/i.test(location.hostname) || !/^\/text\//.test(location.pathname)) return null;
    const juuri = document.querySelector('#root[class*="collection-"]');
    if (!juuri) return null;
    const meta = otsake => {
      const s = [...document.querySelectorAll('dl.document-metadata strong')].find(x => rivi(x.textContent).replace(/:$/, '').toLowerCase() === otsake);
      const d = s && s.closest('div');
      if (!d) return null;
      const k = d.cloneNode(true); k.querySelector('strong').remove(); return k;
    };
    const tekija = rivi(((meta('forfatter') || {}).textContent) || '');
    const udg = meta('anvendt udgave'), udgT = udg ? rivi(udg.textContent) : '';
    const teos = rivi(((udg && udg.querySelector('em')) || {}).textContent);
    const bind = (/\bBd\.\s*(\d+)/.exec(teos) || [])[1] || '';
    const toim = (/udg\. af\s+(.+?),\s*(?:[^,;]+(?:Forskningscenteret|Selskab|Sprog|Litteratur|Forlag|Borgen|Gyldendal)|\d{4})/i.exec(udgT) || [])[1] || '';
    const udgiver = rivi(((meta('udgiver') || {}).textContent) || '').replace(/\s+Udgivelses.*$/, '');
    const vuosi = (/(1[5-9]\d\d|20\d\d)\s*$/.exec(udgiver) || /(1[5-9]\d\d|20\d\d)\s*\.?\s*$/.exec(udgT) || [])[1] || '';
    const el = juuri.cloneNode(true), maar = [], laskuri = { n: 0 };
    const viite = (kohta, html) => {
      const t = muunna(html, 'inlined').trim();
      if (!t) { kohta.remove(); return; }
      const tunnus = 'kb' + (++laskuri.n);
      kohta.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    };
    el.querySelectorAll('script, style, noscript, a.quote, div.title-page, p.eg').forEach(x => x.remove());
    el.querySelectorAll('[id^="expose_link_"]').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
    // Sivut.
    el.querySelectorAll('a.pagination').forEach(a => {
      const ed = a.querySelector('small.pagination.edition, small.edition');
      const kehys = a.parentElement && a.parentElement.tagName === 'SPAN' && a.parentElement.children.length === 1 ? a.parentElement : a;
      if (!ed || a.closest('h1, h2, h3, h4, h5, h6')) { kehys.remove(); return; }
      const sup = document.createElement('sup'); sup.textContent = (bind ? bind + ':' : '') + rivi(ed.textContent); kehys.replaceWith(sup);
    });
    el.querySelectorAll('span.pageBreak').forEach(x => x.remove());
    // Tekijän viitteet ensin (SKS: sup > a#…; ADL: a.note + span.note_content): niiden sisältä selitys- ja tekstikritiikkimerkinnät
    // puretaan, koska Luinissa ei ole viitettä viitteen sisällä (Frygt og Bævenin viitteissä Lessing ja tekstikritiikki).
    const siisti = nc => {
      const k = nc.cloneNode(true); k.removeAttribute('style');
      k.querySelectorAll('span.apparatus-criticus, span.symbol, .debug, script').forEach(x => x.remove());
      k.querySelectorAll('a').forEach(a => a.replaceWith(...a.childNodes));
      return k;
    };
    el.querySelectorAll('sup[id^="ref"] > a[href^="#"]').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const nc = [...el.querySelectorAll('span.note_content')].find(x => x.id === id);
      if (nc) viite(a.parentElement, siisti(nc).innerHTML);
    });
    el.querySelectorAll('a.note').forEach(a => {
      const nc = a.nextElementSibling && a.nextElementSibling.matches('span.note_content') ? a.nextElementSibling : null;
      if (!nc) return;
      const k = siisti(nc);
      const ens = k.firstChild; if (ens && ens.nodeType === 3) ens.nodeValue = ens.nodeValue.replace(/^\s*[*†‡\d]+\)?\s*/, '');
      nc.remove(); viite(a, k.innerHTML);
    });
    el.querySelectorAll('ol').forEach(ol => { if (ol.querySelector('span.note_content')) { const d = ol.parentElement; (d && d !== el && d.children.length === 1 ? d : ol).remove(); } });
    // Tekstikritiikki.
    el.querySelectorAll('span.apparatus-criticus').forEach(ap => {
      const k = ap.cloneNode(true); k.removeAttribute('style');
      k.querySelectorAll('em.witness').forEach(w => { w.textContent = rivi(w.textContent) + (w.getAttribute('title') ? ' (' + rivi(w.getAttribute('title')) + ')' : ''); });
      viite(ap, k.innerHTML);
    });
    el.querySelectorAll('span.symbol, .debug').forEach(x => x.remove());
    // SKS:n selitykset erilliseltä sivulta.
    const kommentit = [...el.querySelectorAll('a.comment[href*="#"]')];
    let kd = null;
    const kl = document.querySelector('a#Tekstkommentarer[href]');
    if (kommentit.length && kl) kd = await hae(new URL(kl.getAttribute('href'), osoite).href);
    kommentit.forEach(a => {
      const lemma = a.querySelector('[title="Kommentar"]') || a;
      const id = decodeURIComponent((a.getAttribute('href') || '').split('#')[1] || '');
      const p = kd && id ? kd.getElementById(id) : null;
      let html = '';
      if (p) {
        const k = p.cloneNode(true);
        const lk = k.querySelector('a[href*="#"]'); const lt = lk ? rivi(lk.textContent).replace(/^◄\s*/, '') : '';
        if (lk) (lk.parentElement && lk.parentElement.tagName === 'SPAN' && lk.parentElement.children.length === 1 ? lk.parentElement : lk).remove();
        k.querySelectorAll('span.symbol, .debug, script').forEach(x => x.remove());
        html = (lt ? '<em>' + lt.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;') + '</em>' : '') + k.innerHTML.replace(/^\s*/, '');
      }
      const teksti = document.createDocumentFragment(); teksti.append(...lemma.cloneNode(true).childNodes);
      if (!html) { a.replaceWith(teksti); return; }
      const paikka = document.createElement('span');
      a.replaceWith(teksti, paikka);
      viite(paikka, html);
    });
    // Otsikon selitys (Problemata, Foreløbig Expectoration) seuraavan kappaleen alkuun: Luin ei näytä otsikon alaviitettä.
    el.querySelectorAll(OTSIKOT).forEach(h => {
      const merkit = (h.textContent.match(MERKKI) || []);
      if (!merkit.length) return;
      const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeValue = n.nodeValue.replace(MERKKI, '');
      let p = h.nextElementSibling;
      while (p && p.tagName !== 'P') p = p.nextElementSibling;
      if (p) p.insertBefore(document.createTextNode(merkit.join('') + ' '), p.firstChild);
    });
    // Muut sivuston linkit tekstiksi.
    el.querySelectorAll('a').forEach(a => { const h = a.getAttribute('href') || ''; if (!/^https?:/i.test(h) || /tekster\.kb\.dk/i.test(h)) a.replaceWith(...a.childNodes); });
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    el.querySelectorAll('p, div').forEach(p => { if (el.contains(p) && !rivi(p.textContent) && !p.querySelector('br, img, hr')) p.remove(); });
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    el.normalize();
    const lisenssi = document.querySelector('a[rel="license"][href*="creativecommons"]');
    const ukm = /^(.*?)\s+((?:1[5-9]|20)\d\d)$/.exec(udgiver);
    return { html: irrota([el]).innerHTML, otsikko: rivi(document.title).replace(/\s*-\s*Det Kgl\. Biblioteks tekstportal\s*$/i, ''),
      tekija, teos, toimittaja: toim ? kkLuettelo(toim.split(/\s*;\s*/).map(rivi).filter(Boolean)) : '',
      kustantaja: ukm ? ukm[1] : udgiver, julkaistu: vuosi, sivusto: KB_NIMI, lahde: osoite.split('#')[0], maar, vakiosivut: bind ? 'SKS' : '',
      oikeus: lisenssi ? { teksti: /zero/.test(lisenssi.href) ? 'CC0 1.0' : rivi(lisenssi.textContent), lahde: lisenssi.href } : null,
      naytto: teos || KB_NIMI };
  }

  /* The Philological Museum (philological.cal.bham.ac.uk, Dana F. Suttonin uuslatinan kirjasto, noin 290 teosta 1400–1800-luvuilta,
     myös Erasmuksen adagio; käyttäjän pyyntö 20.11.2026: renessanssihumanistit). Teos on kansiossaan: latina ja käännös eri sivuilla
     (text.html | trans.html, 1lat.html | 1eng.html, act1.html | act1trans.html), ja kappaleen vihreä neliö (img grsqr) linkittää
     vastinsivun samaan ankkuriin (a[name=N]). Leike on lomitettu käännös kuten Perseuksessa ja Akvinolaisessa: sivut jaetaan
     ankkureittain jaksoiksi (lohko kuuluu viimeisimpään ankkuriin), ja kunkin latinan jakson perään tulee saman ankkurin
     käännös lainauksena; käännöksen jakso, jonka ankkuria latinassa ei ole, liittyy edelliseen. Siniset neliöt (kommentaari
     notes.html, tekstikritiikki appcrit.html) alaviitteiksi: kohdesivulla merkintä on ankkurista seuraavaan ankkuriin <br>-rivien
     välissä (Range). Erasmuksen adagiossa ankkurit ovat lähteessä pykälän väärässä kohdassa: jos merkinnän lihavoitu lemma ei osu
     viitemerkkiä edeltävään tekstiin mutta edellisen merkinnän lemma osuu, käytetään edellistä. Jaksot aloittavat vain ankkurit,
     jotka ovat molemmilla sivuilla (Miltonin säekappaleessa myös kommenttien ankkureita), ja kappale pilkotaan niiden kohdalta.
     Sulkematon x-claris-window (Claris Home Page) puretaan. Käännössivulta leikattaessa vastinsivu on latina. Täytekuvat, fontit ja ohjerivi (Click a blue square …,
     Tessera caerulea …) pois. Otsikko käännössivun keskitetystä otsakkeesta (Herculei labores / Desiderius Erasmus: Adagia III.1.1:
     tekijä ja teos kaksoispisteen molemmin puolin). Haetaan vastinsivu ja enintään kaksi viitesivua. Ei mainoksia eikä
     lahjoituspyyntöä. Mitattu 20.11.2026. */
  async function philological() {
    if (!/(^|\.)philological\.(cal\.)?bham\.ac\.uk$/i.test(location.hostname)) return null;
    const tiedosto = u => (/[^/]*$/.exec(new URL(u, osoite).pathname) || [''])[0];
    const nelio = a => a.querySelector('img[src*="grsqr" i], img[src*="green" i]');
    const vastine = d => {
      const lask = new Map();
      d.querySelectorAll('a[href*="#"]').forEach(a => { if (!nelio(a)) return; const f = tiedosto(a.getAttribute('href')); if (f && f !== tiedosto(osoite)) lask.set(f, (lask.get(f) || 0) + 1); });
      return [...lask].sort((a, b) => b[1] - a[1])[0];
    };
    const v = vastine(document);
    if (!v || v[1] < 3) return null;
    const oma = tiedosto(osoite), kansio = osoite.split('#')[0].replace(/[^/]*$/, '');
    const englantiOma = /(trans|eng)/i.test(oma) && !/(trans|eng)/i.test(v[0]);
    const vd = await hae(kansio + v[0]);
    if (!vd) return null;
    const lat = englantiOma ? vd : document, eng = englantiOma ? document : vd;
    const maar = [], laskuri = { n: 0 }, viiteSivut = new Map();
    // Viitesivun merkintä ankkurista seuraavaan ankkuriin: { teksti, lemma } (lemma = lihavoitu alku ilman rivinumeroa).
    const merkinta = (d, i) => {
      const ankkurit = [...d.querySelectorAll('a[name]')];
      if (i < 0 || i >= ankkurit.length) return null;
      const r = d.createRange(); r.setStartAfter(ankkurit[i]);
      if (ankkurit[i + 1]) r.setEndBefore(ankkurit[i + 1]); else r.setEndAfter(d.body.lastChild);
      const k = document.createElement('div'); k.appendChild(r.cloneContents());
      k.querySelectorAll('img, script, style').forEach(x => x.remove());
      k.querySelectorAll('font, span').forEach(x => x.replaceWith(...x.childNodes));
      k.querySelectorAll('a').forEach(a => a.replaceWith(...a.childNodes));
      const b = k.querySelector('strong, b');
      return { teksti: muunna(k.innerHTML.replace(/(<br\s*\/?>\s*)+$/i, ''), 'inlined').trim().replace(/\s*\n+\s*/g, ' '),
        lemma: b ? rivi(b.textContent).replace(/^[\dIVXLC.]+\s+/, '') : '' };
    };
    const sanat = t => rivi(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 2);
    // Lemma osuu, kun sen sanoista yli puolet on viitemerkkiä edeltävässä tekstissä.
    const lemmaOsuu = (lemma, ennen) => { const l = sanat(lemma), e = new Set(sanat(ennen)); return l.length > 0 && l.filter(w => e.has(w)).length * 2 > l.length; };
    const siirto = new Map(), kaytetty = new Set();
    const viitteet = async (el, d) => {
      for (const a of [...el.querySelectorAll('a[href*="#"]')]) {
        const h = a.getAttribute('href'), f = tiedosto(h), nimi = decodeURIComponent(h.split('#')[1] || '');
        if (!a.querySelector('img') || !f || f === v[0] || f === oma || !nimi) continue;
        if (!viiteSivut.has(f) && viiteSivut.size < 2) viiteSivut.set(f, await hae(kansio + f));
        const vd2 = viiteSivut.get(f);
        const i = vd2 ? [...vd2.querySelectorAll('a[name]')].findIndex(x => x.getAttribute('name') === nimi) : -1;
        let m = vd2 ? merkinta(vd2, i) : null, ii = i;
        // Ankkuri pykälän väärässä kohdassa lähteessä (Erasmuksen adagio: #3 on merkinnän Deinde ubi pertuleris lopussa): jos oma
        // lemma ei osu viitemerkkiä edeltävään tekstiin mutta edellisen merkinnän lemma osuu, käytetään edellistä. Kun vertailua
        // ei voi tehdä (käännöksen englanti, latinalainen lemma), käytetään sivun enemmistön ratkaisua (latina käsitellään ensin).
        const tila = siirto.get(f) || { omat: 0, edelliset: 0 }; siirto.set(f, tila);
        const ed = vd2 ? merkinta(vd2, i - 1) : null;
        const r = el.ownerDocument.createRange(); r.setStart(el, 0); r.setEndBefore(a);
        const ennen = r.toString().slice(-300);
        if (m && m.lemma && lemmaOsuu(m.lemma, ennen)) tila.omat++;
        else if (ed && ed.lemma && lemmaOsuu(ed.lemma, ennen)) { tila.edelliset++; m = ed; ii = i - 1; }
        else if (ed && tila.edelliset > tila.omat) { m = ed; ii = i - 1; }
        // Sama merkintä vain kerran (latinan puolella; käännöksen kopio jäisi rinnakkain toiseksi alaviitteeksi).
        const avain = f + '#' + ii;
        if (!m || !m.teksti || kaytetty.has(avain)) { a.remove(); continue; }
        kaytetty.add(avain);
        const tunnus = 'pm' + (++laskuri.n);
        a.replaceWith(merkki(tunnus));
        maar.push(maaritelma(tunnus, m.teksti));
      }
    };
    const LOHKO = 'p, h1, h2, h3, h4, h5, h6, li, center, blockquote, div';
    // Sivu jaksoiksi: [{ nimi, lohkot }].
    // Sivu jaksoiksi: [{ nimi, lohkot }]. Jakson aloittavat vain ankkurit, jotka ovat myös vastinsivulla (sallitut): Miltonin
    // säekappaleessa on lisäksi kommenttien ankkureita (20, 35), ja käännös on kohdistettu vain kohtiin 1, 31, 48 …
    const nimet = d => new Set([...d.querySelectorAll('a[name]')].map(a => rivi(a.getAttribute('name'))).filter(Boolean));
    const jaksot = async (d, sallitut) => {
      const runko = d.body.cloneNode(true);
      runko.querySelectorAll('script, style').forEach(x => x.remove());
      // Claris Home Pagen jäänne voi jäädä sulkematta ja sisältää koko sivun (Forsett): puretaan, ei poisteta.
      runko.querySelectorAll('x-claris-window, x-claris-tagview').forEach(x => x.replaceWith(...x.childNodes));
      // Dokumenttijärjestyksessä: ankkuri aloittaa jakson, olipa se tekstilohkossa, pelkkien neliöiden lohkossa (Forsett) tai
      // lohkojen välissä (Milton: <A NAME=1> ennen CENTERiä). Sama nimi peräkkäin (Miltonin viisi 1-ankkuria) ei aloita uutta.
      const tulos = [{ nimi: '', lohkot: [] }];
      const ok = a => { const n = rivi(a.getAttribute('name')); return n && sallitut.has(n) ? n : ''; };
      const uusi = n => { if (n && tulos[tulos.length - 1].nimi !== n) tulos.push({ nimi: n, lohkot: [] }); };
      const lehti = x => x.matches(LOHKO) && !x.querySelector(LOHKO);
      const ohje = t => /^(click a (blue|green) square|to see a commentary note|tessera caerulea)/i.test(t);
      // Lehtilohko palasiksi sallittujen ankkurien kohdalta: [{ nimi, el }] (nimi '' = jatkaa edellistä jaksoa).
      const pilko = x => {
        const anks = [...x.querySelectorAll('a[name]')].filter(ok);
        if (anks.length < 2) return [{ nimi: anks[0] ? ok(anks[0]) : '', el: x }];
        const doc = x.ownerDocument, palat = [];
        const pala = (alku, loppu, nimi) => {
          const r = doc.createRange();
          if (alku) r.setStartBefore(alku); else r.setStart(x, 0);
          if (loppu) r.setEndBefore(loppu); else r.setEnd(x, x.childNodes.length);
          const e = doc.createElement(x.tagName === 'CENTER' ? 'center' : 'p'); e.appendChild(r.cloneContents());
          if (rivi(e.textContent)) palat.push({ nimi, el: e });
        };
        pala(null, anks[0], '');
        anks.forEach((a, i) => pala(a, anks[i + 1] || null, ok(a)));
        return palat;
      };
      let otsake = null;
      const w = runko.ownerDocument.createTreeWalker(runko, NodeFilter.SHOW_ELEMENT);
      for (let x = w.nextNode(); x; x = w.nextNode()) {
        if (x.tagName === 'A' && x.getAttribute('name')) { const l = x.closest(LOHKO); if (!l || !lehti(l)) uusi(ok(x)); continue; }
        if (!lehti(x)) continue;
        const t = rivi(x.textContent.replace(/\u00a0/g, ' '));
        if (!otsake && t && x.tagName === 'CENTER' && !ohje(t)) { otsake = x; const a = x.querySelector('a[name]'); if (a) uusi(ok(a)); continue; }
        for (const pl of pilko(x)) {
          uusi(pl.nimi);
          const tt = rivi(pl.el.textContent.replace(/\u00a0/g, ' '));
          if (!tt || ohje(tt)) continue;
          tulos[tulos.length - 1].lohkot.push(pl.el);
        }
      }
      for (const j of tulos) for (const b of j.lohkot) {
        b.querySelectorAll('a').forEach(a => { if (nelio(a) || (!a.getAttribute('href') && !a.textContent.trim())) a.remove(); });
        await viitteet(b, d);
        b.querySelectorAll('img').forEach(x => x.remove());
        b.querySelectorAll('font, span').forEach(x => x.replaceWith(...x.childNodes));
        b.querySelectorAll('a[href]').forEach(a => { if (!/^https?:/i.test(a.getAttribute('href')) || /bham\.ac\.uk/.test(a.getAttribute('href'))) a.replaceWith(...a.childNodes); });
        [...b.attributes].forEach(x => b.removeAttribute(x.name));
      }
      return { jaksot: tulos.filter(j => j.lohkot.length), otsake };
    };
    const nl = nimet(lat), ne = nimet(eng);
    const L = await jaksot(lat, ne), E = await jaksot(eng, nl);
    const paikka = new Map();
    L.jaksot.forEach((j, i) => { if (j.nimi && !paikka.has(j.nimi)) paikka.set(j.nimi, i); });
    const osuu = E.jaksot.filter(j => j.nimi && paikka.has(j.nimi)).length;
    if (osuu < 3) return null;
    const kaannos = L.jaksot.map(() => []);
    let ed = 0;
    E.jaksot.forEach(j => { const i = j.nimi && paikka.has(j.nimi) ? paikka.get(j.nimi) : ed; ed = Math.max(ed, i); kaannos[i].push(...j.lohkot); });
    const el = document.createElement('div');
    const lohkoksi = b => { const p = document.createElement(/^H[1-6]$/.test(b.tagName) ? b.tagName : 'p'); p.append(...b.childNodes); return p; };
    L.jaksot.forEach((j, i) => {
      el.append(...j.lohkot.map(lohkoksi));
      if (kaannos[i].length) { const q = document.createElement('blockquote'); q.append(...kaannos[i].map(lohkoksi)); el.appendChild(q); }
    });
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    el.normalize();
    const rivit = o => o ? aqRivit(o) : [];
    const er = rivit(E.otsake), lr = rivit(L.otsake);
    const tt = (er[1] || '').split(/:\s*/);
    return { html: irrota([el]).innerHTML, otsikko: er[0] || lr[0] || rivi(document.title), tekija: tt.length > 1 ? tt[0] : '',
      teos: tt.length > 1 ? tt.slice(1).join(': ') : '', sivusto: 'The Philological Museum', ladonta: 'lomitettu käännös', lahde: kansio + tiedosto(lat === document ? osoite : kansio + v[0]),
      maar, naytto: 'The Philological Museum' };
  }

  /* Kolme WordPress-sivustoa (käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kohta 8: yleinen leikkaus ensin, sovite vain jos se ei
     riitä; mitattu 21.11.2026). Yleinen leike sai tekstin kaikista, mutta tiedot puuttuivat tai olivat väärin:
     - Lacan Online (lacanonline.com, Owen Hewitson): ei tekijää eikä päiväystä; tekijä on tekstin lopun allekirjoituksessa
       (By Owen Hewitson, LacanOnline.com), jonka perässä lisenssikappale. Väliotsikot ovat lihavoituja kappaleita.
     - Phenomenology Online (phenomenologyonline.com, Divi): tekijäksi tuli admin ja päiväykseksi tekstin vientipäivä; Textoriumin
       otsikko on Sukunimi, Etunimi. Otsikko, ja tekstin alussa otsikko ja tekijä toistuvat lihavoituina kappaleina.
     - Girardian Lectionary (girardianlectionary.net, Paul Nuechterlein): ei tekijää eikä päiväystä; alussa h6 Last revised: …
       ja ohje Click Reload. Tekijä vain viikkopohdinnoille (reflections/) ja Nuechterlein on … -teksteille.
     Lihavoitu yksinäinen kappale (alle 120 merkkiä) on väliotsikko. Ei mainoksia; Girardian Lectionary pyytää lahjoituksia. */
  function wpLihavatOtsikoiksi(el) {
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent), b = p.querySelector('strong, b');
      if (!t || t.length > 120 || !b || rivi(b.textContent) !== t || p.querySelector('a, img')) return;
      const h = document.createElement('h2'); h.textContent = t.replace(/[.:]$/, ''); p.replaceWith(h);
    });
  }
  function lacanOnline() {
    if (!/(^|\.)lacanonline\.com$/i.test(location.hostname)) return null;
    const sis = document.querySelector('article .entry-content');
    if (!sis) return null;
    const el = sis.cloneNode(true);
    el.querySelectorAll('script, style, .sharedaddy, .jp-relatedposts, .wp-block-buttons, figure img').forEach(x => x.remove());
    let tekija = '';
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent);
      const m = /^By\s+(.+?),\s*LacanOnline\.com$/i.exec(t);
      if (m) { tekija = m[1]; p.remove(); return; }
      if (/^All content on LacanOnline\.com is licensed/i.test(t)) p.remove();
    });
    wpLihavatOtsikoiksi(el);
    if (kkSanoja(el) < 100) return null;
    const aika = document.querySelector('time.entry-date.published, time.published');
    return { html: irrota([el]).innerHTML, otsikko: rivi((document.querySelector('.entry-title') || {}).textContent) || rivi(document.title),
      tekija, julkaistu: aika ? (aika.getAttribute('datetime') || '').slice(0, 10) : '', sivusto: 'Lacan Online', lahde: osoite, maar: [], naytto: 'Lacan Online' };
  }
  function phenomenologyOnline() {
    if (!/(^|\.)phenomenologyonline\.com$/i.test(location.hostname)) return null;
    const sis = document.querySelector('.et_pb_post_content');
    if (!sis) return null;
    const el = sis.cloneNode(true);
    el.querySelectorAll('script, style').forEach(x => x.remove());
    const h1 = rivi((document.querySelector('h1.entry-title') || {}).textContent);
    // Textorium: Baldursson, Stefan. The Nature of At-Homeness → tekijä Stefan Baldursson, otsikko loput.
    const m = /^([^,.]+),\s*([^.]+?)\.\s+(.+)$/.exec(h1);
    const otsikko = m ? m[3] : h1, tekija = m ? m[2] + ' ' + m[1] : '';
    // Otsikon ja tekijän toisto tekstin alussa.
    const toisto = new Set([otsikko, h1, m ? m[1] + ', ' + m[2] : ''].map(x => x.toLowerCase()).filter(Boolean));
    for (let p = el.firstElementChild; p && p.tagName === 'P';) {
      const s = p.nextElementSibling;
      if (toisto.has(rivi(p.textContent).replace(/[.:]$/, '').toLowerCase())) p.remove(); else break;
      p = s;
    }
    wpLihavatOtsikoiksi(el);
    if (kkSanoja(el) < 50) return null;
    // Murupolku olisi sivun otsikko; osasto osoitteesta.
    const polku = /\/sources\/textorium\//.test(location.pathname) ? 'Sources › Textorium' : /\/scholars\//.test(location.pathname) ? 'Scholars' : '';
    return { html: irrota([el]).innerHTML, otsikko, tekija, polku, sivusto: 'Phenomenology Online', lahde: osoite, maar: [], naytto: 'Phenomenology Online' };
  }
  function girardianLectionary() {
    if (!/(^|\.)girardianlectionary\.net$/i.test(location.hostname)) return null;
    const sis = document.querySelector('.pf-content');
    if (!sis) return null;
    const el = sis.cloneNode(true);
    el.querySelectorAll('script, style, .printfriendly').forEach(x => x.remove());
    let julkaistu = '';
    el.querySelectorAll('h6').forEach(h => {
      const t = rivi(h.textContent);
      if (!/last revised|first posted|click reload/i.test(t)) return;
      const m = /Last revised:\s*([A-Z][a-z]+ \d{1,2}, \d{4})/i.exec(t) || /First Posted:\s*([A-Z][a-z]+ \d{1,2}, \d{4})/i.exec(t);
      if (m) { const d = new Date(m[1] + ' 12:00 UTC'); if (!isNaN(d)) julkaistu = d.toISOString().slice(0, 10); }
      h.remove();
    });
    if (kkSanoja(el) < 100) return null;
    const otsikko = rivi((document.querySelector('.entry-title, h1') || {}).textContent) || rivi(document.title);
    const oma = /\/reflections\//.test(location.pathname) || /^Nuechterlein on\b/i.test(otsikko);
    return { html: irrota([el]).innerHTML, otsikko, tekija: oma ? 'Paul Nuechterlein' : '', julkaistu, sivusto: 'Girardian Lectionary',
      lahde: osoite, maar: [], naytto: 'Girardian Lectionary' };
  }

  /* GRETIL (Göttingen Register of Electronic Texts in Indian Languages; käyttäjän pyyntö 20.11.2026, mietintämyssyn kärki 2:
     Nāgārjuna). Sanskritkorpuksen TEI-tiedostojen HTML-muunnokset (/gretil/corpustei/transformations/html/sa_….htm), kaikki samalla
     pohjalla: h1 Tekijä: Teos, otsakeosa (Data entry, Source, Licence, Notes) ja h2 Text, jonka jälkeen teksti div[xml:lang]:ssa.
     Säe on <p>, rivit <br>:llä, ja säkeen viite joko lopussa tekstinä (// MMK_1.1 //) tai span.ref (KMgD_1): numero yläindeksiksi
     säkeen alkuun (kohdat: yläindeksit), dandat jäävät. Painoksen sivut span.note > span.bold (Vv 216) ja kappaleen sisällä (Vv 222)
     vakiosivuiksi {216}, etukenttään vakiosivut: Vv; lähdepainoksen määritelmä (… = Vv.) otsakkeen Source-kohdasta, joka on myös
     alaotsikko. Muut span.note-merkinnät hakasulkeisiin kuten sivun CSS. Lisenssi otsakkeen CC-linkistä. Yleinen leikkaus otti
     otsakkeen tekstiin eikä erottanut viitteitä. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 20.11.2026. */
  function gretil() {
    if (!/(^|\.)gretil\.sub\.uni-goettingen\.de$/i.test(location.hostname)) return null;
    const teksti = [...document.querySelectorAll('h2')].find(h => /^text$/i.test(rivi(h.textContent)));
    if (!teksti) return null;
    const lahdeLi = (() => { const h = [...document.querySelectorAll('h4')].find(x => /source/i.test(x.textContent)); const ul = h && h.nextElementSibling; return ul && ul.tagName === 'UL' ? rivi(ul.textContent) : ''; })();
    const lyh = (/=\s*([A-Za-z]{1,6})\.?\s*$/.exec(lahdeLi) || [])[1] || '';
    const SIVU = /^([A-Za-z]{1,6})\.?\s*(\d{1,4}[a-z]?)$/;
    const el = document.createElement('div');
    let kohtia = 0, sivuja = 0, odottava = null;
    const sivuMerkki = t => { const m = SIVU.exec(rivi(t)); return m && (!lyh || m[1] === lyh) ? m[2] : null; };
    const kasittele = p => {
      const k = p.cloneNode(true);
      k.removeAttribute('id'); k.removeAttribute('class');
      // Sivu kappaleen sisällä: (<span class="bold">Vv 222</span>).
      k.querySelectorAll('span.bold, span.pb, span.note').forEach(s => {
        const n = sivuMerkki(s.textContent);
        if (n == null) { if (s.classList.contains('note') || s.classList.contains('pb')) s.replaceWith(' [' + rivi(s.textContent) + '] '); return; }
        const e = s.previousSibling, j = s.nextSibling;
        if (e && e.nodeType === 3 && /\(\s*$/.test(e.nodeValue) && j && j.nodeType === 3 && /^\s*\)/.test(j.nodeValue)) { e.nodeValue = e.nodeValue.replace(/\(\s*$/, ''); j.nodeValue = j.nodeValue.replace(/^\s*\)/, ''); }
        s.replaceWith('{' + n + '}'); sivuja++;
      });
      // Säkeen viite: span.ref tai loppu // MMK_1.1 //.
      let nro = '';
      const ref = k.querySelector('span.ref');
      if (ref) { nro = (/_([\d.]+[a-z]?)$/.exec(rivi(ref.textContent)) || [])[1] || ''; ref.remove(); }
      else {
        const w = document.createTreeWalker(k, NodeFilter.SHOW_TEXT); let viim = null;
        while (w.nextNode()) if (rivi(w.currentNode.nodeValue)) viim = w.currentNode;
        const m = viim && /\/\/\s*[A-Za-z]+_([\d.]+[a-z]?)\s*\/\/\s*$/.exec(viim.nodeValue);
        if (m) { nro = m[1]; viim.nodeValue = viim.nodeValue.slice(0, m.index) + '//'; }
      }
      k.querySelectorAll('span.hi, span.it, span.i').forEach(s => { const i = document.createElement('i'); i.append(...s.childNodes); s.replaceWith(i); });
      k.querySelectorAll('span').forEach(s => s.replaceWith(...s.childNodes));
      k.querySelectorAll('a').forEach(a => a.replaceWith(...a.childNodes));
      const tyhja = n => n && (n.nodeName === 'BR' || (n.nodeType === 3 && !rivi(n.nodeValue)));
      while (tyhja(k.lastChild)) k.lastChild.remove();
      // Säenumero alkuun ja sivu sen eteen ({220} ^2^ atha …): sivu alkaa ennen säettä.
      if (nro) { const sup = document.createElement('sup'); sup.textContent = nro; k.insertBefore(document.createTextNode(' '), k.firstChild); k.insertBefore(sup, k.firstChild); kohtia++; }
      if (odottava) { k.insertBefore(document.createTextNode('{' + odottava + '} '), k.firstChild); odottava = null; }
      if (rivi(k.textContent)) el.appendChild(k);
    };
    const kay = solmu => {
      for (const x of solmu.children) {
        if (x.tagName === 'P') { kasittele(x); continue; }
        // Sivu kappaleiden välissä (<span class="note"><span class="bold">Vv 216</span></span>): seuraavan kappaleen alkuun.
        if (x.tagName === 'SPAN') { const n = sivuMerkki(x.textContent); if (n != null) { odottava = n; sivuja++; } continue; }
        if (/^H[1-6]$/.test(x.tagName)) { const h = document.createElement('h2'); h.textContent = rivi(x.textContent); el.appendChild(h); continue; }
        if (x.children.length) kay(x);
      }
    };
    for (let n = teksti.nextElementSibling; n; n = n.nextElementSibling) {
      if (n.tagName === 'P') kasittele(n); else if (n.tagName === 'SPAN') { const v = sivuMerkki(n.textContent); if (v != null) { odottava = v; sivuja++; } } else kay(n);
    }
    if (kkSanoja(el) < 30) return null;
    el.normalize();
    const h1 = rivi((document.querySelector('h1') || {}).textContent), kp = h1.indexOf(':');
    const lisenssi = document.querySelector('a[href*="creativecommons.org/licenses"]');
    return { html: irrota([el]).innerHTML, otsikko: kp > 0 ? rivi(h1.slice(kp + 1)) : h1 || rivi(document.title).replace(/\s*\(GRETIL\)\s*$/, ''),
      tekija: kp > 0 ? rivi(h1.slice(0, kp)) : '', alaotsikko: lahdeLi.length > 3 ? lahdeLi.replace(/\s*=\s*[A-Za-z]{1,6}\.?\s*$/, '') : '',
      sivusto: 'GRETIL', kohdat: kohtia > 2 ? 'yläindeksit' : '', vakiosivut: sivuja && lyh ? lyh : '', lahde: osoite,
      oikeus: lisenssi ? { teksti: rivi(lisenssi.textContent).replace(/^Distributed under an? /i, '').replace(/\.$/, ''), lahde: lisenssi.href } : null,
      maar: [], naytto: 'GRETIL' };
  }

  /* augustinus.it (Sant'Agostino – Augustinus Hipponensis, Nuova Biblioteca Agostiniana ja Città Nuova; käyttäjän pyyntö 20.11.2026,
     mietintämyssyn kärki 1): Augustinuksen koko tuotanto latinaksi (PL) ja italiaksi, myös espanjaksi osa. Vanhaa FrontPage-HTML:ää
     kehyksissä: osoiterivillä on teoksen index2.htm, ja kirja (conf_01_libro.htm, trinita_01_libro.htm, discorso_001_testo.htm,
     soliloqui_1_testo.htm) on sisäkehyksessä viitekehyksen (…_note.htm) kanssa. Tekstikehys löydetään kappaleankkureista
     (a[name=C_001_005_006]: lyhenne, kirja tai sivu, luku, kappale), jotka ovat samat latinassa ja italiassa (/latino/ ↔ /italiano/,
     sama tiedostonimi). Leike on lomitettu käännös kuten Perseuksessa: latinan kappale ja sen perässä saman ankkurin italia
     lainauksena; käännös tulee ennen seuraavaa latinan otsikkoa tai ankkurikappaletta. Italiasta leikattaessa alkuteksti haetaan.
     Kappaleen alun numerot (<B>5.</B> 6., Sermonesissa <B><A>1.</A></B>, De civitate Dei 1.) yläindeksiksi ankkurin mukaan ilman
     kirjaa (5.6; Sermo 1 → 1) ja etukenttään kohdat: yläindeksit. Latinan viitesivun raamatunkohdat alaviitteiksi, italian samat
     viitemerkit pois. Sivut ovat windows-1252:ta (italiassa raakoja tavuja), joten haku dekoodaa merkistön (hae() lukisi UTF-8:na).
     Otsikko latinan h3:sta (LIBER PRIMUS) ja teos latinan titolo.htm:n nimiöstä (Confessionum libri XIII → Confessionum liber
     primus). Tekijänoikeus: Città Nuova ja NBA sallivat yksityisen lukemisen (copyright.htm). Ei mainoksia eikä lahjoituspyyntöä.
     Mitattu 20.11.2026. */
  const AUG_ANKKURI = /^[A-Z]{1,4}_\d{3}_\d{3}_\d{3}$/;
  // Versaali virkkeen kirjainkokoon (ORTUS, INFANTIA ET PUERITIA → Ortus, infantia et pueritia; LIBER I → Liber I).
  const augIso = t => t !== t.toUpperCase() || !/\p{Lu}{3}/u.test(t) ? t
    : t.toLowerCase().replace(/(^|[^\p{L}])([ivxlc]+)(?=$|[^\p{L}])/gu, (x, a, r) => a + r.toUpperCase()).replace(/\p{L}/u, c => c.toUpperCase());
  function augHae(u) {
    const avain = 'augustinus:' + u;
    if (!sivut.has(avain)) {
      const ohi = new AbortController(), ajastin = setTimeout(() => ohi.abort(), 8000);
      sivut.set(avain, fetch(u, { credentials: 'same-origin', signal: ohi.signal }).then(r => r.ok ? r.arrayBuffer() : null).then(b => {
        if (!b) return null;
        const m = /charset=["']?([\w-]+)/i.exec(new TextDecoder('windows-1252').decode(b.slice(0, 2048)));
        let t;
        try { t = new TextDecoder(m ? m[1] : 'windows-1252').decode(b); } catch (e) { t = new TextDecoder('windows-1252').decode(b); }
        return jasenna(t);
      }).catch(() => null).finally(() => clearTimeout(ajastin)));
    }
    return sivut.get(avain);
  }
  async function augustinus() {
    if (!/(^|\.)augustinus\.it$/i.test(location.hostname)) return null;
    // Kehykset (frameset ja sisäkkäiset): kaikki saman alkuperän asiakirjat.
    const docs = [];
    const keraa = d => { docs.push(d); d.querySelectorAll('frame, iframe').forEach(f => { try { if (f.contentDocument && f.contentDocument.body) keraa(f.contentDocument); } catch (e) { /* toinen alkuperä */ } }); };
    keraa(document);
    const ankkurit = d => [...d.querySelectorAll('a[name]')].filter(a => AUG_ANKKURI.test(a.getAttribute('name')));
    const teksti = docs.map(d => ({ d, n: ankkurit(d).length })).sort((a, b) => b.n - a.n)[0];
    if (!teksti || teksti.n < 2) return null;
    const oma = teksti.d, omaU = oma.location.href.split('#')[0];
    const km = /\/(latino|italiano|spagnolo)\//.exec(new URL(omaU).pathname);
    if (!km) return null;
    const latU = omaU.replace('/' + km[1] + '/', '/latino/');
    const kaannosU = km[1] === 'latino' ? omaU.replace('/latino/', '/italiano/') : omaU;
    const kehyksesta = u => docs.find(d => d.location && d.location.href.split('#')[0] === u);
    const lat = km[1] === 'latino' ? oma : kehyksesta(latU) || await augHae(latU);
    const kaan = km[1] === 'latino' ? kehyksesta(kaannosU) || await augHae(kaannosU) : oma;
    const alku = lat && ankkurit(lat).length >= 2 ? lat : oma, alkuU = alku === oma ? omaU : latU;
    const toinen = alku === lat && kaan && kaan !== alku && ankkurit(kaan).length >= 2 ? kaan : null;
    const maar = [];
    let viiteN = 0, kohtia = 0;
    // Alkutekstin viitesivun merkinnät (<A NAME="N1">1</A></FONT> - Ps 47, 1; …).
    const viiteSivut = new Map();
    const viite = async (href) => {
      let u; try { u = new URL(href, alkuU); } catch (e) { return ''; }
      const s = u.href.split('#')[0], nimi = decodeURIComponent(u.hash.slice(1));
      if (!viiteSivut.has(s)) viiteSivut.set(s, viiteSivut.size < 3 ? kehyksesta(s) || await augHae(s) : null);
      const vd = viiteSivut.get(s);
      const a = vd && [...vd.querySelectorAll('a[name]')].find(x => x.getAttribute('name') === nimi);
      const p = a && a.closest('p');
      if (!p) return '';
      const k = p.cloneNode(true);
      k.querySelectorAll('a[name]').forEach(x => { const f = x.closest('font'); (f && k.contains(f) ? f : x).remove(); });
      k.querySelectorAll('font, span, u').forEach(x => x.replaceWith(...x.childNodes));
      return muunna(k.innerHTML, 'inlined').trim().replace(/\s*\n+\s*/g, ' ').replace(/^(?:\\?[-–]\s*)+/, '');
    };
    const viitemerkki = a => /_note\.htm/i.test(a.getAttribute('href') || '') || (/#N\d+$/.test(a.getAttribute('href') || '') && a.querySelector('sup'));
    // Kappaleen alun numerot pois ja tilalle ankkurin mukainen yläindeksi.
    const numerot = (p, nimi, sup = true) => {
      const pituus = (/^[\s\d.\u00a0]+/.exec(p.textContent) || [''])[0].length;
      let jaljella = pituus;
      const w = p.ownerDocument.createTreeWalker(p, NodeFilter.SHOW_TEXT), tekstit = [];
      while (w.nextNode()) tekstit.push(w.currentNode);
      for (const t of tekstit) { if (jaljella <= 0) break; const n = Math.min(jaljella, t.nodeValue.length); t.nodeValue = t.nodeValue.slice(n); jaljella -= n; }
      p.querySelectorAll('b, strong, a[name]').forEach(x => { if (!rivi(x.textContent) && !x.querySelector('img')) x.replaceWith(...x.childNodes); });
      const osat = nimi.split('_').slice(2).map(Number);
      while (osat.length && !osat[osat.length - 1]) osat.pop();
      if (!osat.length || !sup) return;
      const s = p.ownerDocument.createElement('sup'); s.textContent = osat.join('.');
      p.insertBefore(p.ownerDocument.createTextNode(' '), p.firstChild); p.insertBefore(s, p.firstChild);
      kohtia++;
    };
    const siivoa = async (b, viitteet) => {
      for (const a of [...b.querySelectorAll('a[href]')]) {
        if (!viitemerkki(a)) { a.replaceWith(...a.childNodes); continue; }
        const t = viitteet ? await viite(a.getAttribute('href')) : '';
        if (!t) { a.remove(); continue; }
        const tunnus = 'au' + (++viiteN);
        a.replaceWith(merkki(tunnus));
        maar.push(maaritelma(tunnus, t));
      }
      b.querySelectorAll('font, span, u, img').forEach(x => x.tagName === 'IMG' ? x.remove() : x.replaceWith(...x.childNodes));
      [...b.attributes].forEach(x => b.removeAttribute(x.name));
      // Viitemerkin paikalle jää väli ennen välimerkkiä (lodarti<FONT SIZE=1> </FONT><A>1</A><I>. </I>): pelkän välimerkin
      // kursiivi puretaan ja väli ennen välimerkkiä poistetaan, myös solmujen rajan yli.
      b.querySelectorAll('i, em, b, strong').forEach(x => { if (/^[\s.,;:!?]*$/.test(x.textContent)) x.replaceWith(...x.childNodes); });
      b.normalize();
      const w = b.ownerDocument.createTreeWalker(b, NodeFilter.SHOW_TEXT);
      let ed = null;
      for (let t = w.nextNode(); t; t = w.nextNode()) {
        t.nodeValue = t.nodeValue.replace(/[ \t\u00a0]+([.,;:!?])/g, '$1');
        if (ed && /^[.,;:!?]/.test(t.nodeValue)) ed.nodeValue = ed.nodeValue.replace(/[\s\u00a0]+$/, '');
        if (t.nodeValue) ed = t;
      }
    };
    // Sivu lohkoiksi: { tyyppi: 'h' | 'p', taso, el, ankkuri }.
    const lohkot = d => {
      const tulos = [];
      d.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach(x => {
        if (x.closest('table') || x.parentElement.closest('p, h1, h2, h3, h4, h5, h6')) return;
        const t = rivi(x.textContent.replace(/\u00a0/g, ' '));
        if (!t) return;
        const k = x.cloneNode(true);
        const a = [...k.querySelectorAll('a[name]')].find(y => AUG_ANKKURI.test(y.getAttribute('name')));
        // Luvun tiivistelmä pienellä (De civitate Dei: <FONT SIZE=2>Victi in loca Christianorum confugiunt.</FONT>): omana
        // kappaleenaan latinassa, italiassa ankkurikappaleen alussa <BR>:n edellä. Erotetaan omaksi lohkokseen.
        if (a && !/^H/.test(x.tagName)) {
          const brt = [...k.querySelectorAll('br')].filter(br => br.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING);
          if (brt.length) {
            const r = k.ownerDocument.createRange(); r.setStart(k, 0); r.setEndAfter(brt[brt.length - 1]);
            const p = k.ownerDocument.createElement('p'); p.appendChild(r.extractContents());
            if (rivi(p.textContent)) tulos.push({ tyyppi: 'tiivis', taso: 0, el: p, ankkuri: '' });
          }
        }
        const pieni = !a && x.tagName === 'P' && t.length < 400 && [...k.querySelectorAll('font[size="1"], font[size="2"]')].reduce((n, f) => n + rivi(f.textContent).length, 0) >= t.length * 0.9;
        tulos.push({ tyyppi: /^H/.test(x.tagName) ? 'h' : pieni ? 'tiivis' : 'p', taso: +x.tagName.slice(1) || 0, el: k, ankkuri: a ? a.getAttribute('name') : '' });
      });
      return tulos;
    };
    const A = lohkot(alku);
    // Käännöksen jaksot ankkureittain (otsikot ohitetaan; ennen ensimmäistä ankkuria oleva on kirjan nimiötä).
    const jaksot = new Map();
    if (toinen) {
      const alkuNimet = new Set(A.map(x => x.ankkuri).filter(Boolean));
      let nyt = null;
      for (const x of lohkot(toinen)) {
        if (x.tyyppi !== 'p') continue;
        if (x.ankkuri && alkuNimet.has(x.ankkuri)) { nyt = []; jaksot.set(x.ankkuri, nyt); }
        if (!nyt) continue;
        // Käännöksen kappalenumerot pois: kohta on jo alkutekstissä.
        if (x.ankkuri) numerot(x.el, x.ankkuri, false);
        await siivoa(x.el, false);
        nyt.push(x.el);
      }
    }
    const el = document.createElement('div');
    let odottaa = null, nimio = '', alaots = '', kappaleita = 0;
    const pura = () => {
      if (!odottaa || !odottaa.length) { odottaa = null; return; }
      const q = document.createElement('blockquote');
      odottaa.forEach(p => { const k = document.createElement('p'); k.append(...p.childNodes); if (rivi(k.textContent)) q.appendChild(k); });
      if (q.children.length) el.appendChild(q);
      odottaa = null;
    };
    for (const [i, x] of A.entries()) {
      const t = rivi(x.el.textContent.replace(/\u00a0/g, ' '));
      // Tiivistelmä ankkurikappaleen edellä on luvun otsikko.
      if (x.tyyppi === 'tiivis' && A[i + 1] && A[i + 1].ankkuri) {
        pura();
        const h = document.createElement('h3'); h.textContent = augIso(t).replace(/\.$/, '');
        el.appendChild(h);
        continue;
      }
      if (x.tyyppi === 'h') {
        if (x.taso <= 3 && !nimio) { nimio = t; continue; }
        // Kirjan aihe heti nimiön jälkeen (ORTUS, INFANTIA ET PUERITIA) on alaotsikko.
        if (!kappaleita && !alaots && t === t.toUpperCase() && /\p{Lu}{4}/u.test(t) && !el.children.length) { alaots = augIso(t); continue; }
        pura();
        const h = document.createElement(x.taso <= 4 ? 'h2' : 'h3');
        h.textContent = augIso(t).replace(/\.$/, '');
        el.appendChild(h);
        continue;
      }
      // Sermonin versaalinen nimiö ennen ensimmäistä kappaletta (TRACTATUS CONTRA MANICHAEOS …) on alaotsikko.
      if (!kappaleita && !x.ankkuri && !alaots && t === t.toUpperCase() && /\p{Lu}{4}/u.test(t)) {
        x.el.querySelectorAll('a[href]').forEach(a => { if (viitemerkki(a)) a.remove(); });
        alaots = augIso(rivi(x.el.textContent.replace(/\u00a0/g, ' ')));
        continue;
      }
      if (x.ankkuri) { pura(); numerot(x.el, x.ankkuri); }
      await siivoa(x.el, true);
      const p = document.createElement('p'); p.append(...x.el.childNodes);
      el.appendChild(p); kappaleita++;
      if (x.ankkuri && jaksot.has(x.ankkuri)) odottaa = jaksot.get(x.ankkuri);
    }
    pura();
    // Otsikkotasot: jos h2:ta ei ole (Sermones: vain H5), h3 → h2.
    if (!el.querySelector('h2')) el.querySelectorAll('h3').forEach(h => { const u = document.createElement('h2'); u.append(...h.childNodes); h.replaceWith(u); });
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    el.normalize();
    // Teos latinan nimiökehyksestä (titolo.htm: <title>Augustinus Hipponensis - Confessionum libri XIII</title>).
    const nimiU = latU.replace(/[^/]*$/, 'titolo.htm');
    const nd = kehyksesta(nimiU) || await augHae(nimiU);
    const teos = rivi((nd && nd.title) || '').replace(/^Augustinus Hipponensis\s*-\s*/i, '');
    const kirja = augIso(nimio);
    const liber = /^liber\b/i.test(kirja) && teos;
    const otsikko = liber ? teos.replace(/\s+libri\s+\S+$/i, '') + ' ' + kirja.replace(/^Liber/, 'liber') : kirja || teos || rivi(oma.title);
    return { html: irrota([el]).innerHTML, otsikko, alaotsikko: alaots, tekija: 'Augustinus', teos: liber ? '' : teos !== otsikko ? teos : '',
      kustantaja: 'Città Nuova Editrice, Nuova Biblioteca Agostiniana', sivusto: 'augustinus.it',
      ladonta: toinen && jaksot.size ? 'lomitettu käännös' : '', kohdat: kohtia > 2 ? 'yläindeksit' : '', lahde: alkuU,
      oikeus: { teksti: '© Città Nuova Editrice e Nuova Biblioteca Agostiniana; consultazione privata e personale', lahde: 'https://www.augustinus.it/copyright.htm' },
      maar, naytto: 'augustinus.it' };
  }

  /* Book of Concord (bookofconcord.org, Hugo; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 9): luterilaiset tunnustuskirjat
     Triglot Concordian (1921) englanninnoksena. Tunnustus on jaettu artikloittain omille sivuilleen (Augsburgin tunnustuksen artikla
     70 sanaa), ja osan sivuilla (asiakirjan etusivu, Schmalkaldenin osat) on lisäksi alasivujen teksti koottuna, joten koko
     asiakirja kootaan lehtisivuista: järjestys asiakirjan etusivun osioista (main a > h3; yläpalkin sisällysluettelosta puuttuu
     Ison katekismuksen johdanto), ja osio, jonka alla sisällysluettelossa (#toc-menu .toc-item.toc-levelN) on sivuja, on väliotsikko
     (Part III) ja sen lehdet (sivu, jonka perässä ei ole syvempää tasoa) tekstiä. Lehtisivun h2 sen nimeksi (luettelon nimistä puuttuu
     piste: Article I Of God). Kappalenumerot (span.bocanchor-content, tunnustusten viittausyksikkö: AC I, 3) yläindekseiksi;
     tyhjät ankkurit ja selaus (.next-previous-box) pois. Otsikossa oleva kappalenumero (Iso katekismus: 49 Thou shalt not take …)
     siirretään seuraavan kappaleen alkuun, ettei otsikkoon jää yläindeksiä. Etukenttään asiakirjan nimi, tekijä tunnetuille
     (Luther, Melanchthon), teos Triglot Concordia (1921) ja oikeudet (*public domain*, About the Translation). Ei mainoksia eikä
     lahjoituspyyntöä (kirjan ostolinkki CPH:lle). Mitattu 20.11.2026. */
  const BOC_TEKIJAT = { 'augsburg-confession': 'Philip Melanchthon', defense: 'Philip Melanchthon', 'power-and-primacy': 'Philip Melanchthon',
    'smalcald-articles': 'Martin Luther', 'small-catechism': 'Martin Luther', 'large-catechism': 'Martin Luther' };
  function bocRunko(d) {
    const m = d && [...d.querySelectorAll('main')].find(x => !x.closest('footer'));
    if (!m) return null;
    const el = m.cloneNode(true);
    el.querySelectorAll('script, style, img, .next-previous-box').forEach(x => x.remove());
    el.querySelectorAll('span.bocanchor').forEach(s => {
      const n = rivi((s.querySelector('.bocanchor-content') || {}).textContent || '');
      if (!/^\d+[a-z]?$/.test(n)) { s.remove(); return; }
      const sup = document.createElement('sup'); sup.textContent = n;
      const h = s.closest(OTSIKOT);
      if (h) {
        s.remove();
        let seur = h.nextElementSibling;
        while (seur && !rivi(seur.textContent)) seur = seur.nextElementSibling;
        if (seur && seur.tagName === 'P') seur.prepend(sup, ' ');
        return;
      }
      s.replaceWith(sup, ' ');
    });
    // Schmalkaldenin artiklojen pohjasta puuttuu luokka: <span id="0001" class=""><span … class="-content">1</span></span>.
    el.querySelectorAll('span[class="-content"]').forEach(s => {
      const n = rivi(s.textContent), ulko = s.parentElement && s.parentElement.tagName === 'SPAN' ? s.parentElement : s;
      if (!/^\d+[a-z]?$/.test(n)) return;
      const sup = document.createElement('sup'); sup.textContent = n; ulko.replaceWith(sup, ' ');
    });
    el.querySelectorAll('span').forEach(s => { if (!rivi(s.textContent)) s.remove(); else s.replaceWith(...s.childNodes); });
    el.querySelectorAll(OTSIKOT).forEach(h => { h.removeAttribute('id'); h.querySelectorAll('strong').forEach(b => b.replaceWith(...b.childNodes)); });
    el.querySelectorAll('a').forEach(a => a.replaceWith(...a.childNodes));
    return el;
  }
  async function bookOfConcord() {
    if (!/(^|\.)bookofconcord\.org$/i.test(location.hostname)) return null;
    const juuri = (/^\/([a-z0-9-]+)\//.exec(location.pathname) || [])[1];
    if (!juuri || !document.getElementById('toc-menu')) return null;
    const kohdat = [];
    document.querySelectorAll('#toc-menu .toc-item').forEach(s => {
      const a = s.querySelector(':scope > a[href]'), taso = +((/toc-level(\d)/.exec(s.className) || [])[1] || 0);
      if (!a) return;
      const u = new URL(a.getAttribute('href'), osoite);
      if (u.pathname.split('/')[1] !== juuri || kohdat.some(k => k.u === u.href)) return;
      kohdat.push({ u: u.href, taso, nimi: rivi(a.textContent), juuri: u.pathname === '/' + juuri + '/' });
    });
    const paa = kohdat.find(k => k.juuri), alat = kohdat.filter(k => !k.juuri);
    const nyt = osoite.replace(/\/?$/, '/'), juuriU = location.origin + '/' + juuri + '/';
    // Järjestys asiakirjan etusivun osioista (main section > a > h3): sisällysluettelosta puuttuu osa sivuista (Iso katekismus:
    // /intro/). Osio, jonka alla sisällysluettelossa on sivuja (Schmalkalden: Part III), on väliotsikko ja sen lehdet tekstiä.
    const etu = juuriU === nyt ? document : await hae(juuriU);
    const osiot = [];
    if (etu) etu.querySelectorAll('main a[href] > h3').forEach(h => {
      const u = new URL(h.parentElement.getAttribute('href'), juuriU).href;
      if (u.startsWith(juuriU) && u !== juuriU && !osiot.some(o => o.u === u)) osiot.push({ u, nimi: rivi(h.textContent) });
    });
    const lehti = (k, i, l) => !(l[i + 1] && l[i + 1].taso > k.taso);
    let jarjestys = [];
    if (osiot.length) for (const o of osiot) {
      const alla = alat.filter(k => k.u !== o.u && k.u.startsWith(o.u));
      const lehdet = alla.filter(lehti);
      if (lehdet.length) jarjestys.push({ ...o, vali: true, syvyys: 0 }, ...lehdet.map(k => ({ ...k, syvyys: 1 })));
      else jarjestys.push({ ...o, syvyys: 0 });
    }
    else jarjestys = alat.filter(lehti).map(k => ({ ...k, syvyys: 0 }));
    const valitut = jarjestys.filter(k => !k.vali);
    if (!valitut.length || valitut.length > KK_RAJA) { jarjestys = [{ u: nyt, nimi: '', syvyys: 0 }]; valitut.splice(0, valitut.length, jarjestys[0]); }
    const haettavat = valitut.filter(k => k.u !== nyt);
    const haetut = await kkHae(haettavat.map(k => k.u));
    const doc = k => k.u === nyt ? document : haetut[haettavat.indexOf(k)];
    const el = document.createElement('div');
    let sivuja = 0;
    for (const k of jarjestys) {
      // Väliotsikko (Part III): pelkkä otsikko, sen teksti tulee lehdiltä.
      if (k.vali) { const h = document.createElement('h2'); h.textContent = k.nimi; el.appendChild(h); continue; }
      const r = bocRunko(doc(k));
      if (!r || kkSanoja(r) < 3) continue;
      sivuja++;
      kkSiirra(r, 1 + k.syvyys);
      el.append(...r.childNodes);
    }
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const nimi = paa ? paa.nimi : rivi(document.title.split('·')[0]);
    return { html: irrota([el]).innerHTML, otsikko: valitut.length > 1 ? nimi : rivi((document.querySelector('main h2') || {}).textContent) || nimi,
      tekija: BOC_TEKIJAT[juuri] || '', teos: valitut.length > 1 ? 'Triglot Concordia' : nimi, julkaistu: '1921',
      paikka: 'St. Louis', kustantaja: 'Concordia Publishing House', sivusto: 'BookOfConcord.org',
      lahde: valitut.length > 1 ? location.origin + '/' + juuri + '/' : osoite,
      oikeus: { teksti: 'These texts are in the public domain and may be freely copied.', lahde: location.origin + '/about-the-translation/' },
      maar: [], naytto: 'Book of Concord' + (sivuja > 1 ? ' (' + sivuja + ' sivua)' : '') };
  }

  /* Edition Open Sources, Edition Open Access ja Max Planck Research Library for the History and Development of Knowledge
     (edition-open-sources.org, edition-open-access.de, mprl-series.mpg.de; MPIWG:n yhteinen alusta; käyttäjän pyyntö 20.11.2026,
     sivustoehdokkaat-3 kärki 10: Galilei, Newton, tieteenhistoria). Kirja on luvuittain (/sources/12/3/index.html), ja koko kirja
     kootaan lukuvalikosta (.chapter-menu__list: li.chapter-menu__item linkkeinä, avattu luku pelkkänä tekstinä, osan nimi li > p > b
     väliotsikoksi, paitsi kirjan nimi); kirjan etusivulla ei ole valikkoa (Readability). Luvun nimi h1.publication-detail__title (numero span-elementissä), tekijät
     #chapterauthors. Teksti .publication-detail .accordion__main: kappalelohkot div.row ilman pysyvän linkin ja henkilöhakemiston
     nappeja (.flags), hakemistomerkinnät (eoaindexperson ym.) pois, kuvat pois ja kuvateksti kursiivikappaleeksi (sama teksti
     toistuu .publications__info-blockissa: pois), taulukot ruudukoiksi (ojsTaulukko), hi[rend=bold] lihavoinniksi, viittausten
     ponnahdukset (a.publications-popup-text) ja sisäiset linkit tekstiksi, muotoilu ala- ja yläindeksien sisältä pois. Alaviitteet sup.footnote > a[href$=#fnN] → saman sivun
     .footnotes-item (a[name=fnN], .footnotes-item__text). Faksimilesivut (ei tekstiä) jäävät pois. Etukenttään COinS-tiedoista
     (span.Z3988; koko kirjalle kirjan etusivulta, jossa Proceedings-sarjan rft.au on toimittaja): kirjan nimi, tekijät, vuosi,
     sarja ja numero, paikka, kustantaja ja luvun DOI vain yhden luvun leikkeelle; lisenssi RIS-viitteen C1-rivistä (by-nc-sa). Ei mainoksia eikä lahjoituspyyntöä. Mitattu 20.11.2026. */
  function eoaLuku(d, maar, laskuri) {
    const juuri = d && d.querySelector('.publication-detail .accordion__main');
    if (!juuri) return null;
    const el = juuri.cloneNode(true);
    el.querySelectorAll('script, style, button, .flags, a.accordion__pageup, .publications__info-block, .publication-detail__footnotes, img').forEach(x => x.remove());
    [...el.querySelectorAll('*')].forEach(x => { if (/^EOAINDEX/.test(x.tagName)) x.remove(); });
    el.querySelectorAll('sup.footnote').forEach(sup => {
      const a = sup.querySelector('a[href]'), n = a && (/#fn(\w+)$/.exec(a.getAttribute('href')) || [])[1];
      const kohde = n && d.querySelector('.footnotes-item a[name="fn' + n + '"]');
      const t = kohde && kohde.closest('.footnotes-item').querySelector('.footnotes-item__text');
      if (!t) return;
      const k = t.cloneNode(true);
      k.querySelectorAll('a.publications-popup-text, a[href^="index.html"], a[href^="../"]').forEach(x => x.replaceWith(...x.childNodes));
      const teksti = muunna(k.innerHTML, 'inlined').trim();
      if (!teksti) return;
      const tunnus = 'eo' + (++laskuri.n);
      sup.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, teksti));
    });
    el.querySelectorAll('figure').forEach(f => {
      const c = f.querySelector('figcaption');
      if (!c || !rivi(c.textContent)) { f.remove(); return; }
      const p = document.createElement('p'), em = document.createElement('em');
      em.append(...c.childNodes); p.appendChild(em); f.replaceWith(p);
    });
    el.querySelectorAll('hi').forEach(x => {
      const b = document.createElement(/bold/.test(x.getAttribute('rend') || '') ? 'strong' : /italic/.test(x.getAttribute('rend') || '') ? 'em' : 'span');
      b.append(...x.childNodes); x.replaceWith(b);
    });
    el.querySelectorAll('table').forEach(ojsTaulukko);
    // Muotoilu ala- ja yläindeksin sisällä (MPRL: X<sub><em><b>noun</b></em><b></b></sub>) jäisi Luinissa raa'aksi HTML:ksi.
    el.querySelectorAll('sub, sup').forEach(x => { if (x.children.length) x.textContent = x.textContent; });
    el.querySelectorAll('span.outdented').forEach(x => x.after(' '));
    el.querySelectorAll('a.publications-popup-text').forEach(x => x.replaceWith(...x.childNodes));
    kkLinkit(el, EOA_ISANTA);
    // Lohkokääreet pois: div.row ja kirjallisuuden div[keyword] kappaleiden ympärillä.
    el.querySelectorAll('div').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('p').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
    const h1 = d.querySelector('h1.publication-detail__title');
    let nimi = '';
    if (h1) { const k = h1.cloneNode(true); k.querySelectorAll('br').forEach(b => b.replaceWith(' ')); const nro = k.querySelector('span'); const n = nro ? rivi(nro.textContent) : ''; if (nro) nro.remove(); nimi = (n ? n + ' ' : '') + rivi(k.textContent); }
    return { el, nimi, tekijat: rivi((d.querySelector('#chapterauthors') || {}).textContent) };
  }
  const EOA_ISANTA = /^https?:\/\/([a-z0-9-]+\.)*(edition-open-sources\.org|edition-open-access\.de|mprl-series\.mpg\.de)(\/|$)/i;
  async function eoa() {
    if (!EOA_ISANTA.test(location.href)) return null;
    const valikko = document.querySelector('.chapter-menu__list');
    if (!valikko && !document.querySelector('.publication-detail .accordion__main')) return null;
    const z0 = document.querySelector('span.Z3988');
    const kirjaNimi = rivi(new URLSearchParams(z0 ? z0.getAttribute('title') : '').get('rft.btitle') || '');
    const kohdat = [];
    if (valikko) for (const li of valikko.children) {
      const a = li.querySelector('a[href]');
      if (li.classList.contains('chapter-menu__item')) kohdat.push({ u: a ? new URL(a.getAttribute('href'), osoite).href : osoite });
      // Ensimmäinen osan nimi on usein kirjan nimi (EOS 12: Pseudo-Proklos’ Sphaera …), joka on jo otsikkona.
      else if (rivi(li.textContent) && rivi(li.textContent) !== kirjaNimi) kohdat.push({ vali: rivi(li.textContent) });
    }
    const luvut = kohdat.filter(k => k.u);
    const yksi = !luvut.length || luvut.length > KK_RAJA;
    const jarjestys = yksi ? [{ u: osoite }] : kohdat;
    const haettavat = jarjestys.filter(k => k.u && k.u !== osoite);
    const haetut = await kkHae(haettavat.map(k => k.u));
    const doc = k => k.u === osoite ? document : haetut[haettavat.indexOf(k)];
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    let sivuja = 0, valiKesken = '';
    for (const k of jarjestys) {
      if (k.vali) { valiKesken = k.vali; continue; }
      const r = eoaLuku(doc(k), maar, laskuri);
      if (!r || kkSanoja(r.el) < 3) continue;
      if (valiKesken) { const h = document.createElement('h2'); h.textContent = valiKesken; el.appendChild(h); valiKesken = ''; }
      sivuja++;
      kkSiirra(r.el, 2);
      if (!yksi && r.nimi) { const h = document.createElement('h2'); h.textContent = r.nimi; el.appendChild(h); }
      if (!yksi && r.tekijat) { const p = document.createElement('p'); const em = document.createElement('em'); em.textContent = r.tekijat; p.appendChild(em); el.appendChild(p); }
      el.append(...r.el.childNodes);
    }
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const kirjaU = (/^(.*\/(?:sources|studies|proceedings|textbooks)\/\d+\/)/.exec(osoite) || [])[1];
    // Koko kirjalle kirjan etusivun tiedot (luvun COinS:ssä on luvun tekijä; kokoomateoksessa kirjan rft.au on toimittaja).
    const kd = !yksi && kirjaU ? await hae(kirjaU + 'index.html') : null;
    const z = (kd && kd.querySelector('span.Z3988')) || document.querySelector('span.Z3988');
    const q = new URLSearchParams(z ? z.getAttribute('title') : '');
    const kokooma = /proceedings/i.test(q.get('rft.series') || '') && !yksi;
    const ids = q.getAll('rft_id'), doi = ((ids.find(x => /^info:doi\//.test(x)) || '').replace(/^info:doi\//, ''));
    const ris = rivi((document.getElementById('citris_hidden') || {}).value || (document.getElementById('citris_hidden') || {}).textContent || '');
    const lis = (/\bC1\s+-\s+(by[a-z-]*)/i.exec(ris) || [])[1];
    const luku = yksi ? eoaLuku(document, [], { n: 0 }) : null;
    const kirja = rivi(q.get('rft.btitle') || '');
    const sarja = rivi(q.get('rft.series') || '') + (q.get('rft.number') ? ' ' + q.get('rft.number') : '');
    const sivusto = /mprl-series/.test(location.hostname) ? 'Max Planck Research Library for the History and Development of Knowledge'
      : /edition-open-sources/.test(location.hostname) ? 'Edition Open Sources' : 'Edition Open Access';
    return { html: irrota([el]).innerHTML, otsikko: yksi && luku && luku.nimi ? luku.nimi.replace(/^\d+\s+/, '') : kirja || rivi(document.title),
      tekija: kokooma ? '' : yksi && luku && luku.tekijat ? luku.tekijat : kkLuettelo(q.getAll('rft.au').map(rivi).filter(Boolean)),
      toimittaja: kokooma ? kkLuettelo(q.getAll('rft.au').map(rivi).filter(Boolean)) : '', teos: yksi ? kirja : '', sarja,
      julkaistu: (rivi(q.get('rft.date') || '').match(/^\d{4}/) || [''])[0], paikka: rivi(q.get('rft.place') || ''),
      kustantaja: rivi(q.get('rft.publisher') || ''), doi: yksi ? doi : '', sivusto, tyyppi: 'tieteellinen',
      lahde: !yksi && kirjaU ? kirjaU + 'index.html' : osoite,
      oikeus: lis ? { teksti: 'CC ' + lis.toUpperCase(), lahde: osoite } : null,
      maar, naytto: sivusto + (sivuja > 1 ? ' (' + sivuja + ' lukua)' : '') };
  }

  /* The Newton Project (newtonproject.ox.ac.uk; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3: Newton). Newtonin käsikirjoitukset
     ja kirjeet transkriptioina (/view/texts/normalized/ID ja /diplomatic/ID). Readability pudotti alun (Proœmium, THEM00054) ja
     kaikki viitteet. Teksti #tei: rivinvaihtoankkurit (a#lN) pois; folionumerot (span.pagenumber, -embed: <10r>) yläindekseiksi (lohkojen välistä seuraavan kappaleen alkuun),
     toimittajan huomautukset samassa merkinnässä (< insertion from between the lines >) kursiiviksi hakasulkeisiin; viitteet
     sup.note (#nN-ref, toimittajan #edN-ref) → #endnotes div#nN (numero sup.nnumber pois) alaviitteiksi, ja Newtonin oma merkki
     (<sup>✝</sup>) viitteen edeltä pois, kun viite alkaa samalla merkillä, ja ympäriltä (<sup>✝<sup class=note>) aina
     (viitteen alkuun, jos se ei jo ala merkillä). Toimittajan täydennykset ({…}) jäävät. Etukenttään tekijä (p.author), lähde
     (Source: käsikirjoitus ja arkisto) alaotsikoksi, julkaisu verkossa (Published online) ja laji (normalisoitu tai diplomaattinen
     transkriptio). Rahoitus: lahjoitukset (Support the Newton Project; ei mainoksia). Mitattu 20.11.2026. */
  function newton() {
    if (!/(^|\.)newtonproject\.ox\.ac\.uk$/i.test(location.hostname)) return null;
    const tei = document.getElementById('tei');
    if (!tei || !/^\/view\/(texts\/(normalized|diplomatic)|translation)\//.test(location.pathname)) return null;
    const el = tei.cloneNode(true), maar = [];
    el.querySelectorAll('script, style, img').forEach(x => x.remove());
    el.querySelectorAll('a[id]').forEach(a => { if (!rivi(a.textContent)) a.remove(); });
    el.querySelectorAll('span.pagenumber, span.pagenumber-embed').forEach(x => {
      const t = rivi(x.textContent).replace(/^<\s*|\s*>$/g, '');
      if (!t) { x.remove(); return; }
      if (/^[\w.-]+$/.test(t)) {
        const sup = document.createElement('sup'); sup.textContent = t;
        // Lohkojen välissä seuraavan kappaleen alkuun, ettei folio jää omaksi kappaleekseen.
        const seur = x.parentElement && x.parentElement.tagName === 'DIV' ? [...el.querySelectorAll('p')].find(p => x.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING) : null;
        if (seur) { x.remove(); seur.prepend(sup, ' '); } else x.replaceWith(sup, ' ');
        return;
      }
      const em = document.createElement('em'); em.textContent = '[' + t + ']';
      // Huomautus lohkojen välissä omaksi kappaleekseen, tekstin keskellä sellaisenaan.
      if (x.parentElement && x.parentElement.tagName === 'DIV') { const p = document.createElement('p'); p.appendChild(em); x.replaceWith(p); }
      else x.replaceWith(em);
    });
    let n = 0;
    el.querySelectorAll('sup.note').forEach(sup => {
      // Toimittajan viite: sup#ed1-ref → div#ed1.
      const id = (/^((?:n|ed)\d+)-ref$/.exec(sup.id || '') || [])[1];
      const kohde = id && document.getElementById(id);
      if (!kohde) return;
      const k = kohde.cloneNode(true);
      k.querySelectorAll('sup.nnumber').forEach(x => x.remove());
      const teksti = muunna(k.innerHTML, 'inlined').trim();
      if (!teksti) return;
      // Newtonin merkki joko viitteen edellä (<sup>✝</sup><sup class="note">) tai sen ympärillä (<sup>✝<sup class="note"></sup>).
      const ulko = sup.parentElement;
      if (ulko && ulko.tagName === 'SUP' && ulko.childNodes.length === 2 && ulko.firstChild.nodeType === 3) {
        const m = rivi(ulko.firstChild.textContent), tunnus = 'np' + (++n);
        ulko.replaceWith(merkki(tunnus));
        // Merkki viitteen alkuun, jos viite ei jo ala sillä (THEM00054: n35).
        maar.push(maaritelma(tunnus, !m || teksti.startsWith(m) ? teksti : m + ' ' + teksti));
        return;
      }
      const ed = sup.previousSibling;
      if (ed && ed.nodeName === 'SUP' && rivi(ed.textContent) && teksti.startsWith(rivi(ed.textContent))) ed.remove();
      const tunnus = 'np' + (++n);
      sup.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, teksti));
    });
    el.querySelectorAll('span').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('div').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('a').forEach(x => x.replaceWith(...x.childNodes));
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const kentta = nimi => {
      const p = [...document.querySelectorAll('#header p')].find(x => rivi((x.querySelector('.metadataTitle, strong') || {}).textContent) === nimi);
      if (!p) return '';
      const k = p.cloneNode(true); k.querySelectorAll('.metadataTitle, strong').forEach(x => x.remove()); return rivi(k.textContent);
    };
    const h1 = rivi((document.querySelector('#header h1') || {}).textContent);
    const tapa = /\/diplomatic\//.test(location.pathname) ? 'diplomaattinen transkriptio' : /\/normalized\//.test(location.pathname) ? 'normalisoitu transkriptio' : 'käännös';
    return { html: irrota([el]).innerHTML, otsikko: h1 || rivi(document.title).replace(/\s*\((Normalized|Diplomatic)\)\s*$/, ''),
      tekija: kentta('Author:'), alaotsikko: kentta('Source:'), julkaistu: kentta('Published online:'), laji: tapa,
      sivusto: 'The Newton Project', lahde: osoite, maar, naytto: 'The Newton Project' };
  }

  /* The Latin Library (thelatinlibrary.com; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3: Erasmus ja renessanssihumanistit,
     myös klassinen latina). Teksti on kappaleina sivun otsakkeen (p.pagehead) jälkeen; yleinen leikkaus sai tekstin, mutta otsikko
     tuli <title>:stä lähteen kirjoitusvirheineen (Eramus: The Praise of Folly), tekijä puuttui, lukujen pikalinkit (p.margin)
     jäivät linkkiriviksi ja pykälänumerot ([<a name=161></a>161], Cicero; [XIII], Querela pacis) hakasulkeiksi. Sovite: tekijä alalaidan murupolun
     ensimmäisestä linkistä (Erasmus, Cicero; ei sivuston nimeä), otsikko <title>:n kaksoispisteen jälkeisestä osasta, pykälänumerot
     yläindekseiksi ja etukenttään kohdat: yläindeksit (aikajanan kohdiksi kuten Perseuksessa), pelkästä lihavoinnista koostuva
     kappale (Colloquia: In Primo Congressu) otsikoksi, viivat (p.border ym.) ja murupolku pois. Ei mainoksia eikä lahjoituspyyntöä.
     Mitattu 20.11.2026. */
  function latinLibrary() {
    if (!/(^|\.)thelatinlibrary\.com$/i.test(location.hostname)) return null;
    const otsake = document.querySelector('p.pagehead');
    if (!otsake) return null;
    const el = document.createElement('div');
    let n = otsake.nextElementSibling, kohtia = 0;
    for (; n; n = n.nextElementSibling) {
      if (n.matches('.footer, script, style') || n.querySelector('table') || /^(border|shortborder|smallborder|margin|pagehead)$/i.test(n.className)) continue;
      const k = n.cloneNode(true);
      k.querySelectorAll('a[name]').forEach(a => { if (!rivi(a.textContent)) a.remove(); else a.replaceWith(...a.childNodes); });
      k.normalize();
      // Pykälänumero [161] tai luku [XIII] (Querela pacis) kappaleen alussa tai keskellä: yläindeksiksi.
      const tekstit = document.createTreeWalker(k, NodeFilter.SHOW_TEXT);
      const solmut = [];
      while (tekstit.nextNode()) solmut.push(tekstit.currentNode);
      solmut.forEach(t => {
        // Lähteen virhe De officiisissa: [40 [Secundo … (sulkeva hakasulje puuttuu).
        t.nodeValue = t.nodeValue.replace(/\[(\d+[a-z]?)\s+(?=\[)/g, '[$1] ');
        if (!/\[(?:\d+[a-z]?|[IVXLC]+)\]/.test(t.nodeValue)) return;
        const osat = t.nodeValue.split(/\[(\d+[a-z]?|[IVXLC]+)\]\s*/);
        if (osat.length < 3) return;
        const pala = document.createDocumentFragment();
        osat.forEach((x, i) => { if (i % 2) { const sup = document.createElement('sup'); sup.textContent = x; pala.append(sup, ' '); kohtia++; } else if (x) pala.append(x); });
        t.replaceWith(pala);
      });
      const vahva = k.children.length === 1 && /^(B|STRONG)$/.test(k.children[0].tagName) && rivi(k.textContent) === rivi(k.children[0].textContent);
      if (vahva && rivi(k.textContent).length < 120) { const h = document.createElement('h2'); h.textContent = rivi(k.textContent); el.appendChild(h); continue; }
      k.querySelectorAll('a').forEach(a => a.replaceWith(...a.childNodes));
      if (rivi(k.textContent)) el.appendChild(k);
    }
    if (kkSanoja(el) < 20) return null;
    el.normalize();
    const murupolku = document.querySelector('.footer a[href], table a[href]');
    const tekija = murupolku && !/latin library|classics/i.test(murupolku.textContent) ? rivi(murupolku.textContent) : '';
    const t = rivi(document.title), kp = t.indexOf(':');
    return { html: irrota([el]).innerHTML, otsikko: kp > 0 ? rivi(t.slice(kp + 1)) : t || rivi(otsake.textContent),
      tekija, kohdat: kohtia > 2 ? 'yläindeksit' : '', sivusto: 'The Latin Library', lahde: osoite, maar: [], naytto: 'The Latin Library' };
  }

  /* Nova Vulgata (vatican.va/archive/bible/nova_vulgata; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 11): Raamatun
     moderni kriittinen latinannos (1979, 2. p. 1986), kirja yhdellä sivulla. Vanhaa HTML:ää: luku on <p>, jonka alussa
     ankkuri (a[name=1], Psalmeissa a[name="PSALMUS 1"], kirjojen jako a[name="LIBER I (Psalmi 1-41)"] keskitetyssä kappaleessa),
     ja rivit <br>:llä. Rivi, joka alkaa jaenumerolla ilman välilyöntiä (<br />2 quod), jatkaa kappaletta; välilyönnillä alkava
     (<br /> 8 Primum, Room. 1:8) aloittaa uuden: rajat osuvat painetun laitoksen kappaleisiin (Room. 1:1–7, 8–15, 16–17, 18–32;
     1. Moos. 1 päivittäin). Numeroton rivi on runon säe: rivinvaihto kappaleen sisällä (Psalmeissa jae on kappale ja säkeet
     rivejä). Jaenumerot yläindekseiksi ja etukenttään kohdat: yläindeksit kuten Perseuksessa (luku ja jae aikajanalle);
     pois jätetty jae (24) jää tekstiin. Luvun otsikko Caput N, Psalmeissa ankkurin teksti (PSALMUS 1) ja Liber-jako ylempänä.
     Lukujen pikalinkit ja sivun kehys pois. Otsikko <title>:stä versaalit pieniksi (Apostoli ad Romanos Epistula Sancti Pauli),
     testamentti numeroksi. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 20.11.2026. */
  const NV_PIENET = new Set(['ad', 'et', 'in', 'de', 'secundum', 'cum', 'ex']);
  const nvNimi = s => rivi(s).toLowerCase().split(' ').map((w, i) => !i || !NV_PIENET.has(w) ? w.replace(/^(i{1,3}|iv|v)(?=-|$)/, x => x.toUpperCase()).replace(/^\p{L}/u, c => c.toUpperCase()) : w).join(' ');
  function novaVulgata() {
    if (!/(^|\.)vatican\.va$/i.test(location.hostname) || !/\/nova_vulgata\/documents\/nova-vulgata_(vt|nt)_/.test(location.pathname)) return null;
    const el = document.createElement('div');
    const KAPPALE = /^(?:\s|&nbsp;)*/;
    let jaettu = false, jakeita = 0;
    for (const p of document.querySelectorAll('p')) {
      const a = p.querySelector('a[name]');
      const nimi = a && a.getAttribute('name');
      if (!nimi || nimi === 'top' || !rivi(a.textContent)) continue;
      // Psalmien kirjajako (LIBER I) on keskitetyssä kappaleessa pikalinkkien kanssa.
      if (/^LIBER\b/i.test(nimi)) { const h = document.createElement('h2'); h.textContent = nvNimi(a.textContent); el.appendChild(h); jaettu = true; continue; }
      // Ankkurin pitää olla kappaleen alussa (pikalinkit ovat href-linkkejä, eivät nimiä).
      const alku = [...p.childNodes].find(n => n.nodeType === 1 || rivi(n.textContent));
      if (!alku || !(alku === a || (alku.nodeType === 1 && alku.contains(a)))) continue;
      const k = p.cloneNode(true);
      const ka = [...k.childNodes].find(n => n.nodeType === 1 || rivi(n.textContent));
      ka.remove();
      const h = document.createElement(jaettu ? 'h3' : 'h2');
      h.textContent = /^\d+$/.test(rivi(a.textContent)) ? 'Caput ' + rivi(a.textContent) : nvNimi(a.textContent);
      el.appendChild(h);
      const kappaleet = [];
      let nyt = null;
      for (const raaka of k.innerHTML.split(/<br\s*\/?>/i)) {
        const tila = KAPPALE.exec(raaka)[0], s = raaka.slice(tila.length).replace(/(?:\s|&nbsp;)+$/, '');
        if (!s) continue;
        const m = /^(\(\d+\)\s*)?(\d+)\s+([\s\S]*)$/.exec(s);
        if (m) {
          jakeita++;
          const jae = (m[1] ? m[1] : '') + '<sup>' + m[2] + '</sup> ' + m[3];
          if (!nyt || tila) { nyt = [jae]; kappaleet.push(nyt); } else nyt.push(' ' + jae);
        } else if (nyt) nyt.push('<br>' + s);
        else { nyt = [s]; kappaleet.push(nyt); }
      }
      kappaleet.forEach(x => { const q = document.createElement('p'); q.innerHTML = x.join(''); el.appendChild(q); });
    }
    if (jakeita < 3) return null;
    el.querySelectorAll('font, b, span').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('a').forEach(x => x.replaceWith(...x.childNodes));
    el.normalize();
    const t = rivi(document.title).split(/\s+-\s+/);
    return { html: irrota([el]).innerHTML, otsikko: nvNimi(t[0]), teos: 'Nova Vulgata', numero: /novum/i.test(t[t.length - 1]) ? 'Novum Testamentum' : 'Vetus Testamentum',
      sivusto: 'Nova Vulgata', kustantaja: 'Libreria Editrice Vaticana', julkaistu: '1986', kohdat: 'yläindeksit', lahde: osoite, maar: [],
      naytto: 'Nova Vulgata' };
  }

  /* Emergence Magazine (emergencemagazine.org; käyttäjän pyyntö 16.11.2026, pahvin B7: mittaa ensin kuten Noema). Mitattu:
     nostolainaukset (.m-pull-quote) toistuivat tekstissä (2/3), kuvatekstien ja kuvaajien rivit (AI Chair 1.0, Kay Roxby /
     Alamy) ja tekijätietojen otsakkeet (Writer, Translator) tulivat erillisinä kappaleina. Teksti on .essay-content-lohkoina:
     section.m-default-text (osan alku span.new-section-drop versaalein), kuvat (figure, .m-variable-images), nostolainaukset;
     alussa kerronnan soitin (Listen to this Story), tekijätiedot (.c-story-contributor: rooli ja esittely), päiväys ja ingressi.
     Leikkeeseen vain tekstilohkot; osan alku osanvaihdoksi (hr), esittelyt loppuun omaksi osiokseen roolin mukaan otsikoituina.
     Otsikko og:titlesta ilman tekijää, tekijä JSON-LD:stä (by James Bridle), kääntäjä Translator-esittelyn alusta (X is …),
     päivä time[itemprop=datePublished]. Ingressiä ei oteta (kuten Psyche–Aeonissa). Ei mainoksia eikä lahjoituspyyntöä
     etusivulla tai artikkeleissa. Mitattu 16.11.2026. */
  async function emergence() {
    if (!/(^|\.)emergencemagazine\.org$/i.test(location.hostname)) return null;
    const runko = document.querySelector('.essay-content');
    if (!runko) return null;
    const el = document.createElement('div');
    runko.querySelectorAll('section.m-default-text').forEach(sec => {
      if (sec.closest('.c-story-contributors')) return;
      const k = sec.cloneNode(true);
      k.querySelectorAll('figure, img, script, style, button, svg').forEach(x => x.remove());
      // Osan alku (versaalein kirjoitettu alku, span.new-section-drop) osanvaihdoksi, paitsi ensimmäinen.
      k.querySelectorAll('span.new-section-drop').forEach(s => {
        const p = s.closest('p');
        if (el.childNodes.length && p && k.contains(p)) p.before(document.createElement('hr'));
        s.replaceWith(...s.childNodes);
      });
      el.append(...k.childNodes);
    });
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' '))) p.remove(); });
    // Kappaleen sisäiset tyhjät rivit (<br /> &nbsp;<br />) kappalejaoksi.
    el.querySelectorAll('p').forEach(p => {
      if (!/<br\s*\/?>\s*(&nbsp;| )?\s*<br\s*\/?>/i.test(p.innerHTML)) return;
      const osat = p.innerHTML.split(/<br\s*\/?>\s*(?:&nbsp;| )?\s*<br\s*\/?>/i).filter(x => rivi(jasenna(x).body.textContent));
      p.replaceWith(...osat.map(x => { const q = document.createElement('p'); q.innerHTML = x; return q; }));
    });
    if (kkSanoja(el) < 50) return null;
    let tekija = '', kaantaja = '';
    const esittelyt = [...runko.querySelectorAll('.c-story-contributor')].map(c => ({ rooli: rivi((c.querySelector('.c-story-contributor__role') || {}).textContent),
      ps: [...c.querySelectorAll('.c-story-contributor__bio p')].filter(p => rivi(p.textContent)) }));
    if (esittelyt.length) {
      const h = document.createElement('h2'); h.textContent = 'Contributors';
      el.append(h);
      esittelyt.forEach(e => {
        const t = document.createElement('p'), s = document.createElement('strong');
        if (e.rooli) { s.textContent = e.rooli + '.'; t.append(s, ' '); }
        e.ps.forEach((p, i) => { if (i) { el.append(t.cloneNode(true)); t.textContent = ''; } t.append(...p.cloneNode(true).childNodes); });
        el.append(t);
        if (/^translator/i.test(e.rooli) && e.ps[0]) kaantaja = rivi((/^(.{3,60}?)\s+(?:is|was)\s/.exec(rivi(e.ps[0].textContent)) || [])[1] || '');
      });
    }
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try { const j = JSON.parse(s.textContent); const a = (j['@graph'] || [j]).map(x => x.author).find(Boolean); if (a && !tekija) tekija = rivi((Array.isArray(a) ? a : [a]).map(x => x.name).join(' & ')).replace(/^by\s+/i, ''); } catch (e) {}
    });
    const og = rivi((document.querySelector('meta[property="og:title"]') || {}).content);
    const otsikko = tekija && og.endsWith(tekija) ? og.slice(0, -tekija.length).replace(/\s*[–—-]\s*$/, '') : og || rivi(document.title);
    const aika = document.querySelector('time[itemprop="datePublished"][datetime]');
    return { html: irrota([el]).innerHTML, otsikko, tekija, suomentaja: kaantaja ? kkKaantaja([kaantaja]) : '', sivusto: 'Emergence Magazine',
      julkaistu: aika ? aika.getAttribute('datetime').slice(0, 10) : '', lahde: osoite };
  }

  /* Noema (noemamag.com, Berggruen Institute; käyttäjän pyyntö 16.11.2026, pahvin B6: sovite vain, jos yleinen leikkaus on
     selvästi huono). Mitattu: kolmessa artikkelissa 16 nostolainauksesta 12 toistui leipätekstinä (figure.quote), välissä
     Read Noema in print -kehote, kuvatekstit ja lopussa liittyvät artikkelit. WordPress: teksti .entry-content, tekijän esittely
     .bio-block (Credits) tekstin alussa, osanvaihdot hr.wp-block-separator. Nostolainaukset, kehotteet (.eos-subscribe-push),
     jakonapit (.a2a_kit), kuvat kuvateksteineen (.content-image, figure) ja kortit (.single-card) pois; esittely loppuun
     omaksi osiokseen. Etukenttä citation_title, citation_author ja datePublished. Ei mainoksia; lahjoituspyyntöä ei ole
     (painettu lehti myydään). Mitattu 16.11.2026. */
  async function noema() {
    if (!/(^|\.)noemamag\.com$/i.test(location.hostname)) return null;
    const runko = document.querySelector('article .entry-content');
    if (!runko) return null;
    const el = runko.cloneNode(true);
    const bio = el.querySelector('.bio-block .content');
    const esittely = bio ? [...bio.querySelectorAll('p')].filter(p => rivi(p.textContent)).map(p => { const k = p.cloneNode(true); k.removeAttribute('style'); return k; }) : [];
    el.querySelectorAll('.bio-block, figure, .content-image, .eos-subscribe-push, .a2a_kit, .single-card, script, style, noscript, img, iframe, button, svg').forEach(x => x.remove());
    // Korttien kääreet ja tyhjät lohkot.
    el.querySelectorAll('section, div, p').forEach(x => { if (el.contains(x) && !rivi(x.textContent) && !x.querySelector('hr, br')) x.remove(); });
    while (el.lastElementChild && el.lastElementChild.tagName === 'HR') el.lastElementChild.remove();
    if (kkSanoja(el) < 50) return null;
    // Kuvien lähdemerkintä esittelyssä (Photographs courtesy of …) jää pois.
    const es = esittely.filter(p => !/^(photographs?|images?|illustrations?|artwork)\b.*\b(courtesy|by)\b/i.test(rivi(p.textContent)));
    if (es.length) { const h = document.createElement('h2'); h.textContent = 'Credits'; el.append(h, ...es); }
    const meta = n => rivi((document.querySelector('meta[name="' + n + '"]') || {}).content);
    let julkaistu = '';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => { const m = /"datePublished"\s*:\s*"(\d{4}-\d\d-\d\d)/.exec(s.textContent); if (m && !julkaistu) julkaistu = m[1]; });
    return { html: irrota([el]).innerHTML, otsikko: meta('citation_title') || rivi((document.querySelector('h1') || {}).textContent),
      tekija: document.querySelectorAll('meta[name="citation_author"]').length ? [...document.querySelectorAll('meta[name="citation_author"]')].map(m => rivi(m.content)).join(' & ') : '',
      sivusto: 'Noema', julkaistu, lahde: osoite };
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

  /* Andy Matuschakin esseet (andymatuschak.org ja Matuschakin ja Nielsenin numinous.productions/ttft; käyttäjän pyyntö
     16.11.2026, pahvin B8: reunahuomautukset alaviitteiksi; notes.andymatuschak.org ei kuulu tähän). Reunahuomautukset ovat
     tekstin sisäisiä span.sidenote- (andymatuschak.org) ja span.marginnote-elementtejä (ttft), joten Readability sulautti ne
     leipätekstiin: alaviitteiksi. andymatuschak.org: article, header (kuva ja kuvateksti, h1, p.author, p.status: päiväys),
     nav#toc (sisällys, tukijat ja Patreon) ja esimerkkiresepti kahdesti (.recipe.sidebar on leveän ruudun kopio). ttft:
     #EssayContents, otsake .HeroContainer (h1 ja .Subtitle: .Authors, .Date), kuvat (.PullRight, .HandheldsOnly), lopussa
     .Footer (kiitokset) jää. Otsake, sisällys ja kopiot pois. Matuschak pyytää tukea Patreonissa; mainoksia ei ole.
     Mitattu 16.11.2026. */
  const AM_KUUKAUDET = EN_KUUKAUDET;
  async function matuschak() {
    const am = /^(www\.)?andymatuschak\.org$/i.test(location.hostname), ttft = /^(www\.)?numinous\.productions$/i.test(location.hostname);
    if (!am && !ttft) return null;
    const runko = am ? document.querySelector('article') : document.querySelector('#EssayContents');
    if (!runko || !runko.querySelector('.sidenote, .marginnote, p')) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('header, nav, #toc, .recipe.sidebar, .HeroContainer, .DesktopOnly, .HandheldsOnly, img, figure, video, script, style, noscript, svg').forEach(x => x.remove());
    const maar = [];
    let n = 0;
    el.querySelectorAll('span.sidenote, span.marginnote, aside.sidenote').forEach(s => {
      const t = muunna(irrota([s.cloneNode(true)]).innerHTML, 'inlined').trim();
      const ed = s.previousSibling;
      if (ed && ed.nodeType === 3) ed.nodeValue = ed.nodeValue.replace(/\s+$/, '');
      if (!t) { s.remove(); return; }
      const tunnus = 'am' + (++n);
      maar.push(maaritelma(tunnus, t));
      s.replaceWith(merkki(tunnus));
    });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent) && !x.querySelector('br, hr, table')) x.remove(); });
    if (kkSanoja(el) < 100) return null;
    const t = sel => rivi((document.querySelector(sel) || {}).textContent);
    const tekija = am ? t('header .author') : [...document.querySelectorAll('.Authors a')].map(a => rivi(a.textContent)).join(' & ') || t('.Authors').replace(/\s+and\s+/g, ' & ');
    const pv = am ? t('header .status') : t('.Date');
    const m = /(\p{L}+)\s+(\d{4})/u.exec(pv), k = m ? AM_KUUKAUDET.indexOf(m[1].toLowerCase()) : -1;
    return { html: irrota([el]).innerHTML, otsikko: t(am ? 'header h1' : '.HeroContainer h1') || t('h1'),
      tekija, sivusto: am ? 'andymatuschak.org' : 'Numinous Productions', julkaistu: k >= 0 ? m[2] + '-' + String(k + 1).padStart(2, '0') : (/\d{4}/.exec(pv) || [''])[0],
      lahde: osoite, maar };
  }

  /* Five Books (fivebooks.com; käyttäjän pyyntö 16.11.2026, pahvin B10: suositellut kirjat väliotsikoiksi, kansikuvat ja mainokset
     pois). Haastattelu #interviewcontent: kysymykset p.question, vastaukset kappaleina, kirjan käsittelyn alussa aside[data-book-id]
     (kaksi kopiota: leveä ja kapea ruutu), nostolainaukset p.pullquote, tukipyyntö .inline-box.-donate, kirjahylly
     li.single-book[data-book-id] (h2.book-title: nimi ja by Tekijä) sivun alussa. Readability antoi haastattelun ilman yhtään
     väliotsikkoa, nostolainaukset ja tukipyynnön tekstin seassa ja tekijäksi Five Books. Kirjan ensimmäinen aside väliotsikoksi
     ## 1. Nimi, by Tekijä (kirjahyllyn tiedoista), muut asidet, kansikuvat, osto- ja kuuntelunapit, nostolainaukset ja tukipyyntö
     pois; kysymykset lihavoiduiksi kappaleiksi (puhujia ei nimetä). Tekijäksi haastateltava (.interviewee-bio .heading), esittely
     loppuun; haastattelijan rivi (Interview by …) jää. Päivä JSON-LD:stä. Ei mainoksia (vain Google Tag Manager), lahjoituksia
     pyydetään. Mitattu 16.11.2026. */
  async function fivebooks() {
    if (!/(^|\.)fivebooks\.com$/i.test(location.hostname)) return null;
    const runko = document.getElementById('interviewcontent');
    if (!runko || !runko.querySelector('p.question')) return null;
    const kirjat = new Map();
    document.querySelectorAll('li.single-book[data-book-id]').forEach(li => {
      const h = li.querySelector('.book-title'), nro = rivi((li.querySelector('.book-number') || {}).textContent);
      if (!h || kirjat.has(li.dataset.bookId)) return;
      const k = h.cloneNode(true); k.querySelectorAll('br').forEach(b => b.replaceWith(' '));
      const nimi = rivi((h.querySelector('.title') || h).textContent), tek = rivi(k.textContent).slice(nimi.length).trim();
      kirjat.set(li.dataset.bookId, { nro, nimi, tek });
    });
    const el = document.createElement('div'), nahty = new Set();
    for (const c of runko.children) {
      if (c.matches('aside[data-book-id]')) {
        const id = c.dataset.bookId, k = kirjat.get(id);
        if (nahty.has(id) || !k) continue;
        nahty.add(id);
        const h = document.createElement('h2');
        h.append((k.nro ? k.nro + '. ' : ''), Object.assign(document.createElement('em'), { textContent: k.nimi }), k.tek ? ', ' + k.tek : '');
        el.appendChild(h);
        continue;
      }
      if (c.matches('aside, .social-buttons, .pullquote, .inline-box, .interview-book-ad, script, style, form, figure, picture')) continue;
      const k = c.cloneNode(true);
      k.querySelectorAll('aside, .pullquote, .inline-box, picture, img, .buy-button, .listen-button, script, style').forEach(x => x.remove());
      k.querySelectorAll('span.drop-cap').forEach(s => s.replaceWith(...s.childNodes));
      if (!rivi(k.textContent)) continue;
      if (k.matches('p.question')) { const b = document.createElement('strong'); b.append(...k.childNodes); k.appendChild(b); k.removeAttribute('class'); }
      el.appendChild(k);
    }
    // Upotetut kirjan tiedot kappaleen sisällä (aside kesken tekstin) jo poistettu; tyhjät pois.
    if (kkSanoja(el) < 100) return null;
    const bio = document.querySelector('.interviewee-bio');
    const tekija = rivi((bio && bio.querySelector('.heading') || {}).textContent);
    const esit = bio ? [...bio.querySelectorAll('.biography p')].filter(p => rivi(p.textContent)) : [];
    if (esit.length) { const h = document.createElement('h2'); h.textContent = tekija || 'Biography'; el.append(h, ...esit.map(p => p.cloneNode(true))); }
    let julkaistu = '';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => { const m = /"datePublished"\s*:\s*"(\d{4}-\d\d-\d\d)/.exec(s.textContent); if (m && !julkaistu) julkaistu = m[1]; });
    return { html: irrota([el]).innerHTML, otsikko: rivi((document.querySelector('h1') || {}).textContent), tekija, sivusto: 'Five Books', julkaistu, lahde: osoite };
  }

  /* Pressbooks (alustasovite; käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 1). Avoimet oppikirjat ja kirjat
     WordPress-alustalla, oma verkko kullakin kustantajalla (pressbooks.pub, korkeakoulujen palvelimet). Tunnistus alustasta:
     meta application-name Pressbooks ja WordPressin rajapintalinkki, josta saadaan kirjan juuri. Koko kirja kootaan kirjan
     sisällysluettelosta (wp-json/pressbooks/v2/toc: alkusivut, osat lukuineen, loppusivut) ja metatiedot kirjan
     tietueesta (…/metadata: tekijät, toimittajat, kääntäjät, kustantaja, paikka, päivä, lisenssi). Luku on sivun
     section[data-type]: otsake (h1.entry-title, numero span:ssa, alaotsikko h2.chapter-subtitle, luvun tekijä
     p[data-type=author]), alaviitteet Pressbooksin omat (a.footnote → div.footnotes li, varalla title-attribuutti) tai
     Wordista liitetyt (#_ftn1 ↔ kappale, jossa paluulinkki #_ftnref1; samoin _edn). Osat (Book 2: Moral Virtue.) ovat
     lukuja ja niiden luvut osioita, kun osia on yksi nimetty tai useampi; Pressbooksin oletusosa Main Body ei näy.
     Pois: saavutettavuusseloste, Pressbooksin oletuspaikkatekstit (tyhjä Appendix), kuvien tekijätiedot, H5P- ja
     muut upotukset, sanaston ponnahdukset (termi jää tekstiksi), lukunavigaatio ja jakonapit. Ei mainoksia eikä
     lahjoituspyyntöä (palvelut ovat kustantajien ja kirjastojen). pressbooks.pub ja useimmat yliopistojen verkot estävät
     pilvikontin (CloudFrontin 403); mitattu palvelimilla pressbooks.library.torontomu.ca ja pressbooks.palni.org 17.11.2026. */
  const PB_NIMI = 'Pressbooks';
  const PB_POIS = /^(accessibility( statement)?|this is where you can add appendices or other back matter\.?)$/i;
  function pbJson(u) {
    const ohi = new AbortController(), ajastin = setTimeout(() => ohi.abort(), 8000);
    return fetch(u, { credentials: 'same-origin', signal: ohi.signal }).then(r => r.ok ? r.json() : null).catch(() => null)
      .finally(() => clearTimeout(ajastin));
  }
  const pbNimet = a => (Array.isArray(a) ? a : []).map(x => rivi(x && x.name)).filter(Boolean);
  function pbSivu(d, n, syvyys, maar, laskuri, kirjanTekijat) {
    const s = d && (d.querySelector('#content section[data-type]') || d.querySelector('section[data-type]'));
    if (!s) return null;
    const el = s.cloneNode(true);
    const h1 = el.querySelector('header h1, h1.entry-title');
    let nimi = '';
    if (h1) {
      const nro = h1.querySelector('span');
      const nr = nro ? rivi(nro.textContent) : '';
      if (nro) nro.remove();
      nimi = rivi(h1.textContent);
      if (nr && /^[\dIVXLCDM]+$/i.test(nr)) nimi = nr + '. ' + nimi;
    }
    nimi = nimi || n.nimi;
    const ala = rivi((el.querySelector('header .chapter-subtitle, header h2') || {}).textContent);
    const tek = rivi((el.querySelector('header [data-type="author"]') || {}).textContent);
    el.querySelectorAll('header, script, style, template, noscript, iframe, nav, .nav-reading, hr.before-footnotes, ' +
      '.media-atttributions-prefix, .media-attributions, .h5p-iframe-wrapper, .h5p-content, .interactive-content, .glossary__definition, ' +
      '[class*="glossary-definition"], .wp-video, .wp-audio-shortcode, .mejs-container').forEach(x => x.remove());
    el.querySelectorAll('a.glossary-term, button.glossary-term, .glossary-term').forEach(x => x.replaceWith(...x.childNodes));
    // Pressbooksin alaviitteet.
    const viit = new Map();
    el.querySelectorAll('.footnotes li[id]').forEach(li => viit.set(li.id, li));
    el.querySelectorAll('a.footnote').forEach(a => {
      const li = viit.get((a.getAttribute('href') || '').replace(/^#/, ''));
      let t = '';
      if (li) { const k = li.cloneNode(true); k.querySelectorAll('a.return-footnote').forEach(x => x.remove()); t = muunna(k.innerHTML, 'inlined').trim(); }
      if (!t) t = rivi(a.getAttribute('title'));
      if (!t) { a.remove(); return; }
      const tunnus = 'pb' + (++laskuri.n);
      a.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('.footnotes').forEach(x => x.remove());
    // Wordista liitetyt alaviitteet: merkki #_ftn1 ja kappale, jonka alussa paluulinkki #_ftnref1 (myös loppuviitteet _edn).
    const word = new Map();
    el.querySelectorAll('a[href^="#_ftnref"], a[href^="#_ednref"]').forEach(a => {
      const p = a.closest('p, li, div');
      if (p && p !== el) word.set(a.getAttribute('href').replace(/ref(?=\d)/, ''), { p, a });
    });
    const poistetut = [];
    el.querySelectorAll('a[href^="#_ftn"], a[href^="#_edn"]').forEach(a => {
      const w = word.get(a.getAttribute('href'));
      if (!w || w.p.contains(a)) return;
      const k = w.p.cloneNode(true);
      const paluu = k.querySelector('a[href="' + w.a.getAttribute('href') + '"]');
      if (paluu) paluu.remove();
      const t = muunna(k.innerHTML, 'inlined').trim().replace(/^\\?[.):\]]\s*/, '');
      let kohta = a;
      while (/^(SUP|SPAN)$/.test(kohta.parentElement.tagName) && rivi(kohta.parentElement.textContent) === rivi(a.textContent)) kohta = kohta.parentElement;
      if (!t) { kohta.remove(); return; }
      const tunnus = 'pb' + (++laskuri.n);
      kohta.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
      poistetut.push(w.p);
    });
    poistetut.forEach(p => { const yla = p.parentElement; p.remove(); if (yla && yla !== el && !rivi(yla.textContent)) yla.remove(); });
    // Tyhjäksi jäänyt viiteosion otsikko (Footnotes for Section 2).
    el.querySelectorAll(OTSIKOT).forEach(h => {
      if (!/^(foot|end)?notes\b|^viitteet$/i.test(rivi(h.textContent))) return;
      let x = h.nextElementSibling;
      while (x && !/^H[1-6]$/.test(x.tagName) && !rivi(x.textContent)) x = x.nextElementSibling;
      if (!x || /^H[1-6]$/.test(x.tagName)) h.remove();
    });
    kkLinkit(el, new RegExp('^' + location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/|$)', 'i'));
    el.querySelectorAll('p, div').forEach(p => { if (el.contains(p) && !p.querySelector('img, table, hr') && !rivi(p.textContent)) p.remove(); });
    if (PB_POIS.test(nimi) || PB_POIS.test(rivi(el.textContent))) return { el: document.createElement('div'), nimi, tyhja: true };
    // Luvun nimi toistettuna ensimmäisenä otsikkona (Psychopathology: Chapter 1: History … kahdesti).
    const tiivis = x => rivi(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const ens = [...el.children].find(x => rivi(x.textContent));
    if (ens && /^H[1-6]$/.test(ens.tagName) && tiivis(ens.textContent) && tiivis(nimi).endsWith(tiivis(ens.textContent))) ens.remove();
    // Rikkinäinen osoite (http://”10080026″ by … is licensed under CC BY 2.0.) tekstiksi.
    el.querySelectorAll('a[href]').forEach(a => { if (/[\s"”″<>]/.test(a.getAttribute('href').trim())) a.replaceWith(...a.childNodes); });
    kkSiirra(el, syvyys + 1);
    const alku = [];
    if (syvyys) { const h = document.createElement('h' + Math.min(6, 1 + syvyys)); h.textContent = nimi; alku.push(h); }
    if (ala) { const p = document.createElement('p'); p.innerHTML = '<em></em>'; p.firstChild.textContent = ala; alku.push(p); }
    if (tek && !kirjanTekijat.some(x => rivi(x) === tek)) { const p = document.createElement('p'); p.textContent = tek; alku.push(p); }
    el.prepend(...alku);
    return { el, nimi };
  }
  async function pressbooks() {
    if (!/^pressbooks$/i.test(rivi((document.querySelector('meta[name="application-name"]') || {}).content))) return null;
    const api = document.querySelector('link[rel="https://api.w.org/"][href]');
    if (!api) return null;
    const juuri = api.href.replace(/wp-json\/?$/, '');
    const [toc, tiedot] = await Promise.all([pbJson(juuri + 'wp-json/pressbooks/v2/toc'), pbJson(juuri + 'wp-json/pressbooks/v2/metadata')]);
    const md = tiedot || {};
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const tekijat = pbNimet(md.author).length ? pbNimet(md.author) : meta('citation_author');
    const kohdat = [];
    const lisaa = (x, syvyys) => { if (x && x.link && (x.status || 'publish') === 'publish') kohdat.push({ href: x.link, nimi: rivi(x.title), syvyys, sisalto: x.has_post_content !== false && x.word_count !== 0 }); };
    if (toc) {
      (toc['front-matter'] || []).forEach(x => lisaa(x, 1));
      const osat = toc.parts || [];
      const nimetyt = osat.length > 1 || osat.some(o => !/^main body$/i.test(rivi(o.title)));
      osat.forEach(o => {
        if (nimetyt) kohdat.push({ href: o.link, nimi: rivi(o.title), syvyys: 1, osa: true, sisalto: o.has_post_content === true || o.word_count > 0 });
        (o.chapters || []).forEach(x => lisaa(x, nimetyt ? 2 : 1));
      });
      (toc['back-matter'] || []).forEach(x => lisaa(x, 1));
    }
    const tama = osoite.replace(/\/?$/, '/');
    let sivut = kohdat;
    if (sivut.length > KK_RAJA) {
      // Liian iso kirja: vain nykyisen sivun osa, sen puuttuessa nykyinen sivu.
      const i = sivut.findIndex(k => k.href.replace(/\/?$/, '/') === tama);
      let a = i, b = i;
      if (i >= 0 && sivut[i].syvyys === 2) { while (a > 0 && sivut[a].syvyys === 2) a--; while (b + 1 < sivut.length && sivut[b + 1].syvyys === 2) b++; }
      sivut = i < 0 ? [] : sivut.slice(a, b + 1);
      if (sivut.length > KK_RAJA) sivut = [sivut.find(k => k.href.replace(/\/?$/, '/') === tama)];
    }
    if (!sivut.length) {
      if (!document.querySelector('section[data-type]')) return null;
      sivut = [{ href: osoite, nimi: '', syvyys: 0, sisalto: true }];
    }
    const docs = await kkHae(sivut.map(k => k.sisalto && k.href.replace(/\/?$/, '/') !== tama ? k.href : null).map(u => u || 'about:blank'));
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    let luettu = 0;
    sivut.forEach((k, i) => {
      const yksi = sivut.length === 1;
      if (!k.sisalto) {
        if (k.osa) { const h = document.createElement('h2'); h.textContent = k.nimi; el.appendChild(h); }
        return;
      }
      const d = k.href.replace(/\/?$/, '/') === tama ? document : docs[i];
      const s = pbSivu(d, k, yksi ? 0 : k.syvyys, maar, laskuri, tekijat);
      if (!s) { if (k.osa) { const h = document.createElement('h2'); h.textContent = k.nimi; el.appendChild(h); } return; }
      if (s.tyhja) return;
      luettu++;
      if (yksi && !kohdat.length) k.nimi = s.nimi;
      el.append(...s.el.childNodes);
    });
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const kirja = rivi(md.name) || meta('citation_book_title')[0] || '';
    const yksi = sivut.length === 1 && sivut[0].href.replace(/\/?$/, '/') === tama && kohdat.length !== 1;
    const otsikko = yksi ? (sivut[0].nimi || meta('citation_title')[0] || kirja) : kirja || sivut[0].nimi;
    const julk = md.publisher || {};
    const lis = md.license || {};
    const tr = pbNimet(md.translator);
    return { html: irrota([el]).innerHTML, otsikko, tekija: kkLuettelo(tekijat), toimittaja: kkLuettelo(pbNimet(md.editor)),
      suomentaja: kkKaantaja(tr), teos: yksi && kirja !== otsikko ? kirja : '', sivusto: PB_NIMI,
      kustantaja: rivi(julk.name).replace(/^hosted by\s+/i, ''), paikka: rivi(julk.address && julk.address.addressLocality),
      julkaistu: rivi(md.datePublished) || meta('citation_publication_date')[0] || meta('citation_year')[0] || '',
      lahde: yksi ? osoite : juuri, maar, oikeus: lis.url && lis.name ? { teksti: rivi(lis.name), lahde: lis.url } : null,
      naytto: (kirja || PB_NIMI) + (luettu > 1 ? ' (' + luettu + ' sivua)' : '') };
  }

  /* OpenEdition Journals ja Books (journals.openedition.org, books.openedition.org; käyttäjän pyyntö 17.11.2026, pahvin *20
     sivustosovitetta* 2). Lehtiartikkeli (Lodel): #docHeader (h1#docTitle, #docSubtitle, #docAltertitle toisilla kielillä,
     #docAuthor, #docTranslator, #doi) ja #docBody (#abstract kielivälilehtinä .tabContent[lang], #entries avainsanat
     kielittäin, #toc, #text, #bibliography, #annexe, #notes, #quotation, #authors, #license). Kirjan luku: h1, sivut (p. 23-32),
     #anchor-fulltext (section.section1 > h1) ja #anchor-footnotes. Kappalenumerot span.paranumber yläindekseiksi kappaleen
     alkuun (pahvi: säilyvät, kuten LacusCurtiuksen pykälät). Alaviitteet a.footnotecall / a.endnotecall → a.FootnoteSymbol /
     a.EndnoteSymbol (jatkokappaleet seuraavaan merkintään asti); tekstin vieressä toistetut viitteet (ul.sidenotes) pois.
     Tiivistelmät kielen nimen kanssa (välilehden teksti) ja toisen kielen otsikko kursiivina, avainsanat kappaleina; lainaukset
     (p.citation) lainauksiksi; kirjallisuus p.bibliographie kappaleina; tekijän esittely loppuun. Pois: pikalinkit, Plan,
     Pour citer cet article, latauswidgetit, Haut de page, navigointi, kirjan sivun suositukset ja ostonapit. Etukenttään
     tyyppi tieteellinen, tekijät, kääntäjä, teos (lehti tai kirja), numero, sivut, julkaistu (DC.date, kirjassa
     citation_publication_date), kustantaja, doi ja lisenssi. Ei mainoksia eikä lahjoituspyyntöä; Freemium myy vain pdf:iä
     ja e-kirjoja, HTML on avoin. Anubis-botintorjunta pysäyttää selaimen tunnisteen ilman JavaScriptiä; selain ratkaisee sen
     itse, joten lisäosa näkee tavallisen sivun. Mitattu 17.11.2026. */
  const OE_NIMI = 'OpenEdition';
  function oeViitteet(el, juuri, maar, laskuri) {
    el.querySelectorAll('a.footnotecall[href^="#"], a.endnotecall[href^="#"]').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      let sym = null;
      try { sym = juuri.querySelector('[id="' + CSS.escape(id) + '"]'); } catch (e) {}
      const p = sym && (sym.closest('p, div.footnote') || sym.parentElement);
      let t = '';
      if (p) {
        const osat = [p];
        for (let n = p.nextElementSibling; n && /^(P|BLOCKQUOTE|UL|OL)$/.test(n.tagName) && !n.querySelector('a.FootnoteSymbol, a.EndnoteSymbol'); n = n.nextElementSibling) osat.push(n);
        const k = document.createElement('div');
        osat.forEach(x => k.appendChild(x.cloneNode(true)));
        k.querySelectorAll('a.FootnoteSymbol, a.EndnoteSymbol').forEach(x => x.remove());
        k.querySelectorAll('blockquote').forEach(q => { const d = document.createElement('p'); while (q.firstChild) d.appendChild(q.firstChild); q.replaceWith(d); });
        kkLinkit(k, /^https?:\/\/([a-z0-9-]+\.)*openedition\.org\//i);
        t = muunna(k.innerHTML, 'inlined').trim();
      }
      let kohta = a;
      while (/^(SUP|SPAN)$/.test(kohta.parentElement.tagName) && rivi(kohta.parentElement.textContent) === rivi(a.textContent)) kohta = kohta.parentElement;
      if (!t) { kohta.remove(); return; }
      const tunnus = 'oe' + (++laskuri.n);
      kohta.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
  }
  function oeSiivoa(el) {
    el.querySelectorAll('script, style, noscript, iframe, ul.sidenotes, #widgets, .go-top, a.go-top, .textIcon, .widget--select2, ' +
      '.plan--mobile, nav, button, form').forEach(x => x.remove());
    // Kappalenumero yläindeksiksi kappaleen alkuun.
    el.querySelectorAll('span.paranumber').forEach(s => {
      const n = rivi(s.textContent);
      if (!/^\d+[a-z]?$/i.test(n)) { s.remove(); return; }
      const sup = document.createElement('sup'); sup.textContent = n;
      s.replaceWith(sup, document.createTextNode(' '));
    });
    el.querySelectorAll('p.citation, p.citationbis, p.citationter, p.quotation').forEach(p => {
      if (p.closest('blockquote')) return;
      const q = document.createElement('blockquote'), u = document.createElement('p');
      while (p.firstChild) u.appendChild(p.firstChild);
      q.appendChild(u); p.replaceWith(q);
    });
    // Peräkkäiset lainaukset yhdeksi.
    el.querySelectorAll('blockquote + blockquote').forEach(q => { const e = q.previousElementSibling; if (e && e.tagName === 'BLOCKQUOTE' && !q.className && !e.className) { e.append(...q.childNodes); q.remove(); } });
    el.querySelectorAll('[style]').forEach(x => {
      // Kapiteeli (Cherlin Paul Benjamin) tavalliseksi tekstiksi.
      if (/small-caps/.test(x.getAttribute('style')) && x.tagName === 'SPAN') x.replaceWith(...x.childNodes); else x.removeAttribute('style');
    });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*openedition\.org\//i);
  }
  async function openedition() {
    if (!/(^|\.)openedition\.org$/i.test(location.hostname)) return null;
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const runko = document.getElementById('docBody'), kirja = document.querySelector('#anchor-fulltext');
    if (!runko && !kirja) return null;
    const el = document.createElement('div'), maar = [], laskuri = { n: 0 };
    const lisaa = (x, taso) => { if (!x) return; const h = document.createElement('h' + taso); h.textContent = rivi(x); el.appendChild(h); };
    const nimet = s => rivi(s).split(/\s*;\s*/).filter(Boolean).map(x => /^([^,]+),\s*(.+)$/.test(x) ? x.replace(/^([^,]+),\s*(.+)$/, '$2 $1') : x);
    let otsikko = '', alaotsikko = '', tekijat = [], kaantajat = [], teos = '', numero = '', sivut = '', julkaistu = '';
    if (runko) {
      const k = runko.cloneNode(true);
      // Välilehtien kielten nimet ennen siivousta (kkLinkit purkaa #-linkit).
      const kielet = new Map([...k.querySelectorAll('#abstract .tabMenu a[href^="#"]')].map(a => [a.getAttribute('href').slice(1), rivi(a.textContent)]));
      k.querySelectorAll('#authors ul.authorid-list, #authors ul.documents, #authors h4').forEach(x => x.remove());
      oeViitteet(k, k, maar, laskuri);
      oeSiivoa(k);
      otsikko = rivi((document.querySelector('#docTitle') || {}).textContent);
      alaotsikko = rivi((document.querySelector('#docSubtitle') || {}).textContent);
      tekijat = [...document.querySelectorAll('#docAuthor, .docAuthor')].map(x => rivi(x.textContent)).filter(Boolean);
      if (!tekijat.length) tekijat = meta('citation_authors').flatMap(nimet).concat(meta('citation_author'));
      kaantajat = [...document.querySelectorAll('#docTranslator, .docTranslator')].map(x => rivi(x.textContent).replace(/^(traduction|translated by|traduit par|übersetzt von)\s*:?\s*/i, '')).filter(Boolean);
      // Tiivistelmät: kielen nimi välilehdestä, saman kielen vaihtoehtoinen otsikko kursiivina.
      const abs = k.querySelector('#abstract');
      if (abs) {
        lisaa(abs.querySelector('h2') && abs.querySelector('h2').textContent, 2);
        const alt = new Map([...document.querySelectorAll('#docAltertitle [lang]')].map(x => [x.getAttribute('lang'), rivi(x.textContent)]));
        const osat = abs.querySelectorAll('.tabContent');
        (osat.length ? [...osat] : [abs]).forEach(t => {
          const kieli = t.getAttribute('lang') || '', nimi = kielet.get(t.id) || '';
          if (osat.length > 1 && nimi) {
            const p = document.createElement('p'), b = document.createElement('strong');
            b.textContent = nimi + '.'; p.appendChild(b);
            if (alt.get(kieli)) { const i = document.createElement('em'); i.textContent = alt.get(kieli); p.append(' ', i); }
            el.appendChild(p);
          }
          t.querySelectorAll('h2, .tabMenu').forEach(x => x.remove());
          el.append(...[...t.children]);
        });
      }
      // Avainsanat kielittäin kappaleiksi (Mots-clés : a, b).
      k.querySelectorAll('#entries .index').forEach(ix => {
        const h = ix.querySelector('h3'), p = document.createElement('p'), b = document.createElement('strong');
        b.textContent = rivi(h ? h.textContent : '').replace(/\s*:\s*$/, '') + ':';
        if (h) h.remove();
        p.append(b, ' ', rivi(ix.textContent));
        el.appendChild(p);
      });
      const teksti = k.querySelector('#text div.text') || k.querySelector('#text');
      if (teksti) {
        teksti.querySelectorAll('h2.section').forEach(x => x.remove());
        if (el.children.length) el.appendChild(document.createElement('hr'));
        // Tekstin otsikot (h1.texte …) alkavat luvusta.
        teksti.querySelectorAll(OTSIKOT).forEach(h => { h.querySelectorAll('a[href^="#toc"]').forEach(a => a.replaceWith(...a.childNodes)); });
        kkSiirra(teksti, 1);
        el.append(...[...teksti.childNodes]);
      }
      ['#bibliography', '#annexe', '#appendix', '#authors'].forEach(s => {
        const o = k.querySelector(s);
        if (!o || !rivi(o.textContent)) return;
        const h = o.querySelector('h2');
        lisaa(h && h.textContent, 2);
        if (h) h.remove();
        o.querySelectorAll('h3').forEach(x => { const u = document.createElement('h3'); u.textContent = rivi(x.textContent); x.replaceWith(u); });
        const t = o.querySelector(':scope > .text') || o;
        el.append(...[...t.children]);
      });
      teos = meta('citation_journal_title')[0] || meta('DC.source')[0] || '';
      numero = [meta('citation_volume')[0], meta('citation_issue')[0]].filter(Boolean).join(':');
      const f = meta('citation_firstpage')[0], l = meta('citation_lastpage')[0];
      sivut = f ? f + (l && l !== f ? '–' + l : '') : '';
      julkaistu = meta('DC.date')[0] || '';
    } else {
      const k = kirja.cloneNode(true);
      oeViitteet(k, document, maar, laskuri);
      oeSiivoa(k);
      kkSiirra(k, 1);
      el.append(...[...k.childNodes]);
      // Kirjallisuus, liitteet ja tekijät (#anchor-bibliography, #anchor-appendix, #anchor-persons).
      document.querySelectorAll('[id^="anchor-"].anchor--toc--section').forEach(o => {
        if (/^anchor-(footnotes|completeplan|toc|fulltext)$/.test(o.id)) return;
        const c = o.cloneNode(true), h = c.querySelector('h1, h2');
        if (!h || !rivi(c.textContent.replace(h.textContent, ''))) return;
        lisaa(h.textContent, 2);
        h.remove();
        c.querySelectorAll('ul.persons > li').forEach(li => {
          const n = li.querySelector('strong'), u = document.createElement('div');
          if (n) { const h3 = document.createElement('h3'); h3.textContent = rivi(n.textContent); u.appendChild(h3); n.closest('a') ? n.closest('a').remove() : n.remove(); }
          u.append(...li.querySelectorAll('p'));
          li.closest('ul').before(u);
        });
        c.querySelectorAll('ul.persons').forEach(x => x.remove());
        oeSiivoa(c);
        el.append(...[...c.childNodes]);
      });
      const h1 = document.querySelector('h1.content__list__item__title--content');
      otsikko = rivi(h1 ? h1.textContent : '') || meta('citation_title')[0] || '';
      tekijat = meta('citation_author');
      teos = meta('citation_inbook_title')[0] || '';
      const sv = h1 && [...h1.parentElement.querySelectorAll('p')].map(p => rivi(p.textContent)).find(t => /^p\.\s*\d/.test(t));
      sivut = sv ? sv.replace(/^p\.\s*/, '').replace(/-/g, '–') : '';
      const pv = /^(\d{4})(?:\/(\d\d))?(?:\/(\d\d))?/.exec(meta('citation_publication_date')[0] || '');
      julkaistu = pv ? [pv[1], pv[2], pv[3]].filter(Boolean).join('-') : '';
    }
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    // Lisenssi: CC-linkki (lehden #license tai kirjan license__logo), muuten DC.rights.
    const cc = [...document.querySelectorAll('#license a[href*="creativecommons.org"], a.license__logo[href*="creativecommons.org"], a[rel="license"][href]')][0];
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    const oikeus = cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } :
      meta('DC.rights')[0] && !/^https?:/.test(meta('DC.rights')[0]) ? { teksti: meta('DC.rights')[0], lahde: osoite } : null;
    const doi = rivi((document.querySelector('#doi a') || {}).textContent).replace(/^https?:\/\/doi\.org\//i, '') || meta('citation_doi')[0] || '';
    return { html: irrota([el]).innerHTML, otsikko, alaotsikko, tyyppi: 'tieteellinen', tekija: kkLuettelo([...new Set(tekijat)]),
      suomentaja: kkKaantaja(kaantajat), teos, numero, sivut, julkaistu, kustantaja: (meta('citation_publisher')[0] || meta('DC.publisher')[0] || '').replace(/;\s*$/, ''),
      doi, lahde: osoite, maar, oikeus, naytto: teos || OE_NIMI };
  }

  /* Hypotheses.org (OpenEditionin tutkijablogit, WordPress; käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 3:
     blogikirjoitus alaviitteineen, fr, de, en). Blogit ovat aliverkkotunnuksia (djgd.hypotheses.org) WordPressin twenty*-teemoilla,
     joten tunnistus verkkotunnuksesta ja yksittäisen kirjoituksen article .entry-contentista. Readability jätti alaviitteet
     numeroiduksi luetteloksi ja merkit linkeiksi (alaviitteitä 0) ja otti mukaan sitaattiehdotuksen ja lisenssikappaleen.
     Alaviitteet: WP Footnotes (a.footnote-identifier-link → ol.footnotes li, paluulinkki [↩]), WordPressin omat (sup[data-fn] →
     ol.wp-block-footnotes li) ja muut samanSivunViitteet()-muodot. Pois: OpenEditionin sitaattiehdotus (.citation), jakonapit
     (ul.soc), tekijälaatikko (.section_ppa; esittely on katkaistu, Weiterlesen) ja lisenssikappale (CC-linkki etukenttään).
     Tekijät tekijälaatikosta (.boxauthor__name, voi olla tilin nimi), muuten .author.vcard; päivä time.entry-date; sivusto
     og:site_name (blogin nimi); DOI citation_doi. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 17.11.2026. */
  async function hypotheses() {
    if (!/(^|\.)hypotheses\.org$/i.test(location.hostname)) return null;
    const artikkelit = document.querySelectorAll('article .entry-content');
    if (artikkelit.length !== 1) return null;
    const art = artikkelit[0].closest('article');
    const el = artikkelit[0].cloneNode(true);
    el.querySelectorAll('script, style, noscript, iframe, form, button, .citation, ul.soc, .section_ppa, .boxauthor, .sharedaddy, ' +
      '.jp-relatedposts, .wp-block-buttons').forEach(x => x.remove());
    // Kappaleita kääriväksi jäänyt code (djgd: <p><code></p> … <p></code></p>, jäsennin sulkee sen vasta lopussa) pois.
    [...el.querySelectorAll('code')].reverse().forEach(c => { if (c.querySelector('p, div, ul, ol, table, br, h1, h2, h3, h4')) c.replaceWith(...c.childNodes); });
    // Lisenssikappale (Nur der Text ist unter der Lizenz CC BY-NC-SA …) etukenttään.
    let oikeus = null;
    el.querySelectorAll('a[href*="creativecommons.org/licenses/"], a[href*="creativecommons.org/publicdomain/"]').forEach(a => {
      const p = a.closest('p');
      if (!p || rivi(p.textContent).length > 400) return;
      const cc = /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(a.href);
      if (!oikeus) oikeus = { teksti: cc ? 'CC ' + cc[1].toUpperCase() + ' ' + cc[2] : rivi(a.textContent) || 'Creative Commons', lahde: a.href.replace(/deed\.[a-z-]+$/i, '') };
      p.remove();
    });
    const maar = [], laskuri = { n: 0 };
    const viite = (a, li, otsikko) => {
      let t = '';
      if (li) {
        const k = li.cloneNode(true);
        k.querySelectorAll('.footnote-back-link-wrapper, a.footnote-back-link, a[href^="#"][aria-label], a[href^="#"].wp-block-footnotes__backlink').forEach(x => x.remove());
        t = muunna(k.innerHTML, 'inlined').trim().replace(/\s*\\?\[\s*\\?\]\s*$/, '');
      }
      if (!t) t = rivi(otsikko);
      let kohta = a;
      while (/^(SUP|SPAN)$/.test(kohta.parentElement.tagName) && rivi(kohta.parentElement.textContent) === rivi(a.textContent)) kohta = kohta.parentElement;
      if (!t) { kohta.remove(); return; }
      const tunnus = 'hy' + (++laskuri.n);
      kohta.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    };
    const id = h => { try { return el.querySelector('[id="' + CSS.escape(decodeURIComponent((h || '').replace(/^#/, ''))) + '"]'); } catch (e) { return null; } };
    el.querySelectorAll('a.footnote-identifier-link, sup[data-fn] a[href^="#"], .easy-footnote a[href^="#"]').forEach(a => viite(a, id(a.getAttribute('href')), a.getAttribute('title')));
    el.querySelectorAll('ol.footnotes, ol.wp-block-footnotes, .easy-footnotes-wrapper').forEach(x => x.remove());
    maar.push(...samanSivunViitteet(el, 'hyx'));
    kkLinkit(el, new RegExp('^' + location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/|$)', 'i'));
    // Tyhjät kappaleet ja loppuun jääneet viivat pois.
    el.querySelectorAll('p, div').forEach(p => { if (el.contains(p) && !p.querySelector('img, table, hr, iframe') && !rivi(p.textContent)) p.remove(); });
    while (el.lastElementChild && el.lastElementChild.tagName === 'HR') el.lastElementChild.remove();
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    const otsikko = rivi((art.querySelector('.entry-title') || document.querySelector('h1.entry-title') || {}).textContent) || rivi(document.title);
    let tekijat = [...new Set([...document.querySelectorAll('.boxauthor__name')].map(x => rivi(x.textContent)).filter(Boolean))];
    if (!tekijat.length) tekijat = [...new Set([...art.querySelectorAll('.author.vcard, .byline .author')].map(x => rivi(x.textContent)).filter(Boolean))];
    const aika = art.querySelector('time.entry-date[datetime], time.published[datetime]') || document.querySelector('meta[property="article:published_time"]');
    const julkaistu = aika ? (aika.getAttribute('datetime') || aika.content || '').slice(0, 10) : '';
    const sivusto = rivi((document.querySelector('meta[property="og:site_name"]') || {}).content) || location.hostname;
    const doi = rivi((document.querySelector('meta[name="citation_doi"]') || {}).content);
    return { html: irrota([el]).innerHTML, otsikko, tekija: kkLuettelo(tekijat), sivusto, julkaistu, doi, lahde: osoite, maar, oikeus,
      naytto: sivusto + ' (Hypotheses)' };
  }

  /* Manifold (alustasovite; käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 4: kirjan mittainen teksti). Manifold on
     React-lukija, mutta palvelin renderöi osion HTML:n (.manifold-text-section), joten sivut voi hakea. Tunnistus alustasta:
     .manifold-text-section ja osoite /read/<teksti>/section/<osio>. Teksti ja metatiedot rajapinnasta /api/v1/texts/<teksti>
     (toc, creatorNames, subtitle, metadata: publisher, publisherPlace, rights, restrictions, seriesTitle, seriesNumber).
     Koko kirja sisällysluettelon osioista (KK_RAJA), pois kansi, nimiöt, sarjaluettelo, tekijänoikeussivu, sisällys, hakemisto
     ja kuvaliite; loppuviiteosio (pelkkiä li[data-epub-type=endnote]-viitteitä) ei tule tekstiksi, vaan sen viitteet alaviitteiksi.
     Viitemerkit a[role=doc-noteref] (enref, fnref) osoittavat toisen osion ankkuriin (…/section/<notes>#rc1en1) tai saman
     osion ankkuriin; paluulinkki a[role=doc-backlink] pois. Readability antoi yhden osion, pudotti viitemerkit kokonaan eikä
     löytänyt tekijää. Julkaisuvuosi vain tekijänoikeusrivistä (Copyright 2011), koska publicationDate on Manifoldiin vienti
     (Black No More 2026). Standard Ebooksin nimiö, Imprint, Colophon ja Uncopyright pois.
     Ei mainoksia eikä lahjoituspyyntöä (palvelimet ovat kustantajien ja yliopistojen). Mitattu 17.11.2026. */
  const MF_POIS = /^(cover|half\s*-?title( ?page)?|series( list| page)?|title ?page|imprint|colophon|uncopyright|copyright( page)?|contents|table of contents|index|plates|also by .*|other books .*)$/i;
  function mfRunko(d) {
    const s = d && d.querySelector('.manifold-text-section');
    if (!s) return null;
    const el = s.cloneNode(true);
    el.querySelectorAll('style, script, button, svg, .annotation-selection, [class*="annotation-"], .screen-reader-text').forEach(x => x.remove());
    return el;
  }
  async function manifold() {
    const m = /^\/read\/([^/]+)\/section\/([^/?#]+)/.exec(location.pathname);
    if (!m || !document.querySelector('.manifold-text-section')) return null;
    const api = await pbJson(location.origin + '/api/v1/texts/' + m[1]);
    const a = (api && api.data && api.data.attributes) || {};
    const md = a.metadata || {};
    const osiot = [];
    const kay = (t, syv) => (t || []).forEach(x => { if (x && x.id && !osiot.some(o => o.id === x.id)) osiot.push({ id: x.id, nimi: rivi(x.label), syv }); kay(x && x.children, syv + 1); });
    kay(a.toc, 1);
    const tama = decodeURIComponent(m[2]);
    let valitut = osiot.filter(o => !MF_POIS.test(o.nimi));
    if (!valitut.length) valitut = [{ id: tama, nimi: '', syv: 1 }];
    if (valitut.length > KK_RAJA) valitut = valitut.filter(o => o.id === tama);
    const url = id => location.origin + '/read/' + m[1] + '/section/' + id;
    const docs = await kkHae(valitut.map(o => o.id === tama ? 'about:blank' : url(o.id)));
    const runko = new Map();
    valitut.forEach((o, i) => runko.set(o.id, o.id === tama ? document : docs[i]));
    // Loppuviiteosiot: haetaan myös poisjätetyt (Notes ei ole MF_POIS-listassa, mutta varmuuden vuoksi) viitteiden kohteiksi.
    const onViiteosio = el => { const t = kkSanoja(el), v = [...el.querySelectorAll('li[data-epub-type="endnote"], li.endnote, [role="doc-endnote"], aside[data-epub-type="footnote"], aside[role="doc-footnote"]')]; return v.length && v.reduce((n, x) => n + kkSanoja(x), 0) > 0.6 * t; };
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    const kohde = (href, d0) => {
      let u; try { u = new URL(href, location.href); } catch (e) { return null; }
      const sm = /\/section\/([^/?#]+)/.exec(u.pathname), sid = sm ? decodeURIComponent(sm[1]) : null;
      const d = sid && runko.get(sid) || (sid ? null : d0) || (u.pathname === location.pathname ? document : null);
      const id = decodeURIComponent(u.hash.slice(1));
      if (!d || !id) return null;
      try { return d.querySelector('.manifold-text-section [id="' + CSS.escape(id) + '"]') || d.querySelector('[id="' + CSS.escape(id) + '"]'); } catch (e) { return null; }
    };
    let luettu = 0;
    valitut.forEach(o => {
      const d = runko.get(o.id), s = mfRunko(d);
      if (!s || onViiteosio(s)) return;
      s.querySelectorAll('a[role="doc-noteref"], a.enref, a.fnref, a[data-epub-type="noteref"]').forEach(x => {
        const k = kohde(x.getAttribute('href'), d);
        const li = k && (k.closest('li, aside, div.footnote, p') || k);
        let t = '';
        if (li) {
          const c = li.cloneNode(true);
          c.querySelectorAll('a[role="doc-backlink"], a.ennum, a.fnnum').forEach(y => y.remove());
          kkLinkit(c, new RegExp('^' + location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/|$)', 'i'));
          t = muunna(c.innerHTML, 'inlined').trim().replace(/^\d+\\?\.\s*/, '');
        }
        let kohta = x;
        while (/^(SUP|SPAN)$/.test(kohta.parentElement.tagName) && rivi(kohta.parentElement.textContent) === rivi(x.textContent)) kohta = kohta.parentElement;
        if (!t) { kohta.remove(); return; }
        const tunnus = 'mf' + (++laskuri.n);
        kohta.replaceWith(merkki(tunnus));
        maar.push(maaritelma(tunnus, t));
      });
      // Saman osion alaviitteet (aside, ol.notes) on jo siirretty; jäljelle jääneet viitelohkot pois.
      s.querySelectorAll('li[data-epub-type="endnote"], li.endnote, aside[data-epub-type="footnote"], aside[role="doc-footnote"]').forEach(x => {
        const ol = x.closest('ol'); x.remove(); if (ol && !ol.children.length) ol.remove();
      });
      kkLinkit(s, new RegExp('^' + location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/|$)', 'i'));
      if (!kkSanoja(s)) return;
      luettu++;
      const yksi = valitut.length === 1;
      if (!yksi) {
        kkSiirra(s, o.syv);
        const ens = [...s.querySelectorAll(OTSIKOT)][0];
        if (!ens || ens.compareDocumentPosition && [...s.querySelectorAll('p')].some(p => kkSanoja(p) > 3 && (p.compareDocumentPosition(ens) & Node.DOCUMENT_POSITION_FOLLOWING))) {
          const h = document.createElement('h' + Math.min(6, 1 + o.syv)); h.textContent = o.nimi; s.prepend(h);
        }
      } else kkSiirra(s, 1);
      el.append(...s.childNodes);
    });
    if (kkSanoja(el) < 20) return null;
    kkTasoita(el);
    el.normalize();
    const oik = rivi(String(md.rights || '') + ' ' + String(md.restrictions || '')).replace(/<[^>]+>/g, ' ');
    const cc = /creativecommons\.org\/(licenses|publicdomain)\/([a-z-]+)\/(\d\.\d)/i.exec(oik);
    const ccNimi = /\((CC [A-Z-]+ \d\.\d)\)/.exec(oik);
    const vuosi = (/copyright\s*(?:©\s*)?(\d{4})/i.exec(oik) || /©\s*(\d{4})/.exec(oik) || [])[1];
    const linkiton = s => rivi(String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'));
    const otsikko = linkiton(a.titlePlaintext || a.title) || rivi(document.title);
    return { html: irrota([el]).innerHTML, otsikko, alaotsikko: linkiton(a.subtitlePlaintext || a.subtitle), tekija: rivi(a.creatorNames).replace(/, and /g, ' & ').replace(/ and /g, ' & '),
      sarja: [linkiton(md.seriesTitle), rivi(md.seriesNumber)].filter(Boolean).join(' '), kustantaja: rivi(md.publisher), paikka: rivi(md.publisherPlace),
      julkaistu: vuosi || '', sivusto: 'Manifold', lahde: location.origin + '/read/' + m[1],
      oikeus: cc ? { teksti: ccNimi ? ccNimi[1] : 'CC ' + cc[2].toUpperCase() + ' ' + cc[3], lahde: 'https://creativecommons.org/' + cc[1] + '/' + cc[2] + '/' + cc[3] + '/' } : null,
      maar, naytto: (otsikko || 'Manifold') + (luettu > 1 ? ' (' + luettu + ' osiota)' : '') };
  }

  /* ForumMagnum (LessWrong, EA Forum, AI Alignment Forum; alustasovite, käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 5:
     ponnahdusalaviitteet tavallisiksi, kommentit pois). Kirjoituksen sivu /posts/<id>/<nimi>. Runko: LessWrongissa
     .PostsPage-postContent (#postContent), EA Forumissa (Next.js, Tailwind) [data-component=ContentItemBody], joka ei ole
     kommentti (.comment-body); EA Forum virtaa sisällön piilotettuina paloina, jotka sivun skriptit siirtävät paikalleen, joten
     valitaan pisin ehdokas. Alaviitteet: span.footnote-reference[role=doc-noteref] a[href=#fnX] → ol.footnote-section
     li#fnX .footnote-content (sivu näyttää ne ponnahduksina tai reunahuomautuksina). Readability jätti viitteet loppuun
     luetteloksi ja merkit linkeiksi (alaviitteitä 0, raakaa HTML:ää 146). Pois: kommentit, upotukset (.iframe-widget), äänilukija
     ja äänestys (rungon ulkopuolella). Etukenttään citation_title, citation_author (kaikki), päivä citation_publication_date tai
     time[datetime], sivusto application-name tai verkkotunnus. Ei mainoksia; rahoitusta ei ole tarkistettu, joten ei
     RAHOITUS-merkintää. Mitattu 17.11.2026. */
  const FM_NIMET = { 'lesswrong.com': 'LessWrong', 'forum.effectivealtruism.org': 'Effective Altruism Forum', 'alignmentforum.org': 'AI Alignment Forum' };
  async function forummagnum() {
    const isanta = location.hostname.replace(/^www\./, '');
    const tunnettu = FM_NIMET[isanta];
    if (!/^\/posts\/[A-Za-z0-9]+/.test(location.pathname)) return null;
    if (!tunnettu && !document.querySelector('.PostsPage-postContent, [data-component="PostsPage"]')) return null;
    const ehdot = [...document.querySelectorAll('.PostsPage-postContent, [data-component="ContentItemBody"]')]
      .filter(x => !x.closest('.comment-body, [data-component="CommentItem"], .CommentsNode-root, .CommentBody-root') && !x.classList.contains('comment-body'));
    const runko = ehdot.sort((a, b) => kkSanoja(b) - kkSanoja(a))[0];
    if (!runko || kkSanoja(runko) < 30) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('script, style, template, noscript, iframe, button, svg, .iframe-widget, .HydratedIframeWidget-fallback, .footnote-back-link').forEach(x => x.remove());
    const maar = [], laskuri = { n: 0 };
    el.querySelectorAll('.footnote-reference, [role="doc-noteref"]').forEach(r => {
      const a = r.querySelector('a[href^="#"]') || (r.matches('a[href^="#"]') ? r : null);
      if (!a || !el.contains(r)) return;
      let li = null;
      try { li = el.querySelector('[id="' + CSS.escape(decodeURIComponent(a.getAttribute('href').slice(1))) + '"]'); } catch (e) {}
      let t = '';
      if (li) {
        const c = (li.querySelector('.footnote-content') || li).cloneNode(true);
        t = muunna(c.innerHTML, 'inlined').trim();
      }
      if (!t) { r.remove(); return; }
      const tunnus = 'fm' + (++laskuri.n);
      r.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('ol.footnote-section, ol.footnotes, [role="doc-endnotes"]').forEach(x => x.remove());
    kkLinkit(el, new RegExp('^' + location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/(?!posts/)', 'i'));
    el.querySelectorAll('p, div').forEach(p => { if (el.contains(p) && !p.querySelector('img, table, hr, iframe') && !rivi(p.textContent)) p.remove(); });
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const otsikko = meta('citation_title')[0] || rivi((document.querySelector('.PostsPageTitle-link, h1') || {}).textContent) || rivi(document.title);
    let tekijat = meta('citation_author');
    if (!tekijat.length) tekijat = [...document.querySelectorAll('.PostsAuthors-authorName a')].map(a => rivi(a.textContent)).filter(Boolean);
    const pv = meta('citation_publication_date')[0];
    const aika = document.querySelector('.PostsPageDate-date time[datetime], .PostsPageDate-date time[dateTime]');
    const julkaistu = pv ? pv.replace(/\//g, '-') : aika ? (aika.getAttribute('datetime') || '').slice(0, 10) : '';
    const sivusto = tunnettu || meta('application-name')[0] || rivi((document.querySelector('meta[property="og:site_name"]') || {}).content) || isanta;
    return { html: irrota([el]).innerHTML, otsikko, tekija: kkLuettelo([...new Set(tekijat)]), sivusto, julkaistu, lahde: osoite, maar };
  }

  /* Janeway (Open Library of Humanities ja muut Janeway-lehdet: olh, orbit, c21.openlibhums.org, Glossa ym.; alustasovite,
     käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 6). Artikkelisivu /article/id/<n>/: tiivistelmä #article-kortissa
     (h2 Abstract ja kappaleet), sitaattiehdotus #article_how_to_cite, teksti #main_article (JATS/TEI:stä renderöidyt
     .article-section-osiot, kuvat .fig ja .fig-caption, alaviitteet a.xref-fn → h2 Notes + ol.footnotes li#nN, paluulinkki
     a.footnotemarker ⮭, kirjallisuusviittaukset a.xref-bibr → h2 References + #reflist p#BN). Tunnistus rakenteesta, ei
     verkkotunnuksesta. Readability antoi tekstin ilman tekijää, otti sitaattiehdotuksen ja menetti alaviitteet ja kirjallisuuden.
     Tiivistelmä ja avainsanat (citation_keywords) alkuun, osanvaihto, teksti; viittauslinkit tekstiksi; kuvatekstit jäävät.
     Etukenttään tyyppi tieteellinen, tekijät, lehti, vuosikerta:numero, julkaisupäivä, kustantaja, DOI ja CC-lisenssi
     (DC.Rights). Ei mainoksia eikä lahjoituspyyntöä (OLH on kirjastokonsortion rahoittama). Michigan Publishing (Ergo,
     Philosophers' Imprint; 20.11.2026, sivustoehdokkaat-3 kärki 4): <article id="main_article"> ilman article-body-luokkaa,
     tiivistelmä #article-lohkossa h3:n alla (ei .card-contentia) ja citation_issue 0 (numerosta pois). MathML-kaavat tekstiksi
     (mathTeksti()), otsikottomat taulukot ojsTaulukko():lla ja korostus ala- ja yläindeksien sisältä pois. Anubis kuten OpenEditionissa:
     selain ratkaisee haasteen, pesukone hakee curlin omalla tunnisteella. Mitattu 17.11.2026. */
  // MathML tekstiksi (Philosophers' Imprint: 722 rivinsisäistä kaavaa, {Socrates}, □p): ala- ja yläindeksit HTML:nä, murtoluku a/b,
  // muut elementit sisältönsä mukaan. Luin ei näytä MathML:ää, ja Turndown jättäisi sen raa'aksi HTML:ksi.
  function mathTeksti(m) {
    const nimi = n => (n.localName || n.nodeName || '').toLowerCase().replace(/^mml:/, '');
    const lapset = n => [...n.childNodes].filter(x => x.nodeType === 1);
    const kaanna = n => {
      if (n.nodeType === 3) return n.nodeValue.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;');
      if (n.nodeType !== 1) return '';
      const t = nimi(n), l = lapset(n);
      if (/^(annotation|annotation-xml)$/.test(t)) return '';
      // Indeksin sisältö litteänä ja ilman välilyöntejä: Latomon ~…~- ja ^…^-muoto ei sisäkkäisty eikä salli välilyöntiä
      // (□ alaindeksinä x₁,…,xₙ).
      const ind = (x, tag) => { const v = kaanna(x).replace(/<\/?(sub|sup)>/g, '').replace(/\s+/g, ''); return v ? '<' + tag + '>' + v + '</' + tag + '>' : ''; };
      if (t === 'msub' && l.length >= 2) return kaanna(l[0]) + ind(l[1], 'sub');
      if (t === 'msup' && l.length >= 2) return kaanna(l[0]) + ind(l[1], 'sup');
      if (t === 'msubsup' && l.length >= 3) return kaanna(l[0]) + ind(l[1], 'sub') + ind(l[2], 'sup');
      if (t === 'mfrac' && l.length >= 2) return kaanna(l[0]) + '/' + kaanna(l[1]);
      if (/^(munder|mover|munderover)$/.test(t) && l.length) return kaanna(l[0]);
      if (t === 'msqrt') return '√(' + l.map(kaanna).join('') + ')';
      if (t === 'mspace') return ' ';
      return [...n.childNodes].map(kaanna).join('');
    };
    const html = kaanna(m).replace(/\s+/g, ' ').trim();
    const d = jasenna('<div>' + html + '</div>').body.firstChild;
    return [...d.childNodes];
  }
  async function janeway() {
    // Michigan Publishing (Ergo, Philosophers' Imprint): <article id="main_article"> ilman article-body-luokkaa.
    const runko = document.querySelector('#main_article.article-body, #main_article[itemprop="articleBody"], article#main_article');
    if (!runko || !runko.querySelector('.article-section') || !/\/article\/id\/\d+/.test(location.pathname)) return null;
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const el = document.createElement('div'), maar = [], laskuri = { n: 0 };
    // Tiivistelmä (#article-kortin h2 Abstract ja sitä seuraavat kappaleet).
    const kortti = document.querySelector('#article .card-content') || document.getElementById('article');
    const abs = kortti && [...kortti.querySelectorAll('h2, h3')].find(h => /^(abstract|résumé|zusammenfassung|resumen|riassunto|tiivistelmä)$/i.test(rivi(h.textContent)));
    if (abs) {
      const h = document.createElement('h2'); h.textContent = rivi(abs.textContent); el.appendChild(h);
      for (let n = abs.nextElementSibling; n && !/^H[1-6]$/.test(n.tagName) && n.id !== 'article_how_to_cite'; n = n.nextElementSibling) {
        if (!rivi(n.textContent)) continue;
        const k = n.cloneNode(true);
        // <p><p>…</p></p> purkautuu jäsentimessä sisaruksiksi; tyhjät pois.
        el.append(...(k.tagName === 'P' && k.querySelector('p') ? [...k.querySelectorAll('p')] : [k]));
      }
    }
    const avain = meta('citation_keywords')[0];
    if (avain) { const p = document.createElement('p'), b = document.createElement('strong'); b.textContent = 'Keywords:'; p.append(b, ' ', avain); el.appendChild(p); }
    if (el.children.length) el.appendChild(document.createElement('hr'));
    const k = (runko.querySelector('.card-content') || runko).cloneNode(true);
    k.querySelectorAll('#metatags, meta, script, style, #article_footer_block, .fig-inline-img, .fig-expansion > a, button').forEach(x => x.remove());
    k.querySelectorAll('math').forEach(m => m.replaceWith(...mathTeksti(m)));
    // Otsikoton kaava- tai asettelutaulukko ruudukoksi (Philosophers' Imprint); otsikolliset jäävät Turndownin GFM-taulukoiksi.
    k.querySelectorAll('table').forEach(t => { if (!t.querySelector('th')) ojsTaulukko(t); });
    const kaytetyt = new Set();
    const viiteTeksti = li => {
      const c = li.cloneNode(true);
      c.querySelectorAll('sup em, sup i, sub em, sub i').forEach(x => x.replaceWith(...x.childNodes));
      c.querySelectorAll('a.footnotemarker').forEach(x => x.remove());
      c.querySelectorAll('a.xref-bibr, a[href^="#"]').forEach(x => x.replaceWith(...x.childNodes));
      return muunna(c.innerHTML, 'inlined').trim();
    };
    k.querySelectorAll('a.xref-fn[href^="#"]').forEach(a => {
      let li = null;
      try { li = k.querySelector('[id="' + CSS.escape(a.getAttribute('href').slice(1)) + '"]'); } catch (e) {}
      const t = li ? viiteTeksti(li) : '';
      if (li) kaytetyt.add(li);
      if (!t) { a.remove(); return; }
      const tunnus = 'jw' + (++laskuri.n);
      a.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    // Viite, jonka merkki on otsikossa (OLH 20095: Der Titel bezieht sich auf …; otsikon merkkiä ei linkitetä), otsikkoon.
    let otsikkoMerkit = '';
    k.querySelectorAll('ol.footnotes > li[id]').forEach(li => {
      if (kaytetyt.has(li)) return;
      const t = viiteTeksti(li);
      if (!t) return;
      const tunnus = 'jw' + (++laskuri.n);
      otsikkoMerkit += 'XLUINVIITE' + tunnus + 'X';
      maar.push(maaritelma(tunnus, t));
    });
    k.querySelectorAll('ol.footnotes').forEach(ol => {
      const h = ol.previousElementSibling;
      if (h && /^H[1-6]$/.test(h.tagName) && /^(notes|endnotes|footnotes|anmerkungen|notes de bas de page)$/i.test(rivi(h.textContent))) h.remove();
      ol.remove();
    });
    k.querySelectorAll('a.xref-bibr, a.xref-fig, a.xref-table, a[href^="#"]').forEach(x => x.replaceWith(...x.childNodes));
    // Korostus ala- tai yläindeksin sisällä (Ergo: <sub><em>) jäisi raa'aksi HTML:ksi.
    k.querySelectorAll('sup em, sup i, sub em, sub i').forEach(x => x.replaceWith(...x.childNodes));
    // Kuvan numero (Figure 1:) jää kuvatekstiin; tyhjä fig-label pois.
    k.querySelectorAll('.fig-label').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
    kkLinkit(k, new RegExp('^' + location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/|$)', 'i'));
    k.querySelectorAll('p, div').forEach(p => { if (k.contains(p) && !p.querySelector('img, table, hr') && !rivi(p.textContent)) p.remove(); });
    el.append(...k.childNodes);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const oik = meta('DC.Rights')[0] || '';
    const cc = /creativecommons\.org\/(licenses|publicdomain)\/([a-z-]+)\/(\d\.\d)/i.exec(oik);
    const ccNimi = /\((CC[- ][A-Z-]+ \d\.\d)\)/.exec(oik);
    return { html: irrota([el]).innerHTML, otsikko: meta('citation_title')[0] || rivi((document.querySelector('h1') || {}).textContent),
      tyyppi: 'tieteellinen', tekija: kkLuettelo([...new Set(meta('citation_author'))]), teos: meta('citation_journal_title')[0] || '',
      numero: [meta('citation_volume')[0], meta('citation_issue')[0]].filter(x => x && x !== '0').join(':'), julkaistu: meta('citation_publication_date')[0] || meta('citation_date')[0] || '',
      kustantaja: meta('citation_publisher')[0] || '', doi: meta('citation_doi')[0] || '', lahde: osoite, maar, otsikkoMerkit,
      oikeus: cc ? { teksti: ccNimi ? ccNimi[1].replace(/^CC-/, 'CC ') : 'CC ' + cc[2].toUpperCase() + ' ' + cc[3], lahde: 'https://creativecommons.org/' + cc[1] + '/' + cc[2] + '/' + cc[3] + '/' } : null,
      naytto: meta('citation_journal_title')[0] || 'Janeway' };
  }

  /* SciELO (klassinen sivupohja scielo.php?script=sci_arttext; käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 7).
     Kansalliset palvelimet (scielo.org.mx, .org.ar, .org.co, .pt, .org.za ym.) renderöivät artikkelin XML:stä: #article-front
     (p.categoria, p.title ja sen alaviitemerkki, p.trans-title, .autores .author-name, p.aff, div.abstract / div.trans-abstract
     otsikkona p.sec ja avainsanat lihavoidun otsakkeen perässä), #article-body (div.section, otsikot p.sec ja p.subsec, viittaukset
     sup > a[href=#BN] ja alaviitemerkit sup > a[href=#fnN]) ja #article-back (div.fn, kirjallisuus p.ref sci_nlinks-
     linkkeineen, käsittelyhistoria .history) sekä .license. www.scielo.br ja scielosp.org ovat Bunny Shield -haasteen takana
     (selain ratkaisee sen; pilvikontista ei mitattavissa), ja niiden uusi pohja (/j/…/a/…) on eri: sovite ei tunnista sitä.
     Readability jätti viittaukset ja alaviitemerkit yläindeksilinkeiksi (raakaa HTML:ää 540) eikä alaviitteitä tullut.
     Tiivistelmät lihavoidun kielen otsakkeen kanssa, toisen kielen otsikko kursiivina; viittaukset tekstiksi; otsikon alaviite
     otsikkoon; kirjallisuus ilman Links-linkkejä. Etukenttään tyyppi tieteellinen, tekijät, lehti, vuosikerta:numero, vuosi,
     sivut, kustantaja, DOI ja CC-lisenssi. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 17.11.2026. */
  async function scielo() {
    const etu = document.getElementById('article-front'), runko = document.getElementById('article-body');
    if (!etu || !runko || !/scielo/i.test(location.hostname + location.pathname)) return null;
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const takana = document.getElementById('article-back');
    const el = document.createElement('div'), maar = [], laskuri = { n: 0 };
    const viite = id => {
      const a = document.querySelector('#article-back a[name="' + id + '"], #article-body a[name="' + id + '"]') || document.getElementById(id);
      const fn = a && (a.closest('div.fn') || (a.nextElementSibling && a.nextElementSibling.matches('div.fn') ? a.nextElementSibling : null) || a.closest('p'));
      if (!fn) return '';
      const k = fn.cloneNode(true);
      k.querySelectorAll('a[name]').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
      const ens = k.querySelector('p > sup:first-child, sup');
      if (ens && /^\s*\w{1,3}\s*$/.test(ens.textContent) && rivi(k.textContent).startsWith(rivi(ens.textContent))) ens.remove();
      siivoa(k);
      return muunna(k.innerHTML, 'inlined').trim();
    };
    // Viittaukset (sup > a#BN) tekstiksi, alaviitemerkit (sup > a#fnN) alaviitteiksi.
    const siivoa = k => {
      k.querySelectorAll('sup').forEach(s => {
        const a = s.querySelector('a[href^="#"]');
        if (!a || !k.contains(s)) return;
        const h = a.getAttribute('href').slice(1);
        if (/^fn/i.test(h)) return;
        if (rivi(s.textContent) === rivi(a.textContent)) s.replaceWith(...a.childNodes);
      });
      k.querySelectorAll('a[href^="javascript"], a[onclick], img').forEach(x => x.remove());
      k.querySelectorAll('a[href^="#"]').forEach(a => { if (!/^#fn/i.test(a.getAttribute('href'))) a.replaceWith(...a.childNodes); });
      k.querySelectorAll('span[style*="small-caps"]').forEach(x => x.replaceWith(...x.childNodes));
    };
    const merkit = k => k.querySelectorAll('sup').forEach(s => {
      const a = s.querySelector('a[href^="#fn"], a[href^="#FN"]');
      if (!a || !k.contains(s)) return;
      const t = viite(a.getAttribute('href').slice(1));
      if (!t) { s.remove(); return; }
      const tunnus = 'sc' + (++laskuri.n);
      s.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    const otsikkoEl = etu.querySelector('p.title');
    let otsikkoMerkit = '';
    if (otsikkoEl) {
      const k = otsikkoEl.cloneNode(true);
      merkit(k);
      otsikkoMerkit = (k.textContent.match(/XLUINVIITE[0-9A-Za-z]+?X/g) || []).join('');
    }
    const ok = otsikkoEl && otsikkoEl.cloneNode(true);
    if (ok) ok.querySelectorAll('sup').forEach(x => { if (x.querySelector('a[href^="#fn"]')) x.remove(); });
    const otsikko = rivi(ok ? ok.textContent : '') || meta('citation_title')[0] || rivi(document.title);
    const kaannos = rivi((etu.querySelector('p.trans-title') || {}).textContent);
    // Tiivistelmät.
    const tiiv = [...etu.querySelectorAll('div.abstract, div.trans-abstract')];
    tiiv.forEach((t, i) => {
      const k = t.cloneNode(true);
      const sec = k.querySelector('p.sec');
      const p = document.createElement('p'), b = document.createElement('strong');
      b.textContent = rivi(sec ? sec.textContent : 'Abstract') + '.'; p.appendChild(b);
      if (sec) sec.remove();
      // Toisen kielen otsikko sen tiivistelmän kohdalle, joka ei ole artikkelin kielellä (tavallisesti Abstract).
      if (kaannos && tiiv.length > 1 && i === tiiv.length - 1) { const e = document.createElement('em'); e.textContent = kaannos; p.append(' ', e); }
      el.appendChild(p);
      siivoa(k);
      merkit(k);
      el.append(...k.children);
    });
    if (el.children.length) el.appendChild(document.createElement('hr'));
    const b = runko.cloneNode(true);
    siivoa(b);
    merkit(b);
    // Otsikon taso: osion ensimmäinen otsikkokappale sisäkkäisyyden mukaan (Diánoia: luvun 3 otsikko on p.sub-subsec suoraan
    // ylimmässä div.sectionissa), muut luokan mukaan.
    b.querySelectorAll('p.sec, p.subsec, p.sub-subsec, p.subsubsec').forEach(p => {
      const osio = p.closest('div.section');
      let syv = 0;
      for (let x = osio; x && x !== b; x = x.parentElement) if (x.matches('div.section')) syv++;
      const ens = osio && osio.querySelector('p.sec, p.subsec, p.sub-subsec, p.subsubsec') === p;
      const taso = ens && syv ? Math.min(4, syv + 1) : p.classList.contains('sec') ? 2 : p.classList.contains('subsec') ? 3 : 4;
      const h = document.createElement('h' + taso);
      h.textContent = rivi(p.textContent); p.replaceWith(h);
    });
    el.append(...b.childNodes);
    if (takana) {
      const t = takana.cloneNode(true);
      t.querySelectorAll('.foot-notes, .fn, .history').forEach(x => x.remove());
      siivoa(t);
      // Sisäkkäinen <p class="sec"><p class="sec">Referencias</p></p> purkautuu jäsentimessä tyhjäksi ja täydeksi kappaleeksi.
      t.querySelectorAll('p.sec').forEach(p => {
        if (!rivi(p.textContent)) { p.remove(); return; }
        const h = document.createElement('h2'); h.textContent = rivi(p.textContent); p.replaceWith(h);
      });
      t.querySelectorAll('p.ref').forEach(p => { p.innerHTML = p.innerHTML.replace(/\[\s*\]\s*$/, ''); p.normalize(); const l = p.lastChild; if (l && l.nodeType === 3) l.textContent = l.textContent.replace(/\s*\[\s*\]\s*$/, ''); });
      el.append(...t.childNodes);
    }
    el.querySelectorAll('p, div').forEach(p => { if (el.contains(p) && !p.querySelector('img, table, hr') && !rivi(p.textContent)) p.remove(); });
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const tekijat = [...etu.querySelectorAll('.author-name')].map(x => rivi(x.textContent)).filter(Boolean);
    const lis = document.querySelector('.license a[rel="license"][href], .license a[href*="creativecommons.org"]');
    const cc = lis && /(licenses|publicdomain)\/([a-z-]+)\/(\d\.\d)/i.exec(lis.href);
    const pv = /(?:(\d\d)\/)?(\d{4})/.exec(meta('citation_date')[0] || meta('citation_publication_date')[0] || '');
    const f = meta('citation_firstpage')[0], l = meta('citation_lastpage')[0];
    return { html: irrota([el]).innerHTML, otsikko, otsikkoMerkit, tyyppi: 'tieteellinen',
      tekija: kkLuettelo(tekijat.length ? tekijat : [...new Set(meta('citation_author'))].map(x => x.replace(/^([^,]+),\s*(.+)$/, '$2 $1'))),
      teos: meta('citation_journal_title')[0] || '', numero: [meta('citation_volume')[0], meta('citation_issue')[0]].filter(Boolean).join(':'),
      sivut: f ? f + (l && l !== f ? '–' + l : '') : '', julkaistu: pv ? pv[2] + (pv[1] && pv[1] !== '00' ? '-' + pv[1] : '') : '',
      kustantaja: meta('citation_publisher')[0] || '', doi: meta('citation_doi')[0] || '', lahde: osoite, maar,
      oikeus: cc ? { teksti: 'CC ' + cc[2].toUpperCase() + ' ' + cc[3], lahde: 'https://creativecommons.org/' + cc[1] + '/' + cc[2] + '/' + cc[3] + '/' } : null,
      naytto: (meta('citation_journal_title')[0] || 'SciELO') + ' (SciELO)' };
  }

  /* Open Book Publishers (books.openbookpublishers.com/10.11647/obp.NNNN/, Epublius-lukunäkymä; käyttäjän pyyntö 17.11.2026,
     pahvin *20 sivustosovitetta* 8: koko kirja, luvut sisällysluetteloksi). Kirja on EPUB:n XHTML-tiedostoina (#mainwin: section
     epub:type, h1.heading1, p.doi ©vuosi Tekijä, lisenssi ja luvun DOI, luvun loppuviitteet section[epub:type=endnotes]
     li#footnote-N, merkit a[role=doc-noteref], hakemistoankkurit a#IndexMarkerN). Sisällys contents.xhtml (p.TOC-* a), nimiö
     ja lisenssi copyright.xhtml (Attribution should include: Tekijä, *Nimi*. Paikka: Kustantaja, vuosi, DOI). www.openbookpublishers.com
     (kirjan sivu ja vanha htmlreader) on Vercelin tarkistuksen takana eikä pilvikontista mitattavissa. Koko kirja sisällyksen
     järjestyksessä (KK_RAJA), pois sisällys, hakemisto ja kuvaluettelo; osat (partI.xhtml, PART I …) lukuina ja niiden luvut
     osioina, muut sivut (johdanto, coda, kirjallisuus, filmografia) lukuina. Luvun ©-rivi pois; toimitetussa kirjassa luvun
     tekijä kappaleeksi otsikon alle. Lukijan navigaatio (Buy, Translate, Donate), nuolet ja evästeilmoitus ovat #mainwinin
     ulkopuolella. Lahjoituslinkki, ei mainoksia (RAHOITUS). Mitattu 17.11.2026. */
  const OBP_NIMI = 'Open Book Publishers';
  async function obp() {
    const m = /^\/(10\.11647\/[^/]+)\//i.exec(location.pathname);
    if (!/(^|\.)openbookpublishers\.com$/i.test(location.hostname) || !m || !document.getElementById('mainwin')) return null;
    const juuri = location.origin + '/' + m[1] + '/';
    const [sis, oik] = await Promise.all([hae(juuri + 'contents.xhtml'), hae(juuri + 'copyright.xhtml')]);
    const tiedostot = [];
    if (sis) sis.querySelectorAll('#mainwin a[href]').forEach(a => {
      const t = (a.getAttribute('href') || '').split('#')[0];
      if (!t || /^[a-z]+:/i.test(t) || tiedostot.some(x => x.t === t)) return;
      tiedostot.push({ t, nimi: rivi(a.textContent) });
    });
    const tama = (/[^/]*$/.exec(location.pathname) || [''])[0] || 'contents.xhtml';
    let valitut = tiedostot.filter(x => !/^(contents|index|illustrations|copyright)\.x?html$/i.test(x.t) && !/^(index|list of (illustrations|figures|tables)|contents)$/i.test(x.nimi));
    if (!valitut.length) valitut = [{ t: tama, nimi: '' }];
    if (valitut.length > KK_RAJA) valitut = valitut.filter(x => x.t === tama);
    const docs = await kkHae(valitut.map(x => x.t === tama ? 'about:blank' : juuri + x.t));
    // Nimiö copyright-sivulta: Tekijä, <i>Nimi</i>. Paikka: Kustantaja, vuosi, DOI.
    let tekija = '', toimittaja = '', kirja = '', paikka = '', kustantaja = '', vuosi = '', doi = '', oikeus = null;
    const attr = oik && [...oik.querySelectorAll('#mainwin p')].find(p => p.querySelector('i, em') && /doi\.org\/10\.11647/i.test(p.innerHTML));
    if (attr) {
      const i = attr.querySelector('i, em');
      kirja = rivi(i.textContent);
      const ennen = rivi(attr.textContent.split(i.textContent)[0]).replace(/,\s*$/, '');
      if (/\((eds?\.?|editors?|ed\. by)\)/i.test(ennen)) toimittaja = ennen.replace(/\s*\((eds?\.?|editors?|ed\. by)\)/gi, '').replace(/ and /g, ' & ');
      else tekija = ennen.replace(/ and /g, ' & ');
      const jalk = rivi(attr.textContent.split(i.textContent)[1] || '');
      const j = /^\.?\s*([^:]+):\s*([^,]+),\s*(\d{4})/.exec(jalk);
      if (j) { paikka = rivi(j[1]); kustantaja = rivi(j[2]); vuosi = j[3]; }
      doi = ((/doi\.org\/(10\.11647\/[^\s"<]+)/i.exec(attr.innerHTML) || [])[1] || '').replace(/[.,]$/, '');
    }
    const cc = oik && [...oik.querySelectorAll('#mainwin a[href*="creativecommons.org"]')][0];
    const ccm = cc && /(licenses|publicdomain)\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    if (ccm) oikeus = { teksti: 'CC ' + ccm[2].toUpperCase() + ' ' + ccm[3], lahde: 'https://creativecommons.org/' + ccm[1] + '/' + ccm[2] + '/' + ccm[3] + '/' };
    const maar = [], laskuri = { n: 0 }, el = document.createElement('div');
    let osa = false, luettu = 0;
    valitut.forEach((x, i) => {
      const d = x.t === tama ? document : docs[i];
      const s = d && d.getElementById('mainwin');
      if (!s) return;
      const k = s.cloneNode(true);
      k.querySelectorAll('script, style, a[id^="IndexMarker"], a[id^="TextAnchor"]').forEach(y => { if (!rivi(y.textContent)) y.remove(); });
      // Luvun loppuviitteet.
      k.querySelectorAll('a[role="doc-noteref"], a[epub\\:type="noteref"]').forEach(a => {
        let li = null;
        try { li = k.querySelector('[id="' + CSS.escape(a.getAttribute('href').replace(/^.*#/, '')) + '"]'); } catch (e) {}
        let t = '';
        if (li) {
          const c = li.cloneNode(true);
          c.querySelectorAll('a[role="doc-backlink"]').forEach(y => y.remove());
          kkLinkit(c, /^https?:\/\/books\.openbookpublishers\.com\//i);
          t = muunna(c.innerHTML, 'inlined').trim();
        }
        let kohta = a;
        while (/^(SUP|SPAN)$/.test(kohta.parentElement.tagName) && rivi(kohta.parentElement.textContent) === rivi(a.textContent)) kohta = kohta.parentElement;
        if (!t) { kohta.remove(); return; }
        const tunnus = 'ob' + (++laskuri.n);
        kohta.replaceWith(merkki(tunnus));
        maar.push(maaritelma(tunnus, t));
      });
      k.querySelectorAll('[role="doc-endnotes"], section[epub\\:type="endnotes"], hr[class*="HorizontalRule"]').forEach(y => y.remove());
      // Luvun ©-rivi: toimitetussa kirjassa luvun tekijä kappaleeksi.
      let lukutekija = '';
      k.querySelectorAll('p.doi').forEach(p => {
        const t = /©\s*\d{4}\s+(.+?),\s*CC\b/.exec(rivi(p.textContent));
        const n = t ? rivi(t[1]).replace(/ and /g, ' & ') : '';
        if (n && n !== tekija && n !== toimittaja) lukutekija = rivi(t[1]);
        p.remove();
      });
      // Otsikon rivinvaihto on taitto (Classifying Global<br/>Catastrophic Risks); kaksoispiste on lähteessä, kun se kuuluu otsikkoon.
      k.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => { h.querySelectorAll('br').forEach(b => b.replaceWith(' ')); h.textContent = rivi(h.textContent); });
      // InDesignin näkymättömät asettelutaulukot (kuvaruudukot) soluiksi, muut taulukot ruudukoksi; yläindeksien luokat pois
      // (Latomo muuntaa vain paljaan <sup>:n).
      k.querySelectorAll('table.actually-invisible-table').forEach(t => t.replaceWith(...[...t.querySelectorAll('td, th')].flatMap(c => [...c.childNodes])));
      k.querySelectorAll('table').forEach(t => { if (!t.querySelector('th')) ojsTaulukko(t); });
      k.querySelectorAll('sup, sub').forEach(x => [...x.attributes].forEach(a => x.removeAttribute(a.name)));
      kkLinkit(k, /^https?:\/\/books\.openbookpublishers\.com\//i);
      if (!kkSanoja(k)) return;
      luettu++;
      const onOsa = /^part/i.test(x.t) || /^part\s+[ivxlc\d]+\b/i.test(x.nimi);
      if (onOsa) osa = true;
      else if (!/^ch/i.test(x.t)) osa = false;
      const syv = valitut.length === 1 ? 1 : onOsa || !osa ? 1 : 2;
      kkSiirra(k, syv);
      const h = k.querySelector(OTSIKOT);
      if (lukutekija && h) { const p = document.createElement('p'); p.textContent = lukutekija; h.after(p); }
      el.append(...k.childNodes);
    });
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    el.normalize();
    const nimi = kirja || rivi(document.title.split(' - ')[0]);
    const pilkku = nimi.indexOf(': ');
    return { html: irrota([el]).innerHTML, otsikko: pilkku > 0 ? nimi.slice(0, pilkku) : nimi, alaotsikko: pilkku > 0 ? nimi.slice(pilkku + 2) : '',
      tekija, toimittaja, paikka, kustantaja, julkaistu: vuosi, doi, sivusto: OBP_NIMI, lahde: juuri + 'contents.xhtml', maar, oikeus,
      naytto: OBP_NIMI + (luettu > 1 ? ' (' + luettu + ' sivua)' : '') };
  }

  /* Faded Page (fadedpage.com, Distributed Proofreaders Canadan kirjat; käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 9:
     koko kirja HTML:nä, lisenssi- ja ylläpitotekstit pois). Kirjan HTML-muoto (books/<pid>/html.php, avautuu kirjan sivun
     HTML-linkistä link.php:n kautta istuntoevästeellä) on fpgen-ohjelman tuottama yksi sivu: alussa DPC:n otsake (ehdot,
     *Title:*, *Author:*, *Date of first publication:*, *Faded Page eBook #N*, tekijät, lähde) ja viiva hr.pbk, sitten kansi,
     nimiö, sisällys- ja kuvaluettelotaulukot, luvut (div > h1, alaotsikko span.sub-head <br/>:n perässä), sivunumerot
     span.pageno, alaviitteet a[href=#fN] → div.footnote (taulukko: div.footnote-id#fN ja teksti), runot div.lgc/lgl/lgp p.line,
     lopussa hakemisto (sivunumerolinkit), *Transcriber’s Notes* ja *[The end of …]*. Leikkeeseen ensimmäisestä h1:stä alkaen
     (otsake, kansi ja nimiö pois) ilman sisällystä, kuvaluetteloa, hakemistoa, ylläpitäjän huomautuksia ja loppuriviä;
     sivunumerot pois; runon säkeet riveiksi ja tyhjä rivi säkeistön rajaksi. Tiedot DC-metoista (DC.Title, DC.Creator,
     DC.Created) ja otsakkeen riveistä (Translator). Oikeudet: Kanadan public domain (otsakkeen lause). Ei mainoksia eikä
     lahjoituspyyntöä. Readability antoi otsakkeen, sisällyksen ja hakemiston mukana, alaviitteet taulukkoina (raakaa HTML:ää
     748) ja tekijän puuttuessa. Mitattu 17.11.2026. */
  const FP_NIMI = 'Faded Page';
  async function fadedpage() {
    const m = /^\/books\/(\d+)\//.exec(location.pathname);
    if (!/(^|\.)fadedpage\.com$/i.test(location.hostname) || !m) return null;
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(x => rivi(x.content)).filter(Boolean);
    const el = document.body.cloneNode(true);
    el.querySelectorAll('script, style, noscript, span.pageno, img').forEach(x => x.remove());
    // Otsakkeen rivit (Title:, Author:, Translator:) ennen kuin ne poistetaan.
    const otsake = {};
    el.querySelectorAll('p.line').forEach(p => { const t = /^([A-Za-z ’']+):\s*(.+)$/.exec(rivi(p.textContent)); if (t && !otsake[t[1].toLowerCase()]) otsake[t[1].toLowerCase()] = t[2]; });
    const pd = [...el.querySelectorAll('p')].map(p => rivi(p.textContent)).find(t => /public domain/i.test(t) && t.length < 300);
    // Alaviitteet.
    const maar = [], laskuri = { n: 0 }, viit = new Map();
    el.querySelectorAll('div.footnote').forEach(f => {
      // fpgen 4.6x: div.footnote-id#f1; 4.4x: div#f1 ilman luokkaa.
      const id = f.querySelector('.footnote-id[id]') || f.querySelector('td [id^="f"]');
      const solut = f.querySelectorAll('td');
      const sisalto = solut.length > 1 ? solut[solut.length - 1] : f;
      if (id) viit.set(id.id, sisalto);
    });
    el.querySelectorAll('a[href^="#f"]').forEach(a => {
      const s = viit.get(a.getAttribute('href').slice(1));
      if (!s) return;
      const c = s.cloneNode(true);
      c.querySelectorAll('a[href^="#"]').forEach(x => x.replaceWith(...x.childNodes));
      const t = muunna(c.innerHTML, 'inlined').trim();
      if (!t) { a.remove(); return; }
      const tunnus = 'fp' + (++laskuri.n);
      a.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('div.footnote, hr.footnotemark, a[id^="r"]').forEach(x => { if (x.tagName !== 'A' || !rivi(x.textContent)) x.remove(); });
    // Ensimmäistä otsikkoa edeltävä (otsake, kansi, nimiö) pois.
    const ots = [...el.querySelectorAll('h1, h2, h3')];
    const lohko = h => { let x = h; while (x.parentElement && x.parentElement !== el) x = x.parentElement; return x; };
    if (ots.length) { const raja = lohko(ots[0]); while (el.firstChild && el.firstChild !== raja) el.firstChild.remove(); }
    // Sisällys, kuvaluettelo, hakemisto ja ylläpitäjän huomautukset otsikosta seuraavaan otsikkoon.
    const POIS = /^(contents|table of contents|list of illustrations|illustrations|list of plates|index|transcriber[’']?s notes?:?|table des matières|tabl[ae] .*cynnwys|cynnwys)$/i;
    [...el.querySelectorAll('h1, h2, h3, p')].forEach(h => {
      if (!el.contains(h) || (h.tagName === 'P' && !/^transcriber/i.test(rivi(h.textContent)))) return;
      if (!POIS.test(rivi(h.textContent))) return;
      const alku = lohko(h);
      let x = alku.nextSibling;
      alku.remove();
      while (x && !(x.nodeType === 1 && (x.querySelector && x.querySelector('h1, h2') || /^H[12]$/.test(x.tagName)))) { const s = x.nextSibling; x.remove(); x = s; }
    });
    [...el.querySelectorAll('p')].forEach(p => { if (/^\[the end of .*\]$/i.test(rivi(p.textContent))) p.remove(); });
    // Runot: säkeet riveiksi, tyhjä rivi säkeistön rajaksi.
    el.querySelectorAll('div.lgc, div.lgl, div.lgp').forEach(d => {
      const ryhmat = [[]];
      d.querySelectorAll('p.line').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' '))) { if (ryhmat[ryhmat.length - 1].length) ryhmat.push([]); } else ryhmat[ryhmat.length - 1].push(p); });
      const uudet = ryhmat.filter(r => r.length).map(r => { const p = document.createElement('p'); r.forEach((x, i) => { if (i) p.appendChild(document.createElement('br')); p.append(...x.childNodes); }); return p; });
      if (uudet.length) d.replaceWith(...uudet);
    });
    el.querySelectorAll('h1, h2, h3, h4').forEach(h => { h.textContent = kkOtsikkoTeksti(h); });
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' ')) && !p.querySelector('hr')) p.remove(); });
    el.querySelectorAll('span.it').forEach(s => { const i = document.createElement('em'); i.append(...s.childNodes); s.replaceWith(i); });
    el.querySelectorAll('span.bold').forEach(s => { const i = document.createElement('strong'); i.append(...s.childNodes); s.replaceWith(i); });
    el.querySelectorAll('table').forEach(t => { if (!t.querySelector('th')) ojsTaulukko(t); });
    el.querySelectorAll('sup, sub').forEach(x => [...x.attributes].forEach(a => x.removeAttribute(a.name)));
    kkLinkit(el, /^https?:\/\/(www\.)?fadedpage\.com\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const nimi = s => rivi(s).replace(/,?\s*\(?\d{4}\s*-\s*\d{0,4}\)?\s*$/, '').replace(/,\s*$/, '');
    const tekijat = meta('DC.Creator').length ? meta('DC.Creator') : otsake.author ? [nimi(otsake.author)] : [];
    const kaantaja = otsake.translator ? nimi(otsake.translator) : '';
    return { html: irrota([el]).innerHTML, otsikko: meta('DC.Title')[0] || otsake.title || rivi(document.title).replace(/^The Distributed Proofreaders Canada eBook of\s*/i, ''),
      tekija: kkLuettelo(tekijat.map(nimi)), suomentaja: kaantaja ? kkKaantaja([kaantaja]) : '', julkaistu: meta('DC.Created')[0] || (/\d{4}/.exec(otsake['date of first publication'] || '') || [''])[0],
      sivusto: FP_NIMI, lahde: location.origin + '/showbook.php?pid=' + m[1], maar,
      oikeus: pd ? { teksti: pd.replace(/\s*IF THE BOOK.*$/i, ''), lahde: location.origin + '/showbook.php?pid=' + m[1] } : null };
  }

  /* Internet Archiven tekstiversiot (archive.org/stream/<id>/<id>_djvu.txt ja /download/…_djvu.txt; käyttäjän pyyntö 17.11.2026,
     pahvin *20 sivustosovitetta* 10: kappaleet OCR-pötköstä, toistuvat ylä- ja alatunnisteet ja rivinvaihtojen tavutukset pois).
     Sivu on yksi <pre>: rivit päättyvät välilyöntiin, kappaleiden välissä tyhjä rivi, sivunvaihdon kohdalla kaksi tai useampia
     tyhjiä rivejä, ja sivun alussa juokseva otsake sivunumeroineen (TRANSLATORS PREFACE. Xlll). Readability antoi koko kirjan
     koodilohkona. Kokoaminen: sivut tyhjien rivien ryppäistä; sivun ensimmäinen yksirivinen lohko on ylätunniste, kun siinä on
     sivunumero alussa tai lopussa tai sama teksti (kirjaimet) aloittaa vähintään kolme sivua; viimeinen yksirivinen lohko on
     alatunniste, kun se on pelkkä numero tai arkkimerkki (B 2); sivun ensimmäinen kappale jatkaa edellistä, kun se alkaa pienellä
     kirjaimella tai edellinen on pitkä (≥ 150 merkkiä) eikä pääty virkkeen loppuun; rivinvaihdon tavuviiva pois, kun rivi jatkuu pienellä kirjaimella;
     kahdet välilyönnit yhdeksi; pois lohkot, joissa on alle kolme kirjainta tai alle puolet kirjaimia (OCR-roska). Otsikoita ei
     päätellä. Tiedot /metadata/<id>-rajapinnasta (title, creator, date, publisher, licenseurl). Internet Archive pyytää
     lahjoituksia, ei mainoksia. Mitattu 17.11.2026. */
  const IA_NIMI = 'Internet Archive';
  async function archiveTeksti() {
    const m = /^\/(?:stream|download)\/([^/]+)\/.*_djvu\.txt$/i.exec(decodeURIComponent(location.pathname));
    const pre = document.querySelector('main pre, body > pre, pre');
    if (!/(^|\.)archive\.org$/i.test(location.hostname) || !m || !pre) return null;
    const t = pre.textContent.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/ /g, ' ');
    if (t.length < 500) return null;
    // Sivunumero otsakkeen alussa tai lopussa OCR:n kirjoittamana (Xlll, XXX1U, 12) pois ennen vertailua.
    const NRO = /^[\dIVXLCivxlcUuJjl.,]{1,7}$/;
    const kanta = r => { const o = r.split(/\s+/); if (o.length > 1 && NRO.test(o[0])) o.shift(); if (o.length > 1 && NRO.test(o[o.length - 1])) o.pop(); return o.join(' '); };
    const avain = s => kanta(s).replace(/[^\p{L}]/gu, '').toUpperCase();
    const sivut = t.split(/\n{3,}/).map(s => s.split(/\n{2}/).map(b => b.split('\n').map(r => r.trim()).filter(Boolean)).filter(b => b.length));
    const alut = new Map();
    sivut.forEach(s => { if (s[0] && s[0].length === 1) { const k = avain(s[0][0]); if (k) alut.set(k, (alut.get(k) || 0) + 1); } });
    const NUMERO = /^[\divxlcIVXLC]{1,7}$/;
    const kpl = [];
    let jatkuu = false;
    sivut.forEach(s => {
      if (s.length && s[0].length === 1 && s[0][0].length <= 80) {
        const r = s[0][0];
        const k = kanta(r);
        if (NUMERO.test(r) || (k !== r && k === k.toUpperCase() && /\p{L}/u.test(k)) || (alut.get(avain(r)) || 0) >= 3) s.shift();
      }
      const loppu = s[s.length - 1];
      if (loppu && loppu.length === 1 && loppu[0].length <= 12 && /\d/.test(loppu[0]) && /^[\dA-Z .,*]+$/.test(loppu[0])) s.pop();
      s.forEach((b, i) => {
        const teksti = b.reduce((a, r) => !a ? r : /[\p{L}]-$/u.test(a) && /^\p{Ll}/u.test(r) ? a.slice(0, -1) + r : a + ' ' + r, '').replace(/ {2,}/g, ' ').trim();
        const kirjaimia = (teksti.match(/\p{L}/gu) || []).length;
        if (kirjaimia < 3 || kirjaimia < teksti.length * 0.5) return;
        // Sivun alku jatkaa edellistä kappaletta: pieni alkukirjain tai pitkä kappale ilman virkkeen loppua (nimiön lyhyet rivit eivät).
        const ed = kpl[kpl.length - 1] || '';
        if (!i && jatkuu && ed && (/^\p{Ll}/u.test(teksti) || ed.length >= 150 && !/[.!?:”"’»)\]]$/.test(ed) && /^\p{L}/u.test(teksti))) {
          const e = kpl[kpl.length - 1];
          kpl[kpl.length - 1] = /[\p{L}]-$/u.test(e) && /^\p{Ll}/u.test(teksti) ? e.slice(0, -1) + teksti : e + ' ' + teksti;
        } else kpl.push(teksti);
      });
      jatkuu = true;
    });
    if (kpl.length < 3) return null;
    const el = document.createElement('div');
    kpl.forEach(x => { const p = document.createElement('p'); p.textContent = x; el.appendChild(p); });
    const md = ((await pbJson(location.origin + '/metadata/' + encodeURIComponent(m[1]))) || {}).metadata || {};
    const lista = x => (Array.isArray(x) ? x : x ? [x] : []).map(rivi).filter(Boolean);
    const otsikko = lista(md.title)[0] || rivi(((document.querySelector('h1 a') || {}).textContent) || document.title);
    const lisenssi = lista(md.licenseurl)[0];
    const cc = lisenssi && /(licenses|publicdomain)\/([a-z-]+)\/(\d\.\d)/i.exec(lisenssi);
    return { html: el.innerHTML, otsikko, tekija: kkLuettelo(lista(md.creator)), julkaistu: (/\d{4}/.exec(lista(md.date)[0] || '') || [''])[0],
      kustantaja: lista(md.publisher)[0] || '', sivusto: IA_NIMI, lahde: location.origin + '/details/' + m[1],
      oikeus: lisenssi ? { teksti: cc ? (cc[1] === 'publicdomain' ? (cc[2] === 'zero' ? 'CC0 ' + cc[3] : 'Public Domain Mark ' + cc[3]) : 'CC ' + cc[2].toUpperCase() + ' ' + cc[3]) : lisenssi, lahde: lisenssi } : null,
      naytto: IA_NIMI + ' (OCR-teksti)' };
  }

  /* Folger Shakespeare (folger.edu/explore/shakespeares-works/<näytelmä>/read/ koko näytelmä tai /read/<näytös>/<kohtaus>/; käyttäjän
     pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 12: puhuja repliikin alkuun, näytös-, kohtaus- ja rivinumerot säilyvät).
     Teksti .fdt-text-container: litteä jono, jossa div.fdt-act-break > .fdt-act-header (ACT 1, laitoksen merkit ⟨⟩),
     div.fdt-scene-break > .fdt-scene-header, span.fdt-speaker-container (puhuja), span.fdt-stage-direction (centered: oma rivinsä,
     muuten repliikin sisällä), span.fdt-ftln-number (Folgerin juokseva rivinumero 0001), span.fdt-line-number (kohtauksen
     rivinumero joka viidennellä rivillä), rivit <br>:llä ja div.fdt-page-number (p. 7). Readability liimasi rivinumerot sanoihin
     (5He.), jätti FTLN-numerot ja sivunumerot eikä antanut näytös- ja kohtausotsikoita. Näytös ##, kohtaus ###, puhuja
     lihavoituna repliikin alkuun, säkeet riveiksi, kohtauksen rivinumero yläindeksinä rivin alkuun, näyttämöohjeet kursiivina,
     FTLN ja sivunumerot pois, synopsis alkuun. Tekijä William Shakespeare (osoitteen osa shakespeares-works); toimittajia ja
     lisenssiä sivulla ei mainita. Lahjoituslinkki, ei mainoksia. Mitattu 17.11.2026. */
  async function folger() {
    const runko = document.querySelector('.fdt-text-container');
    if (!/(^|\.)folger\.edu$/i.test(location.hostname) || !/\/shakespeares-works\/[^/]+\/read\//.test(location.pathname) || !runko) return null;
    const el = document.createElement('div');
    let kpl = null, rivilla = false;
    const ulos = () => { if (kpl && rivi(kpl.textContent)) el.appendChild(kpl); kpl = null; rivilla = false; };
    const uusi = () => { if (!kpl) { kpl = document.createElement('p'); rivilla = false; } return kpl; };
    const lisaa = n => { const p = uusi(); p.appendChild(n); rivilla = true; };
    // kurs: kursiivinen jakso (laulut ja kirjeet span.italic), jonka sisällä on rivejä, rivinumeroita ja <br>:iä.
    const kay = (solmu, kurs = false) => {
      for (const n of [...solmu.childNodes]) {
        if (n.nodeType === 3) {
          const t = n.textContent.replace(/\s+/g, ' ');
          if (!rivi(t)) continue;
          const x = document.createTextNode(rivilla ? t : t.replace(/^\s+/, ''));
          if (kurs) { const i = document.createElement('em'); i.appendChild(x); lisaa(i); } else lisaa(x);
          continue;
        }
        if (n.nodeType !== 1 || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.tagName)) continue;
        const c = n.classList;
        if (c.contains('fdt-page-number') || c.contains('fdt-page-break') || c.contains('fdt-ftln-number') || c.contains('fdt-indent-inline') || c.contains('fdt-alignment-spacing') || n.tagName === 'A' && !n.getAttribute('href')) continue;
        if (c.contains('fdt-act-header') || c.contains('fdt-scene-header')) {
          ulos();
          const h = document.createElement(c.contains('fdt-act-header') ? 'h2' : 'h3');
          h.textContent = rivi(n.textContent);
          el.appendChild(h);
          continue;
        }
        if (c.contains('fdt-speaker-container')) {
          ulos();
          const b = document.createElement('strong'); b.textContent = rivi(n.textContent);
          uusi().appendChild(b); kpl.append(' '); rivilla = false;
          continue;
        }
        // Näyttämöohje kursiivina; pitkässä ohjeessa (Hamletin pantomiimi) on omia rivejään numeroineen, joten sisältö käydään läpi.
        if (c.contains('fdt-stage-direction')) {
          const oma = c.contains('centered') || c.contains('right') || !kpl;
          if (oma) ulos();
          kay(n, true);
          if (oma) ulos();
          continue;
        }
        if (c.contains('fdt-line-number')) {
          const t = rivi(n.textContent);
          if (t) { const s = document.createElement('sup'); s.textContent = t; uusi().append(s, ' '); }
          continue;
        }
        if (n.tagName === 'BR') {
          if (kpl && rivilla) { kpl.appendChild(document.createElement('br')); rivilla = false; }
          else if (kpl && !rivilla && kpl.lastChild && kpl.lastChild.nodeName === 'BR') ulos();
          continue;
        }
        // Synopsis (p.synopsis: jäsennin sulkee sen sisemmän <p>:n kohdalla, joten kappaleet ovat sisaruksia) otsikoksi.
        if (n.matches('p.synopsis')) { ulos(); const h = document.createElement('h2'); h.textContent = rivi(n.textContent).replace(/:$/, '') || 'Synopsis'; el.appendChild(h); continue; }
        if (n.tagName === 'P') { ulos(); kay(n, kurs); ulos(); continue; }
        kay(n, kurs || /^(I|EM)$/.test(n.tagName) || c.contains('italic'));
      }
    };
    kay(runko);
    ulos();
    // Vierekkäiset kursiivit (näyttämöohjeen osat ja laitoksen merkit ⟨⟩) yhdeksi: *a**b* olisi Markdownissa lihavointi.
    el.querySelectorAll('p').forEach(p => {
      for (let n = p.firstChild; n; ) {
        const seur = n.nextSibling;
        if (n.nodeName === 'EM') {
          let x = seur;
          const vali = [];
          while (x && x.nodeType === 3 && !rivi(x.textContent)) { vali.push(x); x = x.nextSibling; }
          if (x && x.nodeName === 'EM') { n.append(...vali, ...x.childNodes); x.remove(); continue; }
        }
        n = seur;
      }
    });
    // Rivin lopun <br> pois kappaleen lopusta.
    el.querySelectorAll('p').forEach(p => { while (p.lastChild && (p.lastChild.nodeName === 'BR' || p.lastChild.nodeType === 3 && !rivi(p.lastChild.textContent))) p.lastChild.remove(); });
    if (kkSanoja(el) < 50) return null;
    const otsikko = rivi(document.title.split(/\s+[-|]\s+/)[0]) || rivi((document.querySelector('h1') || {}).textContent);
    const osa = rivi((document.title.split(/\s+-\s+/)[1] || '').split('|')[0]);
    return { html: irrota([el]).innerHTML, otsikko: osa && !/^entire play$/i.test(osa) ? otsikko + ', ' + osa : otsikko, tekija: 'William Shakespeare',
      sivusto: 'Folger Shakespeare Library', lahde: osoite };
  }

  /* Gwern.net (käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 16: reunahuomautukset alaviitteiksi, ponnahdukset ja
     metatietolaatikot pois). Runko #markdownBody (Pandoc): tiivistelmä div.abstract > blockquote, alaviitteet a.footnote-ref →
     section#footnotes li#fnN (sivu näyttää ne reunahuomautuksina ja ponnahduksina), päivämäärät span.date-range, jossa
     alaindeksinä etäisyys nykyhetkeen (2006<sub>20ya</sub>, välin pituus <sub>10y</sub>), hinnat span.inflation-adjusted
     (nykyarvo, alkuperäinen yläindeksinä ja vuosi alaindeksinä), lopussa sivuston kokoamat Bibliography-, Backlinks- ja
     Similar Links -osiot. Readability jätti alaviitteet linkeiksi (alaviitteitä 0) ja alaindeksit raa'aksi HTML:ksi (478).
     Alaviitteet alaviitteiksi ilman paluulinkkiä; päivämääristä etäisyys pois; hinnasta *$49.16 ($30 vuonna 2006)*; koostetut
     osiot ja metatietolaatikko (tunnisteet, tila, varmuus, tärkeys) pois; sivuston sisäiset linkit tekstiksi. Kuvaus
     (.page-description) jätetään pois kuten Psychen ingressi. Etukenttään tekijä Gwern Branwen ja päivämäärävälin alku.
     Patreon-tukipyyntö, ei mainoksia. Mitattu 17.11.2026. */
  async function gwern() {
    const runko = document.getElementById('markdownBody');
    if (!/(^|\.)gwern\.net$/i.test(location.hostname) || !runko) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('script, style, noscript, #link-bibliography-section, #backlinks-section, #similars-section, .aux-links-append, ' +
      '.sidenote-column, #sidenote-column-left, #sidenote-column-right, .footnote-back, button').forEach(x => x.remove());
    // Päivämäärä: etäisyys nykyhetkeen (<sub>) pois, välin viiva (<sup>–</sup>) tekstiksi.
    el.querySelectorAll('.date-range').forEach(d => {
      d.querySelectorAll('.subsup').forEach(s => s.replaceWith(rivi((s.querySelector('sup') || {}).textContent || '')));
      d.querySelectorAll('sub').forEach(s => s.remove());
      d.replaceWith(rivi(d.textContent));
    });
    el.querySelectorAll('.inflation-adjusted').forEach(x => {
      const nyt = rivi(x.firstChild && x.firstChild.nodeType === 3 ? x.firstChild.textContent : ''), vuosi = x.getAttribute('data-year-original'), alk = x.getAttribute('data-amount-original');
      x.replaceWith(nyt && alk && vuosi ? nyt + ' ($' + alk + ' vuonna ' + vuosi + ')' : rivi(x.textContent));
    });
    el.querySelectorAll('.subsup').forEach(s => s.replaceWith(rivi(s.textContent)));
    const maar = [], laskuri = { n: 0 };
    el.querySelectorAll('a.footnote-ref[href^="#"]').forEach(a => {
      let li = null;
      try { li = el.querySelector('[id="' + CSS.escape(a.getAttribute('href').slice(1)) + '"]') || document.getElementById(a.getAttribute('href').slice(1)); } catch (e) {}
      let t = '';
      if (li) {
        const c = li.cloneNode(true);
        c.querySelectorAll('a.footnote-back, a[role="doc-backlink"]').forEach(x => x.remove());
        c.querySelectorAll('a[href^="#"]').forEach(x => x.replaceWith(...x.childNodes));
        kkLinkit(c, /^https?:\/\/(www\.)?gwern\.net\//i);
        t = muunna(c.innerHTML, 'inlined').trim();
      }
      if (!t) { a.remove(); return; }
      const tunnus = 'gw' + (++laskuri.n);
      a.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    el.querySelectorAll('section#footnotes, section.footnotes').forEach(x => x.remove());
    // Lainauksen yläindeksiviittaus (<sup><a …>1</a></sup>) tekstiksi ja ylä- ja alaindeksit ilman attribuutteja (Latomo muuntaa vain paljaan).
    el.querySelectorAll('sup, sub').forEach(x => { [...x.attributes].forEach(at => x.removeAttribute(at.name)); if (x.children.length) x.textContent = x.textContent; });
    // Otsikoiden ankkurilinkit ja sivuston sisäiset linkit tekstiksi.
    kkLinkit(el, /^https?:\/\/(www\.)?gwern\.net\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const pv = /\d{4}-\d\d-\d\d/.exec(rivi((document.querySelector('.page-date-range') || {}).textContent));
    return { html: irrota([el]).innerHTML, otsikko: rivi((document.querySelector('header h1, h1') || {}).textContent) || rivi(document.title),
      tekija: 'Gwern Branwen', sivusto: 'Gwern.net', julkaistu: pv ? pv[0] : '', lahde: osoite, maar };
  }

  /* Los Angeles Review of Books (lareviewofbooks.org/article/…; käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 17:
     arvioitavan teoksen tiedot metatiedoiksi, alaviitteet). Next.js, CSS-moduulien luokat tiivisteineen (styles-module__ttejmq__
     interstitial), joten valitsimet ovat loppuosan mukaan ([class*="__interstitial"]). Artikkeli [class*="__articleInner"]:
     otsake [class*="__header"] (h1, h2 alaotsikko, h3: By Tekijä ja päiväys), kirjatiedot [class*="__interstitial"]
     (kappale per kirja: Nimi by Tekijä. Kustantaja, vuosi. sivut. ja Bookshop-linkki), tukipyyntö [class*="__cta"], leipäteksti
     p/blockquote[class*="__body"] <br>:ien välissä, osanvaihto ¤, lopussa tekijän esittely (LARB Contributor), jakonapit ja
     suositukset. Readability antoi tekijäksi Buy on Bookshop.org, pirstoi kirjatiedot riveiksi ja otti tukipyynnön mukaan.
     Kirjatiedot lihavoituina kappaleina tekstin alkuun (kuten NDPR), Bookshop-linkit, tukipyyntö, jakonapit ja suositukset
     pois; ¤ osanvaihdoksi; tyhjät lainaukset pois; tekijän esittely loppuun. Alaviitteet samanSivunViitteet()-muodoissa
     (tarkistetuissa 25 artikkelissa ei ollut yhtään). Lahjoituspyyntö, ei mainoksia. Mitattu 17.11.2026. */
  async function larb() {
    const a = document.querySelector('[class*="__articleInner"]');
    if (!/(^|\.)lareviewofbooks\.org$/i.test(location.hostname) || !a) return null;
    const el = document.createElement('div');
    // Kirjatiedot.
    const kirjat = a.querySelector(':scope > [class*="__interstitial"]:not([class*="__articleShare"])');
    if (kirjat && !/LARB Contributor/i.test(kirjat.textContent)) {
      kirjat.querySelectorAll('p').forEach(p => {
        const k = p.cloneNode(true);
        k.querySelectorAll('[class*="__affiliateLink"], a[href*="bookshop.org"], br').forEach(x => x.remove());
        if (!rivi(k.textContent)) return;
        const u = document.createElement('p'), b = document.createElement('strong');
        b.append(...k.childNodes); u.appendChild(b); el.appendChild(u);
      });
      if (el.children.length) el.appendChild(document.createElement('hr'));
    }
    let bio = null;
    [...a.children].forEach(c => {
      const luokka = String(c.className || '');
      if (/__header|__cta|__card|__articleShare|__suggested|__bookshopCta/.test(luokka) || c === kirjat || c.tagName === 'BR') return;
      if (/__interstitial/.test(luokka)) { if (/LARB Contributor/i.test(c.textContent)) bio = c; return; }
      const k = c.cloneNode(true);
      if (/^(P|BLOCKQUOTE)$/.test(k.tagName) && /^\s*(¤|⁂|\*\s*\*\s*\*)\s*$/.test(k.textContent)) { el.appendChild(document.createElement('hr')); return; }
      if (!rivi(k.textContent) && !k.querySelector('img')) return;
      el.appendChild(k);
    });
    // Peräkkäiset lainaukset (yksi kappale kukin) yhdeksi.
    el.querySelectorAll('blockquote + blockquote').forEach(q => { const e = q.previousElementSibling; if (e && e.tagName === 'BLOCKQUOTE') { const p = document.createElement('p'); p.append(...q.childNodes); e.appendChild(p); q.remove(); } });
    el.querySelectorAll('blockquote').forEach(q => { if (!q.querySelector('p')) { const p = document.createElement('p'); p.append(...q.childNodes); q.appendChild(p); } });
    if (bio) {
      const h = document.createElement('h2'); h.textContent = 'LARB Contributor'; el.appendChild(h);
      bio.querySelectorAll('p').forEach(p => { if (!/^LARB Contributor$/i.test(rivi(p.textContent))) el.appendChild(p.cloneNode(true)); });
    }
    const maar = samanSivunViitteet(el, 'la');
    el.querySelectorAll('img, figure').forEach(x => x.remove());
    el.querySelectorAll('[class]').forEach(x => x.removeAttribute('class'));
    kkLinkit(el, /^https?:\/\/(www\.)?lareviewofbooks\.org\/(?!article\/)/i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const ots = a.querySelector('[class*="__header"]') || a;
    const h3 = ots.querySelector('h3');
    const tekijat = h3 ? [...h3.querySelectorAll('a[href*="/contributor/"]')].map(x => rivi(x.textContent)) : [];
    const pvm = h3 ? [...h3.querySelectorAll('span')].map(x => rivi(x.textContent)).find(t => /\b\d{4}$/.test(t)) : '';
    const d = pvm && new Date(pvm + ' 12:00 UTC');
    return { html: irrota([el]).innerHTML, otsikko: rivi((ots.querySelector('h1') || {}).textContent) || rivi(document.title),
      alaotsikko: rivi((ots.querySelector('h2') || {}).textContent), tekija: kkLuettelo(tekijat), sivusto: 'Los Angeles Review of Books',
      julkaistu: d && !isNaN(d) ? d.toISOString().slice(0, 10) : '', lahde: osoite, maar };
  }

  /* 3:16 (3-16am.co.uk, Richard Marshallin filosofihaastattelut; käyttäjän pyyntö 17.11.2026, pahvin *20 sivustosovitetta* 20:
     kysymykset ja vastaukset erotettava). Site123-alusta: haastattelu .s123-editor (kappaleet), alussa Interview by …, kuva,
     kursiiviset nostolainaukset (kokonaan <em>-kappaleet ennen esittelyä), esittely ja sitten vuorot <strong>3:16:</strong> kysymys
     / <strong>Nimi:</strong> vastaus. Readability otti murupolun ja nostolainaukset eikä erottanut kysymystä vastauksesta muuten
     kuin puhujan nimellä, eikä tekijää tullut. Kysymys kokonaan lihavoiduksi kappaleeksi (pahvi: lihavoituna), nostolainaukset ja
     Interview by -rivi pois (haastattelija alaotsikkoon: Richard Marshall interviews X), tekijäksi haastateltava (ensimmäinen
     muu puhuja kuin 3:16). Päiväystä sivulla ei ole. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 17.11.2026. */
  async function tri16() {
    const runko = document.querySelector('.s123-page-data-articles .s123-editor, .s123-editor');
    if (!/(^|\.)3-16am\.co\.uk$/i.test(location.hostname) || !runko) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('img, script, style').forEach(x => x.remove());
    let haastattelija = '';
    const kpl = [...el.children];
    // Alku: Interview by … ja kokonaan kursiiviset nostolainaukset ennen ensimmäistä tavallista kappaletta.
    for (const p of kpl) {
      const t = rivi(p.textContent);
      if (!t) { p.remove(); continue; }
      const ib = /^interview by\s+(.+)$/i.exec(t);
      if (ib) { haastattelija = ib[1]; p.remove(); continue; }
      const kurs = [...p.querySelectorAll('em, i')].reduce((n, x) => n + rivi(x.textContent).length, 0);
      if (kurs >= t.length * 0.9) { p.remove(); continue; }
      break;
    }
    let haastateltava = '';
    el.querySelectorAll('p').forEach(p => {
      const s = p.querySelector('strong, b');
      if (!s || !rivi(p.textContent).startsWith(rivi(s.textContent))) return;
      const puhuja = rivi(s.textContent).replace(/:$/, '');
      if (/^3:16$/.test(puhuja)) {
        const b = document.createElement('strong');
        b.append(...p.childNodes);
        b.querySelectorAll('strong, b').forEach(x => x.replaceWith(...x.childNodes));
        p.appendChild(b);
      } else if (!haastateltava && /:$/.test(rivi(s.textContent)) && puhuja.split(/\s+/).length >= 2 && puhuja.length < 60) haastateltava = puhuja;
    });
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent)) p.remove(); });
    kkLinkit(el, /^https?:\/\/(www\.)?3-16am\.co\.uk\//i);
    if (kkSanoja(el) < 100) return null;
    const otsikko = rivi((document.querySelector('h1.s123-page-header, h1') || {}).textContent) || rivi(document.title);
    return { html: irrota([el]).innerHTML, otsikko, tekija: haastateltava,
      alaotsikko: haastattelija && haastateltava ? haastattelija + ' interviews ' + haastateltava : '', sivusto: '3:16', lahde: osoite };
  }

  /* EUR-Lex: unionin tuomioistuimen tuomiot ja julkisasiamiesten ratkaisuehdotukset (käyttäjän pyyntö 18.11.2026, pahvin
     *10 sivustosovitetta* 1A). Asiakirja on Publications Officen XHTML:ää, sama EUR-Lexin TXT/HTML-sivulla, portaalisivun
     #document1:ssä ja Cellarissa (publications.europa.eu/resource/celex/…), joten tunnistus on rakenteesta: p.sum-title-1 ja
     numeroitu kappale p.count#pointN. Kaksi muotoa: vanha (luokat sellaisinaan) ja uusi coj- (2017–), jossa sama rakenne
     etuliitteellä; etuliite poistetaan ensin. Kappaleet ovat kaksisarakkeisia asettelutaulukoita (numero vasemmalla, teksti
     oikealla p.normal-kappaleina, lainaukset ja luettelot sisäkkäisinä taulukoina), joita Readability ei purkanut (604–906
     raa'an HTML:n jäännettä) ja alaviitteet (span.note > a#c-… ↔ p.note > a#t-… viivan alla) jäivät irrallisiksi.
     Taulukot puretaan sisimmästä alkaen: kappalenumero yläindeksiksi kappaleen alkuun (kuten Perseuksen pykälät), ajatusviiva
     luettelon kohdaksi, muu tunnus ((a), (63), 1.) tekstin alkuun. Väliotsikot (taulukon ulkopuolella) p.sum-title-1 luvuiksi
     ja p.title-grseq-N niiden alle, ratkaisuehdotuksen vanhan muodon otsikot (I – <b>Introduction</b>) numeroinnin mukaan; sisällysluettelo
     (p.NTOC) ja allekirjoitukset pois. Alaviitemerkin sulkeet pois; päiväysrivin viite (oikeudenkäyntikieli) on otsikon viite.
     Otsake (p.sum-title-1: tuomioistuin ja kokoonpano, julkisasiamies, päivä) etukenttään: laji (Judgment of the Court
     (Grand Chamber), Opinion of Advocate General Bot), julkaistu ja numero (asianumero, C‑362/14); otsikoksi asianosaiset.
     Asianumero myös lajin perään, koska lähdeviite näyttää numeron vain teoksen kanssa. Avainsanarivi (p.index) jää tavalliseksi
     kappaleeksi: kursiivina Latomo lukisi sen alaotsikoksi. Portaalisivulla ne tulevat WT.z_docTitle-metasta (kielen mukaan: Unionin tuomioistuimen tuomio (suuri jaosto) 6.10.2015.#
     Maximillian Schrems vastaan …#…), muuten tekstistä. Menettelyn kuvaus jää tekstiin.
     Ei mainoksia eikä lahjoituspyyntöä (EU:n julkaisutoimisto). AWS WAF haastaa toistuvat haut (myös curlin); selain ratkaisee
     haasteen itse. Mitattu 18.11.2026. */
  const EU_NIMI = 'EUR-Lex';
  const EU_KUUKAUDET = { en: EN_KUUKAUDET, fi: ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    de: ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'],
    sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'] };
  function euPvm(s) {
    s = rivi(s).toLowerCase();
    let m = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s);
    if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    m = /(\d{1,2})\.?\s+(?:päivänä\s+)?(\p{L}+)\s+(\d{4})/u.exec(s);
    if (m) for (const kk of Object.values(EU_KUUKAUDET)) {
      const i = kk.findIndex(k => m[2] === k || m[2] === k + 'kuuta');
      if (i >= 0) return m[3] + '-' + String(i + 1).padStart(2, '0') + '-' + m[1].padStart(2, '0');
    }
    return (/\b(19|20)\d\d\b/.exec(s) || [''])[0];
  }
  // Versaalit pieniksi (JUDGMENT OF THE COURT (Grand Chamber) → Judgment of the Court (Grand Chamber)); englannin
  // instituutioiden nimet isolla kuten EUR-Lexin otsikoissa.
  function euVirke(rivit) {
    // Julkisasiamiehen nimi omana rivinään (BOT) nimenä.
    let s = rivit.map((r, i) => i && /^[\p{Lu}\s.'’-]+$/u.test(r) && r.split(/\s+/).length <= 3 ? r.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase()) : r).join(' ');
    s = rivi(s).replace(/\p{Lu}{2,}/gu, w => w.toLowerCase());
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s.replace(/\b(court|general court|advocate general|civil service tribunal)\b/g, w => w.replace(/\b\w/g, c => c.toUpperCase()));
  }
  function euTaulukot(el) {
    // Sisimmästä alkaen, jotta solun sisältö on jo purettu.
    [...el.querySelectorAll('table')].reverse().forEach(t => {
      const pala = document.createDocumentFragment();
      let lista = null;
      t.querySelectorAll(':scope > tr, :scope > tbody > tr').forEach(tr => {
        const solut = [...tr.children].filter(x => x.tagName === 'TD');
        if (!solut.length) return;
        const v = solut.length > 1 ? solut[0] : null, o = solut[solut.length - 1];
        const tunnus = v ? rivi(v.textContent) : '';
        const sisalto = [...o.childNodes];
        if (!sisalto.some(n => rivi(n.textContent))) return;
        if (/^[—–•-]$/.test(tunnus)) {
          if (!lista) { lista = document.createElement('ul'); pala.appendChild(lista); }
          const li = document.createElement('li');
          li.append(...sisalto);
          // Yksi kappale kohdassa ilman p:tä (muuten löysä luettelo tyhjin rivein).
          const lp = [...li.children];
          if (lp.length === 1 && lp[0].tagName === 'P') lp[0].replaceWith(...lp[0].childNodes);
          lista.appendChild(li);
          return;
        }
        lista = null;
        if (tunnus) {
          // Ensimmäinen kappale saa tunnuksen alkuunsa; kappalenumero (p.count#pointN) yläindeksinä.
          let p = sisalto.find(n => n.nodeType === 1 && n.tagName === 'P');
          if (!p || sisalto.find(n => n.nodeType === 1) !== p) { p = document.createElement('p'); pala.appendChild(p); }
          const piste = v.querySelector('[id^="point"]');
          if (piste) { const sup = document.createElement('sup'); sup.textContent = tunnus.replace(/\.$/, ''); p.prepend(sup, ' '); }
          else p.prepend(tunnus + ' ');
        }
        pala.append(...sisalto);
      });
      t.replaceWith(pala);
    });
  }
  async function eurlex() {
    // Juuri: ensimmäisen otsakerivin vanhempi (portaalissa #document1:n div[lang], TXT/HTML-sivulla body).
    const ens = document.querySelector('p.sum-title-1, p.coj-sum-title-1'), juuri = ens && ens.parentElement;
    if (!juuri || !juuri.querySelector('p.count[id^="point"], p.coj-count[id^="point"]')) return null;
    const el = juuri.cloneNode(true);
    el.querySelectorAll('[class]').forEach(x => x.setAttribute('class', x.getAttribute('class').replace(/\bcoj-/g, '')));
    el.querySelectorAll('script, style, link, meta, .signaturecase, [class^="signatory"]').forEach(x => x.remove());
    // TXT/HTML-sivun XHTML text/html-tyyppinä: tyhjä <a id="judgment"/> jää auki, ja jäsennin kopioi sen seuraaviin kappaleisiin
    // ja siirtää ensimmäisen alaviitemerkin ulos span.notesta. Kääreet pois ja tyhjät span.notet pois.
    el.querySelectorAll('a[id]:not([href])').forEach(a => a.replaceWith(...a.childNodes));
    el.querySelectorAll('span.note').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
    el.normalize();
    // Sisällysluettelo (coj: Table of contents ja p.NTOC1… taulukossa) pois.
    el.querySelectorAll('p[class^="NTOC"]').forEach(p => {
      const t = p.closest('table');
      if (!t) return p.remove();
      const ed = t.previousElementSibling;
      if (ed && ed.matches('p.sum-title-1') && !ed.querySelector('.bold')) ed.remove();
      t.remove();
    });
    el.querySelectorAll('table').forEach(t => { if (el.contains(t) && !rivi(t.textContent)) t.remove(); });
    // Alaviitteet: p.note viivan alla, merkki span.note > a[href="#t-…"] sulkeissa.
    const maar = [], laskuri = { n: 0 };
    let otsikkoMerkit = '';
    const huomit = [...el.querySelectorAll('p.note')];
    el.querySelectorAll('a[href^="#t-"]').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const kohde = huomit.find(p => p.querySelector('a[id="' + id + '"]'));
      const span = a.parentElement.matches('span.note') && rivi(a.parentElement.textContent) === rivi(a.textContent) ? a.parentElement : a;
      if (!kohde || !el.contains(span) || huomit.includes(span.closest('p'))) return;
      const osat = [kohde];
      for (let n = kohde.nextElementSibling; n && n.matches('p.note, p.normal, table') && !n.querySelector('span.note > a[id]'); n = n.nextElementSibling) osat.push(n);
      const k = document.createElement('div');
      osat.forEach(x => k.appendChild(x.cloneNode(true)));
      k.querySelectorAll('span.note, a[id^="t-"]').forEach(x => x.remove());
      k.querySelectorAll('span.bold').forEach(b => { const s = document.createElement('strong'); s.append(...b.childNodes); b.replaceWith(s); });
      k.querySelectorAll('span.italic').forEach(b => { const s = document.createElement('em'); s.append(...b.childNodes); b.replaceWith(s); });
      euTaulukot(k);
      kkLinkit(k, /^https?:\/\/([a-z0-9-]+\.)*europa\.eu\//i);
      const t = muunna(k.innerHTML, 'inlined').trim().replace(/^\\?\(\s*\\?\)\s*/, '');
      // Sulkeet merkin ympäriltä: … 2013, (<span>2</span>)‘[t]ransfers → … 2013,[^2] ‘[t]ransfers.
      const ed = span.previousSibling, seur = span.nextSibling;
      let vali = false;
      if (ed && ed.nodeType === 3 && /\(\s*$/.test(ed.data)) { vali = /\s\(\s*$/.test(ed.data); ed.data = ed.data.replace(/\s*\(\s*$/, ''); }
      if (seur && seur.nodeType === 3 && /^\s*\)/.test(seur.data)) seur.data = seur.data.replace(/^\s*\)/, '');
      if (!t) { span.remove(); return; }
      const tunnus = 'eu' + (++laskuri.n);
      maar.push(maaritelma(tunnus, t));
      if (span.closest('p.sum-title-1')) { otsikkoMerkit += 'XLUINVIITE' + tunnus + 'X'; span.remove(); return; }
      span.replaceWith(merkki(tunnus));
      if (vali && seur && seur.nodeType === 3 && /^[^\s.,;:)\]’”»]/.test(seur.data)) seur.data = ' ' + seur.data;
    });
    huomit.forEach(p => p.remove());
    el.querySelectorAll('hr.note').forEach(x => x.remove());
    // Otsake: alun p.sum-title-1-rivit (tuomioistuin ja kokoonpano tai julkisasiamies, päivä) ja ratkaisuehdotuksen p.subtitle.
    const otsake = [];
    for (let n = el.firstElementChild; n && n.matches('p.sum-title-1, a:empty'); n = el.firstElementChild) { if (n.tagName === 'P') otsake.push(rivi(n.textContent)); n.remove(); }
    el.querySelectorAll('br').forEach(x => x.replaceWith(' '));
    const alaots = [...el.querySelectorAll('p.subtitle')];
    const pvmRivi = otsake.find(x => /\d{4}/.test(x)) || '';
    // Asianosaiset: ratkaisuehdotuksessa p.subtitle-rivit asianumeron jälkeen, tuomiossa lihavoidut kappaleet ennen kokoonpanoa.
    let osapuolet = '';
    if (alaots.length) {
      // Case C‑362/14, asianosaiset, (Request for a preliminary ruling from …): pyyntö yhdeksi kappaleeksi.
      const r = alaots.map(p => rivi(p.textContent)), i = r.findIndex(x => /^\(/.test(x));
      osapuolet = r.slice(1, i < 0 ? r.length : i).join(' ').replace(/,\s*$/, '');
      if (i >= 0) { const u = document.createElement('p'); u.textContent = r.slice(i).join(' '); alaots[i].before(u); }
      alaots.forEach(p => p.remove());
    } else {
      const kpl = [...el.children].slice(0, 40);
      const i = kpl.findIndex(p => p.matches('p.normal') && /\b[CTF][‑-]\d+\/\d\d\b/.test(p.textContent));
      const rivit = [];
      for (const p of kpl.slice(i + 1)) {
        if (p.matches('p.pnormal')) { rivit.push(rivi(p.textContent)); continue; }
        if (!p.matches('p.normal')) break;
        // Lihavoidulla nimellä alkava kappale (Meta Platforms Inc., formerly Facebook Inc.,).
        const b = p.querySelector('.bold');
        if (b && rivi(p.textContent).startsWith(rivi(b.textContent))) rivit.push(rivi(p.textContent));
        else if (rivit.length && /^\p{Ll}/u.test(rivi(p.textContent)) && rivi(p.textContent).length < 60) rivit.push(rivi(p.textContent));
        else if (rivit.length) break;
      }
      osapuolet = rivit.join(' ').replace(/,\s*$/, '');
    }
    const numerot = [...new Set(((rivi(el.textContent).slice(0, 3000).match(/\b[CTF][‑-]\d+\/\d\d\b(?:\s*P)?/g)) || []).slice(0, 6))];
    // Portaalisivun metatiedot: Laji päiväys.#Asianosaiset.#…
    const wt = rivi((document.querySelector('meta[name="WT.z_docTitle"]') || {}).content).split('#').map(x => rivi(x).replace(/\.$/, ''));
    const laji = wt.length > 1 ? wt[0].replace(/\s+(?:\p{Ll}+\s+){0,2}\d{1,2}[.\s].*$/u, '') : euVirke(otsake.filter(x => x !== pvmRivi));
    const otsikko = (wt.length > 1 ? wt[1] : osapuolet) || laji;
    const julkaistu = euPvm(wt.length > 1 ? wt[0] : pvmRivi);
    // Väliotsikot: taulukoiden ulkopuoliset p.sum-title-1 (Judgment, Introduction, Analysis) luvuiksi ja p.title-grseq-N
    // niiden alle. Pienellä alkava (suomeksi … seuraavan / tuomion) jää lihavoiduksi kappaleeksi.
    el.querySelectorAll('p[class^="title-grseq-"], p.sum-title-1').forEach(p => {
      if (p.closest('table')) return;
      const n = /grseq-(\d)/.exec(p.className);
      if (!n && /^\p{Ll}/u.test(rivi(p.textContent))) { const u = document.createElement('p'), b = document.createElement('strong'); b.textContent = rivi(p.textContent); u.appendChild(b); p.replaceWith(u); return; }
      const h = document.createElement('h' + Math.min(6, Math.max(2, n ? +n[1] + 1 : 2)));
      h.textContent = rivi(p.textContent);
      p.replaceWith(h);
    });
    // Ratkaisuehdotuksen vanha muoto: otsikko kappaleena (I – <b>Introduction</b>, A – <i>…</i>).
    [...el.children].forEach(p => {
      if (!p.matches('p.normal')) return;
      const t = rivi(p.textContent), m = /^([IVXLC]+|[A-Z]|\d+|[a-z]|\([a-z0-9]+\))\s*[.–—-]?\s+\S/.exec(t);
      const kor = [...p.querySelectorAll('.bold, .italic')].reduce((s, x) => s + rivi(x.textContent).length, 0);
      if (!m || t.length > 200 || kor < (t.length - m[1].length) * 0.7) return;
      const taso = /^[IVXLC]+$/.test(m[1]) && m[1] !== 'C' ? 2 : /^[A-Z]$/.test(m[1]) ? 3 : /^\d+$/.test(m[1]) ? 4 : 5;
      const h = document.createElement('h' + taso);
      h.textContent = t;
      p.replaceWith(h);
    });
    euTaulukot(el);
    // Peräkkäiset luettelotaulukot yhdeksi luetteloksi.
    el.querySelectorAll('ul + ul').forEach(u => { const e = u.previousElementSibling; if (e && e.tagName === 'UL') { e.append(...u.childNodes); u.remove(); } });
    el.querySelectorAll('span.bold').forEach(b => { const s = document.createElement('strong'); s.append(...b.childNodes); b.replaceWith(s); });
    el.querySelectorAll('span.italic').forEach(b => { const s = document.createElement('em'); s.append(...b.childNodes); b.replaceWith(s); });
    el.querySelectorAll(OTSIKOT).forEach(h => h.querySelectorAll('strong, em').forEach(b => b.replaceWith(...b.childNodes)));
    el.querySelectorAll('p').forEach(p => { if (/^\[(signatures|allekirjoitukset|unterschriften|signatures?)\]$/i.test(rivi(p.textContent))) p.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*europa\.eu\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const numero = numerot.join(', ').replace(/‑/g, '-');
    // Asianumero myös lajiin, koska lähdeviite näyttää numeron vain teoksen perässä.
    return { html: irrota([el]).innerHTML, otsikko, laji: [laji, numero].filter(Boolean).join(', '), numero, julkaistu,
      sivusto: EU_NIMI, lahde: osoite, maar, otsikkoMerkit };
  }

  /* Find Case Law (The National Archives, caselaw.nationalarchives.gov.uk; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta*
     1B): Englannin ja Walesin sekä Yhdistyneen kuningaskunnan tuomioistuinten ratkaisut LegalDocML:stä renderöitynä. Tunnistus
     rakenteesta: article.judgment, header.judgment-header ja section.judgment-body. Kappale on section.judgment-body__section#para_N
     (span.judgment-body__number 1. ja div), alakohdat sisäkkäisiä section.judgment-body__nested-section-elementtejä ((a)), väliotsikot
     numerottomia section#lvl_N-kappaleita (kokonaan kursiivi, lihavoitu tai alleviivattu) tai numeroituja, joiden ainoa kappale
     on korostettu ja numero kursiivina (1. Introduction, (1) …: tasot numeron muodosta), ja numerottomat section-kappaleet ilman
     id:tä ovat alkuperäisen sisennettyjä lainauksia. Readability antoi tekstin ilman otsaketta, mutta numerot jäivät omiksi
     riveikseen ennen kappaletta (1. ja (a) yksinään), väliotsikot korostetuiksi kappaleiksi ja lainsäädäntölinkit viitelinkeiksi
     (EWCA Civ 2022/379: 123), eikä tuomioistuinta, päivää ja numeroa tullut.
     Kappalenumero yläindeksiksi kuten EUR-Lexissä, alakohdan tunnus tekstin alkuun, numerottomat lainaukset ja blockquote
     lainauksiksi, puhujarivi (LADY SIMLER (with whom …):) lihavoituna kappaleena. Otsake pois: etukenttään laji (tuomioistuin ja
     neutraali viite, [2024] UKSC 12, sekä numero), julkaistu (.judgment-header__date: JUDGMENT GIVEN ON 17 April 2024, Date: 24 March
     2022) ja otsikoksi asianosaiset sivun nimestä (Secretary of State for Business and Trade v Mercer). Alaviitteitä tarkistetuissa
     ratkaisuissa ei ollut; # -merkit menevät samanSivunViitteet()-muodoissa. Lainsäädäntölinkit (legislation.gov.uk) ja muiden
     ratkaisujen linkit tekstiksi. Ei mainoksia eikä lahjoituspyyntöä (kansallisarkisto). Mitattu 18.11.2026. */
  const FCL_NIMI = 'Find Case Law';
  const FCL_TUOMIOISTUIN = { UKSC: 'Supreme Court', UKPC: 'Privy Council', 'EWCA Civ': 'Court of Appeal (Civil Division)',
    'EWCA Crim': 'Court of Appeal (Criminal Division)', EWHC: 'High Court', EAT: 'Employment Appeal Tribunal', UKUT: 'Upper Tribunal',
    UKFTT: 'First-tier Tribunal', EWCOP: 'Court of Protection', EWFC: 'Family Court', UKIPTrib: 'Investigatory Powers Tribunal' };
  const FCL_OSASTO = { KB: "King's Bench Division", QB: "Queen's Bench Division", Ch: 'Chancery Division', Fam: 'Family Division',
    Admin: 'Administrative Court', Comm: 'Commercial Court', Pat: 'Patents Court', TCC: 'Technology and Construction Court',
    IPEC: 'Intellectual Property Enterprise Court', Admlty: 'Admiralty Court', SCCO: 'Senior Courts Costs Office', Mercantile: 'Mercantile Court' };
  async function findcaselaw() {
    const art = document.querySelector('article.judgment'), runko = art && art.querySelector('section.judgment-body');
    if (!runko || !art.querySelector('header.judgment-header') || !runko.querySelector('.judgment-body__number')) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('img, script, style').forEach(x => x.remove());
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    el.querySelectorAll('span:not([class])').forEach(x => x.replaceWith(...x.childNodes));
    // Kokonaan korostettu lyhyt kappale (kursiivi, lihavoitu, alleviivattu).
    const korostettu = p => {
      const t = rivi(p.textContent);
      if (!t || t.length > 200) return false;
      const k = [...p.querySelectorAll('b, strong, i, em, u')].filter(x => !x.parentElement.closest('b, strong, i, em, u'));
      // Otsikko ei pääty virkkeeseen eikä lainaukseen (hand-down-ilmoitus, kursiivinen lainattu kysymys ’).
      if (t.length > 120 || /[.!’”:;,]$/.test(t) && !/^[\p{Lu}\s()&’'-]+:$/u.test(t) && !(/:$/.test(t) && p.querySelector('b, strong'))) return false;
      return k.reduce((n, x) => n + rivi(x.textContent).length, 0) >= t.replace(/\s/g, '').length * 0.9 - 2 || k.reduce((n, x) => n + x.textContent.replace(/\s/g, '').length, 0) >= t.replace(/\s/g, '').length;
    };
    // Numeroidut kappaleet ja alakohdat sisimmästä alkaen.
    [...el.querySelectorAll('section')].reverse().forEach(s => {
      if (s === el) return;
      const nro = [...s.children].find(x => x.matches('span.judgment-body__number'));
      const pala = document.createDocumentFragment();
      if (nro) {
        const t = rivi(nro.textContent), div = [...s.children].find(x => x.tagName === 'DIV');
        const sisalto = div ? [...div.childNodes] : [...s.childNodes].filter(x => x !== nro);
        // Numeroitu väliotsikko (Rwanda-tuomio: kursiivinen 1. Introduction, (1) The nature of …): ainoa kappale korostettu.
        const lapset = sisalto.filter(n => n.nodeType === 1);
        // Ei lainauksen sisällä (numeroton id:tön section) eikä ilman sanoja ((a) … poistosta).
        const lainauksessa = s.parentElement && s.parentElement.closest('section:not([id]):not([class]), blockquote');
        if (t && !lainauksessa && lapset.length === 1 && lapset[0].tagName === 'P' && /\p{L}{2}/u.test(lapset[0].textContent) && korostettu(lapset[0]) && (nro.querySelector('i, b, u, em, strong') || !/[.:;,]$/.test(rivi(lapset[0].textContent)) && rivi(lapset[0].textContent).length < 100)) {
          const h = document.createElement('h' + (/^\(?[ivxl]+\)/.test(t) ? 4 : /^\(/.test(t) ? 3 : 2));
          h.textContent = t + ' ' + rivi(lapset[0].textContent);
          s.replaceWith(h);
          return;
        }
        let p = sisalto.find(n => n.nodeType === 1);
        if (!p || p.tagName !== 'P') { p = document.createElement('p'); pala.appendChild(p); }
        if (t && s.matches('.judgment-body__section') && /^\d+[a-z]?\.?$/i.test(t)) { const sup = document.createElement('sup'); sup.textContent = t.replace(/\.$/, ''); p.prepend(sup, ' '); }
        else if (t) p.prepend(t + ' ');
        pala.append(...sisalto);
        s.replaceWith(pala);
        return;
      }
      // Numeroton: väliotsikot (#lvl_N) tai sisennetty lainaus.
      const kpl = [...s.children];
      if (s.id || kpl.some(p => p.tagName === 'P' && korostettu(p))) {
        kpl.forEach(p => {
          if (p.tagName !== 'P' || !korostettu(p)) return pala.appendChild(p);
          const t = rivi(p.textContent);
          if (/:$/.test(t) && p.querySelector('b, strong')) { const u = document.createElement('p'), b = document.createElement('strong'); b.textContent = t; u.appendChild(b); return pala.appendChild(u); }
          const h = document.createElement('h2'); h.textContent = t; pala.appendChild(h);
        });
      } else {
        const q = document.createElement('blockquote');
        q.append(...s.childNodes);
        pala.appendChild(q);
      }
      s.replaceWith(pala);
    });
    // Peräkkäiset lainaukset yhdeksi.
    el.querySelectorAll('blockquote + blockquote').forEach(q => { const e = q.previousElementSibling; if (e && e.tagName === 'BLOCKQUOTE') { e.append(...q.childNodes); q.remove(); } });
    el.querySelectorAll('blockquote blockquote').forEach(q => q.replaceWith(...q.childNodes));
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent)) p.remove(); });
    el.querySelectorAll('sup').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
    const maar = samanSivunViitteet(el, 'fc');
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*(nationalarchives\.gov\.uk|legislation\.gov\.uk)\//i);
    if (kkSanoja(el) < 100) return null;
    const otsake = art.querySelector('header.judgment-header');
    const ncnEl = otsake.querySelector('.judgment-header__neutral-citation');
    const ncn = rivi((ncnEl && (ncnEl.querySelector('.ncn-nowrap') || ncnEl) || {}).textContent).replace(/^.*?(\[\d{4}\][^\]]*?\d+(?:\s*\([A-Za-z]+\))?).*$/, '$1');
    const k = /^\[\d{4}\]\s+([A-Za-z]+(?:\s+(?:Civ|Crim))?)\s+\d+(?:\s*\(([A-Za-z]+)\))?/.exec(ncn);
    const tuom = k ? [FCL_TUOMIOISTUIN[k[1]] || '', k[2] && FCL_OSASTO[k[2]] ? '(' + FCL_OSASTO[k[2]] + ')' : ''].filter(Boolean).join(' ') : '';
    const pvm = /(\d{1,2})(?:st|nd|rd|th)?\s+(\p{L}+)\s+(\d{4})/u.exec(rivi((otsake.querySelector('.judgment-header__date') || {}).textContent));
    const kk = pvm ? EN_KUUKAUDET.indexOf(pvm[2].toLowerCase()) : -1;
    const otsikko = rivi(document.title).replace(/\s+-\s+Find Case Law.*$/i, '') || ncn;
    return { html: irrota([el]).innerHTML, otsikko, laji: [tuom, ncn].filter(Boolean).join(', '), numero: ncn,
      julkaistu: kk >= 0 ? pvm[3] + '-' + String(kk + 1).padStart(2, '0') + '-' + pvm[1].padStart(2, '0') : '', sivusto: FCL_NIMI, lahde: osoite, maar };
  }

  /* PubMed Central (pmc.ncbi.nlm.nih.gov; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 2: alusta, kaikki avoimet
     lääketieteen artikkelit samana JATS-HTML:nä, myös Medical Historyn kaltaiset humanistiset lehdet). Tunnistus rakenteesta ja
     metatiedoista: section.main-article-body ja citation_journal_title. Runko: section.abstract (h2, kwd-group), hr.headless,
     tekstin osiot h2.pmc_sec_title, kuvat figure (figcaption), taulukot section.tw (h4.obj_head Table 1., .caption, table),
     alaviitteet a[href="#fnN"] > sup → section.fn-group div.fn#fnN (sup ja p.display-inline), kirjallisuus section.ref-list
     ul > li (span.label, cite, [DOI] [PubMed] [Google Scholar]). Readability antoi tekstin, mutta alaviitteet jäivät loppuun
     irrallisiksi numeroiksi ja tekstiksi, merkit viitelinkeiksi (Medical History: 130 viitelinkkiä), eikä tekijää, lehteä ja
     päivää tullut. Alaviitteet samanSivunViitteet()-muodossa (tyhjä Footnotes-osio pois), lähdeviittaukset ([8] → #cit0008;
     tekijä–vuosi ilman APA-pilkkua, 21.11.2026) ja
     taulukko- ja kuvaviittaukset tekstiksi, kirjallisuuden kohdat kappaleiksi (md.js:n p.bib) ilman hakulinkkejä, kuvista
     kuvateksti kursiivikappaleena, taulukko ruudukoksi (ojsTaulukko) otsikkoineen. Etukenttään kuten OJS:ssä: tyyppi
     tieteellinen, tekijät (citation_author), teos (lehti), numero (vuosikerta:numero), sivut, julkaistu (citation_publication_date
     2024 Nov 25), doi ja lisenssi (Copyright and License -paneelin CC-linkki). Ei mainoksia eikä lahjoituspyyntöä (NLM).
     Kontti sai reCAPTCHA-sivun (Checking your browser) noin neljännestä peräkkäisestä hausta; NCBI Bookshelf antoi sen heti,
     joten Bookshelf on testaamatta. Mitattu 18.11.2026. */
  /* Numeroidut lähdeviittaukset (Vancouver; käyttäjän pyyntö 20.11.2026, J Cell Mol Med: yläindeksit <a><sup>2</sup></a>,
     Polish J Radiol: hakasulut [<a>4</a>-<a>6</a>]) alaviitteiksi, joissa on viitatun kirjallisuuden kohdan teksti numeroineen:
     muuten ne jäivät tekstiin numeroiksi, joista ei päässyt viitteeseen. Saman kohdan vierekkäiset viittaukset (2, 4; 4-6)
     ovat yksi alaviite, kohdat omina kappaleinaan, kuten Latomon ryhmitaViitteet(); väliviiva tuo välin kohdat. Sama ryhmä
     käyttää samaa tunnusta. Kirjallisuusluettelo jää loppuun. Tekijä–vuosi-viittaukset (Medical History) eivät ole numeroita. */
  // Asetukset (Springer Nature ja PLOS, 21.11.2026; oletus PMC): lista = kirjallisuuden kohtien valitsin, nro(li) = kohdan
  // numero, kohde(k) = viittauksen kohde-elementistä kohta (tai null), teksti(li) = kohdan HTML, etu = alaviitteen tunnuksen alku.
  function pmcNumeroviitteet(el, o = {}) {
    const lista = o.lista || '.ref-list li';
    const kohde = o.kohde || (k => k.matches(lista) ? k : null);
    // Numero linkin tekstistä; hakasulkeet saavat olla linkin sisällä (22.11.2026, PLoS Medicine PMC2910600: taulukon rivi
    // Berkman et al., 2004 <a>[37]</a>; 140 viittausta jäi tekstiksi [37], kun leipätekstin [<a>37</a>] toimi).
    const numero = a => rivi(a.textContent).replace(/^\[(\d{1,4})\]$/, '$1');
    const kohta = a => {
      if (!/^\d{1,4}$/.test(numero(a))) return null;
      let k = null;
      try { k = el.querySelector('[id="' + CSS.escape(a.getAttribute('href').slice(1)) + '"]'); } catch (e) {}
      return k && kohde(k);
    };
    const nroOf = o.nro || (li => rivi((li.querySelector(':scope > .label') || {}).textContent || '').replace(/\.$/, ''));
    const luettelo = new Map();
    el.querySelectorAll(lista).forEach(li => {
      const n = nroOf(li);
      if (/^\d+$/.test(n)) luettelo.set(n, li);
    });
    // Kohdan teksti: cite tai kohta ilman numeroa ja hakulinkkejä.
    const teksti = o.teksti || (li => {
      const k = (li.querySelector('cite') || li).cloneNode(true);
      k.querySelectorAll(':scope > .label').forEach(x => x.remove());
      k.querySelectorAll('a').forEach(a => { if (/^(doi|pubmed|google scholar|pmc free article|crossref|europe pmc)$/i.test(rivi(a.textContent))) a.remove(); });
      k.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', a.href));
      return k.innerHTML.replace(/\s*\[\s*\]/g, '').trim();
    });
    const merkit = [...el.querySelectorAll('a[href^="#"]')].filter(a => kohta(a));
    const kaytetty = new Set(), tunnukset = new Map(), maar = [];
    // Merkin ulkoin kääre: sup, jossa ei ole muuta.
    const kaare = a => a.parentElement.tagName === 'SUP' && rivi(a.parentElement.textContent) === rivi(a.textContent) ? a.parentElement : a;
    for (const a of merkit) {
      if (kaytetty.has(a)) continue;
      const ryhma = [a], erot = [];
      let n = kaare(a);
      // Seuraava solmu on pilkku, puolipiste tai väliviiva ja sen jälkeen seuraava merkki (myös saman supin sisällä).
      for (;;) {
        const v = n.nextSibling, s = v && v.nodeType === 3 ? v.nextSibling : v;
        const ero = v && v.nodeType === 3 ? v.textContent : '';
        if (!s || s.nodeType !== 1 || !/^\s*([,;]|[-–‐])?\s*$/.test(ero)) break;
        const b = s.tagName === 'A' ? s : s.tagName === 'SUP' && s.children.length === 1 && s.firstElementChild.tagName === 'A' && rivi(s.textContent) === rivi(s.firstElementChild.textContent) ? s.firstElementChild : null;
        if (!b || !merkit.includes(b)) break;
        ryhma.push(b); erot.push(ero.trim()); n = kaare(b);
      }
      ryhma.forEach(x => kaytetty.add(x));
      // Numerot, väliviivan väli täytettynä luettelon numeroilla.
      const nrot = [];
      ryhma.forEach((x, i) => {
        const nro = numero(x);
        if (i && /[-–‐]/.test(erot[i - 1])) for (let j = +numero(ryhma[i - 1]) + 1; j < +nro; j++) if (luettelo.has(String(j))) nrot.push(String(j));
        nrot.push(nro);
      });
      const kohdat = [...new Set(nrot)].map(x => [x, luettelo.get(x) || kohta(ryhma.find(r => numero(r) === x))]).filter(x => x[1]);
      const avain = kohdat.map(x => x[0]).join(',');
      if (!tunnukset.has(avain)) {
        const t = (o.etu || 'pmv') + (tunnukset.size + 1);
        const md = muunna(kohdat.map(([x, li]) => '<p>' + x + '. ' + teksti(li) + '</p>').join(''), 'inlined').trim();
        tunnukset.set(avain, t);
        maar.push(maaritelma(t, md));
      }
      // Korvataan ensimmäisestä viimeiseen merkkiin; hakasulut tai sulut ympäriltä ja niitä edeltävä välilyönti pois.
      const alku = kaare(ryhma[0]), loppu = kaare(ryhma[ryhma.length - 1]);
      let ens = alku, vik = loppu;
      const yla = alku.parentElement;
      if (yla === loppu.parentElement && yla.tagName === 'SUP' && !alku.previousSibling && !loppu.nextSibling) ens = vik = yla;
      const ed = ens.previousSibling, jal = vik.nextSibling;
      if (ed && ed.nodeType === 3 && jal && jal.nodeType === 3 && /[[(]\s*$/.test(ed.textContent) && /^\s*[\])]/.test(jal.textContent) &&
        '[('.indexOf(ed.textContent.trim().slice(-1)) === '])'.indexOf(jal.textContent.trim()[0])) {
        ed.textContent = ed.textContent.replace(/\s*[[(]\s*$/, '');
        jal.textContent = jal.textContent.replace(/^\s*[\])]/, '');
      } else if (ed && ed.nodeType === 3 && /^\[.*\]$/.test(rivi(ryhma[0].textContent))) ed.textContent = ed.textContent.replace(/\s+$/, '');
      const r = document.createRange();
      r.setStartBefore(ens); r.setEndAfter(vik);
      r.deleteContents();
      r.insertNode(merkki(tunnukset.get(avain)));
    }
    return maar;
  }
  /* Lehden nimi (22.11.2026): citation_journal_title on NLM:n luettelon pienaakkosmuoto (The New England journal of medicine,
     JAMA network open, The Lancet. Public health), joka näkyi lähdeviitteessä sellaisenaan. Sivun lyhenne (N Engl J Med, JAMA
     Netw Open) kirjoittaa merkitsevät sanat isolla ja nimen sanojen järjestyksessä (ISO 4): sana, jonka kirjaimiin seuraava
     lyhenteen osa sopii samasta alkukirjaimesta (Engl → England, Netw → Network, Natl → National, J → Journal), käyttää sen ja
     saa ison alkukirjaimen; of, the ja and jäävät, koska niitä ei lyhenteessä ole. Ilman lyhennettä ennallaan. */
  function pmcLehti(nimi, lyh) {
    const pelkka = w => w.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    const osat = (lyh || '').split(/[\s.]+/).filter(w => /^\p{Lu}/u.test(w)).map(pelkka);
    if (!nimi || !osat.length) return nimi;
    const sopii = (w, k) => { if (w[0] !== k[0]) return false; let i = 0; for (const c of w) if (c === k[i]) i++; return i === k.length; };
    let j = 0;
    return nimi.replace(/\p{L}[\p{L}'’-]*/gu, w => {
      if (j >= osat.length || !sopii(pelkka(w), osat[j])) return w;
      j++;
      return /^\p{Ll}/u.test(w) ? w[0].toUpperCase() + w.slice(1) : w;
    });
  }
  async function pmc() {
    const runko = document.querySelector('section.main-article-body');
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    if (!runko || !meta('citation_journal_title').length) return null;
    const el = runko.cloneNode(true);
    // Kuvana julkaistu taulukko (section.tw ilman <table>ia; datasta ei ole tekstiversiota, Europe PMC:n XML:ssäkin vain <graphic>):
    // merkitään ennen kuvien poistoa, jotta kuvatekstin perään tulee huomautus eikä se jää selityksettä.
    el.querySelectorAll('section.tw').forEach(w => { if (!w.querySelector('table') && w.querySelector('img')) w.dataset.kuvana = '1'; });
    // Toimituksen esittelylause (PLoS: otsikoton, lyhyt section.abstract viivan takana) pois, kun varsinainen tiivistelmä on:
    // se toistaa johdannon tai tiivistelmän ja teki tiivistelmästä ja johdannosta kolme osanvaihtojen kohtaa.
    const abst = [...el.querySelectorAll('section.abstract')];
    if (abst.some(a => a.querySelector('h2, h3'))) abst.forEach(a => { if (!a.querySelector('h2, h3') && rivi(a.textContent).length < 300) a.remove(); });
    el.querySelectorAll('script, style, button, img, .pmc-permalink, .back-to-top, .d-buttons, .tileshop, [hidden], section.associated-data').forEach(x => x.remove());
    // Anfangi (NEJM PMC7616851: <strong>F</strong><span class="font-variant-small-caps">or more …) tekstiksi: muuten **F**or.
    el.querySelectorAll('p > strong:first-child, p > b:first-child').forEach(b => {
      const n = b.nextSibling, e = b.previousSibling;
      if (/^\p{L}$/u.test(rivi(b.textContent)) && !(e && rivi(e.textContent)) && n && /^\p{L}/u.test(n.textContent)) b.replaceWith(rivi(b.textContent));
    });
    // Tiivistelmän ja tekstin välinen viiva (hr.headless) ilman tiivistelmää (Dtsch Ärztebl:n kuvatapaus PMC12442802, 22.11.2026)
    // olisi Luinissa osanvaihto heti otsikon alla: viiva, jota ei edellä teksti, pois.
    el.querySelectorAll('hr').forEach(h => { const r = document.createRange(); r.setStart(el, 0); r.setEndBefore(h); if (!rivi(r.toString())) h.remove(); });
    el.querySelectorAll('.media sup').forEach(s => s.replaceWith(s.textContent));
    const vmaar = pmcNumeroviitteet(el);
    // Lähdeviittaukset (#cit0008, #R1, #B12) ja taulukko- ja kuvaviittaukset tekstiksi ennen alaviitteitä.
    const nimiot = new Map();
    el.querySelectorAll('a[href^="#"]').forEach(a => {
      let k = null;
      try { k = el.querySelector('[id="' + CSS.escape(a.getAttribute('href').slice(1)) + '"]'); } catch (e) {}
      if (!k || !(k.closest('.ref-list') || k.matches('section.tw, figure, .fig, section.fig, .disp-formula'))) return;
      // Tekijä–vuosi-viittaus ilman APA-pilkkua (Thorndike, 1904 → Thorndike 1904; 21.11.2026), jotta md.js linkittää sen
      // kirjallisuuden kohtaan kuten OECS:ssä ja Ubiquityssä.
      const t = rivi(a.textContent), v = t.replace(/(\p{L}[^,()]*?),\s+((?:1[5-9]|20)\d\d[a-z]?)\b/gu, '$1 $2');
      // Viittauksen nimiö kohdalleen (alla): Brunton et al. 2013, Sanders and Kepecs 2012, Hanks et al. (2015a).
      const li = k.closest('.ref-list') && (k.closest('li') || k.querySelector('li'));
      const nm = li && /^(\p{Lu}[\p{L}\p{N}'’\-\u2010 ]{0,40}?(?:\s+(?:and|&)\s+\p{Lu}[\p{L}'’\-\u2010]+|\s+et al\.)?)\s+\(?((?:1[5-9]|20)\d\d[a-z]?)\)?$/u.exec(v);
      if (nm) { const x = nimiot.get(li) || new Map(), avain = nm[1] + '|' + nm[2]; x.set(avain, (x.get(avain) || 0) + 1); nimiot.set(li, x); }
      if (k.closest('.ref-list') && v !== t) a.replaceWith(v);
      else a.replaceWith(...a.childNodes);
    });
    /* Tekijä–vuosi-viittaukset Vancouver-luetteloon (22.11.2026, eLife PMC12005723: Brunton et al., 2013 → Brunton BW, Botvinick
       MM, Brody CD. … Science. 2013;340:95–98.): md.js etsii kohdasta tekijän ja vuoden alusta (Nimi (2013) tai Nimi, X.
       (2013)), joten Vancouver-kohtia ei tunnistettu (2/57), eikä yksikään viittaus linkittynyt. PMC:n linkki kertoo, mihin
       kohtaan viittaus osoittaa: kohdan alkuun viittauksen nimiö muodossa Brunton et al. (2013)., ellei kohdassa jo ole sulkuvuotta
       alussa (APA, Chicago: ennallaan). Yleisin nimiö, jos kohtaan viitataan monella tavalla. */
    nimiot.forEach((x, li) => {
      const c = li.querySelector('cite') || li;
      if (/^[^()]{0,300}?\((?:1[5-9]|20)\d\d[a-z]?\)/.test(rivi(c.textContent))) return;
      const [nimi, vuosi] = [...x.entries()].sort((a, b) => b[1] - a[1])[0][0].split('|');
      c.prepend(nimi + ' (' + vuosi + '). ');
    });
    const maar = samanSivunViitteet(el, 'pm');
    el.querySelectorAll('section.fn-group').forEach(s => { if (!rivi([...s.childNodes].filter(n => !/^H\d$/.test(n.nodeName)).map(n => n.textContent).join(''))) s.remove(); });
    /* Cochrane-katsaukset (22.11.2026, PMC11339634): kirjallisuus on tutkimuksittain, ja tutkimuksen tunnus on otsikkona
       (#### Smith 1997a {published data only}) ja sen julkaisut kohtina. Tekstin viittaukset (Smith 1997a) osoittavat tunnukseen.
       Ennen 293 tunnusta oli otsikoina Sisälmyksessä, eikä yksikään viittaus linkittynyt (julkaisun vuodesta puuttuu kirjain).
       Tunnus ensimmäisen julkaisun alkuun muodossa Smith (1997a) {published data only}., jonka md.js lukee tekijäksi ja vuodeksi;
       otsikko pois. Vuodeton tunnus (NCT01852318) jää alkuun vain, jos julkaisu ei jo ala sillä. Vain sisäkkäinen ryhmä, jonka
       otsikko on tunnuksen muotoinen, joten tavallisen artikkelin References-osio ei muutu. */
    el.querySelectorAll('section.ref-list section.ref-list').forEach(s => {
      const h = s.querySelector(':scope > h3, :scope > h4, :scope > h5, :scope > h6'), li = s.querySelector('li');
      if (!h || !li || s.querySelector('section.ref-list')) return;
      const t = rivi(h.textContent);
      // Nimessä voi olla tavuviiva U+2010 (Legroux‐Crespel 2004), perässä {published data only} tai [Computer program].
      const m = /^(\p{Lu}[\p{L}\p{N}'’.\-\u2010\u2011 ]{0,40}?)\s+((?:1[5-9]|20)\d\d[a-z]?)(\s*(?:\{[^{}]{1,80}\}|\[[^[\]]{1,40}\]))?$/u.exec(t);
      const vuodeton = !m && /^(\[?[\p{Lu}\d][\p{L}\p{N}./\-\u2010]{2,30}\]?)(\s*(?:\{[^{}]{1,80}\}|\[[^[\]]{1,40}\]))?$/u.exec(t);
      if (!m && !(vuodeton && (vuodeton[2] || /^\[?NCT\d/.test(t)))) return;
      const c = li.querySelector('cite') || li;
      const alku = m ? m[1] + ' (' + m[2] + ')' + (m[3] || '') + '. '
        : rivi(c.textContent).startsWith(vuodeton[1].replace(/[[\]]/g, '')) ? '' : t + '. ';
      if (alku) c.prepend(alku);
      h.remove();
    });
    // Kirjallisuus: kohta kappaleeksi (numero ja viite), hakulinkit pois. Tyhjät tunnistepaikat ([PMID: ], [DOI: ]; Cochrane) pois.
    el.querySelectorAll('.ref-list li').forEach(li => {
      const p = document.createElement('p'), nro = li.querySelector(':scope > .label'), c = li.querySelector('cite');
      if (nro && rivi(nro.textContent)) p.append(rivi(nro.textContent) + ' ');
      if (c) p.append(...c.childNodes);
      else {
        li.querySelectorAll('a').forEach(a => { if (/^(doi|pubmed|google scholar|pmc free article|crossref|europe pmc)$/i.test(rivi(a.textContent))) a.remove(); });
        if (nro) nro.remove();
        p.append(...li.childNodes);
        p.innerHTML = p.innerHTML.replace(/\s*\[\s*\]/g, '');
      }
      p.innerHTML = p.innerHTML.replace(/\s*\[(?:PMID|DOI|PMCID|CENTRAL|EMBASE|CRSREF|CINAHL|MEDLINE):\s*\]/g, '');
      li.closest('ul, ol').before(p);
    });
    el.querySelectorAll('.ref-list ul, .ref-list ol').forEach(x => x.remove());
    // Lisäaineistot (section.sm): nimi, kuvaus ja koko yhdeksi kappaleeksi, latauslinkki
    // (Click here for additional data file. (29KB, doc)) pois: tiedosto ei kulje lukimeen.
    el.querySelectorAll('section.sm').forEach(m => {
      m.querySelectorAll('.media').forEach(x => x.remove());
      const osat = [...m.querySelectorAll('.caption > span, .caption > p, .caption > div')].map(x => rivi(x.textContent)).filter(Boolean);
      if (!osat.length) return m.remove();
      const p = document.createElement('p'), em = document.createElement('em');
      em.textContent = osat[0].replace(/\.?$/, '.'); p.append(em, ...(osat.length > 1 ? [' ' + osat.slice(1).join(' ')] : []));
      m.replaceWith(p);
    });
    // Määritelmäluettelo (dl.def-list: Abbreviations, CI | confidence interval) yhdeksi rivitetyksi kappaleeksi *CI* – confidence
    // interval; md.js lukee lyhenneosion kursiivit lyhenteiksi (opas 3.4). Muuten jokainen termi ja selitys olisi oma kappaleensa.
    el.querySelectorAll('dl').forEach(dl => {
      const p = document.createElement('p');
      [...dl.querySelectorAll(':scope > dt')].forEach((dt, i) => {
        const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD' ? rivi(dt.nextElementSibling.textContent) : '';
        if (i) p.appendChild(document.createElement('br'));
        const em = document.createElement('em'); em.textContent = rivi(dt.textContent);
        p.append(em, dd ? ' – ' + dd : '');
      });
      if (rivi(p.textContent)) dl.replaceWith(p); else dl.remove();
    });
    // Kuvat: kuvateksti kursiivikappaleeksi.
    el.querySelectorAll('figure, section.fig').forEach(f => {
      const c = f.querySelector('figcaption, .caption'), ots = f.querySelector('.obj_head, h4, h3');
      const t = [ots && rivi(ots.textContent), c && rivi(c.textContent)].filter(Boolean).join(' ');
      if (!t) return f.remove();
      const p = document.createElement('p'), em = document.createElement('em');
      em.textContent = t; p.appendChild(em); f.replaceWith(p);
    });
    // Taulukot: otsikko kursiivikappaleeksi, taulukko ruudukoksi.
    el.querySelectorAll('section.tw').forEach(w => {
      const ots = w.querySelector('.obj_head'), c = w.querySelector('.caption');
      const t = [ots && rivi(ots.textContent), c && rivi(c.textContent)].filter(Boolean).join(' ');
      const pala = document.createDocumentFragment();
      if (t) {
        const p = document.createElement('p'), em = document.createElement('em');
        em.textContent = t; p.appendChild(em);
        // md.js: kuvatekstin perään hakasulkeinen huomautus (p.kuvateksti).
        if (w.dataset.kuvana) p.append(' [Taulukko on lähteessä kuvana.]');
        pala.appendChild(p);
      }
      w.querySelectorAll('table').forEach(tb => { const d = document.createElement('div'); tb.replaceWith(d); d.appendChild(tb); ojsTaulukko(tb); pala.appendChild(d); });
      w.querySelectorAll('.tw-foot, .fn').forEach(f => { const p = document.createElement('p'); p.textContent = rivi(f.textContent); if (rivi(p.textContent)) pala.appendChild(p); });
      w.replaceWith(pala);
    });
    el.querySelectorAll('table').forEach(t => { if (!t.closest('div') || t.querySelector('table')) ojsTaulukko(t); });
    el.querySelectorAll('h2, h3, h4').forEach(h => h.removeAttribute('class'));
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*(ncbi\.nlm\.nih\.gov|scholar\.google\.com)\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const pv = /^(\d{4})(?:\s+(\p{L}{3})\w*)?(?:\s+(\d{1,2}))?/u.exec(meta('citation_publication_date')[0] || '');
    const kk = pv && pv[2] ? EN_KUUKAUDET.findIndex(k => k.startsWith(pv[2].toLowerCase())) : -1;
    const julkaistu = pv ? pv[1] + (kk >= 0 ? '-' + String(kk + 1).padStart(2, '0') + (pv[3] ? '-' + pv[3].padStart(2, '0') : '') : '') : '';
    const f = meta('citation_firstpage')[0], l = meta('citation_lastpage')[0];
    const cc = document.querySelector('#clp_a a[href*="creativecommons.org"], .license a[href*="creativecommons.org"]');
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    const h1 = document.querySelector('.front-matter h1, article h1');
    const teos = pmcLehti(meta('citation_journal_title')[0], rivi((document.querySelector('button[aria-controls="journal_context_menu"]') || {}).textContent));
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1 ? h1.textContent : meta('citation_title')[0]), tyyppi: 'tieteellinen',
      tekija: kkLuettelo(meta('citation_author')), teos, numero: [meta('citation_volume')[0], meta('citation_issue')[0]].filter(Boolean).join(':'),
      sivut: f ? f + (l && l !== f ? '–' + l : '') : '', julkaistu, doi: meta('citation_doi')[0] || '', lahde: osoite, maar: vmaar.concat(maar),
      oikeus: cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } : null, naytto: teos };
  }

  /* Springer Nature (link.springer.com, BMC:n lehdet ja nature.com; käyttäjän pyyntö 21.11.2026: avoimet
     tieteelliset lehdet). BMC:n lehtien osoitteet (*.biomedcentral.com) ohjautuvat nyt link.springer.comiin, ja sivupohja on kaikilla sama:
     div.c-article-body, osiot section[data-title] (Abstract, Plain language summary, teksti, Data availability, Abbreviations,
     References, Acknowledgements, Funding, Author information, Ethics declarations, Additional information, Supplementary
     information, Rights and permissions, About this article; nimen perässä voi olla rivinvaihto) ja suositukset (Inline
     Recommendations) tiivistelmän perässä; kommentissa teksti on suoraan .main-contentissa ilman osioita. Viittaukset
     a[data-test=citation-ref] (href /article/…#ref-CR5) → ol.c-article-references > li[data-counter="5."] >
     p.c-article-references__text: numeroviittaukset alaviitteiksi viitteen tekstein kuten PMC:ssä (pmcNumeroviitteet()),
     tekijä–vuosi-viittaukset tekstiksi. Taulukot ovat omilla sivuillaan (figcaption ja Full size table -linkki …/tables/N):
     sovite hakee ne (sama sivusto, yksi sivu taulukkoa kohti), solun kappaleet välilyönnein, ruudukoksi (ojsTaulukko), ja
     taulukon alaviitteet (.c-article-table-footer) kappaleiksi. Kuvista kuvateksti (Fig. 1 ja .c-article-section__figure-description)
     kursiivikappaleeksi. Kirjallisuus loppuun kuten PMC:ssä, numero vain numeroviittausten kanssa. Pois: suositukset,
     tekijöiden tiedot (paitsi Contributions), Publisher's note, lisäaineistojen tiedostolinkit, oikeudet (etukenttään) ja artikkelin tiedot (avainsanat
     tiivistelmän perään). Etukenttään tyyppi tieteellinen, tekijät, lehti, numero (vuosikerta:numero), sivut (BMC:ssä
     artikkelinumero), julkaistu (citation_online_date eli verkkojulkaisu; citation_publication_date on numeron kuukausi), doi ja
     lisenssi. Sivulla on DoubleClick-mainospaikkoja, mutta kustantaja elää tilauksista ja artikkelimaksuista eikä mainoksista
     (vrt. Ubiquity Press), joten RAHOITUS-merkintää ei ole. Readability: BMC Public Healthista suositukset (Similar content being
     viewed by others), tekijä- ja artikkelitiedot tekstiksi, kirjallisuus yhdeksi kohdaksi ja numeroviitteet irrallisiksi
     numeroiksi (26 md.js-varoitusta), taulukoista vain otsikot. Mitattu 21.11.2026. */
  const SN_POIS = /^(inline recommendations|author information|additional information|supplementary information|electronic supplementary material|rights and permissions|about this article|change history|peer review information)$/i;
  async function springerNature() {
    const runko = document.querySelector('div.c-article-body');
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    if (!runko || !meta('citation_journal_title').length || !runko.querySelector('.c-article-section__content, .main-content')) return null;
    const el = runko.cloneNode(true);
    // Sivuston kysymyskone (div.app-nls-widget: Ask a research question, Or ask your own question) ei ole tekstiä.
    el.querySelectorAll('.app-nls-widget, [data-test="nls-component"]').forEach(x => x.remove());
    const otsake = s => rivi(s.getAttribute('data-title'));
    const osio = re => [...el.querySelectorAll('section[data-title]')].find(s => re.test(otsake(s)));
    // Avainsanat (About this article: Keywords) ja lisenssi ennen kuin osiot poistetaan.
    const tiedot = osio(/^about this article$/i);
    const avH = tiedot && [...tiedot.querySelectorAll('h3')].find(h => /^keywords$/i.test(rivi(h.textContent)));
    const av = avH && avH.nextElementSibling ? [...avH.nextElementSibling.querySelectorAll('li')].map(li => rivi(li.textContent)).filter(Boolean) : [];
    const cc = document.querySelector('a[rel="license"][href*="creativecommons.org"], section[data-title^="Rights"] a[href*="creativecommons.org"]');
    // Tekijätiedoista jää vain tekijöiden osuus (Contributions), kuten PMC:n Author contributions.
    el.querySelectorAll('section[data-title]').forEach(s => {
      if (!SN_POIS.test(otsake(s))) return;
      const osuus = /^author information$/i.test(otsake(s)) && [...s.querySelectorAll('h3')].find(h => /^contributions$/i.test(rivi(h.textContent)));
      if (!osuus) return s.remove();
      const pala = [s.querySelector('h2'), osuus];
      for (let x = osuus.nextElementSibling; x && !/^H\d$/.test(x.tagName); x = x.nextElementSibling) pala.push(x);
      s.replaceWith(...pala.filter(Boolean));
    });
    // Saman sivun ankkurit (/article/10.1186/…#ref-CR5) muotoon #ref-CR5.
    el.querySelectorAll('a[href*="#"]').forEach(a => {
      const h = a.getAttribute('href'), i = h.indexOf('#');
      let p = null;
      try { p = new URL(h.slice(0, i) || location.href, location.href).pathname; } catch (e) {}
      if (i > 0 && p === location.pathname) a.setAttribute('href', h.slice(i));
    });
    // Taulukot omilta sivuiltaan.
    await Promise.all([...el.querySelectorAll('div.c-article-table')].map(async w => {
      const ots = rivi((w.querySelector('figcaption') || {}).textContent);
      const l = w.querySelector('a[data-test="table-link"], a[href*="/tables/"]');
      let d = null;
      try { d = l ? await hae(new URL(l.getAttribute('href'), location.href).href) : null; } catch (e) {}
      const pala = document.createDocumentFragment(), t = d && d.querySelector('.c-article-table-container table');
      if (ots) {
        const p = document.createElement('p'), em = document.createElement('em'); em.textContent = ots; p.appendChild(em);
        // Taulukkosivun haku epäonnistui: huomautus, ettei kuvateksti jää ilman taulukkoa ja selitystä.
        if (!t) p.append(' [Taulukko ei latautunut lähteen omalta taulukkosivulta.]');
        pala.appendChild(p);
      }
      if (t) {
        const t2 = document.importNode(t, true), div = document.createElement('div');
        t2.querySelectorAll('td, th').forEach(c => c.querySelectorAll('p').forEach((p, i) => { if (i) p.before(' '); }));
        div.appendChild(t2); pala.appendChild(div); ojsTaulukko(t2);
        d.querySelectorAll('.c-article-table-footer li, .c-article-table-footer > p').forEach(f => {
          const p = document.createElement('p'); p.textContent = rivi(f.textContent); if (rivi(p.textContent)) pala.appendChild(p);
        });
      }
      w.replaceWith(pala);
    }));
    el.querySelectorAll('script, style, noscript, button, svg, picture, img, .c-article-recommendations, [data-test="cobranding-download"], .c-article-section__figure-link, .u-hide-print, .c-article-references__links, .c-article-references__download, .c-article-references__links-item, .js-ad, .c-ad, .app-peer-review, .app-explore-related-subjects, #researcher-profile-container').forEach(x => x.remove());
    // Kuvat: kuvateksti kursiivikappaleeksi.
    el.querySelectorAll('div.c-article-section__figure').forEach(f => {
      const t = [rivi((f.querySelector('figcaption') || {}).textContent), rivi((f.querySelector('.c-article-section__figure-description') || {}).textContent)].filter(Boolean).join(' ');
      if (!t) return f.remove();
      const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); f.replaceWith(p);
    });
    const vmaar = pmcNumeroviitteet(el, { lista: 'ol.c-article-references > li', etu: 'snv',
      nro: li => rivi(li.getAttribute('data-counter')).replace(/\.$/, ''),
      kohde: k => k.closest('ol.c-article-references > li'),
      teksti: li => {
        const k = (li.querySelector('.c-article-references__text') || li).cloneNode(true);
        k.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', a.href));
        return k.innerHTML.trim();
      } });
    // Muut saman sivun viittaukset (tekijä–vuosi, taulukot, kuvat, osiot, lisäaineisto) tekstiksi; alaviitteet (#Fn1) jäävät.
    el.querySelectorAll('a[href^="#"]').forEach(a => { if (!/^#Fn\d/.test(a.getAttribute('href'))) a.replaceWith(...a.childNodes); });
    const maar = samanSivunViitteet(el, 'sn');
    el.querySelectorAll('section[data-title]').forEach(s => { if (/^notes$/i.test(otsake(s)) && !rivi([...s.querySelectorAll('p, li')].map(x => x.textContent).join(''))) s.remove(); });
    // Kirjallisuus kappaleiksi ja loppuun.
    const kirj = osio(/^references$/i), loppu = [];
    if (kirj) {
      const h = document.createElement('h2'); h.textContent = rivi((kirj.querySelector('h2') || {}).textContent) || 'References'; loppu.push(h);
      kirj.querySelectorAll('ol.c-article-references > li').forEach(li => {
        const p = document.createElement('p'), n = rivi(li.getAttribute('data-counter')), t = li.querySelector('.c-article-references__text') || li;
        if (n && vmaar.length) p.append(n + ' ');
        p.append(...t.childNodes); loppu.push(p);
      });
      kirj.remove();
    }
    // Avainsanat tiivistelmän perään.
    const tiiv = osio(/^abstract$/i);
    if (tiiv && av.length) {
      const p = document.createElement('p'), b = document.createElement('strong'); b.textContent = 'Keywords:'; p.append(b, ' ' + av.join(', '));
      (tiiv.querySelector('.c-article-section__content') || tiiv).appendChild(p);
    }
    el.append(...loppu);
    el.querySelectorAll('h2, h3, h4, h5').forEach(h => { h.removeAttribute('class'); h.removeAttribute('id'); });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent) && !x.querySelector('table, hr')) x.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*(springer\.com|nature\.com|biomedcentral\.com|springernature\.com|scholar\.google\.com|ncbi\.nlm\.nih\.gov)\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const nimet = meta('citation_author').map(n => n.replace(/^([^,]+),\s*(.+)$/, '$2 $1'));
    const pv = /^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?/.exec(meta('citation_online_date')[0] || meta('citation_publication_date')[0] || '');
    const f = meta('citation_firstpage')[0], l = meta('citation_lastpage')[0];
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    const h1 = document.querySelector('h1.c-article-title');
    const teos = meta('citation_journal_title')[0];
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1 ? h1.textContent : meta('citation_title')[0]), tyyppi: 'tieteellinen',
      tekija: kkLuettelo(nimet), teos, numero: [meta('citation_volume')[0], meta('citation_issue')[0]].filter(Boolean).join(':'),
      sivut: f ? f + (l && l !== f ? '–' + l : '') : '', julkaistu: pv ? pv[1] + '-' + pv[2].padStart(2, '0') + (pv[3] ? '-' + pv[3].padStart(2, '0') : '') : '',
      doi: meta('citation_doi')[0] || '', lahde: osoite.replace(/\?.*$/, ''), maar: vmaar.concat(maar),
      oikeus: cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } : null, naytto: teos };
  }

  /* PLOS (journals.plos.org: PLOS ONE, PLOS Medicine ym.; 21.11.2026 samasta pyynnöstä). Teksti
     #artText: tiivistelmä ja Author summary (div.abstract), osiot div.section (h2, h3), tyhjät ankkurit a.link-target, kuvat ja
     taulukot div.figure (taulukkokin on sivulla vain kuvana: div.figcaption Table 1. ja otsikko). Viittaukset a.ref-tip
     (href #pmed.1004371.ref001) → ol.references > li (span.order 1., ul.reflinks hakulinkit): numeroviittaukset alaviitteiksi
     kuten PMC:ssä. Taulukot haetaan artikkelin JATS-XML:stä (sivun linkki …/article/file?id=…&type=manuscript, sama sivusto,
     yksi haku): table-wrap, jonka object-id on kuvan data-doi, HTML-taulukoksi (break välilyönniksi) ja ruudukoksi, alaviitteet
     (table-wrap-foot) kappaleiksi. Pois: artikkelin tietolaatikko (viittausohje, toimittaja, päivät, oikeudet, rahoitus,
     sidonnaisuudet: etukenttä kertoo lehden, päivän ja lisenssin), lisäaineisto (Supporting information), kuvien lataus- ja
     suurennuslinkit ja kaavakuvat. Etukenttään tyyppi tieteellinen, tekijät, lehti, numero, sivut (artikkelinumero e1004371),
     julkaistu (citation_date, Mar 28, 2024), doi ja lisenssi tietolaatikon CC-linkistä. Sivulla on mainospaikkoja, mutta PLOS
     elää artikkelimaksuista (voittoa tavoittelematon kustantaja), joten RAHOITUS-merkintää ei ole. Readability: otsikko kahdesti,
     Figures-otsikko, kirjallisuus ilman kohtia (p.bib 0) ja taulukoista pelkät otsikot. Mitattu 21.11.2026. */
  async function plos() {
    const art = document.getElementById('artText');
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    if (!art || !/public library of science/i.test(meta('citation_publisher').join(' ')) || !meta('citation_journal_title').length) return null;
    const el = art.cloneNode(true);
    const cc = el.querySelector('.articleinfo a[href*="creativecommons.org"]');
    el.querySelectorAll('a.link-target').forEach(a => { if (!a.closest('ol.references')) a.remove(); });
    el.querySelectorAll('.articleinfo, script, style, .img-box, .figure-inline-download, .caption_target, .caption_object, ul.reflinks, ul.find-nolinks, .inline-formula img, img').forEach(x => x.remove());
    [...el.querySelectorAll('div.section')].forEach(s => {
      const h = s.querySelector(':scope > h2');
      if (h && /^supporting information$/i.test(rivi(h.textContent))) s.remove();
    });
    // Taulukot JATS-XML:stä.
    const taulut = [...el.querySelectorAll('div.figure')].filter(f => /\.t\d+$/.test(f.getAttribute('data-doi') || ''));
    let xml = null;
    const xl = document.querySelector('a[href*="type=manuscript"]');
    if (taulut.length && xl) {
      const ohi = new AbortController(), ajastin = setTimeout(() => ohi.abort(), 8000);
      try {
        const r = await fetch(new URL(xl.getAttribute('href'), location.href).href, { credentials: 'same-origin', signal: ohi.signal });
        if (r.ok) xml = new DOMParser().parseFromString(await r.text(), 'application/xml');
        if (xml && xml.querySelector('parsererror')) xml = null;
      } catch (e) {}
      clearTimeout(ajastin);
    }
    const xteksti = x => rivi([...x.childNodes].map(n => n.nodeType === 1 && n.localName === 'break' ? ' ' : n.textContent).join(''));
    el.querySelectorAll('div.figure').forEach(f => {
      const c = f.querySelector('.figcaption');
      const t = [c && rivi(c.textContent), ...[...f.querySelectorAll(':scope > p')].map(p => rivi(p.textContent))].filter(Boolean).join(' ');
      const pala = document.createDocumentFragment();
      if (t) { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); pala.appendChild(p); }
      const doi = f.getAttribute('data-doi') || '';
      const tw = xml && [...xml.getElementsByTagName('table-wrap')].find(w => [...w.getElementsByTagName('object-id')].some(o => rivi(o.textContent) === doi));
      const xt = tw && tw.getElementsByTagName('table')[0];
      if (xt) {
        const ht = document.createElement('table'), div = document.createElement('div');
        [...xt.getElementsByTagName('tr')].forEach(tr => {
          const r = ht.insertRow();
          [...tr.children].filter(c => /^t[hd]$/.test(c.localName)).forEach(c => {
            const s = document.createElement(c.localName);
            s.textContent = xteksti(c);
            if (+c.getAttribute('colspan') > 1) s.colSpan = +c.getAttribute('colspan');
            if (+c.getAttribute('rowspan') > 1) s.rowSpan = +c.getAttribute('rowspan');
            r.appendChild(s);
          });
        });
        div.appendChild(ht); pala.appendChild(div); ojsTaulukko(ht);
        [...tw.getElementsByTagName('table-wrap-foot')].forEach(ft => [...ft.getElementsByTagName('p')].forEach(x => {
          const p = document.createElement('p'); p.textContent = xteksti(x); if (rivi(p.textContent)) pala.appendChild(p);
        }));
      }
      f.replaceWith(pala);
    });
    const vmaar = pmcNumeroviitteet(el, { lista: 'ol.references > li', etu: 'plv',
      nro: li => rivi((li.querySelector(':scope > .order') || {}).textContent).replace(/\.$/, ''),
      kohde: k => k.closest('ol.references > li'),
      teksti: li => {
        const k = li.cloneNode(true);
        k.querySelectorAll(':scope > .order').forEach(x => x.remove());
        k.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', a.href));
        return k.innerHTML.trim();
      } });
    el.querySelectorAll('a[href^="#"]').forEach(a => a.replaceWith(...a.childNodes));
    // Kirjallisuus kappaleiksi.
    el.querySelectorAll('ol.references > li').forEach(li => {
      const p = document.createElement('p'), n = li.querySelector(':scope > .order');
      if (n && vmaar.length) p.append(rivi(n.textContent) + ' ');
      if (n) n.remove();
      p.append(...li.childNodes);
      li.closest('ol').before(p);
    });
    el.querySelectorAll('ol.references').forEach(x => x.remove());
    el.querySelectorAll('a.link-target').forEach(a => a.remove());
    el.querySelectorAll('h2, h3, h4, h5').forEach(h => { h.removeAttribute('class'); h.removeAttribute('id'); });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent) && !x.querySelector('table, hr')) x.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*(plos\.org|scholar\.google\.com|ncbi\.nlm\.nih\.gov)\//i);
    el.querySelectorAll('a[href]:not([href^="http"])').forEach(a => a.replaceWith(...a.childNodes));
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const pv = /^(\p{L}{3})\w*\s+(\d{1,2}),\s+(\d{4})/u.exec(meta('citation_date')[0] || '');
    const kk = pv ? EN_KUUKAUDET.findIndex(k => k.startsWith(pv[1].toLowerCase())) : -1;
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    const h1 = document.getElementById('artTitle');
    const teos = meta('citation_journal_title')[0];
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1 ? h1.textContent : meta('citation_title')[0]), tyyppi: 'tieteellinen',
      tekija: kkLuettelo(meta('citation_author')), teos, numero: [meta('citation_volume')[0], meta('citation_issue')[0]].filter(Boolean).join(':'),
      sivut: meta('citation_firstpage')[0] || '', julkaistu: pv && kk >= 0 ? pv[3] + '-' + String(kk + 1).padStart(2, '0') + '-' + pv[2].padStart(2, '0') : '',
      doi: meta('citation_doi')[0] || '', lahde: osoite, maar: vmaar,
      oikeus: cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } : null, naytto: teos };
  }

  /* Frontiers (frontiersin.org: Frontiers in Psychology ym.; 21.11.2026 samasta
     pyynnöstä). Teksti .ArticleContent: tiivistelmä (div#h1, väliotsikot p.TitleInline-lihavointeina), osiot div#sN (h2, h3),
     Statements (h2, div.Statement__*: aineisto, etiikka, tekijöiden osuus, rahoitus, sidonnaisuudet, generatiivinen tekoäly,
     Publisher's note, alaviitteet) ja References (ul.References > li#BN: .References__label, .References__content,
     .References__links). Numeroviittaukset ovat nappeja ilman osoitetta (span.ArticleReference#B1-button, jossa
     .ArticleReference__scrollTarget ja numero): ne muutetaan #B1-linkeiksi ja alaviitteiksi viitteen tekstein kuten PMC:ssä.
     Tekijä–vuosi-viittaukset (a.ArticleReference[href=#B25] tai span: Thorndike, 1904) tekstiksi ilman APA-pilkkua kuten
     OECS:ssä. Alaviitteet a[href=#fn0001] > sup → p.Footnote#fn0001 (Footnote__label, paluulinkki ^) samanSivunViitteet()illä.
     Taulukot div.ArticleTable (Table 1, __description, __content table, __foot) otsikko kursiivikappaleeksi, ruudukoksi ja
     alaviitteet kappaleiksi; kuvat div.ArticleFigure otsikoksi. Avainsanat .Summarysta tiivistelmän perään; Publisher's note,
     kirjeenvaihto, toimittajat ja päivät (Summary) pois. Etukenttään tyyppi tieteellinen, tekijät, lehti, numero (vuosikerta),
     sivut (artikkelinumero), julkaistu, doi ja lisenssi. Ei mainoksia eikä lahjoituspyyntöä (artikkelimaksut). Readability:
     tyypiksi blogi, ei kirjallisuutta, alaviitettä eikä numeroviittauksia (numerot jäivät tekstiin), tekijä–vuosi-viittaukset
     verkkolinkkeinä, kirjeenvaihtajan sähköposti ja Disclaimer tekstissä. Mitattu 21.11.2026. */
  async function frontiers() {
    const sis = document.querySelector('.ArticleDetailsV4__main__content .ArticleContent') || document.querySelector('.ArticleContent');
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    if (!sis || !/frontiers/i.test(meta('citation_publisher').join(' ')) || !meta('citation_journal_title').length) return null;
    const el = sis.cloneNode(true);
    // Kuvat: otsikko ja kuvateksti (figcaption on suurennusnapin sisällä) kursiivikappaleeksi ennen nappien poistoa.
    el.querySelectorAll('div.ArticleFigure').forEach(f => {
      const t = [rivi((f.querySelector('.ArticleFigure__title') || {}).textContent), rivi((f.querySelector('.ArticleFigure__description, figcaption') || {}).textContent)].filter(Boolean).join(' ');
      if (!t) return f.remove();
      const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); f.replaceWith(p);
    });
    el.querySelectorAll('button, svg, picture, img, figure, script, style, .References__links, .ArticleReference__scrollTarget, .Statement__Publishersnote, .Summary').forEach(x => x.remove());
    // Vuen kommentit (<!--[-->) solmujen väleistä pois, jotta naapurit ovat vierekkäin.
    const kommentit = document.createTreeWalker(el, NodeFilter.SHOW_COMMENT), poistot = [];
    while (kommentit.nextNode()) poistot.push(kommentit.currentNode);
    poistot.forEach(c => c.remove());
    el.normalize();
    // Kirjallisuuden nimet ovat erillisiä span-pareja, joiden välimerkit tulevat sivun tyyleistä: APA-lehdissä (nimikirjaimissa
    // piste) Sukunimi, E. N., …, and Sukunimi, E., Vancouver-lehdissä Sukunimi EN, …, et al. Lehden nimen (i) ympärille välit.
    el.querySelectorAll('.References__personGroup').forEach(g => {
      if ([...g.children].some(c => !c.matches('.References__name, .ReferencesList_etal'))) return;
      const nimet = [...g.querySelectorAll('.References__name')].map(n => [rivi((n.querySelector('.References__surname') || {}).textContent), rivi((n.querySelector('.References__givenNames') || {}).textContent)]);
      if (!nimet.length) return;
      const apa = nimet.some(n => /\./.test(n[1])), etal = g.querySelector('.ReferencesList_etal');
      const osat = nimet.map(([a, e]) => e ? a + (apa ? ', ' : ' ') + e : a);
      g.textContent = (apa && !etal && osat.length > 1 ? osat.slice(0, -1).join(', ') + ', and ' + osat[osat.length - 1] : osat.join(', ')) + (etal ? ', ' + rivi(etal.textContent) : '');
    });
    el.querySelectorAll('.References__source').forEach(i => {
      const e = i.previousSibling, j = i.nextSibling;
      if (e && e.nodeType === 3 && /[^\s([]$/.test(e.textContent)) i.before(' ');
      if (j && j.nodeType === 3 && /^[\p{L}\p{N}]/u.test(j.textContent)) i.after(' ');
    });
    // Viittaukset: numero → #BN-linkki, tekijä–vuosi tekstiksi; alaviitteiden merkit (#fn) jäävät. Numero on viittaus vain, jos
    // se on kohdan oma numero (Puhl and Brownell, 2001, 2003: pelkkä 2003 on vuosi).
    el.querySelectorAll('.ArticleReference').forEach(r => {
      const h = r.getAttribute('href') || '';
      if (/^#fn/.test(h)) return;
      const id = (/^(B\d+)-button$/.exec(r.id || '') || /^#(B\d+)$/.exec(h) || [])[1], t = rivi(r.textContent);
      const li = id && el.querySelector('li[id="' + id + '"]');
      if (li && /^\d{1,4}$/.test(t) && rivi((li.querySelector('.References__label') || {}).textContent).replace(/\.$/, '') === t) { const a = document.createElement('a'); a.setAttribute('href', '#' + id); a.textContent = t; r.replaceWith(a); }
      else r.replaceWith(t.replace(/(\p{L}[^,()]*?),\s+((?:1[5-9]|20)\d\d[a-z]?)\b/gu, '$1 $2'));
    });
    // Taulukot ja kuvat.
    el.querySelectorAll('div.ArticleTable').forEach(w => {
      const t = [rivi((w.querySelector('.ArticleTable__title') || {}).textContent), rivi((w.querySelector('.ArticleTable__description') || {}).textContent)].filter(Boolean).join(' ');
      const pala = document.createDocumentFragment();
      if (t) { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); pala.appendChild(p); }
      w.querySelectorAll('.ArticleTable__content table').forEach(tb => { const d = document.createElement('div'); tb.replaceWith(d); d.appendChild(tb); ojsTaulukko(tb); pala.appendChild(d); });
      w.querySelectorAll('.ArticleTable__foot p').forEach(f => { const p = document.createElement('p'); p.textContent = rivi(f.textContent); if (rivi(p.textContent)) pala.appendChild(p); });
      w.replaceWith(pala);
    });
    const vmaar = pmcNumeroviitteet(el, { lista: 'ul.References > li', etu: 'frv',
      nro: li => rivi((li.querySelector('.References__label') || {}).textContent).replace(/\.$/, ''),
      kohde: k => k.closest('ul.References > li'),
      teksti: li => {
        const k = (li.querySelector('.References__content > p') || li.querySelector('.References__content') || li).cloneNode(true);
        k.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', a.href));
        return k.innerHTML.trim();
      } });
    el.querySelectorAll('a[href^="#"]').forEach(a => { if (!/^#fn/.test(a.getAttribute('href'))) a.replaceWith(...a.childNodes); });
    const maar = samanSivunViitteet(el, 'fr');
    el.querySelectorAll('.Statement__Footnotes').forEach(s => { if (!rivi([...s.querySelectorAll('p')].map(x => x.textContent).join(''))) s.remove(); });
    // Kirjallisuus kappaleiksi.
    el.querySelectorAll('ul.References > li').forEach(li => {
      const p = document.createElement('p'), n = rivi((li.querySelector('.References__label') || {}).textContent), c = li.querySelector('.References__content > p') || li.querySelector('.References__content') || li;
      if (n && vmaar.length) p.append(n.replace(/\.?$/, '.') + ' ');
      p.append(...c.childNodes);
      li.closest('ul').before(p);
    });
    el.querySelectorAll('ul.References').forEach(x => x.remove());
    // Avainsanat tiivistelmän perään.
    const sum = document.querySelector('.Summary');
    const avH = sum && [...sum.querySelectorAll('p.h5')].find(p => /^keywords$/i.test(rivi(p.textContent)));
    const av = avH && avH.nextElementSibling ? rivi(avH.nextElementSibling.textContent) : '';
    const tiiv = [...el.querySelectorAll('h2')].find(h => /^abstract$/i.test(rivi(h.textContent)));
    if (tiiv && av) { const p = document.createElement('p'), b = document.createElement('strong'); b.textContent = 'Keywords:'; p.append(b, ' ' + av); tiiv.parentElement.appendChild(p); }
    // Tiivistelmän väliotsikot (Introduction:) jäävät lihavoiduiksi kappaleen aluiksi kuten lähteessä.
    el.querySelectorAll('p.TitleInline').forEach(p => {
      const s = p.nextElementSibling;
      if (s && s.tagName === 'P') { s.prepend(...p.childNodes, ' '); p.remove(); }
    });
    el.querySelectorAll('h2, h3, h4, h5').forEach(h => { h.removeAttribute('class'); h.removeAttribute('id'); h.textContent = rivi(h.textContent); });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent) && !x.querySelector('table, hr')) x.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*(frontiersin\.org|scholar\.google\.com|ncbi\.nlm\.nih\.gov)\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const nimet = meta('citation_author').map(n => n.replace(/^([^,]+),\s*(.+)$/, '$2 $1'));
    const pv = /^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?/.exec(meta('citation_publication_date')[0] || '');
    const cc = document.querySelector('.Summary__copyright a[href*="creativecommons.org"]');
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    const h1 = document.querySelector('h1.ArticleDetailsV4__main__title');
    const teos = meta('citation_journal_title')[0];
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1 ? h1.textContent : meta('citation_title')[0]), tyyppi: 'tieteellinen',
      tekija: kkLuettelo(nimet), teos, numero: [meta('citation_volume')[0], meta('citation_issue')[0]].filter(Boolean).join(':'),
      sivut: meta('citation_firstpage')[0] || '', julkaistu: pv ? pv[1] + '-' + pv[2].padStart(2, '0') + (pv[3] ? '-' + pv[3].padStart(2, '0') : '') : '',
      doi: meta('citation_doi')[0] || '', lahde: osoite, maar: vmaar.concat(maar),
      oikeus: cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } : null, naytto: teos };
  }

  /* Ubiquity Press (alusta; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 3: International Review of Social Psychology,
     Utrecht Law Review, Journal of Open Psychology Data, Journal of Cognition ym. omilla verkkotunnuksillaan). Next.js, mutta
     palvelin renderöi JATS-artikkelin; luokat ovat enimmäkseen tiivisteitä (styled-components), joten valitsimet ovat id:itä ja
     rel- ja data-määreitä: #xml-article (#middle.article-body teksti, #back viitteet ja kirjallisuus), h2#abstract ja sen
     jälkeinen div, avainsanat ul[aria-labelledby="article-keywords"]. Alaviitteet sup > a[rel=footnote][href="#nN"] → li#nN
     (paluulinkki #xrnN), lähdeviittaukset span.xref a[rel=footnote][href="#BN"] → li#BN (piilotettu ankkuri ja Jump to citation
     -linkki), kuvat div#FN (painike ja kuva) ja kuvateksti (Figure 1 ja otsikko), taulukot div#TN (Table 1, otsikko, table
     viivariveineen). Lähdeviittaukset tekstiksi ilman APA-pilkkua (md.js linkittää SEP-muodon kuten OECS:ssä), alaviitteet
     samanSivunViitteet():llä, kirjallisuus kappaleiksi, kuvateksti ja taulukon otsikko kursiivikappaleiksi, taulukko ruudukoksi.
     Etukenttään tyyppi tieteellinen, tekijät (citation_author Sukunimi, Etunimi käännettynä), teos, numero, julkaistu
     (citation_publication_date), doi (DC.Identifier) ja lisenssi (DC.Rights.license, CC-linkki); otsikko citation_titlesta (h1 voi olla
     lehden logo, JOPD). JOPD:n pääluvut (2) Methods alalukuineen 2.1 pistenumeroiksi (md.js:n numerointi). Readability antoi tekijäksi
     vain viimeisen (Barnett, Holly K.), otsikon kahdesti, Metrics-laatikon ja 114 viitelinkkiä, eikä alaviitteitä tullut.
     Ei mainoksia eikä lahjoituspyyntöä (Ubiquity Press on kustantaja, artikkelimaksut). Mitattu 18.11.2026. */
  async function ubiquity() {
    const xml = document.getElementById('xml-article'), keski = xml && xml.querySelector('#middle');
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    if (!keski || !meta('citation_journal_title').length) return null;
    const el = document.createElement('div');
    // Tiivistelmä ja avainsanat.
    const abs = document.querySelector('h2#abstract');
    if (abs) {
      const h = document.createElement('h2'); h.textContent = rivi(abs.textContent); el.appendChild(h);
      const t = abs.nextElementSibling;
      if (t) el.append(...[...t.cloneNode(true).childNodes]);
      const av = [...document.querySelectorAll('ul[aria-labelledby="article-keywords"] li')].map(li => rivi(li.textContent)).filter(Boolean);
      if (av.length) { const p = document.createElement('p'), b = document.createElement('strong'); b.textContent = 'Keywords:'; p.append(b, ' ' + av.join(', ')); el.appendChild(p); }
      el.appendChild(document.createElement('hr'));
    }
    const k = xml.cloneNode(true);
    k.querySelectorAll('script, style, button, img, svg, a[style*="display:none"], a[aria-label^="Jump to citation"]').forEach(x => x.remove());
    // Lähdeviittaukset tekstiksi ilman APA-pilkkua (Neequaye, 2023 → Neequaye 2023).
    k.querySelectorAll('a[href^="#B"]').forEach(a => {
      if (!k.querySelector('[id="' + a.getAttribute('href').slice(1) + '"]')) return;
      const s = a.closest('strong') && rivi(a.closest('strong').textContent) === rivi(a.textContent) ? a.closest('strong') : a;
      s.replaceWith(rivi(a.textContent).replace(/(\p{L}[^,()]*?),\s+((?:1[5-9]|20)\d\d[a-z]?)\b/gu, '$1 $2'));
    });
    k.querySelectorAll('span.xref').forEach(x => x.replaceWith(...x.childNodes));
    // Kuva- ja taulukkoviittaukset tekstiksi.
    k.querySelectorAll('a[href^="#F"], a[href^="#T"]').forEach(a => a.replaceWith(...a.childNodes));
    // Kuvat: kuvan kehys pois, kuvateksti (Figure 1 ja otsikko) kursiivikappaleeksi.
    k.querySelectorAll('[id^="F"]').forEach(f => {
      if (!/^F\d+$/.test(f.id)) return;
      const c = f.nextElementSibling;
      if (c && /^(figure|fig\.?)\s*\d/i.test(rivi(c.textContent))) {
        const p = document.createElement('p'), em = document.createElement('em'); em.textContent = rivi(c.textContent); p.appendChild(em); c.replaceWith(p);
      }
      f.remove();
    });
    // Taulukot: otsikko kursiiviksi, viivarivit pois, ruudukoksi. Myös liitteiden tunnuksettomat taulukot (.table-wrapper:
    // IRSP:n Table X1, 22.11.2026): niiden viivarivit (<tr><th colspan=4><hr>) ja solujen rivinvaihdot rikkoivat Markdown-taulukon.
    [...k.querySelectorAll('[id^="T"]')].filter(w => /^T\d+$/.test(w.id)).concat([...k.querySelectorAll('.table-wrapper')]).forEach(w => {
      // Jo käsitelty (T-taulukko .table-wrapperin sisällä) tai irrotettu ohitetaan.
      if (!k.contains(w) || w.querySelector('[data-ub-taulukko]') || w.closest('[data-ub-taulukko]')) return;
      const t = w.querySelector('table'), pala = document.createDocumentFragment();
      const ots = [...w.querySelectorAll('p')].filter(p => !p.closest('table')).map(p => rivi(p.textContent)).filter(Boolean);
      if (ots.length) { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = ots.slice(0, 2).join(' '); p.appendChild(em); pala.appendChild(p); }
      if (t) {
        t.querySelectorAll('tr').forEach(tr => { if (!rivi(tr.textContent) && tr.querySelector('hr')) tr.remove(); });
        const d = document.createElement('div'); d.dataset.ubTaulukko = '1'; d.appendChild(t); pala.appendChild(d); ojsTaulukko(t);
      }
      ots.slice(2).forEach(x => { const p = document.createElement('p'); p.textContent = x; pala.appendChild(p); });
      w.replaceWith(pala);
    });
    const maar = samanSivunViitteet(k, 'ub');
    // Viiteosio tyhjeni: otsikko pois. Kirjallisuuden kohdat kappaleiksi.
    k.querySelectorAll('#back h2').forEach(h => {
      const s = h.nextElementSibling;
      if (!s || /^H\d$/.test(s.tagName) || !rivi(s.textContent)) h.remove();
    });
    k.querySelectorAll('#back li').forEach(li => { const d = document.createElement('div'); d.append(...li.childNodes); li.replaceWith(d); });
    k.querySelectorAll('#back ul, #back ol').forEach(l => l.replaceWith(...l.childNodes));
    k.querySelectorAll('h2, h3, h4, h5').forEach(h => { h.removeAttribute('class'); h.removeAttribute('id'); });
    // JOPD: pääluvut (2) Methods ja alaluvut 2.1: sulkunumero pistenumeroksi, jotta md.js:n numerointi jatkuu.
    if (k.querySelector('h3') && [...k.querySelectorAll('h3')].some(h => /^\d+\.\d/.test(rivi(h.textContent))))
      k.querySelectorAll('h2').forEach(h => { if (/^\(\d+\)\s/.test(rivi(h.textContent))) h.textContent = rivi(h.textContent).replace(/^\((\d+)\)\s+/, '$1. '); });
    el.append(...[...k.childNodes]);
    el.querySelectorAll('[class]').forEach(x => x.removeAttribute('class'));
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent) && !x.querySelector('table, hr')) x.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*(ubiquitypress\.com)\//i);
    el.querySelectorAll('a[href^="/"]').forEach(a => a.replaceWith(...a.childNodes));
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const nimet = meta('citation_author').map(n => /^([^,]+),\s*(.+)$/.test(n) ? n.replace(/^([^,]+),\s*(.+)$/, '$2 $1') : n);
    const lis = meta('DC.Rights.license')[0] || '', cc = document.querySelector('a[href*="creativecommons.org/licenses"]');
    const ccn = /attribution(?:[- ](\w+(?:[- ]\w+)*))?\s+(\d\.\d)/i.exec(lis);
    const teos = meta('citation_journal_title')[0];
    return { html: irrota([el]).innerHTML, otsikko: meta('citation_title')[0] || rivi((document.querySelector('h1') || {}).textContent),
      tyyppi: 'tieteellinen', tekija: kkLuettelo(nimet), teos, numero: [meta('citation_volume')[0], meta('citation_issue')[0]].filter(Boolean).join(':'),
      julkaistu: (meta('citation_publication_date')[0] || '').slice(0, 10), doi: meta('DC.Identifier')[0] || '', lahde: osoite, maar,
      oikeus: lis ? { teksti: /^cc /i.test(lis) && ccn ? 'CC BY' + (ccn[1] ? '-' + ccn[1].toUpperCase().replace(/\s+/g, '-') : '') + ' ' + ccn[2] : lis, lahde: cc ? cc.href : osoite } : null,
      naytto: teos };
  }

  /* SPIP (alusta; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 4: ranskalaiset ajatus- ja kirjallisuuslehdet Vacarme,
     La Vie des idées, Books & Ideas, Les mots sont importants, remue.net ym.). Tunnistus: meta[name=generator] SPIP. Teemat
     vaihtelevat, joten sovite nojaa SPIP-ytimen merkintöihin: Crayons-luokat (article-titre-N, -soustitre-N, -chapo-N, -texte-N,
     -ps-N) tai niiden puuttuessa luokat .chapo, .texte ja .soustitre; alaviitteet span.spip_note_ref > a.spip_note[href="#nbN"] →
     div#nbN (tai vanha <a id="nbN"> kappaleen alussa) paluulinkkeineen #nhN; tekijät span.vcard.author .fn (#LESAUTEURS) otsikon
     lähellä tai meta author; päivä bepress_citation_date, article:published_time, time[datetime], [itemprop=datePublished] tai
     abbr.published[title]; väliotsikot h2/h3.spip ja muut otsikot. Tekstiksi valitaan suurin .texte, ja jos se on alle 60 %
     kaikkien .texte-lohkojen tekstistä (rubriikin luettelo, remue.netin notes de lecture -sivu), leikkaa Readability. Chapo
     tavallisina kappaleina ja osanvaihto, sitten teksti, post-scriptum (oma otsikkonsa tai Post-scriptum) ja alaviitteet.
     Kuvat (.spip_document) pois kuvateksteineen. Etukenttään alaotsikko (soustitre), tekijät, julkaistu, sivusto (og:site_name tai
     sivun nimen loppu). Rahoitus vaihtelee sivustoittain (remue.netissä tukisivu, muilla ei mainoksia: vain Google Analytics),
     joten RAHOITUS-merkintää ei ole, kuten Bloggerissa ja Substackissa. Readability: La Vie des idéesin pitkästä arviosta
     296 sanaa (luettelolohko), alaviitteet viitelinkkeinä (Vacarme) tai poissa (Books & Ideas), ei päivää eikä alaotsikkoa.
     Mitattu 18.11.2026. */
  async function spip() {
    const gen = document.querySelector('meta[name="generator"]');
    if (!/^SPIP\b/i.test(gen && gen.content || '')) return null;
    const crayon = n => document.querySelector('[class*="article-' + n + '-"]');
    let texte = crayon('texte');
    if (!texte) {
      const t = [...document.querySelectorAll('.texte')].filter(x => !x.parentElement.closest('.texte'));
      const koko = x => rivi(x.textContent).length, kaikki = t.reduce((n, x) => n + koko(x), 0);
      texte = t.sort((a, b) => koko(b) - koko(a))[0];
      if (!texte || koko(texte) < kaikki * 0.6) return null;
    }
    const titreEl = crayon('titre') || document.querySelector('h1');
    const chapo = crayon('chapo') || document.querySelector('.chapo');
    const ps = crayon('ps') || document.querySelector('.ps');
    const el = document.createElement('div'), maar = [], laskuri = { n: 0 };
    const siivoa = x => {
      x.querySelectorAll('script, style, img, figure, .spip_document, .spip_documents, [class*="spip_document_"], button, form, iframe, nav').forEach(y => y.remove());
      x.querySelectorAll('[style]').forEach(y => y.removeAttribute('style'));
      // SPIP:n typografia: <sup class="typo_exposants">e</sup> jäisi raa'aksi HTML:ksi.
      x.querySelectorAll('sup, sub').forEach(y => [...y.attributes].forEach(a => y.removeAttribute(a.name)));
    };
    // Alaviitteet: merkki span.spip_note_ref, kohde #nbN (div tai a kappaleen alussa) koko dokumentissa.
    const viitteet = x => x.querySelectorAll('a.spip_note[href^="#nb"], a[href^="#nb"][rel="appendix"]').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      let k = null;
      try { k = document.querySelector('[id="' + CSS.escape(id) + '"]'); } catch (e) {}
      const kohta = a.closest('.spip_note_ref') && x.contains(a.closest('.spip_note_ref')) ? a.closest('.spip_note_ref') : a;
      if (!k) return;
      const osat = [];
      if (k.tagName === 'A') {
        const p = k.closest('p, div') || k;
        osat.push(p);
        for (let n = p.nextElementSibling; n && n.tagName === 'P' && !n.querySelector('a.spip_note, [id^="nb"]'); n = n.nextElementSibling) osat.push(n);
      } else osat.push(k);
      const d = document.createElement('div');
      osat.forEach(o => d.appendChild(o.cloneNode(true)));
      d.querySelectorAll('.spip_note_ref, a.spip_note, a[id^="nb"]').forEach(y => y.remove());
      d.querySelectorAll('[id]').forEach(y => y.removeAttribute('id'));
      siivoa(d);
      kkLinkit(d, new RegExp('^https?://([a-z0-9-]+\\.)*' + location.hostname.replace(/^www\./, '').replace(/\./g, '\\.') + '/', 'i'));
      const t = muunna(d.innerHTML, 'inlined').trim().replace(/^\\?\[?\s*\\?\]?\s*/, '');
      const ed = kohta.previousSibling;
      if (ed && ed.nodeType === 3) ed.data = ed.data.replace(/[\s ]+$/, '');
      if (!t) { kohta.remove(); return; }
      const tunnus = 'sp' + (++laskuri.n);
      kohta.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    if (chapo && !texte.contains(chapo)) {
      const c = chapo.cloneNode(true); siivoa(c); viitteet(c);
      if (rivi(c.textContent)) { el.append(...[...c.childNodes]); el.appendChild(document.createElement('hr')); }
    }
    const t = texte.cloneNode(true); siivoa(t); viitteet(t);
    el.append(...[...t.childNodes]);
    if (ps && !texte.contains(ps) && rivi(ps.textContent)) {
      const p = ps.cloneNode(true); siivoa(p); viitteet(p);
      if (!p.querySelector('h2, h3, h4')) { const h = document.createElement('h2'); h.textContent = 'Post-scriptum'; el.appendChild(h); }
      el.append(...[...p.childNodes]);
    }
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('hr, table, br')) x.remove(); });
    kkLinkit(el, new RegExp('^https?://([a-z0-9-]+\\.)*' + location.hostname.replace(/^www\./, '').replace(/\./g, '\\.') + '/', 'i'));
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const meta = n => rivi((document.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]') || {}).content);
    // Tekijät otsikon lähiympäristöstä (sivupalkkien luettelot pois), muuten meta.
    const alue = titreEl && (titreEl.closest('header, .cartouche, .entry-header, article') || titreEl.parentElement.parentElement);
    // Kääntäjät (Books & Ideas: div.lestraducteurs translated by <span class="vcard author">) erikseen.
    const nimet = valinta => alue ? [...new Set([...alue.querySelectorAll(valinta)].map(x => rivi(x.textContent)).filter(Boolean))] : [];
    const kaantajat = nimet('.lestraducteurs .vcard .fn');
    let tekijat = nimet('.vcard.author .fn, .vcard.author a, a[rel="author"]').filter(n => !kaantajat.includes(n));
    if (!tekijat.length && meta('author')) tekijat = meta('author').split(/\s*,\s*/);
    const attr = (sel, a) => { const e = document.querySelector(sel); return e ? e.getAttribute(a) || '' : ''; };
    const aika = meta('bepress_citation_date') || meta('article:published_time') || meta('DC.date') || attr('time[datetime]', 'datetime') ||
      attr('[itemprop="datePublished"][content]', 'content') || attr('abbr.published[title]', 'title');
    const sivusto = meta('og:site_name') || rivi(document.title).split(/\s+[-–|]\s+/).slice(1).join(' - ') || location.hostname.replace(/^www\./, '');
    // Otsikko: crayon tai h1:n .titre (La Vie des idées: h1 > div.titre + div.descriptif À propos de : …), alaotsikko crayon,
    // otsikkoalueen .soustitre tai h1:n .descriptif (sivupalkin luetteloissa on omia .soustitre-lohkoja).
    const titre = crayon('titre') || titreEl && titreEl.querySelector('.titre') || titreEl;
    const ala = crayon('soustitre') || alue && alue.querySelector('.soustitre') || titreEl && titreEl.querySelector('.descriptif');
    return { html: irrota([el]).innerHTML, otsikko: rivi(titre ? titre.textContent : '') || meta('DC.title') || rivi(document.title),
      alaotsikko: rivi(ala ? ala.textContent : ''), tekija: kkLuettelo(tekijat), suomentaja: kkKaantaja(kaantajat),
      julkaistu: (/^\d{4}-\d\d-\d\d/.exec(aika) || [''])[0], sivusto, lahde: osoite, maar };
  }

  /* Political Concepts: A Critical Lexicon (politicalconcepts.org; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 5).
     WordPress taulukkoasettelulla: artikkeli td.entry-content-right, otsikko h1.entry-title (Käsite: Tekijä). Alussa kuva, sen
     kuvateksti ja otsikko isolla keskitettyinä kappaleina; väliotsikot lihavoituja kappaleita (1. Introduction); viitteet Wordista
     liitettyinä: merkki a[href="#fnN"] > sup tekstissä, ja keskitetyn tähden ja viivan (hr.wp-block-separator) jälkeen kappaleet,
     joiden sup alkaa numerolla (1. …) ja joissa on paluulinkki ↩. Viitteiden id:t eivät ole luotettavia (Consciousness-Raising:
     fn32 toistuu 32 kertaa, merkeissä fn29 kahdesti), joten merkki yhdistetään viitteeseen sen numerotekstin mukaan. Readability
     jätti viitteet raa'aksi HTML:ksi (110–260 jäännettä, 24–63 md.js-varoitusta), otti kuvatekstin ja otsikon kahdesti eikä
     tekijää ja päivää tullut. Otsikko käsitteeksi ja tekijä otsikon loppuosasta, päivä kommentoidusta entry-metasta (January 31,
     2026), alun keskitetyt kappaleet ja sisällysluettelo (#-linkit) pois, lihavoidut numeroidut väliotsikot (1. Introduction)
     otsikoiksi, keskitetty tähti osanvaihdoksi, Published on -rivi, Wordin tyhjät ankkurit (_ftn) ja h5-väliköt pois.
     Ei mainoksia eikä lahjoituspyyntöä. Mitattu 18.11.2026. */
  const PC_NIMI = 'Political Concepts: A Critical Lexicon';
  async function politicalconcepts() {
    if (!/(^|\.)politicalconcepts\.org$/i.test(location.hostname)) return null;
    const runko = document.querySelector('td.entry-content-right'), h1 = document.querySelector('h1.entry-title');
    if (!runko || !h1) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('script, style, img, h5, a[name^="_ftn"]:not([href]), a[href^="#_ftnref"]:empty').forEach(x => x.remove());
    // Viitteet: viimeisen viivan jälkeiset numerolla alkavat kappaleet (jatkokappaleineen).
    const viivat = [...el.querySelectorAll('hr')];
    const viiva = viivat.reverse().find(h => [...el.querySelectorAll('p')].some(p => (h.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING) && /^\d+\.\s/.test(rivi(p.textContent))));
    const viitteet = new Map(), maar = [];
    if (viiva) {
      let nyt = null;
      for (let n = viiva.nextElementSibling; n; n = n.nextElementSibling) {
        const m = /^(\d+)\.\s/.exec(rivi(n.textContent));
        if (m && !viitteet.has(m[1])) { nyt = [n]; viitteet.set(m[1], nyt); } else if (nyt && rivi(n.textContent)) nyt.push(n);
      }
    }
    const tunnukset = new Map();
    el.querySelectorAll('a[href^="#"]').forEach(a => {
      const n = rivi(a.textContent);
      if (!/^\d+$/.test(n) || !viitteet.has(n) || !viiva || !(a.compareDocumentPosition(viiva) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      if (!tunnukset.has(n)) {
        const d = document.createElement('div');
        viitteet.get(n).forEach(x => d.appendChild(x.cloneNode(true)));
        d.querySelectorAll('a[href^="#"]').forEach(x => /^[↩↑]︎?$/.test(rivi(x.textContent)) ? x.remove() : x.replaceWith(...x.childNodes));
        d.querySelectorAll('sup').forEach(x => x.replaceWith(...x.childNodes));
        d.querySelectorAll('[style], [class], [id]').forEach(x => { x.removeAttribute('style'); x.removeAttribute('class'); x.removeAttribute('id'); });
        const t = muunna(d.innerHTML, 'inlined').trim().replace(/^\d+\\?\.\s+/, '');
        tunnukset.set(n, t ? 'pc' + n : '');
        if (t) maar.push(maaritelma('pc' + n, t));
      }
      const tun = tunnukset.get(n);
      if (!tun) return;
      const kohta = a.parentElement.tagName === 'SUP' && rivi(a.parentElement.textContent) === n ? a.parentElement : a;
      kohta.replaceWith(merkki(tun));
    });
    if (viiva) {
      // Viiva, sen edellä oleva tähti ja viitteet pois.
      for (let n = viiva.nextElementSibling; n;) { const s = n.nextElementSibling; n.remove(); n = s; }
      const ed = viiva.previousElementSibling;
      if (ed && /^\*$/.test(rivi(ed.textContent))) ed.remove();
      viiva.remove();
    }
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    el.querySelectorAll('span').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('hr, br')) x.remove(); });
    // Alun kuvateksti ja iso otsikko (keskitetyt kappaleet ennen tekstiä).
    const keskitetty = [...runko.querySelectorAll('p[style*="center"]')].map(p => rivi(p.textContent)).filter(Boolean);
    for (let p = el.firstElementChild; p && p.tagName === 'P' && keskitetty.includes(rivi(p.textContent)); p = el.firstElementChild) p.remove();
    // Alun sisällysluettelo (Spontaneity: lihavoidut linkit #introduction …) pois.
    el.querySelectorAll('p').forEach(p => {
      const a = p.querySelectorAll('a[href^="#"]');
      if (a.length && rivi(p.textContent) === [...a].map(x => rivi(x.textContent)).join(' ').trim() && !p.textContent.includes('XLUINVIITE')) p.remove();
    });
    // Kokonaan lihavoitu numeroitu kappale (1. Introduction) väliotsikoksi; tähti (*) osanvaihdoksi.
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent), b = [...p.querySelectorAll('b, strong')].reduce((n, x) => n + rivi(x.textContent).length, 0);
      if (/^[*⁂]+$/.test(t)) return p.replaceWith(document.createElement('hr'));
      if (!t || t.length > 120 || b < t.length - 1 || !/^([IVX]+|\d+)\.\s+\p{L}/u.test(t)) return;
      const h = document.createElement('h2'); h.textContent = t; p.replaceWith(h);
    });
    // Lopun Published on -rivi (päivä on etukentässä).
    el.querySelectorAll('p').forEach(p => { if (/^published on\s/i.test(rivi(p.textContent)) && rivi(p.textContent).length < 60) p.remove(); });
    while (el.lastElementChild && el.lastElementChild.tagName === 'HR') el.lastElementChild.remove();
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*politicalconcepts\.org\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const ots = rivi(h1.textContent), jako = ots.lastIndexOf(': ');
    let pvm = '';
    const w = document.createTreeWalker(document.querySelector('.post_title') || document.body, NodeFilter.SHOW_COMMENT);
    for (let c; (c = w.nextNode());) {
      const m = /entry-date">\s*(\p{L}+)\s+(\d{1,2}),\s*(\d{4})/u.exec(c.data);
      const kk = m ? EN_KUUKAUDET.indexOf(m[1].toLowerCase()) : -1;
      if (kk >= 0) { pvm = m[3] + '-' + String(kk + 1).padStart(2, '0') + '-' + m[2].padStart(2, '0'); break; }
    }
    return { html: irrota([el]).innerHTML, otsikko: rivi(jako > 0 ? ots.slice(0, jako) : ots), tekija: jako > 0 ? rivi(ots.slice(jako + 2)) : '',
      julkaistu: pvm, sivusto: PC_NIMI, lahde: osoite, maar };
  }

  /* Project Vox (projectvox.org, Duke; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 6: varhaismodernit naisfilosofit,
     yksi pitkä sivu filosofia kohti, myös käännökset kuten Shepherd en français omina HTML-sivuinaan). WordPress (Sydney-teema),
     tunnistus rakenteesta: sisällysluettelo #page_menu, jonka linkeissä on data-vox-section (1., 1.1 …), ja .entry-content.
     Osiot ovat h3-otsikoita (1. Biography, 1.1 Portraits … 3.3 Annotated Bibliography, 4. Philosophy Guide …), joiden teksti
     on Wordin span- ja b-kääreissä; aikajanat Wordin taulukoita (DATE, EVENT); kuvat figure.wp-caption kuvateksteineen tekstin
     lomassa; alussa viittaus- ja tekijätietolaatikko (taulukko, linkki Citation & Credits -sivulle). Readability jätti aikajanat
     raa'aksi HTML:ksi (Tullia d'Aragona 436 jäännettä, Shepherd 462), kuvatekstit tekstin väliin ja sisällysluettelon otsikot
     numerovaroituksin. Sisällysluettelo, kuvat kuvateksteineen ja tietolaatikko pois, taulukot ruudukoiksi (ojsTaulukko),
     otsikot pelkäksi tekstiksi ja tasoiksi numeroinnin mukaan (1. → luku, 1.1 → osio, numeroton → kohta). Tekijä DC.creatorista
     (Project Vox Team; tekijät ovat Credits-sivulla). Cavendishin, Conwayn ja Shepherdin sivuilta puuttuu osio 1.1 (myös sivun
     omasta sisällysluettelosta), joten md.js varoittaa numeroinnista; otsikoita ei numeroida uudelleen. Ei mainoksia eikä lahjoituspyyntöä (Duke). Mitattu 18.11.2026. */
  const VOX_NIMI = 'Project Vox';
  async function projectvox() {
    const valikko = document.querySelector('#page_menu'), runko = document.querySelector('.entry-content');
    if (!valikko || !runko || !valikko.querySelector('a[data-vox-section]')) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('#page_menu, figure, .wp-caption, .gallery, img, script, style, iframe, .so-widget-sow-image').forEach(x => x.remove());
    el.querySelectorAll('table').forEach(t => { if (t.querySelector('a[href*="/credits"]') && kkSanoja(t) < 40) t.remove(); });
    el.querySelectorAll('table').forEach(t => { const d = document.createElement('div'); t.replaceWith(d); d.appendChild(t); ojsTaulukko(t); });
    el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      const t = rivi(h.textContent);
      if (!t) return h.remove();
      const m = /^(\d+)(\.\d+)?\.?\s/.exec(t);
      const u = document.createElement('h' + (m ? (m[2] ? 3 : 2) : 4));
      u.textContent = t;
      h.replaceWith(u);
    });
    el.querySelectorAll('[data-contrast], [data-ccp-props]').forEach(x => { x.removeAttribute('data-contrast'); x.removeAttribute('data-ccp-props'); });
    el.querySelectorAll('span').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('table, hr, br')) x.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*projectvox\.org\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const meta = n => rivi((document.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]') || {}).content);
    return { html: irrota([el]).innerHTML, otsikko: rivi((document.querySelector('h1.entry-title, h1') || {}).textContent) || rivi(document.title),
      tekija: meta('DC.creator') || meta('author'), julkaistu: (meta('article:published_time') || '').slice(0, 10), sivusto: VOX_NIMI, lahde: osoite };
  }

  /* Embryo Project Encyclopedia (embryo.asu.edu; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 7: lääketieteen ja
     biologian historian hakuteos, Arizona State University). Drupal 10: otsikko h1.article, tekijät .author-item (By: <strong>Nimi),
     toimittaja .editor-item, päivä Published: <time>, viivan hr.copy-divider jälkeinen div.block artikkelina, lähteet div#references
     (h2 Sources, ol) tai uudemmissa (2025) h3 Sources ja ol.uds-list. Mittaus ensin: Readability antoi tekstin hyvin, mutta tekijäksi By: Sharaden Seward By: Claudia Nunez-Eddy,
     lähteet luettelona (md.js:n kirjallisuusluettelo ei tunnista luetteloa: p.bib 0) ja linkit viitelinkkeinä (Roe v. Wade 22),
     eikä päivää, toimittajaa eikä lisenssiä tullut. Siksi pieni sovite: lähteiden kohdat kappaleiksi otsikon Sources alle, tekijät
     ja toimittaja erikseen, päivä, kustantaja (Publisher-lohko) ja CC-lisenssi (Articles Rights and Graphics). Ei mainoksia eikä
     lahjoituspyyntöä. Mitattu 18.11.2026. */
  async function embryo() {
    const h1 = document.querySelector('h1.article'), viiva = document.querySelector('hr.copy-divider');
    const ref = document.getElementById('references');
    const lohko = ref ? ref.closest('.block') || ref.parentElement : viiva && viiva.parentElement.nextElementSibling;
    if (!lohko || !h1 || !document.querySelector('.author-item')) return null;
    const el = lohko.cloneNode(true);
    el.querySelectorAll('title, script, style, img, figure').forEach(x => x.remove());
    // Lähteet: #references tai uudemmissa h3 Sources ja ol.
    const lahteet = el.querySelector('#references') ? [...el.querySelectorAll('#references ol, #references ul')]
      : [...el.querySelectorAll('h2, h3')].filter(h => /^(sources|references|bibliography)$/i.test(rivi(h.textContent))).map(h => h.nextElementSibling).filter(x => x && /^(OL|UL)$/.test(x.tagName));
    lahteet.forEach(l => { [...l.children].forEach(li => { const p = document.createElement('p'); p.append(...li.childNodes); l.before(p); }); l.remove(); });
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' '))) p.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*embryo\.asu\.edu\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const nimet = s => [...document.querySelectorAll(s)].map(x => rivi(x.textContent).replace(/^by:\s*/i, '')).filter(Boolean);
    const pv = [...document.querySelectorAll('.field-content')].find(x => /^published:/i.test(rivi(x.textContent)));
    const t = pv && pv.querySelector('time[datetime]');
    const kust = [...document.querySelectorAll('.view-header h2')].find(h => /^publisher$/i.test(rivi(h.textContent)));
    const cc = document.querySelector('a[href*="creativecommons.org/licenses"]');
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), tekija: kkLuettelo(nimet('.author-item')),
      toimittaja: kkLuettelo(nimet('.editor-item')), julkaistu: t ? t.getAttribute('datetime').slice(0, 10) : '',
      kustantaja: kust ? rivi(kust.closest('.view').querySelector('.view-content').textContent).replace(/\.$/, '') : '',
      sivusto: 'Embryo Project Encyclopedia', lahde: osoite,
      oikeus: cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } : null };
  }

  /* Cuneiform Digital Library Journal, Bulletin ja Notes (cdli.earth/articles/cdlj|cdlb|cdln; käyttäjän pyyntö 18.11.2026, pahvin
     *10 sivustosovitetta* 8: assyriologian vertaisarvioitu lehti HTML:nä). Tunnistus: #content article ja citation_publisher Cuneiform
     Digital Library Initiative. Artikkeli on article-elementissä: §-numeroidut kappaleet (<b>§0.1.</b> teksti), otsikot h2/h3
     lihavoituina tai vanhassa CDLB:ssä kappaleen alussa (<b>§1. <i>The Textual Record</i></b><br><b>§1.1.</b> …), viitteet
     sup > a#rN[href="#fN"] → li#fN (CDLB: a[name=fnN] → taulukon solun kappale a#fnnN), kirjallisuus otsakkeen Bibliography
     (keskitetty lihavoitu kappale viivojen välissä) tai References alla ol > li > div.csl-entry, translitteraatiot taulukoina
     (obverse, translation; sila<sub>4</sub>, <sup>d</sup>). Readability jätti viitteet ja kirjallisuuden tunnistamatta (alaviitteitä
     0, p.bib 0), taulukot raa'aksi HTML:ksi (CDLB 60, CDLN 177 merkintää) eikä tekijöitä tullut. §-numero yläindeksiksi kappaleen
     alkuun (kuten EUR-Lexin kappalenumerot), CDLB:n kappaleen alun §-otsikko omaksi otsikokseen, viitteet samanSivunViitteet()-
     muodossa, kirjallisuus kappaleiksi (csl-entry, CDLN:n luettelo ja CDLB:n kirjallisuustaulukko), tyhjä Notes-otsikko pois, taulukot ruudukoiksi niin, että solujen ylä- ja alaindeksit ja kursiivit säilyvät
     (translitteraatio). Kuvat pois, kuvateksti kursiiviksi. Etukenttään tyyppi tieteellinen, tekijät (citation_author), teos, numero
     (vuosikerta:numero), julkaistu vuosikerrasta (citation_publication_date on 1970/01/01), kustantaja ja CC-lisenssi.
     Lahjoitusnappi (Donate, Open Collective) on sivuston yläpalkissa, mainoksia ei ole (RAHOITUS). Mitattu 18.11.2026. */
  function cdTaulukko(t) {
    const ruudukko = [];
    [...t.rows].forEach((r, i) => {
      const rv = ruudukko[i] = ruudukko[i] || [];
      let j = 0;
      [...r.cells].forEach(c => {
        while (rv[j] !== undefined) j++;
        const k = c.cloneNode(true);
        k.querySelectorAll('meta, br').forEach(x => x.replaceWith(' '));
        k.querySelectorAll('*').forEach(x => { if (!/^(SUB|SUP|I|EM|B|STRONG)$/.test(x.tagName)) x.replaceWith(...x.childNodes); else [...x.attributes].forEach(a => x.removeAttribute(a.name)); });
        const cs = Math.max(1, c.colSpan || 1);
        for (let b = 0; b < cs; b++) rv[j + b] = b ? '' : k.innerHTML.replace(/\s+/g, ' ').trim();
        j += cs;
      });
    });
    const n = Math.max(0, ...ruudukko.map(r => r.length));
    if (n < 2 || ruudukko.length < 2) return ojsTaulukko(t);
    const u = document.createElement('table'), tb = document.createElement('tbody');
    ruudukko.forEach((r, i) => {
      const tr = document.createElement('tr');
      for (let j = 0; j < n; j++) { const c = document.createElement(i ? 'td' : 'th'); c.innerHTML = r[j] || ''; tr.appendChild(c); }
      tb.appendChild(tr);
    });
    u.appendChild(tb);
    t.replaceWith(u);
  }
  async function cdli() {
    const art = document.querySelector('#content article');
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    if (!art || !/cuneiform digital library/i.test(meta('citation_publisher')[0] || '')) return null;
    const el = art.cloneNode(true);
    el.querySelectorAll('script, style, img, button').forEach(x => x.remove());
    el.querySelectorAll('center').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('figure').forEach(f => {
      const c = f.querySelector('figcaption');
      if (!c || !rivi(c.textContent)) return f.remove();
      const p = document.createElement('p'), em = document.createElement('em'); em.textContent = rivi(c.textContent); p.appendChild(em); f.replaceWith(p);
    });
    // Viitteet ennen taulukoita (CDLB:n viitteet ovat taulukon soluissa).
    const maar = samanSivunViitteet(el, 'cd');
    el.querySelectorAll('ol, ul').forEach(l => { if (!rivi(l.textContent)) l.remove(); });
    // Kirjallisuuden otsake (keskitetty lihavoitu kappale viivojen välissä) otsikoksi, kohdat kappaleiksi.
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent);
      if (!/^(bibliography|references|works cited|notes)$/i.test(t) || !p.querySelector('b, strong')) return;
      const h = document.createElement('h2'); h.textContent = t; p.replaceWith(h);
    });
    el.querySelectorAll('.csl-entry').forEach(c => {
      const p = document.createElement('p'); p.append(...c.childNodes);
      const li = c.closest('li');
      (li || c).replaceWith(p);
    });
    el.querySelectorAll('ol, ul').forEach(l => { if (!l.querySelector('li')) l.replaceWith(...l.childNodes); });
    // Kirjallisuusotsikon jälkeinen luettelo (CDLN) tai taulukko (CDLB: tekijä, vuosi, nimi soluina) kappaleiksi.
    el.querySelectorAll('h1, h2, h3, h4, p').forEach(h => {
      if (!/^(bibliography|references|works cited|sources)$/i.test(rivi(h.textContent))) return;
      let n = h.nextElementSibling;
      while (n && n.tagName === 'HR') n = n.nextElementSibling;
      if (n && /^(OL|UL)$/.test(n.tagName)) { [...n.children].forEach(li => { const p = document.createElement('p'); p.append(...li.childNodes); n.before(p); }); n.remove(); }
      else if (n && n.tagName === 'TABLE') {
        // Tekijä omalla rivillään (colspan), teokset vuosineen sen alla: tekijä jokaisen kohdan alkuun.
        let tekija = '';
        [...n.rows].forEach(r => {
          const solut = [...r.cells].filter(c => rivi(c.textContent));
          if (solut.length === 1 && solut[0].colSpan > 1) { tekija = rivi(solut[0].textContent); return; }
          const p = document.createElement('p');
          if (tekija) p.append(tekija.replace(/\.?$/, '.') + ' ');
          solut.forEach((c, i) => { if (i) p.append(' '); p.append(...c.childNodes); });
          if (rivi(p.textContent)) n.before(p);
        });
        n.remove();
      }
    });
    el.querySelectorAll('hr').forEach(h => { const s = h.nextElementSibling, e = h.previousElementSibling; if (s && /^H\d$/.test(s.tagName) || e && /^H\d$/.test(e.tagName)) h.remove(); });
    // CDLB: kappaleen alun §-otsikko (<b>§1. <i>Otsikko</i></b><br>) omaksi otsikokseen.
    el.querySelectorAll('p').forEach(p => {
      const b = p.firstElementChild, br = b && b.nextElementSibling;
      if (!b || !/^(B|STRONG)$/.test(b.tagName) || !br || br.tagName !== 'BR' || !/^§\s?[\d.]+\s+\p{L}/u.test(rivi(b.textContent))) return;
      if (rivi(p.textContent).indexOf(rivi(b.textContent)) !== 0) return;
      const h = document.createElement('h2'); h.textContent = rivi(b.textContent);
      p.before(h); b.remove(); br.remove();
    });
    // §-numero kappaleen alussa yläindeksiksi.
    el.querySelectorAll('p').forEach(p => {
      const b = p.querySelector('b, strong');
      if (!b || rivi(p.textContent).indexOf(rivi(b.textContent)) !== 0 || !/^§\s?\d+(\.\d+)*\.?$/.test(rivi(b.textContent))) return;
      const sup = document.createElement('sup'); sup.textContent = rivi(b.textContent).replace(/\.$/, '').replace(/^§\s?/, '§');
      b.replaceWith(sup, ' ');
    });
    el.querySelectorAll('table').forEach(t => { if (!rivi(t.textContent)) return t.remove(); const d = document.createElement('div'); t.replaceWith(d); d.appendChild(t); cdTaulukko(t); });
    el.querySelectorAll(OTSIKOT).forEach(h => { const t = rivi(h.textContent).replace(MERKKI, '').trim(); if (!t) return h.remove(); h.querySelectorAll('b, strong').forEach(x => x.replaceWith(...x.childNodes)); });
    // Tyhjäksi jäänyt Notes-otsikko (viitteet siirtyivät) pois.
    el.querySelectorAll(OTSIKOT).forEach(h => { let n = h.nextElementSibling; while (n && n.tagName === 'HR') n = n.nextElementSibling; if (/^notes?$/i.test(rivi(h.textContent)) && (!n || /^H\d$/.test(n.tagName))) h.remove(); });
    el.querySelectorAll('hr + hr').forEach(h => h.remove());
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' ')) && !p.querySelector('br, hr')) p.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*cdli\.earth\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const vk = meta('citation_volume')[0] || '';
    const cc = document.querySelector('a[href*="creativecommons.org/licenses"]');
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    const teos = meta('citation_journal_title')[0];
    return { html: irrota([el]).innerHTML, otsikko: meta('citation_title')[0] || rivi(document.title), tyyppi: 'tieteellinen',
      tekija: kkLuettelo(meta('citation_author')), teos, numero: [vk, meta('citation_issue')[0]].filter(Boolean).join(':'),
      julkaistu: /^\d{4}$/.test(vk) ? vk : '', kustantaja: meta('citation_publisher')[0] || '', lahde: osoite, maar,
      oikeus: cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } : null, naytto: teos };
  }

  /* Журнальный зал (magazines.gorky.media; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 9: venäläisten
     kirjallisuuslehtien arkisto, Новый мир, Знамя, Новый Журнал ym.). WordPress: section.article, tekijä h4.article-header,
     otsikko h2.article-title, julkaisutieto .article-body-pub-info (Опубликовано в журнале <a>Новый Журнал</a>, <a>номер 305,
     2021</a>). Teksti on template#article_template-elementissä, jonka sivun skripti kopioi #article_container-lohkoon; sovite
     lukee täytetyn lohkon tai sen puuttuessa templaten sisällön (ei riipu skriptistä). Templaten lopussa on Wordin tyylilohko.
     Wordin loppuviitteet: merkki a[href="#_ednN"] tai #_ftnN tekstinä [i], kohde a[name="_ednN"] kappaleen alussa viivan
     jälkeen; roomalaisia tunnuksia samanSivunViitteet() ei tunne, joten ne käsitellään tässä. Linkittömät yläindeksit (<sup>1</sup>)
     yhdistetään lopun numeroituihin kappaleisiin (1. «Современные записки» …) numeron mukaan, jos vähintään puolet löytyy. Keskitetty lyhyt kappale (luvun
     nimi ОПОЗДАНИЕ) otsikoksi, tähdet osanvaihdoksi. Etukenttään tekijä, teos (lehti) ja numero kuten NDPR:ssä, julkaistu
     (vuosi), sivusto. Readability (sivun skripti ajettuna) antoi tekstin, mutta otsikkoon sivuston nimen, viitteet linkkeinä
     ([i]) eikä tekijää, lehteä eikä numeroa. md.js tavuttaa vain suomen ja liettuan säännöin: kyrillinen teksti jää
     tavuttamatta (venäjän tavutus kirjattu tarpeeksi). Ei mainoksia (vain Google Analytics) eikä lahjoituspyyntöä.
     Mitattu 18.11.2026. */
  const ZZ_NIMI = 'Журнальный зал';
  async function zhurnal() {
    const tpl = document.getElementById('article_template'), info = document.querySelector('.article-body-pub-info');
    const h2 = document.querySelector('section.article h2.article-title, h2.article-title');
    if (!tpl || !info || !h2) return null;
    const astia = document.getElementById('article_container');
    const el = document.createElement('div');
    el.append(astia && rivi(astia.textContent) ? astia.cloneNode(true) : tpl.content.cloneNode(true));
    el.querySelectorAll('style, script, img, iframe').forEach(x => x.remove());
    // Loppuviitteet: [i] → a[name=_ednN] (tai _ftnN) kappaleen alussa.
    const maar = [], laskuri = { n: 0 };
    el.querySelectorAll('a[href^="#_edn"], a[href^="#_ftn"]').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      if (/ref\d/.test(id)) return;
      const k = el.querySelector('a[name="' + id + '"], [id="' + id + '"]');
      const p = k && k.closest('p');
      if (!p || p.contains(a)) return;
      const osat = [p];
      for (let n = p.nextElementSibling; n && n.tagName === 'P' && !n.querySelector('a[name^="_edn"], a[name^="_ftn"]') && rivi(n.textContent.replace(/ /g, ' ')); n = n.nextElementSibling) osat.push(n);
      const d = document.createElement('div');
      osat.forEach(o => d.appendChild(o.cloneNode(true)));
      d.querySelectorAll('a[name^="_edn"], a[name^="_ftn"], a[href^="#_edn"], a[href^="#_ftn"]').forEach(x => x.remove());
      d.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
      const t = muunna(d.innerHTML, 'inlined').trim();
      osat.forEach(o => o.remove());
      const kohta = a.parentElement && a.parentElement.tagName === 'SUP' && rivi(a.parentElement.textContent) === rivi(a.textContent) ? a.parentElement : a;
      if (!t) { kohta.remove(); return; }
      const tunnus = 'zz' + (++laskuri.n);
      kohta.replaceWith(merkki(tunnus));
      maar.push(maaritelma(tunnus, t));
    });
    // Linkittömät yläindeksiviitteet (Кузнецова: »¹ ja lopussa numeroidut kappaleet 1. «Современные записки» …): numeron mukaan.
    if (!maar.length) {
      const supit = [...el.querySelectorAll('sup')].filter(x => /^\d{1,3}$/.test(rivi(x.textContent)));
      const kpl = new Map();
      [...el.querySelectorAll('p')].forEach(p => { const m = /^(\d{1,3})\\?\.\s/.exec(rivi(p.textContent)); if (m && !kpl.has(m[1]) && !p.querySelector('sup')) kpl.set(m[1], p); });
      if (supit.length && supit.filter(x => kpl.has(rivi(x.textContent))).length >= supit.length / 2) {
        const tehty = new Map();
        supit.forEach(x => {
          const n = rivi(x.textContent), p = kpl.get(n);
          if (!p || !(x.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
          if (!tehty.has(n)) {
            const d = p.cloneNode(true);
            d.querySelectorAll('[style]').forEach(y => y.removeAttribute('style'));
            const t = muunna(d.innerHTML, 'inlined').trim().replace(/^(\*{0,2})\d{1,3}\\?\.\s+/, '$1');
            tehty.set(n, t ? 'zz' + n : '');
            if (t) maar.push(maaritelma('zz' + n, t));
          }
          if (tehty.get(n)) x.replaceWith(merkki(tehty.get(n)));
        });
        tehty.forEach((t, n) => { if (t) kpl.get(n).remove(); });
      }
    }
    // Viite tekstin alussa yksinään (otsikon viite: Лауреат … премии) otsikon perään.
    let otsikkoMerkit = '';
    const ens = [...el.querySelectorAll('p')].find(p => rivi(p.textContent.replace(/ /g, ' ')));
    if (ens && /^XLUINVIITE\w+?X$/.test(rivi(ens.textContent))) { otsikkoMerkit = rivi(ens.textContent); ens.remove(); }
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent.replace(/ /g, ' '));
      if (!t) return p.remove();
      if (/^[*•⁂\s]+$/.test(t)) return p.replaceWith(document.createElement('hr'));
      if (/center/.test(p.getAttribute('style') || '') && t.length <= 80 && !/[.,;:!?…»”"]$/.test(t)) { const h = document.createElement('h2'); h.textContent = t; p.replaceWith(h); }
    });
    while (el.lastElementChild && el.lastElementChild.tagName === 'HR') el.lastElementChild.remove();
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*gorky\.media\//i);
    if (kkSanoja(el) < 50) return null;
    kkTasoita(el);
    const linkit = [...info.querySelectorAll('a')].map(a => rivi(a.textContent));
    const nro = /номер\s+([\w–-]+)/i.exec(rivi(info.textContent)), v = /\b(1[89]\d\d|20\d\d)\b/.exec(rivi(info.textContent));
    const tekijat = [...document.querySelectorAll('section.article .article-header a, section.article h4.article-header')].map(x => rivi(x.textContent)).filter(Boolean);
    return { html: irrota([el]).innerHTML, otsikko: rivi(h2.textContent), tekija: kkLuettelo([...new Set(tekijat)]),
      teos: linkit[0] || '', numero: nro ? nro[1] : '', julkaistu: v ? v[1] : '', sivusto: ZZ_NIMI, lahde: osoite, maar, otsikkoMerkit };
  }

  /* Fabula: Acta fabula ja Fabula-LhT (fabula.org/revue, /lht; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* 10:
     kirjallisuustieteen lehdet). Lodel kuten OpenEdition, mutta oma teema: OpenEdition-sovitteen tunnistus (verkkotunnus ja
     #docBody) ei osu, joten tämä on oma sovite, joka käyttää sen Lodel-apufunktioita (oeViitteet(): a.footnotecall →
     p.notesbaspage > a.FootnoteSymbol jatkokappaleineen; oeSiivoa(): span.paranumber yläindeksiksi, p.quotation lainaukseksi,
     kapiteeli tavalliseksi). Tunnistus Lodelin merkinnöistä: #item-text.le-texte, jossa p.texte ja span.paranumber. Otsake:
     .auteur, h1, vaihtoehtoinen otsikko div[lang], .precisions (DOI ja Acta fabulassa arvioitavan kirjan tiedot, jotka tulevat
     tekstin alkuun lihavoituna kappaleena kuten NDPR:ssä). Tiivistelmät #resumes .resumes[lang] (ranska ja englanti) tekstin
     alkuun kielen nimen ja saman kielen otsikon kanssa, sitten osanvaihto; kirjallisuus #bibliographie p.bibliographie otsikon
     Bibliographie alle. Anfangi (span.lettrine) liitetään sanaansa. Etukenttään tyyppi tieteellinen, tekijät (citation_authors),
     teos (lehti), numero (vol. 27, n° 4 → 27:4; LhT:ssä n° 30 sivun otsakkeesta), julkaistu (citation_date ranskaksi), doi,
     kustantaja ja CC-lisenssi. Readability jätti viitteet irrallisiksi (alaviitteitä 0), kirjallisuuden ja viitteiden yläindeksit
     raa'aksi HTML:ksi (LhT: 14 jäännettä, 6 md.js-varoitusta) eikä tekijää, lehteä eikä päivää tullut. Ei mainoksia eikä
     lahjoituspyyntöä. Mitattu 18.11.2026. */
  const FB_KIELET = { fr: 'Français', en: 'English', eng: 'English', de: 'Deutsch', it: 'Italiano', es: 'Español' };
  async function fabula() {
    const teksti = document.querySelector('#item-text.le-texte, .le-texte');
    if (!teksti || !teksti.querySelector('p.texte span.paranumber')) return null;
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content)).filter(Boolean);
    const el = document.createElement('div'), maar = [], laskuri = { n: 0 };
    const otsake = document.querySelector('header.entete') || document;
    const h1 = otsake.querySelector('h1') || document.querySelector('h1.mb-0');
    const alt = [...otsake.querySelectorAll('.titres > div[lang]')].map(d => ({ kieli: d.getAttribute('lang'), t: rivi(d.textContent) }));
    // Acta fabula: arvioitavan kirjan tiedot (precisions ilman DOI:ta) lihavoituna kappaleena.
    [...otsake.querySelectorAll('.precisions')].filter(p => rivi(p.textContent) && !/^doi\s*:/i.test(rivi(p.textContent))).forEach(p => {
      const u = document.createElement('p'), b = document.createElement('strong');
      b.append(...p.cloneNode(true).childNodes); u.appendChild(b); el.appendChild(u);
    });
    // Tiivistelmät kielittäin.
    const tiiv = [...document.querySelectorAll('#resumes .resumes')];
    tiiv.forEach(r => {
      const kieli = r.getAttribute('lang') || (/resume(\w+)/.exec(r.id) || [])[1] || 'fr', k = kieli.slice(0, 2);
      if (tiiv.length > 1) {
        const p = document.createElement('p'), b = document.createElement('strong');
        b.textContent = (FB_KIELET[kieli] || FB_KIELET[k] || kieli) + '.'; p.appendChild(b);
        const a = alt.find(x => x.kieli && x.kieli.slice(0, 2) === k);
        if (a) { const i = document.createElement('em'); i.textContent = a.t; p.append(' ', i); }
        el.appendChild(p);
      }
      const c = r.cloneNode(true); c.querySelectorAll('h4').forEach(x => x.remove());
      el.append(...[...c.childNodes]);
    });
    if (el.children.length) el.appendChild(document.createElement('hr'));
    const k = teksti.cloneNode(true);
    k.querySelectorAll('span.lettrine').forEach(x => x.replaceWith(...x.childNodes));
    oeViitteet(k, document, maar, laskuri);
    oeSiivoa(k);
    el.append(...[...k.childNodes]);
    const bib = document.querySelector('#bibliographie');
    if (bib && bib.querySelector('p')) {
      const h = document.createElement('h2'); h.textContent = 'Bibliographie'; el.appendChild(h);
      const b = bib.cloneNode(true); b.querySelectorAll('h4').forEach(x => x.remove());
      oeSiivoa(b);
      el.append(...b.querySelectorAll('p'));
    }
    el.querySelectorAll('p.resume, p.texte, p.bibliographie').forEach(p => p.removeAttribute('class'));
    // Kursiivin sisällä <sup><em>e</em></sup> (xvii<sup>e</sup> siècle) jäisi raa'aksi HTML:ksi: korostus pois yläindeksistä.
    el.querySelectorAll('sup em, sup i, sup b, sup strong, sub em, sub i').forEach(x => x.replaceWith(...x.childNodes));
    maar.forEach((m, i) => { maar[i] = m.replace(/<(sup|sub)><(?:em|i|b|strong)>([^<]*)<\/(?:em|i|b|strong)><\/\1>/g, '<$1>$2</$1>'); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*fabula\.org\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const lehti = meta('citation_journal_title')[0] || '';
    const iss = meta('citation_issue')[0] || rivi(((document.querySelector('.entete') || document.body).previousElementSibling || {}).textContent || '');
    const vol = /vol\.?\s*(\d+)/i.exec(iss), nro = /n°\s*(\d+)/i.exec(iss) || /n°\s*(\d+)/i.exec(rivi((document.querySelector('main') || document.body).textContent).slice(0, 4000));
    const doi = otsake.querySelector('.precisions a[href*="doi.org"]');
    const cc = document.querySelector('a[href*="creativecommons.org/licenses"]');
    const ccn = cc && /licenses\/([a-z-]+)\/(\d\.\d)/i.exec(cc.href);
    const tekijat = meta('citation_authors').flatMap(x => x.split(/\s*;\s*/)).map(rivi).filter(Boolean);
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1 ? h1.textContent : '') || meta('citation_title')[0], tyyppi: 'tieteellinen',
      tekija: kkLuettelo(tekijat.length ? tekijat : [rivi((otsake.querySelector('.auteur') || {}).textContent)].filter(Boolean)),
      teos: lehti, numero: [vol && vol[1], nro && nro[1]].filter(Boolean).join(':'), julkaistu: euPvm(meta('citation_date')[0] || ''),
      doi: doi ? rivi(doi.textContent).replace(/^https?:\/\/doi\.org\//i, '') : '', kustantaja: meta('citation_publisher')[0] || '',
      lahde: osoite, maar, oikeus: cc ? { teksti: ccn ? 'CC ' + ccn[1].toUpperCase() + ' ' + ccn[2] : rivi(cc.textContent), lahde: cc.href } : null, naytto: lehti };
  }

  /* PoPuPS (popups.uliege.be, Liègen yliopiston lehtialusta; käyttäjän pyyntö 20.11.2026, sivustoehdokkaat-3 kärki 5: Bulletin
     d'analyse phénoménologique ym.). Lodel 1.0 vanhalla teemalla: OpenEdition- ja Fabula-sovitteen tunnistus ei osu, mutta merkintä
     on sama, joten oeViitteet() ja oeSiivoa() käyvät. Teksti div#texte (p.texte, span.paranumber, väliotsikot h1.texte, jonka
     linkki vie sisällysluetteloon), viitteet a.footnotecall → p.notesbaspage, tiivistelmä #resume (h4-kielinimin, useampi kieli
     lihavoituna otsakkeena kuten Fabulassa), kirjallisuus #bibliographie otsikon Bibliographie alle. Kielimerkinnät span[lang]
     puretaan sivun kopiosta (yläindeksissä ne jäivät raa'aksi HTML:ksi), kapea otsikoton taulukko (lyhenneluettelo) kappaleiksi
     ensimmäinen solu lihavoituna, muut ojsTaulukko():lla. Otsake #enteteDocument:
     h3 otsikko, (Volume 22 (2026) — Numéro 4) numeroksi 22:4 ja vuodeksi, tyyppi. Tekijät citation_author, lehti
     citation_journal_title, verkkojulkaisupäivä citation_online_date, sivut pdf-liitteen nimestä (p. 1-21). Ei mainoksia eikä
     lahjoituspyyntöä. Mitattu 20.11.2026. */
  async function popups() {
    if (!/(^|\.)popups\.uliege\.be$/i.test(location.hostname)) return null;
    if (!document.getElementById('texte') || !document.querySelector('#texte p.texte')) return null;
    // Kielimerkinnät (span[lang]) pois kopiosta, myös viitteistä: yläindeksin sisällä ne jäisivät raa'aksi HTML:ksi (XIX<sup>e</sup>).
    const runko = document.body.cloneNode(true);
    [...runko.querySelectorAll('span[lang], span[dir], p[dir], td[dir]')].reverse().forEach(x => { if (x.tagName === 'SPAN' && !x.className) x.replaceWith(...x.childNodes); else x.removeAttribute('dir'); });
    const teksti = runko.querySelector('#texte');
    const meta = n => [...document.querySelectorAll('meta[name="' + n + '"]')].map(m => rivi(m.content.replace(/&nbsp;/g, ' '))).filter(Boolean);
    const el = document.createElement('div'), maar = [], laskuri = { n: 0 };
    // Otsikon viite (BAP 1643: Metaphysik¹) otsikon alaviitteeksi.
    const h3 = runko.querySelector('#enteteDocument h3');
    const ots = h3 && h3.cloneNode(true);
    if (ots) oeViitteet(ots, runko, maar, laskuri);
    const otsT = ots ? ots.textContent : '';
    const res = runko.querySelector('#resume');
    if (res && res.querySelector('p')) {
      const kielet = [...res.querySelectorAll('h4')];
      [...res.children].forEach(x => {
        if (x.tagName === 'H4') {
          if (kielet.length < 2) return;
          const p = document.createElement('p'), b = document.createElement('strong'); b.textContent = rivi(x.textContent).replace(/[.:]?$/, '.'); p.appendChild(b); el.appendChild(p);
        } else if (rivi(x.textContent)) el.appendChild(x.cloneNode(true));
      });
      el.appendChild(document.createElement('hr'));
    }
    const k = teksti.cloneNode(true);
    k.querySelectorAll('span.lettrine, span.smallcaps').forEach(x => x.replaceWith(...x.childNodes));
    k.querySelectorAll('h1 a[href^="#toc"], h2 a[href^="#toc"], h3 a[href^="#toc"]').forEach(a => a.replaceWith(...a.childNodes));
    // Kapea otsikoton taulukko (lyhenneluettelo: A | Leibniz, Sämtliche Schriften …) riveittäin kappaleiksi, ensimmäinen solu
    // lihavoituna; muut ruudukoiksi kuten OJS:ssä.
    k.querySelectorAll('table').forEach(t => {
      const rivit = [...t.rows];
      if (!t.querySelector('th') && rivit.length && rivit.every(r => r.cells.length >= 2 && r.cells.length <= 3)) {
        t.replaceWith(...rivit.map(r => {
          const p = document.createElement('p'), b = document.createElement('strong');
          b.textContent = rivi(r.cells[0].textContent); if (rivi(b.textContent)) p.append(b, ' ');
          [...r.cells].slice(1).forEach((c, i) => { if (i) p.append(' '); [...c.childNodes].forEach(n => { if (n.nodeName === 'P') p.append(...n.childNodes, ' '); else p.append(n); }); });
          return p;
        }));
      } else ojsTaulukko(t);
    });
    oeViitteet(k, runko, maar, laskuri);
    oeSiivoa(k);
    el.append(...[...k.childNodes]);
    const bib = runko.querySelector('#bibliographie');
    if (bib && bib.querySelector('p')) {
      const h = document.createElement('h2'); h.textContent = 'Bibliographie'; el.appendChild(h);
      const b = bib.cloneNode(true); oeSiivoa(b);
      el.append(...b.querySelectorAll('p'));
    }
    el.querySelectorAll('p.resume, p.texte, p.bibliographie').forEach(p => p.removeAttribute('class'));
    el.querySelectorAll('sup em, sup i, sub em, sub i').forEach(x => x.replaceWith(...x.childNodes));
    maar.forEach((m, i) => { maar[i] = m.replace(/<(sup|sub)><(?:em|i|b|strong)>([^<]*)<\/(?:em|i|b|strong)><\/\1>/g, '<$1>$2</$1>'); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*(popups\.uliege\.be|segi\.ulg\.ac\.be)\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const ent = document.getElementById('enteteDocument');
    const ekat = ent ? rivi(ent.textContent) : '';
    const vol = /Volume\s+(\d+)\s*\((\d{4})\)/i.exec(ekat), nro = /Num[ée]ro\s+(\d+)/i.exec(ekat);
    const sivut = (/\bp\.\s*(\d+\s*[-–]\s*\d+)/.exec(rivi((document.querySelector('.annexes') || {}).textContent)) || [])[1];
    const lehti = meta('citation_journal_title')[0] || '';
    return { html: irrota([el]).innerHTML, otsikko: rivi(otsT.replace(MERKKI, '')) || meta('citation_title')[0], otsikkoMerkit: (otsT.match(MERKKI) || []).join(''),
      tyyppi: 'tieteellinen', tekija: kkLuettelo(meta('citation_author')), teos: lehti, numero: [vol && vol[1], nro && nro[1]].filter(Boolean).join(':'),
      sivut: sivut ? sivut.replace(/\s*[-–]\s*/, '–') : '', julkaistu: meta('citation_online_date')[0] || (vol ? vol[2] : ''),
      kustantaja: 'Université de Liège', lahde: osoite, maar, naytto: lehti || 'PoPuPS' };
  }

  /* Folktexts (D. L. Ashliman, sites.pitt.edu/~dash; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* varakohde 11:
     kansantarinat satutyypeittäin). Käsin kirjoitettua HTML:ää 1990-luvulta: alussa keskitetty otsake (h1, kuvaus, translated
     and/or edited by D. L. Ashliman, ©), Contents-luettelo #-linkkeineen, sitten tarinat: h2 (nimi), h3 (lähde: maa, kerääjä),
     teksti, moraali yksirivisenä taulukkona (Moral: | …), lähdeluettelo ul (Source: …, Return to the table of contents) ja
     lopussa Return to: -lohko ja Revised December 16, 2022. Readability antoi tarinat, mutta otsakkeen linkkeineen, sisällys-
     luettelon, h3-lähderivit otsikkoina (md.js luki h3:n 1001 Nights numeroksi: varoitus), moraalitaulukon raa'aksi HTML:ksi
     eikä toimittajaa tai päivää. Sovite: otsake pois (kuvaus alaotsikoksi, Ashliman toimittajaksi; yksittäisen sadun sivulla h2
     tekijäksi, Jacob and Wilhelm Grimm), Contents, Return to -rivit ja Links to related sites pois, h3-lähderivi kursiivikappaleeksi, moraalitaulukko kappaleeksi, päivitysrivi julkaisupäiväksi. Ei mainoksia eikä
     lahjoituspyyntöä. Mitattu 18.11.2026. */
  async function folktexts() {
    if (!/(^|\.)pitt\.edu$/i.test(location.hostname) || !/^\/~dash\//.test(location.pathname)) return null;
    const h1 = document.querySelector('h1');
    if (!h1 || !document.querySelector('h2')) return null;
    const el = document.body.cloneNode(true);
    el.querySelectorAll('script, style, img').forEach(x => x.remove());
    // Otsake: center-lohko (h1, kuvaus, toimittaja).
    let kuvaus = '', toimittaja = '', tekija = '';
    const keski = el.querySelector('center');
    if (keski && keski.querySelector('h1')) {
      // Yksittäinen satu (Grimm 053): h2 tekijänä (Jacob and Wilhelm Grimm).
      const h2k = keski.querySelector('h2');
      if (h2k) tekija = rivi(h2k.textContent);
      const p = keski.querySelector('p');
      if (p) {
        const r = p.cloneNode(true); r.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
        const rivit = r.textContent.split('\n').map(rivi).filter(Boolean);
        const i = rivit.findIndex(x => /edited by|translated by/i.test(x));
        kuvaus = rivit.slice(0, i < 0 ? rivit.length : i).filter(x => !/^©/.test(x)).join(' ');
        toimittaja = i >= 0 ? (rivit[i + 1] || '').replace(/^©.*$/, '') : '';
      }
      keski.remove();
    } else el.querySelectorAll('h1').forEach(x => x.remove());
    // Sisällysluettelo ja Return to -rivit pois.
    el.querySelectorAll('h2').forEach(h => {
      if (!/^contents$/i.test(rivi(h.textContent))) return;
      const n = h.nextElementSibling;
      if (n && /^(OL|UL)$/.test(n.tagName)) n.remove();
      h.remove();
    });
    el.querySelectorAll('li, p').forEach(x => { if (el.contains(x) && /^(return to\b|link to\b)/i.test(rivi(x.textContent))) x.remove(); });
    // Bodyn suora tekstijakso (Return to D. L. Ashliman's folktexts, …) lohkojen välissä.
    let jakso = [];
    const tyhjenna = () => { if (/^return to\b/i.test(rivi(jakso.map(n => n.textContent).join('')))) jakso.forEach(n => n.remove()); jakso = []; };
    [...el.childNodes].forEach(n => { if (n.nodeType === 1 && /^(P|DIV|H\d|UL|OL|HR|TABLE|BLOCKQUOTE|CENTER|PRE|DL)$/.test(n.tagName)) tyhjenna(); else jakso.push(n); });
    tyhjenna();
    // Linkit muille sivuille -osio pois.
    el.querySelectorAll('h2').forEach(h => { if (/^links to related sites$/i.test(rivi(h.textContent))) { const n = h.nextElementSibling; if (n && /^(UL|OL)$/.test(n.tagName)) n.remove(); h.remove(); } });
    // Päivitysrivi (kappaleena tai bodyn tekstinä) julkaisupäiväksi.
    let julkaistu = '';
    [...el.querySelectorAll('p'), ...[...el.childNodes].filter(n => n.nodeType === 3)].forEach(p => {
      const m = /^revised\s+(\p{L}+)\s+(\d{1,2}),\s*(\d{4})\.?$/iu.exec(rivi(p.textContent));
      if (!m) return;
      const kk = EN_KUUKAUDET.indexOf(m[1].toLowerCase());
      if (kk >= 0) julkaistu = m[3] + '-' + String(kk + 1).padStart(2, '0') + '-' + m[2].padStart(2, '0');
      p.remove();
    });
    // Lähderivi (h3 heti h2:n jälkeen) kursiivikappaleeksi.
    el.querySelectorAll('h2 + h3').forEach(h => { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = rivi(h.textContent); p.appendChild(em); h.replaceWith(p); });
    // Moraali (yksirivinen taulukko) kappaleeksi.
    el.querySelectorAll('table').forEach(t => {
      if (t.rows.length !== 1) { const d = document.createElement('div'); t.replaceWith(d); d.appendChild(t); return ojsTaulukko(t); }
      const p = document.createElement('p');
      [...t.rows[0].cells].forEach(c => { if (!rivi(c.textContent)) return; if (p.childNodes.length) p.append(' '); p.append(...c.childNodes); });
      p.querySelectorAll('p').forEach(x => x.replaceWith(...x.childNodes));
      t.replaceWith(p);
    });
    el.querySelectorAll('font').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('ul, ol').forEach(l => { if (!rivi(l.textContent)) l.remove(); });
    el.querySelectorAll('hr + hr').forEach(h => h.remove());
    while (el.firstElementChild && el.firstElementChild.tagName === 'HR') el.firstElementChild.remove();
    while (el.lastElementChild && /^(HR|P)$/.test(el.lastElementChild.tagName) && !rivi(el.lastElementChild.textContent)) el.lastElementChild.remove();
    el.querySelectorAll('h2 a[name], h2 a:not([href])').forEach(a => a.replaceWith(...a.childNodes));
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*pitt\.edu\//i);
    if (kkSanoja(el) < 100) return null;
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), alaotsikko: kuvaus, toimittaja: rivi(toimittaja), tekija,
      julkaistu, sivusto: 'Folktexts', lahde: osoite };
  }

  /* A Celebration of Women Writers (digital.library.upenn.edu/women; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta*
     varakohde 12: naisten kirjoja kokonaisina sivuina). Vuoden 2020 kirjapohja (stylesheets/book-2020.css): body[itemtype*=Book],
     header (sivuston linkki), section#metadata (h1, schema.org-määreet name, author givenName ja familyName, publisher,
     addressLocality, copyrightYear), section#frontmatter (nimiösivu taulukkona, sisällys ja errata taulukkoina #-linkein), section#main
     (joskus puuttuu: teksti jatkuu frontmatterissa), section#about (About This Edition) ja footer. Sivunvaihdot span.pagenumber ja
     .pagecounter (CSS:n [Page xx]) ja hr.pagination. Readability jätti taulukot raa'aksi HTML:ksi (Finch 1713: 21 merkintää) ja
     sivuston linkin otsikoksi, eikä julkaisutietoja tullut. Sovite: header, metadata ja footer pois, sisällys- ja erratataulukot
     (enimmäkseen #-linkkejä) ja niiden tyhjät otsikot pois, erratan jäänteet pois (errata on korjattu tekstiin), muut taulukot (nimiösivu, runo) kappaleiksi, sivunvaihtomerkit ja tyhjät kappaleet pois,
     otsikoiden <br> välilyönneiksi, About This Edition omaksi luvukseen. Etukenttään tekijä, julkaistu (copyrightYear), paikka ja
     kustantaja. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 18.11.2026. */
  async function womenwriters() {
    const metat = document.querySelector('section#metadata');
    if (!metat || !metat.querySelector('[itemprop="name"]') || !/schema\.org\/Book/.test(document.body.getAttribute('itemtype') || '')) return null;
    const ip = (n, juuri = metat) => rivi((juuri.querySelector('[itemprop="' + n + '"]') || {}).textContent);
    const el = document.body.cloneNode(true);
    el.querySelectorAll('header, section#metadata, footer, script, style, img, nav').forEach(x => x.remove());
    el.querySelectorAll('.pagenumber, .pagecounter, hr.pagination, hr.pagereset').forEach(x => x.remove());
    el.querySelectorAll('table').forEach(t => {
      const linkit = [...t.querySelectorAll('a[href^="#"]')].reduce((n, a) => n + rivi(a.textContent).length, 0);
      if (linkit > rivi(t.textContent).length * 0.4) return t.remove();
      const pala = document.createDocumentFragment();
      t.querySelectorAll('td, th').forEach(c => { if (!rivi(c.textContent)) return; const kpl = c.querySelectorAll('p, h1, h2, h3, h4'); if (kpl.length) pala.append(...kpl); else { const p = document.createElement('p'); p.append(...c.childNodes); pala.appendChild(p); } });
      (t.closest('blockquote') && rivi(t.closest('blockquote').textContent) === rivi(t.textContent) ? t.closest('blockquote') : t).replaceWith(pala);
    });
    el.querySelectorAll('h1, h2, h3, h4, h5').forEach(h => { h.querySelectorAll('br').forEach(b => b.replaceWith(' ')); const t = rivi(h.textContent); if (!t) return h.remove(); h.textContent = t; });
    el.querySelectorAll('section#about a').forEach(a => { if (a.querySelector('h2')) a.replaceWith(...a.childNodes); });
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    el.querySelectorAll('span').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' '))) p.remove(); });
    // Sisällyksen otsikko jäi tyhjäksi (taulukko pois); errata on korjattu tekstiin (About This Edition), joten sen jäänteet
    // seuraavaan viivaan tai otsikkoon asti pois.
    el.querySelectorAll('h1, h2, h3, h4, h5').forEach(h => {
      const t = rivi(h.textContent), n = h.nextElementSibling;
      if (/^(the\s+)?errata\.?$/i.test(t)) { for (let x = h.nextElementSibling; x && !/^(H\d|HR)$/.test(x.tagName);) { const y = x.nextElementSibling; x.remove(); x = y; } h.remove(); }
      else if (/^(the\s+)?(table|contents)\.?$/i.test(t) && (!n || /^(H\d|HR)$/.test(n.tagName))) h.remove();
    });
    el.querySelectorAll('hr + hr').forEach(h => h.remove());
    while (el.firstElementChild && el.firstElementChild.tagName === 'HR') el.firstElementChild.remove();
    kkLinkit(el, /^https?:\/\/digital\.library\.upenn\.edu\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const a = metat.querySelector('[itemprop="author"]');
    const tekija = a ? rivi([ip('givenName', a), ip('familyName', a)].join(' ')) || ip('name', a) : '';
    const pub = metat.querySelector('[itemprop="publisher"]');
    return { html: irrota([el]).innerHTML, otsikko: ip('name').replace(/\.$/, ''), tekija, julkaistu: ip('copyrightYear') || ip('datePublished'),
      paikka: pub ? ip('addressLocality', pub) : '', kustantaja: pub ? rivi((pub.querySelector('[itemprop="address"] [itemprop="name"], [itemprop="name"]') || {}).textContent) : '',
      sivusto: 'A Celebration of Women Writers', lahde: osoite };
  }

  /* Center for Hellenic Studies: Classical Inquiries ja Classics@ (classical-inquiries.chs.harvard.edu, classics-at.chs.harvard.edu;
     käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* varakohde 14). CHS:n omat WordPress-teemat. Classical Inquiries:
     section#main.articleContent, alussa rivi 2016.06.02 | By Gregory Nagy (sivun byline on käyttäjätunnus gnagy), §-kappaleet,
     Wordin viitteet [<a href="#_ftn1">1</a>] → lopun Notes-kappaleet <a name="_ftn1">, lihavoitu Bibliography-kappale. Classics@:
     .postContent (h1.articleH1, .articleByline, .postCitation, div.Paragraph), viitteet span.noteref [<a href="#n.3">3</a>] →
     div.ftNote: span.noteref <a name="n.3"> [back], lihavoitu numero 3. Readability: Classical Inquiriesissa viitteet linkkeinä
     (alaviitteitä 0) eikä kirjallisuutta tunnistettu (p.bib 0); Classics@ antoi tekstin ja kirjallisuuden, mutta viitteet
     katosivat. Sovite: alun byline-rivi tekijäksi ja päiväksi, Notes-otsake pois, Bibliography-kappale otsikoksi, viitteet
     alaviitteiksi (Classics@: back-linkki ja lihavoitu numero pois ensin), sitaattirivi (.postCitation) pois vuoden talteen ottaen,
     kuvat ja jakolinkit pois. CHS Online Books (chs.harvard.edu/book/…) on kirjan esittelysivu, ei teksti; ei katettu. Ei mainoksia
     eikä lahjoituspyyntöä artikkelisivuilla. Mitattu 18.11.2026. */
  async function chs() {
    if (!/(^|\.)chs\.harvard\.edu$/i.test(location.hostname)) return null;
    const runko = document.querySelector('.articleBody.postContent, section#main.articleContent');
    const h1 = document.querySelector('h1.articleH1, .coverContent h1, article h1, h1');
    if (!runko || !h1) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('script, style, img, noscript, figure, .postHeadLinks, [data-html2canvas-ignore], .rp4wp-related-posts, .wp-caption').forEach(x => x.remove());
    let tekija = '', julkaistu = '';
    // Classical Inquiries: alun 2016.06.02 | By Gregory Nagy.
    const eka = [...el.querySelectorAll('p')].find(p => rivi(p.textContent));
    const m = eka && /^(\d{4})\.(\d\d)\.(\d\d)\s*\|\s*by\s+(.+)$/i.exec(rivi(eka.textContent));
    if (m) { julkaistu = m[1] + '-' + m[2] + '-' + m[3]; tekija = m[4]; eka.remove(); }
    // Classics@: sitaattirivi pois, vuosi talteen.
    el.querySelectorAll('.postCitation').forEach(c => { const v = /\b(19|20)\d\d\b/.exec(rivi(c.textContent)); if (v && !julkaistu) julkaistu = v[0]; c.remove(); });
    // Classics@: viitteen [ back ] ja lihavoitu numero pois ennen alaviitteitä (ankkuri a[name] jää).
    el.querySelectorAll('.ftNote').forEach(n => {
      n.querySelectorAll('a[href^="#noteref"]').forEach(a => a.remove());
      n.querySelectorAll('span.noteref').forEach(s => [...s.childNodes].forEach(c => { if (c.nodeType === 3) c.remove(); }));
      const b = n.querySelector('span[style*="bold"], b, strong');
      if (b && /^\d+\.$/.test(rivi(b.textContent))) b.replaceWith(rivi(b.textContent) + ' ');
    });
    el.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    const maar = samanSivunViitteet(el, 'ch');
    // Lihavoidut otsakekappaleet: Notes (tyhjä) pois, Bibliography ym. otsikoiksi.
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent), b = p.querySelector('strong, b');
      if (!b || rivi(b.textContent) !== t || t.length > 60) return;
      if (/^(notes?|footnotes|endnotes)$/i.test(t)) return p.remove();
      const h = document.createElement('h2'); h.textContent = t; p.replaceWith(h);
    });
    el.querySelectorAll('.ftNotes, .ftNote').forEach(x => { if (!rivi(x.textContent)) x.remove(); });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('hr, table')) x.remove(); });
    el.querySelectorAll('hr + hr').forEach(h => h.remove());
    while (el.lastElementChild && el.lastElementChild.tagName === 'HR') el.lastElementChild.remove();
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*chs\.harvard\.edu\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    if (!tekija) tekija = kkLuettelo([...document.querySelectorAll('.articleByline a')].map(a => rivi(a.textContent)).filter(n => n && !/^[a-z0-9-]+$/.test(n)));
    if (!julkaistu) julkaistu = rivi((document.querySelector('meta[property="article:published_time"]') || {}).content).slice(0, 10);
    const sivusto = /classics-at/.test(location.hostname) ? 'Classics@' : /classical-inquiries/.test(location.hostname) ? 'Classical Inquiries' : 'Center for Hellenic Studies';
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), tekija, julkaistu, sivusto, lahde: osoite, maar };
  }

  /* Zeithistorische Forschungen / Studies in Contemporary History (zeithistorische-forschungen.de, ZZF Potsdam; käyttäjän pyyntö
     18.11.2026, pahvin *10 sivustosovitetta* varakohde 15). Drupal: otsikko h1.page-title, alaotsikko .untertitel, teksti
     .node--type-beitrag .field--name-body, viitteet a[href="#footnote-049"] > span 1 → div#footnote-049 (paluulinkki ja teksti)
     Anmerkungen:-kappaleen (p.Anmerkungen) jälkeen, kuvat media-lohkoina kuvateksteineen, tekijä .all-author, päivä .datetime
     (16. Juni 2026), lisenssi .lizenz (CC BY-SA 4.0), sitaatti .zitation (… 22 (2026), H. 1, … DOI: …, Druckausgabe: S. 201-212).
     Readability antoi tekstin, mutta otsikon ilman avaavaa lainausmerkkiä ja sivuston nimen kanssa, viitteet linkkeinä (alaviitteitä
     0), kuvatekstit ja kuvien oikeusrivit tekstin väliin eikä alaotsikkoa, lehteä eikä numeroa. Sovite: kuvat ja videot
     kuvateksteineen pois, Anmerkungen-otsake, tyhjä ankkurikappale ja viiva pois, viitteet samanSivunViitteet():llä; etukenttään
     tyyppi tieteellinen, alaotsikko, tekijät, teos, numero (vuosikerta:vihko sitaatista), julkaistu, sivut (Druckausgabe), DOI ja
     lisenssi. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 18.11.2026. */
  const ZF_KUUKAUDET = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
  async function zeithistorische() {
    if (!/(^|\.)zeithistorische-forschungen\.de$/i.test(location.hostname)) return null;
    const runko = document.querySelector('.node--type-beitrag .field--name-body'), h1 = document.querySelector('h1.page-title');
    if (!runko || !h1) return null;
    const el = runko.cloneNode(true);
    el.querySelectorAll('script, style, img, iframe, .media, figure, drupal-media, .caption').forEach(x => x.remove());
    el.querySelectorAll('p.Anmerkungen').forEach(x => x.remove());
    el.querySelectorAll('a#anm, a[name="anm"]').forEach(a => { const p = a.closest('p'); (p && !rivi(p.textContent) ? p : a).remove(); });
    const maar = samanSivunViitteet(el, 'zf');
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('hr, table')) x.remove(); });
    while (el.lastElementChild && el.lastElementChild.tagName === 'HR') el.lastElementChild.remove();
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*zeithistorische-forschungen\.de\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    const zit = rivi((document.querySelector('.zitation .accordion-body, .zitation') || {}).textContent);
    const vk = /,\s*(\d+)\s*\((\d{4})\),\s*H\.\s*(\d+)/.exec(zit), sv = /Druckausgabe:\s*S\.\s*([\d–-]+)/.exec(zit);
    const doi = /doi\.org\/(\S+?)\s*,?\s*(?:Druckausgabe|$)/.exec(zit);
    const pm = /(\d{1,2})\.\s*(\p{L}+)\s+(\d{4})/u.exec(rivi((document.querySelector('.datetime') || {}).textContent));
    const kk = pm ? ZF_KUUKAUDET.indexOf(pm[2].toLowerCase()) : -1;
    const liz = rivi((document.querySelector('.lizenz') || {}).textContent), cc = /CC\s+[A-Z-]+\s+\d\.\d/.exec(liz);
    const tekijat = [...new Set([...document.querySelectorAll('.all-author')].map(x => rivi(x.textContent)).filter(Boolean))];
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), alaotsikko: rivi((document.querySelector('.untertitel') || {}).textContent),
      tyyppi: 'tieteellinen', tekija: kkLuettelo(tekijat), teos: 'Zeithistorische Forschungen', numero: vk ? vk[1] + ':' + vk[3] : '',
      sivut: sv ? sv[1].replace(/-/g, '–') : '', julkaistu: kk >= 0 ? pm[3] + '-' + String(kk + 1).padStart(2, '0') + '-' + pm[1].padStart(2, '0') : vk ? vk[2] : '',
      doi: doi ? doi[1].replace(/[,.]$/, '') : '', lahde: osoite, maar,
      oikeus: cc ? { teksti: cc[0], lahde: (document.querySelector('.lizenz a[href*="creativecommons"]') || {}).href || osoite } : null,
      naytto: 'Zeithistorische Forschungen' };
  }

  /* BOMB Magazine (bombmagazine.org; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* varakohde 16: taiteilijat ja kirjailijat
     haastattelevat toisiaan, myös proosaa). Craft CMS ja Tailwind: otsake .article-heading-section (lajin linkki, h1.title-heading,
     h2 ingressi, h6 päiväys, by <a href="/author/…">), teksti .articleContent .inner-article-template -lohkoina, haastattelussa puhuja
     span.initials > strong (nimen perässä välilyönti strongin sisällä, joten Turndown liimasi nimen vastaukseen: **Sasha Vasilyuk**I
     think), kuvat .article-image kuvateksteineen, tukipyyntö .supportBlock, tunnisteet, uutiskirjelomake, mainospaikat
     (broadstreet-zone) ja READ MORE -suositukset. Readability: otsikossa BOMB Magazine |, puhujanimet kiinni vastauksissa, READ MORE
     -otsikko, ei tekijää eikä päivää. Sovite: tekstilohkot ilman kuvia, tukipyyntöä ja lomakkeita, puhujanimi lihavoituna ja
     välilyönnillä erotettuna, ingressi alaotsikoksi, tekijät otsakkeen /author/-linkeistä (haastattelussa otsikon by-osa: X by Y →
     Y, kuten BOMBin viitteissä), päiväys. Mainokset (Broadstreet) ja
     lahjoitusmahdollisuus (Donate) näkyvät sivulla (RAHOITUS: mainokset ja lahjoitukset). Mitattu 18.11.2026. */
  async function bomb() {
    if (!/(^|\.)bombmagazine\.org$/i.test(location.hostname)) return null;
    const lohkot = [...document.querySelectorAll('.articleContent .inner-article-template')];
    const h1 = document.querySelector('h1.title-heading');
    if (!lohkot.length || !h1) return null;
    const el = document.createElement('div');
    lohkot.forEach(l => el.append(...[...l.cloneNode(true).childNodes]));
    el.querySelectorAll('script, style, img, figure, .article-image, .caption, .supportBlock, form, broadstreet-zone, iframe, button').forEach(x => x.remove());
    el.querySelectorAll('span.initials').forEach(s => { const b = document.createElement('strong'); b.textContent = rivi(s.textContent); s.replaceWith(b, ' '); });
    el.querySelectorAll('p, div').forEach(x => { if (el.contains(x) && !rivi(x.textContent.replace(/ /g, ' ')) && !x.querySelector('hr, br')) x.remove(); });
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*bombmagazine\.org\//i);
    if (kkSanoja(el) < 100) return null;
    const otsake = h1.closest('.article-heading-section') || h1.parentElement;
    let tekijat = [...new Set([...otsake.querySelectorAll('a[href*="/author/"]')].map(a => rivi(a.textContent)).filter(Boolean))];
    // Haastattelu (Sasha Vasilyuk by Alia Volz): kirjoittaja on by-osan haastattelija, kuten BOMBin omissa viitteissä.
    const by = /^.+?\s+by\s+(.+)$/.exec(rivi(h1.textContent));
    if (!tekijat.length && by) tekijat = [by[1]];
    const pm = /(\p{L}+)\s+(\d{1,2}),\s*(\d{4})/u.exec(rivi((otsake.querySelector('h6') || {}).textContent));
    const kk = pm ? EN_KUUKAUDET.indexOf(pm[1].toLowerCase()) : -1;
    return { html: irrota([el]).innerHTML, otsikko: rivi(h1.textContent), alaotsikko: rivi((otsake.querySelector('h2') || {}).textContent),
      tekija: kkLuettelo(tekijat), julkaistu: kk >= 0 ? pm[3] + '-' + String(kk + 1).padStart(2, '0') + '-' + pm[2].padStart(2, '0') : '',
      sivusto: 'BOMB Magazine', lahde: osoite };
  }

  /* PsychOpen GOLD (ZPID; OJS 3.1; käyttäjän pyyntö 18.11.2026, pahvin *10 sivustosovitetta* varakohde 17: ottaako OJS-sovite
     iframe-gallerian). Ei ota: galleria on OJS:n kehyksessä iframe#article-html-frame (src …/article/download/N/N.html?inline=1),
     ja sen sisältö on PsychOpenin oma JATS-renderöinti (htmlgalley-v04: #HTMLgalley, #article-front, #article-body, #article-back),
     joten ojs() päätyi tiivistelmäleikkeeseen (260 sanaa) ja gallerian sivulla Readability antoi 10 sanaa. Tämä sovite ajetaan ojs():n
     edellä ja tunnistaa gallerian rakenteesta: suoraan (#HTMLgalley), gallerian sivulta iframen osoitteesta tai OJS-artikkelisivulta
     citation_fulltext_html_url → iframe (kaksi hakua; muilla OJS-lehdillä ensimmäinen haku on sama, jonka ojs() tekee, ja välimuisti
     jakaa sen). Tiivistelmät (.abstracts: Abstract, Highlights) ja avainsanat, osanvaihto, teksti (h3/h4.section-title otsikoiksi),
     lähdeviittaukset a.reftooltip tekstiksi ilman APA-pilkkua, viitteet a.notetooltip → .footnote#fnN (samanSivunViitteet), kuvat
     pois ja kuvateksti kursiiviksi, taulukot otsikkoineen ruudukoiksi, kirjallisuus ul.ref-list p.citation kappaleiksi. Etukenttään
     gallerian tiedoista: tekijät (.contrib-group .authors), teos ja numero (Article information: Social Psychological Bulletin,
     2026, Vol. 21, Article e12465), julkaistu (Published (VoR)), DOI, CC-lisenssi. Ei mainoksia eikä lahjoituspyyntöä.
     Mitattu 18.11.2026. */
  async function psychopen() {
    const galleria = d => d && d.querySelector('#HTMLgalley #article-body') ? d : null;
    let G = galleria(document);
    if (!G) {
      let kehys = document.querySelector('iframe#article-html-frame[src]');
      if (!kehys) {
        const u = (document.querySelector('meta[name="citation_fulltext_html_url"]') || {}).content;
        if (!u || !/open journal systems/i.test((document.querySelector('meta[name="generator"]') || {}).content || '')) return null;
        const V = await hae(new URL(u, osoite).href);
        G = galleria(V);
        kehys = !G && V && V.querySelector('iframe#article-html-frame[src]');
      }
      if (!G && kehys) G = galleria(await hae(new URL(kehys.getAttribute('src'), osoite).href));
    }
    if (!G) return null;
    const el = document.createElement('div');
    const etu = G.querySelector('#article-front');
    G.querySelectorAll('#abstracts .abstract').forEach(a => {
      const k = a.cloneNode(true);
      const h = k.querySelector('h2'); if (h) { const u = document.createElement('h2'); u.textContent = rivi(h.textContent); h.replaceWith(u); }
      el.append(...[...k.childNodes]);
      const av = a.nextElementSibling;
      if (av && av.tagName === 'P' && /^keywords?:/i.test(rivi(av.textContent))) el.appendChild(av.cloneNode(true));
    });
    if (el.children.length) el.appendChild(document.createElement('hr'));
    const k = document.createElement('div');
    k.append(G.querySelector('#article-body').cloneNode(true));
    const taka = G.querySelector('#article-back');
    if (taka) k.append(taka.cloneNode(true));
    k.querySelectorAll('script, style, svg, img, .fancybox').forEach(x => x.remove());
    k.querySelectorAll('a.reftooltip').forEach(a => a.replaceWith(rivi(a.textContent).replace(/(\p{L}[^,()]*?),\s+((?:1[5-9]|20)\d\d[a-z]?)\b/gu, '$1 $2')));
    k.querySelectorAll('a[href^="#"]:not(.notetooltip)').forEach(a => { if (!/^fn/.test(a.getAttribute('href').slice(1))) a.replaceWith(...a.childNodes); });
    const maar = samanSivunViitteet(k, 'po');
    k.querySelectorAll('.back-section#notes').forEach(n => { if (!n.querySelector('.footnote')) n.remove(); });
    // Kuvat: kuvateksti kursiiviksi.
    k.querySelectorAll('.fig').forEach(f => {
      const t = [rivi((f.querySelector('.label') || {}).textContent), rivi((f.querySelector('.caption') || {}).textContent)].filter(Boolean).join(' ');
      if (!t) return f.remove();
      const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); f.replaceWith(p);
    });
    k.querySelectorAll('.table-wrap.panel, .table-wrap.body').forEach(w => {
      if (!k.contains(w) || w.parentElement.closest('.table-wrap')) return;
      const t = [rivi((w.querySelector('.label') || {}).textContent), rivi((w.querySelector('.caption') || {}).textContent)].filter(Boolean).join(' ');
      const pala = document.createDocumentFragment();
      if (t) { const p = document.createElement('p'), em = document.createElement('em'); em.textContent = t; p.appendChild(em); pala.appendChild(p); }
      w.querySelectorAll('table').forEach(tb => { const d = document.createElement('div'); d.appendChild(tb); pala.appendChild(d); ojsTaulukko(tb); });
      w.querySelectorAll('.table-wrap-foot p, .fn p').forEach(p => pala.appendChild(p));
      w.replaceWith(pala);
    });
    k.querySelectorAll('ul.ref-list').forEach(l => { l.querySelectorAll('p.citation').forEach(p => l.before(p)); l.remove(); });
    k.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => { const t = rivi(h.textContent); if (!t) return h.remove(); const u = document.createElement(h.tagName); u.textContent = t; h.replaceWith(u); });
    k.querySelectorAll('[style]').forEach(x => x.removeAttribute('style'));
    el.append(...[...k.childNodes]);
    kkLinkit(el, /^https?:\/\/([a-z0-9-]+\.)*psychopen\.eu\//i);
    if (kkSanoja(el) < 100) return null;
    kkTasoita(el);
    // Tietolaatikon kappaleet välilyönnein (textContent liimaisi DOI:n seuraavaan kappaleeseen: …12465Received:).
    const tiedot = [...G.querySelectorAll('#info-box p')].map(p => rivi(p.textContent)).join(' ');
    const lehti = /^(.+?),\s*(\d{4}),\s*Vol\.\s*(\d+)(?:\([\d-]+\))?,\s*(?:Article\s+(\S+?),|([\d–-]+),)/i.exec(tiedot);
    const pv = /Published \(VoR\):\s*(\d{4}-\d\d-\d\d)/.exec(tiedot), doi = /doi\.org\/(\S+?)(?:\s|$)/.exec(tiedot);
    const tek = etu ? (() => { const a = etu.querySelector('.authors'); if (!a) return []; const c = a.cloneNode(true); c.querySelectorAll('sup, a[href*="orcid"], svg').forEach(x => x.remove()); return rivi(c.textContent).split(/\s*,\s*/).map(rivi).filter(Boolean); })() : [];
    const cc = /creativecommons\.org\/licenses\/([a-z-]+)\/(\d\.\d)/i.exec(tiedot);
    return { html: irrota([el]).innerHTML, otsikko: rivi((G.querySelector('h1.document-title') || {}).textContent), tyyppi: 'tieteellinen',
      tekija: kkLuettelo(tek), teos: lehti ? lehti[1] : '', numero: lehti ? lehti[3] : '', sivut: lehti ? (lehti[4] || lehti[5] || '') : '',
      julkaistu: pv ? pv[1] : lehti ? lehti[2] : '', doi: doi ? doi[1].replace(/[.,]$/, '') : '', lahde: osoite.replace(/\?inline=1$/, ''), maar,
      oikeus: cc ? { teksti: 'CC ' + cc[1].toUpperCase() + ' ' + cc[2], lahde: 'https://' + cc[0] } : null, naytto: lehti ? lehti[1] : '' };
  }

  /* Paul Grahamin esseet (paulgraham.com; käyttäjän lisäkohde 16.11.2026). Sivu on taulukkoasettelua: essee yhdessä font-
     elementissä, kappaleet <br><br>, otsikko kuvana (img alt) ja title-elementissä, ensimmäinen kappale päiväys (June 2021),
     viitemerkit [<a href="#f1n">1</a>], lopussa <b>Notes</b> ja merkinnät [<a name="f1n">1</a>] … sekä Thanks-kappale.
     Readability antoi tekstin, mutta viitteet jäivät linkkinumeroiksi loppuun eikä tekijää ja päiväystä tullut. Viitteet
     alaviitteiksi, päiväys etukenttään, Thanks jää loppuun. Ei mainoksia eikä lahjoituspyyntöä. Mitattu 16.11.2026. */
  const PG_KUUKAUDET = EN_KUUKAUDET;
  async function paulgraham() {
    if (!/(^|\.)paulgraham\.com$/i.test(location.hostname)) return null;
    // Essee: font-elementti, jossa on eniten tekstiä.
    const ehdot = [...document.querySelectorAll('td > font')].filter(f => !f.parentElement.closest('font'));
    const runko = ehdot.sort((a, b) => rivi(b.textContent).length - rivi(a.textContent).length)[0];
    if (!runko || kkSanoja(runko) < 200) return null;
    let html = runko.innerHTML;
    const maar = [], tunnukset = new Map();
    // Merkinnät: Notes-otsakkeen jälkeen [<a name="f1n">1</a>] teksti … seuraavaan merkintään tai Thanks-kappaleeseen.
    const ni = html.search(/<b>\s*Notes\s*<\/b>/i);
    let loppu = '';
    if (ni >= 0) {
      let notes = html.slice(ni).replace(/^<b>\s*Notes\s*<\/b>/i, '');
      const ti = notes.search(/<b>\s*Thanks\s*<\/b>/i);
      if (ti >= 0) { loppu = notes.slice(ti); notes = notes.slice(0, ti); }
      html = html.slice(0, ni);
      notes.split(/(?=\[\s*<a name="f\w+?n")/i).forEach(osa => {
        const m = /^\[\s*<a name="(f\w+?n)"[^>]*>[\s\S]*?<\/a>\s*\]\s*/i.exec(osa);
        if (!m) return;
        const t = muunna(osa.slice(m[0].length).replace(/(<br\s*\/?>\s*)+$/i, '').replace(/(<br\s*\/?>\s*){2,}/gi, '<br><br>'), 'inlined').trim();
        if (t) tunnukset.set(m[1], t);
      });
    }
    let n = 0;
    html = html.replace(/(?:<font[^>]*>\s*)?\[\s*<a href="#(f\w+?n)"[^>]*>[\s\S]*?<\/a>\s*\](?:\s*<\/font>)?/gi, (x, id) => {
      const t = tunnukset.get(id);
      if (!t) return '';
      const tunnus = 'pg' + (++n);
      maar.push(maaritelma(tunnus, t));
      return 'XLUINVIITE' + tunnus + 'X';
    });
    const el = document.createElement('div');
    const kpl = (html + (loppu ? '<br><br>' + loppu : '')).split(/(?:<br\s*\/?>\s*){2,}/i).map(x => x.trim()).filter(x => rivi(jasenna(x).body.textContent));
    let julkaistu = '';
    kpl.forEach((x, i) => {
      const p = document.createElement('p');
      p.innerHTML = x;
      p.querySelectorAll('font').forEach(f => f.replaceWith(...f.childNodes));
      const t = rivi(p.textContent), m = /^(\p{L}+)\s+(\d{4})$/u.exec(t), k = m ? PG_KUUKAUDET.indexOf(m[1].toLowerCase()) : -1;
      if (!i && k >= 0) { julkaistu = m[2] + '-' + String(k + 1).padStart(2, '0'); return; }
      el.appendChild(p);
    });
    const otsikko = rivi((document.querySelector('img[alt][width][height]:not([alt=""])') || {}).alt) || rivi(document.title);
    return { html: irrota([el]).innerHTML, otsikko: rivi(document.title) || otsikko, tekija: 'Paul Graham', sivusto: 'paulgraham.com', julkaistu, lahde: osoite, maar };
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

  /* Perseus Digital Library (perseus.tufts.edu/hopper; käyttäjän pyyntö 16.11.2026, pahvin A10: lyhyistä paloista koko kirja,
     viitenumerot kirja.luku.pykälä). Lukusivu text?doc=Perseus:text:1999.01.0168:book=1:section=327a näyttää yhden pykälän;
     sama sivu tarjoaa koko teoksen TEI-XML:n (dltext?doc=…, yksi haku samalta sivustolta), josta leikataan osoitteen ylin osa
     (book=1 → div type=book n=1; ilman jakoa koko teos). XML luetaan XML:nä (milestone on tyhjä elementti, jonka HTML-jäsennin
     tulkitsisi alkutagiksi). Kreikka on XML:ssä Beta-koodia (NO/MW| PO/LEWS, *)ari/stwnos): Unicodeksi (psBeta). Kreikankielisessä
     teoksessa (sivun .text_container.greek) koko teksti, muissa foreign[lang=greek]. Viitenumerot yläindekseiksi: pykälä
     (milestone unit=section) tai luku, muodossa kirja.luku.pykälä; kirjaimellinen pykälä (Stephanus 327a, Bekker) sellaisenaan.
     Puhujat (sp/speaker) lihavoituina puheenvuoron alkuun, säkeet (l) riveittäin, otsikot (head) väliotsikoiksi, teosten nimet
     (title) kursiiviksi, viitteet (note) alaviitteiksi. Etukenttä teiHeaderista: nimi (ilman (English). Machine readable text),
     tekijä, kääntäjä lähdeteoksen nimestä (translated by …), lähdeteos, kustantaja ja vuosi; lisenssi sivun rel=license-linkistä.
     Scaife-lukija (scaife.perseus.org) on JavaScript-sovellus, jota sovite ei kata. Mitattu 16.11.2026. */
  const PS_NIMI = 'Perseus Digital Library';
  const PS_KIRJAIMET = { a: 'α', b: 'β', g: 'γ', d: 'δ', e: 'ε', z: 'ζ', h: 'η', q: 'θ', i: 'ι', k: 'κ', l: 'λ', m: 'μ', n: 'ν', c: 'ξ',
    o: 'ο', p: 'π', r: 'ρ', s: 'σ', t: 'τ', u: 'υ', f: 'φ', x: 'χ', y: 'ψ', w: 'ω', v: 'ϝ' };
  const PS_MERKIT = { ')': ['̓', 0], '(': ['̔', 0], '+': ['̈', 1], '/': ['́', 2], '\\': ['̀', 2], '=': ['͂', 2], '|': ['ͅ', 3] };
  function psBeta(s) {
    let ulos = '';
    const t = String(s);
    for (let i = 0; i < t.length;) {
      let iso = false, merkit = [];
      if (t[i] === '*') {
        iso = true; i++;
        while (i < t.length && PS_MERKIT[t[i]]) merkit.push(PS_MERKIT[t[i++]]);
      }
      const ch = (t[i] || '').toLowerCase();
      if (!PS_KIRJAIMET[ch]) {
        if (iso) ulos += merkit.map(m => m[0]).join('');
        const p = { ':': '·', ';': ';', "'": '’', '#': 'ʹ' }[t[i]];
        ulos += p !== undefined ? p : (t[i] || '');
        i++; continue;
      }
      let k = PS_KIRJAIMET[ch];
      i++;
      if (ch === 's') {
        if (t[i] === '1') { i++; } else if (t[i] === '2') { k = 'ς'; i++; } else if (t[i] === '3') { k = 'ϲ'; i++; }
        else if (!iso && !/[a-z*)(\/\\=+|]/i.test(t[i] || '')) k = 'ς';
      }
      while (i < t.length && PS_MERKIT[t[i]]) merkit.push(PS_MERKIT[t[i++]]);
      merkit.sort((a, b) => a[1] - b[1]);
      ulos += (iso ? k.toUpperCase() : k) + merkit.map(m => m[0]).join('');
    }
    return ulos.normalize('NFC');
  }
  /* Latinan teksti XML:ssä (de Finibus, Teubner 1915; mitattu 18.11.2026): treema on vokaalin perässä + (coe+rceri, poe+tis)
     ja säelainausten iktus / (au/t, de/nique, qui/). Hopperin sivukin näyttää ne raakoina. Vokaali ja yhdistyvä merkki, NFC.
     Apparaatin | (käsikirjoituksen rivinvaihto, neg|glig.) jää; verkko-osoitteisiin ei kosketa. */
  function psLatina(t) {
    if (!/[+\/]/.test(t) || /:\/\/|www\./.test(t)) return t;
    return t.replace(/([aeiouyAEIOUY])\+(?=[a-z])/g, '$1\u0308').replace(/(\p{L}[aeiouyAEIOUY]|\b[aeiouyAEIOUY])\/(?=[\p{L}\s'’,.;:!?—)\]]|$)/gu, '$1\u0301').normalize('NFC');
  }
  // Aikaraja 60 s (18.11.2026; ennen 20 s): Valtion käännös on 2,2 Mt, ja hitaalla yhteydellä 20 s riitti alkutekstille
  // mutta ei käännökselle (käyttäjän leike Firefoxilla: kreikka ilman käännöstä; toistettu viivästetyllä haulla).
  // Teksti jää sivun muistiin (lisäosan eristetty maailma säilyy välilehdellä sivun ajan): valintojen vaihto ajaa leikkurin
  // uudelleen, eikä Valtion 2,2 Mt:n käännöstä haeta joka kerta. Epäonnistunut haku ei jää muistiin.
  function psXml(u) {
    const muisti = globalThis.__lukimeenPsXml || (globalThis.__lukimeenPsXml = new Map());
    if (!muisti.has(u)) {
      const ohi = new AbortController(), ajastin = setTimeout(() => ohi.abort(), 60000);
      muisti.set(u, fetch(u, { credentials: 'same-origin', signal: ohi.signal }).then(r => r.ok ? r.text() : '').catch(() => '')
        .finally(() => clearTimeout(ajastin)).then(t => { if (!t) muisti.delete(u); return t; }));
    }
    return muisti.get(u).then(t => t ? new DOMParser().parseFromString(t, 'text/xml') : null).catch(() => null);
  }
  // TEI-XML:n runko HTML:ksi: osoitteen ylin jako (avaimet), kreikka Unicodeksi, alaviitteet maar-listaan tunnuksin etu+N.
  /* Kirjan nimi alkutekstin kielen mukaan (käyttäjän pyyntö 19.11.2026: englantilainen Book 1 on alkukielisessä tekstissä
     mauton). Kreikassa sekamalli (käyttäjän päätös 19.11.2026): Ilias ja Odysseia aakkosin Aleksandrian oppineiden tapaan
     (Ilias Α–Ω, Odysseia α–ω; Smyth §348), muut kreikkalaiset numeroin keraialla (Αʹ, Βʹ … Ϛʹ = 6, Ζʹ = 7, ΙΑʹ = 11).
     Keraia on U+0374 eikä sen NFC-vastine U+02B9, jota Literatassa ei ole (kreikan osajoukossa on U+0374 ja Ϛ, mitattu
     19.11.2026). Latinassa roomalaiset numerot, englanninkielisessä teoksessa Book 1. Muu kuin numero pysyy Book-muodossa. */
  const PS_AAKKOSET = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
  const PS_YKSIKOT = ['', 'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ϛ', 'Ζ', 'Η', 'Θ'], PS_KYMPIT = ['', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ϟ'];
  function psRooma(i) {
    let t = '';
    [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
      .forEach(([a, m]) => { while (i >= a) { t += m; i -= a; } });
    return t;
  }
  function psKirja(n, kieli) {
    const i = /^\d+$/.test(n) ? +n : 0;
    if (kieli === 'ilias' && i >= 1 && i <= PS_AAKKOSET.length) return PS_AAKKOSET[i - 1];
    if (kieli === 'odysseia' && i >= 1 && i <= PS_AAKKOSET.length) return PS_AAKKOSET[i - 1].toLowerCase();
    if (kieli === 'kreikka' && i >= 1 && i <= 99) return PS_KYMPIT[Math.floor(i / 10)] + PS_YKSIKOT[i % 10] + '\u0374';
    if (kieli === 'latina' && i >= 1 && i < 4000) return psRooma(i);
    return 'Book ' + n;
  }
  /* Kreikkalaisen teoksen nimi kreikaksi (käyttäjän pyyntö 19.11.2026: kun leikkeessä on alkuteksti, myös otsikko on alkukielellä,
     Πολιτεία Αʹ). Perseuksen teiHeaderissa ja luettelossa nimi on vain englanniksi tai latinaksi (Republic, Respublica; mitattu
     19.11.2026), joten nimet ovat tässä. Avain on englantilainen nimi pienin kirjaimin ilman The-alkua; puuttuva jää englanniksi.
     Ksenofonin Economics jätetty pois (Aristoteleen Οἰκονομικά samalla nimellä). Nimet NFC-muodossa. */
  const PS_KREIKKA_NIMET = {
    // Platon
    'republic': 'Πολιτεία', 'laws': 'Νόμοι', 'symposium': 'Συμπόσιον', 'phaedo': 'Φαίδων', 'phaedrus': 'Φαῖδρος',
    'apology': 'Ἀπολογία Σωκράτους', 'crito': 'Κρίτων', 'euthyphro': 'Εὐθύφρων', 'cratylus': 'Κρατύλος', 'theaetetus': 'Θεαίτητος',
    'sophist': 'Σοφιστής', 'statesman': 'Πολιτικός', 'parmenides': 'Παρμενίδης', 'philebus': 'Φίληβος', 'charmides': 'Χαρμίδης',
    'laches': 'Λάχης', 'lysis': 'Λύσις', 'euthydemus': 'Εὐθύδημος', 'protagoras': 'Πρωταγόρας', 'gorgias': 'Γοργίας',
    'meno': 'Μένων', 'greater hippias': 'Ἱππίας μείζων', 'lesser hippias': 'Ἱππίας ἐλάττων', 'ion': 'Ἴων', 'menexenus': 'Μενέξενος',
    'cleitophon': 'Κλειτοφῶν', 'timaeus': 'Τίμαιος', 'critias': 'Κριτίας', 'minos': 'Μίνως', 'epinomis': 'Ἐπινομίς',
    'letters': 'Ἐπιστολαί', 'lovers': 'Ἐρασταί', 'theages': 'Θεάγης', 'hipparchus': 'Ἵππαρχος',
    // Homeros ja Hesiodos
    'iliad': 'Ἰλιάς', 'odyssey': 'Ὀδύσσεια', 'theogony': 'Θεογονία', 'works and days': 'Ἔργα καὶ ἡμέραι',
    'shield of heracles': 'Ἀσπὶς Ἡρακλέους',
    // historioitsijat
    'histories': 'Ἱστορίαι', 'peloponnesian war': 'Ἱστορίαι',
    // Aristoteles
    'nicomachean ethics': 'Ἠθικὰ Νικομάχεια', 'eudemian ethics': 'Ἠθικὰ Εὐδήμεια', 'politics': 'Πολιτικά',
    'poetics': 'Περὶ ποιητικῆς', 'rhetoric': 'Ῥητορική', 'metaphysics': 'Τὰ μετὰ τὰ φυσικά',
    'athenian constitution': 'Ἀθηναίων πολιτεία',
    // Ksenofon
    'memorabilia': 'Ἀπομνημονεύματα', 'anabasis': 'Κύρου ἀνάβασις', 'cyropaedia': 'Κύρου παιδεία', 'hellenica': 'Ἑλληνικά',
    // Aiskhylos
    'agamemnon': 'Ἀγαμέμνων', 'libation bearers': 'Χοηφόροι', 'eumenides': 'Εὐμενίδες', 'prometheus bound': 'Προμηθεὺς δεσμώτης',
    'persians': 'Πέρσαι', 'seven against thebes': 'Ἑπτὰ ἐπὶ Θήβας', 'suppliant women': 'Ἱκέτιδες', 'suppliants': 'Ἱκέτιδες',
    // Sofokles
    'oedipus tyrannus': 'Οἰδίπους τύραννος', 'oedipus at colonus': 'Οἰδίπους ἐπὶ Κολωνῷ', 'antigone': 'Ἀντιγόνη', 'ajax': 'Αἴας',
    'electra': 'Ἠλέκτρα', 'trachiniae': 'Τραχίνιαι', 'philoctetes': 'Φιλοκτήτης',
    // Euripides
    'medea': 'Μήδεια', 'bacchae': 'Βάκχαι', 'hippolytus': 'Ἱππόλυτος', 'alcestis': 'Ἄλκηστις', 'andromache': 'Ἀνδρομάχη',
    'hecuba': 'Ἑκάβη', 'helen': 'Ἑλένη', 'heracles': 'Ἡρακλῆς', 'heracleidae': 'Ἡρακλεῖδαι', 'orestes': 'Ὀρέστης',
    'phoenissae': 'Φοίνισσαι', 'rhesus': 'Ῥῆσος', 'trojan women': 'Τρῳάδες', 'cyclops': 'Κύκλωψ',
    'iphigenia in aulis': 'Ἰφιγένεια ἡ ἐν Αὐλίδι', 'iphigenia in tauris': 'Ἰφιγένεια ἡ ἐν Ταύροις',
    // Aristofanes
    'acharnians': 'Ἀχαρνῆς', 'knights': 'Ἱππῆς', 'clouds': 'Νεφέλαι', 'wasps': 'Σφῆκες', 'peace': 'Εἰρήνη', 'birds': 'Ὄρνιθες',
    'lysistrata': 'Λυσιστράτη', 'thesmophoriazusae': 'Θεσμοφοριάζουσαι', 'frogs': 'Βάτραχοι', 'ecclesiazusae': 'Ἐκκλησιάζουσαι',
    'plutus': 'Πλοῦτος', 'wealth': 'Πλοῦτος'
  };
  function psKreikkaNimi(nimi) {
    return PS_KREIKKA_NIMET[nimi.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ').trim()] || nimi;
  }
  // Valitut kirjat (Set kirjan numeroista) koko teoksen rungosta; muut kirjat ohitetaan. null: kaikki.
  function psRunko(X, avaimet, kreikka, etu, maar, kieli, valitut) {
    const body = X && X.getElementsByTagName('body')[0];
    if (!body) return null;
    // Osoitteen ylin jako, jolle löytyy div (book=1 → div1 type=book n=1).
    let osa = null, osaNimi = '', osaAvain = '';
    const divit = [...body.getElementsByTagName('*')].filter(e => /^div\d?$/.test(e.tagName));
    for (const [k, v] of avaimet) {
      osa = divit.find(d => (d.getAttribute('type') || '').toLowerCase() === k.toLowerCase() && d.getAttribute('n') === v);
      if (osa) { osaAvain = k + '=' + v; osaNimi = /^book$/i.test(k) ? psKirja(v, kieli) : k.charAt(0).toUpperCase() + k.slice(1).toLowerCase() + ' ' + v; break; }
    }
    const juuri = osa || body;
    const el = document.createElement('div');
    let laskuri = 0, kpl = null;
    const tila = { kirja: osa && /^book$/i.test(osa.getAttribute('type') || '') ? osa.getAttribute('n') : '', luku: '' };
    // Kirja ja kohta ilman lukua, kun kohdat juoksevat kirjan läpi lukujen yli (de Finibus 1.11, ei 1.4.11; käyttäjän linjaus
    // 18.11.2026: book on luku ja section kohta, ei välitasoa). Lukujen alusta alkavat kohdat (Caesar 1.1.1, 1.2.1) pitävät luvun.
    let edKohta = null, lukuVaihtui = false, juoksee = false, nollautuu = false;
    for (const e of [juuri, ...juuri.getElementsByTagName('*')]) {
      const ty = (e.getAttribute('type') || e.getAttribute('unit') || '').toLowerCase();
      if (/^div\d?$/.test(e.tagName) && ty === 'book') { edKohta = null; lukuVaihtui = false; }
      else if ((/^div\d?$/.test(e.tagName) || e.tagName === 'milestone') && ty === 'chapter') lukuVaihtui = true;
      else if (e.tagName === 'milestone' && ty === 'section' && /^\d+$/.test(e.getAttribute('n') || '')) {
        const k = +e.getAttribute('n');
        if (edKohta !== null && lukuVaihtui) { if (k > edKohta) juoksee = true; else nollautuu = true; }
        edKohta = k; lukuVaihtui = false;
      }
    }
    // Ensisijaisesti teoksen oma viittausjärjestelmä (refsDecl: state unit=book/chapter/section; de Finibus book, section;
    // Valtio book, page, section): luku pois, jos sitä ei ole siinä. Ilman refsDecliä päättely kohtien juoksusta.
    const tilat = [...X.getElementsByTagName('state')].map(e => (e.getAttribute('unit') || '').toLowerCase().replace(/[^a-z]/g, '')); // Thukydides: chapter*
    const lukuPois = tilat.length ? !tilat.includes('chapter') : juoksee && !nollautuu;
    const viite = (n) => /[a-z]/i.test(n) && !/^\d+$/.test(n) ? n : [tila.kirja, lukuPois ? '' : tila.luku, n].filter(Boolean).join('.');
    // Sisäinen muunnos: TEI-solmu → HTML-solmut (inline).
    function inline(n, gr) {
      if (n.nodeType === 3) {
        const kieli = gr ? '' : ((n.parentNode && n.parentNode.closest && n.parentNode.closest('[lang]')) || { getAttribute: () => '' }).getAttribute('lang');
        const t = gr ? psBeta(n.nodeValue) : /^(la|lat|latin)$/i.test(kieli || '') ? psLatina(n.nodeValue) : n.nodeValue;
        return [document.createTextNode(t.replace(/\s+/g, ' '))];
      }
      if (n.nodeType !== 1) return [];
      const tag = n.tagName, lang = (n.getAttribute('lang') || '').toLowerCase();
      const g = lang ? lang === 'greek' : gr;
      const lapset = () => [...n.childNodes].flatMap(c => inline(c, g));
      if (tag === 'note') {
        const v = document.createElement('div'); v.append(...lapset());
        const t = muunna(irrota([v]).innerHTML, 'inlined').trim();
        if (!t) return [];
        const tunnus = etu + (++laskuri);
        maar.push(maaritelma(tunnus, t));
        return [merkki(tunnus)];
      }
      if (tag === 'milestone') {
        const u = n.getAttribute('unit'), nn = n.getAttribute('n') || '';
        if (u === 'chapter') { tila.luku = nn; return []; }
        // Puheenvuoron tai kappaleen raja kappaleen sisällä (Burnetin kreikassa jokainen vuoro): kappaleenvaihdoksi alla.
        if (/^para$/i.test(u || '')) { const k = document.createElement('span'); k.dataset.psk = '1'; return [k]; }
        if (u === 'section' || u === 'card') { const s = document.createElement('sup'); s.textContent = viite(nn); s.dataset.ps = '1'; return [s, document.createTextNode(' ')]; }
        return [];
      }
      if (tag === 'title') { const em = document.createElement('em'); em.append(...lapset()); return [em]; }
      if (tag === 'lb') return [document.createTextNode(' ')];
      if (tag === 'pb') return [];
      if (tag === 'gap') return [document.createTextNode('…')];
      if (tag === 'del') return [];
      return lapset();
    }
    const uusiKpl = () => { kpl = document.createElement('p'); el.appendChild(kpl); return kpl; };
    function lohko(n, gr) {
      if (n.nodeType === 3) { if (rivi(n.nodeValue)) (kpl || uusiKpl()).append(...inline(n, gr)); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName, lang = (n.getAttribute('lang') || '').toLowerCase();
      const g = lang ? lang === 'greek' : gr;
      if (/^div\d?$/.test(tag)) {
        // Koko teoksesta hakemisto pois (de Finibus: INDEX NOMINUM ET RERUM, viittaa painetun laitoksen sivuihin ja riveihin).
        if (juuri === body && /^index$/i.test(n.getAttribute('n') || n.getAttribute('type') || '')) return;
        if (valitut && juuri === body && n !== juuri && /^book$/i.test(n.getAttribute('type') || '') && !valitut.has(n.getAttribute('n') || '')) return;
        if (n !== juuri && /^chapter$/i.test(n.getAttribute('type') || '')) tila.luku = n.getAttribute('n') || '';
        if (n !== juuri && /^book$/i.test(n.getAttribute('type') || '')) {
          tila.kirja = n.getAttribute('n') || '';
          // Koko teoksessa kirjalle väliotsikko, jos sillä ei ole omaa headia (Valtio kreikaksi ja englanniksi: div1 type=book
          // ilman otsikkoa, joten kirjan vaihtuminen ei näkynyt eikä aikajanalla ollut yhtään salmiakkia; käyttäjän palaute
          // 18.11.2026). Kirja on luku (h2, aikajanan iso salmiakki), kuten kirjan oma head (alla). Lomituksessa käännöksen
          // otsikot jäävät pois kuten ennenkin.
          const eka = [...n.childNodes].find(c => c.nodeType === 1);
          if (juuri === body && /^\d+$/.test(tila.kirja) && !(eka && eka.tagName === 'head')) {
            const h = document.createElement('h2'); h.textContent = psKirja(tila.kirja, kieli); el.appendChild(h); kpl = null;
          }
        }
        [...n.childNodes].forEach(c => lohko(c, g));
        kpl = null; return;
      }
      if (tag === 'head') {
        // Koko teoksessa kirjan oma otsikko (de Finibus: LIBER PRIMUS) on luku; muut otsikot ja osan leikkeet kuten ennen.
        const p = n.parentNode, kirjanOts = juuri === body && p && p !== juuri && /^div\d?$/.test(p.tagName) && /^book$/i.test(p.getAttribute('type') || '');
        const h = document.createElement(kirjanOts ? 'h2' : 'h3'); h.append(...[...n.childNodes].flatMap(c => inline(c, g)));
        if (rivi(h.textContent)) el.appendChild(h);
        kpl = null; return;
      }
      if (tag === 'sp') {
        const sp = n.getElementsByTagName('speaker')[0];
        const nimi = sp ? rivi(kreikka ? psBeta(sp.textContent) : sp.textContent) : '';
        let eka = true;
        [...n.childNodes].forEach(c => {
          if (c.nodeType === 1 && c.tagName === 'speaker') return;
          if (c.nodeType === 1 && (c.tagName === 'p' || c.tagName === 'l' || c.tagName === 'lg')) {
            lohko(c, g);
            if (eka && nimi && kpl) { const b = document.createElement('strong'); b.textContent = nimi + ':'; kpl.prepend(b, ' '); }
            eka = false;
          } else lohko(c, g);
        });
        kpl = null; return;
      }
      if (tag === 'p') { uusiKpl(); kpl.append(...[...n.childNodes].flatMap(c => inline(c, g))); kpl = null; return; }
      if (tag === 'l') {
        const p = kpl && kpl.dataset.sae ? kpl : uusiKpl();
        p.dataset.sae = '1';
        if (p.childNodes.length) p.appendChild(document.createElement('br'));
        p.append(...[...n.childNodes].flatMap(c => inline(c, g)));
        return;
      }
      if (tag === 'lg' || tag === 'quote' || tag === 'cit' || tag === 'q') {
        if (tag === 'lg' || [...n.childNodes].some(c => c.nodeType === 1 && /^(l|lg|p)$/.test(c.tagName))) { kpl = null; [...n.childNodes].forEach(c => lohko(c, g)); kpl = null; return; }
      }
      if (tag === 'castList' || tag === 'front') return;
      (kpl || uusiKpl()).append(...inline(n, g));
    }
    [...juuri.childNodes].forEach(c => lohko(c, kreikka));
    // Kappaleraja (span[data-psk]) katkaisee kappaleen; säkeistössä katkoa seuraava rivinvaihto pois.
    [...el.querySelectorAll('p')].forEach(p => {
      if (!p.querySelector('span[data-psk]')) return;
      let nyt = p.cloneNode(false);
      const osat = [nyt];
      [...p.childNodes].forEach(c => {
        if (c.nodeType === 1 && c.matches('span[data-psk]')) { nyt = p.cloneNode(false); osat.push(nyt); return; }
        if (c.nodeType === 1 && c.tagName === 'BR' && !nyt.childNodes.length) return;
        nyt.appendChild(c);
      });
      p.replaceWith(...osat);
    });
    // Säkeen loppuun jäänyt viitenumero (card säkeiden välissä) rivinvaihdon jälkeen seuraavan säkeen alkuun.
    el.querySelectorAll('sup[data-ps]').forEach(s => {
      let n = s.nextSibling;
      while (n && n.nodeType === 3 && !rivi(n.nodeValue)) n = n.nextSibling;
      if (n && n.nodeType === 1 && n.tagName === 'BR') n.after(s, ' ');
    });
    // Kappaleen loppuun jäänyt viitenumero (section juuri ennen para-rajaa, Iliaan card lainauksen q viimeisen säkeen
    // perässä) seuraavan kappaleen alkuun: numero kuuluu sitä seuraavaan tekstiin.
    [...el.querySelectorAll('p')].forEach(p => {
      while (p.lastChild && (p.lastChild.nodeType === 3 ? !rivi(p.lastChild.nodeValue) : p.lastChild.tagName === 'BR')) p.lastChild.remove();
      const s = p.lastChild, seur = p.nextElementSibling;
      if (s && s !== p.firstChild && s.nodeType === 1 && s.matches('sup[data-ps]') && seur && seur.tagName === 'P') seur.prepend(s, ' ');
    });
    el.querySelectorAll('span[data-psk]').forEach(k => k.replaceWith(' '));
    el.querySelectorAll('p').forEach(p => { p.removeAttribute('data-sae'); if (!rivi(p.textContent)) p.remove(); });
    // Pelkkä viitenumero omana kappaleenaan (milestone ennen puheenvuoroa) seuraavan kappaleen alkuun.
    [...el.querySelectorAll('p')].forEach(p => {
      if ([...p.childNodes].some(c => c.nodeType === 1 ? c.tagName !== 'SUP' : rivi(c.nodeValue))) return;
      const s = p.nextElementSibling;
      if (s && s.tagName === 'P') { s.prepend(...p.childNodes, ' '); p.remove(); }
    });
    el.normalize();
    return { el, osaNimi, osaAvain };
  }
  /* Lomitettu käännös (semi-interlineaari; käyttäjän pyyntö 16.11.2026). Alkukielisellä sivulla (kreikka) Hopperin
     sivupalkin käännöswidget (div.widget#translationN, otsikko English (1969), focus-linkki text?doc=…) kertoo saman teoksen
     englanninkielisen laitoksen. Sen TEI-XML haetaan samoin, ja teksti lomitetaan viitenumeroittain: kunkin pykälän
     (Stephanus 327a, 1.1.1, kortti) alkuteksti ja heti perään käännös lainauksena (md.js ladoo sen käännökseksi etukentän
     ladonta: lomitettu käännös -rivistä). Pykälä on pienin yhteinen jako: kappaleet ja puheenvuorot eivät osu kielissä
     yksiin (kreikan puheenvuorot ovat Burnetilla milestone unit=para -merkkejä saman p:n sisällä), pykälät osuvat.
     Käännöksen pykälä, jota alkutekstissä ei ole, liitetään edelliseen pariin, jotta mitään ei katoa; käännöksen
     väliotsikot jäävät pois (alkutekstin otsikot riittävät). Jos alle 80 % alkutekstin pykälistä löytää parinsa
     (eri jako, esim. Caesarin englanninkielisessä vain luvut), lomitusta ei tehdä ja leike on alkukielinen kuten ennen. */
  function psKaannosLinkki() {
    for (const w of document.querySelectorAll('div.widget[id^="translation"]')) {
      const h = w.querySelector('.header');
      if (!h || !/^\s*English\b/i.test([...h.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join(' '))) continue;
      const a = [...h.querySelectorAll('a[href]')].find(x => rivi(x.textContent) === 'focus');
      try { const d = a && new URL(a.getAttribute('href'), location.href).searchParams.get('doc'); if (d) return d; } catch (e) { /* ohi */ }
    }
    return '';
  }
  // Runko jaksoiksi viitenumeroiden (sup[data-ps]) kohdalta; kappale katkeaa kahtia, jos numero on sen keskellä.
  function psJaksot(el) {
    const jaksot = [{ n: '', solmut: [] }];
    const lisaa = x => { if (/^H[23]$/.test(x.tagName) || rivi(x.textContent)) jaksot[jaksot.length - 1].solmut.push(x); };
    [...el.children].forEach(lohko => {
      if (!lohko.querySelector('sup[data-ps]')) { lisaa(lohko); return; }
      let nyt = lohko.cloneNode(false);
      [...lohko.childNodes].forEach(c => {
        if (c.nodeType === 1 && c.matches('sup[data-ps]')) {
          lisaa(nyt);
          jaksot.push({ n: rivi(c.textContent), solmut: [] });
          nyt = lohko.cloneNode(false);
        }
        nyt.appendChild(c);
      });
      lisaa(nyt);
    });
    jaksot.forEach(j => j.solmut.forEach(x => {
      if (x.firstChild && x.firstChild.nodeType === 3) x.firstChild.nodeValue = x.firstChild.nodeValue.replace(/^\s+/, '');
      if (x.lastChild && x.lastChild.nodeType === 3) x.lastChild.nodeValue = x.lastChild.nodeValue.replace(/\s+$/, '');
    }));
    return jaksot.filter(j => j.n || j.solmut.length);
  }
  async function psLomitus(avaimet, alku, valitut) {
    const doc = psKaannosLinkki(), dm = /^(Perseus:text:[\d.]+)/.exec(doc);
    if (!dm) return null;
    const X = await psXml(location.origin + '/hopper/dltext?doc=' + encodeURIComponent(dm[1]));
    // Epäonnistuessa syy näkyy ponnahduksessa (naytto), jotta käännöksen puuttuminen ei jää arvoitukseksi.
    if (!X) return { syy: 'käännöstä ei saatu' };
    const maar = [], R = psRunko(X, avaimet, false, 'pk', maar, '', valitut);
    if (!R || kkSanoja(R.el) < 50) return { syy: 'käännös tyhjä' };
    const A = psJaksot(alku.cloneNode(true)), K = psJaksot(R.el);
    const paikka = new Map();
    A.forEach((j, i) => { if (j.n && !paikka.has(j.n)) paikka.set(j.n, i); });
    const numeroita = A.filter(j => j.n).length;
    const osuu = K.filter(j => j.n && paikka.has(j.n)).length;
    if (!numeroita || osuu < 0.8 * numeroita) return { syy: 'käännöksen kohdat eivät osu, ' + osuu + '/' + numeroita };
    const kaannos = A.map(() => []);
    let ed = 0;
    K.forEach(j => {
      const i = j.n && paikka.has(j.n) ? paikka.get(j.n) : !j.n ? 0 : ed;
      ed = Math.max(ed, i);
      j.solmut.forEach(x => {
        if (/^H[23]$/.test(x.tagName)) return;
        x.querySelectorAll('sup[data-ps]').forEach(s => s.remove());
        if (x.firstChild && x.firstChild.nodeType === 3) x.firstChild.nodeValue = x.firstChild.nodeValue.replace(/^\s+/, '');
        if (rivi(x.textContent)) kaannos[i].push(x);
      });
    });
    const el = document.createElement('div');
    A.forEach((j, i) => {
      // Jakson lopun väliotsikot (seuraavan kirjan Book N) käännöksen jälkeen, muuten käännös jäisi otsikon alle.
      let k = j.solmut.length;
      while (k > 0 && /^H[23]$/.test(j.solmut[k - 1].tagName)) k--;
      el.append(...j.solmut.slice(0, k));
      if (kaannos[i].length) {
        const bq = document.createElement('blockquote');
        bq.append(...kaannos[i]);
        el.appendChild(bq);
      }
      el.append(...j.solmut.slice(k));
    });
    // Kääntäjä käännöksen teiHeaderista: lähdeteoksen nimi (… translated by Paul Shorey; The Iliad with an English
    // Translation by A.T. Murray, Ph.D. in two volumes.) tai editor role=translator. Crawleyn Thukydideessa nimeä ei ole.
    const sd = X.getElementsByTagName('sourceDesc')[0];
    const lt = sd && sd.getElementsByTagName('title')[0] ? rivi(sd.getElementsByTagName('title')[0].textContent) : '';
    const km = /\btranslat(?:ed|ion)\s+by\s+(.+?)(?:,?\s+(?:Ph\.\s?D|M\.\s?A|LL\.\s?D)\.?)?(?:\s+in\s+\w+\s+volumes?)?\.?$/i.exec(lt);
    const kaantaja = km ? km[1] : [...(sd ? sd.getElementsByTagName('editor') : [])].filter(e => /transl/i.test(e.getAttribute('role') || '')).map(e => rivi(e.textContent)).join(' & ');
    return { el, maar, kaantaja, pareja: osuu, numeroita };
  }
  /* Valittujen kirjojen nimi otsikkoon: peräkkäiset väliviivalla (Πολιτεία Αʹ–Γʹ, Ϛʹ; de Finibus I–III; Republic, Books 1–3, 6).
     Kaksi peräkkäistä pilkulla (Αʹ, Βʹ). */
  function psKirjaLuettelo(nrot, kieli) {
    const ryhmat = [];
    nrot.map(Number).sort((a, b) => a - b).forEach(i => { const r = ryhmat[ryhmat.length - 1]; if (r && r[1] === i - 1) r[1] = i; else ryhmat.push([i, i]); });
    const nimi = i => psKirja(String(i), kieli).replace(/^Book /, '');
    const t = ryhmat.map(([a, b]) => a === b ? nimi(a) : nimi(a) + (b === a + 1 ? ', ' : '–') + nimi(b)).join(', ');
    return /^Book /.test(psKirja('1', kieli)) ? 'Books ' + t : t;
  }
  /* Valinnat (PS_VALINNAT, ponnahdusikkunasta; käyttäjän pyyntö 19.11.2026): kielet 'molemmat' (lomitus, oletus), 'alku' (vain
     alkuteksti) tai 'kaannos' (vain sivupalkin englanninkielinen käännös omana tekstinään), ja kirjat: luettelo kirjojen
     numeroista. Yksi kirja leikataan kuten osoitteen book=N, kaikki kuten koko teos, muut valitut yhdeksi tekstiksi kirja
     kerrallaan otsikoin (kuten koko teos). Ilman valintoja leike on sama kuin ennen: osoitteen kirja, lomitus jos käännös on.
     Tulokseen ps: teoksen kirjat ja tehty valinta, joista ikkuna piirtää valitsimet. */
  /* Kirjat erillisinä teksteinä (V.erikseen, käyttäjän pyyntö 19.11.2026, mietintämyssyn luin-perseus-valinnat.md): kukin
     valittu kirja leikataan kuten yksittäinen kirja, ja tulokseen tulee sarja; Latomo latoo jokaisen ja lukin tuo ne pinoon
     erillisinä. Ensimmäinen kirja on myös tavallinen leike (esikatselu, vanha Latomo). */
  async function perseus() {
    const V = PS_VALINNAT || {};
    if (V.erikseen && Array.isArray(V.kirjat) && V.kirjat.length > 1) {
      const sarja = [];
      for (const n of V.kirjat) { const o = await perseusOsa({ kielet: V.kielet, kirjat: [n] }); if (o) sarja.push(o); }
      if (sarja.length > 1) {
        const eka = sarja[0];
        eka.sarja = sarja;
        eka.ps = Object.assign({}, eka.ps, { valitut: [...new Set(sarja.flatMap(o => o.ps ? o.ps.valitut : []))], erikseen: true });
        return eka;
      }
    }
    return perseusOsa(V);
  }
  async function perseusOsa(V) {
    if (!/(^|\.)perseus\.tufts\.edu$/i.test(location.hostname) || !/\/hopper\/text/.test(location.pathname)) return null;
    let doc = '';
    try { doc = new URL(osoite).searchParams.get('doc') || ''; } catch (e) { return null; }
    const dm = /^(Perseus:text:[\d.]+)(?::(.*))?$/.exec(doc);
    if (!dm) return null;
    let avaimet = (dm[2] || '').split(':').map(x => x.split('=')).filter(x => x.length === 2);
    const sivuKreikka = !!document.querySelector('.text_container.greek');
    const tc = (document.querySelector('.text_container') || {}).className || '';
    const enSivu = /(^|\s)en(\s|$)/.test(tc);
    const sivunKieli = sivuKreikka ? 'kreikka' : /(^|\s)(la|latin)(\s|$)/.test(tc) ? 'latina' : 'englanti';
    const kaannosDoc = enSivu ? '' : (/^(Perseus:text:[\d.]+)/.exec(psKaannosLinkki()) || [])[1] || '';
    const vainKaannos = V.kielet === 'kaannos' && !!kaannosDoc;
    const tekstiDoc = vainKaannos ? kaannosDoc : dm[1];
    const kreikka = sivuKreikka && !vainKaannos;
    const X = await psXml(location.origin + '/hopper/dltext?doc=' + encodeURIComponent(tekstiDoc));
    const ots = X && X.getElementsByTagName('title')[0] ? X.getElementsByTagName('title')[0].textContent : '';
    const kieli = vainKaannos ? '' : !kreikka ? (sivunKieli === 'latina' ? 'latina' : '') : /^\s*Iliad\b/i.test(ots) ? 'ilias' : /^\s*Odyssey\b/i.test(ots) ? 'odysseia' : 'kreikka';
    // Teoksen kirjat (div type=book n=numero) valitsimeksi.
    const xb = X && X.getElementsByTagName('body')[0];
    const kirjat = xb ? [...new Set([...xb.getElementsByTagName('*')].filter(e => /^div\d?$/.test(e.tagName) &&
      /^book$/i.test(e.getAttribute('type') || '') && /^\d+$/.test(e.getAttribute('n') || '')).map(e => e.getAttribute('n')))] : [];
    let valitut = null;
    if (Array.isArray(V.kirjat) && kirjat.length) {
      const vk = kirjat.filter(n => V.kirjat.includes(n));
      if (vk.length === 1) { if (!avaimet.some(([k, v]) => /^book$/i.test(k) && v === vk[0])) avaimet = [['book', vk[0]]]; }
      else if (vk.length) { avaimet = []; if (vk.length < kirjat.length) valitut = new Set(vk); }
    }
    const maar = [], R = psRunko(X, avaimet, kreikka, 'ps', maar, kieli, valitut);
    if (!R || kkSanoja(R.el) < 50) return null;
    let { el, osaNimi, osaAvain } = R, lomitus = null;
    if (valitut) osaNimi = psKirjaLuettelo([...valitut], kieli);
    if (!enSivu && !vainKaannos && V.kielet !== 'alku') lomitus = await psLomitus(avaimet, el, valitut);
    let lomitusSyy = '';
    if (lomitus && !lomitus.el) { lomitusSyy = lomitus.syy; lomitus = null; }
    if (lomitus) { el = lomitus.el; maar.push(...lomitus.maar); }
    const ts = X.getElementsByTagName('titleStmt')[0], sd = X.getElementsByTagName('sourceDesc')[0];
    const ek = (r, t) => r && r.getElementsByTagName(t)[0] ? rivi(r.getElementsByTagName(t)[0].textContent) : '';
    // Otsake (teiHeader) on latinalaisin kirjaimin myös kreikankielisessä teoksessa.
    let nimi = ek(ts, 'title').replace(/\s*\((English|Greek|Latin)\)\s*/i, ' ').replace(/\.?\s*Machine readable text\.?$/i, '').trim();
    if (/^(kreikka|ilias|odysseia)$/.test(kieli)) nimi = psKreikkaNimi(nimi);
    const lt = ek(sd, 'title');
    const km = /^(.*?),?\s+translated by\s+(.+)$/i.exec(lt);
    const kaantaja = km ? km[2] : [...(sd ? sd.getElementsByTagName('editor') : [])].filter(e => /transl/i.test(e.getAttribute('role') || '')).map(e => rivi(e.textContent)).join(' & ');
    const vuosi = (/(1[5-9]\d\d|20\d\d)/.exec(ek(sd, 'date')) || [])[1] || '';
    const kohtia = el.querySelectorAll('sup[data-ps]').length;
    el.querySelectorAll('sup[data-ps]').forEach(x => x.removeAttribute('data-ps'));
    // Lomitetussa leikkeessä kääntäjä on käännöksen; muut tiedot (laitos, kustantaja, vuosi) alkutekstin.
    const kaa = lomitus ? lomitus.kaantaja : kaantaja;
    // Englantilainen jaon nimi (Book 1, Books 1–3, Section 2) pilkulla, alkukielinen (Αʹ, I–III) välilyönnillä.
    const erotin = /^[A-Z][a-z]+ /.test(osaNimi) ? ', ' : ' ';
    const kirjaNyt = (/^book=(\d+)$/i.exec(osaAvain) || [])[1];
    return { html: irrota([el]).innerHTML, otsikko: osaNimi ? nimi + erotin + osaNimi : nimi, tekija: ek(ts, 'author'),
      ladonta: lomitus ? 'lomitettu käännös' : '',
      // Viitenumerot (section, card) ovat lukimen aikajanan kohtia (md.js: kohdat: yläindeksit).
      kohdat: kohtia ? 'yläindeksit' : '',
      suomentaja: kaa ? kkKaantaja(kkNimet(kaa)) : '', teos: km ? km[1] : lt, kustantaja: ek(sd, 'publisher'), julkaistu: vuosi,
      sivusto: PS_NIMI, lahde: location.origin + '/hopper/text?doc=' + encodeURIComponent(tekstiDoc + (osaAvain ? ':' + osaAvain : '')),
      maar, naytto: PS_NIMI + (lomitus ? ' (alkuteksti ja käännös)' : vainKaannos ? ' (käännös)' : V.kielet === 'alku' && kaannosDoc ? ' (alkuteksti)' : lomitusSyy ? ' (vain alkuteksti: ' + lomitusSyy + ')' : ''),
      ps: { kirjat, valitut: valitut ? [...valitut] : kirjaNyt ? [kirjaNyt] : osaAvain ? [] : kirjat.slice(),
        kieli: sivunKieli, kaannos: !!kaannosDoc, kielet: lomitus ? 'molemmat' : vainKaannos ? 'kaannos' : 'alku' } };
  }

  /* Tertullian Project (tertullian.org/fathers, Roger Pearsen litteroinnit; käyttäjän pyyntö 16.11.2026, pahvin valinnainen:
     Porfyrioksen De abstinentia, Taylor 1823, kirja yhdeksi, kirja- ja lukunumerot). Teos on sivuina saman tiedostonimen
     etuliitteellä (porphyry_abstinence_00_eintro.htm, _01_book1.htm …), sivun ylä- ja alalaidassa Previous/Next-kuvalinkit.
     Sivu: lihavoitu otsakekappale (Porphyry, On abstinence from animal food (1823) Book 1. pp.11-44), h3 (BOOK ONE),
     [Translated by …], luvut p > span.chapterno (1.), painetun laitoksen sivut span.pb (|12), viitemerkit a[href="#1"] sup,
     viivan alla [Footnotes moved to the end and numbered] ja merkinnät <a name="1"> 1.&nbsp;* teksti (Taylorin oma merkki *, +,
     § numeron perässä), lopussa litterointi- ja vapaan käytön rivi. Readability antoi yhden sivun ja jätti sivunumerot tekstiin.
     Sivut kootaan Previous/Next-linkkejä pitkin (sama etuliite, enintään LC_OSIA), luvut lihavoiduiksi, sivunumerot
     yläindekseiksi [12], viitteet alaviitteiksi, otsakekappale, käännösrivi, navigointi ja loppurivit pois. Etukenttä
     otsakkeesta (tekijä ennen pilkkua, vuosi sulkeista) ja käännösrivistä; public domain -rivi oikeuksiksi. Mitattu 16.11.2026. */
  const TT_RYHMA = u => { const m = /\/([a-z0-9]+(?:_[a-z]+)+?)_\d+_[^/]*\.html?$/i.exec(u); return m ? m[1] : null; };
  function ttSivu(d, u, laskuri, maar) {
    const b = d && d.body;
    if (!b) return null;
    const nav = rel => { const i = [...b.querySelectorAll('a img[alt]')].find(x => x.getAttribute('alt') === rel); try { return i ? new URL(i.parentElement.getAttribute('href'), u).href.split('#')[0] : ''; } catch (e) { return ''; } };
    const el = b.cloneNode(true);
    let otsake = '', kaannos = '', vapaa = '';
    el.querySelectorAll('p').forEach(p => {
      const t = rivi(p.textContent);
      if (p.querySelector('img[alt="Next Page"], img[alt="Previous Page"], img[alt="Table Of Contents"]') && t.length < 40) return p.remove();
      if (p.matches('.small')) { if (/public domain/i.test(t)) vapaa = t.replace(/^.*?(All material.*)$/i, '$1'); return p.remove(); }
      if (p.matches('.editorial') && /footnotes/i.test(t)) return p.remove();
      if (!otsake && p.querySelector('b') && rivi(p.querySelector('b').textContent) === t && p.getAttribute('align') === 'center') { otsake = t; return p.remove(); }
      const km = /^\[\s*Translated by\s+(.+?)\s*\]$/i.exec(t);
      if (km) { kaannos = km[1]; p.remove(); }
    });
    el.querySelectorAll('table, script, style, hr').forEach(x => x.remove());
    // Viitteet: <a name="1"> kappaleen alussa; teksti ilman numeroa ja Taylorin merkkiä.
    const kohteet = new Map();
    el.querySelectorAll('p > a[name]:first-child').forEach(a => {
      const p = a.parentElement, id = a.getAttribute('name');
      if (!/^\d+$/.test(id)) return;
      const k = p.cloneNode(true);
      k.querySelector('a[name]').remove();
      let t = muunna(irrota([k]).innerHTML, 'inlined').trim().replace(/^\d+\\?\.\s*/, '').replace(/^(?:\\?\*+|\+|<sup>[^<]*<\/sup>|§|\\?\[?[†‡§+*]\]?)\s*/, '');
      kohteet.set(id, t);
      p.remove();
    });
    el.querySelectorAll('a[href^="#"]').forEach(a => {
      const id = a.getAttribute('href').slice(1), t = kohteet.get(id);
      if (!t) { if (/^\d+$/.test(id)) a.remove(); return; }
      const tunnus = 'tt' + (++laskuri.n);
      maar.push(maaritelma(tunnus, t));
      const ed = a.previousSibling;
      if (ed && ed.nodeType === 3) ed.nodeValue = ed.nodeValue.replace(/\s+$/, '');
      a.replaceWith(merkki(tunnus));
    });
    // Merkki yläindeksin sisällä (<sup><a href="#2">2</a>.</sup>): yläindeksi auki, muuten md.js ei näe alaviitettä.
    el.querySelectorAll('sup').forEach(x => { if (/XLUINVIITE/.test(x.textContent)) x.replaceWith(...x.childNodes); });
    // Lihavointi yläindeksin sisällä (Taylorin alaviitteiden alaviitteet <sup><b>a</b></sup>) jäisi HTML:ksi.
    el.querySelectorAll('sup b, sup strong').forEach(x => x.replaceWith(...x.childNodes));
    el.querySelectorAll('span.chapterno').forEach(s => { const st = document.createElement('strong'); st.textContent = rivi(s.textContent); s.replaceWith(st); });
    el.querySelectorAll('span.pb').forEach(s => {
      const n = rivi(s.textContent).replace(/^\|/, ''), a = s.closest('a');
      const sup = document.createElement('sup'); sup.textContent = '[' + n + ']';
      (a && el.contains(a) && rivi(a.textContent) === rivi(s.textContent) ? a : s).replaceWith(sup);
      if (sup.nextSibling && sup.nextSibling.nodeType === 3) sup.nextSibling.nodeValue = sup.nextSibling.nodeValue.replace(/^\s*/, ' ');
    });
    el.querySelectorAll('a[name]').forEach(a => a.replaceWith(...a.childNodes));
    el.querySelectorAll('p').forEach(p => { if (!rivi(p.textContent.replace(/ /g, ' '))) p.remove(); });
    return { el, otsake, kaannos, vapaa, ed: nav('Previous Page'), seur: nav('Next Page') };
  }
  async function tertullian() {
    if (!/(^|\.)tertullian\.org$/i.test(location.hostname) || !/\/fathers\/[^/]+\.html?$/i.test(location.pathname)) return null;
    const maar = [], laskuri = { n: 0 };
    const oma = ttSivu(document, osoite, { n: 0 }, []);
    if (!oma || kkSanoja(oma.el) < 100) return null;
    const ryhma = TT_RYHMA(osoite), osat = [{ u: osoite, d: document }];
    if (ryhma) for (const [suunta, lisaa] of [['ed', x => osat.unshift(x)], ['seur', x => osat.push(x)]]) {
      let s = oma;
      const nahty = new Set([osoite]);
      while (osat.length < LC_OSIA && s[suunta] && TT_RYHMA(s[suunta]) === ryhma && !nahty.has(s[suunta])) {
        const u = s[suunta], d = await hae(u);
        nahty.add(u);
        s = d && ttSivu(d, u, { n: 0 }, []);
        if (!s) break;
        lisaa({ u, d });
      }
    }
    const el = document.createElement('div');
    let ens = null, kaannos = '', vapaa = '';
    osat.forEach(o => {
      const s = ttSivu(o.d, o.u, laskuri, maar);
      if (!s) return;
      // Nimiö mieluiten teoksen omalta sivulta (Book 1), ei verkkolaitoksen johdannosta.
      if (!ens || !/\(\d{4}\)/.test(ens.otsake) && /\(\d{4}\)/.test(s.otsake)) ens = s;
      kaannos = kaannos || s.kaannos; vapaa = vapaa || s.vapaa;
      el.append(...s.el.childNodes);
    });
    kkTasoita(el);
    el.normalize();
    // Otsake: Porphyry, On abstinence from animal food (1823) Book 1. pp.11-44 → tekijä, nimi, vuosi.
    const ot = (ens.otsake || rivi(document.title)).replace(/(\(\d{4}\)).*$/, '$1').replace(/\s+(?:Book|Part|Chapter|Introduction|Preface)\b.*$/i, '').replace(/\s+pp?\.\s*[\d-]+.*$/i, '');
    const om = /^([^,]{2,60}),\s*(.+?)(?:\s*\((\d{4})\))?$/.exec(ot);
    return { html: irrota([el]).innerHTML, otsikko: om ? om[2] : ot, tekija: om ? om[1] : '', julkaistu: om && om[3] || '',
      suomentaja: kaannos ? kkKaantaja([kaannos]) : '', sivusto: 'Tertullian Project', lahde: osat[0].u, maar,
      oikeus: vapaa ? { teksti: vapaa, lahde: osoite } : null, naytto: 'Tertullian Project' + (osat.length > 1 ? ' (' + osat.length + ' sivua)' : '') };
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
      teos: 'Kant’s gesammelte Schriften', vakiosivut: 'AA', numero: String(osa), sivut: sivut.length > 1 ? sivut[0].n + '–' + sivut[sivut.length - 1].n : String(sivu),
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
    // Sovitteen omat alaviitteet vain, jos niiden merkki on mukana (valinta voi olla osa tekstistä) tekstissä tai mukaan
    // otetussa alaviitteessä. Alaviitteen sisäinen merkki (22.11.2026, JAMA Netw Open PMC13583879: taulukon huomautuksessa
    // numeroviittaus) jäi ennen raa'aksi XLUINVIITEpmv3X:ksi, koska merkit muunnettiin vain tekstissä.
    const omatMd = omat.map(x => x.replace(MERKKI, '[^viite-$1]'));
    const tunnus = x => /^\[\^viite-([^\]]+)\]/.exec(x)[1];
    const mukana = new Set();
    for (let haku = md + otsikkoMd + maar.join('\n'), uudet = true; uudet;) {
      uudet = false;
      omatMd.forEach(x => { if (!mukana.has(x) && haku.includes('[^viite-' + tunnus(x) + ']')) { mukana.add(x); haku += '\n' + x; uudet = true; } });
    }
    const kaikki = maar.concat(omatMd.filter(x => mukana.has(x)));
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
    matuschak: { laji: 'lahjoitukset', osoite: 'https://www.patreon.com/quantumcountry' },
    fivebooks: { laji: 'lahjoitukset', osoite: 'https://fivebooks.com/support-us/' },
    obp: { laji: 'lahjoitukset', osoite: 'https://www.openbookpublishers.com/donate.html' },
    archiveTeksti: { laji: 'lahjoitukset', osoite: 'https://archive.org/donate' },
    folger: { laji: 'lahjoitukset', osoite: 'https://events.folger.edu/donate/contribute1?ct=1' },
    gwern: { laji: 'lahjoitukset', osoite: 'https://www.patreon.com/gwern' },
    larb: { laji: 'lahjoitukset', osoite: 'https://lareviewofbooks.org/donate/' },
    cdli: { laji: 'lahjoitukset', osoite: 'https://opencollective.com/cdli/donate' },
    bomb: { laji: 'mainokset ja lahjoitukset', osoite: 'https://bombmagazine.org/donate' },
    gutenbergDe: { laji: 'lahjoitukset', osoite: 'https://projekt-gutenberg.org/ueber-uns/finanzielle-unterstuetzung/' },
    newton: { laji: 'lahjoitukset', osoite: 'https://www.newtonproject.ox.ac.uk/support-us' },
    girardianLectionary: { laji: 'lahjoitukset', osoite: 'https://girardianlectionary.net/donate-connect/' },
    encyclopediaCom: { laji: 'mainokset' },
    newadvent: { laji: 'mainokset' }
  };

  /* Murupolku (käyttäjän vaatimus 21.11.2026: lähde sanoin tekstin loppuun, md.js lahdeOsio()): sivuston osasto, josta
     teksti on, etukentän `polku:`-avaimeen. Vain sivun oma rakennetieto: schema.org BreadcrumbList (JSON-LD tai mikrodata)
     tai aria-label- tai luokkanimeltään murupolku. Etusivu alusta ja tekstin oma nimi tai osoite lopusta pois; yli viisi
     nimeä tai yli 60 merkin nimi ei kelpaa. Sovite voi antaa oman (Snellman). → 'Osasto › Alaosasto' tai '' */
  function murupolku(otsikko) {
    const nimet = [];
    const lisaa = (nimi, href) => nimet.push({ nimi: rivi(nimi), href: href ? String(href) : '' });
    const listat = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      let j = null;
      try { j = JSON.parse(s.textContent); } catch (e) { return; }
      (function etsi(x, syv) {
        if (!x || typeof x !== 'object' || syv > 4) return;
        if (Array.isArray(x)) { x.forEach(y => etsi(y, syv + 1)); return; }
        if ([].concat(x['@type'] || []).includes('BreadcrumbList') && Array.isArray(x.itemListElement)) listat.push(x.itemListElement);
        else if (x['@graph']) etsi(x['@graph'], syv + 1);
      })(j, 0);
    });
    if (listat.length) {
      listat[0].slice().sort((a, b) => (+a.position || 0) - (+b.position || 0)).forEach(e => {
        const it = e.item && typeof e.item === 'object' ? e.item : {};
        lisaa(e.name || it.name, typeof e.item === 'string' ? e.item : it['@id'] || it.url);
      });
    } else {
      const md = document.querySelector('[itemtype$="schema.org/BreadcrumbList"]');
      const nav = md || document.querySelector('nav[aria-label*="breadcrumb" i], nav[aria-label*="murupolku" i], .breadcrumb, .breadcrumbs, #breadcrumb, #breadcrumbs');
      if (!nav) return '';
      if (md) md.querySelectorAll('[itemprop="itemListElement"]').forEach(li => {
        const n = li.querySelector('[itemprop="name"]'), a = li.querySelector('a[href]');
        lisaa(n ? n.textContent : li.textContent, a && a.href);
      });
      else {
        const lit = nav.querySelectorAll('li');
        if (lit.length) lit.forEach(li => { const a = li.querySelector('a[href]'); lisaa(li.textContent, a && a.href); });
        else nav.querySelectorAll('a[href]').forEach(a => lisaa(a.textContent, a.href));
      }
    }
    const juuri = location.origin + '/', oma = location.href.split('#')[0].replace(/\/$/, ''), ots = rivi(otsikko).toLowerCase();
    let osat = nimet.map(n => ({ nimi: n.nimi.replace(/^[›»>\/|·•\s]+|[›»>\/|·•\s]+$/g, ''), href: n.href })).filter(n => n.nimi);
    if (osat.length && (/^(home|etusivu|koti|start|startsida|startseite|accueil|inicio|início|home ?page|главная|pradžia|pagrindinis)$/i.test(osat[0].nimi)
      || osat[0].href === juuri || osat[0].href === location.origin)) osat.shift();
    // Viimeinen voi olla tekstin oma nimi katkaistuna (OpenEdition: Introduction : le travail social à trave...).
    while (osat.length) {
      const v = osat[osat.length - 1], kat = /(\.\.\.|…)$/.test(v.nimi), vn = v.nimi.replace(/\s*(\.\.\.|…)$/, '').toLowerCase();
      if ((v.href && v.href.split('#')[0].replace(/\/$/, '') === oma) || (ots && (vn === ots || ots.startsWith(vn) && (kat || vn.length > 20)))) osat.pop();
      else break;
    }
    if (!osat.length || osat.length > 5 || osat.some(n => n.nimi.length > 60 || /(\.\.\.|…)$/.test(n.nimi))) return '';
    // Osoitteen palasista tehdyt pienikirjaimiset nimet (Encyclopedia.com: social sciences) isolla alkukirjaimella.
    return osat.map(n => n.nimi === n.nimi.toLowerCase() ? n.nimi.charAt(0).toUpperCase() + n.nimi.slice(1) : n.nimi).join(' › ');
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
  let blogi = null, sovitin = sep ? 'sep' : '';
  if (!sep) for (const f of [logos, wikipedia, oecs, encyclopediaCom, saet, gutenberg, newadvent, ccel, gutenbergDe, bookOfConcord, novaVulgata, eoa, newton, latinLibrary, sls, snellman, religionOnline, aquinas, philological, augustinus, gretil, lacanOnline, phenomenologyOnline, girardianLectionary, kbTeksti, korpora, perseus, dhammatalks, lacuscurtius, tertullian, aeonPsyche, ejp, psychopen, ojs, vle, iredLeike, iep, ndpr, bmcr, oyc, iltascabile, doppiozero, noema, emergence, matuschak, fivebooks, paulgraham, pressbooks, openedition, hypotheses, manifold, forummagnum, janeway, scielo, obp, fadedpage, archiveTeksti, folger, gwern, larb, tri16, eurlex, findcaselaw, pmc, springerNature, plos, frontiers, ubiquity, spip, politicalconcepts, projectvox, embryo, cdli, zhurnal, fabula, popups, folktexts, womenwriters, chs, zeithistorische, bomb, substack, marxists, waitbutwhy, blogger]) {
    try { blogi = await f(); } catch (e) { blogi = null; }
    if (blogi) { sovitin = f.name; break; }
  }
  // Sovitteen tyhjä runko (IRED:n kansi) on tyhjä leike, ei Readabilityn arvaus katselimen sivusta.
  const sisalto = sep || (blogi && blogi.html) || (blogi && blogi.tyhja ? '' : artikkeli && artikkeli.content) || '';
  const omat = (blogi && blogi.maar) || [];

  const otsikko = blogi ? blogi.otsikko || osoite
    : siisti(rivi(artikkeli && artikkeli.title || document.title), rivi(artikkeli && artikkeli.siteName)) || osoite;
  // Etukenttä ja otsikkorivi (sarjan leikkeille sama kuin pääleikkeelle; Perseuksen kirjat erikseen, 21.11.2026).
  function alkuOf(blogi, otsikko) {
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
    kentta('laji', blogi && blogi.laji);
    kentta('suomentaja', blogi && blogi.suomentaja);
    kentta('sivusto', blogi ? blogi.sivusto : artikkeli && artikkeli.siteName);
    kentta('julkaistu', blogi ? blogi.julkaistu : artikkeli && artikkeli.publishedTime);
    kentta('paikka', blogi && blogi.paikka);
    kentta('kustantaja', blogi && blogi.kustantaja);
    kentta('doi', blogi && blogi.doi);
    kentta('ladonta', blogi && blogi.ladonta);
    kentta('kohdat', blogi && blogi.kohdat);
    // Vakiosivut (20.11.2026, opas 3.2): sivunumerojärjestelmän lyhenne kopion paikantimeen (AA 4:393, SKS 4:99).
    kentta('vakiosivut', blogi && blogi.vakiosivut);
    kentta('lähde', blogi && blogi.lahde || osoite);
    // Lähdeosion tiedot (md.js lahdeOsio(), 21.11.2026): sivuston ylläpitäjä, osasto ja alkukielinen laitos.
    kentta('ylläpitäjä', blogi && blogi.yllapitaja);
    let polku = blogi && blogi.polku || '';
    if (!polku && !sep) try { polku = murupolku(otsikko); } catch (e) { polku = ''; }
    kentta('polku', polku);
    kentta('alkuteksti', blogi && blogi.alkuteksti);
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
    return { alku, otsikkoMd };
  }
  const { alku, otsikkoMd } = alkuOf(blogi, otsikko);

  const [koko, valinta] = await Promise.all([sisalto ? valmista(sisalto, omat, otsikkoMd) : null, valintaHtml ? valmista(valintaHtml) : null]);
  const sanoja = s => (s.match(/\S+/g) || []).length;
  // Sarja (Perseuksen kirjat erillisinä teksteinä): kukin oma leikkeensä etukenttineen; ensimmäinen on myös koko.
  const sarja = [];
  if (blogi && Array.isArray(blogi.sarja) && blogi.sarja.length > 1) {
    for (const b of blogi.sarja) {
      const o = b.otsikko || otsikko, a = alkuOf(b, o), m = await valmista(b.html, b.maar || [], a.otsikkoMd);
      if (m && m.md) sarja.push({ md: a.alku + m.md + '\n', otsikko: o, sanoja: sanoja(m.md) });
    }
  }
  return {
    otsikko, sivusto: (blogi && (blogi.naytto || blogi.sivusto || blogi.otsikko)) || rivi(artikkeli && artikkeli.siteName) || location.hostname.replace(/^www\./, ''),
    koko: koko && koko.md ? alku + koko.md + '\n' : '', kokoSanoja: koko ? sanoja(koko.md) : 0, kokoViitteita: koko ? koko.viitteita : 0,
    valinta: valinta && valinta.md ? alku + valinta.md + '\n' : '', valintaSanoja: valinta ? sanoja(valinta.md) : 0,
    valintaViitteita: valinta ? valinta.viitteita : 0,
    // Perseus: kirjat ja kielet ponnahdusikkunan valitsimille.
    ps: (blogi && blogi.ps) || null,
    sarja: sarja.length > 1 ? sarja : null
  };
})();
