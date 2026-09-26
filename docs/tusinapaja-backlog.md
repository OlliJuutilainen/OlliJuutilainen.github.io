# Tusinapaja backlog

## Tonttien työlista (palaverin jatkotoimet)

1. Yhtenäistä pääselitteen kirjainkoko niin, että `lowercaseMainDescription` ajetaan kaikissa vaiheissa ilman päivä-vaiherajausta, ja varmista samalla, ettei tyhjät tai HTML-elementillä alkavat selitteet muutu.
2. Selvitä nousua edeltävien kuivien tuntien käsittely: kun hämärävaihe ei enää päädy päätekstiksi, varmista että kuivan sään kuvaus nostaa ensimmäisen kirjaimen isoksi ja ettei hämärän CSS-yläsuuraus laukea vahingossa.
3. Päivitä testisuunnitelma kattamaan sumu-, sade- ja kuivatapaukset sekä aurinkotapahtumien molemmat kieliasut, jotta kirjaimiston poikkeamat eivät palaa jatkokehityksessä.

---

## Tehdyt päätökset

Tähän on kirjattu ratkaisuja, jotka näyttävät myöhemmin virheiltä tai jäämiltä, mutta
ovat harkittuja. Tarkoitus on, ettei seuraava siivouskierros pura niitä vahingossa.

### Tietoturva: mitä ei pidä palauttaa (2026-09)

- **Kirjastot tulevat `vendor/`-kansiosta, ei CDN:stä.** unpkg- ja jsdelivr-skriptit ajettiin
  samassa originissa ennen purkua, ja testissä CDN-tiedostoon lisätty rivi luki
  `#t=…&k=…`:n. Älä palauta CDN-osoitteita ilman `integrity`-tarkistetta.
- **`?tz=` escapoidaan ennen `prependError`ia.** `prependError` kirjoittaa `innerHTML`iin,
  ja escapoimaton parametri ajoi JavaScriptiä.
- **Hash-fragmenttia ei poisteta osoiteriviltä** (`history.replaceState`), vaikka avain
  jää selaimen historiaan. Poisto rikkoisi sivun uudelleenlatauksen ja kirjanmerkit:
  sijainti vaihtuisi hiljaa oletukseen.
- **Koordinaatteja ei pyöristetä**, koska jo jaetut QR-koodit sisältävät tarkat arvot.
- **Selväkielisiä sijainteja ei kirjata koodiin.** Sisartiedostoista poistettiin viisi
  yksityistä pistettä; esimerkkinä on Helsingin keskusta.
- **`generaattori.html` ei laita avainta K shell-komentoon**, koska shellin historia
  tallentuu levylle ja varmuuskopioihin. Linkit tulostetaan erillisenä lohkona.

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

### Märkä/kuiva päätellään näytetyn tekstin lähteestä

`descriptorOpts` sisältää vain sen lähteen koodin, jonka teksti näytetään: nowcastin
tekstille nowcastin koodin, Harmonien tekstille `SmartSymbol`in. Aiemmin Harmonien koodi
voitti aina, jolloin nowcastin "saavista kaatuu" luokiteltiin kuivaksi (rivi himmeni) ja
kuiva nowcast-tunti märäksi (hämärä ei noussut pääsanaksi, rivillä "sinistä" pimeässä).

### Ristiriita = Harmonien lupaus vastaan nowcastin havainto

`applyContradiction` laukeaa vain rivillä, jolla selite on Harmoniesta ja sade
nowcastista. Nowcastin omaa tekstiä ei yliviivata, eikä kokonaan Harmonien riviä verrata
itseensä. Käytännössä tämä tapahtuu, kun nowcastin symbolille ei ole käännöstä.
Yliviivaus kohdistuu pääselitteeseen; aiemmin se osui rivin ensimmäiseen merkintään,
joka auringonlaskun tunnilla oli "auringonlasku HH:MM". Peräkkäisistä ristiriitariveistä
vain ensimmäinen saa "tai niin ne lupasivat…" -notin.

### Nowcastin hetkellinen intensiteetti ei ole tunnin sademäärä

