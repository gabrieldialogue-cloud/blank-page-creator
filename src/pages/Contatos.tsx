import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClientAvatar } from "@/components/ui/client-avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Phone, Mail, Car, MessageSquare, Calendar, User, Edit, History, Filter, Trash2, Building2, Smartphone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContactEditDialog } from "@/components/contatos/ContactEditDialog";
import { ContactHistoryDialog } from "@/components/contatos/ContactHistoryDialog";
import { DeleteContactDialog } from "@/components/contatos/DeleteContactDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  created_at: string;
  atendimentos: Array<{
    id: string;
    marca_veiculo: string;
    modelo_veiculo: string | null;
    status: string;
    created_at: string;
    source: string | null;
    vendedor_fixo_id: string | null;
    mensagens?: Array<{
      id: string;
      conteudo: string;
      remetente_tipo: string;
      created_at: string;
    }>;
  }>;
}

export default function Contatos() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [marcaFilter, setMarcaFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Cliente | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [currentVendedorId, setCurrentVendedorId] = useState<string | null>(null);
  const [evolutionInstanceName, setEvolutionInstanceName] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setIsLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Get vendedor's usuario record
    const { data: vendedorUsuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vendedorUsuario) {
      setIsLoading(false);
      return;
    }

    setCurrentVendedorId(vendedorUsuario.id);

    // Get vendedor's evolution instance name
    const { data: config } = await supabase
      .from("config_vendedores")
      .select("evolution_instance_name")
      .eq("usuario_id", vendedorUsuario.id)
      .maybeSingle();

    setEvolutionInstanceName(config?.evolution_instance_name || null);

    // Fetch only atendimentos assigned to this vendedor
    const { data: atendimentos, error } = await supabase
      .from("atendimentos")
      .select(`
        id,
        marca_veiculo,
        modelo_veiculo,
        status,
        created_at,
        source,
        vendedor_fixo_id,
        evolution_instance_name,
        cliente:clientes (
          id,
          nome,
          telefone,
          email,
          created_at
        ),
        mensagens (
          id,
          conteudo,
          remetente_tipo,
          created_at
        )
      `)
      .eq("vendedor_fixo_id", vendedorUsuario.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clientes:", error);
      setIsLoading(false);
      return;
    }

    // Group atendimentos by cliente
    const clientesMap = new Map<string, Cliente>();
    
    atendimentos?.forEach(atendimento => {
      const cliente = atendimento.cliente as any;
      if (!cliente) return;

      if (!clientesMap.has(cliente.id)) {
        clientesMap.set(cliente.id, {
          ...cliente,
          atendimentos: []
        });
      }
      
      clientesMap.get(cliente.id)?.atendimentos.push({
        id: atendimento.id,
        marca_veiculo: atendimento.marca_veiculo,
        modelo_veiculo: atendimento.modelo_veiculo,
        status: atendimento.status || "",
        created_at: atendimento.created_at || "",
        source: atendimento.source,
        vendedor_fixo_id: atendimento.vendedor_fixo_id,
        mensagens: atendimento.mensagens as any[]
      });
    });

    setClientes(Array.from(clientesMap.values()));
    setIsLoading(false);
  };

  // Separate clients by source type
  const mainNumberClientes = clientes.filter(cliente =>
    cliente.atendimentos.some(a => a.source === "meta" || !a.source)
  );

  const personalNumberClientes = clientes.filter(cliente =>
    cliente.atendimentos.some(a => a.source === "evolution")
  );

  // Get unique marcas for filter
  const uniqueMarcas = Array.from(
    new Set(
      clientes.flatMap((c) => c.atendimentos.map((a) => a.marca_veiculo)).filter((m) => m && m !== "A definir")
    )
  ).sort();

  const filterClientes = (clientesList: Cliente[]) => {
    return clientesList.filter((cliente) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        cliente.nome.toLowerCase().includes(searchLower) ||
        cliente.telefone.includes(searchLower) ||
        cliente.email?.toLowerCase().includes(searchLower) ||
        cliente.atendimentos.some(
          (a) =>
            a.marca_veiculo?.toLowerCase().includes(searchLower) ||
            a.modelo_veiculo?.toLowerCase().includes(searchLower)
        );

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== "all") {
        const hasStatus = cliente.atendimentos.some((a) => a.status === statusFilter);
        if (!hasStatus) return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const now = new Date();
        const hasRecentAtendimento = cliente.atendimentos.some((a) => {
          const atendimentoDate = new Date(a.created_at);
          switch (dateFilter) {
            case "today":
              return isAfter(atendimentoDate, startOfDay(now)) && isBefore(atendimentoDate, endOfDay(now));
            case "week":
              return isAfter(atendimentoDate, subDays(now, 7));
            case "month":
              return isAfter(atendimentoDate, subDays(now, 30));
            default:
              return true;
          }
        });
        if (!hasRecentAtendimento) return false;
      }

      // Marca filter
      if (marcaFilter !== "all") {
        const hasMarca = cliente.atendimentos.some((a) => a.marca_veiculo === marcaFilter);
        if (!hasMarca) return false;
      }

      return true;
    });
  };

  const filteredMainNumber = filterClientes(mainNumberClientes);
  const filteredPersonalNumber = filterClientes(personalNumberClientes);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ia_respondendo: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      aguardando_cliente: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      vendedor_intervindo: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      aguardando_orcamento: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      aguardando_fechamento: "bg-green-500/10 text-green-500 border-green-500/20",
      encerrado: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ia_respondendo: "IA Respondendo",
      aguardando_cliente: "Aguardando Cliente",
      vendedor_intervindo: "Vendedor Intervindo",
      aguardando_orcamento: "Aguardando Orçamento",
      aguardando_fechamento: "Aguardando Fechamento",
      encerrado: "Encerrado",
    };
    return labels[status] || status;
  };

  const hasActiveFilters = statusFilter !== "all" || dateFilter !== "all" || marcaFilter !== "all";

  const ClienteCard = ({ cliente }: { cliente: Cliente }) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <ClientAvatar name={cliente.nome} imageUrl={null} className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{cliente.nome}</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{cliente.telefone}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCliente(cliente)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewingHistory(cliente)}>
              <History className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive hover:text-destructive" 
              onClick={() => setDeletingCliente(cliente)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        {cliente.email && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{cliente.email}</span>
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="px-4 pt-0 pb-4">
        {cliente.atendimentos.length > 0 && (
          <div className="space-y-2">
            {cliente.atendimentos.slice(0, 2).map((atendimento) => (
              <div 
                key={atendimento.id} 
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-muted/30 border-border/50 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">
                    {atendimento.marca_veiculo}
                    {atendimento.modelo_veiculo && ` ${atendimento.modelo_veiculo}`}
                  </span>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${getStatusColor(atendimento.status)}`}>
                  {getStatusLabel(atendimento.status)}
                </Badge>
              </div>
            ))}
            {cliente.atendimentos.length > 2 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                + {cliente.atendimentos.length - 2} atendimento(s)
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderClientesList = (clientesList: Cliente[], emptyMessage: string) => (
    <div className="grid gap-4">
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Carregando contatos...</p>
          </CardContent>
        </Card>
      ) : clientesList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        clientesList.map((cliente) => (
          <ClienteCard key={cliente.id} cliente={cliente} />
        ))
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meus Contatos</h1>
            <p className="text-muted-foreground">
              Clientes atribuídos a você
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
          </Badge>
        </div>

        {/* Search Bar */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, email, marca ou modelo..."
                className="pl-10 bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ia_respondendo">IA Respondendo</SelectItem>
                  <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                  <SelectItem value="vendedor_intervindo">Vendedor Intervindo</SelectItem>
                  <SelectItem value="aguardando_orcamento">Aguardando Orçamento</SelectItem>
                  <SelectItem value="aguardando_fechamento">Aguardando Fechamento</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>

              <Select value={marcaFilter} onValueChange={setMarcaFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {uniqueMarcas.map((marca) => (
                    <SelectItem key={marca} value={marca}>
                      {marca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setDateFilter("all");
                    setMarcaFilter("all");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Main vs Personal Number */}
        <Tabs defaultValue="principal" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="principal" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Número Principal
              <Badge variant="secondary" className="ml-1">{filteredMainNumber.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pessoal" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Número Pessoal
              <Badge variant="secondary" className="ml-1">{filteredPersonalNumber.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="principal" className="mt-4">
            <ScrollArea className="h-[calc(100vh-480px)]">
              {renderClientesList(
                filteredMainNumber,
                searchTerm || hasActiveFilters
                  ? "Nenhum contato encontrado com esses critérios."
                  : "Nenhum contato do número principal atribuído a você."
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pessoal" className="mt-4">
            <ScrollArea className="h-[calc(100vh-480px)]">
              {evolutionInstanceName ? (
                renderClientesList(
                  filteredPersonalNumber,
                  searchTerm || hasActiveFilters
                    ? "Nenhum contato encontrado com esses critérios."
                    : "Nenhum contato do seu número pessoal ainda."
                )
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Você ainda não tem um número pessoal configurado.
                    </p>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {editingCliente && (
        <ContactEditDialog
          open={!!editingCliente}
          onOpenChange={(open) => !open && setEditingCliente(null)}
          clienteId={editingCliente.id}
          currentNome={editingCliente.nome}
          currentEmail={editingCliente.email}
          onSuccess={fetchClientes}
        />
      )}

      {viewingHistory && (
        <ContactHistoryDialog
          open={!!viewingHistory}
          onOpenChange={(open) => !open && setViewingHistory(null)}
          clienteNome={viewingHistory.nome}
          atendimentos={viewingHistory.atendimentos}
        />
      )}

      {deletingCliente && (
        <DeleteContactDialog
          open={!!deletingCliente}
          onOpenChange={(open) => !open && setDeletingCliente(null)}
          clienteId={deletingCliente.id}
          clienteNome={deletingCliente.nome}
          onSuccess={() => {
            fetchClientes();
            setDeletingCliente(null);
          }}
        />
      )}
    </MainLayout>
  );
}
