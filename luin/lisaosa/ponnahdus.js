/* Lukimeen-lisäosa: ponnahdusikkuna. Ei taustaskriptiä: ikkuna ajaa leikkurin välilehdellä, jättää tuloksen lisäosan
   muistiin ja avaa Latomon, jonka latomoon.js täyttää. Androidin Firefoxissa ei ole valikko- eikä pikanäppäinrajapintaa,
   joten kaikki tapahtuu tästä ikkunasta.
   Postihuilu (käyttäjän pyynnöt 9.11.2026 ja 10.11.2026; ennen Lähetä postina -valinta): napista aukeavat laatikkolause,
   Soita huilua! ja ohje. Soita huilua! antaa leikkeen Latomolle, joka lähettää sen laatikkoon ja, kun Lisää tämän selaimen
   pinoon heti on valittuna (oletus), avaa sen myös tämän selaimen Luinissa. Ilman sitä teksti ei tule tämän selaimen
   lukulistaan eikä lause jää Latomon muistiin (kaverin kone). Lauseen sääntö ja ohje ovat samat kuin luin/posti.js:ssä
   (kopio, koska lisäosa ei lataa sivuston tiedostoja); lause ja valinnat muistetaan lisäosan muistissa.
   Arvo (0.7.0, käyttäjän pyyntö 12.11.2026): laatikkolause.js on tavulleen sama kopio kuin luin/laatikkolause.js
   (laatikkolause-testi.js tarkistaa); virke näkyy napin vieressä, kunnes kentän lause muuttuu. */
const api = globalThis.browser || globalThis.chrome;
const LATOMO = 'https://ollijuutilainen.github.io/luin/latomo.html#lisaosa';
const TIEDOSTOT = ['kirjastot/Readability.js', 'kirjastot/turndown.js', 'kirjastot/turndown-plugin-gfm.js', 'leike.js'];
const $ = id => document.getElementById(id);
const luku = n => n.toLocaleString('fi-FI') + (n === 1 ? ' sana' : ' sanaa');
let leike = null, arvottu = null, tab = null;

/* Perseuksen valinnat (käyttäjän pyyntö 19.11.2026): kielet (alkuteksti ja käännös lomitettuna, alkuteksti tai käännös) ja
   kirjat (numeronapit ja kaikki). Muutos ajaa leikkurin uudelleen samalla välilehdellä (leike.js lukee valinnat muuttujasta
   __lukimeenPs; teoksen XML on sivun muistissa, joten sitä ei haeta uudelleen). Napit odottavat hetken, jotta useamman kirjan
   napautus tekee yhden ajon. Kielivalinta muistetaan (psKielet), kirjat tulevat aina osoitteesta.
   PS_ISO: sanamäärä, jonka ylittyessä ikkuna ehdottaa pienempää pakettia. Valtion kirja on kahdella kielellä noin 31 000
   sanaa, koko teos 305 000; käyttäjän laitteilla koko teos on ollut raskas (19.11.2026). Kun suuret paketit toimivat sulavasti,
   nosta rajaa tai poista huomio. */
const PS_ISO = 60000;
let psValinta = null, psKesken = false, psAjo = false, psJono = false, psAjastin = null;

// Sama kuin luin/posti.js: koodi() ja koodiVirhe().
function koodi(s) {
  s = String(s || '').trim();
  const m = /^https?:\/\/\S*#l=([^&\s]*)$/i.exec(s);
  if (m) { try { s = decodeURIComponent(m[1]); } catch (e) { s = m[1]; } }
  return s.trim().toLowerCase();
}
function koodiVirhe(k) {
  if (!k) return 'Anna laatikkolause.';
  const vaarat = [];
  String(k).replace(/[^a-z0-9-]/g, c => {
    c = /\s/.test(c) ? 'välilyönti' : '”' + c + '”';
    if (!vaarat.includes(c)) vaarat.push(c);
  });
  if (vaarat.length) return 'Laatikkolauseessa saa olla vain kirjaimia a–z, numeroita ja yhdysmerkkejä (-). Ei kelpaa: ' + vaarat.join(', ') + '.';
  if (k.length < 24) return 'Laatikkolauseessa on oltava vähintään 24 merkkiä (nyt ' + k.length + ').';
  if (k.length > 52) return 'Laatikkolauseessa voi olla enintään 52 merkkiä (nyt ' + k.length + ').';
  return '';
}

