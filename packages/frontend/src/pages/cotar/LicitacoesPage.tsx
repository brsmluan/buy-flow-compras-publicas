// =============================================================================
// BUY-FLOW FRONTEND - Licitações Page
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
import { Gavel, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, FileText, Send, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { BiddingModality, BiddingStatus } from '@buy-flow/shared/types/index.js';

interface Licitacao {
  id: string;
  modality: BiddingModality;
  number: string;
  year: number;
  processNumber: string | null;
  objectDescription: string;
  estimatedValue: number;
  biddingOrgan: { id: string; name: string; acronym: string };
  responsible: { id: string; name: string; email: string };
  status: BiddingStatus;
  editalUrl: string | null;
  pncpPublicationId: string | null;
  sessionDate: string | null;
  sessionLocation: string | null;
  items: any[];
  createdAt: string;
  updatedAt: string;
  _count: { contracts: number };
}

const modalityLabels: Record<BiddingModality, string> = {
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
};

const modalityColors: Record<BiddingModality, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  pregao_eletronico: 'default',
  pregao_presencial: 'secondary',
  concorrencia: 'warning',
  concurso: 'outline',
  leilao: 'destructive',
  dispensa: 'secondary',
  inexigibilidade: 'destructive',
  credenciamento: 'success',
  chamada_publica: 'outline',
  rdc: 'default',
};

const statusLabels: Record<BiddingStatus, string> = {
  planning: 'Planejamento',
  published: 'Publicado',
  clarification_period: 'Prazo Impugnação',
  session_scheduled: 'Sessão Agendada',
  in_session: 'Em Sessão',
  judgment: 'Julgamento',
  homologated: 'Homologado',
  revoked: 'Revogado',
  cancelled: 'Cancelado',
  archived: 'Arquivado',
};

const statusColors: Record<BiddingStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  planning: 'outline',
  published: 'default',
  clarification_period: 'warning',
  session_scheduled: 'warning',
  in_session: 'default',
  judgment: 'warning',
  homologated: 'success',
  revoked: 'destructive',
  cancelled: 'destructive',
  archived: 'secondary',
};

export function LicitacoesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [licitacoes, setLicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadLicitacoes();
  }, [search, modalityFilter, statusFilter, page, sortBy, sortOrder]);

  const loadLicitacoes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      });
      if (search) params.append('search', search);
      if (modalityFilter) params.append('modality', modalityFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiGetPaginated<any>(`/cotar/licitacoes?${params.toString()}`);
      setLicitacoes(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Licitações');
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

  const handlePublish = async (licitacao: any) => {
    const editalUrl = window.prompt('URL do Edital:');
    if (!editalUrl) return;
    try {
      await apiPost(`/cotar/licitacoes/${licitacao.id}/publish`, { editalUrl });
      toast.success('Licitação publicada com sucesso');
      loadLicitacoes();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao publicar');
    }
  };

  const handleHomologate = async (licitacao: any) => {
    if (!window.confirm('Homologar esta licitação?')) return;
    try {
      await apiPost(`/cotar/licitacoes/${licitacao.id}/homologate`);
      toast.success('Licitação homologada com sucesso');
      loadLicitacoes();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao homologar');
    }
  };

  const handleDelete = async (licitacao: any) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Licitação?')) return;
    try {
      await apiDelete(`/cotar/licitacoes/${licitacao.id}`);
      toast.success('Licitação removida com sucesso');
      loadLicitacoes();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Licitação');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Licitações</h1>
          <p className="text-muted-foreground mt-1">Modalidades de licitação - Pregão, Concorrência, etc.</        </div>
        <Button onClick={() => navigate('/cotar/licitacoes/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Licitação
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
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="">Todas as modalidades</option>
              {Object.entries({
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
              }).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            >
              <option value="">Todos os status</option>
              <option value="planning">Planejamento</option>
              <option value="published">Publicado</option>
              <option value="clarification_period">Prazo Impugnação</option>
              <option value="session_scheduled">Sessão Agendada</option>
              <option value="in_session">Em Sessão</option>
              <option value="judgment">Julgamento</option>
              <option value="homologated">Homologado</option>
              <option value="revoked">Revogado</option>
              <option value="cancelled">Cancelado</option>
              <option value="archived">Arquivado</option>
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
                  { key: 'estimatedValue', label: 'Valor Estimado', sortable: true },
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
              {licitacoes.map((licitacao) => (
                <tr key={licitacao.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{licitacao.number}/{licitacao.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={modalityColors[licitacao.modality]}>
                      {modalityLabels[licitacao.modality]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-sm">{licitacao.objectDescription}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{formatCurrency(licitacao.estimatedValue)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      planning: 'outline',
                      published: 'default',
                      clarification_period: 'warning',
                      session_scheduled: 'warning',
                      in_session: 'default',
                      judgment: 'warning',
                      homologated: 'success',
                      revoked: 'destructive',
                      cancelled: 'destructive',
                      archived: 'secondary',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[licitacao.status]}>
                      {({
                        planning: 'Planejamento',
                        published: 'Publicado',
                        clarification_period: 'Prazo Impugnação',
                        session_scheduled: 'Sessão Agendada',
                        in_session: 'Em Sessão',
                        judgment: 'Julgamento',
                        homologated: 'Homologado',
                        revoked: 'Revogado',
                        cancelled: 'Cancelado',
                        archived: 'Arquivado',
                      } as Record<string, string>)[licitacao.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(licitacao.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/licitacoes/${licitacao.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/cotar/licitacoes/${licitacao.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {licitacao.status === 'planning' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handlePublish(licitacao)}
                            >
                              <FileText className="w-4 h-4" />
                              Publicar Edital
                            </button>
                          )}
                          {licitacao.status === 'published' || licitacao.status === 'clarification_period' ? (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => { /* abrir sessão */ }}
                            >
                              <Clock className="w-4 h-4" />
                              Abrir Sessão
                            </button>
                          )}
                          {licitacao.status === 'judgment' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => { /* julgar */ }}
                            >
                              <Gavel className="w-4 h-4" />
                              Julgar
                            </button>
                          )}
                          {licitacao.status !== 'homologated' && licitacao.status !== 'revoked' && licitacao.status !== 'cancelled' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleHomologate(licitacao)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Homologar
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(licitacao)}
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
              {licitacoes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma Licitação encontrada
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
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, Gavel, Globe, FileText, ChevronLeft, ChevronRight } from 'lucide-react';