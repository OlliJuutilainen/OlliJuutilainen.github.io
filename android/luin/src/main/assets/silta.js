/* Luin. Android-sovelluksena: silta luin.html:n ja sovelluksen välillä (android/luin/, MainActivity syöttää tämän
   Luinin omille sivuille, kun sivu on latautunut). luin.html ei tiedä sovelluksesta mitään; tämä vain
   - kertoo sovellukselle, onko lukija näkyvissä ja tekstikenttä aktiivisena (äänenvoimakkuusnapit kääntävät sivua
     vain lukimessa, eivät kirjoitettaessa) ja sivun taustavärin (tila- ja navigointipalkki),
   - tallentaa lataukset (a[download], blob: tai data:) sovelluksen kautta, koska WebView ei lataa blob-osoitteita,
   - kopioi leikepöydälle sovelluksen kautta (WebView:n Clipboard API ei ole kaikissa versioissa käytössä),
   - täyttää latomoon jaetun tekstin kuten lukimeen-lisäosa (latomoon.js: #md ja input-tapahtuma). */
(function () {
  'use strict';
  var A = window.LuinApp;
  if (!A || window.__luinSilta) return;
  window.__luinSilta = true;

  /* ---------- tila ---------- */
  var TEKSTI = /^(text|search|email|url|tel|password|number|date|time|datetime-local|month|week)$/;
  function kentta() {
    var e = document.activeElement;
    if (!e) return false;
    if (e.isContentEditable || e.tagName === 'TEXTAREA') return true;
    return e.tagName === 'INPUT' && TEKSTI.test((e.getAttribute('type') || 'text').toLowerCase());
  }
  function lapinakyva(v) { return !v || v === 'transparent' || /rgba\([^)]*,\s*0(\.0+)?\s*\)$/.test(v); }
  function vari() {
    var v = document.body ? getComputedStyle(document.body).backgroundColor : '';
    if (lapinakyva(v)) v = getComputedStyle(document.documentElement).backgroundColor;
    return lapinakyva(v) ? '' : v;
  }
  var viimeksi = '', ajossa = false;
  function ilmoita() {
    ajossa = false;
    var l = document.getElementById('lukija');
    var luk = !!(l && !l.hidden), k = kentta(), v = vari();
    var s = luk + '|' + k + '|' + v;
    if (s === viimeksi) return;
    viimeksi = s;
    try { A.tila(luk, k, v); } catch (x) {}
  }
  // Kerran ruudunpäivitystä kohden, vaikka muutoksia tulisi monta (e-ink: ei turhaa työtä).
  function myohemmin() { if (!ajossa) { ajossa = true; setTimeout(ilmoita, 0); } }
  var vahti = new MutationObserver(myohemmin);
  vahti.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-teema'] });
  if (document.body) vahti.observe(document.body, { attributes: true, attributeFilter: ['class', 'hidden'] });
  var lukija = document.getElementById('lukija');
  if (lukija) vahti.observe(lukija, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('focusin', myohemmin, true);
  document.addEventListener('focusout', myohemmin, true);
  window.addEventListener('hashchange', myohemmin);
  window.addEventListener('pageshow', myohemmin);
  if (window.matchMedia) {
    var mm = matchMedia('(prefers-color-scheme: dark)');
    if (mm.addEventListener) mm.addEventListener('change', myohemmin);
  }
  ilmoita();

  /* ---------- lataukset ---------- */
  // Luin tekee latauksen Blobista (URL.createObjectURL) ja vapauttaa osoitteen viiden sekunnin päästä. Blob otetaan
  // talteen jo luotaessa, jotta tallennus ei riipu ajoituksesta eikä tiedostoa tarvitse hakea uudelleen.
  var blobit = new Map();
  var luo = URL.createObjectURL, vapauta = URL.revokeObjectURL;
  URL.createObjectURL = function (o) {
    var u = luo.apply(URL, arguments);
    if (o instanceof Blob) blobit.set(u, o);
    return u;
  };
  URL.revokeObjectURL = function (u) {
    var b = blobit.get(u);
    // Tallennus voi olla kesken; Blob vapautuu, kun se on luettu.
    if (b && !b.__luinLuetaan) blobit.delete(u);
    return vapauta.apply(URL, arguments);
  };
  function talteen(blob, nimi) {
    blob.__luinLuetaan = true;
    var r = new FileReader();
    r.onload = function () {
      var s = String(r.result), i = s.indexOf(',');
      blobit.forEach(function (v, k) { if (v === blob) blobit.delete(k); });
      try { A.tallenna(nimi, blob.type || '', i >= 0 ? s.slice(i + 1) : ''); } catch (x) {}
    };
    r.readAsDataURL(blob);
  }
  function lataa(url, nimi) {
    nimi = nimi || 'luin';
    var b = blobit.get(url);
    if (b) { talteen(b, nimi); return; }
    fetch(url).then(function (v) { return v.blob(); }).then(function (b) { talteen(b, nimi); }, function () {});
  }
  window.__luinLataa = lataa;
  function latauslinkki(a) {
    if (!a || !a.hasAttribute || !a.hasAttribute('download')) return false;
    var h = a.href || '';
    if (h.indexOf('blob:') !== 0 && h.indexOf('data:') !== 0) return false;
    lataa(h, a.getAttribute('download') || '');
    return true;
  }
  // Luin painaa latauslinkkiä ohjelmasta (a.click()).
  var painaa = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (latauslinkki(this)) return;
    return painaa.apply(this, arguments);
  };
  // Käyttäjän painama latauslinkki (jos sellainen on): viimeisenä, jotta sivun omat käsittelijät ehtivät ensin.
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || !e.target || !e.target.closest) return;
    if (latauslinkki(e.target.closest('a[download]'))) e.preventDefault();
  });

  /* ---------- leikepöytä ---------- */
  function kirjoita(teksti, html) {
    try { A.kopioi(String(teksti == null ? '' : teksti), html == null ? '' : String(html)); return Promise.resolve(); }
    catch (x) { return Promise.reject(x); }
  }
  var lp = {
    writeText: function (t) { return kirjoita(t); },
    write: function (osat) {
      var o = osat && osat[0];
      if (!o || !o.types) return kirjoita('');
      function osa(t) { return o.types.indexOf(t) >= 0 ? o.getType(t).then(function (b) { return b.text(); }) : Promise.resolve(null); }
      return Promise.all([osa('text/plain'), osa('text/html')]).then(function (v) { return kirjoita(v[0] || '', v[1]); });
    }
  };
  try {
    if (navigator.clipboard) { navigator.clipboard.writeText = lp.writeText; navigator.clipboard.write = lp.write; }
    else Object.defineProperty(navigator, 'clipboard', { value: lp, configurable: true });
  } catch (x) {}

  /* ---------- jaettu teksti latomoon ---------- */
  if (/\/luin\/latomo\.html$/.test(location.pathname)) {
    var jaettu = null;
    try { jaettu = A.jaettu(); } catch (x) {}
    var md = document.getElementById('md');
    if (jaettu && md) {
      md.value = jaettu;
      md.dispatchEvent(new Event('input', { bubbles: true }));
      window.scrollTo(0, 0);
    }
  }
})();
