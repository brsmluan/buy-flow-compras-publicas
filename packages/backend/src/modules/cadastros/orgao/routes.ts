// =============================================================================
// BUY-FLOW BACKEND - Órgão Routes
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
import { OrganType } from '@buy-flow/shared/types/index.js';

export async function organRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { acronym: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [orgaos, total] = await Promise.all([
      prisma.organ.findMany({
        where,
        orderBy: { [query.sortBy || 'name']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          parent: { select: { id: true, name: true, acronym: true } },
          children: { select: { id: true, name: true, acronym: true } },
          manager: { select: { id: true, name: true, email: true } },
          _count: { select: { dfdsRequested: true, dfdsBudget: true, biddings: true, contracts: true, purchaseOrders: true } },
        },
      }),
      prisma.organ.count({ where }),
    ]);

    return {
      success: true,
      data: orgaos,
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

    const orgao = await prisma.organ.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, acronym: true } },
        children: { select: { id: true, name: true, acronym: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    if (!orgao) throw AppError.notFound('ORGAO_NOT_FOUND', 'Órgão não encontrado');

    return { success: true, data: { orgao } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('orgao:create')] }, async (request, reply) => {
    const body = z.object({
      code: z.string().max(20).optional(),
      name: z.string().min(2).max(200),
      acronym: z.string().max(10).optional(),
      type: OrganType,
      parentId: z.string().uuid().optional(),
      budgetCode: z.string().max(50).optional(),
      managerId: z.string().uuid().optional(),
      address: z.string().max(500).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    if (body.code) {
      const existing = await prisma.organ.findFirst({ where: { code: body.code, tenantId, deletedAt: null } });
      if (existing) throw AppError.conflict('CODE_EXISTS', 'Código já cadastrado');
    }

    if (body.parentId) {
      const parent = await prisma.organ.findFirst({ where: { id: body.parentId, tenantId, deletedAt: null } });
      if (!parent) throw AppError.notFound('PARENT_NOT_FOUND', 'Órgão pai não encontrado');
    }

    if (body.managerId) {
      const manager = await prisma.user.findFirst({ where: { id: body.managerId, tenantId, deletedAt: null } });
      if (!manager) throw AppError.notFound('MANAGER_NOT_FOUND', 'Gestor não encontrado');
    }

    const orgao = await prisma.organ.create({
      data: {
        ...body,
        tenantId,
      },
      include: {
        parent: { select: { id: true, name: true, acronym: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { orgao } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('orgao:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      code: z.string().max(20).optional(),
      name: z.string().min(2).max(200).optional(),
      acronym: z.string().max(10).optional(),
      type: OrganType.optional(),
      parentId: z.string().uuid().nullable().optional(),
      budgetCode: z.string().max(50).optional(),
      managerId: z.string().uuid().nullable().optional(),
      address: z.string().max(500).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      isActive: z.boolean().optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const orgao = await prisma.organ.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!orgao) throw AppError.notFound('ORGAO_NOT_FOUND', 'Órgão não encontrado');

    if (body.code && body.code !== orgao.code) {
      const existing = await prisma.organ.findFirst({ where: { code: body.code, tenantId, deletedAt: null, NOT: { id } } });
      if (existing) throw AppError.conflict('CODE_EXISTS', 'Código já cadastrado');
    }

    if (body.parentId) {
      const parent = await prisma.organ.findFirst({ where: { id: body.parentId, tenantId, deletedAt: null } });
      if (!parent) throw AppError.notFound('PARENT_NOT_FOUND', 'Órgão pai não encontrado');
      if (parent.id === id) throw AppError.badRequest('INVALID_PARENT', 'Órgão não pode ser pai de si mesmo');
    }

    if (body.managerId) {
      const manager = await prisma.user.findFirst({ where: { id: body.managerId, tenantId, deletedAt: null } });
      if (!manager) throw AppError.notFound('MANAGER_NOT_FOUND', 'Gestor não encontrado');
    }

    const updated = await prisma.organ.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { orgao: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('orgao:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const orgao = await prisma.organ.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!orgao) throw AppError.notFound('ORGAO_NOT_FOUND', 'Órgão não encontrado');

    const children = await prisma.organ.findMany({ where: { parentId: id, deletedAt: null } });
    if (children.length > 0) {
      throw AppError.badRequest('HAS_CHILDREN', 'Não é possível excluir órgão com sub-órgãos');
    }

    await prisma.organ.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Órgão removido com sucesso' } };
  });
}