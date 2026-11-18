# Luin: sivustoehdokkaat, toinen satsi (mitattu, aiheittain)

Hyllyyn 17.11.2026. Jatkoa tiedostolle [luin-sivustoehdokkaat.md](luin-sivustoehdokkaat.md), jonka nimiä tässä ei
toisteta (viittaukset muotoa *vanhalla listalla*). Mitään ei ole toteutettu.

Käyttäjän pyyntö: uusi satsi maailman parhaita lukimelle sopivia sivuja, ja tarkistus, löytyykö jalokiviä näiltä aloilta:
sosiologia ja sosiaalipsykologia, historiantutkimus, folkloristiikka, kielitiede, kirjallisuustiede, antiikintutkimus,
assyriologia, Persian imperiumi, orientin tutkimus, feminismi, ilmastoasiat, kirjailijaskene ja kirjoittaminen
(kaunokirjailijat toisilleen ja kiinnostuneelle yleisölle), renessanssihumanismi Firenzestä ja Medicien ajasta Vicoon,
kriittinen teoria, eksistentialismi, esisokraatikot, oikeus ja lääketiede (käyttäjä epäili, taipuuko humanistiselle
lukimelle). Aiheiden ei tarvitse olla sivuston nimessä; SEP-tason hakuteokset ovat plussaa.

Kriteerit:
1. Ei kirjautumisympäristöjä. Substack-kirjoittajia ei tähän (käyttäjä ei ole vakuuttunut siitä tiestä).
2. Ei kuvien ja kaavioiden varassa olevia.
3. Ei pelkän mainosrahoituksen varassa olevia ilman lahjoitusmahdollisuutta.
4. Ei pääosin lyhyiden juttujen sivustoja.
5. Siisti ja helposti kopioitava teksti ei sulje pois: pituus on jo itsessään peruste.

## Tehty ja ohitettu (pahvi *10 sivustosovitetta*, 18.11.2026)

- Oikeustapaukset: EUR-Lex ja Find Case Law tehty 18.11., PR #867. BAILII ja AustLII ohitettu (kontin esto: Anubis, 403).
- PubMed Central tehty 18.11., PR #868. NCBI Bookshelf testaamatta (reCAPTCHA heti), sovite ei kata sitä.
- Ubiquity Press tehty 18.11., PR #869 (IRSP, Utrecht Law Review, JOPD, Journal of Cognition).
- SPIP tehty 18.11., PR #870 (Vacarme, La Vie des idées, Books & Ideas, LMSI, remue.net).
- Political Concepts tehty 18.11., PR #871.
- Project Vox tehty 18.11., PR #872 (käännökset ovat HTML:nä ja menevät samalla sovitteella).
- Embryo Project tehty 18.11., PR #873 (yleinen leikkaus lähes riitti; sovite tekijöille, lähteille ja päivälle).
- Cuneiform Digital Library Journal tehty 18.11., PR #874; sama sovite kattaa CDLB:n ja CDLN:n.
- Журнальный зал tehty 18.11., PR #875. Venäjän tavutus puuttuu md.js:stä (kyrillinen teksti näkyy tavuttamatta): tarve kirjattu.
- Fabula (Acta fabula ja LhT) tehty 18.11., PR #876: oma sovite OpenEditionin Lodel-apufunktioilla, koska OpenEdition-sovitteen tunnistus ei osu.
- Folktexts (varakohde 11) tehty 18.11., PR #877.
- A Celebration of Women Writers (varakohde 12) tehty 18.11., PR #878: yleinen leikkaus ei riittänyt (taulukot raakana HTML:nä).
- Storm's Commentary on Kierkegaard (varakohde 13): yleinen leikkaus riittää (puuttuu tekijä D. Anthony Storm, otsikko on sivuston nimiö *Kierkegaard, D. Anthony Storm's Commentary on*, Previous/Next Work -linkit jäävät).
- Center for Hellenic Studies (varakohde 14) tehty 18.11., PR #879: Classical Inquiries ja Classics@; CHS Online Books ovat esittelysivuja, ei tekstiä.
- Zeithistorische Forschungen (varakohde 15) tehty 18.11., PR #880.
- BOMB (varakohde 16) tehty 18.11., PR #881: mainokset (Broadstreet) ja lahjoitukset, rahoitushuomautus.
- PsychOpen GOLD (varakohde 17): nykyinen OJS-sovite ei ottanut iframe-galleriaa (oma JATS-renderöinti); oma sovite tehty 18.11., PR #882.

## Miten mitattu

Toisin kuin ensimmäinen lista, tämä on mitattu. Pilvikontista 17.11.2026 curlilla ja skriptillä: tila, ohjaukset,
botintorjunta, generaattori ja alusta, mainosverkkojen ja lahjoitussivujen merkit sekä tekstin pituus. Etusivulta
haettiin lisäksi enintään neljä artikkelin näköistä linkkiä, ja tärkeimmille haettiin artikkelisivu käsin. Yhteensä noin
300 sivua.

