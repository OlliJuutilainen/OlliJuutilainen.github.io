package fi.tusinasaa.odotushuone

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import kotlin.math.min

class TimerRingView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val arcBounds = RectF()

    private var strokeWidthPx: Float = 0f
    private var progress: Float = 0f
    private var paused: Boolean = false
    private var hidden: Boolean = false

    init {
        ringPaint.color = COLOR_ACTIVE
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        if (w == 0 || h == 0) {
            return
        }
        val scale = min(w / BASE_WIDTH, h / BASE_HEIGHT)
        strokeWidthPx = (BASE_STROKE * scale).coerceAtLeast(MIN_STROKE_PX)
        val radius = BASE_RING_RADIUS * scale
        val centerX = (w - BASE_WIDTH * scale) / 2f + BASE_RING_CENTER_X * scale
        val centerY = (h - BASE_HEIGHT * scale) / 2f + BASE_RING_CENTER_Y * scale
        arcBounds.set(
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
        )
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (hidden) {
            return
        }
        ringPaint.color = if (paused) COLOR_PAUSED else COLOR_ACTIVE
        ringPaint.strokeWidth = strokeWidthPx
        val sweep = (1f - progress).coerceIn(0f, 1f) * 360f
        if (sweep > 0f) {
            canvas.drawArc(arcBounds, -90f, sweep, false, ringPaint)
        }
    }

    fun setProgress(value: Float) {
        val clamped = value.coerceIn(0f, 1f)
        if (progress != clamped) {
            progress = clamped
            invalidate()
        }
    }

    fun getProgress(): Float = progress

    fun setPaused(value: Boolean) {
        if (paused != value) {
            paused = value
            invalidate()
        }
    }

    fun isPaused(): Boolean = paused

    fun setHidden(value: Boolean) {
        if (hidden != value) {
            hidden = value
            invalidate()
        }
    }

    fun isHidden(): Boolean = hidden

    companion object {
        private const val COLOR_ACTIVE = Color.WHITE
        private const val COLOR_PAUSED = 0xFF3A3A3A.toInt()

        private const val BASE_WIDTH = 1080f
        private const val BASE_HEIGHT = 1240f
        private const val BASE_RING_CENTER_X = 540f
        private const val BASE_RING_CENTER_Y = 1157.5f
        private const val BASE_RING_RADIUS = 37.5f
        private const val BASE_STROKE = 4.7f
        private const val MIN_STROKE_PX = 2f
    }
}
