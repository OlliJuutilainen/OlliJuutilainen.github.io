# Mikä on Markdown, ja miksi se on Luinin kannalta olennainen käsite?

Tusinasoft\
marraskuu 2026

## Pelkkää tekstiä

Tekstinkäsittelyohjelmien omat tiedostomuodot tulevat ja menevät, mutta pelkkä tekstitiedosto (`.txt`) on kestänyt tuiskut ja tuulet kymmeniä vuosia. Markdown-tiedosto (`.md`) on pohjimmiltaan juuri sitä: tavallista tekstiä, jonka voi avata millä tahansa laitteella ja ohjelmalla.

Markdownissa on silti olennaiset muotoiluun liittyvät kyvyt: kursivointi, lihavointi, lainaukset, otsikot hierarkioineen, alaviitteet ja rakenneosien jaot. Nämä valinnat voi tehdä ilman perinteisen tekstinkäsittelyohjelman hiirellä klikattavien muotoiluasetusten viidakkoa. Muotoilut tehdään yksinkertaisilla tekstin sekaan kirjoitetuilla erikoismerkeillä, kuten `*` ja `#`: kirjoita `*näin*`, ja saat *näin*.

Markdownin sanasto on **pääpiirteiltään** laajasti jaettu. Murteita on, mutta perusmerkinnät ymmärtää lähes jokainen Markdownia käsittelevä ohjelma.

## Markdown Luinissa

Luiniin voi lisätä verkkotekstejä Chrome- ja Firefox-selainten Lisää lukimeen -lisäosan automaation avulla, mutta Latomoon voit liittää myös minkä tahansa oman tekstisi.

Mitään vaatimusta ei ole, että teksti olisi jäsennelty Markdownin etiketin mukaisesti: pelkkä teksti käy. Merkinnät kuitenkin palkitaan. Latomo kääntää otsikot, kursivoinnit ja alaviitemerkinnätkin kauniisti jäsentyvään asetteluun lukimessa luettavaksi.[^Tämä on alaviite. Se on kirjoitettu suoraan tekstin sekaan; merkintätapa on alempana sanastossa.]

Lisäksi Luin muodostaa risuaitasarjoilla (`#`, `##`, `###`, `####`) varustetuista otsikoista **sisällysluettelon**, joka voi halutessa näkyä tekstin alussa. Otsikot näkyvät myös merkkipaaluina aikajanalla.

Markdownin perinteisten ominaisuuksien ylittävänä tekijänä Luin tunnistaa tekstin lopussa mahdollisesti olevan lähde- tai kirjallisuusluettelon. Alaviitteiden viittaukset, joilla on kirjallisuusluettelossa ilmeinen vastine, saavat tekstinsisäisen linkin luettelon kohtaan.

### Luinin Markdown-sanasto

- `# Otsikko`: tekstin nimi. Sen alle voi kirjoittaa kursivoidun alaotsikon ja tietorivejä, kuten tekijän ja päiväyksen.
- `## Luku`, `### Osio`, `#### Kohta`: otsikot hierarkioineen. Numeroitu otsikko (`## 2. Luku`, `### 2.1 Osio`) on myös kelvollinen.
- `*kursiivi*` ja `**lihavointi**`.
- `> Lainaus.` Lainauksen lähde omalle rivilleen ajatusviivalla: edellisen rivin loppuun kenoviiva `\` ja seuraavalle `> – Lähde`.
- `- luettelo` ja `1. numeroitu luettelo`. Sisäkkäiset luettelot neljällä välilyönnillä.
- `[^Alaviitteen teksti.]` suoraan tekstin sekaan, tai tunnuksella: tekstiin `[^1]` ja omalle rivilleen `[^1]: Alaviitteen teksti.`
- `## Kirjallisuus` (tai *Lähteet*, *References*, *Bibliography* ym.): seuraavat kappaleet ovat kirjallisuusluettelon kohtia.
- `---` omalla rivillään: vaakaviiva rakenneosien väliin.
- Kenoviiva `\` rivin lopussa: rivinvaihto kappaleen sisällä.
- `==korostus==` ja `~~yliviivaus~~`.
- `https://…` tai `[linkin teksti](https://…)`: verkkolinkki.
- Taulukot pystyviivoin: `| sarake | sarake |`.
- `{{TOC}}` omalla rivillään: sisällysluettelon paikka. `+++`: sivutettuna uusi sivu.
- `// kommentti` rivin alussa: ei näy lukimessa.

Jos olet jo Markdown-asioissa harrastunut: yllä oleva Luinin sanasto pohjautuu **iA Writer** -nimisen kirjoitus- ja muistiinpanosovelluksen tyyliin.

