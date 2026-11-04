---
paths:
  - "luin.html"
  - "luin/**"
  - "docs/viitteet/**"
---
## Luin (lukulaite)

`luin.html` (juuressa, koska ohjelman nimi on luin.html) on lukulista ja lukija samalla sivulla.
`luin/md.js` on yhteinen Markdown-jäsennin ja suomen tavutus, `luin/latomo.html` generaattori
(*Latomo*: tarkistaa md:n, täydentää lähdetiedot etukenttään, avaa Luinissa tällä laitteella
avaimen `luin-tuonti` kautta tai antaa .md:n ladattavaksi; Latomon ohje `luin/latomo-ohje.html`, ks. alla). Kehittäjän opas on `luin/ohje.md`; se avautuu
Luinissa osoitteesta `luin.html#u=luin/ohje.md`, mutta lukulistassa siihen ei ole linkkiä (käyttäjän päätös
22.10.2026: pois julkisivusta, ei piiloteta repossa). Lukijan käyttöohje on `luin/kayttoohje.html` (käyttäjän pyyntö
22.10.2026: yksinkertainen, olennaisin ensin; vienti ja muu harvemmin tarvittava lopussa supistettuina osioina).
Se on lukulaitteen ohje, **ei Latomon**; Latomolla on oma ohjeensa (käyttäjän pyyntö 22.10.2026). Lukulistan alla ovat järjestyksessä
*Käyttöohje*, *Kokeiluteksti: Kant ja eläinetiikka* ja pienen välin (12 px) jälkeen *Uusi teksti* **Latomossa** (versaali 27.10.2026 poistettu samana päivänä, käyttäjän päätös). Kun lukijan
käyttäjälle näkyvä toiminta muuttuu, tarkista käyttöohje. Kaikki on selaimen localStoragessa
(`luin-asetukset`, `luin-lista`, `luin-teksti:<id>`, `luin-merkit:<id>`); palvelinta ei ole.
Käyttäjän vaatimukset 20.10.2026:
- **Ei kaveriversiota** eikä sen mainostusta. Käyttöönotto (KV/worker, repo, Dropbox) on myöhempi kysymys.
- **Jakaminen on ERITTÄIN sivuosassa**: vain lukulistan nimikkeen oikean laidan pieni jakonappi, jonka
  ponnahdusvalikosta kopioidaan lähdeviite (ja verkkotekstin linkki) ja poistetaan nimike listasta.
  Viite on tekstin oma (etukentän `viite` tai Latomon kentistä Teologian tyylin 2021 mukaan koottu, md.js
  `kokoaViite`). **Lukutietoja ei lisätä pakolla** (käyttäjän päätös 22.10.2026): viitteen alla on matala kytkin
  *lisää: luettu HTML-versiona*, joka lisää perään `Luettu HTML-versiona osoitteessa <Luin-linkki> (D.M.VVVV).`
  (`aset.viiteLisa`, oletus pois). Ennen lisäys `HTML-versio: … (luettu …)` oli aina mukana.
