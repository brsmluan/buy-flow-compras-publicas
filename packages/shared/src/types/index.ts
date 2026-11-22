// =============================================================================
// BUY-FLOW SHARED - Domain Types
// =============================================================================

import { z } from 'zod';

// -----------------------------------------------------------------------------
// BASE TYPES
// -----------------------------------------------------------------------------

export const UUIDSchema = z.string().uuid();
export type UUID = z.infer<typeof UUIDSchema>;

export const DateTimeSchema = z.string().datetime({ offset: true });
export type DateTime = z.infer<typeof DateTimeSchema>;

export const DateSchema = z.string().date();
export type DateOnly = z.infer<typeof DateSchema>;

export const CurrencySchema = z.number().nonnegative().multipleOf(0.01);
export type Currency = z.infer<typeof CurrencySchema>;

export const PercentageSchema = z.number().min(0).max(100).multipleOf(0.01);
export type Percentage = z.infer<typeof PercentageSchema>;

// -----------------------------------------------------------------------------
// MULTI-TENANCY
// -----------------------------------------------------------------------------

export const TenantStatusSchema = z.enum(['active', 'inactive', 'suspended', 'trial', 'pending_setup']);
export type TenantStatus = z.infer<typeof TenantStatusSchema>;

export const TenantPlanSchema = z.enum(['starter', 'professional', 'enterprise', 'custom']);
export type TenantPlan = z.infer<typeof TenantPlanSchema>;

export const TenantSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  cnpj: z.string().length(14).regex(/^\d+$/),
  state: z.string().length(2).toUpperCase(),
  city: z.string().min(2).max(100),
  status: TenantStatusSchema.default('pending_setup'),
  plan: TenantPlanSchema.default('starter'),
  customDomain: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1e40af'),
  settings: z.record(z.unknown()).default({}),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const CreateTenantSchema = TenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type CreateTenant = z.infer<typeof CreateTenantSchema>;

export const UpdateTenantSchema = CreateTenantSchema.partial();
export type UpdateTenant = z.infer<typeof UpdateTenantSchema>;

// -----------------------------------------------------------------------------
// USERS & AUTH
// -----------------------------------------------------------------------------

export const UserRoleSchema = z.enum([
  'platform_owner',
  'platform_admin',
  'tenant_admin',
  'tenant_manager',
  'tenant_operator',
  'tenant_viewer',
  'supplier',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['active', 'inactive', 'pending_approval', 'blocked', 'locked']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema.nullable(),
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).max(200),
  cpf: z.string().length(11).regex(/^\d+$/).optional(),
  phone: z.string().regex(/^\+?\d{10,15}$/).optional(),
  avatarUrl: z.string().url().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema.default('pending_approval'),
  permissions: z.array(z.string()).default([]),
  lastLoginAt: DateTimeSchema.optional(),
  passwordChangedAt: DateTimeSchema.optional(),
  twoFactorEnabled: z.boolean().default(false),
  twoFactorSecret: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  lastLoginAt: true,
  passwordChangedAt: true,
}).extend({
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});
export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.omit({ password: true, confirmPassword: true }).partial();
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  twoFactorCode: z.string().length(6).optional(),
  rememberMe: z.boolean().default(false),
});
export type Login = z.infer<typeof LoginSchema>;

export const TokenPayloadSchema = z.object({
  sub: UUIDSchema,
  tenantId: UUIDSchema.nullable(),
  email: z.string().email(),
  role: UserRoleSchema,
  permissions: z.array(z.string()),
  type: z.enum(['access', 'refresh']),
  iat: z.number(),
  exp: z.number(),
});
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

// -----------------------------------------------------------------------------
// PERMISSIONS & RBAC
// -----------------------------------------------------------------------------

export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  module: z.string(),
  action: z.enum(['create', 'read', 'update', 'delete', 'approve', 'export', 'manage']),
  resource: z.string(),
  conditions: z.record(z.unknown()).optional(),
});
export type Permission = z.infer<typeof PermissionSchema>;

