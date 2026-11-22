// =============================================================================
// BUY-FLOW BACKEND - Fastify Application Bootstrap
// =============================================================================

import Fastify, { FastifyInstance } from 'fastify';
import { env } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authenticate, optionalAuthenticate } from './middleware/auth.js';
import { prisma } from './lib/prisma.js';
import { closeRedis } from './lib/redis.js';

// Import routes
import { authRoutes } from './modules/auth/routes.js';
import { tenantRoutes } from './modules/tenants/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { dfdRoutes } from './modules/planejar/dfd/routes.js';
import { etpRoutes } from './modules/planejar/etp/routes.js';
import { riskRoutes } from './modules/planejar/risk/routes.js';
import { cotacaoRoutes } from './modules/solicitar/cotacao/routes.js';
import { termoRefRoutes } from './modules/solicitar/termo-referencia/routes.js';
import { biddingRoutes } from './modules/cotar/bidding/routes.js';
import { dispensaRoutes } from './modules/cotar/dispensa/routes.js';
import { inexigibilidadeRoutes } from './modules/cotar/inexigibilidade/routes.js';
import { credenciamentoRoutes } from './modules/cotar/credenciamento/routes.js';
import { chamadaPublicaRoutes } from './modules/cotar/chamada-publica/routes.js';
import { contractRoutes } from './modules/contratar/contract/routes.js';
import { addendumRoutes } from './modules/contratar/addendum/routes.js';
import { ataRoutes } from './modules/contratar/ata/routes.js';
import { purchaseOrderRoutes } from './modules/comprar/pedido-compra/routes.js';
import { supplierRoutes } from './modules/cadastros/fornecedor/routes.js';
import { itemRoutes } from './modules/cadastros/item/routes.js';
import { organRoutes } from './modules/cadastros/orgao/routes.js';
import { reportRoutes } from './modules/relatorios/routes.js';
import { configRoutes } from './modules/configuracao/routes.js';
import { uploadRoutes } from './modules/upload/routes.js';
import { healthRoutes } from './modules/health/routes.js';

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.LOG_PRETTY
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } }
        : undefined,
    },
    ajv: {
      customOptions: { coerceTypes: 'array', removeAdditional: 'all' },
    },
    requestTimeout: 30000,
    bodyLimit: env.MAX_FILE_SIZE,
  });

  // Security plugins
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await app.register(import('@fastify/cors'), {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  await app.register(import('@fastify/rate-limit'), {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => req.ip,
    errorMessage: 'Muitas requisições, tente novamente mais tarde',
  });

  await app.register(import('@fastify/cookie'), {
    secret: env.JWT_SECRET,
    hook: 'onRequest',
    parseOptions: { httpOnly: true, secure: env.isProd, sameSite: 'lax' },
  });

  await app.register(import('@fastify/sensible'));

  // JWT
  await app.register(import('@fastify/jwt'), {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    verify: { algorithms: ['HS256'] },
    cookie: { cookieName: 'refreshToken', signed: false },
  });

  // Swagger/OpenAPI
  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: `${env.APP_NAME} API`,
        description: 'API do Buy-Flow - SaaS de Compras Públicas para Prefeituras',
        version: '0.0.1',
        contact: { name: 'Buy-Flow Team', email: 'suporte@buyflow.app' },
        license: { name: 'Proprietary' },
      },
      servers: [
        { url: env.API_URL, description: 'Development Server' },
        { url: 'https://api.buyflow.app', description: 'Production Server' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Health', description: 'Health checks' },
        { name: 'Auth', description: 'Autenticação e autorização' },
        { name: 'Tenants', description: 'Gestão de prefeituras (Platform Owner)' },
        { name: 'Users', description: 'Gestão de usuários e permissões' },
        { name: 'Planejar - DFD', description: 'Documento de Formalização de Demanda' },
        { name: 'Planejar - ETP', description: 'Estudo Técnico Preliminar' },
        { name: 'Planejar - Análise de Risco', description: 'Matriz de riscos' },
        { name: 'Solicitar - Cotação', description: 'Solicitação de cotações' },
        { name: 'Solicitar - Termo de Referência', description: 'Especificação técnica' },
        { name: 'Cotar - Licitação', description: 'Modalidades de licitação' },
        { name: 'Cotar - Dispensa', description: 'Dispensa de licitação' },
        { name: 'Cotar - Inexigibilidade', description: 'Inexigibilidade de licitação' },
        { name: 'Cotar - Credenciamento', description: 'Credenciamento de fornecedores' },
        { name: 'Cotar - Chamada Pública', description: 'Chamamento público' },
        { name: 'Contratar - Contratos', description: 'Gestão de contratos' },
        { name: 'Contratar - Aditivos', description: 'Aditivos e apostilamentos' },
        { name: 'Contratar - Atas', description: 'Atas de Registro de Preços' },
        { name: 'Comprar - Pedidos', description: 'Pedidos de compra e empenhos' },
        { name: 'Cadastros - Fornecedores', description: 'Gestão de fornecedores' },
        { name: 'Cadastros - Itens', description: 'Catálogo de itens (CATMAT/CATSER)' },
        { name: 'Cadastros - Órgãos', description: 'Secretarias, fundos, autarquias' },
        { name: 'Relatórios', description: 'Relatórios gerenciais e exportação' },
        { name: 'Configuração', description: 'Parâmetros do sistema' },
        { name: 'Upload', description: 'Upload de arquivos' },
      ],
    },
  });

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
    staticCSP: true,
  });

  // Multipart para uploads
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: env.MAX_FILE_SIZE, files: 10 },
  });

  // Static files (uploads)
  await app.register(import('@fastify/static'), {
    root: './uploads',
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Global hooks
  app.addHook('onRequest', optionalAuthenticate);
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, closing gracefully...`);
    await app.close();
    await prisma.$disconnect();
    await closeRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // =========================================================================
  // ROUTES - PUBLIC (sem autenticação obrigatória)
  // =========================================================================
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // =========================================================================
  // ROUTES - PROTECTED (autenticação obrigatória)
  // =========================================================================
  const protectedRoutes = async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticate);

    await app.register(tenantRoutes, { prefix: '/api/v1/tenants' });
    await app.register(userRoutes, { prefix: '/api/v1/users' });
    await app.register(dfdRoutes, { prefix: '/api/v1/planejar/dfds' });
    await app.register(etpRoutes, { prefix: '/api/v1/planejar/etps' });
    await app.register(riskRoutes, { prefix: '/api/v1/planejar/riscos' });
    await app.register(cotacaoRoutes, { prefix: '/api/v1/solicitar/cotacoes' });
    await app.register(termoRefRoutes, { prefix: '/api/v1/solicitar/termos-referencia' });
    await app.register(biddingRoutes, { prefix: '/api/v1/cotar/licitacoes' });
    await app.register(dispensaRoutes, { prefix: '/api/v1/cotar/dispensas' });
    await app.register(inexigibilidadeRoutes, { prefix: '/api/v1/cotar/inexigibilidades' });
    await app.register(credenciamentoRoutes, { prefix: '/api/v1/cotar/credenciamentos' });
    await app.register(chamadaPublicaRoutes, { prefix: '/api/v1/cotar/chamadas-publicas' });
    await app.register(contractRoutes, { prefix: '/api/v1/contratar/contratos' });
    await app.register(addendumRoutes, { prefix: '/api/v1/contratar/aditivos' });
    await app.register(ataRoutes, { prefix: '/api/v1/contratar/atas' });
    await app.register(purchaseOrderRoutes, { prefix: '/api/v1/comprar/pedidos' });
    await app.register(supplierRoutes, { prefix: '/api/v1/cadastros/fornecedores' });
    await app.register(itemRoutes, { prefix: '/api/v1/cadastros/itens' });
    await app.register(organRoutes, { prefix: '/api/v1/cadastros/orgaos' });
    await app.register(reportRoutes, { prefix: '/api/v1/relatorios' });
    await app.register(configRoutes, { prefix: '/api/v1/configuracao' });
    await app.register(uploadRoutes, { prefix: '/api/v1/upload' });
  };

  await app.register(protectedRoutes);

  return app;
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildApp()
    .then(app => app.listen({ port: env.PORT, host: '0.0.0.0' }))
    .then(address => console.log(`🚀 Server running at ${address}`))
    .catch(err => {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    });
}

export { buildApp };