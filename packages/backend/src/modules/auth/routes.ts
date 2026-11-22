// =============================================================================
// BUY-FLOW BACKEND - Auth Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { env } from '../../config/index.js';
import { cache } from '../../lib/redis.js';
import { AppError } from '../../middleware/error.js';
import {
  LoginSchema,
  CreateUserSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  SetupTwoFactorSchema,
  VerifyTwoFactorSchema,
} from '@buy-flow/shared/validators/index.js';
import type { UserRole } from '@buy-flow/shared/types/index.js';

export async function authRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  app.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { tenant: { select: { id: true, name: true, slug: true, status: true, plan: true } } },
    });

    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Email ou senha inválidos');
    }

    if (user.status !== 'active') {
      throw AppError.unauthorized('USER_INACTIVE', 'Usuário inativo ou pendente de aprovação');
    }

    if (user.tenant && user.tenant.status !== 'active') {
      throw AppError.unauthorized('TENANT_INACTIVE', 'Tenant inativo ou suspenso');
    }

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Email ou senha inválidos');
    }

    // 2FA
    if (user.twoFactorEnabled) {
      if (!body.twoFactorCode) {
        return reply.code(200).send({
          success: true,
          data: { requiresTwoFactor: true, message: 'Código 2FA necessário' },
        });
      }

      // TODO: Implementar validação TOTP real com otplib
      // Por enquanto, usa código fixo apenas para desenvolvimento
      const isValid2FA = env.NODE_ENV === 'development' && body.twoFactorCode === '123456';
      if (!isValid2FA) {
        throw AppError.unauthorized('INVALID_2FA', 'Código 2FA inválido');
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await cache.set(`user:${user.id}`, {
      status: user.status,
      tenantId: user.tenantId,
      role: user.role,
      permissions: user.permissions,
    }, 300);

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return {
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenant: user.tenant,
          permissions: user.permissions,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      },
    };
  });

  // ---------------------------------------------------------------------------
  // REFRESH TOKEN
  // ---------------------------------------------------------------------------
  app.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken || request.body.refreshToken;

    if (!refreshToken) {
      throw AppError.unauthorized('MISSING_REFRESH_TOKEN', 'Refresh token não fornecido');
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      throw AppError.unauthorized('INVALID_REFRESH_TOKEN', 'Refresh token inválido ou expirado');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw AppError.unauthorized('REVOKED_REFRESH_TOKEN', 'Refresh token revogado ou expirado');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tenantId: true, status: true, permissions: true },
    });

    if (!user || user.status !== 'active') {
      throw AppError.unauthorized('USER_INACTIVE', 'Usuário inativo');
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const newAccessToken = await signAccessToken(newTokenPayload);
    const newRefreshToken = await signRefreshToken(newTokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    reply.setCookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return { success: true, data: { accessToken: newAccessToken } };
  });

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------
  app.post('/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken || request.body.refreshToken;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }

    reply.clearCookie('refreshToken', { path: '/' });

    if (request.user) {
      await cache.del(`user:${request.user.sub}`);
    }

    return { success: true, data: { message: 'Logout realizado com sucesso' } };
  });

  // ---------------------------------------------------------------------------
  // ME (usuário atual)
  // ---------------------------------------------------------------------------
  app.get('/me', async (request, reply) => {
    if (!request.user) {
      throw AppError.unauthorized('UNAUTHORIZED', 'Não autenticado');
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true, email: true, name: true, cpf: true, phone: true,
        avatarUrl: true, role: true, status: true, permissions: true,
        tenantId: true, lastLoginAt: true, twoFactorEnabled: true,
        tenant: { select: { id: true, name: true, slug: true, status: true, plan: true } },
        createdAt: true,
      },
    });

    if (!user) {
      throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');
    }

    return { success: true, data: { user } };
  });

  // ---------------------------------------------------------------------------
  // REGISTER (Primeiro usuário - Platform Owner)
  // ---------------------------------------------------------------------------
  app.post('/register', async (request, reply) => {
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' },
    });

    if (existingOwner) {
      throw AppError.forbidden('OWNER_EXISTS', 'Platform owner já cadastrado');
    }

    const body = CreateUserSchema.parse(request.body);

    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        cpf: body.cpf,
        phone: body.phone,
        role: 'platform_owner',
        status: 'active',
        tenantId: null,
        permissions: ['*'],
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Buy-Flow Platform',
        slug: 'platform',
        cnpj: '00000000000000',
        state: 'DF',
        city: 'Brasília',
        status: 'active',
        plan: 'enterprise',
        primaryColor: '#1e40af',
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { tenantId: tenant.id },
    });

    return reply.code(201).send({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    });
  });

  // ---------------------------------------------------------------------------
  // FORGOT PASSWORD
  // ---------------------------------------------------------------------------
  app.post('/forgot-password', async (request, reply) => {
    const body = ForgotPasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user) {
      return { success: true, data: { message: 'Se o email existir, instruções serão enviadas' } };
    }

    const resetToken = crypto.randomUUID();
    await cache.set(`reset:${resetToken}`, { userId: user.id }, 3600);

    return { success: true, data: { message: 'Se o email existir, instruções serão enviadas' } };
  });

  // ---------------------------------------------------------------------------
  // RESET PASSWORD
  // ---------------------------------------------------------------------------
  app.post('/reset-password', async (request, reply) => {
    const body = ResetPasswordSchema.parse(request.body);

    const cached = await cache.get<{ userId: string }>(`reset:${body.token}`);
    if (!cached) {
      throw AppError.badRequest('INVALID_TOKEN', 'Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, env.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: cached.userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: cached.userId },
      data: { revokedAt: new Date() },
    });

    await cache.del(`reset:${body.token}`);

    return { success: true, data: { message: 'Senha alterada com sucesso' } };
  });

  // ---------------------------------------------------------------------------
  // CHANGE PASSWORD (autenticado)
  // ---------------------------------------------------------------------------
  app.post('/change-password', async (request, reply) => {
    if (!request.user) throw AppError.unauthorized('UNAUTHORIZED', 'Não autenticado');

    const body = ChangePasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user || !user.passwordHash) {
      throw AppError.notFound('USER_NOT_FOUND', 'Usuário não encontrado');
    }

    const isValid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.badRequest('INVALID_PASSWORD', 'Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, env.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    });

    return { success: true, data: { message: 'Senha alterada com sucesso' } };
  });

  // ---------------------------------------------------------------------------
  // 2FA SETUP
  // ---------------------------------------------------------------------------
  app.post('/2fa/setup', async (request, reply) => {
    if (!request.user) throw AppError.unauthorized('UNAUTHORIZED', 'Não autenticado');

    const secret = authenticator.generateSecret();

    await prisma.user.update({
      where: { id: request.user.sub },
      data: { twoFactorSecret: secret },
    });

    const otpauthUrl = authenticator.keyuri(request.user.email, env.APP_NAME, secret);

    return {
      success: true,
      data: { secret, otpauthUrl, message: 'Escaneie o QR code no seu app autenticador' },
    };
  });

  app.post('/2fa/verify', async (request, reply) => {
    if (!request.user) throw AppError.unauthorized('UNAUTHORIZED', 'Não autenticado');

    const body = VerifyTwoFactorSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user?.twoFactorSecret) {
      throw AppError.badRequest('2FA_NOT_SETUP', '2FA não configurado');
    }

    const isValid = authenticator.check(body.code, user.twoFactorSecret);

    if (!isValid) {
      throw AppError.badRequest('INVALID_2FA', 'Código inválido');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return { success: true, data: { message: '2FA ativado com sucesso' } };
  });

  app.post('/2fa/disable', async (request, reply) => {
    if (!request.user) throw AppError.unauthorized('UNAUTHORIZED', 'Não autenticado');

    const body = VerifyTwoFactorSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user?.twoFactorSecret) {
      throw AppError.badRequest('2FA_NOT_ENABLED', '2FA não está ativo');
    }

    const isValid = authenticator.check(body.code, user.twoFactorSecret);
    if (!isValid) {
      throw AppError.badRequest('INVALID_2FA', 'Código inválido');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { success: true, data: { message: '2FA desativado' } };
  });
}