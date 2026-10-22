---
tekijä: Testi Kirjoittaja
sivusto: Kokeilublogi
me: Tusinasoft
---

# iA WRITERIN MERKINNÄT

*Testiteksti Latomolle ja md.js:lle*

Lokakuussa 2026\
Testi Kirjoittaja

## 1. Rivit ja korostukset

Kenoviiva rivin lopussa\
vaihtaa rivin. Kaksi välilyöntiä  
myös. Samoin<br>tämä. Pelkkä rivinvaihto
jatkaa kappaletta.

**Lihava**, *kursiivi*, ***molemmat***, ~~yliviivattu~~, ==korostettu==, 100m^2, y^(a+b)^, H~2~O, x~z ja `koodi`. Suojattu \*tähti\* ja \=\=.

Paljas osoite https://example.com/polku_(sulku). ja <https://example.org>.

## 2. Alaviitteet

iA Writerin tapaan tekstin seassa.[^Näin sanoo Koistinen 2013, 42] Viitteellä.[^1] Pandocin tapaan.^[Vanha kirjoitustapa.] Toinen viitteellä.[^pitka]

[^1]: Määritelmä erikseen, *kursiivilla*.

[^pitka]: Ensimmäinen kappale
jatkuu laiskasti.

    Toinen kappale sisennettynä.

Sitaatti[s. 23][#Doe:2006] ja ilman paikanninta[][#Doe:2006].

[#Doe:2006]: John Doe. *Some Big Fancy Book*. Vanity Press, 2006.

## 3. Luettelot

- Ensimmäinen
    - Sisäkkäinen
    - Toinen sisäkkäinen
        1. Numeroitu syvemmällä
- Toinen
- [ ] Tekemättä
- [x] Tehty

1. Yksi
    * alakohta
2. Kaksi

## 4. Taulukko ja viittaukset

|Otsake | Vasen | Keski | Oikea |
|:--- |:---- |:----:| ----:|
| 1. rivi | a | b | c |
| yhdistetty || d | e |

Katso [Rivit ja korostukset][] ja [luku 1][Nimiö]. Linkki [viitteellä][esim] ja [esim].

[esim]: https://example.com/viite "Otsikko"

### Nimiöity otsikko [Nimiö]

Muuttuja: [%me]. Kuva: ![Logo](https://example.com/logo.png) ja paikallinen ![](kuva.jpg).

// Tämä on kommentti, ei näy.

<!-- Tämäkään ei näy. -->

{{TOC}}

+++

Sivunvaihdon jälkeen: sivutettuna tämä kappale alkaa uudelta sivulta.

Setext-otsikko
--------------

	Sarkaimella sisennetty koodi.

````
```
aita aidan sisällä
```
````

$$x^2$$
