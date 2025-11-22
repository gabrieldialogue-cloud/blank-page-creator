-- Create enum types for status management
CREATE TYPE user_role AS ENUM ('vendedor', 'supervisor', 'admin');
CREATE TYPE atendimento_status AS ENUM ('ia_respondendo', 'aguardando_cliente', 'vendedor_intervindo', 'aguardando_orcamento', 'aguardando_fechamento', 'encerrado');
CREATE TYPE intervencao_tipo AS ENUM ('orcamento', 'ajuda_humana', 'fechamento_pedido', 'garantia', 'reembolso', 'troca');
CREATE TYPE prioridade_vendedor AS ENUM ('1', '2', '3');

-- Clientes table
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usuarios (vendedores e supervisores)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'vendedor',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Config vendedores
CREATE TABLE config_vendedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  especialidade_marca TEXT NOT NULL, -- Fiat, VW, GM, Importados, etc
  prioridade prioridade_vendedor NOT NULL DEFAULT '3',
  status_online BOOLEAN DEFAULT false,
  ultimo_atendimento_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Atendimentos
CREATE TABLE atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  vendedor_fixo_id UUID REFERENCES usuarios(id), -- Vendedor fixo responsável
  marca_veiculo TEXT NOT NULL,
  modelo_veiculo TEXT,
  ano_veiculo TEXT,
  placa TEXT,
  chassi TEXT,
  status atendimento_status DEFAULT 'ia_respondendo',
  resumo_necessidade TEXT,
  fotos_urls TEXT[], -- Array de URLs das fotos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mensagens
CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id UUID REFERENCES atendimentos(id) ON DELETE CASCADE,
  remetente_tipo TEXT NOT NULL, -- 'ia', 'cliente', 'vendedor', 'supervisor'
  remetente_id UUID REFERENCES usuarios(id), -- NULL se for IA ou cliente
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intervencoes
CREATE TABLE intervencoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id UUID REFERENCES atendimentos(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES usuarios(id),
  tipo intervencao_tipo NOT NULL,
  descricao TEXT,
  resolvida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Status atendimento tracking
CREATE TABLE status_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id UUID REFERENCES atendimentos(id) ON DELETE CASCADE,
  status_anterior atendimento_status,
  status_novo atendimento_status NOT NULL,
  alterado_por_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_atendimento ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios
CREATE POLICY "Users can view all usuarios"
  ON usuarios FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON usuarios FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for config_vendedores
CREATE POLICY "Vendedores can view all configs"
  ON config_vendedores FOR SELECT
  USING (true);

CREATE POLICY "Vendedores can update own config"
  ON config_vendedores FOR UPDATE
  USING (usuario_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid()));

-- RLS Policies for atendimentos
CREATE POLICY "Vendedores can view their atendimentos"
  ON atendimentos FOR SELECT
  USING (
    vendedor_fixo_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND role = 'supervisor')
  );

CREATE POLICY "Vendedores can update their atendimentos"
  ON atendimentos FOR UPDATE
  USING (
    vendedor_fixo_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND role = 'supervisor')
  );

-- RLS Policies for mensagens
CREATE POLICY "Users can view mensagens from their atendimentos"
  ON mensagens FOR SELECT
  USING (
    atendimento_id IN (
      SELECT id FROM atendimentos 
      WHERE vendedor_fixo_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND role = 'supervisor')
    )
  );

CREATE POLICY "Users can insert mensagens"
  ON mensagens FOR INSERT
  WITH CHECK (
    atendimento_id IN (
      SELECT id FROM atendimentos 
      WHERE vendedor_fixo_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND role = 'supervisor')
    )
  );

-- RLS Policies for intervencoes
CREATE POLICY "Users can view intervencoes"
  ON intervencoes FOR SELECT
  USING (
    atendimento_id IN (
      SELECT id FROM atendimentos 
      WHERE vendedor_fixo_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND role = 'supervisor')
    )
  );

CREATE POLICY "Users can create intervencoes"
  ON intervencoes FOR INSERT
  WITH CHECK (
    atendimento_id IN (
      SELECT id FROM atendimentos 
      WHERE vendedor_fixo_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND role = 'supervisor')
    )
  );

-- RLS Policies for clientes
CREATE POLICY "Users can view clientes"
  ON clientes FOR SELECT
  USING (true);

-- RLS Policies for status_atendimento
CREATE POLICY "Users can view status changes"
  ON status_atendimento FOR SELECT
  USING (
    atendimento_id IN (
      SELECT id FROM atendimentos 
      WHERE vendedor_fixo_id IN (SELECT id FROM usuarios WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM usuarios WHERE user_id = auth.uid() AND role = 'supervisor')
    )
  );

-- Indexes for performance
CREATE INDEX idx_atendimentos_vendedor ON atendimentos(vendedor_fixo_id);
CREATE INDEX idx_atendimentos_status ON atendimentos(status);
CREATE INDEX idx_mensagens_atendimento ON mensagens(atendimento_id);
CREATE INDEX idx_config_vendedores_usuario ON config_vendedores(usuario_id);
CREATE INDEX idx_config_vendedores_marca ON config_vendedores(especialidade_marca);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_vendedores_updated_at BEFORE UPDATE ON config_vendedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atendimentos_updated_at BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervencoes_updated_at BEFORE UPDATE ON intervencoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();