// Plussa (käyttäjän pyyntö 16.11.2026): Säädä latomossa ja sen alla olevat ovat oletuksena piilossa; valinta muistetaan.
function lisatAuki() { return !$('lisat').hidden; }
function asetaLisat(auki) {
  $('lisat').hidden = !auki;
  $('plussa').setAttribute('aria-expanded', String(auki));
  $('plussa').setAttribute('aria-label', auki ? 'Vähemmän toimintoja' : 'Lisää toimintoja');
}

function valittu() { return leike && leike.valinta && $('valinta').checked; }
function huiluAuki() { return !$('posti-osa').hidden; }

function nayta() {
  const kv = koodiVirhe(koodi($('koodi').value));
  $('arvottu').textContent = arvottu && koodi($('koodi').value) === arvottu.lause ? arvottu.virke : '';
  $('koodi-virhe').textContent = $('koodi').value.trim() ? kv : '';
  if (!leike) return;
  const sanoja = valittu() ? leike.valintaSanoja : leike.kokoSanoja;
  const viitteita = valittu() ? leike.valintaViitteita : leike.kokoViitteita;
  const sarja = !valittu() && leike.sarja;
  $('meta').textContent = [leike.sivusto, sarja ? sarja.length + ' tekstiä' : '', sarja ? luku(sarja.reduce((n, x) => n + x.sanoja, 0)) : sanoja ? luku(sanoja) : '',
    viitteita ? viitteita + (viitteita === 1 ? ' alaviite' : ' alaviitettä') + ' haettu' : ''].filter(Boolean).join(' · ');
  const tyhja = !(valittu() ? leike.valinta : leike.koko);
  $('lukimeen').disabled = $('latomoon').disabled = $('lataa').disabled = tyhja || psKesken;
  $('soita').disabled = tyhja || !!kv || psKesken;
  $('tila').textContent = psKesken ? 'Poimitaan valintojen mukaan…'
    : tyhja ? 'Sivulta ei löytynyt artikkelia. Maalaa luettava kohta ja avaa ikkuna uudelleen.' : '';
  psPiirra();
}

async function aja(valinnat) {
  try {
    await api.scripting.executeScript({ target: { tabId: tab.id }, func: v => { globalThis.__lukimeenPs = v; }, args: [valinnat || null] });
    const r = await api.scripting.executeScript({ target: { tabId: tab.id }, files: TIEDOSTOT });
    return r && r[0] && r[0].result;
  } catch (e) { return null; }
}

function psPiirra() {
  const ps = leike && leike.ps;
  $('ps').hidden = !ps;
  if (!ps) return;
  if (!psValinta) psValinta = { kielet: ps.kielet, kirjat: ps.valitut.length ? ps.valitut.slice() : ps.kirjat.slice(), erikseen: false };
  // Laajuus vain, kun valittuna on useampi kirja.
  $('ps-laajuus').hidden = psValinta.kirjat.length < 2;
  document.querySelectorAll('input[name="laajuus"]').forEach(r => { r.checked = r.value === (psValinta.erikseen ? 'erikseen' : 'yhteen'); });
  $('ps-kielet').hidden = !ps.kaannos;
  $('ps-molemmat').textContent = ps.kieli + ' ja englanti';
  $('ps-alku').textContent = ps.kieli;
  document.querySelectorAll('input[name="kielet"]').forEach(r => { r.checked = r.value === psValinta.kielet; });
  $('ps-kirjat-osa').hidden = ps.kirjat.length < 2;
  const k = $('ps-kirjat');
  if (k.dataset.kirjat !== ps.kirjat.join()) {
    k.dataset.kirjat = ps.kirjat.join();
    k.textContent = '';
    ps.kirjat.forEach(n => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = n; b.dataset.n = n; b.setAttribute('aria-label', 'Kirja ' + n);
      k.appendChild(b);
    });
    const kaikki = document.createElement('button');
    kaikki.type = 'button'; kaikki.className = 'kaikki'; kaikki.textContent = 'kaikki';
    k.appendChild(kaikki);
  }
  const kaikkiValittu = psValinta.kirjat.length === ps.kirjat.length;
  k.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.n ? psValinta.kirjat.includes(b.dataset.n) : kaikkiValittu)));
  // Huomio vain valmiista leikkeestä: pienempi paketti niillä keinoilla, jotka tässä valinnassa vielä ovat käytössä.
  const keinot = [];
  if (leike.ps.kielet === 'molemmat') keinot.push('yksi kieli');
  if (leike.ps.valitut.length !== 1 && ps.kirjat.length > 1 && !leike.sarja) keinot.push('kirja kerrallaan tai kukin omaksi tekstikseen');
  $('ps-huomio').textContent = !psKesken && leike.sarja && leike.sarja.length > 12
    ? 'Pinoon mahtuu tusina tekstiä: pinoon jäävät 12 ensimmäistä kirjaa, ja muut sekä pinon aiemmat tekstit laskeutuvat cellarin campihyllystöön.'
    : !psKesken && leike.kokoSanoja > PS_ISO && keinot.length
    ? 'Iso paketti. Jos lukeminen tökkii, kokeile pienempää: ' + keinot.join(' tai ') + '.' : '';
}

