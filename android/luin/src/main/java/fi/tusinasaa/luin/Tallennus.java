package fi.tusinasaa.luin;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.IOException;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Luinin lataukset tiedostoiksi. Android 10:stä alkaen suoraan kansioon Download/Luin ilman lupia (MediaStore);
 * saman niminen tiedosto saa järjestelmän numeron. Android 7–9:ssä järjestelmä kysyy paikan (Tallenna nimellä).
 */
final class Tallennus {

    private static final String KANSIO = Environment.DIRECTORY_DOWNLOADS + "/Luin";

    private final MainActivity a;
    private final ExecutorService taustalla = Executors.newSingleThreadExecutor();
    private final ActivityResultLauncher<String> paikka;
    private byte[] odottaa;

    Tallennus(@NonNull MainActivity a) {
        this.a = a;
        // Android 7–9: luodaan aina, koska rekisteröinti on tehtävä ennen kuin aktiviteetti käynnistyy.
        paikka = a.registerForActivityResult(new ActivityResultContracts.CreateDocument("*/*"), uri -> {
            byte[] data = odottaa;
            odottaa = null;
            if (uri == null || data == null) {
                return;
            }
            taustalla.execute(() -> {
                boolean ok = kirjoita(a.getContentResolver(), uri, data);
                a.runOnUiThread(() -> a.ilmoita(ok ? a.getString(R.string.saved, nimi(uri))
                        : a.getString(R.string.save_failed)));
            });
        });
    }

    void tallenna(@NonNull String nimi, @Nullable String tyyppi, @NonNull byte[] data) {
        String puhdas = nimi.replaceAll("[\\\\/:*?\"<>|\\x00-\\x1f]", "_").trim();
        if (puhdas.isEmpty()) {
            puhdas = "luin";
        }
        String laji = tyyppi(puhdas, tyyppi);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            odottaa = data;
            try {
                paikka.launch(puhdas);
            } catch (android.content.ActivityNotFoundException e) {
                odottaa = null;
                a.ilmoita(a.getString(R.string.save_failed));
            }
            return;
        }
        final String n = puhdas;
        taustalla.execute(() -> {
            String tulos = latauksiin(n, laji, data);
            a.runOnUiThread(() -> a.ilmoita(tulos != null ? a.getString(R.string.saved, tulos)
                    : a.getString(R.string.save_failed)));
        });
    }

    /** Palauttaa tallennetun tiedoston polun (Download/Luin/nimi.md) tai null. */
    @Nullable
    private String latauksiin(@NonNull String nimi, @NonNull String tyyppi, @NonNull byte[] data) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return null;
        }
        ContentResolver r = a.getContentResolver();
        ContentValues v = new ContentValues();
        v.put(MediaStore.MediaColumns.DISPLAY_NAME, nimi);
        v.put(MediaStore.MediaColumns.MIME_TYPE, tyyppi);
        v.put(MediaStore.MediaColumns.RELATIVE_PATH, KANSIO);
        v.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri uri;
        try {
            uri = r.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
        } catch (RuntimeException e) {
            return null;
        }
        if (uri == null) {
            return null;
        }
        if (!kirjoita(r, uri, data)) {
            try {
                r.delete(uri, null, null);
            } catch (RuntimeException ignored) {
                // Keskeneräinen tiedosto jää piiloon (IS_PENDING) ja järjestelmä siivoaa sen.
            }
            return null;
        }
        ContentValues valmis = new ContentValues();
        valmis.put(MediaStore.MediaColumns.IS_PENDING, 0);
        try {
            r.update(uri, valmis, null, null);
        } catch (RuntimeException e) {
            return null;
        }
        return KANSIO + "/" + nimi(uri);
    }

    private static boolean kirjoita(@NonNull ContentResolver r, @NonNull Uri uri, @NonNull byte[] data) {
        try (OutputStream out = r.openOutputStream(uri)) {
            if (out == null) {
                return false;
            }
            out.write(data);
            return true;
        } catch (IOException | RuntimeException e) {
            return false;
        }
    }

    /** Tiedoston lopullinen nimi (järjestelmä on voinut lisätä numeron). */
    @NonNull
    private String nimi(@NonNull Uri uri) {
        try (Cursor c = a.getContentResolver().query(uri,
                new String[]{MediaStore.MediaColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                String n = c.getString(0);
                if (n != null) {
                    return n;
                }
            }
        } catch (RuntimeException ignored) {
            // Nimi ei ole tiedossa.
        }
        String p = uri.getLastPathSegment();
        return p != null ? p : "";
    }

    /** Selaimen Blob-tyyppi ilman parametreja; Markdown tunnistetaan myös päätteestä. */
    @NonNull
    static String tyyppi(@NonNull String nimi, @Nullable String tyyppi) {
        String t = tyyppi == null ? "" : tyyppi.split(";")[0].trim().toLowerCase(java.util.Locale.ROOT);
        String n = nimi.toLowerCase(java.util.Locale.ROOT);
        if (n.endsWith(".md") || n.endsWith(".markdown")) {
            return "text/markdown";
        }
        if (n.endsWith(".zip")) {
            return "application/zip";
        }
        return t.matches("[a-z0-9.+-]+/[a-z0-9.+-]+") ? t : "application/octet-stream";
    }
}
