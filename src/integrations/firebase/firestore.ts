import { getFirestore, type Firestore } from "firebase/firestore";
import app from "./client";

// Initialize Firebase Firestore
const db = getFirestore(app);

export { db };
export default db;
