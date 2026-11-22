// =============================================================================
// BUY-FLOW BACKEND - Risk Analysis Routes (Análise de Risco)
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/middleware/error';
import { authorize, requirePermission, requireTenantAccess } from '@/middleware/auth';
import {
  CreateRiskAnalysisSchema,
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators/index';
import { RiskLevel } from '@buy-flow/shared/types/index';

export async function riskRoutes(app: FastifyInstance) {
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

    const [risks, total] = await Promise.all([
      prisma.riskAnalysis.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.riskAnalysis.count({ where }),
    ]);

    return {
      success: true,
      data: risks,
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

    const risk = await prisma.riskAnalysis.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!risk) throw AppError.notFound('RISK_NOT_FOUND', 'Análise de risco não encontrada');

    return { success: true, data: { risk } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('risk:create')] }, async (request, reply) => {
    const body = CreateRiskAnalysisSchema.parse(request.body);
    const tenantId = request.user!.tenantId!;

    const { relatedEntityId, relatedEntityType } = body;
    let entityExists = false;

    switch (relatedEntityType) {
      case 'dfd':
        entityExists = !!(await prisma.dfd.findFirst({ where: { id: relatedEntityId, tenantId, deletedAt: null } }));
        break;
      case 'etp':
        entityExists = !!(await prisma.etp.findFirst({ where: { id: relatedEntityId, tenantId, deletedAt: null } }));
        break;
      case 'bidding':
        entityExists = !!(await prisma.bidding.findFirst({ where: { id: relatedEntityId, tenantId, deletedAt: null } }));
        break;
      case 'contract':
        entityExists = !!(await prisma.contract.findFirst({ where: { id: relatedEntityId, tenantId, deletedAt: null } }));
        break;
    }

    if (!entityExists) {
      throw AppError.badRequest('INVALID_ENTITY', 'Entidade relacionada não encontrada');
    }

    const risk = await prisma.riskAnalysis.create({
      data: {
        ...body,
        tenantId,
      },
    });

    return reply.code(201).send({ success: true, data: { risk } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('risk:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = CreateRiskAnalysisSchema.partial().parse(request.body);
    const tenantId = request.user!.tenantId!;

    const risk = await prisma.riskAnalysis.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!risk) throw AppError.notFound('RISK_NOT_FOUND', 'Análise de risco não encontrada');

    const updated = await prisma.riskAnalysis.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { risk: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('risk:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const risk = await prisma.riskAnalysis.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!risk) throw AppError.notFound('RISK_NOT_FOUND', 'Análise de risco não encontrada');

    await prisma.riskAnalysis.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Análise de risco removida com sucesso' } };
  });
}