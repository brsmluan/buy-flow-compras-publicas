// =============================================================================
// BUY-FLOW FRONTEND - Main Layout with Sidebar Navigation
// =============================================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard, Users, FileText, ClipboardList, AlertTriangle,
  ShoppingCart, Gavel, FileSignature, Building2, Package, Boxes,
  Briefcase, ScrollText, Settings, LogOut, Menu, X, ChevronDown,
  ChevronRight, Building, Shield, BarChart3, Bell, Moon, Sun,
  Search, User, CreditCard, Wallet, Truck, Factory, Hammer,
  Landmark, Scale, FileCheck, Archive, Plus, Filter, Download,
  RefreshCw, Eye, Edit, Trash2, MoreHorizontal, Home, HelpCircle
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'],
  },
  {
    name: 'Planejar',
    icon: ClipboardList,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'],
    children: [
      { name: 'DFDs', href: '/planejar/dfds', icon: FileText, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
      { name: 'ETPs', href: '/planejar/etps', icon: ClipboardList, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
      { name: 'Análise de Risco', href: '/planejar/riscos', icon: AlertTriangle, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
    ],
  },
  {
    name: 'Solicitar',
    icon: ShoppingCart,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'],
    children: [
      { name: 'Cotações', href: '/solicitar/cotacoes', icon: FileText, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
      { name: 'Termos de Referência', href: '/solicitar/termos-referencia', icon: ScrollText, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
    ],
  },
  {
    name: 'Cotar',
    icon: Gavel,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'],
    children: [
      { name: 'Licitações', href: '/cotar/licitacoes', icon: Building2, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
      { name: 'Dispensas', href: '/cotar/dispensas', icon: FileSignature, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
      { name: 'Inexigibilidades', href: '/cotar/inexigibilidades', icon: Scale, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
      { name: 'Credenciamentos', href: '/cotar/credenciamentos', icon: Briefcase, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
      { name: 'Chamadas Públicas', href: '/cotar/chamadas-publicas', icon: Landmark, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
    ],
  },
  {
    name: 'Contratar',
    icon: FileSignature,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'],
    children: [
      { name: 'Contratos', href: '/contratar/contratos', icon: FileCheck, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
      { name: 'Aditivos', href: '/contratar/aditivos', icon: FileText, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
      { name: 'Atas de RP', href: '/contratar/atas', icon: Archive, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
    ],
  },
  {
    name: 'Comprar',
    icon: Package,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'],
    children: [
      { name: 'Pedidos de Compra', href: '/comprar/pedidos', icon: ShoppingCart, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator'] },
    ],
  },
  {
    name: 'Cadastros',
    icon: Boxes,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'],
    children: [
      { name: 'Fornecedores', href: '/cadastros/fornecedores', icon: Building2, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
      { name: 'Itens (CATMAT/CATSER)', href: '/cadastros/itens', icon: Boxes, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
      { name: 'Órgãos/Secretarias', href: '/cadastros/orgaos', icon: Landmark, roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'] },
    ],
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer'],
  },
  {
    name: 'Configuração',
    href: '/configuracao',
    icon: Settings,
    roles: ['platform_owner', 'platform_admin', 'tenant_admin'],
  },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentTenant, availableTenants, switchTenant } = useTenant();

  React.useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) setDarkMode(saved === 'true');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const filteredNav = navigation.filter((item) =>
    !item.roles || (user && item.roles.includes(user.role))
  ).map((item) => ({
    ...item,
    children: item.children?.filter((child) =>
      !child.roles || (user && child.roles.includes(user.role))
    ) || [],
  })).filter((item) => !item.children || item.children.length > 0);

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed lg:static z-50 w-64 h-screen bg-card border-r border-border flex flex-col',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">Buy-Flow</span>
          </NavLink>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {availableTenants.length > 1 && (
          <div className="p-4 border-b border-border">
            <label htmlFor="tenant-select" className="block text-sm font-medium text-muted-foreground mb-2">
              Prefeitura
            </label>
            <select
              id="tenant-select"
              value={currentTenant?.id || ''}
              onChange={(e) => switchTenant(e.target.value)}
              className="w-full px-3 py-2 bg-background border-border border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {availableTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navegação principal">
          {filteredNav.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <NavLink
              to="/profile"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                location.pathname === '/profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <User className="w-4 h-4" />
              Perfil
            </NavLink>
            <button
              onClick={() => logout()}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full',
                'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-accent"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-foreground hidden sm:block">
              {filteredNav.find(item => item.href === location.pathname)?.name ||
               filteredNav.flatMap(i => i.children || []).find(c => c.href === location.pathname)?.name ||
               'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar..."
                className="w-64 pl-10 pr-4 py-2 bg-background border-border border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
              aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
                id="user-menu-button"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-card border-border border rounded-lg shadow-lg py-1 hidden group-data-[open]:block" role="menu">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  role="menuitem"
                >
                  <User className="w-4 h-4" />
                  Perfil
                </NavLink>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left" role="menuitem">
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left" role="menuitem">
                  <HelpCircle className="w-4 h-4" />
                  Ajuda
                </button>
                <hr className="my-1 border-border" />
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent hover:text-destructive w-full text-left"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface NavItemProps {
  item: {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
    children?: Array<{
      name: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      roles?: string[];
    }>;
  };
}

function NavItem({ item }: NavItemProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = item.href ? location.pathname === item.href :
    item.children?.some((child) => location.pathname === child.href);

  if (item.children && item.children.length > 0) {
    return (
      <div className="group">
        <button
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 truncate">{item.name}</span>
          <ChevronRight className={cn('w-4 h-4 flex-shrink-0 transition-transform', isOpen && 'rotate-90')} />
        </button>
        {isOpen && (
          <div className="mt-1 ml-6 space-y-0.5 animate-in">
            {item.children.map((child) => (
              <NavLink
                key={child.name}
                to={child.href}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <child.icon className="w-4 h-4 flex-shrink-0" />
                {child.name}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href || '#'}
      className={({ isActive }) => cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{item.name}</span>
    </NavLink>
  );
}