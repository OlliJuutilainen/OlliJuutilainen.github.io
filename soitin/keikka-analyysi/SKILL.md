---
name: keikka-analyysi
description: Etsii keikkatallenteesta kappaleiden alkuajat, setinvaihdot, väliajan ja encoret KEICK•WALK-settilistaksi.
---

# Keikkatallenteen kappaleiden alkuajat

Tehtäväsi on löytää konsertin äänitallenteesta kohdat, joissa kappaleet alkavat, sekä setinvaihdot, väliaika ja encoret. Etene kahdessa vaiheessa.

## Vaihe 1: kysy ensin

Älä vielä käsittele äänitiedostoa, vaikka se olisi jo liitetty. Kysy yhdessä viestissä nämä ja kerro, että mihin tahansa saa jättää vastaamatta:

1. Kerro keikan rakenteesta se, minkä tiedät ja jaksat. Esimerkiksi: biisimäärät setti kerrallaan, encorebiisien määrä yhteensä, onko nauhalla väliaika, onko intro- tai outronauhoja ja onko tallenteen alussa tai lopussa muutenkin tiedettävästi jotain varsinaisen keikan ulkopuolista?
2. Haluatko, että yli minuutin välispiikit merkitään omille riveilleen? Silloin näet samalla, miten keikan aika jakautuu soiton ja puheen kesken.

Voit mainita yhdellä lauseella, että hankalista kohdista saa vinkata (esim. ”ekan setin biisi 7 alkaa pitkällä puhelaululla”), mutta se ei ole tarpeen.

Päätä viesti suunnilleen näin: ”Kun olet vastannut niihin, joihin haluat, liitä keikan äänitiedosto ja kirjoita **läpivalaise**. Mp3 käy hyvin. Jos tiedosto on liian suuri, pienempi laatu (esim. 96 kbps mono) riittää tähän.”

Jos pystyt ajamaan koodia, tarkista jo nyt, mitkä työkalut ovat käytettävissä, ja aloita tarvittavat asennukset sillä aikaa, kun käyttäjä vastaa. Asentaminen ei ole tiedoston käsittelyä.

Tämän taidon kansiossa on valmiit skriptit (`scripts/`). Aja heti `python3 scripts/analyysi.py --riippuvuudet`: se kertoo, puuttuuko jokin pakollisista (ffmpeg, numpy, scipy). Asenna puuttuvat, esim. `pip install numpy scipy imageio-ffmpeg` (imageio-ffmpeg tuo ffmpegin, jos järjestelmässä ei ole sitä). Asenna myös inaSpeechSegmenter, joka erottelee puheen ja musiikin tarkemmin, taustalle ja ilman GPU-paketteja: `pip install --no-deps inaSpeechSegmenter && pip install tensorflow-cpu pandas scikit-image soundfile pytextgrid`. Se lataa mallinsa verkosta ensimmäisellä ajolla. Jos asennus ei onnistu muutamassa minuutissa, jatka ilman.

## Vaihe 2: läpivalaisu

Aloita, kun sinulla on äänitiedosto ja käyttäjä on joko kirjoittanut ”läpivalaise” tai vastannut kysymyksiin. Jos tiedosto puuttuu, pyydä se yhdellä lyhyellä viestillä ja kerro, että ”läpivalaise” käynnistää työn.

Tee läpivalaisu tässä järjestyksessä:

