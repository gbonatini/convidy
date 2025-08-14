import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, QrCode, Crown, Zap, Users } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  max_events: number | null;
  max_registrations_per_event: number | null;
  max_total_registrations: number | null;
  features: string[];
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onOpenChange,
  plan,
  onSuccess
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | ''>('');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const getPlanIcon = () => {
    switch (plan.name.toLowerCase()) {
      case 'empresarial':
        return <Crown className="h-8 w-8 text-yellow-500" />;
      case 'profissional':
        return <Zap className="h-8 w-8 text-blue-500" />;
      default:
        return <Users className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatLimit = (limit: number | null) => {
    return limit === null ? 'Ilimitado' : limit.toString();
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um método de pagamento.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          planId: plan.id,
          paymentMethod: paymentMethod
        }
      });

      if (error) throw error;

      if (paymentMethod === 'pix') {
        setQrCodeUrl(data.qrCodeBase64);
        // Iniciar polling para verificar pagamento
        startPaymentPolling(data.transactionId);
      } else {
        setPaymentUrl(data.checkoutUrl);
        // Abrir checkout em nova aba
        window.open(data.checkoutUrl, '_blank');
      }

    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      
      let errorMessage = "Não foi possível processar o pagamento. Tente novamente.";
      
      // Tratar erros específicos
      if (error?.message?.includes('API key')) {
        errorMessage = "Erro de configuração do sistema de pagamento. Entre em contato com o suporte.";
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (error?.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast({
        variant: "destructive",
        title: "Erro no pagamento",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (transactionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { transactionId }
        });

        if (error) {
          console.error('Erro ao verificar pagamento:', error);
          return;
        }

        if (data.status === 'approved') {
          clearInterval(pollInterval);
          toast({
            title: "Pagamento aprovado!",
            description: "Seu plano foi ativado com sucesso.",
          });
          onSuccess();
          onOpenChange(false);
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      }
    }, 3000);

    // Parar polling após 10 minutos
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  const handleClose = () => {
    setQrCodeUrl(null);
    setPaymentUrl(null);
    setPaymentMethod('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getPlanIcon()}
            <span>Assinar Plano {plan.name}</span>
          </DialogTitle>
          <DialogDescription>
            Finalize a assinatura do seu plano
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Plano */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Plano {plan.name}</span>
              <Badge variant="outline">Mensal</Badge>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Eventos:</span>
                <span>{formatLimit(plan.max_events)}</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmações por evento:</span>
                <span>{formatLimit(plan.max_registrations_per_event)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total confirmações:</span>
                <span>{formatLimit(plan.max_total_registrations)}</span>
              </div>
            </div>

            <Separator />
            
            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span className="text-lg">{formatPrice(plan.price)}</span>
            </div>
          </div>

          {!qrCodeUrl && !paymentUrl && (
            <>
              {/* Método de Pagamento */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'pix' | 'card')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-4 w-4" />
                        <span>PIX (Aprovação instantânea)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Cartão de Crédito</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão de Pagamento */}
              <Button 
                onClick={handlePayment} 
                disabled={loading || !paymentMethod}
                className="w-full"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {paymentMethod === 'pix' ? 'Gerar QR Code PIX' : 'Pagar com Cartão'}
              </Button>
            </>
          )}

          {/* QR Code PIX */}
          {qrCodeUrl && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={`data:image/png;base64,${qrCodeUrl}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Escaneie o QR Code com seu app bancário</p>
                <p className="text-xs text-muted-foreground">
                  O pagamento será confirmado automaticamente
                </p>
              </div>
            </div>
          )}

          {/* Link Cartão */}
          {paymentUrl && (
            <div className="text-center space-y-4">
              <p className="text-sm">
                Uma nova aba foi aberta para finalizar o pagamento
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.open(paymentUrl, '_blank')}
              >
                Abrir Checkout Novamente
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};