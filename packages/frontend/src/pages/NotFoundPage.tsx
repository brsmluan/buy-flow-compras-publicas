// NotFoundPage.tsx - 404 Page for Buy-Flow
// Chamado por: App.tsx linha 14 (import) e rota catch-all
// Não existe arquivo similar - é a página 404 padrão do React Router
// Instrução do usuário: Criar páginas faltantes para build funcionar

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-4">Página não encontrada</h2>
          <p className="text-muted-foreground mb-8">
            A página que você procura não existe ou foi movida.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">
                Ir para Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}