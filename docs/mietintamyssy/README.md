# Mietintämyssy

Hyllyyn laitetut konsepti-ideoinnit: pohdintoja mahdollisia myöhempiä toteutuksia varten. Mitään
tästä kansiosta ei ole toteutettu eikä päätetty. Kun idea otetaan työn alle, lue sen tiedosto ensin,
mutta tarkista väitteet uudelleen: tiedot ovat kirjoitushetken tilanne.

## Jatka tästä (käyttäjän kuuden kohdan lista 20.11.2026)

Käyttäjä pyysi 20.11.2026 viittä mietintämyssyn kärkikohtaa ja kuudenneksi maalauskoneen vakiosivut. Tehty: augustinus.it-sovite,
GRETIL-sovite ja vakiosivut (opas 3.2 *Vakiosivut*, `vakiosivu-testi.js`). Keskeytetty käyttäjän pyynnöstä; jäljellä järjestyksessä:

1. ~~Kellarin sanaston huolto~~ *tehty 21.11.2026* (järjestysrivin *sanasto*, opas 2.5).
2. ~~Perseus: erilliset tekstit~~ *tehty 21.11.2026* (*kukin omaksi tekstikseen*, opas 7.5). Tarvitsee lisäosan uuden version.
3. **Viiden sivuston yleisen leikkauksen mittaus** ([luin-sivustoehdokkaat-3.md](luin-sivustoehdokkaat-3.md), järjestyksen kohta 8):
   Girardian Lectionary, Phenomenology Online, Lacan Online, The Hedgehog Review ja The Immanent Frame. Lisää pesukoneeseen sarja,
   mittaa yleinen leike ja tee sovite vain, jos se ei riitä.

Tehdyistä avoimeksi jäi: augustinus.it ei kokoa koko teosta sisällysluettelosta (vain kehyksessä avatun kirjan), GRETILin luvuilla
ei ole otsikoita (säenumerot 1.1 … 27.30 ovat aikajanan kohtia), ja vakiosivu näkyy tekstin seassa eikä reunanumerona.
augustinus.it ja kb.dk katkoivat kontin toistuvat haut (curl 35): hae välimuisti hitaasti, jos sarjat `aug` tai `kb` pitää ajaa uudelleen.

