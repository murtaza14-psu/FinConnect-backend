import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: {
    name: string;
    included: boolean;
  }[];
  recommended?: boolean;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: string) => void;
  isSubscribing: boolean;
}

export function SubscriptionModal({ isOpen, onClose, onSubscribe, isSubscribing }: SubscriptionModalProps) {
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "basic",
      name: "Basic",
      price: 49,
      description: "For developers just getting started",
      features: [
        { name: "1,000 API calls/day", included: true },
        { name: "Basic endpoints", included: true },
        { name: "Community support", included: true },
        { name: "Webhook notifications", included: false },
        { name: "Advanced reporting", included: false },
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 149,
      description: "For businesses with moderate API usage",
      features: [
        { name: "10,000 API calls/day", included: true },
        { name: "All endpoints", included: true },
        { name: "Priority email support", included: true },
        { name: "Webhook notifications", included: true },
        { name: "Advanced reporting", included: false },
      ],
      recommended: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 499,
      description: "For high-volume production use",
      features: [
        { name: "Unlimited API calls", included: true },
        { name: "All endpoints", included: true },
        { name: "24/7 dedicated support", included: true },
        { name: "Webhook notifications", included: true },
        { name: "Advanced reporting", included: true },
      ]
    }
  ];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-medium text-center mb-2"
                >
                  Choose a Subscription Plan
                </Dialog.Title>
                <Dialog.Description className="text-sm text-neutral-600 text-center mb-6">
                  Select the plan that best fits your development needs
                </Dialog.Description>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-neutral-500"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {subscriptionPlans.map((plan) => (
                    <Card 
                      key={plan.id}
                      className={`overflow-hidden relative ${
                        plan.recommended 
                          ? 'border-2 border-primary' 
                          : 'border border-neutral-200 hover:border-primary transition-colors'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 inset-x-0 flex justify-center">
                          <span className="bg-primary text-white text-xs px-3 py-1 rounded-full">
                            Recommended
                          </span>
                        </div>
                      )}
                      
                      <CardContent className="p-4">
                        <h3 className="font-medium">{plan.name}</h3>
                        <div className="my-2">
                          <span className="text-2xl font-bold">${plan.price}</span>
                          <span className="text-neutral-500">/month</span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-4">{plan.description}</p>
                        
                        <ul className="mb-8 space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              {feature.included ? (
                                <>
                                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span>{feature.name}</span>
                                </>
                              ) : (
                                <>
                                  <X className="h-4 w-4 text-neutral-300 mt-0.5" />
                                  <span className="text-neutral-400">{feature.name}</span>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      
                      <CardFooter className="p-4 border-t border-neutral-200">
                        <Button
                          className="w-full"
                          variant={plan.recommended ? "default" : "outline"}
                          onClick={() => onSubscribe(plan.id)}
                          disabled={isSubscribing}
                        >
                          {isSubscribing ? "Processing..." : "Select Plan"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                
                <p className="text-sm text-neutral-500 text-center">
                  All plans include a 14-day free trial. No credit card required.
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
