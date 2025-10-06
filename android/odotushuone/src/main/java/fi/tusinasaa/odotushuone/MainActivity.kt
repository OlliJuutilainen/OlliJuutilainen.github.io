package fi.tusinasaa.odotushuone

import android.app.Activity
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.os.Choreographer
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager

class MainActivity : Activity() {

    private lateinit var timerView: TimerRingView
    private lateinit var interactionLayer: View

    private val handler = Handler(Looper.getMainLooper())
    private val frameCallback = Choreographer.FrameCallback { updateFrame() }

    private var state: TimerState = TimerState.IDLE
    private var startUptimeMs: Long = 0L
    private var elapsedBeforePauseMs: Long = 0L
    private var currentProgress: Float = 0f

    private var mediaPlayer: MediaPlayer? = null
    private var audioAvailable: Boolean = true

    private var pointerId: Int? = null
    private var longPressTriggered = false
    private var longPressRunnable: Runnable? = null
    private var singleTapRunnable: Runnable? = null
    private var lastTapUpTimeMs: Long = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUi()

        timerView = findViewById(R.id.timer_view)
        interactionLayer = findViewById(R.id.interaction_layer)
        interactionLayer.setOnTouchListener { _, event -> handleTouch(event) }
        interactionLayer.setOnClickListener { handleShortTap() }
        interactionLayer.setOnLongClickListener {
            handleLongPress()
            true
        }

        if (savedInstanceState != null) {
            restoreState(savedInstanceState)
        } else {
            applyIdleState()
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUi()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        val effectiveElapsed = when (state) {
            TimerState.RUNNING -> {
                val now = SystemClock.uptimeMillis()
                elapsedBeforePauseMs + (now - startUptimeMs)
            }
            TimerState.FINISHING -> DURATION_MS
            else -> elapsedBeforePauseMs
        }.coerceIn(0L, DURATION_MS)
        outState.putString(KEY_STATE, state.name)
        outState.putLong(KEY_ELAPSED, effectiveElapsed)
        outState.putFloat(KEY_PROGRESS, currentProgress)
        outState.putBoolean(KEY_AUDIO_AVAILABLE, audioAvailable)
    }

    override fun onPause() {
        if (state == TimerState.RUNNING) {
            pauseRun()
        }
        super.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        cancelFrame()
        releasePlayer()
    }

