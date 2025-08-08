import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutoInactivateEvents = () => {
  useEffect(() => {
    const checkAndInactivateEvents = async () => {
      try {
        // Call the database function to auto-inactivate expired events
        const { error } = await supabase.rpc('auto_inactivate_expired_events');
        
        if (error) {
          console.error('Error auto-inactivating events:', error);
        }
      } catch (error) {
        console.error('Error checking events:', error);
      }
    };

    // Check immediately when component mounts
    checkAndInactivateEvents();

    // Set up interval to check daily (24 hours)
    const interval = setInterval(checkAndInactivateEvents, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};