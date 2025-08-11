import { supabase } from '@/integrations/supabase/client';

interface EventCapacityValidation {
  isValid: boolean;
  message?: string;
  currentRegistrations: number;
  capacity: number;
}

interface DuplicateCPFValidation {
  isValid: boolean;
  message?: string;
  existingRegistration?: any;
}

export const validateEventCapacity = async (eventId: string): Promise<EventCapacityValidation> => {
  try {
    // Buscar evento e contagem de registros
    const [eventResponse, registrationsResponse] = await Promise.all([
      supabase.from('events').select('capacity').eq('id', eventId).single(),
      supabase.from('registrations').select('id').eq('event_id', eventId)
    ]);

    if (eventResponse.error) throw eventResponse.error;
    if (registrationsResponse.error) throw registrationsResponse.error;

    const capacity = eventResponse.data.capacity;
    const currentRegistrations = registrationsResponse.data.length;

    const isValid = currentRegistrations < capacity;

    return {
      isValid,
      message: isValid ? undefined : `Evento lotado! Capacidade: ${capacity}, Inscritos: ${currentRegistrations}`,
      currentRegistrations,
      capacity
    };
  } catch (error) {
    console.error('Erro ao validar capacidade do evento:', error);
    return {
      isValid: false,
      message: 'Erro ao validar capacidade do evento',
      currentRegistrations: 0,
      capacity: 0
    };
  }
};

export const validateDuplicateCPF = async (eventId: string, document: string): Promise<DuplicateCPFValidation> => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, name, email, status')
      .eq('event_id', eventId)
      .eq('document', document.replace(/\D/g, ''));

    if (error) throw error;

    if (data && data.length > 0) {
      const existingRegistration = data[0];
      return {
        isValid: false,
        message: `CPF já cadastrado para este evento! Registro existente: ${existingRegistration.name} (${existingRegistration.email})`,
        existingRegistration
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Erro ao validar CPF duplicado:', error);
    return {
      isValid: false,
      message: 'Erro ao validar CPF duplicado'
    };
  }
};

export const validateEventIsActive = async (eventId: string): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('status, title')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    if (data.status !== 'active') {
      return {
        isValid: false,
        message: `O evento "${data.title}" não está mais ativo para novas inscrições`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Erro ao validar status do evento:', error);
    return {
      isValid: false,
      message: 'Erro ao validar status do evento'
    };
  }
};

export const validateEventExists = async (eventId: string): Promise<{ isValid: boolean; message?: string; event?: any }> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      return {
        isValid: false,
        message: 'Evento não encontrado'
      };
    }

    return {
      isValid: true,
      event: data
    };
  } catch (error) {
    console.error('Erro ao validar existência do evento:', error);
    return {
      isValid: false,
      message: 'Erro ao verificar evento'
    };
  }
};

// Função para validar conjunto de dados antes de criar registro
export const validateRegistration = async (eventId: string, document: string) => {
  const validations = await Promise.all([
    validateEventExists(eventId),
    validateEventIsActive(eventId),
    validateDuplicateCPF(eventId, document),
    validateEventCapacity(eventId)
  ]);

  const [eventExists, eventActive, cpfValid, capacityValid] = validations;

  // Retorna primeira validação que falhou
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }

  return { 
    isValid: true,
    message: undefined,
    event: eventExists.event,
    currentRegistrations: capacityValid.currentRegistrations,
    capacity: capacityValid.capacity
  };
};