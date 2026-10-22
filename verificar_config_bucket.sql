-- Ver la configuración actual de los buckets
SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets;

-- Ver las políticas existentes
SELECT policyname, tablename, cmd, qual, with_check FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Eliminar y recrear políticas si es necesario
DROP POLICY IF EXISTS "Insert task-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public Access task-attachments" ON storage.objects;

CREATE POLICY "Public Access task-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Insert task-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "Insert class-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public Access class-attachments" ON storage.objects;

CREATE POLICY "Public Access class-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'class-attachments');

CREATE POLICY "Insert class-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'class-attachments');
