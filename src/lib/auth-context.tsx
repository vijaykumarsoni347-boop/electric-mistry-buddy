import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, db } from "@/integrations/firebase";
import { 
  onAuthStateChanged, 
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { ensureAdminOwnerRole } from "@/lib/admin-setup";

type AppRole = "owner" | "electrician";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isElectrician: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  roles: [],
  isLoading: true,
  isAuthenticated: false,
  isOwner: false,
  isElectrician: false,
  refresh: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      if (!user) {
        setProfile(null);
        setRoles([]);
        return;
      }

      // Get user profile from Firestore
      const profileDoc = await getDoc(doc(db, "profiles", user.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as UserProfile);
      } else {
        // Create profile if it doesn't exist
        const newProfile: UserProfile = {
          id: user.uid,
          email: user.email || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await setDoc(doc(db, "profiles", user.uid), newProfile);
        setProfile(newProfile);
      }

      // Get user roles from Firestore
      const rolesQuery = query(collection(db, "user_roles"), where("user_id", "==", user.uid));
      const rolesSnapshot = await getDocs(rolesQuery);
      const userRoles = rolesSnapshot.docs.map(doc => doc.data().role as AppRole);
      setRoles(userRoles);

    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create profile for new user
    const newProfile: UserProfile = {
      id: userCredential.user.uid,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setDoc(doc(db, "profiles", userCredential.user.uid), newProfile);

    // Auto-assign owner role to admin email
    if (email === "teamsg697@gmail.com") {
      await setDoc(doc(db, "user_roles", `${userCredential.user.uid}_owner`), {
        user_id: userCredential.user.uid,
        role: "owner",
        email: email,
        created_at: new Date().toISOString(),
      });
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      if (currentUser) {
        // Ensure admin has owner role
        await ensureAdminOwnerRole(currentUser);
        refresh();
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        isLoading,
        isAuthenticated: !!user,
        isOwner: roles.includes("owner"),
        isElectrician: roles.includes("electrician"),
        refresh,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
