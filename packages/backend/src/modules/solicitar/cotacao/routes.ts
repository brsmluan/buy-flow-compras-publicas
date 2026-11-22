// =============================================================================
// BUY-FLOW BACKEND - Cotação Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { AppError } from '../../../middleware/error.js';
import { authorize, requirePermission, requireTenantAccess } from '../../../middleware/auth.js';
import {
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators/index.js';

export async function cotacaoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [cotacoes, total] = await Promise.all([
      prisma.cotacao.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          items: true,
          supplier: { select: { id: true, name: true, tradeName: true } },
        },
      }),
      prisma.cotacao.count({ where }),
    ]);

    return {
      success: true,
      data: cotacoes,
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

    const cotacao = await prisma.cotacao.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: { include: { item: { select: { id: true, name: true, unit: true } } } },
        supplier: { select: { id: true, name: true, tradeName: true, email: true, phone: true } },
      },
    });

    if (!cotacao) throw AppError.notFound('COTACAO_NOT_FOUND', 'Cotação não encontrada');

    return { success: true, data: { cotacao } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('cotacao:create')] }, async (request, reply) => {
    const body = z.object({
      description: z.string().min(10).max(5000),
      deadline: z.string().datetime(),
      items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        specifications: z.string().optional(),
      })).min(1),
      supplierIds: z.array(z.string().uuid()).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const cotacao = await prisma.cotacao.create({
      data: {
        ...body,
        tenantId,
        requestedById: request.user!.sub,
        status: 'draft',
      },
      include: { items: { include: { item: true } } },
    });

    return reply.code(201).send({ success: true, data: { cotacao } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('cotacao:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      description: z.string().min(10).max(5000).optional(),
      deadline: z.string().datetime().optional(),
      status: z.enum(['draft', 'sent', 'received', 'compared', 'cancelled']).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const cotacao = await prisma.cotacao.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!cotacao) throw AppError.notFound('COTACAO_NOT_FOUND', 'Cotação não encontrada');

    const updated = await prisma.cotacao.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { cotacao: updated } };
  });

  app.post('/:id/send', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('cotacao:send')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { supplierIds } = z.object({ supplierIds: z.array(z.string().uuid()).min(1) }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const cotacao = await prisma.cotacao.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!cotacao) throw AppError.notFound('COTACAO_NOT_FOUND', 'Cotação não encontrada');

    const updated = await prisma.cotacao.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });

    return { success: true, data: { cotacao: updated } };
  });

  app.post('/:id/receive', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('cotacao:receive')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { proposals } = z.object({
      proposals: z.array(z.object({
        supplierId: z.string().uuid(),
        items: z.array(z.object({
          itemId: z.string().uuid(),
          unitPrice: z.number().positive(),
          deliveryTime: z.number().int().positive().optional(),
          conditions: z.string().optional(),
        })).min(1),
      })).min(1),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const cotacao = await prisma.cotacao.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!cotacao) throw AppError.notFound('COTACAO_NOT_FOUND', 'Cotação não encontrada');

    for (const proposal of proposals) {
      await prisma.cotacaoProposta.create({
        data: {
          cotacaoId: id,
          supplierId: proposal.supplierId,
          items: { create: proposal.items },
        },
      });
    }

    const updated = await prisma.cotacao.update({
      where: { id },
      data: { status: 'received', receivedAt: new Date() },
    });

    return { success: true, data: { cotacao: updated } };
  });

  app.post('/:id/compare', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('cotacao:compare')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const cotacao = await prisma.cotacao.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        proposals: { include: { supplier: true, items: true } },
        items: { include: { item: true } },
      },
    });

    if (!cotacao) throw AppError.notFound('COTACAO_NOT_FOUND', 'Cotação não encontrada');

    const comparison = cotacao.items.map(item => {
      const proposalsForItem = cotacao.proposals.flatMap(p =>
        p.items.filter(pi => pi.itemId === item.id).map(pi => ({
          supplierId: p.supplierId,
          supplierName: p.supplier?.name,
          unitPrice: pi.unitPrice,
          deliveryTime: pi.deliveryTime,
          conditions: pi.conditions,
        }))
      );

      return {
        item: item,
        proposals: proposalsForItem,
        bestPrice: proposalsForItem.length > 0 ?
          proposalsForItem.reduce((best, current) => current.unitPrice < best.unitPrice ? current : best) : null,
      };
    });

    return { success: true, data: { comparison } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('cotacao:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const cotacao = await prisma.cotacao.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!cotacao) throw AppError.notFound('COTACAO_NOT_FOUND', 'Cotação não encontrada');

    await prisma.cotacao.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Cotação removida com sucesso' } };
  });
}