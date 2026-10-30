import { NativeModule, requireOptionalNativeModule } from "expo";
declare class CorpTimerOverlayModule extends NativeModule<{
  onCommand: (event: { action: string }) => void;
}> {
  hasPermission(): boolean;
  requestPermission(): void;
  isVisible(): boolean;
  show(snapshot: Record<string, unknown>): Promise<void>;
  update(snapshot: Record<string, unknown>): void;
  hide(): void;
}
export default requireOptionalNativeModule<CorpTimerOverlayModule>(
  "CorpTimerOverlay",
);
