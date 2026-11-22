// =============================================================================
// BUY-FLOW SHARED - Zod Validators (Reutilizáveis Frontend + Backend)
// =============================================================================

import { z } from 'zod';
import {
  UUIDSchema,
  DateTimeSchema,
  DateSchema,
  CurrencySchema,
  PercentageSchema,
  TenantSchema,
  CreateTenantSchema,
  UpdateTenantSchema,
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  LoginSchema,
  TokenPayloadSchema,
  DFDSchema,
  ETPStatusSchema,
  RiskSchema,
  BiddingSchema,
  ContractSchema,
  ContractAddendumSchema,
  PurchaseOrderSchema,
  SupplierSchema,
  ItemCategorySchema,
  ItemSchema,
  OrganSchema,
  AuditLogSchema,
  PaginationSchema,
} from '../types/index.js';

import { UPLOAD_CONFIG } from '../constants/index.js';

// -----------------------------------------------------------------------------
// VALIDADORES BRASILEIROS (CPF, CNPJ, CEP, TELEFONE)
// -----------------------------------------------------------------------------

/**
 * Valida CPF (formato: apenas números ou com pontuação)
 */
export const CpfSchema = z.string().refine(
  (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean[i]) * (10 - i);
    }
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== parseInt(clean[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean[i]) * (11 - i);
    }
    digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== parseInt(clean[10])) return false;

    return true;
  },
  { message: 'CPF inválido' }
);

/**
 * Valida CNPJ (formato: apenas números ou com pontuação)
 */
export const CnpjSchema = z.string().refine(
  (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(clean[i]) * weights1[i];
    }
    let digit = sum % 11;
    digit = digit < 2 ? 0 : 11 - digit;
    if (digit !== parseInt(clean[12])) return false;

    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(clean[i]) * weights2[i];
    }
    digit = sum % 11;
    digit = digit < 2 ? 0 : 11 - digit;
    if (digit !== parseInt(clean[13])) return false;

    return true;
  },
  { message: 'CNPJ inválido' }
);

/**
 * Valida CPF ou CNPJ automaticamente
 */
export const CpfCnpjSchema = z.string().refine(
  (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length === 11) {
      return CpfSchema.safeParse(clean).success;
    }
    if (clean.length === 14) {
      return CnpjSchema.safeParse(clean).success;
    }
    return false;
  },
  { message: 'CPF ou CNPJ inválido' }
);

/**
 * Valida CEP (formato: 00000-000 ou 00000000)
 */
export const CepSchema = z.string().refine(
  (value) => {
    const clean = value.replace(/\D/g, '');
    return clean.length === 8 && /^\d{8}$/.test(clean);
  },
  { message: 'CEP inválido (formato: 00000-000)' }
);

/**
 * Valida telefone brasileiro
 */
export const PhoneSchema = z.string().refine(
  (value) => {
    const clean = value.replace(/\D/g, '');
    return (clean.length === 11 || clean.length === 10) && /^\d+$/.test(clean);
  },
  { message: 'Telefone inválido (formato: (DD) 9xxxx-xxxx ou (DD) xxxx-xxxx)' }
);

/**
 * Valida placa de veículo (Mercosul: ABC1D23 ou antigo: ABC1234)
 */
export const PlateSchema = z.string().refine(
  (value) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    const old = /^[A-Z]{3}[0-9]{4}$/;
    return mercosul.test(clean) || old.test(clean);
  },
  { message: 'Placa inválida (formato: ABC1D23 ou ABC1234)' }
);

/**
 * Valida PIS/PASEP/NIT
 */
export const PisPasepSchema = z.string().refine(
  (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean[i]) * weights[i];
    }
    const digit = (11 - (sum % 11)) % 11;
    return digit === parseInt(clean[10]);
  },
  { message: 'PIS/PASEP/NIT inválido' }
);

// -----------------------------------------------------------------------------
// VALIDADORES DE FORMULÁRIOS COMUNS
// -----------------------------------------------------------------------------

/**
 * Schema para endereço completo
 */
export const AddressSchema = z.object({
  zipCode: CepSchema,
  street: z.string().min(2).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().length(2).toUpperCase(),
});
export type Address = z.infer<typeof AddressSchema>;

/**
 * Schema para dados bancários
 */
