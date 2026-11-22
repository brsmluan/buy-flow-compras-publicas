// =============================================================================
// BUY-FLOW BACKEND - Chamada Pública Routes
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

export async function chamadaPublicaRoutes(app: FastifyInstance) {
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

    const [chamadas, total] = await Promise.all([
      prisma.chamadaPublica.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
        },
      }),
      prisma.chamadaPublica.count({ where }),
    ]);

    return {
      success: true,
      data: chamadas,
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

    const chamada = await prisma.chamadaPublica.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true, modality: true } },
      },
    });

    if (!chamada) throw AppError.notFound('CHAMADA_PUBLICA_NOT_FOUND', 'Chamada Pública não encontrada');

    return { success: true, data: { chamada } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('chamada_publica:create')] }, async (request, reply) => {
    const body = z.object({
      tenantId: z.string().uuid(),
      number: z.string().max(50),
      year: z.number().int().min(2020).max(2099),
      editalUrl: z.string().url().optional(),
      projectDescription: z.string().max(10000),
      selectionCriteria: z.array(z.object({
        criterion: z.string(),
        weight: z.number().min(0).max(100),
        description: z.string().optional(),
      })).min(1),
      selectedProjects: z.array(z.object({
        projectId: z.string().uuid(),
        score: z.number(),
        status: z.enum(['selected', 'waitlist', 'rejected']),
      })).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const bidding = await prisma.bidding.create({
      data: {
        tenantId,
        modality: 'chamada_publica',
        number: body.number,
        year: body.year,
        objectDescription: body.projectDescription,
        estimatedValue: 0,
        biddingOrganId: request.user!.sub,
        responsibleId: request.user!.sub,
        status: 'planning',
      },
    });

    const chamada = await prisma.chamadaPublica.create({
      data: {
        ...body,
        biddingId: bidding.id,
      },
      include: {
        bidding: { select: { id: true, number: true, year: true, objectDescription: true, estimatedValue: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { chamada } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('chamada_publica:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      editalUrl: z.string().url().optional(),
      projectDescription: z.string().max(10000).optional(),
      selectionCriteria: z.array(z.object({
        criterion: z.string(),
        weight: z.number().min(0).max(100),
        description: z.string().optional(),
      })).optional(),
      selectedProjects: z.array(z.object({
        projectId: z.string().uuid(),
        score: z.number(),
        status: z.enum(['selected', 'waitlist', 'rejected']),
      })).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const chamada = await prisma.chamadaPublica.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!chamada) throw AppError.notFound('CHAMADA_PUBLICA_NOT_FOUND', 'Chamada Pública não encontrada');

    const updated = await prisma.chamadaPublica.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { chamada: updated } };
  });

  app.post('/:id/publish', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('chamada_publica:publish')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { editalUrl } = z.object({ editalUrl: z.string().url() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const chamada = await prisma.chamadaPublica.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!chamada) throw AppError.notFound('CHAMADA_PUBLICA_NOT_FOUND', 'Chamada Pública não encontrada');

    const updated = await prisma.chamadaPublica.update({
      where: { id },
      data: { editalUrl },
    });

    return { success: true, data: { chamada: updated } };
  });

  app.post('/:id/select', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('chamada_publica:select')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { selectedProjects } = z.object({
      selectedProjects: z.array(z.object({
        projectId: z.string().uuid(),
        score: z.number(),
        status: z.enum(['selected', 'waitlist', 'rejected']),
      })).min(1),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const chamada = await prisma.chamadaPublica.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!chamada) throw AppError.notFound('CHAMADA_PUBLICA_NOT_FOUND', 'Chamada Pública não encontrada');

    const updated = await prisma.chamadaPublica.update({
      where: { id },
      data: { selectedProjects },
    });

    return { success: true, data: { chamada: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('chamada_publica:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const chamada = await prisma.chamadaPublica.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!chamada) throw AppError.notFound('CHAMADA_PUBLICA_NOT_FOUND', 'Chamada Pública não encontrada');

    await prisma.chamadaPublica.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.bidding.update({ where: { id: chamada.biddingId }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Chamada Pública removida com sucesso' } };
  });
}