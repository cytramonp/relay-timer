package expo.modules.corptimeroverlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class CorpTimerOverlayModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CorpTimerOverlay")
    Events("onCommand")
    OnCreate { TimerOverlayService.emit = { action -> try { sendEvent("onCommand", mapOf("action" to action)) } catch (_: Exception) {} } }
    OnDestroy { TimerOverlayService.emit = null }
    Function("hasPermission") { appContext.reactContext?.let { Settings.canDrawOverlays(it) } ?: false }
    Function("isVisible") { TimerOverlayService.visible }
    Function("requestPermission") {
      val context = requireNotNull(appContext.reactContext)
      context.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
    AsyncFunction("show") { snapshot: Map<String, Any?> ->
      val context = requireNotNull(appContext.reactContext)
      check(Settings.canDrawOverlays(context)) { "Allow CorpTimer to display over other apps first." }
      val intent = Intent(context, TimerOverlayService::class.java).putExtra("snapshot", JSONObject(snapshot).toString())
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
      Unit
    }
    Function("update") { snapshot: Map<String, Any?> ->
      TimerOverlayService.update(JSONObject(snapshot))
    }
    Function("hide") {
      appContext.reactContext?.let { it.stopService(Intent(it, TimerOverlayService::class.java)) }
    }
  }
}
