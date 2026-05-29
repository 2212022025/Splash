import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAp5fG4-8NkSSP1S6ND6vSk8HeZRXrXz7M",
  authDomain: "splash-cc98f.firebaseapp.com",
  databaseURL: "https://splash-cc98f-default-rtdb.firebaseio.com",
  projectId: "splash-cc98f",
  storageBucket: "splash-cc98f.firebasestorage.app",
  messagingSenderId: "526650808551",
  appId: "1:526650808551:web:af7818987af38b946d2a42",
  measurementId: "G-YB6V1K3BE3"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

// Initialize Analytics (client-side only)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

export { db };
