import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC-SWXSAO9-dTQTDCpS1OWEy_Ilc8hvd9A",
    authDomain: "music-learning-app-expo.firebaseapp.com",
    projectId: "music-learning-app-expo",
    storageBucket: "music-learning-app-expo.firebasestorage.app",
    messagingSenderId: "920083811255",
    appId: "1:920083811255:web:727983381355fbbc8d3632"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 