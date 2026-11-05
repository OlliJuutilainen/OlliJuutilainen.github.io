# Luin: maalauskoneen jatko

Hyllyyn 5.11.2026. Pilotti (oma maalaus, kahvat, sanamagnetismi, kopio viitteellä, Wiktionary, DeepL-välilehti) on
toteutettu, ks. `luin/ohje.md` 4.3. Tässä on se, mikä jäi pilotin ulkopuolelle.

## Vakiosivunumerot (Akademie-Ausgabe, KrV A/B, Stephanus, Bekker)

Kopion paikannin on nyt luvun numero. Vakiosivunumeroa Luin ei voi tietää, koska teksteissä ei ole sille merkintää.
Tarvitaan Markdown-konventio, esimerkiksi rivin sisäinen merkki `{4:429}` ja etukenttään järjestelmä
(`vakiosivut: AA` tai `GMS`). Luin näyttäisi merkin hienovaraisena reunanumerona ja ottaisi paikantimeksi valinnan
alkua edeltävän merkin (`GMS 4:429`); lyhyt viite käyttäisi lyhennettä tekijän ja vuoden sijaan, kuten tutkielmassa.
Avoinna: missä muodossa vakiosivut ovat käyttäjän Kant-teksteissä tai `pdf_to_markdown.py`:n tulosteessa. Konventio
pitää valita sen mukaan, ettei Latomo tai md.js joudu arvaamaan.

## Käännös Luinin sisällä

Nyt *Käännä* avaa DeepL:n verkkosivun uuteen välilehteen (ei avainta). Käännöksen saisi valikkoon workerin kautta:
reitti `/api/kaanna` kutsuu DeepL API Freetä (selain ei voi kutsua sitä suoraan, eikä avainta saa sivulle). Vaatii
käyttäjän DeepL API -avaimen, `npx -y wrangler@3.114.17 secret put DEEPL_KEY` ja workerin julkaisun. Avain ei kuulu
repoon. Free-tason kuukausikiintiö on tarkistettava DeepL:n sivuilta ennen päätöstä.

## Kytkin alapalkkiin

Luinin ja selaimen maalauksen valinta on asetuksissa (*Maalaus → Tapa*). Jos kokeilussa tapaa vaihtaa usein, kytkimen
voi siirtää alapalkkiin; alapalkin asettelu on tarkkaan mitattu (laidat, erotin), joten se on oma työnsä.

## Muut liipaisimet

Tuplanapautus sanakirjaan ilman alleviivausta olisi mahdollinen tekstin keskialueella (reunat kääntävät sivua), mutta
mobiiliselaimet voivat tulkita tuplanapautuksen suurennukseksi. Kokeiltava oikealla laitteella ennen toteutusta.

## Todennettava laitteella

Pitkän painalluksen jatkaminen samalla vedolla toimii Chromiumissa. Firefoxissa (Note Air3, Palma) selain voi aloittaa
vierityksen ennen kuin Luin estää sen; silloin maalaus jää painettuun sanaan ja jatkuu kahvasta. Selvitettävä, kumpi
käy, ja tarvitaanko Firefoxille oma ratkaisu (esimerkiksi `touch-action: none` sivutetussa tilassa, jossa teksti ei
vierity muutenkaan).
