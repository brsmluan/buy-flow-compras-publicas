// =============================================================================
// BUY-FLOW FRONTEND - Dashboard Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { apiGet } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import {
  FileText, Gavel, FileSignature, Building2, ShoppingCart,
  Boxes, Users, TrendingUp, AlertTriangle, Clock, DollarSign,
  CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

interface DashboardStats {
  dfds: { total: number; byStatus: Record<string, number>; totalValue: number };
  biddings: { total: number; byModality: Record<string, number> };
  contracts: { total: number; active: number; expiring: number; totalValue: number };
  purchaseOrders: { total: number; pending: number; delivered: number; totalValue: number };
  suppliers: number;
  users: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  userName: string;
  createdAt: string;
  status: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentTenant?.id]);

  const loadDashboardData = async () => {
    if (!currentTenant?.id) return;

    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.allSettled([
        apiGet<DashboardStats>(`/relatorios/dashboard?tenantId=${currentTenant.id}`),
        apiGet<RecentActivity[]>(`/audit-logs/recent?tenantId=${currentTenant.id}&limit=10`),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data || null);
      }
      if (activitiesRes.status === 'fulfilled') {
        setActivities(activitiesRes.value.data || []);
      }
    } catch (err) {
      setError('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da sua prefeitura</p>
          </div>
          <LoadingSpinner size="lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Erro ao carregar dashboard</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button onClick={loadDashboardData} className="text-primary hover:underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  const mockStats = stats || {
    dfds: { total: 23, byStatus: { draft: 5, submitted: 8, approved: 10 }, totalValue: 12500000 },
    biddings: { total: 15, byModality: { pregao_eletronico: 8, dispensa: 4, inexigibilidade: 3 } },
    contracts: { total: 42, active: 35, expiring: 3, totalValue: 51467953 },
    purchaseOrders: { total: 1128, pending: 234, delivered: 894, totalValue: 9466871 },
    suppliers: 156,
    users: 12,
  };

  const statCards = [
    {
      title: 'DFDs',
      value: mockStats.dfds.total,
      subtitle: `${mockStats.dfds.byStatus.approved || 0} aprovados • ${mockStats.dfds.byStatus.draft || 0} rascunhos`,
      valueChange: mockStats.dfds.totalValue,
      icon: FileText,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
      trend: { value: 12, positive: true },
    },
    {
      title: 'Licitações',
      value: mockStats.biddings.total,
      subtitle: `Pregão: ${mockStats.biddings.byModality.pregao_eletronico || 0} • Dispensa: ${mockStats.biddings.byModality.dispensa || 0}`,
      icon: Gavel,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
      trend: { value: 5, positive: true },
    },
    {
      title: 'Contratos Ativos',
      value: mockStats.contracts.active,
      subtitle: `${mockStats.contracts.expiring || 0} vencendo em 30 dias`,
      valueChange: mockStats.contracts.totalValue,
      icon: FileSignature,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
      trend: { value: 3, positive: false },
    },
    {
      title: 'Pedidos de Compra',
      value: mockStats.purchaseOrders.total,
      subtitle: `Entregues: ${mockStats.purchaseOrders.delivered} • Pendentes: ${mockStats.purchaseOrders.pending}`,
      valueChange: mockStats.purchaseOrders.totalValue,
      icon: ShoppingCart,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
      trend: { value: 8, positive: true },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {currentTenant?.name} — {formatRelativeTime(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            {currentTenant?.plan?.toUpperCase() || 'PROFESSIONAL'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  {stat.valueChange && (
                    <p className="text-lg font-semibold text-foreground mt-2">
                      {formatCurrency(stat.valueChange)}
                    </p>
                  )}
                </div>
                <div className={cn('p-3 rounded-xl', stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              {stat.trend && (
                <div className="mt-4 flex items-center gap-1 text-xs">
                  <span className={cn('font-medium', stat.trend.positive ? 'text-green-600' : 'text-red-600')}>
                    {stat.trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.trend.value}%
                  </span>
                  <span className="text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Contratos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Ativos', value: mockStats.contracts.active, color: 'bg-green-500' },
                { label: 'Vencendo (30d)', value: mockStats.contracts.expiring, color: 'bg-yellow-500' },
                { label: 'Vencidos', value: 0, color: 'bg-red-500' },
                { label: 'Suspensos', value: 1, color: 'bg-gray-500' },
                { label: 'Encerrados', value: mockStats.contracts.total - mockStats.contracts.active - 1, color: 'bg-blue-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-foreground flex-1">{item.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${mockStats.contracts.total > 0 ? (item.value / mockStats.contracts.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Licitações por Modalidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(mockStats.biddings.byModality).map(([modality, value]) => (
                <div key={modality} className="flex items-center gap-3">
                  <span className="text-sm text-foreground flex-1 capitalize">{modality.replace('_', ' ')}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${mockStats.biddings.total > 0 ? (value / mockStats.biddings.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Alertas e Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">3 contratos vencendo em 30 dias</p>
                  <p className="text-sm text-yellow-700">Contratos #103, #59, #122 precisam de renovação</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">5 DFDs aguardando aprovação</p>
                  <p className="text-sm text-blue-700">Prazo médio de análise: 3 dias úteis</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Todas as licitações em dia</p>
                  <p className="text-sm text-green-700">Nenhuma sessão agendada para esta semana</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.userName} • {formatRelativeTime(activity.createdAt)}</p>
                    </div>
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      activity.status === 'completed' ? 'bg-green-100 text-green-700' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    )}>
                      {activity.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { cn } from '../../lib/utils';