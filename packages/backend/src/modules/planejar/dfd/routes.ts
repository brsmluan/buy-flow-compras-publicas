// =============================================================================
// BUY-FLOW BACKEND - DFD Routes (Documento de Formalização de Demanda)
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { cache } from '../../../lib/redis.js';
import { AppError } from '../../../middleware/error.js';
import { authorize, requirePermission, requireTenantAccess } from '../../../middleware/auth.js';
import {
  CreateDfdSchema,
  UpdateDfdSchema,
  DfdStatusTransitionSchema,
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators/index.js';
import { DFDStatus } from '@buy-flow/shared/types/index.js';

export async function dfdRoutes(app: FastifyInstance) {
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
    if (query.year) where.year = query.year;
    if (query.organId) where.requestingOrganId = query.organId;

    const [dfds, total] = await Promise.all([
      prisma.dfd.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          requestingOrgan: { select: { id: true, name: true, acronym: true } },
          requester: { select: { id: true, name: true, email: true } },
          budgetSource: { select: { id: true, name: true, code: true } },
          approver: { select: { id: true, name: true } },
        },
      }),
      prisma.dfd.count({ where }),
    ]);

    return {
      success: true,
      data: dfds,
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

    const dfd = await prisma.dfd.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        requestingOrgan: { select: { id: true, name: true, acronym: true } },
        requester: { select: { id: true, name: true, email: true } },
        budgetSource: { select: { id: true, name: true, code: true } },
        approver: { select: { id: true, name: true } },
        etps: { select: { id: true, title: true, status: true } },
      },
    });

    if (!dfd) throw AppError.notFound('DFD_NOT_FOUND', 'DFD não encontrado');

    return { success: true, data: { dfd } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('dfd:create')] }, async (request, reply) => {
    const body = CreateDfdSchema.parse(request.body);
    const tenantId = request.user!.tenantId!;

    const [requestingOrgan, budgetSource] = await Promise.all([
      prisma.organ.findFirst({ where: { id: body.requestingOrganId, tenantId, deletedAt: null } }),
      prisma.organ.findFirst({ where: { id: body.budgetSourceId, tenantId, deletedAt: null } }),
    ]);

    if (!requestingOrgan) throw AppError.badRequest('INVALID_ORGAN', 'Órgão solicitante inválido');
    if (!budgetSource) throw AppError.badRequest('INVALID_BUDGET_SOURCE', 'Fonte orçamentária inválida');

    const year = body.year || new Date().getFullYear();
    const lastDfd = await prisma.dfd.findFirst({
      where: { tenantId, year, deletedAt: null },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const nextNumber = lastDfd ? String(Number(lastDfd.number) + 1).padStart(4, '0') : '0001';

    const dfd = await prisma.dfd.create({
      data: {
        ...body,
        tenantId,
        number: nextNumber,
        year,
        requesterId: request.user!.sub,
        workflowHistory: [{
          id: crypto.randomUUID(),
          toStatus: 'draft',
          comment: 'DFD criado',
          userId: request.user!.sub,
          userName: request.user!.name || request.user!.email,
          createdAt: new Date(),
        }],
      },
      include: {
        requestingOrgan: { select: { id: true, name: true, acronym: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId, userId: request.user!.sub, userName: request.user!.name,
        action: 'dfd.create', resource: 'dfd', resourceId: dfd.id,
        newValues: dfd, ipAddress: request.ip,
      },
    });

    return reply.code(201).send({ success: true, data: { dfd } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('dfd:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = UpdateDfdSchema.parse(request.body);
    const tenantId = request.user!.tenantId!;

    const dfd = await prisma.dfd.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!dfd) throw AppError.notFound('DFD_NOT_FOUND', 'DFD não encontrado');

    if (dfd.status !== 'draft' && dfd.status !== 'returned') {
      throw AppError.badRequest('INVALID_STATUS', 'Só é possível editar DFDs em rascunho ou devolvidos');
    }

    const updated = await prisma.dfd.update({
      where: { id },
      data: body,
      include: {
        requestingOrgan: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId, userId: request.user!.sub, userName: request.user!.name,
        action: 'dfd.update', resource: 'dfd', resourceId: id,
        oldValues: dfd, newValues: updated, ipAddress: request.ip,
      },
    });

    return { success: true, data: { dfd: updated } };
  });

  app.post('/:id/status', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('dfd:approve')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = DfdStatusTransitionSchema.parse(request.body);
    const tenantId = request.user!.tenantId!;

    const dfd = await prisma.dfd.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!dfd) throw AppError.notFound('DFD_NOT_FOUND', 'DFD não encontrado');

    if (dfd.id !== body.dfdId) throw AppError.badRequest('ID_MISMATCH', 'ID do DFD não confere');

    const allowedTransitions: Record<DFDStatus, DFDStatus[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['under_review', 'returned', 'cancelled'],
      under_review: ['approved', 'rejected', 'returned'],
      approved: ['cancelled'],
      rejected: ['submitted'],
      returned: ['submitted', 'cancelled'],
      cancelled: [],
    };

    if (!allowedTransitions[dfd.status].includes(body.newStatus)) {
      throw AppError.badRequest('INVALID_TRANSITION', `Transição de ${dfd.status} para ${body.newStatus} não permitida`);
    }

    const updateData: any = {
      status: body.newStatus,
      workflowHistory: {
        push: [{
          id: crypto.randomUUID(),
          fromStatus: dfd.status,
          toStatus: body.newStatus,
          comment: body.comment,
          userId: request.user!.sub,
          userName: request.user!.name || request.user!.email,
          createdAt: new Date(),
        }],
      },
    };

    if (body.newStatus === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = request.user!.sub;
    }

    const updated = await prisma.dfd.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        tenantId, userId: request.user!.sub, userName: request.user!.name,
        action: 'dfd.status_transition', resource: 'dfd', resourceId: id,
        oldValues: { status: dfd.status }, newValues: { status: body.newStatus },
        metadata: { comment: body.comment }, ipAddress: request.ip,
      },
    });

    return { success: true, data: { dfd: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('dfd:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const dfd = await prisma.dfd.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!dfd) throw AppError.notFound('DFD_NOT_FOUND', 'DFD não encontrado');

    if (dfd.status === 'approved') {
      throw AppError.badRequest('CANNOT_DELETE_APPROVED', 'Não é possível excluir DFD aprovado');
    }

    await prisma.dfd.update({ where: { id }, data: { deletedAt: new Date() } });

    await prisma.auditLog.create({
      data: { tenantId, userId: request.user!.sub, userName: request.user!.name, action: 'dfd.delete', resource: 'dfd', resourceId: id, ipAddress: request.ip },
    });

    return { success: true, data: { message: 'DFD removido com sucesso' } };
  });

  app.get('/stats/summary', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const tenantId = request.user!.tenantId!;
    const year = Number(request.query.year) || new Date().getFullYear();

    const [total, byStatus, totalValue] = await Promise.all([
      prisma.dfd.count({ where: { tenantId, year, deletedAt: null } }),
      prisma.dfd.groupBy({ by: ['status'], where: { tenantId, year, deletedAt: null }, _count: true }),
      prisma.dfd.aggregate({ where: { tenantId, year, deletedAt: null }, _sum: { estimatedValue: true } }),
    ]);

    return {
      success: true,
      data: {
        total,
        byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
        totalEstimatedValue: totalValue._sum.estimatedValue || 0,
      },
    };
  });
}