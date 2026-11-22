// =============================================================================
// BUY-FLOW FRONTEND - Contratos Page
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
import { FileSignature, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { ContractStatus } from '@buy-flow/shared/index.js';

interface Contrato {
  id: string;
  number: string;
  year: number;
  processNumber: string | null;
  biddingId: string | null;
  modality: string;
  supplierId: string;
  organId: string;
  managerId: string;
  objectDescription: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  contractFileUrl: string | null;
  signedAt: string | null;
  signedBy: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: { id: string; name: string; tradeName: string };
  organ: { id: string; name: string; acronym: string };
  manager: { id: string; name: string; email: string };
  bidding: { id: string; number: string; year: number; modality: string } | null;
  _count: { addenda: number; purchaseOrders: number };
}

const statusLabels: Record<ContractStatus, string> = {
  draft: 'Rascunho',
  pending_signature: 'Aguardando Assinatura',
  active: 'Ativo',
  suspended: 'Suspenso',
  expired: 'Vencido',
  terminated: 'Encerrado',
  renewed: 'Renovado',
};

const statusColors: Record<ContractStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  draft: 'outline',
  pending_signature: 'warning',
  active: 'success',
  suspended: 'secondary',
  expired: 'destructive',
  terminated: 'destructive',
  renewed: 'success',
};

export function ContratosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadContratos();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadContratos = async () => {
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

      const response = await apiGetPaginated<any>(`/contratar/contratos?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setContratos(paginatedData.data);
        setTotal(paginatedData.meta.total);
        setTotalPages(paginatedData.meta.totalPages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Contratos');
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

  const handleSign = async (contrato: any) => {
    const fileUrl = window.prompt('URL do arquivo assinado:');
    if (!fileUrl) return;
    try {
      await apiPost(`/contratar/contratos/${contrato.id}/sign`, { contractFileUrl: fileUrl });
      toast.success('Contrato assinado com sucesso');
      loadContratos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao assinar');
    }
  };

  const handleSuspend = async (contrato: any) => {
    const reason = window.prompt('Motivo da suspensão:');
    if (!reason) return;
    try {
      await apiPost(`/contratar/contratos/${contrato.id}/suspend`, { reason });
      toast.success('Contrato suspenso com sucesso');
      loadContratos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao suspender');
    }
  };

  const handleTerminate = async (contrato: any) => {
    if (!window.confirm('Encerrar este contrato?')) return;
    const reason = window.prompt('Motivo do encerramento:');
    if (!reason) return;
    try {
      await apiPost(`/contratar/contratos/${contrato.id}/terminate`, { reason });
      toast.success('Contrato encerrado com sucesso');
      loadContratos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao encerrar');
    }
  };

  const handleRenew = async (contrato: any) => {
    const newEndDate = window.prompt('Nova data de vigência (YYYY-MM-DD):');
    if (!newEndDate) return;
    try {
      await apiPost(`/contratar/contratos/${contrato.id}/renew`, { newEndDate });
      toast.success('Contrato renovado com sucesso');
      loadContratos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao renovar');
    }
  };

  const handleDelete = async (contrato: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este Contrato?')) return;
    try {
      await apiDelete(`/contratar/contratos/${contrato.id}`);
      toast.success('Contrato removido com sucesso');
      loadContratos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Contrato');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contratos</h1>
          <p className="text-muted-foreground mt-1">Gestão de contratos, aditivos e vigências</p>
        </div>
        <Button onClick={() => navigate('/contratar/contratos/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
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
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="pending_signature">Aguardando Assinatura</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
              <option value="expired">Vencido</option>
              <option value="terminated">Encerrado</option>
              <option value="renewed">Renovado</option>
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
                  { key: 'number', label: 'Número/Ano', sortable: true },
                  { key: 'modality', label: 'Modalidade', sortable: true },
                  { key: 'objectDescription', label: 'Objeto', sortable: false },
                  { key: 'totalValue', label: 'Valor Total', sortable: true },
                  { key: 'supplier', label: 'Fornecedor', sortable: true },
                  { key: 'organ', label: 'Órgão', sortable: true },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'endDate', label: 'Vencimento', sortable: true },
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
              {contratos.map((contrato) => (
                <tr key={contrato.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{contrato.number}/{contrato.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{({
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
                    } as Record<string, string>)[contrato.modality] || contrato.modality}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{contrato.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{formatCurrency(contrato.totalValue)}</td>
                  <td className="px-4 py-3 text-sm">{contrato.supplier?.tradeName || contrato.supplier?.name}</td>
                  <td className="px-4 py-3 text-sm">{contrato.organ?.acronym || contrato.organ?.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      draft: 'outline',
                      pending_signature: 'warning',
                      active: 'success',
                      suspended: 'secondary',
                      expired: 'destructive',
                      terminated: 'destructive',
                      renewed: 'success',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[contrato.status]}>
                      {({
                        draft: 'Rascunho',
                        pending_signature: 'Aguardando Assinatura',
                        active: 'Ativo',
                        suspended: 'Suspenso',
                        expired: 'Vencido',
                        terminated: 'Encerrado',
                        renewed: 'Renovado',
                      } as Record<string, string>)[contrato.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(contrato.endDate)}
                    {contrato.status === 'active' && new Date(contrato.endDate) < new Date() && (
                      <span className="ml-1 text-destructive">(Vencido)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/contratar/contratos/${contrato.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/contratar/contratos/${contrato.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {contrato.status === 'pending_signature' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleSign(contrato)}
                            >
                              <FileSignature className="w-4 h-4" />
                              Assinar
                            </button>
                          )}
                          {contrato.status === 'active' && (
                            <>
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                                onClick={() => handleSuspend(contrato)}
                              >
                                <XCircle className="w-4 h-4" />
                                Suspender
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                                onClick={() => handleRenew(contrato)}
                              >
                                <Clock className="w-4 h-4" />
                                Renovar
                              </button>
                              <button
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                                onClick={() => handleTerminate(contrato)}
                              >
                                <XCircle className="w-4 h-4" />
                                Encerrar
                              </button>
                            </>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(contrato)}
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
              {contratos.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum Contrato encontrado
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