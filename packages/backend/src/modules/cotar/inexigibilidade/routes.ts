// =============================================================================
// BUY-FLOW BACKEND - Inexigibilidade Routes
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

const InexigibilidadeSubTypeSchema = z.enum([
  'unico_fornecedor', 'profissional_especializado', 'exclusividade', 'patente'
]);

export async function inexigibilidadeRoutes(app: FastifyInstance) {
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

    const [inexigibilidades, total] = await Promise.all([
      prisma.inexigibilidade.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
          supplier: { select: { id: true, name: true, tradeName: true } },
        },
      }),
      prisma.inexigibilidade.count({ where }),
    ]);

    return {
      success: true,
      data: inexigibilidades,
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

    const inexigibilidade = await prisma.inexigibilidade.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true, modality: true } },
        supplier: { select: { id: true, name: true, tradeName: true, email: true, phone: true } },
      },
    });

    if (!inexigibilidade) throw AppError.notFound('INEXIGIBILIDADE_NOT_FOUND', 'Inexigibilidade não encontrada');

    return { success: true, data: { inexigibilidade } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('inexigibilidade:create')] }, async (request, reply) => {
    const body = z.object({
      tenantId: z.string().uuid(),
      number: z.string().max(50),
      year: z.number().int().min(2020).max(2099),
      subType: z.enum(['unico_fornecedor', 'profissional_especializado', 'exclusividade', 'patente']),
      legalBasis: z.string().max(500),
      objectDescription: z.string().min(10).max(10000),
      estimatedValue: z.number().positive(),
      justification: z.string().min(20).max(10000),
      supplierId: z.string().uuid(),
      ratificationAuthorityId: z.string().uuid(),
      authorizationAuthorityId: z.string().uuid(),
      exclusivityProof: z.string().max(10000),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const bidding = await prisma.bidding.create({
      data: {
        tenantId,
        modality: 'inexigibilidade',
        number: body.number,
        year: body.year,
        objectDescription: body.objectDescription,
        estimatedValue: body.estimatedValue,
        biddingOrganId: body.ratificationAuthorityId,
        responsibleId: request.user!.sub,
        status: 'planning',
      },
    });

    const inexigibilidade = await prisma.inexigibilidade.create({
      data: {
        ...body,
        biddingId: bidding.id,
      },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
        supplier: { select: { id: true, name: true, tradeName: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { inexigibilidade } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('inexigibilidade:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      subType: z.enum(['unico_fornecedor', 'profissional_especializado', 'exclusividade', 'patente']).optional(),
      legalBasis: z.string().max(500).optional(),
      justification: z.string().min(20).max(10000).optional(),
      supplierId: z.string().uuid().optional(),
      ratificationAuthorityId: z.string().uuid().optional(),
      authorizationAuthorityId: z.string().uuid().optional(),
      exclusivityProof: z.string().max(10000).optional(),
      ratificationDate: z.string().datetime().optional(),
      authorizationDate: z.string().datetime().optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const inexigibilidade = await prisma.inexigibilidade.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!inexigibilidade) throw AppError.notFound('INEXIGIBILIDADE_NOT_FOUND', 'Inexigibilidade não encontrada');

    const updated = await prisma.inexigibilidade.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { inexigibilidade: updated } };
  });

  app.post('/:id/ratify', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('inexigibilidade:ratify')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const inexigibilidade = await prisma.inexigibilidade.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!inexigibilidade) throw AppError.notFound('INEXIGIBILIDADE_NOT_FOUND', 'Inexigibilidade não encontrada');

    const updated = await prisma.inexigibilidade.update({
      where: { id },
      data: { ratificationDate: new Date() },
    });

    return { success: true, data: { inexigibilidade: updated } };
  });

  app.post('/:id/authorize', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('inexigibilidade:authorize')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const inexigibilidade = await prisma.inexigibilidade.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!inexigibilidade) throw AppError.notFound('INEXIGIBILIDADE_NOT_FOUND', 'Inexigibilidade não encontrada');

    const updated = await prisma.inexigibilidade.update({
      where: { id },
      data: { authorizationDate: new Date() },
    });

    return { success: true, data: { inexigibilidade: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('inexigibilidade:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const inexigibilidade = await prisma.inexigibilidade.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!inexigibilidade) throw AppError.notFound('INEXIGIBILIDADE_NOT_FOUND', 'Inexigibilidade não encontrada');

    await prisma.inexigibilidade.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.bidding.update({ where: { id: inexigibilidade.biddingId }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Inexigibilidade removida com sucesso' } };
  });
}