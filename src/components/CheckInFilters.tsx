import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Filter, X, Search } from 'lucide-react';

interface CheckInFiltersProps {
  selectedEventId: string;
  checkinFilter: string;
  searchTerm: string;
  onEventFilterChange: (eventId: string) => void;
  onCheckinFilterChange: (checkin: string) => void;
  onSearchTermChange: (term: string) => void;
  events: any[];
  registrations: any[];
}

export const CheckInFilters: React.FC<CheckInFiltersProps> = ({
  selectedEventId,
  checkinFilter,
  searchTerm,
  onEventFilterChange,
  onCheckinFilterChange,
  onSearchTermChange,
  events,
  registrations
}) => {
  const hasActiveFilters = selectedEventId !== 'all' || checkinFilter !== 'all' || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    onEventFilterChange('all');
    onCheckinFilterChange('all');
    onSearchTermChange('');
  };

  const getCheckinCounts = () => ({
    all: registrations.length,
    checked_in: registrations.filter(r => r.checked_in).length,
    pending: registrations.filter(r => !r.checked_in).length,
  });

  const checkinCounts = getCheckinCounts();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-background border rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Event Filter */}
          <Select value={selectedEventId} onValueChange={onEventFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Check-in Status Filter */}
          <Select value={checkinFilter} onValueChange={onCheckinFilterChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todos <Badge variant="outline" className="ml-2">{checkinCounts.all}</Badge>
              </SelectItem>
              <SelectItem value="checked_in">
                Confirmados <Badge variant="success" className="ml-2">{checkinCounts.checked_in}</Badge>
              </SelectItem>
              <SelectItem value="pending">
                Pendentes <Badge variant="warning" className="ml-2">{checkinCounts.pending}</Badge>
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-2 lg:px-3"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nome, CPF..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};