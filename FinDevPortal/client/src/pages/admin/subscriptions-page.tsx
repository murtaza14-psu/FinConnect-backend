import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Banknote,
  Search,
  Filter,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: number;
  userId: number;
  username: string;
  plan: string;
  active: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Fetch subscriptions
  const { data: subscriptions, isLoading, error } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/admin/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('You do not have permission to access this resource');
          }
          throw new Error('Failed to fetch subscriptions');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }
    }
  });
  
  // Mock subscriptions data for UI
  const mockSubscriptions: Subscription[] = [
    {
      id: 1,
      userId: 2,
      username: "developer",
      plan: "pro",
      active: true,
      startDate: "2023-06-15T12:00:00.000Z",
      endDate: "2023-07-15T12:00:00.000Z",
      createdAt: "2023-06-15T12:00:00.000Z"
    },
    {
      id: 2,
      userId: 3,
      username: "johndoe",
      plan: "basic",
      active: true,
      startDate: "2023-06-10T09:30:00.000Z",
      createdAt: "2023-06-10T09:30:00.000Z"
    },
    {
      id: 3,
      userId: 4,
      username: "janedoe",
      plan: "enterprise",
      active: true,
      startDate: "2023-05-20T14:45:00.000Z",
      endDate: "2023-06-20T14:45:00.000Z",
      createdAt: "2023-05-20T14:45:00.000Z"
    },
    {
      id: 4,
      userId: 5,
      username: "acmecorp",
      plan: "enterprise",
      active: false,
      startDate: "2023-04-05T10:15:00.000Z",
      endDate: "2023-05-05T10:15:00.000Z",
      createdAt: "2023-04-05T10:15:00.000Z"
    },
    {
      id: 5,
      userId: 6,
      username: "techinc",
      plan: "pro",
      active: false,
      startDate: "2023-03-12T16:20:00.000Z",
      endDate: "2023-04-12T16:20:00.000Z",
      createdAt: "2023-03-12T16:20:00.000Z"
    }
  ];
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/admin/subscriptions/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ subscriptionId })
        });
        
        if (!res.ok) throw new Error('Failed to cancel subscription');
        
        return await res.json();
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      toast({
        title: "Subscription Cancelled",
        description: "The subscription has been cancelled successfully.",
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
  
  // Filter subscriptions
  const filteredSubscriptions = mockSubscriptions.filter(sub => {
    const matchesSearch = searchTerm === "" || 
      sub.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.userId.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && sub.active) || 
      (statusFilter === "inactive" && !sub.active);
    
    const matchesPlan = planFilter === "all" || sub.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });
  
  // Paginate subscriptions
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  // Total pages
  const totalPages = Math.ceil(filteredSubscriptions.length / pageSize);
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Get plan display name
  const getPlanDisplayName = (plan: string) => {
    const planMap: Record<string, string> = {
      'basic': 'Basic',
      'pro': 'Pro',
      'enterprise': 'Enterprise'
    };
    
    return planMap[plan] || plan;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading subscriptions...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load subscriptions. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-medium text-neutral-800 flex items-center gap-2">
              <Banknote className="h-6 w-6 text-primary" />
              Subscription Management
            </h2>
            <p className="text-neutral-600">Manage and view all user subscriptions</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">
              Total Subscriptions: <strong>{mockSubscriptions.length}</strong>
            </span>
            <Badge variant="outline" className="ml-2">
              <span className="bg-green-500 w-2 h-2 rounded-full inline-block mr-1"></span>
              {mockSubscriptions.filter(sub => sub.active).length} Active
            </Badge>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Subscriptions</CardTitle>
                <CardDescription>
                  Showing {paginatedSubscriptions.length} of {filteredSubscriptions.length} subscriptions
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="search"
                    placeholder="Search by username or ID..."
                    className="pl-9 w-full md:w-60"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Plan</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubscriptions.length > 0 ? (
                    paginatedSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-mono">{subscription.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{subscription.username}</p>
                              <p className="text-xs text-neutral-500">ID: {subscription.userId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            subscription.plan === 'basic' ? 'outline' :
                            subscription.plan === 'pro' ? 'secondary' :
                            'default'
                          }>
                            {getPlanDisplayName(subscription.plan)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {subscription.active ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-neutral-500">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Inactive</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-neutral-500" />
                            <span>{formatDate(subscription.startDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {subscription.endDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-neutral-500" />
                              <span>{formatDate(subscription.endDate)}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-500">Auto-renewal</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => cancelSubscriptionMutation.mutate(subscription.id)}
                                disabled={cancelSubscriptionMutation.isPending || !subscription.active}
                                className={!subscription.active ? "text-neutral-400 cursor-not-allowed" : ""}
                              >
                                Cancel Subscription
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No subscriptions found matching the filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-4 flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(page - 1)}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = i + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNumber === 1 || 
                        pageNumber === totalPages ||
                        (pageNumber >= page - 1 && pageNumber <= page + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              isActive={page === pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      // Show ellipsis if there's a gap
                      if (
                        (pageNumber === 2 && page > 3) ||
                        (pageNumber === totalPages - 1 && page < totalPages - 2)
                      ) {
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(page + 1)}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
