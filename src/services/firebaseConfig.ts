import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: User must replace these values with their Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBmOjVEwaov3i3u8wP3KNF7LRYGJhyK9zM",
    authDomain: "finance-app-d89d9.firebaseapp.com",
    projectId: "finance-app-d89d9",
    storageBucket: "finance-app-d89d9.firebasestorage.app",
    messagingSenderId: "117398334546",
    appId: "1:117398334546:web:dcf516d6e9bb77ebe4438b",
    measurementId: "G-C93GF2KR1P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
