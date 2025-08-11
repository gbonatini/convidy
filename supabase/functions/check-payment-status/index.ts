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
    if (transaction.status === 'approved') {
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

    // Aqui você integraria com a API da FlowsPay para verificar o status real
    // Por enquanto, vamos simular uma aprovação após um tempo
    const createdAt = new Date(transaction.created_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    // Simular aprovação após 2-5 minutos para PIX
    if (transaction.payment_method === 'pix' && minutesElapsed > 2) {
      // Atualizar status para aprovado
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'approved',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw updateError;
      }

      // Atualizar plano da empresa
      const nextPaymentDue = new Date();
      nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

      const { error: companyError } = await supabase
        .from('companies')
        .update({
          plan_id: transaction.plan_id,
          plan_status: 'active',
          payment_status: 'active',
          next_payment_due: nextPaymentDue.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.company_id);

      if (companyError) {
        console.error('Error updating company plan:', companyError);
        throw companyError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'approved',
          transaction: {
            ...transaction,
            status: 'approved',
            paid_at: new Date().toISOString()
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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