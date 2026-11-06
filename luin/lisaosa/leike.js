/* Lisää lukimeen: leikkuri. Ajetaan sivulla kirjastojen (Readability, Turndown, GFM) jälkeen; viimeisen lausekkeen arvo
   palaa ponnahdusikkunalle. IIFE, koska tiedosto ajetaan uudelleen joka kerta, kun ikkuna avataan samalla sivulla.

   Tulos noudattaa Latomon ohjeen suosittelemia MarkDownload-asetuksia (latomo-ohje.html#markdownload), jotta Latomon
   MarkDownload-tila siivoaa sen samoin: etukentässä korvamerkki leikattu:, Atx-otsikot, viiva ___, luettelo -,
   aidattu koodi, *kursiivi*, **lihavointi**, viitelinkit lopussa, kuvat pois, Markdown-merkit suojattuina,
   yläindeksit HTML:nä (Latomo muuntaa ne ^1^-muotoon). */
(() => {
  // MarkDownload poistaa samat näkymättömät merkit; pehmeä tavuviiva sotkisi Luinin oman tavutuksen.
  const NAKYMATON = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g;

  function muunna(html) {
    const td = new TurndownService({ headingStyle: 'atx', hr: '___', bulletListMarker: '-', codeBlockStyle: 'fenced',
      fence: '```', emDelimiter: '*', strongDelimiter: '**', linkStyle: 'referenced', linkReferenceStyle: 'full' });
    td.use(turndownPluginGfm.gfm);
    td.keep(['sub', 'sup']);
    td.remove(['script', 'style', 'noscript', 'iframe', 'button', 'form', 'svg']);
    td.addRule('kuvat', { filter: 'img', replacement: () => '' });
    // Kuvan poistuttua linkistä jäisi [](…) tai [][4].
    td.addRule('tyhjaLinkki', { filter: n => n.nodeName === 'A' && !n.textContent.trim(), replacement: () => '' });
    td.addRule('pre', {
      filter: n => n.nodeName === 'PRE' && (!n.firstChild || n.firstChild.nodeName !== 'CODE'),
      replacement: (s, n) => '\n\n```\n' + n.textContent.replace(/\n$/, '') + '\n```\n\n'
    });
    return td.turndown(html).replace(NAKYMATON, '');
  }

  const rivi = s => String(s || '').replace(/\s+/g, ' ').trim();
  const osoite = location.href.split('#')[0];

  // Sivun sisäinen linkki (#viite-1) sivun osoitteeksi kuten MarkDownloadissa: Latomo tekee leikkeen omalle sivulle
  // vievästä yläindeksilinkistä pelkän numeron. Readability jättää #-linkit ennalleen.
  // DOMParser eikä innerHTML: erillinen asiakirja ei hae kuvia uudelleen sivun nimissä.
  function sisaiset(html) {
    const d = new DOMParser().parseFromString(html, 'text/html');
    d.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', osoite + a.getAttribute('href')));
    return d.body.innerHTML;
  }

  // Readability antaa usein välilehden otsikon (Kirjoitus | Blogi). Lisää lukimeen -polulla kukaan ei paina Latomon
  // erotusnappia, joten sivuston nimi erotetaan tässä: h1, jolla otsikko alkaa, tai sivuston nimi lopussa.
  function siisti(otsikko, sivusto) {
    const h1 = rivi(document.querySelector('h1') && document.querySelector('h1').textContent);
    const loppu = /^\s*[|\-–—:·»]/;
    // Sivuston logona toimiva h1 (Blogi | Kirjoitus) ei kelpaa otsikoksi.
    if (h1 && h1 !== sivusto && otsikko.length > h1.length && otsikko.startsWith(h1) && loppu.test(otsikko.slice(h1.length))) return h1;
    if (sivusto && otsikko.endsWith(sivusto)) {
      const alku = otsikko.slice(0, -sivusto.length).replace(/\s*[|\-–—:·»]\s*$/, '');
      if (alku && alku !== otsikko.slice(0, -sivusto.length)) return alku.trim();
    }
    return otsikko;
  }

  // Valinta ennen Readabilityä; osoitteet absoluuttisiksi, koska irrotettu pala ei enää tiedä sivun osoitetta.
  let valintaHtml = '';
  const sel = window.getSelection();
  if (sel && sel.rangeCount && !sel.isCollapsed) {
    const pala = document.createElement('div');
    for (let i = 0; i < sel.rangeCount; i++) pala.appendChild(sel.getRangeAt(i).cloneContents());
    pala.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', a.href));
    if (pala.textContent.trim()) valintaHtml = pala.innerHTML;
  }

  let artikkeli = null;
  try { artikkeli = new Readability(document.cloneNode(true)).parse(); } catch (e) { artikkeli = null; }

  const otsikko = siisti(rivi(artikkeli && artikkeli.title || document.title), rivi(artikkeli && artikkeli.siteName)) || osoite;
  const p = new Date(), pv = n => String(n).padStart(2, '0');
  const etu = ['---'];
  const kentta = (avain, arvo) => { if (rivi(arvo)) etu.push(avain + ': ' + rivi(arvo)); };
  kentta('tekijä', artikkeli && artikkeli.byline);
  kentta('sivusto', artikkeli && artikkeli.siteName);
  kentta('julkaistu', artikkeli && artikkeli.publishedTime);
  kentta('lähde', osoite);
  kentta('leikattu', p.getFullYear() + '-' + pv(p.getMonth() + 1) + '-' + pv(p.getDate()));
  etu.push('---', '# ' + otsikko, '', '');
  const alku = etu.join('\n');

  const koko = artikkeli ? muunna(sisaiset(artikkeli.content)) : '';
  const valinta = valintaHtml ? muunna(valintaHtml) : '';
  const sanoja = s => (s.match(/\S+/g) || []).length;
  return {
    otsikko, sivusto: rivi(artikkeli && artikkeli.siteName) || location.hostname.replace(/^www\./, ''),
    koko: koko ? alku + koko + '\n' : '', kokoSanoja: sanoja(koko),
    valinta: valinta ? alku + valinta + '\n' : '', valintaSanoja: sanoja(valinta)
  };
})();
