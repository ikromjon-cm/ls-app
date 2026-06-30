import env from '../config/env.js'

let admin: any = null
let messaging: any = null

async function getFirebaseAdmin() {
  if (messaging) return messaging
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null
  }
  try {
    admin = await import('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
    }
    messaging = admin.messaging()
    console.log('[Firebase] Admin SDK initialized')
    return messaging
  } catch (err: any) {
    console.warn('[Firebase] Init failed:', err.message)
    return null
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  image?: string
  androidChannelId?: string
  sound?: string
}

export async function sendToDevice(
  deviceToken: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const fb = await getFirebaseAdmin()
    if (!fb) {
      console.log(`[Push] Firebase not configured. Would send to ${deviceToken}: ${payload.title}`)
      return { success: false, error: 'Firebase not configured' }
    }

    const message: any = {
      token: deviceToken,
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: payload.androidChannelId || 'default',
          sound: payload.sound || 'default',
          priority: 'high',
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title: payload.title, body: payload.body },
            sound: payload.sound || 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    }

    if (payload.image) {
      message.android!.notification!.imageUrl = payload.image
    }

    const response = await fb.send(message)
    console.log(`[Push] Sent to ${deviceToken}: ${response}`)
    return { success: true }
  } catch (err: any) {
    const errorCode = err.code || ''
    if (errorCode === 'messaging/registration-token-not-registered') {
      console.warn(`[Push] Token invalid: ${deviceToken}`)
    }
    console.error('[Push] Error:', err.message)
    return { success: false, error: err.message }
  }
}

export async function sendToMultipleDevices(
  deviceTokens: string[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const token of deviceTokens) {
    const result = await sendToDevice(token, payload)
    if (result.success) success++
    else { failed++; if (result.error) errors.push(result.error) }
  }

  return { success, failed, errors }
}

export async function sendToTopic(
  topic: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const fb = await getFirebaseAdmin()
    if (!fb) return { success: false, error: 'Firebase not configured' }

    await fb.send({
      topic,
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
      android: { priority: 'high' },
    })

    console.log(`[Push] Sent to topic ${topic}: ${payload.title}`)
    return { success: true }
  } catch (err: any) {
    console.error('[Push] Topic send error:', err.message)
    return { success: false, error: err.message }
  }
}

export async function subscribeToTopic(
  deviceTokens: string[],
  topic: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fb = await getFirebaseAdmin()
    if (!fb) return { success: false, error: 'Firebase not configured' }
    await fb.subscribeToTopic(deviceTokens, topic)
    console.log(`[Push] Subscribed ${deviceTokens.length} devices to topic: ${topic}`)
    return { success: true }
  } catch (err: any) {
    console.error('[Push] Subscribe error:', err.message)
    return { success: false, error: err.message }
  }
}
