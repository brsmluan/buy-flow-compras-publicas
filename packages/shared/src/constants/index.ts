// =============================================================================
// BUY-FLOW SHARED - Constants & Legal References (Lei 14.133/2021)
// =============================================================================

// -----------------------------------------------------------------------------
// VALORES LEGAIS - Lei 14.133/2021 (Atualizados 2024)
// Fonte: Portaria SEGES/ME nº 7.897/2024 e atualizações
// -----------------------------------------------------------------------------

export const LEGAL_VALUES = {
  // Dispensa de Licitação (Art. 75, II)
  DISPENSA: {
    OBRA_SERVICO_ENGENHARIA: 176_777.00,
    OUTROS_SERVICOS_COMPRAS: 88_388.00,
  },

  // Pregão (Art. 28)
  PREGAO: {
    LIMITE_DISPENSA_OBRA: 176_777.00,
    LIMITE_DISPENSA_SERVICO_COMUM: 88_388.00,
  },

  // Emergência/Calamidade (Art. 75, VIII)
  EMERGENCIA: {
    MULTIPLICADOR: 10,
  },

  // Registro de Preços (Art. 82)
  ATA_REGISTRO_PRECOS: {
    VIGENCIA_MAXIMA_MESES: 12,
    PRORROGACAO_MAXIMA_MESES: 12,
  },

  // Contratos (Art. 106)
  CONTRATO: {
    VIGENCIA_MAXIMA_ANOS: 5,
    REAJUSTE_ANUAL: true,
    REPactuACAO_PRAZO_MESES: 18,
  },

  // Aditivos (Art. 124)
  ADITIVO: {
    LIMITE_QUANTITATIVO_PERCENTUAL: 25,
    LIMITE_QUALITATIVO_PERCENTUAL: 50,
    PRAZO_PRORROGACAO_MAXIMO_MESES: 60,
  },

  // Garantias (Art. 96)
  GARANTIA: {
    LIMITE_PERCENTUAL: 10,
    MODALIDADES: ['caucao_dinheiro', 'seguro_garantia', 'fianca_bancaria', 'titulos_publicos'],
  },

  // Sanções (Art. 156)
  SANCOES: {
    ADVERTENCIA: 'advertencia',
    MULTA: 'multa',
    IMPEDIMENTO_LICITAR: 'impedimento_licitar',
    DECLARACAO_INIDONEIDADE: 'declaracao_inidoneidade',
    MULTA_MAXIMA_PERCENTUAL: 30,
    IMPEDIMENTO_MAXIMO_ANOS: 5,
  },

  // Prazos Processuais (Dias úteis)
  PRAZOS: {
    IMPUGNACAO_EDITAL: 5,
    ESCLARECIMENTO: 3,
    RECURSO_ADMINISTRATIVO: 5,
    CONTRARRAZOES: 5,
    HOMOLOGACAO: 10,
    ASSINATURA_CONTRATO: 30,
    PUBLICACAO_PNCP: 2,
    PRESTACAO_CONTAS_TCE: 60,
  },
} as const;

// -----------------------------------------------------------------------------
// MODALIDADES DE LICITAÇÃO (Lei 14.133/2021)
// -----------------------------------------------------------------------------

