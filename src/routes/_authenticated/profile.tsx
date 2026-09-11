import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, {
        full_name: formData.full_name,
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      });
      
      toast.success("Profile update ho gaya");
      setIsEditing(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Profile update mein error aaya");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>Apna profile information manage karein</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">Email change nahi kar sakte</p>
            </div>

            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Apna naam daalein"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number daalein"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <p className="text-lg font-medium">{profile?.full_name || "Not set"}</p>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <p className="text-lg font-medium">{profile?.phone || "Not set"}</p>
                </div>

                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Account Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">User ID:</span> {user.uid}</p>
              <p><span className="font-medium">Email Verified:</span> {user.emailVerified ? "Yes" : "No"}</p>
              <p><span className="font-medium">Created:</span> {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
