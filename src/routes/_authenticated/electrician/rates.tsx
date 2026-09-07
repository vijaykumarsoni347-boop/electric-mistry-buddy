import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getProducts } from "@/lib/shop.functions";
import { ElectricianShell } from "@/components/electrician-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Search, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/electrician/rates")({
  component: RateList,
  head: () => ({
    meta: [
      { title: "Rate List & Bill Estimate | Mistri Panel" },
      {
        name: "description",
        content:
          "Har saman ka retail rate aur aapka commission dekhein, aur customer ka bill pehle se estimate karein.",
      },
      { property: "og:title", content: "Rate List & Bill Estimate | Mistri Panel" },
      {
        property: "og:description",
        content: "Saman ke rate, commission aur bill estimate ek jagah.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function RateList() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products || []).filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const setQty = (id: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const selected = (products || []).filter((p) => cart[p.id]);
  const billTotal = selected.reduce(
    (s, p) => s + Number(p.retail_price) * (cart[p.id] ?? 0),
    0
  );
  const commission = selected.reduce(
    (s, p) => s + (Number(p.retail_price) - Number(p.wholesale_price)) * (cart[p.id] ?? 0),
    0
  );

  return (
    <ElectricianShell title="Saman ke Rate">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Saman ka naam likhein..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Thoda rukiye...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const margin = Number(p.retail_price) - Number(p.wholesale_price);
            const qty = cart[p.id] || 0;
            return (
              <Card key={p.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[p.category, p.brand].filter(Boolean).join(" • ") || "—"}
                        {p.sku ? ` · ${p.sku}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">₹{Number(p.retail_price).toFixed(2)}</p>
                      <p className="text-xs text-primary">Mera Hissa ₹{margin.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Bacha: {p.stock_quantity}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQty(p.id, qty - 1)}
                        disabled={qty === 0}
                        aria-label="Kam karein"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-sm">{qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQty(p.id, qty + 1)}
                        aria-label="Badhayein"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-muted-foreground">Koi saman nahi mila</p>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 border-t bg-card p-3 shadow-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Grahak ka bill</span>
            <span className="font-bold text-lg">₹{billTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mera Hissa</span>
            <span className="font-bold text-primary">₹{commission.toFixed(2)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setCart({})}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Sab Hatao
          </Button>
        </div>
      )}
    </ElectricianShell>
  );
}
