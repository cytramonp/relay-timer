import Foundation
import ExpoModulesCore
import Darwin

public class CorpTimerClockModule: Module {
  private let fallbackBoot = UUID().uuidString
  private var boot: String?
  public func definition() -> ModuleDefinition {
    Name("CorpTimerClock")
    Function("sample") { () -> [String: Any] in
      var info = mach_timebase_info_data_t()
      mach_timebase_info(&info)
      let uptime = Double(mach_continuous_time()) * Double(info.numer) / Double(info.denom) / 1_000_000
      if self.boot == nil {
        var size = 0
        if sysctlbyname("kern.bootsessionuuid", nil, &size, nil, 0) == 0 && size > 1 && size < 256 {
          var bytes = [CChar](repeating: 0, count: size)
          if sysctlbyname("kern.bootsessionuuid", &bytes, &size, nil, 0) == 0 { self.boot = String(cString: bytes) }
        }
        // If unavailable, use an instance ID so a later process never mistakes
        // a new boot for the old one; its recovery uses the bounded wall gap.
        if self.boot == nil { self.boot = self.fallbackBoot }
      }
      return ["wall": Date().timeIntervalSince1970 * 1000, "monotonic": uptime, "boot": self.boot!]
    }
  }
}
