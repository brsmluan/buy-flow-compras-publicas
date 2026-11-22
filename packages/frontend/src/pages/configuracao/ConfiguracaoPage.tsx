// =============================================================================
// BUY-FLOW FRONTEND - Configuração Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { LoadingSpinner, PageLoader } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Settings, Plus, Save, RefreshCw, Shield, Bell, Palette, Globe, Key, Users, ShieldCheck, Save as SaveIcon, RefreshCw as RefreshIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../../lib/utils';

interface SystemConfig {
  key: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

interface TenantSettings {
  legalValuesVersion: string;
  allowSupplierPortal: boolean;
  requireTwoFactor: boolean;
  primaryColor: string;
  logoUrl: string | null;
  customDomain: string | null;
}

export function ConfiguracaoPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'security' | 'notifications' | 'integrations'>('general');
  const [saving, setSaving] = useState(false);

  // General settings
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [tenantCnpj, setTenantCnpj] = useState('');
  const [allowSupplierPortal, setAllowSupplierPortal] = useState(true);
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);
  const [legalValuesVersion, setLegalValuesVersion] = useState('2024.1');

  // Appearance settings
  const [primaryColor, setPrimaryColor] = useState('#1e40af');
  const [logoUrl, setLogoUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  // Security settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Integration settings
  const [pncpEnabled, setPncpEnabled] = useState(false);
  const [pncpClientId, setPncpClientId] = useState('');
  const [pncpClientSecret, setPncpClientSecret] = useState('');
  const [govbrEnabled, setGovbrEnabled] = useState(false);
  const [govbrClientId, setGovbrClientId] = useState('');
  const [govbrClientSecret, setGovbrClientSecret] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Integration settings
  const [pncpEnabled, setPncpEnabled] = useState(false);
  const [pncpClientId, setPncpClientId] = useState('');
  const [pncpClientSecret, setPncpClientSecret] = useState('');
  const [govbrEnabled, setGovbrEnabled] = useState(false);
  const [govbrClientId, setGovbrClientId] = useState('');
  const [govbrClientSecret, setGovbrClientSecret] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/configuracao');
      const configs = response.data;

      configs.forEach((config: any) => {
        switch (config.key) {
          case 'tenant_name':
            setTenantName(config.value);
            break;
          case 'tenant_slug':
            setTenantSlug(config.value);
            break;
          case 'tenant_cnpj':
            setTenantCnpj(config.value);
            break;
          case 'allow_supplier_portal':
            setAllowSupplierPortal(config.value);
            break;
          case 'require_two_factor':
            setRequireTwoFactor(config.value);
            break;
          case 'legal_values_version':
            setLegalValuesVersion(config.value);
            break;
          case 'primary_color':
            setPrimaryColor(config.value);
            break;
          case 'logo_url':
            setLogoUrl(config.value);
            break;
          case 'custom_domain':
            setCustomDomain(config.value);
            break;
          case 'pncp_enabled':
            setPncpEnabled(config.value);
            break;
          case 'pncp_client_id':
            setPncpClientId(config.value);
            break;
          case 'pncp_client_secret':
            setPncpClientSecret(config.value);
            break;
          case 'govbr_enabled':
            setGovbrEnabled(config.value);
            break;
          case 'govbr_client_id':
            setGovbrClientId(config.value);
            break;
          case 'govbr_client_secret':
            setGovbrClientSecret(config.value);
            break;
          case 'email_notifications':
            setEmailNotifications(config.value);
            break;
          case 'sms_notifications':
            setSmsNotifications(config.value);
            break;
          case 'push_notifications':
            setPushNotifications(config.value);
            break;
          case 'two_factor_enabled':
            setTwoFactorEnabled(config.value);
            break;
          case 'two_factor_secret':
            setTwoFactorSecret(config.value);
            break;
          case 'legal_values_version':
            setLegalValuesVersion(config.value);
            break;
        }
      });
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const configs = [
        { key: 'tenant_name', value: tenantName },
        { key: 'tenant_slug', value: tenantSlug },
        { key: 'tenant_cnpj', value: tenantCnpj },
        { key: 'allow_supplier_portal', value: allowSupplierPortal },
        { key: 'require_two_factor', value: requireTwoFactor },
        { key: 'legal_values_version', value: legalValuesVersion },
        { key: 'primary_color', value: primaryColor },
        { key: 'logo_url', value: logoUrl },
        { key: 'custom_domain', value: customDomain },
        { key: 'pncp_enabled', value: pncpEnabled },
        { key: 'pncp_client_id', value: pncpClientId },
        { key: 'pncp_client_secret', value: pncpClientSecret },
        { key: 'govbr_enabled', value: govbrEnabled },
        { key: 'govbr_client_id', value: govbrClientId },
        { key: 'govbr_client_secret', value: govbrClientSecret },
        { key: 'email_notifications', value: emailNotifications },
        { key: 'sms_notifications', value: smsNotifications },
        { key: 'push_notifications', value: pushNotifications },
        { key: 'two_factor_enabled', value: twoFactorEnabled },
        { key: 'two_factor_secret', value: twoFactorSecret },
        { key: 'legal_values_version', value: legalValuesVersion },
      ];

      for (const config of configs) {
        await apiPost('/configuracao', { key: config.key, value: config.value });
      }

      toast.success('Configurações salvas com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Nova senha e confirmação não conferem');
      return;
    }

    try {
      await apiPost('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      toast.success('Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao alterar senha');
    }
  };

  const setupTwoFactor = async () => {
    try {
      const response = await apiPost('/auth/2fa/setup');
      setTwoFactorSecret(response.data.data.secret);
    } catch (error: any) {
      toast.error('Erro ao configurar 2FA');
    }
  };

  const verifyTwoFactor = async () => {
    try {
      await apiPost('/auth/2fa/verify', { code: twoFactorSecret });
      setTwoFactorEnabled(true);
      toast.success('2FA ativado com sucesso');
    } catch (error: any) {
      toast.error('Código inválido');
    }
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'integrations', label: 'Integrações', icon: Globe },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuração</h1>
          <p className="text-muted-foreground mt-1">Configurações do sistema e da prefeitura</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
          <SaveIcon className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="h-fit sticky top-6">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Prefeitura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tenant_name">Nome da Prefeitura</Label>
                      <Input
                        id="tenant_name"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="Prefeitura Municipal de..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenant_slug">Slug (URL)</Label>
                      <Input
                        id="tenant_slug"
                        value={tenantSlug}
                        onChange={(e) => setTenantSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder="minha-prefeitura"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenant_cnpj">CNPJ</Label>
                      <Input
                        id="tenant_cnpj"
                        value={tenantCnpj}
                        onChange={(e) => setTenantCnpj(e.target.value.replace(/\D/g, ''))}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_values_version">Versão Valores Legais</Label>
                      <Input
                        id="legal_values_version"
                        value={legalValuesVersion}
                        onChange={(e) => setLegalValuesVersion(e.target.value)}
                        placeholder="2024.1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Configurações Gerais</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allowSupplierPortal}
                          onChange={(e) => setAllowSupplierPortal(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Permitir Portal do Fornecedor</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={requireTwoFactor}
                          onChange={(e) => setRequireTwoFactor(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Exigir 2FA para todos os usuários</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Cor Primária</Label>
                      <div className="flex items-center gap-4">
                        <input
                          id="primary_color"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#1e40af"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">URL do Logo</Label>
                      <Input
                        id="logo_url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom_domain">Domínio Personalizado</Label>
                      <Input
                        id="custom_domain"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="compras.minhaprefeitura.gov.br"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Senha Atual</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password">Nova Senha</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <Button onClick={changePassword} className="w-full sm:w-auto">
                      <Key className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Autenticação de Dois Fatores</h4>
                        <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança à sua conta</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={twoFactorEnabled}
                          onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    {!twoFactorEnabled && (
                      <Button onClick={setupTwoFactor} variant="outline">
                        <Shield className="w-4 h-4 mr-2" />
                        Configurar 2FA
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Senha Atual</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password">Nova Senha</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <Button onClick={changePassword} className="w-full sm:w-auto">
                      <Key className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações por Email</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <label className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações por SMS</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações por SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsNotifications}
                          onChange={(e) => setSmsNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </label>
                    <label className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações Push</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações no navegador</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pushNotifications}
                          onChange={(e) => setPushNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>PNCP (Portal Nacional de Contratações Públicas)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Integração PNCP</h4>
                        <p className="text-sm text-muted-foreground">Publicação automática de licitações e contratos no PNCP</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pncpEnabled}
                          onChange={(e) => setPncpEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pncp_client_id">Client ID</Label>
                        <Input
                          id="pncp_client_id"
                          value={pncpClientId}
                          onChange={(e) => setPncpClientId(e.target.value)}
                          placeholder="client_id"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pncp_client_secret">Client Secret</Label>
                        <Input
                          id="pncp_client_secret"
                          type="password"
                          value={pncpClientSecret}
                          onChange={(e) => setPncpClientSecret(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>GOV.BR (Login único + Assinatura Digital)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Integração GOV.BR</h4>
                        <p className="text-sm text-muted-foreground">Login único e assinatura digital ICP-Brasil</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={govbrEnabled}
                          onChange={(e) => setGovbrEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="govbr_client_id">Client ID</Label>
                        <Input
                          id="govbr_client_id"
                          value={govbrClientId}
                          onChange={(e) => setGovbrClientId(e.target.value)}
                          placeholder="client_id"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="govbr_client_secret">Client Secret</Label>
                        <Input
                          id="govbr_client_secret"
                          type="password"
                          value={govbrClientSecret}
                          onChange={(e) => setGovbrClientSecret(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { apiPost, apiDelete, apiGet, apiPatch } from '../../lib/api';
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, Shield, Bell, Palette, Globe, Key, Users, ShieldCheck, Save, RefreshCw, Palette, Globe, Key, Users, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';