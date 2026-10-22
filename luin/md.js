/*
  Luin: Markdownista lukimen HTML:ksi. Yhteinen luin.html:lle ja Latomolle (luin/latomo.html).

  Konventiot ovat käyttäjän aiempien md → html -muunnosten mukaiset (ks. luin/ohje.md,
  "Merkintäkieli"):
  - Ensimmäinen #-otsikko on teoksen nimi. Sen ja ensimmäisen ##-otsikon välissä pelkästä
    kursiivista koostuva kappale on alaotsikko (.sub), muut lyhytriviset kappaleet tietoriveja
    (.meta), joissa rivinvaihdot säilyvät. Pitkäriviset kappaleet (yli 100 merkkiä) ovat jo
    leipätekstiä (verkkoleikkeen johdanto).
  - Numeroitu otsikko (## 2. …, ### 2.1 …) saa tunnisteen luku-2 / luku-2-1. Numeroimaton
    ###-otsikko on versaali kursiivi (.caps), tunnisteena nimestä tehty lyhenne.
  - Alaviite on iA Writerin tapaan [^…] tekstin seassa tai [^tunnus] ja määritelmä [^tunnus]: …,
    tai Pandocin tapaan ^[…] (käyttäjän päätös 22.10.2026: iA Writerin konventio on ensisijainen,
    vanha kirjoitustapa toimii yhä). Numeroitu sivuhuomio (label.fnref + input.fntoggle + span.sidenote).
  - ## Kirjallisuus (tai Lähteet tms.) tekee seuraavista kappaleista riippuvasisennettyjä (.bib)
    seuraavaan ##-otsikkoon asti.
  - Jokainen tekstilohko (otsikko, kappale, lainauksen kappale, luettelon kohta, taulukon rivi) saa
    järjestysnumeron data-b. Kirjanmerkit ja alleviivaukset ankkuroidaan siihen. Lohkot eivät ole
    sisäkkäin: sisäkkäinen luettelo on kääreessä li.sisus, jolla ei ole numeroa.
  Muut iA Writerin merkinnät (Markdown Guide, ia.net): rivinvaihto kahdella välilyönnillä, kenoviivalla
  rivin lopussa tai <br>:llä, ~~yliviivaus~~, ==korostus==, x^2 ja ^…^, x~2 ja ~…~, tehtävälistat,
  taulukot, viitelinkit [teksti][tunnus], ristiviittaus otsikkoon [Otsikko][], sitaatit
  [paikannin][#avain], etukentän muuttujat [%avain], {{TOC}}, sivunvaihto +++, kommentit (// ja
  <!-- -->), sisennetty koodi ja setext-otsikot. Kuvat näkyvät linkkeinä, eivät kuvina: lukija ei
  hae mitään kolmannelta osapuolelta.
  Raakaa HTML:ää ei päästetä läpi: kaikki escapoidaan (paitsi <br>).
*/
(function (root) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function unesc(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  }
  // Viitteiden, alaviitteiden ja ristiviittausten tunnukset vertaillaan kirjainkoosta ja väleistä välittämättä.
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim().toLowerCase(); }

  // s[i] === '[' → vastaavan ']':n indeksi, tai -1.
  function closeBracket(s, i) {
    var d = 0;
    for (var k = i; k < s.length; k++) {
      var c = s[k];
      if (c === '\\') { k++; continue; }
      if (c === '[') d++;
      else if (c === ']') { d--; if (d === 0) return k; }
    }
    return -1;
  }
  // s[i] === '(' → vastaavan ')':n indeksi, tai -1 (osoitteen sulut: Wikipedian Foo_(bar)).
  function closeParen(s, i) {
    var d = 0;
    for (var k = i; k < s.length; k++) {
      var c = s[k];
      if (c === '\\') { k++; continue; }
      if (c === '(') d++;
      else if (c === ')') { d--; if (d === 0) return k; }
      else if (c === '\n' && s[k + 1] === '\n') return -1;
    }
    return -1;
  }

  // Kenoviiva suojaa kaikki ASCII-välimerkit (CommonMark; MarkDownload suojaa oletuksena).
  var SUOJATTAVA = /[!-\/:-@\[-`{-~]/;

  // Korostuksen loppumerkki: n kappaletta merkkiä c, ei välilyönnin perässä.
  // Alaviitteet ja koodi ohitetaan, jottei niiden sisällä oleva * sulje ulompaa korostusta.
  function findClose(s, from, c, n) {
    for (var k = from; k < s.length; k++) {
      var ch = s[k];
      if (ch === '\\') { k++; continue; }
      if (ch === '`') { var e = s.indexOf('`', k + 1); if (e > 0) { k = e; continue; } }
      if ((ch === '^' && s[k + 1] === '[') || (ch === '[' && s[k + 1] === '^')) {
        var f = closeBracket(s, ch === '[' ? k : k + 1); if (f > 0) { k = f; continue; }
      }
      if (ch !== c) continue;
      var run = 1;
      while (s[k + run] === c) run++;
      if (k > from && !/\s/.test(s[k - 1])) {
        var after = s[k + run] || ' ';
        if (c === '_' && /[0-9A-Za-zÀ-ÿ]/.test(after)) { k += run - 1; continue; }
        if (run === n) return k;
        if (n === 1 && run === 3) return k + 2;
      }
      k += run - 1;
    }
    return -1;
  }

  // ^yläindeksi^ ja ~alaindeksi~ (iA Writer): sulkeva merkki ennen välilyöntiä, tai lyhyt muoto
  // sanan perässä (100m^2, x~z). → { t, loppu } tai null.
  function ylaAla(s, i, ch) {
    var k = i + 1;
    while (k < s.length && s[k] !== ch && !/\s/.test(s[k])) { if (s[k] === '\\') k++; k++; }
    if (k > i + 1 && s[k] === ch) return { t: s.slice(i + 1, k), loppu: k + 1 };
    var ed = s[i - 1];
    if (!ed || /[\s\/(\[]/.test(ed)) return null;
    var m = /^[\p{L}\p{N}]+/u.exec(s.slice(i + 1));
    return m ? { t: m[0], loppu: i + 1 + m[0].length } : null;
  }

  // Sitaatin [paikannin][#avain] alaviite: määritelmä ja paikannin ("Nimi. Teos. 2006, s. 23.").
  function sitaatti(def, loc) {
    var d = def.trim().replace(/[.\s]+$/, ''); loc = plain(loc).trim();
    return d + (loc ? ', ' + loc : '') + '.';
  }

  var XREF = '\u0001';   // ristiviittauksen paikka, ratkaistaan renderöinnin lopussa

  // Rivinsisäinen merkintä. ctx: { note(body) → html | null, br: rivinvaihto <br>:ksi, warn(msg), cite(teksti),
  // refs: { fn, link, cite, meta } (parse() täyttää), linkissa: linkin tekstissä ei linkkejä eikä alaviitteitä }
  function inline(s, ctx) {
    var out = '', buf = '', i = 0, refs = ctx.refs || {};
    function flush() { out += ctx.cite ? ctx.cite(buf) : esc(buf); buf = ''; }
    function linkinTeksti(t) { return inline(t, { note: null, br: false, warn: ctx.warn, refs: refs, linkissa: true }); }
    function linkki(href, teksti) { flush(); out += '<a href="' + esc(href) + '">' + linkinTeksti(teksti) + '</a>'; }
    while (i < s.length) {
      var c = s[i];
      if (c === '\\') {
        // Kenoviiva rivin lopussa on rivinvaihto, myös välilyöntien kanssa; tekstin lopussa se jätetään pois.
        var bm = /^\\[ \t]*(\n|$)/.exec(s.slice(i, i + 64));
        if (bm) { if (bm[1]) { buf = buf.replace(/ +$/, ''); flush(); out += '<br>'; } i += bm[0].length; continue; }
        if (i + 1 < s.length && SUOJATTAVA.test(s[i + 1])) { buf += s[i + 1]; i += 2; continue; }
      }
      if (c === '\n') {
        if (ctx.br || / {2,}$/.test(buf)) { buf = buf.replace(/ +$/, ''); flush(); out += '<br>'; }
        else buf += ' ';
        i++; continue;
      }
      if (c === '^' && s[i + 1] === '[') {
        var e = closeBracket(s, i + 1);
        if (e < 0) {
          if (ctx.warn) ctx.warn('Alaviitteen ^[ sulkeva ] puuttuu: “' + s.slice(i, i + 40) + '…”');
        } else if (ctx.note) {
          var body = s.slice(i + 2, e);
          if (!body.trim() && ctx.warn) ctx.warn('Tyhjä alaviite ^[].');
          flush(); out += ctx.note(body); i = e + 1; continue;
        } else { i = e + 1; continue; }
      }
      if (c === '^') {
        var yl = ylaAla(s, i, '^');
        if (yl) { flush(); out += '<sup>' + inline(yl.t, ctx) + '</sup>'; i = yl.loppu; continue; }
      }
      if (c === '`') {
        var ce = s.indexOf('`', i + 1);
        if (ce > i) { flush(); out += '<code>' + esc(s.slice(i + 1, ce)) + '</code>'; i = ce + 1; continue; }
      }
      // Kuva: linkkinä (verkko-osoite) tai merkintänä. Lukija ei hae kuvia.
      if (c === '!' && s[i + 1] === '[') {
        var ie = closeBracket(s, i + 1), src = null, kl = -1;
        if (ie > 0 && s[ie + 1] === '(') {
          var kp = closeParen(s, ie + 1);
          if (kp > 0) { src = s.slice(ie + 2, kp).trim().split(/\s+/)[0].replace(/^<|>$/g, ''); kl = kp + 1; }
        } else if (ie > 0 && s[ie + 1] === '[') {
          var kr = closeBracket(s, ie + 1), kd = kr > 0 && refs.link && refs.link[norm(s.slice(ie + 2, kr) || s.slice(i + 2, ie))];
          if (kd) { src = kd.href; kl = kr + 1; }
        }
        if (kl > 0) {
          var alt = plain(s.slice(i + 2, ie)).trim(), nimi = '[' + (alt ? 'kuva: ' + alt : 'kuva') + ']';
          flush();
          out += /^https?:\/\//i.test(src) && !ctx.linkissa ? '<a class="kuva" href="' + esc(src) + '">' + esc(nimi) + '</a>' : '<span class="kuva">' + esc(nimi) + '</span>';
          refs.kuvia = (refs.kuvia || 0) + 1;
          i = kl; continue;
        }
      }
      if (c === '[') {
        // iA Writerin alaviite: [^tunnus] (määritelmä erikseen) tai [^teksti] tekstin seassa.
        if (s[i + 1] === '^') {
          var fe = closeBracket(s, i);
          if (fe > 0) {
            var lab = s.slice(i + 2, fe);
            if (!ctx.note) { i = fe + 1; continue; }
            var def = refs.fn && refs.fn[norm(lab)];
            if (def) def.kaytetty = true;
            else if (!lab.trim()) { if (ctx.warn) ctx.warn('Tyhjä alaviite [^].'); }
            else if (/^(\d+|[A-Za-z]{1,4}\d+|fn[\w-]*)$/.test(lab.trim()) && ctx.warn) {
              ctx.warn('Alaviitteelle [^' + lab + '] ei löydy määritelmää [^' + lab + ']: …, joten alaviitteen tekstinä näkyy ”' + lab + '”.');
            }
            flush(); out += ctx.note(def ? def.text : lab); i = fe + 1; continue;
          }
        }
        // Etukentän muuttuja [%avain] (iA Writer).
        if (s[i + 1] === '%') {
          var ve = closeBracket(s, i);
          if (ve > 0) {
            var arvo = refs.meta && refs.meta[norm(s.slice(i + 2, ve))];
            if (arvo != null && arvo !== '') { buf += arvo; i = ve + 1; continue; }
            if (ctx.warn && refs.meta) ctx.warn('Etukentässä ei ole avainta ”' + s.slice(i + 2, ve) + '”, joten ' + s.slice(i, ve + 1) + ' näkyy tekstinä.');
          }
        }
        var be = closeBracket(s, i);
        if (be > 0) {
          var teksti = s.slice(i + 1, be);
          if (s[be + 1] === '(' && !ctx.linkissa) {
            var pe = closeParen(s, be + 1);
            var href = pe > 0 ? s.slice(be + 2, pe).trim().split(/\s+/)[0].replace(/^<|>$/g, '') : '';
            if (href && !/^(javascript|data|vbscript):/i.test(href)) { linkki(href, teksti); i = pe + 1; continue; }
          }
          if (s[be + 1] === '[') {
            var le = closeBracket(s, be + 1);
            if (le > 0) {
              var lab2 = s.slice(be + 2, le);
              if (lab2.charAt(0) === '#') {
                // Sitaatti [paikannin][#avain] → alaviite, jossa määritelmä ja paikannin.
                var cd = refs.cite && refs.cite[norm(lab2.slice(1))];
                if (!ctx.note) { i = le + 1; continue; }
                if (cd) { cd.kaytetty = true; flush(); out += ctx.note(sitaatti(cd.text, teksti)); i = le + 1; continue; }
                if (ctx.warn && refs.cite) ctx.warn('Sitaatille [' + lab2 + '] ei löydy määritelmää [' + lab2 + ']: …');
              } else if (!ctx.linkissa) {
                var avain = norm(lab2 || teksti), ld = refs.link && refs.link[avain];
                if (ld) { ld.kaytetty = true; linkki(ld.href, teksti); i = le + 1; continue; }
                // Ristiviittaus otsikkoon: [Otsikko][] tai [teksti][Otsikko tai nimiö]; ratkaistaan lopuksi.
                if (refs.xref) { flush(); out += '<a href="#' + XREF + esc(avain) + XREF + refs.xref() + '">' + linkinTeksti(teksti) + '</a>'; i = le + 1; continue; }
              }
            }
          }
          if (!ctx.linkissa && refs.link && refs.link[norm(teksti)] && s[be + 1] !== '(') {
            refs.link[norm(teksti)].kaytetty = true;
            linkki(refs.link[norm(teksti)].href, teksti); i = be + 1; continue;
          }
        }
      }
      if (c === '<') {
        var brm = /^<br\s*\/?>/i.exec(s.slice(i, i + 8));
        if (brm) { buf = buf.replace(/ +$/, ''); flush(); out += '<br>'; i += brm[0].length; continue; }
        var am = /^<(https?:\/\/[^\s>]+)>/.exec(s.slice(i));
        if (am) { flush(); out += '<a href="' + esc(am[1]) + '">' + esc(am[1]) + '</a>'; i += am[0].length; continue; }
        if (/^<\/?[a-zA-Z][^>]*>/.test(s.slice(i)) && ctx.warn) ctx.warn('HTML-merkintä näkyy tekstinä: “' + s.slice(i, i + 30) + '”');
      }
      // Paljas verkko-osoite linkiksi. Loppuvälimerkit eivät kuulu osoitteeseen, sulku kuuluu, jos sille on pari.
      if ((c === 'h' || c === 'H') && !ctx.linkissa && /^https?:\/\/[\p{L}\p{N}-]+\./iu.test(s.slice(i, i + 80)) && !/[\p{L}\p{N}\/]/u.test(s[i - 1] || ' ')) {
        var u = /^https?:\/\/[^\s<>"]+/i.exec(s.slice(i))[0];
        while (/[.,;:!?'"”’»…\]*_]$/.test(u) || (/\)$/.test(u) && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length)) u = u.slice(0, -1);
        var uu = u.replace(/\\([!-\/:-@\[-`{-~])/g, '$1');
        flush(); out += '<a class="url" href="' + esc(uu) + '">' + esc(uu) + '</a>'; i += u.length; continue;
      }
      // ~~yliviivaus~~ ja ==korostus== (myös kolmella merkillä).
      if ((c === '~' || c === '=') && s[i + 1] === c) {
        var r2 = 2;
        while (s[i + r2] === c) r2++;
        if (r2 <= 3 && s[i + r2] && !/\s/.test(s[i + r2])) {
          var ke = findClose(s, i + r2, c, r2);
          if (ke > 0) {
            var sis = inline(s.slice(i + r2, ke), ctx);
            flush(); out += c === '~' ? '<del>' + sis + '</del>' : '<span class="korostus">' + sis + '</span>';
            i = ke + r2; continue;
          }
        }
        buf += s.slice(i, i + r2); i += r2; continue;
      }
      if (c === '~') {
        var al = ylaAla(s, i, '~');
        if (al) { flush(); out += '<sub>' + inline(al.t, ctx) + '</sub>'; i = al.loppu; continue; }
      }
      if (c === '*' || c === '_') {
        var run = 1;
        while (s[i + run] === c) run++;
        var prev = i > 0 ? s[i - 1] : ' ';
        var next = s[i + run] || ' ';
        var canOpen = !/\s/.test(next) && (c === '*' || !/[0-9A-Za-zÀ-ÿ]/.test(prev));
        if (canOpen && run <= 3) {
          var ee = findClose(s, i + run, c, run);
          if (ee > 0) {
            var inner = inline(s.slice(i + run, ee), ctx);
            flush();
            out += run === 1 ? '<em>' + inner + '</em>'
              : run === 2 ? '<strong>' + inner + '</strong>'
              : '<strong><em>' + inner + '</em></strong>';
            i = ee + run; continue;
          }
        }
        buf += s.slice(i, i + run); i += run; continue;
      }
      buf += c; i++;
    }
    flush();
    return out;
  }

  // Merkinnätön teksti (sisällysluettelo, lähdeviite). Alaviitteet jäävät pois.
  function plain(s) {
    return unesc(inline(String(s), { note: null, br: false }).replace(/<br>/g, ' ').replace(/<[^>]+>/g, ''));
  }

  function slug(s) {
    return s.toLowerCase().replace(/[äå]/g, 'a').replace(/ö/g, 'o').replace(/[éè]/g, 'e').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'osio';
  }

  var BIB = /^(kirjallisuus|kirjallisuusluettelo|lähteet|lähdeluettelo|lähteet ja kirjallisuus|bibliografia|references|bibliography|works cited)$/i;

  /* ---------- Esikäsittely ----------
     Ennen lohkojäsennystä: kommentit pois (<!-- … --> myös monirivisenä ja iA Writerin //-rivit),
     alaviitteiden ([^tunnus]: …), sitaattien ([#avain]: …) ja viitelinkkien ([tunnus]: osoite)
     määritelmät talteen ja pois tekstistä, rivin alun sarkaimet neljäksi välilyönniksi. Koodiaitojen
     sisältö jätetään rauhaan. Poistetut rivit poistuvat kokonaan, joten rivinumerot kulkevat omana
     taulukkonaan N. */
  var RE_AITA = /^ {0,3}(`{3,}|~{3,})/, RE_AITA_LOPPU = /^ {0,3}(`{3,}|~{3,}) *$/;
  // <!--:n paikka rivillä koodin (`…`) ulkopuolella, tai -1.
  function kommentinAlku(l) {
    for (var k = 0; k < l.length; k++) {
      if (l[k] === '\\') { k++; continue; }
      if (l[k] === '`') { var e = l.indexOf('`', k + 1); if (e > 0) { k = e; continue; } }
      if (l.substr(k, 4) === '<!--') return k;
    }
    return -1;
  }
  function valmistele(body, base) {
    var raw = body.split('\n'), L = [], N = [], fn = {}, link = {}, cite = {}, W = [], aita = null, kommentti = false;
    for (var i = 0; i < raw.length; i++) {
      var l = raw[i].replace(/^[ \t]+/, function (m) { return m.replace(/\t/g, '    '); }), ln = base + i;
      if (aita) {
        L.push(l); N.push(ln);
        var am = RE_AITA_LOPPU.exec(l);
        if (am && am[1][0] === aita.ch && am[1].length >= aita.n) aita = null;
        continue;
      }
      var alku = l;
      if (kommentti) {
        var ke = l.indexOf('-->');
        if (ke < 0) continue;
        l = l.slice(ke + 3); kommentti = false;
      }
      var ki;
      while ((ki = kommentinAlku(l)) >= 0) {
        var kl = l.indexOf('-->', ki + 4);
        if (kl < 0) { l = l.slice(0, ki); kommentti = true; break; }
        l = l.slice(0, ki) + l.slice(kl + 3);
      }
      if (l !== alku && !l.trim()) continue;
      if (/^ {0,3}\/\//.test(l)) continue;
      var fm = RE_AITA.exec(l);
      if (fm) { aita = { ch: fm[1][0], n: fm[1].length }; L.push(l); N.push(ln); continue; }
      var dm = /^ {0,3}\[\^([^\]]+)\]:[ \t]?(.*)$/.exec(l), cm = !dm && /^ {0,3}\[#([^\]]+)\]:[ \t]*(.*)$/.exec(l);
      if (dm || cm) {
        // Jatkorivit: suoraan perässä olevat (laiska jatko) ja tyhjän rivin jälkeen sisennetyt (uusi kappale).
        var osat = [(dm || cm)[2]], k = i + 1;
        while (k < raw.length) {
          var r = raw[k];
          if (!r.trim()) {
            var j = k + 1;
            while (j < raw.length && !raw[j].trim()) j++;
            if (j < raw.length && /^(?: {4}|\t)/.test(raw[j])) { osat.push(''); k = j; continue; }
            break;
          }
          if (/^ {0,3}\[[\^#][^\]]+\]:/.test(r) || (!/^[ \t]/.test(r) && /^ {0,3}(#{1,6}(\s|$)|>|[-*+]\s|\d{1,9}[.)]\s|```|~~~)/.test(r))) break;
          osat.push(r.trim()); k++;
        }
        var teksti = '';
        osat.forEach(function (o, x) { teksti += !x ? o : !o ? '\\\n' : (/\\\n$/.test(teksti) ? '' : '\n') + o; });
        var kohde = dm ? fn : cite, nimi = (dm || cm)[1], avain = norm(nimi);
        if (kohde[avain]) W.push({ ln: ln, msg: (dm ? 'Alaviite [^' : 'Sitaatti [#') + nimi + '] on määritelty kahdesti; jälkimmäinen ohitetaan.' });
        else kohde[avain] = { text: teksti.trim(), ln: ln, nimi: nimi };
        i = k - 1; continue;
      }
      var lm = /^ {0,3}\[([^\]^#%][^\]]*)\]:[ \t]*<?([^\s>]+)>?(?:[ \t]+(?:"[^"]*"|'[^']*'|\([^)]*\)))?[ \t]*$/.exec(l);
      if (lm) { var la = norm(lm[1]); if (!link[la]) link[la] = { href: lm[2], ln: ln, nimi: lm[1] }; continue; }
      L.push(l); N.push(ln);
    }
    return { L: L, N: N, fn: fn, link: link, cite: cite, W: W };
  }

  /* ---------- Lohkot ----------
     blocksOf(rivit, rivinumerot) → [{ t, ln, … }]. Tyypit: h, p, hr, bq (kids), pre, list (items:
     [{ lvl, ord, num, text, ln }]), table (rivit, tasaus), toc ({{TOC}}), sivu (+++), tyhja
     (pelkät korostusmerkit, MarkDownload-leikkeen jäänne). */
  var RE_H = /^ {0,3}#{1,6}(\s|$)/, RE_HR = /^ {0,3}([-*_])( *\1){2,} *$/, RE_BQ = /^ {0,3}>/,
    RE_OL = /^( *)(\d{1,9})([.)])(?:[ \t]+|$)/, RE_UL = /^( *)([-*+])(?:[ \t]+|$)/,
    RE_SETEXT = /^ {0,3}(=+|-{2,}) *$/, RE_TOC = /^ {0,3}\{\{TOC\}\} *$/i, RE_SIVU = /^ {0,3}\+{3} *$/,
    RE_EROTIN = /^ {0,3}\|? *:?-+:? *(\| *:?-+:? *)*\|? *$/;

  function merkki(l) {
    var m = RE_OL.exec(l);
    if (m) return { ind: m[1].length, ord: true, num: parseInt(m[2], 10), pit: m[0].length };
    m = RE_UL.exec(l);
    if (m && !RE_HR.test(l)) return { ind: m[1].length, ord: false, num: 1, pit: m[0].length };
    return null;
  }

  // Taulukon rivi soluiksi. | jakaa, paitsi \| ja koodin sisällä; tyhjä solu ilman välilyöntiä (||)
  // yhdistää edelliseen (iA Writer: "To merge cells add additional | at the end of the cell").
  function soluiksi(rivi) {
    var r = rivi.trim(), a = [], cur = '', koodi = false;
    if (r[0] === '|') r = r.slice(1);
    if (r.slice(-1) === '|' && r.slice(-2) !== '\\|') r = r.slice(0, -1);
    var raa = [];
    for (var k = 0; k < r.length; k++) {
      var c = r[k];
      if (c === '\\' && r[k + 1] === '|') { cur += '\\|'; k++; continue; }
      if (c === '`') koodi = !koodi;
      if (c === '|' && !koodi) { raa.push(cur); cur = ''; continue; }
      cur += c;
    }
    raa.push(cur);
    raa.forEach(function (x) { if (x === '' && a.length) a[a.length - 1].span++; else a.push({ text: x.trim(), span: 1 }); });
    return a;
  }

  function luettelo(L, N, i) {
    var items = [], pino = [], n = L.length;
    while (i < n) {
      var l = L[i], m = merkki(l);
      if (!l.trim()) {
        var k = i + 1;
        while (k < n && !L[k].trim()) k++;
        if (k >= n) break;
        if (merkki(L[k])) { i = k; continue; }
        // Tyhjän rivin jälkeen sisennetty rivi jatkaa kohtaa uutena kappaleena.
        if (items.length && /^ {2,}/.test(L[k])) { items[items.length - 1].text += '\\\n\\\n' + L[k].trim(); i = k + 1; continue; }
        break;
      }
      if (m) {
        var it = { ind: m.ind, ord: m.ord, num: m.num, text: l.slice(m.pit), ln: N[i], cind: m.ind + Math.max(m.pit - m.ind, 2) };
        // Taso sisennyksestä: kohta on edellisen alakohta, jos se alkaa vähintään edellisen tekstin kohdalta.
        while (pino.length && it.ind < pino[pino.length - 1]) pino.pop();
        it.lvl = pino.length; pino.push(it.cind);
        items.push(it); i++; continue;
      }
      if (RE_H.test(l) || RE_HR.test(l) || RE_BQ.test(l) || RE_AITA.test(l)) break;
      items[items.length - 1].text += '\n' + l.trim(); i++;
    }
    return { t: { t: 'list', ln: items[0].ln, items: items }, i: i };
  }

  function blocksOf(L, N) {
    var out = [], i = 0, n = L.length;
    while (i < n) {
      var l = L[i], ln = N[i];
      if (!l.trim()) { i++; continue; }
      // Sisennetty koodi (neljä välilyöntiä tai sarkain), paitsi luettelo, otsikko ja lainaus (iA Writer).
      if (/^ {4}/.test(l)) {
        var sis = l.replace(/^ +/, '');
        if (!merkki(l) && !RE_H.test(sis) && !RE_BQ.test(sis)) {
          var kood = [];
          while (i < n && (/^ {4}/.test(L[i]) || !L[i].trim())) kood.push(L[i++].slice(4));
          while (kood.length && !kood[kood.length - 1].trim()) kood.pop();
          out.push({ t: 'pre', ln: ln, text: kood.join('\n'), sis: true }); continue;
        }
        if (!merkki(l)) L[i] = l = sis;
      }
      var am = RE_AITA.exec(l);
      if (am) {
        var ch = am[1][0], pit = am[1].length, body = [];
        i++;
        while (i < n) {
          var cm = RE_AITA_LOPPU.exec(L[i]);
          if (cm && cm[1][0] === ch && cm[1].length >= pit) break;
          body.push(L[i++]);
        }
        i++;
        out.push({ t: 'pre', ln: ln, text: body.join('\n') }); continue;
      }
      if (RE_TOC.test(l)) { out.push({ t: 'toc', ln: ln }); i++; continue; }
      if (RE_SIVU.test(l)) { out.push({ t: 'sivu', ln: ln }); i++; continue; }
      if (RE_H.test(l)) {
        var hm = /^ {0,3}(#{1,6})\s*(.*?)\s*#*\s*$/.exec(l);
        out.push({ t: 'h', ln: ln, lvl: hm[1].length, text: hm[2] }); i++; continue;
      }
      if (RE_HR.test(l)) { out.push({ t: 'hr', ln: ln }); i++; continue; }
      if (RE_BQ.test(l)) {
        var q = [], qn = [];
        while (i < n && L[i].trim() && RE_BQ.test(L[i])) { q.push(L[i].replace(/^ {0,3}> ?/, '')); qn.push(N[i]); i++; }
        out.push({ t: 'bq', ln: ln, kids: blocksOf(q, qn) }); continue;
      }
      if (l.indexOf('|') >= 0 && i + 1 < n && L[i + 1].indexOf('|') >= 0 && RE_EROTIN.test(L[i + 1])) {
        var tasaus = soluiksi(L[i + 1]).map(function (c) {
          return /^:-+:$/.test(c.text) ? 'center' : /-:$/.test(c.text) ? 'right' : /^:-/.test(c.text) ? 'left' : '';
        });
        var rivit = [{ ln: ln, solut: soluiksi(l) }];
        i += 2;
        while (i < n && L[i].trim() && L[i].indexOf('|') >= 0 && !RE_H.test(L[i]) && !RE_BQ.test(L[i])) { rivit.push({ ln: N[i], solut: soluiksi(L[i]) }); i++; }
        out.push({ t: 'table', ln: ln, tasaus: tasaus, rivit: rivit }); continue;
      }
      if (merkki(l)) { var lt = luettelo(L, N, i); out.push(lt.t); i = lt.i; continue; }
      var p = [l.replace(/^\s+/, '')], otsikoksi = 0;
      i++;
      while (i < n && L[i].trim()) {
        var nx = L[i];
        // Setext-otsikko: kappaleen alla rivi pelkkiä =- tai --merkkejä.
        var sm = RE_SETEXT.exec(nx);
        if (sm) { otsikoksi = sm[1][0] === '=' ? 1 : 2; i++; break; }
        if (RE_H.test(nx) || RE_HR.test(nx) || RE_BQ.test(nx) || RE_AITA.test(nx) || RE_TOC.test(nx)) break;
        // Luettelo voi alkaa suoraan kappaleen perästä (CommonMark): luetelmaviiva tai numero 1.
        var mk = merkki(nx);
        if (mk && mk.ind <= 3 && (!mk.ord || mk.num === 1) && nx.slice(mk.pit).trim()) break;
        p.push(nx.replace(/^\s+/, '')); i++;
      }
      var pt = p.join('\n');
      if (otsikoksi) out.push({ t: 'h', ln: ln, lvl: otsikoksi, text: pt.replace(/\s*\n\s*/g, ' ').trim() });
      else if (/^(\*\*|__)$/.test(pt.trim())) out.push({ t: 'tyhja', ln: ln, text: pt.trim() });
      else out.push({ t: 'p', ln: ln, text: pt });
    }
    return out;
  }

  /* ---------- Etukenttä ----------
     --- avain: arvo --- tiedoston alussa (iA Writerin metadata, YAML-etukenttä). Avaimet pienaakkosin
     ja yhtenäistettyinä (ALIAS): MarkDownloadin oletuspohjan source, author ja created ovat lähde, tekijä
     ja haettu. Sisennetyt jatkorivit (YAML-luettelo) liitetään edelliseen arvoon. Täyttämättä jääneet
     pohjan muuttujat ({byline}) ohitetaan.
     → { meta: yhtenäistetyt avaimet, raaka: alkuperäiset avaimet pienaakkosin, body, ln: rungon ensimmäisen rivin numero } */
  var ALIAS = {
    title: 'otsikko', subtitle: 'alaotsikko', author: 'tekijä', authors: 'tekijä', byline: 'tekijä', tekija: 'tekijä',
    'tekijät': 'tekijä', tekijat: 'tekijä', kirjoittaja: 'tekijä', kirjoittajat: 'tekijä',
    source: 'lähde', url: 'lähde', lahde: 'lähde', link: 'lähde', 'verkko-osoite': 'lähde',
    created: 'haettu', clipped: 'haettu', saved: 'haettu', tallennettu: 'haettu', luettu: 'haettu', retrieved: 'haettu', accessed: 'haettu',
    date: 'julkaistu', published: 'julkaistu', 'published_time': 'julkaistu', julkaisupvm: 'julkaistu', 'julkaisupäivä': 'julkaistu',
    site: 'sivusto', sitename: 'sivusto', 'site_name': 'sivusto', 'site-name': 'sivusto', blog: 'sivusto', blogi: 'sivusto',
    type: 'tyyppi', tekstityyppi: 'tyyppi', genre: 'laji', artikkelityyppi: 'laji',
    yhteiso: 'yhteisö', yliopisto: 'yhteisö', university: 'yhteisö', institution: 'yhteisö',
    publisher: 'kustantaja', city: 'paikka', place: 'paikka', kaupunki: 'paikka', kustannuspaikka: 'paikka',
    editor: 'toimittaja', editors: 'toimittaja', toimittajat: 'toimittaja',
    translator: 'suomentaja', 'kääntäjä': 'suomentaja', kaantaja: 'suomentaja',
    pages: 'sivut', series: 'sarja', edition: 'painos', journal: 'teos', container: 'teos', lehti: 'teos', volume: 'numero', issue: 'numero'
  };
  function avain(a) { a = String(a || '').trim().toLowerCase(); return ALIAS[a] || a; }
  function etukentta(src) {
    src = String(src || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var lines = src.split('\n'), meta = {}, raaka = {};
    if (/^---\s*$/.test(lines[0])) {
      var end = -1;
      for (var k = 1; k < Math.min(lines.length, 80); k++) if (/^(---|\.\.\.)\s*$/.test(lines[k])) { end = k; break; }
      var fm = end > 0 ? lines.slice(1, end) : [];
      if (end > 0 && fm.every(function (l, j) { return !l.trim() || /^[\p{L}\p{N}_-]+\s*:/u.test(l) || (j > 0 && /^\s/.test(l)); })) {
        var ed = null;
        fm.forEach(function (l) {
          var m = /^([^:\s][^:]*):\s*(.*)$/.exec(l);
          if (m && !/^\s/.test(l)) {
            ed = m[1].trim().toLowerCase();
            raaka[ed] = m[2].trim().replace(/^(["'])(.*)\1$/, '$2');
          } else if (ed && l.trim()) {
            var v = l.trim().replace(/^-\s+/, '').replace(/^(["'])(.*)\1$/, '$2');
            raaka[ed] = raaka[ed] ? raaka[ed] + ', ' + v : v;
          }
        });
        Object.keys(raaka).forEach(function (a) {
          var v = raaka[a];
          if (/^\{[^}]*\}$/.test(v)) v = raaka[a] = '';
          var y = ALIAS[a] || a;
          if (v && (meta[y] == null || meta[y] === '' || !ALIAS[a])) meta[y] = v;
          else if (meta[y] == null) meta[y] = v;
        });
        return { meta: meta, raaka: raaka, body: lines.slice(end + 1).join('\n'), ln: end + 2 };
      }
    }
    return { meta: meta, raaka: raaka, body: src, ln: 1 };
  }

  /* ---------- Päivämäärät ----------
     pvm(teksti) → { y, m, d, h, mi, t } tai null; t on tarkkuus: 1 vuosi, 2 kuukausi, 3 päivä, 4 minuutti.
     Kelpaavat ISO (2026-10-08T14:05), 8.10.2026 (klo 14.05), 8. lokakuuta 2026, lokakuussa 2026,
     lokakuu/2026, 10/2026, englanninkieliset kuukaudet ja pelkkä vuosi. Etukenttään tallennetaan ISO
     siihen tarkkuuteen, joka halutaan ilmoittaa (2026-10 = kuukausi). */
  var KK = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'];
  var KK_EN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var RE_KK = new RegExp('(' + KK.join('|') + ')kuu(?:ssa|ta|n|lla|lle)?', 'i');
  var RE_EN = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';
  function pvmOlio(y, m, d, h, mi) {
    if (!(y >= 1000 && y <= 2999)) return null;
    if (m != null && !(m >= 1 && m <= 12)) m = d = h = null;
    if (d != null && !(d >= 1 && d <= 31)) d = h = null;
    if (h != null && !(h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) h = null;
    var t = h != null ? 4 : d ? 3 : m ? 2 : 1;
    return { y: y, m: m || null, d: t >= 3 ? d : null, h: t === 4 ? h : null, mi: t === 4 ? mi : null, t: t };
  }
  function pvm(s) {
    s = String(s || '').trim();
    if (!s) return null;
    var m, kk;
    if ((m = /(\d{4})-(\d{1,2})(?:-(\d{1,2})(?:[T ](\d{1,2})[:.](\d{2}))?)?/.exec(s))) return pvmOlio(+m[1], +m[2], m[3] && +m[3], m[4] != null ? +m[4] : null, m[5] != null ? +m[5] : null);
    if ((m = /(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4})(?:,?\s*(?:klo\s*)?(\d{1,2})[:.](\d{2}))?/.exec(s))) return pvmOlio(+m[3], +m[2], +m[1], m[4] != null ? +m[4] : null, m[5] != null ? +m[5] : null);
    if ((m = new RegExp('(\\d{1,2})\\.\\s*' + RE_KK.source + '\\s+(\\d{4})', 'i').exec(s))) return pvmOlio(+m[3], KK.indexOf(m[2].toLowerCase()) + 1, +m[1]);
    if ((m = new RegExp('\\b(\\d{1,2})\\s+' + RE_EN + ',?\\s+(\\d{4})', 'i').exec(s))) return pvmOlio(+m[3], KK_EN.indexOf(m[2].slice(0, 3).toLowerCase()) + 1, +m[1]);
    if ((m = new RegExp('\\b' + RE_EN + '\\s+(\\d{1,2}),?\\s+(\\d{4})', 'i').exec(s))) return pvmOlio(+m[3], KK_EN.indexOf(m[1].slice(0, 3).toLowerCase()) + 1, +m[2]);
    if ((m = RE_KK.exec(s)) && (kk = /\b(1[5-9]\d\d|2\d\d\d)\b/.exec(s.slice(m.index)))) return pvmOlio(+kk[1], KK.indexOf(m[1].toLowerCase()) + 1);
    if ((m = new RegExp('\\b' + RE_EN + '\\s+(\\d{4})\\b', 'i').exec(s))) return pvmOlio(+m[2], KK_EN.indexOf(m[1].slice(0, 3).toLowerCase()) + 1);
    if ((m = /\b(\d{1,2})\s*[\/.]\s*(\d{4})\b/.exec(s))) return pvmOlio(+m[2], +m[1]);
    if ((m = /\b(1[5-9]\d\d|2\d\d\d)\b/.exec(s))) return pvmOlio(+m[1]);
    return null;
  }
  function kaksi(n) { return (n < 10 ? '0' : '') + n; }
  // tapa: 'viite' (lokakuu/2026, Teologian tyyli), 'meta' (lokakuu 2026), 'kentta' (10/2026). t rajaa tarkkuutta.
  function pvmMuoto(p, tapa, t) {
    if (!p) return '';
    t = Math.min(p.t, t || 4);
    if (t === 1) return String(p.y);
    if (t === 2) return tapa === 'kentta' ? p.m + '/' + p.y : KK[p.m - 1] + 'kuu' + (tapa === 'viite' ? '/' : ' ') + p.y;
    var d = p.d + '.' + p.m + '.' + p.y;
    return t === 3 ? d : d + (tapa === 'kentta' ? ' ' : ' klo ') + p.h + '.' + kaksi(p.mi);
  }
  function pvmIso(p, t) {
    if (!p) return '';
    t = Math.min(p.t, t || 4);
    // Kellonaika välilyönnillä ja pisteellä (2026-10-08 14.05): T-muotoinen aikaleima on koneen (MarkDownload), ja
    // Latomo ilmoittaa sen oletuksena vain kuukauden tarkkuudella.
    return p.y + (t >= 2 ? '-' + kaksi(p.m) : '') + (t >= 3 ? '-' + kaksi(p.d) : '') + (t >= 4 ? ' ' + kaksi(p.h) + '.' + kaksi(p.mi) : '');
  }

  /* ---------- Tekijät ----------
     Nimet erotetaan puolipisteellä, &-merkillä tai sanalla ja/and; pilkku erottaa nimiä, ellei sen edellä
     ole yksi sana (Juutilainen, Olli). Etunimi Sukunimi -muodossa sukunimi on viimeinen sana (ja sitä
     edeltävät von, van, de …). Nimi, jossa on pienellä alkavia sanoja, on yhteisö ja jää sellaiseksi.
     Teologian tyyli: ensimmäinen käänteisenä, muut luonnollisessa järjestyksessä, viimeisen edellä &. */
  var PARTIKKELI = /^(von|van|der|den|de|da|di|du|la|le|af|al|el|ten|ter|zu|dos|das|del)$/i;
  function nimet(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (!s) return [];
    var out = [];
    s.split(/\s*(?:;|&|\s+ja\s+|\s+and\s+|\s+och\s+|\s+und\s+)\s*/i).forEach(function (o) {
      if (!o) return;
      var pk = o.split(/\s*,\s*/).filter(Boolean);
      if (pk.length > 1 && !/\s/.test(pk[0].replace(/^(\S+\s+)?(von|van|de|af|der)\s+/i, ''))) {
        out.push({ suku: pk[0], etu: pk[1] });
        pk = pk.slice(2);
      }
      pk.forEach(function (x) {
        var w = x.split(' ');
        if (w.length < 2 || w.length > 5 || w.some(function (y) { return /^\p{Ll}/u.test(y) && !PARTIKKELI.test(y); })) { out.push({ koko: x }); return; }
        var j = w.length - 1;
        while (j > 1 && PARTIKKELI.test(w[j - 1])) j--;
        out.push({ suku: w.slice(j).join(' '), etu: w.slice(0, j).join(' ') });
      });
    });
    return out;
  }
  function luettelona(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1]; }
  function tekijat(s, luonnollinen) {
    return luettelona(nimet(s).map(function (n, i) {
      if (n.koko) return n.koko;
      return i || luonnollinen ? n.etu + ' ' + n.suku : n.suku + ', ' + n.etu;
    }));
  }

  /* ---------- Lähdeviite ----------
     Teologian tyylin (HY:n teologinen tiedekunta, 2021) mukaan, malleina käyttäjän tutkielman
     kirjallisuusluettelo ja tyylin esimerkit:
       Tekijä, Etu & Etu Toinen (vuosi). *Teos: alaotsikko*. Suomentanut X. 2. painos. Sarja 3. Laji.
         Yhteisö. Paikka: Kustantaja.
       Tekijä (vuosi). Artikkeli. *Teos tai lehti* 8:1. Toim. Y. Paikka: Kustantaja, 63–86.
       Tekijä (vuosi). Kirjoitus? *Blogi* huhtikuu/2017. https://… (luettu 23.10.2017).
     Itsenäinen teos on kursiivilla, osa (artikkeli, blogikirjoitus) ei. Ilman tekijää nimi aloittaa.
     Tyyppi valittuna puuttuva vuosi on s.a.; määrittelemättömästä se jää pois (vanha arvaaViite).
     Lukijan jakovalikko voi lisätä perään HTML-version tiedot, mutta vain ehdotuksena (käyttäjän
     päätös 22.10.2026: ei pakotettua "luettu HTML-versiona" -lisäystä). */
  var KENTAT = ['tyyppi', 'tekijä', 'julkaistu', 'otsikko', 'alaotsikko', 'suomentaja', 'teos', 'numero', 'toimittaja',
    'painos', 'sarja', 'laji', 'yhteisö', 'paikka', 'kustantaja', 'sivut', 'sivusto', 'doi', 'lähde', 'haettu'];
  function tyyppiAvain(s) {
    s = String(s || '').trim().toLowerCase();
    if (/^(tiet|art|sci|aka|acad|thes|opinn|tutk|paper)/.test(s)) return 'tieteellinen';
    if (/^(blog|verkko|web|sivu|site|uuti|news|lehti)/.test(s)) return 'blogi';
    if (/^(kauno|fikt|fict|run|novel|lit|proosa|poe)/.test(s)) return 'kaunokirjallinen';
    return '';
  }
  function piste(s) { s = s.trim(); return !s || /[.!?]\*?$/.test(s) ? s : s + '.'; }
  // Versaalein kirjoitettu nimi virkekirjoitukseksi (hävittää erisnimien isot kirjaimet, siksi viite on muokattava).
  function virkkeeksi(t) { return t && t === t.toUpperCase() && /\p{Lu}/u.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t; }
  // Alaotsikko kaksoispisteen jälkeen pienellä, jos se on kirjoitettu virkekirjoituksella (suomen tapa,
  // muulajisten arvokkuutta etsimässä); englannin otsikkokirjoitus (Our Obligations to …) säilyy.
  function nimiOsa(ots, ala) {
    ots = virkkeeksi(String(ots || '').trim()); ala = virkkeeksi(String(ala || '').trim());
    if (!ala) return ots;
    var w = ala.split(/\s+/), muut = w.slice(1).filter(function (x) { return /^\p{L}/u.test(x) && x.length > 3; });
    var virke = muut.length ? muut.every(function (x) { return /^\p{Ll}/u.test(x); }) : /[äöåÄÖÅ]/.test(ots + ala);
    // Kysymys- tai huutomerkin jälkeen alaotsikko on uusi virke (Miksi …? Kantilainen näkökulma …).
    if (virke && !/[?!.]$/.test(ots)) ala = ala.charAt(0).toLowerCase() + ala.slice(1);
    return ots ? ots + (/[?!:.]$/.test(ots) ? ' ' : ': ') + ala : ala;
  }
  function kaantajat(s) {
    s = s.trim();
    if (/^(suomen|kääntän|kaannt|toim|transl|sov)/i.test(s)) return s;
    return (/\s(ja|&)\s|,/.test(s) ? 'Suomentaneet ' : 'Suomentanut ') + s;
  }
  function kokoaViite(t) {
    t = t || {};
    var ty = tyyppiAvain(t.tyyppi), v = (pvm(t.julkaistu) || {}).y || '', tek = tekijat(t['tekijä']);
    var nimi = nimiOsa(t.otsikko, t.alaotsikko);
    if (!nimi && !tek) return '';
    var osa = !!(t.teos || t.sivusto || ty === 'blogi'), vuosi = v ? '(' + v + ')' : ty ? '(s.a.)' : '';
    var jp = pvm(t.julkaistu), pvmTeksti = ty === 'blogi' && jp && jp.t > 1 ? pvmMuoto(jp, 'viite') : '';
    if (nimi && !osa) nimi = '*' + nimi + '*';
    // Ilman sivuston nimeä blogin päiväys on nimen perässä sulkeissa (Teologian tyyli, verkkosivut).
    if (nimi && pvmTeksti && !t.sivusto) { nimi += ' (' + pvmTeksti + ')'; pvmTeksti = ''; }
    var s = [];
    if (tek) { s.push(tek + (vuosi ? ' ' + vuosi : '')); if (nimi) s.push(nimi); }
    else s.push(nimi + (vuosi ? ' ' + vuosi : ''));
    if (t.suomentaja) s.push(kaantajat(t.suomentaja));
    var k = [];
    if (t.teos) {
      k.push('*' + t.teos.trim() + '*' + (t.numero ? ' ' + t.numero.trim() : ''));
      if (t.toimittaja) k.push('Toim. ' + tekijat(t.toimittaja, true));
    }
    if (t.painos) k.push(/^\d+\.?$/.test(t.painos.trim()) ? t.painos.trim().replace(/\.?$/, '. painos') : t.painos.trim());
    if (t.sarja) k.push(t.sarja.trim());
    if (t.laji) { var la = t.laji.trim(); k.push(la.charAt(0).toUpperCase() + la.slice(1)); }
    if (t['yhteisö']) k.push(t['yhteisö'].trim());
    var pk = [t.paikka, t.kustantaja].map(function (x) { return String(x || '').trim(); }).filter(Boolean).join(': ');
    if (pk) k.push(pk);
    if (t.sivusto) k.push('*' + t.sivusto.trim() + '*' + (pvmTeksti ? ' ' + pvmTeksti : ''));
    else if (pvmTeksti) k.push(pvmTeksti);
    if (t.sivut) { var sv = t.sivut.trim(); if (k.length) k[k.length - 1] += ', ' + sv; else k.push(sv); }
    s = s.concat(k);
    if (t.doi) s.push('DOI: ' + t.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, ''));
    var hp = pvm(t.haettu);
    if (t['lähde']) s.push(t['lähde'].trim() + (hp ? ' (luettu ' + pvmMuoto(hp, 'viite', 3) + ')' : ''));
    else if (hp) s.push('Luettu ' + pvmMuoto(hp, 'viite', 3));
    return s.map(piste).filter(Boolean).join(' ');
  }
  // Vanhoille lukulistan nimikkeille, joilla ei ole koottua viitettä (e.viite tyhjä).
  function arvaaViite(d) {
    return kokoaViite({ otsikko: d.title, alaotsikko: d.sub, 'tekijä': d.author, julkaistu: d.year });
  }

  // Otsikkolohkon tietorivit etukentästä, kun tekstissä itsessään ei ole tietorivejä (verkkoleike, Latomon kentät).
  // Alaotsikon paikalla näkyvä kehys (blogin nimi, kokoelma) ei toistu tietorivillä.
  function tietorivit(m, kehys) {
    var r = [], p = pvm(m.julkaistu);
    if (m['tekijä']) r.push(m['tekijä']);
    var paikka = [m.teos, m.sivusto].filter(function (x) { return x && String(x).trim() !== kehys; })[0];
    var rivi = [[m.laji, m['yhteisö']].filter(Boolean).join(', ') || paikka || '', p ? pvmMuoto(p, 'meta') : ''].filter(Boolean).join(', ');
    if (rivi) r.push(rivi);
    return r;
  }

  /* ---------- Lähdeviittaukset ----------
     Alaviitteen viittaus linkitetään kirjallisuusluettelon kohtaan vain, kun yhteys on varma
     (käyttäjän heuristiikka 21.10.2026; ei BibTeX:ää eikä muuta viitetietokantaa):
     - Sukunimi ja vuosi (Singer 2023, Kant 2017a, Syrjintä s.a.): luettelossa tasan yksi
       tämän tekijän tämän vuoden kohta.
     - Sukunimi ja muu paikannin (Korsgaard 8.1.2, sisältönumerointi tms.): luettelossa tasan
       yksi tämän tekijän kohta, tai tasan yksi sellainen, johon tekstissä ei viitata missään
       vuosiluvulla. Vuodella viitatut teokset erottuvat siis karsimalla.
     Muuten linkkiä ei tule. Luettelon kohdan tekijä on alun teksti pilkkuun tai sulkuun asti,
     vuosi ensimmäinen sulkeissa oleva vuosi tai s.a.
     Lyhenteet (käyttäjän päätös 21.10.2026; ei merkintöjä tiedostoon): osio, jonka otsikossa on
     "lyhent" (Lyhenteet, Viittauksista ja niiden lyhenteistä), määrittelee lyhenteiksi kursivoidut
     yksittäiset 2–5 kirjaimen sanat, joissa on vähintään kaksi versaalia (*GMS*, *KpV*, *KrV*; ei
     *A*, ei teosten nimiä). Alaviitteen lyhenne ja sen perässä mahdollinen paikannin (GMS 4:429,
     KrV A1/B1, KrV BXXX) linkittyy kappaleeseen tai luettelon kohtaan, jossa lyhenne ensimmäisen
     kerran määritellään; jos sitä kappaletta edeltää suoraan otsikko, linkki vie otsikkoon. */
  var VUOSI = /^(?:1[5-9]\d\d|20\d\d)[a-z]?$|^s\.\s?a\.$/;
  function vuosiAvain(v) { return v.replace(/\s/g, ''); }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var LYH = /lyhent|abbreviation/i;
  var LYH_EM = /(^|[^*_\p{L}\p{N}])([*_])(\p{L}{2,5})\2(?![*_\p{L}\p{N}])/gu;

  // tokens: blocksOf()-lista. Merkitsee luettelon kappaleisiin t.kirja = { nimi, vuosi, id, ots }
  // ja lyhenteen määrittelevään kappaleeseen tai luettelon kohtaan t.lyhId.
  // lisa: alaviitteiden ja sitaattien määritelmien tekstit, jotka eivät ole lohkoissa ([^tunnus]: …).
  function viittaukset(tokens, uniq, lisa) {
    var kohdat = [], inBib = false, lyhTaso = 0, lyhOts = '', lyh = {};
    function maarittele(x, teksti, otsikko) {
      var m; LYH_EM.lastIndex = 0;
      while ((m = LYH_EM.exec(teksti))) {
        var a = m[3];
        if ((a.match(/\p{Lu}/gu) || []).length < 2 || lyh[a]) continue;
        if (!x.lyhId) {
          x.lyhId = uniq('lyh-' + slug(a));
          // Kappaletta edeltävä otsikko on kohde; id on tilapäinen ja vaihdetaan otsikon id:ksi renderöinnin lopussa.
          if (otsikko) { x.lyhOts = true; (otsikko.lyhIds = otsikko.lyhIds || []).push(x.lyhId); }
        }
        lyh[a] = { id: x.lyhId, ots: a + ' (' + lyhOts + ')' };
      }
    }
    var edel = null;
    tokens.forEach(function (t) {
      var ed = edel; edel = t;
      if (t.t === 'h') {
        var lvl = t.lvl === 1 ? 2 : Math.min(t.lvl, 4), tx = plain(t.text).trim();
        if (lvl === 2) inBib = BIB.test(tx);
        if (lyhTaso && lvl <= lyhTaso) lyhTaso = 0;
        if (!lyhTaso && LYH.test(tx)) { lyhTaso = lvl; lyhOts = tx; }
        return;
      }
      if (lyhTaso) {
        var otsikko = ed && ed.t === 'h' ? ed : null;
        if (t.t === 'p') maarittele(t, t.text, otsikko);
        else if (t.items) t.items.forEach(function (it, j) { maarittele(it, it.text, j === 0 ? otsikko : null); });
      }
      if (!inBib || t.t !== 'p') return;
      var tx = plain(t.text).trim();
      var nm = /^([^,(]+?)\s*[,(]/.exec(tx), vm = /\((1[5-9]\d\d[a-z]?|20\d\d[a-z]?|s\.\s?a\.)\)/.exec(tx);
      if (!nm || !vm || !/^\p{Lu}/u.test(nm[1])) return;
      var k = { nimi: nm[1], vuosi: vuosiAvain(vm[1]), ots: nm[1] + ' ' + vm[1] };
      k.id = uniq('kirj-' + slug(k.nimi) + '-' + slug(k.vuosi));
      t.kirja = k;
      kohdat.push(k);
    });
    var lyhenteet = Object.keys(lyh);
    if (!kohdat.length && !lyhenteet.length) return null;
    var nimet = {};
    kohdat.forEach(function (k) { (nimet[k.nimi] = nimet[k.nimi] || []).push(k); });
    // Lyhenne ja paikannin: numeroita (4:429, 6:442–44), painoksen kirjain ja numero (A1/B1) tai
    // roomalainen numero (BXXX).
    var lyhRe = lyhenteet.length ? new RegExp('(^|[^\\p{L}\\p{N}])(' + lyhenteet.sort(function (a, b) { return b.length - a.length; }).map(reEsc).join('|') +
      ')(?![\\p{L}\\p{N}])(?:\\s+\\p{Lu}{0,2}(?:\\d(?:[\\d.:–\\-\\/\\p{Lu}]*\\d)?|[IVXLC]+)(?![\\p{L}\\p{N}]))?', 'gu') : null;
    var re = !kohdat.length ? null : new RegExp('(^|[^\\p{L}\\p{N}])(' + Object.keys(nimet).sort(function (a, b) { return b.length - a.length; }).map(reEsc).join('|') +
      ')\\s+((?:1[5-9]\\d\\d|20\\d\\d)[a-z]?(?![\\p{L}\\p{N}]|[.:]\\d)|s\\.\\s?a\\.|\\d+(?:[.:]\\d+)*(?![\\p{L}\\p{N}]))', 'gu');

    // Vuodella viitatut kohdat koko tekstistä (luettelo itse pois).
    var vuodella = {};
    if (re) (function kay(list) {
      list.forEach(function (t) {
        if (t.kirja) return;
        if (t.kids) return kay(t.kids);
        var txt = t.items ? t.items.map(function (it) { return it.text; }).join('\n') : t.text || '';
        var m; re.lastIndex = 0;
        while ((m = re.exec(txt))) if (VUOSI.test(m[3])) vuodella[m[2] + ' ' + vuosiAvain(m[3])] = 1;
      });
    })(tokens.concat((lisa || []).map(function (x) { return { t: 'p', text: x }; })));

    // → { k: kohta | null, syy }
    function ratkaise(nimi, tunnus) {
      var ehdokkaat = nimet[nimi];
      if (VUOSI.test(tunnus)) {
        var v = vuosiAvain(tunnus), sama = ehdokkaat.filter(function (k) { return k.vuosi === v; });
        if (sama.length === 1) return { k: sama[0], syy: 'vuosi' };
        if (sama.length) return { k: null, syy: 'Luettelossa on useampi ' + nimi + ' ' + tunnus + '.' };
        var lahella = ehdokkaat.filter(function (k) { return k.vuosi.indexOf(v) === 0; });
        return { k: null, syy: lahella.length ? 'Vuosi on luettelossa vain kirjaimin: ' + lahella.map(function (k) { return k.ots; }).join(', ') + '.'
          : 'Luettelossa ei ole tekijän ' + nimi + ' vuotta ' + tunnus + '.' };
      }
      if (ehdokkaat.length === 1) return { k: ehdokkaat[0], syy: 'ainoa' };
      var jaljella = ehdokkaat.filter(function (k) { return !vuodella[k.nimi + ' ' + k.vuosi]; });
      if (jaljella.length === 1) return { k: jaljella[0], syy: 'karsinta' };
      return { k: null, syy: jaljella.length
        ? 'Vaihtoehtoja on useita, joihin ei viitata vuodella: ' + jaljella.map(function (k) { return k.ots; }).join(', ') + '.'
        : 'Kaikkiin luettelon kohtiin (' + ehdokkaat.map(function (k) { return k.ots; }).join(', ') + ') viitataan vuodella.' };
    }

    // Alaviitteen tekstin linkitys. Kirjaa tuloksen Latomon raporttiin.
    function linkita(teksti, kirjaa) {
      var osumat = [], out = '', last = 0, m;
      if (re) {
        re.lastIndex = 0;
        while ((m = re.exec(teksti))) osumat.push({ alku: m.index + m[1].length, loppu: m.index + m[0].length, r: ratkaise(m[2], m[3]) });
      }
      if (lyhRe) {
        lyhRe.lastIndex = 0;
        while ((m = lyhRe.exec(teksti))) osumat.push({ alku: m.index + m[1].length, loppu: m.index + m[0].length, r: { k: lyh[m[2]], syy: 'lyhenne' } });
      }
      osumat.sort(function (a, b) { return a.alku - b.alku; }).forEach(function (o) {
        if (o.alku < last) return;
        kirjaa(teksti.slice(o.alku, o.loppu), o.r);
        if (!o.r.k) return;
        out += esc(teksti.slice(last, o.alku)) + '<a class="lahde" href="#' + o.r.k.id + '">' + esc(teksti.slice(o.alku, o.loppu)) + '</a>';
        last = o.loppu;
      });
      return out + esc(teksti.slice(last));
    }
    return { kohdat: kohdat, linkita: linkita };
  }

  // Otsikkolohkon tietorivi: lyhyitä rivejä. Pitkäriviinen kappale on jo leipätekstiä (verkkoleikkeen johdanto).
  function tietorivi(t) { return t.split('\n').every(function (l) { return l.replace(/\\\s*$|\s+$/, '').length <= 100; }); }

  // Pandocin ^[…]-alaviitteet iA Writerin muotoon [^…] (Latomon ehdotus). Koodi ohitetaan.
  function iaAlaviitteet(src) {
    var out = '', i = 0, aita = null, rivinAlku = true;
    while (i < src.length) {
      if (rivinAlku) {
        var le = src.indexOf('\n', i), rivi = src.slice(i, le < 0 ? src.length : le), am = RE_AITA.exec(rivi);
        if (aita) {
          var al = RE_AITA_LOPPU.exec(rivi);
          if (al && al[1][0] === aita.ch && al[1].length >= aita.n) aita = null;
          out += rivi + (le < 0 ? '' : '\n'); i = le < 0 ? src.length : le + 1; continue;
        }
        if (am) { aita = { ch: am[1][0], n: am[1].length }; out += rivi + (le < 0 ? '' : '\n'); i = le < 0 ? src.length : le + 1; continue; }
        rivinAlku = false;
      }
      var c = src[i];
      if (c === '\n') { rivinAlku = true; out += c; i++; continue; }
      if (c === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { var ce = src.indexOf('`', i + 1), nl = src.indexOf('\n', i + 1); if (ce > 0 && (nl < 0 || ce < nl)) { out += src.slice(i, ce + 1); i = ce + 1; continue; } }
      if (c === '^' && src[i + 1] === '[') {
        var e = closeBracket(src, i + 1);
        if (e > 0) { out += '[^' + src.slice(i + 2, e) + ']'; i = e + 1; continue; }
      }
      out += c; i++;
    }
    return out;
  }

  /*
    parse(md) → {
      meta: etukentän avaimet yhtenäistettyinä (viite, osoite, otsikko, tekijä, julkaistu, sivusto …), raaka,
      title, sub, lines (tietorivit), author, year, kehys: alaotsikon paikalla näkyvä blogin nimi tai kokoelma,
      tiedot: lähdetiedot (KENTAT; etukenttä ohittaa tekstistä päätellyn), paatelty: tekstistä päätelty
        (otsikko, alaotsikko, tekijä, julkaistu), viite: etukentän viite tai tiedoista koottu,
      toc: [{ lvl 1–3, id, num, text, b }], notes, blocks, html, warnings: [{ ln, msg }],
      viittaukset: alaviitteiden lähdeviittaukset ja lyhenteet [{ ln, teksti, kohde: luettelon kohta, lyhenne tai '', syy }],
      kuvia, sisennettyKoodi: sisennyksestä syntyneet koodilohkot [{ ln, rivit }]
    }
  */
  function parse(src) {
    src = String(src || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var res = { meta: {}, raaka: {}, title: '', sub: '', lines: [], author: '', year: '', toc: [], notes: 0, blocks: 0, html: '', warnings: [],
      viittaukset: [], tiedot: {}, paatelty: {}, viite: '', kuvia: 0, sisennettyKoodi: [], kehys: '' };
    var ek = etukentta(src);
    res.meta = ek.meta; res.raaka = ek.raaka;
    var V = valmistele(ek.body, ek.ln);
    V.W.forEach(function (w) { res.warnings.push(w); });
    var curLn = 0;
    // xref(): ristiviittauksen rivinumero varoitusta varten (viittaus ratkaistaan vasta lopuksi).
    var refs = { fn: V.fn, link: V.link, cite: V.cite, meta: Object.assign({}, ek.raaka, ek.meta), xref: function () { return curLn; } };

    function warn(msg) { res.warnings.push({ ln: curLn, msg: msg }); }
    var b = 0, ids = {};
    function uniq(id) {
      if (!ids[id]) { ids[id] = 1; return id; }
      ids[id]++;
      return id + '-' + ids[id];
    }
    var vt = null;
    function kirjaa(teksti, r) { res.viittaukset.push({ ln: curLn, teksti: teksti, kohde: r.k ? r.k.ots : '', syy: r.syy }); }
    function cite(teksti) { return vt.linkita(teksti, kirjaa); }
    function note(body) {
      var n = ++res.notes;
      var inner = inline(body, { note: null, br: false, warn: warn, cite: vt ? cite : null, refs: refs });
      return '<label class="fnref" for="fn' + n + '">' + n + '</label>' +
        '<input type="checkbox" class="fntoggle" id="fn' + n + '">' +
        '<span class="sidenote" data-n="' + n + '"><span class="fnnum">' + n + '</span>' + inner + '</span>';
    }
    var ctx = { note: note, br: false, warn: warn, refs: refs };
    var metaCtx = { note: note, br: true, warn: warn, refs: refs };
    function blk(tag, cls, md, c, id) {
      return '<' + tag + (cls ? ' class="' + cls + '"' : '') + (id ? ' id="' + id + '"' : '') + ' data-b="' + (b++) + '">' + inline(md, c || ctx) + '</' + tag + '>';
    }

    var tokens = blocksOf(V.L, V.N), html = '', t0 = 0, m = res.meta, head = '';
    var maaritelmat = [];
    [V.fn, V.cite].forEach(function (o) { Object.keys(o).forEach(function (k) { maaritelmat.push(o[k].text); }); });
    vt = viittaukset(tokens, uniq, maaritelmat);

    // Kehys: blogin nimi tai kaunokirjallisen tekstin kokoelma näkyy alaotsikon paikalla, jos alaotsikkoa ei ole
    // (käyttäjän päätös 22.10.2026). Tieteellisen tekstin lehti tai kokoomateos jää tietoriville.
    function alaotsikkoon(tx) { return /^\*(?!\*)([\s\S]+?)\*$/.exec(tx) || /^_(?!_)([\s\S]+?)_$/.exec(tx); }
    var ty0 = tyyppiAvain(m.tyyppi), kehys = '';
    if (!m.alaotsikko) kehys = String((ty0 === 'kaunokirjallinen' ? m.teos || m.sivusto : ty0 === 'tieteellinen' ? '' : m.sivusto) || '').trim();
    if (kehys && tokens[0] && tokens[0].t === 'h' && tokens[0].lvl === 1) {
      for (var j0 = 1; j0 < tokens.length && tokens[j0].t === 'p'; j0++) {
        var tx0 = tokens[j0].text.trim(), em0 = alaotsikkoon(tx0);
        if (em0 && em0[1].indexOf('*') < 0) { kehys = ''; break; }
        if (!tietorivi(tx0)) break;
      }
    }
    var kehysTehty = false;
    function lisaaKehys() {
      if (!kehys || kehysTehty) return;
      head += blk('p', 'sub', kehys);
      kehysTehty = true;
    }

    // Otsikkolohko
    var auth = '', jp = null;
    if (tokens[0] && tokens[0].t === 'h' && tokens[0].lvl === 1) {
      curLn = tokens[0].ln;
      res.title = plain(tokens[0].text);
      head = '<header class="tt">' + blk('h1', '', tokens[0].text);
      t0 = 1;
      while (t0 < tokens.length && tokens[t0].t === 'p') {
        var tx = tokens[t0].text.trim();
        curLn = tokens[t0].ln;
        var em = alaotsikkoon(tx);
        if (em && !res.sub && em[1].indexOf('*') < 0) {
          res.sub = plain(em[1]);
          head += blk('p', 'sub', em[1]);
        } else if (tietorivi(tx)) {
          lisaaKehys();
          tx.split('\n').forEach(function (l) { l = plain(l.replace(/\\[ \t]*$/, '')).trim(); if (l) res.lines.push(l); });
          head += blk('p', 'meta', tx, metaCtx);
        } else break;
        t0++;
      }
    }
    // Tekstistä päätellyt tiedot: tekijä on tietorivi, jossa on 2–4 isolla alkavaa sanaa; julkaisuaika tarkin
    // tietoriveiltä löytyvä päiväys (lokakuussa 2026, 8.10.2026).
    res.lines.forEach(function (l) {
      if (/^\p{Lu}[\p{L}'’.-]+(\s+\p{Lu}[\p{L}'’.-]*){1,3}$/u.test(l)) auth = l;
      var p = pvm(l);
      if (p && (!jp || p.t > jp.t)) jp = p;
    });
    res.paatelty = { otsikko: res.title, alaotsikko: res.sub, 'tekijä': auth, julkaistu: jp ? pvmIso(jp) : '' };
    // Otsikko ja tietorivit etukentästä, jos tekstissä ei ole niitä (verkkoleike, Latomon kentät, pelkkä teksti).
    if (!head && m.otsikko) {
      head = '<header class="tt">' + blk('h1', '', m.otsikko) + (m.alaotsikko ? blk('p', 'sub', m.alaotsikko) : '');
      lisaaKehys();
    } else if (head && !res.sub && m.alaotsikko && !res.lines.length) head += blk('p', 'sub', m.alaotsikko);
    else if (head && !res.sub) lisaaKehys();
    if (!kehysTehty) kehys = '';
    if (head && !res.lines.length) {
      var tr = tietorivit(m, kehys);
      if (tr.length) { head += blk('p', 'meta', tr.join('\n'), metaCtx); res.lines = tr; }
    }
    if (head) html += head + '</header>';
    else res.warnings.push({ ln: tokens[0] ? tokens[0].ln : 1, msg: 'Teksti ei ala #-otsikolla: nimeksi tulee ensimmäinen otsikko tai tiedoston nimi.' });

    var inBib = false, nums = [], lyhOhjaus = {}, xrefKohde = {}, tocPaikka = false;
    function renderList(items, inQuote) {
      var i = 0;
      function ryhma(lvl) {
        var h = '';
        while (i < items.length && items[i].lvl === lvl) {
          var ord = items[i].ord, start = items[i].num, n = 0, kaare = false;
          h += ord ? '<ol class="enum"' + (start !== 1 ? ' start="' + start + '"' : '') + '>' : '<ul class="luettelo">';
          while (i < items.length && (items[i].lvl > lvl || (items[i].lvl === lvl && items[i].ord === ord))) {
            if (items[i].lvl > lvl) { h += '<li class="sisus">' + ryhma(items[i].lvl) + '</li>'; kaare = true; continue; }
            var it = items[i++], tm = /^\[([ xX])\][ \t]+/.exec(it.text), cls = tm ? 'tehtava' : '', arvo = ord && kaare ? start + n : 0;
            curLn = it.ln;
            var sisalto = tm ? '<span class="ruutu' + (tm[1] === ' ' ? '' : ' tehty') + '" aria-hidden="true"></span>' + inline(it.text.slice(tm[0].length), ctx) : inline(it.text, ctx);
            var id = it.lyhOts ? '' : it.lyhId || '';
            h += '<li' + (cls ? ' class="' + cls + '"' : '') + (id ? ' id="' + id + '"' : '') + (arvo ? ' value="' + arvo + '"' : '') + ' data-b="' + (b++) + '">' + sisalto + '</li>';
            n++;
          }
          h += ord ? '</ol>' : '</ul>';
        }
        return h;
      }
      var out = '';
      while (i < items.length) out += ryhma(items[i].lvl);
      return out;
    }
    function render(list, inQuote) {
      var h = '';
      list.forEach(function (t) {
        curLn = t.ln;
        if (t.t === 'h') {
          // Otsikkotasoja on neljä: # nimi, ## pääluku, ### alaluku, #### alaluvun alaluku.
          if (t.lvl > 4) warn('Otsikkotasoja on neljä (# – ####): ' + '#'.repeat(t.lvl) + ' näkyy ####-otsikkona.');
          var lvl = t.lvl === 1 ? 2 : Math.min(t.lvl, 4);
          // iA Writerin ristiviittauksen nimiö otsikon perässä: # Otsikko [Nimiö]
          var htext = t.text, nimio = /^(.*\S)\s+\[([^\]]+)\]$/.exec(htext);
          if (nimio) htext = nimio[1];
          var txt = plain(htext).trim();
          var nm = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/.exec(txt);
          var id, cls = 'sec';
          if (nm) {
            id = 'luku-' + nm[1].split('.').join('-');
            var parts = nm[1].split('.').map(Number), d = parts.length - 1, prevN = nums[d] || 0;
            if (parts[d] !== prevN + 1 || (d > 0 && parts[d - 1] !== nums[d - 1])) {
              warn('Otsikon numero ' + nm[1] + ' ei jatka edellistä numerointia.');
            }
            nums = parts.slice();
          } else {
            id = slug(txt);
            if (lvl >= 3) cls += ' caps';
          }
          id = uniq(id);
          if (lvl === 2) inBib = BIB.test(txt);
          (t.lyhIds || []).forEach(function (i) { lyhOhjaus[i] = id; });
          // Viittauksen kohde: nimiö, otsikko sellaisenaan ja numeroidusta otsikosta myös pelkkä nimi.
          [nimio && nimio[2], txt, nm && nm[2]].forEach(function (x) { if (x && !xrefKohde[norm(x)]) xrefKohde[norm(x)] = id; });
          res.toc.push({ lvl: lvl - 1, id: id, num: nm ? nm[1] : '', text: txt, b: b });
          h += '<h' + lvl + ' id="' + id + '" class="' + cls + '" data-b="' + (b++) + '">' + inline(htext, ctx) + '</h' + lvl + '>';
        } else if (t.t === 'p') {
          if (/(^|\s)\$\$|(^|\s)\$[^\s$][^$\n]*[^\s$\\]\$(?=$|[\s.,;:!?)])/.test(t.text) && !res.matikka) {
            res.matikka = true; warn('Matematiikkaa ($…$) ei ladota: lausekkeet näkyvät sellaisinaan.');
          }
          h += blk('p', inBib && !inQuote ? 'bib' : '', t.text, null, t.kirja && !inQuote ? t.kirja.id : t.lyhOts ? '' : t.lyhId || '');
        } else if (t.t === 'hr') {
          h += '<hr>';
        } else if (t.t === 'bq') {
          h += '<blockquote>' + render(t.kids, true) + '</blockquote>';
        } else if (t.t === 'list') {
          h += renderList(t.items, inQuote);
        } else if (t.t === 'table') {
          h += '<table class="taulukko"><thead>';
          t.rivit.forEach(function (r, j) {
            curLn = r.ln;
            if (j === 1) h += '</thead><tbody>';
            var sar = 0, tag = j ? 'td' : 'th';
            h += '<tr data-b="' + (b++) + '">' + r.solut.map(function (c) {
              var al = t.tasaus[sar] || '';
              sar += c.span;
              return '<' + tag + (c.span > 1 ? ' colspan="' + c.span + '"' : '') + (al ? ' class="t-' + al + '"' : '') + '>' + inline(c.text, ctx) + '</' + tag + '>';
            }).join('') + '</tr>';
          });
          h += (t.rivit.length > 1 ? '</tbody>' : '</thead>') + '</table>';
        } else if (t.t === 'pre') {
          if (t.sis) res.sisennettyKoodi.push({ ln: t.ln, rivit: t.text.split('\n').length });
          h += '<pre data-b="' + (b++) + '"><code>' + esc(t.text) + '</code></pre>';
        } else if (t.t === 'toc') {
          // Lukija sijoittaa sisällysluettelonsa tähän ({{TOC}}, iA Writer); vain ensimmäinen.
          if (!tocPaikka) h += '<div class="toc-paikka"></div>';
          tocPaikka = true;
        } else if (t.t === 'sivu') {
          h += '<div class="sivunvaihto" aria-hidden="true"></div>';
        } else if (t.t === 'tyhja') {
          warn('Pelkkä ' + t.text + ' (tyhjä korostus, usein verkkoleikkeen jäänne) jätettiin pois.');
        }
      });
      return h;
    }
    html += render(tokens.slice(t0), false);

    html = html.replace(/href="#(lyh-[^"]*)"/g, function (x, i) { return lyhOhjaus[i] ? 'href="#' + lyhOhjaus[i] + '"' : x; });
    // Ristiviittaukset otsikkoon tai nimiöön; ratkaisematon jää tekstiksi.
    html = html.replace(new RegExp('<a href="#' + XREF + '([^"' + XREF + ']*)' + XREF + '(\\d+)">([\\s\\S]*?)</a>', 'g'), function (x, k, ln, sis) {
      var id = xrefKohde[unesc(k)];
      if (id) return '<a href="#' + id + '">' + sis + '</a>';
      res.warnings.push({ ln: +ln, msg: 'Viittauksen ”' + unesc(sis.replace(/<[^>]+>/g, '')) + '” kohdetta ”' + unesc(k) + '” ei löydy (ei viitelinkkiä eikä otsikkoa).' });
      return sis;
    });
    res.html = html;
    res.blocks = b;
    res.kuvia = refs.kuvia || 0;
    [[V.fn, 'Alaviitteen [^', ']'], [V.cite, 'Sitaatin [#', ']']].forEach(function (x) {
      Object.keys(x[0]).forEach(function (k) {
        var d = x[0][k];
        if (!d.kaytetty) res.warnings.push({ ln: d.ln, msg: x[1] + d.nimi + x[2] + ' määritelmään ei viitata tekstissä.' });
      });
    });
    res.warnings.sort(function (a, z) { return a.ln - z.ln; });

    // Tiedot: etukenttä ohittaa tekstistä päätellyn. Vanha avain vuosi käy julkaisuajaksi.
    var tied = res.tiedot;
    KENTAT.forEach(function (k) { var v = m[k] != null && m[k] !== '' ? m[k] : res.paatelty[k] || ''; tied[k] = String(v).trim(); });
    if (!tied.julkaistu && m.vuosi) tied.julkaistu = String(m.vuosi).trim();
    tied.tyyppi = tyyppiAvain(tied.tyyppi);
    res.title = tied.otsikko || res.title;
    res.sub = tied.alaotsikko;
    res.kehys = kehys;
    res.author = tied['tekijä'];
    var vp = pvm(tied.julkaistu), ym = /\b(1[5-9]\d\d|20\d\d)\b/.exec(res.lines.join(' '));
    res.year = vp ? String(vp.y) : m.vuosi || (ym ? ym[1] : '');
    res.viite = m.viite || kokoaViite(tied);
    return res;
  }

  /* ---------- Tavutus ----------
     Suomen tavusäännöt: konsonanttisääntö, vokaalisääntö ja diftongit. Kirjasäännön mukaan
     ie, uo ja yö ovat diftongeja vain ensitavussa, mutta yhdyssanoissa ne aloittavat usein
     jälkiosan (itse|tietoisuus, yhteis|työ). Siksi ne käsitellään diftongeina kaikkialla
     paitsi monikon genetiivissä (talvi-en, kaupunki-en): ie + n sanan lopussa tai ennen
     konsonanttia. Yhdyssanojen saumaa säännöt eivät muuten tunne: "kansalaisoikeus" saa
     rajan kansalai-soikeus. Siksi rajat merkitään tyypeittäin:
       'cc' konsonanttiryhmän sisällä (kart-ta, Kors-gaard)
       'v'  vokaalien välissä (ra-di-o)
       'c'  vokaalin ja yksinäisen konsonantin välissä (ka-la). Yhdyssanavirheet ovat aina
            tätä tyyppiä, joten varovainen tila jättää ne pois. */
  var VOK = 'aeiouyäöå';
  var DIFT = { ai: 1, ei: 1, oi: 1, ui: 1, yi: 1, 'äi': 1, 'öi': 1, au: 1, eu: 1, iu: 1, ou: 1, ey: 1, iy: 1, 'äy': 1, 'öy': 1 };
  var DIFT1 = { ie: 1, uo: 1, 'yö': 1 };
  function isV(ch) { return VOK.indexOf(ch) >= 0; }

  // w pienaakkosin → [{ k: raja ennen indeksiä k, t: 'c' | 'cc' | 'v' }]
  function tavurajat(w) {
    var out = [], seenV = false, nuc = 0, first = true;
    for (var k = 0; k < w.length; k++) {
      var ch = w[k];
      if (isV(ch)) {
        if (nuc === 0) { nuc = 1; seenV = true; continue; }
        var p = w[k - 1] + ch;
        var gen = p === 'ie' && !first && w[k + 1] === 'n' && (k + 2 >= w.length || !isV(w[k + 2]));
        if (nuc === 1 && (w[k - 1] === ch || DIFT[p] || (DIFT1[p] && !gen))) { nuc = 2; continue; }
        out.push({ k: k, t: 'v' }); first = false; nuc = 1; continue;
      }
      nuc = 0;
      if (seenV && k + 1 < w.length && isV(w[k + 1])) {
        out.push({ k: k, t: isV(w[k - 1]) ? 'c' : 'cc' });
        first = false;
      }
    }
    return out;
  }

  var TILAT = {
    varovainen: { L: 3, R: 3, min: 8, c: false },
    tihea: { L: 2, R: 2, min: 5, c: true }
  };
  // Vain suomen kirjaimista koostuvat sanat: c, q, w, x, z, ß, é, ü … jättävät sanan rauhaan.
  var SUOMI = /^[abd-pr-vyäöå]+$/;

  function tavuta(word, tila) {
    var o = typeof tila === 'string' ? TILAT[tila] : tila;
    if (!o || word.length < o.min) return word;
    var w = word.toLowerCase();
    if (!SUOMI.test(w)) return word;
    var out = '', last = 0;
    tavurajat(w).forEach(function (r) {
      if (r.k < o.L || word.length - r.k < o.R) return;
      if (r.t === 'c' && !o.c) return;
      out += word.slice(last, r.k) + '­';
      last = r.k;
    });
    return out + word.slice(last);
  }

  var SANA = /[A-Za-zÀ-ÖØ-öø-ÿ]+/g;
  // Otsikot, alaotsikko, tietorivit, sisällysluettelo (.luin-ui) ja lihavoinnit eivät saa pehmeitä tavuviivoja.
  // Jos yksittäinen sana ei mahdu edes yksin riville, lukija tavuttaa sen erikseen (luin.html, tavutaPitkat()).
  var OHITA = 'h1,h2,h3,h4,h5,h6,.sub,.meta,strong,th,caption,figcaption,em,code,pre,a,.fnref,.fnnum,.luin-ui';
  function tavutaDOM(rootEl, tila) {
    var o = TILAT[tila];
    if (!o) return 0;
    var tw = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null), nodes = [], n, count = 0;
    while ((n = tw.nextNode())) {
      if (!n.parentElement || n.parentElement.closest(OHITA)) continue;
      nodes.push(n);
    }
    nodes.forEach(function (t) {
      var v = t.nodeValue;
      var nv = v.replace(SANA, function (w) { var h = tavuta(w, o); if (h !== w) count++; return h; });
      if (nv !== v) t.nodeValue = nv;
    });
    return count;
  }

  root.LuinMD = { parse: parse, etukentta: etukentta, arvaaViite: arvaaViite, kokoaViite: kokoaViite, KENTAT: KENTAT,
    tyyppiAvain: tyyppiAvain, avain: avain, pvm: pvm, pvmMuoto: pvmMuoto, pvmIso: pvmIso, tekijat: tekijat, nimet: nimet,
    iaAlaviitteet: iaAlaviitteet, plain: plain, slug: slug, tavurajat: tavurajat, tavuta: tavuta, tavutaDOM: tavutaDOM, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
