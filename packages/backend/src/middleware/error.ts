// =============================================================================
// BUY-FLOW BACKEND - Error Handling Middleware
// =============================================================================

import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { env, isDev } from '../config/index';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 401, details);
  }

  static forbidden(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 403, details);
  }

  static notFound(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 404, details);
  }

  static conflict(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 409, details);
  }

  static internal(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 500, details);
  }

  static tooManyRequests(code: string, message: string, details?: Record<string, unknown>) {
    return new AppError(code, message, 429, details);
  }
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  request.log.error({ err: error, url: request.url, method: request.method }, 'Request error');

  // Zod validation errors
  if (error instanceof ZodError) {
    reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados de entrada inválidos',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      },
    });
    return;
  }

  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = ((error as any).meta?.target as string[])?.join(', ') || 'campo';
        reply.code(409).send({
          success: false,
          error: {
            code: 'UNIQUE_CONSTRAINT',
            message: `Já existe um registro com este ${target}`,
            details: { field: target },
          },
        });
        return;
      }
      case 'P2003':
        reply.code(400).send({
          success: false,
          error: {
            code: 'FOREIGN_KEY_CONSTRAINT',
            message: 'Referência inválida: registro relacionado não encontrado',
          },
        });
        return;
      case 'P2025':
        reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Registro não encontrado',
          },
        });
        return;
      default:
        reply.code(500).send({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Erro no banco de dados',
            details: isDev ? { prismaCode: error.code } : undefined,
          },
        });
        return;
    }
  }

  if (error instanceof PrismaClientValidationError) {
    reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos para operação no banco',
      },
    });
    return;
  }

  // AppError (nossos erros controlados)
  if (error instanceof AppError) {
    reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Fastify validation errors
  if (error.validation) {
    reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados de entrada inválidos',
        details: error.validation.map(v => ({
          field: v.instancePath.replace('/', '') || v.schemaPath,
          message: v.message,
        })),
      },
    });
    return;
  }

  // Erro genérico não tratado
  const statusCode = error.statusCode || 500;
  const message = isDev ? error.message : 'Erro interno do servidor';

  reply.code(statusCode).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      details: isDev ? { stack: error.stack } : undefined,
    },
  });
}

// Handler para rotas não encontradas
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  reply.code(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Rota ${request.method} ${request.url} não encontrada`,
    },
  });
}