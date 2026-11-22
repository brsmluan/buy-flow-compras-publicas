// =============================================================================
// BUY-FLOW FRONTEND - ETPs Page
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
import { ClipboardList, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, AlertTriangle, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { ETPStatus } from '@buy-flow/shared/index.js';

interface ETP {
  id: string;
  dfdId: string;
  title: string;
  problemDescription: string;
  solutionDescription: string;
  requirements: any[];
  estimatedValue: number;
  marketResearch: string | null;
  risks: any[];
  alternatives: any[];
  status: ETPStatus;
  attachments: any[];
  createdAt: string;
  updatedAt: string;
  dfd: { id: string; number: string; year: number; objectDescription: string };
}

const statusLabels: Record<ETPStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  under_review: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  returned: 'Devolvido',
};

const statusColors: Record<ETPStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  draft: 'outline',
  submitted: 'default',
  under_review: 'warning',
  approved: 'success',
  rejected: 'destructive',
  returned: 'warning',
};

export function EtpsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [etps, setEtps] = useState<ETP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadEtps();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadEtps = async () => {
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

      const response = await apiGetPaginated<ETP>(`/planejar/etps?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setEtps(paginatedData.data);
        setTotal(paginatedData.meta.total);
        setTotalPages(paginatedData.meta.totalPages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar ETPs');
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

  const handleStatusChange = async (etp: ETP, newStatus: ETPStatus) => {
    try {
      await apiPost(`/planejar/etps/${etp.id}/status`, { status: newStatus });
      toast.success('Status atualizado com sucesso');
      loadEtps();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao atualizar status');
    }
  };

  const handleDelete = async (etp: ETP) => {
    if (!window.confirm('Tem certeza que deseja excluir este ETP?')) return;
    try {
      await apiDelete(`/planejar/etps/${etp.id}`);
      toast.success('ETP removido com sucesso');
      loadEtps();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover ETP');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ETPs</h1>
          <p className="text-muted-foreground mt-1">Estudos Técnicos Preliminares</p>
        </div>
        <Button onClick={() => navigate('/planejar/etps/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo ETP
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, problema..."
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
              {Object.entries({
                draft: 'Rascunho',
                submitted: 'Enviado',
                under_review: 'Em Análise',
                approved: 'Aprovado',
                rejected: 'Rejeitado',
                returned: 'Devolvido',
              }).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: 'title', label: 'Título', sortable: true },
                  { key: 'dfd', label: 'DFD Origem', sortable: true },
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
              {etps.map((etp) => (
                <tr key={etp.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{etp.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{etp.problemDescription}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">{etp.dfd.number}/{etp.dfd.year}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{etp.dfd.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{formatCurrency(etp.estimatedValue)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      draft: 'outline',
                      submitted: 'default',
                      under_review: 'warning',
                      approved: 'success',
                      rejected: 'destructive',
                      returned: 'warning',
                    } as Record<ETPStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[etp.status]}>
                      {({
                        draft: 'Rascunho',
                        submitted: 'Enviado',
                        under_review: 'Em Análise',
                        approved: 'Aprovado',
                        rejected: 'Rejeitado',
                        returned: 'Devolvido',
                      } as Record<ETPStatus, string>)[etp.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(etp.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/planejar/etps/${etp.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/planejar/etps/${etp.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleStatusChange(etp, etp.status === 'draft' ? 'submitted' : etp.status === 'submitted' ? 'under_review' : 'approved')}
                          >
                            {etp.status === 'draft' ? 'Enviar para Análise' : etp.status === 'submitted' ? 'Iniciar Análise' : 'Aprovar'}
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(etp)}
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
              {etps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum ETP encontrado
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