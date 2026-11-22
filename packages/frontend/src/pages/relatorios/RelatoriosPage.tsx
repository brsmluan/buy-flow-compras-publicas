// =============================================================================
// BUY-FLOW FRONTEND - Relatórios Page
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
import { BarChart3, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { ReportType, ReportFormat } from '@buy-flow/shared/index.js';

interface Relatorio {
  id: string;
  type: ReportType;
  name: string;
  description: string | null;
  config: any;
  schedule: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const typeLabels: Record<ReportType, string> = {
  dfd_list: 'Lista de DFDs',
  etp_list: 'Lista de ETPs',
  bidding_list: 'Lista de Licitações',
  contract_list: 'Lista de Contratos',
  purchase_order_list: 'Lista de Pedidos de Compra',
  supplier_list: 'Lista de Fornecedores',
  execution_financial: 'Execução Financeira',
  contract_expiration: 'Vencimento de Contratos',
  bidding_timeline: 'Cronograma de Licitações',
  supplier_performance: 'Desempenho de Fornecedores',
  organ_execution: 'Execução por Órgão',
  custom: 'Personalizado',
};

export function RelatoriosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadRelatorios();
  }, [search, typeFilter, page, sortBy, sortOrder]);

  const loadRelatorios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);

      const response = await apiGetPaginated<any>(`/relatorios?${params.toString()}`);
      const paginatedData = response.data;
      if (paginatedData) {
        setRelatorios(paginatedData.data);
        setTotal(paginatedData.meta.total);
        setTotalPages(paginatedData.meta.totalPages);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Relatórios');
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

  const handleGenerate = async (relatorio: any) => {
    const format = window.prompt('Formato (pdf, excel, csv, json):', 'pdf') || 'pdf';
    try {
      const response = await apiPost(`/relatorios/${relatorio.id}/generate`, { format });
      toast.success('Relatório gerado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao gerar relatório');
    }
  };

  const handleDelete = async (relatorio: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este Relatório?')) return;
    try {
      await apiDelete(`/relatorios/${relatorio.id}`);
      toast.success('Relatório removido com sucesso');
      loadRelatorios();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Relatório');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Relatórios gerenciais e exportação de dados</p>
        </div>
        <Button onClick={() => navigate('/relatorios/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="dfd_list">Lista de DFDs</option>
              <option value="etp_list">Lista de ETPs</option>
              <option value="bidding_list">Lista de Licitações</option>
              <option value="contract_list">Lista de Contratos</option>
              <option value="purchase_order_list">Lista de Pedidos</option>
              <option value="supplier_list">Lista de Fornecedores</option>
              <option value="execution_financial">Execução Financeira</option>
              <option value="contract_expiration">Vencimento de Contratos</option>
              <option value="bidding_timeline">Cronograma de Licitações</option>
              <option value="supplier_performance">Desempenho de Fornecedores</option>
              <option value="organ_execution">Execução por Órgão</option>
              <option value="custom">Personalizado</option>
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
                  { key: 'name', label: 'Nome', sortable: true },
                  { key: 'type', label: 'Tipo', sortable: true },
                  { key: 'isActive', label: 'Status', sortable: true },
                  { key: 'lastRunAt', label: 'Última Execução', sortable: true },
                  { key: 'nextRunAt', label: 'Próxima Execução', sortable: true },
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
              {relatorios.map((relatorio) => (
                <tr key={relatorio.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{relatorio.name}</div>
                    {relatorio.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{relatorio.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{({
                      dfd_list: 'Lista de DFDs',
                      etp_list: 'Lista de ETPs',
                      bidding_list: 'Lista de Licitações',
                      contract_list: 'Lista de Contratos',
                      purchase_order_list: 'Lista de Pedidos',
                      supplier_list: 'Lista de Fornecedores',
                      execution_financial: 'Execução Financeira',
                      contract_expiration: 'Vencimento de Contratos',
                      bidding_timeline: 'Cronograma de Licitações',
                      supplier_performance: 'Desempenho de Fornecedores',
                      organ_execution: 'Execução por Órgão',
                      custom: 'Personalizado',
                    } as Record<string, string>)[relatorio.type]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={relatorio.isActive ? 'success' : 'secondary'}>
                      {relatorio.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {relatorio.lastRunAt ? formatRelativeTime(relatorio.lastRunAt) : 'Nunca'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {relatorio.nextRunAt ? formatRelativeTime(relatorio.nextRunAt) : 'Não agendado'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/relatorios/${relatorio.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/relatorios/${relatorio.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const format = window.prompt('Formato (pdf, excel, csv, json):', 'pdf') || 'pdf';
                        apiPost(`/relatorios/${relatorio.id}/generate`, { format });
                      }}>
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(relatorio)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {relatorios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum Relatório encontrado
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