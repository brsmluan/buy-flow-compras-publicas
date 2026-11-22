// =============================================================================
// BUY-FLOW FRONTEND - Atas Page (Ata de Registro de Preços)
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
import { FileText, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';

interface Ata {
  id: string;
  number: string;
  year: number;
  biddingId: string;
  validityStart: string;
  validityEnd: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  bidding: { id: string; number: string; year: number; modality: string };
  items: any[];
}

export function AtasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [atas, setAtas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAtas();
  }, [search, page, sortBy, sortOrder]);

  const loadAtas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);

      const response = await apiGetPaginated<any>(`/contratar/atas?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setAtas(paginatedData.data);
        setTotal(paginatedData.meta.total);
        setTotalPages(paginatedData.meta.totalPages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Atas');
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

  const handleManageItems = async (ata: any) => {
    navigate(`/contratar/atas/${ata.id}/items`);
  };

  const handleRenew = async (ata: any) => {
    const newEnd = window.prompt('Nova data de vigência (YYYY-MM-DD):');
    if (!newEnd) return;
    try {
      await apiPost(`/contratar/atas/${ata.id}/renew`, { newValidityEnd: newEnd });
      toast.success('Ata renovada com sucesso');
      loadAtas();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao renovar');
    }
  };

  const handleDelete = async (ata: any) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Ata?')) return;
    try {
      await apiDelete(`/contratar/atas/${ata.id}`);
      toast.success('Ata removida com sucesso');
      loadAtas();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Ata');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atas de Registro de Preços</h1>
          <p className="text-muted-foreground mt-1">Atas de registro de preços para compras futuras</p>
        </div>
        <Button onClick={() => navigate('/contratar/atas/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Ata
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número..."
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
                  { key: 'bidding', label: 'Licitação', sortable: true },
                  { key: 'validityStart', label: 'Início Vigência', sortable: true },
                  { key: 'validityEnd', label: 'Fim Vigência', sortable: true },
                  { key: 'items', label: 'Itens', sortable: false },
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
              {atas.map((ata) => (
                <tr key={ata.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{ata.number}/{ata.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">{ata.bidding?.number}/{ata.bidding?.year}</div>
                    <div className="text-xs text-muted-foreground">{({
                      pregao_eletronico: 'Pregão Eletrônico',
                      pregao_presencial: 'Pregão Presencial',
                      concorrencia: 'Concorrência',
                      concurso: 'Concurso',
                      leilao: 'Leilão',
                      dispensa: 'Dispensa',
                      inexigibilidade: 'Inexigibilidade',
                      credenciamento: 'Credenciamento',
                      chamada_publica: 'Chamada Pública',
                      rdc: 'RDC',
                    } as Record<string, string>)[ata.bidding?.modality] || ata.bidding?.modality}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(ata.validityStart)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(ata.validityEnd)}
                    {new Date(ata.validityEnd) < new Date() && (
                      <span className="ml-1 text-destructive">(Vencida)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {ata.items?.length || 0} itens
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/contratar/atas/${ata.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleManageItems(ata)}>
                        <Package className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/contratar/atas/${ata.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleRenew(ata)}
                          >
                            <Clock className="w-4 h-4" />
                            Renovar Vigência
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(ata)}
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
              {atas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma Ata encontrada
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