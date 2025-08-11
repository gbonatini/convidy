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
    const { transactionId } = await req.json();

    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar transação no banco
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Se já foi aprovada, retornar sucesso
    if (transaction.status === 'approved' || transaction.status === 'paid' || transaction.status === 'completed') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'approved',
          transaction
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar status real no FlowsPay
    const flowsApiKey = Deno.env.get('FLOWSPAY_API_KEY');
    if (flowsApiKey) {
      try {
        const flowsResponse = await fetch(`https://api.flowspay.com.br/v1/payments/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${flowsApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (flowsResponse.ok) {
          const flowsData = await flowsResponse.json();
          console.log('FlowsPay status check:', flowsData);

          // Se o status mudou, atualizar no banco
          if (flowsData.status !== transaction.status) {
            const { error: updateError } = await supabase
              .from('payment_transactions')
              .update({
                status: flowsData.status,
                payment_provider_data: flowsData,
                paid_at: flowsData.paid_at ? new Date(flowsData.paid_at).toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq('id', transaction.id);

            if (!updateError && (flowsData.status === 'approved' || flowsData.status === 'paid' || flowsData.status === 'completed')) {
              // Atualizar plano da empresa
              const nextPaymentDue = new Date();
              nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

              const { data: plan } = await supabase
                .from('system_plans')
                .select('*')
                .eq('id', transaction.plan_id)
                .single();

              await supabase
                .from('companies')
                .update({
                  plan_id: transaction.plan_id,
                  plan_status: 'active',
                  payment_status: 'active',
                  next_payment_due: nextPaymentDue.toISOString(),
                  max_monthly_guests: plan?.slug === 'free' ? 10 : plan?.slug === 'profissional' ? 100 : 500,
                  updated_at: new Date().toISOString()
                })
                .eq('id', transaction.company_id);

              return new Response(
                JSON.stringify({
                  success: true,
                  status: 'approved',
                  transaction: {
                    ...transaction,
                    status: flowsData.status,
                    paid_at: flowsData.paid_at
                  }
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }

            return new Response(
              JSON.stringify({
                success: true,
                status: flowsData.status,
                transaction: {
                  ...transaction,
                  status: flowsData.status
                }
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }
      } catch (flowsError) {
        console.error('Error checking FlowsPay status:', flowsError);
        // Continuar com a lógica de fallback
      }
    }

    // Retornar status atual
    return new Response(
      JSON.stringify({
        success: true,
        status: transaction.status,
        transaction
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in check-payment-status function:', error);
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