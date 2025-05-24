// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAt5pe1CX9rfdQjJvUuaVrIEf-VbnyrTSw",
  authDomain: "grow-off-app.firebaseapp.com",
  projectId: "grow-off-app",
  storageBucket: "grow-off-app.firebasestorage.app",
  messagingSenderId: "250665554645",
  appId: "1:250665554645:web:f8dd94ee4dc187a0aa885c",
  measurementId: "G-HVLGY64YLQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