- **Sanat** tarkoittaa näytesivun `<p>`-kappaleiden sanoja (vähintään 8 sanan kappaleet; script, nav, header ja footer
  pois). Se on leipätekstin karkea mitta. Blogissa luvussa ovat mukana kommentit, ja luettelosivulla otteet.
- **Mainokset ja lahjoitukset:** tunnistus säännöllisillä lausekkeilla oli epäluotettava. Mainosverkkojen nimiä on
  evästevalitsimien toimittajaluetteloissa, ja sama sivu antoi eri hauilla eri koodin (Eurozine, Nursing Clio).
  Mainokset on kirjattu vain, kun ne näkyivät sivun rakenteessa (Treccani, Elpenor, CyberLeninka, BMJ:n blogit).
  Muiden rahoitus tarkistetaan sovitetta tehtäessä (luin.md, *Rahoitushuomautus*).
- **Pilvikontin esto ei estä käyttäjää.** Lisäosa lukee sivun käyttäjän selaimessa. Esto (403, 429, Cloudflare,
  Anubis, F5, katkennut varmenneketju) vain hidastaa sovitteen tekoa ja todentamista, kuten Pressbooksissa ja OECS:ssä.
  Tällaiset on merkitty *ei mitattu* ja syy.
- Wayback Machinen kautta mittaaminen estettiin tässä istunnossa. Estetyistä on siksi vain muistitieto tai haun tieto.

## Mitä noin 50 sovitetta opettivat: otollisin sivusto

Vanhan listan tehdyistä ja ohitetuista näkyy, missä lukin parantaa lukemista eniten:

1. **Lukukokonaisuus on pidempi kuin yksi sivu.** Kirja luvuittain (dhammatalks, Pressbooks, Manifold, Open Book
   Publishers, LacusCurtius, Tertullian, New Advent). Sovite kokoaa sen, minkä Readability pilkkoo.
2. **Tieteellinen koneisto:** alaviitteet, kirjallisuus, tiivistelmät, sivu- ja kappalenumerot (OpenEdition, Janeway,
   SciELO, NDPR, BMCR, Perseus). Readability hukkaa ne tai tekee niistä linkkiketjuja.
3. **Esseelehti nostolainauksineen** (Noema, Emergence, Psyche, Il Tascabile, 3:16). Readability toistaa nostot kesken
   kappaleiden.
4. **Alusta voittaa sivuston.** Yksi sovite monelle: OJS, Pressbooks, Manifold, Janeway, OpenEdition, Hypotheses,
   ForumMagnum, Wikipedia ja Wikisource kielittäin.
5. **Palvelin renderöi tekstin.** JavaScript-sovellus jää pois (Joyce Project, SuttaCentral, Scaife).
6. **Pdf-galleria ja skannaus eivät käy.** OJS:n arvo on HTML-galleriassa, joka on vähemmistö.
7. Kun yleinen leikkaus riittää (WordPress, Deutschlandfunk, On Being, Marginalian), sivusto on silti hyvä lukimelle,
   mutta sovitetta ei tarvita. Silloin riittää kirjaus *yleinen leikkaus riittää*.

Jalokivi on siis pitkä, palvelimen renderöimä teksti, jossa on koneistoa tai joka jakautuu sivuille, mieluiten alustalla,
joka toistuu monella sivustolla. Tämän listan kärki on valittu sillä mitalla.

## Kärki: 17 ensimmäistä

Mitattu 17.11.2026, ellei toisin mainita.