export const RolePermissionSchema = z.object({
  role: UserRoleSchema,
  permissions: z.array(z.string()),
  inheritsFrom: z.array(UserRoleSchema).optional(),
});
export type RolePermission = z.infer<typeof RolePermissionSchema>;

// -----------------------------------------------------------------------------
// MODULES - PLANEJAR
// -----------------------------------------------------------------------------

export const DFDStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'returned',
  'cancelled',
]);
export type DFDStatus = z.infer<typeof DFDStatusSchema>;

export const DFDSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  number: z.string().max(50),
  year: z.number().int().min(2020).max(2099),
  requestingOrganId: UUIDSchema,
  requesterId: UUIDSchema,
  objectDescription: z.string().min(10).max(5000),
  justification: z.string().min(10).max(10000),
  estimatedValue: CurrencySchema,
  budgetSourceId: UUIDSchema,
  status: DFDStatusSchema.default('draft'),
  attachments: z.array(z.object({
    id: UUIDSchema,
    name: z.string(),
    url: z.string().url(),
    mimeType: z.string(),
    size: z.number(),
    uploadedAt: DateTimeSchema,
    uploadedBy: UUIDSchema,
  })).default([]),
  workflowHistory: z.array(z.object({
    id: UUIDSchema,
    fromStatus: DFDStatusSchema.optional(),
    toStatus: DFDStatusSchema,
    comment: z.string().optional(),
    userId: UUIDSchema,
    userName: z.string(),
    createdAt: DateTimeSchema,
  })).default([]),
  approvedAt: DateTimeSchema.optional(),
  approvedBy: UUIDSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type DFD = z.infer<typeof DFDSchema>;

export const ETPStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'returned',
]);
export type ETPStatus = z.infer<typeof ETPStatusSchema>;

export const RiskLevelSchema = z.enum(['very_low', 'low', 'medium', 'high', 'very_high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RiskSchema = z.object({
  id: UUIDSchema,
  description: z.string(),
  probability: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  level: RiskLevelSchema,
  mitigation: z.string().optional(),
  responsibleId: UUIDSchema.optional(),
  deadline: DateSchema.optional(),
});
export type Risk = z.infer<typeof RiskSchema>;

// -----------------------------------------------------------------------------
// MODULES - COTAR (Modalidades)
// -----------------------------------------------------------------------------

export const BiddingModalitySchema = z.enum([
  'pregao_eletronico',
  'pregao_presencial',
  'concorrencia',
  'concurso',
  'leilao',
  'dispensa',
  'inexigibilidade',
  'credenciamento',
  'chamada_publica',
  'rdc',
]);
export type BiddingModality = z.infer<typeof BiddingModalitySchema>;

export const BiddingStatusSchema = z.enum([
  'planning',
  'published',
  'clarification_period',
  'session_scheduled',
  'in_session',
  'judgment',
  'homologated',
  'revoked',
  'cancelled',
  'archived',
]);
export type BiddingStatus = z.infer<typeof BiddingStatusSchema>;

export const BiddingSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  modality: BiddingModalitySchema,
  number: z.string().max(50),
  year: z.number().int().min(2020).max(2099),
  processNumber: z.string().max(100).optional(),
  objectDescription: z.string().min(10).max(10000),
  estimatedValue: CurrencySchema,
  biddingOrganId: UUIDSchema,
  responsibleId: UUIDSchema,
  status: BiddingStatusSchema.default('planning'),
  editalUrl: z.string().url().optional(),
  pncpPublicationId: z.string().optional(),
  sessionDate: DateTimeSchema.optional(),
  sessionLocation: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Bidding = z.infer<typeof BiddingSchema>;

// -----------------------------------------------------------------------------
// MODULES - CONTRATAR
// -----------------------------------------------------------------------------

export const ContractStatusSchema = z.enum([
  'draft',
  'pending_signature',
  'active',
  'suspended',
  'expired',
  'terminated',
  'renewed',
]);
export type ContractStatus = z.infer<typeof ContractStatusSchema>;

