# Luin: liettuankieliset lähteet Lukimeen-lisäosan sovitteiksi

Hyllyyn 16.11.2026. Pohjana käyttäjän kysymys: onko ilmeisen hyviä liettuankielisiä lähteitä, ei tusinatavaraa.

**Toteutettu 16.11.2026** (opas 7.5 ja 5): lisäosan OJS-sovite (`ojs()`: Problemos ja muut journals.vu.lt:n lehdet, HTML-kokoteksti
vuodesta 2019, vanhemmista pdf-artikkeleista tiivistelmäleike), liettuan Wikipedia (nimiavaruudet, ohjausrivit, luettelot), md.js:n
liettuankieliset luettelonimet, lukijan kielentunnistus (DeepL-käännös, sanaselitys, `/liettua`) ja liettuan tavusäännöt. Alla olevat
avoimet kysymykset ratkesivat näin: Readability antoi artikkelisivulta vain tiivistelmän; HTML on vuodesta 2019; molemmat tiivistelmät
jäävät tekstin alkuun lähteen järjestyksessä; `citation_language` ei kelpaa (väärä Problemos 109:ssä), kieli tunnistetaan tekstistä.
Tekemättä: VLE, Vikišaltiniai, *Filosofija. Sociologija* (`lmaleidykla.lt`) ja muut alla.

**Seuraava helmijyvä (arvio 16.11.2026): VLE.** Tarkistettu samana päivänä:

- **Visuotinė lietuvių enciklopedija** (`vle.lt`) on ainoa jäljellä oleva, jolle sovite toisi selvästi lisää. Se on liettuan
  Logos/SEP: yleisenkyklopedia, toimitettu, tekijät nimetty, kirjallisuusluettelot, ei mainoksia eikä lahjoituspyyntöä.
  Sivu tulee palvelimelta valmiina HTML:nä (*Immanuel Kant*: 88 kt, väliotsikot `h3`). Readability antaa leipätekstin ja
  12 väliotsikkoa, mutta: tekijäksi tulee välilehden nimi *Apie autorių*, artikkelin oikea tekijä puuttuu, kuvateksti
  (*Immanuel Kant (dailininkas J. G. Beckeris, 1768, aliejus …)*) on leipätekstin seassa, kirjallisuus on yhtenä virkkeenä
  tekstin lopussa (*… R. J. Sullivan An Introduction to Kant’s Ethics Cambridge 1995.*) eikä luettelona, ja loppuun jää irrallinen
  luku (*952*). Sovitteen työ: runko ja otsikot, tekijä ja julkaisu- tai muokkauspäivä (*Publikuota*, *Redaguota*), kuvatekstit
  pois, kirjallisuus luetteloksi (lähteessä kohdat erotettu puolipisteillä, vuosi ilman sulkuja: md.js:n tekijä–vuosi ei linkity
  sellaisenaan), *Susiję straipsniai* ja *Citata*-laatikko pois. Ennen työtä: käyttöehdot (*Teisės ir naudojimo sąlygos*)
  oikeusmerkintää varten, ja onko kirjallisuus sivulla omana elementtinään vai vain tekstinä.
- *Filosofija. Sociologija* (`lmaleidykla.lt`, OJS 3.1.2): vain pdf:iä, ei HTML-kokotekstiä. Metatiedot ovat kunnossa
  (`DC.Description` lt ja en, `DC.Title.Alternative`, avainsanat), joten nykyinen OJS-sovite tekee siitä luultavasti jo
  tiivistelmäleikkeen (ei kokeiltu selaimessa). Ei omaa sovitetta; korkeintaan yksi selainkoe, että leike syntyy (numeron
  *Titulinis*-kohta on nimiösivu ilman tiivistelmää, siitä tiivistelmäleikettä ei pidä tulla).
- Vikišaltiniai (`lt.wikisource.org`): 2 430 sivua, 2 aktiivista käyttäjää. Pieni; ei kannata ennen VLE:tä.
Tarkistettu on vain se, mikä on merkitty *(tarkistettu)*; muu on muistista tai pelkkä vastaako osoite.

