import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useEffect } from "react";
import Login from "./pages/Login";
import Order from "./pages/Order";
import Summary from "./pages/Summary";
import Users from "./pages/Users";
import Menu from "./pages/Menu";
import RegisterCompany from "./pages/RegisterCompany";
import RegisterWithInvite from "./pages/RegisterWithInvite";
import CompanyRequests from "./pages/Admin/CompanyRequests";
import AdminCompanies from "./pages/Admin/Companies";
import AdminAllCompanies from "./pages/Admin/AllCompanies";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";

function Router() {
  const [location, setLocation] = useLocation();
  const { user, loading, refresh } = useAuthContext();

  // Routes that don't require authentication
  const publicRoutes = ["/login", "/register-company", "/register", "/404"];
  const adminRoutes = ["/admin/company-requests"];
  const companyRoutes = ["/menu", "/users"];
  const isPublicRoute = publicRoutes.some(route => location === route || location.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => location === route || location.startsWith(route));
  const isCompanyRoute = companyRoutes.some(route => location === route || location.startsWith(route));

  // Refetch auth when location changes (manual navigation to protected routes)
  useEffect(() => {
    refresh();
  }, [location, refresh]);

  useEffect(() => {
    // If the server reports a user, ensure localStorage is in sync and allow access.
    if (loading) return;

    if (user) {
      // keep username in localStorage for legacy pages
      try {
        localStorage.setItem("username", user.username || "");
      } catch {}

      // Redirect logged-in users away from login/register pages
      if (location === "/login" || location === "/register-company" || location === "/register") {
        setLocation("/");
        return;
      }

      // Check admin routes: only allow if user has NO companyId (is admin)
      if (isAdminRoute && user.companyId) {
        // Non-admin trying to access admin route - redirect to home
        setLocation("/");
        return;
      }

      // Check company routes: only allow if has companyId
      if (isCompanyRoute && !user.companyId) {
        // No company trying to access company route
        setLocation("/");
        return;
      }

      return;
    }

    // Not authenticated on server
    // If trying to access a public route, allow it
    if (isPublicRoute) {
      return;
    }

    // Not authenticated and trying to access protected/admin route: clear local cache and redirect to login
    try {
      localStorage.removeItem("username");
      localStorage.removeItem("auth-user-info");
    } catch {}

    if (location !== "/login") {
      setLocation("/login");
    }
  }, [location, setLocation, loading, user, isPublicRoute, isAdminRoute]);

  // Show loading while resolving auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin mb-4" style={{width:32, height:32, border:'4px solid rgba(0,0,0,0.1)', borderTopColor:'#F97316', borderRadius: '50%'}} />
          <p className="text-gray-600 font-cairo">التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register-company" component={RegisterCompany} />
      <Route path="/register" component={RegisterWithInvite} />
      <Route path="/admin/company-requests" component={CompanyRequests} />
      <Route path="/admin/companies" component={AdminCompanies} />
      <Route path="/admin/all-companies" component={AdminAllCompanies} />
      <Route path="/" component={Order} />
      <Route path="/summary" component={Summary} />
      <Route path="/users" component={Users} />
      <Route path="/menu" component={Menu} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {/* Centralized auth provider */}
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
