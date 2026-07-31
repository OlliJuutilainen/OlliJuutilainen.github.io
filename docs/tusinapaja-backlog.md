# Tusinapaja backlog

## Tonttien työlista (palaverin jatkotoimet)

1. Yhtenäistä pääselitteen kirjainkoko niin, että `lowercaseMainDescription` ajetaan kaikissa vaiheissa ilman päivä-vaiherajausta, ja varmista samalla, ettei tyhjät tai HTML-elementillä alkavat selitteet muutu.
2. Selvitä nousua edeltävien kuivien tuntien käsittely: kun hämärävaihe ei enää päädy päätekstiksi, varmista että kuivan sään kuvaus nostaa ensimmäisen kirjaimen isoksi ja ettei hämärän CSS-yläsuuraus laukea vahingossa.
3. Päivitä testisuunnitelma kattamaan sumu-, sade- ja kuivatapaukset sekä aurinkotapahtumien molemmat kieliasut, jotta kirjaimiston poikkeamat eivät palaa jatkokehityksessä.

---

## Tehdyt päätökset

Tähän on kirjattu ratkaisuja, jotka näyttävät myöhemmin virheiltä tai jäämiltä, mutta
ovat harkittuja. Tarkoitus on, ettei seuraava siivouskierros pura niitä vahingossa.

### `class="ditto"` jätetään, vaikka sille ei ole CSS-sääntöä

`»`-merkki tuotetaan muodossa `<span class="ditto" title="sama kuin edellä">&raquo;</span>`.
Luokalle ei ole yhtään tyylisääntöä sen jälkeen, kun `.desc .ditto{display:inline}` ja
`.ditto{color:inherit}` poistettiin — molemmat olivat span-elementin oletusarvoja eli
mittausten mukaan täysin vaikutuksettomia.

Luokka **jää** silti paikalleen. Se on nimilappu, joka kertoo mitä elementti on, eikä
viittaa sääntöön muualla; lisäksi se on valmis tartuntapinta jos ditto-merkki halutaan
joskus tyylitellä erikseen. Tämä eroaa poistetusta `hh`-luokasta, joka viittasi
sisartiedostojen (`saa_yr.html`, `tusinapuuska.html`) sääntöön `.t.hh{text-align:right}`
jota tässä tiedostossa ei koskaan ollut — se oli harhaanjohtava, ei kuvaava.

Sama koskee `title`-attribuuttia: se on aito toiminto (selittää `»`-merkin hiirellä ja
ruudunlukijalle), eikä sitä pidä poistaa.

### Kytkemättömät koukut, joita ei pidä poistaa siivouksessa

Nämä ovat kuollutta koodia siinä mielessä, ettei niitä koskaan aseteta tai lueta, mutta
ne ovat keskeneräisiä aikomuksia eivätkä jäämiä:

- `forceDescWhite` ja `forceRainWhite` (`maybeApplyTwilightPrecipOverride`) — tarkoitettu
  ohjaamaan värikorostusta hämärän ja sateen osuessa samalle tunnille. Niitä ei aseteta
  koskaan `true`:ksi, joten `createHourlyRowModel`in vastaavat `if`-haarat eivät laukea.
- `result.__warn = 'SunCalc unavailable'` (`fetchSunriseDay`) — tarkoitettu varoittamaan
  jos SunCalc-kirjasto puuttuu, mutta arvoa ei näytetä missään. Jos SunCalc joskus
  hajoaa, tieto siitä katoaa hiljaa. Tämä on lähinnä pieni puute, ei pelkkä jäämä.

### `lowercaseMainDescription` on yhä kutsumaton

Funktio on määritelty sekä `tusinapaja.html`:ssä että `tusinasaa.html`:ssä eikä sitä
kutsuta kummassakaan. Sitä **ei** poistettu, koska yllä oleva työlistan kohta 1 nojaa
siihen. Jos kohta 1 hylätään, funktio voi lähteä samalla.

