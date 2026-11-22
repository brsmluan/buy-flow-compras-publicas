// =============================================================================
// BUY-FLOW FRONTEND - Pedidos de Compra Page
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
import { ShoppingCart, Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, MoreHorizontal, CheckCircle2, XCircle, Clock, FileText, DollarSign, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency, formatRelativeTime } from '../../lib/utils';
import { PurchaseOrderStatus } from '@buy-flow/shared/types/index.js';

interface PedidoCompra {
  id: string;
  number: string;
  year: number;
  contractId: string | null;
  supplierId: string;
  requestingOrganId: string;
  requesterId: string;
  items: any[];
  totalValue: number;
  empenhoNumber: string | null;
  empenhoDate: string | null;
  status: PurchaseOrderStatus;
  deliveryDeadline: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contract: { id: string; number: string; year: number } | null;
  supplier: { id: string; name: string; tradeName: string };
  requestingOrgan: { id: string; name: string; acronym: string };
  requester: { id: string; name: string; email: string };
}

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Rascunho',
  pending_empemho: 'Aguardando Empenho',
  empenhado: 'Empenhado',
  partial_delivered: 'Parcialmente Entregue',
  delivered: 'Entregue',
  invoiced: 'Faturado',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

const statusColors: Record<PurchaseOrderStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  draft: 'outline',
  pending_empemho: 'warning',
  empenhado: 'default',
  partial_delivered: 'warning',
  delivered: 'success',
  invoiced: 'warning',
  paid: 'success',
  cancelled: 'destructive',
};

export function PedidosCompraPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadPedidos();
  }, [search, statusFilter, page, sortBy, sortOrder]);

  const loadPedidos = async () => {
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

      const response = await apiGetPaginated<any>(`/comprar/pedidos?${params.toString()}`);
      setPedidos(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao carregar Pedidos de Compra');
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

  const handleEmpenhar = async (pedido: any) => {
    const empenhoNumber = window.prompt('Número do Empenho:');
    if (!empenhoNumber) return;
    const empenhoDate = window.prompt('Data do Empenho (YYYY-MM-DD):');
    if (!empenhoDate) return;
    try {
      await apiPost(`/comprar/pedidos/${pedido.id}/empenhar`, { empenhoNumber, empenhoDate });
      toast.success('Pedido empenhado com sucesso');
      loadPedidos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao empenhar');
    }
  };

  const handleReceive = async (pedido: any) => {
    navigate(`/comprar/pedidos/${pedido.id}/receive`);
  };

  const handleInvoice = async (pedido: any) => {
    navigate(`/comprar/pedidos/${pedido.id}/invoice`);
  };

  const handlePay = async (pedido: any) => {
    const proofUrl = window.prompt('URL do comprovante de pagamento (opcional):');
    try {
      await apiPost(`/comprar/pedidos/${pedido.id}/pay`, { paymentProofUrl: proofUrl || undefined });
      toast.success('Pagamento registrado com sucesso');
      loadPedidos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao registrar pagamento');
    }
  };

  const handleDelete = async (pedido: any) => {
    if (!window.confirm('Tem certeza que deseja excluir este Pedido?')) return;
    try {
      await apiDelete(`/comprar/pedidos/${pedido.id}`);
      toast.success('Pedido removido com sucesso');
      loadPedidos();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover Pedido');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos de Compra</h1>
          <p className="text-muted-foreground mt-1">Gestão de pedidos, empenhos, recebimentos e pagamentos</p>
        </div>
        <Button onClick={() => navigate('/comprar/pedidos/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
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
              <option value="pending_empemho">Aguardando Empenho</option>
              <option value="empenhado">Empenhado</option>
              <option value="partial_delivered">Parcialmente Entregue</option>
              <option value="delivered">Entregue</option>
              <option value="invoiced">Faturado</option>
              <option value="paid">Pago</option>
              <option value="cancelled">Cancelado</option>
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
                  { key: 'contract', label: 'Contrato', sortable: true },
                  { key: 'supplier', label: 'Fornecedor', sortable: true },
                  { key: 'totalValue', label: 'Valor Total', sortable: true },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'empenhoNumber', label: 'Empenho', sortable: true },
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
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm font-medium">{pedido.number}/{pedido.year}</div>
                  </td>
                  <td className="px-4 py-3">
                    {pedido.contract ? (
                      <div className="font-mono text-sm">{pedido.contract.number}/{pedido.contract.year}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{pedido.supplier?.tradeName || pedido.supplier?.name}</td>
                  <td className="px-4 py-3 font-mono text-sm">{formatCurrency(pedido.totalValue)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={({
                      draft: 'outline',
                      pending_empemho: 'warning',
                      empenhado: 'default',
                      partial_delivered: 'warning',
                      delivered: 'success',
                      invoiced: 'warning',
                      paid: 'success',
                      cancelled: 'destructive',
                    } as Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'>)[pedido.status]}>
                      {({
                        draft: 'Rascunho',
                        pending_empemho: 'Aguardando Empenho',
                        empenhado: 'Empenhado',
                        partial_delivered: 'Parcialmente Entregue',
                        delivered: 'Entregue',
                        invoiced: 'Faturado',
                        paid: 'Pago',
                        cancelled: 'Cancelado',
                      } as Record<string, string>)[pedido.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {pedido.empenhoNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(pedido.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/comprar/pedidos/${pedido.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/comprar/pedidos/${pedido.id}/edit`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => {}}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-10">
                          {pedido.status === 'draft' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleEmpenhar(pedido)}
                            >
                              <DollarSign className="w-4 h-4" />
                              Empenhar
                            </button>
                          )}
                          {pedido.status === 'empenhado' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleReceive(pedido)}
                            >
                              <Package className="w-4 h-4" />
                              Receber
                            </button>
                          )}
                          {pedido.status === 'delivered' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handleInvoice(pedido)}
                            >
                              <FileText className="w-4 h-4" />
                              Faturar
                            </button>
                          )}
                          {pedido.status === 'invoiced' && (
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                              onClick={() => handlePay(pedido)}
                            >
                              <DollarSign className="w-4 h-4" />
                              Pagar
                            </button>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                            onClick={() => handleDelete(pedido)}
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
              {pedidos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum Pedido de Compra encontrado
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
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, DollarSign, Package, ChevronLeft, ChevronRight, FileText } from 'lucide-react';