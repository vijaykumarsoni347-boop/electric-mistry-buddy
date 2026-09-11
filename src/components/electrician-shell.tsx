import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, ListOrdered, Wallet, User } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";

const navItems = [
  { to: "/electrician/rates", label: "Rate List", icon: ListOrdered },
  { to: "/electrician/ledger", label: "Mera Hisaab", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function ElectricianShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
    toast.success("Logout ho gaya");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 border-b bg-card p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-4 space-y-4">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 border-t bg-card grid grid-cols-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground [&.active]:text-primary [&.active]:font-semibold"
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