### Hämärävaiheen alkuaika sulkeissa

Vaiheen oma alkuaika näytetään pääselitteen perässä muodossa `porvarillinen hämärä (07:29)`
eikä omalla rivillään. Sulkeutus koskee **vain** vaiheen omaa paljasta alkuaikaa. Sitä ei
sovelleta seuraavan vaiheen ilmoitukseen (`nauttinen 06:37`) eikä aurinkotapahtumiin
(`auringonnousu 08:24`), koska ne nimeävät eri asian — pelkkä `(06:37)` väittäisi rivillä
väärää vaihetta.

Sulkeet eivät katkea rivin vaihtuessa, koska `(07:29)` ei tarjoa katkaisukohtaa. Leveällä
sarakkeella ne mahtuvat nimen perään, kapealla ne siirtyvät kokonaisuudessaan seuraavalle
riville. Erillistä `white-space`-määritystä ei siis tarvita.

### Seuraavan vaiheen ilmoituksen ehdot

Ilmoitus annetaan vain jos vaihe on **eri** kuin tunnin oma ja alkaa minuutilla **:30 tai
sen jälkeen**. Ennen puoltatuntia alkava vaihe ehtii hallitsemaan tunnin, jolloin se
näkyy jo pääselitteenä oman alkuaikansa kanssa; ilmoitus toistaisi saman kellonajan.
Tämä toisto oli aiemmin näkyvissä sateisella tunnilla ja piilossa kuivalla, jossa
ajatusviivaketjutus nielaisi sen sivuvaikutuksena.

Ditto-rivillä (`»`) ei näytetä paljasta alkuaikaa, koska `»` ei kerro mikä alkoi.
Karsinta tapahtuu `data-inline-start`-tunnisteen perusteella. Seuraavan vaiheen ilmoitus
saa jäädä ditto-riville, koska se nimeää vaiheen itse.

### Alkuaikaa ei koskaan keksitä

`phaseStart` jää tyhjäksi, jos vaiheen todellista alkamishetkeä ei löydy tämän
vuorokauden rajapyykeistä, ja tyhjä arvo estää alkamisilmoituksen kokonaan.
Aiemmin tilalle sijoitettiin tunnin alku, jolloin keskiyön jälkeinen rivi ilmoitti
alkamisajaksi `(00:00)` vaikka vaihe oli alkanut jo edellisenä iltana — sekä väärä
aika että ilmoitus rivillä jolla mitään ei alkanut.

Näin käy kahdessa tilanteessa: vaihe on alkanut edellisen vuorokauden puolella
(jolloin hetki ei ole tämän päivän rajapyykeissä), tai vaihe on päätelty auringon
korkeudesta eikä sille ole rajapyykkiä lainkaan.

### Seuraavan vaiheen ilmoituksen lyhyt muoto

Kun vaihe alkaa tunnin **jälkipuoliskolla** ja edellinen vaihe oli hämärä, ilmoituksesta
jäävät pois sekä *hämärä* että *alkaa*: `nauttinen hämärä alkaa 06:37` → `nauttinen 06:37`.
Molemmat ovat pääteltävissä asiayhteydestä, joten lyhyt muoto on aiemman päivitys eikä
vajaa ilmaus. Ehto "onko hämärää jo mainittu" on koodissa `fromPhaseIsTwilight`.

Lyhennys ei riipu siitä sataako tunnilla. Aiemmin se oli sidottu myös siihen, että
rivillä on versaali hämärämerkintä, mikä kytki sen vahingossa keksittyyn alkuaikaan.

Lyhennys koskee kaikkia kolmea hämärävaihetta: myös porvarillisesta jää pois sana
*alkaa*, jonka sen täysi muoto `beginLabel`-taulukossa (`porvarillinen alkaa`) sisältää.