function psMuuta() {
  psKesken = true;
  nayta();
  clearTimeout(psAjastin);
  psAjastin = setTimeout(psLeikkaa, 500);
}

async function psLeikkaa() {
  psAjastin = null;
  if (psAjo) { psJono = true; return; }
  psAjo = true;
  const r = await aja({ kielet: psValinta.kielet, kirjat: psValinta.kirjat.slice(), erikseen: psValinta.erikseen && psValinta.kirjat.length > 1 });
  psAjo = false;
  if (psJono) { psJono = false; return psLeikkaa(); }
  if (psAjastin) return;
  psKesken = false;
  if (r) { leike = r; $('otsikko').textContent = leike.otsikko; }
  nayta();
  if (!r) $('tila').textContent = 'Poiminta epäonnistui. Avaa ikkuna uudelleen.';
}

function muista() {
  api.storage.local.set({ posti: { on: huiluAuki(), k: koodi($('koodi').value), heti: $('heti').checked } });
}

// avaa: Latomo painaa itse (Avaa lukimessa tai, postin kanssa, lähetyksen). posti: { k, avaaNyt, eiMuistia } tai null.
// lataa (0.8.0): Latomo painaa Lataa .md, jotta tiedosto on Latomon ladoma (leikesiivous, etukenttä), ei raaka leike.
// Taustalla (käyttäjän toive 13.11.2026: Latomoa ei tarvitse nähdä): Latomo avautuu taustavälilehdelle, ja latomoon.js
// sulkee sen latauksen jälkeen. Androidin Firefoxissa ei kokeiltu, joten siellä Latomo avautuu eteen ja jää auki kuten ennen.
const ANDROID = /Android/i.test(navigator.userAgent);
async function laheta(avaa, posti, lataa) {
  $('lukimeen').disabled = $('latomoon').disabled = $('lataa').disabled = $('soita').disabled = true;
  const taustalla = !!lataa && !ANDROID;
  // Sarja (Perseuksen kirjat erikseen): ensimmäinen on md, muut sarjassa; Latomo latoo ne ja lukin tuo ne erillisinä.
  const sarja = !valittu() && leike.sarja ? leike.sarja.slice(1).map(x => x.md) : null;
  await api.storage.local.set({ odottaa: { md: valittu() ? leike.valinta : leike.koko, sarja, avaa, posti, lataa: !!lataa, taustalla, aika: Date.now() } });
  await api.tabs.create({ url: LATOMO, active: !taustalla });
  window.close();
}

