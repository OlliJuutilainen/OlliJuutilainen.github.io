package fi.tusinasaa;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

/**
 * Custom {@link WebViewClient} that keeps the in-app navigation constrained to HTTP(S) URLs
 * while delegating other schemes to the system and providing a local asset fallback when
 * remote loading fails.
 */
public class TusinaWebViewClient extends WebViewClient {

    private final MainActivity activity;

    public TusinaWebViewClient(@NonNull MainActivity activity) {
        this.activity = activity;
    }

    @Override
    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public boolean shouldOverrideUrlLoading(@NonNull WebView view, @NonNull WebResourceRequest request) {
        return handleUri(request.getUrl());
    }

    @Override
    @SuppressWarnings("deprecation")
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return handleUri(url != null ? Uri.parse(url) : null);
    }

    private boolean handleUri(@Nullable Uri uri) {
        if (uri == null) {
            return false;
        }
        String scheme = uri.getScheme();
        if (scheme == null) {
            return false;
        }
        if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
            return false;
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            activity.startActivity(intent);
        } catch (ActivityNotFoundException ignored) {
            // No matching activity, stay inside the WebView.
        }
        return true;
    }

    @Override
    @RequiresApi(api = Build.VERSION_CODES.M)
    public void onReceivedError(@NonNull WebView view, @NonNull WebResourceRequest request,
                                @NonNull WebResourceError error) {
        if (request.isForMainFrame()) {
            activity.switchToAssetFallback();
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
        activity.switchToAssetFallback();
    }

    @Override
    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public void onReceivedHttpError(@NonNull WebView view, @NonNull WebResourceRequest request,
                                    @NonNull WebResourceResponse errorResponse) {
        if (request.isForMainFrame() && errorResponse.getStatusCode() >= 400) {
            activity.switchToAssetFallback();
        }
    }

    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        handler.cancel();
        activity.switchToAssetFallback();
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        if (url == null) {
            return;
        }
        if (activity.getFallbackAssetUrl().equals(url)) {
            activity.onFallbackContentLoaded();
        } else if (url.startsWith("http://") || url.startsWith("https://")) {
            activity.onRemoteContentLoaded();
        }
    }
}
