-- Create table for Evolution API configuration
CREATE TABLE IF NOT EXISTS public.evolution_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  api_key text NOT NULL,
  is_connected boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evolution_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and manage evolution config
CREATE POLICY "Authenticated users can view evolution config"
ON public.evolution_config FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert evolution config"
ON public.evolution_config FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update evolution config"
ON public.evolution_config FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete evolution config"
ON public.evolution_config FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_evolution_config_updated_at
BEFORE UPDATE ON public.evolution_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();