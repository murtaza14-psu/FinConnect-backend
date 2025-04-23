import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubscriptionModal } from "@/components/subscription-modal";
import { 
  BarChart, 
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  ChevronDown, 
  MoreHorizontal,
  ExternalLink
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  const [user, setUser] = useState<{id: number, username: string, role: string} | null>(null);
  
  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        if (!token) return;
        
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    
    fetchUser();
  }, []);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // Fetch user's active subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/subscriptions/active"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch user data');
        const userData = await res.json();
        
        // For the sake of this demo, we'll determine subscription status
        // In a real app, we would make a separate API call to get the subscription
        const hasActiveSubscription = localStorage.getItem('has_subscription') === 'true';
        
        if (hasActiveSubscription) {
          return {
            id: 1,
            plan: "pro",
            active: true,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
    }
  });
  
  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/subscriptions/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan })
        });
        
        if (!res.ok) throw new Error('Failed to subscribe');
        
        // For the sake of this demo, we'll store subscription status in localStorage
        localStorage.setItem('has_subscription', 'true');
        
        return await res.json();
      } catch (error) {
        console.error('Error subscribing:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/active"] });
      setIsSubscriptionModalOpen(false);
    }
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) throw new Error('Failed to cancel subscription');
        
        // For the sake of this demo, we'll store subscription status in localStorage
        localStorage.setItem('has_subscription', 'false');
        
        return await res.json();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/active"] });
    }
  });
  
  // Fetch recent activity
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/transactions?page=1&pageSize=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          // If subscription required error
          if (res.status === 403) {
            return { error: 'subscription_required' };
          }
          throw new Error('Failed to fetch recent activity');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return { error: 'failed_to_fetch' };
      }
    }
  });
  
  // Stats for dashboard
  const stats = [
    {
      title: "API Requests (Today)",
      value: "127",
      icon: <BarChart className="h-4 w-4 text-primary" />,
      trend: "+12% from yesterday",
      trendPositive: true
    },
    {
      title: "Rate Limit",
      value: "7/10",
      icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
      progress: 70,
      subtitle: "Resets in 4 minutes"
    },
    {
      title: "Error Rate",
      value: "2.3%",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      trend: "-0.5% from yesterday",
      trendPositive: true
    }
  ];
  
  // Mock API key data
  const apiKeys = [
    {
      name: "Production API Key",
      key: "pk_live_51NBXxnFR45rKACGL6JeLiDrDRlfn9",
      description: "Use this key for your production environment"
    },
    {
      name: "Test API Key",
      key: "pk_test_51NBXxnFR45rKACGL6JeLiDrDRlfn9",
      description: "Use this key for development and testing"
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-neutral-800">Developer Dashboard</h2>
          <p className="text-neutral-600">Welcome to your FinConnect developer portal</p>
        </div>
        
        {/* Subscription Status - Only shows when active */}
        {subscription && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan Active</h3>
                    <p className="text-sm text-neutral-600">
                      Your subscription is active until {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Manage Subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* API Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-neutral-500">{stat.title}</p>
                    <h3 className="text-2xl font-medium mt-1">{stat.value}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  {stat.trend && (
                    <p className={`text-xs flex items-center gap-1 ${stat.trendPositive ? 'text-green-500' : 'text-red-500'}`}>
                      <ChevronDown className={`h-3 w-3 ${stat.trendPositive ? 'rotate-180' : ''}`} />
                      {stat.trend}
                    </p>
                  )}
                  {stat.progress && (
                    <>
                      <Progress value={stat.progress} className="h-2" />
                      <p className="text-xs text-neutral-500 mt-1">{stat.subtitle}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Link to="/transactions" className="text-primary text-sm">
              View All
            </Link>
          </CardHeader>
          
          <ScrollArea className="h-64">
            {recentActivity?.error ? (
              <div className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                <h3 className="font-medium text-lg">Error Loading Activity</h3>
                <p className="text-neutral-600">There was a problem loading your recent activity</p>
              </div>
            ) : isLoadingActivity ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-neutral-600">Loading activity...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead className="whitespace-nowrap w-1/3">Endpoint</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Response Time</TableHead>
                    <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Sample activity data since we don't have real logs yet */}
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">GET</span>
                        <span className="ml-2 font-mono text-sm">/api/balance</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">200 OK</span>
                    </TableCell>
                    <TableCell className="text-sm">121ms</TableCell>
                    <TableCell className="text-sm text-neutral-500">2 minutes ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded">POST</span>
                        <span className="ml-2 font-mono text-sm">/api/transfer</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">201 Created</span>
                    </TableCell>
                    <TableCell className="text-sm">235ms</TableCell>
                    <TableCell className="text-sm text-neutral-500">15 minutes ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">GET</span>
                        <span className="ml-2 font-mono text-sm">/api/transactions</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">401 Unauthorized</span>
                    </TableCell>
                    <TableCell className="text-sm">54ms</TableCell>
                    <TableCell className="text-sm text-neutral-500">1 hour ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="bg-amber-100 text-amber-600 text-xs px-2 py-1 rounded">PUT</span>
                        <span className="ml-2 font-mono text-sm">/api/invoice</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">200 OK</span>
                    </TableCell>
                    <TableCell className="text-sm">189ms</TableCell>
                    <TableCell className="text-sm text-neutral-500">3 hours ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">GET</span>
                        <span className="ml-2 font-mono text-sm">/api/balance</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">200 OK</span>
                    </TableCell>
                    <TableCell className="text-sm">110ms</TableCell>
                    <TableCell className="text-sm text-neutral-500">5 hours ago</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </Card>
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={(plan) => subscribeMutation.mutate(plan)}
        isSubscribing={subscribeMutation.isPending}
      />
    </Layout>
  );
}
