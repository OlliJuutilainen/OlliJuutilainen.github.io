# Lisää lukimeen: leike .md-tiedostoksi koneelle

Hyllyyn 9.11.2026 (käyttäjän toive). Ei toteutettu: nyt ei ole resursseja muutokseen eikä lisäosan uuteen
julkaisukierrokseen (Chrome Web Store ja Mozillan allekirjoitus).

Toive: lisäosasta voisi suoraan ladata leikkeen koneelle Markdown-tiedostona, ei vain viedä sitä Latomoon tai
lukulistaan.

## Lähtötilanne (9.11.2026)

- Ponnahdusikkunassa (`luin/lisaosa/ponnahdus.html`) on kaksi nappia: *Lisää lukimeen* ja *Avaa Latomossa*. Molemmat
  jättävät leikkeen lisäosan muistiin ja avaavat `latomo.html#lisaosa` (`ponnahdus.js`, `laheta()`).
- Latomossa on jo *Lataa .md* (`#lataa`), joka antaa valmiin, siivotun ja etukentällä täydennetyn tekstin. Kiertotie
  toimii siis nyt: *Avaa Latomossa* → *Lataa .md*.

## Avoimia kysymyksiä

- Ladataanko raaka leike (etukenttä `leikattu:`, `<sup>`-merkinnät, HTML-taulukot) vai Latomon siivoama tulos?
  Siivous ja etukentän täydennys ovat Latomossa (`siivoa()`, `valmis()`), joten suora lataus ponnahdusikkunasta
  tarvitsisi niistä kopion tai Latomon avaamisen taustalla.
- Kolmas nappi vai valinta? Androidin Firefoxissa ikkuna on ahdas.
- Tiedostonimi: Latomon `L.slug(otsikko)` on luonteva malli.
- Tarvitaanko `downloads`-oikeus vai riittääkö `<a download>` ponnahdusikkunassa (Firefox Android?). Uusi oikeus
  näkyy asentajalle ja kauppojen tarkastuksessa; tietosuojasivu (`luin/tietosuoja.html`) päivitettävä.
