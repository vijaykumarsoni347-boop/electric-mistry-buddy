import { getStorage, type FirebaseStorage } from "firebase/storage";
import app from "./client";

// Initialize Firebase Storage
const storage = getStorage(app);

export { storage };
export default storage;
