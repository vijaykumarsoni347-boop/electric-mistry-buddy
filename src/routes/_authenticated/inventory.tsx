import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/shop.functions";
import { OwnerShell } from "@/components/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EditingProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  wholesale_price: number;
  retail_price: number;
  low_stock_threshold: number;
}

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingProduct | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      toast.success("Product add ho gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      toast.success("Product update ho gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product delete ho gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name") as string,
      sku: (fd.get("sku") as string) || undefined,
      category: (fd.get("category") as string) || undefined,
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

  return (
    <OwnerShell title="Inventory">
      <main className="p-4 space-y-3">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing(null)}>+ Naya Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Product" : "Naya Product"}</DialogTitle>
              </DialogHeader>
              <ProductForm onSubmit={handleSubmit} editing={editing} />
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          products?.map((p) => (
            <Card key={p.id} className={p.stock_quantity < p.low_stock_threshold ? "border-destructive/50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.category || "No category"}</p>
                    <p className="text-sm">Stock: {p.stock_quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">WS: ₹{p.wholesale_price}</p>
                    <p className="text-sm font-medium">RT: ₹{p.retail_price}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditing({
                        id: p.id,
                        name: p.name,
                        sku: p.sku || "",
                        category: p.category || "",
                        stock_quantity: p.stock_quantity,
                        wholesale_price: p.wholesale_price,
                        retail_price: p.retail_price,
                        low_stock_threshold: p.low_stock_threshold,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ data: { id: p.id } })}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}

function ProductForm({
  onSubmit,
  editing,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editing: EditingProduct | null;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 pt-2">
      <div>
        <Label>Naam</Label>
        <Input name="name" defaultValue={editing?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>SKU</Label>
          <Input name="sku" defaultValue={editing?.sku} />
        </div>
        <div>
          <Label>Category</Label>
          <Input name="category" defaultValue={editing?.category} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Stock</Label>
          <Input name="stock_quantity" type="number" defaultValue={editing?.stock_quantity ?? 0} required />
        </div>
        <div>
          <Label>Low Stock Alert</Label>
          <Input name="low_stock_threshold" type="number" defaultValue={editing?.low_stock_threshold ?? 10} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Wholesale Price</Label>
          <Input name="wholesale_price" type="number" step="0.01" defaultValue={editing?.wholesale_price ?? 0} required />
        </div>
        <div>
          <Label>Retail Price</Label>
          <Input name="retail_price" type="number" step="0.01" defaultValue={editing?.retail_price ?? 0} required />
        </div>
      </div>
      <Button type="submit" className="w-full">{editing ? "Update" : "Add"} Product</Button>
    </form>
  );
}
