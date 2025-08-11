import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';

interface EventProjectionsProps {
  stats: {
    totalEvents: number;
    totalRegistrations: number;
    totalCheckins: number;
    attendanceRate: number;
    averageOccupancy: number;
    projectedRevenue: number;
  };
}

const EventProjections: React.FC<EventProjectionsProps> = ({ stats }) => {
  // Calcular projeções baseadas em dados históricos
  const calculateProjections = () => {
    const baseOccupancy = stats.averageOccupancy || 70;
    const baseAttendance = stats.attendanceRate || 80;
    
    return {
      expectedOccupancy: Math.min(baseOccupancy * 1.1, 100),
      checkinGoal: Math.min(baseAttendance * 1.05, 95),
      revenueProjection: stats.projectedRevenue * 1.15,
      atRiskEvents: Math.max(Math.floor(stats.totalEvents * 0.1), 0),
    };
  };

  const projections = calculateProjections();

  const getPerformanceScore = () => {
    const occupancyScore = (stats.averageOccupancy / 100) * 40;
    const attendanceScore = (stats.attendanceRate / 100) * 40;
    const eventScore = Math.min((stats.totalEvents / 10) * 20, 20);
    
    return Math.round(occupancyScore + attendanceScore + eventScore);
  };

  const performanceScore = getPerformanceScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getTrendIcon = (current: number, projected: number) => {
    if (projected > current) return <TrendingUp className="h-4 w-4 text-success" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Performance Score */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Score de Performance</span>
          </CardTitle>
          <CardDescription>
            Avaliação geral baseada em métricas-chave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore}
            </div>
            <div className="text-sm text-muted-foreground">
              de 100 pontos
            </div>
          </div>
          <Progress value={performanceScore} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-destructive">Crítico</span>
            <span className="text-warning">Bom</span>
            <span className="text-success">Excelente</span>
          </div>
        </CardContent>
      </Card>

      {/* Projeções e Metas */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Projeções e Metas</span>
          </CardTitle>
          <CardDescription>
            Previsões baseadas no desempenho atual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">Ocupação Esperada</div>
                <div className="text-xs text-muted-foreground">
                  Próximos eventos
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">
                  {Math.round(projections.expectedOccupancy)}%
                </span>
                {getTrendIcon(stats.averageOccupancy, projections.expectedOccupancy)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">Meta de Check-in</div>
                <div className="text-xs text-muted-foreground">
                  Taxa objetivo
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">
                  {Math.round(projections.checkinGoal)}%
                </span>
                {getTrendIcon(stats.attendanceRate, projections.checkinGoal)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">Receita Projetada</div>
                <div className="text-xs text-muted-foreground">
                  Próximo trimestre
                </div>
              </div>
              <div className="text-lg font-bold">
                R$ {projections.revenueProjection.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas e Riscos */}
      {projections.atRiskEvents > 0 && (
        <Card className="border-0 shadow-lg border-l-4 border-l-warning">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>Eventos em Risco</span>
            </CardTitle>
            <CardDescription>
              Eventos que podem precisar de atenção especial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-warning">
                  {projections.atRiskEvents}
                </div>
                <div className="text-sm text-muted-foreground">
                  eventos com baixa adesão
                </div>
              </div>
              <Badge variant="outline" className="text-warning border-warning">
                Ação Recomendada
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventProjections;