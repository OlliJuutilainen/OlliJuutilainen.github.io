package fi.tusinasaa.luin;

import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Jaettu teksti (Jaa → Luin.): mihin se avataan.
 *
 * <ul>
 * <li>luin-linkki (luin.html#…) sellaisenaan ja jakolinkki (luin.ollijuutilainen.workers.dev/?u=…) lukimeen
 * kuten worker ohjaisi selaimen;</li>
 * <li>pelkkä .md-, .markdown- tai .txt-osoite tai Dropbox-linkki lukimeen (luin.html#u=, kuten luin-linkki);</li>
 * <li>muu pelkkä verkko-osoite ei: luin ei osaa tehdä verkkosivusta tekstiä, sen tekee lukimeen-lisäosa;</li>
 * <li>kaikki muu on tekstiä, joka viedään latomoon tarkistettavaksi (Avaa lukimessa).</li>
 * </ul>
 */
final class Jako {

    private static final String JAKO_PALVELIN = "luin.ollijuutilainen.workers.dev";
    private static final Pattern OSOITE = Pattern.compile("https?://\\S+");
    private static final Pattern MD = Pattern.compile(".*\\.(md|markdown|txt)$");

    static final class Kohde {
        /** Avattava osoite tai null. */
        @Nullable
        final String url;
        /** Pelkkä verkkosivun osoite, jota ei voi avata. */
        final boolean verkkosivu;

        Kohde(@Nullable String url, boolean verkkosivu) {
            this.url = url;
            this.verkkosivu = verkkosivu;
        }
    }

    private Jako() {
    }

    @NonNull
    static Kohde kohde(@NonNull String teksti, @NonNull MainActivity.Osoitteet osoitteet) {
        String t = teksti.trim();
        if (!OSOITE.matcher(t).matches()) {
            return new Kohde(null, false);
        }
        Uri u = Uri.parse(t);
        if (osoitteet.luinin(u)) {
            return new Kohde(t, false);
        }
        String palvelin = u.getHost() == null ? "" : u.getHost().toLowerCase(Locale.ROOT);
        if (palvelin.equals(JAKO_PALVELIN)) {
            String kohde = u.getQueryParameter("u");
            return kohde != null && !kohde.trim().isEmpty()
                    ? new Kohde(osoitteet.luin() + "#u=" + Uri.encode(kohde.trim()), false)
                    : new Kohde(osoitteet.luin(), false);
        }
        String polku = u.getPath() == null ? "" : u.getPath().toLowerCase(Locale.ROOT);
        boolean dropbox = palvelin.equals("dropbox.com") || palvelin.endsWith(".dropbox.com")
                || palvelin.endsWith(".dropboxusercontent.com");
        if (dropbox || MD.matcher(polku).matches()) {
            return new Kohde(osoitteet.luin() + "#u=" + Uri.encode(t), false);
        }
        return new Kohde(null, true);
    }
}
