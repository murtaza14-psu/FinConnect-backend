import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const transferSchema = z.object({
  fromAccount: z.string({
    required_error: "Please select a source account",
  }),
  toAccount: z.string({
    required_error: "Please select a destination account",
  }),
  amount: z.coerce
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be positive"),
  description: z.string().optional(),
}).refine(data => data.fromAccount !== data.toAccount, {
  message: "Source and destination accounts must be different",
  path: ["toAccount"],
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function TransferPage() {
  const { toast } = useToast();
  const [transferSuccess, setTransferSuccess] = useState(false);
  
  // Mock account data
  const accounts = [
    { id: "acct_1", name: "Checking Account", number: "•••• 4567", balance: 8750.42 },
    { id: "acct_2", name: "Savings Account", number: "•••• 7890", balance: 3750.33 },
    { id: "acct_3", name: "Investment Account", number: "•••• 1234", balance: 15680.75 },
  ];
  
  // External accounts (for demo purposes)
  const externalAccounts = [
    { id: "ext_1", name: "John Smith", institution: "Bank of America", number: "•••• 5678" },
    { id: "ext_2", name: "Jane Doe", institution: "Chase Bank", number: "•••• 9012" },
    { id: "ext_3", name: "Acme Corp", institution: "Wells Fargo", number: "•••• 3456" },
  ];
  
  // Form setup
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccount: "",
      toAccount: "",
      amount: undefined,
      description: "",
    },
  });
  
  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormValues) => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Subscription required to access this feature');
          }
          throw new Error('Transfer failed');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error making transfer:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setTransferSuccess(true);
      toast({
        title: "Transfer Successful",
        description: "Your transfer has been initiated successfully.",
      });
      
      // Reset form after successful transfer
      setTimeout(() => {
        form.reset();
        setTransferSuccess(false);
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  function onSubmit(values: TransferFormValues) {
    transferMutation.mutate(values);
  }
  
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-neutral-800">Transfer Funds</h2>
          <p className="text-neutral-600">Send money between your accounts or to external accounts</p>
        </div>
        
        {transferSuccess ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <div className="rounded-full bg-green-100 p-4 mx-auto w-fit mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Transfer Successful!</h2>
                <p className="text-neutral-600 mb-6">
                  Your transfer of ${form.getValues("amount")} has been initiated successfully.
                </p>
                <Button onClick={() => {
                  form.reset();
                  setTransferSuccess(false);
                }}>
                  Make Another Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
              <CardDescription>Enter the details for your fund transfer</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* From Account */}
                    <FormField
                      control={form.control}
                      name="fromAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex flex-col">
                                    <span>{account.name}</span>
                                    <span className="text-xs text-neutral-500">
                                      {account.number} • ${account.balance.toLocaleString()}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* To Account */}
                    <FormField
                      control={form.control}
                      name="toAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select destination account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <div className="px-2 py-1.5 text-sm font-semibold text-neutral-500">Your Accounts</div>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex flex-col">
                                    <span>{account.name}</span>
                                    <span className="text-xs text-neutral-500">{account.number}</span>
                                  </div>
                                </SelectItem>
                              ))}
                              <div className="px-2 py-1.5 text-sm font-semibold text-neutral-500 border-t mt-1 pt-1">External Accounts</div>
                              {externalAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex flex-col">
                                    <span>{account.name}</span>
                                    <span className="text-xs text-neutral-500">
                                      {account.institution} • {account.number}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Amount */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</div>
                            <Input
                              type="number"
                              step="0.01"
                              className="pl-8"
                              placeholder="0.00"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the amount you want to transfer.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter a description for this transfer"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add a note or description for this transfer.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Transfer Summary */}
                  {form.getValues("fromAccount") && form.getValues("toAccount") && form.getValues("amount") > 0 && (
                    <Alert className="bg-primary/5 border-primary/20">
                      <div className="w-full">
                        <AlertTitle className="mb-2">Transfer Summary</AlertTitle>
                        <AlertDescription>
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm">From:</div>
                            <div className="font-medium">
                              {accounts.find(a => a.id === form.getValues("fromAccount"))?.name || "Selected Account"}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm">To:</div>
                            <div className="font-medium">
                              {accounts.find(a => a.id === form.getValues("toAccount"))?.name || 
                                externalAccounts.find(a => a.id === form.getValues("toAccount"))?.name || 
                                "Selected Account"}
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm">Amount:</div>
                            <div className="font-medium">${parseFloat(form.getValues("amount").toString()).toFixed(2)}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm">Fee:</div>
                            <div className="font-medium">$0.00</div>
                          </div>
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={transferMutation.isPending}
                      className="gap-2"
                    >
                      {transferMutation.isPending ? "Processing..." : "Transfer Funds"}
                      {!transferMutation.isPending && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
