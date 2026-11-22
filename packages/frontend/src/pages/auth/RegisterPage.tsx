// =============================================================================
// BUY-FLOW FRONTEND - Register Page (Platform Owner)
// =============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema, type CreateUser } from '@buy-flow/shared/index.js';
import { useAuth } from '../../contexts/AuthContext';
import { apiPost } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Scale, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      cpf: '',
      phone: '',
    },
  });

  const onSubmit = async (data: CreateUser) => {
    setIsSubmitting(true);
    try {
      await apiPost('/auth/register', data);
      toast.success('Cadastro realizado com sucesso! Bem-vindo ao Buy-Flow.');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao cadastrar');
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
            Cadastre a plataforma como Platform Owner
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Primeiro Acesso</CardTitle>
            <CardDescription>
              Crie sua conta de Platform Owner para gerenciar todas as prefeituras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  {...register('name')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive" role="alert">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.name.message}
                  </p>
                )}
              </div>

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
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  {...register('cpf')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.cpf}
                  aria-describedby={errors.cpf ? 'cpf-error' : undefined}
                />
                {errors.cpf && (
                  <p id="cpf-error" className="text-sm text-destructive" role="alert">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.cpf.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 90000-0000"
                  autoComplete="tel"
                  {...register('phone')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-destructive" role="alert">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.phone.message}
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

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                    <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  Aceito os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e a <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
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
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar Plataforma'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Informações importantes:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Esta é a primeira conta criada na plataforma (Platform Owner)</li>
                <li>Você terá acesso total a todas as funcionalidades e tenants</li>
                <li>Guarde suas credenciais em local seguro</li>
                <li>Configure 2FA após o primeiro login para maior segurança</li>
              </ul>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Fazer login
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