export const BankAccountSchema = z.object({
  bank: z.string().min(2).max(100),
  agency: z.string().min(1).max(20),
  account: z.string().min(1).max(20),
  type: z.enum(['checking', 'savings']),
  pixKey: z.string().max(100).optional(),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

/**
 * Schema para anexo/arquivo
 */
export const AttachmentSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  url: z.string().url(),
  mimeType: z.string(),
  size: z.number().positive(),
  uploadedAt: DateTimeSchema,
  uploadedBy: UUIDSchema,
});
export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Schema para histórico de workflow/status
 */
export const WorkflowHistorySchema = z.object({
  id: UUIDSchema,
  fromStatus: z.string().optional(),
  toStatus: z.string(),
  comment: z.string().optional(),
  userId: UUIDSchema,
  userName: z.string(),
  createdAt: DateTimeSchema,
});
export type WorkflowHistory = z.infer<typeof WorkflowHistorySchema>;

// -----------------------------------------------------------------------------
// VALIDADORES ESPECÍFICOS POR MÓDULO
// -----------------------------------------------------------------------------

/**
 * DFD - Documento de Formalização de Demanda
 */
export const CreateDfdSchema = DFDSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  attachments: true,
  workflowHistory: true,
  approvedAt: true,
  approvedBy: true,
}).extend({
  attachments: z.array(AttachmentSchema).default([]),
});
export type CreateDfd = z.infer<typeof CreateDfdSchema>;

export const UpdateDfdSchema = CreateDfdSchema.partial();
export type UpdateDfd = z.infer<typeof UpdateDfdSchema>;

export const DfdStatusTransitionSchema = z.object({
  dfdId: UUIDSchema,
  newStatus: z.enum(['submitted', 'under_review', 'approved', 'rejected', 'returned', 'cancelled']),
  comment: z.string().max(2000).optional(),
});
export type DfdStatusTransition = z.infer<typeof DfdStatusTransitionSchema>;

/**
 * ETP - Estudo Técnico Preliminar
 */
export const CreateEtpSchema = z.object({
  tenantId: UUIDSchema,
  dfdId: UUIDSchema,
  title: z.string().min(5).max(200),
  problemDescription: z.string().min(20).max(10000),
  solutionDescription: z.string().min(20).max(10000),
  requirements: z.array(z.object({
    description: z.string().min(5).max(500),
    type: z.enum(['functional', 'non_functional', 'technical', 'legal', 'security']),
    priority: z.enum(['mandatory', 'desirable', 'optional']),
    acceptanceCriteria: z.string().max(1000).optional(),
  })).min(1),
  estimatedValue: CurrencySchema,
  marketResearch: z.string().max(10000).optional(),
  risks: z.array(RiskSchema).default([]),
  alternatives: z.array(z.object({
    description: z.string(),
    estimatedValue: CurrencySchema,
    pros: z.string().optional(),
    cons: z.string().optional(),
  })).default([]),
  status: ETPStatusSchema.default('draft'),
  attachments: z.array(AttachmentSchema).default([]),
});
export type CreateEtp = z.infer<typeof CreateEtpSchema>;

/**
 * Análise de Risco
 */
export const CreateRiskAnalysisSchema = z.object({
  tenantId: UUIDSchema,
  relatedEntityId: UUIDSchema,
  relatedEntityType: z.enum(['dfd', 'etp', 'bidding', 'contract']),
  risks: z.array(RiskSchema.extend({
    category: z.enum(['technical', 'financial', 'legal', 'operational', 'reputational', 'security', 'environmental']),
    status: z.enum(['identified', 'analyzed', 'mitigated', 'monitored', 'closed']),
  })).min(1),
  overallRiskLevel: z.enum(['very_low', 'low', 'medium', 'high', 'very_high', 'critical']),
  mitigationPlan: z.string().max(10000).optional(),
});
export type CreateRiskAnalysis = z.infer<typeof CreateRiskAnalysisSchema>;

/**
 * Licitação / Modalidades
 */
export const CreateBiddingSchema = BiddingSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type CreateBidding = z.infer<typeof CreateBiddingSchema>;

