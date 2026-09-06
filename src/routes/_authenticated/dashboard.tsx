import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/shop.functions";
import { OwnerShell } from "@/components/owner-shell";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Users, ClipboardList, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const money = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", today],
    queryFn: () => getDashboardSummary({ data: { date: today } }),
    enabled: isAuthenticated,
  });

  return (
    <OwnerShell title="Aaj ka Hisaab">
      <div className="p-4 pb-2">
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("hi-IN")}</p>
      </div>

      <main className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <p>Thoda rukiye...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard title="Aaj ke Bill" value={data?.totalSales || 0} isCount />
              <SummaryCard title="Grahak ka Paisa" value={data?.totalRetail || 0} />
              <SummaryCard title="Dukaan ki Lagat" value={data?.totalWholesale || 0} />
              <SummaryCard title="Mistri ka Hissa" value={data?.totalMargin || 0} highlight />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aaj Mistri ko Diye</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{money(data?.totalPayments || 0)}</p>
              </CardContent>
            </Card>

            {data?.lowStock && data.lowStock.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <TriangleAlert className="h-5 w-5" />
                    Ye Saman Khatam Ho Raha Hai
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.lowStock.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="font-medium">sirf {p.stock_quantity} bache</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Link to="/inventory">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 text-base">
                  <Package className="h-6 w-6" />
                  Saman
                </Button>
              </Link>
              <Link to="/billing">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 text-base">
                  <ShoppingCart className="h-6 w-6" />
                  Bill Banao
                </Button>
              </Link>
              <Link to="/electricians">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 text-base">
                  <Users className="h-6 w-6" />
                  Mistri
                </Button>
              </Link>
              <Link to="/settlement">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4 text-base">
                  <ClipboardList className="h-6 w-6" />
                  Hisab
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </OwnerShell>
  );
}

function SummaryCard({
  title,
  value,
  isCount,
  highlight,
}: {
  title: string;
  value: number;
  isCount?: boolean;
  highlight?: boolean;
}) {
  const display = isCount ? String(value) : money(value);
  return (
    <Card className={highlight ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-xl font-bold ${highlight ? "text-primary" : ""}`}>{display}</p>
      </CardContent>
    </Card>
  );
}