| # | Sivusto | Ala | Mitattu | Miksi |
|---|---|---|---|---|
| 1 | **PubMed Central** ja **NCBI Bookshelf** (pmc.ncbi.nlm.nih.gov) | lääketieteen historia, etiikka, antropologia | PMC6334128: 3 714 sanaa, JATS | Alusta: kaikki avoimet lääketieteen artikkelit samana JATS-HTML:nä, viitteet ja tiivistelmät. Haun mukaan Bookshelfissä on myös Brillin ja Wellcomen avoin *A Literary History of Medicine* (Ibn Abī Uṣaybiʿa, käännös ja esseet). Vastaus lääketiedekysymykseen, ks. alla. |
| 2 | **Oikeustapaukset**: EUR-Lex, Find Case Law (UK), LII-perhe | oikeus | Schrems I (C-362/14): 14 191; UKSC 2024/12: 18 991 | Pitkä teksti, numeroidut kappaleet (kuten Perseuksen pykälät viitenumeroiksi). BAILII ja AustLII ovat samaa LII-perhettä (yhteinen ohjelmisto (?); kontissa Anubis ja 403). |
| 3 | **Ubiquity Press** -alusta | sosiaalipsykologia, oikeus, arkeologia ym. | IRSP: 9 169; Utrecht Law Review: 14 937 | Next.js, mutta palvelin renderöi; JATS-merkinnät. Yksi sovite monelle avoimelle lehdelle. |
| 4 | **SPIP**-alusta | ranskalaiset ajatus- ja kirjallisuuslehdet | Vacarme: 5 507; remue.net: 4 023; LMSI: 2 486 | La Vie des idées (vanhalla listalla) ja Books & Ideas ovat samaa SPIP 4.4:ää. lundi.am: 9 775 (alustaa ei tunnistettu). |
| 5 | **Political Concepts: A Critical Lexicon** (politicalconcepts.org) | kriittinen teoria, poliittinen teoria | 8 464 | Käsitehakuteos pitkin artikkelein; lähin kriittisen teorian SEP. WordPress, joten mittaa ensin yleinen leikkaus. |
| 6 | **Project Vox** (projectvox.org, Duke) | feminismi, renessanssi ja varhaismoderni | Tullia d'Aragona: 20 371 | Naisfilosofit 1500–1700-luvuilta, elämäkerta, teokset, käännökset, kirjallisuus. |
| 7 | **Embryo Project Encyclopedia** (embryo.asu.edu) | lääketieteen ja biologian historia, oikeus, feminismi | Roe v. Wade: 4 990 | SEP-tason hakuteos, Drupal 10. |
| 8 | **Cuneiform Digital Library Journal** (cdli.earth) | assyriologia | 2026-2: 18 527 | Vertaisarvioitu lehti HTML:nä, ei pdf:nä. |
| 9 | **Журнальный зал** (magazines.gorky.media) | kirjailijaskene (venäjä) | Новый журнал 2021/305: 30 819 | Venäläisten kirjallisuuslehtien (Новый мир, Знамя ym.) arkisto tekstinä. |
| 10 | **Fabula**: *LHT* ja *Acta fabula* | kirjallisuustiede (ranska) | LHT document21061: 3 666 | Kirjallisuusteorian lehti ja pitkät arviot; JATS-merkinnät. |
| 11 | **A Celebration of Women Writers** (digital.library.upenn.edu/women) | feminismi, kirjallisuus | Anne Finch 1713: 57 187 | Naisten kirjoja kokonaisina sivuina, pelkkää HTML:ää. Yleinen leikkaus todennäköisesti riittää. |
| 12 | **Folktexts** (D. L. Ashliman, Pitt) | folkloristiikka | tyyppi 1430: 9 284 | Kansantarinoita satutyypeittäin koottuina, pelkkää HTML:ää. |
| 13 | **Mediations**, **Endnotes**, **boundary 2 online**, **Platypus Review**, **Contretemps** | kriittinen teoria | 11 487; 5 722; 8 677; 11 242; 10 261 | Pitkiä teoreettisia tekstejä, osa alaviitteineen. |
| 14 | **BOMB Magazine** (bombmagazine.org) | kirjailijaskene | 2007-haastattelu: 6 520 | Taiteilija haastattelee taiteilijaa: kirjailijat toisilleen, kirjaimellisesti. |
| 15 | **Center for Hellenic Studies**: Classical Inquiries, Classics@ | antiikki | Classical Inquiries: 23 884 | Nagyn ym. pitkät esseet; CHS Online Books (vanhalla listalla) samaa taloa, joten yksi CHS-sovite. |
| 16 | **Ganjoor** (ganjoor.net) | Persia | Šāhnāme, alku: 20 586 | Persian klassinen runous laajasti, lahjoituksin. Oikealta vasemmalle: testaa lukimen tuki ensin. |
| 17 | **Zeithistorische Forschungen** (ZZF Potsdam) | historia (saksa) | 4 316 | Pitkiä artikkeleita alaviitteineen; Docupedia (vanhalla listalla) samaa taloa. |

## Aiheittain

Merkinnät: *mitattu* = sanat näytesivulla; *ei mitattu* = kontti ei päässyt sivulle (syy perässä); *(?)* = muistitieto.

### Sosiologia, sosiaalipsykologia, yhteiskuntatieteet

**Jalokivi?** Avointa SEP-tason sosiologian hakuteosta ei ole. ISA:n *Sociopedia* on jäsenetu (kontissa 522), MDPI:n
*Encyclopedia* (encyclopedia.pub) on kirjava ja kontissa 403. Lähimmät: Political Concepts (kärjessä) ja Open
Encyclopedia of Anthropology (vanhalla listalla). Lehdissä ja aikakauslehdissä jalokiviä on.

