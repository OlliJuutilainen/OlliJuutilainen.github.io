package fi.tusinasaa.soitin;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Pitää WebView:n soittimen sivulla, syöttää sille sillan ja näyttää latausvirheen
 * sivuna eikä pelkkänä ohikiitävänä ilmoituksena.
 */
final class PlayerWebViewClient extends WebViewClient {

    private final MainActivity activity;

    PlayerWebViewClient(@NonNull MainActivity activity) {
        this.activity = activity;
    }

    @Override
    public boolean shouldOverrideUrlLoading(@NonNull WebView view,
                                            @NonNull WebResourceRequest request) {
        Uri uri = request.getUrl();
        if (MainActivity.isPlayerUrl(uri.toString())) {
            return false;
        }
        // Muut linkit järjestelmälle. Light Phonessa niille ei ehkä ole avaajaa, jolloin
        // napautus ei tee mitään.
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            activity.startActivity(intent);
        } catch (ActivityNotFoundException ignored) {
            // Ei avaajaa.
        }
        return true;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        activity.onPageStarted();
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        if (MainActivity.isPlayerUrl(url)) {
            activity.injectBridge();
        }
    }

    @Override
    public void onReceivedError(@NonNull WebView view, @NonNull WebResourceRequest request,
                                @NonNull WebResourceError error) {
        if (request.isForMainFrame()) {
            showError(view, error.getDescription());
        }
    }

    @Override
    public void onReceivedHttpError(@NonNull WebView view, @NonNull WebResourceRequest request,
                                    @NonNull WebResourceResponse errorResponse) {
        if (request.isForMainFrame() && errorResponse.getStatusCode() >= 400) {
            showError(view, "HTTP " + errorResponse.getStatusCode());
        }
    }

    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        handler.cancel();
        showError(view, error.toString());
    }

    private void showError(@NonNull WebView view, @Nullable CharSequence description) {
        view.post(() -> activity.showLoadError(description));
    }
}
