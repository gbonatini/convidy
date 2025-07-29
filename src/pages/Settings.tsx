import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

const Settings = () => {
  const { user, profile, loading } = useAuth();

  // Redirecionar se não autenticado
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para setup se não tem empresa
  if (!loading && profile && !profile.company_id) {
    return <Navigate to="/setup" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Configurações</h1>
              <p className="text-muted-foreground">
                Gerencie as configurações da sua empresa e preferências
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Configurações da Empresa</h2>
            <p className="text-muted-foreground">
              Página de configurações em desenvolvimento...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;