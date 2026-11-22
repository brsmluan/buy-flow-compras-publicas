// =============================================================================
// BUY-FLOW FRONTEND - Cotações Page
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
import { FileText, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, Send, Package, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';

interface Cotacao {
  id: string;
  description: string;
  deadline: string;
  requestedBy: { id: string; name: string; email: string };
  status: 'draft' | 'sent' | 'received' | 'compared' | 'cancelled';
  sentAt: string | null;
  receivedAt: string | null;
  comparedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: any[];
  proposals: any[];
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  received: 'Recebida',
  compared: 'Comparada',
  cancelled: 'Cancelada',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  draft: 'outline',
  sent: 'default',
  received: 'warning',
  compared: 'success',
  cancelled: 'destructive',
};

export function CotacoesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadCotacoes();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadCotacoes = async () => {
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

      const response = await apiGetPaginated<any>(`/solicitar/cotacoes?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setCotacoes(paginatedData.data);
        setTotal(paginatedData.meta.total);
        setTotalPages(paginatedData.meta.totalPages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Cotações');
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

  const handleSend = async (cotacao: any) => {
    navigate(`/solicitar/cotacoes/${cotacao.id}/send`);
  };

  const handleReceive = async (cotacao: any) => {
    navigate(`/solicitar/cotacoes/${cotacao.id}/receive`);
  };

  const handleCompare = async (cotacao: any) => {
    navigate(`/solicitar/cotacoes/${cotacao.id}/compare`);
  };

  const handleDelete = async (cotacao: any) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Cotação?')) return;
    try {
      await apiDelete(`/solicitar/cotacoes/${cotacao.id}`);
      toast.success('Cotação removida com sucesso');
      loadCotacoes();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Cotação');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cotações</h1>
          <p className="text-muted-foreground mt-1">Solicitação e comparação de cotações de preços</p>
        </div>
        <Button onClick={() => navigate('/solicitar/cotacoes/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Cotação
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição..."
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
              <option value="sent">Enviada</option>
              <option value="received">Recebida</option>
              <option value="compared">Comparada</option>
              <option value="cancelled">Cancelada</option>
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
                  { key: 'description', label: 'Descrição', sortable: false },
                  { key: 'deadline', label: 'Prazo', sortable: true },
                  { key: 'requestedBy', label: 'Solicitante', sortable: true },
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
              {cotacoes.map((cotacao) => (
                <tr key={cotacao.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{cotacao.description}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(cotacao.deadline)}
                  </td>
                  <td className="px-4 py-3 text-sm">{cotacao.requestedBy?.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      draft: 'outline',
                      sent: 'default',
                      received: 'warning',
                      compared: 'success',
                      cancelled: 'destructive',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[cotacao.status]}>
                      {({
                        draft: 'Rascunho',
                        sent: 'Enviada',
                        received: 'Recebida',
                        compared: 'Comparada',
                        cancelled: 'Cancelada',
                      } as Record<string, string>)[cotacao.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(cotacao.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/solicitar/cotacoes/${cotacao.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/solicitar/cotacoes/${cotacao.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {cotacao.status === 'draft' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleSend(cotacao)}
                            >
                              <Send className="w-4 h-4" />
                              Enviar para Fornecedores
                            </button>
                          )}
                          {cotacao.status === 'sent' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleReceive(cotacao)}
                            >
                              <Package className="w-4 h-4" />
                              Receber Propostas
                            </button>
                          )}
                          {cotacao.status === 'received' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleCompare(cotacao)}
                            >
                              <BarChart2 className="w-4 h-4" />
                              Comparar Propostas
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(cotacao)}
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
              {cotacoes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma Cotação encontrada
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