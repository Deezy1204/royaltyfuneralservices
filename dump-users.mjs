import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyD5LKvzB06HRRZQBd3miB8M0ynOiute3CI",
    authDomain: "royaltyfuneralweb.firebaseapp.com",
    databaseURL: "https://royaltyfuneralweb-default-rtdb.firebaseio.com",
    projectId: "royaltyfuneralweb",
    storageBucket: "royaltyfuneralweb.firebasestorage.app",
    messagingSenderId: "593789199355",
    appId: "1:593789199355:web:cc86524165e5744adbe15e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function dump() {
    console.log("Fetching users...");
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
        const users = snapshot.val();
        console.log(JSON.stringify(users, null, 2));
    } else {
        console.log("No users found.");
    }
    process.exit(0);
}

dump();