`precipitation_rate` (mm/h, yksi hetki) ei enää kelpaa sademääräksi. Jos nowcastilla ei
ole tunnille `next_1_hours`-kertymää, koko rivi on Harmonieta ja noudattaa Harmonie-rivien
sääntöjä (`nowcastRow`), rivinumerosta riippumatta. Nowcast ulottuu noin kaksi tuntia,
joten näin käy todennäköisesti aina kolmannella rivillä (ei tarkistettu oikeasta datasta).

### Lämpötila riveillä 0–2 nowcastista, tuuli Harmoniesta (2026-09)

Riveillä 0–2 lämpötila on nowcastin `instant.details.air_temperature`. Jos arvoa ei ole
(nowcast ei yllä tunnille, virhe tai sijainti on nowcastin alueen ulkopuolella), käytetään
Harmonieta. Lämpötilan lähde on riippumaton sateen lähteestä: kolmannella rivillä lämpötila voi
olla nowcastia, vaikka sade putoaisi Harmonielle, koska hetkellinen lämpötila ulottuu pidemmälle
kuin tunnin kertymä. `?src=1` näyttää lämpötilankin lähteen.

Perusteet: FMI:n `harmonie::surface::point` on MetCoOpin MEPS-mallia sellaisenaan. Nowcast
pohjaa samaan malliin, mutta MET Nordic korjaa lämpötilan havainnoilla (Netatmo, MET:n ja FMI:n
asemat). Tuulelle MET Nordic tekee vain korkeusskaalauksen ilman havaintokorjausta, joten
tuulen vaihtaminen ei toisi juuri mitään; se jää Harmonielle. Lähitunnin mallin ja nowcastin
välinen hyppy rivien 2 ja 3 välillä hyväksytään.

Ajallinen täsmäys käyttää samaa `pickNowcastFromSeries`-sääntöä kuin sade: lähin aikapiste
enintään 60 minuutin päästä. Ensimmäisellä rivillä se on käytännössä nykyhetken arvo.

Nowcast-pyynnöstä poistettiin `altitude=0`. met.no käyttää parametria vain lämpötilan
korkeuskorjaukseen, joten nolla laski lämpötilan merenpinnan tasolle (noin 0,65 °C / 100 m
liian lämmin korkeammalla). Ilman parametria met.no käyttää omaa 1 km:n korkeusmalliaan.
Mitattu 2026-09-25 (nowcast, ensimmäinen aikapiste):

| Paikka | `altitude=0` | oma korkeus | ei parametria |
|---|---|---|---|
| Sipoo, lähellä merenpintaa | 12,6 °C | – (`altitude=500`: 9,7 °C) | 12,6 °C |
| Finse, n. 1222 m | 10,1 °C | 2,7 °C (`altitude=1222`) | 2,7 °C |

Korjaus on siis käytössä nowcastissa, ja ilman parametria met.no:n korkeusmalli osuu tasaisella
ylängöllä oikeaan. Paikan oma korkeus salatussa paketissa toisi hyötyä lähinnä jyrkässä
maastossa, jossa 1 km:n ruudun keskikorkeus poikkeaa paikasta; sitä ei ole tehty.

### FMI:n pohjaennuste Smartmetista, Harmonie varalla (2026-09)

FMI-lähde on `fmi::forecast::edited::weather::scandinavia::point`. FMI:n muutoslokin mukaan
sen ensimmäiset 9 tuntia tulevat automaattisesti Smartmet nowcastista: MNWC-malli ajetaan
tunneittain, lämpötila, kosteus, tuuli ja puuska harhakorjataan havainnoilla XGBoost-mallilla
(Hieta & Partio 2025, RMSE −24…29 % raakamalliin verrattuna), sade tulee tutkasta (pySTEPS).
Harmonie (MEPS, ajo 6 h välein) jää varalle, jos haku epäonnistuu tai ei tuota rivejä.
Sisäisesti lähdetunnus on edelleen `'harmonie'` (= FMI:n pohjaennuste), koska monet säännöt
nojaavat siihen; `?src=1` näyttää `FMI` tai `HRM` sen mukaan, kumpi oikeasti haettiin.

Yksi näyte 25.9. klo 23 UTC (ennuste +1…+3 h, havainto 23:00, tuuli tasainen):

| Paikka | Harmonie | Smartmet | Havainto |
|---|---|---|---|
| Kaisaniemi | 7,9–8,2 m/s | 5,6–6,0 | 3,9 |
| Harmaja | 10,1–10,2 | 7,7–8,0 | 7,9 |

Resoluutio avoimessa datassa on 7,5 km (Harmonie 2,5 km), mutta meren ja maan ero säilyi
näytteessä. Rivien 0–2 lämpötila ja sade pysyvät met.no:n nowcastissa.

Smartmetin sademäärä on kolmella desimaalilla; se pyöristetään 0,1 mm:iin kuten Harmonien,
muuten 0,04 mm näkyisi "0.0 mm". Pyöristämätön arvo säilyy kentässä `precipitationRaw`
näyttöä varten (ks. "Pieni sade: `~0.0 mm`").

**Puuska.** Smartmetin `HourlyMaximumGust` on käytössä joka rivillä; ensimmäisellä rivillä
nowcastin puuska on varalla. Tunnin maksimipuuska on hetkellistä kovempi, joten `windCell`in
suhteellinen kynnys nostettiin 5 → 7 m/s keskituulta kovemmaksi (käyttäjän päätös 2026-09).
Kiinteä 15 m/s kynnys pysyy. Kynnyksellä 5 puuska näkyi kokeessa neljällä rivillä 13:sta
tavallisena tuulisena yönä (6 m/s → (11), 7 → (13), 7 → (12), 6 → (12)).

### Haut rinnakkain, nowcastin välimuisti poistettu (2026-09)

Nowcast ja met.no:n aurinkoajat haetaan samaan aikaan FMI:n kanssa eikä vasta sen jälkeen;
kumpikaan ei riipu FMI:n vastauksesta. Aurinkoajat esihaetaan päiville, joihin 13 tunnin
ikkuna osuu (latauksen tunti ja +12 h), ja `fetchSunPhases` täydentää FMI:n jälkeen vain
puuttuvat päivät. Mitattu siepatuilla vastauksilla ja viiveillä FMI 1500 ms, nowcast ja
aurinko 500 ms: latausaika 2080 ms → 1570 ms. 17 skenaariossa 19:stä `#out`, pyyntöjoukko
ja virheet olivat merkilleen samat. Ero: kun FMI on kokonaan alhaalla, nowcast- ja
aurinkopyyntö lähtevät nyt turhaan (ennen niitä ei tehty), näkymä on sama.

Samalla poistettiin nowcastin välimuisti (`ensureNowcastBundle`, `NOWCAST_CACHE_TTL`,
`NOWCAST_RETRY_COOLDOWN`, `NC~stale`-tila, `fetchNowcastForHour`). Sivu renderöidään kerran
eikä päivity itsestään, joten välimuistiin ei koskaan osuttu toista kertaa; kolme rinnakkaista
kutsua jakoivat saman haun. Jos sivulle tehdään joskus automaattinen päivitys, välimuisti
kannattaa palauttaa.

**Hylätty: aurinkoajat SunCalcista met.no:n sijaan.** Poistaisi yhden verkkohaun, mutta
näkyvä nousu- tai laskuaika muuttuisi. Mitattu 3 paikkaa (Helsinki, Oulu, Utsjoki) × 24
päivää 2026: 19 kellonaikaa 128:sta täsmäsi minuutilleen; SunCalc oli 88 kertaa 1–8 min
myöhemmin ja 21 kertaa 1–4 min aiemmin, suurin ero 8 min (Utsjoki, elokuun lasku).
`vendor/suncalc-1.9.0.js` on tavutarkasti npm:n suncalc 1.9.0, joten ero on kirjaston eikä
vendoroinnin. Hämärärajat tulevat siis eri laskimesta kuin nousu ja lasku; jos SunCalcin
hämärärajat ovat pielessä samaan suuntaan, illan porvarillinen hämärä näkyy muutaman
minuutin liian pitkänä (päätelty, ei mitattu).

### Pieni sade: `~0.0 mm` (2026-09, käyttäjän päätös)

Kun sateisella tunnilla pyöristetty määrä on 0 ja rivi näyttäisi `0.0 mm`, mutta
pyöristämätön ennustearvo (`precipitationRaw`) on nollaa suurempi, näytetään `~0.0 mm`.
Tasan 0 sateisella selitteellä on edelleen `0.0 mm`, ja kuivalla selitteellä pieni määrä
on `—`. Märkä/kuiva-päättely, korostukset ja harmaus käyttävät yhä pyöristettyä arvoa;
tilde muuttaa vain tekstin. Nowcast-riveihin tämä ei vaikuta: met.no antaa määrän
0,1 mm:n tarkkuudella, joten sen alle 0,1:n kynnys (`nowcast.val < 0.1 ? 0`) ei käytännössä
muuta mitään (tarkistettu viidestä pisteestä 2026-09-26).

### Aurinkotapahtuman tunnin jälkeinen vaihe seuraavalla rivillä, kellonajan kanssa

Auringonnousun tai -laskun tunnilla ei anneta seuraavan vaiheen ilmoitusta
(`!sunEvent`-ehto `analyzeTwilightForHour`issa on tarkoituksellinen). Laskutunnin
jälkeen alkava vaihe näkyy seuraavalla rivillä versaalina ja edellisen tunnin
alkuajalla: klo 20 `NAUTTINEN HÄMÄRÄ (19:56)`, sekä kuivana että sateisena.
Aiemmin sateiselta riviltä puuttui aika, jolloin jäi paljas `NAUTTINEN HÄMÄRÄ`.
Sateisen tunnin alkamisilmoitus saa nyt aina kellonajan.

Kokeiltiin myös ilmoitusta laskutunnille (`nauttinen 19:56` klo 19) ja toiston
estämistä seuraavalta riviltä; hylättiin käyttäjän päätöksellä.

### Ditto-rivi säilyttää myös pääselitteen edellä olevat merkinnät

`»`-rivillä näytetään pääselitteen edellä oleva osa (aurinkotapahtuma, esim.
`auringonlasku 19:14`) `»`:n yläpuolella. Aiemmin ditto säilytti vain pääselitteen
jälkeiset merkinnät, jolloin sateisen tunnin nousu- tai laskuaika katosi.

### Aurinkotapahtuman paikka: aikajärjestys hämäräpääsanan kanssa, muuten alla

Kun pääselite on hämärävaihe, merkinnät ovat aikajärjestyksessä: illalla auringonlasku
yläpuolella (`auringonlasku 19:14` → `PORVARILLINEN HÄMÄRÄ` → seuraava vaihe), aamulla
auringonnousu alla (`PORVARILLINEN HÄMÄRÄ` → `Aurinko nousee 07:45.`). Kun pääselite on
sää (sateinen tai kuiva), aurinkotapahtuma on aina alla: `ripsii` → `auringonlasku 19:14`.
Ehto on `twilightMain && sunEvent.type === 'set'` (`decorateDescription`).

Aiemmin sijainti riippui minuuteista (`< 30` yläpuolelle) pääselitteestä riippumatta.
Palautus = `formatSunEventTag`in `beforeMain` takaisin ehdoksi `minutes < 30`.

### Nowcastin sanasto

Käyttäjän päättämät sanat:

| met.no | sana | peruste |
|---|---|---|
| lightrain / rain / heavyrain | ripsii / satelee / saavista kaatuu | "saavista kaatuu" vain tutkatiedolle; Harmonien 39 on "kaatosadetta" |
| lightsleet / sleet / heavysleet | märkä hiutale / räntää / tiskirättiä | sama lähtösana kuin Harmonie 47–49 |
| lightsnow / snow / heavysnow | kevyt hiutale / lunta / pyryttää | sama lähtösana kuin Harmonie 57–59 |
| light/–/heavy rainshowers | kevyttä välisuihkua / välisuihkuja / kunnon välisuihku | met.no:n asteikko on voimakkuus, FMI:n 21/24/27 kattavuus; epäkoherentti muoto tarkoituksella |
| light/–/heavy sleetshowers | pientä räntäkuuroa / räntäkuuroa / kunnon räntäkuuro | ei Harmonie-vastinetta |
| light/–/heavy snowshowers | pientä välihiutaletta / lumikuuro / tehokas lumitoimitus | ei Harmonie-vastinetta |

