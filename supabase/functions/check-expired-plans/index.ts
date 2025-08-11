import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('Running check-expired-plans function');

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();
    
    // Buscar plano gratuito
    const { data: freePlan } = await supabase
      .from('system_plans')
      .select('id')
      .eq('slug', 'free')
      .single();

    if (!freePlan) {
      throw new Error('Free plan not found');
    }

    // Buscar empresas com planos vencidos (excluindo plano gratuito)
    const { data: expiredCompanies } = await supabase
      .from('companies')
      .select('id, name, email, next_payment_due, plan_id')
      .lt('next_payment_due', now)
      .neq('plan_id', freePlan.id)
      .eq('payment_status', 'active');

    console.log(`Found ${expiredCompanies?.length || 0} expired companies`);

    if (expiredCompanies && expiredCompanies.length > 0) {
      // Downgrade para plano gratuito
      const { error: downgradeError } = await supabase
        .from('companies')
        .update({
          plan_id: freePlan.id,
          plan_status: 'active',
          payment_status: 'expired',
          max_monthly_guests: 10,
          updated_at: new Date().toISOString()
        })
        .in('id', expiredCompanies.map(c => c.id));

      if (downgradeError) {
        console.error('Error downgrading companies:', downgradeError);
        throw downgradeError;
      }

      // Log das empresas que foram rebaixadas
      for (const company of expiredCompanies) {
        console.log(`Company ${company.name} (${company.id}) downgraded to free plan due to expired payment`);
        
        // Aqui você pode implementar notificações por email
        // usando um serviço como Resend
      }
    }

    // Buscar empresas que vão vencer em 3 dias (para avisos)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: warningCompanies } = await supabase
      .from('companies')
      .select('id, name, email, next_payment_due')
      .lte('next_payment_due', threeDaysFromNow.toISOString())
      .gt('next_payment_due', now)
      .neq('plan_id', freePlan.id)
      .eq('payment_status', 'active');

    console.log(`Found ${warningCompanies?.length || 0} companies with payments due in 3 days`);

    // Aqui você pode implementar o envio de emails de aviso
    if (warningCompanies && warningCompanies.length > 0) {
      for (const company of warningCompanies) {
        console.log(`Warning: Company ${company.name} payment due on ${company.next_payment_due}`);
        // Implementar envio de email de aviso
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_companies: expiredCompanies?.length || 0,
        warning_companies: warningCompanies?.length || 0,
        message: 'Check completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in check-expired-plans function:', error);
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