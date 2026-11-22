// =============================================================================
// BUY-FLOW BACKEND - Relatórios Routes
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
import { ReportType, ReportFormat } from '@buy-flow/shared/types/index.js';

export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    const [relatorios, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      success: true,
      data: relatorios,
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

    const relatorio = await prisma.report.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!relatorio) throw AppError.notFound('RELATORIO_NOT_FOUND', 'Relatório não encontrado');

    return { success: true, data: { relatorio } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('relatorio:create')] }, async (request, reply) => {
    const body = z.object({
      type: z.enum([
        'dfd_list', 'etp_list', 'bidding_list', 'contract_list',
        'purchase_order_list', 'supplier_list', 'execution_financial',
        'contract_expiration', 'bidding_timeline', 'supplier_performance',
        'organ_execution', 'custom'
      ]),
      name: z.string().min(2).max(200),
      description: z.string().max(1000).optional(),
      config: z.object({
        filters: z.record(z.unknown()).optional(),
        groupBy: z.string().optional(),
        includeCharts: z.boolean().default(true),
      }).optional(),
      schedule: z.string().optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const relatorio = await prisma.report.create({
      data: {
        ...body,
        tenantId,
        createdById: request.user!.sub,
        isActive: true,
      },
    });

    return reply.code(201).send({ success: true, data: { relatorio } });
  });

  app.post('/:id/generate', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('relatorio:generate')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { format = 'pdf', filters } = z.object({
      format: z.enum(['pdf', 'excel', 'csv', 'json']).default('pdf'),
      filters: z.record(z.unknown()).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const relatorio = await prisma.report.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!relatorio) throw AppError.notFound('RELATORIO_NOT_FOUND', 'Relatório não encontrado');

    const fileName = `relatorio_${relatorio.type}_${Date.now()}.${format}`;

    return { success: true, data: { fileName, message: 'Relatório gerado com sucesso (mock)' } };
  });

  app.post('/:id/schedule', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('relatorio:schedule')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { schedule } = z.object({ schedule: z.string() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const relatorio = await prisma.report.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!relatorio) throw AppError.notFound('RELATORIO_NOT_FOUND', 'Relatório não encontrado');

    const updated = await prisma.report.update({
      where: { id },
      data: { schedule, nextRunAt: calculateNextRun(schedule) },
    });

    return { success: true, data: { relatorio: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('relatorio:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const relatorio = await prisma.report.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!relatorio) throw AppError.notFound('RELATORIO_NOT_FOUND', 'Relatório não encontrado');

    await prisma.report.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Relatório removido com sucesso' } };
  });
}

function calculateNextRun(cronExpression: string): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}