## Markdown Luinin ulkopuolella

Tusinasoftin johtoryhmä ei pidä huonona ideana tutustua Markdowniin digitaalisen tekstin kirjoittamisen ja välittämisen muotona myös Luinin ulkopuolella.

Markdownia voi tuottaa sinänsä millä tahansa tekstiä suoltavalla editorilla, juurevimmillaan vaikka Macin TextEditillä (pelkän tekstin tilassa) tai Windowsin Muistiolla. Mikään ei estä, etteikö taivas olisi rajana pelkästään näiden käyttämisessä Markdown-tekstien tuottamiseen.

Varsinaisesti Markdown-käyttöön tarkoitettuja ohjelmia on myös lukuisia, ja yksinkertaisen toimintaperiaatteen takia suurin osa niistä toimii erittäin kevyesti. Ohjelmia on eri tyylilajeissa, mutta karkeasti voisi yleistää kaksi erityistä lajityyppiä:

1. kirjoituskonetyyppiset työkalut ja
2. muistiinpanojen tuottamiseen ja erityisesti pienistä muistiinpanoista muodostuvien laajojenkin tekstiorganismien hallintaan soveltuvat työkalut.

## Esimerkkejä Markdowniin keskittyvistä sovelluksista

Yllä mainittu iA Writer suuntautuu kyvyiltään olennaisesti ryhmän 2 kykyihin eli laajojen tekstitiedostovarantojen helppoon hallintaan ja myös yhteyksien luomiseen tekstien välillä. Tusinasoftin johtoryhmä ei ole oikeutettu arvioimaan iA Writeria muita olemassa olevia työkaluja paremmaksi Markdown-työstämisen ohjelmistoksi, koska pitkäaikaista kokemusta muista ohjelmista ei ole. Johtoryhmä kuitenkin valehtelisi, jos väittäisi olevansa saamatta jotain mielihyvää tästä tekstinkäsittelytyökalusta, eikä mielihyvän toteutuminen tunnetusti ole aina ensimmäinen mieleen tuleva asia suosittujenkaan tekstinkäsittelyohjelmien kanssa.

Markdown-sovelluksia ei kuitenkaan käytetä niiden teknologisen kauneuden takia vaan helpon tekstin tuottamisen takia.

### iA Writer

