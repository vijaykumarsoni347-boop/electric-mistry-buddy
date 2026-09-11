import { db } from "@/integrations/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Admin email that should have owner permissions
const ADMIN_EMAIL = "teamsg697@gmail.com";

/**
 * Ensure admin user has owner role
 * Call this function with user object when admin logs in
 */
export async function ensureAdminOwnerRole(user: any) {
  if (!user || user.email !== ADMIN_EMAIL) {
    return;
  }

  try {
    // Check if user already has owner role
    const roleDoc = await getDoc(doc(db, "user_roles", `${user.uid}_owner`));
    
    if (!roleDoc.exists()) {
      // Assign owner role to admin
      await setDoc(doc(db, "user_roles", `${user.uid}_owner`), {
        user_id: user.uid,
        role: "owner",
        email: user.email,
        created_at: new Date().toISOString(),
      });
      console.log("Owner role assigned to admin:", user.email);
    }
  } catch (error) {
    console.error("Error assigning owner role to admin:", error);
  }
}

/**
 * Manually assign owner role to admin (use in console or debugging)
 */
export async function manuallyAssignOwnerRole(userId: string, email: string) {
  if (email !== ADMIN_EMAIL) {
    throw new Error("Only admin email can be assigned owner role");
  }

  await setDoc(doc(db, "user_roles", `${userId}_owner`), {
    user_id: userId,
    role: "owner",
    email: email,
    created_at: new Date().toISOString(),
  });

  console.log("Owner role manually assigned to:", email);
  return true;
}
