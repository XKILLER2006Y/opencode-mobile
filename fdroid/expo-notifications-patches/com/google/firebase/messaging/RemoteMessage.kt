package com.google.firebase.messaging

import android.net.Uri
import android.os.Parcel
import android.os.Parcelable

/**
 * F-Droid shadow stub for `com.google.firebase.messaging.RemoteMessage`.
 *
 * The fdroid build strips the firebase-messaging dependency and compiles the
 * expo-notifications source against this stub instead, so the module keeps its
 * full API surface without bundling Google Play services. Nothing ever
 * constructs a real message: FCM simply does not exist on devices without
 * Google Play services, so all getters return empty values.
 */
class RemoteMessage private constructor() : Parcelable {

  private val dataMap: MutableMap<String, String> = LinkedHashMap()
  private val sentTimestamp: Long = 0L

  /** Constructor mirroring the Firebase SDK shape (data payload). */
  constructor(data: Map<String, String>) : this() {
    dataMap.putAll(data)
  }

  /** Remote push payload delivered with the message. */
  val data: Map<String, String>
    get() = dataMap

  /** Collapse key, if any. */
  val collapseKey: String? = null

  /** Sender ID of the sender (never known in F-Droid builds). */
  val from: String? = null

  /** Unique message identifier. */
  val messageId: String? = null

  /** Message type, if any. */
  val messageType: String? = null

  /** Message priority. */
  val priority: Int = 0

  /** Original message priority. */
  val originalPriority: Int = 0

  /** Time the message was sent. */
  val sentTime: Long = 0L

  /** Message target. */
  val to: String? = null

  /** Message time-to-live. */
  val ttl: Int = 0

  /** Notification payload, if any. */
  val notification: Notification? = null

  /** Notification payload mirroring the Firebase SDK shape. */
  data class Notification(
    val title: String? = null,
    val titleLocalizationKey: String? = null,
    val titleLocalizationArgs: Array<String>? = null,
    val body: String? = null,
    val bodyLocalizationKey: String? = null,
    val bodyLocalizationArgs: Array<String>? = null,
    val icon: String? = null,
    val sound: String? = null,
    val tag: String? = null,
    val color: String? = null,
    val clickAction: String? = null,
    val channelId: String? = null,
    val imageUrl: Uri? = null,
    val link: Uri? = null,
    val ticker: String? = null,
    val sticky: Boolean = false,
    val localOnly: Boolean = false,
    val eventTime: Long? = null,
    val lightSettings: IntArray? = null,
    val vibrateTimings: LongArray? = null,
    val visibility: Int? = null,
    val notificationCount: Int? = null,
    val notificationPriority: Int? = null,
    val defaultSound: Boolean = false,
    val defaultLightSettings: Boolean = false,
    val defaultVibrateSettings: Boolean = false,
  )

  override fun describeContents(): Int = 0

  override fun writeToParcel(dest: Parcel, flags: Int) {
    dest.writeInt(dataMap.size)
    for ((key, value) in dataMap) {
      dest.writeString(key)
      dest.writeString(value)
    }
    dest.writeLong(sentTimestamp)
  }

  companion object {
    const val PRIORITY_UNKNOWN: Int = -1
    const val PRIORITY_MIN: Int = -2
    const val PRIORITY_LOW: Int = 0
    const val PRIORITY_HIGH: Int = 1
    const val PRIORITY_NORMAL: Int = 2
    const val PRIORITY_MAX: Int = 3

    @JvmField
    val CREATOR: Parcelable.Creator<RemoteMessage> = object : Parcelable.Creator<RemoteMessage> {
      override fun createFromParcel(parcel: Parcel): RemoteMessage {
        val size = parcel.readInt()
        val data = LinkedHashMap<String, String>()
        repeat(size) {
          data[parcel.readString().orEmpty()] = parcel.readString().orEmpty()
        }
        parcel.readLong()
        return RemoteMessage(data)
      }

      override fun newArray(size: Int): Array<RemoteMessage?> = arrayOfNulls(size)
    }
  }
}
