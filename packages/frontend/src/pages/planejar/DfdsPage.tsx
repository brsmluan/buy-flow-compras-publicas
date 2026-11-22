// =============================================================================
// BUY-FLOW FRONTEND - DFDs Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaginated, apiPost, apiDelete } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, PageLoader } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { FileText, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, AlertTriangle, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { DFDStatus } from '@buy-flow/shared/index.js';

interface DFD {
  id: string;
  number: string;
  year: number;
  requestingOrgan: { id: string; name: string; acronym: string };
  requester: { id: string; name: string; email: string };
  objectDescription: string;
  justification: string;
  estimatedValue: number;
  budgetSource: { id: string; name: string; code: string };
  status: DFDStatus;
  attachments: any[];
  workflowHistory: any[];
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<DFDStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  under_review: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  returned: 'Devolvido',
  cancelled: 'Cancelado',
};

const statusColors: Record<DFDStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  draft: 'outline',
  submitted: 'default',
  under_review: 'warning',
  approved: 'success',
  rejected: 'destructive',
  returned: 'warning',
  cancelled: 'destructive',
};

export function DfdsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dfds, setDfds] = useState<DFD[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadDfds();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadDfds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiGetPaginated<DFD>(`/planejar/dfds?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setDfds(paginatedData.data);
        setTotal(paginatedData.meta.total);
        setTotalPages(paginatedData.meta.totalPages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar DFDs');
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

  const handleStatusChange = async (dfd: DFD, newStatus: DFDStatus) => {
    try {
      await apiPost(`/planejar/dfds/${dfd.id}/status`, { newStatus });
      toast.success('Status atualizado com sucesso');
      loadDfds();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao atualizar status');
    }
  };

  const handleDelete = async (dfd: DFD) => {
    if (!window.confirm('Tem certeza que deseja excluir este DFD?')) return;
    try {
      await apiDelete(`/planejar/dfds/${dfd.id}`);
      toast.success('DFD removido com sucesso');
      loadDfds();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover DFD');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">DFDs</h1>
          <p className="text-muted-foreground mt-1">Documentos de Formalização de Demanda</p>
        </div>
        <Button onClick={() => navigate('/planejar/dfds/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo DFD
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, objeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="">Todos os status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: 'number', label: 'Número/Ano', sortable: true },
                  { key: 'objectDescription', label: 'Objeto', sortable: false },
                  { key: 'requestingOrgan', label: 'Órgão Solicitante', sortable: true },
                  { key: 'estimatedValue', label: 'Valor Estimado', sortable: true },
                  { key: 'status', label: 'Status', sortable: true },
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
              {dfds.map((dfd) => (
                <tr key={dfd.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{dfd.number}/{dfd.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{dfd.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{dfd.requestingOrgan?.acronym || dfd.requestingOrgan?.name}</div>
                    <div className="text-xs text-muted-foreground">{dfd.requestingOrgan?.name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{formatCurrency(dfd.estimatedValue)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColors[dfd.status]}>
                      {statusLabels[dfd.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(dfd.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/planejar/dfds/${dfd.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/planejar/dfds/${dfd.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleStatusChange(dfd, dfd.status === 'draft' ? 'submitted' : dfd.status === 'submitted' ? 'under_review' : 'approved')}
                          >
                            {dfd.status === 'draft' ? 'Enviar para Análise' : dfd.status === 'submitted' ? 'Iniciar Análise' : 'Aprovar'}
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(dfd)}
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
              {dfds.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum DFD encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages} — {total} resultados
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}