1. Aja `python3 scripts/analyysi.py <äänitiedosto> --setit 11,10 --encoret 3 --yleiskuva --json ehdokkaat.json --piirteet piirteet.npz` (määrät käyttäjän vastauksista; jätä pois, mitä ei kerrottu). Uusi ajo lukee mittaukset `piirteet.npz`:stä. Omassa lisäkoodissa saat ne `from analyysi import lataa_piirteet, osio` (ks. skriptin alku).
2. Hahmottele ensin keikan rakenne yleiskuvasta ja ehdokkaista: setit, nauhat, yli minuutin spiikit ja encore-tauko. Rakennevirhe on kalliimpi kuin yksittäinen rajavirhe, koska se vääristää määrätarkistuksen.
3. Käy sitten rajat läpi. Luokat ovat todisteita, eivät päätöksiä: RAJA ja SAUMA ovat todennäköisiä kappaleiden alkuja, MODULAATIO?, BREAK, HÄNTÄ ja HEIKKO todennäköisesti eivät, ja SPIIKKI on oma rivinsä. Rivin huomautus *nauhan tunnusmerkit* (taso selvästi alle musiikin mediaanin ja tasainen pulssi) viittaa nauhaan. Encore-aplodien alku ([Vielä!]) näkyy HÄNTÄnä tai SPIIKKInä. Tulosteen alussa on luokkien selitykset. Aja omaa lisäkoodia, kun jokin kohta vaatii tarkempaa mittausta.
4. Katso lähikuvat jokaisen SPIIKKI-jakson alusta ja lopusta sekä epäselvistä rajoista: `python3 scripts/zoom.py <äänitiedosto> --ruudukko 12:41,13:05,20:10 kuva.png` (enintään kuusi kohtaa, 30 s:n ikkunat; mel-spektrogrammi ja kolmen kaistan tasokäyrä). Ilman inaSpeechSegmenteria puhearvio on karkea: laulu, vaimeneva loppu ja aplodit voivat näkyä puheena.
5. Kirjoita ennen vastausta itsellesi taulukko: kappale, aika, luokka, todiste. Rivi ilman todistetta ei kelpaa.
6. Kirjoita vastauksen koodilohkon rivit tiedostoon ja aja `python3 scripts/analyysi.py --tarkista lista.txt --setit 11,10 --encoret 3 --ehdokkaat ehdokkaat.json`. Korjaa muotovirheet. Käy TARKISTA-rivit läpi lähikuvista, ja korjaa ne tai kerro vastauksessa, miksi rivi on oikein. OK koskee muotoa ja määriä, ei rajojen paikkoja.

## Tärkeintä: mittaa, älä arvaa

Tämä on mittaustehtävä, ja se tehdään koodilla. Pelkkä kuuntelu ei riitä: pitkässä tallenteessa ajantaju kelluu ja ajat päätyvät arvauksiksi.
- Jos et pysty ajamaan koodia tai käsittelemään tiedostoa, sano se äläkä anna aikoja.
- Perustaso riittää: äänitaso, hiljaiset kohdat, spektri sekä tempo ja sävellaji osioittain (esim. ffmpeg ja numpy/scipy). Jos saat käyttöön puheen ja musiikin erottelijan tai litteroinnin, käytä niitä lisänä.
- Käsittele pitkä tiedosto noin kymmenen minuutin paloissa, ettei muisti lopu.
- Käytä kerrottua kappalemäärää tarkistuksena, älä rajan perusteena: etsi jokaiselle rajalle oma todiste, kuten tauko, aplodit, puhe, edellisen kappaleen loppu tai tempon vaihdos. Jos alkuja on liian vähän tai liikaa, tarkista ensin keikan rakenne (nauhat, setin raja, encore) ja vasta sitten yksittäiset rajat.
- Jos et pääse tiedoston loppuun asti, kerro, mihin kohtaan pääsit.

## Säännöt

Ajat ovat keikan navigointimerkkejä: kun kuulija painaa listalta biisiä, biisin pitää alkaa. Ne eivät ole levyn raitarajoja.

