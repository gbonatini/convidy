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
    getRemainingRegistrations 
  } = usePlanLimits();

  const getPlanIcon = () => {
    switch (planName.toLowerCase()) {
      case 'empresarial':
        return <Crown className="h-4 w-4" />;
      case 'profissional':
        return <Zap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getPlanColor = () => {
    switch (planName.toLowerCase()) {
      case 'empresarial':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
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
            <span className="ml-1 capitalize">{planName}</span>
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