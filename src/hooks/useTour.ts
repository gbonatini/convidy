import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

const TOUR_KEY = 'convidy_tour_completed';
const VISIT_COUNT_KEY = 'convidy_visit_count';

export const useTour = () => {
  const { user } = useAuth();
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!user) return;

    const tourCompleted = localStorage.getItem(`${TOUR_KEY}_${user.id}`);
    const visitCount = parseInt(localStorage.getItem(`${VISIT_COUNT_KEY}_${user.id}`) || '0');

    // Incrementa contador de visitas
    const newVisitCount = visitCount + 1;
    localStorage.setItem(`${VISIT_COUNT_KEY}_${user.id}`, newVisitCount.toString());

    // Mostra tour se não foi completado e está nas primeiras 2 visitas
    if (!tourCompleted && newVisitCount <= 2) {
      setShouldShowTour(true);
      setRun(true);
    }
  }, [user]);

  const completeTour = () => {
    if (user) {
      localStorage.setItem(`${TOUR_KEY}_${user.id}`, 'true');
    }
    setShouldShowTour(false);
    setRun(false);
  };

  const startTour = () => {
    setRun(true);
  };

  return {
    shouldShowTour,
    run,
    setRun,
    completeTour,
    startTour,
  };
};