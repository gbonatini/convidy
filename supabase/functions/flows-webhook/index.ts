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
    const webhookData = await req.json();
    console.log('FlowsPay webhook received:', webhookData);

    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extrair dados do webhook do FlowsPay
    const { id: flowsTransactionId, status, paid_at, external_id } = webhookData;

    console.log('Processing payment:', { flowsTransactionId, status, external_id });

    // Buscar transação no banco pelo ID do FlowsPay
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', flowsTransactionId)
      .single();

    if (!transaction) {
      console.log('Transaction not found:', flowsTransactionId);
      return new Response('Transaction not found', { status: 404 });
    }

    // Atualizar status da transação
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: status,
        payment_provider_data: webhookData,
        paid_at: paid_at ? new Date(paid_at).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    // Se o pagamento foi aprovado, atualizar dados da empresa
    if (status === 'approved' || status === 'paid' || status === 'completed') {
      console.log('Payment approved, updating company plan');

      const nextPaymentDue = new Date();
      nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

      // Buscar dados do plano
      const { data: plan } = await supabase
        .from('system_plans')
        .select('*')
        .eq('id', transaction.plan_id)
        .single();

      // Atualizar empresa com novo plano
      // -1 significa ilimitado (plano avançado)
      const maxGuests = plan?.slug === 'free' ? 5 : plan?.slug === 'avancado' ? -1 : 5;
      
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          plan_id: transaction.plan_id,
          plan_status: 'active',
          payment_status: 'active',
          next_payment_due: nextPaymentDue.toISOString(),
          max_monthly_guests: maxGuests,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.company_id);

      if (companyError) {
        console.error('Error updating company:', companyError);
        throw companyError;
      }

      console.log('Company plan updated successfully');
    }

    // Se o pagamento foi recusado ou cancelado
    if (status === 'refused' || status === 'cancelled' || status === 'expired') {
      console.log('Payment failed, keeping current plan');
      
      // Opcionalmente, você pode implementar uma lógica aqui
      // para notificar o usuário sobre o pagamento falhado
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in flows-webhook function:', error);
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