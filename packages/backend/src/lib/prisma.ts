// =============================================================================
// BUY-FLOW BACKEND - Prisma Client Singleton
// =============================================================================

import { PrismaClient } from '@prisma/client';
import { env } from '../config/index.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.isDev
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
  errorFormat: 'pretty',
});

if (env.isDev) globalForPrisma.prisma = prisma;

// Middleware para soft delete automático
prisma.$use(async (params, next) => {
  // Soft delete para models com deletedAt
  if (params.action === 'delete') {
    params.action = 'update';
    params.args['data'] = { deletedAt: new Date() };
  }

  // Soft delete para deleteMany
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data['deletedAt'] = new Date();
    } else {
      params.args['data'] = { deletedAt: new Date() };
    }
  }

  // Adicionar filtro deletedAt null em queries de leitura
  if (
    ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)
  ) {
    if (params.args.where) {
      params.args.where.deletedAt = null;
    } else {
      params.args.where = { deletedAt: null };
    }
  }

  return next(params);
});

export default prisma;