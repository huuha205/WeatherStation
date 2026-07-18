importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Init Firebase app in service worker
firebase.initializeApp({
  apiKey: "AIzaSyBwYbNXHxawRhWQG8eT-c9T8YoXIzUIEKM",
  authDomain: "webweather-349d9.firebaseapp.com",
  projectId: "webweather-349d9",
  storageBucket: "webweather-349d9.firebasestorage.app",
  messagingSenderId: "904138913216",
  appId: "1:904138913216:web:71a4603eb214ec1c2d8425"
});

const messaging = firebase.messaging();

// === FIREBASE SDK (Dành cho Chrome/Android) ===
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage:', payload);
});

// === PUSH LISTENER THỦ CÔNG (BẮT BUỘC CHO SAFARI trên iOS/iPadOS) ===
self.addEventListener('push', function(event) {
  console.log('[SW] Push event received:', event);
  
  let title = 'Cảnh báo thời tiết';
  let body = 'Có cảnh báo mới từ hệ thống Smart Weather';

  try {
    const data = event.data.json();
    if (data.notification) {
      title = data.notification.title || title;
      body = data.notification.body || body;
    }
  } catch (e) {
    console.log('[SW] Parse error, using defaults');
  }

  const options = {
    body: body,
    vibrate: [200, 100, 200],
    tag: 'weather-alert',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Khi user click vào notification thì mở web app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
