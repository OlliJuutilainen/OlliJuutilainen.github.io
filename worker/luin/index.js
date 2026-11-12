// Luinin jakolinkki (käyttäjän pyyntö 12.11.2026): GET https://luin.ollijuutilainen.workers.dev/?t=<otsikko>&u=<tekstin osoite>.
// Oma worker (käyttäjän valinta 12.11.2026), jotta linkissä ei näy tusinasaa-worker. Julkaisu repon juuressa:
//   npx -y wrangler@3.114.17 deploy --config worker/luin/wrangler.toml
// Viestimien esikatselu ei näe osoitteen #-osaa eikä aja JavaScriptiä, joten luin.html#u=… näytti aina staattisen otsikon *Luin.*. Tämä sivu antaa
// og:titleksi tekstin nimen ja ohjaa selaimen JavaScriptillä Luiniin (luin.html#u=…). Ei meta refreshiä, ei 302:ta eikä og:urlia,
// koska hakijat seuraisivat niitä luin.html:ään. Otsikko tulee linkistä (Luin kopioi hyllyn nimen), joten worker ei hae
// mitään: md.js:n otsikkopäättelyä ei kopioida, eikä ilmaistason CPU-raja tule vastaan. Kohde on aina luin.html.
const LUIN_SIVU = "https://ollijuutilainen.github.io/luin.html";
function htmlEsc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function handleLuinJako(req) {
  const url = new URL(req.url);
  const u = (url.searchParams.get("u") || "").trim().slice(0, 2048);
  const t = (url.searchParams.get("t") || "").replace(/\s+/g, " ").trim().slice(0, 200) || "Luin.";
  const kohde = LUIN_SIVU + (u ? "#u=" + encodeURIComponent(u) : "");
  const k = htmlEsc(kohde), o = htmlEsc(t);
  const html = `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>${o}</title>
<meta property="og:title" content="${o}">
<meta property="og:site_name" content="Luin.">
<meta property="og:description" content="Lukulaite Markdown-teksteille.">
<meta property="og:image" content="https://ollijuutilainen.github.io/luin/kuvakkeet/jako-logo-tumma.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="LUiN.HTML">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace(${JSON.stringify(kohde).replace(/</g, "\\u003c")});</script>
<style>body{margin:0;padding:2em 1em;background:#faf5ea;color:#231c14;font-family:Georgia,serif}a{color:#8c5426}
@media (prefers-color-scheme:dark){body{background:#120e0b;color:#ebdfca}a{color:#b8794a}}</style>
</head>
<body><p><a href="${k}">${o}</a></p></body>
</html>`;
  return new Response(req.method === "HEAD" ? null : html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex" },
  });
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/" && (req.method === "GET" || req.method === "HEAD")) return handleLuinJako(req);
    return new Response("not_found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  },
};
