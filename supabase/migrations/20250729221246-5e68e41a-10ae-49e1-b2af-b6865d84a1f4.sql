-- Criar bucket para imagens de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);

-- Criar políticas para o bucket de imagens de eventos
CREATE POLICY "Usuários autenticados podem fazer upload de imagens de eventos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Imagens de eventos são públicas para visualização"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

CREATE POLICY "Usuários podem atualizar suas próprias imagens de eventos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar suas próprias imagens de eventos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);