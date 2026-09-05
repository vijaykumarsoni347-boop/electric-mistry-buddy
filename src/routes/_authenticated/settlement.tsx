import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settlement")({
  component: SettlementPage,
});

function SettlementPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Daily Settlement</h1>
      <p className="text-muted-foreground">Yahan shaam ka hisaab hoga.</p>
    </div>
  );
}
