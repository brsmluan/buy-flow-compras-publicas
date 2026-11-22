// =============================================================================
// BUY-FLOW FRONTEND - Chamadas Públicas Page
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

interface ChamadaPublica {
  id: string;
  biddingId: string;
  editalUrl: string | null;
  projectDescription: string;
  selectionCriteria: any[];
  selectedProjects: any[];
  createdAt: string;
  updatedAt: string;
  bidding: { id: string; number: string; year: number; objectDescription: string; estimatedValue: number };
}

export function ChamadasPublicasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chamadas, setChamadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadChamadas();
  }, [search, page, sortBy, sortOrder]);

  const loadChamadas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);

      const response = await apiGetPaginated<any>(`/cotar/chamadas-publicas?${params.toString()}`);
      setChamadas(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Chamadas Públicas');
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

  const handlePublish = async (chamada: any) => {
    const editalUrl = window.prompt('URL do Edital:');
    if (!editalUrl) return;
    try {
      await apiPost(`/cotar/chamadas-publicas/${chamada.id}/publish`, { editalUrl });
      toast.success('Edital publicado com sucesso');
      loadChamadas();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao publicar');
    }
  };

  const handleSelect = async (chamada: any) => {
    navigate(`/cotar/chamadas-publicas/${chamada.id}/select`);
  };

  const handleDelete = async (chamada: any) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Chamada Pública?')) return;
    try {
      await apiDelete(`/cotar/chamadas-publicas/${chamada.id}`);
      toast.success('Chamada Pública removida com sucesso');
      loadChamadas();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Chamada Pública');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chamadas Públicas</h1>
          <p className="text-muted-foreground mt-1">Chamamento público para parcerias e projetos sociais</p>
        </div>
        <Button onClick={() => navigate('/cotar/chamadas-publicas/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Chamada
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
                  { key: 'projectDescription', label: 'Descrição do Projeto', sortable: false },
                  { key: 'editalUrl', label: 'Edital', sortable: false },
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
              {chamadas.map((chamada) => (
                <tr key={chamada.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{chamada.number}/{chamada.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{chamada.projectDescription}</div>
                  </td>
                  <td className="px-4 py-3">
                    {chamada.editalUrl ? (
                      <a href={chamada.editalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Ver Edital
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Sem edital</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/chamadas-publicas/${chamada.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/chamadas-publicas/${chamada.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {!chamada.editalUrl && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handlePublish(chamada)}
                            >
                              <FileText className="w-4 h-4" />
                              Publicar Edital
                            </button>
                          )}
                          {chamada.editalUrl && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleSelect(chamada)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Selecionar Projetos
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(chamada)}
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
              {chamadas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma Chamada Pública encontrada
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