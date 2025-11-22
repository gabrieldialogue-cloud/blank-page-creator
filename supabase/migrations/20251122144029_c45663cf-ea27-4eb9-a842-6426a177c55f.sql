-- Add attachment_filename column to mensagens table
ALTER TABLE public.mensagens 
ADD COLUMN attachment_filename TEXT;