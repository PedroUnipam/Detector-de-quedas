import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCk7yZZXAyAnLgWqjYWmfJXJgp84LMa4tk",
  authDomain: "falldetector-3efce.firebaseapp.com",
  projectId: "falldetector-3efce",
  storageBucket: "falldetector-3efce.appspot.com",
  messagingSenderId: "131363729817",
  appId: "1:131363729817:web:XXXXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
