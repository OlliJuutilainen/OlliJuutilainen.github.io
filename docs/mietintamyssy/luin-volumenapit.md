# Luin: sivunkääntö äänenvoimakkuusnapeilla

Hyllyyn 2.11.2026. Ei toteutettu. Lähtötilanne: Luinia luetaan Light Phone 3:lla Native Alphan
kautta, ja Key Mapper on laitteessa jo kovassa käytössä.

Kysymykset:

1. Miten LP3:n volumenapit saisi kääntämään sivua mahdollisimman kätevästi?
2. Helpottaisiko asiaa merkittävästi, jos Luinista tekisi Android-sovelluksen?
3. Voiko sivunkäännön volumenapeista saada satunnaiselle verkkoselaimen käyttäjälle tai Palman
   käyttäjälle, joka on Booxin asetuksista ohjannut napit PageUp/PageDowniksi?

## Lähtökohta koodissa (2.11.2026)

`luin.html`:n `keydown`-käsittelijä kääntää sivua sivutettuna näppäimistä `ArrowRight`/`ArrowDown`/
`PageDown`/`AudioVolumeDown`/välilyönti (seuraava) ja `ArrowLeft`/`ArrowUp`/`PageUp`/`AudioVolumeUp`/
vaihto+välilyönti (edellinen). Näppäimet toimivat myös verhon takana (päätös 1.11.2026).
Reunanapautus kääntää sivun, kun napautus osuu ruudun vasempaan tai oikeaan 30 %:iin, ei viitenumeron,
kirjanmerkin tai alleviivauksen päälle eikä alakaistalle; avoin ponnahdus sulkeutuu ensin. Vierityksessä
näppäimet ja reunanapautus eivät tee mitään.

## Todennettua

- **Chromium ei välitä volumenappeja sivulle.** `content/public/android/.../ContentUiEventHandler.java`,
  `shouldPropagateKeyEvent()`: `KEYCODE_VOLUME_DOWN`, `KEYCODE_VOLUME_UP` ja `KEYCODE_VOLUME_MUTE`
  palauttavat `false` (luettu lähdekoodista 2.11.2026). Koskee Chromea, Bravea, Samsung Internetiä,
  Android WebViewtä ja siis myös Native Alphaa. Sivu ei voi pyytää niitä. Luinin `AudioVolume*`-haarat
  eivät siis koskaan laukea näissä; ne ovat harmittomia.
  <https://chromium.googlesource.com/chromium/src/+/main/content/public/android/java/src/org/chromium/content/browser/ContentUiEventHandler.java>
- **Key Mapper** (ohjeet 2.11.2026):
  - *Input key code / Input key event* vaatii Android 11:ssä ja uudemmissa Shizukun tai Key Mapperin
    oman näppäimistön (GUI Keyboard tai Basic Input Method). <https://keymapper.app/user-guide/actions/>
  - *Tap screen* (2.1.0+, Android 7+) ja *Swipe screen* (2.5.0+) toimivat saavutettavuuspalvelulla.
  - Rajaus *App in foreground*: kartta toimii vain, kun valittu sovellus on aktiivinen ikkuna.
    <https://keymapper.app/user-guide/constraints/>

## Todentamatta

- Saako Key Mapper LP3:lla volumenapit ollenkaan, vai sieppaako LightOS ne.
- Välittääkö Firefox Androidilla (GeckoView) volumenapit sivulle. Mozillan bugi 1272578 koskee vain
  nimiä `AudioVolumeUp/Down`, ei Androidia.
- Mitä Booxin sovelluskohtainen volumenappien sivunkääntö lähettää (näppäin, pyyhkäisy, vieritys).
  Oikealla Boox-laitteella ei ole testattu (`luin/ohje.md`).
- LP3:n Android-versio (vaikuttaa Shizuku-vaatimukseen).

## 1. LP3 + Native Alpha + Key Mapper (ei koodia)

**Ensin ADB-kokeet** (Luin auki Native Alphassa, sivunkääntö valittuna):