Jokaisella sanalla on myös `NOWCAST_INFO`-merkintä; nowcast-rivin korostus ja hämärälogiikka
nojaavat siihen eikä tekstiin.

Avoinna: ukkosyhdistelmät (noin 18 met.no-koodia, `*andthunder`) ovat kääntämättä ja
putoavat Harmonielle. Muistinvaraisesti `thunderstorm`, `lightsleetshowers_and_thunder` ja
`snowshowers_and_thunder` eivät ole met.no:n koodeja (met.no kirjoittaa ilman alaviivoja ja
`lightssleetshowersandthunder` kirjoitusvirheineen), joten "seppo riehuu", "sepon tiskivuoro"
ja "lumiukkonen" eivät luultavasti koskaan näy – tarkistamatta. Koodilista ylipäätään on
muistinvarainen; `?dbg=1` näyttää kääntämättömän sadekoodin hakasulkeissa.

---

## Selitteen lähde lähitunneilla (rivit 0–2) – harkinta 2026-09

Linjaus: kolmella ensimmäisellä rivillä **nowcastin selite ensin**, Harmonie varalla.
Tämä on kokeilu. Alla on se, mitä tarvitaan jos linja halutaan myöhemmin kääntää.

### Lähtötilanne ennen muutoksia (korjattu, ks. "Tehdyt päätökset")

- Rivit 0–2: selite nowcastin `symbol_code` → `NC_SYMBOL`; jos käännös puuttuu tai
  symbolia ei ole, Harmonien `SmartSymbol` → `SS_TEXT`. Sade nowcastin
  `next_1_hours.precipitation_amount`, sen puuttuessa hetkellinen `precipitation_rate`.
- Rivit 3–: selite ja sade Harmoniesta.
- Märkä/kuiva-päättely (`descriptorInfoFromOptions`) katsoo **Harmonien koodia ensin**,
  myös silloin kun näytetty teksti on nowcastin. Tästä syntyivät löydetyt viat:
  - `applyContradiction` yliviivaa nowcastin oikean tekstin, kun Harmonie on eri mieltä
    (sekä märkä teksti + Harmonie kuiva että kuiva teksti + Harmonie märkä).
  - "saavista kaatuu" + Harmonie kuiva → koko rivi harmaa (sana puuttuu myös
    `isWetDescriptor`in avainsanoista); "ripsii" samalla datalla korostuu.
  - Kuiva nowcast-tunti hämärässä + Harmonie märkä → hämärä ei pääsanaksi, rivillä
    "sinistä" pimeässä.
- `NC_SYMBOL`ista puuttuu `rain` (nowcastin keskivahva sade näkyy Harmonien sanana).
  Muistinvarainen, verkosta tarkistamaton: `thunderstorm`,
  `lightsleetshowers_and_thunder`, `snowshowers_and_thunder` eivät ole met.no:n koodeja.

### Vaihtoehto, jota ei valittu: selite aina Harmoniesta

Idea: selite = ennusteen lupaus, lähituntien sade = nowcastin havainto, ja
"tai niin ne lupasivat…" = lupaus ja havainto eivät täsmää. Hyvät puolet:

- Ristiriitamerkinnällä olisi yksi johdonmukainen merkitys.
- Koodi ja teksti samaa alkuperää → edellä luetellut viat katoavat itsestään.
- `NC_SYMBOL`in aukot eivät vaikuta selitteeseen; `SS_TEXT` on rikkaampi.
- Ei lähdesaumaa selitesarakkeessa; ditto ei yhdistä eri lähteiden sanoja.
- Todennäköisesti vakaampi latauskertojen välillä (ei mitattu).

Hinta: tutkan näkemä rankkasade voi jäädä sanaksi "ripsii" (nykyinen ristiriitasääntö ei
huomaa voimakkuuseroa), nowcastin varma sumumuoto "Näkyvyys: ei ole." katoaa, ja
ristiriitamerkintöjä tulee useammin (toiston karsinta tärkeämpi).

Jos linja käännetään: selite aina `ssText(hour.smartSymbol)`, ristiriitasääntöön
voimakkuusero, toiston karsinta. Hämärälle pitää päättää, ratkaiseeko märkä lupaus vai
nollamittaus onko tunti sateinen.

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
