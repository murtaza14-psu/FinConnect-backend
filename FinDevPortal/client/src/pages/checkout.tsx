import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.

const STRIPE_PUBLIC_KEY = 'pk_test_51RGLUmFRKFCOyckpd4VALhdCBaibqHTcJHRxgLsEmHjIDHz4WtduSIY2jIQlzbnjawxsjlgFf3eZwcSuZtHyitmy00ev6sjscG';
if (!STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ planName, planPrice }: { planName: string; planPrice: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Use the confirmPayment method with redirect: 'if_required' option
      // This allows us to handle the confirmation result here instead of
      // relying on the automatic redirect which can be problematic in some environments
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        
        // First ensure subscription is created
        try {
          await fetch(`/api/check-payment-status?payment_intent=${paymentIntent.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('finconnect_token')}`
            }
          });
        } catch (err) {
          console.log('Error checking payment status:', err);
        }
        
        // Manually navigate to the success page
        setTimeout(() => {
          window.location.href = `/subscription-success?payment_intent=${paymentIntent.id}`;
        }, 1000);
      } else if (paymentIntent) {
        // Payment requires additional action
        toast({
          title: "Processing Payment",
          description: "Your payment is being processed...",
        });
        
        // Check payment status
        const checkPaymentStatus = async () => {
          try {
            const response = await fetch(`/api/check-payment-status?payment_intent=${paymentIntent.id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('finconnect_token')}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'succeeded') {
                window.location.href = '/subscription-success';
              } else {
                toast({
                  title: "Payment Pending",
                  description: "Your payment is still being processed. Please check your dashboard later.",
                });
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 2000);
              }
            } else {
              window.location.href = '/subscription';
            }
          } catch (e) {
            console.error('Error checking payment status:', e);
            window.location.href = '/subscription';
          }
        };
        
        setTimeout(checkPaymentStatus, 2000);
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <h3 className="text-sm font-medium text-blue-800 mb-1">Test Mode Instructions</h3>
        <p className="text-sm text-blue-700">
          This checkout is in Stripe test mode. Use these test cards:
        </p>
        <ul className="mt-2 text-xs text-blue-700 space-y-1">
          <li><span className="font-mono">4242 4242 4242 4242</span> - Successful payment</li>
          <li><span className="font-mono">4000 0000 0000 0002</span> - Declined payment</li>
          <li>Any future date for expiry, any 3 digits for CVC, any name</li>
        </ul>
      </div>
      
      <PaymentElement options={{
        layout: {
          type: 'tabs',
          defaultCollapsed: false,
        },
        paymentMethodOrder: ['card'],
      }} />
      
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-gray-600">Subscription plan</span>
          <span>{planName}</span>
        </div>
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-gray-600">Amount</span>
          <span>${planPrice}/month</span>
        </div>
      </div>

      <Button 
        type="submit"
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${planPrice}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<{ name: string, price: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check authentication and subscription
  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      const token = localStorage.getItem('finconnect_token');
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to subscribe to a plan",
          variant: "destructive"
        });
        window.location.href = '/auth';
        setAuthChecked(true);
        return;
      }
      
      try {
        // Check user authentication
        const userResponse = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          
          // Check if user already has an active subscription
          const subscriptionResponse = await fetch('/api/subscriptions/active', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (subscriptionResponse.ok) {
            // User already has an active subscription, redirect to dashboard
            toast({
              title: "Active Subscription Found",
              description: "You already have an active subscription. Redirecting to dashboard.",
            });
            window.location.href = '/dashboard';
            return;
          }
        } else {
          // Invalid token
          localStorage.removeItem('finconnect_token');
          toast({
            title: "Authentication Required",
            description: "Please log in to subscribe to a plan",
            variant: "destructive"
          });
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        toast({
          title: "Authentication Error",
          description: "There was a problem checking your login status",
          variant: "destructive"
        });
        window.location.href = '/auth';
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuthAndSubscription();
  }, [toast, setLocation]);

  useEffect(() => {
    // Get plan ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan');
    
    if (!planId) {
      toast({
        title: "Error",
        description: "No plan specified",
        variant: "destructive"
      });
      window.location.href = '/pricing';
      return;
    }

    // Get plan details and create PaymentIntent
    const fetchPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          planId
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to initialize payment");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPlanDetails({
          name: data.planName,
          price: data.planPrice
        });
      } catch (error: any) {
        console.error('Payment intent error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to initialize payment process",
          variant: "destructive"
        });
        window.location.href = '/pricing';
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [toast, setLocation]);

  const handleBackToPricing = () => {
    window.location.href = '/pricing';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret || !planDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>
              We couldn't initialize the payment process. Please try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleBackToPricing} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-md mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={handleBackToPricing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pricing
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
            <CardDescription>
              Enter your payment details to subscribe to the {planDetails.name} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm planName={planDetails.name} planPrice={planDetails.price} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}