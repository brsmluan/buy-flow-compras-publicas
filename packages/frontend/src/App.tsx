// =============================================================================
// BUY-FLOW FRONTEND - Main App Component with Routes
// =============================================================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTenant } from './contexts/TenantContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load heavy pages
const TenantsPage = lazy(() => import('./pages/platform/TenantsPage').then(m => ({ default: m.TenantsPage })));
const UsersPage = lazy(() => import('./pages/users/UsersPage').then(m => ({ default: m.UsersPage })));
const DfdsPage = lazy(() => import('./pages/planejar/DfdsPage').then(m => ({ default: m.DfdsPage })));
const EtpsPage = lazy(() => import('./pages/planejar/EtpsPage').then(m => ({ default: m.EtpsPage })));
const RiskPage = lazy(() => import('./pages/planejar/RiskPage').then(m => ({ default: m.RiskPage })));
const CotacoesPage = lazy(() => import('./pages/solicitar/CotacoesPage').then(m => ({ default: m.CotacoesPage })));
const TermosReferenciaPage = lazy(() => import('./pages/solicitar/TermosReferenciaPage').then(m => ({ default: m.TermosReferenciaPage })));
const LicitacoesPage = lazy(() => import('./pages/cotar/LicitacoesPage').then(m => ({ default: m.LicitacoesPage })));
const DispensasPage = lazy(() => import('./pages/cotar/DispensasPage').then(m => ({ default: m.DispensasPage })));
const InexigibilidadesPage = lazy(() => import('./pages/cotar/InexigibilidadesPage').then(m => ({ default: m.InexigibilidadesPage })));
const CredenciamentosPage = lazy(() => import('./pages/cotar/CredenciamentosPage').then(m => ({ default: m.CredenciamentosPage })));
const ChamadasPublicasPage = lazy(() => import('./pages/cotar/ChamadasPublicasPage').then(m => ({ default: m.ChamadasPublicasPage })));
const ContratosPage = lazy(() => import('./pages/contratar/ContratosPage').then(m => ({ default: m.ContratosPage })));
const AditivosPage = lazy(() => import('./pages/contratar/AditivosPage').then(m => ({ default: m.AditivosPage })));
const AtasPage = lazy(() => import('./pages/contratar/AtasPage').then(m => ({ default: m.AtasPage })));
const PedidosCompraPage = lazy(() => import('./pages/comprar/PedidosCompraPage').then(m => ({ default: m.PedidosCompraPage })));
const FornecedoresPage = lazy(() => import('./pages/cadastros/FornecedoresPage').then(m => ({ default: m.FornecedoresPage })));
const ItensPage = lazy(() => import('./pages/cadastros/ItensPage').then(m => ({ default: m.ItensPage })));
const OrgaosPage = lazy(() => import('./pages/cadastros/OrgaosPage').then(m => ({ default: m.OrgaosPage })));
const RelatoriosPage = lazy(() => import('./pages/relatorios/RelatoriosPage').then(m => ({ default: m.RelatoriosPage })));
const ConfiguracaoPage = lazy(() => import('./pages/configuracao/ConfiguracaoPage').then(m => ({ default: m.ConfiguracaoPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { currentTenant, isLoading: tenantLoading } = useTenant();

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Nenhuma prefeitura configurada</h1>
          <p className="text-muted-foreground">Entre em contato com o administrador da plataforma.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><RegisterPage /></PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute><ForgotPasswordPage /></PublicRoute>
      } />
      <Route path="/reset-password" element={
        <PublicRoute><ResetPasswordPage /></PublicRoute>
      } />

      {/* Protected Routes */}
      <Route element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Platform Owner/Admin only */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin']}>
            <TenantsPage />
          </ProtectedRoute>
        }>
          <Route path="/platform/tenants" element={<TenantsPage />} />
        </Route>

        {/* Tenant Admin+ */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin']}>
            <UsersPage />
          </ProtectedRoute>
        }>
          <Route path="/users" element={<UsersPage />} />
        </Route>

        {/* Planejar */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <DfdsPage />
          </ProtectedRoute>
        }>
          <Route path="/planejar/dfds" element={<DfdsPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <EtpsPage />
          </ProtectedRoute>
        }>
          <Route path="/planejar/etps" element={<EtpsPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <RiskPage />
          </ProtectedRoute>
        }>
          <Route path="/planejar/riscos" element={<RiskPage />} />
        </Route>

        {/* Solicitar */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <CotacoesPage />
          </ProtectedRoute>
        }>
          <Route path="/solicitar/cotacoes" element={<CotacoesPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <TermosReferenciaPage />
          </ProtectedRoute>
        }>
          <Route path="/solicitar/termos-referencia" element={<TermosReferenciaPage />} />
        </Route>

        {/* Cotar */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <LicitacoesPage />
          </ProtectedRoute>
        }>
          <Route path="/cotar/licitacoes" element={<LicitacoesPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <DispensasPage />
          </ProtectedRoute>
        }>
          <Route path="/cotar/dispensas" element={<DispensasPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <InexigibilidadesPage />
          </ProtectedRoute>
        }>
          <Route path="/cotar/inexigibilidades" element={<InexigibilidadesPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <CredenciamentosPage />
          </ProtectedRoute>
        }>
          <Route path="/cotar/credenciamentos" element={<CredenciamentosPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <ChamadasPublicasPage />
          </ProtectedRoute>
        }>
          <Route path="/cotar/chamadas-publicas" element={<ChamadasPublicasPage />} />
        </Route>

        {/* Contratar */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <ContratosPage />
          </ProtectedRoute>
        }>
          <Route path="/contratar/contratos" element={<ContratosPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <AditivosPage />
          </ProtectedRoute>
        }>
          <Route path="/contratar/aditivos" element={<AditivosPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <AtasPage />
          </ProtectedRoute>
        }>
          <Route path="/contratar/atas" element={<AtasPage />} />
        </Route>

        {/* Comprar */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator']}>
            <PedidosCompraPage />
          </ProtectedRoute>
        }>
          <Route path="/comprar/pedidos" element={<PedidosCompraPage />} />
        </Route>

        {/* Cadastros */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <FornecedoresPage />
          </ProtectedRoute>
        }>
          <Route path="/cadastros/fornecedores" element={<FornecedoresPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <ItensPage />
          </ProtectedRoute>
        }>
          <Route path="/cadastros/itens" element={<ItensPage />} />
        </Route>
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <OrgaosPage />
          </ProtectedRoute>
        }>
          <Route path="/cadastros/orgaos" element={<OrgaosPage />} />
        </Route>

        {/* Relatórios */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer']}>
            <RelatoriosPage />
          </ProtectedRoute>
        }>
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Route>

        {/* Configuração */}
        <Route element={
          <ProtectedRoute allowedRoles={['platform_owner', 'platform_admin', 'tenant_admin']}>
            <ConfiguracaoPage />
          </ProtectedRoute>
        }>
          <Route path="/configuracao" element={<ConfiguracaoPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <AppRoutes />
    </Suspense>
  );
}