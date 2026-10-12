// Sovellus syöttää tämän soitin/index.html-sivulle, kun sivu on latautunut.
// Kertoo sovellukselle, soiko ääni ja mikä kappale on menossa, jotta sovellus
// osaa pitää itsensä hengissä soiton ajan (näyttö pois, toinen sovellus auki).
// Sivuun itseensä ei tarvita muutoksia: kuunnellaan audio-elementin tapahtumia
// ja #now-rivin vaihtumista.
(function () {
  "use strict";
  if (!window.SoitinApp) return;
  // Uudelleensyöttö (esim. onPageFinished toistamiseen) vain lähettää tilan uudestaan.
  if (window.__soitinSilta) { window.__soitinSilta(true); return; }

  var last = null;

  // "3." ja nimi ovat eri solmuissa ilman välilyöntiä (väli on CSS:n marginaali).
  function trackText() {
    var now = document.getElementById("now");
    if (!now) return "";
    var parts = [];
    for (var i = 0; i < now.childNodes.length; i++) {
      var s = now.childNodes[i].textContent.replace(/\s+/g, " ").trim();
      if (s) parts.push(s);
    }
    return parts.join(" ");
  }

  function report(force) {
    var a = document.querySelector("audio");
    var playing = !!a && !a.paused && !a.ended && !a.error;
    var title = document.title || "";
    var track = trackText();
    var key = playing + "\n" + title + "\n" + track;
    if (key === last && force !== true) return;
    last = key;
    try { window.SoitinApp.state(playing, title, track); } catch (e) { /* silta poissa */ }
  }
  window.__soitinSilta = report;

  // Mediatapahtumat eivät kupli, mutta kaappausvaihe documentissa näkee ne.
  ["play", "pause", "ended", "emptied", "error"].forEach(function (t) {
    document.addEventListener(t, function () { report(); }, true);
  });

  if (window.MutationObserver) {
    var opts = { childList: true, characterData: true, subtree: true };
    var mo = new MutationObserver(function () { report(); });
    var now = document.getElementById("now");
    var title = document.querySelector("title");
    if (now) mo.observe(now, opts);
    if (title) mo.observe(title, opts);
  }

  report(true);
})();
