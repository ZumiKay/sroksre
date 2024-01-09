// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7-3fzqmyqzZ3BQE6_zuTr9nr-oV7hQoA",
  authDomain: "sroksre-442c0.firebaseapp.com",
  projectId: "sroksre-442c0",
  storageBucket: "sroksre-442c0.appspot.com",
  messagingSenderId: "695096645214",
  appId: "1:695096645214:web:1c099ee574a04d083406cf",
  measurementId: "G-LD00Y58N7D",
};
// Initialize firebaseConfig
//
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
