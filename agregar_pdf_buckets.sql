-- Actualizar bucket de clases para permitir PDFs
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf']
WHERE id = 'class-attachments';

-- Verificar la configuración actual de los buckets
SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id IN ('task-attachments', 'class-attachments');
