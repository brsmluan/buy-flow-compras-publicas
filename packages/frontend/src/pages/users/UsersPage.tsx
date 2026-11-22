// UsersPage.tsx - Platform Admin: Users Management
// Chamado por: App.tsx linha 19 (lazy import: import('./pages/users/UsersPage'))
// Não existe arquivo similar - página de admin de usuários da plataforma
// Lê: /platform/users (GET paginado), /platform/users/:id (GET), /platform/users/:id (DELETE)
// Escreve: /platform/users (POST para criar), /platform/users/:id (PATCH para editar)
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
import { User, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';

interface PlatformUser {
  id: string;
  email: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  role: string;
  status: string;
  tenantId: string | null;
  tenantName: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function UsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, page, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiGetPaginated<PlatformUser>(`/platform/users?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setUsers(paginatedData.data);
        setTotalPages(paginatedData.meta.totalPages);
        setTotal(paginatedData.meta.total);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar usuários');
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

  const handleDelete = async (platformUser: PlatformUser) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${platformUser.name}"?`)) return;
    try {
      await apiDelete(`/platform/users/${platformUser.id}`);
      toast.success('Usuário excluído com sucesso');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
    }
  };

  const handleToggle = async (platformUser: PlatformUser) => {
    try {
      const newStatus = platformUser.status === 'active' ? 'inactive' : 'active';
      await apiPost(`/platform/users/${platformUser.id}/status`, { status: newStatus });
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar status');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'platform_admin': return <Badge className="bg-purple-100 text-purple-800">Admin Plataforma</Badge>;
      case 'tenant_admin': return <Badge className="bg-blue-100 text-blue-800">Admin Tenant</Badge>;
      case 'manager': return <Badge className="bg-green-100 text-green-800">Gestor</Badge>;
      case 'operator': return <Badge className="bg-yellow-100 text-yellow-800">Operador</Badge>;
      case 'viewer': return <Badge className="bg-gray-100 text-gray-800">Visualizador</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
      case 'pending_approval': return <Badge className="bg-yellow-100 text-yellow-800">Pendente Aprovação</Badge>;
      case 'suspended': return <Badge className="bg-red-100 text-red-800">Suspenso</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuários da Plataforma</h1>
          <p className="text-muted-foreground mt-1">Gerenciar usuários e permissões da plataforma</p>
        </div>
        <Button onClick={() => navigate('/platform/users/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os perfis</option>
            <option value="platform_admin">Admin Plataforma</option>
            <option value="tenant_admin">Admin Tenant</option>
            <option value="manager">Gestor</option>
            <option value="operator">Operador</option>
            <option value="viewer">Visualizador</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="pending_approval">Pendente Aprovação</option>
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
                  Usuário {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('email')}>
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Perfil</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Prefeitura</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('lastLoginAt')}>
                  Último Acesso {sortBy === 'lastLoginAt' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />)}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((platformUser) => (
                <tr key={platformUser.id} className="border-b border-border/50 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{platformUser.name}</div>
                        {platformUser.cpf && (
                          <div className="text-sm text-muted-foreground font-mono">{platformUser.cpf}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{platformUser.email}</td>
                  <td className="px-4 py-3">{getRoleBadge(platformUser.role)}</td>
                  <td className="px-4 py-3">{getStatusBadge(platformUser.status)}</td>
                  <td className="px-4 py-3">
                    {platformUser.tenantName ? (
                      <Badge variant="outline">{platformUser.tenantName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {platformUser.lastLoginAt ? formatRelativeTime(platformUser.lastLoginAt) : 'Nunca'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/platform/users/${platformUser.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/platform/users/${platformUser.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleToggle(platformUser)}
                          >
                            {platformUser.status === 'active' ? (
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
                            onClick={() => handleDelete(platformUser)}
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum usuário encontrado
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