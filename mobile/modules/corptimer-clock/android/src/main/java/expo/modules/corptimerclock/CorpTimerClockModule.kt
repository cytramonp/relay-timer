package expo.modules.corptimerclock

import android.os.SystemClock
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CorpTimerClockModule : Module() {
  private var boot: String? = null
  override fun definition() = ModuleDefinition {
    Name("CorpTimerClock")
    Function("sample") {
      val context = requireNotNull(appContext.reactContext)
      val id = boot ?: Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT, -1).toString().also { boot = it }
      mapOf("wall" to System.currentTimeMillis().toDouble(), "monotonic" to SystemClock.elapsedRealtime().toDouble(), "boot" to "android-$id")
    }
  }
}
