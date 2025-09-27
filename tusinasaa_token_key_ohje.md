# Tusinasää – token+key QR -arkkitehtuuri (web + android)

## Missio tonttulaumalle
- Erityislokaatiot pysyvät pois selväkielisestä verkosta ja avoimesta koodista.
- QR- ja deeplink-linkit kuljettavat **tokenin (T)** ja **avaimen (K)** vain `hash`-fragmentissa (`#…`).
- Frontti saa pelkän salatun paketin `GET /api/loc?t=T` -reitiltä.
- Selaimen/WebView'n puolella purku tehdään avaimella **K** käyttäen AES-GCM:ää (Web Crypto API).
- Palvelin (Cloudflare Worker) ei koskaan näe **K**:ta.
- Ratkaisu toimii sekä web-linkkinä että Androidin deeplinkkinä.

**Web-linkin malli:** `https://<domain>/tusinapaja.html#t=<TOKEN>&k=<KEY>`
**Android QR -deeplink:** `tusinasaa://open/v1#t=<TOKEN>&k=<KEY>`

---

## 1) Cloudflare Worker + KV (serveritön API)

1. Perusta KV-namespace `LOCATIONS` ja bindaa se workerille nimellä `LOCATIONS`.
2. Worker palvelee reitin `GET /api/loc?t=<TOKEN>`.
3. Palautusmuoto on JSON: `{ "v":1, "iv":"…", "ct":"…" }`.
4. Vastaukseen lisätään otsikot: `content-type: application/json`, `cache-control: no-store`, `access-control-allow-origin: *`.
5. Jos token puuttuu tai sitä ei löydy, vastataan virheellä (400/404).

```js
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/api/loc') return new Response('Not found', { status: 404 });

    const t = url.searchParams.get('t') || url.searchParams.get('token');
    if (!t) return new Response('Missing token', { status: 400 });

    const item = await env.LOCATIONS.get(t, { type: 'json' });
    if (!item) return new Response('Not found', { status: 404 });

    return new Response(JSON.stringify(item), {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*'
      }
    });
  }
}
```

**KV-arvon rakenne:**
```json
{ "v": 1, "iv": "BASE64URL", "ct": "BASE64URL" }
```

---

## 2) Generaattori – `generaattori.html`

1. Syötteet: `lat`, `lon`, `z`, sekä valinnainen `Base URL (web)`.
2. Generaattori arpoo `TOKEN`, `KEY`, `iv` ja salaa paikannusdatan AES-GCM:llä.
3. Ulostulo on kehittäjälle:
   - KV-payload `{v, iv, ct}` talletettavaksi avaimella `TOKEN`.
   - Valmiit web- ja Android-linkit (QR-koodien lähde).
4. `TOKEN` toimii julkisena hakukirjaimena KV:ssä, `KEY` pidetään vain QR:ssä/linkissä.
5. Generaattori toimii paikallisesti; mitään ei lähetetä verkkoon.

```html
<!doctype html><meta charset="utf-8">
<title>Tusinasää – generaattori</title>
<body>
<label>Lat <input id="lat" type="number" step="any"></label><br>
<label>Lon <input id="lon" type="number" step="any"></label><br>
<label>Z   <input id="z" type="number" value="13"></label><br>
<label>Base URL (web) <input id="base" value="https://example.com/tusinapaja.html" size="50"></label><br>
<button id="go">Generate</button>
<pre id="out"></pre>
<script>
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
const b64u = bytes => { let s=''; bytes.forEach(b => s+=String.fromCharCode(b));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const strBytes = s => new TextEncoder().encode(s);
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));

async function aesGcmEncrypt(keyBytes, plaintextBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, {name:'AES-GCM'}, false, ['encrypt']);
  const iv = rnd(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, plaintextBytes));
  return { iv: b64u(iv), ct: b64u(ct) };
}
function randToken(len=32){ return b64u(rnd(len)).replace(/[^A-Za-z0-9\-_]/g,'').slice(0,len); }

go.onclick = async () => {
  const latv = parseFloat(lat.value), lonv = parseFloat(lon.value), zv = parseInt(z.value||'13',10);
  const payload = JSON.stringify({lat:latv, lon:lonv, z:zv});
  const TOKEN = randToken(32);
  const KEY   = b64u(rnd(32));
  const enc   = await aesGcmEncrypt(fromB64u(KEY), strBytes(payload));

  const kv = JSON.stringify({ v:1, iv: enc.iv, ct: enc.ct }, null, 2);
  const webURL = `${base.value}#t=${encodeURIComponent(TOKEN)}&k=${encodeURIComponent(KEY)}`;
  const android = `tusinasaa://open/v1#t=${encodeURIComponent(TOKEN)}&k=${encodeURIComponent(KEY)}`;

  out.textContent =
