// =============================================================================
// BUY-FLOW FRONTEND - Reset Password Page
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, type ResetPassword } from '@buy-flow/shared/validators/index.js';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Scale, AlertCircle, Eye, EyeOff, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [tokenChecked, setTokenChecked] = useState(false);

  const token = new URLSearchParams(location.search).get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: token || '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  useEffect(() => {
    if (token) {
      setTokenChecked(true);
    } else {
      setTokenValid(false);
      setTokenChecked(true);
    }
  }, [token]);

  const onSubmit = async (data: ResetPassword) => {
    setIsSubmitting(true);
    try {
      await apiPost('/auth/reset-password', data);
      toast.success('Senha alterada com sucesso! Redirecionando para login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao redefinir senha');
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
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              {tokenValid
                ? 'Digite sua nova senha abaixo'
                : 'Token inválido ou expirado. Solicite uma nova recuperação.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!tokenValid || !tokenChecked ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Token Inválido</h3>
                <p className="text-muted-foreground">
                  O link de recuperação expirou ou é inválido.
                </p>
                <Button onClick={() => navigate('/forgot-password')} className="w-full mt-4">
                  Solicitar Nova Recuperação
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register('newPassword')}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.newPassword}
                      aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
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
                  {errors.newPassword && (
                    <p id="newPassword-error" className="text-sm text-destructive" role="alert">
                      <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register('confirmNewPassword')}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.confirmNewPassword}
                      aria-describedby={errors.confirmNewPassword ? 'confirmNewPassword-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmNewPassword && (
                    <p id="confirmNewPassword-error" className="text-sm text-destructive" role="alert">
                      <AlertCircle className="w-3 h-3 inline mr-1" /> {errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>

                <input type="hidden" {...register('token')} value={token} />

                <Button
                  type="submit"
                  className="w-full py-3"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Redefinindo...
                    </>
                  ) : (
                    'Redefinir Senha'
                  )}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Lembrou a senha?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Voltar ao Login
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

import { apiPost } from '../../lib/api';
import { EyeOff } from 'lucide-react';