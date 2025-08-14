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
    console.log('🚀 Starting create-payment function');
    
    const { planId, paymentMethod } = await req.json();
    console.log('📝 Request data:', { planId, paymentMethod });
    
    // Inicializar Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('✅ Supabase client initialized');

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('❌ No authorization header found');
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Extracted token, authenticating user...');
    
    // Usar o cliente com anon key para verificar o token do usuário
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    if (!user) {
      console.error('❌ No user found after authentication');
      throw new Error('User not authenticated');
    }
    console.log('✅ User authenticated:', user.email);

    // Buscar perfil do usuário
    console.log('🔍 Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      throw new Error(`Profile not found: ${profileError.message}`);
    }

    if (!profile?.company_id) {
      console.error('❌ No company_id found in profile');
      throw new Error('Company not found for user');
    }
    console.log('✅ Profile found, company_id:', profile.company_id);

    // Buscar dados do plano
    console.log('🔍 Fetching plan data...');
    const { data: plan, error: planError } = await supabase
      .from('system_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('❌ Plan error:', planError);
      throw new Error(`Plan not found: ${planError.message}`);
    }

    if (!plan) {
      console.error('❌ No plan data returned');
      throw new Error('Plan not found');
    }
    console.log('✅ Plan found:', plan.name, 'Price:', plan.price);

    // Buscar dados da empresa
    console.log('🔍 Fetching company data...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, email')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      console.error('⚠️ Company error (non-fatal):', companyError);
    }
    console.log('✅ Company data:', company?.name || 'Not found');

    // Verificar se a API key está configurada
    const flowsApiKey = Deno.env.get('FLOWSPAY_API_KEY');
    if (!flowsApiKey) {
      console.error('❌ FlowsPay API key not configured');
      throw new Error('FlowsPay API key not configured');
    }
    console.log('✅ FlowsPay API key found');

    // Criar pagamento na FlowsPay
    const flowsPayload = {
      name: `Assinatura ${plan.name} - ${company?.name || user.email}`,
      description: plan.description || plan.name,
      value: Math.round(plan.price * 100), // converter para centavos
      customer_name: company?.name || user.email,
      customer_email: company?.email || user.email,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      payment_types: paymentMethod === 'pix' ? ['PIX'] : ['CREDIT_CARD'],
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/flows-webhook`,
      external_id: `${profile.company_id}_${planId}_${Date.now()}`
    };

    console.log('📦 Creating FlowsPay payment with payload:', flowsPayload);

    const flowsResponse = await fetch('https://api.flowspay.com.br/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flowsApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flowsPayload),
    });

    console.log('🌐 FlowsPay response status:', flowsResponse.status);

    if (!flowsResponse.ok) {
      const errorData = await flowsResponse.text();
      console.error('❌ FlowsPay error response:', errorData);
      throw new Error(`FlowsPay API error (${flowsResponse.status}): ${errorData}`);
    }

    const paymentData = await flowsResponse.json();
    console.log('✅ FlowsPay payment created:', paymentData);

    // Salvar transação no banco com ID do FlowsPay
    console.log('💾 Saving transaction to database...');
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
      console.error('❌ Error saving transaction:', transactionError);
      throw new Error(`Database error: ${transactionError.message}`);
    }
    console.log('✅ Transaction saved to database');

    // Preparar resposta baseada no método de pagamento
    let response;
    if (paymentMethod === 'pix') {
      response = {
        transactionId: paymentData.id,
        qrCodeBase64: paymentData.pix?.qr_code_base64,
        pixCopyPaste: paymentData.pix?.qr_code,
        pixKey: paymentData.pix?.key
      };
      console.log('🎯 PIX response prepared, QR code available:', !!response.qrCodeBase64);
    } else {
      response = {
        transactionId: paymentData.id,
        checkoutUrl: paymentData.checkout_url || paymentData.payment_url
      };
      console.log('💳 Card response prepared, checkout URL:', response.checkoutUrl);
    }

    console.log('🎉 Function completed successfully');
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
    console.error('💥 Error in create-payment function:', error);
    console.error('💥 Error stack:', error.stack);
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