// =============================================================================
// BUY-FLOW BACKEND - Configuração Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { AppError } from '../../../middleware/error.js';
import { authorize, requirePermission, requireTenantAccess } from '../../../middleware/auth.js';
import {
  UuidParamSchema,
} from '@buy-flow/shared/validators/index.js';

export async function configRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireTenantAccess());

  app.get('/', { preHandler: authorize('tenant_admin', 'tenant_manager') }, async (request, reply) => {
    const tenantId = request.user!.tenantId!;

    const configs = await prisma.systemConfig.findMany({
      where: { tenantId },
      orderBy: { key: 'asc' },
    });

    return { success: true, data: configs };
  });

  app.get('/:key', { preHandler: authorize('tenant_admin', 'tenant_manager') }, async (request, reply) => {
    const { key } = z.object({ key: z.string().max(100) }).parse(request.params);
    const tenantId = request.user!.tenantId!;

    const config = await prisma.systemConfig.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });

    if (!config) throw AppError.notFound('CONFIG_NOT_FOUND', 'Configuração não encontrada');

    return { success: true, data: { config } };
  });

  app.put('/:key', { preHandler: [authorize('tenant_admin'), requirePermission('config:update')] }, async (request, reply) => {
    const { key } = z.object({ key: z.string().max(100) }).parse(request.params);
    const { value } = z.object({ value: z.unknown() }).parse(request.body);
    const tenantId = request.user!.tenantId!;

    const config = await prisma.systemConfig.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value },
      create: { tenantId, key, value },
    });

    return { success: true, data: { config } };
  });

  app.delete('/:key', { preHandler: [authorize('tenant_admin'), requirePermission('config:delete')] }, async (request, reply) => {
    const { key } = z.object({ key: z.string().max(100) }).parse(request.params);
    const tenantId = request.user!.tenantId!;

    await prisma.systemConfig.delete({
      where: { tenantId_key: { tenantId, key } },
    });

    return { success: true, data: { message: 'Configuração removida com sucesso' } };
  });
}