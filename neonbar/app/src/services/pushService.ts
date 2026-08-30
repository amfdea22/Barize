/**
 * Push Notification Service
 * 
 * Gerencia notificações push para garçom e cliente.
 * - Garçom: "Pedido #123 Pronto!" quando cozinha marca como pronto
 * - Cliente: "Seu pedido está sendo preparado!" / "Pedido pronto!"
 */

const VAPID_PUBLIC_KEY = ''; // Configurar com chave pública VAPID

/** Check if push notifications are supported */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Request notification permission */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  const permission = await Notification.requestPermission();
  return permission;
}

/** Subscribe to push notifications */
export async function subscribePush(): Promise<PushSubscription | null> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    return subscription;
  } catch {
    return null;
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribePush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Send local notification (for immediate feedback) */
export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    ...options,
  } as any);
}

/** Notify garçom that order is ready */
export function notifyPedidoPronto(mesa: string, pedidoId: number) {
  sendLocalNotification(`Pedido #${pedidoId} Pronto!`, {
    body: `Mesa ${mesa} — clique para entregar`,
    tag: `pedido-${pedidoId}`,
    data: { mesa, pedidoId, action: 'entregar' },
  });
}

/** Notify garçom of new order */
export function notifyNovoPedido(mesa: string, pedidoId: number) {
  sendLocalNotification(`Novo Pedido #${pedidoId}`, {
    body: `Mesa ${mesa} — clique para preparar`,
    tag: `novo-${pedidoId}`,
    data: { mesa, pedidoId, action: 'preparar' },
  });
}

/** Notify client that order is being prepared */
export function notifyPedidoPreparando(pedidoId: number) {
  sendLocalNotification('Seu pedido está sendo preparado!', {
    body: `Pedido #${pedidoId}`,
    tag: `preparando-${pedidoId}`,
  });
}

/** Notify client that order is ready */
export function notifyPedidoEntregue(pedidoId: number) {
  sendLocalNotification('Seu pedido está pronto!', {
    body: `Pedido #${pedidoId} — aguarde entrega`,
    tag: `entregue-${pedidoId}`,
  });
}

/** Helper: convert VAPID key */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
