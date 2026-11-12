# Luin: Postihuilun kuvitus

Hyllyyn 12.11.2026 (käyttäjän pyyntö). Ei toteutettu eikä päätetty. Esittelysivu kuvineen:
[luin-postihuilu-kuvitus.html](luin-postihuilu-kuvitus.html) (vaalea ja tumma teema, e-ink-koe, asiayhteyskuvat 390 ja
360 px:n leveydellä).

Käyttäjän muistioista: tinapilli tai nokkahuilu, lyhyt ja paksu, polygonimielikuva, kulmikas nuottiviivasto, nuotti
tai lambda, reiät palloina tai salmiakkeina, sorvausrenkaat tai ei, kulmikkaat ääniaallot tai aaltoileva viivasto
varrellisine salmiakkinuotteineen, liike ja vanhanajan yksinkertaisuus, lukulistasta kolme pistettä huilutettua,
silmät kiinni -huilutus, lambda.

Sivulla on 18 kuviota viidessä perheessä: esine (1–4), logon ja lambdan kielioppi (5–6), nuotit ja viivasto (7–10),
tila ja liike (11, 13), typografia ja napit (15–18).

Mitattu luin.html:stä 12.11.2026 (tarkista uudelleen, jos lukulistan Postihuilu-rivi on muuttunut):

- Otsikkorivin *POSTIHUILU* kirjasin on 11,84 px, rivi 18 px ja i-merkki 14 px. Enintään noin 12 px:n merkki ei
  muuta rivin korkeutta.
- 18 px:n merkki ja 6 px:n väli *Soita huilua!* -napissa vievät kentältä 24 px. Paikanpitäjä tarvitsee 199 px, joten
  se katkeaa 360 px:n näytöllä (kenttä 179 px). Ilman merkkiä se katkeaa vasta 320 px:llä.
- Lambda on jo sanaselityksen merkki (valinnan valikko).

Ehdotus sivun lopussa: merkiksi logon lävistäjähuilu salmiakkireiillä (5), tilaksi varrellinen salmiakkinuotti eli
minima (7), huilutetulle tekstille valikkonapin kolme salmiakkia putkessa (18), merkintöjen taustalähetykselle luomi
ja kolme ripseä (13) ja isoksi kuvitukseksi gregoriaaninen nelilinja (9). Animaatio (11) olisi Luinin ensimmäinen,
joten e-inkissä sitä ei pidä näyttää.

## Kierros 2 (12.11.2026)

Sivu: [luin-postihuilu-kuvitus-2.html](luin-postihuilu-kuvitus-2.html). Käyttäjä piti eniten kierroksen 1 kuvioista
*Otsikon alla huilu* (15) ja *Gregoriaaninen nelilinja, aaltoileva* (9). Palautteen pohjalta:

- **Reiät ovat reikiä** (käyttäjä): salmiakkireikä ei koskaan ylitä putken reunaviivoja, mieluummin pienempi. Sivun
  `huilu()` mitoittaa reiän osuutena putken sisäkorkeudesta (oletus 55 %) ja pitää sen erossa ikkunasta ja nokasta;
  tarkistus ajettiin selaimessa kaikilla sivun mitoilla. Kierroksen 1 kuviot 4 ja 15 korjattiin samaan sääntöön.
- **Huilutettu** = kolmen salmiakin huilu vinossa pystyssä, yläpää oikealla, jyrkempi kuin sanaselityksen linssin
  varsi (58°). Sivulla 62–80°, oletus 72°, nokka ylhäällä. Paikkavaihtoehdot lukulistassa: nimen perässä, tietorivillä,
  valikkonapin paikalla.
- **Varrettomat nuotit** myös kulmikkaalla viivastolla (vapaasti, huippujen taitteissa, vuoristo, viisilinja).
- **Nuotit tuutista**: viivasto lähtee kellosta putken sisältä ja levenee (otsikon kaista, vaakakuvitus, vino huilu
  kaartuvalla viivastolla). Nuottikuva on toistaiseksi kuvitusta.
- Avoinna: kaksi huilua (makaava otsikossa, vino tilana) vai yksi huilu kahdessa asennossa; huilutettu = lähetetty,
  kantautunut vai kumpikin.

Samana päivänä vielä: suu takaisin symmetriseksi kuten kuviossa 4 (käyttäjä: epäsymmetrinen suu teki eri huilun), reiät
80 % sisäkorkeudesta (55 % oli liian pieni, ei kuitenkaan ihon halki), huilun pituus 4 × paksuus, jotta isot reiät
mahtuvat erilleen. **Käyttäjän valinnat:** otsikon kaistaksi lyhyt huilu ja kulmikas nelilinja (15 px), vinon huilun
kulmaksi 68°.

Kolmas palaute ja ensimmäinen kokeilu (12.11.2026): ikkuna reikien värinen, reikäsalmiakit 90° käännettyinä pitkittäin
ketjuksi, joka lomittuu hiukan. Valitsematta jääneet vaihtoehdot poistettiin kierroksen 2 sivulta (käyttäjä: ei enää
aaltoilevia ym.). Kaista ja huilutettu merkki toteutettiin luin.html:ään (`luin/kehitys/postihuilu-kuvio.js`,
`.claude/rules/luin.md`). Huilutettu = kantautunut laatikosta (`e.src === 'laatikko'`); merkin paikka nimen perässä.

