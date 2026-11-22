// =============================================================================
// BUY-FLOW BACKEND - Dispensa Routes
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

const DispensaSubTypeSchema = z.enum([
  'valor', 'emergencia', 'seguranca', 'doacao', 'concessao',
  'permissao', 'locacao', 'remuneracao', 'intercambio', 'pesquisa'
]);

export async function dispensaRoutes(app: FastifyInstance) {
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

    const [dispensas, total] = await Promise.all([
      prisma.dispensa.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
          supplier: { select: { id: true, name: true, tradeName: true } },
        },
      }),
      prisma.dispensa.count({ where }),
    ]);

    return {
      success: true,
      data: dispensas,
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

    const dispensa = await prisma.dispensa.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true, modality: true } },
        supplier: { select: { id: true, name: true, tradeName: true, email: true, phone: true } },
      },
    });

    if (!dispensa) throw AppError.notFound('DISPENSA_NOT_FOUND', 'Dispensa não encontrada');

    return { success: true, data: { dispensa } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('dispensa:create')] }, async (request, reply) => {
    const body = z.object({
      tenantId: z.string().uuid(),
      number: z.string().max(50),
      year: z.number().int().min(2020).max(2099),
      subType: DispensaSubTypeSchema,
      legalBasis: z.string().max(500),
      objectDescription: z.string().min(10).max(10000),
      estimatedValue: z.number().positive(),
      justification: z.string().min(20).max(10000),
      supplierId: z.string().uuid().optional(),
      ratificationAuthorityId: z.string().uuid(),
      authorizationAuthorityId: z.string().uuid(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const bidding = await prisma.bidding.create({
      data: {
        tenantId,
        modality: 'dispensa',
        number: body.number,
        year: body.year,
        objectDescription: body.objectDescription,
        estimatedValue: body.estimatedValue,
        biddingOrganId: body.ratificationAuthorityId,
        responsibleId: request.user!.sub,
        status: 'planning',
      },
    });

    const dispensa = await prisma.dispensa.create({
      data: {
        ...body,
        biddingId: bidding.id,
      },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
        supplier: { select: { id: true, name: true, tradeName: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { dispensa } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('dispensa:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      subType: DispensaSubTypeSchema.optional(),
      legalBasis: z.string().max(500).optional(),
      justification: z.string().min(20).max(10000).optional(),
      supplierId: z.string().uuid().optional(),
      ratificationAuthorityId: z.string().uuid().optional(),
      authorizationAuthorityId: z.string().uuid().optional(),
      ratificationDate: z.string().datetime().optional(),
      authorizationDate: z.string().datetime().optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const dispensa = await prisma.dispensa.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!dispensa) throw AppError.notFound('DISPENSA_NOT_FOUND', 'Dispensa não encontrada');

    const updated = await prisma.dispensa.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { dispensa: updated } };
  });

  app.post('/:id/ratify', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('dispensa:ratify')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const dispensa = await prisma.dispensa.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!dispensa) throw AppError.notFound('DISPENSA_NOT_FOUND', 'Dispensa não encontrada');

    const updated = await prisma.dispensa.update({
      where: { id },
      data: { ratificationDate: new Date() },
    });

    return { success: true, data: { dispensa: updated } };
  });

  app.post('/:id/authorize', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('dispensa:authorize')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const dispensa = await prisma.dispensa.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!dispensa) throw AppError.notFound('DISPENSA_NOT_FOUND', 'Dispensa não encontrada');

    const updated = await prisma.dispensa.update({
      where: { id },
      data: { authorizationDate: new Date() },
    });

    return { success: true, data: { dispensa: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('dispensa:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const dispensa = await prisma.dispensa.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!dispensa) throw AppError.notFound('DISPENSA_NOT_FOUND', 'Dispensa não encontrada');

    await prisma.dispensa.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.bidding.update({ where: { id: dispensa.biddingId }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Dispensa removida com sucesso' } };
  });
}