package fi.ouroboros.android

import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color as AndroidColor
import android.graphics.drawable.ColorDrawable
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.KeyEvent
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.times
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import fi.ouroboros.android.R
import fi.ouroboros.android.ui.theme.OuroborosTheme
import kotlinx.coroutines.isActive
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private const val TAG = "ΒΟΡΟΦΘΟΡΟΣ"
private const val DURATION_MS = (22 * 60 + 22) * 1000L
private const val LONG_PRESS_MS = 1000L
private const val CLOCK_VOLUME = 0.25118864f // -12 dB

private enum class TimerState { Idle, IdleAudioLock, Running, Paused, Finishing }

// Light Phone 3:n nappi, jolle Androidissa ei ole nimettyä vakiota (318 = KEYCODE_SCREENSHOT).
private const val KEYCODE_LP3_319 = 319

// Key Mapperin oletusarvot: pitkä painallus 500 ms, sarjan aikaraja 1000 ms.
private const val KEY_LONG_PRESS_MS = 500L
private const val KEY_SEQUENCE_MS = 1000L

private const val PKG_TIDAL = "com.aspiro.tidal"
private const val PKG_NATIVE_ALPHA = "com.cylonid.nativealpha"
private const val PKG_SOITIN = "fi.tusinasaa.soitin"
private const val PKG_BINARYEYE = "de.markusfisch.android.binaryeye"
private const val PKG_TUSINASAA = "fi.tusinasaa"

class MainActivity : ComponentActivity() {

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var audioManager: AudioManager

    // Taskulamppu: tila luetaan TorchCallbackista, ei oleteta. null = tila ei ole vielä tiedossa.
    private var cameraManager: CameraManager? = null
    private var torchCameraId: String? = null
    private var torchOn: Boolean? = null
    private val torchCallback = object : CameraManager.TorchCallback() {
        override fun onTorchModeChanged(cameraId: String, enabled: Boolean) {
            if (cameraId == torchCameraId) torchOn = enabled
        }
    }

    // Napit, joiden down on kulutettu: myös niiden up ja toistot kulutetaan.
    private val consumedKeys = mutableSetOf<Int>()

    // Äänenvoimakkuusnapit: pitkä painallus ja kahden napin sarja.
    private var volumeHeldKey = 0
    private var volumeLongFired = false
    private var lastShortVolumeKey = 0
    private var lastShortVolumeAt = 0L
    private var volumeBeforeLastShort = -1
    private val volumeLongPress = Runnable {
        volumeLongFired = true
        when (volumeHeldKey) {
            KeyEvent.KEYCODE_VOLUME_UP -> openTusinasaa()
            KeyEvent.KEYCODE_VOLUME_DOWN -> openPackage(PKG_TIDAL)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        Log.i(TAG, "onCreate start")
        super.onCreate(savedInstanceState)
        window.setBackgroundDrawable(ColorDrawable(AndroidColor.BLACK))
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        volumeControlStream = AudioManager.STREAM_MUSIC
        setUpTorch()

        setContent {
            OuroborosTheme {
                OuroborosScreen()
            }
        }

        enableImmersive()
        Log.i(TAG, "onCreate finish")
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            enableImmersive()
        }
    }

    override fun onDestroy() {
        handler.removeCallbacks(volumeLongPress)
        cameraManager?.unregisterTorchCallback(torchCallback)
        super.onDestroy()
    }

    // ---- Laitteen napit ----
    //
    // Napit käsitellään tässä eikä Key Mapperissa. Käsittelemättömät menevät superille.
    // Pitkän painalluksen ja sarjan erotteluun odotetaan vain äänenvoimakkuusnapeilla, joilla
    // lyhyt painallus säätää äänenvoimakkuutta. Muut napit toimivat heti down-tapahtumasta.

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val code = event.keyCode
        Log.d(TAG, "nappi $code ${if (event.action == KeyEvent.ACTION_DOWN) "down" else "up"} toisto=${event.repeatCount}")

