// =============================================================================
// BUY-FLOW FRONTEND - Login Page
// =============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type Login } from '@buy-flow/shared/validators/index.js';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Scale, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: Login) => {
    setIsSubmitting(true);
    try {
      if (requires2FA) {
        await login({ ...data, twoFactorCode });
      } else {
        await login(data);
      }
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error.response?.data?.data?.requiresTwoFactor) {
        setRequires2FA(true);
        toast.error('Código 2FA necessário');
      } else {
        toast.error(error.response?.data?.error?.message || 'Erro ao fazer login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Scale className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Buy-Flow</h1>
          <p className="text-muted-foreground mt-2">
            SaaS de Compras Públicas para Prefeituras
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Acesse sua prefeitura e gerencie suas compras públicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...register('email')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a href="/forgot-password" className="text-sm text-primary hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive" role="alert">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.password.message}
                  </p>
                )}
              </div>

              {requires2FA && (
                <div className="space-y-1.5" style={{ animation: 'fade-in 0.2s ease-out' }}>
                  <Label htmlFor="twoFactorCode">Código 2FA</Label>
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    disabled={isSubmitting}
                    className="text-center text-xl tracking-widest font-mono"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Digite o código do seu app autenticador
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                  Lembrar-me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full py-3"
                size="lg"
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting || authLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Entrando...
                  </>
                ) : requires2FA ? (
                  'Verificar Código'
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Credenciais de demonstração:</p>
              <div className="space-y-1 text-xs text-muted-foreground font-mono">
                <div><strong>Platform Owner:</strong> owner@buyflow.app / BuyFlow@2024!</div>
                <div><strong>Tenant Admin:</strong> admin@boa-nova.buyflow.app / BuyFlow@2024!</div>
                <div><strong>Pregoeiro:</strong> pregoeiro@boa-nova.buyflow.app / BuyFlow@2024!</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                2FA: código <code className="font-mono bg-muted px-1 rounded">123456</code> (placeholder)
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Primeira vez aqui?{' '}
              <a href="/register" className="text-primary hover:underline font-medium">
                Cadastre a plataforma
              </a>
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Buy-Flow v0.0.1 — Lei 14.133/2021</p>
          <p className="mt-1">
            <a href="#" className="hover:underline">Termos de Uso</a> •
            <a href="#" className="hover:underline mx-2">Privacidade</a> •
            <a href="#" className="hover:underline">Suporte</a>
          </p>
        </div>
      </div>
    </div>
  );
}

import { EyeOff } from 'lucide-react';