## Ykkönen: Problemos ja OJS-alusta

**Problemos** (Vilnius University, `journals.vu.lt/problemos`, peilinä `zurnalai.vu.lt`): filosofian vertaisarvioitu lehti vuodesta 1968.

- *(tarkistettu 16.11.2026)* Diamond open access, CC BY 4.0 (alustan alatunnisteessa), OJS/PKP. Lehti ilmestyy kahdesti vuodessa,
  kielinä liettua ja englanti. Hakemistoissa Scopus, WoS (A&HCI), DOAJ, The Philosopher's Index (lehden oman ilmoituksen mukaan).
- *(tarkistettu)* Nykyisen numeron artikkeleilla on HTML-kokoteksti PDF:n lisäksi (`/problemos/en/article/view/<id>`).
  HTML:n sisältöä en lukenut, joten sen rakenne (otsikot, viitteet, alaviitteet) on mittaamatta.
- Rahoitus: avoin lehti, ei mainoksia nähty (etusivua ei mitattu). Rahoitushuomautus: tarkista mainokset ja lahjoitusmahdollisuus ennen sivustolistaa.

**Miksi OJS eikä pelkkä Problemos:** sama sovite kattaisi muut OJS-lehdet, joissa on `citation_*`-metatiedot ja HTML-galleria:
`journals.vu.lt` (muut VU-lehdet), `zurnalai.vu.lt`, Liettuan tiedeakatemian *Filosofija. Sociologija* (`lmaleidykla.lt`, OJS; ei tarkistettu).
Kuten JIABS (ks. luin-sivustoehdokkaat.md) on myös OJS, joten sovite hyödyttäisi muitakin kuin liettuaa.

Avoimia kysymyksiä ennen työtä:
- Mitä Readability antaa jo ilman sovitetta? Mittaa ensin (viitteet, tiivistelmät kahdella kielellä, alaviitteet, kirjallisuus, tekijän laitos).
- Onko HTML-galleria kaikissa numeroissa vai vain uusimmissa? Vanhemmat artikkelit voivat olla vain PDF:nä.
- Kaksikielinen tiivistelmä (lt/en) ja avainsanat: kumpi etukenttään, vai molemmat?
- `citation_language` ja `lang`: md.js:n kieliasetukset ja liettuan sanaluokitus (Wiktionary-haku ei välttämättä kata liettuaa samoin).
- Koska hostit vaihtelevat, tunnistus metatiedoista (`citation_journal_title`, OJS-generaattori), ei verkkotunnuksesta.

## Muut ehdokkaat

- **Visuotinė lietuvių enciklopedija** (`vle.lt`, LNB Mokslo ir enciklopedijų leidybos centras). *(tarkistettu)* Ei mainoksia eikä lahjoitusnappia;
  artikkeleissa *Apie autorių*, *Kiti šaltiniai*, *Literatūros sąrašas*, *Susiję straipsniai*. Käyttöehtoja (*Teisės ir naudojimo sąlygos*) ei luettu.
  Tekijänoikeusrivi: © LNB Mokslo ir enciklopedijų leidybos centras.
- **Liettuan Wikipedia.** Nykyinen sovite tunnistaa `wikipedia.org`-hostin, mutta `WIKI_NIMIAVARUUS` tuntee vain fi/en-etuliitteet
  (*Kategorija:*, *Šablonas:*, *Vikipedija:* puuttuvat) ja huomautusten tunnistus on fi/en. Ajamatta selaimessa.
- **Vikišaltiniai** (`lt.wikisource.org`) klassikkotekstejä varten. Ei tarkistettu.
- *Athena*, *Logos* (`logos.lt`), *Naujasis Židinys-Aidai* (`nzidinys.lt`): osoitteet vastaavat, sisältöä ei tarkistettu.

## Ohitetut

`bernardinai.lt` (403 koneluvulla; uutis- ja mielipidesivuna lähellä tusinatavaraa) ja uutissivustot.
