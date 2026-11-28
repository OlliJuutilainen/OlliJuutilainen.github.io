/* LuinPdf (luin/pdf/pdf.js): tekstin PDF nimikkeen valikosta (ULOSTUS › Imuroi › PDF, luin.html imuroiPdf()).
   Ladonta: lukimen jäsentämä ja tavuttama artikkeli piilokehyksessä Luinin omalla CSS:llä ja tämän tiedoston sivusäännöillä,
   sivutus Paged.js:llä (alaviitteet sivun alalaitaan lukimen numeroin). Kirjoitus: kehyksen sivut mitataan merkeittäin
   (Range.getClientRects) ja piirretään pdf-libillä. Tulostusikkunaa ei tarvita, joten sama koodi toimii selaimessa ja
   Android-kääreessä. Asettelu ja PDF käyttävät samoja staattisia Literata-instansseja (luin/fontit/literata-pdf-*.ttf):
   muuttuvan kirjasimen optinen koko muuttaisi leveyksiä, eikä fontkit osajoukota woff2:ta. Literatasta puuttuvat merkit tulevat
   varakirjasimesta (luin-merkit.ttf, DejaVu Sansin osajoukko) sekä asetteluun että PDF:ään. Sana piirretään mitattuun paikkaansa,
   ja sen mitattu leveys jaetaan merkkiväliksi, koska pdf-lib ei välistä kuten selain.
   CSS:n luoma sisältö (::before, ::after, luettelon merkki) ei ole tekstisolmuja, joten valmistele() kirjoittaa sen
   DOMiin ennen sivutusta; sisällyksen sivunumerot täytetään sivutuksen jälkeen varattuun tilaan.
   Kirjastot (luin/pdf/, versio nimessä, LISENSSIT.md) ladataan vasta, kun PDF:ää pyydetään. */
