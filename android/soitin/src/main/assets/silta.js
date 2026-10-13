// Sovellus syöttää tämän soitin/index.html-sivulle, kun sivu on latautunut.
// Kertoo sovellukselle, soiko ääni ja mikä kappale on menossa, jotta sovellus
// osaa pitää itsensä hengissä soiton ajan (näyttö pois, toinen sovellus auki).
// Sivuun itseensä ei tarvita muutoksia: kuunnellaan audio-elementin tapahtumia
// ja #now-rivin vaihtumista.
//
// Lisäksi sivun oikeaan yläkulmaan tulevat päivitys- ja sulkemisnappi, koska
// sovelluksessa ei ole selaimen omia. Verkkoversiossa niitä ei ole, koska tämä
// tiedosto kulkee vain sovelluksen mukana.
(function () {
  "use strict";
  if (!window.SoitinApp) return;
  // Uudelleensyöttö (esim. onPageFinished toistamiseen) vain lähettää tilan uudestaan.
  if (window.__soitinSilta) { window.__soitinSilta(true); return; }

  var last = null;

  // #now on pelkkä kappaleen nimi; useampi solmu yhdistettäisiin välilyönnein.
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

  var ICON_RELOAD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 3.5V10h-6.5z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function appButton(label, icon, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.innerHTML = icon;
    b.addEventListener("click", onClick);
    return b;
  }

  // Sivun omat tyylit (button, svg, --muted) pätevät napeihin. Otsikolle
  // jätetään tilaa, ettei pitkä keikan nimi jää nappien alle.
  function addAppButtons() {
    var main = document.querySelector("main");
    if (!main || document.getElementById("soitin-app")) return;
    var css = document.createElement("style");
    css.textContent =
      "main{position:relative}" +
      "main>h1{padding-right:88px}" +
      "#soitin-app{position:absolute;top:20px;right:5px;display:flex;gap:4px}" +
      "#soitin-app button{width:44px;height:44px;border-radius:50%;" +
      "display:grid;place-items:center;color:var(--muted)}" +
      "#soitin-app svg{width:22px;height:22px}";
    document.head.appendChild(css);

    var bar = document.createElement("div");
    bar.id = "soitin-app";
    bar.appendChild(appButton("Lataa uudelleen", ICON_RELOAD, function () {
      location.reload();
    }));
    bar.appendChild(appButton("Sulje soitin", ICON_CLOSE, function () {
      var a = document.querySelector("audio");
      if (a) a.pause();
      try { window.SoitinApp.close(); } catch (e) { /* silta poissa */ }
    }));
    main.insertBefore(bar, main.firstChild);
  }
  addAppButtons();

  // Kuulokkeiden ja muiden mediapainikkeiden komennot. Sovellus kutsuu tätä, ja komento
  // painaa sivun omaa nappia, jolloin setin rajat ja muut säännöt pätevät kuten
  // kosketuksella. Pois käytöstä oleva nappi ei reagoi click()-kutsuun.
  var BUTTONS = { next: "next", previous: "prev", forward: "fwd", rewind: "back" };
  window.__soitinNappi = function (action) {
    var a = document.querySelector("audio");
    if (action === "pause") {
      if (a && !a.paused) a.pause();
      return;
    }
    var id = action === "play" ? (a && a.paused ? "play" : null) : BUTTONS[action];
    var b = id && document.getElementById(id);
    if (b) b.click();
  };

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