export const ContractSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  number: z.string().max(50),
  year: z.number().int().min(2020).max(2099),
  processNumber: z.string().max(100).optional(),
  biddingId: UUIDSchema.optional(),
  modality: BiddingModalitySchema,
  supplierId: UUIDSchema,
  organId: UUIDSchema,
  managerId: UUIDSchema,
  objectDescription: z.string().min(10).max(10000),
  totalValue: CurrencySchema,
  startDate: DateSchema,
  endDate: DateSchema,
  status: ContractStatusSchema.default('draft'),
  contractFileUrl: z.string().url().optional(),
  signedAt: DateTimeSchema.optional(),
  signedBy: UUIDSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Contract = z.infer<typeof ContractSchema>;

export const ContractAddendumSchema = z.object({
  id: UUIDSchema,
  contractId: UUIDSchema,
  number: z.string().max(50),
  type: z.enum(['aditivo', 'apostilamento', 'reajuste', 'repactuacao', 'prorrogacao', 'alteracao_objeto']),
  description: z.string().min(10).max(5000),
  valueChange: z.number().multipleOf(0.01).default(0),
  newTotalValue: CurrencySchema.optional(),
  newEndDate: DateSchema.optional(),
  legalBasis: z.string().max(500),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'signed']),
  fileUrl: z.string().url().optional(),
  signedAt: DateTimeSchema.optional(),
  signedBy: UUIDSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});
export type ContractAddendum = z.infer<typeof ContractAddendumSchema>;

// -----------------------------------------------------------------------------
// MODULES - COMPRAR
// -----------------------------------------------------------------------------

export const PurchaseOrderStatusSchema = z.enum([
  'draft',
  'pending_empemho',
  'empenhado',
  'partial_delivered',
  'delivered',
  'invoiced',
  'paid',
  'cancelled',
]);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;

export const PurchaseOrderSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  number: z.string().max(50),
  year: z.number().int().min(2020).max(2099),
  contractId: UUIDSchema.optional(),
  supplierId: UUIDSchema,
  requestingOrganId: UUIDSchema,
  requesterId: UUIDSchema,
  items: z.array(z.object({
    id: UUIDSchema,
    itemId: UUIDSchema,
    description: z.string(),
    quantity: z.number().positive().multipleOf(0.001),
    unit: z.string(),
    unitPrice: CurrencySchema,
    totalPrice: CurrencySchema,
    deliveredQuantity: z.number().multipleOf(0.001).default(0),
    invoicedQuantity: z.number().multipleOf(0.001).default(0),
  })).min(1),
  totalValue: CurrencySchema,
  empenhoNumber: z.string().max(50).optional(),
  empenhoDate: DateSchema.optional(),
  status: PurchaseOrderStatusSchema.default('draft'),
  deliveryDeadline: DateSchema.optional(),
  deliveryAddress: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

// -----------------------------------------------------------------------------
// CADASTROS - FORNECEDORES, ITENS, ÓRGÃOS
// -----------------------------------------------------------------------------

export const SupplierTypeSchema = z.enum(['pf', 'pj', 'mei', 'foreign']);
export type SupplierType = z.infer<typeof SupplierTypeSchema>;

export const SupplierStatusSchema = z.enum(['active', 'inactive', 'blocked', 'suspended', 'pending_habilitation']);
export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;

export const SupplierSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  type: SupplierTypeSchema,
  name: z.string().min(2).max(200),
  tradeName: z.string().max(200).optional(),
  cnpjCpf: z.string().min(11).max(14).regex(/^\d+$/),
  stateRegistration: z.string().max(20).optional(),
  municipalRegistration: z.string().max(20).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().regex(/^\+?\d{10,15}$/).optional(),
  address: z.object({
    zipCode: z.string().length(8).regex(/^\d+$/),
    street: z.string().max(200),
    number: z.string().max(20),
    complement: z.string().max(100).optional(),
    neighborhood: z.string().max(100),
    city: z.string().max(100),
    state: z.string().length(2).toUpperCase(),
  }).optional(),
  categories: z.array(UUIDSchema).default([]),
  status: SupplierStatusSchema.default('active'),
  habilitationValidUntil: DateSchema.optional(),
  bankAccount: z.object({
    bank: z.string().max(100),
    agency: z.string().max(20),
    account: z.string().max(20),
    type: z.enum(['checking', 'savings']),
    pixKey: z.string().max(100).optional(),
  }).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    validUntil: DateSchema,
    fileUrl: z.string().url().optional(),
  })).default([]),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

