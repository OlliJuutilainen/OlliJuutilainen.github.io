# Viitetyyli – varanto

Lähdeviitteiden ja kirjallisuusluettelon säännöt myöhempää tarkistusta varten. Koottu 28.10.2026 käyttäjän
pyynnöstä. Käyttäjä: Luin (`luin.html`, `luin/md.js` `kokoaViite`, Latomon lähdeviite) ja käyttäjän omat tekstit.

| Tiedosto | Sisältö |
|---|---|
| `teologian-tyyli-2021.md` | Manuaali: repon tulkinta HY:n teologisen tiedekunnan ohjeesta (2021): perusmuodot, kaikki esimerkit, alaviitteet, tutkielman lisäkäytännöt, ohjeen epäjohdonmukaisuudet ja Luinin vertailu. |
| `apa7-turvaverkko.md` | APA 7 niihin kohtiin, joita Teologian tyyli ei kata, käännettynä Teologian tyylin asuun. |
| `lisalehti-antiikki-ja-arkistot.md` | Sinetöity lisälehti: antiikin, kirkkoisien, reformaation, filosofian klassikoiden ja arkistojen merkitseminen, kun osastokohtaista ohjetta ei ole käsillä. |
| `vertaa-luin.js` | Ajaa Teologian tyylin esimerkit `LuinMD.kokoaViite`-funktion läpi: `node docs/viitteet/vertaa-luin.js`. |

## Etusijajärjestys

1. **Teologian tyyli** (`teologian-tyyli-2021.md`). Manuaalin luvussa 7 luetellut ohjeen kömmähdykset eivät ole
   malli.
2. **Käyttäjän tutkielman käytäntö** ([T]), kun tyyli vaikenee. Tutkielma on Luinin ja Latomon malli
   (`md-testi.js` vertaa siihen).
3. **Sinetöity lisälehti** primäärilähteille (antiikki, arkistot), vain todelliseen tarpeeseen.
4. **APA 7** (`apa7-turvaverkko.md`), Teologian tyylin merkintätavalla: `s.a.`, `(luettu …)`, `DOI: …`,
   `toim.`, koko etunimet, alaviite `Sukunimi vuosi, sivu`.

## Ratkaistut ja avoimet

Ratkaistu:
- **Pelkän viittauksen sisältävä alaviite on pisteetön** (`Derrida 2019, 143`), toisin kuin Teologian tyylin
  esimerkeissä. Käyttäjän päätös 28.10.2026. Perusteet pisteettömyyden puolesta:
  - *Viite ei ole virke vaan osoite.* Piste päättää virkkeen. `Derrida 2019, 143` on verbitön nimiö, kuten
    luettelon kohta, kuvateksti tai taulukon solu, jotka jätetään ilman pistettä.
  - *Tekstinsisäisen viittauksen siirto.* Alaviite on sulkuviittauksen `(Derrida 2019, 143)` korvike, eikä
    sulkujen sisään tule pistettä. Virke, jonka viite on, päättyi jo leipätekstissä viitenumeron eteen.
  - *Lajin näkyminen.* Kun selittävä alaviite päättyy pisteeseen ja pelkkä viite ei, lukija näkee
    yhdellä silmäyksellä, kumpaa lajia alaviite on. Tutkielma noudattaa tätä johdonmukaisesti: selittävät
    alaviitteet päättyvät pisteeseen, pelkät viitteet eivät, ja virkkeen jälkeinen viite on ilman pistettä
    (`… saavutukseksi. Korsgaard 3.4.2`).
  - *Numeron perässä oleva piste on suomessa järjestysluvun merkki.* `143.` voi lukea *143:s*, `3.4.2.` lisää
    paikantimeen tason, ja `s.a..` tai `GMS 4:429.` ovat kömpelöitä.
  - *APA:n sisennetyn lainauksen sääntö.* Lainauksen jälkeen erillään seisova viittaus `(Derrida, 2019, p. 143)`
    on pisteetön, koska virke päättyi jo ennen sitä (`apa7-turvaverkko.md` 5). Alaviiteviite on samassa asemassa.

  Vastaan:
  - Teologian tyylin kaikki seitsemän esimerkkialaviitettä päättyvät pisteeseen.
  - HY:n historian ohje (Katajisto ym. 2025, kohta 2.2) sanoo *Lähdeviitteen perään tulee aina piste.*
  - Suomen Muinaismuistoyhdistyksen sivuilla oleva kirjoitusohje (Olsson 2025) sanoo *Alaviite on kuin virke:
    se alkaa isolla alkukirjaimella ja päättyy pisteeseen.*
  - Kielitoimiston ohjepankin kantaa ei löytynyt haulla 28.10.2026.