Kun vaihe alkaa tunnin **alkupuoliskolla**, se ehtii hallitsemaan tunnin ja näkyy
oman alkuaikansa kanssa muodossa `NAUTTINEN HÄMÄRÄ (23:02)`.

### Ilmoituksia ei ketjuteta ajatusviivalla

Jokainen hämärämerkintä on omalla rivillään. Aiemmin seuraavan vaiheen ilmoitus
ketjutettiin ajatusviivalla joko alkuilmoituksen tai sateisen tunnin versaalin
merkinnän perään, jolloin yhdellä rivillä oli kaksi kelloa eri suuntiin: mennyt
alku ja tuleva alku. Esimerkiksi `nauttinen hämärä` + `alkaa 16:40 – astronominen
hämärä 17:32`. Nyt sama on `nauttinen hämärä (16:40)` ja omalla rivillään
`astronominen 17:32`.

Ketjutus myös hukkasi ilmoituksia. Teksti liitettiin `suppressedTwilightEntry`-olioon,
joka syntyi aina kun vaiheella oli nimi ja aika – myös silloin kun sitä ei koskaan
lisätty näytettäviin merkintöihin. Silloin ketjutettu ilmoitus katosi näkymättömiin.
Sateisen marraskuun aamun klo 06 sai tästä syystä ilmoituksen `nauttinen 06:37`
vasta ketjutuksen purkamisen jälkeen.

Purkamisen myötä kuolivat `inlineNextLabelFor`, `inlineCanDescribeNext`,
`suppressedHasOwnStart` ja `textExtended`, jotka kaikki palvelivat vain ketjutusta.
Ne on poistettu.

### Sateisella tunnilla ei toisteta vaiheen nimeä

Sateisella tunnilla näytetään hämärästä vain **ilmoitukset**, ei vaiheen nimeä
sellaisenaan. Käytännössä sallittuja ovat vaiheen alkamisilmoitus (versaali, kellonajan
kanssa, esim. `NAUTTINEN HÄMÄRÄ (23:02)`) ja seuraavan vaiheen ilmoitus
(esim. `porvarillinen 03:53`). Pelkkä vaiheen nimi ilman kellonaikaa ei kerro mitään
uutta, vaan toistaa sen mikä on jo ilmoitettu aiemmalla tunnilla — myös ditto-riveillä,
jotka toistivat sen tunti toisensa jälkeen.

Aiemmin tästä huolehti `decorateDescription`in viimeinen `else if` -haara, joka on nyt
poistettu. Se laukesi ehtojensa puolesta **vain** sateisilla tunneilla: haaraan päädyttiin
vain kun vaihe kelpasi pääsanaksi, ja siinä tilanteessa `twilightMain` oli epätosi
täsmälleen silloin kun satoi. Kuivilla tunneilla vaihe on edelleen pääsana, kuten ennenkin.

---

## Generaattori (`generaattori.html`) – muistiinpano

Generaattorin tuottama KV-komento on pinnattu versioon `wrangler@3.114.17` **tarkoituksella**,
eikä sitä pidä päivittää takaisin muotoon `@latest` eikä versioon 4.

Wrangler 4 niputtaa mukaansa `esbuild 0.28.1`:n, joka vaatii macOS 12:n. Big Surilla se
kaatuu virheeseen `dyld: Symbol not found: _SecTrustCopyCertificateChain` ilman että
wrangler ehtii tulostaa mitään — komento näyttää epäonnistuvan täysin hiljaa. Versio 3
toimii, mutta käyttää eri syntaksia: `kv:key` kaksoispisteellä, eikä siinä ole
`--remote`-lippua lainkaan (etäKV on siinä oletus).

Androidilla (Termux) wrangler ei toimi lainkaan millään versiolla, koska pakollinen
`workerd`-riippuvuus ei käänny Bionicille. Sieltä KV-kirjoitus tehdään Cloudflaren
REST-rajapinnalla `curl`-komennolla, joka ei riipu Nodesta.
