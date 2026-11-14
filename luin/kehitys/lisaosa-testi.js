// Lisää lukimeen -lisäosan selaintesti. Ajo repon juuressa:
//   NODE_PATH=$(npm root -g) node luin/kehitys/lisaosa-testi.js [kuvakansio]
// Lataa luin/lisaosa/ Chromiumiin ja ajaa ketjun: keksitty artikkeli → ponnahdusikkuna → latomo.html#lisaosa →
// (Lisää lukimeen) luin.html#tuo → lukulista, sovitteet (SEP, Blogger, Logos, Wikipedia, marxists.org, Wait But Why, OECS, Encyclopedia.com, IPA:n IRED, St Andrews Encyclopaedia of Theology), sekä Postihuilu (workerin koodi muistissa olevalla KV:llä). Latomo ja Luin tulevat tästä reposta paikalliselta palvelimelta: ikkunan
// tabs.create-navigointi ohittaa Playwrightin reitityksen, jolloin Latomo latautui oikealta GitHub Pagesilta ja md.js
// paikallisesta reposta (6.11.2026: Pagesin uudempi Latomo kutsui funktiota, jota haaran md.js:ssä ei ollut).
// Testissä ikkuna avataan välilehtenä, jolloin activeTab ei myönny; siksi lisäosa kopioidaan väliaikaiskansioon ja
// sen manifestiin lisätään <all_urls>. Muuten lisäosa on sama.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const http = require('http');

const JUURI = path.resolve(__dirname, '../..');
const KUVAT = process.argv[2];
const TYYPIT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.md': 'text/markdown', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const ARTIKKELI = 'https://esimerkki.test/blogi/2026/kirjoitus.html';

let virheita = 0;
function tulos(nimi, ok, tieto) { if (!ok) virheita++; console.log((ok ? 'OK   ' : 'VIKA ') + nimi + (tieto ? ' – ' + tieto : '')); }

const kappale = n => `<p>${'Tämä on artikkelin leipätekstiä, jota on tarpeeksi, jotta Readability tunnistaa sen sisällöksi. '.repeat(n)}</p>`;
const SIVU = `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>Kokeilukirjoitus | Esimerkkiblogi</title>
<meta property="og:site_name" content="Esimerkkiblogi">
<meta property="article:published_time" content="2026-10-08T07:30:00+03:00">
<meta name="author" content="Maija Meikäläinen"></head><body>
<header><nav><a href="/">Etusivu</a> <a href="/arkisto/">Arkisto</a></nav></header>
<main><article><h1>Kokeilukirjoitus</h1>
${kappale(4)}
<p>Toinen kappale viittaa lähteeseen.<sup><a href="#viite-1" id="ref-1">1</a></sup> Sitten <a href="../2025/vanha.html">vanhaan kirjoitukseen</a> ja sana yhdys­sana.</p>
<figure><a href="/kuvat/iso.jpg"><img src="/kuvat/pieni.jpg" alt="Kuva"></a><figcaption>Kuvateksti jää.</figcaption></figure>
<h2>Väliotsikko</h2>
${kappale(3)}
<p id="valittava">Tämä yksi kappale maalataan valinnaksi, ja siinä on *tähti* ja [hakasulkeet] suojattaviksi.</p>
<table><tr><td>Vuosi</td><td>Teos</td></tr><tr><td>1781</td><td>Kritiikki</td></tr></table>
<iframe src="https://www.youtube.com/embed/x"></iframe>
<ol class="viitteet"><li id="viite-1">Koistinen 2013, 42.</li></ol>
</article></main><footer>© Esimerkkiblogi</footer></body></html>`;

