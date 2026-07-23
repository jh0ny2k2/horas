import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'

export async function registerForPushNotifications(userId) {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications solo funcionan en dispositivos nativos')
    return
  }

  const permission = await PushNotifications.requestPermissions()

  if (permission.receive !== 'granted') {
    console.log('Permiso de notificaciones no concedido')
    return
  }

  await PushNotifications.register()

  PushNotifications.addListener('registration', async (token) => {
    console.log('Token FCM:', token.value)

    if (userId) {
      await supabase
        .from('profiles')
        .update({ fcm_token: token.value })
        .eq('id', userId)
    }
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notificación recibida:', notification)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Acción en notificación:', action.notification.data)
  })
}

export async function unregisterForPushNotifications(userId) {
  if (!Capacitor.isNativePlatform()) return

  await PushNotifications.removeAllListeners()

  if (userId) {
    await supabase
      .from('profiles')
      .update({ fcm_token: null })
      .eq('id', userId)
  }
}
