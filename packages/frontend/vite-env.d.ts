// vite-env.d.ts - Vite environment types
// Chamado por: tsconfig.json include array
// Não existe arquivo similar - necessário para tipos do import.meta.env
// Instrução do usuário: Corrigir erro de tipo ImportMeta no frontend

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}