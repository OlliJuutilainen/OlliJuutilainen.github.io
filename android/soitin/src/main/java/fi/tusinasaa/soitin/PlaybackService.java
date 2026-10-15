package fi.tusinasaa.soitin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import androidx.annotation.DrawableRes;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/**
 * Pitää sovelluksen etualalla soiton ajan, ettei Android jäädytä tai sulje sitä, kun näyttö
 * sammuu tai käyttäjä siirtyy toiseen sovellukseen. Aktiviteetti sitoo palvelun koko
 * elinkaarensa ajaksi eikä koskaan käynnistä sitä erikseen, joten palvelu päättyy
 * aktiviteetin mukana. Etualalle se nousee vain soiton ajaksi.
 *
 * <p>Palvelulla on myös mediasessio, jotta kuulokkeiden ja muiden laitteiden mediapainikkeet
 * ohjaavat soitinta eivätkä jotain toista sovellusta. Sessio aktivoituu ensimmäisestä
 * soitosta ja pysyy aktiivisena tauon ajan, jotta toisto jatkuu kuulokkeista.
 *
 * <p>Soiton ilmoitus on mediailmoitus, joten lukitusnäytöllä ja ilmoituspaneelissa on soittimen
 * napit: edellinen kappale, 15 s taakse, toisto/tauko, 15 s eteen ja seuraava kappale. Android
 * 13+ piirtää napit mediasession tilasta (15 s -napit omina toimintoinaan kappalenappien
 * rinnalla), vanhemmat ilmoituksen napeista. Tauolla ilmoitus jää näkyviin, jotta soiton saa
 * jatkumaan lukitusnäytöltä.
 */
public class PlaybackService extends Service {

    private static final String TAG = "Soitin";
    private static final String CHANNEL_ID = "soitto";
    private static final int NOTIFICATION_ID = 1;
    // Varmistus sille, ettei herätyslukko jää päälle, jos sivu ei koskaan ilmoita tauosta.
    private static final long WAKE_LOCK_TIMEOUT_MS = 6 * 60 * 60 * 1000L;

    final class LocalBinder extends Binder {
        PlaybackService getService() {
            return PlaybackService.this;
        }
    }

    /** Mediapainikkeen komento sivulle: play, pause, next, previous, forward tai rewind. */
    interface Controls {
        void press(String action);
    }

    // Ilmoituksen napit lähettävät tämän palvelulle; lisätietona sivun komento.
    private static final String ACTION_BUTTON = "fi.tusinasaa.soitin.NAPPI";
    private static final String EXTRA_BUTTON = "nappi";

    private static final long ACTIONS = PlaybackStateCompat.ACTION_PLAY
            | PlaybackStateCompat.ACTION_PAUSE
            | PlaybackStateCompat.ACTION_PLAY_PAUSE
            | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
            | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            | PlaybackStateCompat.ACTION_FAST_FORWARD
            | PlaybackStateCompat.ACTION_REWIND;

    private final IBinder binder = new LocalBinder();
    private MediaSessionCompat session;
    @Nullable
    private Controls controls;
    private PowerManager.WakeLock wakeLock;
    private boolean foreground;
    // Ilmoitus on näkyvissä (etualalla tai tauon ajan irrotettuna).
    private boolean shown;
    private boolean playing;
    private String title = "";
    private String track = "";

    private final BroadcastReceiver buttonReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getStringExtra(EXTRA_BUTTON);
            if (action != null) {
                press(action);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "soitin:soitto");
        wakeLock.setReferenceCounted(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
            channel.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }

