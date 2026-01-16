import { useCompanyPlan } from './useCompanyPlan';

// Hook de compatibilidade para não quebrar componentes existentes
export const usePlanLimits = () => {
  const {
    plan,
    usage,
    loading,
    error,
    canCreateEvent,
    canAddRegistration,
    getRemainingEvents,
    getRemainingRegistrations,
    getUsagePercentage,
    refreshData
  } = useCompanyPlan();

  return {
    planLimits: {
      maxEvents: plan?.max_events || null,
      maxRegistrationsPerEvent: plan?.max_guests_per_event || null,
      maxTotalRegistrations: null, // Removido na nova estrutura
    },
    usage,
    planName: plan?.name || '',
    loading,
    error,
    canCreateEvent,
    canAddRegistration,
    getRemainingEvents,
    getRemainingRegistrations,
    getUsagePercentage,
    refreshUsage: refreshData,
  };
};