import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  deleteCategory,
} from "@/lib/shop.functions";
import { OwnerShell } from "@/components/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EditingProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category_id: string;
  stock_quantity: number;
  wholesale_price: number;
  retail_price: number;
  low_stock_threshold: number;
}

interface Category {
  id: string;
  name: string;
}

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<EditingProduct | null>(null);
  const [activeCat, setActiveCat] = useState<string>("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };
  const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : "Kuch galat ho gaya");

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success("Saman jud gaya");
    },
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success("Saman badal gaya");
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      invalidate();
      toast.success("Saman hat gaya");
    },
    onError,
  });

  const addCatMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      invalidate();
      setNewCat("");
      toast.success("Category jud gayi");
    },
    onError,
  });

  const delCatMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      invalidate();
      toast.success("Category hat gayi");
    },
    onError,
  });

  const cats: Category[] = (categories ?? []).map((c) => ({ id: c.id, name: c.name }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const categoryId = (fd.get("category_id") as string) || "";
    if (!categoryId) {
      toast.error("Pehle category chunein");
      return;
    }
    const payload = {
      name: fd.get("name") as string,
      sku: (fd.get("sku") as string) || undefined,
      brand: (fd.get("brand") as string) || undefined,
      category_id: categoryId,
      category: cats.find((c) => c.id === categoryId)?.name,
      stock_quantity: Number(fd.get("stock_quantity")),
      wholesale_price: Number(fd.get("wholesale_price")),
      retail_price: Number(fd.get("retail_price")),
      low_stock_threshold: Number(fd.get("low_stock_threshold")),
    };

    if (editing) {
      updateMutation.mutate({ data: { ...payload, id: editing.id } });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const list = (products ?? []).filter((p) =>
    activeCat === "all" ? true : p.category_id === activeCat,
  );

  const openNew = () => {
    if (cats.length === 0) {
      toast.error("Pehle ek category banao (jaise Switch, Socket)");
      setCatOpen(true);
      return;
    }
    setEditing(null);
    setOpen(true);
  };

  return (
    <OwnerShell title="Saman ki List">
      <main className="p-4 space-y-3">
        <div className="flex gap-2">
          <Button className="flex-1 h-12 text-base" onClick={openNew}>
            + Naya Saman
          </Button>
          <Button variant="outline" className="h-12 text-base" onClick={() => setCatOpen(true)}>
            Category
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={activeCat === "all" ? "default" : "outline"}
            onClick={() => setActiveCat("all")}
          >
            Sab
          </Button>
          {cats.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={activeCat === c.id ? "default" : "outline"}
              onClick={() => setActiveCat(c.id)}
              className="shrink-0"
            >
              {c.name}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p>Thoda rukiye...</p>
        ) : list.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Yahan koi saman nahi hai</p>
        ) : (
          list.map((p) => (
            <Card
              key={p.id}
              className={p.stock_quantity < p.low_stock_threshold ? "border-destructive/50" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {[p.category, p.brand].filter(Boolean).join(" • ")}
                    </p>
                    <p className="text-sm">
                      Bacha: {p.stock_quantity}
                      {p.stock_quantity < p.low_stock_threshold && (
                        <span className="text-destructive font-medium"> — khatam ho raha hai!</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Lagat: ₹{p.wholesale_price}</p>
                    <p className="text-sm font-medium">Grahak ka rate: ₹{p.retail_price}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing({
                        id: p.id,
                        name: p.name,
                        sku: p.sku || "",
                        brand: p.brand || "",
                        category_id: p.category_id || "",
                        stock_quantity: p.stock_quantity,
                        wholesale_price: p.wholesale_price,
                        retail_price: p.retail_price,
                        low_stock_threshold: p.low_stock_threshold,
                      });
                      setOpen(true);
                    }}
                  >
                    Badlo
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ data: { id: p.id } })}
                  >
                    Hatao
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Saman Badlo" : "Naya Saman"}</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={handleSubmit} editing={editing} cats={cats} />
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Category (Saman ki Tarah)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder="jaise Switch, Socket, Wire"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="h-12"
              />
              <Button
                className="h-12"
                disabled={!newCat.trim() || addCatMutation.isPending}
                onClick={() => addCatMutation.mutate({ data: { name: newCat.trim() } })}
              >
                Jodo
              </Button>
            </div>
            {cats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Abhi koi category nahi hai</p>
            ) : (
              cats.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <span className="font-medium">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => delCatMutation.mutate({ data: { id: c.id } })}
                  >
                    Hatao
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </OwnerShell>
  );
}

function ProductForm({
  onSubmit,
  editing,
  cats,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editing: EditingProduct | null;
  cats: Category[];
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 pt-2">
      <div>
        <Label>Category (Saman ki Tarah)</Label>
        <select
          name="category_id"
          defaultValue={editing?.category_id ?? ""}
          required
          className="w-full h-12 rounded-md border border-input bg-background px-3 text-base"
        >
          <option value="">— Chunein —</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Company</Label>
          <Input name="brand" defaultValue={editing?.brand} placeholder="Anchor, Great White" />
        </div>
        <div>
          <Label>Saman ka Naam</Label>
          <Input name="name" defaultValue={editing?.name} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Code (SKU)</Label>
          <Input name="sku" defaultValue={editing?.sku} />
        </div>
        <div>
          <Label>Kitna Hai (Stock)</Label>
          <Input name="stock_quantity" type="number" defaultValue={editing?.stock_quantity ?? 0} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Lagat (Aapka Rate)</Label>
          <Input name="wholesale_price" type="number" step="0.01" defaultValue={editing?.wholesale_price ?? 0} required />
        </div>
        <div>
          <Label>Grahak Ka Rate</Label>
          <Input name="retail_price" type="number" step="0.01" defaultValue={editing?.retail_price ?? 0} required />
        </div>
      </div>
      <div>
        <Label>Kam Hone Par Bataye</Label>
        <Input name="low_stock_threshold" type="number" defaultValue={editing?.low_stock_threshold ?? 10} required />
      </div>
      <Button type="submit" className="w-full h-12 text-base">
        {editing ? "Badlav Save Karein" : "Saman Jodo"}
      </Button>
    </form>
  );
}
