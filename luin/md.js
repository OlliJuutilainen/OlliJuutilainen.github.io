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
  Lainauksen lähde (käyttäjän päätös 27.10.2026): lainauksen viimeinen rivi – Nimi kenoviivan jälkeen → figure.lainaus
  (blockquote + figcaption); otsikon jälkeen ennen leipätekstiä figure.motto.
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

  // Linkki, jonka teksti on osoite tai DOI, saa paljaan osoitteen tavoin luokan url (katkeaa mistä tahansa).
  var RE_OSOITE = /^(https?:\/\/|www\.|doi:\s?10\.)\S+$/i;
  function linkinLuokka(href, teksti) { return RE_OSOITE.test(teksti) ? ' class="url"' : ''; }
  // Tekstin oma sivu (etukentän lähde) vertailumuotoon: ilman protokollaa, www:tä, index.html:ää ja loppukauttaviivaa.
  function sivunAvain(u) {
    return String(u || '').trim().split('#')[0].replace(/^https?:\/\/(www\.)?/i, '').replace(/\/index\.html?$/i, '').replace(/\/+$/, '').toLowerCase();
  }
  var SISA = '\u0002';   // tekstin omaan sivuun osoittavan linkin paikka, ratkaistaan renderöinnin lopussa (sisaisetLinkit)
  // Paljaan osoitteen tai DOI:n loppuvälimerkit eivät kuulu siihen, sulku kuuluu, jos sille on pari.
  function karsiLoppu(u) {
    while (/[.,;:!?'"”’»…\]*_]$/.test(u) || (/\)$/.test(u) && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length)) u = u.slice(0, -1);
    return u;
  }

  // Rivinsisäinen merkintä. ctx: { note(body) → html | null, br: rivinvaihto <br>:ksi, warn(msg), cite(teksti),
  // refs: { fn, link, cite, meta } (parse() täyttää), linkissa: linkin tekstissä ei linkkejä eikä alaviitteitä }
  function inline(s, ctx) {
    var out = '', buf = '', i = 0, refs = ctx.refs || {};
    function flush() { out += ctx.cite ? ctx.cite(buf) : esc(buf); buf = ''; }
    function linkinTeksti(t) { return inline(t, { note: null, br: false, warn: ctx.warn, refs: refs, linkissa: true }); }
    function linkki(href, teksti) {
      flush();
      // Linkki tekstin omaan sivuun ankkurin kera (SEP: …/dewey/#Meta) tai pelkkä #ankkuri: Luinin sisäinen, jos kohde löytyy.
      var h = String(href), r = h.indexOf('#'), sisa = refs.lahde && r >= 0 && (r === 0 || sivunAvain(h) === refs.lahde) && h.length > r + 1;
      out += '<a' + linkinLuokka(h, plain(teksti).trim()) + ' href="' + (sisa ? SISA + esc(h.slice(r + 1)) + SISA + esc(h) + SISA : esc(h)) + '">' + linkinTeksti(teksti) + '</a>';
    }
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
        // ^[2](osoite)^ ja ^[[7](osoite)]^ ovat yläindeksiin linkitettyjä merkkejä (Latomon <sup>-muunnos), eivät
        // alaviitteitä: hakasulun perässä on linkin ( tai heti yläindeksin sulkeva ^.
        var ylk = e > 0 && (s[e + 1] === '(' || s[e + 1] === '^') && ylaAla(s, i, '^');
        if (ylk && ylk.loppu > e + 1) { flush(); out += '<sup>' + inline(ylk.t, ctx) + '</sup>'; i = ylk.loppu; continue; }
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
        if (am) { flush(); out += '<a' + linkinLuokka(am[1], am[1]) + ' href="' + esc(am[1]) + '">' + esc(am[1]) + '</a>'; i += am[0].length; continue; }
        if (/^<\/?[a-zA-Z][^>]*>/.test(s.slice(i)) && ctx.warn) ctx.warn('HTML-merkintä näkyy tekstinä: “' + s.slice(i, i + 30) + '”');
      }
      // Paljas verkko-osoite linkiksi.
      if ((c === 'h' || c === 'H') && !ctx.linkissa && /^https?:\/\/[\p{L}\p{N}-]+\./iu.test(s.slice(i, i + 80)) && !/[\p{L}\p{N}\/]/u.test(s[i - 1] || ' ')) {
        var u = karsiLoppu(/^https?:\/\/[^\s<>"]+/i.exec(s.slice(i))[0]);
        var uu = u.replace(/\\([!-\/:-@\[-`{-~])/g, '$1');
        flush(); out += '<a' + linkinLuokka(uu, uu) + ' href="' + esc(uu) + '">' + esc(uu) + '</a>'; i += u.length; continue;
      }
      // DOI ilman osoitetta (doi:10.1093/…, SEP:n kirjallisuusluettelo) linkiksi doi.org:iin.
      if ((c === 'd' || c === 'D') && !ctx.linkissa && /^doi:\s?10\.\d{4,9}\//i.test(s.slice(i, i + 24)) && !/[\p{L}\p{N}]/u.test(s[i - 1] || ' ')) {
        var dm = karsiLoppu(/^doi:\s?10\.\d{4,9}\/[^\s<>"]+/i.exec(s.slice(i))[0]);
        var dd = dm.replace(/\\([!-\/:-@\[-`{-~])/g, '$1');
        flush(); out += '<a class="url" href="https://doi.org/' + esc(dd.replace(/^doi:\s?/i, '')) + '">' + esc(dd) + '</a>'; i += dm.length; continue;
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
  // refs: viitelinkit [teksti][1] tekstiksi (Sisälmys, otsikon tunniste); ilman niitä hakasulkeet jäisivät näkyviin.
  function plain(s, refs) {
    return unesc(inline(String(s), { note: null, br: false, refs: refs }).replace(/<br>/g, ' ').replace(/<[^>]+>/g, ''));
  }

  function slug(s) {
    return s.toLowerCase().replace(/[äå]/g, 'a').replace(/ö/g, 'o').replace(/[éè]/g, 'e').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'osio';
  }

  // Lainauksen lähde (käyttäjän päätös 27.10.2026): lainauksen viimeinen rivi, joka alkaa ajatus- tai em-viivalla ja
  // välilyönnillä ja jota edeltää pakotettu rivinvaihto (\, kaksi välilyöntiä tai <br>) tai lainauksen sisäinen tyhjä
  // rivi. Muoto on yleistä Markdownia, joten lähde pysyy lainauksen alla muissakin ohjelmissa. Vuorosanat eivät ole
  // lähteitä: jos lainauksen muukin rivi alkaa viivalla, viimeinenkään ei ole lähde.
  var RE_LAHDE = /^[–—][ \u00a0]+\S/, RE_PAKKO = /(\\| {2,}|<br\s*\/?>\s*)$/i, RE_TYHJA_BR = /^\s*(\\|<br\s*\/?>)?\s*$/i;
  function lahdeRivi(x) { x = x.replace(/\s*(\\|<br\s*\/?>)?\s*$/i, ''); return RE_LAHDE.test(x) && x.length <= 160; }
  function lainauksenLahde(kids) {
    var vika = kids[kids.length - 1];
    if (!vika || vika.t !== 'p') return null;
    var r = vika.text.split('\n'), x = r[r.length - 1].replace(/\s*(\\|<br\s*\/?>)?\s*$/i, '').trim();
    if (!lahdeRivi(x)) return null;
    var muut = kids.slice(0, -1).filter(function (t) { return t.t === 'p'; }).map(function (t) { return t.text; }).concat(r.slice(0, -1));
    if (muut.some(function (m) { return m.split('\n').some(function (y) { return RE_LAHDE.test(y.trim()); }); })) return null;
    if (r.length === 1) return kids.length > 1 ? { kids: kids.slice(0, -1), text: x, ln: vika.ln } : null;
    if (!RE_PAKKO.test(r[r.length - 2])) return null;
    var alku = r.slice(0, -1); alku[alku.length - 1] = alku[alku.length - 1].replace(RE_PAKKO, '').replace(/\s+$/, '');
    return { kids: kids.slice(0, -1).concat([{ t: 'p', ln: vika.ln, text: alku.join('\n') }]), text: x, ln: vika.ln + r.length - 1 };
  }

  // Kirjallisuusluettelon otsikko millä tahansa otsikkotasolla (käyttäjän pyyntö 4.11.2026: Kant-Lexikonin
  // ### Weiterführende Literatur). Osio jatkuu seuraavaan yhtä korkean tai korkeamman tason otsikkoon.
  var BIB = new RegExp('^(' + [
    // suomi
    'kirjallisuus', 'kirjallisuusluettelo', 'kirjallisuutta', 'käytetty kirjallisuus', 'lähdekirjallisuus',
    'suositeltavaa kirjallisuutta', 'lisälukemista', 'lähteet',
    // Ensyklopedia Logos (käyttäjän lupa 10.11.2026): Suositeltavaa/Suositeltua jatkolukemista, Muu kirjallisuus.
    '(suositeltavaa |suositeltua )?jatkolukemista', 'muu kirjallisuus', 'lähdeluettelo', 'lähteet ja kirjallisuus', 'bibliografia',
    // englanti
    'references', 'reference list', 'bibliography', 'select(ed)? bibliography', 'works cited', 'literature cited', 'literature',
    'sources', '(further|suggested|recommended|additional) reading', '(references|bibliography) and further reading',
    // saksa
    '((weiterführende|ausgewählte|verwendete|zitierte) )?literatur', 'literaturverzeichnis', 'literaturhinweise',
    'literaturangaben', '(primär|sekundär)literatur', 'bibliographie', 'bibliografie', 'quellen', 'quellenverzeichnis',
    'quellen und literatur', 'quellen- und literaturverzeichnis'
  ].join('|') + ')$', 'i');

  /* ---------- Sivuseikkojen pääluvut ----------
     Käyttäjän pyyntö 29.10.2026: kun tekstin päälukurunko on tukeva, lopun (ja alun) vain muodollisesti pääluvuiksi
     merkityt osiot ladotaan alalukuina (otsikkotaso yhtä alempana koko osiossa). Kirjallisuus, liitteet, lyhenteet,
     kiitokset, huomautukset ja SEP:n lopun osiot tunnistetaan nimestä; lopussa myös lyhyt osio ilman pitkää proosaa,
     jos varsinaiset luvut ovat numeroituja eikä se ole (tai luvuissa ei ole numeroita lainkaan). Runko on tukeva, kun
     jäljelle jää vähintään kolme päälukua ja niissä on vähintään kaksi kolmasosaa tekstistä (kirjallisuusluetteloita
     lukuun ottamatta). Muuten mitään ei muuteta. Keskeltä tekstiä ei alenneta mitään. */
  var OHEIS = /^(kirjallisuus|kirjallisuusluettelo|lähteet|lähdeluettelo|lähteet ja kirjallisuus|bibliografia|references|bibliography|works cited|sources|sisällys|sisällysluettelo|contents|table of contents|liitteet?|appendix|appendices|kiitokset|acknowledg(e)?ments?|huomautukset|viitteet|alaviitteet|notes|footnotes|endnotes|related entries|other internet resources|academic tools|see also|katso myös|further reading|suggested reading|lisälukemista|(suositeltavaa |suositeltua )?jatkolukemista|muu kirjallisuus|hakemisto|henkilöhakemisto|asiahakemisto|index|sanasto|glossary|kirjoittajasta|tekijästä|tekijät|about the authors?|kuvaluettelo|taulukkoluettelo)(?![\p{L}\p{N}])|lyhent|abbreviation/iu;
  // Alussa vain nimen perusteella (Johdanto ilman numeroa ennen 1. lukua on varsinainen luku).
  var ALKU_OHEIS = /^(sisällys|sisällysluettelo|contents|table of contents|kiitokset|acknowledg(e)?ments?|tiivistelmä|abstract)(?![\p{L}\p{N}])|lyhent|abbreviation/iu;
  // Ylimmälle tasolle (luvut) enintään näin monta otsikkoa kaksitasoisessa tekstissä; muuten taso jää käyttämättä (parse()).
  var LUKUJA_ENINTAAN = 10;
  // Kirjallisuusosio on luku, kun se vie vähintään tämän osuuden tekstistä (bibLuku(), käyttäjän sääntö 7.11.2026).
  var BIB_OSUUS = 0.25;
  /* Iso kirjallisuusosio luvuksi (käyttäjän sääntö 7.11.2026, SEP:n Beauvoir): kun luvun tasolla (## tai #) oleva
     kirjallisuusotsikko ja kaikki sen jälkeinen tekstin loppuun vievät vähintään BIB_OSUUS tekstistä, sivuseikkojen
     alennus ja ylimmän tason jättäminen käyttämättä perutaan sen osiolta: otsikko on luku ja sen alaotsikot osioita.
     Kirjallisuuden oletetaan olevan lopussa, joten sen jälkeiset osiot (Other Internet Resources) lasketaan sen osuuteen;
     ne itse jäävät ennalleen. Palauttaa merkittävien otsikoiden indeksit. */
  function bibLuku(tokens, t0) {
    var kaikki = 0, osa = 0, alku = -1, i;
    for (i = t0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.t === 'h') {
        if (alku < 0 && t.lvl <= 2 && !t.pykala && BIB.test(plain(t.text.replace(/\s+\[[^\]]+\]$/, '')).trim())) alku = i;
        continue;
      }
      var m = mittaa(t)[0];
      kaikki += m;
      if (alku >= 0) osa += m;
    }
    if (alku < 0 || osa < kaikki * BIB_OSUUS) return [];
    var tulos = [alku];
    for (i = alku + 1; i < tokens.length && !(tokens[i].t === 'h' && tokens[i].lvl <= 2); i++) if (tokens[i].t === 'h') tulos.push(i);
    return tulos;
  }
  function lukuNimi(text) { return plain(text).trim().replace(/^((\d+(\.\d+)*|[IVXLC]+)[.):]?|[A-Z][.):])\s+/, '').trim(); }
  // Lohkon tekstin pituus [yhteensä, pisin kappale tai kohta] merkkeinä.
  function pit(x) { return plain(String(x || '')).replace(/\s+/g, ' ').trim().length; }
  function mittaa(t) {
    if (t.t === 'p') return [pit(t.text), pit(t.text)];
    if (t.t === 'list') return t.items.reduce(function (a, it) { var n = pit(it.text); return [a[0] + n, Math.max(a[1], n)]; }, [0, 0]);
    if (t.t === 'bq') return t.kids.reduce(function (a, k) { var m = mittaa(k); return [a[0] + m[0], Math.max(a[1], m[1])]; }, [0, 0]);
    if (t.t === 'table') return [t.rivit.reduce(function (a, r) { return a + r.solut.reduce(function (b, c) { return b + pit(c.text); }, 0); }, 0), 0];
    if (t.t === 'pre') return [t.text.length, 0];
    return [0, 0];
  }
  function sivuLuvut(tokens, t0) {
    var osat = [], nyky = null;
    for (var i = t0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.t === 'h' && t.lvl <= 2 && !t.pykala) {
        var nimi = lukuNimi(t.text.replace(/\s+\[[^\]]+\]$/, ''));
        nyky = { i: i, nimi: nimi, num: /^\s*\d+(\.\d+)*\.?\s/.test(plain(t.text)), bib: BIB.test(plain(t.text).trim()), massa: 0, pisin: 0 };
        osat.push(nyky);
      } else if (nyky) {
        var m = mittaa(t);
        nyky.massa += m[0]; nyky.pisin = Math.max(nyky.pisin, m[1]);
      }
    }
    if (osat.length < 4) return [];
    var ydin = osat.filter(function (o) { return !OHEIS.test(o.nimi) && !ALKU_OHEIS.test(o.nimi); });
    if (ydin.length < 3) return [];
    var numeroitu = ydin.filter(function (o) { return o.num; }).length * 3 >= ydin.length * 2;
    var massat = ydin.map(function (o) { return o.massa; }).sort(function (a, b) { return a - b; }), med = massat[massat.length >> 1];
    function loppuun(o) {
      if (OHEIS.test(o.nimi)) return true;
      // Lyhyt osio ilman pitkää proosaa (linkkilista, lyhyet rivit), jonka numeroimattomuus erottaa sen luvuista.
      return o.pisin < 250 && o.massa < med / 4 && (!numeroitu || !o.num);
    }
    var z = osat.length - 1, a = 0;
    while (z >= 0 && loppuun(osat[z])) z--;
    while (a <= z && ALKU_OHEIS.test(osat[a].nimi)) a++;
    if (a === 0 && z === osat.length - 1) return [];
    var runko = osat.slice(a, z + 1), kaikki = 0, oma = 0;
    osat.forEach(function (o) { if (!o.bib) kaikki += o.massa; });
    runko.forEach(function (o) { if (!o.bib) oma += o.massa; });
    if (runko.length < 3 || oma * 3 < kaikki * 2) return [];
    return osat.slice(0, a).concat(osat.slice(z + 1)).map(function (o) { return o.i; });
  }

  /* ---------- Tekijänoikeusmerkintä ----------
     Käyttäjän pyyntö 10.11.2026: koko tekstin (myös kirjallisuuden) jälkeen otsikko Tekijänoikeudet, kun etukentässä on
     `oikeudet:` (lisäosa kirjoittaa sen vain, kun tieto löytyy sivulta; Latomossa valinnainen kenttä). Kolme kappaletta:
     merkintä sellaisenaan, kaverillinen selitys (käyttäjän toivoma rento kirjakieli, ei lakimiestä) ja virallinen linkki
     (Creative Commons, lähteen omat ehdot tai tekijänoikeuslaki). `oikeudet-lähde:` on sivu, jolla merkintä on. */
  var OIK_CC = {
    'by': 'Tätä saa jakaa ja muokata vapaasti, myös kaupallisesti, kunhan kertoo, kuka sen kirjoitti ja mistä sen löysi.',
    'by-sa': 'Tätä saa jakaa ja muokata, myös kaupallisesti, kunhan mainitsee tekijän ja jakaa oman versionsa samalla lisenssillä. Vapaasta tekstistä ei siis saa tehdä omaa suljettua.',
    'by-nc': 'Tätä saa jakaa ja muokata, kunhan mainitsee tekijän eikä tee sillä rahaa.',
    'by-nc-sa': 'Tätä saa jakaa ja muokata, kunhan mainitsee tekijän, ei tee sillä rahaa ja jakaa oman versionsa samalla lisenssillä.',
    'by-nd': 'Tätä saa jakaa sellaisenaan, myös kaupallisesti, kunhan mainitsee tekijän. Muokattua versiota ei saa jakaa.',
    'by-nc-nd': 'Tätä saa jakaa sellaisenaan, kunhan mainitsee tekijän eikä tee sillä rahaa. Muokattua versiota ei saa jakaa.'
  };
  var OIK_SELITYS = {
    vapaa: 'Vapaata riistaa: tekstillä saa tehdä mitä haluaa. Tekijän mainitseminen on silti reilua.',
    kaikki: 'Tekijä omistaa tekstin. Omaan käyttöön saa kopioida ja siitä saa lainata lähde mainiten, mutta omille nettisivuille tai muuhun jakoon sitä ei saa viedä ilman lupaa. Kaupan joulukuusen koristeita ei siis viedä omalle kotikirppikselle.',
    sep: 'Tämän saa lukea, ladata, tulostaa ja pitää omissa laitteissa (kuten Luinissa), ja sen saa lähettää kaverille tai enintään 30 hengen suljettuun porukkaan, kunhan siitä ei tehdä rahaa. Julkiselle nettisivulle sitä ei saa laittaa; jaa mieluummin linkki.',
    logos: 'Kirjoittaja omistaa tekstin, ja Filosofia.fi sai luvan julkaista sen kerran kaikkien luettavaksi. Omaan käyttöön sen saa pitää ja siitä saa lainata lähde mainiten, mutta muualle julkaisemisesta pitää sopia kirjoittajan kanssa.'
  };
  var OIK_LAKI = 'https://www.finlex.fi/fi/lainsaadanto/1961/404';
  var OIK_NIMET = { by: 'Attribution', sa: 'ShareAlike', nc: 'NonCommercial', nd: 'NoDerivatives' };
  function oikeudet(meta) {
    var t = String(meta.oikeudet || '').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    var u = String(meta['oikeudet-lähde'] || '').trim(), host = '';
    try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { u = ''; }
    var r = { koodi: t, selitys: '', linkki: '', linkkiTeksti: '' };
    // Creative Commons: osoitteesta, lyhenteestä (CC BY-SA 4.0) tai nimestä (Attribution-ShareAlike, Nimeä-JaaSamoin).
    var cu = /creativecommons\.org\/licenses\/((?:by)(?:-nc)?(?:-sa|-nd)?)\/(\d\.\d)/i.exec(u + ' ' + t);
    var ck = /\bCC[ -]?(BY(?:[ -]NC)?(?:[ -](?:SA|ND))?)(?:[ -](\d\.\d))?(?![\p{L}\p{N}])/iu.exec(t);
    var nimi = /(Attribution|Nimeä)((?:[- ](?:NonCommercial|EiKaupallinen|ShareAlike|JaaSamoin|NoDerivatives|NoDerivs|EiMuutoksia))*)\s*(\d\.\d)?/i.exec(t);
    var laji = '', versio = '';
    if (cu) { laji = cu[1].toLowerCase(); versio = cu[2]; }
    else if (ck) { laji = ck[1].toLowerCase().replace(/ /g, '-'); versio = ck[2] || ''; }
    else if (nimi) {
      var o = nimi[2].toLowerCase();
      laji = 'by' + (/noncommercial|eikaupallinen/.test(o) ? '-nc' : '') + (/sharealike|jaasamoin/.test(o) ? '-sa' : /noderiv|eimuutoksia/.test(o) ? '-nd' : '');
      versio = nimi[3] || '';
    }
    if (laji && OIK_CC[laji]) {
      versio = versio || '4.0';
      r.selitys = OIK_CC[laji];
      r.linkki = 'https://creativecommons.org/licenses/' + laji + '/' + versio + '/deed.fi';
      r.linkkiTeksti = 'Creative Commons -lisenssin CC ' + laji.toUpperCase() + ' ' + versio + ' (' + laji.split('-').map(function (x) { return OIK_NIMET[x]; }).join('-') + ') tiivistelmä suomeksi';
      return r;
    }
    if (/\bCC0\b|publicdomain\/zero/i.test(t + ' ' + u)) {
      r.selitys = OIK_SELITYS.vapaa; r.linkki = 'https://creativecommons.org/publicdomain/zero/1.0/deed.fi'; r.linkkiTeksti = 'Creative Commons CC0 -luovutuksen tiivistelmä suomeksi';
      return r;
    }
    if (/public domain|tekijänoikeusvapaa|tekijänoikeus on rauennut|publicdomain\/mark/i.test(t + ' ' + u)) {
      r.selitys = OIK_SELITYS.vapaa; r.linkki = u || OIK_LAKI; r.linkkiTeksti = u ? 'lähteen omat ehdot' : 'tekijänoikeuslaki Finlexissä';
      return r;
    }
    if (host === 'plato.stanford.edu') { r.selitys = OIK_SELITYS.sep; r.linkki = u; r.linkkiTeksti = 'Stanford Encyclopedia of Philosophyn käyttöehdot (Terms of Use)'; return r; }
    if (/(^|\.)filosofia\.fi$/.test(host)) { r.selitys = OIK_SELITYS.logos; r.linkki = u; r.linkkiTeksti = 'Filosofia.fi:n tekijänoikeussivu'; return r; }
    if (/©|\(c\)|copyright|kaikki oikeudet|all rights reserved|tekijänoikeus/i.test(t)) {
      r.selitys = OIK_SELITYS.kaikki; r.linkki = u || OIK_LAKI; r.linkkiTeksti = u ? 'lähteen omat ehdot' : 'tekijänoikeuslaki Finlexissä';
      return r;
    }
    if (u) { r.linkki = u; r.linkkiTeksti = 'lähteen omat ehdot'; }
    return r;
  }
  // Merkinnän otsikkotaso (käyttäjän säännöt 10.11.2026), tasot sellaisina kuin ne näkyvät (laske, alennukset, pykälät):
  // kohta (h4) on oletus ja kuivan loppuosion (kirjallisuus, lähteet, linkit) alla aina; ilman otsikoita kohta yksin;
  // jos tekstissä on vain yhtä tasoa eikä kuivaa loppua, sama taso (pelkät osiot → osio, pelkät luvut → luku).
  var OIK_KUIVA = /^(wikipedia[- ]artikkelit|wikipedia articles|ensyklopedia logoksen artikkelit|aiheesta muualla|external links|internet-lähteet|verkkolähteet|linkit)$/i;
  function oikeusTaso(otsikot) {
    if (!otsikot.length) return 4;
    var tasot = {}, ylin = 4;
    otsikot.forEach(function (o) { tasot[o.lvl] = 1; ylin = Math.min(ylin, o.lvl); });
    var kuiva = function (o) { return BIB.test(o.nimi) || OHEIS.test(o.nimi) || OIK_KUIVA.test(o.nimi); };
    var ylimmat = otsikot.filter(function (o) { return o.lvl === ylin; });
    if (kuiva(otsikot[otsikot.length - 1]) || kuiva(ylimmat[ylimmat.length - 1])) return 4;
    var lajit = Object.keys(tasot);
    return lajit.length === 1 ? +lajit[0] : 4;
  }

  /* ---------- Rakennetunnisteet ja paikantimet (luurangotus) ----------
     Käyttäjän pyyntö 6.11.2026: tunnistetaan otsikon tai rivin alun rakennetunniste havaintolinsseittäin ja kootaan
     siitä sisällysluettelon kohdalle paikannin, jolla kohtaan voi viitata. tunnus(teksti) → { laji, muoto, arvo, merkki,
     sana, pidetaan, nimi } tai null. Lajit: piste (1.2.3, syv), arabia (1, 1., 1)), pykala (§ 12), rooma (IV), rooma-pieni
     (iv), kirjain (a), kirjain-iso (A), kreikka (α′, β), kreikka-iso (Α′) ja sana (Part II, PT II, Ensimmäinen osa, Luku 3,
     Chapter Three, Erster Teil, Livre premier …). Muoto erottaa saman lajin eri tasot: '.' (IV.), ')' (iv)), '()' ((iv)),
     '' (pelkkä). Yksikirjaiminen I, V, X ja L (myös pienet) on monitulkintainen: vaihto kertoo kirjaintulkinnan, ja
     ratkaiseTulkinnat() valitsee sarjan perusteella (H., I., J. ovat kirjaimia). Roomalaiset numerot vain 1–99, joten C. ja
     D. ovat kirjaimia. */
  function roomaArvo(s) {
    var u = String(s).toUpperCase();
    if (!u || !/^(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(u)) return 0;
    var v = { I: 1, V: 5, X: 10, L: 50, C: 100 }, n = 0;
    for (var i = 0; i < u.length; i++) { var a = v[u[i]], z = v[u[i + 1]] || 0; n += a < z ? -a : a; }
    return n;
  }
  function roomaksi(n) {
    var r = '';
    [[90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(function (x) { while (n >= x[0]) { r += x[1]; n -= x[0]; } });
    return r;
  }
  var KR_AAKKOSET = 'αβγδεζηθικλμνξοπρστυφχψω';
  var KR_LUKU = { 'α': 1, 'β': 2, 'γ': 3, 'δ': 4, 'ε': 5, 'ϛ': 6, 'ς': 6, 'ζ': 7, 'η': 8, 'θ': 9, 'ι': 10, 'κ': 20, 'λ': 30, 'μ': 40, 'ν': 50,
    'ξ': 60, 'ο': 70, 'π': 80, 'ϟ': 90, 'ϙ': 90, 'ρ': 100, 'σ': 200, 'τ': 300, 'υ': 400, 'φ': 500, 'χ': 600, 'ψ': 700, 'ω': 800, 'ϡ': 900 };
  // Kreikkalainen numero (keraialla α′, ιβ′) on lukuarvo; pelkkä kirjain (β.) on aakkosjärjestys.
  function kreikkaArvo(s, keraia) {
    s = s.toLowerCase().replace(/στ/g, 'ϛ');
    if (!keraia && s.length === 1) return KR_AAKKOSET.indexOf(s) + 1;
    var n = 0;
    for (var i = 0; i < s.length; i++) { if (!KR_LUKU[s[i]]) return 0; n += KR_LUKU[s[i]]; }
    return n;
  }
  // Järjestys- ja perusluvut sanoina (suomi, englanti, saksa, ranska, latina).
  var LUKUSANAT = {};
  [['ensimmäinen first erste erster erstes ersten premier première primus prima primum one yksi eins', 1],
    ['toinen second zweite zweiter zweites deuxième seconde secundus secunda secundum two kaksi', 2],
    ['kolmas third dritte dritter drittes troisième tertius tertia tertium three kolme', 3],
    ['neljäs fourth vierte vierter viertes quatrième quartus quarta quartum four neljä', 4],
    ['viides fifth fünfte fünfter fünftes cinquième quintus quinta quintum five viisi', 5],
    ['kuudes sixth sechste sechster sechstes sixième sextus sexta sextum six kuusi', 6],
    ['seitsemäs seventh siebente siebenter siebentes siebte siebter siebtes septième septimus septima septimum seven seitsemän', 7],
    ['kahdeksas eighth achte achter achtes huitième octavus octava octavum eight kahdeksan', 8],
    ['yhdeksäs ninth neunte neunter neuntes neuvième nonus nona nonum nine yhdeksän', 9],
    ['kymmenes tenth zehnte zehnter zehntes dixième decimus decima decimum ten kymmenen', 10],
    ['yhdestoista eleventh elfte elfter elftes onzième eleven', 11], ['kahdestoista twelfth zwölfte zwölfter zwölftes douzième twelve', 12],
    ['kolmastoista thirteenth thirteen', 13], ['neljästoista fourteenth fourteen', 14], ['viidestoista fifteenth fifteen', 15],
    ['kuudestoista sixteenth sixteen', 16], ['seitsemästoista seventeenth seventeen', 17], ['kahdeksastoista eighteenth eighteen', 18],
    ['yhdeksästoista nineteenth nineteen', 19], ['kahdeskymmenes twentieth twenty', 20]
  ].forEach(function (x) { x[0].split(' ').forEach(function (w) { LUKUSANAT[w] = x[1]; }); });
  // Rakennesanat: [muodot, avain, paikantimen esitys]. Esitys '' = sana jätetään paikantimesta pois ja käytetään vain numeroa
  // (luku, chapter, section: Korsgaard 6.2, ei Chapter 6, 2). Muut pysyvät (Osa II, 3b; Book I, Part II; Lecture 3).
  var RAKENNESANAT = [
    ['osa', 'osa', 'Osa'], ['part pt', 'part', 'Part'], ['teil', 'teil', 'Teil'], ['partie', 'partie', 'Partie'], ['pars', 'pars', 'Pars'],
    ['kirja', 'kirja', 'Kirja'], ['book bk', 'book', 'Book'], ['buch', 'buch', 'Buch'], ['livre', 'livre', 'Livre'], ['liber', 'liber', 'Liber'],
    ['nide', 'nide', 'Nide'], ['volume vol', 'volume', 'Vol.'], ['band bd', 'band', 'Bd.'], ['tome', 'tome', 'Tome'],
    ['division', 'division', 'Division'], ['abteilung', 'abteilung', 'Abteilung'], ['jakso', 'jakso', 'Jakso'],
    ['luento', 'luento', 'Luento'], ['lecture', 'lecture', 'Lecture'], ['vorlesung', 'vorlesung', 'Vorlesung'],
    ['meditation', 'meditation', 'Meditation'], ['meditatio', 'meditatio', 'Meditatio'], ['mietiskely', 'mietiskely', 'Mietiskely'],
    ['essay', 'essay', 'Essay'], ['essee', 'essee', 'Essee'], ['kirje', 'kirje', 'Kirje'], ['letter', 'letter', 'Letter'],
    ['liite', 'liite', 'Liite'], ['appendix', 'appendix', 'Appendix'], ['anhang', 'anhang', 'Anhang'], ['annexe', 'annexe', 'Annexe'],
    ['näytös', 'naytos', 'Näytös'], ['act', 'act', 'Act'], ['akt', 'akt', 'Akt'], ['kohtaus', 'kohtaus', 'Kohtaus'], ['scene', 'scene', 'Scene'],
    ['laulu', 'laulu', 'Laulu'], ['canto', 'canto', 'Canto'], ['kysymys', 'kysymys', 'Kysymys'], ['quaestio', 'quaestio', 'Q.'],
    ['question', 'question', 'Question'], ['articulus', 'articulus', 'Art.'], ['article', 'article', 'Article'],
    ['luku', 'luku', ''], ['chapter ch chap', 'chapter', ''], ['kapitel kap', 'kapitel', ''], ['chapitre', 'chapitre', ''],
    ['caput cap', 'caput', ''], ['hauptstück', 'hauptstuck', ''], ['section sect sec', 'section', ''], ['abschnitt', 'abschnitt', ''],
    ['alaluku', 'alaluku', ''], ['kohta', 'kohta', '']
  ];
  var LIITESANAT = /^(liite|appendix|anhang|annexe)$/;
  var RSANA = {};
  RAKENNESANAT.forEach(function (x) { x[0].split(' ').forEach(function (w) { RSANA[w] = { avain: x[1], esitys: x[2] }; }); });
  var RS_SANAT = Object.keys(RSANA).sort(function (a, z) { return z.length - a.length; }).join('|');
  var RS_LUKU = Object.keys(LUKUSANAT).sort(function (a, z) { return z.length - a.length; }).join('|');
  var RS_NUM = '\\d{1,3}|[IVXLivxl]{1,7}|[A-Z]|' + RS_LUKU;
  var EI_KIRJ = '(?![\\p{L}\\p{N}])', EROTIN = '(?:\\s*[:.–—-]\\s*|\\s+|$)';
  // B: Part II, PT II, Chapter 6, Luku kolme, Pars prima. A: Ensimmäinen osa, Erster Teil, The First Part. C: 3. luku, II osa.
  var RE_SANA_B = new RegExp('^(' + RS_SANAT + ')(?:\\.\\s*|\\s+)(' + RS_NUM + ')' + EI_KIRJ + '\\.?' + EROTIN + '(.*)$', 'iu');
  var RE_SANA_A = new RegExp('^(?:the\\s+|der\\s+|die\\s+|das\\s+|le\\s+|la\\s+)?(' + RS_LUKU + ')\\s+(' + RS_SANAT + ')' + EI_KIRJ + '\\.?(?:\\s*[:.–—-]\\s*|$)(.*)$', 'iu');
  var RE_SANA_C = new RegExp('^(\\d{1,3}\\.|[IVXL]{1,7}\\.?)\\s+(' + RS_SANAT + ')' + EI_KIRJ + '\\.?(?:\\s*[:.–—-]\\s*|$)(.*)$', 'iu');
  var RE_PYKALA = /^§§?\s*(\d{1,4}[a-z]?)\.?(?:\s+|$)(.*)$/;
  var RE_PISTE = /^(\d{1,3}(?:\.\d{1,3})+)\.?(?:\s+|$)(.*)$/;
  var RE_ARABIA = /^(\d{1,3})(?:([.):])(?:\s+|$)|\s+(?=\S))(.*)$/;
  var RE_SULUT = /^\((\d{1,3}|[ivxl]{1,7}|[IVXL]{1,7}|[a-z]|[A-Z]|[α-ω]{1,2}|[Α-Ω])\)(?:\s+|$)(.*)$/u;
  var RE_TUNNISTE = /^([ivxl]{1,7}|[IVXL]{1,7}|[a-z]|[A-Z]|[α-ωϛϟϡ]{1,3}|[Α-Ω]{1,3})([ʹ΄'’´′])?([.)])?(?:\s+|$)(.*)$/u;
  function lukuarvo(x) {
    if (/^\d+$/.test(x)) return { arvo: +x, tapa: 'arabia' };
    var l = LUKUSANAT[x.toLowerCase()];
    if (l) return { arvo: l, tapa: 'sana' };
    var r = roomaArvo(x);
    if (r) return { arvo: r, tapa: 'rooma' };
    if (/^[A-Z]$/.test(x)) return { arvo: x.charCodeAt(0) - 64, tapa: 'kirjain' };
    return null;
  }
  function sanaTunnus(sana, num, nimi) {
    var s = RSANA[sana.toLowerCase().replace(/\.$/, '')], a = s && lukuarvo(num);
    if (!a) return null;
    var nn = a.tapa === 'arabia' ? String(a.arvo) : a.tapa === 'rooma' ? num : a.tapa === 'kirjain' ? num : s.esitys ? roomaksi(a.arvo) : String(a.arvo);
    return { laji: 'sana', muoto: '', avain: 'sana:' + s.avain, sana: s.avain, arvo: a.arvo, merkki: s.esitys ? s.esitys + ' ' + nn : nn,
      pidetaan: !!s.esitys, nimi: nimi.trim() };
  }
  function tunnus(teksti) {
    var s = String(teksti || '').replace(/\s+/g, ' ').trim(), m, t;
    if (!s) return null;
    if ((m = RE_SANA_B.exec(s)) && (t = sanaTunnus(m[1], m[2], m[3]))) return t;
    if ((m = RE_SANA_A.exec(s)) && (t = sanaTunnus(m[2], m[1], m[3]))) return t;
    if ((m = RE_SANA_C.exec(s)) && (t = sanaTunnus(m[2], m[1].replace(/\.$/, ''), m[3]))) return t;
    if ((m = RE_PYKALA.exec(s))) return { laji: 'pykala', muoto: '', avain: 'pykala', arvo: parseInt(m[1], 10), merkki: '§ ' + m[1], nimi: m[2].trim() };
    if ((m = RE_PISTE.exec(s))) {
      var o = m[1].split('.');
      return { laji: 'piste', muoto: '', syv: o.length, avain: 'piste' + o.length, arvo: +o[o.length - 1], merkki: m[1], nimi: m[2].trim() };
    }
    if ((m = RE_ARABIA.exec(s))) return { laji: 'arabia', muoto: m[2] || '', avain: m[2] === ')' ? 'arabia)' : 'arabia', arvo: +m[1], merkki: m[1], nimi: m[3].trim() };
    var sulut = RE_SULUT.exec(s), muoto, x, nimi, keraia = '';
    if (sulut) { x = sulut[1]; muoto = '()'; nimi = sulut[2]; }
    else if ((m = RE_TUNNISTE.exec(s))) {
      x = m[1]; keraia = m[2] || ''; muoto = m[3] || ''; nimi = m[4];
      // Ilman välimerkkiä vain pelkkä tunniste (IV) tai monikirjaiminen roomalainen ennen isoa alkukirjainta (IV Johdanto).
      if (!muoto && !keraia && nimi && !(/^[IVXL]{2,}$/.test(x) && /^\p{Lu}/u.test(nimi))) return null;
      if (keraia && /^[a-zA-Z]+$/.test(x)) return null;
    } else return null;
    if (/^\d+$/.test(x)) return { laji: 'arabia', muoto: muoto, avain: 'arabia()', arvo: +x, merkki: '(' + x + ')', nimi: nimi.trim() };
    var kehys = function (y) { return muoto === '()' ? '(' + y + ')' : y; }, r = roomaArvo(x), tn;
    if (/^[Ͱ-Ͽ]+$/.test(x)) {
      var ka = kreikkaArvo(x, !!keraia);
      if (!ka) return null;
      var iso = x !== x.toLowerCase();
      return { laji: iso ? 'kreikka-iso' : 'kreikka', muoto: keraia ? 'ʹ' + muoto : muoto, avain: (iso ? 'kreikka-iso' : 'kreikka') + (keraia ? 'ʹ' : '') + muoto,
        arvo: ka, merkki: kehys(x + (keraia ? 'ʹ' : '')), nimi: nimi.trim() };
    }
    var pieni = x === x.toLowerCase();
    if (x.length === 1) {
      var kirj = { laji: pieni ? 'kirjain' : 'kirjain-iso', muoto: muoto, avain: (pieni ? 'kirjain' : 'kirjain-iso') + muoto,
        arvo: x.toLowerCase().charCodeAt(0) - 96, merkki: kehys(x), nimi: nimi.trim() };
      if (!r) return kirj;
      tn = { laji: pieni ? 'rooma-pieni' : 'rooma', muoto: muoto, avain: (pieni ? 'rooma-pieni' : 'rooma') + muoto, arvo: r, merkki: kehys(x), nimi: nimi.trim(), vaihto: kirj };
      return tn;
    }
    if (!r) return null;
    return { laji: pieni ? 'rooma-pieni' : 'rooma', muoto: muoto, avain: (pieni ? 'rooma-pieni' : 'rooma') + muoto, arvo: r, merkki: kehys(x), nimi: nimi.trim() };
  }
  // Monitulkintaiset I, V, X, L (i, v, x, l): kirjaimia, jos samassa sarjassa (sama kirjainkoko ja muoto) on kiistaton
  // naapurikirjain (H. tai J. ennen I.:tä); muuten roomalaisia (I. ja A. eri tasoilla).
  function ratkaiseTulkinnat(tns) {
    var kirjaimet = {};
    tns.forEach(function (t) { if (t && !t.vaihto && /^kirjain/.test(t.laji)) (kirjaimet[t.avain] = kirjaimet[t.avain] || {})[t.arvo] = 1; });
    return tns.map(function (t) {
      var k = t && t.vaihto && kirjaimet[t.vaihto.avain];
      return k && (k[t.vaihto.arvo - 1] || k[t.vaihto.arvo + 1]) ? t.vaihto : t;
    });
  }
  // Pykäläsarja (käyttäjän sääntö 6.11.2026): Husserlin tapainen lyhyehkö pykälä, pykälämerkillä tai ilman, on hierarkiassa
  // korkeintaan alaluvun alaluku (####), vaikka sillä ei olisi yläotsikoita. Pykälämerkki riittää. Ilman sitä numerosarja
  // (1, 2, 3 …, ei pisteellisiä) on pykäläsarja, kun sen osiot ovat lyhyehköjä (mediaani alle PYK_PITUUS merkkiä), niillä
  // ei ole pisteellisiä alaosioita, numerointi ei ala ylemmän otsikon jälkeen alusta, ja se joko jatkuu ylemmän otsikon
  // yli tai sarjassa on vähintään PYK_MAARA pykälää (käyttäjän linjaus 7.11.2026: oikeita pykäliä on kymmeniä tai satoja, joten
  // Beauvoir-artikkelin 14 numeroitua jaksoa ovat päälukuja, eivät pykäliä; lyhyiden artikkelien jaksot jäävät ennalleen).
  // kohdat: [{ avain, arvo, taso (pienempi = ylempi), massa: oma teksti seuraavaan kohtaan asti }] → { avain: true }
  var PYK_PITUUS = 6000, PYK_MAARA = 30;
  function pykalaSarjat(kohdat) {
    var tulos = {}, sarjat = {};
    kohdat.forEach(function (k, i) {
      if (k.avain === 'pykala') tulos.pykala = true;
      if (k.avain === 'arabia' || k.avain === 'arabia)') (sarjat[k.avain] = sarjat[k.avain] || []).push(i);
    });
    Object.keys(sarjat).forEach(function (a) {
      var S = sarjat[a], massat = [], jatkuu = 0, alkaa = 0, piste = false;
      S.forEach(function (i, j) {
        var m = kohdat[i].massa, yli = false, z = j + 1 < S.length ? S[j + 1] : kohdat.length;
        for (var x = i + 1; x < kohdat.length && kohdat[x].taso > kohdat[i].taso; x++) { m += kohdat[x].massa; if (/^piste/.test(kohdat[x].avain || '')) piste = true; }
        // Raja: ylempi otsikko tai sanallinen yksikkö (Kapitel, Part) millä tasolla tahansa, koska pdf-muunnoksen tasot heittelevät.
        for (x = i + 1; x < z; x++) if (kohdat[x].taso < kohdat[i].taso || /^sana:/.test(kohdat[x].avain || '')) yli = true;
        massat.push(m);
        if (j + 1 < S.length && yli) { if (kohdat[z].arvo === kohdat[i].arvo + 1) jatkuu++; else if (kohdat[z].arvo === 1) alkaa++; }
      });
      massat.sort(function (x, y) { return x - y; });
      if (massat[massat.length >> 1] < PYK_PITUUS && !piste && !alkaa && (jatkuu || S.length >= PYK_MAARA)) tulos[a] = true;
    });
    return tulos;
  }
  var LAJIN_NIMI = { piste: 'pisteelliset numerot', arabia: 'numerot', pykala: 'pykälät', rooma: 'roomalaiset numerot',
    'rooma-pieni': 'pienet roomalaiset numerot', kirjain: 'pienet kirjaimet', 'kirjain-iso': 'isot kirjaimet', kreikka: 'kreikkalaiset numerot',
    'kreikka-iso': 'isot kreikkalaiset numerot', sana: 'sanallinen numerointi', lihava: 'lihavoidut rivit', kursiivi: 'kursivoidut rivit',
    versaali: 'versaalirivit' };
  function lajinKuvaus(t) {
    if (t.laji === 'sana') return 'sanallinen numerointi (' + t.sana + ')';
    var esim = { piste: '1.1', arabia: '1', rooma: 'I', 'rooma-pieni': 'i', kirjain: 'a', 'kirjain-iso': 'A', kreikka: 'α', 'kreikka-iso': 'Α' }[t.laji];
    var m = t.muoto.replace('ʹ', ''), k = t.muoto.indexOf('ʹ') >= 0 ? 'ʹ' : '';
    if (t.laji === 'piste') esim = Array(t.syv + 1).join('1.').slice(0, -1);
    return (LAJIN_NIMI[t.laji] || t.laji) + (esim ? ' ' + (m === '()' ? '(' + esim + k + ')' : esim + k + m) : '');
  }

  // Paikantimet sisällysluettelon kohtiin (käyttäjän pyyntö 6.11.2026). Jos kirjoittaja on numeroinut 4.3.4, se riittää.
  // Muuten paikannin kootaan ylempien tunnisteiden ketjusta (Osa II, 3b), mutta ylempi taso jätetään pois, jos sen alla
  // numerointi jatkuu yli sen rajan: Korsgaardin Fellow Creaturesissa Part II alkaa luvusta 6, joten luvun 6 paikannin on 6.
  // Numeroimaton yläotsikko tulee nimenä eteen (lexikonin hakusana, jonka alla numerointi alkaa alusta).
  function paikat(toc) {
    var pino = [];
    var tns = ratkaiseTulkinnat(toc.map(function (t) { return t.tn; }));
    toc.forEach(function (t, i) {
      if (tns[i]) t.tn = tns[i]; else delete t.tn;
      while (pino.length && toc[pino[pino.length - 1]].lvl >= t.lvl) pino.pop();
      t._yla = pino.length ? pino[pino.length - 1] : -1;
      pino.push(i);
    });
    // Jatkuvuus: saman vanhemman alla peräkkäiset samanlajiset otsikot (P1, P2 …) ja niiden suorat lapset lajeittain.
    var ryhmat = {}, pykLaji = {};
    toc.forEach(function (t) { if (t.pyk && t.tn) pykLaji[t.tn.avain] = 1; });
    toc.forEach(function (t, i) { if (t.tn) (ryhmat[t._yla + '|' + t.tn.avain] = ryhmat[t._yla + '|' + t.tn.avain] || []).push(i); });
    var lapset = {};
    toc.forEach(function (t, i) { if (t.tn && t._yla >= 0) ((lapset[t._yla] = lapset[t._yla] || {})[t.tn.avain] = lapset[t._yla][t.tn.avain] || []).push(t.tn.arvo); });
    Object.keys(ryhmat).forEach(function (k) {
      var P = ryhmat[k], ev = {};
      P.forEach(function (p, j) {
        var L = lapset[p] || {};
        Object.keys(L).forEach(function (lk) {
          var e = ev[lk] = ev[lk] || { jatkuu: 0, alkaa: 0, ed: null };
          var eka = L[lk][0];
          if (e.ed == null) { if (eka > 1) e.jatkuu++; }
          else if (eka === e.ed + 1) e.jatkuu++;
          else if (eka === 1) e.alkaa++;
          e.ed = L[lk][L[lk].length - 1];
        });
      });
      P.forEach(function (p) {
        // Pykälä viitataan ilman ylempiä tasoja (§ 12), ellei numerointi ala alusta.
        Object.keys(ev).forEach(function (lk) { if ((ev[lk].jatkuu || pykLaji[lk]) && !ev[lk].alkaa) (toc[p].tarpeeton = toc[p].tarpeeton || {})[lk] = 1; });
      });
    });
    function sep(ed, o) {
      // Luvuittain alusta alkava pykälä ottaa alaluvun paikan: luvun 5 § 2 on 5.2 (käyttäjän sääntö 6.11.2026).
      if (o.laji === 'pykala' && !ed.otsikko && !ed.pidetaan && /\d$/.test(ed.merkki)) return '.';
      if (ed.otsikko || ed.pidetaan || o.pidetaan || o.laji === 'pykala' || /^(pykala|kreikka-iso)$/.test(ed.laji)) return ', ';
      if (o.muoto === '()') return '';
      if (/\d$/.test(ed.merkki) && o.laji === 'kirjain') return '';
      return '.';
    }
    toc.forEach(function (t, i) {
      if (!t.tn) return;
      var osat = [t.tn], cur = i, j = t._yla;
      while (j >= 0) {
        var P = toc[j];
        if (!P.tn) { if (!P.alas && !t.pyk) osat.unshift({ otsikko: true, merkki: P.text }); break; }
        if (P.tarpeeton && P.tarpeeton[toc[cur].tn.avain]) break;
        // 6.2 sisältää jo luvun 6.
        if (!(toc[cur].tn.laji === 'piste' && toc[cur].tn.merkki.indexOf(P.tn.merkki + '.') === 0)) osat.unshift(P.tn);
        cur = j; j = P._yla;
      }
      var s = '';
      osat.forEach(function (o, k) {
        if (!k) { s = o.merkki; return; }
        var v = sep(osat[k - 1], o);
        s += v + (o.laji === 'pykala' && v === '.' ? o.merkki.replace(/^§\s*/, '') : o.merkki);
      });
      t.paikka = s;
      t.paikkaN = t.tn.laji === 'pykala' && /\.\d+[a-z]?$/.test(s) && !/^§/.test(s) ? s.replace(/^.*\./, '') : t.tn.merkki;
    });
    toc.forEach(function (t) { delete t._yla; });
    // Yhteenveto Latomolle: lajit esiintymisjärjestyksessä, määrä, esimerkki ja jatkuuko alempi numerointi yli rajojen.
    var yht = [], ix = {};
    toc.forEach(function (t) {
      if (!t.tn) return;
      var a = t.tn.avain;
      if (ix[a] == null) { ix[a] = yht.length; yht.push({ avain: a, kuvaus: lajinKuvaus(t.tn), maara: 0, esim: t.tn.merkki, jatkuu: false }); }
      var y = yht[ix[a]];
      y.maara++;
      if (t.tarpeeton) y.jatkuu = true;
    });
    return yht;
  }

  // Paikannin tavoittelee pykälän tarkkuutta (käyttäjän sääntö 6.11.2026). Kun kirja on kattavasti numeroitu D tasolle
  // (D-tasoisia kohtia on vähintään puolessa pääluvuista), lyhyemmän numeron perään tulee nollia: luvun 4 alku on 4.0.0
  // kolmitasoisessa ja 4.0 kaksitasoisessa kirjassa, alaluvun 4.2 alku 4.2.0. Luvuittain alusta alkavat kappaleiden
  // pykälät (§ 1 kappaleen alussa) ottavat alaluvun paikan: luvun 5 § 2 on 5.2. Pykälämerkki, joka ei ala alusta, riittää
  // yksinään (§ 88). Vain kokonaan numeerinen paikannin täydennetään (Osa II, 3b ei).
  function nollat(toc, kohdat) {
    var nro = function (s) { return /^\d+(\.\d+)*$/.test(s || '') ? s.split('.') : null; };
    function osio(b) { var o = null; toc.forEach(function (t) { if (t.b <= b) o = t; }); return o; }
    function polku(b) {
      var p = null;
      for (var i = toc.length - 1; i >= 0; i--) if (toc[i].b <= b) { p = toc[i]; break; }
      if (!p) return null;
      var lvl = p.lvl + 1;
      for (i = toc.indexOf(p); i >= 0; i--) if (toc[i].lvl < lvl) { if (toc[i].paikka) return toc[i]; lvl = toc[i].lvl; }
      return null;
    }
    // Kappaleiden pykälät: nollautuvatko ne (§ 1 myöhemmin kuin suurempi numero)?
    var pyk = kohdat.filter(function (k) { return /^§/.test(k.s); }), nollautuu = false;
    pyk.forEach(function (k, i) { if (i && parseInt(k.n, 10) <= parseInt(pyk[i - 1].n, 10)) nollautuu = true; });
    if (nollautuu) pyk.forEach(function (k) {
      var o = polku(k.b), pn = o && nro(o.paikka);
      if (pn) { k.s = o.paikka + '.' + k.n; k.nro = pn.concat([k.n]); }
      else if (o) k.s = o.paikka + ', § ' + k.n;
    });
    var paat = toc.filter(function (t) { var n = nro(t.paikka); return n && n.length === 1; });
    if (paat.length < 2) return;
    var D = 1;
    for (var d = 2; d <= 4; d++) {
      var c = paat.filter(function (p) {
        return toc.some(function (t) { var n = nro(t.paikka); return n && n.length >= d && n[0] === p.paikka; }) ||
          pyk.some(function (k) { return k.nro && k.nro.length >= d && k.nro[0] === p.paikka; });
      }).length;
      if (c * 2 >= paat.length) D = d; else break;
    }
    if (D < 2) return;
    toc.forEach(function (t) {
      var n = nro(t.paikka);
      if (!n || n.length >= D) return;
      while (n.length < D) n.push('0');
      t.paikka = t.paikkaN = n.join('.');
    });
  }

  /* Latomon luurangotus (käyttäjän pyyntö 6.11.2026): rakennetunnisteelta näyttävät kappaleet otsikoiksi ja otsikkotasot
     tunnisteiden mukaan. Ehdokas on yksirivinen, enintään 100 merkin kappale tai yksikohtainen numeroitu luettelo, jonka
     perässä on tekstiä ja joka ei pääty virkkeen tapaan. Tunnisteellinen ehdokas kelpaa, kun sen lajista on sarja (arvot
     kasvavat yhdellä tai alkavat alusta) tai se on sanallinen (Part II) tai pykälä; tunnisteeton lihavoitu, kursivoitu tai
     versaalirivi, kun niitä on vähintään kaksi ja kunkin perässä on proosaa. Tasot: olemassa olevien otsikoiden lajit
     pitävät järjestyksensä (tasoittain, sitten esiintymisjärjestyksessä); jos samalla #-tasolla on eri lajeja, ne erotetaan.
     Uusi laji asettuu ensiesiintymänsä mukaan ennen ensimmäistä myöhemmin alkavaa lajia, ei kuitenkaan pisteellisten
     numeroiden (1, 1.1, 1.1.1) väliin. Tunnisteeton lihavoitu ja kursivoitu ovat alimpia, versaali ylimmän lajin tasolla.
     Tunnisteettomat otsikot siirtyvät vanhempansa mukana. → { muutokset: [{ ln, vanha, uusi }], lajit: [{ kuvaus, taso,
     maara, esim }], src } */
  function luuranko(src) {
    src = String(src || '').replace(/\r\n?/g, '\n');
    var ek = etukentta(src), V = valmistele(ek.body, ek.ln), tokens = blocksOf(V.L, V.N), rivit = src.split('\n');
    var items = [], t0 = tokens[0] && tokens[0].t === 'h' && tokens[0].lvl === 1 ? 1 : 0;
    function tyyli(x) {
      var m;
      if ((m = /^(\*\*|__)(?!\s)([^*_]+?)\1$/.exec(x))) return { tyyli: 'lihava', sis: m[2] };
      if ((m = /^([*_])(?![\s*_])([^*_]+?)\1$/.exec(x))) return { tyyli: 'kursiivi', sis: m[2] };
      return { tyyli: '', sis: x };
    }
    function proosaa(t) { return t && (t.t === 'p' && plain(t.text).length >= 200 || t.t === 'bq' || t.t === 'list' && t.items.length > 1); }
    // Tunnisteen perässä saa olla myös alempi rakenne (PART I ja heti 1 Luku).
    function rakennetta(t) {
      if (!t) return false;
      if (t.t === 'h') return true;
      var x = t.t === 'p' && t.text.indexOf('\n') < 0 ? t.text : t.t === 'list' && t.items.length === 1 && t.items[0].ord ? rivit[t.ln - 1].trim() : null;
      return x != null && x.length <= 100 && !!tunnus(plain(tyyli(x.trim()).sis).trim());
    }
    for (var i = t0; i < tokens.length; i++) {
      var t = tokens[i], nx = tokens[i + 1];
      if (t.t === 'h') {
        var raw = t.text.replace(/\s+\[[^\]]+\]$/, ''), ty = tyyli(raw.trim()), px = plain(ty.sis).trim();
        items.push({ ln: t.ln, ti: i, h: true, taso: t.lvl === 1 ? 2 : t.lvl, tn: tunnus(px), tyyli: ty.tyyli, teksti: t.text,
          setext: rivit[t.ln - 1] != null && !/^ {0,3}#/.test(rivit[t.ln - 1]) });
        continue;
      }
      var line = null;
      if (t.t === 'p' && t.text.indexOf('\n') < 0) line = t.text;
      else if (t.t === 'list' && t.items.length === 1 && t.items[0].ord && t.items[0].text.indexOf('\n') < 0) line = rivit[t.ln - 1].trim();
      if (line == null || !nx) continue;
      var ty2 = tyyli(line.trim()), p = plain(ty2.sis).trim();
      if (!p || p.length > 100) continue;
      var tn = tunnus(p);
      // Otsikon nimi alkaa isolla (a) jotain on luettelon kohta) eikä pääty virkkeen tapaan.
      if (tn && tn.nimi && (/[.,;:!]$/.test(p) || !/^[\p{Lu}\p{N}"“”«»'‘’(\[]/u.test(tn.nimi))) continue;
      if (!tn && (!ty2.tyyli && !(p === p.toUpperCase() && /\p{Lu}{2,}/u.test(p) && /\p{L}{3,}/u.test(p)) || /[.,;:!?]$/.test(p) || p.length > 80)) continue;
      // Pelkkä tunniste (CHAPTER 6) ja seuraavalla rivillä lyhyt nimi: yhdeksi otsikoksi.
      var yhdista = null;
      if (tn && !tn.nimi && nx.t === 'p' && nx.text.indexOf('\n') < 0 && tokens[i + 2]) {
        var nn = plain(tyyli(nx.text.trim()).sis).trim();
        if (nn && nn.length <= 80 && !/[.,;:!]$/.test(nn) && !tunnus(nn)) yhdista = { ln: nx.ln, teksti: tyyli(nx.text.trim()).sis.trim() };
      }
      var jalkeen = yhdista ? tokens[i + 2] : nx;
      if (!tn && !proosaa(jalkeen)) continue;
      items.push({ ln: t.ln, ti: yhdista ? i + 1 : i, h: false, taso: null, tn: tn, tyyli: tn ? ty2.tyyli : ty2.tyyli || 'versaali', teksti: ty2.sis.trim(), yhdista: yhdista,
        proosa: proosaa(jalkeen) || !!tn && rakennetta(jalkeen) });
      if (yhdista) i++;
    }
    var tns = ratkaiseTulkinnat(items.map(function (x) { return x.tn; }));
    items.forEach(function (x, k) { x.tn = tns[k]; x.avain = x.tn ? x.tn.avain : x.tyyli && (!x.h || x.tyyli === 'kursiivi') ? x.tyyli : ''; });
    // Uusien ehdokkaiden lajit: sarjan näyttö.
    var sarjat = {};
    items.forEach(function (x) { if (x.tn) (sarjat[x.avain] = sarjat[x.avain] || []).push(x); });
    var kelpaa = {};
    Object.keys(sarjat).forEach(function (a) {
      var s = sarjat[a], ok = 0;
      for (var k = 1; k < s.length; k++) if (s[k].tn.arvo === s[k - 1].tn.arvo + 1 || s[k].tn.arvo === 1) ok++;
      var vah = /^(sana|pykala)/.test(a) ? 1 : a === 'arabia' && !s.some(function (x) { return x.tn.muoto; }) ? 3 : 2;
      // Sarjasta ainakin yhden perässä on proosaa (muuten kyse on lyhyistä kohdista, ei otsikoista).
      kelpaa[a] = s.some(function (x) { return x.h; }) || s.length >= vah && (s.length < 2 || ok * 2 >= s.length - 1) && s.some(function (x) { return x.proosa; });
    });
    var tyylit = {};
    items.forEach(function (x) { if (!x.tn && !x.h && x.avain) tyylit[x.avain] = (tyylit[x.avain] || 0) + 1; });
    items = items.filter(function (x) { return x.h || (x.tn ? kelpaa[x.avain] : tyylit[x.avain] >= 2); });
    // Lajien järjestys.
    var eka = {}, tasoNyt = {}, jarj = [];
    items.forEach(function (x, k) {
      if (!x.avain) return;
      if (eka[x.avain] == null) eka[x.avain] = k;
      if (x.h) (tasoNyt[x.avain] = tasoNyt[x.avain] || []).push(x.taso);
    });
    function moodi(a) { var c = {}, b = null; a.forEach(function (v) { c[v] = (c[v] || 0) + 1; if (b == null || c[v] > c[b]) b = v; }); return +b; }
    var vanhat = Object.keys(tasoNyt).filter(function (a) { return a !== 'lihava' && a !== 'kursiivi'; });
    vanhat.sort(function (a, z) { return moodi(tasoNyt[a]) - moodi(tasoNyt[z]) || (/^piste/.test(a) && /^piste/.test(z) ? +a.slice(5) - +z.slice(5) : 0) || eka[a] - eka[z]; });
    jarj = vanhat.slice();
    Object.keys(eka).filter(function (a) { return !tasoNyt[a] && a !== 'lihava' && a !== 'kursiivi' && a !== 'versaali' && !LIITESANAT.test(a.slice(5)); })
      .sort(function (a, z) { return eka[a] - eka[z]; }).forEach(function (a) {
        var k = jarj.findIndex(function (b) { return eka[b] > eka[a]; });
        if (k < 0) k = jarj.length;
        while (k > 0 && k < jarj.length && /^piste/.test(jarj[k]) && /^piste/.test(jarj[k - 1]) || k > 0 && k < jarj.length && jarj[k] === 'arabia' && /^piste/.test(jarj[k + 1] || '')) k++;
        jarj.splice(k, 0, a);
      });
    var perus = vanhat.length ? Math.max(2, Math.min.apply(null, vanhat.map(function (a) { return moodi(tasoNyt[a]); }))) : 2;
    var taso = {};
    jarj.forEach(function (a, k) { taso[a] = Math.min(perus + k, 6); });
    Object.keys(eka).forEach(function (a) { if (LIITESANAT.test(a.slice(5)) && taso[a] == null) taso[a] = perus; });
    if (eka.versaali != null) taso.versaali = perus;
    if (eka.lihava != null) taso.lihava = Math.min(perus + jarj.length, 6);
    // Pykäläsarja on korkeintaan alaluvun alaluku (pykalaSarjat()); sen alla olevat lajit siirtyvät mukana.
    var mitta = function (t) { return t.t === 'p' ? plain(t.text).length : t.t === 'list' ? t.items.reduce(function (a, it) { return a + it.text.length; }, 0) : t.t === 'bq' ? 400 : 0; };
    var pykS = pykalaSarjat(items.map(function (x, k) {
      var m = 0, z = k + 1 < items.length ? items[k + 1].ti : tokens.length;
      for (var j = x.ti + 1; j < z; j++) m += mitta(tokens[j]);
      return { avain: x.avain, arvo: x.tn && x.tn.arvo, taso: x.avain && taso[x.avain] != null ? taso[x.avain] : x.taso || 9, massa: m };
    }));
    jarj.forEach(function (a, k) {
      if (pykS[a]) taso[a] = Math.max(taso[a], 4);
      if (k && taso[a] <= taso[jarj[k - 1]]) taso[a] = Math.min(taso[jarj[k - 1]] + 1, 6);
    });
    // Olemassa olevan otsikon laji siirtyy vain, jos sen #-tasolla on toinenkin laji tai uusi laji asettui sen yläpuolelle.
    var siirto = {};
    vanhat.forEach(function (a) {
      siirto[a] = vanhat.some(function (b) { return b !== a && moodi(tasoNyt[b]) === moodi(tasoNyt[a]); }) ||
        jarj.slice(0, jarj.indexOf(a)).some(function (b) { return !tasoNyt[b]; }) || pykS[a] && moodi(tasoNyt[a]) < taso[a];
    });
    var tormays = {};
    items.forEach(function (x) { if (x.h && x.avain !== 'kursiivi') tormays[x.taso] = 1; });
    // Uudet tasot otsikoille. Tunnisteettomat (ja kursiiviotsikot ilman törmäystä) siirtyvät vanhempansa mukana.
    var ed = [], muutokset = [], uusi = rivit.slice(), poista = {};
    items.forEach(function (x) {
      var L;
      if (x.avain && taso[x.avain] != null && (!x.h || siirto[x.avain])) L = taso[x.avain];
      else if (x.avain === 'kursiivi' && (!x.h || tormays[x.taso])) {
        // Kursiivi on alempi taso kuin edeltävä pystyotsikko (törmäys: sama #-taso kuin pystyillä otsikoilla).
        var e = ed.filter(function (y) { return y.avain !== 'kursiivi'; }).pop();
        L = e ? e.uusi + 1 : perus;
      } else {
        var vanh = null;
        for (var k = ed.length - 1; k >= 0; k--) if (ed[k].h && ed[k].taso < x.taso) { vanh = ed[k]; break; }
        L = x.taso + (vanh ? vanh.uusi - vanh.taso : 0);
      }
      L = Math.max(2, Math.min(L, 6));
      x.uusi = L; ed.push(x);
      if (x.h && L === x.taso) return;
      var vanha = rivit[x.ln - 1], teksti;
      if (x.h) teksti = x.setext ? vanha.trim() : vanha.replace(/^ {0,3}#{1,6}\s*/, '').replace(/\s+#+\s*$/, '');
      else teksti = x.yhdista ? x.teksti + (/[.:)]$/.test(x.teksti) ? ' ' : '. ') + x.yhdista.teksti : x.teksti;
      var r = '#'.repeat(L) + ' ' + teksti;
      uusi[x.ln - 1] = r;
      if (x.h && x.setext && RE_SETEXT.test(rivit[x.ln] || '')) poista[x.ln] = 1;
      if (x.yhdista) { poista[x.yhdista.ln - 1] = 1; if (!(rivit[x.ln] || '').trim()) poista[x.ln] = 1; }
      muutokset.push({ ln: x.ln, vanha: vanha.trim() + (x.yhdista ? ' / ' + rivit[x.yhdista.ln - 1].trim() : ''), uusi: r });
    });
    var lajit = Object.keys(eka).map(function (a) {
      var xs = items.filter(function (x) { return x.avain === a; }), tn = xs[0].tn;
      return { avain: a, kuvaus: tn ? lajinKuvaus(tn) : LAJIN_NIMI[a], taso: moodi(xs.map(function (x) { return x.uusi; })), maara: xs.length,
        esim: plain(xs[0].teksti).slice(0, 60) };
    }).sort(function (a, z) { return a.taso - z.taso || eka[a.avain] - eka[z.avain]; });
    return { muutokset: muutokset, lajit: lajit, src: uusi.filter(function (r, k) { return !poista[k]; }).join('\n') };
  }

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
     ja haettu, samoin Latomon ohjeen pohjan leikattu (Latomon MarkDownload-korvamerkki). Sisennetyt
     jatkorivit (YAML-luettelo) liitetään edelliseen arvoon. Täyttämättä jääneet pohjan muuttujat
     ({byline}) ohitetaan.
     → { meta: yhtenäistetyt avaimet, raaka: alkuperäiset avaimet pienaakkosin, body, ln: rungon ensimmäisen rivin numero } */
  var ALIAS = {
    title: 'otsikko', subtitle: 'alaotsikko', author: 'tekijä', authors: 'tekijä', byline: 'tekijä', tekija: 'tekijä',
    'tekijät': 'tekijä', tekijat: 'tekijä', kirjoittaja: 'tekijä', kirjoittajat: 'tekijä',
    source: 'lähde', url: 'lähde', lahde: 'lähde', link: 'lähde', 'verkko-osoite': 'lähde',
    created: 'haettu', leikattu: 'haettu', clipped: 'haettu', saved: 'haettu', tallennettu: 'haettu', luettu: 'haettu', retrieved: 'haettu', accessed: 'haettu',
    date: 'julkaistu', published: 'julkaistu', 'published_time': 'julkaistu', julkaisupvm: 'julkaistu', 'julkaisupäivä': 'julkaistu',
    site: 'sivusto', sitename: 'sivusto', 'site_name': 'sivusto', 'site-name': 'sivusto', blog: 'sivusto', blogi: 'sivusto',
    type: 'tyyppi', tekstityyppi: 'tyyppi', genre: 'laji', artikkelityyppi: 'laji',
    yhteiso: 'yhteisö', yliopisto: 'yhteisö', university: 'yhteisö', institution: 'yhteisö',
    publisher: 'kustantaja', city: 'paikka', place: 'paikka', kaupunki: 'paikka', kustannuspaikka: 'paikka',
    editor: 'toimittaja', editors: 'toimittaja', toimittajat: 'toimittaja',
    translator: 'suomentaja', 'kääntäjä': 'suomentaja', kaantaja: 'suomentaja',
    pages: 'sivut', series: 'sarja', edition: 'painos', journal: 'teos', container: 'teos', lehti: 'teos', volume: 'numero', issue: 'numero',
    booktitle: 'teos', 'container-title': 'teos', 'publisher-location': 'paikka'
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
        // Erilliset vuosikerta ja numero (hegelin pdf_to_markdown.py, Crossref) yhdeksi: 72:288.
        if (raaka.volume && raaka.issue && !raaka.numero && meta.numero === raaka.volume) meta.numero = raaka.volume + ':' + raaka.issue;
        return { meta: meta, raaka: raaka, body: lines.slice(end + 1).join('\n'), ln: end + 2 };
      }
    }
    return { meta: meta, raaka: raaka, body: src, ln: 1 };
  }

  /* ---------- Päivämäärät ----------
     pvm(teksti) → { y, m, d, h, mi, t } tai null; t on tarkkuus: 1 vuosi, 2 kuukausi, 3 päivä, 4 minuutti.
     Kelpaavat ISO (2026-10-08T14:05), 8.10.2026 (klo 14.05), 8. lokakuuta 2026, lokakuussa 2026,
     lokakuu/2026, 10/2026 (myös 10/26 = lokakuu 2026, vain koko kentän arvona), englanninkieliset kuukaudet ja pelkkä vuosi. Etukenttään tallennetaan ISO
     siihen tarkkuuteen, joka halutaan ilmoittaa (2026-10 = kuukausi). */
  var KK = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'];
  var KK_EN = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var RE_KK = new RegExp('(' + KK.join('|') + ')kuu(?:ssa|ta|n|lla|lle)?', 'i');
  var RE_JULK = /\b(?:first published|published|publication date|last updated|updated|revised|revision|posted|julkaistu|päivitetty|muokattu)\b/i;
  var RE_EN = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';
  function pvmOlio(y, m, d, h, mi) {
    if (!(y >= 1000 && y <= 2999)) return null;
    if (m != null && !(m >= 1 && m <= 12)) m = d = h = null;
    if (d != null && !(d >= 1 && d <= 31)) d = h = null;
    if (h != null && !(h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) h = null;
    var t = h != null ? 4 : d ? 3 : m ? 2 : 1;
    return { y: y, m: m || null, d: t >= 3 ? d : null, h: t === 4 ? h : null, mi: t === 4 ? mi : null, t: t };
  }
  // tiukka: ei kaksinumeroista vuotta (tekstiriveiltä päätellessä 3/14 ei saa tulla maaliskuuksi 2014).
  function pvm(s, tiukka) {
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
    if (!tiukka && (m = /^(\d{1,2})\s*\/\s*(\d{2})$/.exec(s)) && m[1] >= 1 && m[1] <= 12) return pvmOlio(2000 + +m[2], +m[1]);
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
  // Alaotsikko kaksoispisteen jälkeen isolla alkukirjaimella kuten Teologian tyylin esimerkeissä (Hallen pietismin
  // vaikutus …: Teologianhistoriallinen tutkielma). Käyttäjän päätös 28.10.2026; ennen suomenkielinen alaotsikko pienennettiin.
  function nimiOsa(ots, ala) {
    ots = virkkeeksi(String(ots || '').trim()); ala = virkkeeksi(String(ala || '').trim());
    if (!ala) return ots;
    ala = ala.charAt(0).toUpperCase() + ala.slice(1);
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
     Teologian tyylin alaviitemuodot (28.10.2026): kahden tekijän kohtaan viitataan A & B (tai A ja B),
     useamman A et al. (tai A ym.); saman tekijän seuraavat vuodet puolipisteen jälkeen ilman nimeä
     (Allison 1993, 45–46; 2010, 31 / Tuhkanen 2013a; 2013b) linkittyvät kukin omaan kohtaansa.
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
    var kohdat = [], inBib = false, bibTaso = 0, lyhTaso = 0, lyhOts = '', lyh = {}, osioTekija = '', osioTaso = 0, aiheet = {};
    // Viivojen (–––) tekijä on välittömästi edeltävän luettelon kappaleen tekijä, vaikka siltä puuttuisi vuosi
    // (SEP: Robeyns, I., “Is Nancy Fraser’s…” ilman vuotta, perässä –––, 2003 …); muuten viivat periytyivät väärälle.
    var edTekija = null;
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
        if (BIB.test(tx)) { inBib = true; bibTaso = lvl; } else if (inBib && lvl <= bibTaso) inBib = false;
        // Luettelon osio yhden tekijän teoksille (SEP: ### Selected works by Cassirer): kohdat alkavat vuodella.
        var ot = inBib && lvl > bibTaso && RE_OSIOTEKIJA.exec(tx);
        edTekija = null;
        // Osion tekijä periytyy sen alaotsikoille (Dewey: ### A. Works by Dewey → #### Individual works).
        if (inBib && lvl > bibTaso) {
          if (ot) { osioTekija = ot[1]; osioTaso = lvl; aiheet[ot[1]] = 1; }
          else if (!osioTekija || lvl <= osioTaso) osioTekija = '';
        }
        if (lyhTaso && lvl <= lyhTaso) lyhTaso = 0;
        if (!lyhTaso && LYH.test(tx)) { lyhTaso = lvl; lyhOts = tx; }
        return;
      }
      if (lyhTaso) {
        var otsikko = ed && ed.t === 'h' ? ed : null;
        if (t.t === 'p') maarittele(t, t.text, otsikko);
        else if (t.items) t.items.forEach(function (it, j) { maarittele(it, it.text, j === 0 ? otsikko : null); });
      }
      if (!inBib || t.t !== 'p') { if (t.t !== 'p') edTekija = null; return; }
      var tx = plain(t.text).trim();
      var nm = /^([^,(]+?)\s*[,(]/.exec(tx), vm = /\((1[5-9]\d\d[a-z]?|20\d\d[a-z]?|s\.\s?a\.)\)/.exec(tx);
      // SEP:n tapa ilman sulkeita: Kahn, Charles H., 1979, *Teos*; McCarthy, Thomas A., 1978 [1980], …; Ebbighausen,
      // Rolf (ed.), 1976, …; osion *Works by X* kohta vuodella alkaen: 1962 [1989], *Strukturwandel…* (Habermas).
      // Tekijän jälkeinen vuosi voittaa myöhemmän sulkuvuoden (Celikates, Robin and Rahel Jaeggi, 2009 [2017], … (1968) …).
      if (!vm || vm.index > 0) {
        var sa = osioTekija && /^((?:1[5-9]\d\d|20\d\d)[a-z]?)(?=[,.]|\s*\[)/.exec(tx);
        var sv = sa || /^[^*“"(]{0,120}?(?:\s*\((?:eds?|trans|toim|hrsg|hg)\.?\))?[,\s]\s*((?:1[5-9]\d\d|20\d\d)[a-z]?)(?=[,.]|\s*\[)/iu.exec(tx);
        if (sv && (!vm || sv[0].length - sv[1].length < vm.index)) vm = { 1: sv[1], index: sv[0].length - sv[1].length };
      }
      // Tekijätön kohta osiossa *works by X* (alkaa vuodella) ja edellisen kohdan tekijä viivoina (–––, 2013).
      var tekijaton = osioTekija && vm && vm.index === 0, viivat = nm && /^[–—-]{2,}$/.test(nm[1]) && edTekija;
      // Sukunimen perässä pelkät nimikirjaimet ilman pilkkua (Claassen R., 2011): tekijä on sukunimi.
      var nimiOsa = nm && /^(\p{Lu}[\p{L}’'-]+)\s+(?:\p{Lu}\.\s*)+$/u.exec(nm[1]);
      var oma = nm && !viivat && /^\p{Lu}/u.test(nm[1]) ? (nimiOsa ? nimiOsa[1] : nm[1]) : '';
      if (!vm || !tekijaton && !viivat && !oma) {
        edTekija = viivat ? edTekija : oma ? { nimi: oma, suvut: sukunimet(tx.split(/[“"*(]|,\s*(?:1[5-9]\d\d|20\d\d)/)[0].replace(/,?\s*$/, '')) } : null;
        return;
      }
      var nimi = tekijaton ? osioTekija : viivat ? edTekija.nimi : oma;
      var k = { nimi: nimi, vuosi: vuosiAvain(vm[1]), ots: nimi + ' ' + vm[1] };
      k.id = uniq('kirj-' + slug(k.nimi) + '-' + slug(k.vuosi));
      // Kaikkien tekijöiden sukunimet: kaksi tekijää viitataan muodossa A & B, useampi A et al. (Teologian tyyli).
      k.suvut = tekijaton ? [nimi] : viivat ? edTekija.suvut
        : sukunimet(tx.slice(0, vm.index).replace(/,?\s*$/, '').replace(/,?\s*(\(?toim\.\)?|\(eds?\.\))\s*$/i, ''));
      if (nimiOsa && !k.suvut.length) k.suvut = [nimi];
      t.kirja = k;
      kohdat.push(k);
      edTekija = { nimi: k.nimi, suvut: k.suvut };
    });
    var lyhenteet = Object.keys(lyh);
    if (!kohdat.length && !lyhenteet.length) return null;
    var avaimet = {};
    function lisaa(avain, k) { if (avaimet[avain] && avaimet[avain].indexOf(k) >= 0) return; (avaimet[avain] = avaimet[avain] || []).push(k); }
    kohdat.forEach(function (k) {
      lisaa(k.nimi, k);
      var s = k.suvut;
      if (s.length === 2) { lisaa(s[0] + ' & ' + s[1], k); lisaa(s[0] + ' ja ' + s[1], k); lisaa(s[0] + ' and ' + s[1], k); }
      if (s.length > 2) {
        lisaa(s[0] + ' et al.', k); lisaa(s[0] + ' ym.', k);
        // Kolme tekijää myös Oxfordin pilkulla ja and-sanalla (SEP: Gilbert, Kaebnick, & Murray 2012).
        ['& ', ', & ', 'and ', ', and '].forEach(function (v) { lisaa(s.slice(0, -1).join(', ') + (v.charAt(0) === ',' ? v : ' ' + v) + s[s.length - 1], k); });
      }
    });
    // Lyhenne ja paikannin: numeroita (4:429, 6:442–44), painoksen kirjain ja numero (A1/B1) tai
    // roomalainen numero (BXXX).
    var lyhRe = lyhenteet.length ? new RegExp('(^|[^\\p{L}\\p{N}])(' + lyhenteet.sort(function (a, b) { return b.length - a.length; }).map(reEsc).join('|') +
      ')(?![\\p{L}\\p{N}])(?:\\s+\\p{Lu}{0,2}(?:\\d(?:[\\d.:–\\-\\/\\p{Lu}]*\\d)?|[IVXLC]+)(?![\\p{L}\\p{N}]))?', 'gu') : null;
    var re = !kohdat.length ? null : new RegExp('(^|[^\\p{L}\\p{N}])(' + Object.keys(avaimet).sort(function (a, b) { return b.length - a.length; }).map(reEsc).join('|') +
      ')\\s+((?:1[5-9]\\d\\d|20\\d\\d)[a-z]?(?![\\p{L}\\p{N}]|[.:]\\d)|s\\.\\s?a\\.|\\d+(?:[.:]\\d+)*(?![\\p{L}\\p{N}]))', 'gu');

    // Viittaukset tekstistä: { alku, loppu, nimi, tunnus }. Saman tekijän seuraavat vuodet puolipisteen jälkeen
    // ilman nimeä (Allison 1993, 45–46; 2010, 31 / Tuhkanen 2013a; 2013b) ovat omia viittauksiaan samalla nimellä.
    // Paikantimessa ei saa olla versaalia, jottei seuraavan tekijän viittausta lueta jatkoksi.
    var JATKO = /(?:,[^;\p{Lu}]{0,40}?)?;\s*((?:1[5-9]\d\d|20\d\d)[a-z]?|s\.\s?a\.)(?![\p{L}\p{N}])/uy;
    function loyda(teksti) {
      var out = [], m;
      if (!re) return out;
      re.lastIndex = 0;
      while ((m = re.exec(teksti))) {
        var loppu = m.index + m[0].length;
        out.push({ alku: m.index + m[1].length, loppu: loppu, nimi: m[2], tunnus: m[3] });
        if (!VUOSI.test(m[3])) continue;
        var j;
        JATKO.lastIndex = loppu;
        while ((j = JATKO.exec(teksti))) {
          var jl = JATKO.lastIndex;
          out.push({ alku: jl - j[1].length, loppu: jl, nimi: m[2], tunnus: j[1] });
          loppu = jl; JATKO.lastIndex = jl;
        }
        re.lastIndex = Math.max(re.lastIndex, loppu);
      }
      return out;
    }

    // Vuodella viitatut kohdat koko tekstistä (luettelo itse pois).
    var vuodella = {};
    if (re) (function kay(list) {
      list.forEach(function (t) {
        if (t.kirja) return;
        if (t.kids) return kay(t.kids);
        var txt = t.items ? t.items.map(function (it) { return it.text; }).join('\n') : t.text || '';
        loyda(txt).forEach(function (o) {
          if (!VUOSI.test(o.tunnus)) return;
          var v = vuosiAvain(o.tunnus);
          avaimet[o.nimi].forEach(function (k) { if (k.vuosi === v) vuodella[k.id] = 1; });
        });
      });
    })(tokens.concat((lisa || []).map(function (x) { return { t: 'p', text: x }; })));

    // → { k: kohta | null, syy }
    function ratkaise(nimi, tunnus) {
      var ehdokkaat = avaimet[nimi];
      if (VUOSI.test(tunnus)) {
        var v = vuosiAvain(tunnus), sama = ehdokkaat.filter(function (k) { return k.vuosi === v; });
        if (sama.length === 1) return { k: sama[0], syy: 'vuosi' };
        // Yhden tekijän viittaus ei tarkoita usean tekijän kohtaa (Watene 2016 vs. Watene and Drydyk (eds.) 2016).
        var yksin = sama.filter(function (k) { return k.suvut.length <= 1; });
        if (sama.length > 1 && yksin.length === 1 && nimi === yksin[0].nimi) return { k: yksin[0], syy: 'vuosi' };
        if (sama.length) return { k: null, syy: 'Luettelossa on useampi ' + nimi + ' ' + tunnus + '.' };
        var lahella = ehdokkaat.filter(function (k) { return k.vuosi.indexOf(v) === 0; });
        return { k: null, syy: lahella.length ? 'Vuosi on luettelossa vain kirjaimin: ' + lahella.map(function (k) { return k.ots; }).join(', ') + '.'
          : 'Luettelossa ei ole tekijän ' + nimi + ' vuotta ' + tunnus + '.' };
      }
      if (ehdokkaat.length === 1) return { k: ehdokkaat[0], syy: 'ainoa' };
      var jaljella = ehdokkaat.filter(function (k) { return !vuodella[k.id]; });
      if (jaljella.length === 1) return { k: jaljella[0], syy: 'karsinta' };
      return { k: null, syy: jaljella.length
        ? 'Vaihtoehtoja on useita, joihin ei viitata vuodella: ' + jaljella.map(function (k) { return k.ots; }).join(', ') + '.'
        : 'Kaikkiin luettelon kohtiin (' + ehdokkaat.map(function (k) { return k.ots; }).join(', ') + ') viitataan vuodella.' };
    }

    // Alaviitteen tekstin linkitys. Kirjaa tuloksen Latomon raporttiin.
    function linkita(teksti, kirjaa) {
      var osumat = [], out = '', last = 0, m;
      loyda(teksti).forEach(function (o) { osumat.push({ alku: o.alku, loppu: o.loppu, r: ratkaise(o.nimi, o.tunnus) }); });
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
    // Leipätekstin hakasulku- ja kaarisulkuviittaus (SEP: [Heidegger 1929], [Friedman 2000, chap. 7], [Cassirer 1906,
    // 1907a], (Kahn 1960: 238), (Patin 1899; Graham 2002); käyttäjän päätös 6.11.2026 ja huomio 7.11.2026). Vain hakasulkeiden sisältä, sulkujen alusta alkava tekijä ja vuosi, ja vain
    // yksiselitteinen kohta; samaan sulkuun pilkulla tai puolipisteellä erotetut vuodet ja tekijät mukaan.
    // Lyhenteitä ei linkitetä leipätekstissä.
    var HAKA = /\[([^\[\]\n]{3,160})\]|\(([^()\n]{3,160})\)/g, HAKA_VUOSI = /^,\s*((?:1[5-9]\d\d|20\d\d)[a-z]?)(?![\p{L}\p{N}])/u;
    var aiheLista = Object.keys(aiheet), aihe = aiheLista.length === 1 && avaimet[aiheLista[0]] ? aiheLista[0] : '';
    // tila: { syv } kappaleen sulkusyvyys palasta toiseen. inline() antaa tekstin paloina muotoilun välein, joten
    // (*pace* Larmore 1995) tulee kahdessa palassa: kesken jäänyt ja jatkuva sulku luetaan pelkin tekijä–vuosi-osumin.
    function linkitaHaka(teksti, kirjaa, tila) {
      var syv0 = tila && tila.syv || 0, syv = syv0, auki = -1, sulku0 = syv0 ? -1 : 0;
      for (var x = 0; x < teksti.length; x++) {
        var c = teksti.charAt(x);
        if (c === '(' || c === '[') { if (!syv) auki = x; syv++; }
        else if ((c === ')' || c === ']') && syv) { syv--; if (!syv && sulku0 < 0) sulku0 = x; }
      }
      if (tila) tila.syv = syv;
      if (sulku0 < 0) sulku0 = teksti.length;
      if (!re || !/[[()\]]/.test(teksti) && !syv0) return esc(teksti);
      var out = '', last = 0, h;
      function pelkat(alku0, sis) {
        lisaa0(loyda(sis).filter(function (o) { return VUOSI.test(o.tunnus); }), alku0, sis);
      }
      function lisaa0(os, alku0, sis) {
        var kaikki = [];
        os.forEach(function (o) {
          kaikki.push(o);
          var j = o.loppu, m;
          while (VUOSI.test(o.tunnus) && (m = HAKA_VUOSI.exec(sis.slice(j)))) {
            var a = j + m[0].length - m[1].length;
            kaikki.push({ alku: a, loppu: a + m[1].length, nimi: o.nimi, tunnus: m[1] });
            j = a + m[1].length;
          }
        });
        kaikki.sort(function (a, b) { return a.alku - b.alku; }).forEach(function (o) {
          var r = ratkaise(o.nimi, o.tunnus), a = alku0 + o.alku, l = alku0 + o.loppu;
          if (a < last) return;
          kirjaa(teksti.slice(a, l), r);
          if (!r.k) return;
          out += esc(teksti.slice(last, a)) + '<a class="lahde" href="#' + r.k.id + '">' + esc(teksti.slice(a, l)) + '</a>';
          last = l;
        });
      }
      // Edellisestä palasta jatkuva sulku.
      if (syv0) pelkat(0, teksti.slice(0, sulku0));
      HAKA.lastIndex = syv0 ? sulku0 : 0;
      while ((h = HAKA.exec(teksti))) {
        var sis = h[1] || h[2], alku0 = h.index + 1;
        // Vuoden perässä oleva hakasulku on käännöksen tai painoksen vuosi (1981 [1984a: 285], 1988b essay 3 [1992a: 31],
        // 2011 [2012: 58]), ei oma viittaus: 1992a on eri teos kuin käännös.
        if (h[1] && RE_KAANNOS.test(teksti.slice(Math.max(0, h.index - 40), h.index))) continue;
        // Sulkujen alussa tekijä ja vuosi, mahdollisesti vihjesanan jälkeen (see, e.g., cf., ks., vrt.). Ensimmäisen
        // tekijän ei tarvitse olla luettelossa (Hülsz 2013, Long 2013: Long linkittyy).
        var vihje = RE_VIHJE.exec(sis)[0], alku = sis.slice(vihje.length);
        // Artikkelin aiheen oma teos pelkällä vuodella (Habermas: (1983 [1990: 89]), (1992a: 37)): vain kun luettelossa on
        // yksi *Works by X* -osio ja vuoden perässä on käännöksen vuosi tai paikannin; pelkkä (1929) voi olla tapahtuma.
        var paljas = aihe && RE_AIHEVUOSI.test(alku);
        // Kertova viittaus: tekijä suoraan ennen sulkua, sulussa vuosi (Benhabib (1986), Rehg (1991 & 1994), Heath (2014: 843)).
        var ennen = h[2] && RE_KERTOVA_VUOSI.test(sis) && RE_KERTOVA_NIMI.exec(teksti.slice(Math.max(0, h.index - 80), h.index));
        var kertoja = ennen && avaimet[ennen[1]] ? ennen[1] : '';
        // Varmuus tulee luettelon yksiselitteisestä osumasta, ei paikasta sulkujen sisällä (käyttäjän linjaus 7.11.2026, SEP-pesukone).
        var os = loyda(sis).filter(function (o) { return VUOSI.test(o.tunnus); });
        if (kertoja) {
          var km, kre = /(^|[;,&]\s*|\band\s+)((?:1[5-9]\d\d|20\d\d)[a-z]?)(?=[\s,;:)&]|$)/g;
          while ((km = kre.exec(sis))) {
            var ka = km.index + km[1].length, kl = ka + km[2].length;
            if (km.index > 0 && /\p{Lu}[\p{L}’'-]+\s*$/u.test(sis.slice(0, km.index))) continue;
            // Aiheen oma teos samalla vuodella (Kohlberg ([1976a]: 9–49) Habermas-artikkelissa): kumpaakaan ei linkitetä.
            if (paljas && ratkaise(aihe, km[2]).k) continue;
            if (!os.some(function (o) { return o.alku < kl && o.loppu > ka; })) os.push({ alku: ka, loppu: kl, nimi: kertoja, tunnus: km[2] });
          }
        }
        if (paljas) {
          // Puolipisteellä alkavat paljaat vuodet; tekijän perässä oleva puolipistevuosi on saman tekijän (loyda, JATKO).
          var pm, pre = /(^|;\s*)((?:1[5-9]\d\d|20\d\d)[a-z]?)(?=(?:\s+(?:chapter|chap\.|ch\.|essay|part|vol\.)\s*\d+)?(?:\s*\[|:\s*\d))/g;
          while ((pm = pre.exec(sis))) {
            var pa = pm.index + pm[1].length, pl = pa + pm[2].length;
            if (pm.index === 0) { pa = vihje.length; pl = pa + RE_AIHEVUOSI.exec(alku)[1].length; }
            if (kertoja && ratkaise(kertoja, sis.slice(pa, pl)).k) continue;
            if (!os.some(function (o) { return o.alku < pl && o.loppu > pa; })) os.push({ alku: pa, loppu: pl, nimi: aihe, tunnus: sis.slice(pa, pl) });
          }
        }
        if (!os.length) { HAKA.lastIndex = h.index + 1; continue; }
        lisaa0(os, alku0, sis);
      }
      // Seuraavaan palaan jatkuva sulku.
      if (syv && auki >= 0 && auki + 1 >= last) pelkat(auki + 1, teksti.slice(auki + 1));
      return out + esc(teksti.slice(last));
    }
    return { kohdat: kohdat, linkita: linkita, linkitaHaka: linkitaHaka };
  }
  // Luettelon kohdan tekijöiden sukunimet viittauksia varten (nimet() ennallaan, koska viitteen kokoaminen käyttää sitä):
  // nimikirjaimet pois (A. de-Shalit → de-Shalit), ja erillinen pelkkä nimikirjain kertoo kaksiosaisesta sukunimestä
  // (SEP: Padgett Walsh, K. and Lewiston, J. → nimet() lukee Padgett etunimeksi ja K.:n omaksi nimekseen).
  function sukunimet(tx) {
    var n = nimet(tx).slice(), alku = /^(?:\p{Lu}\.\s*)+$/u;
    for (var i = 1; i < n.length; i++) {
      if (n[i].koko && alku.test(n[i].koko) && n[i - 1].suku && n[i - 1].etu && /^\p{Lu}[\p{L}’'-]+$/u.test(n[i - 1].etu)) {
        n[i - 1] = { suku: n[i - 1].etu + ' ' + n[i - 1].suku }; n.splice(i, 1); i--;
      }
    }
    return n.map(function (x) { return x.suku || String(x.koko || '').replace(/^(?:\p{Lu}\.\s*)+/u, ''); }).filter(Boolean);
  }
  var RE_VIHJE = /^(?:(?:see|cf\.?|compare|pace|also|esp\.|especially|e\.\s?g\.|i\.\s?e\.|for (?:example|instance)|ks\.|vrt\.|esim\.|vgl\.|siehe)[\s,]+)*/i;
  var RE_AIHEVUOSI = /^((?:1[5-9]\d\d|20\d\d)[a-z]?)(?=(?:\s+(?:chapter|chap\.|ch\.|essay|part|vol\.)\s*\d+)?(?:\s*\[(?:1[5-9]\d\d|20\d\d)|:\s*\d))/;
  var RE_KAANNOS = /(?:1[5-9]\d\d|20\d\d)[a-z]?(?:\s+(?:chapter|chap\.|ch\.|essay|part|vol\.)\s*\d+)?\s*$/;
  var RE_KERTOVA_VUOSI = /^(?:1[5-9]\d\d|20\d\d)[a-z]?(?=[\s,;:)&]|$)/;
  var RE_KERTOVA_NIMI = /(\p{Lu}[\p{L}’'-]+(?:\s+(?:and|&)\s+\p{Lu}[\p{L}’'-]+|\s+et al\.)?)\s*$/u;
  var RE_HAKA_ALKU = /^\p{Lu}[\p{L}’'-]+(?:\s+(?:and|&|ja|und)\s+\p{Lu}[\p{L}’'-]+|\s+et al\.|\s+ym\.)?\s+(?:1[5-9]\d\d|20\d\d)[a-z]?(?![\p{L}\p{N}])/u;
  var RE_OSIOTEKIJA = /(?:works|writings|schriften|teokset|teoksia)\s+(?:by|of|von)\s+(\p{Lu}[\p{L}’'-]+)\s*$/iu;

  // Otsikkolohkon tietorivi: lyhyitä rivejä. Pitkäriviinen kappale on jo leipätekstiä (verkkoleikkeen johdanto).
  function tietorivi(t) { return t.split('\n').every(function (l) { return l.replace(/\\\s*$|\s+$/, '').length <= 100; }); }

  // Pandocin ^[…]-alaviitteet iA Writerin muotoon [^…] (Latomon ehdotus). Koodi ohitetaan.
  // Lainauksen perään omaksi kappaleekseen tai omaksi lainauksekseen kirjoitettu lähde lainauksen viimeiseksi riviksi
  // pakotetulla rivinvaihdolla (muoto C). Lähteen perässä olevat pelkät kenoviivarivit poistetaan. Latomon ehdotus.
  function lahteetLainaukseen(src) {
    var r = String(src).replace(/\r\n?/g, '\n').split('\n');
    parse(src).lahteet.slice().sort(function (a, b) { return b.ln - a.ln; }).forEach(function (x) {
      var i = x.ln - 1, j = i - 1;
      while (j >= 0 && !r[j].trim()) j--;
      if (j < 0 || !RE_BQ_ALKU.test(r[j])) return;
      var rivi = r[i].replace(RE_BQ_ALKU, '').replace(/\s*(\\|<br\s*\/?>)?\s*$/i, '').trim();
      r[j] = r[j].replace(/\s+$/, '');
      if (!RE_PAKKO.test(r[j])) r[j] += '\\';
      r.splice(j + 1, i + x.rivit - j - 1, '> ' + rivi);
    });
    return r.join('\n');
  }
  var RE_BQ_ALKU = /^ {0,3}> ?/;

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

  /* ---------- Verkkosivun omat alaviitteet ----------
     Käyttäjän pyyntö 30.10.2026: ilmeiset viitenumerot Luinin alaviitteiksi, ainakin SEP:n. Tehdään ennen lohkojäsennystä
     riveittäin, ja rivimäärä säilyy (Latomon huomautusten rivinumerot). Viitemerkki on yläindeksi, jossa on vain numero,
     joko linkkinä tai ilman: ^\[[7](…/notes.html#note-7)\]^ (SEP, Latomon <sup>-muunnos), ^[7](…#fn7)^, ^[7][3]^, ^7^.
     Määritelmä on
     - alaviiteosiossa (otsikossa notes, footnotes, endnotes, alaviitteet, viitteet tai huomautukset, esim. SEP:n Notes-sivun
       leike tekstin perässä) kappale, joka alkaa numerolla: [7.][3] tai [7.](…) (SEP), \[7\], ^7^ tai 7.;
     - tai missä tahansa numeroitu kohta, jossa on paluulinkki (↩ …#fnref7; WordPressin ja Pandocin sivun lopun viitteet).
     Merkki muuttuu muotoon [^viite-7] ja määritelmä muotoon [^viite-7]: …, paluulinkki pois ja jatkokappaleet (myös
     lainaukset) sisennettyinä. Määritelmä muutetaan vain, jos tekstissä on sen merkki. Kokonaan muuttuneen osion otsikko ja
     sitä edeltävä etukenttä (liitetty leike) jäävät pois. Ilman määritelmää linkitetty merkki, jonka osoite on alaviitteen
     (note-7, fn7, footnote-7, endnote-7, cite_note-7, _ftn7), muuttuu alaviitteeksi, joka kertoo tekstin olevan lähteen
     omalla sivulla (SEP:n alaviitteet ovat erillisellä sivulla). Pelkkä ^7^ ilman määritelmää tai numeron perässä (10^2^) jää yläindeksiksi. */
  var RE_VIITEOSIO = /(^|[\s>(])(notes|footnotes|endnotes|alaviitteet|viitteet|loppuviitteet|huomautukset)(?![\p{L}\p{N}])/iu;
  var RE_VIITEOSOITE = /#(?:_?ftn|fn|note|footnote|endnote|cite_note)[-_:]?(\d+)$/i;
  var RE_PALUUOSOITE = /#(?:_?ftnref|fnref|ref|cite_ref|footnote-ref)[-_:]?\d+/i;
  var RE_MERKKI = /\^(\\?\[)?(?:\[(\d{1,3})\](?:\(([^)\s]+)\)|\[([^\]]+)\])|(\d{1,3}))(\\?\])?\^/g;
  var RE_PALUU = /\s*\[(?:↩|↑|\\\^|\^|⏎)︎?\](?:\(([^)\s]*)\)|\[([^\]]+)\])/g;
  function sivunViitteet(body, lahde) {
    var r = body.split('\n'), ref = {}, aita = false, koodi = [];
    r.forEach(function (l, i) {
      if (/^ {0,3}(```|~~~)/.test(l)) { aita = !aita; koodi[i] = 1; return; }
      if (aita) { koodi[i] = 1; return; }
      var m = /^ {0,3}\[([^\]^#%][^\]]*)\]:\s*<?(\S+?)>?(?:\s+.*)?$/.exec(l);
      if (m && !ref[norm(m[1])]) ref[norm(m[1])] = m[2];
    });
    var osoite = function (u, k) { return u || ref[norm(k || '')] || ''; };
    var otsikko = function (l) { return /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(l); };
    var maar = {}, osiot = [];
    function aloitus(l) {
      var m = /^ {0,3}\[(\d{1,3})\.?\](?:\(([^)\s]*)\)|\[([^\]]*)\])\s*(.*)$/.exec(l);
      if (m) return { n: +m[1], loput: m[4] };
      m = /^ {0,3}(?:\\?\[(\d{1,3})\\?\]|\^(\d{1,3})\^|(\d{1,3})\\?[.)])\s+(.*)$/.exec(l);
      return m ? { n: +(m[1] || m[2] || m[3]), loput: m[4] } : null;
    }
    // Alaviiteosiot: otsikosta seuraavaan saman tai ylemmän tason otsikkoon.
    for (var i = 0; i < r.length; i++) {
      var h = !koodi[i] && otsikko(r[i]);
      if (!h || !RE_VIITEOSIO.test(plain(h[2]))) continue;
      var taso = h[1].length, osio = { ots: i, defs: [] }, nyky = null;
      for (var j = i + 1; j < r.length; j++) {
        var hh = !koodi[j] && otsikko(r[j]);
        if (hh && hh[1].length <= taso) break;
        if (koodi[j]) continue;
        var a = (j === i + 1 || !r[j - 1].trim()) && aloitus(r[j]);
        if (a && !maar[a.n]) { nyky = { n: a.n, rivi: j, loput: a.loput, jatko: [], osio: osio }; maar[a.n] = nyky; osio.defs.push(nyky); continue; }
        if (nyky && !/^ {0,3}\[[^\]]+\]:\s*\S/.test(r[j])) nyky.jatko.push(j);
      }
      osio.loppu = j; i = j - 1;
      osiot.push(osio);
    }
    // Numeroitu kohta, jossa on paluulinkki alaviitteen merkkiin.
    r.forEach(function (l, i) {
      if (koodi[i]) return;
      var m = /^ {0,3}(\d{1,3})[.)]\s+(.*)$/.exec(l);
      if (!m || maar[+m[1]]) return;
      var on = false;
      l.replace(RE_PALUU, function (k, u, kk) { if (RE_PALUUOSOITE.test(osoite(u, kk))) on = true; return k; });
      if (on) maar[+m[1]] = { n: +m[1], rivi: i, loput: m[2], jatko: [] };
    });
    // Merkit.
    var kaytetty = {}, muutoksia = 0;
    r.forEach(function (l, i) {
      if (koodi[i] || /^ {0,3}\[[^\]]+\]:/.test(l)) return;
      // Koodin (`…`) sisällä ei muuteta.
      r[i] = l.split(/(`[^`]*`)/).map(function (o) { return o.charAt(0) === '`' ? o : merkit(o, i); }).join('');
    });
    function merkit(l, i) {
      return l.replace(RE_MERKKI, function (k, ava, n, u, kk, paljas, sulk, kohta) {
        // Numeron perässä paljas ^2^ on potenssi (10^2^), ei viitenumero.
        if (!!ava !== !!sulk || paljas && /\d/.test(l[kohta - 1] || '')) return k;
        n = +(n || paljas);
        var d = maar[n], url = (n && !paljas) ? osoite(u, kk) : '';
        if (d && d.rivi !== i) { kaytetty[n] = 1; muutoksia++; return '[^viite-' + n + ']'; }
        var vm = url && RE_VIITEOSOITE.exec(url.replace(/\\(.)/g, '$1'));
        if (!vm) return k;
        try { url = new URL(url.replace(/\\(.)/g, '$1'), lahde || undefined).href; } catch (e) {}
        muutoksia++;
        return '[^Alaviitteen ' + n + ' teksti on lähteen omalla sivulla, jota ei ole tässä tekstissä: ' + url + ']';
      });
    }
    if (!muutoksia) return body;
    // Määritelmät, joiden merkki on tekstissä.
    Object.keys(maar).forEach(function (n) {
      var d = maar[n];
      if (!kaytetty[n]) return;
      r[d.rivi] = '[^viite-' + n + ']: ' + d.loput.replace(RE_PALUU, '');
      d.jatko.forEach(function (j) { if (r[j].trim()) r[j] = '    ' + r[j].replace(/^ {0,3}(?:>\s?)+/, '').replace(RE_PALUU, ''); });
      d.valmis = true;
    });
    // Kokonaan muuttunut osio: otsikko ja sitä edeltävä liitetyn leikkeen etukenttä pois.
    osiot.forEach(function (o) {
      if (!o.defs.length || !o.defs.every(function (d) { return d.valmis; })) return;
      for (var j = o.ots + 1; j < o.loppu; j++) {
        if (!r[j].trim() || /^ {0,3}\[[^\]]+\]:/.test(r[j]) || /^ {4}/.test(r[j])) continue;
        return;
      }
      r[o.ots] = '';
      var k = o.ots - 1;
      while (k > 0 && !r[k].trim()) k--;
      if (k > 0 && /^---\s*$/.test(r[k])) {
        var a = k - 1;
        while (a >= 0 && /^[\p{L}\p{N}_-]+\s*:/u.test(r[a])) a--;
        if (a >= 0 && a < k - 1 && /^---\s*$/.test(r[a])) for (var x = a; x <= k; x++) r[x] = '';
      }
    });
    return r.join('\n');
  }

  /*
    parse(md) → {
      meta: etukentän avaimet yhtenäistettyinä (viite, osoite, otsikko, tekijä, julkaistu, sivusto …), raaka,
      title, sub, lines (tietorivit), author, year, kehys: alaotsikon paikalla näkyvä blogin nimi tai kokoelma,
      tiedot: lähdetiedot (KENTAT; etukenttä ohittaa tekstistä päätellyn), paatelty: tekstistä päätelty
        (otsikko, alaotsikko, tekijä, julkaistu), viite: etukentän viite tai tiedoista koottu,
      toc: [{ lvl 1–3, id, num, text, b, alas: pääluku ladottu alalukuna }], notes, blocks, html, warnings: [{ ln, msg, puuttuu?, taso? }],
      viittaukset: alaviitteiden lähdeviittaukset ja lyhenteet [{ ln, teksti, kohde: luettelon kohta, lyhenne tai '', syy }],
      kuvia, sisennettyKoodi: sisennyksestä syntyneet koodilohkot [{ ln, rivit }]
    }
  */
  function parse(src) {
    src = String(src || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var res = { meta: {}, raaka: {}, title: '', sub: '', lines: [], author: '', year: '', toc: [], notes: 0, blocks: 0, html: '', warnings: [], lahteet: [],
      viittaukset: [], tiedot: {}, paatelty: {}, viite: '', kuvia: 0, sisennettyKoodi: [], kehys: '' };
    var ek = etukentta(src);
    res.meta = ek.meta; res.raaka = ek.raaka;
    var lahdeU = String(ek.meta['lähde'] || '').trim();
    var V = valmistele(sivunViitteet(ek.body, /^https?:\/\//i.test(lahdeU) ? lahdeU : ''), ek.ln);
    V.W.forEach(function (w) { res.warnings.push(w); });
    var curLn = 0;
    // xref(): ristiviittauksen rivinumero varoitusta varten (viittaus ratkaistaan vasta lopuksi).
    var refs = { fn: V.fn, link: V.link, cite: V.cite, meta: Object.assign({}, ek.raaka, ek.meta), xref: function () { return curLn; },
      lahde: /^https?:\/\//i.test(lahdeU) ? sivunAvain(lahdeU) : '' };

    function warn(msg, lisa) { var w = { ln: curLn, msg: msg }; for (var k in lisa) w[k] = lisa[k]; res.warnings.push(w); }
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
    // Leipäteksti: hakasulkuviittaukset kirjallisuusluettelon kohtiin (ei luettelossa itsessään eikä otsikoissa).
    var leipa = { note: note, br: false, warn: warn, refs: refs, syv: 0, cite: function (t) { return vt ? vt.linkitaHaka(t, kirjaa, leipa) : esc(t); } };
    var metaCtx = { note: note, br: true, warn: warn, refs: refs };
    function blk(tag, cls, md, c, id) {
      if (c === leipa) leipa.syv = 0;
      return '<' + tag + (cls ? ' class="' + cls + '"' : '') + (id ? ' id="' + id + '"' : '') + ' data-b="' + (b++) + '">' + inline(md, c || ctx) + '</' + tag + '>';
    }

    var tokens = blocksOf(V.L, V.N), html = '', t0 = 0, m = res.meta, head = '';
    var maaritelmat = [];
    [V.fn, V.cite].forEach(function (o) { Object.keys(o).forEach(function (k) { maaritelmat.push(o[k].text); }); });
    vt = viittaukset(tokens, uniq, maaritelmat);

    // Kehys: blogin nimi tai kaunokirjallisen tekstin kokoelma näkyy alaotsikon paikalla, jos alaotsikkoa ei ole
    // (käyttäjän päätös 22.10.2026). Tieteellisen tekstin lehti tai kokoomateos jää tietoriville.
    function alaotsikkoon(tx) { return /^\*(?!\*)([\s\S]+?)\*$/.exec(tx) || /^_(?!_)([\s\S]+?)_$/.exec(tx); }
    // Kursivoitu julkaisutieto otsikon alla (SEP: *First published Thu Nov 1, 2018; substantive revision Sun Mar 31,
    // 2024*) on tietorivi eikä alaotsikko.
    function julkRivi(t) { return RE_JULK.test(t) && !!pvm(t, true); }
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
    var auth = '', jp = null, tietoRaaka = [], kirja = {}, metaKohta = -1, julkJp = null;
    if (tokens[0] && tokens[0].t === 'h' && tokens[0].lvl === 1) {
      curLn = tokens[0].ln;
      res.title = plain(tokens[0].text);
      head = '<header class="tt">' + blk('h1', '', tokens[0].text);
      t0 = 1;
      while (t0 < tokens.length && tokens[t0].t === 'p') {
        var tx = tokens[t0].text.trim();
        curLn = tokens[t0].ln;
        var em = alaotsikkoon(tx);
        if (em && !res.sub && em[1].indexOf('*') < 0 && !julkRivi(plain(em[1]))) {
          res.sub = plain(em[1]);
          head += blk('p', 'sub', em[1]);
        } else if (tietorivi(tx)) {
          lisaaKehys();
          if (metaKohta < 0) metaKohta = head.length;
          tx.split('\n').forEach(function (l) {
            l = l.replace(/\\[ \t]*$/, '').trim();
            if (plain(l).trim()) { res.lines.push(plain(l).trim()); tietoRaaka.push(l); }
          });
          head += blk('p', 'meta', tx, metaCtx);
        } else break;
        t0++;
      }
    }
    // Tekstistä päätellyt tiedot: tekijä on tietorivi, jossa on 2–4 isolla alkavaa sanaa; julkaisuaika tarkin
    // tietoriveiltä löytyvä päiväys (lokakuussa 2026, 8.10.2026). ISBN-, ISSN- ja DOI-numerot ja osoitteet eivät
    // ole päiväyksiä (ISBN 978-3-031-01929-6 luettiin kesäkuuksi 1929).
    // Painetun teoksen tietorivit (pdf:n muunnos): DOI 10.… ja Paikka: Kustantaja vuosi.
    res.lines.forEach(function (l) {
      if (/^\p{Lu}[\p{L}'’.-]+(\s+\p{Lu}[\p{L}'’.-]*){1,3}$/u.test(l)) auth = l;
      var p = pvm(l.replace(/\b(?:ISBN|ISSN|e-?ISSN|DOI)(?:-1[03])?:?\s*\S+/gi, '').replace(/\b(?:https?:\/\/|doi:|10\.\d{4,9}\/)\S+/gi, ''), true);
      if (p && (!jp || p.t > jp.t)) jp = p;
      // Julkaisutiedon rivillä luettu versio on myöhäisin päiväys (Teologian tyyli: kirjoitus- tai päivitysaika).
      if (julkRivi(l)) l.split(/;|\s+(?:and|ja)\s+/).forEach(function (o) {
        var q = pvm(o, true);
        if (q && (!julkJp || q.y * 1e4 + (q.m || 0) * 100 + (q.d || 0) > julkJp.y * 1e4 + (julkJp.m || 0) * 100 + (julkJp.d || 0))) julkJp = q;
      });
      var doi = /(?:\bdoi:?\s*|doi\.org\/)(10\.\d{4,9}\/[^\s"<>]+)/i.exec(l);
      if (doi && !kirja.doi) kirja.doi = doi[1].replace(/[.,;)\]]+$/, '');
      var pk = /^(\p{Lu}[\p{L}.'’-]*(?:\s\p{Lu}[\p{L}.'’-]*){0,2}):\s+(\p{Lu}[^:;]{1,80}?),?\s+(1[5-9]\d\d|20\d\d)\b/u.exec(l);
      if (pk && !kirja.paikka) { kirja.paikka = pk[1]; kirja.kustantaja = pk[2]; }
    });
    // Tekijä, *Teos: alaotsikko*. -rivi: tekijä, ja jos #-otsikko on teoksen lyhyt nimi (Müller, *Kantianism for
    // Animals*), otsikko ja alaotsikko koko nimestä.
    tietoRaaka.forEach(function (l) {
      var n = /^(\p{Lu}[\p{L}'’.-]*(?:\s+[\p{L}'’.-]+){1,4}),\s+\*([^*]+)\*\.?$/u.exec(l);
      if (!n || kirja.koko) return;
      if (!auth) auth = n[1];
      kirja.koko = plain(n[2]).trim();
      var ly = /^([^,]+),\s+(.+)$/.exec(res.title);
      if (ly && ly[1] === n[1].split(/\s+/).pop() && kirja.koko.indexOf(ly[2]) === 0) {
        var oa = /^(.+?):\s+(.+)$/.exec(kirja.koko);
        kirja.otsikko = oa ? oa[1] : kirja.koko;
        if (oa && !res.sub) kirja.alaotsikko = oa[2];
      }
    });
    res.paatelty = { otsikko: kirja.otsikko || res.title, alaotsikko: kirja.alaotsikko || res.sub, 'tekijä': auth,
      julkaistu: julkJp ? pvmIso(julkJp) : jp ? pvmIso(jp) : '', paikka: kirja.paikka || '', kustantaja: kirja.kustantaja || '', doi: kirja.doi || '' };
    // Otsikko ja tietorivit etukentästä, jos tekstissä ei ole niitä (verkkoleike, Latomon kentät, pelkkä teksti).
    if (!head && m.otsikko) {
      head = '<header class="tt">' + blk('h1', '', m.otsikko) + (m.alaotsikko ? blk('p', 'sub', m.alaotsikko) : '');
      lisaaKehys();
    } else if (head && !res.sub && m.alaotsikko && !res.lines.length) head += blk('p', 'sub', m.alaotsikko);
    else if (head && !res.sub) lisaaKehys();
    if (!kehysTehty) kehys = '';
    // Pelkkä julkaisutieto tekstissä: etukentän tekijä sen edelle, kuten ilman tietorivejä.
    if (head && res.lines.length && m['tekijä'] && res.lines.every(julkRivi)) {
      var tk = String(m['tekijä']).trim();
      head = head.slice(0, metaKohta) + blk('p', 'meta', tk, metaCtx) + head.slice(metaKohta);
      res.lines.unshift(tk);
    }
    if (head && !res.lines.length) {
      var tr = tietorivit(m, kehys);
      if (tr.length) { head += blk('p', 'meta', tr.join('\n'), metaCtx); res.lines = tr; }
    }
    if (head) html += head + '</header>';
    else res.warnings.push({ ln: tokens[0] ? tokens[0].ln : 1, msg: 'Teksti ei ala #-otsikolla: nimeksi tulee ensimmäinen otsikko tai tiedoston nimi.' });

    var inBib = false, bibTaso = 0, nums = [], numTaso = 0, lyhOhjaus = {}, xrefKohde = {}, tocPaikka = false, jaksoAlkaa = false, kohtaEhd = [];
    // Sivuseikkojen pääluvut alalukuina (sivuLuvut()); osion alaotsikot laskevat mukana.
    (function () {
      var kohdat = [], hs = [];
      for (var i = t0; i < tokens.length; i++) {
        var t = tokens[i];
        if (t.t === 'h') {
          var tn = tunnus(plain(t.text.replace(/\s+\[[^\]]+\]$/, '')).trim());
          kohdat.push({ avain: tn && tn.avain, arvo: tn && tn.arvo, taso: t.lvl === 1 ? 2 : t.lvl, massa: 0 }); hs.push(t);
        } else if (kohdat.length) kohdat[kohdat.length - 1].massa += t.t === 'p' ? plain(t.text).length : t.t === 'list' ? t.items.reduce(function (a, it) { return a + it.text.length; }, 0) : t.t === 'bq' ? 400 : 0;
      }
      var tns = ratkaiseTulkinnat(kohdat.map(function (k) { return k.avain ? { avain: k.avain } : null; }));
      var pyk = pykalaSarjat(kohdat);
      kohdat.forEach(function (k, i) { if (tns[i] && pyk[k.avain]) hs[i].pykala = true; });
    })();
    var alas = sivuLuvut(tokens, t0);
    alas.forEach(function (i) {
      tokens[i].alas = true;
      for (var j = i + 1; j < tokens.length && !(tokens[j].t === 'h' && tokens[j].lvl <= 2); j++) if (tokens[j].t === 'h') tokens[j].alas = true;
    });
    // Ylin taso jää käyttämättä (pilotti, käyttäjän päätös 7.11.2026): kun tekstissä on korkeintaan kaksi otsikkotasoa ja
    // luvuiksi tulisi yli 10 otsikkoa (SEP:n Beauvoirin 14), kaikki otsikot ladotaan tasoa alempana: luvut osioiksi ja osiot
    // kohdiksi. Sivuseikkojen alennus (sivuLuvut()) perutaan, joten kirjallisuusluettelo on osio muiden rinnalla.
    var laske = (function () {
      var tasot = {}, ylimmat = 0;
      for (var i = t0; i < tokens.length; i++) {
        var t = tokens[i];
        if (t.t !== 'h') continue;
        var l = t.pykala ? 4 : t.lvl === 1 ? 2 : Math.min(t.lvl, 4);
        tasot[l] = 1;
        if (l === 2 && !t.alas) ylimmat++;
      }
      return Object.keys(tasot).length <= 2 && !(tasot[3] && tasot[4]) && ylimmat > LUKUJA_ENINTAAN;
    })();
    res.laskettu = laske;
    bibLuku(tokens, t0).forEach(function (i) { tokens[i].bibLuku = true; });
    // Tekijänoikeusmerkintä loppuun vasta tasojen laskennan jälkeen, joten se ei muuta muiden otsikoiden tasoja eikä
    // lohkojen numeroita (kirjanmerkit).
    var oik = oikeudet(m);
    if (oik) {
      var nakyvat = [];
      for (var oi = t0; oi < tokens.length; oi++) {
        var ot = tokens[oi];
        if (ot.t !== 'h') continue;
        var o0 = ot.lvl === 1 ? 2 : Math.min(ot.lvl, 4), ol = ot.alas && !laske ? Math.min(o0 + 1, 4) : o0;
        if (ot.pykala) o0 = ol = 4;
        if (laske) ol = Math.min(o0 + 1, 4);
        if (ot.bibLuku) ol = o0;
        nakyvat.push({ lvl: ol, nimi: lukuNimi(ot.text.replace(/\s+\[[^\]]+\]$/, '')) });
      }
      var oln = tokens.length ? tokens[tokens.length - 1].ln : 1, suojaa = function (x) { return x.replace(/[\\`*_[\]<>#|~^=$]/g, '\\$&'); };
      tokens.push({ t: 'h', lvl: oikeusTaso(nakyvat), text: 'Tekijänoikeudet', ln: oln, oik: true });
      tokens.push({ t: 'p', text: '*Merkintä lähteessä:* ' + suojaa(oik.koodi), ln: oln, oik: true });
      if (oik.selitys) tokens.push({ t: 'p', text: oik.selitys, ln: oln, oik: true });
      // Osoite kirjoitettuna (käyttäjän linjaus 10.11.2026): verkkolinkit ovat oletuksena pois, joten pelkkä linkkiteksti
      // ei kertoisi, mistä lisätiedot löytyvät. Paljas osoite on linkki vain verkkolinkit päällä.
      if (oik.linkki) tokens.push({ t: 'p', text: 'Lisätietoja: ' + suojaa(oik.linkkiTeksti) + ' osoitteessa <' + oik.linkki.replace(/[<>\s]/g, encodeURIComponent) + '>', ln: oln, oik: true });
      res.oikeudet = oik;
    }
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
            var lc = it.lyhId ? ctx : leipa;
            leipa.syv = 0;
            var sisalto = tm ? '<span class="ruutu' + (tm[1] === ' ' ? '' : ' tehty') + '" aria-hidden="true"></span>' + inline(it.text.slice(tm[0].length), lc) : inline(it.text, lc);
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
      list.forEach(function (t, k) {
        curLn = t.ln;
        if (t.t === 'h') {
          // Otsikkotasoja on neljä: # nimi, ## pääluku, ### alaluku, #### alaluvun alaluku.
          if (t.lvl > 4) warn('Otsikkotasoja on neljä (# – ####): ' + '#'.repeat(t.lvl) + ' näkyy ####-otsikkona.');
          var lvl0 = t.lvl === 1 ? 2 : Math.min(t.lvl, 4), lvl = t.alas && !inQuote && !laske ? Math.min(lvl0 + 1, 4) : lvl0;
          // Pykälä on korkeintaan alaluvun alaluku (pykalaSarjat()).
          if (t.pykala && !inQuote) lvl0 = lvl = 4;
          if (laske && !inQuote) lvl = Math.min(lvl0 + 1, 4);
          if (t.bibLuku && !inQuote) lvl = lvl0;
          if (t.oik) lvl0 = lvl = t.lvl;
          // iA Writerin ristiviittauksen nimiö otsikon perässä: # Otsikko [Nimiö]
          var htext = t.text, nimio = /^(.*\S)\s+\[([^\]]+)\]$/.exec(htext);
          if (nimio) htext = nimio[1];
          var txt = plain(htext, { link: refs.link }).trim();
          var nm = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/.exec(txt), tn = inQuote ? null : tunnus(txt);
          var id, cls = 'sec';
          if (nm && t.pykala && !inQuote) {
            // Pykäläsarja ei kuulu lukujen numerointiin (eikä sen tarkistukseen): se jatkuu lukujen yli.
            id = 'luku-' + nm[1].split('.').join('-');
          } else if (nm) {
            id = 'luku-' + nm[1].split('.').join('-');
            var parts = nm[1].split('.').map(Number), d = parts.length - 1, prevN = nums[d] || 0;
            // Tunnisteellisen yläotsikon (Part II, Kirja 3) alla luvut saavat alkaa alusta tai jatkua (Korsgaard: Part II alkaa luvusta 6).
            if (jaksoAlkaa && d === 0 && parts[0] === 1) prevN = 0;
            jaksoAlkaa = false;
            // Ylemmän tason otsikko puuttuu, jos alaluku aloittaa seuraavan luvun (2.7 → 3.1 ilman 3:a; MarkDownload-leike).
            var yla = d > 0 && parts[d] === 1 && parts[d - 1] === (nums[d - 1] || 0) + 1 &&
              parts.slice(0, d - 1).join('.') === nums.slice(0, d - 1).join('.');
            if (yla) {
              var pn = parts.slice(0, d).join('.');
              warn((d === 1 ? 'Pääluvun ' : 'Alaluvun ') + pn + ' otsikko puuttuu: ' + nm[1] + ' alkaa ilman sitä.',
                { puuttuu: pn, taso: t.lvl - 1 });
            } else if (parts[d] !== prevN + 1 || (d > 0 && parts[d - 1] !== nums[d - 1])) {
              warn('Otsikon numero ' + nm[1] + ' ei jatka edellistä numerointia.');
            }
            nums = parts.slice();
            numTaso = lvl0 - d;
          } else {
            // Numeroimaton otsikko numeroitujen yläpuolella aloittaa uuden numeroinnin: lexikonin jokainen hakusana (##)
            // numeroi omat väliotsikkonsa (### 1 …) alusta (käyttäjän pyyntö 4.11.2026). Saman tason numeroimaton
            // (## Kirjallisuus numeroitujen lukujen välissä) ei katkaise.
            if (numTaso && lvl0 < numTaso) { if (tn) jaksoAlkaa = true; else { nums = []; numTaso = 0; } }
            id = slug(txt);
            // Muu tunniste (Part II, a), § 12) on numero siinä missä 2.1: ei versaalikursiivia.
            if (lvl >= 3 && !tn) cls += ' caps';
          }
          id = uniq(id);
          if (BIB.test(txt)) { inBib = true; bibTaso = lvl0; } else if (inBib && lvl0 <= bibTaso || t.oik) inBib = false;
          (t.lyhIds || []).forEach(function (i) { lyhOhjaus[i] = id; });
          // Viittauksen kohde: nimiö, otsikko sellaisenaan ja numeroidusta otsikosta myös pelkkä nimi.
          [nimio && nimio[2], txt, nm && nm[2]].forEach(function (x) { if (x && !xrefKohde[norm(x)]) xrefKohde[norm(x)] = id; });
          var te = { lvl: lvl - 1, id: id, num: nm ? nm[1] : '', text: txt, b: b, alas: !laske && lvl !== lvl0 || undefined, laskettu: laske && !t.bibLuku || undefined, bibLuku: t.bibLuku && !inQuote || undefined };
          if (tn) te.tn = tn;
          if (t.pykala && !inQuote) te.pyk = true;
          res.toc.push(te);
          h += '<h' + lvl + ' id="' + id + '" class="' + cls + '" data-b="' + (b++) + '">' + inline(htext, ctx) + '</h' + lvl + '>';
        } else if (t.t === 'p') {
          if (/(^|\s)\$\$|(^|\s)\$[^\s$][^$\n]*[^\s$\\]\$(?=$|[\s.,;:!?)])/.test(t.text) && !res.matikka) {
            res.matikka = true; warn('Matematiikkaa ($…$) ei ladota: lausekkeet näkyvät sellaisinaan.');
          }
          // Pykälä tai pisteellinen numero kappaleen alussa (§ 12. …, Tractatus 6.54 …) on kohtamerkki: paikannin kappaleen tarkkuudella.
          var km = !inQuote && !inBib && /^(?:§§?\s*(\d{1,4}[a-z]?)|(\d{1,3}(?:\.\d{1,3})*))(?=[.\s])/.exec(plain(t.text.slice(0, 40)).trim());
          if (km) kohtaEhd.push({ b: b, s: km[1] ? '§ ' + km[1] : km[2], n: km[1] || km[2], pyk: !!km[1], piste: !!km[2] && km[2].indexOf('.') > 0 });
          h += blk('p', inBib && !inQuote ? 'bib' : '', t.text, inBib || t.lyhId ? null : leipa, t.kirja && !inQuote ? t.kirja.id : t.lyhOts ? '' : t.lyhId || '');
          // Lainauksen perään erilliseksi kappaleeksi kirjoitettu lähde (perässä voi olla pelkkiä kenovivarivejä).
          var tr = t.text.split('\n');
          if (!inQuote && list[k - 1] && list[k - 1].t === 'bq' && lahdeRivi(tr[0]) && tr.slice(1).every(function (x) { return RE_TYHJA_BR.test(x); }))
            res.lahteet.push({ ln: t.ln, rivit: tr.length });
        } else if (t.t === 'hr') {
          h += '<hr>';
        } else if (t.t === 'bq') {
          var lh = !inQuote && lainauksenLahde(t.kids);
          if (lh) {
            // Lähteellinen lainaus; otsikon jälkeen ennen leipätekstiä se on motto (käyttäjän päätös 27.10.2026).
            var ed = list[k - 1], motto = !ed || ed.t === 'h' || ed.motto;
            t.motto = motto;
            h += '<figure class="lainaus' + (motto ? ' motto' : '') + '"><blockquote>' + render(lh.kids, true) + '</blockquote>';
            curLn = lh.ln;
            h += blk('figcaption', '', lh.text) + '</figure>';
          } else h += '<blockquote>' + render(t.kids, true) + '</blockquote>';
          if (!inQuote && list[k - 1] && list[k - 1].t === 'bq' && !lh && t.kids.length === 1 && t.kids[0].t === 'p' && lahdeRivi(t.kids[0].text))
            res.lahteet.push({ ln: t.kids[0].ln, rivit: 1 });
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
    res.tunnisteet = paikat(res.toc);
    // Kohtamerkit vasta sarjasta: vähintään kaksi pykälää tai kolme pisteellistä numeroa (luvut 1, 2 … vain niiden seurana).
    var pyk = kohtaEhd.filter(function (k) { return k.pyk; }), pis = kohtaEhd.filter(function (k) { return k.piste; });
    res.kohtamerkit = (pyk.length >= 2 ? pyk : []).concat(pis.length >= 3 ? kohtaEhd.filter(function (k) { return !k.pyk; }) : [])
      .sort(function (a, z) { return a.b - z.b; }).map(function (k) { return { b: k.b, s: k.s, n: k.n }; });
    nollat(res.toc, res.kohtamerkit);
    res.kohtamerkit.forEach(function (k) { delete k.nro; });

    html = html.replace(/href="#(lyh-[^"]*)"/g, function (x, i) { return lyhOhjaus[i] ? 'href="#' + lyhOhjaus[i] + '"' : x; });
    // Ristiviittaukset otsikkoon tai nimiöön; ratkaisematon jää tekstiksi.
    html = html.replace(new RegExp('<a href="#' + XREF + '([^"' + XREF + ']*)' + XREF + '(\\d+)">([\\s\\S]*?)</a>', 'g'), function (x, k, ln, sis) {
      var id = xrefKohde[unesc(k)];
      if (id) return '<a href="#' + id + '">' + sis + '</a>';
      res.warnings.push({ ln: +ln, msg: 'Viittauksen ”' + unesc(sis.replace(/<[^>]+>/g, '')) + '” kohdetta ”' + unesc(k) + '” ei löydy (ei viitelinkkiä eikä otsikkoa).' });
      return sis;
    });
    // Tekstin omaan sivuun osoittavat linkit (SEP: oma sisällys, ristiviittaukset …/dewey/#Meta): ankkuri otsikoksi, jos jokin
    // linkki ankkuriin on otsikon nimi (sisällysluettelo antaa kaikille), tai linkin tekstissä on luvun numero (section 3.4).
    // Muuten linkki jää verkkolinkiksi (käyttäjän pyyntö 30.10.2026: sisäisistä linkeistä Luinin sisäisiä).
    var RE_SISA = new RegExp('<a((?: class="[^"]*")?) href="' + SISA + '([^"' + SISA + ']*)' + SISA + '([^"' + SISA + ']*)' + SISA + '">([\\s\\S]*?)</a>', 'g');
    var ankkuri = {}, idt = {};
    res.toc.forEach(function (t) { idt[t.id] = 1; });
    var nimi = function (sis) { return norm(unesc(sis.replace(/<[^>]+>/g, ''))); };
    html.replace(RE_SISA, function (x, c, a, h, sis) { var id = xrefKohde[nimi(sis)]; if (id && !ankkuri[a]) ankkuri[a] = id; return x; });
    html = html.replace(RE_SISA, function (x, c, a, h, sis) {
      var id = idt[unesc(a)] ? unesc(a) : ankkuri[a], nm = !id && /(?:^|[^\d.])(\d+(?:\.\d+)*)(?![\d.]*\d)/.exec(nimi(sis));
      if (!id && nm && idt['luku-' + nm[1].split('.').join('-')]) id = 'luku-' + nm[1].split('.').join('-');
      return '<a' + (id ? '' : c) + ' href="' + (id ? '#' + id : h) + '">' + sis + '</a>';
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
    // HTML-merkinnöistä yksi huomautus riviä kohden: taulukko antaisi muuten huomautuksen jokaisesta tagista.
    var HTMLV = 'HTML-merkintä näkyy tekstinä: “', html = {};
    res.warnings = res.warnings.filter(function (w) {
      if (w.msg.indexOf(HTMLV) !== 0) return true;
      var r = html[w.ln];
      if (!r) { html[w.ln] = { w: w, n: 1, tagit: [] }; r = html[w.ln]; } else r.n++;
      var t = /^<\/?([a-zA-Z][\w-]*)/.exec(w.msg.slice(HTMLV.length));
      if (t && r.tagit.indexOf(t[1].toLowerCase()) < 0) r.tagit.push(t[1].toLowerCase());
      return r.w === w;
    });
    Object.keys(html).forEach(function (k) {
      var r = html[k];
      if (r.n > 1) r.w.msg = r.n + ' HTML-merkintää näkyy tekstinä: ' + r.tagit.slice(0, 6).map(function (t) { return '<' + t + '>'; }).join(', ') + (r.tagit.length > 6 ? ' …' : '') + '.';
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
  // Lähdeluettelo (.bib) ei tavuta lainkaan (Teologian tyyli ja APA 7: ei tavutusta, ei tavuviivaa DOI:hin eikä
  // osoitteisiin); ylipitkä sana katkeaa ilman viivaa (overflow-wrap: anywhere).
  var OHITA = 'h1,h2,h3,h4,h5,h6,.sub,.meta,.bib,strong,th,caption,figcaption,em,code,pre,a,.fnref,.fnnum,.luin-ui';
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

  root.LuinMD = { parse: parse, tunnus: tunnus, luuranko: luuranko, etukentta: etukentta, arvaaViite: arvaaViite, kokoaViite: kokoaViite, KENTAT: KENTAT,
    tyyppiAvain: tyyppiAvain, avain: avain, pvm: pvm, pvmMuoto: pvmMuoto, pvmIso: pvmIso, tekijat: tekijat, nimet: nimet,
    iaAlaviitteet: iaAlaviitteet, lahteetLainaukseen: lahteetLainaukseen, plain: plain, slug: slug, OHEIS: OHEIS, tavurajat: tavurajat, tavuta: tavuta, tavutaDOM: tavutaDOM, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
