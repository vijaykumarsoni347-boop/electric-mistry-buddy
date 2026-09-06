import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().email("Sahi email daalein"),
  password: z.string().min(6, "Password kam se kam 6 characters ka ho"),
});

type LoginForm = z.infer<typeof loginSchema>;

function AuthPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isOwner, isElectrician } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (isOwner) navigate({ to: "/dashboard", replace: true });
    else if (isElectrician) navigate({ to: "/electrician/ledger", replace: true });
  }, [isLoading, isAuthenticated, isOwner, isElectrician, navigate]);

  const onLogin = async (values: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Login ho gaya");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Electrical Shop Manager</CardTitle>
          <CardDescription>
            Apni dukaan ka hisaab rakhne ke liye login karein. Naya account sirf dukaan owner banata hai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...loginForm.register("email")} />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...loginForm.register("password")} />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
