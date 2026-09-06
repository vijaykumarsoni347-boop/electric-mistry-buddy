import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getElectricianLedger } from "@/lib/shop.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/ledger/$electricianId")({
  component: LedgerPage,
});

function LedgerPage() {
  const { electricianId } = Route.useParams();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ledger", electricianId, startDate, endDate],
    queryFn: () =>
      getElectricianLedger({
        data: {
          electrician_id: electricianId,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      }),
  });

  const totalSales = (data?.sales || []).reduce((sum, s) => sum + s.total_retail, 0);
  const totalMargin = (data?.sales || []).reduce(
    (sum, s) => sum + (s.total_retail - s.total_wholesale),
    0
  );
  const totalPaid = (data?.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const balance = totalMargin - totalPaid;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card p-4">
        <h1 className="text-xl font-bold">Mistri ka Hisab</h1>
      </header>

      <main className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Kab Se</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Kab Tak</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Kul Hissa</p>
              <p className="text-xl font-bold">₹{totalMargin.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Baaki Paisa</p>
              <p className={`text-xl font-bold ${balance > 0 ? "text-primary" : ""}`}>₹{balance.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <p>Thoda rukiye...</p>
        ) : (
          <>
            <h2 className="font-semibold">Bills</h2>
            <div className="space-y-2">
              {data?.sales.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <span>{new Date(s.sale_date).toLocaleDateString("hi-IN")}</span>
                      <span className="font-bold">₹{s.total_retail.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Hissa: ₹{(s.total_retail - s.total_wholesale).toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
              {data?.sales.length === 0 && <p className="text-muted-foreground">Koi bill nahi</p>}
            </div>

            <h2 className="font-semibold">Paise Diye</h2>
            <div className="space-y-2">
              {data?.payments.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <span>{new Date(p.payment_date).toLocaleDateString("hi-IN")}</span>
                      <span className="font-bold text-green-600">-₹{p.amount.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.payment_mode}</p>
                  </CardContent>
                </Card>
              ))}
              {data?.payments.length === 0 && <p className="text-muted-foreground">Koi payment nahi</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
