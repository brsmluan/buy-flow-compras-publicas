// TenantsPage.tsx - Platform Admin: Tenants Management
// Chamado por: App.tsx linha 18 (lazy import: import('./pages/platform/TenantsPage'))
// Não existe arquivo similar - página de admin de tenants da plataforma
// Lê: /platform/tenants (GET paginado), /platform/tenants/:id (GET), /platform/tenants/:id/status (POST), /platform/tenants/:id (DELETE)
// Escreve: /platform/tenants (POST para criar), /platform/tenants/:id (PATCH para editar)
// Instrução do usuário: Criar páginas faltantes para build funcionar

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
import { Building2, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: string;
  plan: string;
  legalValuesVersion: string;
  createdAt: string;
  updatedAt: string;
}

export function TenantsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTenants();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiGetPaginated<Tenant>(`/platform/tenants?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setTenants(paginatedData.data);
        setTotalPages(paginatedData.meta.totalPages);
        setTotal(paginatedData.meta.total);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`Tem certeza que deseja excluir o tenant "${tenant.name}"?`)) return;
    try {
      await apiDelete(`/platform/tenants/${tenant.id}`);
      toast.success('Tenant excluído com sucesso');
      loadTenants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir tenant');
    }
  };

  const handleToggle = async (tenant: Tenant) => {
    try {
      const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
      await apiPost(`/platform/tenants/${tenant.id}/status`, { status: newStatus });
      toast.success(`Tenant ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`);
      loadTenants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'suspended': return <Badge className="bg-red-100 text-red-800">Suspenso</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenants (Prefeituras)</h1>
          <p className="text-muted-foreground mt-1">Gerenciar prefeituras cadastradas na plataforma</p>
        </div>
        <Button onClick={() => navigate('/platform/tenants/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Tenant
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="pending">Pendente</option>
            <option value="suspended">Suspenso</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('name')}>
                  Prefeitura {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('slug')}>
                  Slug {sortBy === 'slug' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('cnpj')}>
                  CNPJ {sortBy === 'cnpj' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('plan')}>
                  Plano {sortBy === 'plan' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('createdAt')}>
                  Criado em {sortBy === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-border/50 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-sm text-muted-foreground">{tenant.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{tenant.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{tenant.cnpj}</span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(tenant.status)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{tenant.plan}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatRelativeTime(tenant.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/platform/tenants/${tenant.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/platform/tenants/${tenant.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleToggle(tenant)}
                          >
                            {tenant.status === 'active' ? (
                              <>
                                <XCircle className="w-4 h-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Ativar
                              </>
                            )}
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(tenant)}
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
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum tenant encontrado
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