- Kappale alkaa, kun soitto alkaa, sisäänlasku mukaan lukien. Merkitse alku noin sekunti ennen ensimmäistä ääntä.
- Puhe sekoittuu paljon useammin kappaleen alkuun kuin loppuun: soitto alkaa usein jo puheen alla, ja kappale alkaa silloin soiton alusta eikä puheen lopusta. Jos puolen minuutin tai pidemmän rämpyttelyn jälkeen vaihde selvästi vaihtuu, kappale alkaa vaihdosta. Jos alku liukuu tasaisesti eikä selvää alkukohtaa ole, ja varsinkin jos puheessa on rytmiä, puhe voi olla osa kappaletta: silloin kappale alkaa kaaren aiemmasta selvästä alkukohdasta. Rajan saa vetää suurpiirteisesti.
- Kappale vaihtuu vasta, kun edellinen loppuu. Raja ilman taukoa vaatii lopun merkin (soiva loppusointu tai vaimeneminen, aplodit, puhe) tai tempon katkoksen; ne painavat enemmän kuin sävellaji. Pelkkä sävellajin tai soittotavan vaihto samassa tempossa on saman kappaleen modulaatio tai osanvaihto. Ratkaise samanlaiset kohdat samoin.
- Aplodit ja välispiikit kuuluvat edelliseen kappaleeseen. Yli minuutin puhe, tauko tai muu soittamaton jakso on oma rivinsä, ellei käyttäjä toivonut muuta.
- Jos käyttäjä mainitsi intro- tai outronauhan tai tunnistat sellaisen melko varmasti, merkitse sen alku omaksi rivikseen. Outronauhan alku löytyy setin lopusta taaksepäin edeten; se voi alkaa lähes suoraan viimeisen kappaleen perään. Tunnista nauha mittaamalla eikä sointivärin vaikutelmasta: nauha soi yleensä eri tasolla kuin bändi ja tasaisemmalla pulssilla.
- Setinvaihto vain, jos se on ilmeinen: katko tallenteessa, kuulutettu väliaika tai yli kolmen minuutin tauko. Muuten koko tallenne on yhtä settiä.
- Väliaika on oma settinsä, jos käyttäjä kertoi väliajasta tai jos setin viimeisen spiikin ja seuraavan setin ensimmäisen intron tai spiikin väliin jää yli viisi minuuttia. Väliaika alkaa siitä, mihin setin viimeisen kappaleen aplodit ja spiikit päättyvät, tai väliaikamusiikin alusta, jos se alkaa jo niiden aikana.
- Ilman väliaikaa setin raja vedetään setin viimeisen ja seuraavan setin ensimmäisen kappaleen väliin. Seuraavan setin intronauha ja sisääntuloaplodit kuuluvat seuraavaan settiin, muu häntä edellisen setin loppuun.
- Kaikki encoret ovat yhdessä omassa setissään. Encore alkaa, kun bändi poistuu ja aplodit jatkuvat, kunnes soitto alkaa uudelleen. Jos encorebiisien välissä on yli minuutin aplodit, siitä alkaa uusi encore.

## Vastauksen muoto

Vastaa ensin yhdellä koodilohkolla, jossa on vain näitä rivejä:
- kappale: juokseva numero, piste ja alkuaika (yli tunnin kohdalla h:mm:ss)
- soittamaton jakso: pelkkä alkuaika. Jos käyttäjä on antanut jaksolle nimen, alkuaika ja nimi hakasulkeissa.
- setinvaihto: --- omalla rivillään ennen uuden setin ensimmäistä riviä
- väliaika: ---, rivi alkuaika ja [VÄLIAIKA], sitten --- ennen seuraavaa settiä
- encoret: --- ja sen alle omalle rivilleen (+). Jokaisen encoren alkuun, aplodien alkukohtaan, rivi alkuaika ja [Vielä!].

Ajat kokonaisina sekunteina ja kasvavassa järjestyksessä. Ei kappaleiden nimiä eikä kommentteja. Esimerkki muodosta (ajat keksittyjä):

```
1. 0:41
2. 5:12
9:03
3. 10:15
---
47:20 [VÄLIAIKA]
---
4. 1:02:30
---
(+)
1:29:40 [Vielä!]
5. 1:31:02
```

Kerro lohkon jälkeen lyhyesti:
- epävarmimmat rajat: kappale, aika, vaihtoehtoinen aika ja miksi
- rajat, jotka perustuvat pelkkään käyttäjän kertomaan kappalemäärään
- jos kappaleita, settejä tai encoreja on eri määrä kuin käyttäjä kertoi
- yhdellä rivillä, millä keinoin mittasit

Kuvaa perusteluissa ääntä (sävyllinen soitto, rytminen pulssi, laulu, puhe, aplodit) äläkä nimeä soittimia: mittauksista ei voi luotettavasti erottaa soittimia toisistaan.

## Taustaa

KEICK•WALK on yksityishenkilön ystävilleen tekemä verkkosoitin. Se soittaa keikkatallennetta Google Drivesta tai Dropboxista ja näyttää sen kappalelistana, josta voi hypätä suoraan kappaleen alkuun. Lista tehdään näistä alkuajoista, joten ne ratkaisevat, mistä kohtaa kukin kappale soi.
