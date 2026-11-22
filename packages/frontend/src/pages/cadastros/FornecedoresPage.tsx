// =============================================================================
// BUY-FLOW FRONTEND - Fornecedores Page
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
import { Building2, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { SupplierType, SupplierStatus } from '@buy-flow/shared/types/index.js';

interface Fornecedor {
  id: string;
  type: SupplierType;
  name: string;
  tradeName: string | null;
  cnpjCpf: string;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  email: string | null;
  phone: string | null;
  address: any;
  categories: string[];
  status: SupplierStatus;
  habilitationValidUntil: string | null;
  bankAccount: any;
  certifications: any[];
  createdAt: string;
  updatedAt: string;
}

const typeLabels: Record<SupplierType, string> = {
  pf: 'Pessoa Física',
  pj: 'Pessoa Jurídica',
  mei: 'MEI',
  foreign: 'Estrangeiro',
};

const statusLabels: Record<SupplierStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Bloqueado',
  suspended: 'Suspenso',
  pending_habilitation: 'Pendente Habilitação',
};

const statusColors: Record<SupplierStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  active: 'success',
  inactive: 'secondary',
  blocked: 'destructive',
  suspended: 'warning',
  pending_habilitation: 'warning',
};

export function FornecedoresPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadFornecedores();
  }, [search, statusFilter, typeFilter, page, sortBy, sortOrder]);

  const loadFornecedores = async () => {
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
      if (typeFilter) params.append('type', typeFilter);

      const response = await apiGetPaginated<any>(`/cadastros/fornecedores?${params.toString()}`);
      setFornecedores(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Fornecedores');
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

  const handleHabilitate = async (fornecedor: any) => {
    const validUntil = window.prompt('Validade da habilitação (YYYY-MM-DD):');
    if (!validUntil) return;
    try {
      await apiPost(`/cadastros/fornecedores/${fornecedor.id}/habilitate`, { validUntil });
      toast.success('Fornecedor habilitado com sucesso');
      loadFornecedores();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao habilitar');
    }
  };

  const handleBlock = async (fornecedor: any) => {
    const reason = window.prompt('Motivo do bloqueio:');
    if (!reason) return;
    try {
      await apiPost(`/cadastros/fornecedores/${fornecedor.id}/block`, { reason });
      toast.success('Fornecedor bloqueado com sucesso');
      loadFornecedores();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao bloquear');
    }
  };

  const handleDelete = async (fornecedor: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este Fornecedor?')) return;
    try {
      await apiDelete(`/cadastros/fornecedores/${fornecedor.id}`);
      toast.success('Fornecedor removido com sucesso');
      loadFornecedores();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Fornecedor');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Cadastro e gestão de fornecedores</p>
        </div>
        <Button onClick={() => navigate('/cadastros/fornecedores/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ/CPF..."
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
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
              <option value="suspended">Suspenso</option>
              <option value="pending_habilitation">Pendente Habilitação</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="pf">Pessoa Física</option>
              <option value="pj">Pessoa Jurídica</option>
              <option value="mei">MEI</option>
              <option value="foreign">Estrangeiro</option>
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
                  { key: 'name', label: 'Nome/Razão Social', sortable: true },
                  { key: 'type', label: 'Tipo', sortable: true },
                  { key: 'cnpjCpf', label: 'CNPJ/CPF', sortable: true },
                  { key: 'email', label: 'Email', sortable: false },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'createdAt', label: 'Cadastrado em', sortable: true },
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
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{fornecedor.name}</div>
                    {fornecedor.tradeName && (
                      <div className="text-xs text-muted-foreground">{fornecedor.tradeName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{({
                      pf: 'Pessoa Física',
                      pj: 'Pessoa Jurídica',
                      mei: 'MEI',
                      foreign: 'Estrangeiro',
                    } as Record<string, string>)[fornecedor.type]}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{fornecedor.cnpjCpf}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fornecedor.email || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      active: 'success',
                      inactive: 'secondary',
                      blocked: 'destructive',
                      suspended: 'warning',
                      pending_habilitation: 'warning',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[fornecedor.status]}>
                      {({
                        active: 'Ativo',
                        inactive: 'Inativo',
                        blocked: 'Bloqueado',
                        suspended: 'Suspenso',
                        pending_habilitation: 'Pendente Habilitação',
                      } as Record<string, string>)[fornecedor.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatRelativeTime(fornecedor.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cadastros/fornecedores/${fornecedor.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cadastros/fornecedores/${fornecedor.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {fornecedor.status !== 'active' && fornecedor.status !== 'blocked' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleHabilitate(fornecedor)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Habilitar
                            </button>
                          )}
                          {fornecedor.status === 'active' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleBlock(fornecedor)}
                            >
                              <Shield className="w-4 h-4" />
                              Bloquear
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(fornecedor)}
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
              {fornecedores.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum Fornecedor encontrado
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
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, Shield, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';