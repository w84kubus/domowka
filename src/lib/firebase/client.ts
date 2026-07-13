// Firebase client SDK — TYLKO w Client Components ('use client').
// Singleton odporny na HMR (SPEC §8, pkt 3): przy hot-reloadzie nie inicjalizujemy
// aplikacji drugi raz. Klient CZYTA przez onSnapshot, nigdy nie pisze stanu gry.
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getClientApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  return getAuth(getClientApp());
}

export function getDb(): Firestore {
  return getFirestore(getClientApp());
}

/**
 * Gwarantuje anonimową sesję i zwraca zalogowanego użytkownika.
 * Anonymous Auth persystuje uid w IndexedDB → refresh strony nie wyrzuca gracza (SPEC §3.7).
 */
export function ensureAnonAuth(): Promise<User> {
  const auth = getClientAuth();
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub();
          resolve(user);
          return;
        }
        signInAnonymously(auth).catch((err) => {
          unsub();
          reject(err);
        });
      },
      (err) => {
        unsub();
        reject(err);
      },
    );
  });
}
