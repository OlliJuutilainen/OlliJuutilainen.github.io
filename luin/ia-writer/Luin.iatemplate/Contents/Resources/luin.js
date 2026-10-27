/* Lainauksen lähde ja motto kuten Luinissa (luin/md.js, lainauksenLahde; käyttäjän päätös 27.10.2026).
   Lainauksen viimeinen rivi, joka alkaa ajatus- tai em-viivalla ja välilyönnillä, on lähde, jos sitä edeltää pakotettu
   rivinvaihto (kenoviiva, <br>) tai lainauksen sisäinen tyhjä rivi. Vuorosanat eivät ole lähteitä: jos lainauksen muukin
   rivi alkaa viivalla, viimeinenkään ei ole. Otsikon jälkeinen lähteellinen lainaus on motto. iA Writer korvaa sisällön
   ja lähettää tapahtuman ia-writer-change, joten muunnos tehdään joka kerta uudelleen. */
(function () {
  'use strict';
  var RE = /^[–—][  ]+\S/;
  function lahdeRivi(t) { t = t.replace(/\s+$/, '').replace(/^\s+/, ''); return RE.test(t) && t.length <= 160; }
  // Kappaleen rivit <br>-elementtien kohdalta: [[solmut], …]
  function rivit(p) {
    var r = [[]];
    Array.prototype.forEach.call(p.childNodes, function (n) { if (n.nodeName === 'BR') r.push([]); else r[r.length - 1].push(n); });
    return r;
  }
  function teksti(solmut) { return solmut.map(function (n) { return n.textContent; }).join(''); }
  function lahde(bq) {
    var kpl = Array.prototype.filter.call(bq.children, function () { return true; }), vika = kpl[kpl.length - 1];
    if (!vika || vika.nodeName !== 'P') return null;
    var r = rivit(vika), viim = r[r.length - 1], tx = teksti(viim);
    if (!lahdeRivi(tx)) return null;
    var muut = [];
    kpl.slice(0, -1).forEach(function (p) { if (p.nodeName === 'P') rivit(p).forEach(function (x) { muut.push(teksti(x)); }); });
    r.slice(0, -1).forEach(function (x) { muut.push(teksti(x)); });
    if (muut.some(function (m) { return RE.test(m.trim()); })) return null;
    if (r.length === 1) return kpl.length > 1 ? { solmut: viim, poista: vika } : null;
    return { solmut: viim, br: viim.length ? viim[0].previousSibling : vika.lastChild };
  }
  function muunna(juuri) {
    Array.prototype.slice.call(juuri.querySelectorAll('blockquote')).forEach(function (bq) {
      if (bq.parentNode !== juuri) return;
      var l = lahde(bq);
      if (!l) return;
      var ed = bq.previousElementSibling, motto = !ed || /^H[1-6]$/.test(ed.nodeName) || (ed.classList && ed.classList.contains('motto'));
      var fig = document.createElement('figure'), fc = document.createElement('figcaption');
      fig.className = 'lainaus' + (motto ? ' motto' : '');
      bq.parentNode.insertBefore(fig, bq);
      fig.appendChild(bq);
      l.solmut.forEach(function (n) { fc.appendChild(n); });
      if (fc.firstChild && fc.firstChild.nodeType === 3) fc.firstChild.textContent = fc.firstChild.textContent.replace(/^\s+/, '');
      if (l.poista) l.poista.parentNode.removeChild(l.poista);
      if (l.br) {
        var p = l.br.parentNode;
        p.removeChild(l.br);
        while (p.lastChild && p.lastChild.nodeType === 3 && !p.lastChild.textContent.trim()) p.removeChild(p.lastChild);
      }
      fig.appendChild(fc);
    });
  }
  function alusta() {
    var d = document.querySelector('[data-document]');
    if (!d) return;
    muunna(d);
    d.addEventListener('ia-writer-change', function () { muunna(d); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', alusta); else alusta();
})();
