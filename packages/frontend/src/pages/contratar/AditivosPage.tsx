// =============================================================================
// BUY-FLOW FRONTEND - Aditivos Page
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
import { FileText, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, FileSignature, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';

interface Aditivo {
  id: string;
  contractId: string;
  number: string;
  type: 'aditivo' | 'apostilamento' | 'reajuste' | 'repactuacao' | 'prorrogacao' | 'alteracao_objeto';
  description: string;
  valueChange: number;
  newTotalValue: number | null;
  newEndDate: string | null;
  legalBasis: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'signed';
  fileUrl: string | null;
  signedAt: string | null;
  signedBy: string | null;
  createdAt: string;
  updatedAt: string;
  contract: { id: string; number: string; year: number; objectDescription: string; totalValue: number };
  signer: { id: string; name: string; email: string } | null;
}

const typeLabels: Record<string, string> = {
  aditivo: 'Aditivo',
  apostilamento: 'Apostilamento',
  reajuste: 'Reajuste',
  repactuacao: 'Repactuação',
  prorrogacao: 'Prorrogação',
  alteracao_objeto: 'Alteração de Objeto',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  pending_approval: 'Pendente Aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  signed: 'Assinado',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  draft: 'outline',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'destructive',
  signed: 'success',
};

export function AditivosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aditivos, setAditivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAditivos();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadAditivos = async () => {
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

      const response = await apiGetPaginated<any>(`/contratar/aditivos?${params.toString()}`);
      setAditivos(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Aditivos');
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

  const handleApprove = async (aditivo: any) => {
    if (!window.confirm('Aprovar este aditivo?')) return;
    try {
      await apiPost(`/contratar/aditivos/${aditivo.id}/approve`);
      toast.success('Aditivo aprovado com sucesso');
      loadAditivos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao aprovar');
    }
  };

  const handleSign = async (aditivo: any) => {
    const fileUrl = window.prompt('URL do arquivo assinado:');
    if (!fileUrl) return;
    try {
      await apiPost(`/contratar/aditivos/${aditivo.id}/sign`, { fileUrl });
      toast.success('Aditivo assinado com sucesso');
      loadAditivos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao assinar');
    }
  };

  const handleDelete = async (aditivo: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este Aditivo?')) return;
    try {
      await apiDelete(`/contratar/aditivos/${aditivo.id}`);
      toast.success('Aditivo removido com sucesso');
      loadAditivos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Aditivo');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aditivos Contratuais</h1>
          <p className="text-muted-foreground mt-1">Aditivos, apostilamentos, reajustes e prorrogações</p>
        </div>
        <Button onClick={() => navigate('/contratar/aditivos/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Aditivo
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, descrição..."
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
              <option value="pending_approval">Pendente Aprovação</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="signed">Assinado</option>
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
                  { key: 'number', label: 'Número', sortable: true },
                  { key: 'type', label: 'Tipo', sortable: true },
                  { key: 'contract', label: 'Contrato', sortable: true },
                  { key: 'valueChange', label: 'Variação Valor', sortable: true },
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
              {aditivos.map((aditivo) => (
                <tr key={aditivo.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{aditivo.number}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{({
                      aditivo: 'Aditivo',
                      apostilamento: 'Apostilamento',
                      reajuste: 'Reajuste',
                      repactuacao: 'Repactuação',
                      prorrogacao: 'Prorrogação',
                      alteracao_objeto: 'Alteração Objeto',
                    } as Record<string, string>)[aditivo.type] || aditivo.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">{aditivo.contract?.number}/{aditivo.contract?.year}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{aditivo.contract?.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {aditivo.valueChange >= 0 ? '+' : ''}{formatCurrency(aditivo.valueChange)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      draft: 'outline',
                      pending_approval: 'warning',
                      approved: 'success',
                      rejected: 'destructive',
                      signed: 'success',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[aditivo.status]}>
                      {({
                        draft: 'Rascunho',
                        pending_approval: 'Pendente Aprovação',
                        approved: 'Aprovado',
                        rejected: 'Rejeitado',
                        signed: 'Assinado',
                      } as Record<string, string>)[aditivo.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(aditivo.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/contratar/aditivos/${aditivo.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/contratar/aditivos/${aditivo.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {aditivo.status === 'pending_approval' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleApprove(aditivo)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aprovar
                            </button>
                          )}
                          {aditivo.status === 'approved' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleSign(aditivo)}
                            >
                              <FileSignature className="w-4 h-4" />
                              Assinar
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(aditivo)}
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
              {aditivos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum Aditivo encontrado
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
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, FileSignature, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';