export const MODALIDADES_LICITACAO = {
  PREGAO_ELETRONICO: {
    code: 'pregao_eletronico',
    name: 'Pregão Eletrônico',
    legalBasis: 'Art. 28, Lei 14.133/2021',
    description: 'Bens e serviços comuns, julgamento por menor preço ou maior desconto',
    requiresElectronicPlatform: true,
    allowsDispute: true,
  },
  PREGAO_PRESENCIAL: {
    code: 'pregao_presencial',
    name: 'Pregão Presencial',
    legalBasis: 'Art. 28, Lei 14.133/2021',
    description: 'Quando não houver condições técnicas para eletrônico',
    requiresElectronicPlatform: false,
    allowsDispute: true,
  },
  CONCORRENCIA: {
    code: 'concorrencia',
    name: 'Concorrência',
    legalBasis: 'Art. 29, Lei 14.133/2021',
    description: 'Obras/serviços especiais, alto valor, técnica e preço',
    requiresElectronicPlatform: false,
    allowsDispute: false,
  },
  CONCURSO: {
    code: 'concurso',
    name: 'Concurso',
    legalBasis: 'Art. 30, Lei 14.133/2021',
    description: 'Projetos, planos, trabalhos técnicos/científicos/artísticos',
    requiresElectronicPlatform: false,
    allowsDispute: false,
  },
  LEILAO: {
    code: 'leilao',
    name: 'Leilão',
    legalBasis: 'Art. 31, Lei 14.133/2021',
    description: 'Venda de bens móveis/imóveis, alienação',
    requiresElectronicPlatform: true,
    allowsDispute: true,
  },
  DISPENSA: {
    code: 'dispensa',
    name: 'Dispensa de Licitação',
    legalBasis: 'Art. 75, Lei 14.133/2021',
    description: 'Valores baixos, emergência, segurança nacional, etc.',
    requiresElectronicPlatform: false,
    allowsDispute: false,
    subTypes: [
      { code: 'valor', name: 'Por Valor', article: 'Art. 75, II' },
      { code: 'emergencia', name: 'Emergência/Calamidade', article: 'Art. 75, VIII' },
      { code: 'seguranca', name: 'Segurança Nacional', article: 'Art. 75, I' },
      { code: 'doacao', name: 'Doação com Encargos', article: 'Art. 75, III' },
      { code: 'concessao', name: 'Concessão de Serviço Público', article: 'Art. 75, IV' },
      { code: 'permissao', name: 'Permissão de Serviço Público', article: 'Art. 75, V' },
      { code: 'locacao', name: 'Locação de Imóvel', article: 'Art. 75, VI' },
      { code: 'remuneracao', name: 'Remuneração de Servidor', article: 'Art. 75, VII' },
      { code: 'intercambio', name: 'Intercâmbio Cultural/Científico', article: 'Art. 75, IX' },
      { code: 'pesquisa', name: 'Pesquisa/Desenvolvimento', article: 'Art. 75, X' },
    ],
  },
  INEXIGIBILIDADE: {
    code: 'inexigibilidade',
    name: 'Inexigibilidade de Licitação',
    legalBasis: 'Art. 74, Lei 14.133/2021',
    description: 'Único fornecedor, profissional especializado, exclusividade',
    requiresElectronicPlatform: false,
    allowsDispute: false,
    subTypes: [
      { code: 'unico_fornecedor', name: 'Único Fornecedor', article: 'Art. 74, I' },
      { code: 'profissional_especializado', name: 'Profissional Especializado', article: 'Art. 74, II' },
      { code: 'exclusividade', name: 'Exclusividade de Fornecedor', article: 'Art. 74, III' },
      { code: 'patente', name: 'Patente/Registro', article: 'Art. 74, IV' },
    ],
  },
  CREDENCIAMENTO: {
    code: 'credenciamento',
    name: 'Credenciamento',
    legalBasis: 'Art. 79, Lei 14.133/2021',
    description: 'Seleção de múltiplos fornecedores para demanda contínua',
    requiresElectronicPlatform: true,
    allowsDispute: false,
  },
  CHAMADA_PUBLICA: {
    code: 'chamada_publica',
    name: 'Chamada Pública',
    legalBasis: 'Art. 29, §3º, Lei 14.133/2021',
    description: 'Parcerias com OSC, seleção de projetos sociais',
    requiresElectronicPlatform: true,
    allowsDispute: false,
  },
  RDC: {
    code: 'rdc',
    name: 'Regime Diferenciado de Contratações (RDC)',
    legalBasis: 'Lei 12.462/2011',
    description: 'Obras/serviços de infraestrutura, programas prioritários',
    requiresElectronicPlatform: true,
    allowsDispute: true,
  },
} as const;

// -----------------------------------------------------------------------------
// TIPOS DE DOCUMENTOS OBRIGATÓRIOS
// -----------------------------------------------------------------------------