export const ItemCategorySchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  code: z.string().max(20),
  name: z.string().max(200),
  description: z.string().max(1000).optional(),
  parentId: UUIDSchema.nullable(),
  isActive: z.boolean().default(true),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

export const ItemSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  categoryId: UUIDSchema,
  code: z.string().max(50),
  name: z.string().min(2).max(300),
  description: z.string().max(5000).optional(),
  unit: z.string().max(20),
  specifications: z.string().max(10000).optional(),
  referencePrice: CurrencySchema.optional(),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Item = z.infer<typeof ItemSchema>;

export const OrganSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  code: z.string().max(20).optional(),
  name: z.string().min(2).max(200),
  acronym: z.string().max(10).optional(),
  type: z.enum(['secretaria', 'fundo', 'autarquia', 'fundacao', 'camara', 'gabinete', 'outro']),
  parentId: UUIDSchema.nullable(),
  budgetCode: z.string().max(50).optional(),
  managerId: UUIDSchema.optional(),
  address: z.string().max(500).optional(),
  phone: z.string().regex(/^\+?\d{10,15}$/).optional(),
  email: z.string().email().toLowerCase().optional(),
  isActive: z.boolean().default(true),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Organ = z.infer<typeof OrganSchema>;

// -----------------------------------------------------------------------------
// RELATÓRIOS & AUDITORIA
// -----------------------------------------------------------------------------

export const AuditLogSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema.nullable(),
  userId: UUIDSchema.nullable(),
  userName: z.string().optional(),
  action: z.string().max(100),
  resource: z.string().max(100),
  resourceId: UUIDSchema.optional(),
  oldValues: z.record(z.unknown()).optional(),
  newValues: z.record(z.unknown()).optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: DateTimeSchema,
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const ReportTypeSchema = z.enum([
  'dfd_list',
  'etp_list',
  'bidding_list',
  'contract_list',
  'purchase_order_list',
  'supplier_list',
  'execution_financial',
  'contract_expiration',
  'bidding_timeline',
  'supplier_performance',
  'organ_execution',
  'custom',
]);
export type ReportType = z.infer<typeof ReportTypeSchema>;

export const ReportFormatSchema = z.enum(['pdf', 'excel', 'csv', 'json']);
export type ReportFormat = z.infer<typeof ReportFormatSchema>;

// -----------------------------------------------------------------------------
// INTEGRAÇÕES
// -----------------------------------------------------------------------------

export const PNCPModalidadeSchema = z.enum([
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
]);
export type PNCPModalidade = z.infer<typeof PNCPModalidadeSchema>;

// -----------------------------------------------------------------------------
// PAGINATION & FILTERS
// -----------------------------------------------------------------------------

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });
export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<z.ZodTypeAny>>> & { data: T[] };

// -----------------------------------------------------------------------------
// API RESPONSE WRAPPERS
// -----------------------------------------------------------------------------

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }).optional(),
    meta: z.record(z.unknown()).optional(),
  });
export type ApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodTypeAny>>> & { data?: T };

// =============================================================================
// NOVOS TIPOS PARA MÓDULOS ADICIONAIS
// =============================================================================

// =============================================================================
// COTAÇÃO
// =============================================================================

export const CotacaoStatusSchema = z.enum([
  'draft', 'sent', 'received', 'compared', 'cancelled',
]);
export type CotacaoStatus = z.infer<typeof CotacaoStatusSchema>;

export const CotacaoSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  description: z.string(),
  deadline: DateTimeSchema,
  requestedById: UUIDSchema,
  status: CotacaoStatusSchema.default('draft'),
  sentAt: DateTimeSchema.optional(),
  receivedAt: DateTimeSchema.optional(),
  comparedAt: DateTimeSchema.optional(),
  cancelledAt: DateTimeSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Cotacao = z.infer<typeof CotacaoSchema>;