- **International Review of Social Psychology** (Ubiquity): 9 169. Kärjen alustasovitteen ensimmäinen testi.
- **Social Psychological Bulletin** ja **Journal of Social and Political Psychology** (PsychOpen GOLD, ZPID; OJS 3.1):
  HTML-galleria iframessa (`#article-html-frame`), 11 175 sanaa. Kokeile ensin nykyistä OJS-sovitetta.
- **Sociologica** (Bologna, OJS 3.3): HTML-galleria 7 432 sanaa, rinnalla pdf. Kokeile ensin OJS-sovitetta.
- **In-Mind Magazine** (sosiaalipsykologia yleistajuisesti, useita kieliä; Drupal 11): 3 041.
- **Items** (SSRC; WordPress): 3 287.
- **Global Dialogue** (ISA:n lehti, kymmeniä kieliä): 3 172.
- **Books & Ideas** (La Vie des idéesin englanninkielinen sisar; SPIP): ks. kärki 4.
- **The Sociological Review Magazine**: 1 970 (keskustelu).
- **Politiikasta.fi** (Valtiotieteellinen yhdistys; WordPress): 4 630. Suomenkielinen.
- **Discover Society** (arkisto; WordPress): etusivulla 14 445 sanaa pitkiä otteita, artikkelia ei mitattu.
- **Eurozine** (eurooppalaisten kulttuurilehtien verkosto): 3 170–4 236. Osassa hauista Ezoicin ja AdSensen koodia,
  osassa ei: tarkista mainokset ennen sovitetta.
- **openDemocracy** (Ghost): artikkelia ei mitattu. Social Europe: 2 219, mahdollinen jäsenmuuri (?).
- Ei mitattu: Dissent (403), Noba Project (avoimen psykologian oppikirjamoduulit, botintorjunta), Behavioral Scientist
  (botintorjunta, mutta 2 898 sanaa tuli).

### Historiantutkimus

**Jalokivi?** Kyllä, useita.

- **Zeithistorische Forschungen**: kärjessä.
- **Origins: Current Events in Historical Perspective** (Ohio State; Drupal 11): 3 755–4 386.
- **EHNE, Encyclopédie d'histoire numérique de l'Europe** (Sorbonne; fr, en; Drupal 11): 1 663. Hakuteos.
- **Mass Violence and Resistance** (Sciences Po; Gatsby, palvelin renderöi): 1 898. Hakuteos.
- **Reviews in History** (IHR): ei mitattu (403). Haun mukaan julkaisee yhä (uusin arvio 26.8.2026), ei mainoksia
  näkyvissä. NDPR-sovitteen kaltainen työ.
- **Svenskt biografiskt lexikon** (Riksarkivet): 880–2 493. **Svenskt kvinnobiografiskt lexikon** (skbl.se; sv, en):
  Ellen Key 1 991. **Dictionary of Welsh Biography**: 1 178.
- **Contingent Magazine** (WordPress): pitkiä esseitä (luettelosivu 5 382). **Black Perspectives** (AAIHS): 1 942.
  **Nursing Clio** (sukupuolen ja lääketieteen historia): 1 729.
- Ei mitattu: Te Ara (403), Perspectives on History (403), S-USIH (403), Not Even Past (varmenneketju), Themenportal
  Europäische Geschichte (Anubis), Diccionario Biográfico Español (etusivulla ei tekstiä; artikkelia ei mitattu).

### Folkloristiikka

**Jalokivi?** Aineistossa kyllä (Folktexts), hakuteoksena ei. Avointa folkloristiikan hakuteosta ei löytynyt. Open
Folklore (AFS) on linkkiportaali.

- **Folktexts**: kärjessä.
- **Oral Tradition** (Harvardin CSOT; WordPress): 10 060 sanaa artikkelissa.
- **Folklife Today** (Library of Congressin blogi): 2 933.
- **Folklore: Electronic Journal of Folklore** (Tartto): uudet numerot pdf:nä, vanhimmat HTML:nä pieninä sivuina (vol1:n
  sivu 111 sanaa). Ei sovitetta.
- Janewayn kautta mahdollisesti jo katettu: Ethnologia Europaea (OLH:n alustalla (?); kontissa 502).
- Ei mitattu: Smithsonian Folklife Magazine (403), Cultural Analysis (502). New Directions in Folklore (OJS): pdf.

### Kielitiede

**Jalokivi?** Ei SEP-tason hakuteosta: haku löysi vain wikit (Glottopedia, Linguapedia) ja maksulliset hakuteokset.
Kielitiede on lehtien ja blogien varassa, ja paras lehti (Glossa) on jo katettu Janewaylla.

- **Sprachlog** (Stefanowitsch ym.; WordPress 6): 7 359 etusivulla, kirjoitukset kokonaisina.
- **De Gruyter Brill, avoimet artikkelit** (esim. *Open Linguistics*; HTML): lehden sivu 1 487, artikkelia ei mitattu.
  Alusta kattaisi myös vanhan listan Open Philosophyn ja Open Theologyn.
