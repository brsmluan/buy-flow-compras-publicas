// =============================================================================
// BUY-FLOW BACKEND - Pedido de Compra Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/middleware/error';
import { authorize, requirePermission, requireTenantAccess } from '@/middleware/auth';
import {
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators/index';
import { PurchaseOrderStatus } from '@buy-flow/shared/types/index';

export async function purchaseOrderRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { number: { contains: query.search } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.contractId) where.contractId = query.contractId;

    const [pedidos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          contract: { select: { id: true, number: true, year: true } },
          supplier: { select: { id: true, name: true, tradeName: true } },
          requestingOrgan: { select: { id: true, name: true, acronym: true } },
          requester: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      success: true,
      data: pedidos,
      meta: {
        page: query.page, limit: query.limit, total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page < Math.ceil(total / query.limit),
        hasPrev: query.page > 1,
      },
    };
  });

  app.get('/:id', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contract: { select: { id: true, number: true, year: true, supplier: { select: { id: true, name: true } } } },
        supplier: { select: { id: true, name: true, tradeName: true, email: true, phone: true, address: true, bankAccount: true } },
        requestingOrgan: { select: { id: true, name: true, acronym: true } },
        requester: { select: { id: true, name: true, email: true } },
        items: { include: { item: { select: { id: true, name: true, unit: true, specifications: true } } } },
      },
    });

    if (!pedido) throw AppError.notFound('PEDIDO_NOT_FOUND', 'Pedido de Compra não encontrado');

    return { success: true, data: { pedido } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('pedido:create')] }, async (request, reply) => {
    const body = z.object({
      contractId: z.string().uuid().optional(),
      supplierId: z.string().uuid(),
      requestingOrganId: z.string().uuid(),
      items: z.array(z.object({
        itemId: z.string().uuid(),
        description: z.string(),
        quantity: z.number().positive().multipleOf(0.001),
        unit: z.string(),
        unitPrice: z.number().positive(),
        totalPrice: z.number().positive(),
      })).min(1),
      totalValue: z.number().positive(),
      deliveryDeadline: z.string().date().optional(),
      deliveryAddress: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.create({
      data: {
        ...body,
        tenantId,
        requesterId: request.user!.sub,
        status: PurchaseOrderStatus.draft,
      },
      include: {
        contract: { select: { id: true, number: true, year: true } },
        supplier: { select: { id: true, name: true, tradeName: true } },
        requestingOrgan: { select: { id: true, name: true, acronym: true } },
        items: { include: { item: { select: { id: true, name: true, unit: true } } } },
      },
    });

    return reply.code(201).send({ success: true, data: { pedido } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('pedido:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      items: z.array(z.object({
        itemId: z.string().uuid(),
        description: z.string(),
        quantity: z.number().positive().multipleOf(0.001),
        unit: z.string(),
        unitPrice: z.number().positive(),
        totalPrice: z.number().positive(),
      })).optional(),
      totalValue: z.number().positive().optional(),
      deliveryDeadline: z.string().date().optional(),
      deliveryAddress: z.string().max(500).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!pedido) throw AppError.notFound('PEDIDO_NOT_FOUND', 'Pedido de Compra não encontrado');

    if (pedido.status !== 'draft') {
      throw AppError.badRequest('INVALID_STATUS', 'Só é possível editar pedidos em rascunho');
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { pedido: updated } };
  });

  app.post('/:id/empenhar', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('pedido:empenho')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { empenhoNumber, empenhoDate } = z.object({
      empenhoNumber: z.string().max(50),
      empenhoDate: z.string().date(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!pedido) throw AppError.notFound('PEDIDO_NOT_FOUND', 'Pedido de Compra não encontrado');

    if (pedido.status !== 'draft') {
      throw AppError.badRequest('INVALID_STATUS', 'Só é possível empenhar pedidos em rascunho');
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.empenhado,
        empenhoNumber,
        empenhoDate: new Date(empenhoDate),
      },
    });

    return { success: true, data: { pedido: updated } };
  });

  app.post('/:id/receive', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('pedido:receive')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { deliveries } = z.object({
      deliveries: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive().multipleOf(0.001),
        notes: z.string().optional(),
      })).min(1),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!pedido) throw AppError.notFound('PEDIDO_NOT_FOUND', 'Pedido de Compra não encontrado');

    for (const delivery of deliveries) {
      await prisma.purchaseOrderItem.update({
        where: { id: delivery.itemId },
        data: {
          deliveredQuantity: { increment: delivery.quantity },
        },
      });
    }

    const updatedPedido = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    const allDelivered = updatedPedido!.items.every(
      item => item.deliveredQuantity >= item.quantity
    );

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: allDelivered ? PurchaseOrderStatus.delivered : PurchaseOrderStatus.partial_delivered,
      },
    });

    return { success: true, data: { pedido: updated } };
  });

  app.post('/:id/invoice', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('pedido:invoice')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { invoices } = z.object({
      invoices: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive().multipleOf(0.001),
        invoiceNumber: z.string().max(50),
        invoiceDate: z.string().date(),
        invoiceValue: z.number().positive(),
        invoiceFileUrl: z.string().url().optional(),
      })).min(1),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!pedido) throw AppError.notFound('PEDIDO_NOT_FOUND', 'Pedido de Compra não encontrado');

    for (const invoice of invoices) {
      await prisma.purchaseOrderItem.update({
        where: { id: invoice.itemId },
        data: {
          invoicedQuantity: { increment: invoice.quantity },
        },
      });
    }

    const updatedPedido = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    const allInvoiced = updatedPedido!.items.every(
      item => item.invoicedQuantity >= item.quantity
    );

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: allInvoiced ? PurchaseOrderStatus.invoiced : pedido.status,
      },
    });

    return { success: true, data: { pedido: updated } };
  });

  app.post('/:id/pay', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('pedido:pay')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { paymentProofUrl } = z.object({ paymentProofUrl: z.string().url().optional() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!pedido) throw AppError.notFound('PEDIDO_NOT_FOUND', 'Pedido de Compra não encontrado');

    if (pedido.status !== 'invoiced') {
      throw AppError.badRequest('INVALID_STATUS', 'Pedido deve estar faturado para pagamento');
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.paid, paymentProofUrl, paidAt: new Date() },
    });

    return { success: true, data: { pedido: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('pedido:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const pedido = await prisma.purchaseOrder.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!pedido) throw AppError.notFound('PEDIDO_NOT_FOUND', 'Pedido de Compra não encontrado');

    await prisma.purchaseOrder.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Pedido de Compra removido com sucesso' } };
  });
}