- **Alaotsikko alkaa kaksoispisteen jälkeen isolla** kuten tyylin esimerkissä (käyttäjän päätös 28.10.2026; Luin
  `nimiOsa`). Ennen suomenkielinen alaotsikko pienennettiin.

Avoimet:
- Pisteen paikka tekijättömän merkinnän vuoden edellä (ohje vaihtelee; Luin ilman).

## Mitä tässä ei ole

- **Itse PDF.** Ohjeen tekijänoikeus on tiedekunnalla, eikä sitä ole viety julkiseen repoon. Kaikki sen säännöt ja
  esimerkit ovat `teologian-tyyli-2021.md`:ssä. Vanhempi versio (2019) on ollut julkisesti osoitteessa
  `https://blogs.helsinki.fi/tutkivakirjoittaminen/files/2019/03/Teologian_tyyli_19.pdf` (Zoteron tyylitiedoston
  dokumentaatiolinkki; avautumista ei tarkistettu).
- **Teologisen tiedekunnan osastokohtaiset ohjeet** (antiikin lähteet, arkistot), joihin Teologian tyyli viittaa. Niitä ei löytynyt
  verkosta; niiden paikkaa pitää lisälehti, joka nojaa alan yleisiin käsikirjoihin.
- **APA-käsikirja.** Tekijänoikeuden takia turvaverkko on omin sanoin kirjoitettu tiivistelmä. Tarkistetut kohdat on
  merkitty [✓] lähteineen; muut [M] ovat muistinvaraisia.
- **Muiden Claude-keskustelujen sisältö.** Ne eivät näy tähän ympäristöön. Täydentävä tieto on koottu repon omasta
  historiasta: CLAUDE.md, `luin/ohje.md` (luku 7), `luin/md.js`, `luin/kehitys/md-testi.js` ja tutkielman
  kirjallisuusluettelo ja alaviitteet.

## Jo toteutettu Luinissa

- Kirjallisuusluetteloa ei tavuteta (Teologian tyyli ja APA 7, päätös 28.10.2026; `md.js` `OHITA`, `luin.html` `p.bib`).
- Viite kootaan Teologian tyylin mukaan (`kokoaViite`). Erot tyyliin: `teologian-tyyli-2021.md` luku 8.
- Lähdeviittausten linkitys alaviitteestä luetteloon (`viittaukset()`): `Sukunimi vuosi` ja `Sukunimi paikannin`.
  Teologian tyylin alaviitemuodot linkittyvät 28.10.2026 alkaen (`md-testi.js`: *tyylin alaviitteet linkittyvät*):

  | Alaviite | Ennen | Nyt |
  |---|---|---|
  | `Allison 1993, 45–46; 2010, 31.` | vain `Allison 1993` | `Allison 1993` ja `2010` omiin kohtiinsa |
  | `Tuhkanen 2013a; 2013b.` | vain `Tuhkanen 2013a` | molemmat |
  | `McLoughlin & Lertola 2014, 70–71.` | ei | kyllä (myös `ja`) |
  | `Punkkinen et al. 2012, 1776–1777.` | ei | kyllä (myös `ym.`) |

  Syy aiempaan: heuristiikka (21.10.2026) tehtiin tutkielman mukaan, jossa kaikki viitteet ovat yhden tekijän
  `Sukunimi vuosi` -muotoa. Se tunsi kohdasta vain ensimmäisen sukunimen ja vaati sen heti vuoden eteen.
  Tutkielman 47 linkkiä ja HTML ovat muutoksen jälkeen merkilleen samat.