- **Early Indo-European Online** (UT Austin): 1 366. Oppitunnit ovat tekstikatkelmia ja kielioppitaulukoita, joten
  rajatapaus (kriteeri 2).
- Karsitut: Glottopedia (lyhyet), Language Hat (lyhyet kirjoitukset, sanamäärä tulee kommenteista: 14 450),
  Semantics and Pragmatics (pdf).
- Ei mitattu: Lingthusiasmin litteraatiot (403), Arnold Zwickyn blogi (403), MDPI:n Languages (403).

### Kirjallisuustiede

**Jalokivi?** Ranskaksi Fabula; englanniksi Post45, Electronic Book Review ja Modernism/modernity Print Plus (ei mitattu).

- **Fabula** (LHT, Acta fabula): kärjessä.
- **Post45** (WordPress): 10 105.
- **Electronic Book Review** (Astro): 11 557.
- **boundary 2 online**: 8 677. **Mediations**: 11 487. (Myös kriittisen teorian alla.)
- **Nordic Women's Literature** (pohjoismaisen naiskirjallisuuden historia; en, sv, da, no): ei mitattu (F5-botintorjunta).
- Ei mitattu: Modernism/modernity Print Plus (varmenneketju), Critical Inquiryn blogi (wordpress.com, 403), Revue critique
  de fixxion française contemporaine (botintorjunta). The Literary Encyclopedia on maksullinen.

### Kirjailijaskene ja kirjoittaminen

**Jalokivi?** Kyllä. Kirjailijat toisilleen: BOMB, Brick, Journal of Music & Literature; venäjäksi Журнальный зал.

- **BOMB Magazine**: kärjessä.
- **Brick** (Kanada; WordPress): Rushdie-haastattelu 6 644.
- **The Yale Review** (verkko ilmainen): Emily Ogden Poesta 6 739.
- **Music & Literature** (Squarespace): 5 567.
- **Full Stop**: 5 641. **AGNI** (Boston University): 4 121. **Craft** (proosan tekniikka): 2 923.
- **Журнальный зал**: kärjessä. **Горький** (gorky.media): 2 118. **Colta.ru**: 3 378–3 537.
- **remue.net** (SPIP): 4 023. **Nazione Indiana** (italialaisten kirjailijoiden kollektiivi): 3 178, lahjoitussivu
  *Donazioni*. **minima&moralia** (minimum fax): 4 699.
- **Revista de la Universidad de México** (UNAM): 2 463.
- **54books** (saksalainen kirjallisuuskenttä): 2 246. **Volltext**: 2 290 (mahdollinen tilausmuuri (?)).
- Osittain tilausmuurin takana (?): The Hudson Review (7 090), Image (5 247), World Literature Today (2 923),
  Bookforum (5 605), Kenyon Review. Tarkista näytteen ulkopuolelta.
- Ei mitattu: The Believer (403), The Rumpus (403), Ploughshares (yhteys katkesi). The Quarterly Conversation on lopettanut
  (verkkotunnus ei ratkea).

### Antiikintutkimus ja esisokraatikot

**Jalokivi?** Suurin osa on jo vanhalla listalla (Perseus, LacusCurtius, Latin Library, BMCR, Livius, ToposText).
Uusia: CHS (kärjessä) ja Roman Law Library.

- **The Roman Law Library** (droitromain.univ-grenoble-alpes.fr): Gaius, Digesta ja muu roomalainen oikeus latinaksi.
  Kehyssivu (`frameset`: `left.htm` ja `welcome.htm`), tekstisivuja ei mitattu.
- **Elpenor** (ellopos.net): AdSense- ja Amazon-mainokset, lahjoitusmerkki havaittu (tarkista): tapaus 2.
- **Esisokraatikot:** omaa jalokiveä ei löytynyt. Parhaat ovat jo katettuja tai vanhalla listalla: SEP, IEP, Burnetin
  *Early Greek Philosophy* Wikisourcessa ja Gutenbergissä, Dielsin *Fragmente der Vorsokratiker* Zenossa. Burnetin
  HTML-laitos Classic Persuasionissa (502) ja Heraclitus Fragments (katkesi; fragmentit lyhyitä) jäivät mittaamatta.
- Ei mitattu: Philological Museum (Sutton; uuslatinalaiset tekstit käännöksineen; varmenneketju), PHI Latin Texts (403),
  Pharos (Vassar; 403), SCS-blogi (403), Didaskalia (katkesi).

### Assyriologia

**Jalokivi?** Kyllä: CDLJ (kärjessä) ja ORACC:n esseeportaalit.

