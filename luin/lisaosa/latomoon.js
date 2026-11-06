/* Lisää lukimeen: Latomon puoli. Ponnahdusikkuna jättää leikkeen lisäosan muistiin ja avaa latomo.html#lisaosa;
   tämä kirjoittaa leikkeen tekstikenttään kuin käyttäjä olisi liittänyt sen, ja Lisää lukimeen -napilla painaa
   vielä Avaa Luinissa. Rajapinta Latomoon on vain kaksi tunnistetta: #md ja #avaa. */
(async () => {
  if (location.hash !== '#lisaosa') return;
  const api = globalThis.browser || globalThis.chrome;
  history.replaceState(null, '', location.pathname + location.search);
  const { odottaa } = await api.storage.local.get('odottaa');
  await api.storage.local.remove('odottaa');
  // Vanha leike ei saa ilmestyä Latomoon myöhemmin, jos siirto katkesi kesken.
  if (!odottaa || !odottaa.md || Date.now() - odottaa.aika > 120000) return;
  const md = document.getElementById('md');
  if (!md) return;
  md.value = odottaa.md;
  md.dispatchEvent(new Event('input', { bubbles: true }));
  if (odottaa.avaa) document.getElementById('avaa').click();
})();
