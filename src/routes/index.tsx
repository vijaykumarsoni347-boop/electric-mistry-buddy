import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Electrical Shop Manager
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Apni dukaan ka stock, billing, aur mistri ka hisaab ek jagah par.
      </p>
      <div className="mt-8">
        <Link to="/auth">
          <Button size="lg">Shuru karein</Button>
        </Link>
      </div>
    </div>
  );
}
