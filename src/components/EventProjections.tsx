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
    totalInvites?: number;
  };
}

const EventProjections: React.FC<EventProjectionsProps> = ({ stats }) => {
  // Calcular projeções baseadas em dados reais
  const calculateProjections = () => {
    const baseOccupancy = stats.averageOccupancy || 0;
    const baseAttendance = stats.attendanceRate || 0;
    const conversionRate = stats.totalInvites && stats.totalInvites > 0 
      ? (stats.totalRegistrations / stats.totalInvites) * 100 
      : 0;
    
    return {
      expectedOccupancy: Math.min(baseOccupancy + 5, 100), // Projeção otimista
      checkinGoal: Math.min(baseAttendance + 10, 95), // Meta de melhoria
      conversionEfficiency: Math.round(conversionRate), // Taxa de conversão de convites
      atRiskEvents: stats.totalEvents > 0 && baseOccupancy < 50 ? 1 : 0,
    };
  };

  const projections = calculateProjections();

  const getPerformanceScore = () => {
    // Score baseado em dados reais
    const occupancyScore = Math.min((stats.averageOccupancy / 80) * 30, 30); // 30% do score
    const attendanceScore = Math.min((stats.attendanceRate / 85) * 30, 30); // 30% do score
    const engagementScore = stats.totalRegistrations > 0 
      ? Math.min((stats.totalCheckins / stats.totalRegistrations) * 25, 25) : 0; // 25% do score
    const activityScore = Math.min(stats.totalEvents * 3, 15); // 15% do score - máximo 5 eventos
    
    return Math.round(occupancyScore + attendanceScore + engagementScore + activityScore);
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
                <div className="text-sm font-medium">Eficiência de Conversão</div>
                <div className="text-xs text-muted-foreground">
                  Convites para confirmações
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">
                  {projections.conversionEfficiency}%
                </span>
                <TrendingUp className="h-4 w-4 text-success" />
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