import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  List,
  Search,
  Filter,
  Download,
  Clock,
  User,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from "lucide-react";

interface ApiLog {
  id: number;
  userId: number;
  username: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
}

interface LogsResponse {
  data: ApiLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }
}

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [userIdFilter, setUserIdFilter] = useState("");
  
  // Fetch logs
  const { data, isLoading, error } = useQuery<LogsResponse>({
    queryKey: ["/api/admin/logs", page, pageSize, userIdFilter],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        let url = `/api/admin/logs?page=${page}&pageSize=${pageSize}`;
        
        if (userIdFilter) {
          url += `&userId=${userIdFilter}`;
        }
        
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('You do not have permission to access this resource');
          }
          throw new Error('Failed to fetch logs');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }
    }
  });
  
  // Mock logs data for UI
  const mockLogs: ApiLog[] = [
    {
      id: 1,
      userId: 2,
      username: "developer",
      endpoint: "/api/balance",
      method: "GET",
      statusCode: 200,
      responseTime: 121,
      timestamp: "2023-07-15T14:58:30.000Z"
    },
    {
      id: 2,
      userId: 2,
      username: "developer",
      endpoint: "/api/transfer",
      method: "POST",
      statusCode: 201,
      responseTime: 235,
      timestamp: "2023-07-15T14:45:15.000Z"
    },
    {
      id: 3,
      userId: 3,
      username: "johndoe",
      endpoint: "/api/transactions",
      method: "GET",
      statusCode: 401,
      responseTime: 54,
      timestamp: "2023-07-15T14:00:45.000Z"
    },
    {
      id: 4,
      userId: 4,
      username: "janedoe",
      endpoint: "/api/invoice",
      method: "GET",
      statusCode: 200,
      responseTime: 189,
      timestamp: "2023-07-15T12:15:30.000Z"
    },
    {
      id: 5,
      userId: 2,
      username: "developer",
      endpoint: "/api/balance",
      method: "GET",
      statusCode: 200,
      responseTime: 110,
      timestamp: "2023-07-15T10:30:00.000Z"
    },
    {
      id: 6,
      userId: 5,
      username: "acmecorp",
      endpoint: "/api/subscriptions/subscribe",
      method: "POST",
      statusCode: 201,
      responseTime: 280,
      timestamp: "2023-07-15T09:45:15.000Z"
    },
    {
      id: 7,
      userId: 3,
      username: "johndoe",
      endpoint: "/api/transfer",
      method: "POST",
      statusCode: 400,
      responseTime: 75,
      timestamp: "2023-07-15T08:20:30.000Z"
    },
    {
      id: 8,
      userId: 4,
      username: "janedoe",
      endpoint: "/api/transactions",
      method: "GET",
      statusCode: 200,
      responseTime: 150,
      timestamp: "2023-07-14T17:45:00.000Z"
    },
    {
      id: 9,
      userId: 6,
      username: "techinc",
      endpoint: "/api/subscriptions/cancel",
      method: "POST",
      statusCode: 200,
      responseTime: 195,
      timestamp: "2023-07-14T16:30:45.000Z"
    },
    {
      id: 10,
      userId: 2,
      username: "developer",
      endpoint: "/api/invoice",
      method: "GET",
      statusCode: 200,
      responseTime: 220,
      timestamp: "2023-07-14T15:15:30.000Z"
    }
  ];
  
  // Add more mock logs
  for (let i = 11; i <= 50; i++) {
    const userId = Math.floor(Math.random() * 5) + 2; // Random user ID between 2 and 6
    const username = ["developer", "johndoe", "janedoe", "acmecorp", "techinc"][userId - 2];
    const endpoint = ["/api/balance", "/api/transfer", "/api/transactions", "/api/invoice"][Math.floor(Math.random() * 4)];
    const method = ["GET", "POST"][Math.floor(Math.random() * 2)];
    const statusCode = [200, 201, 400, 401, 403, 500][Math.floor(Math.random() * 6)];
    const responseTime = Math.floor(Math.random() * 300) + 50;
    
    // Random date in the last week
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    
    mockLogs.push({
      id: i,
      userId,
      username,
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: date.toISOString()
    });
  }
  
  // Filter logs
  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "success" && log.statusCode >= 200 && log.statusCode < 300) ||
      (statusFilter === "client-error" && log.statusCode >= 400 && log.statusCode < 500) ||
      (statusFilter === "server-error" && log.statusCode >= 500);
    
    const matchesMethod = methodFilter === "all" || log.method === methodFilter;
    
    const matchesUserId = userIdFilter === "" || log.userId.toString() === userIdFilter;
    
    return matchesSearch && matchesStatus && matchesMethod && matchesUserId;
  });
  
  // Sort logs by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Paginate logs
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  // Total pages
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // Get status color
  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "bg-green-100 text-green-800";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "bg-amber-100 text-amber-800";
    } else if (statusCode >= 500) {
      return "bg-red-100 text-red-800";
    }
    return "bg-neutral-100 text-neutral-800";
  };
  
  // Get method color
  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-purple-100 text-purple-800";
      case "PUT":
        return "bg-amber-100 text-amber-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  // Get method icon
  const getMethodIcon = (method: string) => {
    switch (method) {
      case "GET":
        return <ArrowDown className="h-3 w-3" />;
      case "POST":
        return <ArrowUp className="h-3 w-3" />;
      case "PUT":
        return <ArrowRight className="h-3 w-3" />;
      case "DELETE":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Get unique user IDs for filter
  const uniqueUserIds = Array.from(new Set(mockLogs.map(log => log.userId)));

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading logs...</p>
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
              {error instanceof Error ? error.message : 'Failed to load logs. Please try again later.'}
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
              <List className="h-6 w-6 text-primary" />
              API Request Logs
            </h2>
            <p className="text-neutral-600">View and analyze API request logs</p>
          </div>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Request Logs</CardTitle>
                <CardDescription>
                  Showing {paginatedLogs.length} of {filteredLogs.length} logs
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="search"
                    placeholder="Search endpoints or users..."
                    className="pl-9 w-full md:w-60"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success (2xx)</SelectItem>
                    <SelectItem value="client-error">Client Error (4xx)</SelectItem>
                    <SelectItem value="server-error">Server Error (5xx)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Method</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={userIdFilter} onValueChange={setUserIdFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>User</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Users</SelectItem>
                    {uniqueUserIds.map(userId => (
                      <SelectItem key={userId} value={userId.toString()}>
                        User ID: {userId}
                      </SelectItem>
                    ))}
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
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-neutral-50">
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-neutral-500" />
                            <span>{formatDate(log.timestamp)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{log.username}</p>
                              <p className="text-xs text-neutral-500">ID: {log.userId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${getMethodColor(log.method)}`}>
                            {getMethodIcon(log.method)}
                            {log.method}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(log.statusCode)}`}>
                            {log.statusCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className={log.responseTime > 200 ? "text-amber-600" : "text-green-600"}>
                            {log.responseTime} ms
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No logs found matching the filters.
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
                  onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setPage(1); // Reset to first page when changing page size
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {totalPages > 1 && (
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
