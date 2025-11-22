-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Policy for vendedores and supervisors to upload files to their atendimentos
CREATE POLICY "Users can upload files to chat"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND
  (
    -- Vendedores can upload to their own atendimentos
    EXISTS (
      SELECT 1 FROM atendimentos a
      JOIN usuarios u ON u.id = a.vendedor_fixo_id
      WHERE u.user_id = auth.uid()
      AND (storage.foldername(name))[1] = a.id::text
    )
    OR
    -- Supervisors can upload to any atendimento
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'supervisor'::app_role
    )
  )
);

-- Policy for users to view files from atendimentos they have access to
CREATE POLICY "Users can view chat files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-files' AND
  (
    -- Vendedores can view files from their atendimentos
    EXISTS (
      SELECT 1 FROM atendimentos a
      JOIN usuarios u ON u.id = a.vendedor_fixo_id
      WHERE u.user_id = auth.uid()
      AND (storage.foldername(name))[1] = a.id::text
    )
    OR
    -- Supervisors can view all files
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'supervisor'::app_role
    )
  )
);

-- Policy for users to delete their uploaded files
CREATE POLICY "Users can delete their chat files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-files' AND
  (
    -- Vendedores can delete files from their atendimentos
    EXISTS (
      SELECT 1 FROM atendimentos a
      JOIN usuarios u ON u.id = a.vendedor_fixo_id
      WHERE u.user_id = auth.uid()
      AND (storage.foldername(name))[1] = a.id::text
    )
    OR
    -- Supervisors can delete any file
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'supervisor'::app_role
    )
  )
);

-- Add attachment_url column to mensagens table
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN mensagens.attachment_url IS 'URL do arquivo anexado (imagem, documento, etc)';
COMMENT ON COLUMN mensagens.attachment_type IS 'Tipo do arquivo anexado (image, document, etc)';