export const REQUIRED_DOCUMENTS = {
  FORNECEDOR_PJ: [
    'cnpj',
    'contrato_social_consolidado',
    'cartao_cnpj',
    'certidao_simplificada_junta_comercial',
    'certidao_negativa_debitos_federais',
    'certidao_negativa_debitos_estaduais',
    'certidao_negativa_debitos_municipais',
    'certidao_negativa_fgts',
    'certidao_negativa_trabalhista',
    'certidao_regularidade_fiscal',
    'balanco_patrimonial',
    'demonstrativo_resultados',
  ],
  FORNECEDOR_PF: [
    'cpf',
    'rg',
    'comprovante_residencia',
    'certidao_negativa_debitos_federais',
    'certidao_negativa_trabalhista',
    'certidao_regularidade_fiscal',
  ],
  LICITACAO: [
    'edital',
    'termo_referencia',
    'etp',
    'analise_risco',
    'dfd',
    'minuta_contrato',
    'planilha_orcamentaria',
    'cronograma_fisico_financeiro',
  ],
  CONTRATO: [
    'termo_contrato',
    'termo_referencia',
    'planilha_orcamentaria',
    'cronograma_fisico_financeiro',
    'garantia_contratual',
    'apolice_seguro',
    'procuracao_representante',
  ],
} as const;

// -----------------------------------------------------------------------------
// CATMAT / CATSER - Códigos Principais (Exemplos)
// -----------------------------------------------------------------------------

export const CATMAT_EXAMPLES = [
  { code: '01001', name: 'Material de Expediente', parent: null },
  { code: '0100101', name: 'Papel', parent: '01001' },
  { code: '010010101', name: 'Papel A4', parent: '0100101' },
  { code: '010010102', name: 'Papel A3', parent: '0100101' },
  { code: '01002', name: 'Material de Informática', parent: null },
  { code: '0100201', name: 'Equipamentos', parent: '01002' },
  { code: '010020101', name: 'Computador Desktop', parent: '0100201' },
  { code: '010020102', name: 'Notebook', parent: '0100201' },
  { code: '02001', name: 'Medicamentos', parent: null },
  { code: '0200101', name: 'Antibióticos', parent: '02001' },
  { code: '03001', name: 'Combustíveis e Lubrificantes', parent: null },
  { code: '0300101', name: 'Gasolina', parent: '03001' },
  { code: '0300102', name: 'Óleo Diesel', parent: '03001' },
  { code: '0300103', name: 'Graxas e Lubrificantes', parent: '03001' },
  { code: '04001', name: 'Material de Limpeza', parent: null },
  { code: '05001', name: 'Equipamentos de Proteção Individual (EPI)', parent: null },
] as const;

export const CATSER_EXAMPLES = [
  { code: '10001', name: 'Serviços de Limpeza e Conservação', parent: null },
  { code: '1000101', name: 'Limpeza Predial', parent: '10001' },
  { code: '1000102', name: 'Coleta de Lixo', parent: '10001' },
  { code: '11001', name: 'Serviços de Manutenção', parent: null },
  { code: '1100101', name: 'Manutenção Predial', parent: '11001' },
  { code: '1100102', name: 'Manutenção de Veículos', parent: '11001' },
  { code: '1100103', name: 'Manutenção de Equipamentos', parent: '11001' },
  { code: '12001', name: 'Serviços de Tecnologia da Informação', parent: null },
  { code: '1200101', name: 'Desenvolvimento de Software', parent: '12001' },
  { code: '1200102', name: 'Suporte Técnico', parent: '12001' },
  { code: '1200103', name: 'Hospedagem e Cloud', parent: '12001' },
  { code: '13001', name: 'Serviços de Engenharia', parent: null },
  { code: '1300101', name: 'Projetos de Engenharia', parent: '13001' },
  { code: '1300102', name: 'Fiscalização de Obras', parent: '13001' },
  { code: '14001', name: 'Serviços de Transporte', parent: null },
  { code: '1400101', name: 'Transporte de Passageiros', parent: '14001' },
  { code: '1400102', name: 'Transporte de Cargas', parent: '14001' },
  { code: '15001', name: 'Serviços de Vigilância e Segurança', parent: null },
  { code: '1500101', name: 'Vigilância Patrimonial', parent: '15001' },
  { code: '1500102', name: 'Segurança Pessoal', parent: '15001' },
] as const;

