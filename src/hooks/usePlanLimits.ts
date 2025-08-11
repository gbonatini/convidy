import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface PlanLimits {
  maxEvents: number | null;
  maxRegistrationsPerEvent: number | null;
  maxTotalRegistrations: number | null;
}

interface PlanUsage {
  totalEvents: number;
  totalRegistrations: number;
  activeEvents: number;
}

interface CompanyPlan {
  plan: {
    name: string;
    slug: string;
    max_events: number | null;
    max_registrations_per_event: number | null;
    max_total_registrations: number | null;
  };
}

export const usePlanLimits = () => {
  const { profile } = useAuth();
  const [planLimits, setPlanLimits] = useState<PlanLimits>({
    maxEvents: null,
    maxRegistrationsPerEvent: null,
    maxTotalRegistrations: null,
  });
  const [usage, setUsage] = useState<PlanUsage>({
    totalEvents: 0,
    totalRegistrations: 0,
    activeEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string>('');

  const fetchPlanData = async () => {
    if (!profile?.company_id) {
      console.log('❌ No company_id in profile:', profile);
      return;
    }

    try {
      console.log('🔍 Fetching plan data for company:', profile.company_id);
      
      // Buscar apenas o plan_id da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('plan_id')
        .eq('id', profile.company_id)
        .single();

      if (companyError) {
        console.error('❌ Error fetching company:', companyError);
        return;
      }

      if (!companyData?.plan_id) {
        console.error('❌ No plan_id found for company');
        return;
      }

      console.log('📊 Company data fetched:', companyData);

      // Buscar dados do plano separadamente
      const { data: planData, error: planError } = await supabase
        .from('system_plans')
        .select('name, slug, max_events, max_registrations_per_event, max_total_registrations')
        .eq('id', companyData.plan_id)
        .single();

      if (planError) {
        console.error('❌ Error fetching plan:', planError);
        return;
      }

      console.log('🎯 Plan details:', {
        name: planData.name,
        slug: planData.slug,
        maxEvents: planData.max_events,
        maxRegistrationsPerEvent: planData.max_registrations_per_event,
        maxTotalRegistrations: planData.max_total_registrations
      });
      
      setPlanLimits({
        maxEvents: planData.max_events,
        maxRegistrationsPerEvent: planData.max_registrations_per_event,
        maxTotalRegistrations: planData.max_total_registrations,
      });
      setPlanName(planData.name);

      // Buscar uso atual
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, status')
        .eq('company_id', profile.company_id);

      if (eventsError) throw eventsError;

      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter(e => e.status === 'active').length || 0;
      const eventIds = events?.map(e => e.id) || [];

      let totalRegistrations = 0;
      if (eventIds.length > 0) {
        const { data: registrations, error: regError } = await supabase
          .from('registrations')
          .select('id')
          .in('event_id', eventIds);

        if (regError) throw regError;
        totalRegistrations = registrations?.length || 0;
      }

      setUsage({
        totalEvents,
        totalRegistrations,
        activeEvents,
      });

      console.log('✅ Plan data loaded successfully:', {
        planName: planData.name,
        usage: { totalEvents, totalRegistrations, activeEvents }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar dados do plano:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, [profile?.company_id]);

  const canCreateEvent = () => {
    if (planLimits.maxEvents === null) return true;
    return usage.totalEvents < planLimits.maxEvents;
  };

  const canAddRegistration = (currentEventRegistrations: number = 0) => {
    // Verificar limite por evento
    if (planLimits.maxRegistrationsPerEvent !== null && 
        currentEventRegistrations >= planLimits.maxRegistrationsPerEvent) {
      return false;
    }
    
    // Verificar limite total
    if (planLimits.maxTotalRegistrations !== null && 
        usage.totalRegistrations >= planLimits.maxTotalRegistrations) {
      return false;
    }
    
    return true;
  };

  const getRemainingEvents = () => {
    if (planLimits.maxEvents === null) return null;
    return Math.max(0, planLimits.maxEvents - usage.totalEvents);
  };

  const getRemainingRegistrations = () => {
    if (planLimits.maxTotalRegistrations === null) return null;
    return Math.max(0, planLimits.maxTotalRegistrations - usage.totalRegistrations);
  };

  const getUsagePercentage = (type: 'events' | 'registrations') => {
    if (type === 'events') {
      if (planLimits.maxEvents === null) return 0;
      return (usage.totalEvents / planLimits.maxEvents) * 100;
    } else {
      if (planLimits.maxTotalRegistrations === null) return 0;
      return (usage.totalRegistrations / planLimits.maxTotalRegistrations) * 100;
    }
  };

  const refreshUsage = () => {
    fetchPlanData();
  };

  return {
    planLimits,
    usage,
    planName,
    loading,
    canCreateEvent,
    canAddRegistration,
    getRemainingEvents,
    getRemainingRegistrations,
    getUsagePercentage,
    refreshUsage,
  };
};