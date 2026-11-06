/* Lisää lukimeen: ponnahdusikkuna. Ei taustaskriptiä: ikkuna ajaa leikkurin välilehdellä, jättää tuloksen lisäosan
   muistiin ja avaa Latomon, jonka latomoon.js täyttää. Androidin Firefoxissa ei ole valikko- eikä pikanäppäinrajapintaa,
   joten kaikki tapahtuu tästä ikkunasta. */
const api = globalThis.browser || globalThis.chrome;
const LATOMO = 'https://ollijuutilainen.github.io/luin/latomo.html#lisaosa';
const TIEDOSTOT = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js'];
const $ = id => document.getElementById(id);
const luku = n => n.toLocaleString('fi-FI') + (n === 1 ? ' sana' : ' sanaa');
let leike = null;

function valittu() { return leike.valinta && $('valinta').checked; }

function nayta() {
  const sanoja = valittu() ? leike.valintaSanoja : leike.kokoSanoja;
  $('meta').textContent = [leike.sivusto, sanoja ? luku(sanoja) : ''].filter(Boolean).join(' · ');
  const tyhja = !(valittu() ? leike.valinta : leike.koko);
  $('lukimeen').disabled = $('latomoon').disabled = tyhja;
  $('tila').textContent = tyhja ? 'Sivulta ei löytynyt artikkelia. Maalaa luettava kohta ja avaa ikkuna uudelleen.' : '';
}

async function laheta(avaa) {
  $('lukimeen').disabled = $('latomoon').disabled = true;
  await api.storage.local.set({ odottaa: { md: valittu() ? leike.valinta : leike.koko, avaa, aika: Date.now() } });
  await api.tabs.create({ url: LATOMO });
  window.close();
}

async function aloita() {
  // ?valilehti= antaa testin osoittaa välilehden (testissä ikkuna on itse aktiivinen välilehti).
  const pakko = Number(new URLSearchParams(location.search).get('valilehti'));
  const [tab] = pakko ? [await api.tabs.get(pakko)] : await api.tabs.query({ active: true, currentWindow: true });
  try {
    const r = await api.scripting.executeScript({ target: { tabId: tab.id }, files: TIEDOSTOT });
    leike = r && r[0] && r[0].result;
  } catch (e) { leike = null; }
  if (!leike) {
    $('otsikko').textContent = 'Tätä sivua ei voi leikata';
    $('tila').textContent = 'Selaimen omat sivut ja lisäosakaupat ovat lisäosilta suljettuja.';
    return;
  }
  $('otsikko').textContent = leike.otsikko;
  if (leike.valinta) { $('valintarivi').hidden = false; $('valinta').checked = true; }
  $('valinta').addEventListener('change', nayta);
  $('lukimeen').addEventListener('click', () => laheta(true));
  $('latomoon').addEventListener('click', () => laheta(false));
  nayta();
}

aloita();
