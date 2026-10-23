// Rakentaa keikka-analyysi-taitopaketin: SKILL.md Keikkaloihtimen saatteesta ja zip ladattavaksi.
//
//   node soitin/keikka-analyysi/rakenna.mjs             kirjoittaa SKILL.md:n ja soitin/keikka-analyysi.zip:n
//   node soitin/keikka-analyysi/rakenna.mjs --tarkista  vain tarkistaa, että ne ovat ajan tasalla
//
// Säännöt ja vastausmuoto ovat yhdessä paikassa: soitin/uusi.html, funktio llmPrompt(). SKILL.md on
// sama teksti (ilman tiedoston kestoa, jota taito ei tiedä) ja taidon omat lisäykset (LISAYKSET):
// skriptien asennus vaiheeseen 1 ja kevyemmälle mallille tehty työjärjestys vaiheeseen 2. Älä muokkaa SKILL.md:tä käsin; muuta saatetta ja aja tämä uudelleen.
// Zip on toistettava: samoista tiedostoista syntyy tavulleen sama zip (kiinteä aikaleima).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KANSIO = dirname(fileURLToPath(import.meta.url));
const SOITIN = dirname(KANSIO);
const NIMI = "keikka-analyysi";
const KUVAUS = "Etsii keikkatallenteesta kappaleiden alkuajat, setinvaihdot, väliajan ja encoret KEICK•WALK-settilistaksi.";
const TIEDOSTOT = ["SKILL.md", "scripts/analyysi.py", "scripts/zoom.py", "scripts/testi.py"];

// Taidon omat lisäykset: [rivi, jonka perään lisätään, lisättävät rivit]. Vaiheen 2 järjestys on
// pilotin pahvista C (kevyempi malli, esim. Sonnet: harkinta on siirretty skriptiin).
const LISAYKSET = [
  ["Jos pystyt ajamaan koodia, tarkista jo nyt, mitkä työkalut ovat käytettävissä, ja aloita tarvittavat asennukset sillä aikaa, kun käyttäjä vastaa. Asentaminen ei ole tiedoston käsittelyä.",
   ["Tämän taidon kansiossa on valmiit skriptit (`scripts/`). Aja heti `python3 scripts/analyysi.py --riippuvuudet`: se kertoo, puuttuuko jokin pakollisista (ffmpeg, numpy, scipy). Asenna puuttuvat, esim. `pip install numpy scipy imageio-ffmpeg` (imageio-ffmpeg tuo ffmpegin, jos järjestelmässä ei ole sitä). Valinnainen inaSpeechSegmenter (`pip install inaSpeechSegmenter`) erottelee puheen ja musiikin tarkemmin, mutta se vaatii TensorFlow’n ja lataa mallinsa verkosta; jos asennus ei onnistu muutamassa minuutissa, jatka ilman."]],
  ["Aloita, kun sinulla on äänitiedosto ja käyttäjä on joko kirjoittanut ”läpivalaise” tai vastannut kysymyksiin. Jos tiedosto puuttuu, pyydä se yhdellä lyhyellä viestillä ja kerro, että ”läpivalaise” käynnistää työn.",
   ["Tee läpivalaisu tässä järjestyksessä:",
    "",
    "1. Aja `python3 scripts/analyysi.py <äänitiedosto> --setit 11,10 --encoret 3` (määrät käyttäjän vastauksista; jätä pois, mitä ei kerrottu). Älä tee omaa analyysikoodia, ellei skripti kaadu.",
    "2. Hyväksy RAJA- ja SAUMA-ehdokkaat kappaleiden aluiksi. Hylkää BREAK, ellei kappalemäärä vaadi muuta; silloin merkitse raja epävarmaksi. SPIIKKI on oma rivinsä (pelkkä alkuaika). HÄNTÄ ja HEIKKO eivät ole kappaleiden alkuja; HÄNTÄ voi kuitenkin olla encore-aplodien alku ([Vielä!]). Tulosteen alussa on luokkien selitykset.",
    "3. Jos hyväksyttyjä on eri määrä kuin käyttäjä kertoi, aja `python3 scripts/zoom.py <äänitiedosto> <alku> <loppu> kuva.png` enintään kymmenestä epäselvimmästä kohdasta ja katso kuvat (mel-spektrogrammi ja kolmen kaistan tasokäyrä). Muita kuvia ei tehdä.",
    "4. Kirjoita ennen vastausta itsellesi taulukko: kappale, aika, luokka, todiste. Rivi ilman todistetta ei kelpaa.",
    "5. Kirjoita vastauksen koodilohkon rivit tiedostoon ja aja `python3 scripts/analyysi.py --tarkista lista.txt --setit 11,10 --encoret 3`. Vastaa vasta, kun tulos on OK. Jos se sanoo määrän poikkeavan, älä lisää tai poista rajoja pelkän määrän takia, vaan kerro poikkeama vastauksessa.",
    "6. Lopeta tähän. Älä aja uusia analyysikierroksia saman kohdan tarkentamiseksi."]],
];

