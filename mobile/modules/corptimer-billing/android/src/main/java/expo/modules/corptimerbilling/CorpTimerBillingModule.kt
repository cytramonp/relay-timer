package expo.modules.corptimerbilling

import android.os.Handler
import android.os.Looper
import com.android.billingclient.api.*
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Play owns the payment UI. JavaScript never receives card details or grants Pro. */
class CorpTimerBillingModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var client: BillingClient? = null
  private val waiting = mutableListOf<Pair<Promise, (BillingClient) -> Unit>>()
  private var connecting = false

  private fun connected(promise: Promise, action: (BillingClient) -> Unit) {
    main.post {
      val billing = client ?: BillingClient.newBuilder(requireNotNull(appContext.reactContext))
        .setListener { result, purchases ->
          sendEvent("onPurchases", mapOf("code" to result.responseCode, "purchases" to (purchases ?: emptyList()).map(::purchase)))
        }
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build().also { client = it }
      if (billing.isReady) action(billing) else {
        waiting.add(promise to action)
        if (!connecting) {
          connecting = true
          billing.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
              connecting = false
              val callbacks = waiting.toList(); waiting.clear()
              callbacks.forEach { (p, fn) ->
                if (result.responseCode == BillingClient.BillingResponseCode.OK) fn(billing)
                else p.reject("PLAY_UNAVAILABLE", "Google Play billing is unavailable on this device.", null)
              }
            }
            override fun onBillingServiceDisconnected() { }
          })
        }
      }
    }
  }
  private fun purchase(p: Purchase) = mapOf("token" to p.purchaseToken, "products" to p.products, "state" to p.purchaseState)
  private fun details(billing: BillingClient, id: String, basePlan: String, promise: Promise, fn: (ProductDetails, ProductDetails.SubscriptionOfferDetails) -> Unit) {
    val query = QueryProductDetailsParams.newBuilder().setProductList(listOf(
      QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.SUBS).build()
    )).build()
    billing.queryProductDetailsAsync(query) { result, response ->
      val product = response.productDetailsList.firstOrNull { it.productId == id }
      // Only the regular annual base plan: do not silently choose an introductory offer.
      val offer = product?.subscriptionOfferDetails?.firstOrNull { it.basePlanId == basePlan && it.offerId == null }
      if (result.responseCode != BillingClient.BillingResponseCode.OK || product == null || offer == null)
        promise.reject("PRODUCT_UNAVAILABLE", "The annual plan is not available from Google Play yet.", null)
      else fn(product, offer)
    }
  }
  override fun definition() = ModuleDefinition {
    Name("CorpTimerBilling")
    Events("onPurchases")
    AsyncFunction("signIn") { clientId: String, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) promise.reject("NO_ACTIVITY", "Open CorpTimer to sign in.", null)
      else CorpTimerAccount.signIn(activity, clientId, promise)
    }
    AsyncFunction("product") { id: String, basePlan: String, promise: Promise ->
      connected(promise) { billing -> details(billing, id, basePlan, promise) { _, offer ->
        val phase = offer.pricingPhases.pricingPhaseList.last()
        promise.resolve(mapOf("price" to phase.formattedPrice, "period" to phase.billingPeriod, "offerToken" to offer.offerToken))
      } }
    }
    AsyncFunction("buy") { id: String, basePlan: String, account: String, promise: Promise ->
      connected(promise) { billing -> details(billing, id, basePlan, promise) { product, offer ->
        main.post {
          val activity = appContext.currentActivity
          if (activity == null) promise.reject("NO_ACTIVITY", "Open CorpTimer before subscribing.", null)
          else {
            val params = BillingFlowParams.newBuilder().setObfuscatedAccountId(account)
              .setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(product).setOfferToken(offer.offerToken).build())).build()
            val result = billing.launchBillingFlow(activity, params)
            if (result.responseCode == BillingClient.BillingResponseCode.OK) promise.resolve(null)
            else promise.reject("PLAY_${result.responseCode}", "Google Play could not open the purchase screen.", null)
          }
        }
      } }
    }
    AsyncFunction("restore") { promise: Promise ->
      connected(promise) { billing ->
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()) { result, purchases ->
          if (result.responseCode == BillingClient.BillingResponseCode.OK) promise.resolve(purchases.map(::purchase))
          else promise.reject("PLAY_RESTORE", "Could not restore Google Play purchases. Try again.", null)
        }
      }
    }
    OnDestroy { client?.endConnection(); client = null; waiting.clear() }
  }
}
