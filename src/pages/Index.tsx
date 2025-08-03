import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, BarChart3, Shield, Smartphone, Zap, CheckCircle, ArrowRight, Star, MessageCircle, QrCode, Activity, TrendingUp, Clock, Globe, UserCheck, Database, Award, Target, X, Check, AlertTriangle, Timer, ChevronDown, Building2, Briefcase, Users2, Gift, Crown, Flame } from 'lucide-react';
const Index = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return {
            ...prev,
            seconds: prev.seconds - 1
          };
        } else if (prev.minutes > 0) {
          return {
            ...prev,
            minutes: prev.minutes - 1,
            seconds: 59
          };
        } else if (prev.hours > 0) {
          return {
            hours: prev.hours - 1,
            minutes: 59,
            seconds: 59
          };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const faqs = [{
    question: "É realmente gratuito?",
    answer: "Sim! O plano básico é 100% gratuito para sempre. Você só paga se quiser recursos avançados do plano PRO, mas pode começar sem custo algum."
  }, {
    question: "Preciso baixar algum app?",
    answer: "Não! O Convidy funciona 100% no navegador. Seus convidados recebem links e acessam tudo pelo WhatsApp e navegador, sem downloads."
  }, {
    question: "Funciona pra eventos híbridos?",
    answer: "Perfeitamente! Você pode gerenciar eventos presenciais, online ou híbridos na mesma plataforma, com check-ins específicos para cada formato."
  }, {
    question: "Como funciona a análise por CPF?",
    answer: "Com total segurança e conformidade LGPD, cruzamos dados de participação entre eventos para identificar padrões de comportamento e otimizar futuras ações."
  }, {
    question: "Meus dados estão seguros?",
    answer: "100% seguros! Somos totalmente conformes com a LGPD, seus dados ficam criptografados e você tem controle total sobre eles."
  }, {
    question: "Posso cancelar quando quiser?",
    answer: "Claro! Não há fidelidade. Pode cancelar a qualquer momento e continuar usando o plano gratuito normalmente."
  }];
  return <div className="min-h-screen bg-background">
      {/* Urgency Banner */}
      

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Convidy
            </h1>
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              PRO Grátis
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Gift className="mr-2 h-4 w-4" />
                Garantir PRO Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden lg:py-[68px]">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* Segmentation Badge */}
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-2 px-[15px]">
              Feito sob medida para agências, RHs e organizadores de eventos corporativos
            </Badge>
            
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Chega de eventos vazios:
                <span className="block bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                  o jeito inteligente de garantir convidados no dia
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Seu evento lotado, no horário certo e com dados na mão – sem stress. 
                A plataforma de eventos que pensa como você: eficiente, direta e automatizada.
              </p>
            </div>
            
            {/* Urgency Offer Box */}
            
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Target className="mr-2 h-5 w-5" />
                  Quero meu evento lotado com 1 clique
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                Ver Como Funciona
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">14 dias PRO grátis</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Sem cartão</span>
              </div>
              <div className="flex items-center space-x-2 text-purple-600">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Setup em 3 min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              +200 empresas confiam no Convidy
            </h2>
            
            {/* Fake but realistic company logos */}
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8" />
                <span className="font-bold text-lg">TechCorp</span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8" />
                <span className="font-bold text-lg">InnovaRH</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users2 className="h-8 w-8" />
                <span className="font-bold text-lg">EventPro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8" />
                <span className="font-bold text-lg">Excellence</span>
              </div>
            </div>

            {/* Case Study */}
            

            {/* Key Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">15.000+</div>
                <div className="text-sm text-muted-foreground">eventos realizados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">87%</div>
                <div className="text-sm text-muted-foreground">taxa média de presença</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">3x</div>
                <div className="text-sm text-muted-foreground">mais presença vs método tradicional</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points vs Solution */}
      <section className="py-20 bg-gradient-to-b from-destructive/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ainda usando planilhas e check-in na mão?
            </h2>
            <p className="text-xl text-destructive font-medium">
              Você tá perdendo tempo, convidados e autoridade. Isso morreu.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Before - Pain Points */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-destructive mb-4">❌ Método Tradicional</h3>
                <p className="text-muted-foreground">Seu evento começa atrasado, a galera fura, e você nem sabe por quê?</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium">Convites por email que ninguém vê</h4>
                    <p className="text-sm text-muted-foreground">Taxa de abertura de 20%, confirmações duvidosas</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium">Planilhas confusas e desatualizadas</h4>
                    <p className="text-sm text-muted-foreground">Você nunca sabe quem realmente vai aparecer</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium">Check-in manual e filas intermináveis</h4>
                    <p className="text-sm text-muted-foreground">Evento começa atrasado, impressão ruim desde o início</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg">
                  <X className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium">Zero dados para melhorar</h4>
                    <p className="text-sm text-muted-foreground">Repete os mesmos erros a cada evento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* After - Convidy Solution */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-600 mb-4">✅ Com Convidy</h3>
                <p className="text-muted-foreground">Você controla tudo, eventos lotados, dados na mão</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Convites pelo WhatsApp com 95% de abertura</h4>
                    <p className="text-sm text-muted-foreground">Confirmações em tempo real, lista sempre atualizada</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Área pública personalizada da sua empresa</h4>
                    <p className="text-sm text-muted-foreground">Seus eventos têm cara profissional e credibilidade</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Check-in com QR Code em 3 segundos</h4>
                    <p className="text-sm text-muted-foreground">Evento começa pontual, experiência premium</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Análise comportamental por CPF</h4>
                    <p className="text-sm text-muted-foreground">Cada evento fica melhor que o anterior</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8">
                Chega de eventos vazios – começar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits by Segment */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Soluções específicas para cada necessidade
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For HR */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Users2 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-800">Para RH</CardTitle>
                <CardDescription>
                  Treinamentos, integrações, eventos internos com presença garantida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Análise de engajamento por colaborador</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Relatórios de presença automáticos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Convites personalizados por setor</span>
                </div>
              </CardContent>
            </Card>

            {/* For Agencies */}
            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-purple-800">Para Agências</CardTitle>
                <CardDescription>
                  Eventos de clientes com a qualidade que eles esperam da sua agência
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">White label com logo do cliente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Relatórios profissionais automatizados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Gestão de múltiplos clientes</span>
                </div>
              </CardContent>
            </Card>

            {/* For Event Planners */}
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-800">Para Event Planners</CardTitle>
                <CardDescription>
                  Eventos corporativos com taxa de presença que impressiona o cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Previsão de presença com IA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Check-in premium com QR Code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Dados comportamentais únicos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              O que nossos clientes falam
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />)}
                </div>
                <p className="text-lg mb-4 italic">
                  "Nossos eventos corporativos eram um caos. Com o Convidy, triplicamos a presença e ainda economizamos 5 horas de trabalho por evento."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">MR</span>
                  </div>
                  <div>
                    <div className="font-medium">Maria Rosa</div>
                    <div className="text-sm text-muted-foreground">Diretora de RH - TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />)}
                </div>
                <p className="text-lg mb-4 italic">
                  "Meus clientes ficaram impressionados com a organização. O check-in por QR Code é profissional demais. Virou diferencial da agência."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">JS</span>
                  </div>
                  <div>
                    <div className="font-medium">João Silva</div>
                    <div className="text-sm text-muted-foreground">CEO - InnovaRH Agência</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Resultados comprovados
            </h2>
            <p className="text-xl text-muted-foreground">
              Empresas que usam Convidy têm 3x mais presença nos eventos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">+72%</div>
              <div className="text-sm text-muted-foreground">aumento na taxa de presença</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-sm text-muted-foreground">taxa de abertura no WhatsApp</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">5h</div>
              <div className="text-sm text-muted-foreground">economizadas por evento</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">3s</div>
              <div className="text-sm text-muted-foreground">tempo de check-in</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-muted-foreground">
              Tire suas dúvidas antes de começar
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => <Card key={index} className="border">
                <CardHeader className="cursor-pointer" onClick={() => setFaqOpen(faqOpen === index ? null : index)}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-left text-lg">{faq.question}</CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform ${faqOpen === index ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
                {faqOpen === index && <CardContent className="pt-0">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>}
              </Card>)}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="space-y-8 max-w-3xl mx-auto">
            {/* Urgency reminder */}
            

            <h2 className="text-3xl md:text-5xl font-bold">
              Pronto para ter eventos lotados?
            </h2>
            <p className="text-xl opacity-90 leading-relaxed">
              Mais de 200 empresas já pararam de perder tempo com planilhas e check-ins manuais. 
              <strong className="block mt-2">Seja a próxima a ter eventos com presença garantida!</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-10 py-4 bg-white text-primary hover:bg-white/90">
                  <Flame className="mr-2 h-5 w-5" />
                  Garantir meus 14 dias PRO grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm opacity-90 max-w-xl mx-auto">
              
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Setup em 3 minutos</span>
              </div>
            </div>

            
          </div>
        </div>
        
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-secondary opacity-10"></div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Convidy
            </h3>
            <p className="text-muted-foreground">
              A plataforma completa para eventos corporativos que realmente funcionam
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <span>© 2024 Convidy. Todos os direitos reservados.</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <span>✅ LGPD Compliant</span>
              <span>•</span>
              <span>🔒 Dados Seguros</span>
              <span>•</span>
              <span>⚡ Suporte 24/7</span>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;