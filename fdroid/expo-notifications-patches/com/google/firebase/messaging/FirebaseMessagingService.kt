package com.google.firebase.messaging

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * F-Droid shadow stub for `com.google.firebase.messaging.FirebaseMessagingService`.
 *
 * The real class is a plain [Service] that the Firebase SDK dispatches
 * messages to when Google Play services is present. In F-Droid builds nothing
 * ever starts it, so the stub keeps the class shape (the module manifest still
 * declares `ExpoFirebaseMessagingService`) without any Firebase dependency.
 */
open class FirebaseMessagingService : Service() {

  /** Called when a message is received. Never invoked in F-Droid builds. */
  open fun onMessageReceived(remoteMessage: RemoteMessage) = Unit

  /** Called when the device registration token changes. Never invoked here. */
  open fun onNewToken(token: String) = Unit

  /** Called when the server tells the device to delete stored messages. */
  open fun onDeletedMessages() = Unit

  override fun onBind(intent: Intent?): IBinder? = null
}
