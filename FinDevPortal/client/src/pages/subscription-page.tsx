import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertCircle,
  CheckCircle,
  Calendar,
  CreditCard,
  RefreshCcw,
  Zap,
  Server,
  BarChart,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check URL parameters for payment status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated",
      });
      
      // Refresh subscription data
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/active"] });
      
      // Remove query params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancel') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled",
        variant: "destructive"
      });
      
      // Remove query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);
  
  // Fetch subscription data
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/subscriptions/active"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/subscriptions/active', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          // If no subscription found, return null
          if (res.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch subscription data');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
    }
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest('POST', '/api/subscriptions/cancel');
        
        if (!res.ok) throw new Error('Failed to cancel subscription');
        
        return await res.json();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/active"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleGoToPricing = () => {
    setLocation('/pricing');
  };
  
  const getPlanDetails = (planName: string) => {
    switch (planName) {
      case 'basic':
        return {
          name: 'Basic',
          price: 29,
          color: 'blue',
          features: [
            '1,000 API calls/day',
            'Basic endpoints',
            'Community support',
          ]
        };
      case 'pro':
        return {
          name: 'Pro',
          price: 79,
          color: 'purple',
          features: [
            '10,000 API calls/day',
            'All endpoints',
            'Priority email support',
            'Webhook notifications',
          ]
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          price: 199,
          color: 'green',
          features: [
            'Unlimited API calls',
            'All endpoints',
            '24/7 dedicated support',
            'Webhook notifications',
            'Advanced reporting',
          ]
        };
      default:
        return {
          name: 'Unknown',
          price: 0,
          color: 'gray',
          features: []
        };
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading subscription information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-neutral-800">Subscription Management</h2>
          <p className="text-neutral-600">Manage your API subscription plan</p>
        </div>
        
        {subscription ? (
          <>
            {/* Active Subscription */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Active Subscription</CardTitle>
                    <CardDescription>Your current subscription details</CardDescription>
                  </div>
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-500 mb-1 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Plan
                    </span>
                    <span className="text-xl font-semibold">{getPlanDetails(subscription.plan).name}</span>
                    <span className="text-primary-dark font-medium">${getPlanDetails(subscription.plan).price}/month</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-500 mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </span>
                    <span className="text-lg">
                      {new Date(subscription.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-500 mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Renewal Date
                    </span>
                    <span className="text-lg">
                      {subscription.endDate 
                        ? new Date(subscription.endDate).toLocaleDateString()
                        : 'Auto-renewal enabled'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-neutral-200 pt-6">
                  <h4 className="font-medium mb-4">Plan Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPlanDetails(subscription.plan).features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-neutral-200 pt-6">
                <Button 
                  variant="outline" 
                  onClick={handleGoToPricing}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Change Plan
                </Button>
                <Button
                  variant="destructive" 
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  {cancelSubscriptionMutation.isPending
                    ? "Cancelling..."
                    : "Cancel Subscription"
                  }
                </Button>
              </CardFooter>
            </Card>
            
            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>
                  Your API usage for the current billing period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-xs text-neutral-500">78% used</span>
                      </div>
                      <h3 className="text-lg font-medium">API Calls</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">7,823</span>
                        <span className="text-neutral-500">/ 10,000</span>
                      </div>
                      <div className="mt-2 w-full bg-neutral-100 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "78%" }}></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Server className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-xs text-neutral-500">45% used</span>
                      </div>
                      <h3 className="text-lg font-medium">Data Transfer</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">458</span>
                        <span className="text-neutral-500">MB / 1 GB</span>
                      </div>
                      <div className="mt-2 w-full bg-neutral-100 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <BarChart className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-xs text-green-500">+12% from last month</span>
                      </div>
                      <h3 className="text-lg font-medium">Success Rate</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">98.7%</span>
                      </div>
                      <div className="mt-2 w-full bg-neutral-100 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "98.7%" }}></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Alert className="mt-6">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Billing Period</AlertTitle>
                  <AlertDescription>
                    Current billing period: {new Date(subscription.startDate).toLocaleDateString()} - {
                      subscription.endDate 
                        ? new Date(subscription.endDate).toLocaleDateString()
                        : new Date(new Date(subscription.startDate).setMonth(new Date(subscription.startDate).getMonth() + 1)).toLocaleDateString()
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* No Active Subscription */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">No Active Subscription</h3>
                      <p className="text-neutral-600">You need to subscribe to a plan to access the API endpoints</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleGoToPricing}
                    className="whitespace-nowrap"
                  >
                    View Pricing Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Subscription Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Why Subscribe?</CardTitle>
                <CardDescription>
                  Benefits of subscribing to our API services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">Powerful APIs</h3>
                    <p className="text-neutral-600 text-sm">
                      Access a suite of financial APIs for balance checks, transfers, transaction history, and more.
                    </p>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">Developer-friendly</h3>
                    <p className="text-neutral-600 text-sm">
                      Well-documented endpoints with consistent response formats and helpful error messages.
                    </p>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium mb-2">Flexible Plans</h3>
                    <p className="text-neutral-600 text-sm">
                      Choose from a variety of subscription tiers to match your development needs and budget.
                    </p>
                  </div>
                </div>
                
                <Alert className="mt-6" variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Limited Access</AlertTitle>
                  <AlertDescription>
                    Without a subscription, you'll have limited access to the API features. 
                    Upgrade now to unlock the full potential of FinConnect API.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGoToPricing}
                  className="w-full"
                >
                  View Available Plans
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}