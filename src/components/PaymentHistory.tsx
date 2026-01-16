import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, QrCode, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PaymentTransaction {
  id: string;
  payment_provider_id: string | null;
  payment_method: string | null;
  amount: number;
  status: string | null;
  created_at: string;
  paid_at: string | null;
  system_plans: {
    name: string;
    slug: string;
  } | null;
}

export const PaymentHistory: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaymentHistory = async () => {
    if (!profile?.company_id) return;

    try {
      // Buscar transações separadamente
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('id, payment_provider_id, payment_method, amount, status, created_at, paid_at, plan_id')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;

      // Para cada transação, buscar o plano
      const transactionsWithPlans = await Promise.all(
        (transactionsData || []).map(async (transaction) => {
          const { data: planData, error: planError } = await supabase
            .from('system_plans')
            .select('name, slug')
            .eq('id', transaction.plan_id)
            .single();

          return {
            ...transaction,
            system_plans: planData || { name: 'Plano desconhecido', slug: 'unknown' }
          };
        })
      );

      setTransactions(transactionsWithPlans as PaymentTransaction[] || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o histórico de pagamentos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [profile]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'cancelled':
        return 'Cancelado';
      case 'processing':
        return 'Processando';
      default:
        return 'Pendente';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    return method === 'pix' ? 
      <QrCode className="h-4 w-4" /> : 
      <CreditCard className="h-4 w-4" />;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma transação encontrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pagamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={transaction.id}>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getPaymentMethodIcon(transaction.payment_method)}
                  <div>
                    <p className="font-medium">
                      Plano {transaction.system_plans.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(transaction.amount)}</p>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(transaction.status)}
                    <Badge variant={getStatusVariant(transaction.status)} className="text-xs">
                      {getStatusLabel(transaction.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {index < transactions.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};