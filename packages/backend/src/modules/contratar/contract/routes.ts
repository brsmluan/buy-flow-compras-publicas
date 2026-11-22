// =============================================================================
// BUY-FLOW BACKEND - Contrato Routes
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
import { ContractStatus, BiddingModality } from '@buy-flow/shared/types/index';

export async function contractRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { number: { contains: query.search } },
        { objectDescription: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;

    const [contratos, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          supplier: { select: { id: true, name: true, tradeName: true } },
          organ: { select: { id: true, name: true, acronym: true } },
          manager: { select: { id: true, name: true, email: true } },
          bidding: { select: { id: true, number: true, year: true, modality: true } },
          _count: { select: { addenda: true, purchaseOrders: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      success: true,
      data: contratos,
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

    const contrato = await prisma.contract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        supplier: { select: { id: true, name: true, tradeName: true, email: true, phone: true } },
        organ: { select: { id: true, name: true, acronym: true } },
        manager: { select: { id: true, name: true, email: true } },
        bidding: { select: { id: true, number: true, year: true, modality: true } },
        addenda: { orderBy: { createdAt: 'desc' } },
        purchaseOrders: { select: { id: true, number: true, year: true, status: true, totalValue: true } },
      },
    });

    if (!contrato) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    return { success: true, data: { contrato } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('contrato:create')] }, async (request, reply) => {
    const body = z.object({
      number: z.string().max(50),
      year: z.number().int().min(2020).max(2099),
      processNumber: z.string().max(100).optional(),
      biddingId: z.string().uuid().optional(),
      modality: BiddingModality,
      supplierId: z.string().uuid(),
      organId: z.string().uuid(),
      managerId: z.string().uuid(),
      objectDescription: z.string().min(10).max(10000),
      totalValue: z.number().positive(),
      startDate: z.string().date(),
      endDate: z.string().date(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const contrato = await prisma.contract.create({
      data: {
        ...body,
        tenantId,
        status: 'draft',
      },
      include: {
        supplier: { select: { id: true, name: true, tradeName: true } },
        organ: { select: { id: true, name: true, acronym: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { contrato } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('contrato:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      number: z.string().max(50).optional(),
      year: z.number().int().min(2020).max(2099).optional(),
      processNumber: z.string().max(100).optional(),
      biddingId: z.string().uuid().optional(),
      modality: BiddingModality.optional(),
      supplierId: z.string().uuid().optional(),
      organId: z.string().uuid().optional(),
      managerId: z.string().uuid().optional(),
      objectDescription: z.string().min(10).max(10000).optional(),
      totalValue: z.number().positive().optional(),
      startDate: z.string().date().optional(),
      endDate: z.string().date().optional(),
      status: z.enum(['draft', 'pending_signature', 'active', 'suspended', 'expired', 'terminated', 'renewed']).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const contrato = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!contrato) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    const updated = await prisma.contract.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { contrato: updated } };
  });

  app.post('/:id/sign', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('contrato:sign')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { contractFileUrl } = z.object({ contractFileUrl: z.string().url() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const contrato = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!contrato) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'active', contractFileUrl, signedAt: new Date(), signedBy: request.user!.sub },
    });

    return { success: true, data: { contrato: updated } };
  });

  app.post('/:id/suspend', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('contrato:suspend')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { reason } = z.object({ reason: z.string().max(500) }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const contrato = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!contrato) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'suspended', settings: { ...contrato.settings, suspensionReason: reason } },
    });

    return { success: true, data: { contrato: updated } };
  });

  app.post('/:id/terminate', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('contrato:terminate')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { reason } = z.object({ reason: z.string().max(500) }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const contrato = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!contrato) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'terminated', settings: { ...contrato.settings, terminationReason: reason } },
    });

    return { success: true, data: { contrato: updated } };
  });

  app.post('/:id/renew', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('contrato:renew')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { newEndDate, newTotalValue } = z.object({
      newEndDate: z.string().date(),
      newTotalValue: z.number().positive().optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const contrato = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!contrato) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    const updated = await prisma.contract.update({
      where: { id },
      data: { endDate: newEndDate, totalValue: newTotalValue || contrato.totalValue, status: 'renewed' },
    });

    return { success: true, data: { contrato: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('contrato:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const contrato = await prisma.contract.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!contrato) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    await prisma.contract.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Contrato removido com sucesso' } };
  });
}