- **ORACC:n portaalit**: *Ancient Mesopotamian Gods and Goddesses* (AMGG), *Nimrud*, *Knowledge and Power in the
  Neo-Assyrian Empire*. Vanhan listan ORACC-merkintä (*rakenne monimutkainen*) koskee tekstikorpuksia; portaalien esseet
  ja jumalartikkelit ovat jatkuvaa tekstiä kirjallisuuksineen (?). Ei mitattu: oracc.museum.upenn.edu:n varmenneketju.
- Ei mitattu: Assyrian Empire Builders (UCL; 403).
- Karsitut: Electronic Babylonian Library (JavaScript-sovellus, 0 sanaa), Reallexikon der Assyriologie (pdf).

### Persian imperiumi

**Jalokivi?** Encyclopaedia Iranica (vanhalla listalla; kontissa estetty). Uusia:

- **Ganjoor**: kärjessä.
- **Avesta: Zoroastrian Archives** (avesta.org): Avesta ja pahlavikirjallisuus käännöksinä (?). Ei mitattu (429).
- **Persian Literature in Translation** (Packard Humanities Institute): Šāhnāme, Rumi, Hafez ja Sa'di englanniksi (?).
  Ei mitattu (403).
- **Abstracta Iranica** (Iranin tutkimuksen arviot): OpenEditionissa (journals.openedition.org/abstractairanica, 200),
  joten jo katettu.
- CAIS (cais-soas.com): etusivulla 62 sanaa; sisällön taso vaihtelee (?). Achemenet (katkesi): ARTA-artikkelit pdf:nä (?).

### Orientin tutkimus

- **China Heritage** (Geremie Barmé; WordPress): 9 886. Pitkiä esseitä ja käännöksiä.
- **Muslim Heritage**: 4 603. **Ajam Media Collective** (iranilainen ja persiankielinen kulttuuri): 3 157.
  **MERIP** (Ghost ja WordPress): 3 310. **Kyoto Journal**: 3 632.
- Jo katettu OpenEditionilla: REMMM, Arabian Humanities, Cahiers d'Asie centrale (?), Bulletin d'études orientales (?).
- Ei mitattu: Reading the China Dream ja Made in China Journal (botintorjunta), Silk Road Seattle (botintorjunta),
  ArabLit (403), Institute of Ismaili Studies (403), Digital Orientalist (403). Jadaliyya: HTML:ssä ei tekstiä etusivulla.

### Feminismi

**Jalokivi?** Kyllä: Project Vox, A Celebration of Women Writers, Svenskt kvinnobiografiskt lexikon, Embryo Project.

- **Project Vox**, **A Celebration of Women Writers**: kärjessä. **SKBL**: historian alla.
- **The Feminist Wire** (arkisto): 3 950. **Gunda-Werner-Institut** (Böll-säätiö): 2 645.
- **History of Women Philosophers and Scientists** (Paderborn): keskuksen sivusto, ei tekstikokoelma.
- Jo katettu: *Clio. Femmes, Genre, Histoire* ja *Genre & Histoire* (OpenEdition).
- Rajatapaus: Signs: Feminist Conversations (900, lyhyehköjä).
- Ei mitattu: Digitales Deutsches Frauenarchiv (Anubis), Victorian Women Writers Project (etusivu rakennetaan
  JavaScriptillä). Feminist Philosophy Quarterly ja Open Gender Journal (OJS): artikkeleita ei mitattu.

### Ilmastoasiat

**Jalokivi?** Ilmastotiede nojaa kaavioihin (kriteeri 2), mutta ympäristöhumanismi kantaa tekstinä.

- **Low-tech Magazine** (Hugo, staattinen): 2 793–5 980.
- **Long Now Foundation: Ideas**: 4 383.
- **Edge Effects** (Wisconsin): 2 243. **Seeing the Woods** (Rachel Carson Center): 1 895. **Environment & Society
  Portal**: 1 155.
- **Yale Environment 360**: 1 444. **Resilience.org**: 2 061. **Ilmasto-opas.fi** (Nuxt, palvelin renderöi): 2 068.
- Karsitut: RealClimate (70 430 sanaa tulee kommenttiketjusta, kirjoitukset kaavioiden varassa), Carbon Brief (kaaviot).
- Ei mitattu: Environmental Humanities (Duke; 403), IPCC:n raporttiluvut HTML:nä (403; osin kaavioiden varassa),
  Places Journal (403), Undark (403), Inside Climate News (403).

### Renessanssihumanismi Vicoon asti

**Jalokivi?** Philological Museum on alan jalokivi, mutta jäi mittaamatta. Muuten tekstit tulevat jo katetuilta
alustoilta: Wikisource (sovite tunnistaa kaikki kielet, sivunumerot mitattu en, de, la ja fi; it-Wikisourcessa
Machiavelli ja Vico (?)) ja Wikipedia-sovite, joka yleistettiin 17.11.2026 myös italiaan.