// SEP:n rakenne (keksitty sisältö): johdanto, #main-text, jossa otsikon tunnisteessa on Readabilityn kielteinen sana
// (#ExpeMeta), bibliografia luettelona, Academic Tools, ja alaviitteet erillisellä notes.html-sivulla (alaviite 3 puuttuu).
const SEP = 'https://plato.example/entries/koe/';
const sepKpl = n => `<p>${'Leipätekstiä tietosanakirjan artikkelissa, joka on tarpeeksi pitkä sisällöksi. '.repeat(n)}</p>`;
const SEP_SIVUT = {
  [SEP]: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Koe (Stanford Encyclopedia of Philosophy)</title>
<meta property="citation_author" content="Meikäläinen, Maija"></head><body><div id="container"><div id="navigation"><a href="/">Home</a></div>
<div id="article"><div id="article-content"><div id="aueditable"><h1>Koe</h1><div id="pubinfo"><em>First published Thu Nov 1, 2018</em></div>
<div id="preamble"><p>Johdannon kappale, jonka Readability pudottaa pois, vaikka se on artikkelin alku.</p></div>
<div id="toc"><ul><li><a href="#Eka">1. Eka</a></li><li><a href="#ExpeMeta">2. Experience and Metaphysics</a></li></ul></div>
<div id="main-text"><h2 id="Eka">1. Eka</h2>${sepKpl(5)}<p>Viittaus Deweyyn.<sup>[<a href="notes.html#note-1" id="ref-1">1</a>]</sup> Toinen.<sup>[<a href="notes.html#note-2" id="ref-2">2</a>]</sup> Kolmas.<sup>[<a href="notes.html#note-3" id="ref-3">3</a>]</sup></p>
<h2 id="ExpeMeta">2. Experience and Metaphysics</h2><h3 id="Sub">2.1 Alaluku</h3>${sepKpl(5)}</div>
<div id="bibliography"><h2 id="Bib">Bibliography</h2><ul><li>Dewey, John, 1925, <em>Experience and Nature</em>, Chicago: Open Court.</li><li>Dykhuizen, George, 1973, <em>The Life and Mind of John Dewey</em>, Carbondale.</li></ul></div>
<div id="academic-tools"><h2 id="Aca">Academic Tools</h2><p>How to cite this entry.</p></div>
<div id="other-internet-resources"><h2 id="Oth">Other Internet Resources</h2><ul><li><a href="https://example.org/dewey">Dewey-seura</a></li></ul></div>
<div id="related-entries"><h2 id="Rel">Related Entries</h2><p><a href="../james/">James</a></p></div>
</div><div id="article-copyright"><p><a href="../../info.html#c">Copyright &copy; 2018</a> by <br><a href="https://example.org/">Maija Meikäläinen</a> &lt;<a href="mailto:m%40example.org"><em>m<abbr title=" at ">@</abbr>example.org</em></a>&gt;</p></div></div></div></div></body></html>`,
  [SEP + 'notes.html']: `<!doctype html><html><head><meta charset="utf-8"><title>Notes</title></head><body><div id="aueditable">
<h2>Notes to <a href="index.html">Koe</a></h2>
<div id="note-1"><p><a href="index.html#ref-1">1.</a> Ks. Dykhuizen 1973: 30–31.</p></div>
<div id="note-2"><p><a href="index.html#ref-2">2</a>. Ensimmäinen kappale.</p><blockquote><p>Lainaus alaviitteessä.</p></blockquote><p>Jatko <a href="../james/">Jamesiin</a>.</p></div>
</div></body></html>`
};

// Bloggerin rakenne (keksitty sisältö, klassisen ja Contempo-pohjan luokat): etusivulla kaksi kirjoitusta, joista toinen
// katkaistu (Lue lisää), Featured Post (uusin, vain siinä) ja Popular Posts; kirjoituksessa sitovia välilyöntejä,
// lainaus otsikkotyylinä, kuvateksti taulukossa, lihavoitu väliotsikko. Kirjoituksen oma sivu on myös yksittäinen leike.
const BLOGI = 'https://koeblogi.blogspot.com/';
const BLOG_POSTI = BLOGI + '2026/09/toinen.html';
const blogKpl = n => `<p>&nbsp;${'Blogikirjoituksen virke, jossa on tarpeeksi sanoja sisällöksi. '.repeat(n)}</p>`;
const blogPosti = (otsikko, url, aika, runko, hyppy) => `<div class="post-outer"><div class="post hentry"><h3 class="post-title entry-title"><a href="${url}">${otsikko}</a></h3>
<div class="post-body entry-content">${runko}</div>${hyppy ? `<div class="jump-link"><a href="${url}#more">Lue lisää »</a></div>` : ''}
<div class="post-footer"><span class="post-author vcard">Lähettänyt <span class="fn"><a class="g-profile" href="https://www.blogger.com/profile/1"><span itemprop="name">Maija Bloggaaja</span></a></span></span>
<span class="post-timestamp"><a class="timestamp-link" href="${url}"><abbr class="published" title="${aika}">${aika}</abbr></a></span></div></div></div>`;
const blogSivu = (otsikko, keski) => `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>${otsikko}</title><meta name="generator" content="blogger">
<link rel="alternate" type="application/atom+xml" title="  Koeblogi - Atom" href="${BLOGI}feeds/posts/default"></head><body>
<div class="widget Header"><h1 class="title">Koeblogi</h1></div><div class="main">${keski}</div>
<div class="sidebar"><div class="widget PopularPosts"><ul><li><div class="item-title">Ensimmäinen</div><div class="item-snippet">Suosittu katkelma...</div></li></ul></div></div></body></html>`;
const BLOG_RUNKO_1 = `${blogKpl(4)}<p><br></p><h4 style="text-align: left;">"Lainaus, joka on kirjoitettu otsikkotyylillä ja on pitkä. ${'Lainauksen jatko kulkee. '.repeat(8)}<br>Toinen lainauksen kappale."</h4>
<table class="tr-caption-container"><tbody><tr><td><img src="https://koeblogi.example/kuva.jpg"></td></tr><tr><td class="tr-caption">Kuvateksti taulukossa</td></tr></tbody></table>
<h2><b>Lihavoitu väliotsikko</b></h2>${blogKpl(3)}<span>&nbsp;&nbsp; &nbsp;</span><span>&nbsp;&nbsp; &nbsp;</span><span>&nbsp;Kuvateksti välilyöntien perässä</span>`;
const BLOG_SIVUT = {
  [BLOGI]: blogSivu('Koeblogi', `<div class="widget FeaturedPost"><div class="widget-content"><h3 class="post-title"><a href="${BLOGI}2026/10/uusin.html">Uusin</a></h3>
<abbr class="published" title="2026-10-21T07:02:00-07:00">x</abbr><div class="post-body entry-content"><div class="snippet-item">Uusimman katkelma...</div></div></div></div>
<div class="widget Blog"><div class="blog-posts hfeed">${blogPosti('Ensimmäinen', BLOGI + '2026/09/eka.html', '2026-09-03T10:19:00-07:00', BLOG_RUNKO_1, false)}
${blogPosti('Toinen', BLOG_POSTI, '2026-09-01T23:30:00+03:00', blogKpl(2), true)}</div></div>`),
  // Kirjoittajan oma jakonappi kirjoituksen alussa (Philosophical Disquisitions) ei saa jäädä tietoriviksi.
  [BLOG_POSTI]: blogSivu('Koeblogi: Toinen', `<div class="widget Blog"><div class="blog-posts hfeed">${blogPosti('Toinen', BLOG_POSTI, '2026-09-01T23:30:00+03:00',
    '<div style="text-align:left"><a class="twitter-share-button" href="http://twitter.com/share">Tweet</a></div>' + blogKpl(2) + '<p>Hypyn jälkeinen loppu.</p>', false)}</div></div>`)
};
// Ensyklopedia Logos (filosofia.fi, keksitty sisältö, rakenne 10.11.2026 sivuilta): tekijärivi, sisällysluettelo, lihavoitu
// ankkuriotsikko, kursiiviosio, viittaus toiseen artikkeliin sulkeissa ja tekstissä, kirjallisuus kappaleina.
const LOGOS = 'https://filosofia.fi/fi/ensyklopedia/koe-artikkeli';
const logosSivu = (ots, runko) => `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>${ots} | filosofia.fi</title>
<link rel="canonical" href="https://filosofia.fi/fi/ensyklopedia/${ots === 'Koe, Artikkeli' ? 'koe-artikkeli' : 'toinen'}"></head><body>
<nav><a href="/fi">Etusivu</a></nav><h1 class="title" id="page-title">${ots}</h1>
<div class="node node-ensyklopedia" about="/fi/ensyklopedia/x"><div class="content"><div class="field field-name-body"><div class="field-items"><div class="field-item even">${runko}</div></div></div></div></div>
<footer>Tekijänoikeudet</footer></body></html>`;
const LOGOS_SIVUT = {
  [LOGOS]: logosSivu('Koe, Artikkeli', `<p><em>Maija Kirjoittaja</em> <em>(julkaistu 5. 5. 2018)</em></p>
<p>Johdannon kappale, jossa on tarpeeksi sanoja Readabilityn ja leikkurin iloksi. Se jatkuu vielä toisellakin virkkeellä.</p>
<ol><li><a href="#Ensimmäinen%20luku">Ensimmäinen luku</a></li><li><a href="#Kirjallisuus">Kirjallisuus</a></li></ol><hr>
<p><strong>&nbsp;</strong></p>
<p><a id="Ensimmäinen luku" name="Ensimmäinen luku"><strong>Ensimmäinen luku</strong></a></p>
<p>Ajattelu on vaikuttanut kehitykseen. (ks. "<a href="/node/22099/">Toinen artikkeli</a>") Seuraava virke viittaa kirjaan (Kirjoittaja 2010, 3).</p>
<p><em>Pieni osio</em></p>
<p>Tekstissä mainitaan myös ”<a href="/node/22099/">Toinen artikkeli</a>” ilman sulkeita, ja kaksi asiaa (ks. Kirjoittaja 2010; ”<a href="/node/22099/">Toinen artikkeli</a>”).</p>
<p>&nbsp;</p>
<p><a id="Kirjallisuus" name="Kirjallisuus"><strong>Kirjallisuus </strong></a></p>
<p>Kirjoittaja, Maija (2010). <em>Kirja</em>. Kustantaja, Helsinki.</p>`),
  'https://filosofia.fi/node/22099/': logosSivu('Toinen artikkeli', `<p><em>Kalle Toinen (19.4.2015</em>)</p><p>Toisen artikkelin teksti.</p>`)
};

// Wikipedia (fi, keksitty sisältö, Parsoid-rakenne 10.11.2026): muokkauslinkit, ohjausrivi, tietolaatikko, kuva, viitteet,
// lähde?-merkintä, käännöshuomautus, sininen, punainen ja tiedostolinkki, tyhjäksi jäävä Lähteet, Kirjallisuutta-luettelo.
const WIKI = 'https://fi.wikipedia.org/wiki/Koeartikkeli';
const WIKI_SIVU = `<!doctype html><html lang="fi"><head><meta charset="utf-8"><title>Koeartikkeli – Wikipedia</title>
<script type="application/ld+json">{"@type":"Article","name":"Koeartikkeli","author":{"@type":"Organization","name":"Wikimedia-hankkeiden muokkaajat"},"datePublished":"2004-10-28T20:36:20Z","dateModified":"2026-10-24T07:22:49Z"}</script></head><body>
<h1 id="firstHeading" class="firstHeading"><span class="mw-page-title-main">Koeartikkeli</span></h1>
<div id="mw-content-text"><div class="mw-parser-output"><section>
<div class="hatnote navigation-not-searchable">Tämä artikkeli käsittelee koetta. Muita merkityksiä on sivulla <a href="/wiki/Koe_(t%C3%A4smennyssivu)">Koe</a>.</div>
<table class="infobox"><tr><th>Tietolaatikko</th><td>Tietolaatikon rivi</td></tr></table>
<figure class="mw-default-size"><a href="/wiki/Tiedosto:Kuva.jpg"><img src="//upload.example/kuva.jpg" alt="Kuva"></a><figcaption>Kuvateksti, jota ei tule.</figcaption></figure>
<p><b>Koeartikkeli</b> on <a rel="mw:WikiLink" href="/wiki/Pallo" title="Pallo">pallo</a> ja <a href="/wiki/Punainen?action=edit&amp;redlink=1" class="new" title="Punainen (sivua ei ole)">punainen</a> ja <a href="/wiki/Tiedosto:Kuva.jpg">tiedosto</a>.<sup class="mw-ref reference" id="cite_ref-1"><a href="#cite_note-1"><span>[1]</span></a></sup> Toinen virke viittaa samaan.<sup class="mw-ref reference" id="cite_ref-1-1"><a href="#cite_note-1"><span>[1]</span></a></sup></p>
</section><section><div class="mw-heading mw-heading2"><h2 id="Historia">Historia</h2><span class="mw-editsection">[<a href="/w/index.php?action=edit">muokkaa</a> | <a href="#">muokkaa wikitekstiä</a>]</span></div>
<div class="hatnote navigation-not-searchable">Pääartikkeli: <a href="/wiki/Koehistoria">Koehistoria</a></div>
<p>Historiassa <a href="/wiki/Pallo" title="Pallo">pallot</a> olivat litteitä<sup style="font-style:italic;"><a href="/wiki/Malline:L%C3%A4hde"><span class="noprint" title="mikä lähde?">lähde?</span></a></sup> ja <a href="/wiki/Kiekko" title="Kiekko">kiekot</a> pyöreitä.<sup class="mw-ref reference" id="cite_ref-2"><a href="#cite_note-2"><span>[2]</span></a></sup></p>
<div class="noprint noviewer"><figure><figcaption>Käännös suomeksi</figcaption></figure> <div>Tämä artikkeli tai sen osa on käännetty muunkielisen Wikipedian artikkelista. Alkuperäinen artikkeli: <a class="extiw" href="https://en.wikipedia.org/wiki/Test">en:Test</a></div></div>
</section><section><div class="mw-heading mw-heading2"><h2 id="Katso_myös">Katso myös</h2><span class="mw-editsection">[muokkaa]</span></div>
<ul><li><a href="/wiki/Pallo" title="Pallo">Pallo</a></li><li><a href="/wiki/Puuttuva?action=edit&amp;redlink=1" class="new">Puuttuva</a></li></ul>
</section><section><div class="mw-heading mw-heading2"><h2 id="Lähteet">Lähteet</h2><span class="mw-editsection">[muokkaa]</span></div>
<div class="viitteet-malline"><ol class="mw-references references"><li id="cite_note-1"><span class="mw-cite-backlink"><a href="#cite_ref-1">↑</a></span> <span class="mw-reference-text reference-text">Meikäläinen, Matti: <i>Kirja pallosta</i>, s. 12. <a href="/wiki/Otava">Otava</a>, 2001.</span></li>
<li id="cite_note-2"><span class="mw-cite-backlink"><a href="#cite_ref-2">↑</a></span> <span class="mw-reference-text reference-text"><a href="#CITEREFKirjoittaja2010">Kirjoittaja 2010</a>, s. 5. <a class="external text" href="https://esimerkki.test/lahde">Verkkolähde</a></span></li></ol></div>
</section><section><div class="mw-heading mw-heading2"><h2 id="Kirjallisuutta">Kirjallisuutta</h2></div>
<ul><li><cite id="CITEREFKirjoittaja2010">Kirjoittaja, Maija (2010). <i>Kirja</i>. Helsinki: Kustantaja.</cite></li></ul>
</section><table class="navbox"><tr><td>Navigointilaatikko</td></tr></table></div></div>
<footer><ul><li id="footer-info-copyright">Teksti on saatavilla <a rel="nofollow" class="external text" href="https://creativecommons.org/licenses/by-sa/4.0/deed.fi">Creative Commons Nimeä-JaaSamoin 4.0</a> -lisenssillä; lisäehtoja voi sisältyä. Katso käyttöehdot.</li></ul></footer></body></html>`;

// marxists.org (keksitty sisältö, rakenne 11.11.2026 sivuilta): nimiö otsikkoina ennen viivaa, luvun nimi viivojen välissä
// rivinvaihdolla, sisällysluettelo #-linkkeinä, tietolohko Written/Copyleft, sisennetyt lainaukset, viite samalla sivulla
// jatkokappaleineen, viite toisella sivulla <a name>-ankkurilla, tähtirivi taulukkona, navigointi ja päivitysrivi.
const MIA = 'https://www.marxists.org/archive/koe/works/1917/teos/ch01.htm';
const MIA_KPL = n => `Body paragraph number ${n} has enough words for the reader to read it and for the clipper to count it as text.`;
const MIA_SIVUT = {
  [MIA]: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="author" content="Maija Kirjoittaja">
<title>The Test Work — Chapter 1</title><link rel="stylesheet" type="text/css" href="../../../../css/works.css"></head><body>
<h2>Maija Ilmari Kirjoittaja</h2><h3>The Test Work</h3><hr class="end"><h3>Chapter I<br>Class Society</h3><hr class="end">
<p class="index"><a href="#s1">The First Section</a><br><a href="#s2">The Second Section</a></p><hr class="end">
<p class="information"><span class="info">Written:</span> August 1917;<br><span class="info">Source:</span> Collected Works, Volume 1.<br>
<span class="info">Copyleft:</span> Marxists Internet Archive (marxists.org) 2000. Permission is granted under the terms of the <a href="../../../../admin/legal/cc/by-sa.htm">Creative Commons ShareAlike License</a>.</p>
<h4 id="s1">1. The First Section</h4>
<p>${MIA_KPL(1)} A mark<sup class="ednote"><a href="#fw01" id="bk01">[1]</a></sup> is here.</p>
<p class="quoteb">“An indented quotation.”</p><p class="quoteb">Second paragraph of the quotation.</p>
<p>${MIA_KPL(2)} The other page<sup class="enote"><a href="notes.htm#n2">[2]</a></sup> too.</p>
<h4 id="s2">2. The Second Section</h4><p>${MIA_KPL(3)}</p>
<table class="TNRtable"><tr><td>*</td><td>&nbsp;</td><td>*</td></tr></table>
<p>${MIA_KPL(4)}<br><br></p><hr class="base"><h3>Notes</h3>
<p class="endnote"><sup class="ednote"><a href="#bk01" id="fw01">[1]</a></sup> First note text.</p>
<p class="endnote">Continuation of the first note.</p><hr class="end">
<p class="next">Next: <a href="ch02.htm">Chapter Two</a></p>
<table class="footer"><tr><td class="footer-backward"><a href="index.htm">Index</a></td></tr></table>
<p class="updat">Last updated on: 1.1.2026</p></body></html>`,
  'https://www.marxists.org/archive/koe/works/1917/teos/notes.htm': `<!DOCTYPE html><html><body><a name="n1"> </a><p class="fst"><span class="term">1.</span> Wrong one.</p>
<a name="n2"> </a><p class="fst"><span class="term">2.</span> Second note on the other page.</p></body></html>`
};
// Wait But Why (keksitty sisältö, rakenne 11.11.2026 sivuilta): PDF-mainos, sininen ja harmaa viite samalla numerolla,
// ← open these, kuva ja sen lähderivi pienellä, viiva, väliotsikot isona lihavointina, Sources rivinvaihdoin,
// Related posts, uutiskirje ja Patreon, viiteluettelot paluulinkkeineen.
const WBW = 'https://waitbutwhy.com/2026/01/koe.html';
const WBW_KPL = n => `<p>Paragraph ${n} is a long paragraph of the post. It has many words, because the post would otherwise be too short for the end-of-post rules. ` +
  'Tim writes long posts, and so does this test, with a sentence after sentence after sentence until the paragraph is long enough.</p>';
