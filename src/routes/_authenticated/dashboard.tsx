import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/shop.functions";
import { OwnerShell } from "@/components/owner-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Users, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", today],
    queryFn: () => getDashboardSummary({ data: { date: today } }),
  });

  return (
    <OwnerShell title="Aaj ka Hisaab">
      <div className="p-4 pb-2">
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("hi-IN")}</p>
      </div>

      <main className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard title="Total Sales" value={data?.totalSales || 0} prefix="" />
              <SummaryCard title="Retail" value={data?.totalRetail || 0} />
              <SummaryCard title="Wholesale" value={data?.totalWholesale || 0} />
              <SummaryCard title="Margin" value={data?.totalMargin || 0} highlight />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{data?.totalPayments.toFixed(2) || "0.00"}</p>
                <p className="text-sm text-muted-foreground">Mistriyon ko aaj diya gaya</p>
              </CardContent>
            </Card>

            {data?.lowStock && data.lowStock.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Low Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.lowStock.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span className="font-medium">{p.stock_quantity} left</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Link to="/inventory">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <Package className="h-5 w-5" />
                  Inventory
                </Button>
              </Link>
              <Link to="/billing">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <ShoppingCart className="h-5 w-5" />
                  Billing
                </Button>
              </Link>
              <Link to="/electricians">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <Users className="h-5 w-5" />
                  Mistri
                </Button>
              </Link>
              <Link to="/settlement">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                  <ClipboardList className="h-5 w-5" />
                  Settlement
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  prefix = "₹",
  highlight,
}: {
  title: string;
  value: number;
  prefix?: string;
  highlight?: boolean;
}) {
  const display = prefix ? `${prefix}${value.toFixed(2)}` : value;
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
