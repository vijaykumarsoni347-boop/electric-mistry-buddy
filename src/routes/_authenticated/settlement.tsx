import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getDailySettlement, recordPayment } from "@/lib/shop.functions";
import { OwnerShell } from "@/components/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settlement")({
  component: SettlementPage,
});

function SettlementPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paying, setPaying] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"cash" | "credit" | "upi" | "other">("cash");

  const { data: settlement, isLoading } = useQuery({
    queryKey: ["settlement", date],
    queryFn: () => getDailySettlement({ data: { date } }),
  });

  const paymentMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlement"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setPaying(null);
      setAmount("");
      toast.success("Payment record ho gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const handlePayment = () => {
    if (!paying) return;
    paymentMutation.mutate({
      data: {
        electrician_id: paying.id,
        amount: Number(amount),
        payment_mode: mode,
      },
    });
  };

  const totalBalance = settlement?.reduce((sum, s) => sum + s.balance, 0) || 0;

  return (
    <OwnerShell title="Daily Settlement">
      <main className="p-4 space-y-4">
        <div>
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">₹{totalBalance.toFixed(2)}</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-3">
            {settlement?.map((s) => (
              <Card key={s.electrician.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{s.electrician.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Sales: ₹{s.totalRetail.toFixed(2)} | Margin: ₹{s.margin.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid: ₹{s.totalPaid.toFixed(2)} | Bills: {s.salesCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${s.balance > 0 ? "text-primary" : ""}`}>
                        ₹{s.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Dialog open={!!paying && paying.id === s.electrician.id} onOpenChange={(v) => !v && setPaying(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPaying({ id: s.electrician.id, name: s.electrician.name, balance: s.balance })}
                        >
                          Payment Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Payment - {paying?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                          <div>
                            <Label>Amount</Label>
                            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                          </div>
                          <div>
                            <Label>Mode</Label>
                            <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="credit">Credit</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full" onClick={handlePayment} disabled={paymentMutation.isPending}>
                            Record Payment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
