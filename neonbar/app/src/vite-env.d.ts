/// <reference types="vite/client" />
declare module '*.css' {}

// Service Worker types
interface ServiceWorkerGlobalScope {
  clients: Clients;
  registration: ServiceWorkerRegistration;
}

interface NotificationEvent extends Event {
  notification: Notification;
  action: string;
}
