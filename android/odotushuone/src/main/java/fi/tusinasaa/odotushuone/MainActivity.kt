package fi.tusinasaa.odotushuone

import android.annotation.SuppressLint
import android.app.Activity
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.os.Choreographer
import android.os.SystemClock
import android.view.GestureDetector
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager

class MainActivity : Activity(), Choreographer.FrameCallback {

    private lateinit var timerView: TimerRingView
    private lateinit var interactionLayer: View
    private lateinit var gestureDetector: GestureDetector

    private val choreographer: Choreographer by lazy { Choreographer.getInstance() }

    private var state: TimerState = TimerState.IDLE
    private var startUptimeMs: Long = 0L
    private var elapsedBeforePauseMs: Long = 0L
    private var currentProgress: Float = 0f

    private var mediaPlayer: MediaPlayer? = null
    private var audioAvailable: Boolean = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUi()

        timerView = findViewById(R.id.timer_view)
        interactionLayer = findViewById(R.id.interaction_layer)

        gestureDetector = createGestureDetector()
        interactionLayer.setOnTouchListener { _, event ->
            handleTouchEvent(event)
        }
        interactionLayer.setOnClickListener {
            handleShortTap()
        }
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

    override fun onStop() {
        super.onStop()
        if (state == TimerState.RUNNING) {
            pauseRun()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cancelFrame()
        releasePlayer()
    }

    override fun doFrame(frameTimeNanos: Long) {
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
            choreographer.postFrameCallback(this)
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun handleTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> interactionLayer.isPressed = true
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> interactionLayer.isPressed = false
        }
        gestureDetector.onTouchEvent(event)
        return true
    }

    private fun createGestureDetector(): GestureDetector {
        return GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent): Boolean {
                return true
            }

            override fun onSingleTapConfirmed(e: MotionEvent?): Boolean {
                interactionLayer.performClick()
                return true
            }

            override fun onDoubleTap(e: MotionEvent?): Boolean {
                handleDoubleTap()
                return true
            }

            override fun onLongPress(e: MotionEvent) {
                interactionLayer.isPressed = false
                handleLongPress()
            }
        })
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
            interactionLayer.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
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
        choreographer.postFrameCallback(this)
        interactionLayer.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
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
        choreographer.postFrameCallback(this)
        interactionLayer.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
    }

    private fun pauseRun() {
        if (state != TimerState.RUNNING) {
            return
        }
        val now = SystemClock.uptimeMillis()
        elapsedBeforePauseMs = (elapsedBeforePauseMs + (now - startUptimeMs)).coerceIn(0L, DURATION_MS)
        state = TimerState.PAUSED
        timerView.setPaused(true)
        cancelFrame()
        interactionLayer.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
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

    private fun cancelFrame() {
        choreographer.removeFrameCallback(this)
    }

    private fun playGong(resetAfterPlayback: Boolean) {
        if (!audioAvailable) {
            if (resetAfterPlayback) {
                resetToIdle()
            }
            return
        }
        releasePlayer()
        val attributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        val player = MediaPlayer()
        player.setAudioAttributes(attributes)
        val asset = resources.openRawResourceFd(R.raw.kello)
        if (asset == null) {
            audioAvailable = false
            if (resetAfterPlayback) {
                resetToIdle()
            }
            return
        }
        val dataSourceConfigured = try {
            player.setDataSource(asset.fileDescriptor, asset.startOffset, asset.length)
            true
        } catch (error: Exception) {
            false
        } finally {
            asset.close()
        }
        if (!dataSourceConfigured) {
            audioAvailable = false
            releasePlayer()
            if (resetAfterPlayback && state == TimerState.FINISHING) {
                resetToIdle()
            }
            return
        }
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
            mediaPlayer = player
            player.prepare()
            player.start()
        } catch (error: Exception) {
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

        private const val KEY_STATE = "timer_state"
        private const val KEY_ELAPSED = "timer_elapsed"
        private const val KEY_PROGRESS = "timer_progress"
        private const val KEY_AUDIO_AVAILABLE = "timer_audio_available"
    }
}
