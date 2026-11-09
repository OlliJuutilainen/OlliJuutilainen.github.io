/* Lisää lukimeen: ponnahdusikkuna. Ei taustaskriptiä: ikkuna ajaa leikkurin välilehdellä, jättää tuloksen lisäosan
   muistiin ja avaa Latomon, jonka latomoon.js täyttää. Androidin Firefoxissa ei ole valikko- eikä pikanäppäinrajapintaa,
   joten kaikki tapahtuu tästä ikkunasta.
   Lähetä postina (käyttäjän pyyntö 9.11.2026): Latomo lähettää leikkeen laatikkoon (Coneelta Cännycälle) ja avaa sen
   Luinissa, ellei Älä avaa nyt ole valittuna. Koodin sääntö ja ohje ovat samat kuin luin/posti.js:ssä (kopio, koska
   lisäosa ei lataa sivuston tiedostoja); valinnat ja koodi muistetaan lisäosan muistissa. */
const api = globalThis.browser || globalThis.chrome;
const LATOMO = 'https://ollijuutilainen.github.io/luin/latomo.html#lisaosa';
const TIEDOSTOT = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js'];
const $ = id => document.getElementById(id);
const luku = n => n.toLocaleString('fi-FI') + (n === 1 ? ' sana' : ' sanaa');
let leike = null;

// Sama kuin luin/posti.js: koodi() ja koodiVirhe().
const koodi = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '');
function koodiVirhe(k) {
  if (!k) return 'Anna laatikon koodi.';
  if (k.length < 24) return 'Koodissa on oltava vähintään 24 merkkiä (nyt ' + k.length + '), jotta sillä voi sekä lähettää että lukea.';
  if (k.length > 40) return 'Koodissa voi olla enintään 40 merkkiä (nyt ' + k.length + ').';
  return '';
}

function valittu() { return leike && leike.valinta && $('valinta').checked; }
function postina() { return $('posti').checked; }

function nayta() {
  $('posti-osa').hidden = !postina();
  const kv = postina() ? koodiVirhe(koodi($('koodi').value)) : '';
  $('koodi-virhe').textContent = postina() && $('koodi').value.trim() ? kv : '';
  $('lukimeen').textContent = postina() && $('ala-avaa').checked ? 'Lähetä postina' : 'Lisää lukimeen';
  if (!leike) return;
  const sanoja = valittu() ? leike.valintaSanoja : leike.kokoSanoja;
  const viitteita = valittu() ? leike.valintaViitteita : leike.kokoViitteita;
  $('meta').textContent = [leike.sivusto, sanoja ? luku(sanoja) : '',
    viitteita ? viitteita + (viitteita === 1 ? ' alaviite' : ' alaviitettä') + ' haettu' : ''].filter(Boolean).join(' · ');
  const tyhja = !(valittu() ? leike.valinta : leike.koko);
  $('lukimeen').disabled = tyhja || !!kv;
  $('latomoon').disabled = tyhja;
  $('tila').textContent = tyhja ? 'Sivulta ei löytynyt artikkelia. Maalaa luettava kohta ja avaa ikkuna uudelleen.' : '';
}

function muista() {
  api.storage.local.set({ posti: { on: postina(), k: koodi($('koodi').value), alaAvaa: $('ala-avaa').checked } });
}

async function laheta(avaa) {
  $('lukimeen').disabled = $('latomoon').disabled = true;
  const k = koodi($('koodi').value);
  // Postina: Lisää lukimeen lähettää (ja avaa, ellei Älä avaa nyt); Avaa Latomossa vain täyttää koodin valmiiksi.
  const posti = postina() && !koodiVirhe(k) ? { k, avaaNyt: !$('ala-avaa').checked } : null;
  await api.storage.local.set({ odottaa: { md: valittu() ? leike.valinta : leike.koko, avaa, posti, aika: Date.now() } });
  await api.tabs.create({ url: LATOMO });
  window.close();
}

async function aloita() {
  const { posti } = await api.storage.local.get('posti');
  if (posti) { $('posti').checked = !!posti.on; $('koodi').value = posti.k || ''; $('ala-avaa').checked = !!posti.alaAvaa; }
  $('posti').addEventListener('change', () => { muista(); nayta(); if (postina() && !$('koodi').value) $('koodi').focus(); });
  $('ala-avaa').addEventListener('change', () => { muista(); nayta(); });
  $('koodi').addEventListener('input', () => { muista(); nayta(); });
  $('koodi').addEventListener('change', () => { const k = koodi($('koodi').value); if (k) $('koodi').value = k; muista(); nayta(); });
  $('kysy').addEventListener('click', function () {
    const auki = $('ohje').hidden;
    $('ohje').hidden = !auki; this.setAttribute('aria-expanded', String(auki));
  });
  nayta();
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
