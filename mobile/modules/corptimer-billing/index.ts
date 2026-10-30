import { NativeModule, requireOptionalNativeModule } from "expo";

export type PlayPurchase = { token: string; products: string[]; state: number };
export type PlayProduct = { price: string; period: string; offerToken: string };
declare class CorpTimerBillingModule extends NativeModule<{
  onPurchases: (event: { code: number; purchases: PlayPurchase[] }) => void;
}> {
  product(id: string, basePlan: string): Promise<PlayProduct>;
  buy(id: string, basePlan: string, accountId: string): Promise<void>;
  restore(): Promise<PlayPurchase[]>;
}
export default requireOptionalNativeModule<CorpTimerBillingModule>(
  "CorpTimerBilling",
);
