-- ============================================================================
-- CREAR BUCKETS DE STORAGE EN SUPABASE
-- ============================================================================
-- Ejecutar esto en el SQL Editor de Supabase

-- Crear bucket para adjuntos de tareas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para adjuntos de clases
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-attachments',
  'class-attachments',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLÍTICAS DE ACCESO PARA storage.objects
-- ============================================================================

-- Permitir lectura pública de task-attachments
CREATE POLICY "Public Access task-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

-- Permitir insertar en task-attachments (usuarios autenticados)
CREATE POLICY "Insert task-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');

-- Permitir actualizar en task-attachments
CREATE POLICY "Update task-attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'task-attachments');

-- Permitir eliminar en task-attachments
CREATE POLICY "Delete task-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-attachments');

-- Permitir lectura pública de class-attachments
CREATE POLICY "Public Access class-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'class-attachments');

-- Permitir insertar en class-attachments (usuarios autenticados)
CREATE POLICY "Insert class-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'class-attachments' AND auth.role() = 'authenticated');

-- Permitir actualizar en class-attachments
CREATE POLICY "Update class-attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'class-attachments');

-- Permitir eliminar en class-attachments
CREATE POLICY "Delete class-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'class-attachments');