(function () {
  'use strict';
  var POLKU = 'luin/pdf/', FONTIT = 'luin/fontit/';
  var PAGED = POLKU + 'paged-0.4.3.polyfill.min.js';
  var KIRJASTOT = [POLKU + 'pdf-lib-1.17.1.min.js', POLKU + 'fontkit-1.1.1.min.js'];
  var KIRJASIN = { '400': 'literata-pdf-400.ttf', '400i': 'literata-pdf-400-kursiivi.ttf', '700': 'literata-pdf-700.ttf', '700i': 'literata-pdf-700-kursiivi.ttf',
    // Varakirjasin Literatasta puuttuville merkeille (nuolet, matematiikka, ⁂, ✓, heprea): DejaVu Sansin osajoukko.
    merkit: 'luin-merkit.ttf' };
  // A5, marginaalit millimetreinä (ylä, oikea, ala, vasen), leipäteksti pisteinä.
  var SIVU = { lev: 148, kork: 210, marg: [17, 15, 19, 15], koko: 10.5 };
  var PT = 72 / 25.4, PX = 0.75; // mm → pt, CSS px → pt
  var HARMAA = '#67553f', VIIVA = '#cbb99c';
  // Merkit, joita Literatassa ei ole mutta joilla on näköisvastine (md.js:n sitova yhdysmerkki).
  var KORVAA = { '\u2011': '-', '\u2010': '-' };

  var skriptit = {};
  function lataaSkripti(src) {
    if (!skriptit[src]) skriptit[src] = new Promise(function (ok, ei) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { ok(); };
      s.onerror = function () { delete skriptit[src]; ei(new Error('Kirjasto ei latautunut: ' + src)); };
      document.head.appendChild(s);
    });
    return skriptit[src];
  }

  function sivuCss() {
    var m = SIVU.marg, f = function (paino, tyyli, tiedosto) {
      return '@font-face { font-family: LiterataPDF; src: url(' + FONTIT + tiedosto + ') format("truetype"); font-weight: ' + paino +
        '; font-style: ' + tyyli + '; }';
    };
    return [
      f(400, 'normal', KIRJASIN['400']), f(400, 'italic', KIRJASIN['400i']), f(700, 'normal', KIRJASIN['700']), f(700, 'italic', KIRJASIN['700i']),
      '@font-face { font-family: LuinMerkit; src: url(' + FONTIT + KIRJASIN.merkit + ') format("truetype"); }',
      '@page { size: ' + SIVU.lev + 'mm ' + SIVU.kork + 'mm; margin: ' + m.join('mm ') + 'mm;',
      '  @footnote { border-top: .5pt solid ' + VIIVA + '; padding-top: 2.2mm; margin-top: 4mm; } }',
      ':root { --paperi: #fff; --koko: ' + SIVU.koko + 'pt; --antiikva: LiterataPDF, LuinMerkit, serif; --groteski: LiterataPDF, LuinMerkit, serif; }',
      'html, body { background: #fff !important; } body { margin: 0; padding: 0 !important; }',
      '#lukija, #sivu { position: static !important; padding: 0 !important; display: block !important; }',
      '.wrap, #teksti { font-size: ' + SIVU.koko + 'pt; max-width: none !important; width: auto !important; margin: 0 !important; left: auto !important; --koko: ' + SIVU.koko + 'pt; }',
      // Asettelu samoilla kirjasimilla kuin PDF ja ilman OpenType-valintoja, joita pdf-lib ei piirrä (numeromuodot, kapiteelit).
      '#teksti, #teksti *, .pagedjs_footnote_area, .pagedjs_footnote_area * { font-family: LiterataPDF, LuinMerkit, serif !important;',
      '  font-optical-sizing: none !important; font-variation-settings: normal !important; font-variant-numeric: normal !important;',
      '  font-variant-caps: normal !important; font-synthesis: none !important; }',
      '#teksti h2 { break-before: page; margin-top: 0; }',
      '#teksti hr.ennen-lukua { display: none; }',
      '#teksti p { orphans: 2; widows: 2; }',
      // Katkaistun lohkon jatko ja alku (Paged.js:n omat säännöt, mutta jäädytetyt tyyliattribuutit voittaisivat ne).
      '[data-split-from] { text-indent: 0 !important; margin-top: 0 !important; padding-top: 0 !important; }',
      '[data-split-to] { margin-bottom: 0 !important; padding-bottom: 0 !important; }',
      '.luin-ui, .sn-lisaa, .fntoggle { display: none !important; }',
      // Alaviite sivun alalaitaan; numerot ovat lukimen omat (fnref tekstissä, fnnum huomiossa), Paged.js:n kutsu piiloon.
      '[data-footnote-call] { font-size: 0 !important; line-height: 0 !important; }',
      '.sidenote { float: footnote; display: inline !important; font-size: 8pt; line-height: 1.38; color: var(--huomio); text-indent: 0; text-align: left; }',
      '.pagedjs_footnote_inner_content .sidenote { display: block !important; list-style: none !important; margin: 0 0 1.2mm; padding: 0; border: 0; }',
      '.sidenote::footnote-marker { content: none; }',
      '.sidenote .fnnum, .pdf-pitka-viite .fnnum { font-size: .78em; vertical-align: baseline; line-height: inherit; margin-right: .45em; }',
      '.pdf-pitka-viite { display: block; font-size: 8pt; line-height: 1.38; color: var(--huomio); text-indent: 0; text-align: left;',
      '  margin: .5em 0 1em; padding-left: .9em; border-left: .5pt solid ' + VIIVA + '; }',
      'nav.pdf-sis { break-after: page; margin: 2.4em 0 0; }',
      'nav.pdf-sis .sis-ots { text-transform: uppercase; letter-spacing: .16em; font-size: .78em; color: var(--harmaa); margin: 0 0 1em; text-indent: 0; }',
      'nav.pdf-sis ol { list-style: none; margin: 0; padding: 0; }',
      'nav.pdf-sis li { display: flex; align-items: baseline; gap: 1em; margin: 0 0 .45em; padding: 0; }',
      'nav.pdf-sis li.t2 { padding-left: 1.2em; } nav.pdf-sis li.t3 { padding-left: 2.4em; }',
      'nav.pdf-sis .pdf-sis-nimi { flex: 1 1 auto; min-width: 0; }',
      'nav.pdf-sis .pdf-sivu { flex: none; min-width: 2.2em; text-align: right; color: var(--harmaa); }',
      '.pdf-ei-before::before { content: none !important; } .pdf-ei-after::after { content: none !important; }',
      'li.pdf-merkitty { list-style: none !important; }',
      '.pdf-merkki { display: inline-block; box-sizing: border-box; width: 1.8em; margin-left: -1.8em; padding-right: .45em; text-align: right; text-indent: 0; }'
    ].join('\n');
  }

  // Ennen sivutusta (PagedConfig.before): CSS:n luoma sisältö DOMiin, luettelon merkit, ahtaat taulukot ja kirjasimet.
  var PITKA_VIITE = .4;
  // display mukana, koska Paged.js pitää tyyliattribuutillista elementtiä piilotettuna (data-undisplayed), ellei attribuutti
  // aseta näkyvää displayta, ja ohittaa silloin sen sivunvaihdot (pääluku ei alkanut uudelta sivulta).
  var JAADYTA = ['display', 'textIndent', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'textAlign'];
  var PSEUDO_TYYLI = ['display', 'float', 'position', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingLeft', 'paddingRight',
    'width', 'color', 'fontWeight', 'fontStyle', 'fontSize', 'letterSpacing', 'textTransform', 'verticalAlign', 'lineHeight'];
  function cssMerkkijono(c) {
    var m = /^"((?:[^"\\]|\\.)*)"$/.exec(c);
    if (!m) return null;
    return m[1].replace(/\\([0-9a-fA-F]{1,6})\s?/g, function (x, h) { return String.fromCodePoint(parseInt(h, 16)); }).replace(/\\(.)/g, '$1');
  }
  function merkki(tyyppi, n) {
    var aakkos = function (n, a) { var s = ''; while (n > 0) { n--; s = String.fromCharCode(a + n % 26) + s; n = Math.floor(n / 26); } return s; };
    var roomal = function (n) {
      var r = '', t = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
      t.forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } });
      return r;
    };
    switch (tyyppi) {
      case 'decimal': return n + '.';
      case 'decimal-leading-zero': return (n < 10 ? '0' : '') + n + '.';
      case 'lower-alpha': case 'lower-latin': return aakkos(n, 97) + '.';
      case 'upper-alpha': case 'upper-latin': return aakkos(n, 65) + '.';
      case 'lower-roman': return roomal(n) + '.';
      case 'upper-roman': return roomal(n).toUpperCase() + '.';
      case 'circle': return '◦';
      case 'square': return '▪';
      default: return '•';
    }
  }
  function valmistele(d) {
    var w = d.defaultView, art = d.getElementById('teksti');
    [].forEach.call(art.querySelectorAll('*'), function (el) {
      ['before', 'after'].forEach(function (p) {
        var cs = w.getComputedStyle(el, '::' + p), t = cssMerkkijono(cs.content);
        if (!t || cs.display === 'none') return;
        var s = d.createElement('span');
        s.className = 'pdf-pseudo';
        PSEUDO_TYYLI.forEach(function (k) { s.style[k] = cs[k]; });
        s.textContent = t;
        if (p === 'before') el.insertBefore(s, el.firstChild); else el.appendChild(s);
        el.classList.add('pdf-ei-' + p);
      });
    });
    [].forEach.call(art.querySelectorAll('li'), function (li) {
      var cs = w.getComputedStyle(li);
      if (cs.display !== 'list-item' || cs.listStyleType === 'none') return;
      var l = li.parentElement, n = 0;
      for (var x = li; x; x = x.previousElementSibling) if (x.tagName === 'LI') n++;
      if (l && l.tagName === 'OL') n += (parseInt(l.getAttribute('start'), 10) || 1) - 1;
      var s = d.createElement('span');
      s.className = 'pdf-merkki';
      s.textContent = merkki(cs.listStyleType, li.value > 0 && li.hasAttribute('value') ? li.value : n);
      li.insertBefore(s, li.firstChild);
      li.classList.add('pdf-merkitty');
    });
    // Sivua pidempi alaviite kaataa Paged.js:n sivutuksen (se aloittaa alusta ja lopettaa kesken ilmoittamatta).
    // Pitkä alaviite (yli PITKA_VIITE sivun korkeudesta) on siksi lohkona kappaleensa perässä kuten kapean ruudun lukimessa.
    var mitta = d.createElement('div'), raja = (SIVU.kork - SIVU.marg[0] - SIVU.marg[2]) * 96 / 25.4 * PITKA_VIITE;
    mitta.style.cssText = 'position: absolute; visibility: hidden; left: 0; top: 0; width: ' + (SIVU.lev - SIVU.marg[1] - SIVU.marg[3]) +
      'mm; font-size: 8pt; line-height: 1.38;';
    d.body.appendChild(mitta);
    [].forEach.call(art.querySelectorAll('.sidenote'), function (sn) {
      mitta.innerHTML = sn.innerHTML;
      if (mitta.offsetHeight <= raja) return;
      sn.className = 'pdf-pitka-viite';
      var l = sn.parentElement.closest('p, li, td, th, dd, dt, figcaption, blockquote, h1, h2, h3, h4, h5, h6');
      if (!l || /^(LI|TD|TH|DD|DT)$/.test(l.tagName)) (l || sn.parentElement).appendChild(sn);
      else l.parentNode.insertBefore(sn, l.nextSibling);
    });
    mitta.remove();
    // Paged.js kirjoittaa sisarvalitsimet (p + p) attribuuttivalitsimiksi, jolloin niiden spesifisyys laskee ja esim.
    // #teksti.sisennys p { text-indent: 0 } voittaa sisennyksen. Siksi lohkojen sisennys, välit ja tasaus jäädytetään
    // tyyliattribuuteiksi nyt, kun Luinin CSS on vielä sellaisenaan voimassa (katkaistun lohkon säännöt sivuCss():ssä).
    var lohkot = [].filter.call(art.querySelectorAll('*'), function (el) { return !/^inline/.test(w.getComputedStyle(el).display); });
    var arvot = lohkot.map(function (el) { var cs = w.getComputedStyle(el); return JAADYTA.map(function (k) { return cs[k]; }); });
    lohkot.forEach(function (el, i) { JAADYTA.forEach(function (k, j) { el.style[k] = arvot[i][j]; }); });
    // Ahtaat taulukot kuten lukimen ahtaatTaulukot(): kehys on palstan levyinen, joten mittaus vastaa sivun palstaa.
    [].forEach.call(art.querySelectorAll('table.taulukko'), function (t) {
      var e = t.parentElement;
      if (e && t.offsetWidth > e.clientWidth + 1) t.classList.add('ahdas');
    });
    void d.body.offsetHeight;
    return d.fonts.ready;
  }

  function kehys(o, edistys) {
    return new Promise(function (ok, ei) {
      var f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      // Näkymässä mutta näkymättömänä: ruudun ulkopuolista kehystä selain voi jarruttaa. Leveys on sivun palsta.
      f.style.cssText = 'position: fixed; left: 0; top: 0; width: ' + (SIVU.lev - SIVU.marg[1] - SIVU.marg[3]) + 'mm; height: 400px; border: 0;' +
        ' opacity: 0; pointer-events: none; z-index: -1;';
      // Vahti: Paged.js ei kerro kaatumisestaan muuten kuin käsittelemättömänä hylkäyksenä, joten pitkä hiljaisuus on virhe.
      var sivuja = 0, vahti = 0;
      var hiljaisuus = function () {
        clearTimeout(vahti);
        vahti = setTimeout(function () { f.__luinPdf.virhe(new Error('Sivutus pysähtyi.')); }, 90000);
      };
      f.__luinPdf = {
        valmistele: function (d) { hiljaisuus(); return valmistele(d); },
        sivu: function () { hiljaisuus(); edistys({ vaihe: 'ladonta', sivu: ++sivuja }); },
        valmis: function () { clearTimeout(vahti); ok(f); },
        virhe: function (e) { clearTimeout(vahti); f.remove(); ei(e); }
      };
      hiljaisuus();
      var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
      // document.write eikä srcdoc: kirjoitetun asiakirjan osoite on luin.html:n, ja Paged.js muodostaa osoitteita siitä
      // (about:srcdoc ei kelpaa URL:n pohjaksi).
      var html = '<!doctype html><html lang="' + esc(o.kieli || 'fi') + '"><head><meta charset="utf-8"><title>' + esc(o.otsikko) + '</title>' +
        '<style>' + o.css.replace(/<\/style/gi, '<\\/style') + '</style><style>' + sivuCss() + '</style>' +
        '<script>var L = frameElement.__luinPdf; window.PagedConfig = { auto: true, before: function () { return L.valmistele(document); },' +
        ' after: function () { setTimeout(L.valmis, 0); } }; window.addEventListener("error", function (e) { L.virhe(e.error || new Error(e.message)); });' +
        ' window.addEventListener("unhandledrejection", function (e) { L.virhe(e.reason instanceof Error ? e.reason : new Error(String(e.reason))); });<\/script>' +
        '<script src="' + PAGED + '"><\/script>' +
        '<script>Paged.registerHandlers(class extends Paged.Handler { afterPageLayout() { L.sivu(); } });<\/script>' +
        '</head><body><section id="lukija"><div id="sivu"><div class="wrap"><article id="teksti" class="' + esc(o.luokat || '') + '"' +
        (o.kieli ? ' lang="' + esc(o.kieli) + '"' : '') + '>' + o.html + '</article></div></div></section></body></html>';
      document.body.appendChild(f);
      var d = f.contentDocument;
      d.open(); d.write(html); d.close();
    });
  }

  function vari(c) {
    var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || '');
    if (!m || m[4] != null && +m[4] < 0.05) return null;
    return PDFLib.rgb(m[1] / 255, m[2] / 255, m[3] / 255);
  }
  function kattaa(F, g) {
    for (var i = 0; i < g.length;) { var c = g.codePointAt(i); if (!F.fk.hasGlyphForCodePoint(c)) return false; i += c > 0xffff ? 2 : 1; }
    return true;
  }
  function tyyliAvain(cs) { return (parseFloat(cs.fontWeight) > 500 ? '700' : '400') + (cs.fontStyle === 'normal' ? '' : 'i'); }
  function nayttoteksti(el) { return el.textContent.replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim(); }

  async function kirjoita(f, o, edistys) {
    var w = f.contentWindow, d = f.contentDocument, L = PDFLib;
    var pdf = await L.PDFDocument.create();
    pdf.registerFontkit(fontkit);
    var fontit = {};
    var fontti = function (k) {
      if (!fontit[k]) fontit[k] = fetch(FONTIT + KIRJASIN[k]).then(function (r) {
        if (!r.ok) throw new Error('Kirjasin ei latautunut: ' + KIRJASIN[k]);
        return r.arrayBuffer();
      }).then(function (b) { return pdf.embedFont(b, { subset: true }); }).then(function (p) {
        var fk = p.embedder.font;
        return { pdf: p, fk: fk, desc: -fk.descent / fk.unitsPerEm };
      });
      return fontit[k];
    };
    var sivut = [].slice.call(d.querySelectorAll('.pagedjs_page'));
    if (!sivut.length) throw new Error('Sivutus ei tuottanut sivuja.');
    // Paged.js voi aloittaa alusta tai lopettaa kesken ilmoittamatta: jokaisen lohkon pitää olla sivuilla tasan kerran
    // (katkaistun lohkon jatko ei lasketa), muuten PDF:ää ei anneta.
    var lohkot = {}, odotetut = (o.html.match(/ data-b="\d+"/g) || []).length;
    [].forEach.call(d.querySelectorAll('.pagedjs_page [data-b]:not([data-split-from]):not(.pdf-sivu)'), function (el) { lohkot[el.dataset.b] = (lohkot[el.dataset.b] || 0) + 1; });
    var tuplat = Object.keys(lohkot).filter(function (b) { return lohkot[b] > 1; }).length;
    if (tuplat || Object.keys(lohkot).length < odotetut - (o.html.match(/class="pdf-sivu" data-b="\d+"/g) || []).length)
      throw new Error('Sivutus jäi kesken (' + Object.keys(lohkot).length + '/' + odotetut + ' lohkoa' + (tuplat ? ', ' + tuplat + ' kahdesti' : '') + ').');
    var W = SIVU.lev * PT, H = SIVU.kork * PT, lang = o.kieli || 'fi';
    var ps = sivut.map(function () { return pdf.addPage([W, H]); });
    var sivuNro = function (el) { var s = el.closest('.pagedjs_page'); return s ? sivut.indexOf(s) : -1; };
    // Sisällyksen sivunumerot varattuun tilaan (rivitys ei muutu: tila on varattu ennen sivutusta).
    [].forEach.call(d.querySelectorAll('.pdf-sivu[data-b]'), function (s) {
      var k = d.querySelector('.pagedjs_page_content [data-b="' + s.dataset.b + '"]:not(.pdf-sivu)');
      if (k) s.textContent = String(sivuNro(k) + 1);
    });
    var rg = d.createRange(), puuttuvat = 0, puuttuvatMerkit = {}, otsakkeet = [], kohdat = [], linkit = [];
    var paaOts = d.querySelector('#teksti h1'), luku = '';
    for (var i = 0; i < sivut.length; i++) {
      var s = sivut[i], sivu = ps[i], alue = s.querySelector('.pagedjs_area') || s, r0 = s.getBoundingClientRect();
      var X = function (px) { return (px - r0.left) * PX; }, Y = function (px) { return H - (px - r0.top) * PX; };
      // Taustat ja reunaviivat ennen tekstiä (lainauksen viiva, hr, taulukot, alaviitealueen viiva).
      [].forEach.call(alue.querySelectorAll('*'), function (el) {
        var cs = w.getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        var tausta = vari(cs.backgroundColor);
        if (tausta && /^rgba?\(255,\s*255,\s*255/.test(cs.backgroundColor)) tausta = null;
        var reunat = ['Top', 'Right', 'Bottom', 'Left'].filter(function (p) {
          return parseFloat(cs['border' + p + 'Width']) > 0 && !/none|hidden/.test(cs['border' + p + 'Style']) && vari(cs['border' + p + 'Color']);
        });
        if (!tausta && !reunat.length) return;
        [].forEach.call(el.getClientRects(), function (r) {
          if (r.width <= 0 || r.height <= 0) return;
          if (tausta) sivu.drawRectangle({ x: X(r.left), y: Y(r.bottom), width: r.width * PX, height: r.height * PX, color: tausta });
          reunat.forEach(function (p) {
            var t = parseFloat(cs['border' + p + 'Width']) * PX, v = vari(cs['border' + p + 'Color']);
            if (p === 'Top') sivu.drawRectangle({ x: X(r.left), y: Y(r.top) - t, width: r.width * PX, height: t, color: v });
            if (p === 'Bottom') sivu.drawRectangle({ x: X(r.left), y: Y(r.bottom), width: r.width * PX, height: t, color: v });
            if (p === 'Left') sivu.drawRectangle({ x: X(r.left), y: Y(r.bottom), width: t, height: r.height * PX, color: v });
            if (p === 'Right') sivu.drawRectangle({ x: X(r.right) - t, y: Y(r.bottom), width: t, height: r.height * PX, color: v });
          });
        });
      });
      // Teksti merkeittäin: saman rivin ja kirjasimen merkit sanaksi, sana mitattuun paikkaansa ja leveyteensä.
      var tw = d.createTreeWalker(alue, NodeFilter.SHOW_TEXT), n;
      var alle = null;
      // Sanaväli piirretään vasta seuraavan sanan paikan selvittyä: saman rivin väli venytetään (Tz) mitatun levyiseksi, jotta
      // tasatun rivin leveät välit eivät pilko riviä tekstinpoiminnassa (haku ja tavutetun sanan yhdistys rivinvaihdossa).
      var vali = null;
      // Tekstioperaattorit suoraan, koska pdf-libin drawText käärii jokaisen sanan q/Q:hon ja asettaa kirjasimen ja värin joka
      // kerta (kirjan PDF olisi kaksi–kolme kertaa isompi). Kirjasin, väri, merkkiväli ja vaakaskaala asetetaan vain muuttuessaan;
      // ne säilyvät BT/ET:n yli, ja muiden piirtojen q/Q palauttaa ne.
      var kyna = { avain: null, koko: 0, vari: '', tc: 0, tz: 100 }, avaimet = new Map();
      var teksti = function (Fx, koko, vr, x, y, t, tc, tz) {
        var ops = [L.beginText()], avain = avaimet.get(Fx);
        if (!avain) { avain = sivu.node.newFontDictionary(Fx.pdf.name, Fx.pdf.ref); avaimet.set(Fx, avain); }
        if (avain !== kyna.avain || koko !== kyna.koko) { ops.push(L.setFontAndSize(avain, koko)); kyna.avain = avain; kyna.koko = koko; }
        var v = vr.red + ',' + vr.green + ',' + vr.blue;
        if (v !== kyna.vari) { ops.push(L.setFillingRgbColor(vr.red, vr.green, vr.blue)); kyna.vari = v; }
        if (tc !== kyna.tc) { ops.push(L.setCharacterSpacing(tc)); kyna.tc = tc; }
        if (tz !== kyna.tz) { ops.push(L.setCharacterSqueeze(tz)); kyna.tz = tz; }
        ops.push(L.setTextMatrix(1, 0, 0, 1, Math.round(x * 100) / 100, Math.round(y * 100) / 100), L.showText(Fx.pdf.encodeText(t)), L.endText());
        sivu.pushOperators.apply(sivu, ops);
      };
      var piirraVali = function (seur, ys) {
        if (!vali) return;
        var lev = vali.F.pdf.widthOfTextAtSize(' ', vali.koko), tz = 100;
        if (seur != null && Math.abs(ys - vali.y) < 1 && seur > vali.x) tz = Math.min(1000, Math.max(10, Math.round((seur - vali.x) * PX / lev * 1000) / 10));
        teksti(vali.F, vali.koko, vali.v, X(vali.x), Y(vali.y), ' ', 0, tz);
        vali = null;
      };
      var alleviiva = function () { if (alle) { sivu.drawRectangle({ x: X(alle.x0), y: Y(alle.y) - alle.t, width: (alle.x1 - alle.x0) * PX, height: alle.t, color: alle.v }); alle = null; } };
      while ((n = tw.nextNode())) {
        var v = n.nodeValue;
        if (!v || !/\S/.test(v.replace(/\u00ad/g, ''))) continue;
        var el = n.parentElement, cs = w.getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        var vr = vari(cs.color);
        if (!vr) continue;
        var Fp = await fontti(tyyliAvain(cs)), Fs = null;
        var koko = parseFloat(cs.fontSize), kokoPt = koko * PX;
        var iso = cs.textTransform === 'uppercase';
        var kor = koriste(el, alue, w);
        var sana = '', F = null, x0 = 0, x1 = 0, y0 = 0, viimeY = null, tavu = false;
        var piirra = function (tila, viiva) {
          if (sana) {
            var fk = F.fk, gl = fk.layout(sana), luonn = 0;
            gl.glyphs.forEach(function (g) { luonn += g.advanceWidth; });
            luonn *= kokoPt / fk.unitsPerEm;
            var tc = gl.glyphs.length > 1 ? ((x1 - x0) * PX - luonn) / (gl.glyphs.length - 1) : 0;
            piirraVali(x0, y0);
            teksti(F, kokoPt, vr, X(x0), Y(y0), sana + (viiva ? '-' : ''), Math.abs(tc) > 0.003 ? Math.round(tc * 1000) / 1000 : 0, 100);
            var viivaLev = viiva ? F.pdf.widthOfTextAtSize('-', kokoPt) / PX : 0;
            if (tila) vali = { x: x1 + viivaLev, y: y0, F: F, koko: kokoPt, v: vr };
            if (kor) {
              var ya = y0 + kor.alas, xl = x1 + viivaLev;
              if (alle && alle.el === kor.el && Math.abs(alle.y - ya) < 1 && x0 - alle.x1 < koko * .6) alle.x1 = xl;
              else { alleviiva(); alle = { el: kor.el, x0: x0, x1: xl, y: ya, t: kor.t, v: kor.v }; }
            }
          }
          sana = '';
        };
        for (var k = 0; k < v.length;) {
          var cp = v.codePointAt(k), c = String.fromCodePoint(cp), k0 = k;
          k += c.length;
          if (c === '\u00ad') { tavu = true; continue; }
          // Yhdistävä merkki kuuluu edelliseen merkkiin (sen laatikko voi olla leveydetön).
          if (/\p{M}/u.test(c) && sana && kattaa(F, c)) { sana += c; continue; }
          rg.setStart(n, k0); rg.setEnd(n, k);
          var rr = rg.getClientRects(), r = null;
          for (var j = rr.length - 1; j >= 0; j--) if (rr[j].width > 0) { r = rr[j]; break; }
          if (/\s/.test(c)) { piirra(true); tavu = false; continue; }
          var g = KORVAA[c] || (iso ? c.toLocaleUpperCase(lang) : c);
          if (!r) {
            // Ligatuurin jälkimmäinen merkki (Th, fi) saa leveydettömän laatikon: se kuuluu edelliseen sanaan (pdf-lib latoo
            // saman ligatuurin). Muut leveydettömät (nollaväli, sanaliitos) jätetään pois.
            if (sana && /[\p{L}\p{N}\p{P}\p{S}]/u.test(c) && kattaa(F, g)) sana += g;
            continue;
          }
          // Kirjasin: tyylin Literata, puuttuvalle merkille varakirjasin (sama järjestys kuin kehyksen font-familyssä).
          var Fm = kattaa(Fp, g) ? Fp : null;
          if (!Fm) { Fs = Fs || await fontti('merkit'); if (kattaa(Fs, g)) Fm = Fs; }
          var pohja = r.bottom - (Fm || Fp).desc * koko;
          if (viimeY !== null && Math.abs(pohja - viimeY) > 1) { piirra(false, tavu); alleviiva(); }
          tavu = false;
          if (!Fm) { puuttuvat++; puuttuvatMerkit[g] = 1; piirra(false); viimeY = pohja; continue; }
          if (sana && Fm !== F) piirra(false);
          if (!sana) { x0 = r.left; y0 = pohja; F = Fm; }
          sana += g; x1 = r.right; viimeY = pohja;
        }
        piirra(false);
      }
      piirraVali();
      alleviiva();
      // Kirjanmerkit (h2–h4) ja linkit; luvun nimi juoksevaan otsakkeeseen.
      var lukuAlkaa = false;
      [].forEach.call(alue.querySelectorAll('.pagedjs_page_content h1, .pagedjs_page_content h2, .pagedjs_page_content h3, .pagedjs_page_content h4'), function (h) {
        if (h.hasAttribute('data-split-from')) return;
        var t = nayttoteksti(h), r = h.getBoundingClientRect();
        if (h.tagName !== 'H1' && t) kohdat.push({ taso: +h.tagName[1], nimi: t, sivu: i, y: Y(r.top) });
        if (h.tagName === 'H2') { lukuAlkaa = true; luku = t; }
      });
      [].forEach.call(alue.querySelectorAll('a[href]'), function (a) {
        var h = a.getAttribute('href'), rs = [].filter.call(a.getClientRects(), function (r) { return r.width > 0; });
        if (!h || !rs.length) return;
        var kohde = null;
        if (h.charAt(0) === '#') {
          var t = h.length > 1 && d.querySelector('.pagedjs_page_content [id="' + h.slice(1).replace(/"/g, '\\"') + '"]');
          if (!t) return;
          kohde = { sivu: sivuNro(t), y: Y(t.getBoundingClientRect().top) };
          if (kohde.sivu < 0) return;
        } else {
          try { kohde = { uri: new URL(h, document.baseURI).href }; } catch (e) { return; }
          if (!/^https?:|^mailto:/.test(kohde.uri)) return;
        }
        rs.forEach(function (r) { linkit.push({ sivu: i, rect: [X(r.left), Y(r.bottom), X(r.right), Y(r.top)], kohde: kohde }); });
      });
      otsakkeet.push(i === 0 || lukuAlkaa ? '' : (luku || (paaOts ? nayttoteksti(paaOts) : o.otsikko)));
      edistys({ vaihe: 'kirjoitus', sivu: i + 1, sivuja: sivut.length });
      await new Promise(function (ok) { setTimeout(ok, 0); });
    }
    // Juokseva otsake (luvun nimi, ei luvun alkusivulla) ja sivunumero; ensimmäisellä sivulla ei kumpaakaan.
    var P = (await fontti('400')).pdf, harmaa = vari(hex(HARMAA)), kentta = W - (SIVU.marg[1] + SIVU.marg[3]) * PT;
    ps.forEach(function (sivu, i) {
      if (!i) return;
      var nro = String(i + 1);
      sivu.drawText(nro, { x: W / 2 - P.widthOfTextAtSize(nro, 8) / 2, y: SIVU.marg[2] * PT / 2, size: 8, font: P, color: harmaa });
      var t = otsakkeet[i] && otsakkeet[i].toLocaleUpperCase(lang);
      if (!t) return;
      var harv = 7 * .14, lev = function (s) { return P.widthOfTextAtSize(s, 7) + harv * (s.length - 1); };
      while (t.length > 3 && lev(t) > kentta) t = t.slice(0, -2).replace(/\s+$/, '') + '…';
      sivu.pushOperators(PDFLib.setCharacterSpacing(harv));
      sivu.drawText(t, { x: W / 2 - lev(t) / 2, y: H - SIVU.marg[0] * PT / 2 - 2, size: 7, font: P, color: harmaa });
      sivu.pushOperators(PDFLib.setCharacterSpacing(0));
    });
    linkit.forEach(function (l) {
      var a = { Type: 'Annot', Subtype: 'Link', Rect: l.rect, Border: [0, 0, 0] };
      if (l.kohde.uri) a.A = { Type: 'Action', S: 'URI', URI: L.PDFString.of(l.kohde.uri) };
      else a.Dest = [ps[l.kohde.sivu].ref, 'XYZ', null, l.kohde.y, null];
      ps[l.sivu].node.addAnnot(pdf.context.register(pdf.context.obj(a)));
    });
    kirjanmerkit(pdf, kohdat.map(function (k) { return { taso: k.taso, nimi: k.nimi, ref: ps[k.sivu].ref, y: k.y }; }));
    if (o.otsikko) pdf.setTitle(o.otsikko, { showInWindowTitleBar: true });
    if (o.tekija) pdf.setAuthor(o.tekija);
    if (o.kieli) pdf.setLanguage(o.kieli);
    pdf.setCreator('luin.html');
    return { tavut: await pdf.save(), sivuja: sivut.length, puuttuvat: puuttuvat, puuttuvatMerkit: Object.keys(puuttuvatMerkit) };
  }
  function hex(h) { return 'rgb(' + [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }).join(', ') + ')'; }

  // Alleviivattu esivanhempi (text-decoration ei periydy laskettuun tyyliin): väri, paksuus ja etäisyys perusviivasta px.
  var koristeet = new WeakMap();
  function koriste(el, raja, w) {
    if (koristeet.has(el)) return koristeet.get(el);
    var tulos = null;
    for (var e = el; e && e !== raja; e = e.parentElement) {
      var cs = w.getComputedStyle(e);
      if (/underline/.test(cs.textDecorationLine)) {
        var koko = parseFloat(cs.fontSize), siirto = parseFloat(cs.textUnderlineOffset), paksu = parseFloat(cs.textDecorationThickness);
        tulos = { el: e, v: vari(cs.textDecorationColor) || vari(cs.color), alas: (isNaN(siirto) ? .12 * koko : siirto + .06 * koko),
          t: (isNaN(paksu) ? Math.max(.6, koko * .06) : paksu) * PX };
        break;
      }
      if (/^(block|list-item|table-cell|flex|grid)$/.test(cs.display)) break;
    }
    koristeet.set(el, tulos);
    return tulos;
  }

  // PDF:n kirjanmerkit (outline) otsikoista tasoittain; ylin esiintyvä taso on juuri.
  function kirjanmerkit(pdf, kohdat) {
    if (!kohdat.length) return;
    var L = PDFLib, ctx = pdf.context, juuri = { ref: ctx.nextRef(), lapset: [] }, pino = [{ taso: 0, s: juuri }];
    kohdat.forEach(function (k) {
      while (pino.length > 1 && pino[pino.length - 1].taso >= k.taso) pino.pop();
      var s = { k: k, ref: ctx.nextRef(), lapset: [], vanh: pino[pino.length - 1].s };
      s.vanh.lapset.push(s);
      pino.push({ taso: k.taso, s: s });
    });
    var maara = function (s) { return s.lapset.reduce(function (m, l) { return m + 1 + maara(l); }, 0); };
    var kirjoita = function (s) {
      s.lapset.forEach(function (l, i) {
        var o = { Title: L.PDFHexString.fromText(l.k.nimi), Parent: s.ref, Dest: [l.k.ref, 'XYZ', null, l.k.y, null] };
        if (i) o.Prev = s.lapset[i - 1].ref;
        if (i < s.lapset.length - 1) o.Next = s.lapset[i + 1].ref;
        if (l.lapset.length) { o.First = l.lapset[0].ref; o.Last = l.lapset[l.lapset.length - 1].ref; o.Count = maara(l); }
        ctx.assign(l.ref, ctx.obj(o));
        kirjoita(l);
      });
    };
    kirjoita(juuri);
    ctx.assign(juuri.ref, ctx.obj({ Type: 'Outlines', First: juuri.lapset[0].ref, Last: juuri.lapset[juuri.lapset.length - 1].ref, Count: maara(juuri) }));
    pdf.catalog.set(L.PDFName.of('Outlines'), juuri.ref);
  }

  // o: { html, luokat, kieli, otsikko, tekija, css }; edistys({ vaihe: 'ladonta' | 'kirjoitus', sivu, sivuja }).
  // Palauttaa { tavut: Uint8Array, sivuja, puuttuvat, puuttuvatMerkit } (merkit, joita kirjasimessa ei ole, jäävät pois).
  async function tee(o, edistys) {
    edistys = edistys || function () {};
    await Promise.all(KIRJASTOT.map(lataaSkripti));
    var f = await kehys(o, edistys);
    try { return await kirjoita(f, o, edistys); }
    finally { f.remove(); }
  }
  window.LuinPdf = { tee: tee, SIVU: SIVU };
})();