`# KV put (token -> value)
TOKEN:
${TOKEN}

VALUE (store into KV[TOKEN]):
${kv}

# Web URL (QR this)
${webURL}

# Android deeplink (QR this)
${android}
`;
};
</script>
</body>
```

**Käyttöohje:** Aja selaimessa paikallisesti, syötä `lat/lon/z`, talleta `kv` Cloudflare KV:hen avaimella `TOKEN`, ja muodosta QR-koodi web- tai Android-linkistä.

---

## 4) Worker-julkaisu ja tokenien revokointi

- Tässä repossa oleva `worker.js` vastaa `GET /api/loc` -pyyntöihin ja hakee salatut paketit `LOCATIONS`-KV:stä.
- `wrangler.toml` sisältää valmiin kokoonpanopohjan – täytä oma tuotanto- ja esikatselu-ID ennen julkaisuja.
- Julkaisu Cloudflareen: `wrangler deploy` (tai esikatselu `wrangler dev`).
- Tokeneita voi poistaa (revoke) Cloudflarelta esimerkiksi: `wrangler kv:key delete --namespace-id <ID> <TOKEN>`.
- Muista pitää AES-avaimet vain hash-fragmentissa ja poistaa vanhat tokenit KV:stä, kun QR halutaan mitätöidä.

---

## 3) Asiakassivu – `app.html`

1. Lue `location.hash` → parametrit `t` ja `k`.
2. Nouda salattu paketti reitiltä `/api/loc?t=…` ilman välimuistia.
3. Purkaa AES-GCM:llä Web Crypto API:n avulla avaimella `k`.
4. Tulkitse JSON `{lat, lon, z}` ja välitä arvot kartan/renderöinnin logiikalle.

```html
<script>
function b64uToBytes(s){
  s = s.replace(/-/g,'+').replace(/_/g,'/'); const pad = (4 - s.length % 4) % 4;
  s += '='.repeat(pad); const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i); return out;
}
(async () => {
  const h = new URLSearchParams(location.hash.slice(1));
  const t = h.get('t'), k = h.get('k');
  if (!t || !k) { console.error('Missing token/key'); return; }

  const res = await fetch(`/api/loc?t=${encodeURIComponent(t)}`, { cache:'no-store' });
  if (!res.ok) { console.error('loc 404'); return; }
  const { v, iv, ct } = await res.json();

  const keyBytes = b64uToBytes(k);
  const ivBytes  = b64uToBytes(iv);
  const ctBytes  = b64uToBytes(ct);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, {name:'AES-GCM'}, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv: ivBytes}, cryptoKey, ctBytes);
  const cfg = JSON.parse(new TextDecoder().decode(new Uint8Array(plain)));

  const { lat, lon, z=13 } = cfg;
  console.log('Tusinasää coords:', lat, lon, z);
  // TODO: jatka sovelluksen omalla logiikalla.
})();
</script>
```

---

## 4) Android-integraatio (WebView)

- Intent-filter Manifestissa: `scheme=tusinasaa`, `host=open`, `pathPrefix=/v1`.
- Deeplink avaa `MainActivity`n, joka välittää `fragment`-osan WebView'n ladattavalle `app.html`:lle.

```xml
<activity android:name=".MainActivity" android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="tusinasaa" android:host="open" android:pathPrefix="/v1" />
  </intent-filter>
</activity>
```

```java
package fi.tusinasaa.kotkavuori;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
  private WebView webView;

  @Override protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    webView = new WebView(this);
    WebSettings s = webView.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    setContentView(webView);

    String url = "file:///android_asset/app.html";
    Intent i = getIntent();
    Uri data = i != null ? i.getData() : null;
    if (data != null && "tusinasaa".equals(data.getScheme()) && "open".equals(data.getHost())) {
      String frag = data.getFragment();
      if (frag != null && !frag.isEmpty()) url += "#" + frag;
    }
    webView.loadUrl(url);
  }

  @Override protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }
}
```

---

## 5) QR-sisällöt ja jakelu

- Web: `https://<domain>/app.html#t=<TOKEN>&k=<KEY>`
- Android: `tusinasaa://open/v1#t=<TOKEN>&k=<KEY>`
- QR:t tulostetaan näistä; `KEY` ei koskaan päädy palvelimelle.

---

## 6) Checklist tonttulaumalle

- [ ] Worker julkaistu ja bindattu KV:hen (`LOCATIONS`).
- [ ] Tokenille löytyy KV:stä `{v,iv,ct}`.
- [ ] `app.html` purkaa AES-GCM:llä ja syöttää `lat/lon/z` sovelluksen logiikkaan.
- [ ] `generaattori.html` tuottaa T/K/IV/CT + QR-lähteet.
- [ ] Androidin manifesti ja MainActivity välittävät hash-fragmentin WebView'lle.
- [ ] Tokenin revokointi = merkinnän poisto KV:stä.
- [ ] Koordinaatit eivät näy selväkielisenä repossa tai verkossa.
