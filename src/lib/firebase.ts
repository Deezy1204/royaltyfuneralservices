
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD5LKvzB06HRRZQBd3miB8M0ynOiute3CI",
    authDomain: "royaltyfuneralweb.firebaseapp.com",
    databaseURL: "https://royaltyfuneralweb-default-rtdb.firebaseio.com",
    projectId: "royaltyfuneralweb",
    storageBucket: "royaltyfuneralweb.firebasestorage.app",
    messagingSenderId: "593789199355",
    appId: "1:593789199355:web:cc86524165e5744adbe15e"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth };
