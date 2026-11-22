// =============================================================================
// BUY-FLOW BACKEND - Authentication Middleware
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, extractTokenFromHeader } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { cache } from '../lib/redis.js';
import { env } from '../config/index.js';
import type { UserRole, TokenPayload } from '@buy-flow/shared/types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
    tenantId?: string;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) {
    return reply.code(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token de acesso não fornecido' },
    });
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    return reply.code(401).send({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' },
    });
  }

  // Verificar se usuário ainda existe e está ativo
  const cacheKey = `user:${payload.sub}`;
  let user = await cache.get<{ status: UserRole; tenantId: string | null }>(cacheKey);

  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { status: true, tenantId: true, role: true, permissions: true },
    });

    if (user) {
      await cache.set(cacheKey, user, 300);
    }
  }

  if (!user || user.status !== 'active') {
    return reply.code(401).send({
      success: false,
      error: { code: 'USER_INACTIVE', message: 'Usuário inativo ou não encontrado' },
    });
  }

  request.user = {
    sub: payload.sub,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role as UserRole,
    permissions: payload.permissions,
    type: 'access',
    iat: payload.iat,
    exp: payload.exp,
  };

  request.tenantId = payload.tenantId;
}

export function authorize(...allowedRoles: UserRole[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Não autenticado' },
      });
    }

    const userRole = request.user.role;

    if (['platform_owner', 'platform_admin'].includes(userRole)) {
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Permissão insuficiente para esta ação' },
      });
    }
  };
}

export function requirePermission(permission: string) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Não autenticado' },
      });
    }

    const userRole = request.user.role;

    if (['platform_owner', 'platform_admin'].includes(userRole)) {
      return;
    }

    const hasPermission = request.user.permissions.includes(permission);

    if (!hasPermission) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: `Permissão necessária: ${permission}` },
      });
    }
  };
}

export function requireTenantAccess() {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Não autenticado' },
      });
    }

    if (['platform_owner', 'platform_admin'].includes(request.user.role)) {
      return;
    }

    const resourceTenantId = (request.params as any)?.tenantId ||
                             (request.body as any)?.tenantId ||
                             (request.query as any)?.tenantId;

    if (resourceTenantId && resourceTenantId !== request.user.tenantId) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Acesso negado a este tenant' },
      });
    }
  };
}

export async function optionalAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractTokenFromHeader(request.headers.authorization);

  if (!token) return;

  const payload = await verifyAccessToken(token);
  if (!payload) return;

  request.user = {
    sub: payload.sub,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role as UserRole,
    permissions: payload.permissions,
    type: 'access',
    iat: payload.iat,
    exp: payload.exp,
  };

  request.tenantId = payload.tenantId;
}

export function userRateLimit(maxRequests: number = 60, windowMs: number = 60000) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) return;

    const key = `ratelimit:user:${request.user.sub}`;
    const client = await cache.get<{ count: number; resetAt: number }>(key);

    const now = Date.now();

    if (!client || now > client.resetAt) {
      await cache.set(key, { count: 1, resetAt: now + windowMs }, Math.ceil(windowMs / 1000));
      return;
    }

    if (client.count >= maxRequests) {
      return reply.code(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Muitas requisições, tente novamente mais tarde' },
      });
    }

    client.count++;
    await cache.set(key, client, Math.ceil((client.resetAt - now) / 1000));
  };
}