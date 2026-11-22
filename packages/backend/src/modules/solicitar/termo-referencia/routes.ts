// =============================================================================
// BUY-FLOW BACKEND - Termo de Referência Routes
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

export async function termoRefRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [termos, total] = await Promise.all([
      prisma.termoReferencia.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          dfd: { select: { id: true, number: true, year: true } },
          etp: { select: { id: true, title: true } },
        },
      }),
      prisma.termoReferencia.count({ where }),
    ]);

    return {
      success: true,
      data: termos,
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

    const termo = await prisma.termoReferencia.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        dfd: { select: { id: true, number: true, year: true, objectDescription: true } },
        etp: { select: { id: true, title: true, requirements: true } },
      },
    });

    if (!termo) throw AppError.notFound('TERMO_NOT_FOUND', 'Termo de Referência não encontrado');

    return { success: true, data: { termo } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('termo:create')] }, async (request, reply) => {
    const body = z.object({
      dfdId: z.string().uuid().optional(),
      etpId: z.string().uuid().optional(),
      title: z.string().min(5).max(200),
      objectDescription: z.string().min(20).max(10000),
      specifications: z.string().max(20000).optional(),
      quantities: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        unit: z.string(),
      })).min(1),
      estimatedValue: z.number().positive(),
      deliveryConditions: z.string().max(5000).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const termo = await prisma.termoReferencia.create({
      data: {
        ...body,
        tenantId,
        createdById: request.user!.sub,
        status: 'draft',
      },
    });

    return reply.code(201).send({ success: true, data: { termo } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('termo:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      title: z.string().min(5).max(200).optional(),
      objectDescription: z.string().min(20).max(10000).optional(),
      specifications: z.string().max(20000).optional(),
      quantities: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
        unit: z.string(),
      })).optional(),
      estimatedValue: z.number().positive().optional(),
      deliveryConditions: z.string().max(5000).optional(),
      status: z.enum(['draft', 'review', 'approved', 'rejected']).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const termo = await prisma.termoReferencia.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!termo) throw AppError.notFound('TERMO_NOT_FOUND', 'Termo de Referência não encontrado');

    const updated = await prisma.termoReferencia.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { termo: updated } };
  });

  app.post('/:id/approve', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('termo:approve')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const termo = await prisma.termoReferencia.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!termo) throw AppError.notFound('TERMO_NOT_FOUND', 'Termo de Referência não encontrado');

    const updated = await prisma.termoReferencia.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date(), approvedById: request.user!.sub },
    });

    return { success: true, data: { termo: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('termo:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const termo = await prisma.termoReferencia.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!termo) throw AppError.notFound('TERMO_NOT_FOUND', 'Termo de Referência não encontrado');

    await prisma.termoReferencia.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Termo de Referência removido com sucesso' } };
  });
}