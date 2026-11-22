// =============================================================================
// BUY-FLOW BACKEND - Tenant Routes (Platform Owner/Admin only)
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { cache } from '../../lib/redis.js';
import { AppError } from '../../middleware/error.js';
import { authorize } from '../../middleware/auth.js';
import {
  CreateTenantSchema,
  UpdateTenantSchema,
  UuidParamSchema,
  ListQuerySchema,
} from '@buy-flow/shared/validators/index.js';
import { ROLE_DEFAULT_PERMISSIONS } from '@buy-flow/shared/constants/index.js';

export async function tenantRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authorize('platform_owner', 'platform_admin'));

  app.get('/', async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);

    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { cnpj: { contains: query.search } },
      ];
    }

    if (query.status) where.status = query.status;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true, name: true, slug: true, cnpj: true, state: true, city: true,
          status: true, plan: true, customDomain: true, logoUrl: true, primaryColor: true,
          createdAt: true, updatedAt: true,
          _count: { select: { users: true, dfds: true, contracts: true, suppliers: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      success: true,
      data: tenants,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page < Math.ceil(total / query.limit),
        hasPrev: query.page > 1,
      },
    };
  });

  app.get('/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, email: true, name: true, role: true, status: true } },
        _count: {
          select: {
            dfds: true, etps: true, biddings: true, contracts: true,
            purchaseOrders: true, suppliers: true, items: true, organs: true,
          },
        },
      },
    });

    if (!tenant) throw AppError.notFound('TENANT_NOT_FOUND', 'Prefeitura não encontrada');

    return { success: true, data: { tenant } };
  });

  app.post('/', async (request, reply) => {
    const body = CreateTenantSchema.parse(request.body);

    const existingCnpj = await prisma.tenant.findUnique({ where: { cnpj: body.cnpj } });
    if (existingCnpj) throw AppError.conflict('CNPJ_EXISTS', 'CNPJ já cadastrado');

    const existingSlug = await prisma.tenant.findUnique({ where: { slug: body.slug } });
    if (existingSlug) throw AppError.conflict('SLUG_EXISTS', 'Slug já em uso');

    const tenant = await prisma.tenant.create({
      data: {
        ...body,
        settings: {
          ...body.settings,
          legalValuesVersion: '2024.1',
          allowSupplierPortal: true,
          requireTwoFactor: false,
        },
      },
    });

    const adminEmail = `admin@${body.slug}.buyflow.app`;
    const tempPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: `Administrador ${body.name}`,
        role: 'tenant_admin',
        status: 'active',
        tenantId: tenant.id,
        permissions: ROLE_DEFAULT_PERMISSIONS.tenant_admin,
        passwordChangedAt: new Date(),
      },
    });

    return reply.code(201).send({
      success: true,
      data: { tenant, adminCredentials: { email: adminEmail, temporaryPassword: tempPassword } },
    });
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = UpdateTenantSchema.parse(request.body);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw AppError.notFound('TENANT_NOT_FOUND', 'Prefeitura não encontrada');

    if (body.cnpj && body.cnpj !== tenant.cnpj) {
      const existing = await prisma.tenant.findUnique({ where: { cnpj: body.cnpj } });
      if (existing) throw AppError.conflict('CNPJ_EXISTS', 'CNPJ já cadastrado');
    }

    if (body.slug && body.slug !== tenant.slug) {
      const existing = await prisma.tenant.findUnique({ where: { slug: body.slug } });
      if (existing) throw AppError.conflict('SLUG_EXISTS', 'Slug já em uso');
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: body,
    });

    await cache.del(`tenant:${id}`);

    return { success: true, data: { tenant: updated } };
  });

  app.post('/:id/suspend', async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { reason } = z.object({ reason: z.string().max(500) }).parse(request.body);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw AppError.notFound('TENANT_NOT_FOUND', 'Prefeitura não encontrada');

    if (tenant.status === 'suspended') {
      throw AppError.badRequest('ALREADY_SUSPENDED', 'Tenant já suspenso');
    }

    await prisma.tenant.update({
      where: { id },
      data: { status: 'suspended', settings: { ...tenant.settings, suspensionReason: reason } },
    });

    await prisma.refreshToken.updateMany({
      where: { user: { tenantId: id } },
      data: { revokedAt: new Date() },
    });

    return { success: true, data: { message: 'Tenant suspenso com sucesso' } };
  });

  app.post('/:id/activate', async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw AppError.notFound('TENANT_NOT_FOUND', 'Prefeitura não encontrada');

    await prisma.tenant.update({
      where: { id },
      data: { status: 'active', settings: { ...tenant.settings, suspensionReason: null } },
    });

    return { success: true, data: { message: 'Tenant reativado com sucesso' } };
  });

  app.get('/:id/stats', async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);

    const [
      usersCount, dfdsCount, biddingsCount, contractsCount,
      purchaseOrdersCount, suppliersCount, totalContractValue,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId: id, deletedAt: null } }),
      prisma.dfd.count({ where: { tenantId: id, deletedAt: null } }),
      prisma.bidding.count({ where: { tenantId: id, deletedAt: null } }),
      prisma.contract.count({ where: { tenantId: id, deletedAt: null } }),
      prisma.purchaseOrder.count({ where: { tenantId: id, deletedAt: null } }),
      prisma.supplier.count({ where: { tenantId: id, deletedAt: null } }),
      prisma.contract.aggregate({
        where: { tenantId: id, deletedAt: null, status: 'active' },
        _sum: { totalValue: true },
      }),
    ]);

    const contractsByStatus = await prisma.contract.groupBy({
      by: ['status'],
      where: { tenantId: id, deletedAt: null },
      _count: true,
    });

    const biddingsByModality = await prisma.bidding.groupBy({
      by: ['modality'],
      where: { tenantId: id, deletedAt: null },
      _count: true,
    });

    return {
      success: true,
      data: {
        users: usersCount,
        dfds: dfdsCount,
        biddings: biddingsCount,
        contracts: contractsCount,
        purchaseOrders: purchaseOrdersCount,
        suppliers: suppliersCount,
        totalContractValue: totalContractValue._sum.totalValue || 0,
        contractsByStatus: contractsByStatus.reduce((acc, c) => ({ ...acc, [c.status]: c._count }), {}),
        biddingsByModality: biddingsByModality.reduce((acc, b) => ({ ...acc, [b.modality]: b._count }), {}),
      },
    };
  });
}