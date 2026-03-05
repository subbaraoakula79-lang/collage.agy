import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC6GSeiG-seWKd3lhhoWldifWJkfdHBD7c",
    authDomain: "collage-admission-manage-297f0.firebaseapp.com",
    projectId: "collage-admission-manage-297f0",
    storageBucket: "collage-admission-manage-297f0.firebasestorage.app",
    messagingSenderId: "937634621057",
    appId: "1:937634621057:web:49099f7bc7213a1295cf80",
    measurementId: "G-JG23N99XG6"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in supported environments (browser)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