const WBW_SIVU = `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><title>Koe Post - Wait But Why</title>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Article","datePublished":"2026-01-15T10:00:00+00:00","author":{"name":"Tim Testi"}},{"@type":"Person","name":"Tim Testi"}]}</script></head>
<body><header id="header">Home Menu</header><article><header class="entry-header"><h1>Koe Post</h1><div class="entry-meta"><span class="date">January 15, 2026</span> By Tim Testi</div></header>
<div class="entry-content">
<p><span style="font-size: 12pt;"><em><strong>PDF: </strong>We made a fancy PDF of this post. <a href="https://gum.co/x">Buy it here.</a></em></span></p>
<p>Opening paragraph with notes.<a href="#footnote-1-9" id="note-1-9" rel="footnote">1</a><a href="#footnote2-1-9" id="note2-1-9" rel="footnote2">1</a><sup>← open these</sup></p>
<p><a href="https://waitbutwhy.com/wp-content/uploads/x.png"><img src="https://waitbutwhy.com/wp-content/uploads/x.png"></a></p>
<p><span style="font-size: 8pt;">Image: Somebody</span></p>
<p style="text-align: center;">_______</p>
<p><span style="font-size: 16pt;"><strong>A Big Section</strong></span></p>${WBW_KPL(1)}
<p><span style="font-size: 24pt;"><strong>Part 2: Larger</strong></span></p>${WBW_KPL(2)}${WBW_KPL(3)}
<p style="text-align: center;">_______</p>${WBW_KPL(4)}
<p><span style="font-size: 14pt;"><strong>Sources</strong></span><br>Source One: <a href="https://example.test/1">First Title</a><br>Source Two: <a href="https://example.test/2">Second Title</a></p>
<p><strong><span style="font-size: 16pt;">Related Wait But Why Posts</span></strong></p>
<p><a href="https://waitbutwhy.com/2014/05/x.html">Other Post</a> – description.</p>
<p class="has-text-align-center wp-block-paragraph">_______</p>
<p class="wp-block-paragraph">If you like Wait But Why, sign up for our <strong><a href="https://newsletter.waitbutwhy.com/join">email list</a></strong> and we’ll send you new posts.</p>
<p class="wp-block-paragraph">To support Wait But Why, visit our <strong><a href="https://patreon.com/waitbutwhy">Patreon page</a></strong>.</p>
<div id="social-ads"><a href="https://twitter.com/intent/tweet">Tweet</a></div>
<div class="footnotes"><hr><ol><li id="footnote-1-9" class="footnote"><p>Blue note text.<a href="#note-1-9" class="footnote-return">&#8617;</a></p></li></ol></div>
<div class="footnotes2"><hr><ol><li id="footnote2-1-9" class="footnote2"><p>Gray source, <a href="https://example.test/kirja"><em>Book</em></a>, 12.<a href="#note2-1-9" class="footnote2-return">&#8617;</a></p></li></ol></div>
</div></article><footer id="footer">Popular Posts</footer></body></html>`;
// Open Encyclopedia of Cognitive Science (keksitty sisältö, oecs.knowledgefutures.orgin rakenne 11.11.2026, osoite
// oecs.mit.edu): citation_*-metatiedot, APA-viittaukset, KaTeX, kuva kuvateksteineen, taulukko kuvatekstein, Further
// reading ja References, tekijä- ja lisenssiosio.
const OECS = 'https://oecs.mit.edu/pub/koe123';
const OECS_SIVU = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Koe Entry — OECS</title>
<meta name="citation_title" content="Koe Entry"><meta name="citation_author" content="Ada Aaltonen"><meta name="citation_author" content="Bo Berg">
<meta name="citation_publication_date" content="2024/07/24"><meta name="citation_journal_title" content="Open Encyclopedia of Cognitive Science">
<meta name="citation_doi" content="10.21428/e2759450.koe"></head><body><main><article><header><h1>Koe Entry</h1><div>Ada Aaltonen · University</div></header>
<aside><nav class="toc"><h3>Contents</h3><ul><li><a href="#history">History</a></li></ul></nav></aside>
<div class="article-body"><article>
<p>An entry about a topic. Its first paragraph is long enough not to be read as a line of the title block (<a href="#citation-A-bottom" id="citation-A-1-inline" data-node-type="citation" data-value="" data-unstructured-value="&lt;p&gt;Mitchell, M. (2009). Complexity. OUP.&lt;/p&gt;" data-custom-label="Mitchell, 2009" class="citation">Mitchell, 2009</a>).</p>
<h1 id="history">History</h1>
<p>As <a href="#citation-B-bottom" id="citation-B-1-inline" data-node-type="citation" data-value="https://doi.org/10.1/x" data-custom-label="Turing (1937)" class="citation">Turing (1937)</a> showed, the noise <math-inline className="math-node"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>σ</mi></mrow><annotation encoding="application/x-tex">σ</annotation></semantics></math></span><span class="katex-html" aria-hidden="true">σ</span></span></math-inline> and <math-inline className="math-node"><span class="katex"><span class="katex-mathml"><math><semantics><mrow></mrow><annotation encoding="application/x-tex">x^2 + 1</annotation></semantics></math></span><span class="katex-html" aria-hidden="true">x2+1</span></span></math-inline> matter. See <a href="#n1" class="reference" data-node-type="reference" data-target-id="n1">Figure 1</a>.</p>
<figure id="n1" data-node-type="image"><img src="/assets/a.png"><figcaption><div><strong>Figure 1</strong><div><p>A caption of the figure.</p></div></div></figcaption></figure>
<h2 id="sub">Sub section</h2><p>The table follows.</p>
<div><table><caption>Table 1</caption><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>1</p></td><td><p>2</p></td></tr></tbody></table></div>
<h1 id="key-references">Further reading</h1><ul><li><p>Reader, R. (2020). <em>Further</em>. Press.</p></li></ul>
<div class="pub-notes"><h1>References</h1><ul>
<li id="citation-A-bottom"><span class="pub-note-content-component"><span><div class="csl-bib-body"></div></span><span><p>Mitchell, M. (2009). <em>Complexity: A guided tour</em>. Oxford University Press.</p></span></span> <a href="#citation-A-1-inline" class="return-link">↩</a></li>
<li id="citation-B-bottom"><span class="pub-note-content-component"><span><div class="csl-bib-body"><div class="csl-entry">Turing, A. M. (1937). On computable numbers. <i>Proceedings of the LMS</i>, <i>42</i>, 230–265.</div></div></span><span></span></span> <a href="#citation-B-1-inline" class="return-link">↩</a></li>
</ul></div>
<footer class="pub-footer"><section class="pub-attributions"><h2>Authors</h2><ul><li>Ada Aaltonen</li></ul></section>
<section class="pub-license"><h2>License</h2><p><a href="https://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International License</a></p></section></footer>
</article></div></article></main></body></html>`;

// Encyclopedia.com (keksitty sisältö, sivuston rakenne 13.11.2026): aihesivulla kaksi artikkelia eri hakuteoksista. Ensimmäisessä
// (IESS:n tapaan) oma sisällysluettelo, h2-ankkurit, sivuston sisäiset linkit, Lucida-kääre, tyhjä byline ja allekirjoitus;
// toisessa (IDP:n tapaan) otsikon toisto, katkennut byline ja ehjä allekirjoitus. Kummallakin oma osoite sitaattiruudussa.
const ENC = 'https://www.encyclopedia.com/people/koe/koe-aihe';
const encArtikkeli = (n, otsikko, teos, byline, runko, oma) => `<div class="articleWrapper" id="articleWrapper-${n}"><span class="document-id" data-val="x"></span>
<h1 class="doctitle" data-toggle="collapse" data-target="#collapseExample${n}"> ${otsikko}</h1>
<div class="divpagetoolscontrol"><div class="logo-copy"><span>updated <strong class="topic_updated"><time datetime="2018-06-27">Jun 27 2018</time></strong></span></div></div>
<div class="doccontentwrapper collapse show" id="collapseExample${n}"><div class="article-content-ad"></div>${runko}</div>
<div class="bylinecontainer"> <span>${teos}</span> <span>${byline}</span></div>
<div class="modal fade" id="citationModal${n}"><div class="modal-body citation-container"><div class="TopicCitationDiv">Cite this article
<p class="cittext"> "<a href="${oma}\n">${otsikko}\n.</a>" <u>${teos}</u>. . <i>Encyclopedia.com.</i> 30 Oct. 2026 &lt;<a href="https://www.encyclopedia.com">https://www.encyclopedia.com</a>&gt;.</p></div></div></div></div>`;
const ENC_SIVU = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Koe Aihe | Encyclopedia.com</title></head><body><main>
<ul class="breadcrumb"><li><a href="/people">People</a></li></ul><div id="block-trustme-content"><article><div></div></article></div>
${encArtikkeli(0, 'Koe, Aihe', 'International Encyclopedia of the Social Sciences', '', `<h1>Koe, Aihe</h1>
<p><a href="#A">Early career</a></p><p><a href="#B">Later work</a></p>
${'<p>The first article opens with a paragraph about the subject and <a class="interlinked" href="/people/koe/toinen">another person</a>, enough words for a body. </p>'.repeat(2)}
<h2><a id="A">Early career</a></h2><p>He studied at Burgh<span style="font-family:Lucida Sans Unicode;"><span style="font-family:Lucida Sans Unicode;">ö</span></span>lzli and read <a data-topic="12" href="/places/koe">a place</a> and <a href="http://www.example.test/ulos">an outside site</a>.</p>
<h2><a id="B">Later work</a></h2><p>The later work continues here with more text about the subject.</p>
<p>Jolanda Testi</p>
<h2><a id="C">BIBLIOGRAPHY</a></h2><p>Testi, Jolanda 1960 <i>A Book</i>. London: Press.</p>`, 'https://www.encyclopedia.com/social-sciences/koe/koe-aihe')}
${encArtikkeli(1, 'Koe, Aihe (1875-1961)', 'International Dictionary of Psychoanalysis', 'Ko ', `<h1>KOE, AIHE (1875-1961)</h1>
<p id="toinen-alku">The second article is a dictionary entry about the same subject, written by another author for another work.</p>
<p>Ada I. Ko<span style="font-family:Lucida Sans Unicode;"><span style="font-family:Lucida Sans Unicode;">É</span></span>san</p>
<p><i>See also:</i> Something; Another.</p>
<h2>Bibliography</h2><p>Kosan, Ada. (1999). <i>Entry</i>. Paris: PUF.</p>`, 'https://www.encyclopedia.com/psychology/koe/koe-aihe-1875-1961')}
<footer>© 2019 Encyclopedia.com | All rights reserved.</footer></main></body></html>`;

// St Andrews Encyclopaedia of Theology (keksitty sisältö, saet.ac.uk:n rakenne 14.11.2026): citation-metatiedot, tiivistelmä
// otsikon ja tekijän kera, sisällysluettelo, sitaattiruutu ja avainsanat (pois), luvut sisäkkäisinä div:eina (h2, h3, h4,
// span.heading_label), tekstiviittaus span.bibref > span.citation, ristiviittaus a.citation, lainaus, Attributions (Copyright
// ja ORCID-kuva, lähdepainoskappale) ja sisäkkäinen bibliografia (li > h3 + ul).
const SAET = 'https://www.saet.ac.uk/Buddhism/Koe';
const saetViite = (teksti, nimi, lisa = '') => `<span class="bibref" title="&lt;div class=&quot;popup&quot;&gt;${teksti}&lt;/div&gt;" data-toggle="tooltip" data-html="true"><span class="citation">${nimi}</span>${lisa}</span>`;
const SAET_SIVU = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Koe (1200–1253) - St Andrews Encyclopaedia of Theology</title>
<meta name="citation_title" content="Koe (1200–1253)"><meta name="citation_journal_title" content="St Andrews Encyclopaedia of Theology">
<meta name="citation_author" content="Ada Aaltonen"><meta name="citation_author" content="Bo Berg"><meta name="citation_publication_date" content="2024/03/28"></head><body>
<nav><a href="https://www.saet.ac.uk/articles">Articles</a></nav><section role="main"><div class="container article-contents"><div class="row"><div class="col-md-8">
<div id="abstract"><h1 class="page-heading">Koe (1200–1253)</h1><p id="author"><em>Ada Aaltonen and Bo Berg</em></p>
<p>The abstract opens the article and is long enough to be a real paragraph of an encyclopaedia entry about practice.</p></div></div>
<div class="col-md-4"><p class="page-heading"><a href="#" class="btn">Cite</a> <a href="#" class="pdf_link btn">Save</a></p></div></div>
<div class="row"><div class="col-md-8"><p id="keywords"><a class="btn btn-small-tag" href="https://www.saet.ac.uk/index.php/search?kw=Zen">Zen</a></p></div></div></div>
<nav id="nav-top" class="sticky-nav"><ul class="sticky-nav__menu"><li><a href="#toc">Contents</a></li></ul></nav>
<div class="container article-contents"><div class="row"><div class="col-md-8"><div id="toc"><h2 id="contents" class="page-heading">Table of contents</h2><ul><li><p><a href="#section1"><span class="heading_label">1</span> Life</a></p></li></ul></div></div></div>
<div class="row"><div class="col-md-8"><div class="modal" id="cite_modal"><div class="modal-body"><span id="MHRA_style">Ada Aaltonen, 'Koe', in St Andrews Encyclopaedia of Theology</span></div></div>
<div><h2 id="section1" class="page-heading"><span class="heading_label">1</span> Life</h2>
<p>He trained for years (${saetViite('Bodiford, William M. 1993. &lt;em&gt;Sōtō Zen in Medieval Japan&lt;/em&gt;. University of Hawaii Press.', 'Bodiford 1993', ': 224')}), as discussed below (${saetViite('', '<a href="#section2.1" class="citation">section 2.1</a>')}).</p>
<blockquote><p>A quoted passage from the master.</p></blockquote></div>
<div><h2 id="section2"><span class="heading_label">2</span> Thought</h2><p>Thought begins here.</p>
<div><h3 id="section2.1"><span class="heading_label">2.1</span> Time</h3><p>Time is being (${saetViite('Raud, Rein. 2012.', 'Raud 2012')}).</p>
<div><h4 id="section2.1.1"><span class="heading_label">2.1.1</span> Being-time</h4><p>Being-time in the <i lang="ja-latn">Shōbōgenzō</i>.</p></div></div></div>
</div></div>
<div class="row"><div class="col-md-8"><div id="attrib"><h3>Attributions</h3><p>Copyright <a href="https://orcid.org/0000">Ada Aaltonen</a> <a href="https://orcid.org/0000"><img src="https://www.saet.ac.uk/files/ORCIDiD_iconvector.svg" alt="ORCID logo"></a> (<a href="https://creativecommons.org/licenses/by-nc/3.0">CC BY-NC</a>)</p><p>Texts are quoted according to the Taishō edition.</p></div></div></div>
<div class="row"><div class="col-md-8"><div id="bibliography_div"><h2 id="bibliography">Bibliography</h2><ul><li><h3 id="id9">Further reading</h3><ul><li>Heine, Steven. 2020. <cite>Readings of the Eye</cite>. Columbia University Press.</li></ul></li>
<li><h3 id="id10">Works cited</h3><ul><li>Bodiford, William M. 1993. <cite>Sōtō Zen in Medieval Japan</cite>. University of Hawaii Press.</li><li>Raud, Rein. 2012. ‘The Existential Moment’, <cite>Philosophy East and West</cite> 62, no. 2: 153–173. <a href="https://doi.org/10.1353/pew.2012.0029">https://doi.org/10.1353/pew.2012.&#8203;0029</a></li></ul></li></ul></div></div></div>
</div></section><footer><h3>About</h3><p>ISSN 2753-3492</p></footer></body></html>`;

// IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis (keksitty kirja, FlippingBookin hakukonesivujen rakenne
// 13.11.2026): sisällysluettelo sivulla 2 (painettu sivu + 1 = osoite), hakusana kahdella sivulla, sivunvaihdossa jatkuva
// virke ja tavuviiva, otsikot versaalikappaleina, See also jatkuu seuraavassa kappaleessa REFERENCES-otsikkoon, lisenssi.
// Kirjan viimeisen sivun (a.last) jälkeiset osoitteet antavat 200:n ja kansisivun kuten oikea sivusto.
const IRED_KIRJA = 'https://online.flippingbook.com/view/999/';
const iredSivu = (n, ps) => `<!doctype html><html><head><meta charset="utf-8"><title>IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis - Page ${n}</title></head><body>
<div class="nav-links"><a class="first" href="${IRED_KIRJA}i/">i</a><a class="last" href="${IRED_KIRJA}9/">9</a></div>
<div id="text-container" itemprop="text"><h1 id="page-title">IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis</h1>
${ps.map(p => '<p>' + p + '</p>').join('\n')}
<p class="powered-by">Made with <a href="https://flippingbook.com/">FlippingBook</a> - professional solution</p></div>
<script>var c = {"numerationOffset":1};</script></body></html>`;
const IRED_SIVUT = {
  1: [], 2: ['IPA INTER-REGIONAL ENCYCLOPEDIC DICTIONARY OF PSYCHOANALYSIS', 'CONTENTS',
    'ALPHA: THE FIRST ........................ 2 BETA ........................ 4 GAMMA ........................ 5 DELTA ........................ 6 EPSILON ........................ 7'],
  3: ['Back to Table of Contents', 'ALPHA: THE FIRST Tri-Regional Entry First Edition 2017: Inter-Regional Editorial Board: Ada Testi (Europe) Second Edition 2022: Bo Koe', 'I. DEFINITION',
    'Alpha is a concept whose first paragraph runs over the page and ends with the counter-', '2'],
  4: ['Back to Table of Contents', 'transference of the analyst , as the 1 st edition said.', 'VII. A. SUBSECTION TITLE The subsection text follows here.',
    'See also: BETA GAMMA', 'DELTA REFERENCES Akhtar, S. (2009). Comprehensive Dictionary. London: Karnac. Bion W.R. (1959). Attacks on linking. Int. J. 40:308-15 Bion, W. R. (1962a) Learning from Experience. London: Tavistock.',
    'The IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis is licensed under Creative Commons Licence CC-BY-NC-ND. Core rights remain with the authors. Please click here for terms.', '3'],
  5: ['Back to Table of Contents', 'BETA Tri-Regional Entry', 'Beta text that must not be in Alpha.', '4'],
  8: ['Back to Table of Contents', 'EPSILON Tri-Regional Entry', 'Epsilon begins on the second last page.', '7'],
  9: ['Back to Table of Contents', 'Epsilon continues on the last page of the book.', '8']
};
const iredHtml = u => { const m = /^https:\/\/online\.flippingbook\.com\/view\/999\/(\d+|i)\/?$/.exec(u); if (!m) return null;
  const n = m[1] === 'i' ? 1 : +m[1]; return iredSivu(n, IRED_SIVUT[n] || (n > 9 ? IRED_SIVUT[2] : ['Back to Table of Contents', 'Page ' + n + ' body.', String(n - 1)])); };