// -----------------------------------------------------------------------------
// UNIDADES DE MEDIDA PADRÃO
// -----------------------------------------------------------------------------

export const UNIDADES_MEDIDA = [
  { code: 'UN', name: 'Unidade', symbol: 'un' },
  { code: 'KG', name: 'Quilograma', symbol: 'kg' },
  { code: 'G', name: 'Grama', symbol: 'g' },
  { code: 'T', name: 'Tonelada', symbol: 't' },
  { code: 'M', name: 'Metro', symbol: 'm' },
  { code: 'CM', name: 'Centímetro', symbol: 'cm' },
  { code: 'MM', name: 'Milímetro', symbol: 'mm' },
  { code: 'KM', name: 'Quilômetro', symbol: 'km' },
  { code: 'M2', name: 'Metro Quadrado', symbol: 'm²' },
  { code: 'M3', name: 'Metro Cúbico', symbol: 'm³' },
  { code: 'LT', name: 'Litro', symbol: 'L' },
  { code: 'ML', name: 'Mililitro', symbol: 'mL' },
  { code: 'PC', name: 'Peça', symbol: 'pc' },
  { code: 'CX', name: 'Caixa', symbol: 'cx' },
  { code: 'PT', name: 'Pacote', symbol: 'pt' },
  { code: 'RO', name: 'Rolo', symbol: 'ro' },
  { code: 'ME', name: 'Metro Linear', symbol: 'ml' },
  { code: 'PR', name: 'Par', symbol: 'pr' },
  { code: 'JG', name: 'Jogo', symbol: 'jg' },
  { code: 'KT', name: 'Kit', symbol: 'kt' },
  { code: 'HR', name: 'Hora', symbol: 'h' },
  { code: 'DI', name: 'Dia', symbol: 'd' },
  { code: 'MS', name: 'Mês', symbol: 'mês' },
  { code: 'AN', name: 'Ano', symbol: 'ano' },
] as const;

// -----------------------------------------------------------------------------
// ESTADOS BRASILEIROS
// -----------------------------------------------------------------------------

export const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
] as const;

// -----------------------------------------------------------------------------
// PERMISSÕES POR MÓDULO (RBAC)
// -----------------------------------------------------------------------------

export const MODULE_PERMISSIONS = {
  planejar: {
    dfd: ['create', 'read', 'update', 'delete', 'approve', 'export'],
    processo_administrativo: ['create', 'read', 'update', 'delete', 'tramitar', 'export'],
    etp: ['create', 'read', 'update', 'delete', 'approve', 'export'],
    analise_risco: ['create', 'read', 'update', 'delete', 'approve', 'export'],
  },
  solicitar: {
    cotacao: ['create', 'read', 'update', 'delete', 'send', 'compare', 'export'],
    termo_referencia: ['create', 'read', 'update', 'delete', 'approve', 'export'],
  },
  cotar: {
    licitacao: ['create', 'read', 'update', 'delete', 'publish', 'session', 'judge', 'homologate', 'export'],
    dispensa: ['create', 'read', 'update', 'delete', 'ratify', 'authorize', 'export'],
    inexigibilidade: ['create', 'read', 'update', 'delete', 'justify', 'ratify', 'authorize', 'export'],
    credenciamento: ['create', 'read', 'update', 'delete', 'publish', 'habilitate', 'export'],
    chamada_publica: ['create', 'read', 'update', 'delete', 'publish', 'select', 'export'],
  },
  contratar: {
    atas: ['create', 'read', 'update', 'delete', 'manage_items', 'renew', 'export'],
    contratos: ['create', 'read', 'update', 'delete', 'addendum', 'sign', 'monitor', 'export'],
    convenios: ['create', 'read', 'update', 'delete', 'manage', 'accountability', 'export'],
    obras: ['create', 'read', 'update', 'delete', 'measurement', 'schedule', 'retention', 'export'],
  },
  comprar: {
    pedidos_compra: ['create', 'read', 'update', 'delete', 'empenho', 'receive', 'invoice', 'pay', 'export'],
    almoxarifado: ['create', 'read', 'update', 'delete', 'stock', 'movement', 'inventory', 'export'],
  },
  cadastros: {
    fornecedores: ['create', 'read', 'update', 'delete', 'habilitate', 'block', 'export'],
    itens: ['create', 'read', 'update', 'delete', 'categorize', 'price', 'export'],
    orgaos: ['create', 'read', 'update', 'delete', 'budget', 'export'],
    usuarios: ['create', 'read', 'update', 'delete', 'permissions', 'roles', 'export'],
  },
  relatorios: {
    all: ['read', 'generate', 'schedule', 'export'],
  },
  configuracao: {
    parametros: ['read', 'update'],
    integracao: ['read', 'update', 'test'],
    templates: ['create', 'read', 'update', 'delete'],
    logs: ['read', 'export'],
  },
} as const;

