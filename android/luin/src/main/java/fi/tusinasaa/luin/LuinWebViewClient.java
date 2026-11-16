package fi.tusinasaa.luin;

import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;

/**
 * Pitää WebView:n Luinin sivuilla (luin.html ja luin/-kansio): muut linkit aukeavat järjestelmän selaimeen, kuten
 * Luinin uuteen välilehteen avaamat linkit selaimessa. Syöttää Luinin sivuille sillan ja näyttää latausvirheen
 * sivuna; verkkovirheessä yritetään ensin välimuistista.
 */
final class LuinWebViewClient extends WebViewClient {

    private final MainActivity a;
    private final MainActivity.Osoitteet osoitteet;

    LuinWebViewClient(@NonNull MainActivity a, @NonNull MainActivity.Osoitteet osoitteet) {
        this.a = a;
        this.osoitteet = osoitteet;
    }

    @Override
    public boolean shouldOverrideUrlLoading(@NonNull WebView view, @NonNull WebResourceRequest request) {
        if (!request.isForMainFrame()) {
            return false;
        }
        Uri uri = request.getUrl();
        if (osoitteet.luinin(uri)) {
            return false;
        }
        a.avaaUlkoinen(uri);
        return true;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        a.osoiteVaihtui(url);
    }

    @Override
    public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
        a.osoiteVaihtui(url);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        a.sivuValmis(url);
    }

    @Override
    public void onReceivedError(@NonNull WebView view, @NonNull WebResourceRequest request,
                                @NonNull WebResourceError error) {
        if (request.isForMainFrame()) {
            int k = error.getErrorCode();
            boolean verkko = k == ERROR_HOST_LOOKUP || k == ERROR_CONNECT || k == ERROR_TIMEOUT
                    || k == ERROR_IO || k == ERROR_UNKNOWN;
            String url = request.getUrl().toString();
            CharSequence kuvaus = error.getDescription();
            view.post(() -> a.latausVirhe(url, kuvaus, verkko));
        }
    }

    @Override
    public void onReceivedHttpError(@NonNull WebView view, @NonNull WebResourceRequest request,
                                    @NonNull WebResourceResponse errorResponse) {
        if (request.isForMainFrame() && errorResponse.getStatusCode() >= 400) {
            String url = request.getUrl().toString();
            String kuvaus = "HTTP " + errorResponse.getStatusCode();
            view.post(() -> a.latausVirhe(url, kuvaus, false));
        }
    }

    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        handler.cancel();
        String url = error.getUrl();
        view.post(() -> a.latausVirhe(url != null ? url : "", error.toString(), false));
    }

    @Override
    public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
        // Booxin kaltaisella vähämuistisella laitteella järjestelmä voi lopettaa WebView:n sivuprosessin. Ilman tätä
        // koko sovellus kaatuisi; nyt sivu ladataan uuteen WebView:hen (pino ja merkinnät ovat tallessa).
        view.post(a::luoUudelleen);
        return true;
    }
}
