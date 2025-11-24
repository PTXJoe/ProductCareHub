import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Package, Users, History, BarChart3, Shield, UserCircle, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import RegisterProduct from "@/pages/register-product";
import ProductDetail from "@/pages/product-detail";
import SupportRequest from "@/pages/support-request";
import Brands from "@/pages/brands";
import Community from "@/pages/community";
import SupportHistory from "@/pages/support-history";
import CreateBrand from "@/pages/create-brand";
import ServiceProviders from "@/pages/service-providers";
import RegisterProvider from "@/pages/register-provider";
import Analytics from "@/pages/analytics";
import WarrantyCertificate from "@/pages/warranty-certificate";
import InsuranceExtensions from "@/pages/insurance-extensions";
import ClientProfile from "@/pages/client-profile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6">
          <div className="p-4 rounded-lg bg-primary text-primary-foreground inline-block">
            <Package className="h-12 w-12" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Warranty Manager</h1>
            <p className="text-muted-foreground mb-6">Gerencie suas garantias com facilidade</p>
          </div>
          <a href="/api/login">
            <Button size="lg" data-testid="button-login">
              Entrar com Google
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/registar" component={RegisterProduct} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/produto/:id/suporte" component={SupportRequest} />
      <Route path="/marcas" component={Brands} />
      <Route path="/marcas/criar" component={CreateBrand} />
      <Route path="/comunidade" component={Community} />
      <Route path="/historico-reclamacoes" component={SupportHistory} />
      <Route path="/provedores" component={ServiceProviders} />
      <Route path="/provedores/registar" component={RegisterProvider} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/certificado/:id" component={WarrantyCertificate} />
      <Route path="/extensoes-garantia" component={InsuranceExtensions} />
      <Route path="/perfil" component={ClientProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Navigation() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group" data-testid="link-logo">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg group-hover:text-primary transition-colors">
                Warranty Manager
              </span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant={isActive("/") && !location.includes("/produto") && !location.includes("/registar") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-dashboard"
              >
                <Package className="h-4 w-4 mr-2" />
                Meus Produtos
              </Button>
            </Link>
            <Link href="/marcas">
              <Button
                variant={isActive("/marcas") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-brands"
              >
                <Package className="h-4 w-4 mr-2" />
                Marcas
              </Button>
            </Link>
            <Link href="/comunidade">
              <Button
                variant={isActive("/comunidade") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-community"
              >
                <Users className="h-4 w-4 mr-2" />
                Comunidade
              </Button>
            </Link>
            <Link href="/historico-reclamacoes">
              <Button
                variant={isActive("/historico") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-history"
              >
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </Link>
            <Link href="/provedores">
              <Button
                variant={isActive("/provedores") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-providers"
              >
                <Users className="h-4 w-4 mr-2" />
                Provedores
              </Button>
            </Link>
            <Link href="/analytics">
              <Button
                variant={isActive("/analytics") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-analytics"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/extensoes-garantia">
              <Button
                variant={isActive("/extensoes") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-extensions"
              >
                <Shield className="h-4 w-4 mr-2" />
                Extensões
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/perfil">
            <Button
              variant={isActive("/perfil") ? "secondary" : "ghost"}
              size="icon"
              data-testid="button-profile"
            >
              <UserCircle className="h-5 w-5" />
            </Button>
          </Link>
          <a href="/api/logout">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
