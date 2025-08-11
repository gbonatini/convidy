import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LimitWarningProps {
  type: 'events' | 'registrations' | 'features';
  title: string;
  description: string;
  planName?: string;
  onUpgrade?: () => void;
}

export const LimitWarning: React.FC<LimitWarningProps> = ({
  type,
  title,
  description,
  planName = 'free',
  onUpgrade
}) => {
  const getIcon = () => {
    switch (type) {
      case 'features':
        return <Crown className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    return type === 'features' ? 'default' : 'destructive';
  };

  return (
    <Alert variant={getVariant()} className="border-warning bg-warning/10">
      <div className="flex items-center space-x-2">
        {getIcon()}
        <AlertTitle className="text-warning-foreground">{title}</AlertTitle>
      </div>
      <AlertDescription className="text-warning-foreground mt-2">
        {description}
      </AlertDescription>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Link to="/plans">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto"
          >
            <Zap className="h-4 w-4 mr-2" />
            Ver Planos
          </Button>
        </Link>
        {onUpgrade && (
          <Button 
            onClick={onUpgrade} 
            size="sm"
            className="w-full sm:w-auto"
          >
            <Crown className="h-4 w-4 mr-2" />
            Fazer Upgrade
          </Button>
        )}
      </div>
    </Alert>
  );
};