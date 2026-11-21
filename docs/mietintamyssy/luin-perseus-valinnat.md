# Luin: Perseus-leikkeen valinnat lisäosassa

Hyllyyn 19.11.2026 (käyttäjän ajatus). **Toteutettu samana päivänä** (`perseus-valinnat-testi.js`): kielet (molemmat,
alkuteksti, käännös) ja kirjat (numeronapit ja kaikki; valitut yhdeksi tekstiksi). Huomio *Iso paketti* yli 60 000 sanan
leikkeestä (`PS_ISO`, `ponnahdus.js`), vain niillä keinoilla, jotka valinnassa ovat vielä käytössä. Kirjat erillisiksi
teksteiksi yhdellä kertaa *toteutettu 21.11.2026* (*kukin omaksi tekstikseen*, Latomon `#sarja`, opas 7.5). Alla kirjoitushetken suunnitelma.

## Ajatus

Kun Lukimeen-lisäosa leikkaa Perseus-teoksen, se kysyisi ennen leikkaamista kaksi asiaa:

1. **Kielet**: molemmat (lomitettu käännös) vai vain toinen (alkuteksti tai käännös).
2. **Laajuus**: kaikki kirjat yhteen tekstiin, kaikki kirjat erillisiksi teksteiksi vai vain valitut kirjat.

Valintaikkunaan kaksi huomiota:

- Jos lukeminen tökkii, kokeile kirjoja yksi kerrallaan (oletettavasti auttaa, koska sivutettu teksti asetellaan kerralla).
- Kahden kielen paketti vaatii laitteelta enemmän, eikä lukeminen välttämättä ole yhtä sulavaa.

## Nykytila (19.11.2026)

- `perseus()` (`luin/lisaosa/leike.js`) leikkaa osoitteen ylimmän jaon: `book=1` antaa kirjan 1, osoite ilman jakoa koko teoksen.
- Kreikan- tai latinankieliseltä sivulta lisäosa yrittää aina lomitusta (`psLomitus()`); vain alkuteksti tulee, jos käännöstä ei löydy.
- Lukimessa Kielet-asetus (`aset.lomitus`) piilottaa toisen kielen pelkällä CSS:llä; piilotettu kieli on silti DOMissa ja
  aseteltavana, joten se ei kevennä laitetta. Kevennys vaatisi leikkeen, jossa toista kieltä ei ole.

## Avoimia kysymyksiä

- Erilliset tekstit: yksi leike kirjaa kohti vai yksi lähetys, joka tekee monta tekstiä?
- Valitut kirjat: valintaruudut teiHeaderin tai XML:n `div type=book` -luettelosta.
- Paljonko kirjan koko oikeasti hidastaa Light Phonea: mittaa ennen kuin teet laajuudesta oletusta.
