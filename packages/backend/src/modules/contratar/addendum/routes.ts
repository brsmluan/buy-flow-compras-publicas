// =============================================================================
// BUY-FLOW BACKEND - Aditivo Routes
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

const AddendumTypeSchema = z.enum([
  'aditivo', 'apostilamento', 'reajuste', 'repactuacao', 'prorrogacao', 'alteracao_objeto'
]);

const AddendumStatusSchema = z.enum([
  'draft', 'pending_approval', 'approved', 'rejected', 'signed'
]);

export async function addendumRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { contract: { tenantId }, deletedAt: null };

    const [aditivos, total] = await Promise.all([
      prisma.contractAddendum.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          contract: { select: { id: true, number: true, year: true, objectDescription: true } },
          signer: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.contractAddendum.count({ where }),
    ]);

    return {
      success: true,
      data: aditivos,
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

    const aditivo = await prisma.contractAddendum.findFirst({
      where: { id, contract: { tenantId }, deletedAt: null },
      include: {
        contract: { select: { id: true, number: true, year: true, objectDescription: true, totalValue: true } },
        signer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!aditivo) throw AppError.notFound('ADITIVO_NOT_FOUND', 'Aditivo não encontrado');

    return { success: true, data: { aditivo } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('aditivo:create')] }, async (request, reply) => {
    const body = z.object({
      contractId: z.string().uuid(),
      number: z.string().max(50),
      type: z.enum(['aditivo', 'apostilamento', 'reajuste', 'repactuacao', 'prorrogacao', 'alteracao_objeto']),
      description: z.string().min(10).max(5000),
      valueChange: z.number().multipleOf(0.01).default(0),
      newTotalValue: z.number().positive().optional(),
      newEndDate: z.string().date().optional(),
      legalBasis: z.string().max(500),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const contract = await prisma.contract.findFirst({ where: { id: body.contractId, tenantId, deletedAt: null } });
    if (!contract) throw AppError.notFound('CONTRATO_NOT_FOUND', 'Contrato não encontrado');

    const aditivo = await prisma.contractAddendum.create({
      data: {
        ...body,
        tenantId,
        status: 'draft',
      },
      include: {
        contract: { select: { id: true, number: true, year: true, objectDescription: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { aditivo } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('aditivo:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      number: z.string().max(50).optional(),
      type: z.enum(['aditivo', 'apostilamento', 'reajuste', 'repactuacao', 'prorrogacao', 'alteracao_objeto']).optional(),
      description: z.string().min(10).max(5000).optional(),
      valueChange: z.number().multipleOf(0.01).optional(),
      newTotalValue: z.number().positive().optional(),
      newEndDate: z.string().date().optional(),
      legalBasis: z.string().max(500).optional(),
      status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'signed']).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const aditivo = await prisma.contractAddendum.findFirst({ where: { id, contract: { tenantId }, deletedAt: null } });
    if (!aditivo) throw AppError.notFound('ADITIVO_NOT_FOUND', 'Aditivo não encontrado');

    const updated = await prisma.contractAddendum.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { aditivo: updated } };
  });

  app.post('/:id/approve', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('aditivo:approve')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const aditivo = await prisma.contractAddendum.findFirst({ where: { id, contract: { tenantId }, deletedAt: null } });
    if (!aditivo) throw AppError.notFound('ADITIVO_NOT_FOUND', 'Aditivo não encontrado');

    const updated = await prisma.contractAddendum.update({
      where: { id },
      data: { status: 'approved' },
    });

    if (aditivo.valueChange !== 0 || aditivo.newEndDate) {
      await prisma.contract.update({
        where: { id: aditivo.contractId },
        data: {
          totalValue: aditivo.newTotalValue || undefined,
          endDate: aditivo.newEndDate ? new Date(aditivo.newEndDate) : undefined,
        },
      });
    }

    const updated = await prisma.contractAddendum.update({
      where: { id },
      data: { status: 'approved', approvedAt: new Date(), approvedBy: request.user!.sub },
    });

    return { success: true, data: { aditivo: updated } };
  });

  app.post('/:id/sign', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('aditivo:sign')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { fileUrl } = z.object({ fileUrl: z.string().url() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const aditivo = await prisma.contractAddendum.findFirst({ where: { id, contract: { tenantId }, deletedAt: null } });
    if (!aditivo) throw AppError.notFound('ADITIVO_NOT_FOUND', 'Aditivo não encontrado');

    const updated = await prisma.contractAddendum.update({
      where: { id },
      data: { status: 'signed', fileUrl, signedAt: new Date(), signedBy: request.user!.sub },
    });

    await prisma.contract.update({
      where: { id: aditivo.contractId },
      data: {
        totalValue: aditivo.newTotalValue || undefined,
        endDate: aditivo.newEndDate ? new Date(aditivo.newEndDate) : undefined,
      },
    });

    return { success: true, data: { aditivo: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('aditivo:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const aditivo = await prisma.contractAddendum.findFirst({ where: { id, contract: { tenantId }, deletedAt: null } });
    if (!aditivo) throw AppError.notFound('ADITIVO_NOT_FOUND', 'Aditivo não encontrado');

    await prisma.contractAddendum.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Aditivo removido com sucesso' } };
  });
}