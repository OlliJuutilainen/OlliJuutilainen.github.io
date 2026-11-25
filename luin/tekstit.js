/* Luinin tekstien tallennus (käyttäjän pyyntö 19.11.2026): tekstien sisältö on IndexedDB:ssä, ei localStoragessa.
   localStorage on koko sivuston yhteinen ja Chromiumissa noin 5,2 miljoonaa merkkiä (mitattu 19.11.2026), joten koko
   kaksikielinen Valtio (1,8 milj.) ei mahtunut muiden tekstien rinnalle. IndexedDB:n kiintiö on osuus laitteen levystä
   (Chromium: 10 737 Mt; 20 Valtiota kirjoittui 224 ms:ssa). Pino (luin-lista), asetukset ja merkinnät jäävät localStorageen.

   Yhteinen luin.html:lle ja Latomolle (?v= kuten md.js:ssä). Kanta 'luin', varastot 'tekstit' (avain tekstin tunnus, arvo md)
   ja 'siirto' (Latomon siirto lukimeen, avain 'tuonti'; ennen localStoragen luin-tuonti). Ensimmäisellä avauksella vanhat
   localStoragen luin-teksti:-avaimet siirretään kantaan ja poistetaan vasta, kun kirjoitus on valmis. Jos IndexedDB ei
   avaudu (vanha selain, esto), kaikki toimii localStoragessa kuten ennen. Lukeminen katsoo varmuuden vuoksi myös
   localStoragen, jos kannassa ei ole tekstiä (siirto keskeytyi). */
