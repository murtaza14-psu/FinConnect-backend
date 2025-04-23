import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Crown, Zap, BarChart3, Loader2, LogOut, User } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    name: 'Standard',
    price: 49,
    description: 'Complete API access for developers',
    features: [
      { name: 'Balance API Access', included: true },
      { name: 'Transaction History (Full)', included: true },
      { name: 'API Rate Limit: 50 req/min', included: true },
      { name: 'Transfer API Access', included: true },
      { name: 'Invoice Generation', included: true },
      { name: 'Priority Support', included: true },
    ],
    recommended: true,
    icon: <Zap className="h-8 w-8 text-primary" />,
    id: 'standard'
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  // Fetch user data and check subscription on component mount
  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      const token = localStorage.getItem('finconnect_token');
      if (!token) return;
      
      try {
        // First get user data
        const userResponse = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Then check if user has an active subscription
          const subscriptionResponse = await fetch('/api/subscriptions/active', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (subscriptionResponse.ok) {
            // User has an active subscription, redirect to dashboard
            toast({
              title: "Active Subscription Found",
              description: "Redirecting you to your dashboard",
            });
            window.location.href = '/dashboard';
          }
        }
      } catch (error) {
        console.error('Error fetching user data or subscription:', error);
      }
    };
    
    checkAuthAndSubscription();
  }, [toast]);
  
  const navigate = (path: string) => {
    setLocation(path);
  };
  
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('finconnect_token');
      
      if (token) {
        // Call the logout API endpoint
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Always clear the token and redirect regardless of API response
      localStorage.removeItem('finconnect_token');
      setUser(null);
      navigate('/auth');
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback manual logout if API call fails
      localStorage.removeItem('finconnect_token');
      setUser(null);
      navigate('/auth');
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    }
  };
  
  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(planId);
      
      // Check if user is logged in using useAuth state
      if (!user) {
        // Redirect to login
        toast({
          title: "Authentication Required",
          description: "Please log in to subscribe to a plan",
          variant: "destructive"
        });
        
        setLocation('/auth');
        return;
      }
      
      // Redirect to checkout page with plan ID
      setLocation(`/checkout?plan=${planId}`);
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while processing your request",
        variant: "destructive"
      });
      setLoading(null);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              FinConnect
            </span>
          </h1>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setLocation('/')}>
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={handleLogout} className="flex items-center gap-1">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setLocation('/auth')}>
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container py-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-gray-600">
              Select the plan that best fits your development needs
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col border-primary shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-md">
                    PREMIUM
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {plan.icon}
                    <div className="text-right">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-500 ml-1">/mo</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-4">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 mt-0.5 text-green-500">
                          <Check size={16} />
                        </span>
                        <span className="text-gray-700">
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : 'Subscribe Now'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} FinConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}