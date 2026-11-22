// tsup.config.ts - Backend build config
// Chamado por: package.json script "build" -> tsup
// Não existe arquivo similar - configuração necessária para tsup
// Lê: src/app.ts e dependências
// Escreve: dist/ com múltiplos formatos (esm, cjs) e tipos
// Instrução do usuário: Corrigir build do backend

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/app.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@prisma/client', 'fastify', 'redis', 'ioredis', 'bcryptjs', 'bullmq', 'jose', 'otplib', 'pino', 'pino-pretty', 'zod'],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@': './src',
      '@/lib': './src/lib',
      '@/middleware': './src/middleware',
      '@/modules': './src/modules',
    },
  },
});