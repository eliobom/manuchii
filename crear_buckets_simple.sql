-- ============================================================================
-- CREAR BUCKETS DE STORAGE SIMPLE
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

-- Verificar que los buckets existen
SELECT id, name, public FROM storage.buckets WHERE id IN ('task-attachments', 'class-attachments');
