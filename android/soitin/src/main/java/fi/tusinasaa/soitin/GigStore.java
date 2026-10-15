package fi.tusinasaa.soitin;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Omat keikkani: tunnukset, joilla keikka on saatu auki, sekä keikan otsikko, lisätieto ja
 * biisien yhteiskesto sellaisina kuin soitin ne viimeksi näytti. Tunnus on muotoa
 * {@code k7f3qa2m} tai kaveriversiossa {@code k7f3qa2m@soitin.kaveri}.
 *
 * <p>Tiedot ovat vain tämän laitteen sovelluksen omissa asetuksissa (ei varmuuskopiota,
 * manifestissa allowBackup="false").
 */
final class GigStore {

    static final String SORT_DEFAULT = "added";

    private static final String PREFS = "keikat";
    private static final String KEY_GIGS = "gigs";
    private static final String KEY_LAST = "last";
    private static final String KEY_SORT = "sort";

    private final SharedPreferences prefs;

    GigStore(@NonNull Context context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @NonNull
    synchronized JSONArray gigs() {
        try {
            return new JSONArray(prefs.getString(KEY_GIGS, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    /**
     * Lisää keikan tai päivittää sen tiedot. Lisäyspäivä on ensimmäisen onnistuneen
     * avauksen hetki, eikä se muutu myöhemmillä avauksilla. Kesto alle 0 = ei tiedossa;
     * silloin aiemmin tallennettu kesto jää voimaan.
     */
    synchronized void put(@NonNull String id, @NonNull String title, @NonNull String sub,
                          double len) {
        JSONArray list = gigs();
        JSONObject gig = null;
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o != null && id.equals(o.optString("id"))) {
                gig = o;
                break;
            }
        }
        try {
            if (gig == null) {
                gig = new JSONObject();
                gig.put("id", id);
                gig.put("added", System.currentTimeMillis());
                gig.put("len", -1);
                list.put(gig);
            }
            gig.put("title", title);
            gig.put("sub", sub);
            if (len >= 0) {
                gig.put("len", Math.round(len));
            }
        } catch (JSONException e) {
            return;
        }
        prefs.edit().putString(KEY_GIGS, list.toString()).apply();
    }

    synchronized void remove(@NonNull String id) {
        JSONArray list = gigs();
        JSONArray kept = new JSONArray();
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o != null && !id.equals(o.optString("id"))) {
                kept.put(o);
            }
        }
        SharedPreferences.Editor edit = prefs.edit().putString(KEY_GIGS, kept.toString());
        if (id.equals(last())) {
            edit.remove(KEY_LAST);
        }
        edit.apply();
    }

    /** Viimeksi auki ollut keikka. Sovellus avaa sen käynnistyessään. */
    @Nullable
    synchronized String last() {
        return prefs.getString(KEY_LAST, null);
    }

    synchronized void setLast(@NonNull String id) {
        prefs.edit().putString(KEY_LAST, id).apply();
    }

    @NonNull
    synchronized String sort() {
        return prefs.getString(KEY_SORT, SORT_DEFAULT);
    }

    synchronized void setSort(@NonNull String sort) {
        prefs.edit().putString(KEY_SORT, sort).apply();
    }

    /** Pöydät puhtaiksi: kaikki keikat, viimeksi avattu ja järjestys. */
    synchronized void clear() {
        prefs.edit().clear().apply();
    }
}
