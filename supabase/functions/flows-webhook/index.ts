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

    const { id: transactionId, status, paid_at } = webhookData;

    // Buscar transação no banco
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('flows_transaction_id', transactionId)
      .single();

    if (!transaction) {
      console.log('Transaction not found:', transactionId);
      return new Response('Transaction not found', { status: 404 });
    }

    // Atualizar status da transação
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: status,
        payment_data: webhookData,
        paid_at: paid_at ? new Date(paid_at).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    // Se o pagamento foi aprovado, atualizar dados da empresa
    if (status === 'approved' || status === 'paid') {
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
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          plan_id: transaction.plan_id,
          plan_status: 'active',
          last_payment_date: new Date().toISOString(),
          next_payment_due: nextPaymentDue.toISOString(),
          payment_status: 'active',
          max_monthly_guests: plan?.slug === 'free' ? 10 : plan?.slug === 'pro' ? 100 : 999999,
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