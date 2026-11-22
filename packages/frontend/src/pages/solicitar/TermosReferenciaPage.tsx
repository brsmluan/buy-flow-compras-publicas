// =============================================================================
// BUY-FLOW FRONTEND - Termos de Referência Page
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
import { ScrollText, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';

interface TermoReferencia {
  id: string;
  dfdId: string | null;
  etpId: string | null;
  title: string;
  objectDescription: string;
  specifications: string | null;
  quantities: any;
  estimatedValue: number;
  deliveryConditions: string | null;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  approvedAt: string | null;
  approvedBy: { id: string; name: string } | null;
  createdBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  dfd: { id: string; number: string; year: number } | null;
  etp: { id: string; title: string } | null;
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Em Revisão',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  draft: 'outline',
  review: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

export function TermosReferenciaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [termos, setTermos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTermos();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadTermos = async () => {
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

      const response = await apiGetPaginated<any>(`/solicitar/termos-referencia?${params.toString()}`);
      setTermos(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Termos de Referência');
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

  const handleApprove = async (termo: any) => {
    try {
      await apiPost(`/solicitar/termos-referencia/${termo.id}/approve`);
      toast.success('Termo de Referência aprovado com sucesso');
      loadTermos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao aprovar Termo');
    }
  };

  const handleDelete = async (termo: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este Termo de Referência?')) return;
    try {
      await apiDelete(`/solicitar/termos-referencia/${termo.id}`);
      toast.success('Termo de Referência removido com sucesso');
      loadTermos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Termo de Referência');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Termos de Referência</h1>
          <p className="text-muted-foreground mt-1">Especificações técnicas completas dos objetos de contratação</p>
        </div>
        <Button onClick={() => navigate('/solicitar/termos-referencia/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Termo
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, objeto..."
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
              <option value="draft">Rascunho</option>
              <option value="review">Em Revisão</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
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
                  { key: 'dfd', label: 'DFD', sortable: true },
                  { key: 'etp', label: 'ETP', sortable: true },
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
              {termos.map((termo) => (
                <tr key={termo.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{termo.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{termo.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3">
                    {termo.dfd ? (
                      <div className="font-mono text-sm">{termo.dfd.number}/{termo.dfd.year}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {termo.etp ? (
                      <div className="text-sm">{termo.etp.title}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{formatCurrency(termo.estimatedValue)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      draft: 'outline',
                      review: 'warning',
                      approved: 'success',
                      rejected: 'destructive',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[termo.status]}>
                      {({
                        draft: 'Rascunho',
                        review: 'Em Revisão',
                        approved: 'Aprovado',
                        rejected: 'Rejeitado',
                      } as Record<string, string>)[termo.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(termo.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/solicitar/termos-referencia/${termo.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/solicitar/termos-referencia/${termo.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {termo.status === 'draft' || termo.status === 'review' ? (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleApprove(termo)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aprovar
                            </button>
                          ) : null}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(termo)}
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
              {termos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum Termo de Referência encontrado
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

import { apiPost, apiDelete } from '../../lib/api';
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';