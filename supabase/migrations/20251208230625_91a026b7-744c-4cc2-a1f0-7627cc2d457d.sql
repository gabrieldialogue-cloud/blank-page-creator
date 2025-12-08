-- Add Evolution API columns to config_vendedores
ALTER TABLE public.config_vendedores
ADD COLUMN IF NOT EXISTS evolution_instance_name text,
ADD COLUMN IF NOT EXISTS evolution_phone_number text,
ADD COLUMN IF NOT EXISTS evolution_status text DEFAULT 'disconnected';

-- Add comment for documentation
COMMENT ON COLUMN public.config_vendedores.evolution_instance_name IS 'Nome da instância na Evolution API';
COMMENT ON COLUMN public.config_vendedores.evolution_phone_number IS 'Número de telefone do WhatsApp do vendedor';
COMMENT ON COLUMN public.config_vendedores.evolution_status IS 'Status da conexão: disconnected, pending_qr, connected';