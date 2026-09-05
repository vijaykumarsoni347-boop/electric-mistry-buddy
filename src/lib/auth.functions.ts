import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCurrentUserRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rolesData, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (rolesError) throw new Error(rolesError.message);

    const roles = (rolesData?.map((r) => r.role) as ("owner" | "electrician")[]) || [];

    let electricianId: string | null = null;
    if (roles.includes("electrician")) {
      const { data, error } = await context.supabase
        .rpc("get_electrician_id_for_user", { _user_id: context.userId });
      if (error) throw new Error(error.message);
      electricianId = data || null;
    }

    return { roles, electricianId };
  });

export const registerUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        role: z.enum(["owner", "electrician"]),
        email: z.string().email(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("register_user", {
      _user_id: context.userId,
      _role: data.role,
      _email: data.email,
    });

    if (error) throw new Error(error.message);
    return { success: result === true };
  });