export const BiddingSessionSchema = z.object({
  biddingId: UUIDSchema,
  sessionDate: DateTimeSchema,
  sessionLocation: z.string().max(500).optional(),
  platformUrl: z.string().url().optional(),
  items: z.array(z.object({
    itemId: UUIDSchema,
    description: z.string(),
    quantity: z.number().positive().multipleOf(0.001),
    unit: z.string(),
    estimatedUnitPrice: CurrencySchema,
    estimatedTotalPrice: CurrencySchema,
  })).min(1),
});
export type BiddingSession = z.infer<typeof BiddingSessionSchema>;

/**
 * Dispensa de Licitação
 */
export const CreateDispensaSchema = z.object({
  tenantId: UUIDSchema,
  number: z.string().max(50),
  year: z.number().int().min(2020).max(2099),
  modality: z.literal('dispensa'),
  subType: z.enum(['valor', 'emergencia', 'seguranca', 'doacao', 'concessao', 'permissao', 'locacao', 'remuneracao', 'intercambio', 'pesquisa']),
  legalBasis: z.string().max(500),
  objectDescription: z.string().min(10).max(10000),
  estimatedValue: CurrencySchema,
  justification: z.string().min(20).max(10000),
  supplierId: UUIDSchema.optional(),
  ratificationAuthorityId: UUIDSchema,
  authorizationAuthorityId: UUIDSchema,
  attachments: z.array(AttachmentSchema).default([]),
});
export type CreateDispensa = z.infer<typeof CreateDispensaSchema>;

/**
 * Inexigibilidade de Licitação
 */
export const CreateInexigibilidadeSchema = z.object({
  tenantId: UUIDSchema,
  number: z.string().max(50),
  year: z.number().int().min(2020).max(2099),
  modality: z.literal('inexigibilidade'),
  subType: z.enum(['unico_fornecedor', 'profissional_especializado', 'exclusividade', 'patente']),
  legalBasis: z.string().max(500),
  objectDescription: z.string().min(10).max(10000),
  estimatedValue: CurrencySchema,
  justification: z.string().min(20).max(10000),
  supplierId: UUIDSchema,
  ratificationAuthorityId: UUIDSchema,
  authorizationAuthorityId: UUIDSchema,
  exclusivityProof: z.string().max(10000),
  attachments: z.array(AttachmentSchema).default([]),
});
export type CreateInexigibilidade = z.infer<typeof CreateInexigibilidadeSchema>;

/**
 * Contrato
 */
export const CreateContractSchema = ContractSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  signedAt: true,
  signedBy: true,
});
export type CreateContract = z.infer<typeof CreateContractSchema>;

export const ContractAddendumCreateSchema = ContractAddendumSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  signedAt: true,
  signedBy: true,
});
export type ContractAddendumCreate = z.infer<typeof ContractAddendumCreateSchema>;

/**
 * Pedido de Compra
 */
export const CreatePurchaseOrderSchema = PurchaseOrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  empenhoNumber: true,
  empenhoDate: true,
  status: true,
});
export type CreatePurchaseOrder = z.infer<typeof CreatePurchaseOrderSchema>;

/**
 * Fornecedor
 */
export const CreateSupplierSchema = SupplierSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  certifications: true,
}).extend({
  certifications: z.array(z.object({
    name: z.string().min(2).max(200),
    issuer: z.string().min(2).max(200),
    validUntil: DateSchema,
    fileUrl: z.string().url().optional(),
  })).default([]),
});
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;

/**
 * Item / Catálogo
 */
export const CreateItemSchema = ItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type CreateItem = z.infer<typeof CreateItemSchema>;

/**
 * Órgão / Secretaria
 */
export const CreateOrganSchema = OrganSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type CreateOrgan = z.infer<typeof CreateOrganSchema>;

/**
 * Usuário - Criação por Admin
 */
export const CreateUserByAdminSchema = CreateUserSchema.extend({
  tenantId: UUIDSchema.nullable(),
  role: z.enum(['tenant_admin', 'tenant_manager', 'tenant_operator', 'tenant_viewer', 'supplier']),
  sendInvitationEmail: z.boolean().default(true),
});
export type CreateUserByAdmin = z.infer<typeof CreateUserByAdminSchema>;

/**
 * Alteração de senha
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve conter: maiúscula, minúscula, número e caractere especial',
  }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Nova senha e confirmação não conferem',
  path: ['confirmNewPassword'],
});
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;

/**
 * Recuperação de senha
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Senhas não conferem',
  path: ['confirmNewPassword'],
});
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;

/**
 * Configuração de 2FA
 */
