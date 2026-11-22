// =============================================================================
// BUY-FLOW BACKEND - User Routes (Tenant Admin+)
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { cache } from '../../lib/redis.js';
import { AppError } from '../../middleware/error.js';
import { authorize, requireTenantAccess } from '../../middleware/auth.js';
import {
  CreateUserByAdminSchema,
  UpdateUserSchema,
  UuidParamSchema,
  ListQuerySchema,
  ChangePasswordSchema,
} from '@buy-flow/shared/validators/index.js';
import { ROLE_DEFAULT_PERMISSIONS } from '@buy-flow/shared/constants/index.js';

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager') }, async (request, reply) => {
    const query = ListQuerySchema.parse(request.query);
    const tenantId = request.user!.tenantId!;

    const where: any = { tenantId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true, email: true, name: true, cpf: true, phone: true,
          avatarUrl: true, role: true, status: true, permissions: true,
          lastLoginAt: true, twoFactorEnabled: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      meta: {
        page: query.page, limit: query.limit, total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page < Math.ceil(total / query.limit),
        hasPrev: query.page > 1,
      },
    };
  });

  app.get('/:id', { preHandler: authorize('tenant_admin', 'tenant_manager') }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const user = await prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true, email: true, name: true, cpf: true, phone: true,
        avatarUrl: true, role: true, status: true, permissions: true,
        lastLoginAt: true, passwordChangedAt: true, twoFactorEnabled: true,
        tenantId: true, createdAt: true, updatedAt: true,
      },
    });

    if (!user) throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');

    return { success: true, data: { user } };
  });

  app.post('/', { preHandler: authorize('tenant_admin') }, async (request, reply) => {
    const body = CreateUserByAdminSchema.parse(request.body);
    const tenantId = request.user!.tenantId!;

    const existing = await prisma.user.findFirst({
      where: { email: body.email, tenantId, deletedAt: null },
    });
    if (existing) throw AppError.conflict('EMAIL_EXISTS', 'Email já cadastrado neste tenant');

    if (body.cpf) {
      const existingCpf = await prisma.user.findFirst({
        where: { cpf: body.cpf, tenantId, deletedAt: null },
      });
      if (existingCpf) throw AppError.conflict('CPF_EXISTS', 'CPF já cadastrado');
    }

    const tempPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        ...body,
        passwordHash,
        tenantId,
        status: 'active',
        permissions: body.permissions?.length ? body.permissions : ROLE_DEFAULT_PERMISSIONS[body.role] || [],
        passwordChangedAt: new Date(),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return reply.code(201).send({
      success: true,
      data: { user, temporaryPassword: tempPassword },
    });
  });

  app.patch('/:id', { preHandler: authorize('tenant_admin') }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const body = UpdateUserSchema.parse(request.body);
    const tenantId = request.user!.tenantId!;

    const user = await prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!user) throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');

    if (body.role && body.role !== user.role && request.user!.sub === id) {
      throw AppError.forbidden('CANNOT_CHANGE_OWN_ROLE', 'Não pode alterar seu próprio role');
    }

    if (body.email && body.email !== user.email) {
      const existing = await prisma.user.findFirst({
        where: { email: body.email, tenantId, deletedAt: null, NOT: { id } },
      });
      if (existing) throw AppError.conflict('EMAIL_EXISTS', 'Email já em uso');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { ...body, permissions: body.permissions ?? user.permissions },
      select: { id: true, email: true, name: true, role: true, status: true, permissions: true },
    });

    await cache.del(`user:${id}`);

    return { success: true, data: { user: updated } };
  });

  app.post('/:id/status', { preHandler: authorize('tenant_admin') }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const { status } = z.object({ status: z.enum(['active', 'inactive', 'blocked']) }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const user = await prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!user) throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');

    if (request.user!.sub === id && status !== 'active') {
      throw AppError.forbidden('CANNOT_DEACTIVATE_SELF', 'Não pode desativar a si mesmo');
    }

    await prisma.user.update({ where: { id }, data: { status } });

    if (status !== 'active') {
      await prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() },
      });
    }

    await cache.del(`user:${id}`);

    return { success: true, data: { message: `Usuário ${status === 'active' ? 'ativado' : status === 'inactive' ? 'inativado' : 'bloqueado'}` } };
  });

  app.post('/:id/reset-password', { preHandler: authorize('tenant_admin') }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const user = await prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!user) throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');

    const tempPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revokedAt: new Date() },
    });

    await cache.del(`user:${id}`);

    return { success: true, data: { temporaryPassword: tempPassword } };
  });

  app.post('/me/password', async (request, reply) => {
    if (!request.user) throw AppError.unauthorized('UNAUTHORIZED', 'Não autenticado');

    const body = ChangePasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user || !user.passwordHash) throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');

    const isValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!isValid) throw AppError.badRequest('INVALID_PASSWORD', 'Senha atual incorreta');

    const passwordHash = await bcrypt.hash(body.newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });

    await cache.del(`user:${user.id}`);

    return { success: true, data: { message: 'Senha alterada com sucesso' } };
  });

  app.delete('/:id', { preHandler: authorize('tenant_admin') }, async (request, reply) => {
    const { id } = UuidParamSchema.parse(request.params);
    const tenantId = request.user!.tenantId!;

    const user = await prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!user) throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');

    if (request.user!.sub === id) {
      throw AppError.forbidden('CANNOT_DELETE_SELF', 'Não pode excluir a si mesmo');
    }

    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { revokedAt: new Date() },
    });
    await cache.del(`user:${id}`);

    return { success: true, data: { message: 'Usuário removido com sucesso' } };
  });
}