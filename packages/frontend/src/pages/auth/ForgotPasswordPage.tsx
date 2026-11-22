// =============================================================================
// BUY-FLOW FRONTEND - Forgot Password Page
// =============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, type ForgotPassword } from '@buy-flow/shared/validators/index.js';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Scale, AlertCircle, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPassword>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPassword) => {
    setIsSubmitting(true);
    try {
      await apiPost('/auth/forgot-password', data);
      setEmailSent(true);
      toast.success('Se o email existir, instruções serão enviadas');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Erro ao solicitar recuperação');
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
            <CardTitle>{emailSent ? 'Email Enviado' : 'Recuperar Senha'}</CardTitle>
            <CardDescription>
              {emailSent
                ? 'Verifique seu email para instruções de recuperação'
                : 'Digite seu email para receber instruções de recuperação'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Email enviado!</h3>
                <p className="text-muted-foreground">
                  Verifique sua caixa de entrada (e spam) para o email com instruções.
                </p>
                <Button onClick={() => navigate('/login')} className="w-full mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Button>
              </div>
            ) : (
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

                <Button
                  type="submit"
                  className="w-full py-3"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Instruções'
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
import { ArrowLeft } from 'lucide-react';