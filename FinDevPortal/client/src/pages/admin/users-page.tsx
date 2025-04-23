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
  Users,
  User,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw
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

interface UserData {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Fetch users
  const { data: users, isLoading, error } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        const res = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('You do not have permission to access this resource');
          }
          throw new Error('Failed to fetch users');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    }
  });
  
  // Reset user password mutation (mock functionality)
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      // In a real app, this would call a backend API
      // For now, we'll just simulate a successful password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { userId, success: true };
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Password reset email has been sent to the user.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Change user role mutation (mock functionality)
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: number; newRole: string }) => {
      // In a real app, this would call a backend API
      // For now, we'll just simulate a successful role change
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { userId, newRole, success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Role Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.id.toString().includes(searchTerm);
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];
  
  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  // Total pages
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  
  // Format date
  const formatDate = (dateString: string) => {
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

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading users...</p>
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
              {error instanceof Error ? error.message : 'Failed to load users. Please try again later.'}
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
              <Users className="h-6 w-6 text-primary" />
              User Management
            </h2>
            <p className="text-neutral-600">Manage and view all users in the system</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">
              Total Users: <strong>{users?.length || 0}</strong>
            </span>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Showing {paginatedUsers.length} of {filteredUsers.length} users
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="pl-9 w-full md:w-60"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Role</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
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
                    <TableHead>User ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono">{user.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => resetPasswordMutation.mutate(user.id)}
                                disabled={resetPasswordMutation.isPending}
                              >
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => changeRoleMutation.mutate({ 
                                  userId: user.id, 
                                  newRole: user.role === 'admin' ? 'developer' : 'admin' 
                                })}
                                disabled={changeRoleMutation.isPending}
                              >
                                {user.role === 'admin' ? 'Make Developer' : 'Make Admin'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No users found matching the filters.
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
