import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKHLYZDR730MGDi9uD2XDSID5F875yGX4",
  authDomain: "shop-8d90a.firebaseapp.com",
  projectId: "shop-8d90a",
  storageBucket: "shop-8d90a.firebasestorage.app",
  messagingSenderId: "136091114050",
  appId: "1:136091114050:web:90f166fc84067ba35fabdb",
  measurementId: "G-J2CPHSVZQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };
export default app;
