import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  PanelsTopLeft,
  BookOpen,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  FileText,
  Users,
  Banknote,
  List,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center gap-2 py-2 px-3 rounded text-neutral-800 mb-1 transition-colors",
        active ? "bg-primary/10 text-primary border-l-3 border-primary" : "hover:bg-primary/5"
      )}>
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const [user, setUser] = useState<{id: number, username: string, role: string} | null>(null);
  const [location, navigate] = useLocation();
  
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
          localStorage.removeItem('finconnect_token');
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
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

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        "flex flex-col w-64 border-r border-neutral-200 bg-white transition-all duration-300 ease-in-out",
        open ? "fixed inset-y-0 left-0 z-50" : "hidden md:flex"
      )}>
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium text-primary flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              FinConnect
            </h1>
            <p className="text-sm text-neutral-600 mt-1">Developer Portal</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-4">
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Main</p>
              <ul>
                <li>
                  <SidebarItem 
                    icon={<PanelsTopLeft className="h-4 w-4 text-neutral-500" />} 
                    label="Dashboard" 
                    href="/dashboard"
                    active={isActive("/dashboard")}
                  />
                </li>
                <li>
                  <SidebarItem 
                    icon={<BookOpen className="h-4 w-4 text-neutral-500" />} 
                    label="Documentation" 
                    href="/documentation"
                    active={isActive("/documentation")}
                  />
                </li>
                <li>
                  <SidebarItem 
                    icon={<CreditCard className="h-4 w-4 text-neutral-500" />} 
                    label="Subscription" 
                    href="/subscription"
                    active={isActive("/subscription")}
                  />
                </li>
              </ul>
            </div>
            
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">API Endpoints</p>
              <ul>
                <li>
                  <SidebarItem 
                    icon={<Wallet className="h-4 w-4 text-neutral-500" />} 
                    label="Balance" 
                    href="/balance"
                    active={isActive("/balance")}
                  />
                </li>
                <li>
                  <SidebarItem 
                    icon={<ArrowLeftRight className="h-4 w-4 text-neutral-500" />} 
                    label="Transfer" 
                    href="/transfer"
                    active={isActive("/transfer")}
                  />
                </li>
                <li>
                  <SidebarItem 
                    icon={<Receipt className="h-4 w-4 text-neutral-500" />} 
                    label="Transactions" 
                    href="/transactions"
                    active={isActive("/transactions")}
                  />
                </li>
                <li>
                  <SidebarItem 
                    icon={<FileText className="h-4 w-4 text-neutral-500" />} 
                    label="Invoice" 
                    href="/invoice"
                    active={isActive("/invoice")}
                  />
                </li>
              </ul>
            </div>
            
            {/* Admin Section (only visible to admin users) */}
            {user?.role === "admin" && (
              <div className="mb-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Admin</p>
                <ul>
                  <li>
                    <SidebarItem 
                      icon={<Users className="h-4 w-4 text-neutral-500" />} 
                      label="Users" 
                      href="/admin/users"
                      active={isActive("/admin/users")}
                    />
                  </li>
                  <li>
                    <SidebarItem 
                      icon={<Banknote className="h-4 w-4 text-neutral-500" />} 
                      label="Subscriptions" 
                      href="/admin/subscriptions"
                      active={isActive("/admin/subscriptions")}
                    />
                  </li>
                  <li>
                    <SidebarItem 
                      icon={<List className="h-4 w-4 text-neutral-500" />} 
                      label="Logs" 
                      href="/admin/logs"
                      active={isActive("/admin/logs")}
                    />
                  </li>
                </ul>
              </div>
            )}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary-light text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-neutral-800">{user?.username}</p>
              <p className="text-xs text-neutral-500">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-neutral-500 hover:text-neutral-700"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
