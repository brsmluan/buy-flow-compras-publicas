// tsup.config.ts - Shared package build config
// Chamado por: package.json script "build" -> tsup
// Não existe arquivo similar - configuração necessária para tsup
// Lê: src/index.ts, src/types/index.ts, src/constants/index.ts, src/validators/index.ts
// Escreve: dist/ com múltiplos formatos (esm, cjs) e tipos
// Instrução do usuário: Configurar build do shared package

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    types: 'src/types/index.ts',
    constants: 'src/constants/index.ts',
    validators: 'src/validators/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['zod', 'zod-to-json-schema', 'date-fns', 'date-fns-tz', 'cpf-cnpj-validator'],
});