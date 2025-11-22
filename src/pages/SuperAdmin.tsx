import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Loader2, UserPlus, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "gabriel.dialogue@gmail.com";
const ADMIN_PASSWORD = "0409L@ve";

export default function SuperAdmin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Supervisor form
  const [supervisorNome, setSupervisorNome] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [supervisorSenha, setSupervisorSenha] = useState("");
  const [supervisorLoading, setSupervisorLoading] = useState(false);

  // Vendedor form
  const [vendedorNome, setVendedorNome] = useState("");
  const [vendedorEmail, setVendedorEmail] = useState("");
  const [vendedorSenha, setVendedorSenha] = useState("");
  const [vendedorEspecialidade, setVendedorEspecialidade] = useState("");
  const [vendedorLoading, setVendedorLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      toast({
        title: "Autenticado com sucesso",
        description: "Bem-vindo ao painel Super Admin",
      });
    } else {
      toast({
        title: "Credenciais inválidas",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    }
    
    setAuthLoading(false);
  };

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupervisorLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-supervisor', {
        body: {
          nome: supervisorNome,
          email: supervisorEmail,
          senha: supervisorSenha,
        },
      });

      if (error) throw error;

      toast({
        title: "Supervisor criado com sucesso",
        description: `${supervisorNome} foi cadastrado no sistema`,
      });

      // Reset form
      setSupervisorNome("");
      setSupervisorEmail("");
      setSupervisorSenha("");
    } catch (error) {
      console.error('Error creating supervisor:', error);
      toast({
        title: "Erro ao criar supervisor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSupervisorLoading(false);
    }
  };

  const handleCreateVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setVendedorLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-vendedor', {
        body: {
          nome: vendedorNome,
          email: vendedorEmail,
          senha: vendedorSenha,
          especialidade_marca: vendedorEspecialidade,
        },
      });

      if (error) throw error;

      toast({
        title: "Vendedor criado com sucesso",
        description: `${vendedorNome} foi cadastrado no sistema`,
      });

      // Reset form
      setVendedorNome("");
      setVendedorEmail("");
      setVendedorSenha("");
      setVendedorEspecialidade("");
    } catch (error) {
      console.error('Error creating vendedor:', error);
      toast({
        title: "Erro ao criar vendedor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setVendedorLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl border-destructive">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-destructive to-accent shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Super Admin
            </CardTitle>
            <CardDescription>
              Acesso restrito. Insira suas credenciais de administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-destructive hover:bg-destructive/90"
                disabled={authLoading}
              >
                {authLoading ? "Autenticando..." : "Acessar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-destructive to-accent shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Super Admin</h1>
              <p className="text-muted-foreground">
                Gerenciamento de contas e usuários do sistema
              </p>
            </div>
          </div>
          <Badge className="bg-destructive text-destructive-foreground px-4 py-2 text-sm">
            Acesso Restrito
          </Badge>
        </div>

        {/* Create Supervisor Card */}
        <Card className="border-primary bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Criar Conta de Supervisor
            </CardTitle>
            <CardDescription>
              Supervisores podem visualizar todos os atendimentos e gerenciar vendedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSupervisor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supervisor-nome">Nome Completo</Label>
                <Input
                  id="supervisor-nome"
                  placeholder="Ex: João Silva"
                  value={supervisorNome}
                  onChange={(e) => setSupervisorNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisor-email">Email</Label>
                <Input
                  id="supervisor-email"
                  type="email"
                  placeholder="supervisor@exemplo.com"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisor-senha">Senha</Label>
                <Input
                  id="supervisor-senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={supervisorSenha}
                  onChange={(e) => setSupervisorSenha(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={supervisorLoading}
              >
                {supervisorLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Supervisor
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Create Vendedor Card */}
        <Card className="border-success bg-gradient-to-br from-success/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-success" />
              Criar Conta de Vendedor
            </CardTitle>
            <CardDescription>
              Vendedores recebem e gerenciam atendimentos de sua especialidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVendedor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendedor-nome">Nome Completo</Label>
                <Input
                  id="vendedor-nome"
                  placeholder="Ex: Maria Santos"
                  value={vendedorNome}
                  onChange={(e) => setVendedorNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendedor-email">Email</Label>
                <Input
                  id="vendedor-email"
                  type="email"
                  placeholder="vendedor@exemplo.com"
                  value={vendedorEmail}
                  onChange={(e) => setVendedorEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendedor-senha">Senha</Label>
                <Input
                  id="vendedor-senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={vendedorSenha}
                  onChange={(e) => setVendedorSenha(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendedor-especialidade">Especialidade/Marca</Label>
                <Input
                  id="vendedor-especialidade"
                  placeholder="Ex: Toyota, Honda, Chevrolet"
                  value={vendedorEspecialidade}
                  onChange={(e) => setVendedorEspecialidade(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Marca de veículos que este vendedor irá atender
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-success hover:bg-success/90"
                disabled={vendedorLoading}
              >
                {vendedorLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Vendedor
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
