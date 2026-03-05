import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAXAkv2JoTG2H8BLsSpF6mqTugeJguMIJU",
    authDomain: "national-admission-portal.firebaseapp.com",
    projectId: "national-admission-portal",
    storageBucket: "national-admission-portal.firebasestorage.app",
    messagingSenderId: "572767836934",
    appId: "1:572767836934:web:675159eebb7ee329419c87",
    measurementId: "G-2GL14CGLH1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in supported environments (browser)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
