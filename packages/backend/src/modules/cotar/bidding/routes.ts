// =============================================================================
// BUY-FLOW BACKEND - Licitação Routes
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
import { BiddingModality, BiddingStatus } from '@buy-flow/shared/types/index.js';

export async function biddingRoutes(app: FastifyInstance) {
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

    if (query.modality) where.modality = query.modality;
    if (query.status) where.status = query.status;

    const [licitacoes, total] = await Promise.all([
      prisma.bidding.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          biddingOrgan: { select: { id: true, name: true, acronym: true } },
          responsible: { select: { id: true, name: true, email: true } },
          _count: { select: { contracts: true } },
        },
      }),
      prisma.bidding.count({ where }),
    ]);

    return {
      success: true,
      data: licitacoes,
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

    const licitacao = await prisma.bidding.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        biddingOrgan: { select: { id: true, name: true, acronym: true } },
        responsible: { select: { id: true, name: true, email: true } },
        dispensa: true,
        inexigibilidade: true,
        credenciamento: true,
        chamadaPublica: true,
        contracts: { select: { id: true, number: true, year: true, status: true } },
      },
    });

    if (!licitacao) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    return { success: true, data: { licitacao } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('licitacao:create')] }, async (request, reply) => {
    const body = z.object({
      modality: BiddingModality,
      number: z.string().max(50),
      year: z.number().int().min(2020).max(2099),
      processNumber: z.string().max(100).optional(),
      objectDescription: z.string().min(10).max(10000),
      estimatedValue: z.number().positive(),
      biddingOrganId: z.string().uuid(),
      responsibleId: z.string().uuid(),
      sessionDate: z.string().datetime().optional(),
      sessionLocation: z.string().max(500).optional(),
      items: z.array(z.object({
        itemId: z.string().uuid(),
        description: z.string(),
        quantity: z.number().positive().multipleOf(0.001),
        unit: z.string(),
        estimatedUnitPrice: z.number().positive(),
        estimatedTotalPrice: z.number().positive(),
      })).min(1),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const licitacao = await prisma.bidding.create({
      data: {
        ...body,
        tenantId,
        status: BiddingStatus.planning,
      },
      include: {
        biddingOrgan: { select: { id: true, name: true, acronym: true } },
        responsible: { select: { id: true, name: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { licitacao } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('licitacao:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      modality: BiddingModality.optional(),
      number: z.string().max(50).optional(),
      year: z.number().int().min(2020).max(2099).optional(),
      processNumber: z.string().max(100).optional(),
      objectDescription: z.string().min(10).max(10000).optional(),
      estimatedValue: z.number().positive().optional(),
      biddingOrganId: z.string().uuid().optional(),
      responsibleId: z.string().uuid().optional(),
      status: BiddingStatus.optional(),
      sessionDate: z.string().datetime().optional(),
      sessionLocation: z.string().max(500).optional(),
      items: z.array(z.object({
        itemId: z.string().uuid(),
        description: z.string(),
        quantity: z.number().positive().multipleOf(0.001),
        unit: z.string(),
        estimatedUnitPrice: z.number().positive(),
        estimatedTotalPrice: z.number().positive(),
      })).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const licitacao = await prisma.bidding.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!licitacao) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    const updated = await prisma.bidding.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { licitacao: updated } };
  });

  app.post('/:id/publish', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('licitacao:publish')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { editalUrl } = z.object({ editalUrl: z.string().url() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const licitacao = await prisma.bidding.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!licitacao) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    const updated = await prisma.bidding.update({
      where: { id },
      data: { status: BiddingStatus.published, editalUrl },
    });

    return { success: true, data: { licitacao: updated } };
  });

  app.post('/:id/session', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('licitacao:session')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      sessionDate: z.string().datetime(),
      sessionLocation: z.string().max(500).optional(),
      platformUrl: z.string().url().optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const licitacao = await prisma.bidding.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!licitacao) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    const updated = await prisma.bidding.update({
      where: { id },
      data: { status: BiddingStatus.in_session, sessionDate: body.sessionDate, sessionLocation: body.sessionLocation },
    });

    return { success: true, data: { licitacao: updated } };
  });

  app.post('/:id/judge', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('licitacao:judge')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      winningSupplierId: z.string().uuid(),
      judgmentNotes: z.string().max(10000).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const licitacao = await prisma.bidding.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!licitacao) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    const updated = await prisma.bidding.update({
      where: { id },
      data: { status: BiddingStatus.judgment },
    });

    return { success: true, data: { licitacao: updated } };
  });

  app.post('/:id/homologate', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('licitacao:homologate')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const licitacao = await prisma.bidding.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!licitacao) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    const updated = await prisma.bidding.update({
      where: { id },
      data: { status: BiddingStatus.homologated },
    });

    return { success: true, data: { licitacao: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('licitacao:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const licitacao = await prisma.bidding.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!licitacao) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    await prisma.bidding.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Licitação removida com sucesso' } };
  });
}