import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface EventFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  events: any[];
  showFilterCount?: boolean;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  events,
  showFilterCount = true
}) => {
  const statusCounts = {
    all: events.length,
    active: events.filter(e => e.status === 'active').length,
    inactive: events.filter(e => e.status === 'inactive').length,
    completed: events.filter(e => e.status === 'completed').length,
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-background border rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status do evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            Todos os Status {showFilterCount && <Badge variant="secondary" className="ml-2">{statusCounts.all}</Badge>}
          </SelectItem>
          <SelectItem value="active">
            Ativos {showFilterCount && <Badge variant="success" className="ml-2">{statusCounts.active}</Badge>}
          </SelectItem>
          <SelectItem value="inactive">
            Inativos {showFilterCount && <Badge variant="warning" className="ml-2">{statusCounts.inactive}</Badge>}
          </SelectItem>
          <SelectItem value="completed">
            Finalizados {showFilterCount && <Badge variant="secondary" className="ml-2">{statusCounts.completed}</Badge>}
          </SelectItem>
        </SelectContent>
      </Select>

      {statusFilter !== 'all' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStatusFilterChange('all')}
          className="h-8 px-2 lg:px-3"
        >
          <X className="h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
};