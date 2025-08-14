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
    const { planId, paymentMethod } = await req.json();
    
    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('Company not found');
    }

    // Buscar dados do plano
    const { data: plan } = await supabase
      .from('system_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Buscar dados da empresa
    const { data: company } = await supabase
      .from('companies')
      .select('name, email')
      .eq('id', profile.company_id)
      .single();

    // Criar pagamento na FlowsPay
    const flowsPayload = {
      name: `Assinatura ${plan.name} - ${company?.name}`,
      description: plan.description,
      value: Math.round(plan.price * 100), // converter para centavos
      customer_name: company?.name || user.email,
      customer_email: company?.email || user.email,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      payment_types: paymentMethod === 'pix' ? ['PIX'] : ['CREDIT_CARD'],
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/flows-webhook`,
      external_id: `${profile.company_id}_${planId}_${Date.now()}`
    };

    console.log('Creating FlowsPay payment:', flowsPayload);

    // Verificar se a API key está configurada
    const flowsApiKey = Deno.env.get('FLOWSPAY_API_KEY');
    if (!flowsApiKey) {
      throw new Error('FlowsPay API key not configured');
    }

    const flowsResponse = await fetch('https://api.flowspay.com.br/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flowsApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flowsPayload),
    });

    if (!flowsResponse.ok) {
      const errorData = await flowsResponse.text();
      console.error('FlowsPay error:', errorData);
      throw new Error(`FlowsPay error: ${flowsResponse.status}`);
    }

    const paymentData = await flowsResponse.json();
    console.log('FlowsPay response:', paymentData);

    // Gerar ID de transação único  
    const transactionId = `${profile.company_id}_${planId}_${Date.now()}`;
    
    // Salvar transação no banco com ID do FlowsPay
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        company_id: profile.company_id,
        plan_id: planId,
        transaction_id: paymentData.id, // Usar ID real do FlowsPay
        payment_method: paymentMethod,
        amount: plan.price,
        status: paymentData.status || 'pending',
        payment_provider_data: paymentData,
        expires_at: paymentData.expires_at || flowsPayload.expires_at
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error saving transaction:', transactionError);
      throw transactionError;
    }

    // Preparar resposta baseada no método de pagamento
    let response;
    if (paymentMethod === 'pix') {
      response = {
        transactionId: paymentData.id,
        qrCodeBase64: paymentData.pix?.qr_code_base64,
        pixCopyPaste: paymentData.pix?.qr_code,
        pixKey: paymentData.pix?.key
      };
    } else {
      response = {
        transactionId: paymentData.id,
        checkoutUrl: paymentData.checkout_url || paymentData.payment_url
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...response
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-payment function:', error);
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