iA Writer (macOS, Windows, iOS ja iPadOS) on maksullinen: Macille sekä iPhonelle ja iPadille 49,99 dollaria ja Windowsille 29,99 dollaria kertamaksuna, ei tilauksena.[^Tarkistettu 12.11.2026 iA:n hinnastosta (https://ia.net/writer/pricing). Hinnat ovat Yhdysvaltain dollareita, ja alueellinen hinta voi poiketa.] Hinta voi itse asiassa olla – elinikäisenä hankintana – lähes ryöstö asiakkaan hyväksi.

Näin yksinkertaiseen teknologiaan on kuitenkin oikeutetusti olemassa myös ilmaisia tapauksia, joilla pääsee varmasti kuuhun, jos jo Muistiollakin kuuhun pääsi.

### Kirjoituskonetyyppiset

Ryhmästä 1 eli kirjoituskonetyyppisistä voi mainita ilmaisen **MarkTextin** (Windows, macOS ja Linux). Siinä Markdown kirjoitetaan sisään, mutta ohjelma muodostaa syötetystä reaaliajassa muotoillun näkymän. Tekstin muotoiluasetuksiin on useimpiin muihin Markdown-editoreihin nähden enemmän mahdollisuuksia, ja sen takia esimerkiksi suoraan ohjelmasta lähtevien PDF-versioiden luominen on melko vahvaa.

Toisille ohjelman huoliteltu ulkoasu voi laskea MarkTextin pisteitä, jolloin karumman näkymän tarjoava iA Writer, Zettel Notes tai jopa Muistio voi tuntua houkuttelevammalta valinnalta. Toisaalta Markdownissa pitkällä tähtäimellä eniten iloa saattaa tuoda itse tekemisen mekaniikka, ja toisia Markdownissa nimenomaan vieroksuttaa editorin karkea, muotoilumerkit paljaina näyttävä näkymä. Silloin MarkText on ainakin hyvä valinta.

Maksullinen, vielä sliipatumpi vaihtoehto on **Typora** (Windows, macOS ja Linux; 14,99 dollaria, kolmelle laitteelle).

### Muistiinpanoarkistot

Ryhmään 2 eli muistiinpanoarkisto-ominaisuuksilla varustettuihin liittyvät oleellisesti opit tekstitiedostoarkistoista ja niiden sisäisestä jäsentymisestä ja linkittymisestä. Tunnetuin tällaisen koulukunnan käsitteistä on **Zettelkasten**.

Tämän Markdown-esittelyn puitteissa ei ole rahkeita syventyä Zettelkastenin aiheeseen sen enempää, mutta lyhykäisyydessään Zettelkasten-opin eri muunnelmat tutkivat ihanteellisia tapoja rakentaa pienten tekstitiedostojen tilkuista ei ainoastaan kokoelmaa vaan keskinäisriippuvainen verkosto, ja etenkin sellainen, jossa tiedon hakeminen on mahdollista ei ainoastaan projektin kuuman tiimellyksen aikana vaan myös vuosien, mahdollisesti vuosikymmenten jälkeen.

Jos haluat hypätä erittäin syvään kaninkoloon, voit lukea aiheesta esimerkiksi Zettelkasten.de-sivuston johdannosta (https://zettelkasten.de/introduction/), Wikipediasta (https://en.wikipedia.org/wiki/Zettelkasten) tai tutkia menetelmän isän, sosiologi Niklas Luhmannin, digitoitua lappuarkistoa (https://niklas-luhmann-archiv.de/).

> TOIM. HUOM. Lukimessa tekstin verkkolinkit ovat lukurauhan tueksi oletuksena pois päältä. Nauti siis käsityöstä ja kopioi verkko-osoite suluista selaimen uuden välilehden osoiteriville, tai kytke verkkolinkit päälle (suosittelemme, että vain väliaikaisesti) lukimen asetuksista: asetusten kiekko yläpalkin oikeassa reunassa, *Teksti* ja *Verkkolinkit*.

Älä kuitenkaan anna innostuneiden Zettelkasten-apostolien pelästyttää. Pohjimmiltaan Zettelkastenissakin (jonka jo nimikin voi herättää pelkoa) ihanne on nimenomaan **helppous**.

Oli miten oli. Näistä tekstitiedostokansioita hallinnoivista, muistiinpanosovelluksenkin hahmon mahdollisesti ottavista ja Zettelkastenin vaatimuksiin erityisen hyvin taipuvista sovelluksista mainitsin jo iA Writerin. Zettelkasten.de-sivustolla on kirjoitus, joka esittelee iA Writerin käyttöä Zettelkasten-arkistona ja ohjaa yksityiskohtiin (https://zettelkasten.de/posts/ia-writer-zettelkasten/).

Vielä iA Writeria tunnetumpi, nimenomaan Zettelkasten- tai laajemmin suorastaan *second brain* -käsitteeseen liitetty sovellus on **Obsidian** (macOS, Windows, Linux, Android ja iOS). Koskaan käyttämättä sovellusta olen innokkaiden tapauskertomusten perusteella muodostanut kuvan, että tuskin mikään on mahdotonta Obsidianilla. Eräs sen tunnuspiirre on näyttää myös graafisessa muodossa oman tekstitiedostoarkiston aiheiden perheyhtäläisyyksien verkkoja. Aivojen pilvipalvelutallennusta ei onneksi sentään vielä tarjota.

Obsidian antaa myös erittäin laadukkaan vaikutelman, eikä sen monipuolisuus ole taakkana samassa mielessä kuin joissain nimeltä mainitsemattomissa tekstieditoreissa vähempikin monipuolisuus painaa jaloissa. Obsidianin näkymän ja käyttötavan voisi käsitykseni mukaan rakentaa myös hyvin vähäeleiseksi, sellaiseksi, että ominaisuuksien kirjosta voisi kenties pysyä jopa autuaan tietämättömänä.

Silti omiin korviini, henkilökohtaisten heikkouksieni värittämästä näkökulmasta katsoen, Obsidian on hiukan liikaa pelonsekaista kunnioitusta herättävä eläin. Toisaalta aikanaan ilman suurempaa puntarointia hankittu iA Writer on toiminut niin hyvin ja etenkin **riittävän hyvin**, että olen pysynyt tyytyväisenä etäällä Obsidianista.

Obsidianin yksi merkittävä vahvuus on sen laaja käyttöjärjestelmätuki ja hyvä toimivuus sekä työpöydällä että mobiilissa. Esimerkiksi iA Writer lopetti jo joitain vuosia sitten tukensa Android-laitteille. Sen saa edelleen ladattua epävirallisista lähteistä, ja vaikka tuokin versio on allekirjoittaneella lähes päivittäisessä käytössä, se on huomattavasti kömpelömpi kuin toinen käyttämäni, macOS-versio.

---

Kaikki tämä on kuitenkin vapaaehtoista. Latomo ottaa vastaan pelkän tekstin mistä tahansa ohjelmasta, ja lukin lukee sen. Markdown vain tekee lopputuloksesta kauniimman.
