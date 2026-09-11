import { getAuth, type Auth } from "firebase/auth";
import app from "./client";

// Initialize Firebase Auth
const auth = getAuth(app);

export { auth };
export default auth;
