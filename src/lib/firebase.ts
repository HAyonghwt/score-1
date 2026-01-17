import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, Messaging, isSupported as isMessagingSupported } from "firebase/messaging";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCk9ha_dN1LE9_3tQwME_yHxwBwwGOHlaU",
  authDomain: "contestdate.firebaseapp.com",
  databaseURL: "https://contestdate-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "contestdate",
  storageBucket: "contestdate.firebasestorage.app",
  messagingSenderId: "138458164588",
  appId: "1:138458164588:web:90525ed13159e5f512d749",
  measurementId: "G-VNH22LC97E"
};

// Initialize Firebase (SSR-safe)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Messaging and Analytics for client-side only
// Messaging and Analytics for client-side only
let messaging: Messaging | null = null;
if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });

  isMessagingSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.error("Firebase Messaging initialization failed", e);
      }
    }
  });
}

export { app, db, messaging };