- **Viitenumerot näkyvät aina**; niitä ei saa asetuksista pois.
- **Värit eivät ole soittimen**: ruskea, okra, ruoste, paperi ja muste, kuusi väriä teemaa kohti, ei
  varjoja eikä läpikuultavuutta (e-ink). Käyttäjän päätös 21.10.2026 (kokeilu): ruoste siirrettiin oranssista ruskeampaan
  (vaalea `#a4541a` → `#8c5426`, tumma `#e0954f` → `#b8794a`; LCh-sävy 58° → 62°, kroma 54 → 41) ja tumman
  teeman paperi tummennettiin (`#18130e` → `#120e0b`), jotta himmeämpi ruoste erottuu (kontrasti 5,66 / 5,37).
  **Latomon `--harmaa` poikkeaa muista Luinin sivuista** (käyttäjän päätös 27.10.2026, koeversio V3 kolmesta: V1 eli
  pienet tekstit musteella oli paikoin selkeämpi mutta kokonaisuutena huonompi): vaalea `#67553f` → `#4f3e28`, tumma
  `#b09b7e` → `#cdb79a`, sama sävy ja kroma (OKLCH), APCA Lc 79 → 88 ja 50 → 65. Syy: Latomon tekstipinnasta noin 40 %
  on pientä (11,5–15 px) `--harmaa`-tekstiä, joka näytti "ruskealta ruskealla", pahiten tummassa teemassa (WCAG 7,17
  antoi väärän kuvan). luin.html, käyttöohje ja Latomon ohje pitävät vanhat arvot; älä yhtenäistä niitä ilman käyttäjää. Aikajanan merkinnät erotetaan muodolla nuottien tapaan (suurempi aika-arvo ontompi;
  käyttäjän päätös 21.10.2026): pääluku iso ontto salmiakki, alaluku pienempi täytetty, alaluvun alaluku
  lähes pistemäinen täytetty. Käyttäjän päätös 21.10.2026 (myöhemmin): etappimerkit pienemmiksi, pääluku 0,8- ja alaluvut
  0,7-kertaisiksi (`JANA.koko`; kirjanmerkin nauha ennallaan); sitten alaluvut hiukan suuremmiksi (1,15- ja 1,35-kertaisiksi:
  alaluvun alaluvut sulautuivat viivaan), ja nykyisen kohdan oikealla puolella olevien pienempi kokoluokka (0,75) poistettiin
  turhana kokojen kirjona: tulevat ovat samankokoisia, vain harmaita. Käyttäjän pyyntö 29.10.2026: pääluku ensin niin isoksi, että
  yläkärki hipoi nykyisen kohdan kolmion kärkeä (puolikorkeus 11,455), mutta "aivan överin iso", joten samana päivänä väliltä: 8,4
  (entinen 5,92). Kirjanmerkkien nauha ei peitä kehää: yläreuna hipoo pääluvun alakärjen musteen huippua (`JANA.km` = y + 8,4 + 1,545,
  kehän jiiri kärjessä 1,545; mitattu 32,0 vs. 31,875 px). Hajurakoja ei käyttäjän pyynnöstä vähennetty.
  **Kirjanmerkit aikajanalla** (käyttäjän pyyntö 30.10.2026): kirjanmerkki, jonka nauhan vasen reuna (x − 3,1) tulisi ennen edellisen näkyvän
  nauhan keskilinjaa (loven laaksonpohja), jää pois (`piirraJana()`, `JANA.kmLeveys`). Ketjussa verrataan aina viimeksi näkyviin jääneeseen, ei
  pois jätettyyn. Mitattu Chromiumissa: välit 0/2 → 1 nauha, 0/3,1 → 2 (tasan keskilinjalla näkyy), ketju 0–8 px kahden välein → 0, 4, 8.
  Merkkien peitto (käyttäjän pyynnöt 29.10.2026 aikajärjestyksessä 08.43, 08.46, 08.47, 08.55; "tuttifrutti"): **pääluvuista**
  näytetään kahdesta törmäävästä vain ensimmäinen, paitsi jos jälkimmäinen on selvästi korkeammalla hierarkiassa
  (`luvunPaino()`: otsikkotaso, varsinainen luku ennen oheisaineistoa, numeroitu ennen numeroimatonta, alaluvullinen ennen
  alaluvutonta; myöhempi voittaa vain, jos se on painavampi kuin kaikki, joiden kanssa se törmää; `karsiPaallekkaiset()`).
  **Törmäys ei ole pelkkä lomittuminen** (tarkennus 08.47): kärkien pitää mennä toistensa kehän sisäalaan, pääluvuilla väli
  < 2 × 6,36 eli polkujen kärjet ristissä (#451:ssä ensin musteet koskettivat, < 2 × 7,01). **Alaluvut näkyvän pääluvun
  kohdalla**: jälkeinen alaluku (2.1 luvun 2 kohdalla) jää pois, jos se tunkee pääluvun musteen päälle; edeltävä (1.3 luvun 2
  edellä) saa näkyä, jos sen oikea kärki ei ulotu pääluvun kehän sisäalaan (kehän alle saa, pääluku on päällä) eikä se ulotu
  janan alun ohi pääluvun päällä. Tämä korvasi #450:n poikkeuksen *ensimmäisen pääluvun alaluku* (vertailu `paat[0]`), joka
  kantin tutkielmassa koski lukua 2 (Johdanto on piilossa) ja päästi myös luvun 2.1 läpi. Piilotettu pääluku ei estä
  alalukuja. **Alaluvut keskenään** (08.55): sama sääntö kuin pääluvuilla. Alaluvulla ei ole kehää, joten täytetyn alan
  reunimmainen osa on kuvitteellinen kehä kokonaan polun sisällä, paksuus pääluvun suhteessa 1,3 × rx / 6,36 (kiinteällä 1,3:lla
  alaluvun alaluvulla, rx 1,61, ei olisi sisäalaa). #453 laski törmäyksen kärkien kosketuksesta tietämättä 08.47:n tarkennuksesta;
  käyttäjän ajattelujärjestyksessä pääluvun sääntö sisälsi jo sen. Kärjet ja sisäalan kärjet: `janaKarjet()`; jiiri
  (k / 2) / sin α, α = sivukärjen puolikulma 39,0–39,6° (pääluvulla 1,033). Kynnykset mitattu pikseleistä (DPR 16 ja 32):
  0,1 px ennen rajaa 0 laitepikseliä sisäalassa tai musteen päällä, 0,1 px yli 2–12. Mitattu mainin (#454) versiota vastaan:
  kantin tutkielma 360 px *Viittauksista…* ja 2.1 pois, 412 px 2.1 pois, 1280 px ennallaan; Luinin opas 412 px 1.1 ja 2.2 pois,
  3.6 näkyviin, päälukujen määrä ennallaan.
  **Mahtuminen** (käyttäjän pyyntö 30.10.2026): etappimerkin (pääluku, alaluku, alaluvun alaluku) musteen pitää mahtua
  sivusuunnassa janalle (x0…x1, pääluvulla kehän jiiri mukaan), ja ensimmäisen näkyvän pääluvun vasemmalle puolelle pitää
  mahtua vähintään yksi kuvitteellinen päälukumerkki (musteen vasen reuna ≥ x0 + 2 × 7,39). Tämä korvasi säännön, jonka mukaan
  ensimmäistä päälukua ei piirretty tekstin ensimmäisen 10 %:n aikana; vähintään 222 px:n janalla 10 %:n kohta on aina tilaa
  kauempana, joten uusi sääntö näyttää enemmän. Ajetaan ennen peittoja. Piilotettu merkki on silti pysäkki, ja vedettäessä sen
  nimi näkyy. Mitattu mainin versiota vastaan: kantin tutkielma ennallaan (360, 412, 1280 px); Luinin opas 360 px luku 2 pois
  (muste 16,57 < 17) ja luku 9 pois lopusta (346,98 > 343), tilalle 1.2; 412 px luvut 2 ja 9 pois, 1.1, 2.2 ja 9.1 näkyviin;
  synteettinen esipuhe (luku 1 kohdassa 4,8 %) 1280 px:llä luku 1 näkyviin, 412 px:llä piilossa (35,1 < 39,2). `testi.js`
  tarkistaa mahtumisen ja napauttaa aikajanan hypyssä viimeistä piirrettyä päälukua (oppaan viimeinen ei mahdu). Otsikkotasoja on neljä (# nimi, ## pääluku, ### alaluku, #### alaluvun
  alaluku); aikajanan oletus on pääluvut ja alaluvut, *Kaikki* lisää alalukujen alaluvut; kirjanmerkki ruosteinen nauha viivan
  alla; nykyinen kohta kolmio ja hiusviiva. "Vinoneliöestetiikkaa, ei palluraestetiikkaa." Antiikva
  (Literata, `luin/fontit/`, OFL) ja klassinen tyyli; salmiakkien kyljet hieman koverat (c = 0,38) on
  kompromissi kaartuvan ja terävän välillä.
- **md-konventiot ovat käyttäjän omat** (aiemmat md → html -muunnokset, malli tutkielman html-versio)
  ja menevät yleisen Markdownin edelle: otsikkolohko (#, kursiivi alaotsikko, tietorivit `<br>`:llä),
  `luku-2-1`-tunnisteet, numeroimaton ### versaalikursiivina (`.caps`), alaviitteet sivuhuomioiksi
  (fnref + fntoggle + sidenote), `## Kirjallisuus` → `p.bib`. Lainausmerkkejä ei muuteta.
  Muuten noudatetaan **iA Writerin protokollaa** (käyttäjän päätös 22.10.2026; opas, luku 3): alaviite on
  `[^teksti]` tai `[^1]` + `[^1]: …`; Pandocin `^[…]` (tutkielmaan lipsahtanut) toimii yhä, ja Latomo tarjoaa
  muunnoksen. Rivinvaihto: kenoviiva rivin lopussa, kaksi välilyöntiä tai `<br>`. Lisäksi ~~ == ^ ~, sisäkkäiset
  luettelot (kääre `li.sisus` ilman `data-b`, lohkot eivät ole sisäkkäin), tehtävät, taulukot (rivi = lohko),
  viitelinkit, ristiviittaukset, sitaatit `[s. 23][#avain]`, `[%avain]`, `{{TOC}}`, `+++`, kommentit, setext,
  sisennetty koodi. Kuvat näkyvät linkkeinä eivätkä kuvina (lukija ei hae mitään kolmannelta osapuolelta).
  Otsikkolohkon tietorivi on enintään 100 merkkiä riviltään; pidempi kappale on leipätekstiä (verkkoleike).
  Kursivoitu julkaisutieto otsikon alla (*First published …; substantive revision …*, myös *julkaistu*, *päivitetty*,
  *updated*) on tietorivi eikä alaotsikko (29.10.2026, SEP: rivi päätyi viitteeseen otsikon perään); julkaisuajaksi
  päätellään rivin myöhäisin päiväys eli luettu versio (Teologian tyyli 4.1: kirjoitus- tai päivitysaika), ja jos
  tekstissä ei ole muita tietorivejä, etukentän tekijä tulee sen edelle.
- **Latomon remontti** (käyttäjän pyyntö 22.10.2026, toteutus Clauden harkinnalla; opas, luku 7):
  *Tekstityyppi* on oletuksena *ei määritelty*; valittavana tieteellinen, blogi tai verkkosivu, kaunokirjallinen.
  Kentät Teologian tyylin viitteen järjestyksessä, tyypin oletuskentät näkyvissä ja loput *+ Lisää tieto*
  -napista (*Osana teosta tai lehteä* avaa toimittajat, vuosikerran ja sivut). **Kehys** (käyttäjän päätös 22.10.2026):
  blogin nimi ja kaunokirjallisen tekstin kokoelma näkyvät alaotsikon paikalla lukulistassa ja ladotussa tekstissä, jos
  alaotsikkoa ei ole (md.js `kehys`; määrittelemättömällä tyypillä sivusto, tieteellisellä ei kehystä), eivätkä toistu
  tietorivillä. Kaunokirjallisella `teos`-kentän nimi on *Kokoelma* (oletuksena näkyvissä; käyttäjä halusi
  sateenvarjosanan, ei *novellikokoelma*). Kaikki vapaaehtoista, otsikko
  riittää; pelkälle tekstille kentän otsikko lisätään tekstin alkuun. **Etukenttään vain se, mikä poikkeaa
  tekstistä päätellystä** (tutkielma läpäisee Latomon tavulleen samana). Julkaisuajan tarkkuus valitaan:
  blogissa vuodesta minuuttiin (oletus kuukausi), tieteellisessä enintään päivä; itse kirjoitettu ja tekstin
  aika säilyttävät tarkkuutensa, koneen T-aikaleima saa tyypin oletuksen. Ehdotukset muuttavat tekstikenttää
  vain napista. *MarkDownload-leike*-kytkin (Firefoxin lisäosa) siivoaa jäänteet vain
  tuloksesta ja lukee tiedot etukentästä ja leikkeen lopusta; suositellut asetukset ja etukenttäpohja ovat
  Latomon ohjeessa (`latomo-ohje.html#markdownload`; käyttäjän pyyntö 22.10.2026: kaikki asetukset, ei oletusarvoja vaan
  suositus; tulos on iA Writer -yhteensopiva, mutta ohje ei mainosta iA Writeria eikä neuvo sen käyttöä, koska moni ei käytä sitä (käyttäjän päätös 22.10.2026). iA Writer mainitaan vain, kun se vastaa kysymykseen *miksi juuri näin* (merkintöjen alkuperä Merkinnät-osion johdannossa, `^…^`, `^[…]`-muunnos); nimet ja suositukset tarkistettu MarkDownload 3.4.0:n lähdekoodista ja
  sen muunnosketjua Chromiumissa ajamalla, oikealla Firefoxilla testaamatta). Kytkin poistaa myös tyhjät linkit ja muuttaa
  `<sup>`/`<sub>`-merkinnät muotoon `^…^`/`~…~` (hakasulut suojattuina, `^\[[7](…)\]^`, koska `^[` on alaviite; md.js lukee
  myös `^[…](…)^`:n ja `^[…]^`:n yläindeksiksi; 29.10.2026 SEP-leikkeen 58 merkkiä olivat muuttuneet alaviitteiksi) ja
  otsikkorivittömän HTML-taulukon Markdown-taulukoksi (huomautusten rivinumerot muunnetaan tekstikentän riveiksi); md.js
  antaa HTML-merkinnöistä yhden huomautuksen riviä kohden. **Puuttuva luvun otsikko** (käyttäjän pyyntö 29.10.2026): MarkDownloadin
  Readability poistaa h2:n, jonka tunnisteessa on esim. *meta* (SEP `id="ExpeMeta"`); asetuksista sitä ei saa pois. md.js sanoo
  *Pääluvun 3 otsikko puuttuu*, Latomo kertoo rivin ja MarkDownload-tilassa linkittää ohjeen `#otsikko-puuttuu`, jossa kiertotie
  on valinnan leike; sen toistuva `#`-otsikko jätetään pois, ja kuvakkeiden taulukko (lainauksessa, `<img>`) muuttuu kappaleiksi.
  Lisäksi tila korjaa MarkDownloadin väärin kokoamat sivun omat linkit (`dewey//../sellars/`, `korjaaOsoitteet()`). Kytkin on oletuksena pois; silloin salmiakin tyhjyyden lisäksi sen teksti ja viereinen ohjelinkki ovat
  `--harmaa`-värisiä, päällä teksti musteella ja linkki ruosteella (käyttäjän päätös 22.10.2026). Käyttäjän päätös 23.10.2026:
  kytkin on **aina pois sivua avattaessa** (valintaa ei muisteta; `latomo-markdownload`-avainta ei enää lueta eikä kirjoiteta)
  ja ehdollisessa asemassa (`.ehdollinen`): sisennetty ohuen `--viiva`-viivan taakse, pienempi, ja kytkin on kehystetty
  isommalla salmiakilla (11 × 15 px), koska pelkkä pieni salmiakki näytti luettelomerkiltä. **Korvamerkki** (käyttäjän pyyntö
  27.10.2026, toteutus Clauden harkinnalla; Latomo minimalisoituu, etusijalla tietävät käyttäjät): rivi on piilossa, ja
  se ilmestyy, kun etukentässä on ohjeen pohjan avain `leikattu: {date:YYYY-MM-DD}` (tallennuspäivä, ei *downloaded with
  MarkDownload* -kuonaa), tai kun tila on päällä (ehdotuksesta). Korvamerkki kytkee tilan päälle; kytkimestä sen saa pois vain
  tältä tekstiltä. Tulokseen avain menee nimellä `haettu`, joten valmis teksti ei ole merkitty. Rivillä on vain kytkin ja
  pieni i-salmiakki (Luinin tietoa-napin merkki, 12 px) ohjeeseen; ehtolause *Jos teksti on verkkosivulta tallennettu* ja
  linkkiteksti *asetukset Luinia varten* poistettiin. Ilman korvamerkkiä ehdotus tulee vain oletuspohjasta tai jäänteistä. Testit: `luin/kehitys/md-testi.js` (ilman selainta) ja `latomo-testi.js`.
- **Pdf:stä muunnettu teksti** (käyttäjän pyyntö 23.10.2026; opas, luku 7.1; Latomon ohje `#pdf`): hegel-repon
  (`OlliJuutilainen/hegel`) `pdf_to_markdown.py` kirjoittaa etukenttään Crossrefin tiedot (DOI alkusivuilta,
  `--no-lookup` pois) ja JSTOR-kansilehden lähteen eriteltynä (`journal`, `volume`, `issue`, `pages`; ei enää `source`,
  jonka Latomo lukee verkko-osoitteeksi). Latomo lukee avaimet (ALIAS, `volume`+`issue` → `72:288`) ja ilman etukenttää
  tietoriveiltä DOI:n, `Paikka: Kustantaja vuosi` ja `Tekijä, *Teos*.`; ISBN ei ole päiväys. Rivitysehdotus ohittaa
  tietorivit ja alaviitteiden määrittelyt. **Otsikkolohko kentistä** (käyttäjän pyyntö 23.10.2026, Clauden harkinnalla;
  opas 7.1): kun kenttä ei näy tekstin alussa, ehdotus kirjoittaa alun kentistä tekstiin, toinen nappi säilyttää vanhan
  alun lauseet, joita kentistä ei löydy (ISBN, lisenssi). Uusi alku valitaan tekstikentässä muokattavaksi. Hylätty:
  etukentän tilamerkintä, jolla kentät yliajaisivat näytön (tiedosto näyttäisi iA Writerissä eri alun).
- **Tunnetut sivustot** (käyttäjän pyyntö 29.10.2026, "lellikki"): Latomon `SIVUSTOT`-taulukko antaa *Blogin tai sivuston nimi* -kentän
  esitäytön lähdeosoitteen isännästä, kun tekstissä ei ole omaa nimeä; nyt vain `plato.stanford.edu` → *Stanford Encyclopedia of
  Philosophy*. Etukentän oma `sivusto` ja käyttäjän muokkaus voittavat. `latomo-testi.js` tarkistaa SEP:n, oman nimen ja vieraan sivuston.
- Latomon *Tyhjennä kentät* (käyttäjän pyyntö 22.10.2026) tyhjentää tekstin, kentät, oman viitteen ja osoitteen; vahvistus
  *”Oletko aivan varma?” sanoi Lasse Lehtinen.* napein *Olen, tyhjennä* / *älä!*. MarkDownload-tila palaa alkutilaan (rivi piiloon; käyttäjän päätös 29.10.2026, ennen kytkin säilyi).
- Logo *LUiN.* / *HTML* (`luin/kehitys/logo.js` tulostaa SVG:n, joka on kopioitu luin.html:ään ja
  Latomoon): korkea tiivis antiikvaversaali, i:n piste ja loppupiste salmiakkeja, alarivi HTML ohuena
  väljänä. Viiva pisteiden välillä on *glissando* (käyttäjän päätös 21.10.2026; esikuva flageolettiglissando):
  se lähtee i:n pisteen oikeasta kulmasta ja päättyy loppupisteen vasempaan kulmaan. i:n pisteen oikea
  yläsärmä ja loppupisteen vasen alasärmä ovat suoria ja samassa kulmassa kuin viiva, joten viivan yläreuna
  jatkaa edellistä ja alareuna jälkimmäistä ilman porrasta (muut särmät koverat). Viiva on suunnikas eikä
  stroke, ja `glis()` ratkaisee kaltevuuden, kun i:n pisteen oikea kulma (x 133), sen yläkärjen korkeus ja
  loppupisteen paikka on annettu; salmiakkien korkeus seuraa kaltevuudesta. Käyttäjän päätös 21.10.2026
  (viimeisin): i:n pisteen keskikohta y 12 ja loppupisteen keskikohta y 100, eli sen sivukärjet ja viivan
  laskeutuminen ovat perusviivalla. Viivan alareuna kulkee N:n oikean kuopan pohjan kautta (vinoviivan oikea
  reuna kohtaa oikean pystyviivan vasemman reunan, x 186,6, y 84,89), joten viivan alle ei jää kuopasta rakoa
  (`sulje`, oletus; mitattu pikseleistä: ennen 469 paperin väristä pikseliä, nyt 0). Tämä ratkaisee
  kaltevuuden 1,305 (52,5°) ja loppupisteen paikan x 204,68: i:n piste 7,5 × 9,78, loppupiste 6,5 × 8,48,
  alakärki 108,5 (HTML alkaa 112). viewBox `-2 -2 215.18 138`; luin.html:ssä logo 99,78 px leveä, Latomossa
  87,31 px, korkeus ja otsikon paikka ennallaan (mitattu). i:n piste
  on ruosteinen, viiva, loppupiste, LUiN ja HTML tekstin värisiä. Hylätyt: viiva keskeltä keskelle (aiempi),
  loppupiste x 214 ja i:n piste keskikohdaltaan y 12 (piste liian kaukana), piste–viiva–piste ja HTML
  ruosteisina (oli käytössä hetken 21.10.2026), kaikki musta (kirvesmäinen), loppupiste N:n alla (x 205, ahdas),
  i:n pisteen yläkärki versaalien lakipisteessä ja loppupisteen alareuna perusviivalla (oli käytössä hetken;
  sivukärkiä perusviivalle kokeiltiin myös yläkärjen ollessa lakipisteessä, jolloin piste venyi 9,11:een),
  loppupiste x 212, y 100 (oli käytössä hetken; viivan alle jäi kuopasta noin 10 yksikön rako), rako suljettuna
  laskemalla loppupistettä (keskikohta 109,6, roikkui HTML-rivin tasolle) tai muuttamalla N:ää.
  Vanha geometria: `logo({ glis: false })`. Käyttäjän päätökset 21.10.2026:
  HTML mahtuu kokonaan LUiN-kirjainten alle (muste x 7–196,6 eli L:n pystyviivan vasemmasta reunasta N:n
  oikean päätteen reunaan, ei loppupisteen alle; käyttäjän päätös 27.10.2026, ennen x 0 eli L:n alapäätteen
  reunasta, `logo({ hx0: 0 })`; mitattu Chromiumissa pikseleistä), alku ja loppu veitsenterävät (H:n
  vasemmat päätteet x 7:ssä, L:n alaviivan päässä ylärivin L:n kaltainen pystypääte), rivi 5 yksikköä
  ylempänä ja viiva 2,1 → 2,5 (viewBox:n korkeus ennallaan, joten LUiN ei muuttanut kokoaan). Pienen L:n
  alaviivan pää N:n alaosan reunaan (x 190) kokeiltiin ja hylättiin.
- Asetusten nappi (käyttäjän päätös 21.10.2026) on volvelle (Apianus, *Astronomicum Caesareum* 1540: kirjan sivulle kiinnitetty
  kiertyvä paperikiekko), ei hammasratas: kaksi sisäkkäistä kehää, ulkokehän 16 asteikkoviivaa (joka neljäs pidempi),
  koverakylkinen salmiakkiosoitin ja paperin värinen napapiste (`var(--paperi)`). Valittu kuudesta luonnoksesta; ensin
  valittu vesiratas (alalyöntiratas, PR 347) vaihdettiin tähän samana päivänä. Hylättyjä: hammasratas, kruunupyörä,
  Katariinan pyörä, kannuksen ratas, Fortunan pyörä, kauharatas (L-koukut näyttivät hakaristiltä), Ramellin kirjat,
  vedessä-versio. SVG on samana kahdessa paikassa (`.ratas`-nappi listassa ja `#ratas-polku`-`<g>` lukijassa), pidä ne yhtenevinä.
- Lukulistan logon oikealla puolella on KEICK•WALKin ⓘ-napin tapaan tietoa-nappi (käyttäjän pyyntö 21.10.2026), mutta
  ympyrän sijaan koverakylkinen salmiakki, jonka sisällä i salmiakkipisteineen (`--harmaa`, auki ruoste). Käyttäjän pyyntö
  4.11.2026: salmiakki alas logon alareunan tasolle (ennen LUiN-versaalien keskilinjalla, 54,00 px): alakärki on HTML-rivin
  alareunassa (mitattu 91,4 vs. 91,2 px, 412 px leveä ikkuna). Siirto on `position: relative; top: 28px`, joten asettelu
  ei muutu (`.lhead` ja seuraava otsikko samoilla paikoilla 94 / 128 px). Se avaa logon alle ohuen `--viiva`-kehyksisen laatikon,
  jossa on vain *LUiN.HTML on lukulaite Markdown-teksteille. Tiedot tallentuvat vain tähän selaimeen.* (käyttäjä: erittäin
  lyhyesti). Kiinni ollessa sivu on pikselilleen ennallaan.
- Nimen tekstimuoto (ei-graafinen, esim. infolaatikko ja logon `aria-label`) on *LUiN.HTML* (käyttäjän päätös 21.10.2026);
  tiedostonimi ja polut pysyvät `luin.html`.
- **`md.js?v=<SHA-1:n alku>`** (29.10.2026: käyttäjän selain piti vanhan md.js:n, vaikka korjaus oli julkaistu; Pages antaa
  `max-age=600`): luin.html ja Latomo lataavat md.js:n versiotunnisteella. Kun muutat md.js:ää, päivitä tunniste:
  `V=$(sha1sum luin/md.js | cut -c1-8); sed -i -E "s/md\.js\?v=[0-9a-f]+/md.js?v=$V/" luin.html luin/latomo.html`;
  `md-testi.js` huomauttaa, jos se on unohtunut.
- Aikajanapalkki (käyttäjän päätökset 21.10.2026): alapalkin vasemmassa reunassa on aina näkyvä
  kirjanmerkin ääriviiva (`#km-nappi`; ohut viiva alapalkin tekstien värillä `--harmaa`, aiemmin hyvin haalea `--viiva`), joka asettaa kirjanmerkin ilman palkin avaamista ja muuttuu kupariseksi
  (`--ruoste`), kun ruudulla (sivutettuna tällä sivulla) on kirjanmerkki; silloin napautus poistaa näkyvät
  kirjanmerkit. Laatikkoa *Aseta kirjanmerkki* ei ole (käyttäjän päätös 21.10.2026: pelkkä symboli alhaalla riittää). Avatun palkin alla vasemmalla on laatikko *Merkinnät* listasymbolein (avaa kirjanmerkit ja
  alleviivaukset). Aikajanalla vain luettu osa (nykyiseen kohtaan asti) on tekstin värinen; tuleva viiva ja
  salmiakit ja kirjanmerkit ovat `--viiva`-harmaita (kirjanmerkit käyttäjän päätöksellä 22.10.2026; ennen ne näkyivät tulevassa osassa kuparisina), ja vedettäessä nekin vaihtuvat vedenjakajan mukana.
  Natsaa ei ole (käyttäjän päätös 22.10.2026; 21.10.2026 alapalkissa oli `natsanPaikka()`-mitattu natsa).
  Koko palkki on edelleen aikajanan nappi (`#ala-nappi` absoluuttisena alimmaisena); kirjanmerkki ja sivunapit ovat sen päällä,
  ja oikean laidan `#ala-oikea` ei ota napautuksia (`pointer-events: none`), joten edistymisen napautus avaa aikajanan.
  Sivunäkymässä on sivunappipari (`#sivunapit`, käyttäjän päätös 21.10.2026): rajattu, jotta
  näkyy, ettei siitä aukea aikajana; puolikkaat kiinni toisissaan väliviivalla (22.10.2026 alkaen kirkas ja nuolisalmiakein, ks. alla). Edistymisen vasemmalla
  puolella, ilman edistymistä oikeassa reunassa. Booxin sivunkääntönäppäimet antavat PageDown/PageUpin; `AudioVolumeDown`/`Up`
  on lisätty siltä varalta, että selain välittää äänenvoimakkuusnäppäimet. Oikealla Palmalla testaamatta.
- **Palkkien remontti (käyttäjän päätökset 22.10.2026; opas, luku 4.4).** Mobiili = `(pointer: coarse)` eli kosketusnäyttö
  (`body.mobiili`, `asettele()`); hiiri on työpöytä myös kapeassa ikkunassa (käyttäjän päätös 22.10.2026: leveysehdolla palkit
  piiloutuivat työpöydällä). Aikajanan oletustason ehto `(max-width: 700px), (pointer: coarse)` on erillinen ja ennallaan. Työpöydällä ylä- ja alapalkki pysyvät; alapalkissa ei ole
  natsaa eikä nykyisen osion nimeä (`#ala-kohta` poistettu), vain kirjanmerkki vasemmalla ja sivunapit ja edistyminen oikealla.
  Osion nimi näkyy avatun aikajanan ylärivillä. Mobiilissa palkit ovat piilossa: alareunassa on kaista (`--ala` 44 px), jonka
  yläreunassa on haalean haalea viiva `--hius` (viivan ja paperin puoliväli; käyttäjän pyyntö 27.10.2026, ennen reunukseton).
  Kirjanmerkki on kaistan vasemmassa reunassa oma 45 × 43 px:n lohkonsa, nauha keskellä, ja sen erottaa muusta kaistasta
  `--viiva`-pystyviiva, jonka päät ovat 7 px irti kaistan reunoista (27.10.2026; ennen nauha kellui palstan linjassa ja sen vasen
  puoli avasi palkit). Erotin on napin viimeinen pikseli, ja nauhan musteen väli siihen on sama kuin kaistan vasempaan reunaan,
  17 px (käyttäjän pyyntö 27.10.2026; mitattu pikseleistä DPR 1–4; ennen erotin oli 2 px lähempänä). 28.10.2026: käyttäjä ei
  nähnyt erotinta, kun se oli `--hius`-värinen ja vain mobiilissa, joten se on nyt `--viiva` ja myös työpöydän alapalkissa
  (nappi 59 px, väli 24 px kummallakin puolella; napin oikea osa avasi ennen aikajanan). 29.10.2026: käyttäjän pyynnöstä hiukan lisää sivutilaa: symbolin ja erottimen väli +6 px (nappi 65 px työpöydällä, 51 px mobiilissa; symboli ei liikkunut, väli vasempaan reunaan 24 / 17 px ennallaan, väli erottimeen 30 / 23 px). `testi.js` tarkistaa mobiilin välit. Palkkinuoli (`#palkki-nuoli`) on oikeassa alanurkassa palkkien oikeassa laidassa (29.10.2026;
  ennen tekstipalstan oikean reunan linjassa, `--palsta-o`, joka poistettiin).
  Työpöydän kirjanmerkki on ennallaan. Kaistan napautus (`#ala-nappi` koko kaistan alla; nuoli ei ota napautuksia) avaa yläpalkin ja
  aikajanakerroksen yhdessä (`palkit-auki`), tekstin päälle ilman siirtymää, ja sulkee ne. **Tekstin napautus ei avaa palkkeja**
  (käyttäjän päätös 22.10.2026, myöhemmin: avautui liian helposti vahingossa; aiemmin vierityksessä mikä tahansa kohta ja sivutettuna
  keskikolmannes). Palkkinuoli on ylös osoittava lovettu koverakylkinen salmiakki (sivunappien nuolen muoto): kiinni `--harmaa`-ääriviiva
  kuten kirjanmerkki, auki täytetty `--muste` ja alas osoittava. Nuoli on myös työpöydällä alapalkin oikeassa reunassa (käyttäjän vaatimus 22.10.2026: alapalkissa ei ollut mitään avaamisen ja sulkemisen merkkiä), jossa se kääntyy aikajanan mukana. Kerroksen ylärivillä
  osion nimi ja oikealla edistyminen (`#jana-pros`); *Merkinnät* ja *Etsi* ovat aikajanan alla omalla rivillään vasemmassa reunassa
  kaistan yläpuolella kuten työpöydällä (käyttäjän pyyntö 27.10.2026; ennen kaistalla kelluvien välissä, `sijoitaJanaNapit()` poistettu). Vain kaistan napautus avaa ja sulkee palkit (käyttäjän päätös 22.10.2026):
  vieritys ja sivunkääntö eivät vaikuta (ensimmäisessä versiossa sulkivat). Työpöydällä keskiklikkaus ei avaa aikajanaa ("hiirellä
  kauhea tapa"), vain alapalkin klikkaus. Sivunapit 52 × 34 px (27.10.2026; ennen 44) eli Merkinnät- ja Etsi-laatikoiden korkuiset, reunus `--harmaa` kaikilta sivuilta
  ennallaan. Niiden napautusalue (`#sivunapit`) on koko palkin korkuinen ja ulottuu ruudun oikeaan reunaan (`--o-laita`), joten nappien
  ylä-, ala- ja oikealta puolelta ei avaudu aikajana (käyttäjän pyyntö 27.10.2026; myös työpöydällä); tyhjä osa kääntää sen napin
  suuntaan, jonka kohdalla napautus on,
  nuolina täytetyt lovetut koverakylkiset salmiakit (valittu neljästä muodosta, leijat näyttivät pienenä möhkäleiltä; 29.10.2026 alkaen
  `--harmaa` kuten yläpalkin asetuskiekkokin, käyttäjän pyyntö: navinäkymän muiden kanssa samaan himmeämpään väriin, ennen `--muste`).
  `#lukija`ssa ei ole napautuskorostusta (näkymättömän kaistan napautus väläytti kaistan). Palkkien avaus ei poista paluumajakkaa. Kirjanmerkkinauhaa ei voi kytkeä pois (käyttäjän päätös toistaiseksi). Asetuksissa
  *Liikkuminen*-rivin *Sivut*-sanan alla lisäkytkin *Sivunvaihtopainikkeet* (`aset.sivunapit`, oletus pois 22.10.2026 alkaen; sivua
  käännetään reunojen napautuksella; `av: 5` kytkee kerran pois myös tallennetuista; sivunapit ovat palkkinuolen oikealla puolella 24 px:n päässä, käyttäjän pyyntö 28.10.2026, ennen väli 12 px; ilman niitä nuoli ja niiden kanssa nappien oikea reuna on palkkien oikeassa laidassa, 29.10.2026), 16 px sisennettynä
  (`sijoitaNipukka()` mittaa) ja vierityksessä pois käytöstä kuten Sukkela alleviivaus. Mitattu: työpöydän kuvakaappauksessa
  muuttui vain alapalkin osion nimen ja natsan alue; mobiilin sivutettu tutkielma 57 → 53 sivua.
- **Palkkien laidat ja hajurako (käyttäjän pyyntö 29.10.2026, "megapaukku navinäkymään"; opas, luku 4.4).** Navinäkymän merkit ovat
  kahdessa linjassa musteesta mitattuna: vasemmalla kirjanmerkkinapin symboli (kulmakivi), Lukulista-natsa ‹, aikajanan alkutikki,
  osion nimi ja *Merkinnät*; oikealla asetuskiekko ja kalanruoto (kulmakivet), edistyminen, aikajanan lopputikki ja näkyvät sivunapit.
  CSS-muuttujat `--v-laita` / `--o-laita`: työpöydällä 24 / 29 px, kosketusnäytöllä (`pointer: coarse`) 17 / 17 px marginaalista
  riippumatta (ennen mobiilin oikea laita oli tekstipalstan reuna + 10 px eli Keski-marginaalilla 38,5 px: "omituinen pieni oikean laidan
  aukko"). Laidat ovat kokonaislukuja, koska Chromium pyöristää SVG:n ja reunuksen paikan kokonaiseen CSS-pikseliin (mitattu: 28,5:llä
  sivunapit tai ruoto jäi aina 0,5 px sivuun). Sivuvälien korjaukset on mitattu pikseleistä (‹ 0,05 em, osion nimi 0,04 em, edistyminen
  0,058 em, kiekon kehä 0,84 px; ruodon viewBox = musteen rajat). Mitattu DPR 2–4: linjat 0,25 px:n sisällä, edistyminen viimeisen
  numeron mukaan enintään 0,35 px. Aikajana on kerroksen levyinen ja sen päät lasketaan laidoista (`janaRajat()`). Asetusten sulkuraksi
  seuraa kiekkoa (sama marginaali). Yläpalkki 44 → 56 px (työpöydän vierityksen `YLA` 70 → 82; sivutettu tutkielma 1280 × 800:lla
  37 → 38 sivua, mobiilissa ennallaan), ja aikajanakerroksen kaikkia pystyvälejä kasvatettiin noin 1,5–1,7-kertaisiksi (kerros 129 → 168 px).
  Ennen ja jälkeen -kuvissa lukulista oli pikselilleen sama ja mobiilin suljetuissa palkeissa muuttui vain ruodon paikka.
- Aikajanan veto (käyttäjän pyyntö 21.10.2026): osoitin seuraa vetoa, voimassa oleva kohta jää `--viiva`-harmaaksi haamuksi,
  eikä teksti liiku ennen irrotusta. Käyttäjän pyyntö 22.10.2026: luetun ja tulevan raja (musta viiva ja etapit) seuraa
  vedettävää osoitinta, ei haamua. Liikkeessä muuttuvat vain `#j-veto`:n transform, viivojen päät ja rajan ylittäneiden
  etappien `tuleva`-luokka (`vedenjakaja()`; etapeilla `data-f`), kerran ruudunpäivitystä kohden (e-ink).
  Käyttäjän päätös 21.10.2026: vierityksessä aikajanalla ei ole magneettia (napautus ja veto vievät suhteelliseen kohtaan,
  myös merkin vieressä ja kummitusmerkin kohdalla). Sivutettuna välimuotoja ei ole: osoitin pysähtyy vain pysäkeille
  (`janaPysakit()`: tekstin alku, viimeisen sivun alku (käyttäjän pyyntö 1.11.2026), kaikkien tasojen otsikot, kirjanmerkit, majakka, voimassa oleva kohta), lähin voittaa, ja
  pysäkit ovat samat riippumatta aikajanalle valituista merkeistä. Perustelu: ilman e-inkiä luetaan mieluummin vierittäen,
  e-inkissä veto ei tee ilotulitusta. Sivun alkuun pyöristävä `sivunAlku()` jäi vain testien käyttöön.
- Kirjanmerkin paikka (käyttäjän päätökset 21.10.2026 ja 22.10.2026; opas, luku 4.3): kirjanmerkki menee aina kappaleen alkuun
  (`o: 0`). Nauhasta se on näkymän ylimmän kappalejaon eli ylimmän näkymässä alkavan kappaleen alku (`ylinKappaleenAlku()`).
  Jos näkymässä ei ole yhtään kappaleen alkua, se tulee edelliseen kappalejakoon, ja näkymä siirtyy vain sen verran taakse,
  että merkki näkyy (sivunkäännöin tai ylös vierittäen). Valinnan valikosta se menee valinnan kappaleen alkuun. Aiempi
  sääntö (luettava kappale, sivutettuna sivun ensimmäisen rivin kappale) suosi kesken alkanutta kappaletta; testi
  `luin/kehitys/testi.js` tarkistaa molemmat uudet tapaukset sivutettuna, vierityksen tarkistin käsin Playwrightilla. Sivu ilman tekstilohkoa
  (sisällysluettelo) ei kuulu tähän: merkki tulee silloin sivun jälkeiseen kappaleeseen. Nauha on sisennetyssä kappaleessa sisennyksessä, muuten tekstin vasemmassa laidassa ensimmäisen rivin
  yläpuolella, jos tilaa on (kappaleväli, otsikon tai luvun vaihto, sivun yläreuna), ei reunuksessa. Reunus on vain
  varasääntö, kun tilaa ei ole (alle 18 px:n koko, sisennystilan koodilohko) ja vanhoille kesken kappaletta oleville.
  Sivutettuna nauha on `position: fixed`, koska `#sivu` leikkaisi sivun yläreunan kaistan.
  Otsikossa nauhan ja nousijoiden väli on 0,45 em (leipätekstissä 4 px), ja nauhan yläpuolelle jää yläreunassa 14 px
  (`NAUHA_KATTO`; vierityksessä `mene()` ja nauhanapin lisäys vierittävät sen verran; käyttäjän pyyntö 29.10.2026: pääluvussa
  nauha oli kiinni otsikossa ja vierityksessä yläpalkkia vasten tai ruudun yli). Mitattu: pääluvussa väli musteeseen 5 → 12 px.
- **Marginaali** (käyttäjän pyyntö 22.10.2026, toteutus Clauden harkinnalla; opas, luku 4.5): *Ulkoasu*-osiossa Reunojen
  ja Tavutuksen välissä *Marginaali: Ohut | Keski | Reilu* = 16 / 24 / 36 px molemmille sivuille (`MARG`), oletus Keski.
  Arvojen avaimet (`kapea`, `keski`, `levea`) ovat ennallaan, jotta tallennetut asetukset säilyvät; nimet vaihdettiin 22.10.2026.
  Ohut on asetusta edeltävä leveys pikselilleen (mitattu: sama asettelu 360, 412, 702, 760 ja 1200 px:llä). Rivi näkyy vain,
  kun marginaali vaikuttaa (`innerWidth < 33 × koko + 72`). Yläraja on harkittu: 40 px:llä tasattuun tekstiin tuli 412 px:llä
  silmin nähtäviä aukkoja.
- Aikajanan oletus (käyttäjän päätös 22.10.2026): työpöydällä pääluvut ja alaluvut (`janaTaso: 2`), mobiilissa (`(max-width: 700px), (pointer: coarse)`) vain pääluvut (`janaTaso: 1`). Koskee vain ensikäyttöä; tallennettuja asetuksia ei muuteta. Mitattu Chromiumissa: työpöytä Pääluvut+Alaluvut, mobiili vain Pääluvut, tallennettu 2 säilyy mobiilissakin.
- **Verho** (käyttäjän päätös 1.11.2026; `verhoAuki()` = navinäkymä tai Asetukset-/Merkinnät-paneeli auki): verhon takana eivät toimi
  tekstin napautus (navissa se sulkee palkit, paneelin ollessa auki ei tee mitään), reunanapautus, pyyhkäisy, valinta eikä
  alleviivaus, eikä hiiren rulla käännä sivua (sivutettuna rulla ei tee verhon takana mitään, vierityksessä vierittää). Sallittua:
  sivunkääntö näppäimillä (nuolet, PageUp/Down, väli, Home/End; ei kun kohteena on `select`, tai väli painikkeella/`summary`/linkillä) ja
  alapalkin kirjanmerkkinappi aina. Aiemmin paneeli ei estänyt mitään muuta kuin näppäimet ja navi ei estänyt valintaa.
  Mitattu Chromiumissa 1280 px sivutettuna: ilman verhoa reuna −1 sivu, nuoli +1, rulla +1, alleviivaus syntyy; navissa ja
  asetuksissa reuna 0, nuoli +1, rulla 0, alleviivaus 0. `testi.js` sulkee navin ennen alleviivausta (se luotti vanhaan aukkoon).
  **Asetukset lukijassa** (käyttäjän pyyntö 4.11.2026): tekstialueen napautus sulkee Asetukset-paneelin kuten navin (Merkinnät-paneeli
  sulkeutuu edelleen vain omasta napistaan). Paneelin alareuna on alapalkin kaistan yläreunassa (`sijoitaPaneeli()`, CSS-muuttuja
  `--paneeli-ala`, päivittyy ikkunan koon muuttuessa), joten kirjanmerkki- ja sivunapit (`#sivunapit`) sekä sivunkäännön näppäimet
  toimivat asetusten ollessa auki; alapalkista ei poistu asetuksista. Asetusten avaus sulkee navin (ei molempia yhtä aikaa, jotta yksi
  napautus riittää). Alleviivaus ei synny (verho). Mitattu Chromiumissa 1280 ja 412 px sivutettuna: paneelin alareuna = kaistan yläreuna
  (760 / 756), sivunappi +1 sivu, PageDown +1 sivu, kirjanmerkki asettuu, tekstin napautus sulkee asetukset (työpöytä; mobiilissa
  `#teksti.click()`); `testi.js` ennallaan (49 riviä, 0 VIKAa). Kapealla puhelimella paneeli peittää tekstistä lähes kaiken (412 px:llä 12 px
  jää näkyviin), joten siellä sulku on käytännössä raksista. Jos tekstissä on valinta, napautus ei sulje (valinta pitää tekstin ennallaan).
- **Postilaatikko** (käyttäjän pyyntö 25.10.2026: Light Phoneen ei voi näppäillä linkkejä; opas, luku 2.2): Latomon
  *Lähetä postilaatikkoon* tulostaa wrangler 3.114.17 -komennon, joka tallentaa tekstin KV:hen avaimella
  `luin:<koodi>:<slug>` (30 päivää). Luin hakee sen workerin reitiltä `/api/luin` lukulistaan, kun laatikon koodi on annettu.
  Laatikko otetaan käyttöön kuten KEICK•WALKin keikka, joko koodilla tai linkillä (käyttäjän pyyntö 25.10.2026): lukulistan
  alla on kenttä *Laatikon koodi tai linkki* (koodi → `#l=`, Luin-linkki sellaisenaan, muu osoite → `#u=`), linkki on
  `luin.html#l=<koodi>`, ja koodin voi vaihtaa tai poistaa lukulistan asetusten osiossa *Postilaatikko*. Koodi on salasana; sitä ei kirjoiteta repoon. Reitti vaatii,
  että `tusinasaa-worker` on julkaistu tämän repon koodilla (`npx -y wrangler@3.114.17 deploy` repon juuressa).
  Testattu `wrangler dev --local`:lla ja Chromiumilla 25.10.2026; oikeaa Cloudflarea ja Light Phonea vasten ajamatta.
- **Lainauksen lähde ja motto** (käyttäjän päätös 27.10.2026, muoto C; opas, luku 3.6): `> Lainaus.\` + `> – Lähde` (myös
  lainauksen sisäinen tyhjä rivi välissä) → `figure.lainaus` ja lähde `figcaption` oikeaan reunaan; otsikon jälkeen ennen
  leipätekstiä `figure.motto` (sisennetty, ei pystyviivaa). Latomo ehdottaa erilleen kirjoitetun lähteen siirtoa lainaukseen.
  Sama iA Writerin esikatselussa pohjalla `luin/ia-writer/Luin.iatemplate` (+ zip; käyttäjän pyyntö 27.10.2026; opas 3.6).
- **Sivuseikkojen pääluvut alalukuina** (käyttäjän pyyntö 29.10.2026; opas, luku 3.2): md.js `sivuLuvut()` alentaa lopun (ja
  alun) muodollisia päälukuja yhden tason (osion alaotsikot mukana), mutta vain tukevalla rungolla: vähintään neljä päälukua,
  jäljelle vähintään kolme, ja niissä ≥ 2/3 tekstistä (kirjallisuusluettelot pois laskuista). Lopussa nimi `OHEIS` (myös
  luin.html:n `paaluvunPaino` käyttää samaa, `LuinMD.OHEIS`) tai lyhyt proosaton numeroimaton osio numeroitujen perässä; alussa
  vain nimi (`ALKU_OHEIS`); keskeltä ei mitään. `toc`-rivillä `alas: true`, Latomon rakenteessa *ladotaan alalukuna*. `inBib` nojaa
  alkuperäiseen tasoon. Tutkielmassa *Kirjallisuus* on nyt alaluku: h2 6 → 5, h3 8 → 9, sivutettuna 412 px:llä 61 → 60 sivua,
  aikajanalla päälukuja 6 → 5; muu `testi.js`-tuloste ennallaan (vierityksen veto 11450 → 11448 px). `ia-merkinnat.md`:n lyhyt
  *Setext-otsikko* aleni samalla säännöllä (testi päivitetty). Vanhan viennin `## Kirjallisuus` tuodaan samaan osioon (tarkistettu
  Chromiumissa). Regexien `\b` ei toimi ä:n perässä, siksi `(?![\p{L}\p{N}])`.
- **Otsikot sivutettuna** (käyttäjän päätös 28.10.2026): pääluku alkaa aina uudelta sivulta (CSS `break-before: column`). Alaluku (`###`), jolle sivun pohjalla mahtuisi vain otsikko tai otsikko ja yksi tekstirivi, siirretään seuraavalle sivulle (`alalukujenAlut()`, luokka `sivulle`). Mitattu synteettisellä tekstillä ikkunakorkeuksilla 560–900 px: huonoja alaluvun alkuja 321 → 0, sivuja 1757 → 1790; kantin tutkielman asettelu ei muuttunut. Lisäys samana päivänä: alaluku siirretään myös, jos sen aloittava lainaus ei mahdu otsikon sivulle kokonaan (synteettinen teksti: 330 → 0 tapausta), ja siirto varmistetaan JS:llä (`pakotettu`), koska käyttäjän työpöytäselain ei pakottanut pääluvun sivunvaihtoa (Chromiumissa toimi; selainta ei tiedetä). `testi.js` tarkistaa pääluvun ja alalukujen rivisäännön.
**Sisällysluetteloa ei pakoteta omalle sivulleen** (käyttäjän päätös 28.10.2026): se kulkee otsikkolohkon perässä samalla sivulla (kantin tutkielma 412 ja 1280 px: otsikko ja sisällys sivulla 1). Aiempi `nav.sisallys { break-before: column }` poistettiin eikä sitä ole JS-varmistuksessakaan; vain pääluku (`h2`) pakotetaan.
- Pitkän painalluksen suomi–suomi-sanakirja on myöhempi idea (opas, luku 9.2).
- **Verkkolinkit** (käyttäjän pyyntö 29.10.2026; opas, luku 4.5): asetusten *Teksti → Näytä:* -listan viimeisenä kytkin
  *Verkkolinkit* (`aset.verkkolinkit`, **oletus pois**): tekstin linkit muille sivuille ovat tavallista tekstiä (`paivitaLinkit()`,
  `href` → `data-href`), koska ne aukesivat liian helposti (SEP:n Dewey-leikkeessä 180 linkkiä). **Kytkin koskee kaikkia, myös
  kirjallisuusluettelon DOI-linkkejä** (käyttäjän päätös 30.10.2026: Luinin idea on suljettu lukuympäristö ilman häiriötekijöitä;
  29.10.2026 luettelon ja DOI:n linkit olivat poikkeus, luokka `kirj`, joka poistettiin). md.js linkittää `doi:10.…`:n doi.org:iin, ja
  linkki, jonka teksti on osoite tai DOI, saa luokan `url` (katkeaa mistä tahansa). Sisäiset linkit (`#…`) eivät ole verkkolinkkejä.
- **Sivun omat viitenumerot ja linkit Luinin omiksi** (käyttäjän pyyntö 30.10.2026; opas, luku 3.6): md.js `sivunViitteet()` tekee
  yläindeksinumerosta (SEP `^\[[7](…/notes.html#note-7)\]^`, `^[7](…#fn7)^`, `^7^`) alaviitteen, jos sen määritelmä on tekstissä
  (alaviiteosio *Notes* tms. tai numeroitu kohta paluulinkillä ↩ `#fnref7`); alaviitteen osoitteella linkitetty ilman määritelmää kertoo
  tekstin olevan lähteen omalla sivulla, numeron perässä `10^2^` jää potenssiksi. Latomo liittää SEP:n Notes-sivun leikkeen (saman
  kansion `notes.html`) artikkelin perään, kun se pudotetaan artikkelin jälkeen (`alaviitesivu()`). Linkki tekstin omaan sivuun
  ankkurin kera (etukentän `lähde`) on Luinin sisäinen, jos ankkurin jokin linkki on otsikon nimi tai linkin tekstissä on luvun numero.
- **Ei vaakavieritystä** (29.10.2026, Light Phone): `#teksti { overflow-wrap: break-word }` koko tekstille. Dewey-leike oli
  vierityksessä 360 px:n ruudulla 690 px leveä (URL-linkit), ja 32 px:n koolla kaikki testitekstit levisivät. `testi.js` tarkistaa.
- **Viitetyylin varanto `docs/viitteet/`** (käyttäjän pyyntö 28.10.2026): Teologian tyyli 2021 säännöiksi purettuna
  (`teologian-tyyli-2021.md`; PDF ei ole repossa), APA 7 -turvaverkko sen aukkoihin (`apa7-turvaverkko.md`, omin sanoin,
  tarkistetut kohdat [✓] lähteineen), sinetöity lisälehti antiikin, kirkkoisien, klassikoiden ja arkistojen merkitsemiseen
  (`lisalehti-antiikki-ja-arkistot.md`; osastokohtaisia ohjeita ei löytynyt, käyttäjän pyyntö: avataan vain todelliseen tarpeeseen)
  ja `vertaa-luin.js`, joka ajaa tyylin esimerkit `kokoaViite`n läpi (28.10.2026: 13 samaa, 5 eroa, erot kirjattu).
  **Alaotsikko alkaa kaksoispisteen jälkeen isolla** kuten tyylin esimerkissä (käyttäjän päätös 28.10.2026, `nimiOsa`; ennen
  suomenkielinen pienennettiin). Pelkän viittauksen alaviite on pisteetön (`Derrida 2019, 143`; käyttäjän päätös 28.10.2026, tukena APA:n sisennetyn lainauksen
  pisteetön viittaus). Etusija: tyylin sääntö > tyylin esimerkeistä johdettu > tutkielman käytäntö > APA 7
  tyylin merkintätavalla. Kun muutat viitteiden kokoamista tai lähdeviittausten linkitystä, tarkista varanto ja aja vertailu.
- **Paluumajakka** (käyttäjän pyyntö 21.10.2026; opas, luku 4.8): ison hypyn (linkki, myös lähdeviittaus; aikajana,
  *Merkinnät*, haku; sivutettuna ≥ 2 sivua, vierityksessä ≥ 2 ruudullista) lähtökohtaan jää alapalkin yläpuolelle
  laatikko *Palaa takaisin* raksin kera ja aikajanalle kummitusmerkki (ontto kolmio, katkoviiva). Laatikon kolmio osoittaa
  paluun suuntaan (käyttäjän sääntö 21.10.2026): lähtökohta taaempana ylös, edempänä alas; päivittyy myös vieritettäessä. Katoaa vain raksista,
  paluusta, tekstin napautuksesta tai uudesta isosta hypystä (joka jättää uuden). Peräkkäiset hakuosumat säilyttävät
  ensimmäisen lähtökohdan. Ei tallenneta.
- **Lähdeviittauslinkit** (käyttäjän heuristiikka 21.10.2026; opas, luku 3.4): alaviitteen *Sukunimi vuosi* tai
  *Sukunimi paikannin* (`Korsgaard 8.1.2`) linkittyy kirjallisuusluettelon kohtaan (`p.bib`, id `kirj-<nimi>-<vuosi>`)
  vain varmalla yhteydellä: vuodella tasan yksi osuma; paikantimella tekijän ainoa kohta tai ainoa, johon ei viitata
  missään vuodella. Muuten ei linkkiä. Teologian tyylin muodot (28.10.2026): `A & B vuosi` (myös *ja*), `A et al. vuosi` (myös *ym.*)
  ja saman tekijän seuraava vuosi puolipisteen jälkeen ilman nimeä (`Allison 1993, 45–46; 2010, 31`), kukin omaan kohtaansa;
  paikantimessa ennen puolipistettä ei saa olla versaalia, jottei seuraavan tekijän viittausta lueta jatkoksi. Ei BibTeX:ää, Pandocia tms. (käyttäjän vaatimus); päättely on md.js:n
  `viittaukset()`, ja Latomo näyttää tuloksen tarkistuksessa. Linkki `a.lahde` on `--harmaa` (alaotsikon väri), ei
  ruoste, ja sillä on `--viiva`-värinen alleviivaus. Vain alaviitteissä, ei leipätekstissä.
  **Lyhenteet** (käyttäjän päätös 21.10.2026; opas, luku 3.4): ei merkintöjä tiedostoon. Osio, jonka otsikossa on
  *lyhent* (tai *abbreviation*), määrittelee lyhenteiksi kursivoidut yksittäiset 2–5 kirjaimen sanat, joissa on vähintään
  kaksi versaalia (*GMS*, *MS*, *KpV*, *KrV*; ei *A*). Alaviitteen lyhenne ja paikannin (`GMS 4:429`, `KrV A1/B1`, `KrV BXXX`)
  linkittyy kappaleeseen tai luettelon kohtaan, jossa lyhenne ensin määritellään (id `lyh-<lyhenne>`); linkki vie aina kappaleen alkuun, ei tarkkaan esiintymään, ja jos kappaletta edeltää suoraan otsikko, otsikkoon (käyttäjän päätös 22.10.2026; id on silloin otsikon). Selitysosiosta ei
  linkitetä edelleen kirjallisuusluetteloon eikä leipätekstiin tule linkkejä (käyttäjän päätös: minimalismi).
- Haku (käyttäjän säännöt 21.10.2026; opas, luku 4.7): aikajanan alla *Merkinnät*-laatikon oikealla puolella laatikko
  *Etsi*, joka avaa ponnahduslaatikon. Haku etsii sanojen alkuja; usean sanan haku on aina fraasi (sanat peräkkäin,
  kuin lainausmerkeissä; ei JA eikä TAI); lainausmerkeissä sana on kokonainen (*"kant"* ei löydä sanaa *kantilainen*).
  Valittu osuma korostetaan `::highlight(haku)`-rajapinnalla, joka ei muuta DOMia.
  Osumamäärän oikealla puolella on hyvin matalan profiilin kytkin *alaviitteet* (sisäkkäiset salmiakit kuten
  asetuksissa; oletuksena päällä, `aset.hakuViit`; käyttäjän pyyntö 21.10.2026). Alaviiteosuma vie viitenumeron
  riville ja näyttää alaviitteen (sivutettuna ponnahduslaatikossa, vierityksessä avattuna tai reunuksessa).
- Asetukset ja merkinnät (käyttäjän päätökset 21.10.2026; opas, luvut 4.3–4.6):
  - **Kirjasinvalinta poistettu.** Groteski näytti valikkojen, salmiakkien ja logon kanssa hirveältä; se palaa
    vain, jos koko ohjelman ulkoasu sovitetaan siihen. Viitenumerot ovat edelleen groteskia.
  - *Teksti* ja *Aikajana* ovat sateenvarjolistoja, joiden otsikko on pelkkä *Näytä:* isolla alkukirjaimella ja kursiivilla (käyttäjän päätökset
    21.10.2026; vasen reuna kuten muilla nimillä (vaihtoehtojen tekstin kohdalle sisennys ja pieni alkukirjain kokeiltiin ja hylättiin); väri sama `--harmaa` kuin h3:lla ja asetusten huomiolla; hajurakoa 8 px yläpuolella, alapuolella tavallinen 1 px kuten muilla nimillä (käyttäjän päätös 21.10.2026; hetken 12 px); sama 8 px:n lisäväli on kaikkien asetusten väliotsikoiden alla, myös *Ulkoasu*-otsikon, eli h3:n ja ensimmäisen nimen väli on 19 px; versaali sekoittuisi h3:een, valitsemattomien himmennys ei käy ja ruoste on napautettavan): *Teksti* sisällysluettelo / kirjanmerkit / alleviivaukset
    (alleviivausten alla pieni lisäkytkin *Sukkela alleviivaus*, oletus päällä, pois käytöstä piilotettuna; teksti `.sukkela` kursiivilla, painolla 380 ja 1 px:n ruosteisella alleviivauksella, käyttäjän valinta G kahdeksasta 29.10.2026; pois käytöstä viiva on harmaa kuten muukin) ja
    *Aikajana* Pääluvut / Alaluvut (oletus 21.10.2026 alkaen; ennen sitä hetken Kaikki) / Kaikki sekä kirjanmerkit ja
    edistyminen. Tasot ovat kumulatiivisia: *Alaluvut* sytyttää myös *Pääluvut*, *Kaikki* molemmat. Valitun tason napautus sammuttaa sen ja jättää ylemmät (*Pääluvut* sammuttaa kaikki etapit, `janaTaso: 0`); muu napautus asettaa tason (käyttäjän kokeilu 21.10.2026). Vanhat tallennetut asetukset vaihdetaan kerran uusiin oletuksiin (`av: 2` sukkela alleviivaus,
    `av: 3` Kaikki → Alaluvut; itse valittu Pääluvut säilyy).
  - *Ulkoasu*-osiossa heti teeman jälkeen on *Liikkuminen* (Vieritys / Sivut; ennen nimellä *Näkymä* viimeisenä).
    Huomio *Viitenumerot näkyvät aina* poistettiin asetuksista (vaatimus itse pysyy). Vienti- ja tuontiosion napit: *Vie*, *Tuo* (ei sanaa *tiedot*; käyttäjän päätös 21.10.2026).
  - Edistyminen on vain alapalkissa, ei avatun aikajanan ylärivillä. Sivunäkymässä se on sivunumero.
  - *Merkinnät*-listassa alleviivauksia ei koskaan alleviivata; alleviivaus näkyy vain tekstissä itsessään.
    Listan molemmat osiot (*Kirjanmerkit*, *Alleviivaukset ja kirjaukset*) supistuvat otsikon perässä olevasta pienestä
    salmiakista (täynnä auki, ontto kiinni); tila muistetaan (`kmKiinni`, `alKiinni`). Avattuna asettelu pikselilleen ennallaan.
  - Valinnan valikko: *Alleviivaa | Kirjaa | Kopioi |* kuparinen nauha (12 × 20 px, ei sanaa *Kirjanmerkki*).
    Käyttäjän päätös 21.10.2026: valikoissa ikonit tekstien sijaan (`ikNappi`, nimi `aria-label`/`title`):
    alleviivaa = *Abc* 3 px:n ruosteisen viivan päällä (liioiteltu tarkoituksella), kirjaa = täytetty lyhyt
    paksu kynä 45°, oikea yläpää suora ja vasen alapää kärki, kopioi = kaksi lomittaista suorakaidetta ilman
    tekstiviivoja, molemmat yhtenäisviivaisia (ei haamutusta; käyttäjän päätös 22.10.2026), poista alleviivaus = sama viiva ja *Abc*:n paikalla raksi.
    Kopioinnin kuittaus on rasti. Kirjauksellisen alleviivauksen poiston vahvistus (käyttäjän päätös 22.10.2026,
    `varmistaAlPoisto()`): napparivin tilalle iso nappi, jossa poiston ikoni ja yliviivattu kynä (`IK_POISTA_KIR`) sekä
    ruosteinen *Poista myös kirjaus?*, ja oikealla *älä!* (pienellä, huutomerkillä; käyttäjän valinta, ei *Ei*), joka
    palauttaa valikon. *älä!* on kursiivilla ja `--harmaa`, koska peruutus on hiljaisempi kuin poisto (22.10.2026).
    Rivivalikon leveys tulee napeista eikä kirjauksen esikatselusta (`contain: inline-size`; käyttäjän päätös 22.10.2026,
    ennen esikatselu levitti alleviivausvalikon 352 px:iin ja jätti aukon nappien oikealle puolelle); alleviivausvalikossa
    esikatselu katkeaa neljännelle riville, poiston vahvistuksessa ei. Kirjauksen esikatselu yliviivataan ruosteella; ison napin napautus ohitetaan 400 ms (tuplanapautus).
    *Merkinnät*-listan poisto kysyy edelleen *Vahvista*.
    **Kirjaus** on alleviivaukseen liitetty muistiinpano (`h.n`); laatikko kasvaa tarpeen mukaan, raja 5 000
    merkkiä ja jäljellä oleva määrä näkyy. Käyttöliittymässä sana on aina *kirjaus* (käyttäjä puhui myös muistiinpanoista).
  - Asetusten alimpana ovat erilliset supistetut osiot *Vie merkinnät tekstitiedostoon* ja *Tuo merkinnät tekstitiedostosta*
    (käyttäjän päätös 21.10.2026), joita edeltää johdanto *Luettuun muodostuneet merkinnät ovat tallessa vain tämän selaimen muistissa…* (asetusten huomiota *Asetukset koskevat kaikkia tekstejä* ei ole). Reunojen oletus on *Tasattu* (käyttäjän päätös 21.10.2026; jo tallennetut asetukset säilyvät, koska valintaa ei voi erottaa oletuksesta).
    Napit ovat pelkät *Vie* ja *Tuo*, ja ilman valintoja niitä ei voi painaa. Vienti vahvistetaan aina ponnahduslaatikossa;
    tuonti vain, jos kaikkea ei ole valittu (silloin kerrotaan, mitä tiedostosta ei tuoda). Viennin oletus on
    alleviivaukset ja kirjaukset (`av: 4` vaihtaa vanhan oletuksen kerran); tuonnissa kaikki valittuna aina asetuksia avattaessa,
    ei muisteta. Viennin valinnoista viimeisenä on *Edistymisen tilanne* (oletuksena pois: otsikon alle `Viety:` ja
    `Sijainti:` otsikon tarkkuudella, ei tarkemmin). Muotosäännöt (`merkinnatMd()`): otsikot tekstin hierarkian mukaan
    vain osioille, joissa on vietävää, saman osion merkinnät `---`:llä erotettuina; `KIRJANMERKKI n`, jonka perään virke
    vain jos alleviivauksia ei viedä; kirjaus lainauksen jälkeen; pelkät kirjaukset luettelona.
  - **Tuonti** (`tuoMerkinnat()`, käyttäjän pyyntö 21.10.2026: ei virallista tiedostomuodon tunnistetta, vientiä muutetaan
    vain sen verran kuin tuonti ehdottomasti vaatii). Vientiin tuli kaksi lisää: osiossaan toistuvan lainauksen ensimmäisen
    rivin perään `[n/m]` ja kirjanmerkin perään esikatselussa näkymätön `<!-- kohta: katkelma -->`. Tiedosto tunnistetaan
    `#`-otsikosta ja rivistä *Luetun merkinnät*, osiot tekstin otsikoista. Vanhasta viennistä (ilman näitä) tuodaan
    kirjanmerkit likimäärin. Säännöt: `luin/ohje.md`, luku 4.6.
    Onnistunut tuonti (käyttäjän pyyntö 22.10.2026, `naytaTuotu()`) avaa Tuo-napin päälle kuittauksen (ruosteinen rasti,
    *Merkinnät tuotu*, *Palaa tekstiin*, *Katso merkinnät listasta*), jotta nappia ei paineta uudestaan. Tuotu sijainti on
    kyltti: ruosteinen kehys, *Jatka siitä, mihin jäit* ja osion nimi, täytetty ruosteinen pää, jonka kolmio osoittaa suuntaan
    kuten paluumajakassa. Tilarivin kursiivin seassa ollut ruosteinen linkki ei erottunut; tilarivi jää kuittauksen alle.
Tehdyt ratkaisut, jotka näyttävät oudoilta mutta ovat mitattuja (`luin/kehitys/testi.js` tarkistaa ne):
- `kohdanLaatikko` ottaa merkin laatikoista **viimeisen**: tavutusrajan jälkeisen merkin ensimmäinen
  laatikko on Chromiumissa edellisen rivin lopun tavuviiva (6,7 px, edellisellä sivulla).
- Vierityksen kohta on rivi, jonka **keskikohta** on y = 70 (`YLA`), ja `mene()` vierittää merkin
  keskikohdan samaan: yläreunaa käytettäessä otsikon riviltä luettiin edellinen rivi (laatikot
  päällekkäin, line-height 1,25), ja kohta ajautui joka kokomuutoksella rivin ylöspäin.
- Sivutettuna kohdassa voi olla `ed`: sivu ilman tekstilohkoja (sisällysluettelo, voi olla
  monisivuinen) ankkuroidaan seuraavan lohkon alkuun `ed` sivua ennen sitä.
- Sivutettuna `hr.ennen-lukua` (--- juuri ennen ##-otsikkoa) piilotetaan: pääluku alkaa uudelta
  sivulta, ja viiva jäi muuten yksin omalle sivulleen.
- Väriperiaate (käyttäjän päätös 21.10.2026): ruoste = napautettava. Sisällysluettelon linkit ovat kokonaan ruosteella (numero ja teksti; kokeilu, vain numerot ruosteella oli vaihtoehto), otsikkolohkon tietorivit (`.meta`) kursiivia ja alaviitteet (`--huomio`, vaalea #74624a, tumma #a69272) hiukan harmaampia kuin `--harmaa`, mutta kontrasti ≥ 4,9.
- **Lainausten väri** (käyttäjän päätös 27.10.2026: lainaus ei erottunut nopeasti vieritettäessä): `blockquote` on värillä `--sitaatti`, 70 % musteesta harmaaseen Lab-avaruudessa (vaalea `#514331`, kontrasti 8,8; tumma `#c2af94`, 9,0). Käyttäjä valitsi kolmesta näytteestä (0, 50, 70 %) haaleimman.
- Vierityksessä pelkkä ikkunan korkeuden muutos ei aseta tekstiä uudelleen (mobiilin osoiterivi).
- **`tavutaPitkat()` mittaa ensin kaikki ja kirjoittaa vasta lopuksi** (luokka `mittaus` = `overflow-wrap: normal`). Älä palauta
  tyylin tai tavuviivan kirjoitusta mittausten väliin: se pakotti joka otsikolla koko tekstin uuden asettelun, ja sivutettuna
  jokainen asetuksen napautus kesti Dewey-leikkeellä 3,3 s (4-kertaisesti hidastettuna 17 s; käyttäjä: "todella hidasta").
  Samasta syystä `sovellaAsetukset()` asettelee vain `ASETTELU`-listan asetuksilla; muut piirtävät vain palkit (`paivita()`).
- **Tavutuskiellot** (käyttäjän päätös 22.10.2026): otsikoissa (h1–h6), alaotsikossa (`.sub`), tietoriveillä (`.meta`), sisällysluettelossa, lihavoinneissa, taulukon otsikoissa ja kuvateksteissä ei ole pehmeitä tavuviivoja (`OHITA` md.js:ssä), ellei yksittäinen sana ole palstaa leveämpi. **Kirjallisuusluettelo (`p.bib`) ei tavuta lainkaan** (käyttäjän päätös 28.10.2026; Teologian tyyli ja APA 7: ei tavutusta, DOI ja osoite katkeavat vain ilman lisättyä viivaa): `.bib` on `OHITA`ssa, se ei ole `tavutaPitkat()`in kohteissa (ylipitkä sana katkeaa viivatta, `overflow-wrap: anywhere`), ja selaimen tavutustilassa sillä on `hyphens: manual`. Mitattu tutkielmalla: luettelon pehmeät viivat 81 → 0 (tiheä 337 → 0), vierityksessä 0–5 riviä lisää, muu teksti merkilleen sama. Silloin `tavutaPitkat()` (luin.html, kutsutaan `asettele()`ssa) lisää viivat vain siihen sanaan ja poistaa ne, kun palsta levenee; `overflow-wrap: break-word` kattaa sanat, joita ei voi tavuttaa. Mittaus tehdään tilapäisesti `overflow-wrap: normal`illa, koska `break-word` katkoisi sanan jo mittaushetkellä (mittari oli ensin viallinen juuri siksi). Mitattu Chromiumissa 320 px: viivoja vain pitkissä sanoissa, 1280 px: ei yhtään; `testi.js` ennallaan (40 OK, samat kaksi ennestään olevaa VIKAa).
- Tavutus luokittelee rajat; varovainen tila jättää pois vokaalin ja yksinäisen konsonantin välisen
  rajan, koska yhdyssanavirheet (*kansalai-soikeus*) ovat aina sitä tyyppiä. ie/uo/yö ovat diftongeja
  myös ensitavun jälkeen paitsi monikon genetiivissä (*talvi-en*). Kursiivia ei tavuteta.
Kandidaatintutkielma on **väliaikaisesti** repossa (käyttäjän lupa 20.10.2026: "voit laittaa väliaikaisesti
tutkielman nettiin"): `luin/tekstit/kant-ja-elainetiikka.md` (etukenttä + alkuperäinen md muuttamattomana),
lukulistan linkki *Kokeiluteksti: Kant ja eläinetiikka* ja `robots.txt` (`Disallow: /luin/tekstit/`). Kun käyttäjä
sanoo kokeilun päättyneen, poista kansio, linkki ja robots.txt:n rivi. Muita käyttäjän tekstejä ei viedä repoon
ilman erillistä lupaa.
Käyttäjän lupa 25.10.2026 (kiire, ei aikaa siirtotavan rakentamiseen): `luin/tekstit/dialectic-of-enlightenment.md`
(verkosta kopioitu katkelma sellaisenaan, ilman etukenttää ja lukulistan linkkiä; avataan osoitteesta
`luin.html#u=luin/tekstit/dialectic-of-enlightenment.md`). Väliaikainen kuten tutkielma; pysyvä siirtotapa on avoin (opas, luku 9).

### Alatunnisteen ©-merkki

Alatunnisteen yleissääntö on juuren CLAUDE.md:n osiossa *Alatunniste*.
Luinin sivuilla (`luin.html`, Latomo, Latomon ohje, käyttöohje) ©-merkki on SVG (käyttäjän pyyntö 29.10.2026):
suora salmiakki (920 × 920 fonttiyksikköä, viiva 58) ja sen sisällä Literatan oman ©-merkin (`copyright`) sisempi C
sellaisenaan, fontin koossa. Ensimmäinen versio (koverakylkinen salmiakki ja itse piirretty C, jonka terävät
häntäpäät) hylättiin: C:tä ei tunnistanut, se oli liian iso salmiakkiin nähden, ja koverat kyljet ahdistivat sitä.
Keskikohta on versaalin keskilinjalla (mitattu pikseleistä, ero 0,25 px eli yksi laitepikseli DPR 4:llä), ja
rivin korkeus pysyi ennallaan; `aria-label="©"`. Muiden ohjelmien alatunnisteissa on tavallinen ©.
