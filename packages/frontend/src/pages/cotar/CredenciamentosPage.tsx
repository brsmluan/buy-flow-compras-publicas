// =============================================================================
// BUY-FLOW FRONTEND - Credenciamentos Page
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
import { FileText, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, FileText as FileTextIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';

interface Credenciamento {
  id: string;
  biddingId: string;
  editalUrl: string | null;
  habilitationStart: string | null;
  habilitationEnd: string | null;
  qualifiedSuppliers: any[];
  createdAt: string;
  updatedAt: string;
  bidding: { id: string; number: string; year: number; objectDescription: string; estimatedValue: number };
}

export function CredenciamentosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [credenciamentos, setCredenciamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadCredenciamentos();
  }, [search, page, sortBy, sortOrder]);

  const loadCredenciamentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);

      const response = await apiGetPaginated<any>(`/cotar/credenciamentos?${params.toString()}`);
      setCredenciamentos(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Credenciamentos');
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

  const handlePublish = async (credenciamento: any) => {
    const editalUrl = window.prompt('URL do Edital:');
    if (!editalUrl) return;
    try {
      await apiPost(`/cotar/credenciamentos/${credenciamento.id}/publish`, { editalUrl });
      toast.success('Edital publicado com sucesso');
      loadCredenciamentos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao publicar');
    }
  };

  const handleHabilitate = async (credenciamento: any) => {
    navigate(`/cotar/credenciamentos/${credenciamento.id}/habilitate`);
  };

  const handleDelete = async (credenciamento: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este Credenciamento?')) return;
    try {
      await apiDelete(`/cotar/credenciamentos/${credenciamento.id}`);
      toast.success('Credenciamento removido com sucesso');
      loadCredenciamentos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Credenciamento');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Credenciamentos</h1>
          <p className="text-muted-foreground mt-1">Credenciamento de fornecedores para demanda contínua</p>
        </div>
        <Button onClick={() => navigate('/cotar/credenciamentos/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Credenciamento
        </Button>
      </div>

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
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: 'number', label: 'Número/Ano', sortable: true },
                  { key: 'objectDescription', label: 'Objeto', sortable: false },
                  { key: 'habilitationStart', label: 'Início Habilitação', sortable: true },
                  { key: 'habilitationEnd', label: 'Fim Habilitação', sortable: true },
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
              {credenciamentos.map((credenciamento) => (
                <tr key={credenciamento.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{credenciamento.number}/{credenciamento.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{credenciamento.bidding?.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {credenciamento.habilitationStart ? formatDate(credenciamento.habilitationStart) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {credenciamento.habilitationEnd ? formatDate(credenciamento.habilitationEnd) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/credenciamentos/${credenciamento.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/credenciamentos/${credenciamento.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {!credenciamento.editalUrl && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handlePublish(credenciamento)}
                            >
                              <FileText className="w-4 h-4" />
                              Publicar Edital
                            </button>
                          )}
                          {credenciamento.editalUrl && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleHabilitate(credenciamento)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Habilitar Fornecedores
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(credenciamento)}
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
              {credenciamentos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum Credenciamento encontrado
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
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, ChevronLeft, ChevronRight } from 'lucide-react';