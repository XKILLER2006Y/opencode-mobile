package com.google.firebase.messaging

import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks

/**
 * F-Droid shadow stub for `com.google.firebase.messaging.FirebaseMessaging`.
 *
 * FCM does not exist in F-Droid builds (no Google Play services), so every
 * operation fails with an explicit error instead of crashing or silently
 * returning a fake token. `com.google.android.gms.tasks.Task` comes from
 * play-services-tasks, which is pulled in transitively by other dependencies.
 */
class FirebaseMessaging private constructor() {

  /** Device push token. Always fails: there is no FCM backend. */
  val token: Task<String> = Tasks.forException(UnsupportedOperationException(UNAVAILABLE_MESSAGE))

  /** Deletes the current device token. Always fails: there is none. */
  fun deleteToken(): Task<Void> = Tasks.forException(UnsupportedOperationException(UNAVAILABLE_MESSAGE))

  /** Subscribes to a broadcast topic. Always fails: there is no FCM backend. */
  fun subscribeToTopic(topic: String): Task<Void> =
    Tasks.forException(UnsupportedOperationException(UNAVAILABLE_MESSAGE))

  /** Unsubscribes from a broadcast topic. Always fails: there is no FCM backend. */
  fun unsubscribeFromTopic(topic: String): Task<Void> =
    Tasks.forException(UnsupportedOperationException(UNAVAILABLE_MESSAGE))

  companion object {
    private const val UNAVAILABLE_MESSAGE =
      "Firebase Cloud Messaging is not available in this F-Droid build (no Google Play services)."

    private val instance = FirebaseMessaging()

    @JvmStatic
    fun getInstance(): FirebaseMessaging = instance
  }
}
