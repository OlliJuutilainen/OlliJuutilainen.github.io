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
        updateStrokeWidth()
        ringPaint.color = COLOR_ACTIVE
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        val size = min(w, h).toFloat()
        val diameter = (size - strokeWidthPx).coerceAtLeast(0f)
        val left = (w - diameter) / 2f
        val top = (h - diameter) / 2f
        arcBounds.set(left, top, left + diameter, top + diameter)
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

    private fun updateStrokeWidth() {
        val density = resources.displayMetrics.density
        strokeWidthPx = 6f * density
    }

    companion object {
        private const val COLOR_ACTIVE = Color.WHITE
        private const val COLOR_PAUSED = 0xFF3A3A3A.toInt()
    }
}
