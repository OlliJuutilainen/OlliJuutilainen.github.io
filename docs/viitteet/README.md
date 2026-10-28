# Viitetyyli – varanto

Lähdeviitteiden ja kirjallisuusluettelon säännöt myöhempää tarkistusta varten. Koottu 28.10.2026 käyttäjän
pyynnöstä. Käyttäjä: Luin (`luin.html`, `luin/md.js` `kokoaViite`, Latomon lähdeviite) ja käyttäjän omat tekstit.

| Tiedosto | Sisältö |
|---|---|
| `teologian-tyyli-2021.md` | HY:n teologisen tiedekunnan ohje (PDF, 3 s.) säännöiksi purettuna: perusmuodot, kaikki esimerkit, alaviitteet, tutkielman lisäkäytännöt, ohjeen epäjohdonmukaisuudet ja Luinin vertailu. |
| `apa7-turvaverkko.md` | APA 7 niihin kohtiin, joita Teologian tyyli ei kata, käännettynä Teologian tyylin asuun. |
| `vertaa-luin.js` | Ajaa Teologian tyylin esimerkit `LuinMD.kokoaViite`-funktion läpi: `node docs/viitteet/vertaa-luin.js`. |

## Etusijajärjestys

1. **Teologian tyylin suora sääntö tai esimerkki** (`teologian-tyyli-2021.md`, merkintä [E]).
2. **Teologian tyylin esimerkeistä johdettu** ([J]). Ohjeen virheiksi todettuja kohtia (luku 7) ei matkita.
3. **Käyttäjän tutkielman käytäntö** ([T]), kun ohje vaikenee. Tutkielma on Luinin ja Latomon malli
   (`md-testi.js` vertaa siihen).
4. **APA 7** (`apa7-turvaverkko.md`), Teologian tyylin merkintätavalla: `s.a.`, `(luettu …)`, `DOI: …`,
   `toim.`, koko etunimet, alaviite `Sukunimi vuosi, sivu`.

Ristiriidat, jotka käyttäjän on ratkaistava (ei ratkaistu tässä):
- Suomenkielisen alaotsikon alkukirjain kaksoispisteen jälkeen (ohje iso, tutkielma ja Luin pieni).
- Pisteen paikka tekijättömän merkinnän vuoden edellä (ohje vaihtelee; Luin ilman).
- Pelkän viittauksen sisältävän alaviitteen loppupiste (ohje kyllä, tutkielma ei).

## Mitä tässä ei ole

- **Itse PDF.** Ohjeen tekijänoikeus on tiedekunnalla, eikä sitä ole viety julkiseen repoon. Kaikki sen säännöt ja
  esimerkit ovat `teologian-tyyli-2021.md`:ssä. Vanhempi versio (2019) on ollut julkisesti osoitteessa
  `https://blogs.helsinki.fi/tutkivakirjoittaminen/files/2019/03/Teologian_tyyli_19.pdf` (Zoteron tyylitiedoston
  dokumentaatiolinkki; avautumista ei tarkistettu).
- **Teologisen tiedekunnan osastokohtaiset ohjeet** (antiikin lähteet, arkistot), joihin Teologian tyyli viittaa.
- **APA-käsikirja.** Tekijänoikeuden takia turvaverkko on omin sanoin kirjoitettu tiivistelmä. Tarkistetut kohdat on
  merkitty [✓] lähteineen; muut [M] ovat muistinvaraisia.
- **Muiden Claude-keskustelujen sisältö.** Ne eivät näy tähän ympäristöön. Täydentävä tieto on koottu repon omasta
  historiasta: CLAUDE.md, `luin/ohje.md` (luku 7), `luin/md.js`, `luin/kehitys/md-testi.js` ja tutkielman
  kirjallisuusluettelo ja alaviitteet.

## Jo toteutettu Luinissa

- Kirjallisuusluetteloa ei tavuteta (APA 7, päätös 28.10.2026; `md.js` `OHITA`, `luin.html` `p.bib`).
- Viite kootaan Teologian tyylin mukaan (`kokoaViite`). Erot tyyliin: `teologian-tyyli-2021.md` luku 8.
- Lähdeviittausten linkitys alaviitteestä luetteloon (`viittaukset()`): `Sukunimi vuosi` ja `Sukunimi paikannin`.
  Mitattu 28.10.2026 Teologian tyylin alaviite-esimerkeillä (`LuinMD.parse`, luettelossa vastaavat merkinnät):

  | Alaviite | Linkittyy |
  |---|---|
  | `Allison 1993, 45–46; 2010, 31.` | vain `Allison 1993`, ei sukunimetöntä `2010` |
  | `Tuhkanen 2013a; 2013b.` | vain `Tuhkanen 2013a`, ei `2013b` |
  | `McLoughlin & Lertola 2014, 70–71.` | ei |
  | `Punkkinen et al. 2012, 1776–1777.` | ei |

  Parannuskohde, jos ohjeen alaviitemuotoja halutaan tukea; ei korjattu tässä.
