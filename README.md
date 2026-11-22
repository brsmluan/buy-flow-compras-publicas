# Buy-Flow

> **SaaS Multi-tenant de Compras Públicas para Prefeituras** — Conformidade total com a Lei 14.133/2021

[![CI](https://github.com/SEU_USUARIO/buy-flow/workflows/CI/badge.svg)](https://github.com/SEU_USUARIO/buy-flow/actions)
[![License](https://img.shields.io/badge/license-PROPRIETARY-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.15.0-orange.svg)](https://pnpm.io)

---

## 🎯 Visão Geral

O **Buy-Flow** é uma plataforma completa de gestão de compras públicas desenvolvida para atender prefeituras brasileiras em total conformidade com a **Nova Lei de Licitações (Lei 14.133/2021)**.

### ✨ Principais Características

| Característica | Descrição |
|----------------|-----------|
| **Multi-tenant** | Uma instalação atende múltiplas prefeituras (isolamento total de dados) |
| **Platform Owner** | Você gerencia todos os tenants, billing, deploy e suporte |
| **100% Gratuito para rodar** | Stack 100% open source + tiers gratuitos (GitHub, Supabase, Vercel, Cloudflare) |
| **Responsivo & PWA** | Funciona no celular, tablet e desktop; instalável |
| **Acessível** | WCAG 2.1 AA, navegação por teclado, screen readers |
| **Seguro** | JWT + Refresh Tokens, 2FA, RBAC granular, audit trail imutável, LGPD |

---

## 🏗️ Arquitetura

```
buy-flow/
├── packages/
│   ├── frontend/          # React 18 + Vite + Tailwind + Radix UI
│   ├── backend/           # Fastify + TypeScript + Prisma + PostgreSQL
│   └── shared/            # Types, Constants, Validators (Zod)
├── docker/                # Docker Compose (dev + prod)
├── .github/workflows/     # CI/CD (GitHub Actions)
└── docs/                  # Documentação técnica
```

### Stack Tecnológica

| Camada | Tecnologia | Por que |
|--------|------------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS, Radix UI | Performance, DX, acessibilidade nativa |
| **Backend** | Fastify, TypeScript, Prisma ORM | Velocidade, type-safety, migrações seguras |
| **Database** | PostgreSQL (Supabase/Neon/Railway) | Robusto, JSON, multi-tenant nativo |
| **Cache/Queue** | Redis (Upstash), BullMQ | Cache, sessões, jobs assíncronos |
| **Auth** | JWT (jose), bcrypt, 2FA (TOTP) | Edge-compatible, seguro |
| **Storage** | MinIO (S3 compatible) / Cloudflare R2 | Arquivos, documentos, versionado |
| **CI/CD** | GitHub Actions (2000 min/mês grátis) | Integrado, gratuito |
| **Deploy** | Vercel (Frontend) + Railway/Render (Backend) | Tiers gratuitos generosos |

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js 20+** (recomendado: [fnm](https://github.com/Schniz/fnm) ou [nvm](https://github.com/nvm-sh/nvm))
- **pnpm 8.15+** (`corepack enable pnpm && corepack prepare pnpm@8.15.4 --activate`)
- **Docker + Docker Compose** (para banco, Redis, MinIO local)
- **Git** (configure user.name e user.email)

### 1. Clone e Instale

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/buy-flow.git
cd buy-flow

# Instale dependências (usa pnpm workspaces)
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores (veja seção abaixo)
```

### 2. Suba a Infraestrutura Local

```bash
# Inicia PostgreSQL, Redis, MinIO, Mailhog, pgAdmin
pnpm docker:up

# Verifique se tudo subiu
pnpm docker:logs
```

**Serviços disponíveis:**
| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:4000 | - |
| **API Docs (Swagger)** | http://localhost:4000/docs | - |
| **pgAdmin** | http://localhost:5050 | admin@buyflow.local / admin |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |
| **Mailhog** | http://localhost:8025 | - |

### 3. Setup do Banco de Dados

```bash
# Gera Prisma Client
pnpm db:generate

# Cria tabelas (push schema)
pnpm db:push

# OU roda migrações (produção)
# pnpm db:migrate

# Popula com dados de demonstração (Boa Nova/BA)
pnpm db:seed
```

### 4. Inicie o Desenvolvimento

```bash
# Inicia frontend + backend com hot reload
pnpm dev
```

Acesse **http://localhost:3000** 🎉

---

## 🔐 Credenciais de Demonstração

Após rodar `pnpm db:seed`:

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| **Platform Owner (Você)** | `owner@buyflow.app` | `BuyFlow@2024!` | Acesso total à plataforma |
| **Platform Admin** | `admin@buyflow.app` | `BuyFlow@2024!` | Gestão de tenants, usuários, logs |
| **Tenant Admin (Boa Nova)** | `admin@boa-nova.buyflow.app` | `BuyFlow@2024!` | Gestão completa da prefeitura |
| **Secretário/Manager** | `sec.adm@boa-nova.buyflow.app` | `BuyFlow@2024!` | Gestão operacional |
| **Pregoeiro/Operator** | `pregoeiro@boa-nova.buyflow.app` | `BuyFlow@2024!` | Operações de compra/licitação |
| **Vereador/Viewer** | `vereador@boa-nova.buyflow.app` | `BuyFlow@2024!` | Somente leitura (auditoria) |

> **2FA:** Código placeholder `123456` (configure real com app autenticador)

---

## ⚙️ Variáveis de Ambiente (.env)

Copie `.env.example` para `.env` e preencha:

```bash
# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV=development
APP_NAME="Buy-Flow"
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

# =============================================================================
# DATABASE (PostgreSQL)
# =============================================================================
# Local (Docker Compose):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/buy_flow?schema=public"

# Produção GRATUITA (Supabase - 500MB):
# DATABASE_URL="postgresql://postgres:[SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public"

# =============================================================================
# REDIS (Cache, Sessions, BullMQ)
# =============================================================================
# Local:
REDIS_URL="redis://localhost:6379"

# Produção GRATUITA (Upstash - 10k requests/dia):
# REDIS_URL="redis://default:[TOKEN]@[ENDPOINT].upstash.io:6379"

# =============================================================================
# AUTH & SECURITY
# =============================================================================
# Gere com: openssl rand -base64 64
JWT_SECRET="sua-chave-super-secreta-com-pelo-menos-64-caracteres-mude-em-producao"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12

# =============================================================================
# MULTI-TENANCY
# =============================================================================
TENANT_DOMAIN="localhost"
TENANT_SUBDOMAIN_ENABLED="false"

# =============================================================================
# EMAIL (Resend - 3000 emails/mês GRÁTIS)
# =============================================================================
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="Buy-Flow <noreply@seudominio.com>"

# Alternativa SMTP (Gmail, SendGrid, etc.):
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=587
# SMTP_USER="seu-email@gmail.com"
# SMTP_PASS="sua-senha-de-app"

# =============================================================================
# STORAGE (MinIO Local / S3 / Cloudflare R2 / Supabase Storage)
# =============================================================================
STORAGE_PROVIDER="minio"
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="buy-flow"
MINIO_USE_SSL="false"

# Produção GRATUITA (Cloudflare R2 - 10GB grátis):
# S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
# S3_ACCESS_KEY_ID="..."
# S3_SECRET_ACCESS_KEY="..."
# S3_BUCKET="buy-flow"
# S3_REGION="auto"

# =============================================================================
# INTEGRAÇÕES GOVERNO (Configure quando tiver credenciais)
# =============================================================================
# PNCP (Portal Nacional de Contratações Públicas)
PNCP_BASE_URL="https://pncp.gov.br/api"
PNCP_CLIENT_ID=""
PNCP_CLIENT_SECRET=""

# GOV.BR (Login único + Assinatura Digital ICP-Brasil)
GOVBR_CLIENT_ID=""
GOVBR_CLIENT_SECRET=""
GOVBR_REDIRECT_URI="http://localhost:3000/auth/govbr/callback"

# TCE/TCM (Prestação de Contas - varia por estado)
TCE_WEBSERVICE_URL="https://webservice.tce.ba.gov.br"
```

---

## 📦 Módulos Funcionais

### 📋 PLANEJAR
- **DFD** — Documento de Formalização de Demanda (Art. 18, Lei 14.133/21)
- **Processo Administrativo** — Tramitação completa (Lei 9.784/99)
- **ETP** — Estudo Técnico Preliminar (Art. 18, §1º)
- **Análise de Risco** — Matriz probabilidade × impacto (Art. 18, §2º)

### 📝 SOLICITAR
- **Cotação** — Solicitação e comparativo de preços
- **Termo de Referência** — Especificação técnica completa

### 💰 COTAR (Modalidades)
- **Licitação** — Pregão Eletrônico/Presencial, Concorrência, Concurso, Leilão
- **Dispensa** — Por valor, emergência, segurança nacional, etc. (Art. 75)
- **Inexigibilidade** — Único fornecedor, profissional especializado (Art. 74)
- **Credenciamento** — Seleção contínua de fornecedores (Art. 79)
- **Chamada Pública** — Parcerias com OSC, projetos sociais

### 📄 CONTRATAR
- **Atas de Registro de Preços** — Itens, fornecedores, vigência, aditivos
- **Contratos** — Aditivos, apostilamentos, reajustes, prorrogações
- **Convênios** — Termos de fomento, colaboração, prestação de contas
- **Obras** — Medições, cronograma físico-financeiro, retenção

### 🛒 COMPRAR
- **Pedidos de Compra** — Empenho, NF, recebimento, pagamento
- **Almoxarifado** — Estoque, movimentação, inventário, ponto de reposição

### 📊 RELATÓRIOS & INTEGRAÇÕES
- **Builder Visual** — Relatórios customizáveis (PDF, Excel, CSV)
- **PNCP** — Publicação automática + consulta
- **TCE/TCM** — Webservices de prestação de contas
- **GOV.BR** — Login único + Assinatura digital ICP-Brasil
- **SIAFI/SIAFEM** — Empenho e pagamento

---

## 🌿 Git & GitHub Workflow

### Estrutura de Branches (Git Flow Simplificado)

```
main           → Produção (protegida, só via PR)
develop        → Integração contínua
feature/*      → Novas funcionalidades
fix/*          → Correções
release/*      → Preparação de release
hotfix/*       → Correções urgentes em produção
```

### Convenção de Commits (Conventional Commits)

```bash
# Formato: <tipo>(<escopo>): <mensagem>

# Exemplos:
git commit -m "feat(dfd): adicionar validação de valor estimado"
git commit -m "fix(auth): corrigir refresh token rotation"
git commit -m "docs(readme): adicionar instruções de deploy"
git commit -m "refactor(db): otimizar queries de contratos"
git commit -m "test(frontend): adicionar testes de login"
git commit -m "chore(deps): atualizar dependências"
```

**Tipos permitidos:** `feat` `fix` `docs` `style` `refactor` `test` `chore` `perf` `ci` `build` `revert`

### Fluxo de Pull Request

```bash
# 1. Atualize develop
git checkout develop && git pull origin develop

# 2. Crie branch da feature
git checkout -b feature/nome-da-feature

# 3. Desenvolva commitando frequentemente
git add . && git commit -m "feat(modulo): descrição da mudança"

# 4. Push e abra PR
git push origin feature/nome-da-feature
# No GitHub: Compare & pull request → base: develop

# 5. Após review e CI verde: Merge (Squash and merge)
# 6. Delete branch local e remota
git checkout develop && git pull
git branch -d feature/nome-da-feature
git push origin --delete feature/nome-da-feature
```

### Comandos Úteis do Dia a Dia

```bash
# Ver status
git status

# Ver diff antes de commit
git diff
git diff --staged

# Desfazer alterações não commitadas
git restore arquivo.ts
git restore .

# Histórico bonito
git log --oneline --graph --decorate -20

# Atualizar branch com develop (rebase)
git checkout feature/minha-feature
git fetch origin
git rebase origin/develop

# Stash (guardar trabalho temporário)
git stash
git stash pop
```

### Configuração Inicial do Git (faça uma vez)

```bash
# Identidade
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Editor (opcional)
git config --global core.editor "code --wait"

# Aliases úteis
git config --global alias.st "status"
git config --global alias.co "checkout"
git config --global alias.br "branch"
git config --global alias.cm "commit -m"
git config --global alias.lg "log --oneline --graph --decorate"
git config --global alias.undo "reset --soft HEAD~1"
```

---

## 🐳 Deploy em Produção (90% Gratuito)

### Opção 1: Vercel (Frontend) + Railway (Backend) — RECOMENDADO

| Serviço | Tier Gratuito | Configuração |
|---------|---------------|--------------|
| **Vercel** | Unlimited personal, 100GB bandwidth | Conecta repo → Detecta Vite → Deploy automático |
| **Railway** | $5/mês trial, depois pay-per-use | Conecta repo → Dockerfile.backend → PostgreSQL + Redis plugins |
| **Supabase** | 500MB DB, 1GB storage, 2M auth users | Cria project → Pega DATABASE_URL → Configura auth |
| **Upstash Redis** | 10k requests/dia grátis | Cria database → Pega REDIS_URL |
| **Cloudflare R2** | 10GB storage grátis | Cria bucket → Configura S3_ENDPOINT |
| **Resend** | 3.000 emails/mês grátis | Cria API key → Configura RESEND_API_KEY |

### Passos Deploy

```bash
# 1. Push para main (dispara CI/CD)
git push origin main

# 2. GitHub Actions roda:
#    - Lint + Typecheck + Test
#    - Build (frontend + backend)
#    - Docker build
#    - Security scan

# 3. Configure secrets no GitHub (Settings → Secrets):
#    VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
#    RAILWAY_DEPLOY_HOOK
#    SUPABASE_DB_URL, SUPABASE_ANON_KEY
#    UPSTASH_REDIS_URL
#    RESEND_API_KEY
#    CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY

# 4. Merge para main = Deploy automático staging
# 5. Tag de release = Deploy production
git tag v1.0.0 && git push origin v1.0.0
```

### Domínios Customizados por Tenant

```bash
# Configure no tenant (Platform Owner):
# customDomain: "compras.boanova.ba.gov.br"

# DNS (CNAME):
# compras.boanova.ba.gov.br  →  cname.vercel-dns.com

# SSL automático (Vercel/Cloudflare)
```

---

## 🧪 Testes

```bash
# Todos os testes
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E (Playwright)
pnpm playwright test
```

### Estrutura de Testes

```
packages/
├── backend/
│   ├── src/**/*.test.ts          # Unit/Integration (Vitest)
│   └── prisma/seed.test.ts       # Seed tests
├── frontend/
│   ├── src/**/*.test.tsx         # Component (Vitest + RTL)
│   └── e2e/**/*.spec.ts          # E2E (Playwright)
└── shared/
    └── src/**/*.test.ts          # Validators, utils (Vitest)
```

---

## 📚 Documentação

| Documento | Localização |
|-----------|-------------|
| **Arquitetura** | `docs/architecture/` |
| **API Spec (OpenAPI)** | `docs/api/openapi.yaml` |
| **Database Schema** | `docs/database/` |
| **Lei 14.133 Compliance** | `docs/legal/lei-14133-compliance.md` |
| **LGPD Compliance** | `docs/legal/lgpd-compliance.md` |
| **PNCP Integration** | `docs/legal/pncp-integration.md` |
| **User Guides** | `docs/user-guides/` |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit seguindo Conventional Commits
4. Push para branch (`git push origin feature/nova-funcionalidade`)
4. Abra Pull Request

### Code Style

- **ESLint + Prettier** (config no repo)
- **TypeScript strict mode**
- **Conventional Commits** (validado por commitlint)
- **Husky hooks** (pre-commit, commit-msg)

---

## 📄 Licença

**PROPRIETÁRIO** — Todos os direitos reservados.

Este software é propriedade intelectual da Buy-Flow. Uso, cópia, modificação, distribuição ou engenharia reversa só são permitidos mediante licença comercial.

---

## 🆘 Suporte

| Canal | Descrição |
|-------|-----------|
| **Issues** | Bugs, feature requests (GitHub Issues) |
| **Discussions** | Dúvidas, discussões técnicas (GitHub Discussions) |
| **Email** | suporte@buyflow.app |
| **Docs** | `/docs` folder |

---

## 🗺️ Roadmap

### Fase 1 - Core (MVP) ✅
- [x] Multi-tenant + Auth + RBAC
- [x] DFD, ETP, Análise de Risco
- [x] Cotação + Termo de Referência
- [x] Licitação, Dispensa, Inexigibilidade
- [x] Contratos + Aditivos + Atas
- [x] Pedidos de Compra + Almoxarifado
- [x] Cadastros (Fornecedores, Itens, Órgãos)
- [x] Dashboard + Relatórios básicos

### Fase 2 - Integrações Gov
- [ ] PNCP Publicação Automática
- [ ] GOV.BR Login + Assinatura Digital
- [ ] TCE/TCM Webservices
- [ ] SIAFI/SIAFEM Empenho

### Fase 3 - Avançado
- [ ] IA Assistant (sugestão de modalidade, validação de ETP)
- [ ] Portal do Fornecedor
- [ ] App Mobile (React Native)
- [ ] Módulo Obras completo
- [ ] Módulo Convênios completo

### Fase 4 - Enterprise
- [ ] Multi-region deploy
- [ ] Advanced analytics (BI)
- [ ] White-label completo
- [ ] SLA monitoring

---

## 🙏 Agradecimentos

- **Comunidade Open Source** — React, Fastify, Prisma, Tailwind, Radix UI, e tantas outras
- **Governo Federal** — PNCP, GOV.BR, dados abertos
- **TCEs/TCMs** — Padrões de prestação de contas

---

<div align="center">

**Feito com ❤️ para as prefeituras do Brasil**

**Buy-Flow** — Compras públicas modernas, transparentes e eficientes

</div>