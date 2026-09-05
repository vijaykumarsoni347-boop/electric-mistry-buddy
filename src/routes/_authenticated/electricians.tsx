import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getElectricians, createElectrician, updateElectrician, deleteElectrician } from "@/lib/shop.functions";
import { OwnerShell } from "@/components/owner-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/electricians")({
  component: ElectriciansPage,
});

interface EditingElectrician {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  commission_percent: number;
  is_active: boolean;
}

function ElectriciansPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditingElectrician | null>(null);

  const { data: electricians, isLoading } = useQuery({
    queryKey: ["electricians"],
    queryFn: () => getElectricians(),
  });

  const createMutation = useMutation({
    mutationFn: createElectrician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electricians"] });
      setOpen(false);
      toast.success("Mistri add ho gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const updateMutation = useMutation({
    mutationFn: updateElectrician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electricians"] });
      setEditing(null);
      setOpen(false);
      toast.success("Mistri update ho gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteElectrician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electricians"] });
      toast.success("Mistri delete ho gaya");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name") as string,
      phone: (fd.get("phone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      commission_percent: Number(fd.get("commission_percent")) || 0,
    };

    if (editing) {
      updateMutation.mutate({
        data: { ...payload, id: editing.id, is_active: editing.is_active },
      });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  return (
    <OwnerShell title="Mistri Directory">
      <main className="p-4 space-y-3">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing(null)}>+ Naya Mistri</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Mistri" : "Naya Mistri"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div>
                <Label>Naam</Label>
                <Input name="name" defaultValue={editing?.name} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={editing?.phone} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={editing?.email} />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input name="address" defaultValue={editing?.address} />
              </div>
              <div>
                <Label>Commission %</Label>
                <Input name="commission_percent" type="number" defaultValue={editing?.commission_percent ?? 0} />
              </div>
              {editing && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.is_active}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
              )}
              <Button type="submit" className="w-full">{editing ? "Update" : "Add"} Mistri</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          electricians?.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{e.name}</h3>
                    <p className="text-sm text-muted-foreground">{e.phone || "No phone"}</p>
                    <p className="text-sm">Commission: {e.commission_percent}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{e.is_active ? "Active" : "Inactive"}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditing({
                        id: e.id,
                        name: e.name,
                        phone: e.phone || "",
                        email: e.email || "",
                        address: e.address || "",
                        commission_percent: e.commission_percent,
                        is_active: e.is_active,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Link to="/ledger/$electricianId" params={{ electricianId: e.id }}>
                    <Button variant="secondary" size="sm">Ledger</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ data: { id: e.id } })}
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
