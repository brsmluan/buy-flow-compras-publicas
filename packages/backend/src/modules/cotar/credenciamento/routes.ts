// =============================================================================
// BUY-FLOW BACKEND - Credenciamento Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/middleware/error';
import { authorize, requirePermission, requireTenantAccess } from '@/middleware/auth';
import {
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators';

export async function credenciamentoRoutes(app: FastifyInstance) {
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

    const [credenciamentos, total] = await Promise.all([
      prisma.credenciamento.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
        },
      }),
      prisma.credenciamento.count({ where }),
    ]);

    return {
      success: true,
      data: credenciamentos,
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

    const credenciamento = await prisma.credenciamento.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true, modality: true } },
      },
    });

    if (!credenciamento) throw AppError.notFound('CREDENCIAMENTO_NOT_FOUND', 'Credenciamento não encontrado');

    return { success: true, data: { credenciamento } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('credenciamento:create')] }, async (request, reply) => {
    const body = z.object({
      tenantId: z.string().uuid(),
      number: z.string().max(50),
      year: z.number().int().min(2020).max(2099),
      editalUrl: z.string().url().optional(),
      habilitationStart: z.string().datetime().optional(),
      habilitationEnd: z.string().datetime().optional(),
      qualifiedSuppliers: z.array(z.object({
        supplierId: z.string().uuid(),
        qualifiedAt: z.string().datetime(),
        documents: z.array(z.string()).optional(),
      })).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const bidding = await prisma.bidding.create({
      data: {
        tenantId,
        modality: 'credenciamento',
        number: body.number,
        year: body.year,
        objectDescription: 'Credenciamento de fornecedores',
        estimatedValue: 0,
        biddingOrganId: request.user!.sub,
        responsibleId: request.user!.sub,
        status: 'planning',
      },
    });

    const credenciamento = await prisma.credenciamento.create({
      data: {
        ...body,
        biddingId: bidding.id,
      },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { credenciamento } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('credenciamento:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      editalUrl: z.string().url().optional(),
      habilitationStart: z.string().datetime().optional(),
      habilitationEnd: z.string().datetime().optional(),
      qualifiedSuppliers: z.array(z.object({
        supplierId: z.string().uuid(),
        qualifiedAt: z.string().datetime(),
        documents: z.array(z.string()).optional(),
      })).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const credenciamento = await prisma.credenciamento.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!credenciamento) throw AppError.notFound('CREDENCIAMENTO_NOT_FOUND', 'Credenciamento não encontrado');

    const updated = await prisma.credenciamento.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { credenciamento: updated } };
  });

  app.post('/:id/publish', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('credenciamento:publish')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { editalUrl } = z.object({ editalUrl: z.string().url() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const credenciamento = await prisma.credenciamento.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!credenciamento) throw AppError.notFound('CREDENCIAMENTO_NOT_FOUND', 'Credenciamento não encontrado');

    const updated = await prisma.credenciamento.update({
      where: { id },
      data: { editalUrl },
    });

    return { success: true, data: { credenciamento: updated } };
  });

  app.post('/:id/habilitate', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('credenciamento:habilitate')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { suppliers } = z.object({
      suppliers: z.array(z.object({
        supplierId: z.string().uuid(),
        qualifiedAt: z.string().datetime(),
        documents: z.array(z.string()).optional(),
      })).min(1),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const credenciamento = await prisma.credenciamento.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!credenciamento) throw AppError.notFound('CREDENCIAMENTO_NOT_FOUND', 'Credenciamento não encontrado');

    const updated = await prisma.credenciamento.update({
      where: { id },
      data: { qualifiedSuppliers: suppliers },
    });

    return { success: true, data: { credenciamento: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('credenciamento:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const credenciamento = await prisma.credenciamento.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!credenciamento) throw AppError.notFound('CREDENCIAMENTO_NOT_FOUND', 'Credenciamento não encontrado');

    await prisma.credenciamento.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.bidding.update({ where: { id: credenciamento.biddingId }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Credenciamento removido com sucesso' } };
  });
}