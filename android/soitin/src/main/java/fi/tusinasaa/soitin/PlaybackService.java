package fi.tusinasaa.soitin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Pitää sovelluksen etualalla soiton ajan, ettei Android jäädytä tai sulje sitä, kun näyttö
 * sammuu tai käyttäjä siirtyy toiseen sovellukseen. Aktiviteetti sitoo palvelun koko
 * elinkaarensa ajaksi eikä koskaan käynnistä sitä erikseen, joten palvelu päättyy
 * aktiviteetin mukana. Etualalle se nousee vain soiton ajaksi.
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

    private final IBinder binder = new LocalBinder();
    private PowerManager.WakeLock wakeLock;
    private boolean foreground;
    private String title = "";
    private String track = "";

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
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    void update(boolean playing, String title, String track) {
        if (!playing) {
            stop();
            return;
        }
        boolean changed = !title.equals(this.title) || !track.equals(this.track);
        this.title = title;
        this.track = track;
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
            } catch (RuntimeException e) {
                // Android 12+ ei salli etualalle nousua taustalta. Soitto alkaa aina
                // napautuksesta, joten tänne ei pitäisi päätyä; soitto jatkuu silti
                // niin kauan kuin järjestelmä antaa.
                Log.w(TAG, "startForeground epäonnistui", e);
            }
        } else if (changed) {
            getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, buildNotification());
        }
        if (!wakeLock.isHeld()) {
            wakeLock.acquire(WAKE_LOCK_TIMEOUT_MS);
        }
    }

    private void stop() {
        if (foreground) {
            stopForeground(STOP_FOREGROUND_REMOVE);
            foreground = false;
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
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_soitin)
                .setContentTitle(title.isEmpty() ? getString(R.string.app_name) : title)
                .setContentText(track)
                .setContentIntent(content)
                .setOngoing(true)
                .setSilent(true)
                .setShowWhen(false)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build();
    }

    @Override
    public void onDestroy() {
        stop();
        super.onDestroy();
    }
}
