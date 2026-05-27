import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setError('Notifications not supported');
      return;
    }
    setPermission(Notification.permission);

    if (Notification.permission === 'granted') {
      subscribeToPush();
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('Notifications not supported');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
      }
    } catch (err: any) {
      setError(err.message || 'Permission request failed');
    }
  };

  const subscribeToPush = async () => {
    if (subscribedRef.current) return;
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
      setError('Push notifications not supported');
      return;
    }

    try {
      let registration: ServiceWorkerRegistration;
      const activeReg = await navigator.serviceWorker.getRegistration();
      if (activeReg) {
        registration = activeReg;
      } else {
        setError('No service worker registered');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const { publicKey } = await api.push.getVapidKey();
        if (!publicKey) {
          setError('Push notifications not configured');
          return;
        }

        const convertedKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey.buffer as ArrayBuffer,
        });
      }

      const subJson = subscription.toJSON();
      await api.push.register({
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh,
        auth: subJson.keys!.auth,
        userAgent: navigator.userAgent,
      });

      subscribedRef.current = true;
      setSubscribed(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Push subscription failed');
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.push.unregister(endpoint);
      }

      subscribedRef.current = false;
      setSubscribed(false);
    } catch (err: any) {
      setError(err.message || 'Unsubscribe failed');
    }
  };

  return {
    permission,
    subscribed,
    error,
    requestPermission,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData.split('').map((c) => c.charCodeAt(0)));
}
