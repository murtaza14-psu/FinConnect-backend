import { Switch, Route } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import PricingPage from "@/pages/pricing-page";
import DashboardPage from "@/pages/dashboard-page";
import BalancePage from "@/pages/balance-page";
import TransferPage from "@/pages/transfer-page";
import TransactionsPage from "@/pages/transactions-page";
import InvoicePage from "@/pages/invoice-page";
import SubscriptionPage from "@/pages/subscription-page";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import CheckoutPage from "@/pages/checkout";
import UsersPage from "@/pages/admin/users-page";
import SubscriptionsPage from "@/pages/admin/subscriptions-page";
import LogsPage from "@/pages/admin/logs-page";

// Create a simple home component that redirects to dashboard
function HomePage() {
  // This will redirect to the dashboard page
  window.location.href = '/dashboard';
  return <div className="flex items-center justify-center min-h-screen">Redirecting to dashboard...</div>;
}

function Router() {
  return (
    <Switch>
      {/* Root route redirects to dashboard */}
      <Route path="/">
        <HomePage />
      </Route>
      
      {/* Protected routes with subscription required */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} requiresSubscription={true} />
      <ProtectedRoute path="/balance" component={BalancePage} requiresSubscription={true} />
      <ProtectedRoute path="/transfer" component={TransferPage} requiresSubscription={true} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} requiresSubscription={true} />
      <ProtectedRoute path="/invoice" component={InvoicePage} requiresSubscription={true} />
      
      {/* Protected route without subscription requirement */}
      <ProtectedRoute path="/subscription" component={SubscriptionPage} requiresSubscription={false} />
      
      {/* Admin routes - admins bypass subscription requirements */}
      <ProtectedRoute path="/admin/users" component={UsersPage} requiresAdmin={true} />
      <ProtectedRoute path="/admin/subscriptions" component={SubscriptionsPage} requiresAdmin={true} />
      <ProtectedRoute path="/admin/logs" component={LogsPage} requiresAdmin={true} />
      
      {/* Public routes */}
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/pricing">
        <PricingPage />
      </Route>
      <Route path="/checkout">
        <CheckoutPage />
      </Route>
      <Route path="/subscription-success">
        <SubscriptionSuccessPage />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
