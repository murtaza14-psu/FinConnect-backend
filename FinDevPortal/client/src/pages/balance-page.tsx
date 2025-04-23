import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, DollarSign, CreditCard, Wallet, LineChart, TrendingUp, TrendingDown } from "lucide-react";

export default function BalancePage() {
  // Fetch balance data
  const { data: balance, isLoading, error } = useQuery({
    queryKey: ["/api/balance"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/balance', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            return { error: 'subscription_required' };
          }
          throw new Error('Failed to fetch balance');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching balance:', error);
        throw error;
      }
    }
  });
  
  // Mock additional data for the UI
  const accounts = [
    {
      id: 1,
      name: "Checking Account",
      number: "•••• 4567",
      balance: 8750.42,
      currency: "USD",
      type: "checking"
    },
    {
      id: 2,
      name: "Savings Account",
      number: "•••• 7890",
      balance: 3750.33,
      currency: "USD",
      type: "savings"
    },
    {
      id: 3,
      name: "Investment Account",
      number: "•••• 1234",
      balance: 15680.75,
      currency: "USD",
      type: "investment"
    }
  ];
  
  const recentTransactions = [
    {
      id: 1,
      date: "2023-07-15",
      description: "ACH Transfer from ACME Corp",
      amount: 2500.00,
      type: "credit"
    },
    {
      id: 2,
      date: "2023-07-14",
      description: "Online Payment to XYZ Services",
      amount: -129.99,
      type: "debit"
    },
    {
      id: 3,
      date: "2023-07-12",
      description: "ATM Withdrawal",
      amount: -200.00,
      type: "debit"
    },
    {
      id: 4,
      date: "2023-07-10",
      description: "Direct Deposit - Salary",
      amount: 3245.16,
      type: "credit"
    }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-full">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading balance information...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || (balance && 'error' in balance)) {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {balance && 'error' in balance && balance.error === 'subscription_required' 
                ? 'You need to subscribe to a plan to access this feature.' 
                : 'Failed to load balance information. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-neutral-800">Balance</h2>
          <p className="text-neutral-600">View your account balances and recent transactions</p>
        </div>
        
        {/* Total Balance Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-neutral-500 mb-1">Total Available Balance</p>
                <h1 className="text-4xl font-semibold">${balance?.availableBalance.toLocaleString()}</h1>
                {balance?.pendingBalance > 0 && (
                  <p className="text-sm text-neutral-500 mt-1">
                    ${balance.pendingBalance.toLocaleString()} pending
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Income</p>
                      <p className="font-medium">$6,240.00</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Expenses</p>
                      <p className="font-medium">$2,890.00</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Accounts and Transactions Tabs */}
        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="accounts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{account.name}</CardTitle>
                        <CardDescription>{account.number}</CardDescription>
                      </div>
                      <div className="rounded-full bg-primary/10 p-2">
                        {account.type === "checking" && <Wallet className="h-4 w-4 text-primary" />}
                        {account.type === "savings" && <DollarSign className="h-4 w-4 text-primary" />}
                        {account.type === "investment" && <LineChart className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">${account.balance.toLocaleString()}</div>
                    <p className="text-xs text-neutral-500 mt-1">Available Balance</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your most recent account activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.type === 'credit' ? (
                            <TrendingUp className={`h-4 w-4 ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`} />
                          ) : (
                            <TrendingDown className={`h-4 w-4 ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-neutral-500">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : ''}{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
