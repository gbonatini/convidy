import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface PlanData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  max_events: number | null;
  max_guests_per_event: number | null;
  features: string[];
}

export interface CompanyData {
  id: string;
  name: string;
  plan_id: string | null;
  next_payment_due: string | null;
  plan_status: string | null;
}

export interface UsageData {
  totalEvents: number;
  totalRegistrations: number;
  activeEvents: number;
}

export const useCompanyPlan = () => {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [usage, setUsage] = useState<UsageData>({
    totalEvents: 0,
    totalRegistrations: 0,
    activeEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile?.company_id) {
      console.log('❌ No company_id in profile');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🔍 Fetching company and plan data for:', profile.company_id);

      // 1. Buscar dados da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, plan_id, next_payment_due, plan_status')
        .eq('id', profile.company_id)
        .maybeSingle();

      if (companyError) {
        console.error('❌ Error fetching company:', companyError);
        throw new Error('Erro ao buscar dados da empresa');
      }

      if (!companyData?.plan_id) {
        console.error('❌ No plan_id found for company');
        throw new Error('Empresa sem plano associado');
      }

      console.log('✅ Company data:', companyData);
      setCompany(companyData);

      // 2. Buscar dados do plano
      const { data: planData, error: planError } = await supabase
        .from('system_plans')
        .select('id, name, slug, description, price, max_events, max_guests_per_event, features')
        .eq('id', companyData.plan_id)
        .maybeSingle();

      if (planError) {
        console.error('❌ Error fetching plan:', planError);
        throw new Error('Erro ao buscar dados do plano');
      }

      console.log('✅ Plan data:', planData);
      
      // Converter features para array de strings
      const features = Array.isArray(planData.features) 
        ? planData.features.map(f => typeof f === 'string' ? f : String(f))
        : [];
      
      setPlan({
        ...planData,
        features
      });

      // 3. Buscar uso atual
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, status')
        .eq('company_id', profile.company_id);

      if (eventsError) {
        console.error('❌ Error fetching events:', eventsError);
        throw new Error('Erro ao buscar eventos');
      }

      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter(e => e.status === 'active').length || 0;
      const eventIds = events?.map(e => e.id) || [];

      let totalRegistrations = 0;
      if (eventIds.length > 0) {
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          .select('id')
          .in('event_id', eventIds);

        if (regError) {
          console.error('❌ Error fetching registrations:', regError);
          throw new Error('Erro ao buscar registros');
        }
        totalRegistrations = registrations?.length || 0;
      }

      const usageData = {
        totalEvents,
        totalRegistrations,
        activeEvents,
      };

      console.log('✅ Usage data:', usageData);
      setUsage(usageData);

    } catch (err: any) {
      console.error('❌ Error in fetchData:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  // Helper functions
  const canCreateEvent = () => {
    if (!plan?.max_events) return true;
    return usage.totalEvents < plan.max_events;
  };

  const canAddRegistration = (currentEventRegistrations: number = 0) => {
    // Verificar limite por evento
    if (plan?.max_guests_per_event && plan.max_guests_per_event > 0 &&
        currentEventRegistrations >= plan.max_guests_per_event) {
      return false;
    }
    
    return true;
  };

  const getRemainingEvents = () => {
    if (!plan?.max_events || plan.max_events < 0) return null;
    return Math.max(0, plan.max_events - usage.totalEvents);
  };

  const getRemainingRegistrations = () => {
    return null; // Sem limite total de registros na nova estrutura
  };

  const getUsagePercentage = (type: 'events' | 'registrations') => {
    if (type === 'events') {
      if (!plan?.max_events || plan.max_events < 0) return 0;
      return (usage.totalEvents / plan.max_events) * 100;
    } else {
      return 0; // Sem limite total na nova estrutura
    }
  };

  return {
    plan,
    company,
    usage,
    loading,
    error,
    canCreateEvent,
    canAddRegistration,
    getRemainingEvents,
    getRemainingRegistrations,
    getUsagePercentage,
    refreshData: fetchData,
  };
};