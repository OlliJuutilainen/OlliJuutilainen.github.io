/* Sanaselityssivun muut sanakirjat (LuinSanakirjat): Logeion, Wörterbuchnetz, Digital Pāḷi Dictionary ja Kölnin
   sanskritsanakirjat (Monier-Williams) sekä sanakirjavalikon lähteet ja termipankin perusmuoto (termipankki itse on moottorissa,
   sanaselitys.js). Vain luin/sanaselitys.html käyttää tätä; lukimen selitysikkuna on pelkkä Wiktionary. Kaikki haut ovat selaimesta suoraan (CORS sallittu, mitattu), vain haun lähetyksestä.
   Jokainen lähde arvaa perusmuodon itse, joten sivu toimii ilman Wiktionaryakin: Logeion jäsentää muodon (Morpheus), DPD
   tuntee taivutusmuodot, DPD ja Köln löytävät diakriitittä kirjoitetun, ja Wörterbuchnetzin ja termipankin ehdokkaat tulevat
   päätesäännöistä (perusmuodot()), jotka lähde itse todentaa: vain olemassa oleva hakusana kelpaa. Kun Wiktionary on päällä,
   sivu antaa sen perusmuodot lisäehdokkaiksi (sanat[]). Lataus ?v=<SHA-1:n alku> kuten md.js (md-testi.js tarkistaa). */
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  function ekaPieni(s) { var a = Array.from(s); return a.length ? a[0].toLowerCase() + a.slice(1).join('') : s; }
  function ekaIso(s) { var a = Array.from(s); return a.length ? a[0].toUpperCase() + a.slice(1).join('') : s; }
  function taita(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ').trim(); }
  function haeJson(u, opt) {
    return fetch(u, opt).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function haeTeksti(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
  }
  // Sama pyyntö kerran istunnossa; epäonnistunut unohtuu, jotta uusi haku yrittää uudelleen.
  var VARASTO = {};
  function muisti(avain, f) {
    if (!VARASTO[avain]) { VARASTO[avain] = f(); VARASTO[avain].catch(function () { delete VARASTO[avain]; }); }
    return VARASTO[avain];
  }
  /* Haettu muoto näkyy osion otsikon alla vain, kun osuma ei ole mikään haetuista sanoista: Wiktionaryn kanssa sen perusmuoto
     on jo otsikossa muotoineen, eikä sama rivi toistu jokaisessa osiossa. */
  function haettuNakyviin(sanat, osuma) {
    return sanat.some(function (s) { return taita(s) === taita(osuma); }) ? '' : sanat[0];
  }
  function kirjaimisto(s) {
    return /\p{Script=Greek}/u.test(s) ? 'kreikka' : /\p{Script=Devanagari}/u.test(s) ? 'devanagari' : /\p{Script=Latin}/u.test(s) ? 'latina' : '';
  }
  function puretut(s) { var t = document.createElement('textarea'); t.innerHTML = s; return t.value; }

  /* Vieras HTML turvalliseksi: vain teksti, kursiivi ja lihavointi kappaleittain. Lohkot (p, div, li, td, br, otsikot)
     aloittavat uuden kappaleen; linkit ovat tekstiä (Luin ei ole selain); skriptit, tyylit, kuvat ja napit pois. */
  var LOHKO = /^(P|DIV|LI|UL|OL|BR|TR|TD|TH|TABLE|H[1-6]|BLOCKQUOTE|DL|DT|DD|SECTION|ENTRY|SENSE)$/;
  function kappaleet(html, karsi) {
    var d = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html'), juuri = d.body.firstChild, out = [], nyt = '';
    if (karsi) karsi(juuri);
    function katko() { if (nyt.replace(/<[^>]*>/g, '').trim()) out.push(nyt.trim()); nyt = ''; }
    (function kay(n) {
      [].forEach.call(n.childNodes, function (c) {
        if (c.nodeType === 3) { nyt += esc(c.nodeValue.replace(/\s+/g, ' ')); return; }
        if (c.nodeType !== 1 || /^(SCRIPT|STYLE|IMG|SVG|BUTTON|AUDIO|VIDEO|INPUT|SELECT|TEXTAREA|NOSCRIPT)$/.test(c.tagName)) return;
        var lohko = LOHKO.test(c.tagName), t = /^(I|EM)$/.test(c.tagName) ? 'i' : /^(B|STRONG)$/.test(c.tagName) ? 'b' : '';
        if (lohko) katko();
        if (t) nyt += '<' + t + '>';
        kay(c);
        if (t) nyt += '</' + t + '>';
        if (lohko) katko();
      });
    })(juuri);
    katko();
    return out.map(function (k) { return k.replace(/<(i|b)>\s*<\/\1>/g, '').replace(/\s+([,.;:)])/g, '$1'); }).filter(function (k) { return k.replace(/<[^>]*>/g, '').trim(); });
  }
  function kappaleHtml(k, raja) {
    return k.slice(0, raja || k.length).map(function (x) { return '<p class="sx-p">' + x + '</p>'; }).join('');
  }
  /* Perusmuotoehdokkaat päätesäännöillä (ilman Wiktionarya). Ehdokkaita saa olla liikaa: lähde kelpuuttaa vain olemassa
     olevan hakusanan. Järjestys on etusija: sana itse, sitten lyhyet pudotukset. */
  var FI_LIITE = /(kin|kaan|kään|han|hän|pa|pä|ko|kö|ni|si|nsa|nsä|mme|nne)$/;
  var FI_PAATE = ['issa', 'issä', 'ista', 'istä', 'illa', 'illä', 'ilta', 'iltä', 'ille', 'iksi', 'ihin', 'iden', 'itten', 'seen', 'siin',
    'ssa', 'ssä', 'sta', 'stä', 'lla', 'llä', 'lta', 'ltä', 'lle', 'ksi', 'tta', 'ttä', 'jen', 'ien', 'ita', 'itä', 'ina', 'inä',
    'hin', 'han', 'hen', 'hon', 'hun', 'hyn', 'hän', 'hön', 'na', 'nä', 'ja', 'jä', 'ia', 'iä', 'en', 'in', 'n', 't', 'a', 'ä'];
  // Astevaihtelu heikosta vahvaan vartalon lopussa (rannan → ranta, kadun → katu, hengen → henki).
  function vahvaksi(s) {
    var v = [];
    [[/nn([aeiouyäö])$/, 'nt$1'], [/ll([aeiouyäö])$/, 'lt$1'], [/rr([aeiouyäö])$/, 'rt$1'], [/mm([aeiouyäö])$/, 'mp$1'], [/ng([aeiouyäö])$/, 'nk$1'],
      [/([aeiouyäö])d([aeiouyäö])$/, '$1t$2'], [/([aeiouyäö])v([aeiouyäö])$/, '$1p$2'], [/([aeiouyäölnr])([kpt])([aeiouyäö])$/, '$1$2$2$3']]
      .forEach(function (r) { if (r[0].test(s)) v.push(s.replace(r[0], r[1])); });
    return v;
  }
  function fiMuodot(w) {
    var juuret = [w];
    if (FI_LIITE.test(w)) juuret.push(w.replace(FI_LIITE, ''));
    var out = [];
    juuret.forEach(function (j) {
      FI_PAATE.forEach(function (p) {
        if (j.length - p.length < 2 || j.slice(-p.length) !== p) return;
        var s = j.slice(0, -p.length);
        out.push(s, s + 'a', s + 'ä', s + 'i', s + 'e');
        if (/ee$/.test(s)) {
          // e-vartalo: käsittee → käsite, tietee → tiede, liikkee → liike, huonee → huone.
          var e = s.slice(0, -1);
          out.push(e, e.replace(/([kpt])\1e$/, '$1e'), e.replace(/([aeiouyäö])te$/, '$1de'), e.replace(/([aeiouyäö])pe$/, '$1ve'), e.replace(/([aeiouyäö])ke$/, '$1e'));
        }
        if (/kse$/.test(s)) out.push(s.slice(0, -3) + 's');           // vastaukse → vastaus
        if (/ise?$/.test(s)) out.push(s.replace(/ise?$/, 'inen'));     // ihmise, ihmis → ihminen
        if (/ime$/.test(s)) out.push(s.slice(0, -3) + 'in');           // puhelime → puhelin
        if (/[uy]de$/.test(s)) out.push(s.slice(0, -2) + 's');          // rakkaude → rakkaus
        if (/[uy]t$/.test(s)) out.push(s.slice(0, -1) + 's');           // rakkaut → rakkaus
        if (/e$/.test(s)) out.push(s.slice(0, -1) + 'i');               // kive → kivi
        vahvaksi(s).forEach(function (x) { out.push(x); if (/e$/.test(x)) out.push(x.slice(0, -1) + 'i'); });
      });
    });
    return out;
  }
  function deMuodot(w) {
    var out = [];
    ['ern', 'ens', 'em', 'en', 'er', 'es', 'e', 'n', 's'].forEach(function (p) { if (w.length - p.length >= 3 && w.slice(-p.length) === p) out.push(w.slice(0, -p.length)); });
    ['test', 'tet', 'ten', 'te', 'est', 'et', 'st', 't'].forEach(function (p) { if (w.length - p.length >= 3 && w.slice(-p.length) === p) out.push(w.slice(0, -p.length) + 'en'); });
    return out;
  }
  function svMuodot(w) {
    var out = [];
    ['ernas', 'arnas', 'ornas', 'erna', 'arna', 'orna', 'ens', 'ets', 'en', 'et', 'ar', 'er', 'or', 'na', 'a', 'n', 's'].forEach(function (p) {
      if (w.length - p.length >= 3 && w.slice(-p.length) === p) out.push(w.slice(0, -p.length));
    });
    return out;
  }
  function enMuodot(w) {
    var out = [];
    if (/ies$/.test(w)) out.push(w.slice(0, -3) + 'y');
    if (/(s|x|z|ch|sh)es$/.test(w)) out.push(w.slice(0, -2));
    if (/s$/.test(w) && !/ss$/.test(w)) out.push(w.slice(0, -1));
    if (/ied$/.test(w)) out.push(w.slice(0, -3) + 'y');
    if (/ed$/.test(w)) out.push(w.slice(0, -2), w.slice(0, -1));
    if (/ing$/.test(w)) out.push(w.slice(0, -3), w.slice(0, -3) + 'e');
    return out;
  }
  var MUODOT = { fi: fiMuodot, de: deMuodot, sv: svMuodot, en: enMuodot };
  // kielet: kielikoodit tai null (kaikki säännöt suomi ensin). Vain yhden sanan haulle; ilmaus on sellaisenaan.
  function perusmuodot(sana, kielet) {
    var w = String(sana).trim(), out = [w];
    if (/\s/.test(w) || kirjaimisto(w) !== 'latina') return out;
    var p = w.toLowerCase();
    (kielet || ['fi', 'en', 'sv', 'de']).forEach(function (k) { if (MUODOT[k]) out = out.concat(MUODOT[k](p)); });
    return uniq(out).filter(function (x) { return Array.from(x).length >= 2; });
  }

  /* ---------- Tieteen termipankki: perusmuoto ----------
     Termipankki on moottorissa (sanaselitys.js, LuinSana.termit); täältä se saa ilman Wiktionarya perusmuodon. Nimityssivut
     (Nimitys:käsite, nimiavaruus 1098) ovat termejä millä kielellä tahansa, ja niiden nimissä kirjainkoko on merkitsevä
     (käsite, Begriff). Ehdokkaiden olemassaolo yhdellä pyynnöllä (enintään 50 nimeä); vastaus nimi kerrallaan muistiin. */
  var TP_API = 'https://tieteentermipankki.fi/w/api.php?format=json&formatversion=2&origin=*';
  var TP_ON = {};
  function tpOlemassa(nimet) {
    var uudet = nimet.filter(function (n) { return !TP_ON.hasOwnProperty(n); });
    if (!uudet.length) return Promise.resolve(TP_ON);
    return haeJson(TP_API + '&action=query&titles=' + encodeURIComponent(uudet.join('|'))).then(function (j) {
      var norm = {};
      ((j.query && j.query.normalized) || []).forEach(function (n) { norm[n.to] = n.from; });
      uudet.forEach(function (n) { TP_ON[n] = false; });
      ((j.query && j.query.pages) || []).forEach(function (p) { if (!p.missing && !p.invalid && p.ns === 1098) TP_ON[norm[p.title] || p.title] = true; });
      return TP_ON;
    });
  }
  /* Haettava muoto: '' kun haku itse tai sama toisella alkukirjaimella on nimitys (moottori hakee ne itse) tai mitään ei löydy,
     muuten ensimmäinen olemassa oleva päätesääntöjen ehdokas (pienellä, saksan substantiiveille myös isolla). */
  function tpPerusmuoto(haku, ymp) {
    var kielet = ymp.rajaus || (ymp.kieli ? [ymp.kieli] : null), saannot = perusmuodot(haku, kielet).slice(1);
    var itse = uniq([haku, ekaPieni(haku), ekaIso(haku)]);
    var ehd = uniq(itse.concat(saannot, !kielet || kielet.indexOf('de') >= 0 ? saannot.map(ekaIso) : [])).slice(0, 50);
    var nimet = ehd.map(function (x) { return 'Nimitys:' + x; });
    return tpOlemassa(nimet).then(function (on) {
      var x = ehd.filter(function (e, i) { return on[nimet[i]]; })[0];
      return !x || itse.indexOf(x) >= 0 ? '' : x;
    });
  }

  /* ---------- Logeion (muinaiskreikka ja latina) ----------
     Logeionin sovelluksen rajapinta: detail antaa hakusanan kaikki sanakirjat, find jäsentää taivutusmuodon (parses: lemma ja
     muoto) ja löytää aksentittoman (λογος → λόγος, Found … with different accentuation). find antaa löytymättömälle myös aakkosissa
     lähimmän sanan, jota ei kelpuuteta: vain jäsennys tai diakriittejä lukuun ottamatta sama sana. */
  var LG_API = 'https://anastrophe.uchicago.edu/logeion-api/';
  var LG_POIS = ['Brill-Montanari', 'Examples from the corpus'];
  var LG_JARJ = ['Middle Liddell', 'LSJ', 'Autenrieth Homer', 'Cunliffe Homer', 'Slater Pindar', 'Abbott-Smith NT', 'LewisShort', 'Lewis', 'Gaffiot', 'DuCange'];
  var LG_NIMI = { LewisShort: 'Lewis & Short', 'Grieks Nederlands': 'Grieks–Nederlands' };
  function lgDetail(w) { return muisti('lgd|' + w, function () { return haeJson(LG_API + 'detail?w=' + encodeURIComponent(w) + '&type=normal'); }); }
  function lgFind(w) { return muisti('lgf|' + w, function () { return haeJson(LG_API + 'find?w=' + encodeURIComponent(w)); }); }
  function lgKirjat(j) {
    var d = (j && j.detail) || {};
    return (d.dicos || []).filter(function (x) {
      return LG_POIS.indexOf(x.dname) < 0 && (x.es || []).some(function (e) { return String(e).replace(/<[^>]*>/g, '').trim().length > 10; });
    }).map(function (x, i) { return [x, i]; }).sort(function (a, z) {
      var p = LG_JARJ.indexOf(a[0].dname), q = LG_JARJ.indexOf(z[0].dname);
      return (p < 0 ? 99 : p) - (q < 0 ? 99 : q) || a[1] - z[1];
    }).map(function (x) { return x[0]; });
  }
  function lgHae(sanat) {
    var i = 0;
    function seur() {
      if (i >= sanat.length) return Promise.resolve(null);
      var w = sanat[i++].normalize('NFC');
      return lgDetail(w).then(function (j) {
        if (lgKirjat(j).length) return lgTulos(w, j, null);
        return lgFind(w).then(function (f) {
          var parses = (f && f.parses) || [], lemma = parses.length ? parses[0].lemma : '', aksentti = false;
          if (!lemma && f && f.word && f.word !== w && taita(f.word) === taita(w)) { lemma = f.word; aksentti = true; }
          if (!lemma || lemma === w) return seur();
          return lgDetail(lemma).then(function (j2) {
            if (!lgKirjat(j2).length) return seur();
            var kuv = aksentti ? 'sama toisin kirjoitettuna' : uniq(parses.filter(function (p) { return p.lemma === lemma; }).map(function (p) {
              return String(p.parse || '').replace(/^\s*-\s*/, '').replace(/\s+-\s+/g, ' · ').replace(/\s+/g, ' ').trim();
            })).join('; ');
            var nayta = aksentti ? sanat.every(function (s) { return s.normalize('NFC') !== lemma; }) : haettuNakyviin(sanat, lemma);
            return lgTulos(lemma, j2, nayta ? { o: w, kuvaus: kuv } : null);
          });
        });
      });
    }
    return seur();
  }
  function lgTulos(w, j, muoto) {
    var d = j.detail || {}, kirjat = lgKirjat(j), sana = d.headword || w, lyhyt = (d.shortdef || []).filter(Boolean);
    var html = '<div class="sx-ots"><span class="sx-o">' + esc(sana) + '</span></div>' +
      (muoto ? '<div class="sx-muoto">(”' + esc(muoto.o) + '”' + (muoto.kuvaus ? ' · ' + esc(muoto.kuvaus) : '') + ')</div>' : '') +
      (lyhyt.length ? '<p class="sx-p">' + esc(uniq(lyhyt).join('; ')) + '</p>' : '') + kirjaLista(kirjat.map(function (x) { return LG_NIMI[x.dname] || x.dname; }));
    return { avain: 'lg|' + sana + '|' + (muoto ? muoto.o : ''), sana: sana, html: html, linkki: 'https://logeion.uchicago.edu/' + encodeURIComponent(sana), otsikko: 'Avaa Logeion',
      data: kirjat, auki: !lyhyt.length };
  }
  /* Sanakirjat rivinsisäisenä luettelona kuten termipankin vastineet (Logeionissa niitä on kymmenkunta); sisältö vasta
     napautuksesta, koska LSJ:n artikkeli voi olla kymmeniä sivuja. Avattu artikkeli tulee luettelon alle sanakirjan nimellä. */
  function kirjaLista(nimet, lisat, otsakkeet) {
    return '<div class="sx-kirjat">' + nimet.map(function (n, i) {
      return '<span class="sx-kirja"><button type="button" class="sx-auki" data-k="sx-auki" data-i="' + i + '" aria-expanded="false">' + esc(n) + '</button>' +
        (lisat && lisat[i] ? ' <span class="sx-vk">' + esc(lisat[i]) + '</span>' : '') + '</span>';
    }).join('<span class="sx-vali"> · </span>') + '</div>' + nimet.map(function (n, i) {
      return '<div class="sx-sisus" data-i="' + i + '" hidden><div class="sx-vk">' + esc(otsakkeet ? otsakkeet[i] : n) + '</div><div class="sx-sisalto"></div></div>';
    }).join('');
  }

  /* ---------- Wörterbuchnetz (saksan historialliset sanakirjat) ----------
     Hakusana avoimesta rajapinnasta (open-api, kirjainkoosta riippumaton), artikkeli sivuston omasta rajapinnasta sanoittain.
     Artikkelin pituus luetaan ensin seuraavan hakusanan tekstitunnuksesta: Grimmin geist on 120 000 sanaa (30 Mt), joten yli
     WB_RAJA sanan artikkelia ei haeta vaan annetaan linkki. */
  var WB_OPEN = 'https://api.woerterbuchnetz.de/open-api/dictionaries/', WB_API = 'https://api.woerterbuchnetz.de/dictionaries/', WB_RAJA = 4000;
  var WB_KIRJAT = [['Adelung', 'Adelung', '1793–1801'], ['Campe', 'Campe', '1807–1811'], ['DWB', 'Grimm', '1854–1961'], ['DWB2', 'Grimm, uusi laitos', 'A–F']];
  function wbLemma(sigle, w) {
    return muisti('wb|' + sigle + '|' + w.toLowerCase(), function () {
      return haeJson(WB_OPEN + sigle + '/lemmata/' + encodeURIComponent(w)).then(function (j) { return (j && j.result_set) || []; });
    });
  }
  function wbHae(sanat) {
    var ehd = [];
    sanat.forEach(function (s) { perusmuodot(s, ['de']).forEach(function (x) { ehd.push(x); }); });
    // Rajapinta ei erota kirjainkokoa, joten sama sana eri kokoisena on yksi ehdokas (ensimmäinen kirjoitusasu jää).
    ehd = uniq(ehd).filter(function (x, i, a) { return a.map(function (y) { return y.toLowerCase(); }).indexOf(x.toLowerCase()) === i; }).slice(0, 6);
    var i = 0;
    function seur() {
      if (i >= ehd.length) return Promise.resolve(null);
      var w = ehd[i++];
      return Promise.all(WB_KIRJAT.map(function (k) { return wbLemma(k[0], w).catch(function () { return null; }); })).then(function (rs) {
        if (rs.every(function (r) { return r === null; })) throw new Error('wb');
        var osumat = [];
        rs.forEach(function (r, n) {
          var x = (r || []).filter(function (e) { return puretut(e.lemma || '').toLowerCase() === w.toLowerCase(); })[0] || (r || [])[0];
          if (x) osumat.push({ kirja: WB_KIRJAT[n], lemma: puretut(x.lemma || w), gram: puretut(x.gram || ''), id: x.wbnetzid, linkki: x.wbnetzlink });
        });
        if (!osumat.length) return seur();
        // Otsikoksi haettu kirjoitusasu, jos siinä on isoja kirjaimia (teksti tai Wiktionary: Begriff); muuten Campen tai
        // Adelungin hakusana (Grimm kirjoittaa kaiken pienellä, uusi laitos versaalein).
        var sana = /\p{Lu}/u.test(w) ? w : (osumat.filter(function (o) { return o.kirja[0] === 'Campe' || o.kirja[0] === 'Adelung'; })[0] || osumat[0]).lemma;
        if (sana === sana.toUpperCase()) sana = sana.toLowerCase();
        var haettu = haettuNakyviin(sanat, w);
        var html = '<div class="sx-ots"><span class="sx-o">' + esc(sana) + '</span></div>' +
          (haettu ? '<div class="sx-muoto">(”' + esc(haettu) + '”)</div>' : '') +
          kirjaLista(osumat.map(function (o) { return o.kirja[1]; }), osumat.map(function (o) { return o.kirja[2]; }),
            osumat.map(function (o) { return o.kirja[1] + ' · ' + o.lemma + (o.gram ? ' ' + o.gram.replace(/^(Der|Die|Das)$/, function (a) { return a.toLowerCase(); }) : ''); }));
        return { avain: 'wb|' + osumat.map(function (o) { return o.kirja[0] + o.id; }).join('|') + '|' + haettu, sana: sana, html: html, linkki: osumat[0].linkki,
          otsikko: 'Avaa Wörterbuchnetz', data: osumat };
      });
    }
    return seur();
  }
  function wbArtikkeli(o) {
    var sigle = o.kirja[0];
    return muisti('wba|' + sigle + o.id, function () {
      return haeJson(WB_API + sigle + '/lemmata/lemid/' + encodeURIComponent(o.id) + '/2/json').then(function (l) {
        var pituus = l && l.length > 1 && l[1].textid && l[0].textid ? l[1].textid - l[0].textid : 0;
        if (pituus > WB_RAJA) return { pitka: pituus };
        return haeJson(WB_API + sigle + '/articles/' + encodeURIComponent(o.id) + '/lemid').then(function (t) {
          var sanat = (t || []).filter(function (x) { return x.word !== sigle && !/sigle$/.test(x.elementtype || ''); });
          var auki = puretut(sanat.map(function (x) { return x.word; }).join('\u0001')).split('\u0001'), h = '', kurs = false;
          sanat.forEach(function (x, i) {
            var k = x.typeset === 'italics';
            if (k !== kurs) { h += k ? '<i>' : '</i>'; kurs = k; }
            h += esc(auki[i] || '');
          });
          if (kurs) h += '</i>';
          return { html: h.replace(/\s+/g, ' ').trim() };
        });
      });
    });
  }

  /* ---------- Digital Pāḷi Dictionary ----------
     search_json tuntee taivutusmuodot (dhammassa → dhamma). Vastaus on raskas (yleisellä sanalla noin 350 kt pakattuna, koska
     mukana ovat sivun paneelit), siksi lähde on oletuksena pois. Näytetään vain tiivistelmä. Diakriitittä kirjoitettu
     (paticcasamuppada) ei löydy, mutta tyhjän tiivistelmän dpd_html luettelee lähimmät (*No results found. The closest matches
     are: paṭiccasamuppāda, paṭiccasamuppanna, …*); niistä kelpaa vain diakriittejä lukuun ottamatta sama kuten Kölnissä. */
  var DPD_API = 'https://www.dpdict.net/search_json?lazy=1&q=';
  function dpdHaku(w) { return muisti('dpd|' + w, function () { return haeJson(DPD_API + encodeURIComponent(w)); }); }
  function dpdKohdat(j) {
    return kappaleet(String((j && j.summary_html) || ''), function (juuri) {
      [].forEach.call(juuri.querySelectorAll('a'), function (a) {
        if (/►/.test(a.textContent)) a.remove();
        else { var i2 = document.createElement('i'); i2.textContent = a.textContent.trim(); a.replaceWith(i2); }
      });
    });
  }
  function dpdLahimmat(j, w) {
    var t = new DOMParser().parseFromString(String((j && j.dpd_html) || ''), 'text/html').body.textContent;
    var m = /closest matches are:([\s\S]*)$/i.exec(t);
    return m ? uniq(m[1].split(',').map(function (x) { return x.trim().normalize('NFC'); })).filter(function (x) {
      return x !== w && taita(x) === taita(w);
    }) : [];
  }
  function dpdTulos(sana, kohdat, haettu) {
    var html = '<div class="sx-ots"><span class="sx-o">' + esc(sana) + '</span></div>' +
      (haettu ? '<div class="sx-muoto">(”' + esc(haettu) + '” · sama toisin kirjoitettuna)</div>' : '') + kappaleHtml(kohdat, 8) +
      (kohdat.length > 8 ? '<p class="sx-p sx-pieni">… ja ' + (kohdat.length - 8) + ' muuta</p>' : '');
    return { avain: 'dpd|' + sana + '|' + (haettu || ''), sana: sana, html: html, linkki: 'https://www.dpdict.net/?q=' + encodeURIComponent(sana),
      otsikko: 'Avaa Digital Pāḷi Dictionary' };
  }
  function dpdHae(sanat) {
    var i = 0;
    function seur() {
      if (i >= sanat.length) return Promise.resolve(null);
      var w = sanat[i++].normalize('NFC');
      return dpdHaku(w).then(function (j) {
        var kohdat = dpdKohdat(j);
        if (kohdat.length) return dpdTulos(w, kohdat, null);
        var ehd = dpdLahimmat(j, w), k = 0;
        // DPD:n järjestyksessä ensimmäinen, jolla on tiivistelmä.
        function lahin() {
          if (k >= ehd.length) return seur();
          var e = ehd[k++];
          return dpdHaku(e).then(function (j2) {
            var k2 = dpdKohdat(j2);
            return k2.length ? dpdTulos(e, k2, sanat.some(function (s) { return s.normalize('NFC') === e; }) ? '' : w) : lahin();
          });
        }
        return lahin();
      });
    }
    return seur();
  }

  /* ---------- Kölnin sanskritsanakirjat: Monier-Williams ----------
     getword hakee hakusanan IAST-kirjaimin (input=roman) tai devanagarina; diakriitittä kirjoitettu (karuna) löytyy
     simple-search-rajapinnasta, jonka ehdokkaista kelpaa vain diakriitittä sama (karuṇa, karuṇā). */
  var KO_API = 'https://sanskrit-lexicon.uni-koeln.de/scans/csl-apidev/';
  function koSana(key, input) {
    return muisti('ko|' + input + '|' + key, function () {
      return haeTeksti(KO_API + 'getword.php?dict=mw&output=roman&input=' + input + '&key=' + encodeURIComponent(key));
    });
  }
  function koRivit(html) {
    var d = new DOMParser().parseFromString(html, 'text/html');
    return [].map.call(d.querySelectorAll('table.display td.display'), function (td) {
      [].forEach.call(td.querySelectorAll('.hrefdata'), function (e) { e.remove(); });
      var k = kappaleet(td.innerHTML).join(' ').replace(/\[\s*ID=\d+\s*\]/g, '').replace(/^\s*(<b>)?\s*\(H\d[A-Z]?\)\s*(<\/b>)?\s*/, '')
        .replace(/<b>\s*\(H\d[A-Z]?\)\s*<\/b>/g, '').replace(/\s+/g, ' ').trim();
      return k;
    }).filter(Boolean);
  }
  function koHae(sanat) {
    var i = 0;
    function seur() {
      if (i >= sanat.length) return Promise.resolve(null);
      var w = sanat[i++].normalize('NFC'), input = /\p{Script=Devanagari}/u.test(w) ? 'deva' : 'roman';
      return koSana(w, input).then(function (h) {
        var rivit = koRivit(h);
        if (rivit.length) return koTulos(w, rivit, null);
        if (input !== 'roman') return seur();
        return muisti('kos|' + w, function () {
          return haeJson(KO_API + 'simple-search/v1.1/getword_list_1.0.php?input=simple&dict=mw&output=roman&key=' + encodeURIComponent(w));
        }).then(function (j) {
          var e = ((j && j.result) || []).filter(function (x) { return taita(x.dicthwoutput || '') === taita(w); })[0];
          if (!e) return seur();
          return koSana(e.key, 'slp1').then(function (h2) {
            var r2 = koRivit(h2);
            // Tässä haettu on juuri diakriiteiltään eri (karuna → karuṇa), joten vertailu on tarkka eikä taitettu.
            var hw = e.dicthwoutput || e.key;
            return r2.length ? koTulos(hw, r2, sanat.some(function (s) { return s.normalize('NFC') === hw; }) ? '' : w) : seur();
          });
        });
      });
    }
    return seur();
  }
  function koTulos(sana, rivit, haettu) {
    var html = '<div class="sx-ots"><span class="sx-o">' + esc(sana) + '</span></div>' +
      (haettu ? '<div class="sx-muoto">(”' + esc(haettu) + '” · sama toisin kirjoitettuna)</div>' : '') +
      rivit.slice(0, 4).map(function (r) { return '<p class="sx-p">' + r + '</p>'; }).join('') +
      (rivit.length > 4 ? '<p class="sx-p sx-pieni">… ja ' + (rivit.length - 4) + ' muuta kohtaa</p>' : '');
    return { avain: 'ko|' + sana + '|' + (haettu || ''), sana: sana, html: html, otsikko: 'Avaa Cologne Digital Sanskrit Dictionaries',
      linkki: KO_API + 'getword.php?dict=mw&input=roman&output=roman&key=' + encodeURIComponent(sana) };
  }

  /* Lähteet sivun järjestyksessä (käyttäjän päätös: oletuksena Wiktionary ja Tieteen termipankki). kielet: Wiktionaryn
     kielikoodit, joihin lähde rajautuu kielivalikossa ('*' = kaikki); kirjaimet: kirjaimistot, joilla haetaan. */
  var LAHTEET = [
    { id: 'wiktionary', nimi: 'Wiktionary', kuvaus: 'englanninkielinen Wikisanakirja, kaikki kielet', oletus: true },
    // Termipankki on moottorissa (LuinSana.termit) kuten Wiktionary; täällä vain valikon rivi.
    { id: 'termipankki', nimi: 'Tieteen termipankki', lyhyt: 'Termipankki', kuvaus: 'tieteenalojen käsitteet, määritelmät ja vastineet', oletus: true },
    { id: 'logeion', nimi: 'Logeion', otsake: 'Logeion', lahde: 'Logeion (Chicagon yliopisto)', kuvaus: 'muinaiskreikka ja latina: LSJ, Lewis & Short ym.',
      kielet: ['grc', 'el', 'la'], kirjaimet: ['kreikka', 'latina'], hae: lgHae, avaa: function (r, i) {
        var x = r.data[i];
        return Promise.resolve(kappaleHtml(kappaleet((x.es || []).join('<br>'))));
      } },
    { id: 'woerterbuchnetz', nimi: 'Wörterbuchnetz', otsake: 'Wörterbuchnetz', lahde: 'Wörterbuchnetz (Trierin yliopisto)',
      kuvaus: 'saksan historialliset: Adelung, Campe, Grimm', kielet: ['de'], kirjaimet: ['latina'], hae: wbHae, avaa: function (r, i) {
        var o = r.data[i];
        return wbArtikkeli(o).then(function (a) {
          if (a.pitka) return '<p class="sx-p sx-pieni">Artikkeli on pitkä (noin ' + a.pitka.toLocaleString('fi-FI') + ' sanaa): <a class="sx-ulos" href="' + esc(o.linkki) + '">avaa Wörterbuchnetzissä</a>.</p>';
          return a.html ? '<p class="sx-p">' + a.html + '</p>' : '<p class="sx-p sx-pieni">Artikkeli on tyhjä.</p>';
        });
      } },
    { id: 'dpd', nimi: 'Digital Pāḷi Dictionary', lyhyt: 'DPD', otsake: 'Digital Pāḷi Dictionary', lahde: 'Digital Pāḷi Dictionary, CC BY-NC-SA 4.0',
      kuvaus: 'pali; raskas haku', kielet: ['pi'], kirjaimet: ['latina'], hae: dpdHae },
    { id: 'koln', nimi: 'Monier-Williams', otsake: 'Monier-Williams', lahde: 'Cologne Digital Sanskrit Dictionaries', kuvaus: 'sanskrit (Kölnin sanakirjat)',
      kielet: ['sa'], kirjaimet: ['latina', 'devanagari'], hae: koHae }
  ];
  var LAHDE = {};
  LAHTEET.forEach(function (l) { LAHDE[l.id] = l; });

  // Sopiiko lähde hakuun: kielivalikon rajaus ja kielikoodi (fi:, de: …) rajaavat kieliin, kirjaimisto lähteen kirjaimiin.
  function sopii(id, haku, ymp) {
    var L = LAHDE[id];
    if (!L || !L.hae) return false;
    if (L.kielet !== '*') {
      if (ymp.rajaus && !ymp.rajaus.some(function (k) { return L.kielet.indexOf(k) >= 0; })) return false;
      if (ymp.kieli && L.kielet.indexOf(ymp.kieli) < 0) return false;
    }
    return L.kirjaimet.indexOf(kirjaimisto(haku)) >= 0;
  }
  // Viimeisimmät tulokset lähteittäin avattavia rivejä varten.
  var NYT = {};
  function hae(id, sanat, ymp) {
    return LAHDE[id].hae(uniq(sanat.map(function (s) { return String(s).trim(); })), ymp || {}).then(function (r) {
      if (r) NYT[id] = r;
      return r;
    });
  }
  /* Avattava rivi (sanakirja tai selite): ensimmäinen napautus hakee ja avaa, toinen sulkee. Palauttaa lupauksen. */
  function avaa(b) {
    var osio = b.closest('[data-l]'), id = osio && osio.dataset.l, r = NYT[id], i = +b.dataset.i;
    var sisus = [].filter.call(osio.querySelectorAll('.sx-sisus'), function (e) { return e.dataset.i === b.dataset.i; })[0];
    if (!sisus) return Promise.resolve();
    var auki = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', auki ? 'true' : 'false');
    sisus.hidden = !auki;
    var paikka = sisus.querySelector('.sx-sisalto');
    if (!auki || !paikka || sisus.dataset.valmis || !LAHDE[id].avaa || !r || !r.data) return Promise.resolve();
    paikka.innerHTML = '<p class="sx-p sx-pieni">Haetaan…</p>';
    return LAHDE[id].avaa(r, i).then(function (h) { paikka.innerHTML = h; sisus.dataset.valmis = '1'; }, function () {
      paikka.innerHTML = '<p class="sx-p sx-pieni">Haku ei onnistunut. Onko verkkoyhteys päällä?</p>';
    });
  }

  window.LuinSanakirjat = { LAHTEET: LAHTEET, lahde: function (id) { return LAHDE[id]; }, sopii: sopii, hae: hae, avaa: avaa, perusmuodot: perusmuodot,
    tpPerusmuoto: tpPerusmuoto };
})();
