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
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Keikkasoitin Light Phonelle. Avaa soitin/index.html-sivun WebView-näkymässä samaan tapaan
 * kuin Tusinasää avaa tusinapaja.html:n. Sivu ladataan verkosta eikä paketoida sovellukseen,
 * koska worker antaa keikkatiedot vain ollijuutilainen.github.io-alkuperälle.
 */
public class MainActivity extends AppCompatActivity {

    private static final String PLAYER_HOST = "ollijuutilainen.github.io";
    private static final String PLAYER_PATH = "/soitin/";
    private static final String PLAYER_URL = "https://" + PLAYER_HOST + PLAYER_PATH;

    private WebView webView;
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

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        setContentView(webView);

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

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
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
        openPlayer();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        openPlayer();
    }

    /**
     * Ensiversiossa keikka on aina sama ({@code soitin.tunnus} rakennusvaiheessa). Kun tunnus
     * myöhemmin tulee QR-koodista tai tunnussanasta, se luetaan tässä. Jo auki olevaa sivua ei
     * ladata uudelleen, ettei esimerkiksi ilmoituksen napautus katkaise soittoa.
     */
    void openPlayer() {
        String url = startUrl();
        if (!url.equals(webView.getUrl())) {
            webView.loadUrl(url);
        }
    }

    static String startUrl() {
        return PLAYER_URL + "#" + BuildConfig.GIG_KEY;
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
                + "<p><a href='" + TextUtils.htmlEncode(startUrl()) + "'>"
                + TextUtils.htmlEncode(getString(R.string.retry)) + "</a></p>"
                + "</body></html>";
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    private void onPlayerState(boolean playing, @Nullable String title, @Nullable String track) {
        this.playing = playing;
        this.title = title != null ? title : "";
        this.track = track != null ? track : "";
        if (service != null) {
            service.update(this.playing, this.title, this.track);
        }
    }

    /** silta.js kutsuu tätä, kun soitto alkaa tai loppuu tai kappale vaihtuu. */
    private final class Bridge {
        @JavascriptInterface
        public void state(boolean playing, String title, String track) {
            runOnUiThread(() -> {
                // Silta on näkyvissä vain soittimen omalle sivulle.
                if (webView != null && isPlayerUrl(webView.getUrl())) {
                    onPlayerState(playing, title, track);
                }
            });
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
        if (bound) {
            unbindService(connection);
            bound = false;
        }
        service = null;
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
