importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Init Firebase app in service worker
// MUST match credentials on client side, but since client doesn't have it defined yet 
// in this boilerplate we just set empty for now, user needs to fill their config.
firebase.initializeApp({
  apiKey: "AIzaSyBwYbNXHxawRhWQG8eT-c9T8YoXIzUIEKM",
  authDomain: "webweather-349d9.firebaseapp.com",
  projectId: "webweather-349d9",
  storageBucket: "webweather-349d9.firebasestorage.app",
  messagingSenderId: "904138913216",
  appId: "1:904138913216:web:71a4603eb214ec1c2d8425"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/images/weather-icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
