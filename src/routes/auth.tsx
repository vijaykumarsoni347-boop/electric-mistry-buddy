import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { auth, db } from "@/integrations/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().email("Sahi email daalein"),
  password: z.string().min(6, "Password kam se kam 6 characters ka ho"),
});

const signupSchema = z.object({
  email: z.string().email("Sahi email daalein"),
  password: z.string().min(6, "Password kam se kam 6 characters ka ho"),
  confirmPassword: z.string().min(6, "Password confirm karein"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords match nahi kar rahe",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

function AuthPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isOwner, isElectrician, signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (isOwner) navigate({ to: "/dashboard", replace: true });
    else if (isElectrician) navigate({ to: "/electrician/ledger", replace: true });
    else navigate({ to: "/dashboard", replace: true }); // Default to dashboard for new users
  }, [isLoading, isAuthenticated, isOwner, isElectrician, navigate]);

  const onLogin = async (values: LoginForm) => {
    try {
      await signIn(values.email, values.password);
      toast.success("Login ho gaya");
    } catch (error: any) {
      toast.error(error.message || "Login mein error aaya");
    }
  };

  const onSignup = async (values: SignupForm) => {
    try {
      await signUp(values.email, values.password);
      toast.success("Account ban gaya! Login karein.");
      setIsLogin(true);
    } catch (error: any) {
      toast.error(error.message || "Signup mein error aaya");
    }
  };

  const onGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      if (firebaseUser.email) {
        // Check if profile exists in Firestore
        const profileDoc = await getDoc(doc(db, "profiles", firebaseUser.uid));
        if (!profileDoc.exists()) {
          // Create profile for new Google user
          const newProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            full_name: firebaseUser.displayName || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await setDoc(doc(db, "profiles", firebaseUser.uid), newProfile);

          // Auto-assign owner role to admin email
          if (firebaseUser.email === "teamsg697@gmail.com") {
            await setDoc(doc(db, "user_roles", `${firebaseUser.uid}_owner`), {
              user_id: firebaseUser.uid,
              role: "owner",
              email: firebaseUser.email,
              created_at: new Date().toISOString(),
            });
          }
        }
        
        const isNewUser = result._tokenResponse.isNewUser;
        if (isNewUser) {
          toast.success(`Google se account ban gaya: ${firebaseUser.email}`);
        } else {
          toast.success(`Google se login ho gaya: ${firebaseUser.email}`);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Google login mein error aaya");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Electrical Shop Manager</CardTitle>
          <CardDescription>
            {isLogin 
              ? "Apni dukaan ka hisaab rakhne ke liye login karein." 
              : "Naya account banayein. Sirf dukaan owner account ban sakta hai."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
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
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ya
                  </span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={onGoogleSignIn}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google se Login
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Account nahi hai?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:underline"
                >
                  Signup karein
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" {...signupForm.register("email")} />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" {...signupForm.register("password")} />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Password Confirm</Label>
                <Input id="confirm-password" type="password" {...signupForm.register("confirmPassword")} />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full">Signup</Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ya
                  </span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={onGoogleSignIn}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google se Signup
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Pehle se account hai?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline"
                >
                  Login karein
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
