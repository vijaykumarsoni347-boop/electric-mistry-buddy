import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/ledger/$electricianId")({
  component: LedgerPage,
});

function LedgerPage() {
  const { electricianId } = Route.useParams();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Ledger</h1>
      <p className="text-muted-foreground">Electrician ID: {electricianId}</p>
    </div>
  );
}