```bash
adb -s <LP3-serial> shell input keyevent KEYCODE_PAGE_DOWN
adb -s <LP3-serial> shell wm size
adb -s <LP3-serial> shell input tap <leveys − 20> <korkeus / 2>
```

Lisäksi Key Mapperin painalluksen tallennus kertoo, näkyvätkö volumenapit sille.

**Tapa A (suositus): Tap screen.** Volume down → *Tap screen* oikeaan marginaaliin (ei tekstin päälle,
ettei osu viitenumeroon), volume up → vasempaan. Rajaus *App in foreground* = Native Alpha (koskee
kaikkia Native Alphan verkkosovelluksia). Ei Shizukua eikä näppäimistövaihtoa. Rajoitukset: kiinteät
koordinaatit; vain sivutettuna ja reunanapautus päällä (oletus); avoin ponnahdus vie ensimmäisen
painalluksen; verhon takana (navi, asetukset) napautus ei käännä.

**Tapa B: Input key event PAGE_DOWN / PAGE_UP.** Luin hyväksyy sellaisenaan, myös verhon takana, ei
koordinaatteja. Vaatii Shizukun (käynnistettävä uudelleen jokaisen uudelleenkäynnistyksen jälkeen ADB:llä
tai langattomalla virheenkorjauksella) tai Key Mapperin näppäimistön, joka syrjäyttäisi kirjoitusnäppäimistön.

## 2. Oma Android-kääre

Activity saa volumenapit ennen WebViewtä (`dispatchKeyEvent`), joten kääre voi välittää ne sivulle
synteettisinä `keydown`-tapahtumina (`PageDown`/`PageUp`, `evaluateJavascript`). Luinin nykyinen
käsittelijä hyväksyy ne ilman muutoksia (`e.target.closest`-tarkistukset on vartioitu, joten kohteeksi
käy `document`). Pohja: `android/soitin/` (WebView, DOM storage, JS-silta). Arvio: satakunta riviä Javaa.

Lisävalinta: volumenapit sivunkääntönä vain sivutetussa lukunäkymässä, muuten äänenvoimakkuutena.
Vaatii, että `luin.html` kertoo sillalla tilansa (`nakyma`, `sivutus`), koska `evaluateJavascript` on
asynkroninen eikä ehdi päättää, kulutetaanko näppäin. Vierityksessä voisi myös vierittää ruudullisen.

Edut: ei Key Mapperia, Shizukua eikä koordinaatteja; jaettavissa muille kuten `soitin.apk`.
Hinta: localStorage on sovelluskohtainen, joten Native Alphan lukulista ja merkinnät eivät siirry
(merkinnät Vie/Tuo-toiminnolla, tekstit uudelleen Latomosta tai postilaatikosta). Jos kääre lataa
github.io-osoitteen, Luin päivittyy itsestään; APK päivitetään vain kääreen muuttuessa.

Arvio: Ollille ei merkittävä helpotus tapaan A verrattuna. Järkevä, jos A osoittautuu epäluotettavaksi
tai ominaisuus halutaan muille.

## 3. Ulkopuoliset käyttäjät

- Chromium-selaimet ja WebView-sovellukset: ei mitenkään (ks. todennettua).
- Firefox Android: avoin. Jos välittää, nykyinen koodi toimii jo.
- Palma + Booxin asetus: todennäköisesti toimii jo. PageDown/PageUp ja nuolet kuunnellaan; pyyhkäisy
  kääntää (oletuksena päällä). Testattava oikealla Palmalla.
- Bluetooth-sivunkääntäjät: nuolia tai PageDownia lähettävät toimivat, volume up -kameralaukaisimet eivät.

## Jatkoaskeleet, jos otetaan hyllyltä

1. ADB-kokeet LP3:lla.
2. Tapa A Key Mapperiin.
3. Palma: Booxin asetus ja kokeilu.
4. Pieni näppäintestisivu (näyttää sivulle tulevat näppäin-, kosketus- ja rullatapahtumat) Palman,
   Firefoxin ja LP3:n selvittämiseen.
5. Android-kääre vain, jos A ei riitä tai halutaan jakaa.
