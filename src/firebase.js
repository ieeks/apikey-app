import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Paste your Firebase project config here after setting up the project.
// Find it in: Firebase Console → Project Settings → Your Apps → Web app → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyDp4FtBo9VQsMNuI9vtoNJazc5wcUSqC34",
  authDomain: "isla-vault.firebaseapp.com",
  projectId: "isla-vault",
  storageBucket: "isla-vault.firebasestorage.app",
  messagingSenderId: "129424746815",
  appId: "1:129424746815:web:17dd1c8e60cba4d0f80b8a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
