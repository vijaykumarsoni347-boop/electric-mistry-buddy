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
import { Checkbox } from "@/components/ui/checkbox";
import { makeProductPdf, shareOrDownloadPdf } from "@/lib/product-pdf";
import { uploadProductImage, resolveImageUrls } from "@/lib/product-image";
import { toast } from "sonner";

const DELETE_PASSWORD = "Qwertyuiop@9955";

interface EditingProduct {
  id: string;
  name: string;
  sku: string;
  brand: string;
  image_url: string;
  category_id: string;
  stock_quantity: number;
  cost_price: number;
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletePwd, setDeletePwd] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const imageKeys = (products ?? []).map((p) => p.image_url).filter(Boolean) as string[];
  const { data: imageMap } = useQuery({
    queryKey: ["product-images", imageKeys.slice().sort().join(",")],
    queryFn: () => resolveImageUrls(imageKeys),
    enabled: imageKeys.length > 0,
  });
  const imgSrc = (v?: string | null) => (v ? imageMap?.[v] : undefined);

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
      setDeleteTarget(null);
      setDeletePwd("");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const categoryId = (fd.get("category_id") as string) || "";
    if (!categoryId) {
      toast.error("Pehle category chunein");
      return;
    }

    let imageValue = editing?.image_url ?? "";
    const file = fd.get("image_file") as File | null;
    if (file && file.size > 0) {
      setUploading(true);
      try {
        imageValue = await uploadProductImage(file);
      } catch {
        setUploading(false);
        toast.error("Photo upload nahi hui, dobara try karein");
        return;
      }
      setUploading(false);
    }

    const payload = {
      name: fd.get("name") as string,
      sku: (fd.get("sku") as string) || undefined,
      brand: (fd.get("brand") as string) || undefined,
      image_url: imageValue,
      category_id: categoryId,
      category: cats.find((c) => c.id === categoryId)?.name,
      stock_quantity: Number(fd.get("stock_quantity")),
      cost_price: Number(fd.get("cost_price")),
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

  const confirmDelete = () => {
    if (deletePwd !== DELETE_PASSWORD) {
      toast.error("Password galat hai");
      return;
    }
    if (deleteTarget) deleteMutation.mutate({ data: { id: deleteTarget.id } });
  };

  const toggleSel = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const makePdf = async () => {
    const chosen = list.filter((p) => selected.includes(p.id));
    if (chosen.length === 0) {
      toast.error("Pehle saman tick karein");
      return;
    }
    setPdfBusy(true);
    try {
      const urls = await resolveImageUrls(chosen.map((p) => p.image_url).filter(Boolean) as string[]);
      const blob = await makeProductPdf(
        chosen.map((p) => ({ ...p, image_url: p.image_url ? (urls[p.image_url] ?? null) : null })),
      );
      const how = await shareOrDownloadPdf(blob, `rate-list-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(how === "shared" ? "PDF bhej diya" : "PDF save ho gaya");
      setSelectMode(false);
      setSelected([]);
    } catch {
      toast.error("PDF nahi ban paya, dobara try karein");
    } finally {
      setPdfBusy(false);
    }
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

        {selectMode ? (
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <p className="text-sm font-medium">Jo saman PDF me chahiye, unhe tick karein ({selected.length} chune)</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelected(list.map((p) => p.id))}
              >
                Sab Tick
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelected([])}>
                Sab Hatao
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 h-12 text-base" disabled={pdfBusy} onClick={makePdf}>
                {pdfBusy ? "Ban raha hai..." : "PDF Banao aur Bhejo"}
              </Button>
              <Button
                variant="ghost"
                className="h-12"
                onClick={() => {
                  setSelectMode(false);
                  setSelected([]);
                }}
              >
                Band
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            className="w-full h-12 text-base"
            onClick={() => {
              setSelectMode(true);
              setSelected(list.map((p) => p.id));
            }}
          >
            📄 Rate List PDF Bhejo
          </Button>
        )}


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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {selectMode && (
                      <Checkbox
                        checked={selected.includes(p.id)}
                        onCheckedChange={() => toggleSel(p.id)}
                        aria-label={`${p.name} PDF me shamil karein`}
                        className="mt-1 h-6 w-6"
                      />
                    )}
                    {imgSrc(p.image_url) && (
                      <img
                        src={imgSrc(p.image_url)}
                        alt={`${p.name} ka photo`}
                        loading="lazy"
                        className="h-14 w-14 rounded-md object-cover border"
                      />
                    )}
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
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-muted-foreground">Lagat: ₹{p.cost_price}</p>
                    <p className="text-sm">Mistri ka rate: ₹{p.wholesale_price}</p>
                    <p className="text-sm font-medium">Grahak ka rate: ₹{p.retail_price}</p>
                    <p className="text-sm text-green-600 font-medium">
                      Mera Profit: ₹{Number(p.wholesale_price) - Number(p.cost_price)}
                    </p>
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
                        image_url: p.image_url || "",
                        category_id: p.category_id || "",
                        stock_quantity: p.stock_quantity,
                        cost_price: p.cost_price,
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
                    onClick={() => {
                      setDeletePwd("");
                      setDeleteTarget({ id: p.id, name: p.name });
                    }}
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
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) {
            setDeleteTarget(null);
            setDeletePwd("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saman Hatana Hai?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm">
              <span className="font-semibold">{deleteTarget?.name}</span> hamesha ke liye hat jayega. Hataane ke liye
              password daalein.
            </p>
            <Input
              type="password"
              className="h-12 text-base"
              placeholder="Password"
              value={deletePwd}
              autoComplete="off"
              onChange={(e) => setDeletePwd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmDelete();
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePwd("");
                }}
              >
                Rehne Do
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-12"
                disabled={!deletePwd || deleteMutation.isPending}
                onClick={confirmDelete}
              >
                {deleteMutation.isPending ? "Ho raha hai..." : "Hatao"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


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
          <ProductForm onSubmit={handleSubmit} editing={editing} cats={cats} busy={uploading} />
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
      <div>
        <Label>Saman ki Photo</Label>
        <Input name="image_file" type="file" accept="image/*" className="h-12 text-base" />
        <p className="text-xs text-muted-foreground mt-1">
          Phone se photo chunein ya camera se kheenchein. {editing?.image_url ? "Nahi chunenge to purani photo rahegi." : ""}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Lagat (aapne kitne ka khareeda)</Label>
          <Input name="cost_price" type="number" step="0.01" defaultValue={editing?.cost_price ?? 0} required />
        </div>
        <div>
          <Label>Mistri Ka Rate</Label>
          <Input name="wholesale_price" type="number" step="0.01" defaultValue={editing?.wholesale_price ?? 0} required />
        </div>
      </div>
      <div>
        <Label>Grahak Ka Rate</Label>
        <Input name="retail_price" type="number" step="0.01" defaultValue={editing?.retail_price ?? 0} required />
      </div>
      <div>
        <Label>Stock kam hone ki chetavni</Label>
        <Input name="low_stock_threshold" type="number" defaultValue={editing?.low_stock_threshold ?? 10} required />
        <p className="text-xs text-muted-foreground mt-1">
          Jab itne se kam saman bachega, app laal rang mein "khatam ho raha hai" dikha degi. Jaise 10 likha to 9 bachne
          par chetavni.
        </p>
      </div>
      <Button type="submit" className="w-full h-12 text-base">
        {editing ? "Badlav Save Karein" : "Saman Jodo"}
      </Button>
    </form>
  );
}
