/* Luinin postilaatikko: yhteinen osa luin.html:lle ja Latomolle (käyttäjän pyyntö 9.11.2026).
   - Laatikon koodi: kirjoitusasu siistitään samalla tavalla kaikkialla (isot kirjaimet pieniksi, ä ja ö a:ksi ja o:ksi,
     välilyönnit ja välimerkit pois), ja uusi koodi on 24–40 merkkiä, jotta sillä voi sekä lähettää että lukea
     (worker kelpuuttaa kirjoitukset vain vähintään 24 merkin koodilla). Lisää lukimeen -lisäosassa on sama sääntö
     ja ohje omana kopionaan (luin/lisaosa/ponnahdus.js), koska lisäosa ei lataa sivuston tiedostoja.
   - Merkintäposti: tekstin merkinnät (alleviivaukset, kirjaukset, kirjanmerkit, lukukohta) kulkevat laatikossa JSONina
     (worker: luinm:<laatikko>:<avain>). Lähettäjä hakee ensin laatikon version, yhdistää sen omiinsa ja lähettää
     yhdistetyn, joten kumpikaan laite ei kadota toisen merkintöjä. Poistot kulkevat poistomerkintöinä (del), jotta
     poistettu ei palaa toisesta laitteesta; kirjauksen uusin muokkaus (nt) voittaa; lukukohdista uusin (posT). */
