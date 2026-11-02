import { NativeModule, requireOptionalNativeModule } from "expo";
declare class ClockModule extends NativeModule {
  sample(): { wall: number; monotonic: number; boot: string };
}
export default requireOptionalNativeModule<ClockModule>("CorpTimerClock");
