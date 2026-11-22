// =============================================================================
// BUY-FLOW BACKEND - ETP Routes (Estudo Técnico Preliminar)
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { AppError } from '../../../middleware/error.js';
import { authorize, requirePermission, requireTenantAccess } from '../../../middleware/auth.js';
import {
  CreateEtpSchema,
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators/index.js';
import { ETPStatus } from '@buy-flow/shared/types/index.js';

export async function etpRoutes(app: FastifyInstance) {
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

    if (query.status) where.status = query.status;

    const [etps, total] = await Promise.all([
      prisma.etp.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          dfd: { select: { id: true, number: true, year: true, objectDescription: true } },
        },
      }),
      prisma.etp.count({ where }),
    ]);

    return {
      success: true,
      data: etps,
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

    const etp = await prisma.etp.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        dfd: { select: { id: true, number: true, year: true, objectDescription: true, justification: true, estimatedValue: true } },
        riskAnalyses: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!etp) throw AppError.notFound('ETP_NOT_FOUND', 'ETP não encontrado');

    return { success: true, data: { etp } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('etp:create')] }, async (request, reply) => {
    const body = CreateEtpSchema.parse(request.body);
    const tenantId = request.user!.tenantId!;

    const dfd = await prisma.dfd.findFirst({ where: { id: body.dfdId, tenantId, deletedAt: null } });
    if (!dfd) throw AppError.badRequest('INVALID_DFD', 'DFD não encontrado');

    if (dfd.status !== 'approved') {
      throw AppError.badRequest('DFD_NOT_APPROVED', 'DFD deve estar aprovado para criar ETP');
    }

    const existingEtp = await prisma.etp.findUnique({ where: { dfdId: body.dfdId } });
    if (existingEtp) throw AppError.conflict('ETP_EXISTS', 'Já existe ETP para este DFD');

    const etp = await prisma.etp.create({
      data: {
        ...body,
        tenantId,
        status: ETPStatus.draft,
      },
      include: { dfd: { select: { id: true, number: true, year: true } } },
    });

    return reply.code(201).send({ success: true, data: { etp } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('etp:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = CreateEtpSchema.partial().parse(request.body);
    const tenantId = request.user!.tenantId!;

    const etp = await prisma.etp.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!etp) throw AppError.notFound('ETP_NOT_FOUND', 'ETP não encontrado');

    const updated = await prisma.etp.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { etp: updated } };
  });

  app.post('/:id/status', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('etp:approve')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { status } = z.object({ status: ETPStatus }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const etp = await prisma.etp.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!etp) throw AppError.notFound('ETP_NOT_FOUND', 'ETP não encontrado');

    const updated = await prisma.etp.update({
      where: { id },
      data: { status },
    });

    return { success: true, data: { etp: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('etp:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const etp = await prisma.etp.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!etp) throw AppError.notFound('ETP_NOT_FOUND', 'ETP não encontrado');

    await prisma.etp.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'ETP removido com sucesso' } };
  });
}