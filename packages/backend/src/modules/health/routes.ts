// =============================================================================
// BUY-FLOW BACKEND - Health Check Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { getRedisClient } from '../../lib/redis.js';
import { env } from '../../config/index.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    return {
      success: true,
      data: {
        status: 'ok',
        service: env.APP_NAME,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
      },
    };
  });

  app.get('/detailed', async (request, reply) => {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
    ]);

    const dbCheck = checks[0];
    const redisCheck = checks[1];

    const allHealthy = checks.every(c => c.status === 'fulfilled' && c.value.healthy);

    return reply.code(allHealthy ? 200 : 503).send({
      success: allHealthy,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        service: env.APP_NAME,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck.status === 'fulfilled' ? dbCheck.value : { healthy: false, error: dbCheck.reason?.message },
          redis: redisCheck.status === 'fulfilled' ? redisCheck.value : { healthy: false, error: redisCheck.reason?.message },
        },
      },
    });
  });

  app.get('/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const redis = await getRedisClient();
      await redis.ping();
      return { success: true, data: { ready: true } };
    } catch {
      return reply.code(503).send({ success: false, data: { ready: false } });
    }
  });

  app.get('/live', async (request, reply) => {
    return { success: true, data: { alive: true } };
  });
}

async function checkDatabase() {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return { healthy: true, latency: Date.now() - start };
}

async function checkRedis() {
  const start = Date.now();
  const redis = await getRedisClient();
  await redis.ping();
  return { healthy: true, latency: Date.now() - start };
}