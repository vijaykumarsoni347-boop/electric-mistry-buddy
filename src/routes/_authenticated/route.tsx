import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isOwner, isElectrician } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate({ to: "/auth", replace: true });
      return;
    }

    if (isElectrician && !isOwner) {
      const path = window.location.pathname;
      if (!path.startsWith("/electrician")) {
        navigate({ to: "/electrician/ledger", replace: true });
      }
    }
  }, [isLoading, isAuthenticated, isOwner, isElectrician, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
