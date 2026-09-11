import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/integrations/firebase";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

export const getCurrentUserRole = createServerFn({ method: "GET" })
  .handler(async () => {
    // This function now needs to be called with user ID from client
    // For now, return empty structure
    return { roles: [], electricianId: null };
  });

export const registerUser = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        userId: z.string(),
        role: z.enum(["owner", "electrician"]),
        email: z.string().email(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    // Create user role in Firestore
    const roleData = {
      user_id: data.userId,
      role: data.role,
      email: data.email,
      created_at: new Date().toISOString(),
    };
    
    await setDoc(doc(db, "user_roles", `${data.userId}_${data.role}`), roleData);

    // If electrician, create electrician record
    if (data.role === "electrician") {
      const electricianData = {
        id: data.userId,
        user_id: data.userId,
        name: "",
        phone: "",
        rate_per_unit: 0,
        balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await setDoc(doc(db, "electricians", data.userId), electricianData);
    }

    return { success: true };
  });
