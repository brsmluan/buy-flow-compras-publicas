// =============================================================================
// BUY-FLOW FRONTEND - Risk Analysis Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaginated, apiPost, apiDelete } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, PageLoader } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, AlertTriangle as AlertTriangleIcon, CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { RiskLevel } from '@buy-flow/shared/types/index.js';

interface RiskAnalysis {
  id: string;
  tenantId: string;
  relatedEntityId: string;
  relatedEntityType: string;
  risks: any[];
  overallRiskLevel: RiskLevel;
  mitigationPlan: string | null;
  createdAt: string;
  updatedAt: string;
}

const riskLevelLabels: Record<RiskLevel, string> = {
  very_low: 'Muito Baixo',
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  very_high: 'Muito Alto',
  critical: 'Crítico',
};

const riskLevelColors: Record<RiskLevel, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  very_low: 'success',
  low: 'success',
  medium: 'warning',
  high: 'warning',
  very_high: 'destructive',
  critical: 'destructive',
};

export function RiskPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadRisks();
  }, [search, page, sortBy, sortOrder]);

  const loadRisks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);

      const response = await apiGetPaginated<any>(`/planejar/riscos?${params.toString()}`);
      setRisks(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Análises de Risco');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (risk: any) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Análise de Risco?')) return;
    try {
      await apiDelete(`/planejar/riscos/${risk.id}`);
      toast.success('Análise de Risco removida com sucesso');
      loadRisks();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Análise de Risco');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análise de Risco</h1>
          <p className="text-muted-foreground mt-1">Matriz de riscos das contratações</p>
        </div>
        <Button onClick={() => navigate('/planejar/riscos/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Análise
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, entidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: 'relatedEntityType', label: 'Entidade', sortable: true },
                  { key: 'overallRiskLevel', label: 'Nível Geral', sortable: true },
                  { key: 'mitigationPlan', label: 'Plano de Mitigação', sortable: false },
                  { key: 'createdAt', label: 'Criado em', sortable: true },
                  { key: 'actions', label: '', sortable: false },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortBy === col.key && (
                        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {risks.map((risk) => (
                <tr key={risk.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm capitalize">{risk.relatedEntityType}</div>
                    <div className="text-xs text-muted-foreground font-mono">{risk.relatedEntityId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      very_low: 'success',
                      low: 'success',
                      medium: 'warning',
                      high: 'warning',
                      very_high: 'destructive',
                      critical: 'destructive',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[risk.overallRiskLevel]}>
                      {({
                        very_low: 'Muito Baixo',
                        low: 'Baixo',
                        medium: 'Médio',
                        high: 'Alto',
                        very_high: 'Muito Alto',
                        critical: 'Crítico',
                      } as Record<string, string>)[risk.overallRiskLevel]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{risk.mitigationPlan || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(risk.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/planejar/riscos/${risk.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/planejar/riscos/${risk.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(risk)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {risks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma Análise de Risco encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import { apiPost, apiDelete } from '../../lib/api';
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Search } from 'lucide-react';