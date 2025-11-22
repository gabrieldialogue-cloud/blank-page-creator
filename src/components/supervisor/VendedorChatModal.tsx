import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Bot } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface Atendimento {
  id: string;
  marca_veiculo: string;
  modelo_veiculo: string | null;
  status: string;
  created_at: string;
  clientes: {
    nome: string;
    telefone: string;
  } | null;
  mensagens: Array<{
    id: string;
    conteudo: string;
    created_at: string;
    remetente_tipo: string;
  }>;
}

interface VendedorChatModalProps {
  open: boolean;
  onClose: () => void;
  vendedorNome: string;
  atendimentos: Atendimento[];
}

export function VendedorChatModal({
  open,
  onClose,
  vendedorNome,
  atendimentos,
}: VendedorChatModalProps) {
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      ia_respondendo: { label: "IA Respondendo", className: "bg-blue-500" },
      aguardando_cliente: { label: "Aguardando Cliente", className: "bg-yellow-500" },
      vendedor_intervindo: { label: "Vendedor Intervindo", className: "bg-green-500" },
      aguardando_orcamento: { label: "Aguardando Orçamento", className: "bg-orange-500" },
      aguardando_fechamento: { label: "Aguardando Fechamento", className: "bg-purple-500" },
      encerrado: { label: "Encerrado", className: "bg-gray-500" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return (
      <Badge className={`${config.className} text-white`}>{config.label}</Badge>
    );
  };

  const getLastMessage = (mensagens: Atendimento["mensagens"]) => {
    if (!mensagens || mensagens.length === 0) return "Sem mensagens";
    const last = mensagens[mensagens.length - 1];
    return last.conteudo.substring(0, 50) + (last.conteudo.length > 50 ? "..." : "");
  };

  if (selectedAtendimento) {
    return (
      <ChatInterface
        atendimentoId={selectedAtendimento.id}
        clienteNome={selectedAtendimento.clientes?.nome || "Cliente"}
        mensagens={selectedAtendimento.mensagens.map(m => ({
          id: m.id,
          remetente_tipo: m.remetente_tipo as any,
          conteudo: m.conteudo,
          created_at: m.created_at,
        }))}
        onClose={() => setSelectedAtendimento(null)}
        onSendMessage={async (message: string) => {
          console.log("Supervisor enviando mensagem:", message);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Conversas de {vendedorNome}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {atendimentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum atendimento encontrado para este vendedor
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {atendimentos.map((atendimento) => (
                <Card
                  key={atendimento.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedAtendimento(atendimento)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {atendimento.clientes?.nome || "Cliente sem nome"}
                      </CardTitle>
                      {getStatusBadge(atendimento.status)}
                    </div>
                    <CardDescription className="text-sm">
                      {atendimento.marca_veiculo} {atendimento.modelo_veiculo || ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {getLastMessage(atendimento.mensagens)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {atendimento.mensagens?.length || 0} mensagens
                        </span>
                        <span>
                          {format(new Date(atendimento.created_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
