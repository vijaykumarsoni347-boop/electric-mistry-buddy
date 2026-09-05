import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/electrician/ledger")({
  component: ElectricianLedgerPage,
});

function ElectricianLedgerPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mera Hisaab</h1>
      <p className="text-muted-foreground">Yahan aapka ledger dikhega.</p>
    </div>
  );
}
