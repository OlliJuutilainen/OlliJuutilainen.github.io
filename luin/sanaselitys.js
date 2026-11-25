/* Luinin sanaselitys: englanninkielinen Wikisanakirja (Wiktionary), hakuketju, määritelmät, perusmuoto ja alkuperä.
   Yhteinen kahdelle sivulle: luin.html (selitysikkuna, #pop) ja luin/sanaselitys.html (oma sivu ilman lukijaa). Tekstin
   ympäristö (kursiivi, lainaus, virkkeen alku, kappaleen kieli) päätellään luin.html:ssä; tämä tiedosto saa sen valmiina (y).
   Lataus ?v=<SHA-1:n alku> kuten md.js (md-testi.js tarkistaa). Ei riippuvuuksia muihin Luinin tiedostoihin. */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function sanaLkm(x) { return (String(x).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length; }

  /* ---------- sanaselitys (englanninkielinen Wikisanakirja) ----------
     Määritelmät REST-rajapinnasta (/api/rest_v1/page/definition/, CORS sallittu), ehdokkaat MediaWikin rajapinnasta
     (prefixsearch ja search, origin=*). Haku vain napautuksesta. Wiktionary on kranttu kirjoitusasusta, joten ensin haetaan
     tasan tekstin muoto; vasta sen puuttuessa kielikohtainen ketju (skKetju, käyttäjän linjaukset 5.11.2026). Ketjun ehdot
     (kieli, loppunapsu, majuminuluku) ratkaistaan tässä eikä Wikisanakirjan haussa: palvelimen haku on vain ehdokkaiden
     lähde, joten sen kirjainkoko- ja diakriittisäännöt eivät muuta tulosta. */
  var SK_URL = 'https://en.wiktionary.org/api/rest_v1/page/definition/',
    SK_API = 'https://en.wiktionary.org/w/api.php?action=query&format=json&formatversion=2&origin=*',
    skVarasto = {}, skHakuVarasto = {}, skVuoro = 0;
  // Ketjujen kielet: Wikisanakirjan kielikoodi ja nimi (luokat Category:Finnish lemmas ja Category:Finnish non-lemma forms).
  var SK_NIMI = { fi: 'Finnish', en: 'English', la: 'Latin', grc: 'Ancient Greek', el: 'Greek', de: 'German', fr: 'French', sv: 'Swedish', lt: 'Lithuanian' };
  var SK_ELAT = { fi: 'suomesta', en: 'englannista', la: 'latinasta', grc: 'muinaiskreikasta', el: 'nykykreikasta', de: 'saksasta', fr: 'ranskasta', sv: 'ruotsista', lt: 'liettuasta' };
  var SK_LAHDE = '<span class="sk-lahde">Wiktionary, CC BY-SA</span>';
  function haeSana(sana) {
    if (skVarasto.hasOwnProperty(sana)) return Promise.resolve(skVarasto[sana]);
    return fetch(SK_URL + encodeURIComponent(sana.replace(/ /g, '_'))).then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) { j = skNormita(j); skVarasto[sana] = j; return j; });
  }
  // REST-rajapinnan kieliavaimet eivät ole luotettavia (mitattu 6.11.2026): Translingual on avaimen en alla (as, in, to,
  // did, is: ennen englantia), ja koodittomat kielet ovat yhdessä avaimessa other, myös muinaiskreikka (λόγος, ψυχή), jolloin
  // grc-ketju ei löytänyt mitään. Avain luetaan siksi osan kielen nimestä: Translingual on mul, tunnetut nimet SK_NIMI:n
  // koodeja, other jaetaan kielittäin. Translingualista pois ISO 639 -kielikoodit (as = assami, to = tonga): tekstin sana ei
  // ole kielikoodi.
  function skNormita(j) {
    if (!j) return j;
    var out = {};
    Object.keys(j).forEach(function (k) {
      if (!Array.isArray(j[k])) return;
      j[k].forEach(function (osa) {
        var n = osa.language || '', kk = n === 'Translingual' ? 'mul' : skKieliKoodi(n) || (k === 'other' ? 'other:' + n : k);
        if (kk === 'mul') {
          var defs = (osa.definitions || []).filter(function (d) { return !/ISO 639/.test(String(d.definition || '').replace(/<[^>]*>/g, '')); });
          if (!defs.length) return;
          osa = Object.assign({}, osa, { definitions: defs });
        }
        (out[kk] = out[kk] || []).push(osa);
      });
    });
    return out;
  }
  // Translingual kuuluu kaikkiin kieliin, mutta selityksissä se tulee tekstin kielen, ketjun kielten, englannin ja suomen
  // jälkeen ja ennen muita kieliä (km, CO2: vain Translingual). Kun tekstin kielestä löytyy osuma (r-lippu), Translingual
  // jää pois, ellei kirjoitusasu ole symbolin näköinen (skSymboli: IV, CO2, pH), koska tavallisen sanan Translingual-osio on
  // kirjaimia, yksikköjä ja koodeja (as = attosekunti).
  function skJarjKieli(k, kielet, etusija) {
    return k === etusija ? 0 : k === 'mul' ? 3.5 : kielet !== '*' && kielet.indexOf(k) >= 0 ? 1 : k === 'en' ? 2 : k === 'fi' ? 3 : 4;
  }
  function skSymboli(s) { return /\p{N}/u.test(s) || /\p{L}\p{Lu}/u.test(s); }
  // Ehdokkaat palvelimen hausta: [{ o: otsikko, i: järjestys, kk: { kieli: 'l' (lemma) tai 'm' (taivutusmuoto) } }].
  // Kielilista rajaa ehdokkaat näiden kielten lemma- ja muotoluokkiin samassa pyynnössä; '*' ei rajaa. tapa 'alku' on
  // otsikon alkuhaku (prefixsearch, suosituimmat ensin), 'teksti' koko tekstin haku (search).
  function skEhdokkaat(q, kielet, tapa) {
    var rajattu = kielet !== '*', avain = tapa + '|' + q + '|' + (rajattu ? kielet.join(',') : '*');
    if (skHakuVarasto[avain]) return skHakuVarasto[avain];
    var u = SK_API + (tapa === 'alku' ? '&generator=prefixsearch&gpslimit=50&gpssearch=' : '&generator=search&gsrnamespace=0&gsrlimit=20&gsrsearch=') +
      encodeURIComponent(q);
    if (rajattu) u += '&prop=categories&cllimit=max&clcategories=' + encodeURIComponent(kielet.map(function (k) {
      return 'Category:' + SK_NIMI[k] + ' lemmas|Category:' + SK_NIMI[k] + ' non-lemma forms';
    }).join('|'));
    var p = fetch(u).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
      return ((j.query && j.query.pages) || []).filter(function (s) { return s.ns === 0 && s.title; }).map(function (s) {
        var kk = {};
        (s.categories || []).forEach(function (c) {
          var m = /^Category:(.+) (lemmas|non-lemma forms)$/.exec(c.title || '');
          var k = m && Object.keys(SK_NIMI).filter(function (x) { return SK_NIMI[x] === m[1]; })[0];
          if (k) kk[k] = kk[k] === 'l' || m[2] === 'lemmas' ? 'l' : 'm';
        });
        return { o: s.title, i: s.index || 0, kk: kk };
      }).filter(function (e) { return !rajattu || Object.keys(e.kk).length; }).sort(function (a, z) { return a.i - z.i; });
    });
    skHakuVarasto[avain] = p;
    p.catch(function () { delete skHakuVarasto[avain]; });
    return p;
  }

  // Majuminuluku: kirjainkoko (majuskeli, minuskeli), lukumerkit (diakriitit) sekä väli- ja heittomerkit vapaat, kuten
  // hakukoneessa (pratityasamutpada = pratītyasamutpāda, ars longa vita brevis = ars longa, vita brevis).
  function skTaitto(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ᪰-᫿᷀-᷿⃐-⃿︠-︯]/g, '').toLowerCase()
      .replace(/ς/g, 'σ').replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ø/g, 'o').replace(/[łŀ]/g, 'l')
      .replace(/đ/g, 'd').replace(/ı/g, 'i').replace(/[’'ʼ`´]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }
  // Tasan sama: vain heittomerkki (’ → ', Wikisanakirjan otsikoissa suora) ja välit yhtenäistetään.
  function skSuora(s) { return String(s).replace(/[’ʼ]/g, "'").replace(/\s+/g, ' ').trim(); }
  function ekaPieni(s) { var a = Array.from(s); return a.length ? a[0].toLowerCase() + a.slice(1).join('') : s; }
  function skSanat(s) { return String(s).split(/\s+/).map(function (w) { return w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''); }).filter(Boolean); }
  function kirjaimia(w) { return Array.from(w).filter(function (c) { return /\p{L}/u.test(c); }).length; }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  // Haettava muoto: maalauksen reunoilta pois kaikki muu kuin kirjaimet ja numerot (lainausmerkit, pisteet, pilkut).
  function skHakusana(x) { return skSuora(String(x).replace(/­/g, '')).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''); }
  // Tasan sama muoto: tekstin kirjoitusasu ja, jos se alkaa isolla (virkkeen alku, Being), sama pienellä; versaalina myös
  // kokonaan pienellä ja isolla alkukirjaimella (käyttäjän linjaus 5.11.2026: tulokset sekä isolla että pienellä).
  function skMuodot(s) {
    var a = [s], p = ekaPieni(s);
    if (p !== s) a.push(p);
    if (Array.from(s).length > 1 && s === s.toUpperCase() && s !== s.toLowerCase()) { a.push(s.toLowerCase()); a.push(Array.from(s)[0] + Array.from(s).slice(1).join('').toLowerCase()); }
    return uniq(a);
  }
  // Saksan helpot kokeilut: ss ↔ ß, ae oe ue → ä ö ü ja kirjainkoko (substantiivit isolla).
  function skSaksaMuodot(s) {
    var v = [s, s.replace(/ss/g, 'ß'), s.replace(/ß/g, 'ss'), s.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').replace(/^Ae/, 'Ä').replace(/^Oe/, 'Ö').replace(/^Ue/, 'Ü')];
    var out = [];
    v.forEach(function (x) { [x, Array.from(x)[0].toUpperCase() + Array.from(x).slice(1).join(''), ekaPieni(x)].forEach(function (y) { out.push(y); }); });
    var jo = skMuodot(s);
    return uniq(out).filter(function (x) { return jo.indexOf(x) < 0; }).slice(0, 6);
  }
  // Loppunapsu (suomimenettely, käyttäjän linjaus 5.11.2026): montako kirjainta sanan lopusta saa enintään pudottaa.
  // Kolmen kirjaimen sanasta ei yhtään, 4–5: kaksi, 6: kolme, 7–8: neljä, 9: viisi, vähintään 10: kuusi (ponillehan → poni).
  function skNapsu(n) { return n <= 3 ? 0 : n <= 5 ? 2 : n === 6 ? 3 : n <= 8 ? 4 : n === 9 ? 5 : 6; }
  // Sanasta pois k viimeistä kirjainta (ja perään jäävät muut merkit: Kant's → Kant).
  function skKatkaise(w, k) {
    var a = Array.from(w);
    while (k > 0 && a.length) { if (/\p{L}/u.test(a.pop())) k--; }
    while (a.length && !/[\p{L}\p{N}]/u.test(a[a.length - 1])) a.pop();
    return a.join('');
  }
  function yhteinenAlku(a, b) { a = Array.from(a); b = Array.from(b); var i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
  // Monen sanan ilmaus sanoittain (kaikkien kielten pelastusrengas, käyttäjän pyyntö 5.11.2026): sama sanamäärä, ja jokainen
  // ehdokkaan sana jatkaa tekstin sanaa, josta on pudotettu lopusta enintään min(skNapsu, 3) kirjainta, eikä ole siitä
  // paljon pidempi (kovan onnen → kova onni, ars long Vita breve → ars longa, vita brevis). taita: majuminuluku samalla.
  function skSanoittain(teksti, ehdokas, taita) {
    var a = skSanat(teksti), b = skSanat(ehdokas);
    if (a.length !== b.length) return false;
    return a.every(function (w, i) {
      var x = taita ? skTaitto(w) : ekaPieni(skSuora(w)), y = taita ? skTaitto(b[i]) : ekaPieni(skSuora(b[i]));
      if (x === y) return true;
      var n = Array.from(x).length, d = Math.min(skNapsu(kirjaimia(x)), 3);
      return d > 0 && yhteinenAlku(x, y) >= n - d && Math.abs(Array.from(y).length - n) <= d + 1;
    });
  }
  // Ilmauksen alkuhaut: ensimmäinen sana (lopusta napsien) ja välilyönti sekä toisen sanan napsittu alku. Välilyönti rajaa
  // haun ilmauksiin, joten sanoittainen vertailu saa ehdokkaat, vaikka ensimmäinen sana poikkeaisi (kovan onnen → kova on).
  function skIlmausHaut(haku) {
    var w = skSanat(haku), d0 = Math.min(skNapsu(kirjaimia(w[0])), 3), toka = w[1] ? skKatkaise(w[1], Math.min(skNapsu(kirjaimia(w[1])), 3)) || Array.from(w[1])[0] : '';
    var q = [];
    for (var k = 0; k <= d0; k++) { var a = skKatkaise(w[0], k); if (a) q.push(a + ' ' + toka); }
    return uniq(q);
  }

  // Hakuketju (käyttäjän linjaukset 5.11.2026). Askeleet: t = tasan sama muoto, tv = saksan helpot kokeilut, f = majuminuluku,
  // n = loppunapsu, nf = loppunapsu ja majuminuluku yhtä aikaa, ne = erisnimen loppu pois (Kantin → Kant), gl = kreikan
  // kirjaimet latinalaisiksi, lg-* = latinalaiset kirjaimet kreikkalaisiksi ja askel muinaiskreikasta. k: kielet tai '*'.
  // Ryhmän askelten tulokset yhdistetään; ensimmäinen ryhmä, josta tulee osuma, ratkaisee. v: varoitus (1 heikot jäät, 2 SOS).
  // Taivutusarvauksia (n) haetaan vain tekstin kielestä, paitsi kursiivissa ja lainauksessa (tekstin kieli ja viisi vierasta).
  // r: tasan saman muodon osumista näytetään vain nämä kielet (true = k), kun ketjun kieli löytyy (käyttäjän linjaus
  // 6.11.2026, ensin suomeen, sitten kaikkiin kieliin: englannin is ei tuo afrikaansia). Muut kielet tulevat vasta, jos
  // tekstin kielestä ei löydy mitään. Liudentuu kursiivissa (vieraat sanat) ja lyhyessä lainauksessa muualla kuin suomessa.
  var SK_VIERAAT = ['la', 'en', 'fr', 'de', 'sv'];
  function skKetju(kieli, y, monta, erisnimi) {
    function A(t, k, v, r) {
      r = r === true ? [].concat(k) : r || null;
      if (r && y.symboli) r = r.concat('mul');
      return { t: t, k: k === '*' ? '*' : [].concat(k), v: v || 0, r: r };
    }
    // Lainaus muualla kuin suomessa: oman kielensä erottava (pitkä) lainaus on kuin leipäteksti; lyhyt lainaus (englannin
    // scare quotes, termit) liudentuu kuin kursiivi, koska se merkitsee usein vierasta tai lainattua sanaa.
    // Tekstin kielen pikkusana (KIELI_SANAT: as, the, ja, on) ei liudu kursiivissa eikä lainauksessa: se on korostus tai
    // mainittu sana, ei vieras sana (käyttäjän palaute 6.11.2026: kursiivin tai lainauksen as toi suomen as-sävelen).
    var vieras = !y.pikkusana && (y.kursiivi || y.lainaus && kieli !== 'fi' && y.omaKieli !== kieli);
    var K;
    if (!kieli) {
      // Kieli tuntematon (sanaselityssivu ilman kielietuliitettä): tasan sama kaikista kielistä, erisnimen perusmuoto,
      // majuminuluku, loppunapsu ja viimeisenä molemmat yhtä aikaa (pratityasamutpadaa), kaikki kaikista kielistä.
      // Luin ei koskaan anna tyhjää kieltä (skKieli: varalla suomi).
      K = [[A('t', '*')]].concat(erisnimi ? [[A('ne', '*')]] : [], [[A('f', '*')], [A('n', '*')], [A('nf', '*')]]);
    } else if (kieli === 'grc' || kieli === 'el') {
      // Kreikan kaksi kieltä pysyvät yhdessä: ilman diakriitteja kirjoitettu muinaiskreikka tunnistuu nykykreikaksi.
      var b = kieli === 'grc' ? 'el' : 'grc';
      K = [[A('t', kieli, 0, [kieli, b])], [A('f', kieli)], [A('n', kieli)], [A('nf', kieli)], [A('t', b)], [A('f', b)], [A('n', b)], [A('nf', b)], [A('gl', '*', 1)]];
    } else if (kieli === 'la') {
      K = [[A('t', 'la', 0, true)], [A('f', 'la')], [A('n', 'la')], [A('nf', 'la')], [A('t', '*')], [A('f', '*')], [A('lg-t', 'grc', 1)], [A('lg-f', 'grc', 1)], [A('lg-nf', 'grc', 2)]];
    } else if (vieras) {
      K = [[A('t', kieli)]].concat(kieli === 'de' ? [[A('tv', 'de')]] : [], [[A('t', '*')]], kieli === 'fi' ? [[A('tx', 'fi')]] : [], [[A('n', uniq([kieli].concat(SK_VIERAAT)))], [A('f', '*')]]);
      if (y.vip) K.push([A('nf', '*')]);
    } else if (kieli === 'fi') {
      // Erisnimi keskellä virkettä: muiden kielten tasan sama ja perusmuoto heti (nimet ovat yhteisiä); muuten muut kielet
      // vasta viimeisenä.
      // Suomikonteksti (käyttäjän linjaus 6.11.2026): kun suomenkielinen osuma löytyy, muiden kielten tietoja ei näytetä
      // (edes ei tuo latinan sanaa); r-lippu rajaa tasan samat muodot suomeen. Kursiivissa ketju on edellä, jossa muut
      // kielet saavat jäädä mukaan; lainaus on suomikontekstissa kuin leipäteksti, ja lainauksen sisäinen kursiivi on kursiivi.
      // Taulukkohaku (tx) ennen loppunapsua; erisnimellä vasta perusmuodon (ne) jälkeen, ettei Kantin vaihdu kantiksi.
      K = erisnimi ? [[A('t', 'fi', 0, true)], [A('t', '*')], [A('ne', '*')], [A('tx', 'fi')], [A('n', 'fi')], [A('f', 'fi')]] : [[A('t', 'fi', 0, true)], [A('tx', 'fi')], [A('n', 'fi')], [A('f', 'fi')], [A('t', '*')]];
    } else if (kieli === 'de') {
      K = [[A('t', 'de', 0, true)], [A('tv', 'de', 0, true)], [A('n', 'de')], [A('f', '*')]];
    } else if (kieli === 'fr') {
      K = [[A('t', 'fr', 0, true)], [A('f', 'fr')], [A('f', '*')]];
    } else {
      // Englanti (ja ruotsi): muiden kielten tasan sama ennen arvauksia, koska englanti lainaa sanoja taivutuksineen
      // kursivoimatta; sitten hakukoneen tapaan kirjoitettu sama ja loppunapsu samassa ryhmässä. Englannin iso alkukirjain
      // keskellä virkettä (Dasein, Hegel) jättää muut kielet mukaan: nimet ja kursivoimatta lainatut termit ovat yhteisiä.
      K = [[A('t', kieli, 0, !(kieli === 'en' && erisnimi))], [A('t', '*')]].concat(erisnimi ? [[A('ne', '*')]] : [], [[A('f', '*'), A('n', kieli)]]);
    }
    if (monta && !K.some(function (g) { return g.some(function (a) { return a.t === 'nf' && a.k === '*'; }); })) K.push([A('nf', '*')]);
    return K;
  }

  function skOnKieli(j, kielet) { return !!j && Object.keys(j).some(function (k) { return Array.isArray(j[k]) && (kielet === '*' || kielet.indexOf(k) >= 0); }); }
  // Taivutusmuodon perusmuoto: muotomääritelmän (form-of-definition) linkki. Tyhjä, jos jokin sallitun kielen määritelmä on
  // tavallinen (sivu on lemma).
  function skPerusmuoto(j, kielet) {
    var kohde = '', lemma = false;
    Object.keys(j).forEach(function (k) {
      if (!Array.isArray(j[k]) || kielet !== '*' && kielet.indexOf(k) < 0) return;
      j[k].forEach(function (osa) { (osa.definitions || []).forEach(function (d) {
        var h = d.definition || '';
        if (!h.replace(/<[^>]*>/g, '').trim()) return;
        if (h.indexOf('form-of-definition') < 0) { lemma = true; return; }
        var m = !kohde && /form-of-definition-link[\s\S]*?href="(?:\.\/|\/wiki\/)([^"#?:]+)/.exec(h);
        if (m) kohde = decodeURIComponent(m[1]).replace(/_/g, ' ');
      }); });
    });
    return lemma ? '' : kohde;
  }
  // Taivutusmuodon kuvaus Wikisanakirjan omin sanoin ilman perusmuotoa (käyttäjän pyyntö 12.11.2026): "genitive singular of
  // käsi" → "genitive singular", "simple past of go" → "simple past". Skaalautuu sanaluokkiin ja kieliin, koska mitään ei
  // päätellä itse. Enintään kolme eri kuvausta (sama muoto voi olla monta taivutusta).
  function skMuotoKuvaus(j, kielet) {
    var kuv = [];
    Object.keys(j).forEach(function (k) {
      if (!Array.isArray(j[k]) || kielet !== '*' && kielet.indexOf(k) < 0) return;
      j[k].forEach(function (osa) { (osa.definitions || []).forEach(function (d) {
        var h = d.definition || '';
        if (h.indexOf('form-of-definition') < 0) return;
        var e = new DOMParser().parseFromString('<div>' + h + '</div>', 'text/html').body.firstChild;
        [].forEach.call(e.querySelectorAll('.form-of-definition-link, sup'), function (x) { x.remove(); });
        var t = e.textContent.replace(/\s+/g, ' ').replace(/\s+of\s*[:.]?\s*$/i, '').replace(/[\s:.;,]+$/, '').trim();
        if (t && kuv.indexOf(t) < 0) kuv.push(t);
      }); });
    });
    return kuv.slice(0, 3).join('; ');
  }
  // Ehdokkaat järjestykseen: tekstin kieli (kielilistan järjestys), sitten haettu alku itse (poni ennen ponia), lemmat ennen
  // taivutusmuotoja, sitten Wikisanakirjan haun suosituimmuus.
  function skJarjesta(e, kielet, alku) {
    return e.map(function (x) {
      var ks = Object.keys(x.kk || {}), ki = kielet === '*' ? 0 : Math.min.apply(null, ks.map(function (k) { return kielet.indexOf(k); }).filter(function (i) { return i >= 0; }).concat([99]));
      return [x, ki, alku && x.o === alku ? 0 : 1, ks.some(function (k) { return x.kk[k] === 'l'; }) || kielet === '*' ? 0 : 1];
    }).sort(function (a, z) { return a[1] - z[1] || a[2] - z[2] || a[3] - z[3] || a[0].i - z[0].i; }).map(function (x) { return x[0]; });
  }
  // Ehdokkaista enintään neljä vaihtoehtoa (käyttäjän pyyntö 5.11.2026). perus: taivutusmuoto vaihtuu perusmuotoonsa
  // (ennemmin perusmuoto kuin taivutus), ja saman perusmuodon muodot yhdistyvät.
  function skVaihtoehdot(ehd, kielet, tapa, perus) {
    var top = ehd.slice(0, 6);
    return Promise.all(top.map(function (e) { return haeSana(e.o).catch(function () { return null; }); })).then(function (js) {
      var out = [], nahty = {};
      top.forEach(function (e, i) {
        var j = js[i];
        if (!skOnKieli(j, kielet)) return;
        var pm = perus ? skPerusmuoto(j, kielet) : '', o = pm || e.o;
        if (nahty[o]) return;
        nahty[o] = 1;
        out.push({ o: o, j: pm ? null : j, kielet: kielet, tapa: tapa, kl: skKieletNimin(j, kielet) });
      });
      return out.slice(0, 4);
    });
  }
  function skKieletNimin(j, kielet) {
    var ks = Object.keys(j).filter(function (k) { return Array.isArray(j[k]) && j[k].length && (kielet === '*' || kielet.indexOf(k) >= 0); });
    return ks.map(function (k, i) { return [k, i]; }).sort(function (a, z) { return skJarjKieli(a[0], kielet, kielet === '*' ? '' : kielet[0]) - skJarjKieli(z[0], kielet, kielet === '*' ? '' : kielet[0]) || a[1] - z[1]; })
      .map(function (x) { return j[x[0]][0].language || SK_NIMI[x[0]] || x[0]; }).slice(0, 2).join(', ');
  }
  function skYhdista(listat) {
    var nahty = {}, out = [];
    listat.forEach(function (l) { (l || []).forEach(function (e) { if (!nahty[e.o]) { nahty[e.o] = 1; out.push(e); } }); });
    return out;
  }
  // Kreikan kirjaimet latinalaisiksi (oljenkorsi): karkea henkäys h:ksi, diftongit au, eu, ou; υ myös u:na (hybris, hubris).
  function skLatinaksi(s) {
    var M = { α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'e', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p',
      ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'ph', χ: 'ch', ψ: 'ps', ω: 'o' };
    var lat = s.split(/(\s+)/).map(function (w) {
      var d = w.normalize('NFD'), h = /^[^\p{L}]*[\p{L}][̀-ͯ]*̔/u.test(d) || /̔/.test(d.slice(0, 4));
      var p = d.replace(/[̀-ͯ]/g, '').toLowerCase().replace(/αυ/g, 'au').replace(/ευ/g, 'eu').replace(/ηυ/g, 'eu').replace(/ου/g, 'ou')
        .replace(/γ(?=[γκξχ])/g, 'n').replace(/[α-ως]/g, function (c) { return M[c] || c; });
      return h ? (p.charAt(0) === 'r' ? 'rh' + p.slice(1) : 'h' + p) : p;
    }).join('');
    return uniq([lat, lat.replace(/y/g, 'u'), lat.replace(/k/g, 'c')]);
  }
  // Latinalaiset kirjaimet kreikkalaisiksi (epätoivoinen yritys): ē η, ō ω, loppu-e η (psyche → ψυχη), th φ ch ps x jne.
  function skKreikaksi(s) {
    var P = [['th', 'θ'], ['ph', 'φ'], ['ch', 'χ'], ['kh', 'χ'], ['ps', 'ψ'], ['rh', 'ρ'], ['ks', 'ξ'], ['ng', 'γγ'], ['nk', 'γκ'], ['ou', 'ου']];
    var Y = { a: 'α', b: 'β', g: 'γ', d: 'δ', e: 'ε', z: 'ζ', i: 'ι', j: 'ι', k: 'κ', c: 'κ', q: 'κ', l: 'λ', m: 'μ', n: 'ν', x: 'ξ', o: 'ο', p: 'π',
      r: 'ρ', s: 'σ', t: 'τ', u: 'υ', y: 'υ', f: 'φ', v: 'β', w: 'ω', h: '', 'η': 'η', 'ω': 'ω' };
    return s.split(/(\s+)/).map(function (w) {
      if (/^\s+$/.test(w)) return w;
      w = w.toLowerCase().replace(/ē/g, 'η').replace(/ō/g, 'ω').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^h/, '').replace(/e$/, 'η');
      P.forEach(function (p) { w = w.split(p[0]).join(p[1]); });
      return w.replace(/[a-z]/g, function (c) { return Y[c] || ''; }).replace(/σ$/, 'ς');
    }).join('');
  }

  // Yksi askel. Palauttaa { tapa, osumat: [{ o, j, kielet }] } (tasan sama: kaikki löytyneet muodot yhdessä) tai
  // { tapa, vaihdot: [...] } (arvaukset: enintään neljä vaihtoehtoa) tai null.
  function skAskel(a, haku, y) {
    var t = a.t, k = a.k, monta = sanaLkm(haku) > 1;
    if (t === 'gl') return skTasan(skLatinaksi(haku), '*', 'gl');
    if (t.indexOf('lg-') === 0) return skAskel({ t: t.slice(3), k: k }, skKreikaksi(haku), y);
    if (t === 't' || t === 'tv') return skTasan(t === 't' ? skMuodot(haku) : skSaksaMuodot(haku), k, t, a.r);
    if (t === 'ne') {
      // Erisnimi keskellä virkettä (Kantin, Hegelin, Heideggerin): perusmuoto kaikista kielistä tasan samana, lopusta
      // napsien; pisin löytyvä voittaa.
      var m = [], n = skNapsu(kirjaimia(haku));
      for (var i = 1; i <= Math.min(n, 4); i++) { var c = skKatkaise(haku, i); if (kirjaimia(c) >= 3) m.push(c); }
      return Promise.all(m.map(function (x) { return haeSana(x); })).then(function (js) {
        for (var i = 0; i < m.length; i++) if (js[i]) return { tapa: 'n', vaihdot: [{ o: m[i], j: js[i], kielet: '*', tapa: 'n' }] };
        return null;
      });
    }
    var taita = t === 'nf' || t === 'f', jo = skMuodot(haku), pituus = kirjaimia(haku);
    if (t === 'tx') {
      // Taulukkohaku (käyttäjän pyyntö 14.11.2026): Wikisanakirjan tekstihaku indeksoi taivutustaulukot, joten tasan
      // tekstin muodolla haku löytää perusmuodon, jonka taulukossa muoto on (käsitteen → käsite), vaikka muodolla ei ole
      // omaa sivua eikä perusmuoto ala napsitulla alulla (vartalo vaihtuu). Vain kielen lemmat ilman välilyöntiä, sama
      // alku vähintään kaksi kirjainta (esimerkkilauseet pois) ja enintään kirjaimen pidempi kuin muoto (hakea → haen).
      if (monta || pituus < 3) return Promise.resolve(null);
      var tt = skTaitto(haku);
      return skEhdokkaat(haku, k, 'teksti').then(function (ls) {
        var e = ls.filter(function (x) {
          return x.o.indexOf(' ') < 0 && jo.indexOf(x.o) < 0 && k.some(function (kk) { return x.kk[kk] === 'l'; }) &&
            yhteinenAlku(skTaitto(x.o), tt) >= 2 && kirjaimia(x.o) <= pituus + 1;
        }).sort(function (a, z) { return yhteinenAlku(skTaitto(z.o), tt) - yhteinenAlku(skTaitto(a.o), tt) || a.i - z.i; });
        if (!e.length) return null;
        return skVaihtoehdot(e, k, 'tx', false).then(function (v) {
          v.forEach(function (x) { x.muoto = { o: y.alku ? ekaPieni(haku) : haku, kuvaus: '' }; });
          return v.length ? { tapa: 'tx', vaihdot: v } : null;
        });
      });
    }
    if (t === 'f') {
      var tf = skTaitto(haku), qs = uniq([haku, tf]);
      var haut = qs.map(function (q) { return skEhdokkaat(q, k, 'alku'); }).concat([skEhdokkaat(haku, k, 'teksti')]);
      return Promise.all(haut).then(function (ls) {
        var e = skYhdista(ls).filter(function (x) { return skTaitto(x.o) === tf && jo.indexOf(x.o) < 0; });
        return e.length ? skVaihtoehdot(skJarjesta(e, k), k, 'f', false).then(function (v) { return v.length ? { tapa: 'f', vaihdot: v } : null; }) : null;
      });
    }
    // Loppunapsu: yksi kirjain kerrallaan lopusta, ja ensimmäinen napsu, josta tulee ehdokkaita, ratkaisee. Kirjainkoko on
    // vapaa vain virkkeen alussa (muuten Kantin ei vaihdu kanaksi); nf vapauttaa myös lukumerkit.
    var versaali = haku === haku.toUpperCase() && haku !== haku.toLowerCase();
    function alkaa(o, q) {
      if (taita) return skTaitto(o).indexOf(skTaitto(q)) === 0;
      o = skSuora(o); q = skSuora(q);
      if (versaali) return o.toLowerCase().indexOf(q.toLowerCase()) === 0;
      return y.alku ? ekaPieni(o).indexOf(ekaPieni(q)) === 0 : o.indexOf(q) === 0;
    }
    var askeleet = [];
    if (monta) skIlmausHaut(haku).forEach(function (q) { askeleet.push({ q: q, ok: function (o) { return skSanoittain(haku, o, taita); } }); });
    else for (var j = 1; j <= skNapsu(kirjaimia(haku)); j++) (function (q) {
      if (q) askeleet.push({ q: q, alku: q, ok: function (o) { return o.indexOf(' ') < 0 && alkaa(o, q) && jo.indexOf(o) < 0; } });
    })(skKatkaise(haku, j));
    // Pituusehto (käyttäjän pyyntö 14.11.2026): perusmuoto on harvoin yli kirjaimen pidempi kuin taivutusmuoto, joten
    // pidemmät ehdokkaat ovat johdoksia ja yhdyssanoja (käsittee → käsitteellinen). Yhden sanan napsu jatkuu, kunnes
    // tulee lyhyitä ehdokkaita, ja ne näytetään yksin; pitkät ensimmäisestä napsusta vasta, jos lyhyitä ei tule lainkaan.
    var varalla = null;
    function lyhyt(x) { return kirjaimia(x.o) <= pituus + 1; }
    function tarjoa(e, s, i) {
      return skVaihtoehdot(skJarjesta(e, k, s.alku), k, t, true).then(function (v) {
        // Ilmaus, joka poikkeaa vain väli- ja lukumerkeiltään (ars longa vita brevis), on sama toisin kirjoitettuna.
        v.forEach(function (x) { if (monta && skTaitto(x.o) === skTaitto(haku)) x.tapa = 'f'; });
        return v.length ? { tapa: t, vaihdot: v } : seuraava(i + 1);
      });
    }
    function seuraava(i) {
      if (i >= askeleet.length) {
        if (!varalla) return Promise.resolve(null);
        var w = varalla; varalla = null;
        return tarjoa(w.e, w.s, askeleet.length);
      }
      var s = askeleet[i], qs = taita ? uniq([s.q, skTaitto(s.q)]) : [s.q], haut = qs.map(function (q) { return skEhdokkaat(q, k, 'alku'); });
      // nf: napsittu sana kokonaisena myös koko tekstin hausta, jos alkuhaku ei taita lukumerkkejä (pratityasamutpadaa →
      // pratityasamutpada → pratītyasamutpāda).
      if (taita && !monta) haut.push(skEhdokkaat(s.q, k, 'teksti'));
      return Promise.all(haut).then(function (ls) {
        var e = skYhdista(ls).filter(function (x) { return s.ok(x.o); });
        if (!e.length) return seuraava(i + 1);
        if (!monta) {
          var lyh = e.filter(lyhyt);
          if (!lyh.length) { if (!varalla) varalla = { e: e, s: s }; return seuraava(i + 1); }
          e = lyh;
        }
        return tarjoa(e, s, i);
      });
    }
    return seuraava(0);
  }
  // rajaa: vain nämä kielet (ketjun kieli ja sen sisarkieli) osumiin ja määritelmiin; muut kielet jäävät pois.
  function skTasan(muodot, k, tapa, rajaa) {
    return Promise.all(muodot.map(function (m) { return haeSana(m); })).then(function (js) {
      var kk = rajaa || '*';
      var os = muodot.map(function (m, i) { return { o: m, j: js[i], kielet: kk }; }).filter(function (x) { return x.j && skOnKieli(x.j, kk); });
      if (!os.some(function (x) { return skOnKieli(x.j, k); })) return null;
      // Ketjun kielen osumat ensin; muut kielet saavat jäädä mukaan (tasan sama muoto, käyttäjän linjaus 5.11.2026). Sitten
      // määritelmä ennen pelkkää taivutusviittausta (käyttäjän palaute 6.11.2026: virkkeen alun As on englanniksi vain
      // plural of A, joten as tulee ensin; erisnimi kuten Kant on lemma ja pysyy ensin). Muuten tekstin muoto ensin.
      var muotoVain = function (x) { return skPerusmuoto(x.j, kk) ? 1 : 0; };
      os.sort(function (a, z) { return (skOnKieli(z.j, k) ? 1 : 0) - (skOnKieli(a.j, k) ? 1 : 0) || muotoVain(a) - muotoVain(z); });
      return { tapa: tapa, osumat: os };
    });
  }

  function skHtml(h) {
    var out = '', d = new DOMParser().parseFromString('<div>' + h + '</div>', 'text/html');
    (function kay(n) {
      [].forEach.call(n.childNodes, function (c) {
        if (c.nodeType === 3) { out += esc(c.nodeValue); return; }
        if (c.nodeType !== 1 || /^(SUP|STYLE|SCRIPT|LINK)$/.test(c.tagName)) return;
        if (c.tagName === 'A') {
          var m = /^(?:\/wiki\/|\.\/)([^#:?\/]+)(?:#([^?]*))?$/.exec(c.getAttribute('href') || '');
          out += m ? '<button type="button" class="sk-sana" data-k="sk-sana" data-sana="' + esc(decodeURIComponent(m[1]).replace(/_/g, ' ')) + '"' +
            (m[2] ? ' data-kieli="' + esc(decodeURIComponent(m[2]).replace(/_/g, ' ')) + '"' : '') + '>' + esc(c.textContent) + '</button>' : esc(c.textContent);
          return;
        }
        var t = /^(I|EM)$/.test(c.tagName) ? 'em' : /^(B|STRONG)$/.test(c.tagName) ? 'b' : '';
        if (t) out += '<' + t + '>';
        kay(c);
        if (t) out += '</' + t + '>';
      });
    })(d.body.firstChild);
    return out;
  }
  // Määritelmät kielittäin: etusijakieli ensin, sitten ketjun kielet, englanti ja suomi; enintään neljä kieltä, kolme
  // sanaluokkaa ja neljä määritelmää kustakin. Palauttaa myös näytetyt kielet (kielihuomautusta varten).
  function skSisalto(j, kielet, etusija, tilaa) {
    var jarj = function (k) { return skJarjKieli(k, kielet, etusija); };
    var ks = Object.keys(j).filter(function (k) { return Array.isArray(j[k]) && (kielet === '*' || kielet.indexOf(k) >= 0); });
    ks = ks.map(function (k, i) { return [k, i]; }).sort(function (a, z) { return jarj(a[0]) - jarj(z[0]) || a[1] - z[1]; }).map(function (x) { return x[0]; });
    var html = '', nayt = [];
    ks.slice(0, tilaa == null ? 4 : tilaa).forEach(function (k) {
      var osat = '';
      j[k].slice(0, 3).forEach(function (osa) {
        var defs = (osa.definitions || []).filter(function (d) { return d.definition && d.definition.replace(/<[^>]*>/g, '').trim(); }).slice(0, 4);
        if (!defs.length) return;
        osat += '<div class="sk-kieli">' + esc(osa.language || k) + (osa.partOfSpeech ? ' · ' + esc(osa.partOfSpeech) : '') + '</div><ol class="sk-ol">' +
          defs.map(function (d) { return '<li>' + skHtml(d.definition) + '</li>'; }).join('') + '</ol>';
      });
      if (osat) { html += osat; nayt.push(k); }
    });
    return { html: html, kielet: nayt };
  }
  // Varoitusmerkki: suora salmiakki ja huutomerkki, jonka piste on pieni salmiakki (vinoneliöestetiikkaa).
  var IK_VARO = '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11 1.2L20.8 11L11 20.8L1.2 11Z" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
    '<path d="M11 5.8V12.8" stroke="currentColor" stroke-width="1.9"/><path d="M11 14.5L12.3 15.8L11 17.1L9.7 15.8Z" fill="currentColor"/></svg>';
  var IK_SULJE_SK = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1L9 9M9 1L1 9"/></svg>';
  /* Alkuperän merkki (käyttäjän pyynnöt 12.11.2026): suurennuslasi kuten sanaselityksen merkissä, mutta linssin sisällä pieni
     epsilon (ἔτυμον). Alaindeksinä sanan perässä: epsilonin peruslinja (y 0) on sanan peruslinjalla, ja linssin kehä on
     epäkeskosti niin, että se kulkee tiukasti epsilonin yläpuolelta: henkäyksen ja aksentin voi kuvitella jääneen kehän taakse.
     Varsi kurkottaa vasemmalle alas sanan loppukirjaimen alle, 55° vaakatasosta (käyttäjä: 35° oli liian lappeellaan), 9 px pitkä, ja
     epsilonin keskusta on linssin keskustan oikealla puolella; linssi (kehä ja varsi) on 1 px ylempänä ja vasemmalla
     epsiloniin nähden (käyttäjän kokeilu 13.11.2026, translate). Yksikkö on CSS-pikseli; viewBox rajaa
     linssin, ja varsi piirtyy sen ulkopuolelle (overflow visible). Linssi on aina muste; värit kuten CSS:ssä (käyttäjän pyyntö 14.11.2026). */
  var IK_ETY = '<svg viewBox="-7.55 -9.6 15.1 15.15" aria-hidden="true"><g class="linssi" transform="translate(-1 -1)"><circle cx="0" cy="-2.05" r="7" stroke-width="1.1"/>' +
    '<path d="M-4.02 3.68L-9.19 11.05" stroke-width="1.35"/></g><path class="e" stroke-width=".95" transform="translate(-1.1 -7.1) scale(.72)" ' +
    'd="M6.5 1.3C5.9.5 5 .1 3.9.1C2.2.1 1 1 1 2.3C1 3.6 2.2 4.5 3.7 4.5H5.2M3.7 4.5C1.8 4.5.3 5.4.3 6.8C.3 8.3 1.8 9.3 3.8 9.3C5.1 9.3 6.2 8.8 6.9 7.9" ' +
    'vector-effect="non-scaling-stroke"/></svg>';
  function skEtyNappi(o) {
    return '<button type="button" class="sk-ety" data-k="sk-ety" data-o="' + esc(o) + '" aria-pressed="false" aria-label="Alkuperä: ' + esc(o) +
      '" title="Alkuperä">' + IK_ETY + '</button>';
  }
  // Paikka, johon nappi tulee vasta, kun alkuperä on todettu olevan (käyttäjän pyyntö 12.11.2026).
  function skEtyPaikka(o) { return '<span class="sk-ety-nappi" data-o="' + esc(o) + '"></span>'; }
  /* Alkuperä Wikisanakirjan sivun Etymology-osioista (MediaWikin action=parse, origin=*). REST-määritelmissä etymologiaa ei
     ole. Ensin osioluettelo (pieni), sitten vain tarvittavat osiot: koko sivu olisi yleisellä sanalla megatavuja. Kielet ovat
     ne, joiden määritelmät selityksessä näkyivät (nimellä, kuten skNormita lukee), samassa järjestyksessä. Osion tekstistä
     otetaan vain oman otsikon ja seuraavan otsikon väliset kappaleet ja luettelorivit (ei puuta, taulukoita eikä
     ääntämystä). Haku vain napautuksesta. */
  var SK_PARSE_API = 'https://en.wiktionary.org/w/api.php?action=parse&format=json&formatversion=2&origin=*',
    SK_PARSE = SK_PARSE_API + '&redirects=1&disableeditsection=1&page=', skEtyVarasto = {};
  // API:n virhe tulee HTTP 200:lla; puuttuva sivu on tyhjä, muut virheet ovat virheitä (ei "ei kirjattu").
  function skVastaus(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json().then(function (j) {
      if (j && j.error && j.error.code !== 'missingtitle') throw new Error(j.error.code || 'api');
      return j && j.parse || null;
    });
  }
  function skParse(o, lisa) { return fetch(SK_PARSE + encodeURIComponent(o) + lisa).then(skVastaus); }
  // Wikiteksti jäsennettynä sivun nimellä (POST: osio voi olla pitkä; origin on oltava osoitteessa).
  function skJasenna(otsikko, teksti) {
    var q = new URLSearchParams(); q.set('title', otsikko); q.set('contentmodel', 'wikitext'); q.set('prop', 'text'); q.set('text', teksti);
    return fetch(SK_PARSE_API + '&disableeditsection=1', { method: 'POST', body: q }).then(skVastaus).then(function (pp) { return (pp && pp.text) || ''; });
  }
  // Sivun osioluettelo (pieni) on yhteinen alkuperän saatavuudelle, perusmuodon päätökselle ja laatikolle: haetaan kerran.
  var skOsioVarasto = {};
  function haeOsiot(o) {
    if (skOsioVarasto[o]) return skOsioVarasto[o];
    var p = skParse(o, '&prop=sections').then(function (ps) { return (ps && ps.sections) || []; });
    p.catch(function () { delete skOsioVarasto[o]; });
    return (skOsioVarasto[o] = p);
  }
  // Etymology-osiot annetuista kielistä (nimet; null = kaikki) selityksen järjestyksessä; kustakin kielestä enintään kolme
  // (Etymology 1–3), yhteensä enintään kuusi.
  function skEtyOsiot(sections, nimet) {
    var kieli = '', osiot = [], jarj = function (k) { return nimet ? nimet.indexOf(k) : 0; };
    (sections || []).forEach(function (s) {
      var rivi = String(s.line || '').replace(/<[^>]*>/g, '').trim();
      if (+s.level === 2) { kieli = rivi; return; }
      if (/^Etymology(?:\s+\d+)?$/.test(rivi) && (!nimet || nimet.indexOf(kieli) >= 0) && /^\d+$/.test(String(s.index)))
        osiot.push({ kieli: kieli, nro: (/\d+$/.exec(rivi) || [''])[0], i: s.index });
    });
    return osiot.map(function (x, n) { return [x, n]; }).sort(function (a, z) { return jarj(a[0].kieli) - jarj(z[0].kieli) || a[1] - z[1]; })
      .map(function (x) { return x[0]; }).filter(function (x, n, kaikki) {
        return kaikki.slice(0, n).filter(function (y) { return y.kieli === x.kieli; }).length < 3;
      }).slice(0, 6);
  }
  /* Osiota ei jäsennetä yksinään (section=N): Wikisanakirjan etymologiamallineet ({{der}}, {{bor}} ym.) tarkistavat, että
     kieli on sama kuin nykyinen kielen otsikko (L2), ja lukevat sen otsikkolaskurista (Module:pages get_current_L2). Yksinään
     jäsennetty osio on laskurissa osio 1 eli sivun ensimmäinen kieli, joten muun kielen etymologia oli Lua-virhe (historia:
     suomi osio 24, virhe "does not match the L2 header (Albanian)", käyttäjän havainto 14.11.2026). Siksi haetaan osion
     wikiteksti, karsitaan se oman otsikon ja seuraavan otsikon väliin ja jäsennetään kaikki osiot yhdessä pyynnössä sivun
     nimellä niin, että kunkin edellä on täyteotsikoita (=a=) tasan sen osionumeroon asti. */
  function skEtyWiki(wt) {
    var rivit = String(wt || '').split('\n'), out = [rivit[0]];
    for (var i = 1; i < rivit.length && !/^(={1,6}).+\1\s*$/.test(rivit[i]); i++) out.push(rivit[i]);
    return out.join('\n');
  }
  function haeAlkupera(o, nimet) {
    var avain = o + '|' + nimet.join('|');
    if (skEtyVarasto[avain]) return skEtyVarasto[avain];
    var p = haeOsiot(o).then(function (sections) {
      var osiot = skEtyOsiot(sections, nimet), otsikko = o;
      if (!osiot.length) return osiot;
      return Promise.all(osiot.map(function (x) {
        return skParse(o, '&prop=wikitext&section=' + x.i).then(function (pp) {
          if (pp && pp.title) otsikko = pp.title;
          x.wiki = skEtyWiki(pp && pp.wikitext); return x;
        });
      })).then(function () {
        var teksti = '__NOTOC__\n', ed = 0;
        osiot.slice().sort(function (a, z) { return a.i - z.i; }).forEach(function (x) {
          for (var k = ed + 1; k < +x.i; k++) teksti += '=a=\n';
          teksti += x.wiki + '\n'; ed = +x.i;
        });
        return skJasenna(otsikko, teksti);
      }).then(function (h) {
        var osat = skOsiot(h);
        osiot.forEach(function (x) { var t = skEtyHtml(osat[x.i] || []); x.html = t.html; x.virhe = t.virhe; });
        return osiot;
      });
    });
    p.catch(function () { delete skEtyVarasto[avain]; });
    return (skEtyVarasto[avain] = p);
  }
  /* Jäsennetyn tekstin elementit otsikoittain: osat[n] = n:nnen otsikon jälkeiset elementit (otsikot laskettuina kuten osiot).
     Mobiiliselaimelle (esim. Androidin Firefox) Wikimedia muotoilee jäsennyksen mobiilisivuksi: ylimmän tason otsikon jälkeinen
     sisältö on <section class="mf-section-N collapsible-block">-kääreessä, ja alemmat otsikot ovat sen sisällä (mitattu
     14.11.2026: historia, Etymology h3 osion 23 kääreessä, otsikoita löytyi 23/24, ja alkuperä näytti kirjaamattomalta).
     Kääreet puretaan, joten järjestys on sama kuin työpöytämuodossa. */
  function skOsiot(h) {
    var d = new DOMParser().parseFromString(String(h || ''), 'text/html'), juuri = d.querySelector('.mw-parser-output') || d.body, osat = {}, n = 0;
    (function kay(isa) {
      for (var e = isa.firstElementChild; e; e = e.nextElementSibling) {
        if (e.tagName === 'SECTION') { kay(e); continue; }
        if (/^H[1-6]$/.test(e.tagName) || e.classList.contains('mw-heading')) { n++; continue; }
        (osat[n] = osat[n] || []).push(e);
      }
    })(juuri);
    return osat;
  }
  // Kappaleet ja luettelorivit; Lua-virheen sisältävä kappale jää pois (virhe: true), jottei virheteksti näy alkuperänä.
  function skEtyHtml(lista) {
    var kpl = [], virhe = false;
    lista.forEach(function (e) {
      if (e.tagName === 'P') kpl.push([e, false]);
      else if (/^(UL|OL)$/.test(e.tagName)) [].forEach.call(e.children, function (li) { if (li.tagName === 'LI') kpl.push([li, true]); });
    });
    var html = kpl.map(function (x) {
      if (x[0].querySelector('.error, .scribunto-error')) { virhe = true; return ''; }
      [].forEach.call(x[0].querySelectorAll('ul, ol, dl, table, style, .NavFrame, .mw-collapsible'), function (y) { y.remove(); });
      var t = skHtml(x[0].innerHTML).trim();
      return t ? '<p class="sk-ety-p' + (x[1] ? ' sk-ety-li' : '') + '">' + t + '</p>' : '';
    }).filter(Boolean).slice(0, 6).join('');
    return { html: html, virhe: virhe && !html };
  }
  function skKehys(otsikko, linkki) {
    // Otsikossa ei ole lambdaa (käyttäjän pyyntö 12.11.2026): määritelmillä on oma λόγος-otsikkonsa kuten alkuperällä ἔτυμον.
    // λόγος on koko ikkunan otsikko (käyttäjä: sana asialle ja sen selitykselle), ylimpänä kuten ἔτυμον laatikossaan, ja
    // raksi on sen rivillä kuten laatikon raksi.
    // Vain ikkunassa, jossa on selitys (käyttäjän pyyntö 12.11.2026: ei valitsimessa eikä viesteissä), siksi aluksi piilossa.
    // Otsikko ei näytä linkiltä, mutta vie sanan λόγος selitykseen (käyttäjän vitsi; ΕΤΥΜΟΝ samoin).
    return '<button type="button" class="sk-osa sk-logos" data-k="sk-osa" data-sana="λόγος|logos" lang="grc" title="Sana (logos)" hidden>ΛΟΓΟΣ</button><div class="sk-ots"><span class="sk-o">' + esc(otsikko) + '</span></div>' +
      '<button type="button" class="sk-sulje" data-k="sk-sulje" aria-label="Sulje" title="Sulje">' + IK_SULJE_SK + '</button>' +
      '<div class="sk-runko"><div class="sk-tieto">Haetaan…</div></div><div class="sk-ala">' + skLisa(linkki) + '</div>';
  }
  // Lisää on pelkkä ruosteinen plussa (käyttäjän pyynnöt 12.11.2026; ennen sana *lisää*, välillä kehystettynä).
  function skLisa(o) { return o ? '<a class="sk-lisa" title="Avaa Wiktionary" aria-label="Avaa Wiktionary" href="https://en.wiktionary.org/wiki/' + encodeURIComponent(o.replace(/ /g, '_')) + '"><svg viewBox="6.75 6.75 10.5 10.5" aria-hidden="true"><path class="plus" d="M12 7.4V16.6M7.4 12H16.6"/></svg></a>' : ''; }
  function skKieliKoodi(nimi) { return Object.keys(SK_NIMI).filter(function (k) { return SK_NIMI[k] === nimi; })[0] || ''; }

  /* Selitysistunto: yksi haku ja sen sisäiset siirrot. Ketju ajetaan loppuun asti vain, jos tasan samaa ei löydy.
     Wikisanakirjassa ei surffata takaisin päin (käyttäjän linjaus 5.11.2026: Luin ei ole selain): perusmuodon linkki ja
     vaihtoehdon valinta vievät eteenpäin, raksi sulkee.
     o.juuri: elementti, jossa on skKehys(); o.auki(): onko kehys yhä tämän haun (myöhästyneet vastaukset eivät piirrä);
     o.sijoita(): kutsutaan sisällön muututtua (luin.html: sijoitaPop); o.haku: skHakusana(); o.y: ympäristö (kieli, alku,
     kursiivi, lainaus, vip, oma, omaKieli, pikkusana, symboli; tyhjä kieli = tuntematon); o.ketju: skKetju(); o.kirjoitettu:
     haku on käyttäjän kirjoittama eikä tekstin sana (huomautukset sanovat Haettu x, eivät Tekstissä x). Palauttaa { aja, klikkaus(k, b) }:
     klikkaus käsittelee kehyksen data-k-napit ja palauttaa false, kun kehyksen saa sulkea (raksi). */
  function istunto(o) {
    var pop = o.juuri, haku = o.haku, y = o.y, ketju = o.ketju, vuoro = ++skVuoro, vaihdot = [], virhe = false, askel = null;
    var monta = sanaLkm(haku) > 1;
    function sijoitaPop() { if (o.sijoita) o.sijoita(); }
    function klikkaus(k, b) {
      if (k === 'sk-sulje') return false;
      if (k === 'sk-sana') { vuoro = ++skVuoro; suoraan(b.dataset.sana, skKieliKoodi(b.dataset.kieli || '') || y.kieli); return true; }
      if (k === 'sk-vaihto') { vuoro = ++skVuoro; valitse(vaihdot[+b.dataset.i]); return true; }
      if (k === 'sk-ety') { alkupera(b.dataset.o); return true; }
      if (k === 'sk-osa') { vuoro = ++skVuoro; suoraanKetju(b.dataset.sana.split('|')); return true; }
      return true;
    }
    function ajossa(v) { return v === skVuoro && o.auki(); }
    // ety: otsikon sivu, jolle tulee alkuperän paikka (vain selityksessä, ei valitsimessa eikä viesteissä).
    function nayta(v, otsikko, runko, lahde, linkki, ety) {
      if (!ajossa(v)) return;
      $('.sk-o', pop).innerHTML = esc(otsikko) + (ety ? skEtyPaikka(ety) : '');
      $('.sk-logos', pop).hidden = !ety;
      pop.classList.toggle('sk-logos-nak', !!ety);
      $('.sk-runko', pop).innerHTML = runko;
      $('.sk-ala', pop).innerHTML = (lahde ? SK_LAHDE : '') + skLisa(linkki);
      sijoitaPop();
    }
    function huom(r) { return '<div class="sk-huom">' + r + '</div>'; }
    function kieliHuom(nayt) {
      return y.kieli && nayt.length && nayt.indexOf(y.kieli) < 0 ? huom(SK_ELAT[y.kieli].charAt(0).toUpperCase() + SK_ELAT[y.kieli].slice(1) + ' ei osumaa: selitys on toisen kielen.') : '';
    }
    function varoitus(a) {
      if (!a || !a.v) return '';
      var mita = a.t === 'gl' ? 'latinalaisin kirjaimin' : a.v === 2 ? 'kreikkalaisin kirjaimin, loppua napsien ja lukumerkeistä välittämättä' : 'kreikkalaisin kirjaimin';
      return '<div class="sk-varo">' + IK_VARO + '<span><b>' + (a.v === 2 ? 'SOS.' : 'Heikoilla jäillä.') + '</b> Haettu ' + (o.kirjoitettu ? '' : 'tekstin ') + '<i>' + esc(haku) + '</i> ' + mita + '.</span></div>';
    }
    function tekstissa(tapa, monia) {
      var x = '<i>' + esc(haku) + '</i>';
      if (tapa === 'tx' && !monia) return '';
      if (tapa === 'f' || tapa === 'tv') return huom((o.kirjoitettu ? 'Haettu ' : 'Tekstissä ') + x + (monia ? '. Sama toisin kirjoitettuna:' : ': sama toisin kirjoitettuna.'));
      return huom(monia ? 'Lähimmät osumat:' : 'Lähin osuma.');
    }
    // Selitys (yksi tai useampi tasan sama muoto). alku: huomautukset ennen määritelmiä.
    // Perusmuoto ensin (käyttäjän pyyntö 12.11.2026, skPerusEnsin): sivu, jolla on näkyvissä kielissä pelkkiä
    // taivutusviittauksia (käden: genitive singular of käsi), vaihtuu perusmuotoonsa, ja taivutus näkyy pienellä otsikon
    // alla Wikisanakirjan omin sanoin (käden · genitive singular). Muoto pysyy, jos sillä on omia merkityksiä (skPerusmuoto)
    // tai oma etymologia: Wikisanakirjassa taivutusmuodolla voi olla oma elämänsä.
    // Alkuperän laatikolle on paikka kunkin sivun määritelmien edellä (sk-ety-paikka); etyKielet muistaa, minkä kielten
    // määritelmät sivulta näkyivät.
    var etyKielet = {};
    function selitys(v, osumat, alku, etusija) {
      skPerusEnsin(osumat, etusija || y.kieli).then(function (os) { piirraSelitys(v, os, alku, etusija); })
        .catch(function () { piirraSelitys(v, osumat, alku, etusija); });
    }
    function piirraSelitys(v, osumat, alku, etusija) {
      if (!ajossa(v)) return;
      var runko = '', nayt = [], tilaa = 4, ylin = '';
      osumat.forEach(function (x, i) {
        if (tilaa <= 0) return;
        var s = skSisalto(x.j, x.kielet, etusija || y.kieli, tilaa);
        if (!s.html) return;
        etyKielet[x.o] = s.kielet.map(function (k) { return (x.j[k][0] || {}).language || ''; });
        var muoto = x.muoto ? '<div class="sk-muoto">(”' + esc(x.muoto.o) + '”' + (x.muoto.kuvaus ? ' · ' + esc(x.muoto.kuvaus) : '') + ')</div>' : '';
        if (i > 0) runko += '<div class="sk-alaots"><span>' + esc(x.o) + skEtyPaikka(x.o) + '</span></div>' + muoto;
        else ylin = muoto;
        runko += '<div class="sk-ety-paikka" data-o="' + esc(x.o) + '"></div>' + s.html;
        nayt = nayt.concat(s.kielet); tilaa -= s.kielet.length;
      });
      nayta(v, osumat[0].o, ylin + (alku || '') + (etusija ? '' : kieliHuom(nayt)) + runko, true, osumat[0].o, osumat[0].o);
      osumat.forEach(function (x) { if (etyKielet[x.o]) etyNapiksi(v, x.o, etyKielet[x.o]); });
    }
    function skPerusEnsin(osumat, etusija) {
      return Promise.all(osumat.map(function (x) {
        var kielet = skSisalto(x.j, x.kielet, etusija, 4).kielet, perus = skPerusmuoto(x.j, kielet);
        if (!perus || perus === x.o) return x;
        var nimet = kielet.map(function (k) { return (x.j[k][0] || {}).language || ''; });
        return haeOsiot(x.o).catch(function () { return []; }).then(function (sections) {
          if (skEtyOsiot(sections, nimet).length) return x;
          return haeSana(perus).then(function (j) {
            if (!j || !skOnKieli(j, kielet)) return x;
            return { o: perus, j: j, kielet: kielet, tapa: x.tapa, muoto: { o: x.o, kuvaus: skMuotoKuvaus(x.j, kielet) } };
          });
        }).catch(function () { return x; });
      })).then(function (os) {
        // Kaksi tekstin muotoa voi johtaa samaan perusmuotoon (As ja as): sivu kerran.
        return os.filter(function (x, i) { return !os.slice(0, i).some(function (z) { return z.o === x.o; }); });
      });
    }
    // Alkuperän nappi vain, kun sivulla on Etymology-osio näkyneissä kielissä (käyttäjän pyyntö 12.11.2026). Osioluettelo
    // jää muistiin, joten laatikon avaus ei hae sitä uudelleen.
    function etyNapiksi(v, o, nimet) {
      haeOsiot(o).then(function (sections) {
        if (!ajossa(v) || !skEtyOsiot(sections, nimet).length) return;
        [].forEach.call(pop.querySelectorAll('.sk-ety-nappi'), function (e) { if (e.dataset.o === o && !e.firstChild) e.innerHTML = skEtyNappi(o); });
      }).catch(function () {});
    }
    // Avaa tai sulkee sivun o alkuperän (epsilon tai laatikon raksi).
    function alkupera(o) {
      var v = skVuoro, paikka = [].filter.call(pop.querySelectorAll('.sk-ety-paikka'), function (e) { return e.dataset.o === o; })[0];
      if (!paikka || !ajossa(v)) return;
      var napit = [].filter.call(pop.querySelectorAll('button.sk-ety'), function (e) { return e.dataset.o === o; });
      var auki = !paikka.firstChild;
      napit.forEach(function (n) { n.setAttribute('aria-pressed', auki ? 'true' : 'false'); });
      if (!auki) { paikka.innerHTML = ''; sijoitaPop(); return; }
      paikka.innerHTML = '<div class="sk-ety-laatikko"><div class="sk-ety-ots"><button type="button" class="sk-osa" data-k="sk-osa" data-sana="ἔτυμον|etymon" lang="grc" title="Alkuperä (etymon)">ΕΤΥΜΟΝ</button><button type="button" class="sk-ety-sulje" data-k="sk-ety" data-o="' +
        esc(o) + '" aria-label="Sulje alkuperä" title="Sulje">' + IK_SULJE_SK + '</button></div><div class="sk-ety-runko"><div class="sk-tieto">Haetaan…</div></div></div>';
      sijoitaPop();
      var nimet = etyKielet[o] || [], valmis = function (html) {
        if (!ajossa(v) || !paikka.isConnected || !paikka.firstChild) return;
        $('.sk-ety-runko', paikka).innerHTML = html; sijoitaPop();
      };
      haeAlkupera(o, nimet).then(function (os) {
        var virhe = os.some(function (x) { return x.virhe; });
        os = os.filter(function (x) { return x.html; });
        // Kielen nimi ja numero vain, kun niistä on apua: monta osiota tai selityksessä monta kieltä.
        var nimea = os.length > 1 || nimet.length > 1;
        valmis((os.length ? os.map(function (x) {
          return (nimea ? '<div class="sk-kieli">' + esc(x.kieli) + (x.nro ? ' · ' + x.nro : '') + '</div>' : '') + x.html;
        }).join('') : '<div class="sk-tieto">' + (virhe ? 'Wikisanakirjan alkuperää ei saatu luettua.' : 'Wikisanakirjaan ei ole kirjattu alkuperää.') + '</div>'));
      }).catch(function () { valmis('<div class="sk-tieto">Haku ei onnistunut. Onko verkkoyhteys päällä?</div>'); });
    }
    function eiLoydy(v) {
      nayta(v, haku, '<div class="sk-tieto">' + (virhe ? 'Haku ei onnistunut. Onko verkkoyhteys päällä?' :
        (monta ? 'Ilmausta' : 'Sanaa') + ' ei löytynyt englanninkielisestä Wikisanakirjasta.') + '</div>', false, virhe ? '' : haku);
    }
    function valitse(x) {
      if (!x) return;
      var v = skVuoro, alku = varoitus(askel) || tekstissa(x.tapa, false);
      (x.j ? Promise.resolve(x.j) : haeSana(x.o)).then(function (j) {
        if (!j) { eiLoydy(v); return; }
        x.j = j; selitys(v, [x], alku);
      }).catch(function () { virhe = true; eiLoydy(v); });
    }
    function suoraan(o, kieli) {
      var v = skVuoro;
      nayta(v, o, '<div class="sk-tieto">Haetaan…</div>', false, o);
      haeSana(o).then(function (j) { if (j) selitys(v, [{ o: o, j: j, kielet: '*' }], '', kieli); else nayta(v, o, '<div class="sk-tieto">Sanaa ei löytynyt englanninkielisestä Wikisanakirjasta.</div>', false, o); })
        .catch(function () { nayta(v, o, '<div class="sk-tieto">Haku ei onnistunut. Onko verkkoyhteys päällä?</div>', false, ''); });
    }
    // Otsikon vitsi: ensimmäinen löytyvä sivu (ἔτυμον on Wikisanakirjassa, käyttäjä tarkisti 12.11.2026; etymon varalla),
    // kreikka etusijalla kreikalle.
    function suoraanKetju(lista) {
      var v = skVuoro;
      nayta(v, lista[0], '<div class="sk-tieto">Haetaan…</div>', false, '');
      (function seur(i) {
        if (i >= lista.length) { nayta(v, lista[0], '<div class="sk-tieto">Sanaa ei löytynyt englanninkielisestä Wikisanakirjasta.</div>', false, lista[0]); return; }
        haeSana(lista[i]).then(function (j) {
          if (!j) { seur(i + 1); return; }
          selitys(v, [{ o: lista[i], j: j, kielet: '*' }], '', /\p{Script=Greek}/u.test(lista[i]) ? 'grc' : 'en');
        }).catch(function () { nayta(v, lista[0], '<div class="sk-tieto">Haku ei onnistunut. Onko verkkoyhteys päällä?</div>', false, ''); });
      })(0);
    }
    function aja(i) {
      if (i >= ketju.length) return Promise.resolve(null);
      return Promise.all(ketju[i].map(function (a) { return skAskel(a, haku, y).catch(function () { virhe = true; return null; }); })).then(function (rs) {
        rs = rs.filter(Boolean);
        // Verkkovirhe pysäyttää ketjun: seuraava askel vastaisi eri kysymykseen (429 tasan samassa suomesta, ja on toi muut
        // kielet kuin suomesta ei olisi löytynyt mitään).
        if (!rs.length) return virhe ? null : aja(i + 1);
        var r = rs[0];
        if (rs.length > 1) r = { tapa: r.tapa, vaihdot: skYhdista(rs.map(function (x) { return x.vaihdot || []; })).slice(0, 4) };
        r.askel = ketju[i][0];
        return r;
      });
    }
    function kaynnista() {
      aja(0).then(function (r) {
        if (!ajossa(vuoro)) return;
        if (!r) { eiLoydy(vuoro); return; }
        askel = r.askel;
        var alku = varoitus(r.askel);
        if (r.osumat) {
          var eri = r.osumat[0].o !== haku && ekaPieni(r.osumat[0].o) !== ekaPieni(haku) && skMuodot(haku).indexOf(r.osumat[0].o) < 0;
          selitys(vuoro, r.osumat, alku || (eri ? tekstissa('f', false) : ''));
          return;
        }
        vaihdot = r.vaihdot;
        if (vaihdot.length === 1) {
          var x = vaihdot[0], v = vuoro;
          (x.j ? Promise.resolve(x.j) : haeSana(x.o)).then(function (j) {
            if (!j) { eiLoydy(v); return; }
            x.j = j; selitys(v, [x], alku || tekstissa(x.tapa, false));
          }).catch(function () { virhe = true; eiLoydy(v); });
          return;
        }
        // Monta vaihtoehtoa: valitsin. Wikisanakirjassa ei ole tällaista sivua, joten lisää-linkkiä ei ole.
        nayta(vuoro, haku, alku + (r.askel && r.askel.v ? '' : tekstissa(vaihdot[0].tapa, true)) + '<ul class="sk-vaihdot">' + vaihdot.map(function (x, i) {
          return '<li><button type="button" class="sk-vaihto" data-k="sk-vaihto" data-i="' + i + '">' + esc(x.o) + '</button>' +
            (x.kl ? '<span class="sk-vk">' + esc(x.kl) + '</span>' : '') + '</li>';
        }).join('') + '</ul>', false, '');
        // Valitsimessa ei ole alkuperän linssiä (käyttäjän linjaus 12.11.2026): se tulee vasta valitun sanan selitykseen, eikä
        // valitsemiseen ole syytä houkutella ennen logosta.
      }).catch(function () { virhe = true; if (ajossa(vuoro)) eiLoydy(vuoro); });
    }
    return { aja: kaynnista, klikkaus: klikkaus };
  }

  window.LuinSana = {
    NIMI: SK_NIMI, hakusana: skHakusana, symboli: skSymboli, sanaLkm: sanaLkm, ketju: skKetju, kehys: skKehys,
    istunto: istunto, IK_ETY: IK_ETY
  };
})();
