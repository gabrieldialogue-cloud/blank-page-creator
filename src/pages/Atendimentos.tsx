import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, AlertCircle, User, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function Atendimentos() {
  // Simulação de conversas ao vivo - será substituído por dados reais do Supabase
  const conversasAoVivo = [
    {
      id: "1",
      cliente: "João Silva",
      marca: "Fiat",
      mensagens: [
        { tipo: "cliente", conteudo: "Preciso de um filtro de óleo para Fiat Uno 2020", hora: "14:23" },
        { tipo: "ia", conteudo: "Olá! Vou te ajudar com isso. Você pode me informar a placa ou chassi do veículo?", hora: "14:23" },
        { tipo: "cliente", conteudo: "ABC1234", hora: "14:24" },
        { tipo: "ia", conteudo: "Perfeito! Encontrei o filtro ideal. Tenho em estoque por R$ 45,00. Gostaria de fazer o pedido?", hora: "14:24" },
      ],
      status: "ia_respondendo"
    },
    {
      id: "2",
      cliente: "Maria Santos",
      marca: "Volkswagen",
      mensagens: [
        { tipo: "cliente", conteudo: "Bom dia, preciso de pastilhas de freio", hora: "14:10" },
        { tipo: "ia", conteudo: "Bom dia! Para qual modelo de veículo?", hora: "14:10" },
        { tipo: "cliente", conteudo: "Gol G6", hora: "14:11" },
      ],
      status: "aguardando_cliente"
    },
    {
      id: "3",
      cliente: "Pedro Oliveira",
      marca: "Chevrolet",
      mensagens: [
        { tipo: "cliente", conteudo: "Tenho garantia de uma peça que comprei", hora: "13:45" },
        { tipo: "ia", conteudo: "Vou te conectar com um de nossos especialistas para analisar sua garantia.", hora: "13:45" },
      ],
      status: "aguardando_humano"
    }
  ];

  const [conversaSelecionada, setConversaSelecionada] = useState(conversasAoVivo[0]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atendimentos ao Vivo</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe em tempo real todas as conversas da IA com seus clientes
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-secondary bg-gradient-to-br from-secondary/10 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-secondary">
                <MessageSquare className="h-5 w-5" />
                IA Respondendo
              </CardTitle>
              <CardDescription>Atendimentos em andamento pela IA</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">
                {conversasAoVivo.filter(c => c.status === "ia_respondendo").length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-altese-gray-medium bg-gradient-to-br from-altese-gray-light/20 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-altese-gray-dark">
                <MessageSquare className="h-5 w-5" />
                Aguardando Cliente
              </CardTitle>
              <CardDescription>Esperando resposta do cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-altese-gray-dark">
                {conversasAoVivo.filter(c => c.status === "aguardando_cliente").length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent bg-gradient-to-br from-accent/10 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <AlertCircle className="h-5 w-5" />
                Aguardando Humano
              </CardTitle>
              <CardDescription>Casos que precisam de intervenção</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">
                {conversasAoVivo.filter(c => c.status === "aguardando_humano").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de conversas */}
          <Card className="lg:col-span-1">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle>Conversas Ativas</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Clique para ver detalhes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {conversasAoVivo.map((conversa) => (
                  <div
                    key={conversa.id}
                    onClick={() => setConversaSelecionada(conversa)}
                    className={`cursor-pointer border-b border-border p-4 transition-colors hover:bg-muted ${
                      conversaSelecionada.id === conversa.id ? "bg-secondary/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold text-foreground">{conversa.cliente}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {conversa.marca}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                          {conversa.mensagens[conversa.mensagens.length - 1].conteudo}
                        </p>
                      </div>
                      <Badge
                        className={
                          conversa.status === "ia_respondendo"
                            ? "bg-secondary"
                            : conversa.status === "aguardando_cliente"
                            ? "bg-altese-gray-medium"
                            : "bg-accent"
                        }
                      >
                        {conversa.mensagens.length}
                      </Badge>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat ao vivo */}
          <Card className="lg:col-span-2">
            <CardHeader className="bg-gradient-to-r from-secondary to-primary text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Conversa com {conversaSelecionada.cliente}
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    {conversaSelecionada.marca} • Ao vivo
                  </CardDescription>
                </div>
                <div className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] p-6">
                <div className="space-y-4">
                  {conversaSelecionada.mensagens.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.tipo === "ia" ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          msg.tipo === "ia"
                            ? "bg-gradient-to-br from-secondary to-primary"
                            : "bg-gradient-to-br from-accent to-accent/80"
                        }`}
                      >
                        {msg.tipo === "ia" ? (
                          <Bot className="h-4 w-4 text-white" />
                        ) : (
                          <User className="h-4 w-4 text-white" />
                        )}
                      </div>

                      <div
                        className={`flex flex-col gap-1 max-w-[70%] ${
                          msg.tipo === "ia" ? "items-start" : "items-end"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {msg.tipo === "ia" ? "IA Altese" : conversaSelecionada.cliente}
                          </span>
                          <span className="text-xs text-muted-foreground">{msg.hora}</span>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            msg.tipo === "ia"
                              ? "bg-gradient-to-br from-secondary/20 to-primary/10 border border-secondary/30"
                              : "bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30"
                          }`}
                        >
                          <p className="text-sm text-foreground">{msg.conteudo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
