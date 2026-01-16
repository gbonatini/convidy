import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Types
interface Registration {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  event?: {
    title: string;
    date: string;
    time: string;
    location: string;
  } | null;
}

interface Invite {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  events: {
    title: string;
    date: string;
  } | null;
}
export const exportConfirmations = (registrations: Registration[], eventFilter?: string) => {
  const data = registrations.map(reg => ({
    'Nome': reg.name,
    'Email': reg.email || '-',
    'Telefone': reg.phone || '-',
    'CPF': reg.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-',
    'Status': reg.status === 'confirmed' ? 'Confirmado' : (reg.status === 'checked_in' ? 'Check-in Realizado' : 'Cancelado'),
    'Check-in': reg.status === 'checked_in' ? 'Sim' : 'Não',
    'Data Check-in': reg.checked_in_at ? format(new Date(reg.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-',
    'Evento': reg.event?.title || 'N/A',
    'Data do Evento': reg.event?.date ? format(new Date(reg.event.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A',
    'Horário': reg.event?.time ? reg.event.time.slice(0, 5) : 'N/A',
    'Local': reg.event?.location || 'N/A',
    'Data Confirmação': format(new Date(reg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Auto-size columns
  const cols = [
    { wch: 25 }, // Nome
    { wch: 30 }, // Email
    { wch: 15 }, // Telefone
    { wch: 15 }, // CPF
    { wch: 12 }, // Status
    { wch: 10 }, // Check-in
    { wch: 18 }, // Data Check-in
    { wch: 30 }, // Evento
    { wch: 12 }, // Data do Evento
    { wch: 8 },  // Horário
    { wch: 20 }, // Local
    { wch: 18 }  // Data Confirmação
  ];
  worksheet['!cols'] = cols;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Confirmações');
  
  const fileName = eventFilter ? 
    `confirmacoes_evento_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx` :
    `confirmacoes_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
    
  XLSX.writeFile(workbook, fileName);
};

// Export invites
export const exportInvites = (invites: Invite[], eventFilter?: string) => {
  const data = invites.map(invite => ({
    'Nome': invite.name,
    'CPF': invite.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-',
    'Telefone': invite.phone?.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') || '-',
    'Email': invite.email || '-',
    'Status': getInviteStatusText(invite.status),
    'Evento': invite.events?.title || 'N/A',
    'Data do Evento': invite.events?.date ? format(new Date(invite.events.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A',
    'Data Criação': format(new Date(invite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Auto-size columns
  const cols = [
    { wch: 25 }, // Nome
    { wch: 15 }, // CPF
    { wch: 18 }, // Telefone
    { wch: 30 }, // Email
    { wch: 12 }, // Status
    { wch: 30 }, // Evento
    { wch: 15 }, // Data do Evento
    { wch: 18 }  // Data Criação
  ];
  worksheet['!cols'] = cols;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Convites');
  
  const fileName = eventFilter ? 
    `convites_evento_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx` :
    `convites_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
    
  XLSX.writeFile(workbook, fileName);
};

// Export check-ins (flexible interface for CheckIn page)
export const exportCheckIns = (registrations: any[], eventFilter?: string) => {
  // Filter only checked-in registrations
  const checkedInData = registrations.filter(reg => reg.status === 'checked_in');
  
  const data = checkedInData.map(reg => ({
    'Nome': reg.name,
    'Email': reg.email || '-',
    'Telefone': reg.phone || '-',
    'CPF': reg.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-',
    'Evento': reg.event?.title || reg.events?.title || 'N/A',
    'Data do Evento': reg.event?.date ? format(new Date(reg.event.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 
                      (reg.events?.date ? format(new Date(reg.events.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'),
    'Horário': reg.event?.time ? reg.event.time.slice(0, 5) : 'N/A',
    'Local': reg.event?.location || reg.events?.location || 'N/A',
    'Data Check-in': reg.checked_in_at ? format(new Date(reg.checked_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-',
    'Data Confirmação': reg.created_at ? format(new Date(reg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Auto-size columns
  const cols = [
    { wch: 25 }, // Nome
    { wch: 30 }, // Email
    { wch: 15 }, // Telefone
    { wch: 15 }, // CPF
    { wch: 30 }, // Evento
    { wch: 15 }, // Data do Evento
    { wch: 8 },  // Horário
    { wch: 20 }, // Local
    { wch: 18 }, // Data Check-in
    { wch: 18 }  // Data Confirmação
  ];
  worksheet['!cols'] = cols;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Check-ins');
  
  const fileName = eventFilter ? 
    `checkins_evento_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx` :
    `checkins_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
    
  XLSX.writeFile(workbook, fileName);
};

// Helper function to get invite status text
function getInviteStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'sent':
      return 'Enviado';
    case 'confirmed':
      return 'Confirmado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}