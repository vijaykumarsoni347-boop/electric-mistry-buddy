import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
});

function BillingPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="text-muted-foreground">Yahan bill banega.</p>
    </div>
  );
}
