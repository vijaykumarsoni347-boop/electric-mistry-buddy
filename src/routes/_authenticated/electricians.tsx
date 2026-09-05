import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/electricians")({
  component: ElectriciansPage,
});

function ElectriciansPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Mistri Directory</h1>
      <p className="text-muted-foreground">Yahan mistriyon ki list hogi.</p>
    </div>
  );
}
