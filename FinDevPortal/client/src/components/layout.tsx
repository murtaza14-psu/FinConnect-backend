import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, HelpCircle, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<{id: number, username: string, role: string} | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('finconnect_token');
        if (!token) {
          navigate('/auth');
          return;
        }
        
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Unauthorized, redirect to login
          localStorage.removeItem('finconnect_token');
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/auth');
      }
    };
    
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('finconnect_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem('finconnect_token');
      navigate("/auth");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white border-b border-neutral-200 py-3 px-4 flex items-center justify-between">
          <button 
            className="md:hidden text-neutral-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center md:hidden">
            <h1 className="text-lg font-medium text-primary ml-2">FinConnect</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Input 
                type="text" 
                placeholder="Search..." 
                className="py-1.5 px-3 pl-9 w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Search className="h-4 w-4 text-neutral-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <Button variant="ghost" size="icon" className="relative text-neutral-600">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-full text-white text-xs flex items-center justify-center">3</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="text-neutral-600">
              <HelpCircle className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 md:hidden">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-neutral-500 hover:text-neutral-700 md:hidden"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-neutral-50">
          {children}
        </div>
      </main>
    </div>
  );
}