(function (g) {
  'use strict';
  var MIN = 24, MAX = 40;
  var RE = /^[a-z0-9-]{8,40}$/;          // workerin hyväksymä muoto (lukeminen); vanhat lyhyet koodit toimivat lukemiseen

  function koodi(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '');
  }
  // Uuden koodin tarkistus: '' kun kelpaa, muuten syy.
  function koodiVirhe(k) {
    if (!k) return 'Anna laatikon koodi.';
    if (k.length < MIN) return 'Koodissa on oltava vähintään ' + MIN + ' merkkiä (nyt ' + k.length + '), jotta sillä voi sekä lähettää että lukea.';
    if (k.length > MAX) return 'Koodissa voi olla enintään ' + MAX + ' merkkiä (nyt ' + k.length + ').';
    return '';
  }
  // Pikaohje (?-napin takana Luinin asetuksissa ja Latomossa; lisäosassa sama sanoin).
  var OHJE = '<p>Laatikon koodissa on oltava <b>vähintään 24 merkkiä</b> (enintään 40), jotta sillä voi sekä lähettää ' +
    'että lukea. Pelkät kirjaimet riittävät.</p>' +
    '<p>Isoja ja pieniä kirjaimia ei erotella. Välilyönnit ja välimerkit jätetään pois, ja ä ja ö luetaan a:ksi ja o:ksi.</p>' +
    '<p>Vinkki: pitkä ja erikoinen lause, jonka muistat, ilman välejä. ”Torikaffeilla on hemmetin mukavaa.” → ' +
    '<i>torikaffeillaonhemmetinmukavaa</i></p>' +
    '<p>Koodi on laatikon avain: sen tietävä voi lukea laatikon tekstit ja lähettää laatikkoon.</p>';

  // Tekstin avain laatikossa: Latomon ja laatikon tekstit ovat lukulistassa p-<slug>, laatikossa <slug> (sama kuin
  // tekstin oma tunnus laatikossa); osoitteesta haetut u-<tiiviste> sellaisenaan.
  function avain(id) { return /^p-/.test(id) ? id.slice(2, 62) : String(id).slice(0, 60); }
  function paikalliset(a) { return /^u-/.test(a) ? [a, 'p-' + a] : ['p-' + a]; }

  function kopio(x) { return JSON.parse(JSON.stringify(x)); }

  // Merkintöjen kuva: tunnus → laji ja kirjaus. Tallennus vertaa edelliseen kuvaan (kirjaaMuutokset).
  function kuva(m) {
    var k = {};
    (m.km || []).forEach(function (x) { k[x.id] = { k: 'km' }; });
    (m.al || []).forEach(function (h) { k[h.id] = { k: 'al', n: h.n || '' }; });
    return k;
  }
  // Poistetuille poistomerkintä, muuttuneille kirjauksille muokkausaika. Palauttaa uuden kuvan ja tiedon muutoksesta.
  function kirjaaMuutokset(m, ennen) {
    var t = Date.now(), uusi = kuva(m), muuttui = false;
    if (!ennen) return { kuva: uusi, muuttui: false };
    m.del = m.del || {};
    Object.keys(ennen).forEach(function (id) {
      if (!uusi[id]) { m.del[id] = { t: t, k: ennen[id].k }; muuttui = true; }
    });
    (m.al || []).forEach(function (h) {
      var e = ennen[h.id];
      if (!e) { if (h.n) h.nt = t; muuttui = true; }
      else if (e.n !== (h.n || '')) { h.nt = t; muuttui = true; }
    });
    (m.km || []).forEach(function (x) { if (!ennen[x.id]) muuttui = true; });
    return { kuva: uusi, muuttui: muuttui };
  }

  // Lähetettävä paketti. v: lähetettävät lajit { al, ki, km, ed }. Ilman alleviivauksia kirjaukset kulkevat
  // alleviivauksineen (kirjaus tarvitsee kohtansa), kuten viennissä.
  function paketti(id, m, e, v) {
    var p = { v: 1, id: id, t: Date.now(), laji: { al: !!v.al, ki: !!v.ki, km: !!v.km, ed: !!v.ed }, del: {} };
    if (e && e.title) p.otsikko = e.title;
    if (v.km) p.km = (m.km || []).map(kopio);
    if (v.al || v.ki) p.al = (m.al || []).filter(function (h) { return v.al || h.n; }).map(function (h) {
      var c = kopio(h);
      if (!v.ki) { delete c.n; delete c.nt; }
      return c;
    });
    Object.keys(m.del || {}).forEach(function (id) {
      var d = m.del[id];
      if (d && (d.k === 'km' ? v.km : v.al || v.ki)) p.del[id] = d;
    });
    if (v.ed && e && e.pos) { p.pos = e.pos; p.pct = e.pct; p.posT = e.posT || 0; }
    return p;
  }
  // Paketin sisältö vertailua varten (lähetysaika ei kuulu siihen).
  function sisalto(p) {
    return JSON.stringify([p.laji, p.km || null, p.al || null, p.del || {}, p.pos || null, p.posT || 0]);
  }

  function samaKm(a, b) { return a.b === b.b && a.o === b.o; }
  function samaAl(a, b) {
    return a.segs.length === b.segs.length && a.segs.every(function (s, i) {
      var q = b.segs[i];
      return s.b === q.b && s.s === q.s && s.e === q.e;
    });
  }
  // Laatikon paketti p paikallisiin merkintöihin m ja lukulistan nimikkeeseen e (lukukohta). Muuttaa m:ää ja e:tä.
  // Samassa kohdassa oleva merkintä on sama, vaikka tunnus olisi eri (esim. tiedostosta tuotu): tunnukseksi jää
  // aakkosissa ensimmäinen, jolloin molemmat laitteet päätyvät samaan.
  function yhdista(m, e, p) {
    m.km = m.km || []; m.al = m.al || []; m.del = m.del || {};
    var laji = p.laji || {}, r = { muuttui: false, sijainti: false };
    Object.keys(p.del || {}).forEach(function (id) {
      var d = p.del[id];
      if (!d || typeof d.t !== 'number') return;
      if (!m.del[id] || m.del[id].t < d.t) { m.del[id] = { t: d.t, k: d.k }; r.muuttui = true; }
    });
    var nAl = m.al.length, nKm = m.km.length;
    m.al = m.al.filter(function (h) { return !m.del[h.id]; });
    m.km = m.km.filter(function (x) { return !m.del[x.id]; });
    if (m.al.length !== nAl || m.km.length !== nKm) r.muuttui = true;
    function tunnus(oma, toinen) {
      if (oma.id === toinen) return;
      var c = oma.id < toinen ? oma.id : toinen;
      if (oma.id !== c) { oma.id = c; r.muuttui = true; }
    }
    (p.km || []).forEach(function (rk) {
      if (!rk || !rk.id || m.del[rk.id]) return;
      var lk = m.km.filter(function (x) { return x.id === rk.id; })[0] || m.km.filter(function (x) { return samaKm(x, rk); })[0];
      if (!lk) { m.km.push(kopio(rk)); r.muuttui = true; return; }
      tunnus(lk, rk.id);
    });
    (p.al || []).forEach(function (rh) {
      if (!rh || !rh.id || !rh.segs || !rh.segs.length || m.del[rh.id]) return;
      var lh = m.al.filter(function (h) { return h.id === rh.id; })[0] || m.al.filter(function (h) { return samaAl(h, rh); })[0];
      if (!lh) {
        var c = kopio(rh);
        if (!laji.ki) { delete c.n; delete c.nt; }
        m.al.push(c); r.muuttui = true; return;
      }
      tunnus(lh, rh.id);
      if (laji.ki && (rh.n || '') !== (lh.n || '') && (rh.nt || 0) > (lh.nt || 0)) {
        if (rh.n) lh.n = rh.n; else delete lh.n;
        lh.nt = rh.nt; r.muuttui = true;
      }
    });
    m.al.sort(function (a, b) { return a.segs[0].b - b.segs[0].b || a.segs[0].s - b.segs[0].s; });
    m.km.sort(function (a, b) { return a.b - b.b || a.o - b.o; });
    if (laji.ed && e && p.pos && (p.posT || 0) > (e.posT || 0)) {
      e.pos = p.pos; e.pct = p.pct; e.posT = p.posT; r.sijainti = true;
    }
    return r;
  }

  g.LuinPosti = { MIN: MIN, MAX: MAX, RE: RE, koodi: koodi, koodiVirhe: koodiVirhe, OHJE: OHJE, avain: avain,
    paikalliset: paikalliset, kuva: kuva, kirjaaMuutokset: kirjaaMuutokset, paketti: paketti, sisalto: sisalto, yhdista: yhdista };
})(typeof window !== 'undefined' ? window : globalThis);
