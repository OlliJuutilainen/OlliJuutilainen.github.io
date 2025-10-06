package fi.ouroboros.android

import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import fi.ouroboros.android.ui.theme.OuroborosAccent
import fi.ouroboros.android.ui.theme.OuroborosMute
import fi.ouroboros.android.ui.theme.OuroborosTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

private const val DURATION_MS = (22 * 60 + 22) * 1000L

private enum class TimerState {
    Idle,
    Running,
    Paused,
    Finishing
}

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUi()
        setContent {
            OuroborosTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    OuroborosTimer()
                }
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUi()
        }
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
}

@Composable
private fun OuroborosTimer() {
    var state by rememberSaveable { mutableStateOf(TimerState.Idle) }
    var elapsedMs by rememberSaveable { mutableStateOf(0L) }
    val haptics = LocalHapticFeedback.current
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_PAUSE && state == TimerState.Running) {
                state = TimerState.Paused
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(state == TimerState.Running) {
        if (state != TimerState.Running) return@LaunchedEffect
        var lastTick = SystemClock.uptimeMillis()
        while (isActive && state == TimerState.Running) {
            delay(16L)
            val now = SystemClock.uptimeMillis()
            val delta = now - lastTick
            lastTick = now
            elapsedMs = (elapsedMs + delta).coerceIn(0L, DURATION_MS)
            if (elapsedMs >= DURATION_MS) {
                state = TimerState.Finishing
            }
        }
    }

    LaunchedEffect(state) {
        if (state == TimerState.Finishing) {
            delay(2000L)
            elapsedMs = 0L
            state = TimerState.Idle
        }
    }

    val progress = (elapsedMs.toFloat() / DURATION_MS.toFloat()).coerceIn(0f, 1f)
    val remainingMs = (DURATION_MS - elapsedMs).coerceAtLeast(0L)
    val remainingSecondsTotal = ((remainingMs + 999L) / 1000L).toInt()
    val minutes = remainingSecondsTotal / 60
    val seconds = remainingSecondsTotal % 60

    val statusText = when (state) {
        TimerState.Idle -> stringResource(R.string.timer_idle)
        TimerState.Running -> stringResource(R.string.timer_running)
        TimerState.Paused -> stringResource(R.string.timer_paused)
        TimerState.Finishing -> stringResource(R.string.timer_finishing)
    }

    val hint = stringResource(R.string.timer_hint)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .detectTimerGestures(
                state = state,
                onTap = {
                    when (state) {
                        TimerState.Idle -> {
                            elapsedMs = 0L
                            state = TimerState.Running
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        TimerState.Running -> {
                            state = TimerState.Paused
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        TimerState.Paused -> {
                            state = TimerState.Running
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        TimerState.Finishing -> Unit
                    }
                },
                onDoubleTap = {
                    if (state != TimerState.Idle) {
                        elapsedMs = 0L
                        state = TimerState.Running
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    }
                },
                onLongPress = {
                    if (state != TimerState.Idle) {
                        state = TimerState.Idle
                        elapsedMs = 0L
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                    }
                }
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp, vertical = 32.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                TimerRing(progress = progress, diameter = 260.dp)
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "%02d:%02d".format(minutes, seconds),
                        style = MaterialTheme.typography.displayMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 72.sp
                        ),
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = TextAlign.Center
                    )
                    Crossfade(targetState = statusText, label = "status") { text ->
                        Text(
                            text = text,
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onBackground,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
            Text(
                text = hint,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }
    }
}

private fun Modifier.detectTimerGestures(
    state: TimerState,
    onTap: () -> Unit,
    onDoubleTap: () -> Unit,
    onLongPress: () -> Unit
): Modifier = pointerInput(state) {
    detectTapGestures(
        onDoubleTap = { onDoubleTap() },
        onLongPress = { onLongPress() },
        onTap = { onTap() }
    )
}

@Composable
private fun TimerRing(progress: Float, diameter: Dp) {
    Canvas(
        modifier = Modifier
            .size(diameter)
            .clip(CircleShape)
    ) {
        val sweep = 360f * progress
        val strokeWidth = size.minDimension * 0.1f
        drawCircle(
            color = OuroborosMute,
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )
        drawArc(
            color = OuroborosAccent,
            startAngle = -90f,
            sweepAngle = sweep,
            useCenter = false,
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )
    }
}
