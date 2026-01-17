import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, BarChart3, Shield, Smartphone, Zap, CheckCircle, ArrowRight, Star, MessageCircle, QrCode, Activity, TrendingUp, Clock, Globe, UserCheck, Database, Award, Target, X, Check, AlertTriangle, Timer, ChevronDown, Building2, Briefcase, Users2, Gift, Crown, Flame, Brain, LineChart, PieChart, Settings, Eye, Rocket, DollarSign, Users as UsersIcon, Building, CreditCard } from 'lucide-react';
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
    question: "Como funciona a IA de análise comportamental?",
    answer: "Nossa IA analisa padrões de comparecimento, horários preferidos, tipos de eventos favoritos e histórico de participação por CPF (com total conformidade LGPD) para prever presença e otimizar futuros convites."
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
            
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Gift className="mr-2 h-4 w-4" />
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden lg:py-0">
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
                A única plataforma com <strong>IA integrada</strong> que analisa comportamentos dos convidados 
                para garantir cada vez mais presença nos seus eventos.
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
                <span className="font-medium">Totalmente gratuito</span>
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
      <section className="py-16 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Empresas que confiam no Convidy</h2>
            
            {/* Fake but realistic company logos */}
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Building2 className="h-8 w-8" />
                <span className="font-bold text-lg">TechCorp</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Briefcase className="h-8 w-8" />
                <span className="font-bold text-lg">InnovaRH</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Users2 className="h-8 w-8" />
                <span className="font-bold text-lg">EventPro</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Award className="h-8 w-8" />
                <span className="font-bold text-lg">Excellence</span>
              </div>
            </div>

            {/* Key Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5.000+</div>
                <div className="text-sm text-muted-foreground">eventos realizados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">87%</div>
                <div className="text-sm text-muted-foreground">taxa média de presença</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-info">3x</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
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
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Convites por email que ninguém vê</h4>
                    <p className="text-sm text-muted-foreground">Taxa de abertura de 20%, confirmações duvidosas</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Planilhas confusas e desatualizadas</h4>
                    <p className="text-sm text-muted-foreground">Você nunca sabe quem realmente vai aparecer</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Check-in manual e filas intermináveis</h4>
                    <p className="text-sm text-muted-foreground">Evento começa atrasado, impressão ruim desde o início</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Zero dados para melhorar</h4>
                    <p className="text-sm text-muted-foreground">Repete os mesmos erros a cada evento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* After - Convidy Solution */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-success mb-4">✅ Com Convidy</h3>
                <p className="text-muted-foreground">Você controla tudo, eventos lotados, dados na mão</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Convites pelo WhatsApp com 95% de abertura</h4>
                    <p className="text-sm text-muted-foreground">Confirmações em tempo real, lista sempre atualizada</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Área pública personalizada da sua empresa</h4>
                    <p className="text-sm text-muted-foreground">Seus eventos têm cara profissional e credibilidade</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Check-in com QR Code em 3 segundos</h4>
                    <p className="text-sm text-muted-foreground">Evento começa pontual, experiência premium</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 bg-success/10 rounded-lg border border-success/20">
                  <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">IA analisa comportamentos e prevê ausências</h4>
                    <p className="text-sm text-muted-foreground">Nossa inteligência artificial identifica pessoas que podem não comparecer baseado no histórico, permitindo ações preventivas como lembretes personalizados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="bg-success hover:bg-success/90 text-lg px-8">
                Chega de eventos vazios – começar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits by Segment */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Soluções específicas para cada necessidade
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For HR */}
            <Card className="border-2 border-info/20 bg-info/5 hover:bg-info/10 transition-colors">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-info/10 flex items-center justify-center mx-auto mb-4">
                  <Users2 className="h-8 w-8 text-info" />
                </div>
                <CardTitle className="text-xl text-info">Para RH</CardTitle>
                <CardDescription>
                  Treinamentos, integrações, eventos internos com presença garantida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Análise de engajamento por colaborador</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Relatórios de presença automáticos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Convites personalizados por setor</span>
                </div>
              </CardContent>
            </Card>

            {/* For Agencies */}
            <Card className="border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl text-primary">Para Agências</CardTitle>
                <CardDescription>
                  Eventos de clientes com a qualidade que eles esperam da sua agência
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">White label com logo do cliente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Relatórios profissionais automatizados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">Gestão de múltiplos clientes</span>
                </div>
              </CardContent>
            </Card>

            {/* For Event Planners */}
            <Card className="border-2 border-success/20 bg-success/5 hover:bg-success/10 transition-colors">
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
                  <span className="text-sm">IA prevê presença analisando histórico comportamental</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Check-in premium com QR Code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Relatórios inteligentes com insights únicos</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Confirmation & Check-in Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              Confirmação & Check-in Automático
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Confirmação simples, check-in instantâneo
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seus convidados confirmam com 1 clique e fazem check-in com código de barras em segundos. 
              Zero filas, zero stress, experiência premium.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Confirmation Process */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-4">Confirmação sem complicação</h3>
                <p className="text-muted-foreground">
                  Link direto no WhatsApp, um clique e pronto. Você acompanha tudo em tempo real.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Recebe no WhatsApp</h4>
                    <p className="text-sm text-muted-foreground">Convite personalizado com todos os detalhes do evento</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Confirma com 1 clique</h4>
                    <p className="text-sm text-muted-foreground">Botão direto "Vou participar" - sem cadastros, sem formulários</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Recebe código de barras</h4>
                    <p className="text-sm text-muted-foreground">QR Code pessoal para check-in rápido no dia do evento</p>
                  </div>
                </div>
              </div>

              {/* Mock Confirmation Interface */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-medium">Confirmação Recebida!</h5>
                    <p className="text-sm text-muted-foreground">Workshop Marketing Digital - 15/08</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-4 text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p className="text-xs text-muted-foreground">Seu código de barras para check-in</p>
                </div>
              </div>
            </div>

            {/* Check-in Process */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-4">Check-in em 3 segundos</h3>
                <p className="text-muted-foreground">
                  Chegou no evento? Mostra o código, passa na catraca e pronto. Sem filas, sem cadastros.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Mostra o código no celular</h4>
                    <p className="text-sm text-muted-foreground">QR Code que chegou pelo WhatsApp já está pronto</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Scanner lê instantaneamente</h4>
                    <p className="text-sm text-muted-foreground">Qualquer celular vira leitor, sem equipamentos caros</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Entrada liberada automaticamente</h4>
                    <p className="text-sm text-muted-foreground">Dados atualizados em tempo real no seu painel</p>
                  </div>
                </div>
              </div>

              {/* Check-in Stats */}
              

              {/* Mock Check-in Interface */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-green-600">Check-in Realizado!</h5>
                    <p className="text-sm text-muted-foreground">João Silva - 14:23</p>
                    <p className="text-xs text-muted-foreground">Mesa 15 • Networking VIP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg px-8">
                <QrCode className="mr-2 h-5 w-5" />
                Quero check-in sem filas no meu evento
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Intelligence Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
              Inteligência Artificial Integrada
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              IA que <span className="text-purple-600">aprende</span> com seus eventos
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Nossa inteligência artificial analisa comportamentos, prevê presença e otimiza seus eventos automaticamente. 
              Cada evento fica <strong>melhor que o anterior</strong>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* IA Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Análise Comportamental por CPF</h3>
                  <p className="text-muted-foreground">
                    A IA cruza dados históricos de participantes (conformidade LGPD total) para identificar padrões: 
                    horários preferidos, tipos de eventos favoritos, pontualidade e frequência.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Predição de Presença</h3>
                  <p className="text-muted-foreground">
                    Sistema preditivo que calcula a probabilidade de cada convidado comparecer, 
                    baseado no histórico comportamental. Previne eventos lotados ou vazios.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Score de Performance</h3>
                  <p className="text-muted-foreground">
                    Métricas avançadas calculam score de performance, projeções de ocupação, 
                    metas de check-in e identificam eventos em risco automaticamente.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <LineChart className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Relatórios Inteligentes</h3>
                  <p className="text-muted-foreground">
                    Dashboards com insights únicos, funil de conversão completo e análise individual por evento. 
                    Exportação em Excel com dados que realmente importam.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mock IA Dashboard */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border">
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Dashboard IA</div>
                    <div className="text-sm text-purple-600">análise em tempo real</div>
                  </div>
                </div>
                
                <div className="py-6 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Score de Performance</span>
                      <span className="text-lg font-bold text-purple-600">94.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '94%'}}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded p-3 text-center">
                      <div className="text-lg font-bold text-green-600">87%</div>
                      <div className="text-xs text-green-600">Taxa Presença</div>
                    </div>
                    <div className="bg-blue-50 rounded p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">142</div>
                      <div className="text-xs text-blue-600">Presença Prevista</div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-amber-700 mb-1">⚠️ Insights IA</div>
                    <div className="text-xs text-amber-600">
                      15 convidados com baixa probabilidade de presença. 
                      Considere lembretes personalizados.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating AI badge */}
              <div className="absolute -right-4 -top-4 bg-purple-600 text-white rounded-lg shadow-lg p-3 text-center">
                <Brain className="h-5 w-5 mx-auto mb-1" />
                <div className="text-xs font-bold">IA ATIVA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customization & Templates Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Personalização Total
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Sua marca, sua identidade, <span className="text-blue-600">seu sucesso</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              White label completo, templates personalizáveis e páginas públicas com sua identidade visual. 
              <strong>Seus clientes só veem sua marca</strong>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Templates */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-blue-800">Templates Inteligentes</CardTitle>
                <CardDescription>
                  Crie mensagens personalizadas com variáveis dinâmicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Variáveis automáticas (nome, evento, data)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Templates reutilizáveis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Linguagem da sua empresa</span>
                </div>
              </CardContent>
            </Card>

            {/* White Label */}
            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl text-purple-800">White Label Completo</CardTitle>
                <CardDescription>
                  Página pública personalizada com logo e cores da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Logo e cores personalizadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">URL própria da empresa</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Zero menção ao Convidy</span>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Settings */}
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-800">Configurações Avançadas</CardTitle>
                <CardDescription>
                  Controle total sobre notificações e multi-usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Sistema multi-usuário</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Notificações personalizadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Configurações de segurança</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-red-100">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              Planos Simples e Transparentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Comece <span className="text-green-600">grátis</span>, evolua sem limites
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Apenas dois planos: gratuito para testar e avançado para crescer. 
              <strong>Sem surpresas, sem fidelidade, sem complicação</strong>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-green-200 bg-green-50/50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white px-4 py-1">
                  SEMPRE GRÁTIS
                </Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-800">Gratuito</CardTitle>
                <div className="text-3xl font-bold">R$ 0</div>
                <CardDescription className="text-green-600 font-medium">
                  Para sempre • Sem cartão
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">1 evento ativo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">5 confirmações por evento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">WhatsApp + QR Code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Dashboard básico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Check-in com QR Code</span>
                </div>
                <div className="pt-4">
                  <Link to="/auth">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Começar Grátis
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Plan */}
            <Card className="border-2 border-primary/30 bg-primary/5 relative transform md:scale-105 shadow-xl">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white px-4 py-1">
                  ⭐ RECOMENDADO
                </Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl text-primary">Avançado</CardTitle>
                <div className="text-3xl font-bold">R$ 149,90<span className="text-lg text-muted-foreground">/mês</span></div>
                <CardDescription className="text-primary font-medium">
                  Sem fidelidade • Cancele quando quiser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Eventos ilimitados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Confirmações ilimitadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Templates personalizados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">White label completo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Relatórios avançados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">IA Comportamental</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Suporte prioritário</span>
                </div>
                <div className="pt-4">
                  <Link to="/auth">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      <Rocket className="mr-2 h-4 w-4" />
                      Começar Agora
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              💡 <strong>Dica:</strong> Comece com o plano gratuito e evolua quando precisar. 
              Sem fidelidade, sem taxa de cancelamento.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Gift className="mr-2 h-5 w-5" />
                Testar Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Invites Feature Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Convites que <span className="text-green-600">realmente</span> chegam aos convidados
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Esqueça emails que ninguém vê. Convide por WhatsApp com mensagens personalizadas 
              e tenha <strong>95% de taxa de abertura</strong>
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Features List */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Convites em massa ou individuais</h3>
                  <p className="text-muted-foreground">
                    Importe listas do Excel, adicione um por um ou copie de outras plataformas. 
                    Flexibilidade total para seu fluxo de trabalho.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Envio direto pelo WhatsApp</h3>
                  <p className="text-muted-foreground">
                    Um clique e todos os convites são enviados pelo seu WhatsApp automaticamente. 
                    Seus convidados recebem na hora com link personalizado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Mensagens 100% personalizáveis</h3>
                  <p className="text-muted-foreground">
                    Edite o texto, adicione variáveis como nome e local do evento. 
                    Crie templates e reutilize. Sua marca, sua linguagem.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Confirmações em tempo real</h3>
                  <p className="text-muted-foreground">
                    Acompanhe quem confirmou, quem visualizou e quem ainda não respondeu. 
                    Dashboard atualizado automaticamente.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mock WhatsApp Interface */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border">
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Convidy</div>
                    <div className="text-sm text-green-600">online</div>
                  </div>
                </div>
                
                <div className="py-6 space-y-4">
                  <div className="bg-green-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm">
                      Olá, João! 👋<br /><br />
                      Você está convidado para o evento:<br />
                      <strong>Workshop de Vendas 2024</strong><br /><br />
                      📅 Data: 15/03/2024<br />
                      🕒 Horário: 14:00<br />
                      📍 Local: Auditório TechCorp<br /><br />
                      Confirme sua presença clicando no link:<br />
                      👉 convidy.app/confirmar/abc123
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Confirmei no link! Estarei lá 🎉</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar convites pelo WhatsApp
                  </Button>
                </div>
              </div>
              
              {/* Floating stats */}
              <div className="absolute -right-4 -top-4 bg-white rounded-lg shadow-lg p-4 border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-xs text-muted-foreground">taxa de abertura</div>
                </div>
              </div>
              
              <div className="absolute -left-4 -bottom-4 bg-white rounded-lg shadow-lg p-4 border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">3x</div>
                  <div className="text-xs text-muted-foreground">mais eficaz</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8">
                <MessageCircle className="mr-2 h-5 w-5" />
                Testar envio de convites grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
                   {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-warning fill-current" />)}
                 </div>
                <p className="text-lg mb-4 italic">
                  "Nossos eventos corporativos eram um caos. Com o Convidy, triplicamos a presença e ainda economizamos 5 horas de trabalho por evento."
                </p>
                 <div className="flex items-center space-x-3">
                   <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                     <span className="text-primary-foreground font-bold">MR</span>
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
                   {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-warning fill-current" />)}
                 </div>
                <p className="text-lg mb-4 italic">
                  "Meus clientes ficaram impressionados com a organização. O check-in por QR Code é profissional demais. Virou diferencial da agência."
                </p>
                 <div className="flex items-center space-x-3">
                   <div className="h-10 w-10 bg-success rounded-full flex items-center justify-center">
                     <span className="text-success-foreground font-bold">JS</span>
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

      {/* Final CTA Section - Behavioral Intelligence */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="space-y-12 max-w-5xl mx-auto">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                <Brain className="h-4 w-4 mr-2" />
                Inteligência Comportamental
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold">
                Conheça seus convidados como nunca antes
              </h2>
              <p className="text-xl opacity-90 leading-relaxed max-w-3xl mx-auto">
                O Convidy vai além do check-in. Nossa IA analisa o comportamento de cada convidado 
                para você tomar decisões mais inteligentes sobre seus eventos.
              </p>
            </div>

            {/* Behavioral Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Taxa de Comparecimento</h3>
                <p className="opacity-80 text-sm">
                  Saiba quem confirma e comparece vs quem confirma e falta. 
                  Identifique padrões de no-show antes que aconteçam.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Pontualidade</h3>
                <p className="opacity-80 text-sm">
                  Descubra quem costuma chegar no horário, quem atrasa 
                  e quem precisa de um lembrete extra.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Tempo de Permanência</h3>
                <p className="opacity-80 text-sm">
                  Identifique quem fica até o final do evento e quem 
                  costuma ir embora rapidamente após o check-in.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Histórico de Eventos</h3>
                <p className="opacity-80 text-sm">
                  Veja em quais eventos cada pessoa participou, 
                  quais recusou e suas preferências de formato.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Score de Engajamento</h3>
                <p className="opacity-80 text-sm">
                  Cada convidado recebe uma pontuação baseada em seu 
                  histórico, ajudando você a priorizar convites.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Previsão de Presença</h3>
                <p className="opacity-80 text-sm">
                  Nossa IA prevê quantas pessoas realmente vão comparecer 
                  com base no histórico comportamental.
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-10 py-4 bg-white text-primary hover:bg-white/90">
                    <Brain className="mr-2 h-5 w-5" />
                    Começar a Analisar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-sm opacity-90">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Dados protegidos pela LGPD</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Insights em tempo real</span>
                </div>
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
              <span>© 2026 Convidy. Todos os direitos reservados.</span>
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