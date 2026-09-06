import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, Package, ShoppingCart, Users, ClipboardList, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/billing", label: "Billing", icon: ShoppingCart },
  { to: "/electricians", label: "Mistri", icon: Users },
  { to: "/settlement", label: "Settlement", icon: ClipboardList },
];

export function OwnerShell({ children, title }: { children: ReactNode; title: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    await supabase.auth.signOut();
    // Pehle navigate karo, tabhi mounted queries unmount hongi;
    // clear() pehle karne se dashboard turant bina token ke refetch kar deta tha.
    await navigate({ to: "/auth", replace: true });
    queryClient.clear();
    toast.success("Logout ho gaya");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b bg-card p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      <main>{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-card px-2 pb-safe pt-2">
        <ul className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <li key={item.to}>
                <Link to={item.to}>
                  <div
                    className={`flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
