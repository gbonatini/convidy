-- Criar bucket para imagens de eventos e logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública de imagens
CREATE POLICY "Imagens são públicas para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Política para upload de imagens por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Política para usuários poderem atualizar suas próprias imagens
CREATE POLICY "Usuários podem atualizar imagens"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Política para usuários poderem deletar imagens
CREATE POLICY "Usuários podem deletar imagens"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');