export const SetupTwoFactorSchema = z.object({
  code: z.string().length(6),
  secret: z.string().optional(),
});
export type SetupTwoFactor = z.infer<typeof SetupTwoFactorSchema>;

export const VerifyTwoFactorSchema = z.object({
  code: z.string().length(6),
});
export type VerifyTwoFactor = z.infer<typeof VerifyTwoFactorSchema>;

// -----------------------------------------------------------------------------
// VALIDADORES DE QUERY PARAMS (API)
// -----------------------------------------------------------------------------

export const ListQuerySchema = PaginationSchema.extend({
  search: z.string().max(200).optional(),
  status: z.string().optional(),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  organId: UUIDSchema.optional(),
  supplierId: UUIDSchema.optional(),
  modality: z.string().optional(),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

export const ReportQuerySchema = z.object({
  type: z.enum([
    'dfd_list', 'etp_list', 'bidding_list', 'contract_list',
    'purchase_order_list', 'supplier_list', 'execution_financial',
    'contract_expiration', 'bidding_timeline', 'supplier_performance',
    'organ_execution', 'custom'
  ]),
  format: z.enum(['pdf', 'excel', 'csv', 'json']).default('pdf'),
  startDate: DateSchema,
  endDate: DateSchema,
  organIds: z.array(UUIDSchema).optional(),
  supplierIds: z.array(UUIDSchema).optional(),
  modalities: z.array(z.string()).optional(),
  statuses: z.array(z.string()).optional(),
  groupBy: z.string().optional(),
  includeCharts: z.boolean().default(true),
});
export type ReportQuery = z.infer<typeof ReportQuerySchema>;

// -----------------------------------------------------------------------------
// VALIDADORES DE IMPORTAÇÃO/EXPORTAÇÃO
// -----------------------------------------------------------------------------

export const ImportConfigSchema = z.object({
  entity: z.enum(['suppliers', 'items', 'organs', 'users']),
  file: z.instanceof(File).optional(),
  filePath: z.string().optional(),
  delimiter: z.enum([',', ';', '\t']).default(','),
  encoding: z.enum(['utf-8', 'latin1', 'utf-16']).default('utf-8'),
  hasHeader: z.boolean().default(true),
  skipErrors: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});
export type ImportConfig = z.infer<typeof ImportConfigSchema>;

export const ExportConfigSchema = z.object({
  entity: z.enum(['suppliers', 'items', 'organs', 'users', 'contracts', 'purchase_orders', 'biddings', 'dfds']),
  format: z.enum(['excel', 'csv', 'pdf', 'json']).default('excel'),
  filters: z.record(z.unknown()).optional(),
  fields: z.array(z.string()).optional(),
  includeHeaders: z.boolean().default(true),
  dateRange: z.object({
    start: DateSchema.optional(),
    end: DateSchema.optional(),
    field: z.string().default('createdAt'),
  }).optional(),
});
export type ExportConfig = z.infer<typeof ExportConfigSchema>;

// -----------------------------------------------------------------------------
// HELPERS DE VALIDAÇÃO
// -----------------------------------------------------------------------------

/**
 * Cria schema de validação para IDs UUID (parâmetro de rota)
 */
export const UuidParamSchema = z.object({
  id: UUIDSchema,
});

/**
 * Cria schema de validação para tenantId (header ou parâmetro)
 */
export const TenantContextSchema = z.object({
  tenantId: UUIDSchema,
});

/**
 * Valida e sanitiza string (remove scripts, limita tamanho)
 */
export const SanitizedStringSchema = (maxLength: number = 1000) =>
  z.string().max(maxLength).transform(val =>
    val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  );

/**
 * Schema para validação de arquivos de upload
 */
export const UploadFileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string().refine(
    (type) => UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(type),
    { message: 'Tipo de arquivo não permitido' }
  ),
  size: z.number().max(UPLOAD_CONFIG.MAX_FILE_SIZE, { message: 'Arquivo muito grande (máx. 50MB)' }),
  buffer: z.instanceof(Buffer).optional(),
  path: z.string().optional(),
});
export type UploadFile = z.infer<typeof UploadFileSchema>;