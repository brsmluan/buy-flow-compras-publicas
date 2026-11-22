// =============================================================================
// BUY-FLOW BACKEND - Fornecedor Routes
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
import { SupplierType, SupplierStatus } from '@buy-flow/shared/types/index.js';

export async function supplierRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tradeName: { contains: query.search, mode: 'insensitive' } },
        { cnpjCpf: { contains: query.search } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    const [fornecedores, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: { select: { contracts: true, purchaseOrders: true } },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      success: true,
      data: fornecedores,
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

    const fornecedor = await prisma.supplier.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        categories: { include: { category: { select: { id: true, code: true, name: true } } } },
        _count: { select: { contracts: true, purchaseOrders: true, biddingsDispensa: true, biddingsInexigibilidade: true } },
      },
    });

    if (!fornecedor) throw AppError.notFound('FORNECEDOR_NOT_FOUND', 'Fornecedor não encontrado');

    return { success: true, data: { fornecedor } };
  });

  app.post('/', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('fornecedor:create')] }, async (request, reply) => {
    const body = z.object({
      type: SupplierType,
      name: z.string().min(2).max(200),
      tradeName: z.string().max(200).optional(),
      cnpjCpf: z.string().min(11).max(14),
      stateRegistration: z.string().max(20).optional(),
      municipalRegistration: z.string().max(20).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.object({
        zipCode: z.string().length(8),
        street: z.string().max(200),
        number: z.string().max(20),
        complement: z.string().max(100).optional(),
        neighborhood: z.string().max(100),
        city: z.string().max(100),
        state: z.string().length(2),
      }).optional(),
      categories: z.array(z.string().uuid()).optional(),
      status: SupplierStatus.default('active'),
      habilitationValidUntil: z.string().date().optional(),
      bankAccount: z.object({
        bank: z.string().max(100),
        agency: z.string().max(20),
        account: z.string().max(20),
        type: z.enum(['checking', 'savings']),
        pixKey: z.string().max(100).optional(),
      }).optional(),
      certifications: z.array(z.object({
        name: z.string().min(2).max(200),
        issuer: z.string().min(2).max(200),
        validUntil: z.string().date(),
        fileUrl: z.string().url().optional(),
      })).optional(),
    }).parse(request.body);

    const tenantId = request.user!.tenantId!;

    const existing = await prisma.supplier.findFirst({ where: { cnpjCpf: body.cnpjCpf, tenantId, deletedAt: null } });
    if (existing) throw AppError.conflict('CNPJ_EXISTS', 'CNPJ/CPF já cadastrado');

    const fornecedor = await prisma.supplier.create({
      data: {
        ...body,
        tenantId,
      },
    });

    return reply.code(201).send({ success: true, data: { fornecedor } });
  });

  app.patch('/:id', { preHandler: [authorize('tenant_admin', 'tenant_manager', 'tenant_operator'), requirePermission('fornecedor:update')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = z.object({
      name: z.string().min(2).max(200).optional(),
      tradeName: z.string().max(200).optional(),
      cnpjCpf: z.string().min(11).max(14).optional(),
      stateRegistration: z.string().max(20).optional(),
      municipalRegistration: z.string().max(20).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.object({
        zipCode: z.string().length(8),
        street: z.string().max(200),
        number: z.string().max(20),
        complement: z.string().max(100).optional(),
        neighborhood: z.string().max(100),
        city: z.string().max(100),
        state: z.string().length(2),
      }).optional(),
      categories: z.array(z.string().uuid()).optional(),
      status: SupplierStatus.optional(),
      habilitationValidUntil: z.string().date().optional(),
      bankAccount: z.object({
        bank: z.string().max(100),
        agency: z.string().max(20),
        account: z.string().max(20),
        type: z.enum(['checking', 'savings']),
        pixKey: z.string().max(100).optional(),
      }).optional(),
      certifications: z.array(z.object({
        name: z.string().min(2).max(200),
        issuer: z.string().min(2).max(200),
        validUntil: z.string().date(),
        fileUrl: z.string().url().optional(),
      })).optional(),
    }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const fornecedor = await prisma.supplier.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!fornecedor) throw AppError.notFound('FORNECEDOR_NOT_FOUND', 'Fornecedor não encontrado');

    if (body.cnpjCpf && body.cnpjCpf !== fornecedor.cnpjCpf) {
      const existing = await prisma.supplier.findFirst({ where: { cnpjCpf: body.cnpjCpf, tenantId, deletedAt: null, NOT: { id } } });
      if (existing) throw AppError.conflict('CNPJ_EXISTS', 'CNPJ/CPF já cadastrado');
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: body,
    });

    return { success: true, data: { fornecedor: updated } };
  });

  app.post('/:id/habilitate', { preHandler: [authorize('tenant_admin', 'tenant_manager'), requirePermission('fornecedor:habilitate')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { validUntil } = z.object({ validUntil: z.string().date() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const fornecedor = await prisma.supplier.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!fornecedor) throw AppError.notFound('FORNECEDOR_NOT_FOUND', 'Fornecedor não encontrado');

    const updated = await prisma.supplier.update({
      where: { id },
      data: { habilitationValidUntil: new Date(validUntil), status: 'active' },
    });

    return { success: true, data: { fornecedor: updated } };
  });

  app.post('/:id/block', { preHandler: [authorize('tenant_admin'), requirePermission('fornecedor:block')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { reason } = z.object({ reason: z.string().max(500) }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const fornecedor = await prisma.supplier.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!fornecedor) throw AppError.notFound('FORNECEDOR_NOT_FOUND', 'Fornecedor não encontrado');

    const updated = await prisma.supplier.update({
      where: { id },
      data: { status: 'blocked', settings: { ...fornecedor.settings, blockReason: reason } },
    });

    return { success: true, data: { fornecedor: updated } };
  });

  app.delete('/:id', { preHandler: [authorize('tenant_admin'), requirePermission('fornecedor:delete')] }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const fornecedor = await prisma.supplier.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!fornecedor) throw AppError.notFound('FORNECEDOR_NOT_FOUND', 'Fornecedor não encontrado');

    await prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });

    return { success: true, data: { message: 'Fornecedor removido com sucesso' } };
  });
}