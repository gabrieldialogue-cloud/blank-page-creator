import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone,
  Trash2,
  Plus,
  RefreshCw,
  Link,
  Unlink,
  QrCode,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EvolutionInstance {
  instanceName?: string;
  instanceId?: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  status?: string;
  state?: string;
  serverUrl?: string;
  apikey?: string;
  connectionStatus?: 'open' | 'close' | 'connecting' | 'unknown';
  instance?: {
    instanceName?: string;
    state?: string;
  };
}

interface Vendedor {
  id: string;
  nome: string;
  email: string;
}

interface Props {
  evolutionApiUrl: string;
  evolutionApiKey: string;
  evolutionStatus: 'connected' | 'disconnected' | 'unknown';
  vendedores: Vendedor[];
}

export function EvolutionInstanceManager({ 
  evolutionApiUrl, 
  evolutionApiKey, 
  evolutionStatus,
  vendedores 
}: Props) {
  const { toast } = useToast();
  
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  
  // Create instance form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // QR Code dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState<string | null>(null);
  const [currentInstanceName, setCurrentInstanceName] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);

  // Associate dialog
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false);
  const [instanceToAssociate, setInstanceToAssociate] = useState<string>("");
  const [vendedorToAssociate, setVendedorToAssociate] = useState("");
  const [associating, setAssociating] = useState(false);

  useEffect(() => {
    if (evolutionStatus === 'connected') {
      fetchInstances();
    }
  }, [evolutionStatus]);

  const fetchInstances = async () => {
    if (!evolutionApiUrl || !evolutionApiKey) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-evolution-instance', {
        body: {
          action: 'list_instances',
          evolutionApiUrl,
          evolutionApiKey,
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Process instances and check their connection status
        const instanceList = data.instances || [];
        setInstances(instanceList);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast({
        title: "Erro ao carregar instâncias",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInstanceStatus = async (instanceName: string) => {
    try {
      const { data } = await supabase.functions.invoke('manage-evolution-instance', {
        body: {
          action: 'check_instance_status',
          evolutionApiUrl,
          evolutionApiKey,
          instanceData: { instanceName },
        },
      });
      return data?.status || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const fetchQrCode = async (instanceName: string) => {
    setLoadingQr(true);
    setCurrentInstanceName(instanceName);
    setQrDialogOpen(true);
    setCurrentQrCode(null);

    try {
      const { data, error } = await supabase.functions.invoke('manage-evolution-instance', {
        body: {
          action: 'get_qr_code',
          evolutionApiUrl,
          evolutionApiKey,
          instanceData: { instanceName },
        },
      });

      if (error) throw error;

      if (data?.success && data.qrCode) {
        setCurrentQrCode(data.qrCode);
      } else {
        toast({
          title: "QR Code não disponível",
          description: data?.pairingCode 
            ? `Use o código de pareamento: ${data.pairingCode}` 
            : "A instância pode já estar conectada",
        });
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast({
        title: "Erro ao obter QR Code",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoadingQr(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName) {
      toast({
        title: "Nome obrigatório",
        description: "Defina um nome para a instância",
        variant: "destructive",
      });
      return;
    }

    setCreatingInstance(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-evolution-instance', {
        body: {
          action: 'create_instance',
          evolutionApiUrl,
          evolutionApiKey,
          instanceData: {
            vendedorId: selectedVendedor || null,
            instanceName: newInstanceName,
            phoneNumber: phoneNumber || null,
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: data.alreadyExists ? "Instância encontrada" : "Instância criada",
          description: data.message,
        });
        
        // Show QR code if available
        if (data.qrCode) {
          setCurrentQrCode(data.qrCode);
          setCurrentInstanceName(newInstanceName);
          setQrDialogOpen(true);
        }

        // Reset form and refresh
        setNewInstanceName("");
        setSelectedVendedor("");
        setPhoneNumber("");
        setShowCreateForm(false);
        fetchInstances();
      } else {
        toast({
          title: "Erro ao criar instância",
          description: data?.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      toast({
        title: "Erro ao criar instância",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setCreatingInstance(false);
    }
  };

  const deleteInstance = async (instanceName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a instância "${instanceName}"?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-evolution-instance', {
        body: {
          action: 'delete_instance',
          evolutionApiUrl,
          evolutionApiKey,
          instanceData: { instanceName },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Instância deletada",
          description: `A instância "${instanceName}" foi removida`,
        });
        fetchInstances();
      } else {
        toast({
          title: "Erro ao deletar",
          description: data?.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast({
        title: "Erro ao deletar instância",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const associateInstanceToVendedor = async () => {
    if (!instanceToAssociate || !vendedorToAssociate) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione uma instância e um vendedor",
        variant: "destructive",
      });
      return;
    }

    setAssociating(true);
    try {
      // Update config_vendedores with the instance name using raw update
      // The columns were just added via migration
      const { error } = await supabase
        .from('config_vendedores')
        .update({
          evolution_instance_name: instanceToAssociate,
          evolution_status: 'connected',
        } as any)
        .eq('usuario_id', vendedorToAssociate);

      if (error) throw error;

      toast({
        title: "Instância associada",
        description: `A instância foi vinculada ao vendedor com sucesso`,
      });

      setAssociateDialogOpen(false);
      setInstanceToAssociate("");
      setVendedorToAssociate("");
    } catch (error) {
      console.error('Error associating instance:', error);
      toast({
        title: "Erro ao associar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setAssociating(false);
    }
  };

  const getConnectionStatusColor = (instance: EvolutionInstance) => {
    const state = instance.connectionStatus || instance.instance?.state || instance.state;
    switch (state) {
      case 'open':
        return 'bg-success text-success-foreground';
      case 'close':
        return 'bg-destructive text-destructive-foreground';
      case 'connecting':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getConnectionStatusLabel = (instance: EvolutionInstance) => {
    const state = instance.connectionStatus || instance.instance?.state || instance.state;
    switch (state) {
      case 'open':
        return 'Conectado';
      case 'close':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Desconhecido';
    }
  };

  if (evolutionStatus !== 'connected') {
    return (
      <div className="text-center py-8 rounded-lg border border-dashed">
        <WifiOff className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">
          Conecte à Evolution API primeiro
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Configure a URL e API Key acima para gerenciar instâncias
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Instâncias da Evolution API</h3>
          <p className="text-sm text-muted-foreground">
            {instances.length} instância(s) encontrada(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInstances}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Instância
          </Button>
        </div>
      </div>

      {/* Create Instance Form */}
      {showCreateForm && (
        <div className="space-y-4 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Criar Nova Instância</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Nome da Instância *</Label>
              <Input
                id="instance-name"
                placeholder="vendedor_joao"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Identificador único (sem espaços)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="associate-vendedor">Associar a Vendedor (opcional)</Label>
              <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                <SelectTrigger id="associate-vendedor">
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {vendedores.map((vend) => (
                    <SelectItem key={vend.id} value={vend.id}>
                      {vend.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone-number">Número do WhatsApp (opcional)</Label>
              <Input
                id="phone-number"
                placeholder="5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Número com código do país (sem + ou espaços)</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={createInstance}
              className="flex-1 bg-green-500 hover:bg-green-600"
              disabled={creatingInstance || !newInstanceName}
            >
              {creatingInstance ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Criar Instância
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Instances List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-8 rounded-lg border border-dashed">
          <Smartphone className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma instância encontrada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em "Nova Instância" para criar
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {instances.map((instance) => (
            <div
              key={instance.instanceName || instance.instanceId}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  (instance.connectionStatus === 'open' || instance.instance?.state === 'open')
                    ? 'bg-success/20' 
                    : 'bg-muted'
                }`}>
                  {(instance.connectionStatus === 'open' || instance.instance?.state === 'open') ? (
                    <Wifi className="h-5 w-5 text-success" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {instance.instanceName || instance.instance?.instanceName}
                  </p>
                  {instance.profileName && (
                    <p className="text-sm text-muted-foreground">{instance.profileName}</p>
                  )}
                  {instance.owner && (
                    <p className="text-xs text-muted-foreground">Número: {instance.owner}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getConnectionStatusColor(instance)}>
                  {getConnectionStatusLabel(instance)}
                </Badge>
                
                {/* QR Code button - only for disconnected instances */}
                {(instance.connectionStatus !== 'open' && instance.instance?.state !== 'open') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchQrCode(instance.instanceName || instance.instance?.instanceName)}
                    title="Obter QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}

                {/* Associate button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInstanceToAssociate(instance.instanceName || instance.instance?.instanceName);
                    setAssociateDialogOpen(true);
                  }}
                  title="Associar a vendedor"
                >
                  <Link className="h-4 w-4" />
                </Button>

                {/* Delete button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteInstance(instance.instanceName || instance.instance?.instanceName)}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  title="Deletar instância"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code para conectar a instância "{currentInstanceName}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {loadingQr ? (
              <div className="py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Gerando QR Code...</p>
              </div>
            ) : currentQrCode ? (
              <>
                <img 
                  src={currentQrCode.startsWith('data:') ? currentQrCode : `data:image/png;base64,${currentQrCode}`} 
                  alt="QR Code WhatsApp" 
                  className="max-w-[280px] rounded-lg border"
                />
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Abra o WhatsApp → Menu → Aparelhos conectados → Conectar aparelho
                </p>
              </>
            ) : (
              <div className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  QR Code não disponível. A instância pode já estar conectada.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => fetchQrCode(currentInstanceName)}
              disabled={loadingQr}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingQr ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => setQrDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Associate Dialog */}
      <Dialog open={associateDialogOpen} onOpenChange={setAssociateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Associar Instância a Vendedor</DialogTitle>
            <DialogDescription>
              Vincule a instância "{instanceToAssociate}" a um vendedor do sistema
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={vendedorToAssociate} onValueChange={setVendedorToAssociate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((vend) => (
                    <SelectItem key={vend.id} value={vend.id}>
                      {vend.nome} ({vend.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssociateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={associateInstanceToVendedor}
              disabled={associating || !vendedorToAssociate}
              className="bg-green-500 hover:bg-green-600"
            >
              {associating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Associando...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-1" />
                  Associar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
