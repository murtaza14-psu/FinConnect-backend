import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, ArrowDown, ArrowUp, AlertCircle, Download, Search, ChevronDown, Filter } from "lucide-react";

type Transaction = {
  id: number;
  userId: number;
  type: string;
  amount: number;
  description?: string;
  status: string;
  fromAccount?: string;
  toAccount?: string;
  createdAt: string;
};

type TransactionsResponse = {
  data: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Fetch transactions
  const { data, isLoading, error } = useQuery<TransactionsResponse>({
    queryKey: ["/api/transactions", page, pageSize],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch(`/api/transactions?page=${page}&pageSize=${pageSize}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            return { error: 'subscription_required' };
          }
          throw new Error('Failed to fetch transactions');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    }
  });
  
  // Mock transactions for the UI
  const mockTransactions = [
    {
      id: 1,
      type: "credit",
      amount: 2500.00,
      description: "ACH Transfer from ACME Corp",
      status: "completed",
      fromAccount: "acct_ext_1234",
      toAccount: "acct_checking_5678",
      createdAt: "2023-07-15T14:30:45.000Z"
    },
    {
      id: 2,
      type: "debit",
      amount: 129.99,
      description: "Online Payment to XYZ Services",
      status: "completed",
      fromAccount: "acct_checking_5678",
      toAccount: "acct_ext_8765",
      createdAt: "2023-07-14T09:15:22.000Z"
    },
    {
      id: 3,
      type: "debit",
      amount: 200.00,
      description: "ATM Withdrawal",
      status: "completed",
      fromAccount: "acct_checking_5678",
      toAccount: "cash",
      createdAt: "2023-07-12T16:45:11.000Z"
    },
    {
      id: 4,
      type: "credit",
      amount: 3245.16,
      description: "Direct Deposit - Salary",
      status: "completed",
      fromAccount: "acct_ext_payroll",
      toAccount: "acct_checking_5678",
      createdAt: "2023-07-10T08:00:00.000Z"
    },
    {
      id: 5,
      type: "debit",
      amount: 75.50,
      description: "Restaurant Payment",
      status: "completed",
      fromAccount: "acct_checking_5678",
      toAccount: "acct_ext_merchant",
      createdAt: "2023-07-09T19:22:33.000Z"
    },
    {
      id: 6,
      type: "debit",
      amount: 500.00,
      description: "Transfer to Savings",
      status: "completed",
      fromAccount: "acct_checking_5678",
      toAccount: "acct_savings_9012",
      createdAt: "2023-07-08T10:15:00.000Z"
    },
    {
      id: 7,
      type: "debit",
      amount: 45.99,
      description: "Online Subscription",
      status: "completed",
      fromAccount: "acct_checking_5678",
      toAccount: "acct_ext_subscription",
      createdAt: "2023-07-07T11:30:45.000Z"
    },
    {
      id: 8,
      type: "debit",
      amount: 1200.00,
      description: "Rent Payment",
      status: "pending",
      fromAccount: "acct_checking_5678",
      toAccount: "acct_ext_landlord",
      createdAt: "2023-07-06T08:45:00.000Z"
    },
    {
      id: 9,
      type: "credit",
      amount: 150.00,
      description: "Refund from Online Store",
      status: "completed",
      fromAccount: "acct_ext_store",
      toAccount: "acct_checking_5678",
      createdAt: "2023-07-05T15:20:10.000Z"
    },
    {
      id: 10,
      type: "debit",
      amount: 65.43,
      description: "Grocery Store Purchase",
      status: "completed",
      fromAccount: "acct_checking_5678",
      toAccount: "acct_ext_grocery",
      createdAt: "2023-07-04T17:35:22.000Z"
    }
  ];

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Filter transactions
  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = searchTerm === "" || 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.amount.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-full">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading transactions...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || (data && 'error' in data)) {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {data && 'error' in data && data.error === 'subscription_required' 
                ? 'You need to subscribe to a plan to access this feature.' 
                : 'Failed to load transactions. Please try again later.'}
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
          <h2 className="text-2xl font-medium text-neutral-800">Transactions</h2>
          <p className="text-neutral-600">View and search your transaction history</p>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-9 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead className="w-[200px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium">
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.type === 'credit' ? (
                            <ArrowDown className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-red-500" />
                          )}
                          <span>{transaction.description}</span>
                        </div>
                        <div className="text-sm text-neutral-500 mt-1">
                          {transaction.type === 'credit' ? 'From: ' : 'To: '}
                          {transaction.type === 'credit' ? transaction.fromAccount : transaction.toAccount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-neutral-900'
                      }`}>
                        {transaction.type === 'credit' ? '+' : ''}
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-500">Rows per page</p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(parseInt(value))}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(page - 1)}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(3, Math.ceil(filteredTransactions.length / pageSize)) }, (_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        isActive={page === i + 1}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {Math.ceil(filteredTransactions.length / pageSize) > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handlePageChange(Math.ceil(filteredTransactions.length / pageSize))}
                        >
                          {Math.ceil(filteredTransactions.length / pageSize)}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={page >= Math.ceil(filteredTransactions.length / pageSize) ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
