// Firebase initialization and export
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// TODO: Replace with your Firebase project config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCDWxyhg1BNsF-_VPLNuBolq0-qQaqWvkQ",
    authDomain: "evalio-lms.firebaseapp.com",
    projectId: "evalio-lms",
    storageBucket: "evalio-lms.firebasestorage.app",
    messagingSenderId: "906474100955",
    appId: "1:906474100955:web:b35fd7bd53152d065bd4fe",
    measurementId: "G-6HGG06T6D8"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set session persistence to local (default is 30 days, but you can handle sign-out after 5 days)
setPersistence(auth, browserLocalPersistence);

export { auth };
