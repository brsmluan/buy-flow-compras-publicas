// =============================================================================
// BUY-FLOW BACKEND - Ata Routes (Ata de Registro de Preços)
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/middleware/error';
import { authorize, requirePermission, requireTenantAccess } from '@/middleware/auth';
import {
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators';

export async function ataRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { number: { contains: query.search } },
      ];
    }

    const [atas, total] = await Promise.all([
      prisma.ata.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          items: { include: { supplier: { select: { id: true, name: true, tradeName: true } } } },
          bidding: { select: { id: true, number: true, year: true, modality: true } },
        },
      }),
      prisma.ata.count({ where }),
    ]);

    return {
      success: true,
      data: atas,
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

    const ata = await prisma.ata.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: { include: { supplier: { select: { id: true, name: true, tradeName: true, email: true, phone: true } } } },
        bidding: { select: { id: true, number: true, year: true, modality: true } },
      },
    });

    if (!ata) throw AppError.notFound('ATA_NOT_FOUND', 'Ata não encontrada');

    return { success: true, data: { ata } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('ata:create')] }, async (request, reply) => {
    const body = z.object({
      number: z.string().max(50),
      year: z.number().int().min(2020).max(2099),
      biddingId: z.string().uuid(),
      validityStart: z.string().date(),
      validityEnd: z.string().date(),
      items: z.array(z.object({
        itemId: z.string().uuid(),
        supplierId: z.string().uuid(),
        quantity: z.number().positive().multipleOf(0.001),
        unit: z.string(),
        unitPrice: z.number().positive(),
        totalPrice: z.number().positive(),
      })).min(1),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const bidding = await prisma.bidding.findFirst({ where: { id: body.biddingId, tenantId, deletedAt: null } });
    if (!bidding) throw AppError.notFound('LICITACAO_NOT_FOUND', 'Licitação não encontrada');

    if (bidding.status !== 'homologated') {
      throw AppError.badRequest('INVALID_BIDDING_STATUS', 'Licitação deve estar homologada para gerar Ata');
    }

    const ata = await prisma.ata.create({
      data: {
        ...body,
        tenantId,
        status: 'active',
      },
      include: {
        items: { include: { supplier: { select: { id: true, name: true, tradeName: true } } } },
        bidding: { select: { id: true, number: true, year: true, modality: true } },
      },
    });

    return reply.code(201).send({ success: true, data: { ata } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('ata:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      validityStart: z.string().date().optional(),
      validityEnd: z.string().date().optional(),
      items: z.array(z.object({
        id: z.string().uuid().optional(),
        itemId: z.string().uuid().optional(),
        supplierId: z.string().uuid().optional(),
        quantity: z.number().positive().multipleOf(0.001).optional(),
        unit: z.string().optional(),
        unitPrice: z.number().positive().optional(),
        totalPrice: z.number().positive().optional(),
      })).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const ata = await prisma.ata.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!ata) throw AppError.notFound('ATA_NOT_FOUND', 'Ata não encontrada');

    const updated = await prisma.ata.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { ata: updated } };
  });

  app.post('/:id/manage-items', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('ata:manage_items')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { action, items } = z.object({
      action: z.enum(['add', 'remove', 'update']),
      items: z.array(z.object({
        id: z.string().uuid().optional(),
        itemId: z.string().uuid(),
        supplierId: z.string().uuid(),
        quantity: z.number().positive().multipleOf(0.001),
        unit: z.string(),
        unitPrice: z.number().positive(),
        totalPrice: z.number().positive(),
      })).min(1),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const ata = await prisma.ata.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!ata) throw AppError.notFound('ATA_NOT_FOUND', 'Ata não encontrada');

    if (action === 'add') {
      await prisma.ataItem.createMany({
        data: items.map(item => ({
          ataId: id,
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        })),
      });
    } else if (action === 'remove') {
      await prisma.ataItem.deleteMany({
        where: { id: { in: items.map(i => i.id).filter(Boolean) } },
      });
    } else if (action === 'update') {
      for (const item of items) {
        if (item.id) {
          await prisma.ataItem.update({
            where: { id: item.id },
            data: {
              supplierId: item.supplierId,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            },
          });
        }
      }
    }

    const updated = await prisma.ata.findUnique({ where: { id }, include: { items: { include: { supplier: true } } } });

    return { success: true, data: { ata: updated } };
  });

  app.post('/:id/renew', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('ata:renew')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { newValidityEnd } = z.object({ newValidityEnd: z.string().date() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const ata = await prisma.ata.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!ata) throw AppError.notFound('ATA_NOT_FOUND', 'Ata não encontrada');

    const updated = await prisma.ata.update({
      where: { id },
      data: { validityEnd: newValidityEnd },
    });

    return { success: true, data: { ata: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('ata:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const ata = await prisma.ata.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!ata) throw AppError.notFound('ATA_NOT_FOUND', 'Ata não encontrada');

    await prisma.ata.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Ata removida com sucesso' } };
  });
}