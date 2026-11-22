// =============================================================================
// BUY-FLOW FRONTEND - Profile Page
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateUserSchema, ChangePasswordSchema, SetupTwoFactorSchema, VerifyTwoFactorSchema, type UpdateUser, type ChangePassword, type SetupTwoFactor, type VerifyTwoFactor } from '@buy-flow/shared/validators/index.js';
import { useAuth } from '../../../contexts/AuthContext';
import { apiPost, apiPatch } from '../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Shield, Camera, Save, Eye, EyeOff, CheckCircle2, XCircle, Clock, Settings, Bell, Key, QrCode } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../../lib/utils';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  permissions: string[];
  lastLoginAt: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  tenantId: string | null;
  tenant: { id: string; name: string; slug: string; status: string; plan: string } | null;
  createdAt: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, refreshAccessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Profile data
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  // Forms
  const profileForm = useForm<UpdateUser>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
    },
  });

  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const twoFactorSetupForm = useForm<SetupTwoFactor>({
    resolver: zodResolver(SetupTwoFactorSchema),
    defaultValues: {
      code: '',
      secret: '',
    },
  });

  const twoFactorVerifyForm = useForm<VerifyTwoFactor>({
    resolver: zodResolver(VerifyTwoFactorSchema),
    defaultValues: {
      code: '',
    },
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTwoFactorCode, setShowTwoFactorCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Two Factor state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [showTwoFactorCode, setShowTwoFactorCode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTwoFactorCode, setShowTwoFactorCode] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Two Factor state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [showTwoFactorCode, setShowTwoFactorCode] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await apiPost('/auth/me');
      const userData = response.data.data.user;
      setProfileData(userData);

      // Populate forms
      profileForm.reset({
        name: userData.name,
        cpf: userData.cpf || '',
        phone: userData.phone || '',
      });

      // Load notification preferences from user data or localStorage
      setEmailNotifications(userData.permissions?.includes('email_notifications') ?? true);
      setSmsNotifications(userData.permissions?.includes('sms_notifications') ?? false);
      setPushNotifications(userData.permissions?.includes('push_notifications') ?? true);

      // Two factor
      setTwoFactorEnabled(userData.twoFactorEnabled ?? false);
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: UpdateUser) => {
    setSaving(true);
    try {
      const response = await apiPatch('/auth/me', data);
      setProfileData(prev => prev ? { ...prev, ...response.data.data.user } : null);
      updateUser(response.data.data.user);
      toast.success('Perfil atualizado com sucesso');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (data: ChangePassword) => {
    setSaving(true);
    try {
      await apiPost('/auth/change-password', data);
      toast.success('Senha alterada com sucesso');
      // Reset form
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const setupTwoFactor = async () => {
    try {
      const response = await apiPost('/auth/2fa/setup');
      setTwoFactorSecret(response.data.data.secret);
      setTwoFactorQrCode(response.data.data.otpauthUrl);
      setShowTwoFactorCode(true);
    } catch (error: any) {
      toast.error('Erro ao configurar 2FA');
    }
  };

  const verifyTwoFactor = async (data: VerifyTwoFactor) => {
    try {
      await apiPost('/auth/2fa/verify', data);
      setTwoFactorEnabled(true);
      setShowTwoFactorCode(false);
      toast.success('2FA ativado com sucesso');
    } catch (error: any) {
      toast.error('Código inválido');
    }
  };

  const updateNotifications = async () => {
    setSaving(true);
    try {
      const permissions = [
        ...(emailNotifications ? ['email_notifications'] : []),
        ...(smsNotifications ? ['sms_notifications'] : []),
        ...(pushNotifications ? ['push_notifications'] : []),
      ];
      await apiPatch('/auth/me', { permissions });
      toast.success('Preferências de notificação atualizadas');
    } catch (error: any) {
      toast.error('Erro ao atualizar notificações');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result as string);
      };
      reader.readAsDataURL(file);
      // TODO: Upload avatar to server
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas configurações pessoais</p>
        </div>
        <Button onClick={() => updateProfile(profileForm.getValues())} disabled={saving} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <Card className="h-fit sticky top-6">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                  ) : profileData?.avatarUrl ? (
                    <img src={profileData.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-10 h-10 text-primary-foreground" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer" htmlFor="avatar-upload">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
                  </label>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{profileData?.name}</h3>
                  <p className="text-sm text-muted-foreground">{profileData?.email}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                    {profileData?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <nav className="space-y-1 p-4">
              {[
                { id: 'profile', label: 'Perfil', icon: User },
                { id: 'security', label: 'Segurança', icon: Shield },
                { id: 'notifications', label: 'Notificações', icon: Bell },
                { id: 'appearance', label: 'Aparência', icon: Palette },
              ].map((tab) => (
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
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Atualize suas informações de perfil</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          {...profileForm.register('name')}
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          {...profileForm.register('cpf')}
                          placeholder="000.000.000-00"
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          {...profileForm.register('phone')}
                          placeholder="(00) 90000-0000"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                      <h4 className="font-medium">Informações da Conta</h4>
                      <div className="grid gap-4 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{profileData?.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CPF</p>
                          <p className="font-medium">{profileData?.cpf || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Telefone</p>
                          <p className="font-medium">{profileData?.phone || 'Não informado'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Último Login</p>
                          <p className="font-medium">{profileData?.lastLoginAt ? formatRelativeTime(profileData.lastLoginAt) : 'Nunca'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conta Criada</p>
                          <p className="font-medium">{formatRelativeTime(profileData?.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">2FA</p>
                          <p className="font-medium flex items-center gap-2">
                            {profileData?.twoFactorEnabled ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Ativado
                              </>
                            ) : (
                              <span className="text-muted-foreground">Desativado</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Atualize sua senha para manter sua conta segura</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Senha Atual</Label>
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...passwordForm.register('currentPassword')}
                        disabled={saving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showCurrentPassword ? 'Ocultar' : 'Mostrar'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? 'text' : 'password'}
                          {...passwordForm.register('newPassword')}
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showNewPassword ? 'Ocultar' : 'Mostrar'}
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_new_password">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirm_new_password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...passwordForm.register('confirmNewPassword')}
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                      <Key className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Alterar Senha'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
                  <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
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
                  {twoFactorEnabled && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Códigos de Backup</h4>
                        <p className="text-sm text-muted-foreground">Guarde estes códigos em local seguro. Cada código pode ser usado uma vez.</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className="font-mono text-sm bg-muted p-2 rounded text-center">
                            {Math.random().toString(36).substring(2, 10).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <Button variant="destructive" onClick={() => {
                        // TODO: implement disable 2FA
                      }}>
                        Desativar 2FA
                      </Button>
                    </div>
                  }
                  {showTwoFactorCode && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Configurar 2FA</h4>
                      <p className="text-sm text-muted-foreground">Escaneie o QR code com seu app autenticador (Google Authenticator, Authy, etc.)</p>
                      {twoFactorQrCode && (
                        <div className="text-center my-4">
                          <img src={twoFactorQrCode} alt="QR Code 2FA" className="mx-auto" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Ou digite a chave manualmente:</p>
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{twoFactorSecret}</code>
                      </div>
                      <form onSubmit={twoFactorVerifyForm.handleSubmit(verifyTwoFactor)} className="space-y-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="code">Código 2FA</Label>
                          <Input
                            id="code"
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            autoComplete="one-time-code"
                            {...twoFactorVerifyForm.register('code')}
                            className="text-center text-xl tracking-widest font-mono"
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={saving}>
                          Ativar 2FA
                        </Button>
                      </form>
                    </div>
                  }
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure como deseja receber notificações</CardDescription>
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
                  <Button onClick={updateNotifications} disabled={saving} className="w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Preferências'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { apiPost, apiDelete, apiGet, apiPatch } from '../../lib/api';
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreHorizontal, Search, Shield, Bell, Palette, Globe, Key, Users, ShieldCheck, Save, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';