async function aloita() {
  const { posti, lisat, psKielet } = await api.storage.local.get(['posti', 'lisat', 'psKielet']);
  asetaLisat(lisat === true);
  $('plussa').addEventListener('click', () => {
    const auki = !lisatAuki();
    asetaLisat(auki);
    api.storage.local.set({ lisat: auki });
  });
  if (posti) {
    $('koodi').value = posti.k || '';
    // Ennen 10.11.2026 valinta oli Älä avaa nyt (alaAvaa) ja Postihuilu Lähetä postina (on).
    $('heti').checked = 'heti' in posti ? !!posti.heti : !posti.alaAvaa;
    if (posti.on) { $('posti-osa').hidden = false; $('postihuilu').setAttribute('aria-expanded', 'true'); }
  }
  $('postihuilu').addEventListener('click', function () {
    const auki = !huiluAuki();
    $('posti-osa').hidden = !auki; this.setAttribute('aria-expanded', String(auki));
    muista(); nayta();
    if (auki && !$('koodi').value) $('koodi').focus();
  });
  $('heti').addEventListener('change', muista);
  $('arvo').addEventListener('click', () => { arvottu = globalThis.LuinLause.arvo(); $('koodi').value = arvottu.lause; muista(); nayta(); });
  $('koodi').addEventListener('input', () => { muista(); nayta(); });
  $('koodi').addEventListener('change', () => { const k = koodi($('koodi').value); if (k) $('koodi').value = k; muista(); nayta(); });
  $('koodi').addEventListener('keydown', e => { if (e.key === 'Enter' && !$('soita').disabled) $('soita').click(); });
  $('kysy').addEventListener('click', function () {
    const auki = $('ohje').hidden;
    $('ohje').hidden = !auki; this.setAttribute('aria-expanded', String(auki));
  });
  nayta();
  // ?valilehti= antaa testin osoittaa välilehden (testissä ikkuna on itse aktiivinen välilehti).
  const pakko = Number(new URLSearchParams(location.search).get('valilehti'));
  [tab] = pakko ? [await api.tabs.get(pakko)] : await api.tabs.query({ active: true, currentWindow: true });
  leike = await aja(psKielet ? { kielet: psKielet } : null);
  if (!leike) {
    $('otsikko').textContent = 'Tätä sivua ei voi leikata';
    $('tila').textContent = 'Selaimen omat sivut ja lisäosakaupat ovat lisäosilta suljettuja.';
    return;
  }
  $('otsikko').textContent = leike.otsikko;
  if (leike.valinta) { $('valintarivi').hidden = false; $('valinta').checked = true; }
  $('valinta').addEventListener('change', nayta);
  document.querySelectorAll('input[name="kielet"]').forEach(r => r.addEventListener('change', () => {
    if (!r.checked || !psValinta) return;
    psValinta.kielet = r.value;
    api.storage.local.set({ psKielet: r.value });
    psMuuta();
  }));
  document.querySelectorAll('input[name="laajuus"]').forEach(r => r.addEventListener('change', () => {
    if (!r.checked || !psValinta) return;
    psValinta.erikseen = r.value === 'erikseen';
    psMuuta();
  }));
  $('ps-kirjat').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !psValinta || !leike || !leike.ps) return;
    const kaikki = leike.ps.kirjat;
    if (!b.dataset.n) {
      if (psValinta.kirjat.length === kaikki.length) return;
      psValinta.kirjat = kaikki.slice();
    } else if (psValinta.kirjat.includes(b.dataset.n)) {
      if (psValinta.kirjat.length === 1) return;
      psValinta.kirjat = psValinta.kirjat.filter(n => n !== b.dataset.n);
    } else psValinta.kirjat = kaikki.filter(n => n === b.dataset.n || psValinta.kirjat.includes(n));
    psMuuta();
  });
  $('lukimeen').addEventListener('click', () => laheta(true, null));
  $('lataa').addEventListener('click', () => laheta(false, null, true));
  // Säädä Latomossa (0.8.0; ennen Muokkaa Latomossa) täyttää kelpaavan lauseen valmiiksi, kun Postihuilu on auki, mutta ei lähetä.
  $('latomoon').addEventListener('click', () => {
    const k = koodi($('koodi').value);
    laheta(false, huiluAuki() && !koodiVirhe(k) ? { k, avaaNyt: false } : null);
  });
  $('soita').addEventListener('click', () => {
    const k = koodi($('koodi').value), heti = $('heti').checked;
    if (koodiVirhe(k)) return;
    laheta(true, { k, avaaNyt: heti, eiMuistia: !heti });
  });
  nayta();
}

aloita();