export const CotacaoItemSchema = z.object({
  id: UUIDSchema,
  cotacaoId: UUIDSchema,
  itemId: UUIDSchema,
  quantity: z.number().positive().multipleOf(0.001),
  specifications: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});
export type CotacaoItem = z.infer<typeof CotacaoItemSchema>;

export const CotacaoPropostaSchema = z.object({
  id: UUIDSchema,
  cotacaoId: UUIDSchema,
  supplierId: UUIDSchema,
  items: z.record(z.unknown()).default({}),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});
export type CotacaoProposta = z.infer<typeof CotacaoPropostaSchema>;

// =============================================================================
// TERMO DE REFERÊNCIA
// =============================================================================

export const TermoReferenciaStatusSchema = z.enum([
  'draft', 'review', 'approved', 'rejected',
]);
export type TermoReferenciaStatus = z.infer<typeof TermoReferenciaStatusSchema>;

export const TermoReferenciaSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  dfdId: UUIDSchema.nullable(),
  etpId: UUIDSchema.nullable(),
  title: z.string().min(5).max(200),
  objectDescription: z.string().min(20).max(10000),
  specifications: z.string().max(20000).optional(),
  quantities: z.record(z.unknown()).default({}),
  estimatedValue: CurrencySchema,
  deliveryConditions: z.string().max(5000).optional(),
  status: TermoReferenciaStatusSchema.default('draft'),
  approvedAt: DateTimeSchema.optional(),
  approvedById: UUIDSchema.nullable(),
  createdById: UUIDSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type TermoReferencia = z.infer<typeof TermoReferenciaSchema>;

// =============================================================================
// ATA DE REGISTRO DE PREÇOS
// =============================================================================

export const AtaSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  number: z.string().max(50),
  year: z.number().int().min(2020).max(2099),
  biddingId: UUIDSchema,
  validityStart: DateTimeSchema,
  validityEnd: DateTimeSchema,
  status: z.string().default('active'),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type Ata = z.infer<typeof AtaSchema>;

export const AtaItemSchema = z.object({
  id: UUIDSchema,
  ataId: UUIDSchema,
  itemId: UUIDSchema,
  supplierId: UUIDSchema,
  quantity: z.number().positive().multipleOf(0.001),
  unit: z.string().max(20),
  unitPrice: CurrencySchema,
  totalPrice: CurrencySchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});
export type AtaItem = z.infer<typeof AtaItemSchema>;

// =============================================================================
// TERMO DE REFERÊNCIA
// =============================================================================

export const TermoReferenciaSchema = z.object({
  id: UUIDSchema,
  tenantId: UUIDSchema,
  dfdId: UUIDSchema.nullable(),
  etpId: UUIDSchema.nullable(),
  title: z.string().min(5).max(200),
  objectDescription: z.string().min(20).max(10000),
  specifications: z.string().max(20000).optional(),
  quantities: z.record(z.unknown()).default({}),
  estimatedValue: CurrencySchema,
  deliveryConditions: z.string().max(5000).optional(),
  status: TermoReferenciaStatusSchema.default('draft'),
  approvedAt: DateTimeSchema.optional(),
  approvedById: UUIDSchema.nullable(),
  createdById: UUIDSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  deletedAt: DateTimeSchema.optional(),
});
export type TermoReferencia = z.infer<typeof TermoReferenciaSchema>;

// =============================================================================
// PEDIDO DE COMPRA
// =============================================================================

export const PurchaseOrderItemSchema = z.object({
  id: UUIDSchema,
  purchaseOrderId: UUIDSchema,
  itemId: UUIDSchema,
  description: z.string(),
  quantity: z.number().positive().multipleOf(0.001),
  unit: z.string().max(20),
  unitPrice: CurrencySchema,
  totalPrice: CurrencySchema,
  deliveredQuantity: z.number().multipleOf(0.001).default(0),
  invoicedQuantity: z.number().multipleOf(0.001).default(0),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});
export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;