(function () {
  var NIMI = 'luin', VERSIO = 1, T = 'tekstit', S = 'siirto', ETU = 'luin-teksti:';
  var kanta = null, avaimet = {};
  function lsLue(k) { try { var v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function lsKirjoita(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function lsPoista(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function lsAvaimet() {
    var a = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(ETU) === 0) a.push(k); } } catch (e) {}
    return a;
  }
  function avaa() {
    return new Promise(function (ok) {
      var q;
      try { q = window.indexedDB && indexedDB.open(NIMI, VERSIO); } catch (e) { q = null; }
      if (!q) return ok(null);
      q.onupgradeneeded = function () {
        var d = q.result;
        if (!d.objectStoreNames.contains(T)) d.createObjectStore(T);
        if (!d.objectStoreNames.contains(S)) d.createObjectStore(S);
      };
      q.onsuccess = function () { ok(q.result); };
      q.onerror = function () { ok(null); };
      q.onblocked = function () { ok(null); };
    });
  }
  // Yksi tapahtuma; lupaus täyttyy, kun tapahtuma on valmis (kirjoitus on silloin levyllä).
  function tee(varasto, kirj, f) {
    return new Promise(function (ok, ko) {
      var tx, r;
      try { tx = kanta.transaction(varasto, kirj ? 'readwrite' : 'readonly'); r = f(tx.objectStore(varasto)); } catch (e) { return ko(e); }
      tx.oncomplete = function () { ok(r && typeof r === 'object' && 'readyState' in r ? r.result : undefined); };
      tx.onerror = tx.onabort = function () { ko(tx.error || new Error('IndexedDB')); };
    });
  }
  function siirraVanhat() {
    var a = lsAvaimet();
    if (!a.length) return Promise.resolve();
    return tee(T, true, function (s) {
      a.forEach(function (k) { var v = lsLue(k); if (typeof v === 'string') s.put(v, k.slice(ETU.length)); });
    }).then(function () {
      a.forEach(function (k) { avaimet[k.slice(ETU.length)] = 1; lsPoista(k); });
    }, function () { /* tila loppui tai esto: tekstit jäävät localStorageen, ja lue() löytää ne sieltä */ });
  }
  /* Valmiit: ison tekstin jäsennetty ja tavutettu HTML (luin.html, avaa()), jottei uudelleenavaus jäsennä ja tavuta
     uudelleen. Oma kanta, jottei tekstikannan versio muutu: varasto 'v' (avain tekstin tunnus, arvo { avain, doc, html,
     samaKirj }) ja 'aika' (tunnus → viimeksi käytetty). Luin käyttää valmista vain, kun sen avain (tekstin sormenjälki,
     koodin versio, asetukset) täsmää, joten muuttunut teksti jäsennetään aina uudelleen. Enintään VALMIITA tekstiä; pisimpään
     käyttämätön poistuu. Tekstin poisto poistaa valmiin. Virheet ohitetaan: valmis on vain nopeutus. */
  var VALMIITA = 6, vLupaus = null;
  function vAvaa() {
    if (!vLupaus) vLupaus = new Promise(function (ok) {
      var q;
      try { q = window.indexedDB && indexedDB.open('luin-valmiit', 1); } catch (e) { q = null; }
      if (!q) return ok(null);
      q.onupgradeneeded = function () {
        var d = q.result;
        if (!d.objectStoreNames.contains('v')) d.createObjectStore('v');
        if (!d.objectStoreNames.contains('aika')) d.createObjectStore('aika');
      };
      q.onsuccess = function () { ok(q.result); };
      q.onerror = q.onblocked = function () { ok(null); };
    });
    return vLupaus;
  }
  function vTee(kirj, f) {
    return vAvaa().then(function (d) {
      if (!d) return null;
      return new Promise(function (ok, ko) {
        var tx, r;
        try { tx = d.transaction(['v', 'aika'], kirj ? 'readwrite' : 'readonly'); r = f(tx.objectStore('v'), tx.objectStore('aika')); } catch (e) { return ko(e); }
        tx.oncomplete = function () { ok(r && typeof r === 'object' && 'readyState' in r ? r.result : undefined); };
        tx.onerror = tx.onabort = function () { ko(tx.error || new Error('IndexedDB')); };
      });
    });
  }
  function valmisPois(id) { return vTee(true, function (v, a) { v.delete(id); a.delete(id); }).catch(function () {}); }

  var valmis = avaa().then(function (d) {
    kanta = d;
    if (!kanta) return;
    return tee(T, false, function (s) { return s.getAllKeys(); }).then(function (k) {
      (k || []).forEach(function (x) { avaimet[x] = 1; });
      return siirraVanhat();
    });
  }).catch(function () { kanta = null; });

  var api = {
    valmis: valmis,
    kanta: function () { return !!kanta; },
    // Synkroninen: onko tekstiä tallessa (kannassa tai localStoragessa). Luotettava vasta valmis-lupauksen jälkeen.
    on: function (id) { if (avaimet[id]) return true; try { return localStorage.getItem(ETU + id) != null; } catch (e) { return false; } },
    lue: function (id) {
      return valmis.then(function () {
        if (!kanta) return lsLue(ETU + id);
        return tee(T, false, function (s) { return s.get(id); }).then(function (v) { return typeof v === 'string' ? v : lsLue(ETU + id); },
          function () { return lsLue(ETU + id); });
      });
    },
    // true, kun teksti on tallessa. Kannan virheessä (tila loppui) yritetään vielä localStoragea.
    kirjoita: function (id, md) {
      md = String(md);
      return valmis.then(function () {
        if (!kanta) return lsKirjoita(ETU + id, md);
        return tee(T, true, function (s) { s.put(md, id); }).then(function () {
          avaimet[id] = 1; lsPoista(ETU + id); return true;
        }, function () { return lsKirjoita(ETU + id, md); });
      });
    },
    poista: function (id) {
      delete avaimet[id]; lsPoista(ETU + id);
      valmisPois(id);
      return valmis.then(function () { if (kanta) return tee(T, true, function (s) { s.delete(id); }).catch(function () {}); });
    },
    // Valmis teksti (ks. vAvaa()) tai null. Käyttö päivittää ajan, jottei usein avattu poistu.
    valmisLue: function (id) {
      return vTee(false, function (v) { return v.get(id); }).then(function (o) {
        if (o) vTee(true, function (v, a) { a.put(Date.now(), id); }).catch(function () {});
        return o || null;
      }, function () { return null; });
    },
    valmisKirjoita: function (id, o) {
      return vTee(true, function (v, a) {
        v.put(o, id); a.put(Date.now(), id);
        var ajat = [];
        a.openCursor().onsuccess = function (ev) {
          var c = ev.target.result;
          if (c) { ajat.push([c.key, c.value]); return c.continue(); }
          ajat.sort(function (x, y) { return x[1] - y[1]; });
          ajat.slice(0, Math.max(0, ajat.length - VALMIITA)).forEach(function (x) { if (x[0] !== id) { v.delete(x[0]); a.delete(x[0]); } });
        };
      }).then(function () { return true; }, function () { return false; });
    },
    // Latomon siirto lukimeen: { md, nimi, pinosta }. ota() poistaa sen.
    asetaSiirto: function (o) {
      return valmis.then(function () {
        if (!kanta) return lsKirjoita('luin-tuonti', o);
        return tee(S, true, function (s) { s.put(o, 'tuonti'); }).then(function () { lsPoista('luin-tuonti'); return true; },
          function () { return lsKirjoita('luin-tuonti', o); });
      });
    },
    // Vanha Latomo (välimuistissa enintään 10 min) kirjoittaa yhä localStorageen: sieltä, jos kannassa ei ole.
    otaSiirto: function () {
      return valmis.then(function () {
        var vanha = lsLue('luin-tuonti');
        lsPoista('luin-tuonti');
        if (!kanta) return vanha;
        return tee(S, false, function (s) { return s.get('tuonti'); }).then(function (o) {
          if (!o) return vanha;
          return tee(S, true, function (s) { s.delete('tuonti'); }).then(function () { return o; }, function () { return o; });
        }, function () { return vanha; });
      });
    }
  };
  window.LuinTekstit = api;
})();
