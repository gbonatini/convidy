import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Crown, Zap, Users, Calendar } from 'lucide-react';

export const PlanStatusBanner: React.FC = () => {
  const { 
    planName, 
    usage, 
    planLimits, 
    getUsagePercentage,
    getRemainingEvents,
    getRemainingRegistrations,
    loading
  } = usePlanLimits();

  console.log('🎨 PlanStatusBanner render:', { 
    planName, 
    loading, 
    planLimits,
    usage 
  });

  // Loading state
  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-muted rounded w-32"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>
    );
  }

  // Fallback se não tiver nome do plano
  const displayPlanName = planName || 'Carregando...';

  const getPlanIcon = () => {
    switch (displayPlanName.toLowerCase()) {
      case 'empresarial':
        return <Crown className="h-4 w-4" />;
      case 'pro':
      case 'profissional':
        return <Zap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getPlanColor = () => {
    switch (displayPlanName.toLowerCase()) {
      case 'empresarial':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 'pro':
      case 'profissional':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const eventsPercentage = getUsagePercentage('events');
  const registrationsPercentage = getUsagePercentage('registrations');

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge className={getPlanColor()}>
            {getPlanIcon()}
            <span className="ml-1 capitalize">{displayPlanName}</span>
          </Badge>
        </div>
      </div>

      {planLimits.maxEvents !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Eventos</span>
            </div>
            <span className="text-muted-foreground">
              {usage.totalEvents} / {planLimits.maxEvents}
            </span>
          </div>
          <Progress value={eventsPercentage} className="h-2" />
          {getRemainingEvents() !== null && getRemainingEvents()! <= 2 && (
            <p className="text-xs text-warning">
              Restam apenas {getRemainingEvents()} eventos disponíveis
            </p>
          )}
        </div>
      )}

      {planLimits.maxTotalRegistrations !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>Confirmações</span>
            </div>
            <span className="text-muted-foreground">
              {usage.totalRegistrations} / {planLimits.maxTotalRegistrations}
            </span>
          </div>
          <Progress value={registrationsPercentage} className="h-2" />
          {getRemainingRegistrations() !== null && getRemainingRegistrations()! <= 10 && (
            <p className="text-xs text-warning">
              Restam apenas {getRemainingRegistrations()} confirmações disponíveis
            </p>
          )}
        </div>
      )}
    </div>
  );
};