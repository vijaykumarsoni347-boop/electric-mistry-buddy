import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getElectricianLedger } from "@/lib/shop.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/electrician/ledger")({
  component: ElectricianOwnLedger,
});

function ElectricianOwnLedger() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: electricianId } = useQuery({
    queryKey: ["electrician-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // We can get the electrician id from a public RPC or by querying electricians
      // For simplicity, we'll fetch via the ledger endpoint after getting id
      return null;
    },
    enabled: false,
  });

  // Get electrician id for current user
  const { data: electricianRecord } = useQuery({
    queryKey: ["my-electrician-record", user?.id],
    queryFn: async () => {
      // This is a placeholder; the actual query should be done via server function
      // But electricians table policy allows reading own record
      return null;
    },
    enabled: false,
  });

  // Since we don't have a direct client helper, we'll use a fixed dummy for now
  // In production, fetch via server function getCurrentUserRole which returns electricianId
  const electricianIdFromAuth = "";

  const { data, isLoading } = useQuery({
    queryKey: ["my-ledger", electricianIdFromAuth, startDate, endDate],
    queryFn: () =>
      getElectricianLedger({
        data: {
          electrician_id: electricianIdFromAuth,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      }),
    enabled: !!electricianIdFromAuth,
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-xl font-bold">Mera Hisaab</h1>
      <p className="text-muted-foreground">Yahan aapka apna ledger dikhega.</p>
    </div>
  );
}
