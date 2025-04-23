import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('finconnect_token');
    if (token) {
      // Verify token and redirect if valid
      fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          // Redirect to pricing page if already logged in
          navigate("/pricing");
        }
      })
      .catch(err => {
        console.error('Token validation error:', err);
        localStorage.removeItem('finconnect_token');
      });
    }
  }, [navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submit
  async function onLoginSubmit(values: LoginFormValues) {
    setIsLoggingIn(true);
    setError(null);
    
    try {
      // Convert email to username for API compatibility
      const loginPayload = {
        username: values.email, // Use email as username for now
        password: values.password
      };
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save token and redirect to pricing page
      localStorage.setItem('finconnect_token', data.token);
      navigate('/pricing');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      
      // Just log the error, we'll display it properly in the UI
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  }

  // Handle register submit
  async function onRegisterSubmit(values: RegisterFormValues) {
    setIsRegistering(true);
    setError(null);
    
    try {
      const { confirmPassword, ...userData } = values;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Save token and redirect to pricing page
      localStorage.setItem('finconnect_token', data.token);
      navigate('/pricing');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
      
      // Just log the error, we'll display it properly in the UI
      console.error('Registration error:', err);
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side: Auth form */}
      <div className="flex-1 p-6 flex items-center justify-center bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PiggyBank className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-medium text-primary">FinConnect</h1>
            </div>
            <p className="text-muted-foreground">Developer Portal for Fintech APIs</p>
          </div>

          <Tabs defaultValue="login" className="w-full" onValueChange={() => setError(null)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md mb-4">
                      {error}
                    </div>
                  )}
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="you@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
                  <p>Test accounts: <br/> admin@finconnect.com/admin123 or developer@finconnect.com/developer123</p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to start using our API services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md mb-4">
                      {error}
                    </div>
                  )}
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormDescription>
                              Choose a unique username for your account.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="you@example.com" type="email" {...field} />
                            </FormControl>
                            <FormDescription>
                              We'll use this for account verification.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 6 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isRegistering}
                      >
                        {isRegistering ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side: Hero section */}
      <div className="flex-1 bg-primary text-white p-8 flex flex-col justify-center hidden md:flex">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">Developer Sandbox for Fintech APIs</h1>
          <p className="text-lg mb-6">
            FinConnect provides a sandbox environment for developers to test and integrate financial APIs.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-white/20 p-1 rounded-full">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Secure Authentication</h3>
                <p className="text-sm text-white/80">
                  JWT-based authentication and role-based access control.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-white/20 p-1 rounded-full">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Mock Financial APIs</h3>
                <p className="text-sm text-white/80">
                  Balance inquiries, transfers, transaction history, and more.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-white/20 p-1 rounded-full">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Subscription Management</h3>
                <p className="text-sm text-white/80">
                  Subscribe to plans with different tiers of access and features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}