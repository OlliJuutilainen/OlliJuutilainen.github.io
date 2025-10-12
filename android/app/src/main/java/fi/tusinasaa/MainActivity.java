package fi.tusinasaa;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final String BASE_URL = "file:///android_asset/tusinapaja.html";
    private static final String DEFAULT_LAT = "60.2633";
    private static final String DEFAULT_LON = "25.3244";
    private static final String DEFAULT_TITLE = "TUSINASÄÄ 12 · LEMMINKÄISEN TEMPPELI";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(false);

        webView.setWebViewClient(new WebViewClient());
        loadFromIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        loadFromIntent(intent);
    }

    private void loadFromIntent(@Nullable Intent intent) {
        if (webView == null) {
            return;
        }
        webView.loadUrl(buildStartUrl(intent));
    }

    private String buildStartUrl(@Nullable Intent intent) {
        Uri data = intent != null ? intent.getData() : null;

        String lat = null;
        String lon = null;
        String zoom = null;
        String title = null;
        String token = null;
        String key = null;

        if (data != null) {
            lat = sanitizeLatitude(data.getQueryParameter("lat"));
            lon = sanitizeLongitude(data.getQueryParameter("lon"));
            zoom = sanitizeZoom(data.getQueryParameter("z"));
            title = sanitizeTitle(data.getQueryParameter("title"));
            token = trimToNull(data.getQueryParameter("t"));
            key = trimToNull(data.getQueryParameter("k"));

            if ((lat == null || lon == null)) {
                List<String> segments = data.getPathSegments();
                if (segments != null && !segments.isEmpty()) {
                    String last = segments.get(segments.size() - 1);
                    String[] parts = last.split(",");
                    if (parts.length == 2) {
                        lat = sanitizeLatitude(parts[0]);
                        lon = sanitizeLongitude(parts[1]);
                    }
                }
            }

            String fragment = data.getFragment();
            if (!TextUtils.isEmpty(fragment)) {
                Uri fragmentUri = Uri.parse("http://localhost/?" + fragment);
                if (lat == null) {
                    lat = sanitizeLatitude(fragmentUri.getQueryParameter("lat"));
                }
                if (lon == null) {
                    lon = sanitizeLongitude(fragmentUri.getQueryParameter("lon"));
                }
                if (zoom == null) {
                    zoom = sanitizeZoom(fragmentUri.getQueryParameter("z"));
                }
                if (title == null) {
                    title = sanitizeTitle(fragmentUri.getQueryParameter("title"));
                }
                if (token == null) {
                    token = trimToNull(fragmentUri.getQueryParameter("t"));
                }
                if (key == null) {
                    key = trimToNull(fragmentUri.getQueryParameter("k"));
                }
            }
        }

        if (lat == null || lon == null) {
            lat = DEFAULT_LAT;
            lon = DEFAULT_LON;
            if (title == null) {
                title = DEFAULT_TITLE;
            }
        } else if (title == null && coordinatesMatchDefault(lat, lon)) {
            title = DEFAULT_TITLE;
        }

        Uri.Builder builder = Uri.parse(BASE_URL).buildUpon();
        builder.appendQueryParameter("lat", lat);
        builder.appendQueryParameter("lon", lon);
        if (!TextUtils.isEmpty(zoom)) {
            builder.appendQueryParameter("z", zoom);
        }
        if (!TextUtils.isEmpty(title)) {
            builder.appendQueryParameter("title", title);
        }

        String url = builder.build().toString();
        String hash = buildHashFragment(token, key);
        if (!hash.isEmpty()) {
            url = url + "#" + hash;
        }
        return url;
    }

    private static String buildHashFragment(@Nullable String token, @Nullable String key) {
        StringBuilder sb = new StringBuilder();
        if (!TextUtils.isEmpty(token)) {
            sb.append("t=").append(Uri.encode(token));
        }
        if (!TextUtils.isEmpty(key)) {
            if (sb.length() > 0) {
                sb.append('&');
            }
            sb.append("k=").append(Uri.encode(key));
        }
        return sb.toString();
    }

    private static String sanitizeLatitude(@Nullable String raw) {
        return sanitizeCoordinate(raw, -90.0, 90.0);
    }

    private static String sanitizeLongitude(@Nullable String raw) {
        return sanitizeCoordinate(raw, -180.0, 180.0);
    }

    private static String sanitizeCoordinate(@Nullable String raw, double min, double max) {
        if (TextUtils.isEmpty(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        try {
            double value = Double.parseDouble(trimmed);
            if (Double.isNaN(value) || Double.isInfinite(value)) {
                return null;
            }
            if (value < min || value > max) {
                return null;
            }
            return String.format(Locale.US, "%.6f", value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String sanitizeZoom(@Nullable String raw) {
        if (TextUtils.isEmpty(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        try {
            int value = Integer.parseInt(trimmed);
            if (value < 0) {
                return null;
            }
            return Integer.toString(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String sanitizeTitle(@Nullable String raw) {
        if (TextUtils.isEmpty(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > 160) {
            return trimmed.substring(0, 160);
        }
        return trimmed;
    }

    private static boolean coordinatesMatchDefault(String lat, String lon) {
        return almostEqual(lat, DEFAULT_LAT) && almostEqual(lon, DEFAULT_LON);
    }

    private static boolean almostEqual(String value, String reference) {
        try {
            double a = Double.parseDouble(value);
            double b = Double.parseDouble(reference);
            return Math.abs(a - b) < 1e-4;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private static String trimToNull(@Nullable String raw) {
        if (TextUtils.isEmpty(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (webView != null) {
            webView.destroy();
        }
    }
}