        if (event.action != KeyEvent.ACTION_DOWN) {
            if (event.action == KeyEvent.ACTION_UP && consumedKeys.remove(code)) {
                if (code == volumeHeldKey) onVolumeKeyUp(code)
                return true
            }
            return super.dispatchKeyEvent(event)
        }
        if (event.repeatCount > 0) {
            return if (code in consumedKeys) true else super.dispatchKeyEvent(event)
        }

        when (code) {
            KEYCODE_LP3_319 -> toggleTorch()
            KeyEvent.KEYCODE_FOCUS -> openPackage(PKG_BINARYEYE)
            KeyEvent.KEYCODE_VOLUME_UP, KeyEvent.KEYCODE_VOLUME_DOWN -> onVolumeKeyDown(code)
            else -> return super.dispatchKeyEvent(event)
        }
        consumedKeys.add(code)
        return true
    }

    private fun onVolumeKeyDown(code: Int) {
        val other = if (code == KeyEvent.KEYCODE_VOLUME_UP) KeyEvent.KEYCODE_VOLUME_DOWN else KeyEvent.KEYCODE_VOLUME_UP
        val now = SystemClock.uptimeMillis()
        if (lastShortVolumeKey == other && now - lastShortVolumeAt <= KEY_SEQUENCE_MS) {
            // Sarja: ensimmäinen painallus ehti jo säätää äänenvoimakkuutta, joten palautetaan se.
            lastShortVolumeKey = 0
            restoreVolume(volumeBeforeLastShort)
            volumeHeldKey = 0
            if (code == KeyEvent.KEYCODE_VOLUME_DOWN) openPackage(PKG_NATIVE_ALPHA) else openPackage(PKG_SOITIN)
            return
        }
        handler.removeCallbacks(volumeLongPress)
        volumeHeldKey = code
        volumeLongFired = false
        handler.postDelayed(volumeLongPress, KEY_LONG_PRESS_MS)
    }

    private fun onVolumeKeyUp(code: Int) {
        handler.removeCallbacks(volumeLongPress)
        volumeHeldKey = 0
        if (volumeLongFired) return
        volumeBeforeLastShort = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        val direction = if (code == KeyEvent.KEYCODE_VOLUME_UP) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER
        audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, AudioManager.FLAG_SHOW_UI)
        lastShortVolumeKey = code
        lastShortVolumeAt = SystemClock.uptimeMillis()
    }

    private fun restoreVolume(volume: Int) {
        if (volume < 0) return
        try {
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, volume, 0)
        } catch (error: SecurityException) {
            Log.w(TAG, "äänenvoimakkuuden palautus ei onnistunut", error)
        }
    }

    private fun setUpTorch() {
        val manager = getSystemService(CAMERA_SERVICE) as? CameraManager ?: return
        cameraManager = manager
        try {
            val withFlash = manager.cameraIdList.filter {
                manager.getCameraCharacteristics(it).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
            torchCameraId = withFlash.firstOrNull {
                manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING) ==
                    CameraCharacteristics.LENS_FACING_BACK
            } ?: withFlash.firstOrNull()
        } catch (error: CameraAccessException) {
            Log.w(TAG, "kameroita ei saatu luettua", error)
        }
        if (torchCameraId != null) manager.registerTorchCallback(torchCallback, handler)
    }

    private fun toggleTorch() {
        val manager = cameraManager ?: return
        val id = torchCameraId ?: return
        try {
            manager.setTorchMode(id, torchOn != true)
        } catch (error: CameraAccessException) {
            Log.w(TAG, "taskulamppu ei vaihtanut tilaa", error)
        } catch (error: IllegalArgumentException) {
            Log.w(TAG, "taskulamppu ei vaihtanut tilaa", error)
        }
    }

    private fun openTusinasaa() {
        val uri = Uri.parse(
            "tusinasaa://open/v1#t=${BuildConfig.TUSINASAA_TOKEN}&k=${BuildConfig.TUSINASAA_KEY}"
        )
        launch(Intent(Intent.ACTION_VIEW, uri).setPackage(PKG_TUSINASAA))
    }

    private fun openPackage(packageName: String) {
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        if (intent == null) {
            Log.w(TAG, "ei käynnistettävää sovellusta: $packageName")
            return
        }
        launch(intent)
    }

    private fun launch(intent: Intent) {
        try {
            startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (error: ActivityNotFoundException) {
            Log.w(TAG, "käynnistys ei onnistunut: $intent", error)
            return
        }
        // Käyttäjän päätös 9.11.2026: ΒΟΡΟΦΘΟΡΟΣ sulkeutuu, kun se on avannut toisen sovelluksen.
        finish()
    }

    private fun enableImmersive() {
        val win = window ?: return
        WindowCompat.setDecorFitsSystemWindows(win, false)
        val decor = win.decorView ?: return
        decor.post {
            val controller = WindowInsetsControllerCompat(win, decor)
            controller.systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            controller.hide(
                WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars()
            )
            Log.i(TAG, "Immersive mode enabled")
        }
    }
}

