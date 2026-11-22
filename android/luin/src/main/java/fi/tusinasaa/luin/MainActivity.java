package fi.tusinasaa.luin;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.text.TextUtils;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.ColorUtils;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Luin. Android-sovelluksena. Avaa luin.html:n WebView-näkymässä samaan tapaan kuin KEICK•WALK avaa soittimen:
 * sivu ladataan verkosta, joten Luin päivittyy itsestään, ja kaikki tieto (pino, merkinnät, asetukset) on WebView:n
 * localStoragessa kuten selaimessa. luin.html ei tiedä sovelluksesta mitään; silta.js liittää sen siihen.
 *
 * <p>Sovellus tuo selaimeen verrattuna: äänenvoimakkuusnapit kääntävät sivua lukimessa (Chromium-selaimet eivät
 * välitä niitä sivulle, tusina-rata: myssy/luin-volumenapit.md), lataukset tallentuvat kansioon Download/Luin,
 * kokoruutu piilottaa järjestelmän palkit, Luin aukeaa ilman verkkoa välimuistista, tila- ja navigointipalkki ovat
 * Luinin paperin värisiä, ja tekstin tai .md-tiedoston voi jakaa latomoon.
 */
public class MainActivity extends AppCompatActivity {

    private static final String TALLE = "luin";
    private static final String TALLE_OSOITE = "osoite";
    /** Jaetun tiedoston enimmäiskoko. Luinin pisimmät tekstit (kirjat) ovat muutaman megatavun. */
    private static final int JAKO_RAJA = 8 * 1024 * 1024;

    private final Osoitteet osoitteet = new Osoitteet(BuildConfig.OSOITE);

    private FrameLayout juuri;
    private WebView verkko;
    private String silta = "";

    // Sivun silta.js:n ilmoittama tila. Luetaan näppäinkäsittelyssä UI-säikeessä.
    private boolean lukija;
    private boolean kentta;
    // Onko näkyvä sivu Luinin oma (silta toimii vain silloin). Kirjoitetaan UI-säikeessä, luetaan sillan säikeessä.
    volatile boolean luotettu;

    // Kokoruutu (Fullscreen API): WebView antaa näkymän, joka näytetään kaiken päällä järjestelmän palkit piilossa.
    private View kokoNakyma;
    private WebChromeClient.CustomViewCallback kokoPaluu;

    // Latomoon odottava jaettu teksti; silta.js hakee sen, kun latomo.html on latautunut (Silta.jaettu).
    volatile String jaettu;

    // Viimeksi pyydetty osoite (virhesivun Yritä uudelleen) ja yritettiinkö se jo välimuistista.
    private String pyydetty;
    private String valimuistista;

    // Palkkien nykyinen väri (asetaVari).
    private Integer palkkiVari;
    // Edellinen sivuprosessin kaatuminen (luoUudelleen).
    private long kaatui;

    private ValueCallback<Uri[]> tiedostoPaluu;
    private ActivityResultLauncher<Intent> tiedostoValitsin;
    private Tallennus tallennus;
    private ConnectivityManager.NetworkCallback verkkoSeuraaja;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        juuri = new FrameLayout(this);
        juuri.setBackgroundColor(ContextCompat.getColor(this, R.color.paperi));
        setContentView(juuri);
        asetaVari(ContextCompat.getColor(this, R.color.paperi));

