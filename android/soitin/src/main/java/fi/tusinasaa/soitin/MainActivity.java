package fi.tusinasaa.soitin;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.IBinder;
import android.text.TextUtils;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Keikkasoitin Light Phonelle. Avaa soitin/index.html-sivun WebView-näkymässä samaan tapaan
 * kuin Tusinasää avaa tusinapaja.html:n. Sivu ladataan verkosta eikä paketoida sovellukseen,
 * koska worker antaa keikkatiedot vain ollijuutilainen.github.io-alkuperälle.
 *
 * <p>Keikka avataan tunnuksella Omat keikkani -näkymästä (assets/keikat.html), joka on
 * soittimen päällä omana WebView-näkymänään. Siksi listan avaaminen ei katkaise soittoa.
 */
public class MainActivity extends AppCompatActivity {

    private static final String PLAYER_HOST = "ollijuutilainen.github.io";
    private static final String PLAYER_PATH = "/soitin/";
    private static final String PLAYER_URL = "https://" + PLAYER_HOST + PLAYER_PATH;
    private static final String LIST_URL = "file:///android_asset/keikat.html";
    /** Virhesivun linkki Omat keikkani -näkymään (ks. PlayerWebViewClient). */
    static final String LIST_LINK = "soitin-app:keikat";

    // Sama muoto kuin soitin/index.html:n HASH_RE: tunnus, kaverin worker ja kappale.
    // Ryhmä 1 on keikan tunniste Omissa keikoissani (tunnus tai tunnus@worker).
    private static final Pattern HASH = Pattern.compile(
            "^([a-z0-9]{4,32}(?:@[a-z0-9-]{1,63}\\.[a-z0-9-]{1,63})?)"
                    + "(?:/(?:\\d+|x\\d+)(?:/(?:\\d+|x\\d+))?)?$");

    private WebView webView;
    private WebView listView;
    private GigStore store;
    // Soittimeen viimeksi ladattu osoite (virhesivun Yritä uudelleen) ja sen keikka.
    // currentId luetaan myös listan sillasta, joka ajetaan eri säikeessä.
    private String requestedUrl = PLAYER_URL;
    private volatile String currentId = "";
    // Listalta poistetut keikat, jotka ovat yhä auki soittimessa. Sivu ilmoittaa keikan
    // uudestaan esimerkiksi kestojen selvitessä, eikä se saa palauttaa poistettua keikkaa.
    // Uusi avaus listalta tai tunnuksella tuo keikan takaisin.
    private final Set<String> removed = new HashSet<>();
    private String bridgeScript = "";
    private PlaybackService service;
    private boolean bound;

    // Sivun viimeksi ilmoittama tila. Palvelu saa sen heti, kun sidonta valmistuu.
    private boolean playing;
    private String title = "";
    private String track = "";