@Composable
private fun OuroborosScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        OuroborosTimer()
    }
}

@Composable
private fun OuroborosTimer() {
    val context = LocalContext.current
    val mediaPlayer = remember {
        try {
            MediaPlayer.create(context, R.raw.kello)?.apply {
                setVolume(CLOCK_VOLUME, CLOCK_VOLUME)
            }
        } catch (error: Throwable) {
            Log.w(TAG, "MediaPlayer create failed", error)
            null
        }
    }

    val haptics = LocalHapticFeedback.current

    var state by remember { mutableStateOf(TimerState.Idle) }
    var elapsed by remember { mutableStateOf(0L) }
    var elapsedBeforePause by remember { mutableStateOf(0L) }
    var audioAvailable by remember { mutableStateOf(mediaPlayer != null) }
    var runIteration by remember { mutableStateOf(0) }

    fun stopAudio() {
        mediaPlayer?.let { player ->
            if (player.isPlaying) {
                try {
                    player.pause()
                } catch (_: IllegalStateException) {
                    audioAvailable = false
                }
            }
            try {
                player.seekTo(0)
            } catch (_: IllegalStateException) {
                audioAvailable = false
            }
        }
    }

    fun resetToIdle(lockUntilAudioEnds: Boolean = false) {
        val shouldLock = lockUntilAudioEnds && (mediaPlayer?.isPlaying == true)
        if (shouldLock) {
            state = TimerState.IdleAudioLock
        } else {
            stopAudio()
            state = TimerState.Idle
        }
        elapsed = 0L
        elapsedBeforePause = 0L
    }

    val onFinishAudio by rememberUpdatedState(newValue = {
        when (state) {
            TimerState.Finishing -> resetToIdle()
            TimerState.IdleAudioLock -> resetToIdle()
            else -> Unit
        }
    })

    DisposableEffect(mediaPlayer) {
        val player = mediaPlayer
        if (player != null) {
            player.setOnCompletionListener { onFinishAudio() }
            player.setOnErrorListener { _, _, _ ->
                audioAvailable = false
                onFinishAudio()
                true
            }
        }
        onDispose {
            player?.setOnCompletionListener(null)
            player?.setOnErrorListener(null)
            player?.release()
        }
    }

    fun startRun(playStartSound: Boolean) {
        if (state == TimerState.IdleAudioLock) {
            return
        }
        stopAudio()
        elapsed = 0L
        elapsedBeforePause = 0L
        state = TimerState.Running
        runIteration++
        if (playStartSound && audioAvailable) {
            mediaPlayer?.let { player ->
                try {
                    player.start()
                } catch (error: IllegalStateException) {
                    Log.w(TAG, "Failed to start start-sound", error)
                    audioAvailable = false
                }
            }
        }
    }

    fun pauseRun() {
        if (state != TimerState.Running) return
        elapsedBeforePause = elapsed
        state = TimerState.Paused
    }

    fun resumeRun() {
        if (state != TimerState.Paused) return
        state = TimerState.Running
    }

    fun handleFinishReached() {
        elapsed = DURATION_MS
        elapsedBeforePause = DURATION_MS
        state = TimerState.Finishing
        if (audioAvailable) {
            mediaPlayer?.let { player ->
                try {
                    player.seekTo(0)
                    player.start()
                } catch (error: IllegalStateException) {
                    Log.w(TAG, "Failed to play finish sound", error)
                    audioAvailable = false
                    resetToIdle()
                }
            } ?: resetToIdle()
        } else {
            resetToIdle()
        }
    }

    LaunchedEffect(state, elapsedBeforePause, runIteration) {
        if (state == TimerState.Running) {
            val base = elapsedBeforePause
            val start = SystemClock.elapsedRealtime()
            while (isActive && state == TimerState.Running) {
                val now = SystemClock.elapsedRealtime()
                val total = base + (now - start)
                if (total >= DURATION_MS) {
                    handleFinishReached()
                    break
                } else {
                    elapsed = total
                }
                withFrameMillis { _ -> }
            }
        }
    }

    val progressFraction = (elapsed.toFloat() / DURATION_MS).coerceIn(0f, 1f)

    val ringAlpha by animateFloatAsState(
        targetValue = when (state) {
            TimerState.Finishing -> 0f
            else -> 1f
        },
        label = "ringAlpha"
    )

    val ringColor = when (state) {
        TimerState.Paused -> Color(0xFF3A3A3A)
        else -> Color(0xFFF5F5F5)
    }

    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        val ringDiameter = (75f / 1080f) * maxWidth
        val ringStroke = ringDiameter * (4.7f / 75f)
        val bottomMargin = (45f / 1240f) * maxHeight

        // Kosketus vain napin (rinkulan) alueelta: neliö, jonka sivu on kaksi rinkulan
        // halkaisijaa, keskitettynä rinkulaan. Muualla ruudulla kosketus ei tee mitään.
        val touchSize = 2 * ringDiameter
        val touchBottom = (bottomMargin - (touchSize - ringDiameter) / 2).coerceAtLeast(0.dp)

        CircularProgressIndicator(
            progress = 1f - progressFraction,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = bottomMargin)
                .size(ringDiameter)
                .alpha(ringAlpha),
            color = ringColor,
            trackColor = Color.Transparent,
            strokeWidth = ringStroke
        )

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = touchBottom)
                .size(touchSize)
                .pointerInput(state) {
                coroutineScope {
                    awaitEachGesture {
                        awaitFirstDown(requireUnconsumed = false)
                        var longPressTriggered = false
                        val longPressJob = launch {
                            delay(LONG_PRESS_MS)
                            longPressTriggered = true
                            // Pitkä painallus pysäyttää kellon kaikissa tiloissa, paitsi jos se on jo
                            // pysähdyksissä (käyttäjän päätös 9.11.2026). Alusta aloitusta ei ole.
                            // Soiva kello saa soida loppuun; sillä aikaa napautus ei käynnistä uutta.
                            val longPressAction: (() -> Unit)? = when (state) {
                                TimerState.Running, TimerState.Paused, TimerState.Finishing -> {
                                    { resetToIdle(lockUntilAudioEnds = true) }
                                }

                                TimerState.Idle, TimerState.IdleAudioLock -> null
                            }

                            if (longPressAction != null) {
                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                longPressAction()
                            }
                        }

                        val up = waitForUpOrCancellation()
                        longPressJob.cancel()

                        if (up == null || longPressTriggered) {
                            return@awaitEachGesture
                        }

                        when (state) {
                            TimerState.Idle -> startRun(playStartSound = true)
                            TimerState.IdleAudioLock -> {
                                // ignore taps until audio lock clears
                            }
                            TimerState.Running -> pauseRun()
                            TimerState.Paused -> resumeRun()
                            TimerState.Finishing -> {
                                // ignore taps while finishing
                            }
                        }
                    }
                }
            }
        )
    }
}
