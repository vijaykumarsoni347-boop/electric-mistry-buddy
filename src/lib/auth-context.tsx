import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

type AppRole = "owner" | "electrician";

interface AuthContextValue {
  user: User | null;
  profile: Tables<"profiles"> | null;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isElectrician: boolean;
  refresh: () => Promise<void>;
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
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUser(null);
        setProfile(null);
        setRoles([]);
        return;
      }

      setUser(userData.user);

      const [{ data: profileData }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userData.user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", userData.user.id),
      ]);

      setProfile(profileData || null);
      setRoles((rolesData?.map((r) => r.role) as AppRole[]) || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        refresh();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
