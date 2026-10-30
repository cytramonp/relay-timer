package expo.modules.corptimeroverlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject
import java.util.Locale
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

class TimerOverlayService : Service() {
  companion object {
    @Volatile var visible = false
    var emit: ((String) -> Unit)? = null
    private var instance: TimerOverlayService? = null
    fun update(snapshot: JSONObject) { instance?.handler?.post { instance?.applySnapshot(snapshot) } }
  }
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var wm: WindowManager
  private lateinit var window: LinearLayout
  private lateinit var clock: TextView
  private lateinit var name: TextView
  private lateinit var next: TextView
  private lateinit var pause: Button
  private lateinit var segments: View
  private lateinit var params: WindowManager.LayoutParams
  private var snapshot = JSONObject()
  private var shape = "wide"
  private var tickSent = false
  private val cream = Color.rgb(245, 242, 233)
  private val teal = Color.rgb(87, 193, 189)
  private val muted = Color.rgb(168, 194, 193)
  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
  override fun onBind(intent: Intent?): IBinder? = null
  override fun onCreate() {
    super.onCreate()
    instance = this
    wm = getSystemService(WINDOW_SERVICE) as WindowManager
    val notifications = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) notifications.createNotificationChannel(NotificationChannel("corptimer-floating", "Floating meeting timer", NotificationManager.IMPORTANCE_LOW))
    val open = packageManager.getLaunchIntentForPackage(packageName)!!
    val pending = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val notification = (if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "corptimer-floating") else Notification.Builder(this))
      .setContentTitle("CorpTimer is floating").setContentText("Tap to return. Close the timer window to stop floating.")
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentIntent(pending).setOngoing(true).build()
    if (Build.VERSION.SDK_INT >= 34) startForeground(7201, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE) else startForeground(7201, notification)
    handler.post(ticker)
  }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val data = intent?.getStringExtra("snapshot")?.let { JSONObject(it) } ?: JSONObject()
    if (!SettingsAllowed()) { stopSelf(); return START_NOT_STICKY }
    if (!::window.isInitialized) createWindow(data.optString("shape", "wide"))
    applySnapshot(data)
    return START_NOT_STICKY
  }
  private fun SettingsAllowed() = android.provider.Settings.canDrawOverlays(this)
  private fun text(size: Float, color: Int = cream) = TextView(this).apply { textSize = size; setTextColor(color); maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END }
  private fun button(label: String, action: () -> Unit) = Button(this).apply {
    text = label; textSize = 12f; isAllCaps = false; setTextColor(cream); minHeight = dp(48); minimumWidth = dp(48); setPadding(dp(6), 0, dp(6), 0)
    background = GradientDrawable().apply { setColor(Color.rgb(25, 52, 57)); cornerRadius = dp(8).toFloat() }
    setOnClickListener { action() }
  }
  private fun createWindow(kind: String) {
    shape = kind
    window = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL; setPadding(dp(14), dp(8), dp(14), dp(12))
      background = GradientDrawable().apply { setColor(Color.rgb(6, 26, 30)); cornerRadius = dp(14).toFloat(); setStroke(dp(1), Color.rgb(53, 81, 87)) }
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }
    val top = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
    val grip = text(12f, muted).apply { text = "CorpTimer · drag to move"; contentDescription = "Drag floating timer"; minHeight = dp(48); gravity = Gravity.CENTER_VERTICAL }
    top.addView(grip, LinearLayout.LayoutParams(0, dp(48), 1f))
    top.addView(button("Close") { emit?.invoke("close"); stopSelf() }, LinearLayout.LayoutParams(dp(58), dp(48)))
    window.addView(top)
    name = text(18f).apply { typeface = Typeface.create("serif", Typeface.NORMAL) }; window.addView(name)
    clock = text(if (shape == "strip") 38f else 54f).apply { typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL); setPadding(0, dp(3), 0, dp(3)); contentDescription = "Floating time remaining" }; window.addView(clock)
    segments = object : View(this) {
      val paint = Paint(Paint.ANTI_ALIAS_FLAG)
      override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val agenda = snapshot.optJSONArray("agenda") ?: return
        var total = 0.0; for (i in 0 until agenda.length()) total += max(0.5, agenda.getJSONObject(i).optDouble("min", 1.0))
        var x = 0f
        for (i in 0 until agenda.length()) {
          val a = agenda.getJSONObject(i); val w = (max(0.5, a.optDouble("min", 1.0)) / max(0.5, total) * width).toFloat()
          paint.color = if (a.optString("status") == "done") teal else Color.rgb(41, 70, 75)
          canvas.drawRect(x, 0f, x + max(1f, w - dp(2)), height.toFloat(), paint)
          if (a.optString("status") == "current") { paint.color = teal; canvas.drawRect(x, 0f, x + max(0f, w - dp(2)) * snapshot.optDouble("progress", 0.0).toFloat(), height.toFloat(), paint) }
          x += w
        }
      }
    }; window.addView(segments, LinearLayout.LayoutParams(-1, dp(6)))
    next = text(12f, muted).apply { setPadding(0, dp(8), 0, dp(8)) }; window.addView(next)
    val controls = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
    controls.addView(button("Next") { emit?.invoke("next") }, LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginEnd = dp(5) })
    pause = button("Pause") { emit?.invoke("pause") }; controls.addView(pause, LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginEnd = dp(5) })
    controls.addView(button("+1 min") { emit?.invoke("extend") }, LinearLayout.LayoutParams(0, dp(48), 1f))
    window.addView(controls)
    val undo = button("Undo") { emit?.invoke("undo") }
    controls.addView(undo, 2, LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginEnd = dp(5) })
    if (shape == "strip") name.visibility = View.GONE
    params = WindowManager.LayoutParams(dp(if (shape == "square") 240 else if (shape == "strip") 300 else 290), WindowManager.LayoutParams.WRAP_CONTENT, if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL, PixelFormat.TRANSLUCENT).apply { gravity = Gravity.TOP or Gravity.START; x = dp(16); y = dp(90) }
    var startX = 0; var startY = 0; var downX = 0f; var downY = 0f
    grip.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> { startX = params.x; startY = params.y; downX = event.rawX; downY = event.rawY; true }
        MotionEvent.ACTION_MOVE -> {
          params.x = max(0, min(resources.displayMetrics.widthPixels - window.width, startX + (event.rawX - downX).toInt()))
          params.y = max(0, min(resources.displayMetrics.heightPixels - window.height, startY + (event.rawY - downY).toInt()))
          try { wm.updateViewLayout(window, params) } catch (_: Exception) { stopSelf() }; true
        }
        MotionEvent.ACTION_UP -> { grip.performClick(); true }
        else -> false
      }
    }
    try { wm.addView(window, params); visible = true } catch (_: Exception) { stopSelf() }
  }
  private fun applySnapshot(data: JSONObject) {
    val oldKey = snapshot.optString("name") + snapshot.optInt("turn", -1)
    snapshot = data
    if (oldKey != data.optString("name") + data.optInt("turn", -1)) tickSent = false
    if (!::window.isInitialized) return
    if (data.optString("shape", "wide") != shape) {
      try { wm.removeView(window) } catch (_: Exception) {}
      createWindow(data.optString("shape", "wide"))
    }
    name.text = data.optString("name", "Welcome")
    pause.text = if (data.optString("status") == "paused") "Resume" else "Pause"
    render()
  }
  private fun format(value: Double): String {
    val seconds = ceil(abs(value) / 1000).toLong()
    return (if (value < 0) "+" else "") + String.format(Locale.US, "%d:%02d", seconds / 60, seconds % 60)
  }
  private fun render() {
    if (!::clock.isInitialized) return
    val running = snapshot.optString("status") == "running"
    val delta = if (running) max(0L, System.currentTimeMillis() - snapshot.optLong("publishedAt", System.currentTimeMillis())) else 0L
    val remaining = snapshot.optDouble("baseRemaining", 0.0) - delta
    clock.text = format(remaining); clock.setTextColor(if (remaining < 0) Color.rgb(255, 155, 144) else cream)
    next.text = if (snapshot.optString("next").isNotEmpty()) "Next: ${snapshot.optString("next")} · gets ${format(snapshot.optDouble("nextBudget", 0.0) - delta)}" else snapshot.optString("status", "ready")
    segments.invalidate()
    if (running && remaining <= 0 && snapshot.optString("policy") == "auto" && !tickSent) { tickSent = true; emit?.invoke("tick") }
  }
  private val ticker = object : Runnable { override fun run() { if (!SettingsAllowed()) { stopSelf(); return }; render(); handler.postDelayed(this, 250) } }
  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    if (::window.isInitialized) try { wm.removeView(window) } catch (_: Exception) {}
    visible = false; instance = null; emit?.invoke("closed")
    stopForeground(STOP_FOREGROUND_REMOVE)
    super.onDestroy()
  }
}
