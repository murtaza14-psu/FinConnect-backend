import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({
  path,
  component: Component,
  requiresAdmin = false,
  requiresSubscription = true, // Default to requiring subscription for protected routes
}: {
  path: string;
  component: () => React.JSX.Element;
  requiresAdmin?: boolean;
  requiresSubscription?: boolean;
}) {
  return (
    <Route path={path}>
      {() => {
        const [isLoading, setIsLoading] = useState(true);
        const [user, setUser] = useState<{id: number, username: string, role: string} | null>(null);
        const [hasSubscription, setHasSubscription] = useState(false);
        const [, setLocation] = useLocation();
        const { toast } = useToast();
        
        useEffect(() => {
          const checkAuth = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('finconnect_token');
            
            if (!token) {
              setIsLoading(false);
              return;
            }
            
            try {
              const response = await fetch('/api/user', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                
                // Admin users bypass subscription requirements
                if (userData.role === 'admin') {
                  setHasSubscription(true);
                  setIsLoading(false);
                  return;
                }
                
                // Check subscription if required
                if (requiresSubscription) {
                  try {
                    const subscriptionResponse = await fetch('/api/subscriptions/active', {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    
                    if (subscriptionResponse.ok) {
                      const subscriptionData = await subscriptionResponse.json();
                      setHasSubscription(subscriptionData && subscriptionData.active);
                    } else {
                      setHasSubscription(false);
                      
                      if (subscriptionResponse.status === 404 || subscriptionResponse.status === 403) {
                        // Show toast notification only if actively navigating to this route
                        toast({
                          title: "Subscription Required",
                          description: "You need an active subscription to access this feature",
                          variant: "destructive"
                        });
                        
                        // Delay to allow toast to be shown before redirect
                        setTimeout(() => {
                          setLocation('/pricing');
                        }, 1500);
                      }
                    }
                  } catch (error) {
                    console.error('Subscription check error:', error);
                    setHasSubscription(false);
                  }
                } else {
                  // If subscription not required for this route, mark as having one
                  setHasSubscription(true);
                }
              } else {
                // Invalid token
                localStorage.removeItem('finconnect_token');
              }
            } catch (err) {
              console.error('Auth check error:', err);
              localStorage.removeItem('finconnect_token');
            } finally {
              setIsLoading(false);
            }
          };
          
          checkAuth();
        }, [requiresSubscription, toast, setLocation]);

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        if (requiresAdmin && user.role !== 'admin') {
          return <Redirect to="/" />;
        }
        
        if (requiresSubscription && !hasSubscription && user.role !== 'admin') {
          return <Redirect to="/pricing" />;
        }

        return <Component />;
      }}
    </Route>
  );
}
