import { Badge } from "@/components/ui/badge"

// Helper functions for standardized status badges and colors

export interface StatusConfig {
  variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary'
  text: string
}

// Status configurations for different entities
export const inviteStatusConfig: Record<string, StatusConfig> = {
  pending: { variant: 'warning', text: 'Aguardando Envio' },
  sent: { variant: 'success', text: 'Convite Enviado' },
  failed: { variant: 'destructive', text: 'Falha no Envio' }
}

export const confirmationStatusConfig: Record<string, StatusConfig> = {
  confirmed: { variant: 'success', text: 'Confirmado' },
  pending: { variant: 'warning', text: 'Aguardando Confirmação' },
  cancelled: { variant: 'destructive', text: 'Cancelado' }
}

export const checkinStatusConfig: Record<string, StatusConfig> = {
  'true': { variant: 'success', text: 'Check-in Realizado' },
  'false': { variant: 'info', text: 'Aguardando Check-in' }
}

export const eventStatusConfig: Record<string, StatusConfig> = {
  active: { variant: 'success', text: 'Evento Ativo' },
  inactive: { variant: 'secondary', text: 'Evento Inativo' },
  completed: { variant: 'info', text: 'Evento Finalizado' },
  cancelled: { variant: 'destructive', text: 'Evento Cancelado' }
}

// Helper functions to generate status badges
export const getInviteStatusBadge = (status: string) => {
  const config = inviteStatusConfig[status] || { variant: 'secondary' as const, text: status }
  return <Badge variant={config.variant}>{config.text}</Badge>
}

export const getConfirmationStatusBadge = (status: string) => {
  const config = confirmationStatusConfig[status] || { variant: 'secondary' as const, text: status }
  return <Badge variant={config.variant}>{config.text}</Badge>
}

export const getCheckinStatusBadge = (checkedIn: boolean) => {
  const config = checkinStatusConfig[checkedIn.toString()]
  return <Badge variant={config.variant}>{config.text}</Badge>
}

export const getEventStatusBadge = (status: string) => {
  const config = eventStatusConfig[status] || { variant: 'secondary' as const, text: status }
  return <Badge variant={config.variant}>{config.text}</Badge>
}

// Helper functions to get status class names (for compatibility with existing code)
export const getInviteStatusClass = (status: string): string => {
  const config = inviteStatusConfig[status]
  return config ? `badge-${config.variant}` : 'badge-secondary'
}

export const getConfirmationStatusClass = (status: string): string => {
  const config = confirmationStatusConfig[status]
  return config ? `badge-${config.variant}` : 'badge-secondary'
}

export const getCheckinStatusClass = (checkedIn: boolean): string => {
  const config = checkinStatusConfig[checkedIn.toString()]
  return `badge-${config.variant}`
}

export const getEventStatusClass = (status: string): string => {
  const config = eventStatusConfig[status]
  return config ? `badge-${config.variant}` : 'badge-secondary'
}