- **Project Vox**: kärjessä (Tullia d'Aragona, Cavendish, Conway).
- **Treccani** (Dizionario Biografico): Ficino 14 488 sanaa, mutta mainokset (`adv-azerion`) ja kappaleissa
  `paywall`-luokka, lahjoitusmahdollisuutta ei havaittu. Vanhalla listalla, mutta kriteerin 3 mukaan nyt karsittava.
- **Montaigne à l'œuvre** ja **Bibliothèques Virtuelles Humanistes** (Tours): etusivut mitattu, tekstisivuja ei.
- Biblioteca Italiana: etusivulla 0 sanaa, tekstisivuja ei mitattu. Galileo Project (Rice): etusivu 161.
- Karsittu: Medici Archive Project (tutkimushanke, ei tekstikokoelma).
- Ei mitattu: Decameron Web (Brown; katkesi), ISPF:n Vico-portaali (403), Renaissance Mathematicus (wordpress.com, 403).

### Kriittinen teoria

**Jalokivi?** Kyllä, ala on vahva.

- **Political Concepts**: kärjessä. **Mediations**, **Endnotes**, **boundary 2 online**, **Platypus Review**,
  **Contretemps**: kärjessä.
- **Mute** (Drupal): 3 440. **Marx & Philosophy Review of Books**: 1 933. **Logos**: 3 528. **The Philosophical Salon**:
  3 332. **Spectre**: 4 906. **Période** (WordPress): etusivu 1 704. **Kritiknetz** (saksa; Joomla): 1 851.
- **New Left Review**: 6 925 vapaassa artikkelissa, mutta useimmat ovat tilaajille (?).
- Karsittu: Krisis (pdf). Ei mitattu: Critical Times (Duke; 403).

### Eksistentialismi

**Jalokivi?** Ohut ala SEP:n ja IEP:n ulkopuolella. Yksi löytyi.

- **D. Anthony Storm's Commentary on Kierkegaard** (sorenkierkegaard.org): 3 110 sanaa teosta kohti, jokaisesta teoksesta
  oma sivunsa.
- Camus: Société des études camusiennes (WordPress, 940) ja Camus Society (Squarespace, 1 406).
- **Lev Shestov Archive** (shestov.phonoarchive.org): verkkotunnus on kaapattu, ja sivu ohjaa mainossivustolle. Pois.
- Ei mitattu: Existenz (Karl Jaspers Society; 429).
- Tekstit tulevat jo katetuilta alustoilta (Gutenberg, Wikisource) ja vanhan listan Nietzsche Sourcesta ja SKS:stä.

### Oikeus

**Jalokivi?** Kyllä. Oikeustapaukset (kärki 2) ovat lukimelle otollisimpia: pitkiä, palvelimen renderöimiä ja numeroituja.

- **Verfassungsblog** (de, en; WordPress): 1 744–4 014. **EJIL:Talk!**: 1 814. **Völkerrechtsblog**: 2 156.
  **LPE Project**: 1 370. **JOTWELL**: 2 384. Yleinen leikkaus todennäköisesti riittää.
- **Yale Law Journal**: 6 683. **Utrecht Law Review** (Ubiquity): kärjessä.
- **Rechtsgeschichte – Legal History** (Max Planck, OJS 3.3): HTML-galleriat 1 371–1 597. Kokeile OJS-sovitetta.
- **Legal Theory Lexicon** (Solum): Typepad suljettiin 30.9.2025; uusi osoite haun mukaan legaltheorylexicon.com.
  Ei mitattu (403).
- **Finlex, KKO:n ennakkopäätökset**: HTML:ssä 28 sanaa, joten teksti tulee JavaScriptillä. Testaa selaimessa.
- Ei mitattu: BAILII (Anubis), AustLII (403), CourtListener (JavaScript-haaste), Lawfare (403), Legal Form (403).
  NLNRAC: etusivulla 0 sanaa.
- Roomalainen oikeus: antiikin alla.

### Lääketiede

**Taipuuko?** Kyllä, kun lääketiedettä luetaan historiana, etiikkana, antropologiana tai kertomuksena. Kliininen
viiteteksti (StatPearls ym.) ei ole lukimen lajia: se vanhenee, ja sitä haetaan eikä luettaisi. PubMed Central on
hyvä kompromissi: sama alusta kantaa sekä *Medical Historyn* kaltaiset avoimet humanistiset lehdet että kliiniset,
eikä sovitteen tarvitse erotella niitä.

- **PubMed Central** ja **NCBI Bookshelf**: kärjessä. **Embryo Project**: kärjessä.
- **The Polyphony** (Durhamin Institute for Medical Humanities): 2 374. **Hektoen International**: 2 460.
- **Wellcome Collection: Stories** (Next.js): 1 687 videoartikkelissa, toinen artikkeli 429.
- **Intima: A Journal of Narrative Medicine** (Squarespace): 1 890.
- OJS, pdf: Philosophy of Medicine (Pitt). Ei vastannut: Medicine Anthropology Theory (OJS; galleria).
- Karsittu: BMJ:n Medical Humanities -blogi (mainokset `securepubads`, ei lahjoitusta).
- Ei mitattu: AMA Journal of Ethics (403), Hastings Center Bioethics Forum (403), Circulating Now (NLM; 403).
  Cambridge Coren avoin *Medical History*: artikkelia ei mitattu.

## Alustat: yksi sovite monelle

Kärjen 1–4 lisäksi:

- **PsychOpen GOLD** (ZPID): OJS 3.1, HTML-galleria iframessa. Testaa nykyinen OJS-sovite.
- **De Gruyter Brill, avoimet artikkelit**: HTML; kattaisi myös vanhan listan Open Philosophyn ja Open Theologyn.
- **Duke University Press / Silverchair**: Environmental Humanities, Critical Times. Kontissa 403.
- **Cambridge Core, avoimet artikkelit**: ei mitattu.
- **Ghost**: openDemocracy, MERIP (vanhalla listalla alustana).
- **MDPI**: kontissa 403, ja laatu vaihtelee; ei suositella.

## Jo katettu nykyisillä sovitteilla

Aiheisiin osuvat, testaa ennen uutta työtä:

- **OpenEdition**: Clio, Genre & Histoire, REMMM, Arabian Humanities, Abstracta Iranica, Cahiers de narratologie, Anabases (?).
- **Janeway / OLH**: Glossa, Laboratory Phonology, 19, Ethnologia Europaea (?).
- **OJS**: Sociologica, Rechtsgeschichte, PsychOpenin lehdet (iframe), Open Gender Journal.
- **Blogger**: Balkinization, Legal History Blog (?).
- **Wikisource** (kaikki kielet tunnistetaan) ja **Wikipedia** (it, de, fr ym. 17.11.2026): renessanssin ja
  eksistentialismin tekstit; it-Wikipedia Treccanin korvikkeena.
- **WordPress, yleinen leikkaus**: suurin osa blogeista yllä.

## Karsitut

- **Mainokset ilman lahjoitusta:** Treccani (vanhalla listalla), CyberLeninka (venäläiset tieteelliset artikkelit:
  `prebid`, `securepubads`), BMJ:n blogit.
- **Lähde kadonnut:** Lev Shestov Archive (kaapattu verkkotunnus), The Quarterly Conversation (lopettanut).
- **Pdf:** Krisis, Philosophy of Medicine, New Directions in Folklore, Semantics and Pragmatics, Folklore (Tartto, uudet).
- **JavaScript:** Electronic Babylonian Library; Finlex testataan selaimessa ennen karsintaa.
- **Jäsenille tai maksullinen:** Sociopedia, The Literary Encyclopedia.
- **Lyhyet:** Glottopedia, SKVR (lyhyet runot tietokannassa), Heraclitus Fragments, Signs: Feminist Conversations
  (rajatapaus).
- **Kommentit kantavat:** Language Hat, RealClimate.
- **Kaaviot:** Carbon Brief, RealClimate.
- **Ei tekstikokoelma:** Open Folklore, Medici Archive Project, History of Women Philosophers and Scientists.
- **Laatu:** MDPI:n Encyclopedia.

## Ehdotettu järjestys, jos työ otetaan alle

1. **Oikeustapaukset** (EUR-Lex, Find Case Law): pisimmät mitatut tekstit, numeroidut kappaleet viitenumeroiksi, kontti pääsee.
2. **PubMed Central**: alusta, JATS, kontti pääsee. Vastaa lääketiedekysymykseen.
3. **Ubiquity Press**: alusta, kontti pääsee (IRSP, Utrecht Law Review).
4. **SPIP**: alusta, kontti pääsee; La Vie des idées vanhalta listalta mukaan.
5. Yksittäiset jalokivet, ensin yleisen leikkauksen mittaus: Political Concepts, Project Vox, Embryo Project, CDLJ,
   Журнальный зал, Fabula, Folktexts, A Celebration of Women Writers, Storm's Kierkegaard.
6. **Ganjoor** vasta, kun lukimen oikealta vasemmalle -tuki on testattu.
7. Kontin estämät (Philological Museum, ORACC:n portaalit, Reviews in History, Modernism/modernity) vain, jos ne saa
   mitattua muualta, kuten Pressbooks.

Kuten vanhassa listassa: mittaa ensin, mitä yleinen leikkaus antaa. Tämän listan sanamäärät ja alustat ovat
kirjoitushetken tilanne.
