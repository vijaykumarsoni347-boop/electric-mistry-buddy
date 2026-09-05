import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Auth state is checked client-side via the AuthProvider.
    // This layout relies on the AuthProvider being mounted in __root.tsx.
    // We defer the actual redirect to the component to avoid SSR issues.
    return { location };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoading, isAuthenticated, isOwner, isElectrician } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    throw redirect({ to: "/auth" });
  }

  if (isElectrician && !isOwner) {
    const path = window.location.pathname;
    if (!path.startsWith("/electrician")) {
      throw redirect({ to: "/electrician/ledger" });
    }
  }

  return <Outlet />;
}