    private final ServiceConnection connection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            service = ((PlaybackService.LocalBinder) binder).getService();
            service.setControls(MainActivity.this::onMediaButton);
            service.update(playing, title, track);
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            service = null;
        }
    };

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Äänenvoimakkuusnapit säätävät musiikkia myös tauon aikana.
        setVolumeControlStream(AudioManager.STREAM_MUSIC);

        store = new GigStore(this);

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        root.addView(webView);
        listView = new WebView(this);
        listView.setBackgroundColor(Color.BLACK);
        listView.setVisibility(View.GONE);
        root.addView(listView);
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);

        bridgeScript = readAsset("silta.js");
        webView.addJavascriptInterface(new Bridge(), "SoitinApp");
        webView.setWebViewClient(new PlayerWebViewClient(this));
        // Oletus-WebChromeClient näyttää window.prompt-ikkunan, jota linkin kopiointi käyttää
        // varakeinona. Ilman sitä kutsu palaisi hiljaa tyhjänä.
        webView.setWebChromeClient(new WebChromeClient());
        setUpList();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                // Listalta takaisin soittimeen, jos siinä on keikka auki.
                if (listShown()) {
                    if (!currentId.isEmpty()) {
                        hideList();
                    } else {
                        finish();
                    }
                    return;
                }
                // Soiton aikana takaisin vie sovelluksen taustalle eikä katkaise soittoa.
                // Tauolla se sulkee sovelluksen.
                if (playing) {
                    moveTaskToBack(true);
                } else {
                    finish();
                }
            }
        });

        bound = bindService(new Intent(this, PlaybackService.class), connection,
                Context.BIND_AUTO_CREATE);

        // Käynnistyksessä viimeisin keikka, jossa soitto on alkanut, muuten viimeksi
        // latautunut keikka, muuten rakennusvaiheen oletuskeikka (soitin.tunnus), muuten
        // lista, jossa tunnus kysytään.
        String first = store.lastPlayed();
        if (first == null) {
            first = store.last();
        }
        if (first == null && !BuildConfig.GIG_KEY.isEmpty()) {
            first = BuildConfig.GIG_KEY;
        }
        if (first == null || !openGig(first)) {
            showList();
        }
    }

    /**
     * Avaa keikan soittimeen. {@code hash} on #-merkin jälkeinen osa: tunnus, kaverin worker
     * ja kappale kuten soittimen linkeissä. Jo auki olevaa keikkaa ei ladata uudelleen,
     * ettei soitto katkea; kappaleen vaihto saman keikan sisällä tehdään sivun omalla
     * hashchange-käsittelyllä.
     */
    boolean openGig(@NonNull String hash) {
        String h = hash.trim().toLowerCase(Locale.ROOT);
        String id = gigId(h);
        if (id == null) {
            return false;
        }
        boolean same = id.equals(currentId) && isPlayerUrl(webView.getUrl());
        if (removed.remove(id) && same) {
            // Poistettu mutta yhä auki: sivu ei ilmoita samoja tietoja uudestaan.
            webView.evaluateJavascript("window.__soitinKeikka && window.__soitinKeikka(true)",
                    null);
        }
        if (!same || !h.equals(id)) {
            currentId = id;
            requestedUrl = PLAYER_URL + "#" + h;
            webView.loadUrl(requestedUrl);
        }
        hideList();
        return true;
    }

    /** Keikan tunniste #-osasta tai null, jos se ei ole soittimen linkin muotoinen. */
    @Nullable
    static String gigId(@Nullable String hash) {
        if (hash == null) {
            return null;
        }
        Matcher m = HASH.matcher(hash.toLowerCase(Locale.ROOT));
        return m.matches() ? m.group(1) : null;
    }

    static boolean isPlayerUrl(@Nullable String url) {
        if (url == null) {
            return false;
        }
        Uri uri = Uri.parse(url);
        String path = uri.getPath();
        return "https".equals(uri.getScheme()) && PLAYER_HOST.equals(uri.getHost())
                && path != null && path.startsWith(PLAYER_PATH);
    }

    /** Kutsutaan, kun soittimen sivu on latautunut. */
    void injectBridge() {
        if (webView != null && !bridgeScript.isEmpty()) {
            webView.evaluateJavascript(bridgeScript, null);
        }
    }

    /** Uusi sivu korvaa vanhan, ja vanhan sivun soitto loppuu sen mukana. */
    void onPageStarted() {
        onPlayerState(false, "", "");
    }

    void showLoadError(@Nullable CharSequence description) {
        if (webView == null) {
            return;
        }
        String detail = TextUtils.isEmpty(description) ? ""
                : "<p class=d>" + TextUtils.htmlEncode(description.toString()) + "</p>";
        String html = "<!doctype html><html lang=fi><head><meta charset=utf-8>"
                + "<meta name=viewport content='width=device-width,initial-scale=1'><style>"
                + "body{margin:0;padding:28px 16px;background:#000;color:#ebe9e4;"
                + "font:17px/1.45 system-ui,sans-serif}"
                + ".d{color:#9b9890;font-size:.9rem}"
                + "a{display:inline-block;min-height:44px;line-height:44px;padding:0 16px;"
                + "border-radius:8px;background:#22221f;color:#ebe9e4;text-decoration:none}"
                + "</style></head><body>"
                + "<p>" + TextUtils.htmlEncode(getString(R.string.load_error)) + "</p>" + detail
                + "<p><a href='" + TextUtils.htmlEncode(requestedUrl) + "'>"
                + TextUtils.htmlEncode(getString(R.string.retry)) + "</a></p>"
                + "<p><a href='" + LIST_LINK + "'>"
                + TextUtils.htmlEncode(getString(R.string.my_gigs)) + "</a></p>"
                + "</body></html>";
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    /** Kuulokkeiden tai muun laitteen mediapainike. Toimii vain soittimen omalla sivulla. */
    private void onMediaButton(String action) {
        if (webView != null && isPlayerUrl(webView.getUrl())) {
            webView.evaluateJavascript("window.__soitinNappi && window.__soitinNappi('"
                    + action + "')", null);
        }
    }

    private void onPlayerState(boolean playing, @Nullable String title, @Nullable String track) {
        this.playing = playing;
        this.title = title != null ? title : "";
        this.track = track != null ? track : "";
        if (service != null) {
            service.update(this.playing, this.title, this.track);
        }
    }

    private final class Bridge {
        /** silta.js kutsuu tätä, kun soitto alkaa tai loppuu tai kappale vaihtuu. */
        @JavascriptInterface
        public void state(boolean playing, String title, String track) {
            runOnUiThread(() -> {
                // Silta on näkyvissä vain soittimen omalle sivulle.
                if (webView != null && isPlayerUrl(webView.getUrl())) {
                    onPlayerState(playing, title, track);
                }
            });
        }

        /**
         * silta.js kutsuu tätä, kun keikka on latautunut ja kun biisien kestot selviävät.
         * Vasta tästä keikka tulee Omiin keikkoihini, joten virheellinen tunnus ei tule.
         * {@code len} on biisien (ei ei-biisien) yhteiskesto sekunteina, alle 0 = ei tiedossa.
         */
        @JavascriptInterface
        public void gig(String title, String sub, double len) {
            runOnUiThread(() -> {
                if (webView == null || !isPlayerUrl(webView.getUrl())) {
                    return;
                }
                String id = gigId(Uri.parse(webView.getUrl()).getFragment());
                if (id != null && !removed.contains(id)) {
                    store.put(id, title != null ? title : "", sub != null ? sub : "", len);
                    store.setLast(id);
                }
            });
        }

        /** silta.js kutsuu tätä, kun soitto todella alkaa (audio-elementin playing). */
        @JavascriptInterface
        public void played() {
            runOnUiThread(() -> {
                if (webView == null || !isPlayerUrl(webView.getUrl())) {
                    return;
                }
                String id = gigId(Uri.parse(webView.getUrl()).getFragment());
                if (id != null && !removed.contains(id)) {
                    store.setLastPlayed(id);
                }
            });
        }

        /** Sivun Omat keikkani -nappi. */
        @JavascriptInterface
        public void list() {
            runOnUiThread(() -> {
                if (webView != null && isPlayerUrl(webView.getUrl())) {
                    showList();
                }
            });
        }

        /**
         * Sivun sulkemisnappi. Sulkee sovelluksen myös soiton aikana, jolloin palvelu
         * päättyy aktiviteetin mukana. Seuraava käynnistys lataa sivun alusta.
         */
        @JavascriptInterface
        public void close() {
            runOnUiThread(() -> {
                if (webView != null && isPlayerUrl(webView.getUrl())) {
                    finishAndRemoveTask();
                }
            });
        }
    }

    // ---- Omat keikkani ------------------------------------------------------

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    private void setUpList() {
        WebSettings settings = listView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(false);
        listView.addJavascriptInterface(new ListBridge(), "Keikat");
        // Lista on paikallinen sivu, eikä siltä navigoida minnekään. Silta on siksi vain
        // tämän sivun käytössä.
        listView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(@NonNull WebView view,
                                                    @NonNull WebResourceRequest request) {
                return true;
            }
        });
        listView.setWebChromeClient(new WebChromeClient());
        listView.loadUrl(LIST_URL);
    }

    private boolean listShown() {
        return listView != null && listView.getVisibility() == View.VISIBLE;
    }

    void showList() {
        if (listView == null) {
            return;
        }
        // Sivu hakee tiedot itse, kun se latautuu; jo ladattu sivu päivitetään.
        listView.evaluateJavascript("window.__paivita && window.__paivita()", null);
        listView.setVisibility(View.VISIBLE);
        listView.requestFocus();
    }

    private void hideList() {
        if (listView == null) {
            return;
        }
        listView.setVisibility(View.GONE);
        webView.requestFocus();
    }

    /** Kaikki pois: keikat, soittimen sivun tallentamat asetukset, välimuisti ja evästeet. */
    private void clearAll() {
        store.clear();
        removed.clear();
        currentId = "";
        requestedUrl = PLAYER_URL;
        webView.loadUrl("about:blank");
        webView.clearCache(true);
        webView.clearHistory();
        WebStorage.getInstance().deleteAllData();
        CookieManager.getInstance().removeAllCookies(null);
        CookieManager.getInstance().flush();
        showList();
    }

    private final class ListBridge {
        /** Lista, järjestys ja soittimessa auki oleva keikka JSON-muodossa. */
        @JavascriptInterface
        public String data() {
            JSONObject o = new JSONObject();
            try {
                o.put("gigs", store.gigs());
                o.put("sort", store.sort());
                o.put("current", currentId);
            } catch (JSONException e) {
                return "{}";
            }
            return o.toString();
        }

        /** Palauttaa false, jos tunnus ei ole soittimen linkin muotoinen. */
        @JavascriptInterface
        public boolean open(String hash) {
            if (gigId(hash) == null) {
                return false;
            }
            runOnUiThread(() -> openGig(hash));
            return true;
        }

        @JavascriptInterface
        public void remove(String id) {
            if (id != null) {
                store.remove(id);
                runOnUiThread(() -> removed.add(id));
            }
        }

        @JavascriptInterface
        public void sort(String sort) {
            if (sort != null && sort.matches("-?(added|title|len)")) {
                store.setSort(sort);
            }
        }

        @JavascriptInterface
        public void clear() {
            runOnUiThread(MainActivity.this::clearAll);
        }

        /** Takaisin soittimeen. */
        @JavascriptInterface
        public void back() {
            runOnUiThread(() -> {
                if (!currentId.isEmpty()) {
                    hideList();
                }
            });
        }

        @JavascriptInterface
        public void close() {
            runOnUiThread(MainActivity.this::finishAndRemoveTask);
        }
    }

    private String readAsset(String name) {
        try (InputStream in = getAssets().open(name)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (IOException e) {
            return "";
        }
    }

    @Override
    protected void onDestroy() {
        if (service != null) {
            service.setControls(null);
        }
        if (bound) {
            unbindService(connection);
            bound = false;
        }
        service = null;
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        if (listView != null) {
            listView.destroy();
            listView = null;
        }
        super.onDestroy();
    }
}
