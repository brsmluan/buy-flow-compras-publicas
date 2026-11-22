// =============================================================================
// BUY-FLOW FRONTEND - Dispensas Page
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

interface Dispensa {
  id: string;
  biddingId: string;
  subType: string;
  legalBasis: string;
  justification: string;
  supplierId: string | null;
  ratificationAuthorityId: string;
  authorizationAuthorityId: string;
  ratificationDate: string | null;
  authorizationDate: string | null;
  createdAt: string;
  updatedAt: string;
  bidding: { id: string; number: string; year: number; objectDescription: string; estimatedValue: number };
  supplier: { id: string; name: string; tradeName: string } | null;
}

const subTypeLabels: Record<string, string> = {
  valor: 'Por Valor',
  emergencia: 'Emergência/Calamidade',
  seguranca: 'Segurança Nacional',
  doacao: 'Doação com Encargos',
  concessao: 'Concessão de Serviço Público',
  permissao: 'Permissão de Serviço Público',
  locacao: 'Locação de Imóvel',
  remuneracao: 'Remuneração de Servidor',
  intercambio: 'Intercâmbio Cultural/Científico',
  pesquisa: 'Pesquisa/Desenvolvimento',
};

export function DispensasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dispensas, setDispensas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadDispensas();
  }, [search, page, sortBy, sortOrder]);

  const loadDispensas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);

      const response = await apiGetPaginated<any>(`/cotar/dispensas?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setDispensas(paginatedData.data);
        setTotal(paginatedData.meta.total);
        setTotalPages(paginatedData.meta.totalPages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Dispensas');
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

  const handleRatify = async (dispensa: any) => {
    if (!window.confirm('Ratificar esta Dispensa?')) return;
    try {
      await apiPost(`/cotar/dispensas/${dispensa.id}/ratify`);
      toast.success('Dispensa ratificada com sucesso');
      loadDispensas();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao ratificar');
    }
  };

  const handleAuthorize = async (dispensa: any) => {
    if (!window.confirm('Autorizar esta Dispensa?')) return;
    try {
      await apiPost(`/cotar/dispensas/${dispensa.id}/authorize`);
      toast.success('Dispensa autorizada com sucesso');
      loadDispensas();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao autorizar');
    }
  };

  const handleDelete = async (dispensa: any) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Dispensa?')) return;
    try {
      await apiDelete(`/cotar/dispensas/${dispensa.id}`);
      toast.success('Dispensa removida com sucesso');
      loadDispensas();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Dispensa');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dispensas de Licitação</h1>
          <p className="text-muted-foreground mt-1">Dispensa de licitação por valor, emergência, etc.</p>
        </div>
        <Button onClick={() => navigate('/cotar/dispensas/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Dispensa
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
                  { key: 'subType', label: 'Subtipo', sortable: true },
                  { key: 'objectDescription', label: 'Objeto', sortable: false },
                  { key: 'estimatedValue', label: 'Valor', sortable: true },
                  { key: 'ratificationDate', label: 'Ratificação', sortable: true },
                  { key: 'authorizationDate', label: 'Autorização', sortable: true },
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
              {dispensas.map((dispensa) => (
                <tr key={dispensa.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{dispensa.number}/{dispensa.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{({
                      valor: 'Por Valor',
                      emergencia: 'Emergência',
                      seguranca: 'Segurança',
                      doacao: 'Doação',
                      concessao: 'Concessão',
                      permissao: 'Permissão',
                      locacao: 'Locação',
                      remuneracao: 'Remuneração',
                      intercambio: 'Intercâmbio',
                      pesquisa: 'Pesquisa',
                    } as Record<string, string>)[dispensa.subType] || dispensa.subType}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{dispensa.bidding?.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{formatCurrency(dispensa.bidding?.estimatedValue || 0)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dispensa.ratificationDate ? formatDate(dispensa.ratificationDate) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dispensa.authorizationDate ? formatDate(dispensa.authorizationDate) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/dispensas/${dispensa.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/dispensas/${dispensa.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {!dispensa.ratificationDate && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleRatify(dispensa)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Ratificar
                            </button>
                          )}
                          {dispensa.ratificationDate && !dispensa.authorizationDate && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleAuthorize(dispensa)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Autorizar
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(dispensa)}
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
              {dispensas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma Dispensa encontrada
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