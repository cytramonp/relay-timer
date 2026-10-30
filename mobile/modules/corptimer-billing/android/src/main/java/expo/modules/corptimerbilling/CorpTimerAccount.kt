package expo.modules.corptimerbilling

import android.app.Activity
import android.os.Handler
import android.os.Looper
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import expo.modules.kotlin.Promise
import java.util.concurrent.Executor

/** Google's current Credential Manager; no legacy GoogleSignIn SDK or extra API scopes. */
object CorpTimerAccount {
  fun signIn(activity: Activity, webClientId: String, promise: Promise) {
    val main = Handler(Looper.getMainLooper())
    main.post {
      try {
        val option = GetSignInWithGoogleOption.Builder(webClientId).build()
        val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
        CredentialManager.create(activity).getCredentialAsync(
          activity, request, null, Executor { main.post(it) },
          object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
            override fun onResult(result: GetCredentialResponse) {
              try {
                val credential = result.credential as CustomCredential
                // Firebase validates Google's signed token and audience. Never log it.
                promise.resolve(GoogleIdTokenCredential.createFrom(credential.data).idToken)
              } catch (_: Exception) { promise.reject("GOOGLE_CREDENTIAL", "Google did not return a usable sign-in credential.", null) }
            }
            override fun onError(error: GetCredentialException) {
              promise.reject("GOOGLE_SIGN_IN", "Google sign-in was cancelled or unavailable. You can try again.", null)
            }
          }
        )
      } catch (_: Exception) { promise.reject("GOOGLE_CONFIG", "Google sign-in is not configured for this app certificate.", null) }
    }
  }
}