// -----------------------------------------------------------------------------
// ROLE DEFAULT PERMISSIONS
// -----------------------------------------------------------------------------

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  platform_owner: ['*'],
  platform_admin: [
    'tenant:*',
    'user:read',
    'user:update',
    'billing:*',
    'logs:read',
    'metrics:read',
  ],
  tenant_admin: [
    'tenant:read',
    'tenant:update',
    'user:*',
    'permission:*',
    'configuracao:*',
    'relatorios:*',
    'cadastros:*',
    'planejar:*',
    'solicitar:*',
    'cotar:*',
    'contratar:*',
    'comprar:*',
  ],
  tenant_manager: [
    'user:read',
    'user:create',
    'user:update',
    'relatorios:*',
    'cadastros:*',
    'planejar:*',
    'solicitar:*',
    'cotar:*',
    'contratar:*',
    'comprar:*',
  ],
  tenant_operator: [
    'relatorios:read',
    'cadastros:read',
    'planejar:create',
    'planejar:read',
    'planejar:update',
    'solicitar:*',
    'cotar:*',
    'contratar:read',
    'contratar:create',
    'contratar:update',
    'comprar:*',
  ],
  tenant_viewer: [
    'relatorios:read',
    'cadastros:read',
    'planejar:read',
    'solicitar:read',
    'cotar:read',
    'contratar:read',
    'comprar:read',
  ],
  supplier: [
    'cotacao:read',
    'cotacao:respond',
    'proposta:create',
    'proposta:read',
    'contrato:read',
    'pedido_compra:read',
    'nota_fiscal:create',
    'nota_fiscal:read',
  ],
} as const;

// -----------------------------------------------------------------------------
// CONFIGURAÇÕES DE PAGINAÇÃO PADRÃO
// -----------------------------------------------------------------------------

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  CURSOR_LIMIT: 50,
} as const;

// -----------------------------------------------------------------------------
// CONFIGURAÇÕES DE UPLOAD
// -----------------------------------------------------------------------------

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.csv', '.zip', '.rar'],
} as const;

// -----------------------------------------------------------------------------
// TEMPO DE EXPIRAÇÃO DE TOKENS
// -----------------------------------------------------------------------------

export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
  EMAIL_VERIFICATION: '24h',
  PASSWORD_RESET: '1h',
  TWO_FACTOR: '5m',
  INVITATION: '7d',
} as const;

// -----------------------------------------------------------------------------
// CACHE TTL (Segundos)
// -----------------------------------------------------------------------------

export const CACHE_TTL = {
  TENANT: 300,
  USER: 300,
  PERMISSIONS: 600,
  CATALOG: 3600,
  REPORT: 1800,
  PNCP_SYNC: 86400,
  LEGAL_VALUES: 86400,
} as const;