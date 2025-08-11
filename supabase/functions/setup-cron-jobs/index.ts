import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Setting up cron jobs for automatic plan checks');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Habilitar extensões necessárias
    const { error: cronError } = await supabase.rpc('sql', {
      query: `
        -- Habilitar extensões pg_cron e pg_net se não estiverem habilitadas
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        CREATE EXTENSION IF NOT EXISTS pg_net;
      `
    });

    if (cronError) {
      console.error('Error enabling extensions:', cronError);
    }

    // Configurar cron job para verificar planos expirados diariamente às 9h
    const { error: scheduleError } = await supabase.rpc('sql', {
      query: `
        SELECT cron.schedule(
          'check-expired-plans-daily',
          '0 9 * * *', -- Diariamente às 9h
          $$
          select
            net.http_post(
                url:='${Deno.env.get('SUPABASE_URL')}/functions/v1/check-expired-plans',
                headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
                body:=concat('{"time": "', now(), '"}')::jsonb
            ) as request_id;
          $$
        );
      `
    });

    if (scheduleError) {
      console.error('Error scheduling cron job:', scheduleError);
      throw scheduleError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cron jobs configured successfully',
        jobs: [
          {
            name: 'check-expired-plans-daily',
            schedule: '0 9 * * *',
            description: 'Check for expired plans daily at 9 AM'
          }
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in setup-cron-jobs function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});