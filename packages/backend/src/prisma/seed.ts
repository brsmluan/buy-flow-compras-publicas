// =============================================================================
// BUY-FLOW BACKEND - Database Seed (Development)
// =============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (apenas dev)
  if (process.env.NODE_ENV === 'development') {
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.tenantInvitation.deleteMany();
    await prisma.systemConfig.deleteMany();
    await prisma.report.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.contractAddendum.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.ata.deleteMany();
    await prisma.chamadaPublica.deleteMany();
    await prisma.credenciamento.deleteMany();
    await prisma.inexigibilidade.deleteMany();
    await prisma.dispensa.deleteMany();
    await prisma.bidding.deleteMany();
    await prisma.riskAnalysis.deleteMany();
    await prisma.etp.deleteMany();
    await prisma.dfd.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.item.deleteMany();
    await prisma.itemCategory.deleteMany();
    await prisma.organ.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.emailLog.deleteMany();
    console.log('🧹 Dados anteriores removidos');
  }

  // =========================================================================
  // TENANT PLATFORM (Owner)
  // =========================================================================
  const platformTenant = await prisma.tenant.create({
    data: {
      name: 'Buy-Flow Platform',
      slug: 'platform',
      cnpj: '00000000000000',
      state: 'DF',
      city: 'Brasília',
      status: 'active',
      plan: 'enterprise',
      primaryColor: '#1e40af',
      settings: { legalValuesVersion: '2024.1', allowSupplierPortal: true, requireTwoFactor: false },
    },
  });
  console.log('✅ Tenant Platform criado');

  // =========================================================================
  // TENANT BOA NOVA/BA (Primeiro cliente)
  // =========================================================================
  const boaNovaTenant = await prisma.tenant.create({
    data: {
      name: 'Prefeitura Municipal de Boa Nova',
      slug: 'boa-nova-ba',
      cnpj: '12345678000190',
      state: 'BA',
      city: 'Boa Nova',
      status: 'active',
      plan: 'professional',
      primaryColor: '#059669',
      settings: { legalValuesVersion: '2024.1', allowSupplierPortal: true, requireTwoFactor: true },
    },
  });
  console.log('✅ Tenant Boa Nova/BA criado');

  // =========================================================================
  // USUÁRIOS
  // =========================================================================
  const passwordHash = await bcrypt.hash('BuyFlow@2024!', 12);

  // Platform Owner (Você)
  const platformOwner = await prisma.user.create({
    data: {
      email: 'owner@buyflow.app',
      passwordHash,
      name: 'Platform Owner',
      cpf: '12345678901',
      role: 'platform_owner',
      status: 'active',
      tenantId: platformTenant.id,
      permissions: ['*'],
      passwordChangedAt: new Date(),
      twoFactorEnabled: false,
    },
  });
  console.log('✅ Platform Owner criado');

  // Platform Admin
  await prisma.user.create({
    data: {
      email: 'admin@buyflow.app',
      passwordHash,
      name: 'Platform Admin',
      role: 'platform_admin',
      status: 'active',
      tenantId: platformTenant.id,
      permissions: ['tenant:*', 'user:read', 'user:update', 'billing:*', 'logs:read', 'metrics:read'],
      passwordChangedAt: new Date(),
    },
  });
  console.log('✅ Platform Admin criado');

  // Tenant Admin - Boa Nova
  const tenantAdmin = await prisma.user.create({
    data: {
      email: 'admin@boa-nova.buyflow.app',
      passwordHash,
      name: 'Administrador Boa Nova',
      cpf: '98765432100',
      role: 'tenant_admin',
      status: 'active',
      tenantId: boaNovaTenant.id,
      permissions: [
        'tenant:read', 'tenant:update', 'user:*', 'permission:*', 'configuracao:*',
        'relatorios:*', 'cadastros:*', 'planejar:*', 'solicitar:*', 'cotar:*',
        'contratar:*', 'comprar:*',
      ],
      passwordChangedAt: new Date(),
      twoFactorEnabled: true,
    },
  });
  console.log('✅ Tenant Admin (Boa Nova) criado');

  // Tenant Manager - Secretário de Administração
  await prisma.user.create({
    data: {
      email: 'sec.adm@boa-nova.buyflow.app',
      passwordHash,
      name: 'Secretário de Administração',
      role: 'tenant_manager',
      status: 'active',
      tenantId: boaNovaTenant.id,
      permissions: [
        'user:read', 'user:create', 'user:update', 'relatorios:*', 'cadastros:*',
        'planejar:*', 'solicitar:*', 'cotar:*', 'contratar:*', 'comprar:*',
      ],
      passwordChangedAt: new Date(),
    },
  });

  // Tenant Operator - Pregoeiro
  await prisma.user.create({
    data: {
      email: 'pregoeiro@boa-nova.buyflow.app',
      passwordHash,
      name: 'Pregoeiro Oficial',
      role: 'tenant_operator',
      status: 'active',
      tenantId: boaNovaTenant.id,
      permissions: [
        'relatorios:read', 'cadastros:read', 'planejar:create', 'planejar:read',
        'planejar:update', 'solicitar:*', 'cotar:*', 'contratar:read',
        'contratar:create', 'contratar:update', 'comprar:*',
      ],
      passwordChangedAt: new Date(),
    },
  });

  // Tenant Viewer - Vereador/Auditoria
  await prisma.user.create({
    data: {
      email: 'vereador@boa-nova.buyflow.app',
      passwordHash,
      name: 'Vereador Fiscal',
      role: 'tenant_viewer',
      status: 'active',
      tenantId: boaNovaTenant.id,
      permissions: [
        'relatorios:read', 'cadastros:read', 'planejar:read', 'solicitar:read',
        'cotar:read', 'contratar:read', 'comprar:read',
      ],
      passwordChangedAt: new Date(),
    },
  });
  console.log('✅ Usuários do tenant Boa Nova criados');

  // =========================================================================
  // ÓRGÃOS (Secretarias/Fundos)
  // =========================================================================
  const orgaos = await Promise.all([
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'SEDUC',
        name: 'Secretaria Municipal de Educação',
        acronym: 'SEDUC',
        type: 'secretaria',
        budgetCode: '04.01',
        managerId: tenantAdmin.id,
        email: 'seduc@boanova.ba.gov.br',
        phone: '(77) 3434-1234',
      },
    }),
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'FME',
        name: 'Fundo Municipal de Educação',
        acronym: 'FME',
        type: 'fundo',
        parentId: (await prisma.organ.findFirst({ where: { tenantId: boaNovaTenant.id, code: 'SEDUC' } }))?.id,
        budgetCode: '04.01.01',
        email: 'fme@boanova.ba.gov.br',
      },
    }),
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'SMS',
        name: 'Secretaria Municipal de Saúde',
        acronym: 'SMS',
        type: 'secretaria',
        budgetCode: '04.02',
        managerId: tenantAdmin.id,
        email: 'sms@boanova.ba.gov.br',
        phone: '(77) 3434-5678',
      },
    }),
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'FMS',
        name: 'Fundo Municipal de Saúde de Boa Nova',
        acronym: 'FMS',
        type: 'fundo',
        parentId: (await prisma.organ.findFirst({ where: { tenantId: boaNovaTenant.id, code: 'SMS' } }))?.id,
        budgetCode: '04.02.01',
        email: 'fms@boanova.ba.gov.br',
      },
    }),
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'SEADM',
        name: 'Secretaria Municipal de Administração',
        acronym: 'SEADM',
        type: 'secretaria',
        budgetCode: '04.03',
        managerId: tenantAdmin.id,
        email: 'seadm@boanova.ba.gov.br',
        phone: '(77) 3434-9012',
      },
    }),
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'FAS',
        name: 'Fundo Municipal de Assistência Social de Boa Nova',
        acronym: 'FAS',
        type: 'fundo',
        budgetCode: '04.04',
        email: 'fas@boanova.ba.gov.br',
      },
    }),
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'SECULT',
        name: 'Secretaria Municipal de Cultura, Esporte e Lazer',
        acronym: 'SECULT',
        type: 'secretaria',
        budgetCode: '04.05',
        email: 'secult@boanova.ba.gov.br',
      },
    }),
    prisma.organ.create({
      data: {
        tenantId: boaNovaTenant.id,
        code: 'SEOBRAS',
        name: 'Secretaria de Obras e Ação',
        acronym: 'SEOBRAS',
        type: 'secretaria',
        budgetCode: '04.06',
        email: 'seobras@boanova.ba.gov.br',
      },
    }),
  ]);
  console.log('✅ Órgãos criados');

  // =========================================================================
  // CATEGORIAS DE ITENS (CATMAT/CATSER simplificado)
  // =========================================================================
  const categorias = await Promise.all([
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '01', name: 'Material de Expediente', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '02', name: 'Material de Informática', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '03', name: 'Medicamentos e Insumos Hospitalares', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '04', name: 'Combustíveis e Lubrificantes', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '05', name: 'Material de Limpeza e Conservação', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '06', name: 'Equipamentos de Proteção Individual (EPI)', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '10', name: 'Serviços de Limpeza e Conservação', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '11', name: 'Serviços de Manutenção', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '12', name: 'Serviços de Tecnologia da Informação', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '13', name: 'Serviços de Engenharia', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '14', name: 'Serviços de Transporte', isActive: true } }),
    prisma.itemCategory.create({ data: { tenantId: boaNovaTenant.id, code: '15', name: 'Serviços de Vigilância e Segurança', isActive: true } }),
  ]);
  console.log('✅ Categorias de itens criadas');

  // =========================================================================
  // ITENS DE EXEMPLO
  // =========================================================================
  const catMaterial = categorias.find(c => c.code === '01')!;
  const catInformatica = categorias.find(c => c.code === '02')!;
  const catMedicamentos = categorias.find(c => c.code === '03')!;
  const catCombustiveis = categorias.find(c => c.code === '04')!;

  await Promise.all([
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catMaterial.id, code: '01001', name: 'Papel A4 75g/m² - Caixa c/ 5000 folhas', unit: 'CX', referencePrice: 85.00, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catMaterial.id, code: '01002', name: 'Papel A3 75g/m² - Caixa c/ 2500 folhas', unit: 'CX', referencePrice: 95.00, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catMaterial.id, code: '01003', name: 'Caneta Esferográfica Azul - Cx c/ 50 unid', unit: 'CX', referencePrice: 45.00, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catInformatica.id, code: '02001', name: 'Notebook Intel Core i5 8GB RAM 256GB SSD', unit: 'UN', referencePrice: 3500.00, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catInformatica.id, code: '02002', name: 'Desktop Intel Core i5 8GB RAM 1TB HD', unit: 'UN', referencePrice: 2800.00, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catMedicamentos.id, code: '03001', name: 'Dipirona Sódica 500mg/ml - Ampola 2ml', unit: 'UN', referencePrice: 2.50, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catMedicamentos.id, code: '03002', name: 'Amoxicilina 500mg - Caixa c/ 21 cápsulas', unit: 'CX', referencePrice: 18.00, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catCombustiveis.id, code: '04001', name: 'Gasolina Comum', unit: 'LT', referencePrice: 5.80, isActive: true } }),
    prisma.item.create({ data: { tenantId: boaNovaTenant.id, categoryId: catCombustiveis.id, code: '04002', name: 'Óleo Diesel S10', unit: 'LT', referencePrice: 5.90, isActive: true } }),
  ]);
  console.log('✅ Itens de exemplo criados');

  // =========================================================================
  // FORNECEDORES DE EXEMPLO
  // =========================================================================
  await Promise.all([
    prisma.supplier.create({
      data: {
        tenantId: boaNovaTenant.id,
        type: 'pj',
        name: 'Papelaria Boa Nova Ltda',
        tradeName: 'Papelaria Central',
        cnpjCpf: '11222333000144',
        email: 'vendas@papelariacentral.com.br',
        phone: '(77) 3434-1111',
        address: { zipCode: '45230000', street: 'Rua Principal', number: '100', neighborhood: 'Centro', city: 'Boa Nova', state: 'BA' },
        categories: [catMaterial.id, catInformatica.id],
        status: 'active',
        bankAccount: { bank: 'Banco do Brasil', agency: '1234', account: '56789-0', type: 'checking', pixKey: 'cnpj@papelariacentral.com.br' },
      },
    }),
    prisma.supplier.create({
      data: {
        tenantId: boaNovaTenant.id,
        type: 'pj',
        name: 'Medfarma Distribuidora de Medicamentos Ltda',
        tradeName: 'Medfarma',
        cnpjCpf: '22333444000155',
        email: 'comercial@medfarma.com.br',
        phone: '(77) 3434-2222',
        address: { zipCode: '45230000', street: 'Av. das Nações', number: '500', neighborhood: 'Centro', city: 'Boa Nova', state: 'BA' },
        categories: [catMedicamentos.id],
        status: 'active',
        bankAccount: { bank: 'Caixa Econômica Federal', agency: '5678', account: '90123-4', type: 'checking', pixKey: 'cnpj@medfarma.com.br' },
      },
    }),
    prisma.supplier.create({
      data: {
        tenantId: boaNovaTenant.id,
        type: 'pj',
        name: 'Postos Irmãos Combustíveis Ltda',
        tradeName: 'Postos Irmãos',
        cnpjCpf: '33444555000166',
        email: 'vendas@postosirmaos.com.br',
        phone: '(77) 3434-3333',
        address: { zipCode: '45230000', street: 'BR-116', number: 'Km 450', neighborhood: 'Zona Rural', city: 'Boa Nova', state: 'BA' },
        categories: [catCombustiveis.id],
        status: 'active',
        bankAccount: { bank: 'Banco do Nordeste', agency: '9012', account: '34567-8', type: 'checking', pixKey: 'cnpj@postosirmaos.com.br' },
      },
    }),
  ]);
  console.log('✅ Fornecedores de exemplo criados');

  // =========================================================================
  // CONFIGURAÇÕES DO SISTEMA
  // =========================================================================
  await prisma.systemConfig.createMany({
    data: [
      { tenantId: null, key: 'legal_values_version', value: { version: '2024.1', updatedAt: new Date().toISOString() } },
      { tenantId: null, key: 'dispensa_limits', value: { obra: 176777.00, servicos_comuns: 88388.00 } },
      { tenantId: null, key: 'pncp_enabled', value: { enabled: true, environment: 'homologacao' } },
      { tenantId: null, key: 'govbr_enabled', value: { enabled: false } },
      { tenantId: boaNovaTenant.id, key: 'require_etp_above_value', value: { enabled: true, threshold: 50000 } },
      { tenantId: boaNovaTenant.id, key: 'require_risk_analysis', value: { enabled: true } },
      { tenantId: boaNovaTenant.id, key: 'auto_number_format', value: { dfd: '{year}/{sequential:04d}', bidding: '{modality}/{year}/{sequential:04d}', contract: '{year}/{sequential:04d}', purchaseOrder: '{year}/{sequential:06d}' } },
    ],
  });
  console.log('✅ Configurações do sistema criadas');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Credenciais de acesso (desenvolvimento):');
  console.log('   Platform Owner: owner@buyflow.app / BuyFlow@2024!');
  console.log('   Platform Admin: admin@buyflow.app / BuyFlow@2024!');
  console.log('   Tenant Admin:   admin@boa-nova.buyflow.app / BuyFlow@2024!');
  console.log('   Pregoeiro:      pregoeiro@boa-nova.buyflow.app / BuyFlow@2024!');
  console.log('   Vereador:       vereador@boa-nova.buyflow.app / BuyFlow@2024!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });