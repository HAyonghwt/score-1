importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCk9ha_dN1LE9_3tQwME_yHxwBwwGOHlaU",
    authDomain: "contestdate.firebaseapp.com",
    projectId: "contestdate",
    storageBucket: "contestdate.firebasestorage.app",
    messagingSenderId: "138458164588",
    appId: "1:138458164588:web:90525ed13159e5f512d749"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
