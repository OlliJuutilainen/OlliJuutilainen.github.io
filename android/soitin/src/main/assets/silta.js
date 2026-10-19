// Sovellus syöttää tämän soitin/index.html-sivulle, kun sivu on latautunut.
// Kertoo sovellukselle, soiko ääni ja mikä kappale on menossa, jotta sovellus
// osaa pitää itsensä hengissä soiton ajan (näyttö pois, toinen sovellus auki).
// Sivuun itseensä ei tarvita muutoksia: kuunnellaan audio-elementin tapahtumia
// ja #now-rivin vaihtumista.
//
// Lisäksi sivun oikeaan yläkulmaan tulevat Omat keikkani-, päivitys- ja
// sulkemisnappi, koska sovelluksessa ei ole selaimen omia. Verkkoversiossa niitä
// ei ole, koska tämä tiedosto kulkee vain sovelluksen mukana.
//
// Kun keikka on latautunut, sen otsikko, lisätieto ja biisien yhteiskesto
// ilmoitetaan sovellukselle Omia keikkojani varten.
(function () {
  "use strict";
  if (!window.SoitinApp) return;
  // Uudelleensyöttö (esim. onPageFinished toistamiseen) vain lähettää tilan uudestaan.
  if (window.__soitinSilta) { window.__soitinSilta(true); window.__soitinKeikka(true); return; }

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

  // Biisien yhteiskesto luetaan kappalelistan kestosarakkeesta (mm:ss tai
  // hh:mm:ss). Ei-biisirivit (li.pre) ja setin otsikot (li.set) eivät ole biisejä.
  // Viimeisen biisin kesto selviää vasta, kun äänitiedoston pituus on tiedossa;
  // siihen asti kesto on -1 (ei tiedossa).
  function songsLength() {
    var cells = document.querySelectorAll("#list > li:not(.pre):not(.set) .st");
    if (!cells.length) return -1;
    var sum = 0;
    for (var i = 0; i < cells.length; i++) {
      var p = cells[i].textContent.trim().split(":");
      if (p.length < 2 || p.some(function (x) { return !/^\d+$/.test(x); })) return -1;
      var t = 0;
      for (var j = 0; j < p.length; j++) t = t * 60 + +p[j];
      sum += t;
    }
    return sum;
  }

  // Keikka on latautunut, kun #app on näkyvissä. Virheellinen tunnus jättää sen
  // piiloon, jolloin keikkaa ei ilmoiteta eikä se päädy listaan.
  var lastGig = null;
  function reportGig(force) {
    var app = document.getElementById("app");
    if (!app || app.hidden) return;
    var h1 = document.getElementById("title");
    var sub = document.getElementById("sub");
    var title = h1 ? h1.textContent.trim() : "";
    var subText = sub && !sub.hidden ? sub.textContent.trim() : "";
    var len = songsLength();
    var key = title + "\n" + subText + "\n" + len;
    if (key === lastGig && force !== true) return;
    lastGig = key;
    try { window.SoitinApp.gig(title, subText, len); } catch (e) { /* silta poissa */ }
  }
  window.__soitinKeikka = reportGig;

  var ICON_LIST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
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
      "main>h1{padding-right:136px}" +
      "#soitin-app{position:absolute;top:20px;right:5px;display:flex;gap:4px}" +
      "#soitin-app button{width:44px;height:44px;border-radius:50%;" +
      "display:grid;place-items:center;color:var(--muted)}" +
      "#soitin-app svg{width:22px;height:22px}";
    document.head.appendChild(css);

    var bar = document.createElement("div");
    bar.id = "soitin-app";
    bar.appendChild(appButton("Omat keikkani", ICON_LIST, function () {
      try { window.SoitinApp.list(); } catch (e) { /* silta poissa */ }
    }));
    bar.appendChild(appButton("Lataa uudelleen", ICON_RELOAD, function () {
      location.reload();
    }));
    bar.appendChild(appButton("Sulje keick·walk.", ICON_CLOSE, function () {
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

  // Soitto todella alkoi (playing, ei pelkkä play-pyyntö). Sovellus avaa
  // käynnistyessään viimeisimmän keikan, jossa näin on käynyt.
  document.addEventListener("playing", function () {
    try { window.SoitinApp.played(); } catch (e) { /* silta poissa */ }
  }, true);

  if (window.MutationObserver) {
    var opts = { childList: true, characterData: true, subtree: true };
    var mo = new MutationObserver(function () { report(); });
    var now = document.getElementById("now");
    var title = document.querySelector("title");
    if (now) mo.observe(now, opts);
    if (title) mo.observe(title, opts);

    // Keikan tiedot: #app tulee näkyviin, lista täyttyy ja kestot päivittyvät.
    var go = new MutationObserver(function () { reportGig(); });
    var app = document.getElementById("app");
    var list = document.getElementById("list");
    if (app) go.observe(app, { attributes: true, attributeFilter: ["hidden"] });
    if (list) go.observe(list, opts);
  }

  report(true);
  reportGig(true);
})();