    private fun handleTouch(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                if (pointerId != null) {
                    return false
                }
                pointerId = event.getPointerId(event.actionIndex)
                longPressTriggered = false
                scheduleLongPress()
                interactionLayer.isPressed = true
                return true
            }
            MotionEvent.ACTION_POINTER_DOWN -> {
                return false
            }
            MotionEvent.ACTION_UP -> {
                if (event.getPointerId(event.actionIndex) != pointerId) {
                    return false
                }
                interactionLayer.isPressed = false
                val wasLongPress = longPressTriggered
                clearLongPress()
                longPressTriggered = false
                pointerId = null
                if (wasLongPress) {
                    return true
                }
                val now = SystemClock.uptimeMillis()
                if (singleTapRunnable != null && now - lastTapUpTimeMs <= DOUBLE_TAP_MS) {
                    handler.removeCallbacks(singleTapRunnable!!)
                    singleTapRunnable = null
                    lastTapUpTimeMs = 0L
                    handleDoubleTap()
                } else {
                    lastTapUpTimeMs = now
                    singleTapRunnable = Runnable {
                        interactionLayer.performClick()
                        singleTapRunnable = null
                    }
                    handler.postDelayed(singleTapRunnable!!, DOUBLE_TAP_MS)
                }
                return true
            }
            MotionEvent.ACTION_CANCEL -> {
                interactionLayer.isPressed = false
                clearTouchState()
                return true
            }
            MotionEvent.ACTION_MOVE -> {
                return pointerId != null
            }
        }
        return false
    }

    private fun scheduleLongPress() {
        clearLongPress()
        longPressRunnable = Runnable {
            longPressTriggered = true
            interactionLayer.performLongClick()
        }
        handler.postDelayed(longPressRunnable!!, LONG_PRESS_MS)
    }

    private fun clearTouchState() {
        pointerId = null
        longPressTriggered = false
        clearLongPress()
        singleTapRunnable?.let { handler.removeCallbacks(it) }
        singleTapRunnable = null
        lastTapUpTimeMs = 0L
    }

    private fun clearLongPress() {
        longPressRunnable?.let { handler.removeCallbacks(it) }
        longPressRunnable = null
    }

    private fun handleShortTap() {
        when (state) {
            TimerState.IDLE -> startRun(playSound = true)
            TimerState.RUNNING -> pauseRun()
            TimerState.PAUSED -> resumeRun()
            TimerState.FINISHING -> Unit
        }
    }

    private fun handleDoubleTap() {
        if (state != TimerState.IDLE) {
            startRun(playSound = false)
        }
    }

    private fun handleLongPress() {
        if (state != TimerState.IDLE) {
            resetToIdle()
        }
    }

    private fun startRun(playSound: Boolean) {
        cancelFrame()
        elapsedBeforePauseMs = 0L
        currentProgress = 0f
        timerView.setHidden(false)
        timerView.setPaused(false)
        timerView.setProgress(0f)
        state = TimerState.RUNNING
        startUptimeMs = SystemClock.uptimeMillis()
        Choreographer.getInstance().postFrameCallback(frameCallback)
        if (playSound) {
            playGong(resetAfterPlayback = false)
        }
    }

    private fun resumeRun() {
        if (state != TimerState.PAUSED) {
            return
        }
        state = TimerState.RUNNING
        timerView.setPaused(false)
        startUptimeMs = SystemClock.uptimeMillis()
        Choreographer.getInstance().postFrameCallback(frameCallback)
    }

    private fun pauseRun() {
        if (state != TimerState.RUNNING) {
            return
        }
        val now = SystemClock.uptimeMillis()
        elapsedBeforePauseMs += now - startUptimeMs
        elapsedBeforePauseMs = elapsedBeforePauseMs.coerceIn(0L, DURATION_MS)
        state = TimerState.PAUSED
        timerView.setPaused(true)
        cancelFrame()
    }

    private fun finishRun() {
        cancelFrame()
        elapsedBeforePauseMs = DURATION_MS
        currentProgress = 1f
        state = TimerState.FINISHING
        timerView.setHidden(true)
        if (audioAvailable) {
            playGong(resetAfterPlayback = true)
        } else {
            resetToIdle()
        }
    }

    private fun resetToIdle() {
        cancelFrame()
        state = TimerState.IDLE
        elapsedBeforePauseMs = 0L
        currentProgress = 0f
        timerView.setHidden(false)
        timerView.setPaused(false)
        timerView.setProgress(0f)
    }

    private fun updateFrame() {
        if (state != TimerState.RUNNING) {
            return
        }
        val now = SystemClock.uptimeMillis()
        val elapsed = elapsedBeforePauseMs + (now - startUptimeMs)
        val progress = (elapsed.toFloat() / DURATION_MS.toFloat()).coerceIn(0f, 1f)
        currentProgress = progress
        timerView.setProgress(progress)
        if (progress >= 1f) {
            finishRun()
        } else {
            Choreographer.getInstance().postFrameCallback(frameCallback)
        }
    }

    private fun cancelFrame() {
        Choreographer.getInstance().removeFrameCallback(frameCallback)
    }

    private fun playGong(resetAfterPlayback: Boolean) {
        if (!audioAvailable) {
            if (resetAfterPlayback) {
                resetToIdle()
            }
            return
        }
        releasePlayer()
        val player = MediaPlayer.create(this, R.raw.kello)
        if (player == null) {
            audioAvailable = false
            if (resetAfterPlayback) {
                resetToIdle()
            }
            return
        }
        mediaPlayer = player
        player.setOnCompletionListener {
            if (resetAfterPlayback && state == TimerState.FINISHING) {
                resetToIdle()
            }
            releasePlayer()
        }
        player.setOnErrorListener { _, _, _ ->
            audioAvailable = false
            releasePlayer()
            if (resetAfterPlayback && state == TimerState.FINISHING) {
                resetToIdle()
            }
            true
        }
        try {
            player.start()
        } catch (error: IllegalStateException) {
            audioAvailable = false
            releasePlayer()
            if (resetAfterPlayback && state == TimerState.FINISHING) {
                resetToIdle()
            }
        }
    }

    private fun releasePlayer() {
        mediaPlayer?.release()
        mediaPlayer = null
    }

    private fun restoreState(bundle: Bundle) {
        audioAvailable = bundle.getBoolean(KEY_AUDIO_AVAILABLE, true)
        val savedElapsed = bundle.getLong(KEY_ELAPSED, 0L).coerceIn(0L, DURATION_MS)
        elapsedBeforePauseMs = savedElapsed
        currentProgress = (savedElapsed.toFloat() / DURATION_MS.toFloat()).coerceIn(0f, 1f)
        val savedStateName = bundle.getString(KEY_STATE)
        val savedState = savedStateName?.let { runCatching { TimerState.valueOf(it) }.getOrNull() }
            ?: TimerState.IDLE
        state = when (savedState) {
            TimerState.RUNNING -> TimerState.PAUSED
            TimerState.FINISHING -> TimerState.IDLE
            else -> savedState
        }
        when (state) {
            TimerState.IDLE -> applyIdleState()
            TimerState.PAUSED -> {
                timerView.setHidden(false)
                timerView.setPaused(true)
                timerView.setProgress(currentProgress)
            }
            TimerState.RUNNING -> {
                timerView.setHidden(false)
                timerView.setPaused(false)
                timerView.setProgress(currentProgress)
            }
            TimerState.FINISHING -> applyIdleState()
        }
    }

    private fun applyIdleState() {
        state = TimerState.IDLE
        elapsedBeforePauseMs = 0L
        currentProgress = 0f
        timerView.setHidden(false)
        timerView.setPaused(false)
        timerView.setProgress(0f)
    }

    private fun hideSystemUi() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            val controller = window.insetsController ?: return
            controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
            controller.systemBarsBehavior =
                WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                    View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                )
        }
    }

    private enum class TimerState {
        IDLE,
        RUNNING,
        PAUSED,
        FINISHING
    }

    companion object {
        private const val DURATION_MS = (22 * 60 + 22) * 1000L
        private const val LONG_PRESS_MS = 1000L
        private const val DOUBLE_TAP_MS = 300L

        private const val KEY_STATE = "timer_state"
        private const val KEY_ELAPSED = "timer_elapsed"
        private const val KEY_PROGRESS = "timer_progress"
        private const val KEY_AUDIO_AVAILABLE = "timer_audio_available"
    }
}
