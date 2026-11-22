// =============================================================================
// BUY-FLOW BACKEND - Item Routes (Catálogo CATMAT/CATSER)
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

export async function itemRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [itens, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          category: { select: { id: true, code: true, name: true } },
        },
      }),
      prisma.item.count({ where }),
    ]);

    return {
      success: true,
      data: itens,
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

    const item = await prisma.item.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        category: { select: { id: true, code: true, name: true } },
      },
    });

    if (!item) throw AppError.notFound('ITEM_NOT_FOUND', 'Item não encontrado');

    return { success: true, data: { item } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('item:create')] }, async (request, reply) => {
    const body = z.object({
      categoryId: z.string().uuid(),
      code: z.string().max(50),
      name: z.string().min(2).max(300),
      description: z.string().max(5000).optional(),
      unit: z.string().max(20),
      specifications: z.string().max(10000).optional(),
      referencePrice: z.number().positive().optional(),
      isActive: z.boolean().default(true),
      tags: z.array(z.string()).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const category = await prisma.itemCategory.findFirst({ where: { id: body.categoryId, tenantId, deletedAt: null } });
    if (!category) throw AppError.notFound('CATEGORY_NOT_FOUND', 'Categoria não encontrada');

    const existing = await prisma.item.findFirst({ where: { code: body.code, tenantId, deletedAt: null } });
    if (existing) throw AppError.conflict('CODE_EXISTS', 'Código já cadastrado');

    const item = await prisma.item.create({
      data: {
        ...body,
        tenantId,
      },
      include: {
        category: { select: { id: true, code: true, name: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { item } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('item:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      categoryId: z.string().uuid().optional(),
      code: z.string().max(50).optional(),
      name: z.string().min(2).max(300).optional(),
      description: z.string().max(5000).optional(),
      unit: z.string().max(20).optional(),
      specifications: z.string().max(10000).optional(),
      referencePrice: z.number().positive().optional(),
      isActive: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const item = await prisma.item.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!item) throw AppError.notFound('ITEM_NOT_FOUND', 'Item não encontrado');

    if (body.code && body.code !== item.code) {
      const existing = await prisma.item.findFirst({ where: { code: body.code, tenantId, deletedAt: null, NOT: { id } } });
      if (existing) throw AppError.conflict('CODE_EXISTS', 'Código já cadastrado');
    }

    if (body.categoryId) {
      const category = await prisma.itemCategory.findFirst({ where: { id: body.categoryId, tenantId, deletedAt: null } });
      if (!category) throw AppError.notFound('CATEGORY_NOT_FOUND', 'Categoria não encontrada');
    }

    const updated = await prisma.item.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { item: updated } };
  });

  app.post('/:id/toggle-status', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('item:toggle')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const item = await prisma.item.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!item) throw AppError.notFound('ITEM_NOT_FOUND', 'Item não encontrado');

    const updated = await prisma.item.update({
      where: { id },
      data: { isActive: !item.isActive },
    });

    return { success: true, data: { item: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('item:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const item = await prisma.item.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!item) throw AppError.notFound('ITEM_NOT_FOUND', 'Item não encontrado');

    await prisma.item.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Item removido com sucesso' } };
  });
}