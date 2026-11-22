// =============================================================================
// BUY-FLOW BACKEND - Configuration (Zod validated env)
// =============================================================================

import { z } from 'zod';

const EnvSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('Buy-Flow'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:4000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64).optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  // Multi-tenancy
  TENANT_DOMAIN: z.string().default('localhost'),
  TENANT_SUBDOMAIN_ENABLED: z.coerce.boolean().default(false),

  // Email
  EMAIL_PROVIDER: z.enum(['resend', 'smtp', 'console']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  EMAIL_FROM: z.string().default('Buy-Flow <noreply@buyflow.app>'),
  EMAIL_REPLY_TO: z.string().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(['minio', 's3', 'r2', 'supabase']).default('minio'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('buy-flow'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),

  // PNCP
  PNCP_BASE_URL: z.string().url().default('https://pncp.gov.br/api'),
  PNCP_CLIENT_ID: z.string().optional(),
  PNCP_CLIENT_SECRET: z.string().optional(),
  PNCP_WEBHOOK_SECRET: z.string().optional(),

  // Gov.br
  GOVBR_CLIENT_ID: z.string().optional(),
  GOVBR_CLIENT_SECRET: z.string().optional(),
  GOVBR_REDIRECT_URI: z.string().url().optional(),
  GOVBR_SCOPE: z.string().default('openid email phone cpf cnpj'),
  GOVBR_DISCOVERY_URL: z.string().url().default('https://sso.acesso.gov.br/.well-known/openid-configuration'),

  // TCE
  TCE_WEBSERVICE_URL: z.string().url().optional(),
  TCE_CERT_PATH: z.string().optional(),
  TCE_CERT_PASSWORD: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('debug'),
  LOG_PRETTY: z.coerce.boolean().default(true),

  // Features
  FEATURE_PWA_ENABLED: z.coerce.boolean().default(true),
  FEATURE_REALTIME_ENABLED: z.coerce.boolean().default(true),
  FEATURE_AI_ASSISTANT_ENABLED: z.coerce.boolean().default(true),
  FEATURE_DOC_GENERATION_ENABLED: z.coerce.boolean().default(true),
  FEATURE_PNCP_SYNC_ENABLED: z.coerce.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Upload
  MAX_FILE_SIZE: z.coerce.number().default(52428800),
  ALLOWED_MIME_TYPES: z.string().default('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
});

export type Env = z.infer<typeof EnvSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export const env = getEnv();

// Helper para verificar ambiente
export const isDev = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
export const isProd = env.NODE_ENV === 'production';