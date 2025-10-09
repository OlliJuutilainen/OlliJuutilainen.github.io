package fi.ouroboros.android

import android.graphics.Color as AndroidColor
import android.graphics.drawable.ColorDrawable
import android.media.MediaPlayer
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
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

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        Log.i(TAG, "onCreate start")
        super.onCreate(savedInstanceState)
        window.setBackgroundDrawable(ColorDrawable(AndroidColor.BLACK))
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

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
            .pointerInput(state) {
                coroutineScope {
                    awaitEachGesture {
                        awaitFirstDown(requireUnconsumed = false)
                        var longPressTriggered = false
                        val longPressJob = launch {
                            delay(LONG_PRESS_MS)
                            longPressTriggered = true
                            val longPressAction: (() -> Unit)? = when (state) {
                                TimerState.Idle, TimerState.Running -> {
                                    { startRun(playStartSound = false) }
                                }
                                TimerState.Paused -> {
                                    val lockAudio = mediaPlayer?.isPlaying == true
                                    { resetToIdle(lockUntilAudioEnds = lockAudio) }
                                }

                                TimerState.IdleAudioLock, TimerState.Finishing -> null
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
            .background(Color.Black)
    ) {
        val ringDiameter = (75f / 1080f) * maxWidth
        val ringStroke = ringDiameter * (4.7f / 75f)
        val bottomMargin = (45f / 1240f) * maxHeight

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
    }
}
