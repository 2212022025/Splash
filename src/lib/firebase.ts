
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDevelopmentPurposesOnly",
  authDomain: "splash-app-placeholder.firebaseapp.com",
  databaseURL: "https://splash-app-placeholder-default-rtdb.firebaseio.com",
  projectId: "splash-app-placeholder",
  storageBucket: "splash-app-placeholder.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:dummyappid"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { db };