| Tiedosto | Aihe | Hyllyyn |
|---|---|---|
| [luin-volumenapit.md](luin-volumenapit.md) | Luin: sivunkääntö äänenvoimakkuusnapeilla (Light Phone 3, oma Android-kääre, ulkopuoliset käyttäjät) | 2.11.2026 |
| [luin-maalauskone.md](luin-maalauskone.md) | Luin: maalauskoneen jatko (vakiosivunumerot kopioon, käännös Luinin sisällä, kytkin alapalkkiin, laitetestit); vakiosivut tehty 20.11.2026 | 5.11.2026 |
| [luin-lisaosa-md-lataus.md](luin-lisaosa-md-lataus.md) | Luin: Lisää lukimeen -leikkeen lataus koneelle .md-tiedostona | 9.11.2026 |
| [luin-postihuilu-kuvitus.md](luin-postihuilu-kuvitus.md) | Luin: Postihuilun visualisointi-ideat (huilut, salmiakkinuotit, viivastot, tilamerkit), esittelysivut kierroksilta 1 ja 2 | 12.11.2026 |
| [luin-postihuilu-aaniaukko.html](luin-postihuilu-aaniaukko.html) | Luin: Postihuilun ääniaukko nokkahuilun ikkunan tapaan (täytetty matala siivu ja sen reunoilta alas tyhjä suorakulmio), kuusi versiota ja sormireikien koko 0,85 / 0,75 / 0,65; valittu versio 5 reiät 0,65 leualla, toteutettu `luin/huilu.js`:ään 12.11.2026; samana päivänä kokeiltu viittä reikää ja viittä viivaa, hylätty ja palautettu kolme reikää ja vanha viuhka | 12.11.2026 |
| [luin-postihuilu-valjempi.html](luin-postihuilu-valjempi.html) | Luin: väljempi viivasto (kolme viivaa, harvempi ja korkeampi siksak, lyhyempi, pienemmät sormireiät), muunnelmat 0 ja A–F sekä reikäkoot 0,65 / 0,55 / 0,5 / 0,42; toteutettu B (22°-siksak, reikä 0,5) 16.11.2026 | 16.11.2026 |
| [luin-hyllymerkki.html](luin-hyllymerkki.html) | Luin: kotimerkin (pirtti ja harjasalmiakki) tilalle hyllyä kuvaava merkki: kierros 1 (20 luonnosta) ja [kierros 2](luin-hyllymerkki-2.html) (23 pinoa, myös 12 px ja sumeana); valittu kierroksen 2 nro 16 *Ulkoneva*, toteutettu 12.11.2026 | 12.11.2026 |
| [luin-sivustoehdokkaat.md](luin-sivustoehdokkaat.md) | Luin: sivustoehdokkaat Lukimeen-lisäosan sovitteiksi aiheittain (akateeminen ja humanistinen painotus), käyttäjän kriteereillä karsitut perusteluineen; tehdyt SAET, Gutenberg, New Advent, CCEL, LacusCurtius, Korpora.org/kant, dhammatalks.org, Wikisource, Substack, IEP, Open Yale Courses, NDPR, Il Tascabile, Doppiozero, BMCR, Noema ja Emergence Magazine | 14.11.2026 |
| [luin-liettuankieliset-lahteet.md](luin-liettuankieliset-lahteet.md) | Luin: liettuankieliset lähteet sovitteiksi; ykkönen Problemos ja OJS-alustan sovite (VLE, liettuan Wikipedia, Vikišaltiniai muina); toteutettu 16.11.2026 OJS-sovite (Problemos ja muut journals.vu.lt:n lehdet), liettuan Wikipedia, liettua lukijan kieliin ja tavutukseen; VLE toteutettu 17.11.2026; jäljellä Vikišaltiniai ja *Filosofija. Sociologija* -selainkoe | 16.11.2026 |
| [luin-kellarin-jarjestys.md](luin-kellarin-jarjestys.md) | Luin: kokoelman järjestäminen lukijan tavoilla (fasettikortisto, asiasanat, ajoitus, käsikirjasto; kirjastoluokitus, Zettelkasten, signum ym. arvioituina); toteutettu 17.11.2026 ensimmäinen versio (kellarin veivihyllystön kahdeksan järjestystä, luokittele, latomon kentät), seuraavaksi suositeltu sanaston huolto | 17.11.2026 |
| [luin-sivustoehdokkaat-2.md](luin-sivustoehdokkaat-2.md) | Luin: toinen satsi sivustoehdokkaita, mitattu pilvikontista (noin 300 sivua): mitä noin 50 sovitetta opettivat otollisimmasta sivustosta, kärki 17 (PubMed Central, oikeustapaukset, Ubiquity Press, SPIP, Political Concepts, Project Vox, Embryo Project, CDLJ, Журнальный зал ym.), käyttäjän 18 aihetta jalokivitarkistuksineen, alustat, karsitut ja ehdotettu järjestys | 17.11.2026 |
| [luin-sivustoehdokkaat-3.md](luin-sivustoehdokkaat-3.md) | Luin: kolmas satsi, käyttäjän henkilölistan (Kierkegaard, Hegel, Akvinolainen, Snellman, Luther, Whitehead ym.) innoittamana, mitattu (noin 200 sivua): kärki 12 (KB:n tekstiportaali ja SKS, isidore.co:n latina–englanti-Akvinolainen, Religion Online, Michigan Publishing eli Janeway, PoPuPS, SLS:n editiot, Snellman, Gutenberg-DE ym.), henkilöittäin, Raamatunkäännökset (Wikisource kattaa Agricolasta Rahlfsiin; raamattu.fi ja die-bibel.de samaa alustaa), Erasmus ja renessanssihumanistit (Philological Museum), yleiset ympäristöt, karsitut ja ehdotettu järjestys; tehty kärki 1–11 sekä Newton Project ja Latin Library, raamattu.fi ohitettu (esto); lisäys Augustinus, Nāgārjuna, Spinoza ja Descartes, augustinus.it tehty | 20.11.2026 |
| [luin-perseus-valinnat.md](luin-perseus-valinnat.md) | Luin: Perseus-leikkeen valinnat lisäosassa (kielet: molemmat tai toinen; laajuus: kaikki kirjat yhteen, erikseen tai valitut) ja valintaikkunan huomiot raskaudesta; toteutettu 19.11.2026 (kielet, kirjat yhteen, huomio isosta paketista), erilliset tekstit jäljellä | 19.11.2026 |