        silta = lueAsset("silta.js");
        tallennus = new Tallennus(this);
        tiedostoValitsin = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(), tulos -> {
                    if (tiedostoPaluu != null) {
                        tiedostoPaluu.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(
                                tulos.getResultCode(), tulos.getData()));
                        tiedostoPaluu = null;
                    }
                });

        if (BuildConfig.DEBUG) {
            // Macin Chromen chrome://inspect näkee sivun (vain debug-rakennus).
            WebView.setWebContentsDebuggingEnabled(true);
        }
        luoVerkko();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                takaisin();
            }
        });

        seuraaVerkkoa();

        String alku = kasitteleAikomus(getIntent());
        if (alku == null) {
            // Viimeksi auki ollut teksti, kuten selaimen välilehti; muuten pino.
            String vanha = getSharedPreferences(TALLE, MODE_PRIVATE).getString(TALLE_OSOITE, null);
            alku = vanha != null && osoitteet.luinin(Uri.parse(vanha)) ? vanha : osoitteet.luin();
        }
        avaa(alku);
    }

    // ---- WebView ------------------------------------------------------------------------------

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    private void luoVerkko() {
        verkko = new WebView(this);
        verkko.setBackgroundColor(ContextCompat.getColor(this, R.color.paperi));
        // E-ink: ei vierityspalkkien häivytystä eikä reunan venymäefektiä, jotka päivittäisivät näyttöä turhaan.
        // Luinin oma aikajana kertoo kohdan tekstissä.
        verkko.setVerticalScrollBarEnabled(false);
        verkko.setHorizontalScrollBarEnabled(false);
        verkko.setOverScrollMode(View.OVER_SCROLL_NEVER);
        juuri.addView(verkko, 0, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings s = verkko.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        // Kirjasinkoko on Luinin oma asetus; järjestelmän fonttikoko suurentaisi kaiken sen päälle ja sotkisi
        // mitatun taiton.
        s.setTextZoom(100);
        s.setUseWideViewPort(true);
        // target="_blank" ja window.open aukeavat samaan näkymään (tai ulkoiset linkit selaimeen); takaisin palaa.
        s.setSupportMultipleWindows(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            // Android 10–12: WebView ei saa tummentaa sivua itse; Luinilla on oma tumma teemansa.
            //noinspection deprecation
            s.setForceDark(WebSettings.FORCE_DARK_OFF);
        }
        paivitaVerkko();

        verkko.addJavascriptInterface(new Silta(this), "LuinApp");
        verkko.setWebViewClient(new LuinWebViewClient(this, osoitteet));
        verkko.setWebChromeClient(new Kromi());
        verkko.setDownloadListener((url, ua, kuvaus, tyyppi, pituus) -> {
            if (url.startsWith("blob:") || url.startsWith("data:")) {
                // silta.js hoitaa Luinin lataukset itse; tämä on varakeino, jos jokin ohittaa sen.
                String nimi = URLUtil.guessFileName(url, kuvaus, tyyppi);
                verkko.evaluateJavascript("window.__luinLataa && window.__luinLataa("
                        + JSONObject.quote(url) + "," + JSONObject.quote(nimi) + ")", null);
            } else {
                avaaUlkoinen(Uri.parse(url));
            }
        });
        verkko.requestFocus();
    }

    /** Lataa osoitteen. Ilman verkkoa käytetään välimuistia (paivitaVerkko). */
    void avaa(@NonNull String url) {
        pyydetty = url;
        valimuistista = null;
        paivitaVerkko();
        verkko.loadUrl(url);
    }

    /** Sivu alkoi latautua tai osoite vaihtui (myös #-osa). */
    void osoiteVaihtui(@Nullable String url) {
        boolean oma = url != null && osoitteet.luinin(Uri.parse(url));
        if (oma != luotettu || !oma) {
            lukija = false;
            kentta = false;
        }
        luotettu = oma;
    }

    void sivuValmis(@Nullable String url) {
        if (url != null && osoitteet.luinin(Uri.parse(url)) && !silta.isEmpty()) {
            verkko.evaluateJavascript(silta, null);
        }
        if (kokoNakyma == null) {
            verkko.requestFocus();
        }
    }

    /**
     * Pääsivun latausvirhe. Verkkovirheessä yritetään kerran välimuistista (Pagesin max-age on 10 min, mutta
     * vanhentunutkin kopio kelpaa ilman verkkoa), sitten näytetään virhesivu.
     */
    void latausVirhe(@NonNull String url, @Nullable CharSequence kuvaus, boolean verkkovirhe) {
        if (verkkovirhe && !url.equals(valimuistista) && osoitteet.luinin(Uri.parse(url))) {
            valimuistista = url;
            verkko.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
            verkko.post(() -> verkko.loadUrl(url));
            return;
        }
        String yrita = osoitteet.luinin(Uri.parse(url)) ? url : pyydetty;
        String vari = String.format(Locale.ROOT, "#%06x", 0xffffff & ContextCompat.getColor(this, R.color.paperi));
        String ruoste = String.format(Locale.ROOT, "#%06x", 0xffffff & ContextCompat.getColor(this, R.color.ruoste));
        boolean vaalea = ColorUtils.calculateLuminance(ContextCompat.getColor(this, R.color.paperi)) > .5;
        String muste = vaalea ? "#231c14" : "#ebdfca", harmaa = vaalea ? "#67553f" : "#b09b7e";
        String html = "<!doctype html><html lang=fi><head><meta charset=utf-8>"
                + "<meta name=viewport content='width=device-width,initial-scale=1'><style>"
                + "body{margin:0;padding:48px 24px;background:" + vari + ";color:" + muste + ";"
                + "font:18px/1.5 Literata,Georgia,'Noto Serif',serif}"
                + "p{max-width:30em}.d{color:" + harmaa + ";font-size:.85em}"
                + "a{color:" + ruoste + ";display:inline-block;padding:10px 0}"
                + "</style></head><body>"
                + "<p>" + TextUtils.htmlEncode(getString(R.string.load_error)) + "</p>"
                + (verkossa() ? "" : "<p class=d>" + TextUtils.htmlEncode(getString(R.string.load_error_offline)) + "</p>")
                + (TextUtils.isEmpty(kuvaus) ? "" : "<p class=d>" + TextUtils.htmlEncode(kuvaus.toString()) + "</p>")
                + "<p><a href='" + TextUtils.htmlEncode(yrita) + "'>"
                + TextUtils.htmlEncode(getString(R.string.retry)) + "</a></p>"
                + "</body></html>";
        verkko.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    /**
     * WebView:n sivuprosessi kaatui tai järjestelmä lopetti sen (muisti): uusi WebView samaan osoitteeseen. Jos se
     * kaatuu taas minuutin sisällä, ei ladata uudelleen (kaatuisi kerta toisensa jälkeen), vaan näytetään virhesivu.
     */
    void luoUudelleen() {
        String url = verkko.getUrl();
        String kohde = url != null && osoitteet.luinin(Uri.parse(url)) ? url : pyydetty;
        long hetki = SystemClock.elapsedRealtime();
        boolean toistuu = kaatui != 0 && hetki - kaatui < 60_000;
        kaatui = hetki;
        piilotaKokoruutu();
        juuri.removeView(verkko);
        verkko.destroy();
        luoVerkko();
        if (toistuu) {
            pyydetty = kohde;
            latausVirhe(kohde, getString(R.string.renderer_gone), false);
        } else {
            avaa(kohde);
        }
    }

    /** Ulkoinen linkki (Luinin ulkopuolinen osoite, mailto ym.) järjestelmälle, yleensä selaimeen. */
    void avaaUlkoinen(@NonNull Uri uri) {
        Intent i = new Intent(Intent.ACTION_VIEW, uri);
        i.addCategory(Intent.CATEGORY_BROWSABLE);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(i);
        } catch (ActivityNotFoundException | SecurityException e) {
            ilmoita(getString(R.string.no_app_for_link));
        }
    }

    void ilmoita(@NonNull String teksti) {
        Toast.makeText(this, teksti, Toast.LENGTH_LONG).show();
    }

    private void takaisin() {
        if (kokoNakyma != null) {
            // Kuten selaimessa: takaisin poistuu kokoruudusta. Luin ei palaa siihen ennen seuraavaa avausta.
            if (kokoPaluu != null) {
                kokoPaluu.onCustomViewHidden();
            }
            piilotaKokoruutu();
            return;
        }
        if (verkko.canGoBack()) {
            verkko.goBack();
        } else {
            // Pinosta takaisin vie sovelluksen taustalle kuten Android 12:ssa yleensä; seuraava avaus jatkaa siitä.
            moveTaskToBack(true);
        }
    }

    // ---- Äänenvoimakkuusnapit ------------------------------------------------------------------

    /**
     * Lukimessa äänenvoimakkuusnapit ovat sivunkääntönäppäimiä: alas = PageDown (seuraava), ylös = PageUp. WebView
     * saa ne aitoina näppäintapahtumina, joten Luinin oma käsittelijä kääntää sivua sivutettuna ja pitkä painallus
     * (toisto, keyup) hyppää osioon; vierityksessä selain vierittää ruudullisen. Muualla (pino, latomo, ohjeet) ja
     * tekstikentässä napit säätävät äänenvoimakkuutta kuten ennenkin, esimerkiksi taustalla soivaa musiikkia.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int k = e.getKeyCode();
        if ((k == KeyEvent.KEYCODE_VOLUME_DOWN || k == KeyEvent.KEYCODE_VOLUME_UP)
                && luotettu && lukija && !kentta) {
            // Kokoruudussa WebView:n sisältö on sen antamassa näkymässä; näppäin sen kohdistetulle osalle.
            View kohde = verkko;
            if (kokoNakyma != null) {
                View f = kokoNakyma.findFocus();
                kohde = f != null ? f : kokoNakyma;
            }
            int uusi = k == KeyEvent.KEYCODE_VOLUME_DOWN ? KeyEvent.KEYCODE_PAGE_DOWN : KeyEvent.KEYCODE_PAGE_UP;
            KeyEvent m = new KeyEvent(e.getDownTime(), e.getEventTime(), e.getAction(), uusi,
                    e.getRepeatCount(), e.getMetaState(), e.getDeviceId(), 0, e.getFlags(),
                    InputDevice.SOURCE_KEYBOARD);
            kohde.dispatchKeyEvent(m);
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    /** silta.js: lukija näkyvissä, tekstikenttä aktiivisena, sivun taustaväri. */
    void tila(boolean lukija, boolean kentta, @Nullable String vari) {
        this.lukija = lukija;
        this.kentta = kentta;
        Integer v = Osoitteet.vari(vari);
        if (v != null) {
            asetaVari(v);
        }
    }

    // ---- Värit ja kokoruutu --------------------------------------------------------------------

    /** Tila- ja navigointipalkki sivun paperin värisiksi; kuvakkeet tummiksi vaalealla ja vaaleiksi tummalla. */
    private void asetaVari(int vari) {
        vari = 0xff000000 | vari;
        if (palkkiVari != null && palkkiVari == vari) {
            // Sama väri: ei turhaa palkkien piirtoa (e-ink).
            return;
        }
        palkkiVari = vari;
        getWindow().setStatusBarColor(vari);
        getWindow().setNavigationBarColor(vari);
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(vari));
        juuri.setBackgroundColor(vari);
        if (verkko != null) {
            verkko.setBackgroundColor(vari);
        }
        boolean vaalea = ColorUtils.calculateLuminance(vari) > .5;
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setAppearanceLightStatusBars(vaalea);
        c.setAppearanceLightNavigationBars(vaalea);
    }

    private void naytaKokoruutu(@NonNull View nakyma, @NonNull WebChromeClient.CustomViewCallback paluu) {
        if (kokoNakyma != null) {
            paluu.onCustomViewHidden();
            return;
        }
        kokoNakyma = nakyma;
        kokoPaluu = paluu;
        nakyma.setBackgroundColor(Color.BLACK);
        juuri.addView(nakyma, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Ei koskaan kameran loven alle: lovi jää mustaksi kaistaksi, eikä Luinin varasääntö (paivitaTurva,
            // 32 px) laukea, koska sivu ei peitä koko näytön korkeutta.
            WindowManager.LayoutParams p = getWindow().getAttributes();
            p.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
            getWindow().setAttributes(p);
        }
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
        nakyma.requestFocus();
    }

    private void piilotaKokoruutu() {
        if (kokoNakyma == null) {
            return;
        }
        juuri.removeView(kokoNakyma);
        kokoNakyma = null;
        kokoPaluu = null;
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.show(WindowInsetsCompat.Type.systemBars());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams p = getWindow().getAttributes();
            p.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT;
            getWindow().setAttributes(p);
        }
        verkko.requestFocus();
    }

    private final class Kromi extends WebChromeClient {
        // Kun onShowCustomView on ylikirjoitettu, WebView kertoo sivulle tukevansa kokoruutua (document.fullscreenEnabled).
        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            naytaKokoruutu(view, callback);
        }

        @Override
        public void onHideCustomView() {
            piilotaKokoruutu();
        }

        /** Merkintöjen tuonti ja latomon tiedosto: järjestelmän tiedostovalitsin, kaikki tyypit (.md:n tyyppi vaihtelee). */
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (tiedostoPaluu != null) {
                tiedostoPaluu.onReceiveValue(null);
            }
            tiedostoPaluu = callback;
            Intent i = new Intent(Intent.ACTION_GET_CONTENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("*/*");
            if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            }
            try {
                tiedostoValitsin.launch(i);
            } catch (ActivityNotFoundException e) {
                tiedostoPaluu = null;
                callback.onReceiveValue(null);
                ilmoita(getString(R.string.no_file_picker));
            }
            return true;
        }
    }

    // ---- Verkko ja välimuisti ------------------------------------------------------------------

    boolean verkossa() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) {
            return true;
        }
        Network n = cm.getActiveNetwork();
        NetworkCapabilities c = n != null ? cm.getNetworkCapabilities(n) : null;
        return c != null && c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    /** Verkossa tavallinen välimuisti, ilman verkkoa vanhentunutkin kopio (luin.html, md.js, kirjasimet). */
    private void paivitaVerkko() {
        if (verkko != null) {
            verkko.getSettings().setCacheMode(verkossa()
                    ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }
    }

    private void seuraaVerkkoa() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) {
            return;
        }
        verkkoSeuraaja = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                runOnUiThread(MainActivity.this::paivitaVerkko);
            }

            @Override
            public void onLost(@NonNull Network network) {
                runOnUiThread(MainActivity.this::paivitaVerkko);
            }
        };
        try {
            cm.registerDefaultNetworkCallback(verkkoSeuraaja);
        } catch (RuntimeException e) {
            verkkoSeuraaja = null;
        }
    }

    // ---- Lataukset ja leikepöytä ---------------------------------------------------------------

    void tallenna(@NonNull String nimi, @Nullable String tyyppi, @NonNull byte[] data) {
        tallennus.tallenna(nimi, tyyppi, data);
    }

    // ---- Jako ja linkit ------------------------------------------------------------------------

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String url = kasitteleAikomus(intent);
        if (url != null) {
            piilotaKokoruutu();
            avaa(url);
        }
    }

    /**
     * Jaettu teksti tai tiedosto latomoon, .md-osoite ja luin-linkki lukimeen. Palauttaa avattavan osoitteen tai
     * null, jos aikomuksessa ei ollut avattavaa.
     */
    @Nullable
    private String kasitteleAikomus(@Nullable Intent intent) {
        if (intent == null) {
            return null;
        }
        String toiminto = intent.getAction();
        Uri tiedosto = null;
        String teksti = null;
        if (Intent.ACTION_SEND.equals(toiminto)) {
            tiedosto = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            CharSequence t = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            teksti = t != null ? t.toString() : null;
        } else if (Intent.ACTION_VIEW.equals(toiminto) && intent.getData() != null) {
            Uri d = intent.getData();
            String skeema = d.getScheme();
            if ("http".equals(skeema) || "https".equals(skeema)) {
                teksti = d.toString();
            } else {
                tiedosto = d;
            }
        } else {
            return null;
        }
        if (tiedosto != null) {
            String sisalto = lueJaettu(tiedosto);
            if (sisalto == null) {
                return null;
            }
            jaettu = sisalto;
            return osoitteet.latomo();
        }
        if (teksti == null || teksti.trim().isEmpty()) {
            return null;
        }
        Jako.Kohde kohde = Jako.kohde(teksti, osoitteet);
        if (kohde.url != null) {
            return kohde.url;
        }
        if (kohde.verkkosivu) {
            ilmoita(getString(R.string.share_web_page));
            return null;
        }
        jaettu = teksti;
        return osoitteet.latomo();
    }

    @Nullable
    private String lueJaettu(@NonNull Uri uri) {
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) {
                ilmoita(getString(R.string.share_unreadable));
                return null;
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] puskuri = new byte[16384];
            int n;
            while ((n = in.read(puskuri)) != -1) {
                out.write(puskuri, 0, n);
                if (out.size() > JAKO_RAJA) {
                    ilmoita(getString(R.string.share_too_large));
                    return null;
                }
            }
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (IOException | SecurityException e) {
            ilmoita(getString(R.string.share_unreadable));
            return null;
        }
    }

    // ---- Elinkaari -----------------------------------------------------------------------------

    @Override
    protected void onPause() {
        super.onPause();
        // Avoin teksti muistiin, jotta järjestelmän lopettama sovellus palaa samaan tekstiin kuten selaimen välilehti.
        String url = verkko.getUrl();
        SharedPreferences.Editor m = getSharedPreferences(TALLE, MODE_PRIVATE).edit();
        if (url != null && osoitteet.luinin(Uri.parse(url)) && Osoitteet.avoinTeksti(url)) {
            m.putString(TALLE_OSOITE, url);
        } else if (url != null && osoitteet.luinin(Uri.parse(url))) {
            m.remove(TALLE_OSOITE);
        }
        m.apply();
        verkko.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        verkko.onResume();
        paivitaVerkko();
    }

    @Override
    protected void onDestroy() {
        if (verkkoSeuraaja != null) {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            try {
                cm.unregisterNetworkCallback(verkkoSeuraaja);
            } catch (RuntimeException ignored) {
                // Ei rekisteröity.
            }
        }
        if (tiedostoPaluu != null) {
            tiedostoPaluu.onReceiveValue(null);
            tiedostoPaluu = null;
        }
        if (verkko != null) {
            juuri.removeView(verkko);
            verkko.destroy();
            verkko = null;
        }
        super.onDestroy();
    }

    private String lueAsset(String nimi) {
        try (InputStream in = getAssets().open(nimi)) {
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

    /** Luinin osoitteet ja apufunktiot (testattavissa ilman Androidia vain osittain: Uri on Androidin). */
    static final class Osoitteet {
        private static final Pattern RGB = Pattern.compile(
                "rgba?\\(\\s*(\\d+)[,\\s]+(\\d+)[,\\s]+(\\d+)(?:[,\\s/]+([\\d.]+))?\\s*\\)");

        private final Uri juuri;

        Osoitteet(@NonNull String juuri) {
            this.juuri = Uri.parse(juuri);
        }

        String luin() {
            return juuri + "luin.html";
        }

        String latomo() {
            return juuri + "luin/latomo.html";
        }

        /** Luinin oma sivu: luin.html tai luin/-kansio samalta palvelimelta. Vain niille silta ja WebView. */
        boolean luinin(@Nullable Uri u) {
            if (u == null || !TextUtils.equals(u.getScheme(), juuri.getScheme())
                    || !TextUtils.equals(u.getHost(), juuri.getHost()) || u.getPort() != juuri.getPort()) {
                return false;
            }
            String p = u.getPath();
            return p != null && (p.equals("/luin.html") || p.startsWith("/luin/"));
        }

        /** luin.html, jossa on teksti auki (#id= tai #u=). */
        static boolean avoinTeksti(@NonNull String url) {
            Uri u = Uri.parse(url);
            String f = u.getFragment();
            return "/luin.html".equals(u.getPath()) && f != null && (f.startsWith("id=") || f.startsWith("u="));
        }

        /** CSS-väri rgb(r, g, b) kokonaisluvuksi; läpinäkyvä tai tuntematon on null. */
        @Nullable
        static Integer vari(@Nullable String css) {
            if (css == null) {
                return null;
            }
            Matcher m = RGB.matcher(css.trim());
            if (!m.matches()) {
                return null;
            }
            if (m.group(4) != null && Float.parseFloat(m.group(4)) < .5f) {
                return null;
            }
            return Color.rgb(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)),
                    Integer.parseInt(m.group(3)));
        }
    }
}
