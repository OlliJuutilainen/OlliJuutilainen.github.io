/*
  Luin: Markdownista lukimen HTML:ksi. Yhteinen luin.html:lle ja Latomolle (luin/latomo.html).

  Konventiot ovat käyttäjän aiempien md → html -muunnosten mukaiset (ks. luin/ohje.md,
  "Merkintäkieli"):
  - Ensimmäinen #-otsikko on teoksen nimi. Sen ja ensimmäisen ##-otsikon välissä pelkästä
    kursiivista koostuva kappale on alaotsikko (.sub), muut kappaleet tietoriveja (.meta),
    joissa rivinvaihdot säilyvät.
  - Numeroitu otsikko (## 2. …, ### 2.1 …) saa tunnisteen luku-2 / luku-2-1. Numeroimaton
    ###-otsikko on versaali kursiivi (.caps), tunnisteena nimestä tehty lyhenne.
  - ^[…] on alaviite: numeroitu sivuhuomio (label.fnref + input.fntoggle + span.sidenote).
  - ## Kirjallisuus (tai Lähteet tms.) tekee seuraavista kappaleista riippuvasisennettyjä (.bib)
    seuraavaan ##-otsikkoon asti.
  - Jokainen tekstilohko (otsikko, kappale, lainauksen kappale, luettelon kohta) saa
    järjestysnumeron data-b. Kirjanmerkit ja alleviivaukset ankkuroidaan siihen.
  Raakaa HTML:ää ei päästetä läpi: kaikki escapoidaan.
*/
(function (root) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function unesc(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  }

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

  // Korostuksen loppumerkki: n kappaletta merkkiä c, ei välilyönnin perässä.
  // Alaviitteet ja koodi ohitetaan, jottei niiden sisällä oleva * sulje ulompaa korostusta.
  function findClose(s, from, c, n) {
    for (var k = from; k < s.length; k++) {
      var ch = s[k];
      if (ch === '\\') { k++; continue; }
      if (ch === '`') { var e = s.indexOf('`', k + 1); if (e > 0) { k = e; continue; } }
      if (ch === '^' && s[k + 1] === '[') { var f = closeBracket(s, k + 1); if (f > 0) { k = f; continue; } }
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

  // Rivinsisäinen merkintä. ctx: { note(body) → html | null, br: rivinvaihto <br>:ksi, warn(msg) }
  function inline(s, ctx) {
    var out = '', buf = '', i = 0;
    function flush() { out += ctx.cite ? ctx.cite(buf) : esc(buf); buf = ''; }
    while (i < s.length) {
      var c = s[i];
      if (c === '\\' && i + 1 < s.length) {
        var nx = s[i + 1];
        if (nx === '\n') { flush(); out += '<br>'; i += 2; continue; }
        if (/[\\`*_\[\]()#+\-.!^>~|{}]/.test(nx)) { buf += nx; i += 2; continue; }
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
      if (c === '`') {
        var ce = s.indexOf('`', i + 1);
        if (ce > i) { flush(); out += '<code>' + esc(s.slice(i + 1, ce)) + '</code>'; i = ce + 1; continue; }
      }
      if (c === '[') {
        var be = closeBracket(s, i);
        if (be > 0 && s[be + 1] === '(') {
          var pe = s.indexOf(')', be + 2);
          var href = pe > 0 ? s.slice(be + 2, pe).trim().split(/\s+/)[0] : '';
          if (href && !/^(javascript|data|vbscript):/i.test(href)) {
            flush();
            out += '<a href="' + esc(href) + '">' + inline(s.slice(i + 1, be), { note: null, br: false, warn: ctx.warn }) + '</a>';
            i = pe + 1; continue;
          }
        }
      }
      if (c === '<') {
        var am = /^<(https?:\/\/[^\s>]+)>/.exec(s.slice(i));
        if (am) { flush(); out += '<a href="' + esc(am[1]) + '">' + esc(am[1]) + '</a>'; i += am[0].length; continue; }
        if (/^<\/?[a-zA-Z][^>]*>/.test(s.slice(i)) && ctx.warn) ctx.warn('HTML-merkintä näkyy tekstinä: “' + s.slice(i, i + 30) + '”');
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

  // Lohkotason jäsennys: [{t, ln, …}]
  function blocksOf(lines, base) {
    var out = [], i = 0;
    function isH(l) { return /^ {0,3}#{1,6}(\s|$)/.test(l); }
    function isHr(l) { return /^ {0,3}([-*_])( *\1){2,} *$/.test(l); }
    function isBq(l) { return /^ {0,3}>/.test(l); }
    function isFence(l) { return /^ {0,3}(```|~~~)/.test(l); }
    var olRe = /^ {0,3}(\d{1,9})[.)](?:\s+|$)/, ulRe = /^ {0,3}[-*+](?:\s+|$)/;
    while (i < lines.length) {
      var l = lines[i], ln = base + i;
      if (!l.trim()) { i++; continue; }
      if (isFence(l)) {
        var f = l.trim().slice(0, 3), body = [];
        i++;
        while (i < lines.length && lines[i].trim().slice(0, 3) !== f) body.push(lines[i++]);
        i++;
        out.push({ t: 'pre', ln: ln, text: body.join('\n') }); continue;
      }
      if (isH(l)) {
        var hm = /^ {0,3}(#{1,6})\s*(.*?)\s*#*\s*$/.exec(l);
        out.push({ t: 'h', ln: ln, lvl: hm[1].length, text: hm[2] }); i++; continue;
      }
      if (isHr(l)) { out.push({ t: 'hr', ln: ln }); i++; continue; }
      if (isBq(l)) {
        var q = [], q0 = i;
        while (i < lines.length && lines[i].trim() && isBq(lines[i])) q.push(lines[i++].replace(/^ {0,3}> ?/, ''));
        out.push({ t: 'bq', ln: ln, kids: blocksOf(q, base + q0) }); continue;
      }
      var om = olRe.exec(l);
      if (om || ulRe.test(l)) {
        var re = om ? olRe : ulRe, items = [];
        while (i < lines.length) {
          var li = lines[i];
          if (re.test(li)) { items.push({ ln: base + i, text: li.replace(re, '') }); i++; continue; }
          if (!li.trim()) {
            var k = i + 1;
            while (k < lines.length && !lines[k].trim()) k++;
            if (k < lines.length && re.test(lines[k])) { i = k; continue; }
            break;
          }
          if (isH(li) || isHr(li) || isBq(li) || isFence(li) || olRe.test(li) || ulRe.test(li)) break;
          items[items.length - 1].text += '\n' + li.trim(); i++;
        }
        out.push({ t: om ? 'ol' : 'ul', ln: ln, start: om ? parseInt(om[1], 10) : 1, items: items }); continue;
      }
      var p = [l.replace(/^\s+/, '')];
      i++;
      while (i < lines.length && lines[i].trim() && !isH(lines[i]) && !isHr(lines[i]) && !isBq(lines[i]) && !isFence(lines[i])) {
        p.push(lines[i++].replace(/^\s+/, ''));
      }
      out.push({ t: 'p', ln: ln, text: p.join('\n') });
    }
    return out;
  }

  // Etukenttä: --- avain: arvo --- tiedoston alussa. → { meta, body, ln: rungon ensimmäisen rivin numero }
  function etukentta(src) {
    src = String(src || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var lines = src.split('\n'), meta = {};
    if (lines[0] === '---') {
      var end = -1;
      for (var k = 1; k < Math.min(lines.length, 60); k++) if (lines[k] === '---') { end = k; break; }
      var fm = end > 0 ? lines.slice(1, end) : [];
      if (end > 0 && fm.every(function (l) { return !l.trim() || /^[A-Za-zÅÄÖåäö_-]+\s*:/.test(l); })) {
        fm.forEach(function (l) {
          var m = /^([^:]+):\s*(.*)$/.exec(l);
          if (m) meta[m[1].trim().toLowerCase()] = m[2].trim().replace(/^(["'])(.*)\1$/, '$2');
        });
        return { meta: meta, body: lines.slice(end + 1).join('\n'), ln: end + 2 };
      }
    }
    return { meta: meta, body: src, ln: 1 };
  }

  // Lähdeviitteen arvaus otsikkolohkosta: "Sukunimi, Etunimi (vuosi). *Nimi: alaotsikko*."
  // Suomen kirjallisuusluettelon tapaan kaksoispisteen jälkeen pieni alkukirjain. Versaalein
  // kirjoitettu nimi muutetaan virkekirjoitukseksi, mikä hävittää erisnimien isot kirjaimet
  // ensimmäistä sanaa lukuun ottamatta: siksi Latomo näyttää arvauksen muokattavana.
  function arvaaViite(d) {
    var a = (d.author || '').trim(), p = a.split(/\s+/);
    var tekija = p.length > 1 ? p[p.length - 1] + ', ' + p.slice(0, -1).join(' ') : a;
    var t = d.title || '';
    if (t && t === t.toUpperCase()) t = t.charAt(0) + t.slice(1).toLowerCase();
    var s = d.sub ? ': ' + d.sub.charAt(0).toLowerCase() + d.sub.slice(1) : '';
    return (tekija ? tekija + ' ' : '') + (d.year ? '(' + d.year + '). ' : '') + '*' + t + s + '*.';
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
  function viittaukset(tokens, uniq) {
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
    })(tokens);

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

  /*
    parse(md) → {
      meta: etukentän avaimet (viite, osoite, otsikko, tekijä, vuosi …),
      title, sub, lines (tietorivit), author, year,
      toc: [{ lvl 1–3, id, num, text, b }], notes, blocks, html, warnings: [{ ln, msg }],
      viittaukset: alaviitteiden lähdeviittaukset ja lyhenteet [{ ln, teksti, kohde: luettelon kohta, lyhenne tai '', syy }]
    }
  */
  function parse(src) {
    src = String(src || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var res = { meta: {}, title: '', sub: '', lines: [], author: '', year: '', toc: [], notes: 0, blocks: 0, html: '', warnings: [], viittaukset: [] };
    var ek = etukentta(src), lines = ek.body.split('\n'), base = ek.ln;
    res.meta = ek.meta;

    var curLn = 0;
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
      var inner = inline(body, { note: null, br: false, warn: warn, cite: vt ? cite : null });
      return '<label class="fnref" for="fn' + n + '">' + n + '</label>' +
        '<input type="checkbox" class="fntoggle" id="fn' + n + '">' +
        '<span class="sidenote" data-n="' + n + '"><span class="fnnum">' + n + '</span>' + inner + '</span>';
    }
    var ctx = { note: note, br: false, warn: warn };
    function blk(tag, cls, md, c, id) {
      return '<' + tag + (cls ? ' class="' + cls + '"' : '') + (id ? ' id="' + id + '"' : '') + ' data-b="' + (b++) + '">' + inline(md, c || ctx) + '</' + tag + '>';
    }

    var tokens = blocksOf(lines, base), html = '', t0 = 0;
    vt = viittaukset(tokens, uniq);

    // Otsikkolohko
    if (tokens[0] && tokens[0].t === 'h' && tokens[0].lvl === 1) {
      curLn = tokens[0].ln;
      res.title = plain(tokens[0].text);
      var head = '<header class="tt">' + blk('h1', '', tokens[0].text);
      t0 = 1;
      while (t0 < tokens.length && tokens[t0].t === 'p') {
        var tx = tokens[t0].text.trim();
        curLn = tokens[t0].ln;
        var em = /^\*(?!\*)([\s\S]+?)\*$/.exec(tx) || /^_(?!_)([\s\S]+?)_$/.exec(tx);
        if (em && !res.sub && em[1].indexOf('*') < 0) {
          res.sub = plain(em[1]);
          head += blk('p', 'sub', em[1]);
        } else {
          tx.split('\n').forEach(function (l) { if (l.trim()) res.lines.push(plain(l).trim()); });
          head += blk('p', 'meta', tx, { note: note, br: true, warn: warn });
        }
        t0++;
      }
      html += head + '</header>';
    } else {
      res.warnings.push({ ln: tokens[0] ? tokens[0].ln : 1, msg: 'Teksti ei ala #-otsikolla: nimeksi tulee ensimmäinen otsikko tai tiedoston nimi.' });
    }

    var inBib = false, nums = [], lyhOhjaus = {};
    function render(list, inQuote) {
      var h = '';
      list.forEach(function (t) {
        curLn = t.ln;
        if (t.t === 'h') {
          // Otsikkotasoja on neljä: # nimi, ## pääluku, ### alaluku, #### alaluvun alaluku.
          if (t.lvl > 4) warn('Otsikkotasoja on neljä (# – ####): ' + '#'.repeat(t.lvl) + ' näkyy ####-otsikkona.');
          var lvl = t.lvl === 1 ? 2 : Math.min(t.lvl, 4);
          var txt = plain(t.text).trim();
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
          res.toc.push({ lvl: lvl - 1, id: id, num: nm ? nm[1] : '', text: txt, b: b });
          h += '<h' + lvl + ' id="' + id + '" class="' + cls + '" data-b="' + (b++) + '">' + inline(t.text, ctx) + '</h' + lvl + '>';
        } else if (t.t === 'p') {
          if (/^!\[/.test(t.text)) warn('Kuvia ei tueta: “' + t.text.slice(0, 40) + '”');
          if (/^\|.*\|\s*$/m.test(t.text)) warn('Taulukoita ei tueta; rivit näkyvät tekstinä.');
          h += blk('p', inBib && !inQuote ? 'bib' : '', t.text, null, t.kirja && !inQuote ? t.kirja.id : t.lyhOts ? '' : t.lyhId || '');
        } else if (t.t === 'hr') {
          h += '<hr>';
        } else if (t.t === 'bq') {
          h += '<blockquote>' + render(t.kids, true) + '</blockquote>';
        } else if (t.t === 'ol' || t.t === 'ul') {
          h += t.t === 'ol' ? '<ol class="enum"' + (t.start !== 1 ? ' start="' + t.start + '"' : '') + '>' : '<ul class="luettelo">';
          t.items.forEach(function (it) { curLn = it.ln; h += blk('li', '', it.text, null, it.lyhOts ? '' : it.lyhId || ''); });
          h += t.t === 'ol' ? '</ol>' : '</ul>';
        } else if (t.t === 'pre') {
          h += '<pre data-b="' + (b++) + '"><code>' + esc(t.text) + '</code></pre>';
        }
      });
      return h;
    }
    html += render(tokens.slice(t0), false);

    res.html = html.replace(/href="#(lyh-[^"]*)"/g, function (m, i) { return lyhOhjaus[i] ? 'href="#' + lyhOhjaus[i] + '"' : m; });
    res.blocks = b;
    var m = res.meta;
    if (m.otsikko) res.title = m.otsikko;
    var auth = '';
    res.lines.forEach(function (l) {
      if (/^\p{Lu}[\p{L}'’.-]+(\s+\p{Lu}[\p{L}'’.-]*){1,3}$/u.test(l)) auth = l;
    });
    res.author = m['tekijä'] || m.tekija || auth;
    var ym = /\b(1[5-9]\d\d|20\d\d)\b/.exec(res.lines.join(' '));
    res.year = m.vuosi || (ym ? ym[1] : '');
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
  var OHITA = 'h1,h2,h3,h4,em,code,pre,a,.fnref,.fnnum,.luin-ui';
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

  root.LuinMD = { parse: parse, etukentta: etukentta, arvaaViite: arvaaViite, plain: plain, slug: slug, tavurajat: tavurajat, tavuta: tavuta, tavutaDOM: tavutaDOM, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
