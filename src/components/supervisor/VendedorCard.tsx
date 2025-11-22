import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Atendimento {
  id: string;
  marca_veiculo: string;
  status: string;
  vendedor_fixo_id: string | null;
  clientes: {
    nome: string;
  } | null;
  mensagens: Array<{
    conteudo: string;
  }>;
}

interface VendedorCardProps {
  vendedor: {
    id: string;
    nome: string;
    email: string;
    especialidade_marca?: string;
  };
  atendimentos: Atendimento[];
  getStatusBadge: (status: string) => JSX.Element;
  getLastMessage: (mensagens: any[]) => string;
  onUpdate: () => void;
}

export function VendedorCard({
  vendedor,
  atendimentos,
  getStatusBadge,
  getLastMessage,
  onUpdate
}: VendedorCardProps) {
  const [especialidadeTemp, setEspecialidadeTemp] = useState(
    vendedor.especialidade_marca || ""
  );

  const handleUpdateEspecialidade = async () => {
    try {
      const { error } = await supabase
        .from('config_vendedores')
        .update({ especialidade_marca: especialidadeTemp })
        .eq('usuario_id', vendedor.id);

      if (error) throw error;

      toast.success('Especialidade atualizada com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Error updating especialidade:', error);
      toast.error('Erro ao atualizar especialidade');
    }
  };

  const atendimentosVendedor = atendimentos.filter(
    (a) => a.vendedor_fixo_id === vendedor.id
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{vendedor.nome}</CardTitle>
            <CardDescription>{vendedor.email}</CardDescription>
          </div>
          <Badge variant="outline">
            {vendedor.especialidade_marca || "Sem especialidade"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Especialidade Section */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <Label htmlFor={`especialidade-${vendedor.id}`} className="text-sm font-medium">
              Definir Especialidade (Marca)
            </Label>
            <Select
              value={especialidadeTemp}
              onValueChange={setEspecialidadeTemp}
            >
              <SelectTrigger id={`especialidade-${vendedor.id}`}>
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fiat">Fiat</SelectItem>
                <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                <SelectItem value="GM - Chevrolet">GM - Chevrolet</SelectItem>
                <SelectItem value="Ford">Ford</SelectItem>
                <SelectItem value="Toyota">Toyota</SelectItem>
                <SelectItem value="Importados">Importados</SelectItem>
              </SelectContent>
            </Select>
            {especialidadeTemp !== vendedor.especialidade_marca && (
              <Button
                onClick={handleUpdateEspecialidade}
                size="sm"
                className="w-full"
              >
                Salvar Especialidade
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Atendimentos ativos:</span>
            <span className="font-semibold">{atendimentosVendedor.length}</span>
          </div>
          
          {atendimentosVendedor.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              {atendimentosVendedor.map((atendimento) => (
                <div
                  key={atendimento.id}
                  className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {atendimento.clientes?.nome || "Cliente não identificado"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {atendimento.marca_veiculo} - {getLastMessage(atendimento.mensagens)}
                    </div>
                  </div>
                  {getStatusBadge(atendimento.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