        // Yksi painallus = play/pause ja tuplapainallus = seuraava hoituvat
        // MediaSessionCompatin oletuskäsittelyssä; muut painikkeet tulevat suoraan.
        session = new MediaSessionCompat(this, TAG);
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                press("play");
            }

            @Override
            public void onPause() {
                press("pause");
            }

            @Override
            public void onSkipToNext() {
                press("next");
            }

            @Override
            public void onSkipToPrevious() {
                press("previous");
            }

            @Override
            public void onFastForward() {
                press("forward");
            }

            @Override
            public void onRewind() {
                press("rewind");
            }

            // Android 13+:n lukitusnäytön 15 s -napit.
            @Override
            public void onCustomAction(String action, Bundle extras) {
                if ("rewind".equals(action) || "forward".equals(action)) {
                    press(action);
                }
            }
        });
        setSessionState(false);

        ContextCompat.registerReceiver(this, buttonReceiver, new IntentFilter(ACTION_BUTTON),
                ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    void setControls(@Nullable Controls controls) {
        this.controls = controls;
    }

    private void press(String action) {
        if (controls != null) {
            controls.press(action);
        }
    }

    private void setSessionState(boolean playing) {
        session.setPlaybackState(new PlaybackStateCompat.Builder()
                .setActions(ACTIONS)
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("rewind",
                        getString(R.string.button_rewind), R.drawable.ic_taakse).build())
                .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("forward",
                        getString(R.string.button_forward), R.drawable.ic_eteen).build())
                .setState(playing ? PlaybackStateCompat.STATE_PLAYING
                                : PlaybackStateCompat.STATE_PAUSED,
                        PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, playing ? 1f : 0f)
                .build());
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    void update(boolean playing, String title, String track) {
        this.playing = playing;
        setSessionState(playing);
        if (!playing) {
            // Tyhjä nimi tulee, kun sivu vaihtuu; silloin ilmoitus pois kokonaan.
            stop(title.isEmpty() && track.isEmpty());
            return;
        }
        boolean changed = !title.equals(this.title) || !track.equals(this.track);
        this.title = title;
        this.track = track;
        if (changed || !session.isActive()) {
            session.setMetadata(new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, track)
                    .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, title)
                    .build());
        }
        session.setActive(true);
        if (!foreground) {
            try {
                Notification notification = buildNotification();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION_ID, notification,
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(NOTIFICATION_ID, notification);
                }
                foreground = true;
                shown = true;
            } catch (RuntimeException e) {
                // Android 12+ ei salli etualalle nousua taustalta. Tänne voi päätyä, jos
                // tauko jatkuu kuulokkeista sovelluksen ollessa taustalla; soitto jatkuu
                // silti niin kauan kuin järjestelmä antaa.
                Log.w(TAG, "startForeground epäonnistui", e);
                // Tauon ilmoitus näyttäisi muuten yhä toistonappia.
                if (shown) {
                    getSystemService(NotificationManager.class)
                            .notify(NOTIFICATION_ID, buildNotification());
                }
            }
        } else if (changed) {
            getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, buildNotification());
        }
        if (!wakeLock.isHeld()) {
            wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);
        }
    }

    /**
     * Laskee palvelun pois etualalta. Tauolla ilmoitus jää näkyviin toistonapin kanssa;
     * {@code remove} poistaa sen kokonaan.
     */
    private void stop(boolean remove) {
        if (foreground) {
            stopForeground(remove ? STOP_FOREGROUND_REMOVE : STOP_FOREGROUND_DETACH);
            foreground = false;
        }
        if (shown) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (remove) {
                nm.cancel(NOTIFICATION_ID);
                shown = false;
            } else {
                nm.notify(NOTIFICATION_ID, buildNotification());
            }
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class)
                .setAction(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_LAUNCHER);
        PendingIntent content = PendingIntent.getActivity(this, 0, open,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        // Järjestys kuten soittimessa. Pienessä näkymässä kappalenapit ja toisto.
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_soitin)
                .setContentTitle(title.isEmpty() ? getString(R.string.app_name) : title)
                .setContentText(track)
                .setContentIntent(content)
                .addAction(button(R.drawable.ic_edellinen, R.string.button_previous, "previous", 1))
                .addAction(button(R.drawable.ic_taakse, R.string.button_rewind, "rewind", 2))
                .addAction(playing
                        ? button(R.drawable.ic_tauko, R.string.button_pause, "pause", 3)
                        : button(R.drawable.ic_soitin, R.string.button_play, "play", 4))
                .addAction(button(R.drawable.ic_eteen, R.string.button_forward, "forward", 5))
                .addAction(button(R.drawable.ic_seuraava, R.string.button_next, "next", 6))
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(session.getSessionToken())
                        .setShowActionsInCompactView(0, 2, 4))
                .setOngoing(playing)
                .setSilent(true)
                .setShowWhen(false)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build();
    }

    private NotificationCompat.Action button(@DrawableRes int icon, @StringRes int label,
            String action, int requestCode) {
        Intent intent = new Intent(ACTION_BUTTON)
                .setPackage(getPackageName())
                .putExtra(EXTRA_BUTTON, action);
        PendingIntent pending = PendingIntent.getBroadcast(this, requestCode, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new NotificationCompat.Action(icon, getString(label), pending);
    }

    @Override
    public void onDestroy() {
        stop(true);
        unregisterReceiver(buttonReceiver);
        controls = null;
        session.setActive(false);
        session.release();
        super.onDestroy();
    }
}
