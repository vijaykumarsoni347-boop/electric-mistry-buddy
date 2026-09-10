import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getProducts, getElectricians, createSale } from "@/lib/shop.functions";
import { OwnerShell } from "@/components/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ScanLine, Camera } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";

export const Route = createFileRoute("/_authenticated/billing")({
  component: BillingPage,
});

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  retail_price: number;
  wholesale_price: number;
}

const money = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

function BillingPage() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [scan, setScan] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [electricianId, setElectricianId] = useState<string>("none");
  const [paymentMode, setPaymentMode] = useState<"cash" | "credit" | "upi" | "other">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const scanRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: electricians } = useQuery({
    queryKey: ["electricians"],
    queryFn: () => getElectricians(),
  });

  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products || []).filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setCart([]);
      setCustomerName("");
      setElectricianId("none");
      setAmountPaid("");
      toast.success("Bill ban gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kuch gadbad ho gayi"),
  });

  const addToCart = (product: NonNullable<typeof products>[number]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
        },
      ];
    });
  };

  const handleScan = (code: string) => {
    const c = code.trim().toLowerCase();
    if (!c) return;
    const hit = (products || []).find(
      (p) => (p.barcode || "").toLowerCase() === c || (p.sku || "").toLowerCase() === c
    );
    if (hit) {
      addToCart(hit);
      toast.success(`${hit.name} bill me jud gaya`);
      setScan("");
    } else {
      toast.error("Is bar code ka saman nahi mila");
      setSearch(code.trim());
      setScan("");
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product_id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const totalRetail = cart.reduce((sum, i) => sum + i.retail_price * i.quantity, 0);
  const totalWholesale = cart.reduce((sum, i) => sum + i.wholesale_price * i.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Pehle saman chunein");
      return;
    }
    saleMutation.mutate({
      data: {
        customer_name: customerName,
        electrician_id: electricianId === "none" ? null : electricianId,
        payment_mode: paymentMode,
        amount_paid: Number(amountPaid) || 0,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          retail_price: i.retail_price,
          wholesale_price: i.wholesale_price,
        })),
      },
    });
  };

  return (
    <OwnerShell title="Bill Banao">
      <main className="p-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              ref={scanRef}
              className="pl-10 h-12 text-base"
              placeholder="Bar code scan karein"
              value={scan}
              autoComplete="off"
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScan(scan);
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Scanner uthaiye aur saman ka bar code scan karein — saman apne aap bill me jud jayega.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-12 text-base"
              placeholder="Ya naam / code likh kar dhoondein"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <h2 className="font-semibold">Saman Chunein</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Thoda rukiye...</p>
          ) : error ? (
            <p className="text-destructive">Saman nahi aaya, page dobara kholein</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredProducts.map((p) => (
                <Card key={p.id} className="cursor-pointer hover:bg-accent" onClick={() => addToCart(p)}>
                  <CardContent className="p-3 flex gap-3 items-center">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={`${p.name} ka photo`}
                        loading="lazy"
                        className="h-12 w-12 rounded-md object-cover border"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[p.brand, p.category].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-sm text-muted-foreground">Bacha: {p.stock_quantity}</p>
                      <p className="text-sm font-semibold">{money(p.retail_price)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">Koi saman nahi mila</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">Bill</h2>
          {cart.length === 0 ? (
            <p className="text-muted-foreground">Abhi kuch nahi liya</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <Card key={item.product_id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm">{money(item.retail_price)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="h-10 w-10 text-lg" onClick={() => updateQty(item.product_id, -1)}>-</Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button variant="outline" className="h-10 w-10 text-lg" onClick={() => updateQty(item.product_id, 1)}>+</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill ki Jankari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Grahak ka Naam</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label>Mistri (agar ho)</Label>
                <Select value={electricianId} onValueChange={setElectricianId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mistri chunein" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Koi mistri nahi</SelectItem>
                    {electricians?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Paise Kaise Mile</Label>
                <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as typeof paymentMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Nakad (Cash)</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="credit">Udhar</SelectItem>
                    <SelectItem value="other">Doosra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kitne Paise Mile</Label>
                <Input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              </div>
              <div className="flex justify-between border-t pt-3">
                <span>Bill Ka Total:</span>
                <span className="font-bold">{money(totalRetail)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Dukaan ki Lagat:</span>
                <span>{money(totalWholesale)}</span>
              </div>
              <Button className="w-full h-12 text-base" onClick={handleCheckout} disabled={saleMutation.isPending}>
                {saleMutation.isPending ? "Ho raha hai..." : "Bill Banao"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </OwnerShell>
  );
}