function saate() {
  const html = readFileSync(join(SOITIN, "uusi.html"), "utf8");
  const alku = html.indexOf("  function llmPrompt() {");
  const loppu = html.indexOf("\n  }\n", alku);
  if (alku < 0 || loppu < 0) throw new Error("uusi.html: llmPrompt()-funktiota ei löytynyt.");
  const lahde = html.slice(alku, loppu + 4);
  // Kestoa ei tiedetä (audioLen = NaN), joten kestorivi jää pois.
  return new Function("audioLen", "fmtTime", lahde + "\nreturn llmPrompt();")(NaN, () => "");
}

function skill() {
  const rivit = saate().split("\n");
  for (const [ankkuri, lisays] of LISAYKSET) {
    const i = rivit.indexOf(ankkuri);
    if (i < 0) throw new Error("Saatteesta puuttuu rivi, jonka perään taidon lisäys tulee:\n  " + ankkuri.slice(0, 80) + "…\nPäivitä LISAYKSET tiedostossa rakenna.mjs.");
    rivit.splice(i + 1, 0, "", ...lisays);
  }
  return ["---", "name: " + NIMI, "description: " + KUVAUS, "---", "", ...rivit, ""].join("\n");
}

// ---- Zip (deflate, kiinteä aikaleima 1.1.2026 00:00) ---------------------

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(b) {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(tiedostot) {
  const AIKA = 0, PVM = ((2026 - 1980) << 9) | (1 << 5) | 1;
  const osat = [], keskus = [];
  let siirto = 0;
  for (const [nimi, data] of tiedostot) {
    const n = Buffer.from(nimi, "utf8"), pakattu = deflateRawSync(data, { level: 9 }), crc = crc32(data);
    const pa = Buffer.alloc(30);
    pa.writeUInt32LE(0x04034b50, 0); pa.writeUInt16LE(20, 4); pa.writeUInt16LE(0x0800, 6); pa.writeUInt16LE(8, 8);
    pa.writeUInt16LE(AIKA, 10); pa.writeUInt16LE(PVM, 12); pa.writeUInt32LE(crc, 14);
    pa.writeUInt32LE(pakattu.length, 18); pa.writeUInt32LE(data.length, 22); pa.writeUInt16LE(n.length, 26);
    osat.push(pa, n, pakattu);
    const ke = Buffer.alloc(46);
    ke.writeUInt32LE(0x02014b50, 0); ke.writeUInt16LE(0x0314, 4); ke.writeUInt16LE(20, 6); ke.writeUInt16LE(0x0800, 8);
    ke.writeUInt16LE(8, 10); ke.writeUInt16LE(AIKA, 12); ke.writeUInt16LE(PVM, 14); ke.writeUInt32LE(crc, 16);
    ke.writeUInt32LE(pakattu.length, 20); ke.writeUInt32LE(data.length, 24); ke.writeUInt16LE(n.length, 28);
    ke.writeUInt32LE(((nimi.endsWith(".py") ? 0o100755 : 0o100644) << 16) >>> 0, 38); ke.writeUInt32LE(siirto, 42);
    keskus.push(ke, n);
    siirto += pa.length + n.length + pakattu.length;
  }
  const k = Buffer.concat(keskus), loppu = Buffer.alloc(22);
  loppu.writeUInt32LE(0x06054b50, 0); loppu.writeUInt16LE(tiedostot.length, 8); loppu.writeUInt16LE(tiedostot.length, 10);
  loppu.writeUInt32LE(k.length, 12); loppu.writeUInt32LE(siirto, 16);
  return Buffer.concat([...osat, k, loppu]);
}

const tarkista = process.argv.includes("--tarkista");
const md = skill();
const mdPolku = join(KANSIO, "SKILL.md"), zipPolku = join(SOITIN, NIMI + ".zip");
const sisalto = TIEDOSTOT.map((t) => [NIMI + "/" + t, t === "SKILL.md" ? Buffer.from(md, "utf8") : readFileSync(join(KANSIO, t))]);
const z = zip(sisalto);
if (tarkista) {
  const vanhat = [];
  if (!existsSync(mdPolku) || readFileSync(mdPolku, "utf8") !== md) vanhat.push("SKILL.md");
  if (!existsSync(zipPolku) || !readFileSync(zipPolku).equals(z)) vanhat.push(NIMI + ".zip");
  if (vanhat.length) {
    console.log("Vanhentunut: " + vanhat.join(", ") + ". Aja: node soitin/keikka-analyysi/rakenna.mjs");
    process.exit(1);
  }
  console.log("SKILL.md ja " + NIMI + ".zip ovat ajan tasalla.");
} else {
  writeFileSync(mdPolku, md);
  writeFileSync(zipPolku, z);
  console.log("Kirjoitettu SKILL.md (" + md.length + " merkkiä) ja " + NIMI + ".zip (" + z.length + " tavua, " + sisalto.length + " tiedostoa).");
}