(async () => {
  // Lisäosasta testikopio, jonka manifestissa <all_urls>.
  const lisaosa = fs.mkdtempSync(path.join(os.tmpdir(), 'lisaosa-'));
  fs.cpSync(path.join(JUURI, 'luin/lisaosa'), lisaosa, { recursive: true });
  const man = JSON.parse(fs.readFileSync(path.join(lisaosa, 'manifest.json'), 'utf8'));
  const palvelin = http.createServer((q, r) => {
    const p = path.join(JUURI, decodeURIComponent(q.url.split(/[?#]/)[0]));
    if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYYPIT[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(r);
  }).listen(0);
  await new Promise(r => palvelin.once('listening', r));
  const PAIKALLINEN = 'http://127.0.0.1:' + palvelin.address().port + '/';
  man.host_permissions.push('<all_urls>');
  man.content_scripts[0].matches = [PAIKALLINEN + 'luin/latomo.html*'];
  fs.writeFileSync(path.join(lisaosa, 'manifest.json'), JSON.stringify(man, null, 2));
  const pj = path.join(lisaosa, 'ponnahdus.js');
  fs.writeFileSync(pj, fs.readFileSync(pj, 'utf8').replace('https://ollijuutilainen.github.io/', PAIKALLINEN));
  const profiili = fs.mkdtempSync(path.join(os.tmpdir(), 'lisaosa-profiili-'));

  const wf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'luin-worker-')), 'index.mjs');
  fs.writeFileSync(wf, fs.readFileSync(path.join(JUURI, 'worker/src/index.js')));
  const worker = (await import(wf)).default, KV = new Map();
  const env = { ALLOWED_ORIGINS: PAIKALLINEN.replace(/\/$/, ''), LOCATIONS: {
    async put(k, v, o) { KV.set(k, { v: String(v), meta: o && o.metadata }); }, async get(k) { return KV.has(k) ? KV.get(k).v : null; },
    async list({ prefix }) { return { keys: [...KV.keys()].filter(k => k.startsWith(prefix)).map(k => ({ name: k, metadata: KV.get(k).meta })) }; } } };
  async function workerille(route) {
    const q = route.request();
    const res = await worker.fetch(new Request(q.url(), { method: q.method(), headers: await q.allHeaders(),
      body: ['GET', 'HEAD', 'OPTIONS'].includes(q.method()) ? undefined : q.postData() }), env, {});
    const h = {}; res.headers.forEach((v, k) => { h[k] = v; });
    return route.fulfill({ status: res.status, headers: h, body: Buffer.from(await res.arrayBuffer()) });
  }
  const ctx = await chromium.launchPersistentContext(profiili, { channel: 'chromium', headless: true,
    args: ['--disable-extensions-except=' + lisaosa, '--load-extension=' + lisaosa] });
  const virheet = [];
  // Vain http(s): reitti '**/*' sieppaisi myös lisäosan omat tiedostot (chrome-extension://), ja ikkuna jäisi tyhjäksi.
  await ctx.route(/^https?:/, r => {
    const u = new URL(r.request().url());
    if (u.hostname === '127.0.0.1') return r.continue();
    // Postilaatikko: workerin oikea koodi muistissa olevalla KV:llä (posti-testi.js:n tapaan).
    if (u.hostname === 'tusinasaa-worker.ollijuutilainen.workers.dev') return workerille(r);
    if (u.href.split('#')[0] === ARTIKKELI) return r.fulfill({ body: SIVU, contentType: 'text/html; charset=utf-8' });
    if (BLOG_SIVUT[u.href.split('#')[0]]) return r.fulfill({ body: BLOG_SIVUT[u.href.split('#')[0]], contentType: 'text/html; charset=utf-8' });
    if (SEP_SIVUT[u.href.split('#')[0]]) return r.fulfill({ body: SEP_SIVUT[u.href.split('#')[0]], contentType: 'text/html; charset=utf-8' });
    if (LOGOS_SIVUT[u.href.split('#')[0]]) return r.fulfill({ body: LOGOS_SIVUT[u.href.split('#')[0]], contentType: 'text/html; charset=utf-8' });
    if (u.href.split('#')[0] === WIKI) return r.fulfill({ body: WIKI_SIVU, contentType: 'text/html; charset=utf-8' });
    if (MIA_SIVUT[u.href.split('#')[0]]) return r.fulfill({ body: MIA_SIVUT[u.href.split('#')[0]], contentType: 'text/html; charset=utf-8' });
    if (u.href.split('#')[0] === WBW) return r.fulfill({ body: WBW_SIVU, contentType: 'text/html; charset=utf-8' });
    if (u.href.split('#')[0] === OECS) return r.fulfill({ body: OECS_SIVU, contentType: 'text/html; charset=utf-8' });
    if (u.href.split('#')[0] === ENC) return r.fulfill({ body: ENC_SIVU, contentType: 'text/html; charset=utf-8' });
    if (u.href.split('#')[0] === SAET) return r.fulfill({ body: SAET_SIVU, contentType: 'text/html; charset=utf-8' });
    if (iredHtml(u.href.split('#')[0])) return r.fulfill({ body: iredHtml(u.href.split('#')[0]), contentType: 'text/html; charset=utf-8' });
    if (u.hostname === 'ollijuutilainen.github.io') {
      const p = path.join(JUURI, decodeURIComponent(u.pathname));
      if (!p.startsWith(JUURI) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ body: fs.readFileSync(p), contentType: TYYPIT[path.extname(p)] || 'application/octet-stream' });
    }
    return r.abort();
  });

  // Lisäosan tunnus profiilista (ei taustaskriptiä, joten service workeria ei ole).
  let id = null;
  for (let i = 0; i < 40 && !id; i++) {
    await new Promise(r => setTimeout(r, 250));
    for (const f of ['Secure Preferences', 'Preferences']) {
      try {
        const s = JSON.parse(fs.readFileSync(path.join(profiili, 'Default', f), 'utf8')).extensions.settings;
        id = Object.keys(s).find(k => s[k].path === lisaosa) || id;
      } catch (e) {}
    }
  }
  tulos('lisäosa latautuu', !!id, id || 'tunnusta ei löytynyt profiilista');
  if (!id) { await ctx.close(); process.exit(1); }
  const IKKUNA = `chrome-extension://${id}/ponnahdus.html`;

  const artikkeli = ctx.pages()[0] || await ctx.newPage();
  artikkeli.on('pageerror', e => virheet.push('artikkeli: ' + e.message));
  await artikkeli.goto(ARTIKKELI);

  // Ikkuna sulkee itsensä napin jälkeen (window.close), joten joka kerta uusi välilehti.
  let ikkuna = null;
  const avaaIkkuna = async (sivu = ARTIKKELI) => {
    if (!ikkuna || ikkuna.isClosed()) { ikkuna = await ctx.newPage(); ikkuna.on('pageerror', e => virheet.push('ikkuna: ' + e.message)); }
    await ikkuna.goto(IKKUNA);
    const tab = await ikkuna.evaluate(async u => (await chrome.tabs.query({ url: u }))[0].id, sivu);
    await ikkuna.goto(IKKUNA + '?valilehti=' + tab);
    // Vain tila- ja otsikkorivi: piilotetussa ohjeessa on sana "voi", jolloin odotus päättyi joskus ennen leikettä.
    await ikkuna.waitForFunction(() => !document.querySelector('#lukimeen').disabled || /voi|löytynyt/.test(document.querySelector('#tila').textContent + document.querySelector('#otsikko').textContent), null, { timeout: 5000 });
  };
  // Nappi avaa uuden välilehden; odotetaan sen asettuvan (Latomo, tai Luin jos nappi oli Lisää lukimeen).
  const paina = async (nappi, minne) => {
    const uusi = ctx.waitForEvent('page');
    await ikkuna.click(nappi);
    const p = await uusi;
    p.on('pageerror', e => virheet.push('välilehti: ' + e.message));
    await p.waitForURL(minne, { timeout: 8000 });
    if (!p.url().startsWith(PAIKALLINEN)) virheet.push('välilehti ei ole paikallinen: ' + p.url());
    await p.waitForTimeout(700);
    return p;
  };

  // 1. Koko artikkeli: ikkuna näyttää otsikon ja sanamäärän, valintariviä ei ole.
  await avaaIkkuna();
  const ik = await ikkuna.evaluate(() => ({ otsikko: document.querySelector('#otsikko').textContent, meta: document.querySelector('#meta').textContent,
    valinta: !document.querySelector('#valintarivi').hidden }));
  tulos('ikkuna: otsikko ja sanamäärä', ik.otsikko === 'Kokeilukirjoitus' && /^Esimerkkiblogi · \d+ sanaa$/.test(ik.meta) && !ik.valinta, JSON.stringify(ik));
  if (KUVAT) { await ikkuna.setViewportSize({ width: 360, height: 300 }); await ikkuna.screenshot({ path: path.join(KUVAT, 'lisaosa-ikkuna.png') }); }

  // 2. Avaa Latomossa: leike tekstikentässä, siivous päällä korvamerkistä.
  const latomo = await paina('#latomoon', /latomo\.html$/);
  const L = await latomo.evaluate(() => ({ md: document.querySelector('#md').value, t: window.__latomo.tulos(),
    leike: !document.querySelector('#leike-tila').hidden, tila: document.querySelector('#leike-tila').textContent.trim(), hash: location.hash }));
  const raaka = L.md, md = L.t.md;
  tulos('Latomo: leike tekstikentässä, osoitteesta pois #lisaosa', /^---\ntekijä: Maija Meikäläinen\nsivusto: Esimerkkiblogi\njulkaistu: 2026-10-08T07:30:00\+03:00\nlähde: https:\/\/esimerkki\.test\/blogi\/2026\/kirjoitus\.html\nleikattu: \d{4}-\d\d-\d\d\n---\n# Kokeilukirjoitus\n\n/.test(raaka) && L.hash === '',
    raaka.split('\n').slice(0, 9).join(' | '));
  tulos('Latomo: korvamerkki kytkee leikkeen siivouksen', L.leike && /^haettu: \d{4}-\d\d-\d\d$/m.test(md) && !/leikattu/.test(md), L.leike + ' | ' + L.tila);
  tulos('viite koottu', /^Meikäläinen, Maija \(2026\)\. Kokeilukirjoitus\./.test(L.t.koottu || ''), L.t.koottu);
  tulos('oman sivun yläindeksilinkki numeroksi', /lähteeseen\.\^1\^ Sitten/.test(md), (md.match(/lähteeseen\..{0,40}/) || [''])[0]);
  tulos('suhteellinen linkki absoluuttiseksi', /^\[\d+\]: https:\/\/esimerkki\.test\/blogi\/2025\/vanha\.html$/m.test(raaka), (raaka.match(/^\[\d+\]: .*vanha.*$/m) || ['ei löydy'])[0]);
  tulos('kuvat ja tyhjä kuvalinkki pois, kuvateksti jää', !/!\[|\[\]\(|\[\]\[|pieni\.jpg|iso\.jpg/.test(raaka) && /Kuvateksti jää\./.test(raaka));
  tulos('pehmeä tavuviiva pois', /yhdyssana/.test(raaka) && !/­/.test(raaka));
  tulos('upotus pois', !/iframe|youtube/.test(raaka));
  tulos('Markdown-merkit suojattu', /\\\*tähti\\\* ja \\\[hakasulkeet\\\]/.test(raaka), (raaka.match(/.{0,5}tähti.{0,30}/) || [''])[0]);
  tulos('otsikkorivitön taulukko Markdowniksi', /\| Vuosi \| Teos \|\n\| --- \| --- \|\n\| 1781 \| Kritiikki \|/.test(md), (md.match(/\|[^\n]*Vuosi[^\n]*\n[^\n]*\n[^\n]*/) || ['ei taulukkoa'])[0]);
  tulos('väliotsikko ##', /^## Väliotsikko$/m.test(md));
  await latomo.close();

  // 2b. Lataa .md (0.8.0; taustalla 13.11.2026): Latomo avautuu taustavälilehdelle, painaa itse Lataa .md ja sulkee itsensä;
  // tiedosto on Latomon ladoma teksti (sama kuin kohdassa 2).
  // Välilehden etu- tai taustatila lisäosan omalta sivulta: headless-Chromiumissa visibilityState on taustallakin visible.
  const tarkkailija = await ctx.newPage();
  await tarkkailija.goto(IKKUNA);
  await avaaIkkuna();
  const uusiL = ctx.waitForEvent('page');
  await ikkuna.click('#lataa');
  const latomoL = await uusiL;
  latomoL.on('pageerror', e => virheet.push('välilehti: ' + e.message));
  const dlP = latomoL.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  const kiinniP = latomoL.waitForEvent('close', { timeout: 12000 }).then(() => Date.now(), () => 0);
  await latomoL.waitForURL(/latomo\.html$/, { timeout: 8000 });
  const taustaL = await tarkkailija.evaluate(async () => (await chrome.tabs.query({})).filter(t => /latomo\.html/.test(t.url)).map(t => t.active ? 'edessä' : 'taustalla').join());
  await tarkkailija.close();
  const dl = await dlP, alkoi = Date.now(), kiinni = await kiinniP;
  const dlMd = dl ? fs.readFileSync(await dl.path(), 'utf8') : '';
  tulos('Lataa .md: Latomon ladoma tiedosto taustavälilehdeltä, joka sulkee itsensä', !!dl && dl.suggestedFilename() === 'kokeilukirjoitus.md' && dlMd === md &&
    taustaL === 'taustalla' && kiinni > 0 && ikkuna.isClosed(),
    (dl ? dl.suggestedFilename() + ' ' + dlMd.length + '/' + md.length : 'ei latausta') + ' | ' + taustaL + ' | ' + (kiinni ? 'kiinni ' + (kiinni - alkoi) + ' ms latauksen jälkeen' : 'jäi auki'));
  if (!latomoL.isClosed()) await latomoL.close();
  // 2c. Androidin Firefoxissa taustavälilehteä ei kokeiltu: Android-käyttäjäagentilla Latomo avautuu eteen ja jää auki kuten 0.8.0:ssa.
  ikkuna = await ctx.newPage(); ikkuna.on('pageerror', e => virheet.push('ikkuna: ' + e.message));
  await (await ctx.newCDPSession(ikkuna)).send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Android 12; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0' });
  await avaaIkkuna();
  const ua = await ikkuna.evaluate(() => navigator.userAgent);
  const latausA = new Promise(valmis => ctx.once('page', p => p.once('download', valmis)));
  const latomoA = await paina('#lataa', /latomo\.html$/);
  const dlA = await Promise.race([latausA, new Promise(r => setTimeout(() => r(null), 5000))]);
  await latomoA.waitForTimeout(3000);
  tulos('Lataa .md Androidilla: Latomo edessä ja auki', /Android/.test(ua) && !!dlA && dlA.suggestedFilename() === 'kokeilukirjoitus.md' && !latomoA.isClosed(),
    (dlA ? dlA.suggestedFilename() : 'ei latausta') + ' | ' + (latomoA.isClosed() ? 'sulkeutui' : 'auki'));
  if (!latomoA.isClosed()) await latomoA.close();

  // 3. Lisää lukimeen: Latomo painaa itse Avaa lukimessa, ja teksti on Luinin lukulistassa.
  await avaaIkkuna();
  const luin = await paina('#lukimeen', /luin\.html#id=/);
  const lista = await luin.evaluate(() => ({ lista: JSON.parse(localStorage.getItem('luin-lista') || '[]'), avain: Object.keys(localStorage).filter(k => k.startsWith('luin-teksti:')),
    tuonti: localStorage.getItem('luin-tuonti') }));
  const e = lista.lista[0] || {};
  tulos('Lisää lukimeen: lukulistassa', lista.lista.length === 1 && e.title === 'Kokeilukirjoitus' && e.author && lista.avain.length === 1 && lista.tuonti === null,
    JSON.stringify({ n: lista.lista.length, title: e.title, author: e.author, sivusto: e.sivusto, avain: lista.avain }));
  const luinTeksti = await luin.evaluate(() => document.body.innerText);
  tulos('Luin näyttää tekstin', /Kokeilukirjoitus/.test(luinTeksti) && /Väliotsikko/.test(luinTeksti));
  if (KUVAT) await luin.screenshot({ path: path.join(KUVAT, 'lisaosa-luin.png') });
  await luin.close();

  // 4. Valinta: rivi näkyy ja on valittuna; Latomoon menee vain valittu kappale otsikon alle.
  await artikkeli.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById('valittava'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await avaaIkkuna();
  const v = await ikkuna.evaluate(() => ({ nakyy: !document.querySelector('#valintarivi').hidden, valittu: document.querySelector('#valinta').checked, meta: document.querySelector('#meta').textContent }));
  tulos('valinta: rivi näkyy ja on valittuna', v.nakyy && v.valittu && /· 1[0-9] sanaa$/.test(v.meta), JSON.stringify(v));
  const latomo2 = await paina('#latomoon', /latomo\.html$/);
  const raaka2 = await latomo2.inputValue('#md');
  tulos('valinta: vain valittu kappale', /# Kokeilukirjoitus\n\nTämä yksi kappale maalataan valinnaksi/.test(raaka2) && !/leipätekstiä|Väliotsikko/.test(raaka2) && /^leikattu: /m.test(raaka2),
    raaka2.split('\n').slice(6).join(' | ').slice(0, 200));
  await latomo2.close();

  // 5. Pelkkä Latomo osoitteella #lisaosa ilman odottavaa leikettä: tekstikenttä tyhjä.
  const tyhja = await ctx.newPage();
  await tyhja.goto(PAIKALLINEN + 'luin/latomo.html#lisaosa');
  await tyhja.waitForTimeout(600);
  tulos('ei odottavaa leikettä: Latomo tyhjä', (await tyhja.inputValue('#md')) === '');
  await tyhja.close();

  // 6. Lyhyt sivu: Readability palauttaa senkin, ja sanamäärä taipuu. Tyhjä sivu: napit pois ja neuvo.
  await artikkeli.setContent('<html><body><p>Lyhyt.</p></body></html>');
  await avaaIkkuna();
  const lyhyt = await ikkuna.evaluate(() => ({ pois: document.querySelector('#lukimeen').disabled, meta: document.querySelector('#meta').textContent }));
  tulos('lyhyt sivu: 1 sana', !lyhyt.pois && / · 1 sana$/.test(lyhyt.meta), JSON.stringify(lyhyt));
  await artikkeli.setContent('<html><body></body></html>');
  await avaaIkkuna();
  const ei = await ikkuna.evaluate(() => ({ pois: document.querySelector('#lukimeen').disabled, tila: document.querySelector('#tila').textContent }));
  tulos('tyhjä sivu: napit pois ja neuvo', ei.pois && /Maalaa luettava kohta/.test(ei.tila), JSON.stringify(ei));

  // 7. SEP: johdanto, Readabilityn pudottama otsikko, bibliografia kappaleina, navigointiosiot pois, alaviitteet
  // haettuina; puuttuva alaviite 3 jää yläindeksiksi. Luinissa alaviitteet ja kirjallisuusluettelo.
  await artikkeli.goto(SEP);
  await avaaIkkuna(SEP);
  const sepMeta = await ikkuna.textContent('#meta');
  tulos('SEP: ikkuna kertoo haetut alaviitteet', / · 2 alaviitettä haettu$/.test(sepMeta), sepMeta);
  const latomo3 = await paina('#latomoon', /latomo\.html$/);
  const sr = await latomo3.inputValue('#md'), st = await latomo3.evaluate(() => window.__latomo.tulos());
  tulos('SEP: johdanto ja kaikki otsikot', /^# Koe\n\nJohdannon kappale/m.test(sr) && /^## 2\\\. Experience and Metaphysics$/m.test(sr) && /^### 2\.1 Alaluku$/m.test(sr),
    (sr.match(/^#+ .*$/gm) || []).join(' | '));
  tulos('SEP: bibliografia kappaleina, muut lähteet mukana, navigointi pois', /^## Bibliography\n\nDewey, John, 1925, \*Experience and Nature\*, Chicago: Open Court\.\n\nDykhuizen/m.test(sr) &&
    /^## Other Internet Resources$/m.test(sr) && !/Academic Tools|How to cite|Related Entries|sisällys|toc/i.test(sr.replace(/^---[\s\S]*?\n---\n/, '')), (sr.match(/## Bibliography[\s\S]{0,160}/) || ['ei bibliografiaa'])[0].replace(/\n/g, ' | '));
  tulos('SEP: alaviitteet haettu, paluulinkki pois, jatko sisennettynä', /Viittaus Deweyyn\.\[\^viite-1\] Toinen\.\[\^viite-2\]/.test(sr) &&
    /^\[\^viite-1\]: Ks\. Dykhuizen 1973: 30–31\.$/m.test(sr) && /^\[\^viite-2\]: Ensimmäinen kappale\.\n\n    Lainaus alaviitteessä\.\n\n    Jatko \[Jamesiin\]\(https:\/\/plato\.example\/entries\/james\/\)\.$/m.test(sr) && !/ref-1|ref-2/.test(sr),
    (sr.match(/^\[\^viite-[\s\S]*$/m) || ['ei määritelmiä'])[0].replace(/\n/g, ' | ').slice(0, 300));
  tulos('SEP: tekijänoikeus etukenttään ilman sähköpostia', /^oikeudet: Copyright © 2018 by Maija Meikäläinen$/m.test(sr) && /^oikeudet-lähde: https:\/\/plato\.example\/info\.html#terms$/m.test(sr),
    (sr.match(/^oikeudet.*$/gm) || []).join(' | '));
  tulos('SEP: puuttuva alaviite jää yläindeksiksi', /Kolmas\.\^\\\[\[3\]\(https:\/\/plato\.example\/entries\/koe\/notes\.html#note-3\)\\\]\^/.test(st.md) || /Kolmas\.\[\^viite-3\]/.test(st.md),
    (st.md.match(/Kolmas\..{0,80}/) || [''])[0]);
  await latomo3.close();
  await avaaIkkuna(SEP);
  const luin2 = await paina('#lukimeen', /luin\.html#id=/);
  const L2 = await luin2.evaluate(() => ({ huom: [...document.querySelectorAll('#teksti .sidenote')].map(x => x.textContent.replace(/\u00ad/g, '').trim()),
    bib: [...document.querySelectorAll('#teksti p.bib')].map(x => x.textContent.slice(0, 20)) }));
  tulos('SEP Luinissa: alaviitteiden tekstit ja kirjallisuusluettelo', L2.huom.length === 3 && /Dykhuizen 1973/.test(L2.huom[0]) && /^2Ensimmäinen kappale\.Lainaus alaviitteessä\.Jatko Jamesiin\.$/.test(L2.huom[1]) &&
    L2.bib.length === 2 && /^Dewey, John/.test(L2.bib[0]), JSON.stringify(L2).slice(0, 400));
  await luin2.close();

  // 8. Blogger: etusivu kokoelmana (otsikko blogin nimi, kirjoitukset lukuina päiväyksineen, katkaistu haettuna, Featured
  // Postin uusin mukana, Popular Posts pois), siivous; kirjoituksen sivu yksittäisenä leikkeenä etukenttineen.
  await artikkeli.goto(BLOGI);
  await avaaIkkuna(BLOGI);
  const latomo4 = await paina('#latomoon', /latomo\.html$/);
  const br = await latomo4.inputValue('#md');
  await latomo4.close();
  const brOts = (br.match(/^#+ .*$/gm) || []).join(' | ');
  tulos('Blogger etusivu: blogin nimi, kirjoitukset lukuina, uusin Featured Postista, tekijä', /^tekijä: Maija Bloggaaja$/m.test(br) && !/^sivusto:|^julkaistu:/m.test(br) &&
    brOts === '# Koeblogi | ## Uusin | ## Ensimmäinen | ### Lihavoitu väliotsikko | ## Toinen' && /^## Ensimmäinen\n\n\*3\.9\.2026\*\n\nBlogikirjoituksen virke/m.test(br) && /^## Toinen\n\n\*1\.9\.2026\*$/m.test(br), brOts);
  tulos('Blogger etusivu: katkaistu haettu, hakematon merkitty, sivupalkki pois', /Hypyn jälkeinen loppu\./.test(br) && !/Lue lisää|Suosittu/.test(br) &&
    /Uusimman katkelma\.\.\.\n\n\*Katkelma: koko kirjoitus ei latautunut\.\*/.test(br), (br.match(/## Uusin[\s\S]{0,120}/) || [''])[0].replace(/\n/g, ' | '));
  tulos('Blogger: sitovat välilyönnit, otsikkolainaus, kuvateksti', !/\u00a0/.test(br) && !/^ /m.test(br.replace(/^```[\s\S]*?```$/gm, '')) &&
    /^> "Lainaus, joka on kirjoitettu otsikkotyylillä[^\n]*\n> ?\n> Toinen lainauksen kappale\."$/m.test(br) && /^\*Kuvateksti taulukossa\*$/m.test(br) &&
    /^Kuvateksti välilyöntien perässä$/m.test(br) && !/\|/.test(br), (br.match(/> "Lainaus[\s\S]{0,40}|Kuvateksti.{0,40}/g) || []).join(' / '));
  await artikkeli.goto(BLOG_POSTI);
  await avaaIkkuna(BLOG_POSTI);
  const latomo5 = await paina('#latomoon', /latomo\.html$/);
  const bp = await latomo5.inputValue('#md');
  await latomo5.close();
  tulos('Blogger kirjoitus: otsikko, tekijä, blogin nimi, päivä paikallisena', /^tekijä: Maija Bloggaaja\nsivusto: Koeblogi\njulkaistu: 2026-09-01\nlähde: https:\/\/koeblogi\.blogspot\.com\/2026\/09\/toinen\.html$/m.test(bp) &&
    /^# Toinen\n\nBlogikirjoituksen virke/m.test(bp) && /Hypyn jälkeinen loppu\.\n$/.test(bp) && !/Tweet|twitter/.test(bp), bp.slice(0, 300).replace(/\n/g, ' | '));

  // 9. Ensyklopedia Logos (10.11.2026): etukenttä ja tekijärivi, otsikot, sisällysluettelo pois, viittaukset toiseen
  // artikkeliin alaviitteinä ja artikkeli kirjallisuusluettelon loppuun; Luinissa alaviitteen tekijä–vuosi linkittyy.
  await artikkeli.goto(LOGOS);
  await avaaIkkuna(LOGOS);
  const latomo6 = await paina('#latomoon', /latomo\.html$/);
  const lg = await latomo6.inputValue('#md');
  const lgL = await latomo6.evaluate(md => { const r = window.LuinMD.parse(md); const d = new DOMParser().parseFromString('<div>' + r.html + '</div>', 'text/html');
    return { lahde: [...d.querySelectorAll('.sidenote a.lahde')].map(a => a.textContent + '>' + a.getAttribute('href')), bib: d.querySelectorAll('p.bib').length,
      meta: [...d.querySelectorAll('header .meta')].map(x => x.innerHTML),
      oik: [...d.querySelectorAll('h2, h3, h4')].slice(-3).map(h => h.tagName + ' ' + h.textContent).join(' | '),
      oikP: d.querySelector('#tekijanoikeudet') && d.querySelector('#tekijanoikeudet').nextElementSibling ? d.querySelector('#tekijanoikeudet').nextElementSibling.className : 'ei' }; }, lg);
  await latomo6.close();
  tulos('Logos: etukenttä, tekijärivi ja otsikot, sisällys pois', /^tekijä: Maija Kirjoittaja\nsivusto: Ensyklopedia Logos\njulkaistu: 2018-05-05$/m.test(lg) &&
    /^# Koe, Artikkeli\n\nMaija Kirjoittaja {2}\nJulkaistu 5\.5\.2018\n\nJohdannon kappale/m.test(lg) && (lg.match(/^#+ .*$/gm) || []).join(' | ') === '# Koe, Artikkeli | ## Ensimmäinen luku | ### Pieni osio | ## Kirjallisuus | ### Ensyklopedia Logoksen artikkelit' &&
    !/Ensimmäinen%20luku|\]\(#|^___$/m.test(lg), (lg.match(/^#+ .*$/gm) || []).join(' | '));
  tulos('Logos: ks.-sulkeet alaviitteeksi, muu viittaus jää, linkki tekstiksi', /kehitykseen\.\[\^viite-logos1\] Seuraava virke viittaa kirjaan \(Kirjoittaja 2010, 3\)\./.test(lg) &&
    /mainitaan myös ”Toinen artikkeli”\[\^viite-logos2\] ilman/.test(lg) && /\(ks\. Kirjoittaja 2010; ”Toinen artikkeli”\[\^viite-logos3\]\)/.test(lg) &&
    /^\[\^viite-logos1\]: Ks\. Ensyklopedia Logoksen artikkeli ”Toinen artikkeli” \(Toinen 2015\)\.$/m.test(lg) && !/node\/22099/.test(lg), (lg.match(/.{0,40}viite-logos1\].{0,40}/) || [''])[0]);
  tulos('Logos: artikkeli kirjallisuusluettelon loppuun, osoite kirjoitettuna', /^### Ensyklopedia Logoksen artikkelit\n\nToinen, Kalle \(2015\)\. Toinen artikkeli\. \*Ensyklopedia Logos\*\. https:\/\/filosofia\.fi\/fi\/ensyklopedia\/toinen$/m.test(lg),
    (lg.match(/### Ensyklopedia[\s\S]{0,200}/) || [''])[0].replace(/\n/g, ' | '));
  tulos('Logos Luinissa: alaviitteen tekijä–vuosi linkittyy luettelon kohtaan, otsikkolohkossa tekijä', lgL.lahde.length === 3 && lgL.lahde.every(x => x === 'Toinen 2015>#kirj-toinen-2015') &&
    lgL.bib === 2 && lgL.meta.join('|') === 'Maija Kirjoittaja<br>Julkaistu 5.5.2018', JSON.stringify(lgL));
  // Tekijänoikeusmerkintä (10.11.2026): Logoksen ehto etukenttään, Luinissa kohtana kirjallisuusluettelon alla, ei p.bib.
  tulos('Logos: tekijänoikeus etukenttään ja Luinissa kohtana kirjallisuuden alla', /^oikeudet: Tekijänoikeus on alkuperäisellä tekijällä, joka on luovuttanut Filosofia\.fi-portaalille luvan kertajulkaisuun\. Muusta julkaisemisesta on sovittava tekijän kanssa\.$/m.test(lg) &&
    /^oikeudet-lähde: https:\/\/filosofia\.fi\/fi\/tekijanoikeudet-ja-filosofiafi$/m.test(lg) && lgL.oik === 'H2 Kirjallisuus | H3 Ensyklopedia Logoksen artikkelit | H4 Tekijänoikeudet' && lgL.oikP === '',
    lgL.oik + ' / ' + lgL.oikP);

  // 10. Wikipedia (10.11.2026): siistitty, viitteet ja lähde? alaviitteinä, käännöshuomautus alaviitteenä, wikilinkit
  // tekstinä ja olemassa olevat artikkelit loppuun, tyhjä Lähteet pois, Kirjallisuutta kappaleina, ei tekijää.
  await artikkeli.goto(WIKI);
  await avaaIkkuna(WIKI);
  const latomo7 = await paina('#latomoon', /latomo\.html$/);
  const wk = await latomo7.inputValue('#md');
  const wkL = await latomo7.evaluate(md => { const r = window.LuinMD.parse(md); const d = new DOMParser().parseFromString('<div>' + r.html + '</div>', 'text/html');
    return { sn: [...d.querySelectorAll('.sidenote')].map(x => x.textContent.replace(/­/g, '')), lahde: [...d.querySelectorAll('a.lahde')].map(a => a.getAttribute('href')), bib: d.querySelectorAll('p.bib').length,
      oik: d.querySelector('#tekijanoikeudet') ? d.querySelector('#tekijanoikeudet').tagName + ' ' + [...d.querySelectorAll('#tekijanoikeudet ~ p')].map(p => p.textContent.replace(/\u00ad/g, '')).join(' | ') : 'ei' }; }, wk);
  await latomo7.close();
  tulos('Wikipedia: etukenttä ilman tekijää, muokkauspäivä, sivusto Wikipedia', /^---\nsivusto: Wikipedia\njulkaistu: 2026-10-24\nlähde: https:\/\/fi\.wikipedia\.org\/wiki\/Koeartikkeli\n/.test(wk) && !/^tekijä:/m.test(wk),
    wk.split('\n').slice(0, 6).join(' | '));
  tulos('Wikipedia: muokkaa, ohjausrivit, tietolaatikko, kuva, navigointi pois', !/muokkaa|Pääartikkeli|Muita merkityksiä|Tietolaatikko|Kuvateksti|Navigointilaatikko|Käännös suomeksi/.test(wk) &&
    (wk.match(/^#+ .*$/gm) || []).join(' | ') === '# Koeartikkeli | ## Historia | ## Kirjallisuutta | ## Wikipedia-artikkelit', (wk.match(/^#+ .*$/gm) || []).join(' | '));
  tulos('Wikipedia: viitteet alaviitteinä (toistuva samalla tunnuksella), lähde? ja käännöshuomautus alaviitteinä', /tiedosto\.\[\^viite-w1\] Toinen virke viittaa samaan\.\[\^viite-w1\]/.test(wk) &&
    /litteitä\[\^viite-w3\] ja kiekot pyöreitä\.\[\^viite-w2\]\[\^viite-w4\]$/m.test(wk) && /^\[\^viite-w1\]: Meikäläinen, Matti: \*Kirja pallosta\*, s\. 12\. Otava, 2001\.$/m.test(wk) &&
    /^\[\^viite-w2\]: Kirjoittaja 2010, s\. 5\. \[Verkkolähde\]\(https:\/\/esimerkki\.test\/lahde\)$/m.test(wk) && /^\[\^viite-w3\]: \*lähde\?\* – mikä lähde\?$/m.test(wk) &&
    /^\[\^viite-w4\]: \*Wikipedian huomautus:\* Tämä artikkeli tai sen osa on käännetty muunkielisen Wikipedian artikkelista\. Alkuperäinen artikkeli: en:Test$/m.test(wk),
    (wk.match(/^\[\^viite[\s\S]*$/m) || [''])[0].replace(/\n/g, ' | ').slice(0, 400));
  // Käyttäjän valinta 10.11.2026: loppuun vain Pääartikkeli-ohjausrivin ja Katso myös -osion artikkelit, osio pois tekstistä.
  tulos('Wikipedia: wikilinkit tekstinä, loppuun vain Pääartikkeli ja Katso myös', /^\*\*Koeartikkeli\*\* on pallo ja punainen ja tiedosto\./m.test(wk) &&
    /^## Wikipedia-artikkelit\n\n- +\[Koehistoria\]\[\d+\]\n- +\[Pallo\]\[\d+\]\n*\n\[/m.test(wk) && /^\[\d+\]: https:\/\/fi\.wikipedia\.org\/wiki\/Pallo$/m.test(wk) &&
    !/Kiekko\]|Puuttuva|Punainen|Tiedosto:|Koe \(|Otava\]/.test(wk.split('## Wikipedia-artikkelit')[1] || 'x') && !/Katso myös/.test(wk),
    (wk.match(/## Wikipedia-artikkelit[\s\S]{0,200}/) || [''])[0].replace(/\n/g, ' | '));
  tulos('Wikipedia: lisenssi etukenttään (versionumero ei katkaise) ja Luinissa selityksineen', /^oikeudet: Teksti on saatavilla Creative Commons Nimeä-JaaSamoin 4\.0 -lisenssillä; lisäehtoja voi sisältyä\.$/m.test(wk) &&
    /^H4 Merkintä lähteessä: Teksti on saatavilla .* \| Tätä saa jakaa ja muokata, myös kaupallisesti, .* \| Lisätietoja: Creative Commons -lisenssin CC BY-SA 4\.0 \(Attribution-ShareAlike\) tiivistelmä suomeksi osoitteessa https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/deed\.fi$/.test(wkL.oik), wkL.oik);
  tulos('Wikipedia Luinissa: Kirjallisuutta kirjallisuusluettelona, alaviitteen tekijä–vuosi linkittyy', wkL.bib === 1 && wkL.lahde.join() === '#kirj-kirjoittaja-2010' && wkL.sn.length === 5,
    JSON.stringify(wkL).slice(0, 400));
  // 11.–13. marxists.org, Wait But Why ja OECS (11.11.2026): leike Latomoon ja Luinin jäsennys.
  const leikeLuin = async url => {
    await artikkeli.goto(url);
    await avaaIkkuna(url);
    const l = await paina('#latomoon', /latomo\.html$/);
    const md = await l.inputValue('#md');
    const luin = await l.evaluate(md => { const r = window.LuinMD.parse(md); const d = new DOMParser().parseFromString('<div>' + r.html + '</div>', 'text/html');
      return { sn: [...d.querySelectorAll('.sidenote')].map(x => x.textContent.replace(/\u00ad/g, '')), lahde: [...d.querySelectorAll('a.lahde')].map(a => a.textContent.replace(/\u00ad/g, '') + '>' + a.getAttribute('href')),
        bib: d.querySelectorAll('p.bib').length, lainaus: d.querySelectorAll('blockquote').length, taulukko: d.querySelectorAll('table').length,
        meta: [...d.querySelectorAll('header .meta, header .sub')].map(x => x.textContent.replace(/\u00ad/g, '')).join(' | '), varoitukset: r.warnings.map(w => w.msg) }; }, md);
    await l.close();
    return { md, luin, ots: (md.match(/^#+ .*$/gm) || []).join(' | ') };
  };
  const mia = await leikeLuin(MIA);
  tulos('marxists.org: etukenttä nimiöstä (tekijä, teos, kirjoitusvuosi) ja Copyleft CC BY-SA 2.0', /^---\ntekijä: Maija Kirjoittaja\nteos: The Test Work\nsivusto: Marxists Internet Archive\njulkaistu: 1917\nlähde: https:\/\/www\.marxists\.org\/archive\/koe\/works\/1917\/teos\/ch01\.htm\noikeudet: Copyleft: Marxists Internet Archive \(marxists\.org\) 2000\. Permission is granted under the terms of the Creative Commons ShareAlike License\.\noikeudet-lähde: https:\/\/creativecommons\.org\/licenses\/by-sa\/2\.0\/\n/.test(mia.md),
    mia.md.split('\n').slice(0, 9).join(' | '));
  tulos('marxists.org: luvun nimi otsikoksi, osiot, tietolohko loppuun, navigointi ja sisällys pois', mia.ots === '# Chapter I: Class Society | ## 1\\. The First Section | ## 2\\. The Second Section | ## Marxists Internet Archive' &&
    !/Next|Chapter Two|Index|Last updated|The Test Work\n|\(#s1\)/.test(mia.md.split('---').slice(2).join('---')) && /^## Marxists Internet Archive\n\nWritten: August 1917; {2}\nSource: Collected Works, Volume 1\. {2}\nCopyleft:/m.test(mia.md), mia.ots);
  const miaOsat = [/^> “An indented quotation\.”\n> ?\n> Second paragraph of the quotation\.$/m, /number 3 has enough[^\n]*\n\n___\n\nBody paragraph number 4/,
    /A mark\[\^viite-mia1\] is here\./, /The other page\[\^viite-2\] too\./, /^\[\^viite-mia1\]: First note text\.\n\n {4}Continuation of the first note\.$/m,
    /^\[\^viite-2\]: Second note on the other page\.$/m].map(re => re.test(mia.md));
  tulos('marxists.org: lainaus, tähtirivi osanvaihdoksi, viitteet samalta ja toiselta sivulta', miaOsat.every(Boolean) && !/^Notes$|number 4[^\n]* {2}$/m.test(mia.md),
    miaOsat.join() + ' | ' + mia.md.split('---').slice(2).join('---').slice(0, 900).replace(/\n/g, ' | '));
  tulos('marxists.org Luinissa: kaksi alaviitettä, lainaus, otsikkolohkossa tekijä ja teos, ei varoituksia', mia.luin.sn.length === 2 && mia.luin.lainaus === 1 &&
    /Maija Kirjoittaja/.test(mia.luin.meta) && /The Test Work, 1917/.test(mia.luin.meta) && !mia.luin.varoitukset.length, JSON.stringify(mia.luin).slice(0, 400));
  const wbw = await leikeLuin(WBW);
  tulos('Wait But Why: etukenttä (schema.org), mainokset, kuvarivi, Related ja tilauskehotus pois', /^---\ntekijä: Tim Testi\nsivusto: Wait But Why\njulkaistu: 2026-01-15\n/.test(wbw.md) &&
    !/PDF|Image:|open these|Related|Other Post|email list|Patreon|Tweet|↩/.test(wbw.md) && /^Opening paragraph with notes\.\[\^viite-wbw1\]\[\^viite-wbw2\]$/m.test(wbw.md),
    wbw.md.slice(0, 400).replace(/\n/g, ' | '));
  tulos('Wait But Why: väliotsikot koon mukaan, Sources kappaleiksi, viivat osanvaihdoksi vain tekstin keskellä', wbw.ots === '# Koe Post | ### A Big Section | ## Part 2: Larger | ## Sources' &&
    /Paragraph 3[^\n]*\n\n___\n\n<p>|Paragraph 3[^\n]*\n\n___\n\nParagraph 4/.test(wbw.md) && /^## Sources\n\nSource One: \[First Title\]\[\d+\]\n\nSource Two: \[Second Title\]\[\d+\]$/m.test(wbw.md) && (wbw.md.match(/^___$/gm) || []).length === 1,
    wbw.ots);
  tulos('Wait But Why: sininen ja harmaa viite alaviitteinä ilman paluulinkkiä', /^\[\^viite-wbw1\]: Blue note text\.$/m.test(wbw.md) && /^\[\^viite-wbw2\]: Gray source, \[\*Book\*\]\(https:\/\/example\.test\/kirja\), 12\.$/m.test(wbw.md) &&
    wbw.luin.sn.length === 2 && wbw.luin.bib === 2, JSON.stringify(wbw.luin).slice(0, 300));
  const oe = await leikeLuin(OECS);
  tulos('OECS: etukenttä citation-metatiedoista (tekijät, päivä, DOI) ja lisenssi', /^---\ntekijä: Ada Aaltonen & Bo Berg\nsivusto: Open Encyclopedia of Cognitive Science\njulkaistu: 2024-07-24\ndoi: 10\.21428\/e2759450\.koe\nlähde: https:\/\/oecs\.mit\.edu\/pub\/koe123\noikeudet: Creative Commons Attribution-NonCommercial 4\.0 International License\noikeudet-lähde: https:\/\/creativecommons\.org\/licenses\/by-nc\/4\.0\/\n/.test(oe.md),
    oe.md.split('\n').slice(0, 9).join(' | '));
  tulos('OECS: otsikot, viittaukset tekstinä ilman APA-pilkkua, kaavat, kuvateksti, taulukko, ei tekijä- eikä sisällysosiota', oe.ots === '# Koe Entry | ## History | ### Sub section | ## Further reading | ## References' &&
    /\(Mitchell 2009\)\./.test(oe.md) && /As Turing \(1937\) showed, the noise \*σ\* and `x\^2 \+ 1` matter\. See Figure 1\./.test(oe.md) && /^\*Figure 1\. A caption of the figure\.\*$/m.test(oe.md) &&
    /^\*Table 1\*\n\n\| A \| B \|\n\| --- \| --- \|\n\| 1 \| 2 \|$/m.test(oe.md) && !/Authors|Contents|↩|Ada Aaltonen ·/.test(oe.md.split('---').slice(2).join('---')),
    oe.ots + ' / ' + (oe.md.match(/As Turing[^\n]*/) || [''])[0]);
  tulos('OECS Luinissa: kirjallisuus kappaleina, tekijä–vuosi linkittyy luetteloon (myös kertova)', oe.luin.bib === 3 && oe.luin.taulukko === 1 &&
    oe.luin.lahde.join() === 'Mitchell 2009>#kirj-mitchell-2009,1937>#kirj-turing-1937' && !oe.luin.varoitukset.length, JSON.stringify(oe.luin).slice(0, 400));
  // 14. Encyclopedia.com (13.11.2026): ylhäältä ensimmäinen artikkeli, valinnasta toinen; artikkelin oma osoite ja hakuteos.
  await artikkeli.goto(ENC);
  await avaaIkkuna(ENC);
  const encIk = await ikkuna.evaluate(() => ({ otsikko: document.querySelector('#otsikko').textContent, meta: document.querySelector('#meta').textContent }));
  tulos('Encyclopedia.com: ikkunassa hakuteos ja artikkelin järjestysnumero', encIk.otsikko === 'Koe, Aihe' &&
    /^Encyclopedia\.com · International Encyclopedia of the Social Sciences \(1\/2\) · \d+ sanaa$/.test(encIk.meta), JSON.stringify(encIk));
  const en = await leikeLuin(ENC);
  tulos('Encyclopedia.com: etukenttä (allekirjoitus tekijäksi, teos, oma osoite, ei päiväystä)', /^---\ntekijä: Jolanda Testi\nteos: International Encyclopedia of the Social Sciences\nsivusto: Encyclopedia\.com\nlähde: https:\/\/www\.encyclopedia\.com\/social-sciences\/koe\/koe-aihe\nleikattu: /.test(en.md),
    en.md.split('\n').slice(0, 7).join(' | '));
  tulos('Encyclopedia.com: oma sisällys ja otsikon toisto pois, sisäiset linkit tekstiksi, ulkoinen jää, toinen artikkeli ei mukana', en.ots === '# Koe, Aihe | ## Early career | ## Later work | ## BIBLIOGRAPHY' &&
    /studied at Burghölzli and read a place and \[an outside site\]\[\d+\]\./.test(en.md) && /and another person, enough/.test(en.md) && !/\(#A\)|\[Early career\]|second article|updated|Cite this/.test(en.md),
    en.ots + ' / ' + (en.md.match(/He studied[^\n]*/) || [''])[0]);
  tulos('Encyclopedia.com Luinissa: kirjallisuus kappaleena, ei varoituksia', en.luin.bib === 1 && !en.luin.varoitukset.length, JSON.stringify(en.luin).slice(0, 300));
  await artikkeli.goto(ENC);
  await artikkeli.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById('toinen-alku'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await avaaIkkuna(ENC);
  await ikkuna.uncheck('#valinta');
  const encL2 = await paina('#latomoon', /latomo\.html$/);
  const en2 = await encL2.inputValue('#md');
  const en2Lisa = await encL2.evaluate(md => window.LuinMD.lisatieto(window.LuinMD.etukentta(md).meta), en2);
  await encL2.close();
  tulos('Encyclopedia.com: valinta toisessa artikkelissa leikkaa sen (katkennut byline → allekirjoitus, otsikon toisto pois)', /^---\ntekijä: Ada I\. KoÉsan\nteos: International Dictionary of Psychoanalysis\nsivusto: Encyclopedia\.com\nlähde: https:\/\/www\.encyclopedia\.com\/psychology\/koe\/koe-aihe-1875-1961\n/.test(en2) &&
    /^# Koe, Aihe \(1875-1961\)\n\nThe second article/m.test(en2) && !/first article|KOE, AIHE/.test(en2) && en2Lisa === 'International Dictionary of Psychoanalysis', en2.split('\n').slice(0, 9).join(' | ') + ' / lisätieto ' + en2Lisa);
  await artikkeli.evaluate(() => getSelection().removeAllRanges());
  // 15. IPA:n IRED (13.11.2026): hakusana sen keskeltä, kirjan viimeinen sivu ja kansi.
  await artikkeli.goto(IRED_KIRJA + '4/');
  await avaaIkkuna(IRED_KIRJA + '4/');
  const irIk = await ikkuna.evaluate(() => ({ otsikko: document.querySelector('#otsikko').textContent, meta: document.querySelector('#meta').textContent }));
  tulos('IRED: ikkunassa hakusana ja sivumäärä', irIk.otsikko === 'Alpha: The First' && /^IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis \(2 sivua\) · \d+ sanaa$/.test(irIk.meta), JSON.stringify(irIk));
  const ir = await leikeLuin(IRED_KIRJA + '4/');
  tulos('IRED: etukenttä (IPA tekijänä, uusin painos, hakusanan ensimmäinen sivu, lisenssi)', /^---\ntekijä: International Psychoanalytical Association\nsivusto: IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis\njulkaistu: 2022\nlähde: https:\/\/online\.flippingbook\.com\/view\/999\/3\/\noikeudet: The IPA Inter-Regional Encyclopedic Dictionary of Psychoanalysis is licensed under Creative Commons Licence CC-BY-NC-ND\. Core rights remain with the authors\.\noikeudet-lähde: https:\/\/www\.ipa\.world\/IPA\/Encyclopedic_Dictionary\n/.test(ir.md),
    ir.md.split('\n').slice(0, 8).join(' | '));
  const irOsat = [/^\*Tri-Regional Entry First Edition 2017: .* Second Edition 2022: Bo Koe\*$/m, /ends with the counter-transference of the analyst, as the 1st edition said\.$/m,
    /^The subsection text follows here\.$/m, /^See also: Beta; Gamma; Delta$/m, /^Akhtar, S\. \(2009\)\. Comprehensive Dictionary\. London: Karnac\.\n\nBion W\.R\. \(1959\)\. Attacks on linking\. Int\. J\. 40:308-15\n\nBion, W\. R\. \(1962a\) Learning from Experience\. London: Tavistock\.$/m].map(re => re.test(ir.md));
  tulos('IRED: otsikot versaaleista, sivunvaihto ja tavuviiva yhteen, See also, kirjallisuus kohdiksi, ei seuraavaa hakusanaa eikä sivun jäänteitä',
    ir.ots === '# Alpha: The First | ## I. Definition | ### VII. A. Subsection Title | ## References' && irOsat.every(Boolean) && !/Beta text|Back to Table|FlippingBook|^\d$|click here/m.test(ir.md),
    ir.ots + ' / ' + irOsat.join());
  tulos('IRED Luinissa: kolme kirjallisuuden kohtaa, ei varoituksia', ir.luin.bib === 3 && !ir.luin.varoitukset.length, JSON.stringify(ir.luin).slice(0, 300));
  const irL = await leikeLuin(IRED_KIRJA + '9/');
  tulos('IRED: viimeinen hakusana päättyy kirjan viimeiseen sivuun (ei kansisivua perään)', /^# Epsilon$/m.test(irL.md) && /Epsilon begins on the second last page\.\n\nEpsilon continues on the last page/.test(irL.md) && !/CONTENTS|ALPHA/.test(irL.md.split('---').slice(2).join('---')),
    irL.md.split('---').slice(2).join('---').slice(0, 300).replace(/\n/g, ' | '));
  await artikkeli.goto(IRED_KIRJA + '1/');
  await avaaIkkuna(IRED_KIRJA + '1/');
  const irK = await ikkuna.evaluate(() => ({ tila: document.querySelector('#tila').textContent, pois: document.querySelector('#lukimeen').disabled }));
  tulos('IRED: kansisivulta ei leikata mitään', irK.pois && /ei löytynyt artikkelia/.test(irK.tila), JSON.stringify(irK));
  // 16. St Andrews Encyclopaedia of Theology (14.11.2026): tiivistelmä johdannoksi, luvut, viittaukset, Attributions, bibliografia.
  const sa = await leikeLuin(SAET);
  tulos('SAET: etukenttä citation-metatiedoista (kaksi tekijää, päivä) ja Copyright-rivi lisenssilinkkeineen', /^---\ntekijä: Ada Aaltonen & Bo Berg\nsivusto: St Andrews Encyclopaedia of Theology\njulkaistu: 2024-03-28\nlähde: https:\/\/www\.saet\.ac\.uk\/Buddhism\/Koe\noikeudet: Copyright Ada Aaltonen \(CC BY-NC\)\noikeudet-lähde: https:\/\/creativecommons\.org\/licenses\/by-nc\/3\.0\n/.test(sa.md),
    sa.md.split('\n').slice(0, 9).join(' | '));
  tulos('SAET: otsikot numeroineen, tiivistelmä johdantona, ei sisällystä, sitaattiruutua, avainsanoja eikä tekijäriviä', sa.ots === '# Koe (1200–1253) | ## 1\\. Life | ## 2\\. Thought | ### 2.1 Time | #### 2.1.1 Being-time | ## Attributions | ## Bibliography | ### Further reading | ### Works cited' &&
    /^# Koe \(1200–1253\)\n\nThe abstract opens/m.test(sa.md) && !/Table of contents|Contents|Cite|Save|MHRA|Zen\]|Ada Aaltonen and Bo Berg|ORCID|ISSN|About/.test(sa.md.split('---').slice(2).join('---')),
    sa.ots);
  tulos('SAET: tekstiviittaukset tekstinä, ristiviittaus linkkinä, lainaus, kursiivit, Attributions-kappale', /He trained for years \(Bodiford 1993: 224\), as discussed below \(\[section 2\.1\]\[\d+\]\)\./.test(sa.md) &&
    /^> A quoted passage from the master\.$/m.test(sa.md) && /Being-time in the \*Shōbōgenzō\*\./.test(sa.md) && /^## Attributions\n\nTexts are quoted according to the Taishō edition\.$/m.test(sa.md) &&
    /^Bodiford, William M\. 1993\. \*Sōtō Zen in Medieval Japan\*\. University of Hawaii Press\.$/m.test(sa.md), (sa.md.match(/He trained[^\n]*/) || [''])[0]);
  tulos('SAET Luinissa: kolme kirjallisuuden kohtaa, tekijä–vuosi linkittyy luetteloon, lainaus, ei varoituksia', sa.luin.bib === 3 && sa.luin.lainaus === 1 &&
    sa.luin.lahde.join() === 'Bodiford 1993>#kirj-bodiford-1993,Raud 2012>#kirj-raud-2012' && !sa.luin.varoitukset.length, JSON.stringify(sa.luin).slice(0, 400));
  await artikkeli.goto(BLOG_POSTI);

  // Postihuilu (9.11.2026, kolme nappia 10.11.2026): laatikkolauseen sääntö ikkunassa; ilman Lisää tämän selaimen
  // lukulistaan heti -valintaa Latomo jää auki eikä lause jää Luinin muistiin; valinnan kanssa teksti avautuu myös
  // Luinissa. Lause ja valinnat muistetaan. Lisää lukimeen ei lähetä postia.
  const KOODI = 'torikaffeillaonhemmetinmukavaa';
  await avaaIkkuna(BLOG_POSTI);
  const pk0 = await ikkuna.evaluate(() => ({ napit: [...document.querySelectorAll('.napit > button')].map(b => b.textContent),
    kiinni: document.querySelector('#posti-osa').hidden }));
  tulos('ikkuna: neljä nappia, Postihuilu kiinni', pk0.napit.join() === 'Lisää lukimeen,Säädä Latomossa,Lataa .md,Postihuilu' && pk0.kiinni, JSON.stringify(pk0));
  await ikkuna.click('#postihuilu');
  const pk1 = await ikkuna.evaluate(() => ({ auki: !document.querySelector('#posti-osa').hidden, paikka: document.querySelector('#koodi').placeholder,
    soita: document.querySelector('#soita').textContent, heti: document.querySelector('#heti').checked,
    hetiTeksti: document.querySelector('label.heti').textContent.trim(), ruutu: document.activeElement.id }));
  tulos('Postihuilu: kenttä, Soita huilua!, heti valittuna', pk1.auki && pk1.paikka === 'Laatikkolause' && pk1.soita === 'Soita huilua!' && pk1.heti &&
    pk1.hetiTeksti === 'Lisää tämän selaimen hyllylle heti' && pk1.ruutu === 'koodi', JSON.stringify(pk1));
  const virhe = async lause => { await ikkuna.fill('#koodi', lause); return ikkuna.evaluate(() => ({ v: document.querySelector('#koodi-virhe').textContent, pois: document.querySelector('#soita').disabled })); };
  const v1 = await virhe('liianlyhyt'), v2 = await virhe('Torikaffeilla on hemmetin mukavaa.'), v3 = await virhe('TorikaffeillaOnHemmetinMukavaa');
  tulos('Postihuilu: lyhyt ja välilyönnit estävät, isot kirjaimet kelpaavat', v1.pois && /vähintään 24 merkkiä \(nyt 10\)/.test(v1.v) &&
    v2.pois && /Ei kelpaa: välilyönti, ”\.”\.$/.test(v2.v) && !v3.pois && v3.v === '', JSON.stringify([v1, v2, v3]));
  await ikkuna.click('#kysy');
  const pk2 = await ikkuna.evaluate(() => ({ auki: !document.querySelector('#ohje').hidden, t: document.querySelector('#ohje').textContent }));
  tulos('Postihuilu: i-ohje johdantoineen, ilman soiton kestoa', pk2.auki && /^\s*Lähetä teksti esimerkiksi tietokoneelta kännykälle/.test(pk2.t) &&
    /LUiN\.HTML:ssä\./.test(pk2.t) && /merkkihaarukka on 24–52/.test(pk2.t) && /virhelyöntien huomaamista\.\s*$/.test(pk2.t) && !/todellistumatta/.test(pk2.t), pk2.t.slice(0, 80));
  if (KUVAT) { await ikkuna.setViewportSize({ width: 360, height: 900 }); await ikkuna.screenshot({ path: path.join(KUVAT, 'lisaosa-posti.png') }); }
  await ikkuna.click('#kysy');
  await ikkuna.uncheck('#heti');
  const lat6 = await paina('#soita', /latomo\.html$/);
  await lat6.waitForFunction(() => /^Ladottu postitettavaksi/.test(document.querySelector('#kk-tila').textContent) || !document.querySelector('#kk-virhe').hidden, null, { timeout: 8000 });
  await lat6.waitForTimeout(500);
  const pk3 = await lat6.evaluate(() => ({ url: location.href, tila: document.querySelector('#kk-tila').textContent || document.querySelector('#kk-virhe').textContent,
    muisti: localStorage.getItem('luin-laatikko'), lista: JSON.parse(localStorage.getItem('luin-lista') || '[]').map(e => e.id) }));
  pk3.kv = KV.has('luin:' + KOODI + ':toinen');
  tulos('ilman heti-valintaa: laatikossa, Latomo jää auki, ei lukulistaan eikä lausetta muistiin', pk3.kv && /latomo\.html$/.test(pk3.url) &&
    /^Ladottu postitettavaksi/.test(pk3.tila) && pk3.muisti === null && !pk3.lista.includes('p-toinen'), JSON.stringify(pk3));
  await lat6.close();
  KV.clear();
  await avaaIkkuna(BLOG_POSTI);
  const pk4 = await ikkuna.evaluate(() => ({ auki: !document.querySelector('#posti-osa').hidden, k: document.querySelector('#koodi').value, heti: document.querySelector('#heti').checked }));
  tulos('Postihuilu: auki, lause pienillä ja valinta muistissa', pk4.auki && pk4.k === KOODI && !pk4.heti, JSON.stringify(pk4));
  await ikkuna.check('#heti');
  const luin3 = await paina('#soita', /luin\.html#id=/);
  const muisti3 = await luin3.evaluate(() => localStorage.getItem('luin-laatikko'));
  tulos('heti-valinnalla: laatikossa ja Luinissa', KV.has('luin:' + KOODI + ':toinen') && /#id=p-toinen$/.test(luin3.url()) && muisti3 === JSON.stringify(KOODI), luin3.url() + ' ' + muisti3);
  await luin3.close();
  KV.clear();
  await avaaIkkuna(BLOG_POSTI);
  const luin4 = await paina('#lukimeen', /luin\.html#id=/);
  tulos('Lisää lukimeen ei soita huilua, vaikka Postihuilu on auki', KV.size === 0 && /#id=p-toinen$/.test(luin4.url()), luin4.url() + ' KV ' + KV.size);
  await luin4.close();

  tulos('ei sivuvirheitä', virheet.length === 0, virheet.join(' / '));
  await ctx.close();
  fs.rmSync(lisaosa, { recursive: true, force: true }); fs.rmSync(profiili, { recursive: true, force: true });
  console.log(virheita ? virheita + ' vikaa' : 'Kaikki kunnossa.');
  process.exit(virheita ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
