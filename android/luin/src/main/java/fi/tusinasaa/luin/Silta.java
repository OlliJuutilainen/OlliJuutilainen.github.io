package fi.tusinasaa.luin;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import androidx.annotation.NonNull;

/**
 * window.LuinApp: silta.js:n kutsut. Ajetaan WebView:n sillan säikeessä, joten käyttöliittymä päivitetään
 * UI-säikeessä. Silta toimii vain Luinin omilla sivuilla (MainActivity.luotettu): ulkoinen sivu ei pääse siihen,
 * vaikka se jostain syystä latautuisi WebView:hen.
 */
final class Silta {

    private final MainActivity a;

    Silta(@NonNull MainActivity a) {
        this.a = a;
    }

    /** Lukija näkyvissä, tekstikenttä aktiivisena (äänenvoimakkuusnapit) ja sivun taustaväri (palkit). */
    @JavascriptInterface
    public void tila(boolean lukija, boolean kentta, String vari) {
        if (a.luotettu) {
            a.runOnUiThread(() -> {
                if (a.luotettu) {
                    a.tila(lukija, kentta, vari);
                }
            });
        }
    }

    /** Lataus (Lataa md, merkintöjen vienti, zip): base64-sisältö kansioon Download/Luin. */
    @JavascriptInterface
    public void tallenna(String nimi, String tyyppi, String base64) {
        if (!a.luotettu || nimi == null || base64 == null) {
            return;
        }
        byte[] data;
        try {
            data = Base64.decode(base64, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            a.runOnUiThread(() -> a.ilmoita(a.getString(R.string.save_failed)));
            return;
        }
        a.runOnUiThread(() -> a.tallenna(nimi, tyyppi, data));
    }

    /** Kopiointi leikepöydälle (lähdeviite HTML:nä ja tekstinä, linkki, valinta). */
    @JavascriptInterface
    public void kopioi(String teksti, String html) {
        if (!a.luotettu || teksti == null) {
            return;
        }
        a.runOnUiThread(() -> {
            ClipboardManager cm = (ClipboardManager) a.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm == null) {
                return;
            }
            ClipData d = html != null && !html.isEmpty()
                    ? ClipData.newHtmlText("Luin.", teksti, html)
                    : ClipData.newPlainText("Luin.", teksti);
            cm.setPrimaryClip(d);
        });
    }

    /** Latomoon jaettu teksti; annetaan kerran. */
    @JavascriptInterface
    public String jaettu() {
        if (!a.luotettu) {
            return null;
        }
        String t = a.jaettu;
        a.jaettu = null;
        return t;
    }
}
