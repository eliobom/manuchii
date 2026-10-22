import React, { useEffect, useState } from 'react';
import { Upload, FileText, Image, Video, Download, Trash2 } from 'lucide-react';
import { apiClient } from '../apiClient';

const normalizeSupabasePublicUrl = (url) => {
  const raw = String(url || '');
  if (!raw) return raw;
  if (raw.includes('/storage/v1/object/public/')) return raw;
  return raw.replace('/storage/v1/object/', '/storage/v1/object/public/');
};

const ClassAttachmentSection = ({ classId, isEditing = false }) => {
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const hasValidClassId = classId && classId !== 'undefined' && classId !== null;

  useEffect(() => {
    if (hasValidClassId) {
      loadAttachments();
    }
  }, [classId]);

  const loadAttachments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getClassAttachments(classId);
      setAttachments(data || []);
    } catch (err) {
      console.error('Error loading class attachments:', err);
      setError('Error al cargar adjuntos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasValidClassId) {
      alert('Guarda la clase primero antes de subir archivos');
      return;
    }

    // Sin restricciones de tamaño ni tipo de archivo

    setIsUploading(true);
    try {
      const attachment = await apiClient.uploadClassAttachment(classId, file);
      setAttachments(prev => [attachment, ...prev]);
    } catch (err) {
      console.error('Error uploading class attachment:', err);
      alert('Error al subir el archivo: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este adjunto?')) return;

    try {
      await apiClient.deleteClassAttachment(attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    } catch (err) {
      console.error('Error deleting class attachment:', err);
      alert('Error al eliminar el adjunto');
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Adjuntos de la Clase</h3>
        {isEditing && hasValidClassId && (
          <div className="relative">
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <button
              type="button"
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Subir Archivo
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Cargando adjuntos...</p>
        </div>
      ) : !hasValidClassId ? (
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Guarda la clase primero para agregar adjuntos</p>
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay adjuntos</p>
          {isEditing && (
            <p className="text-xs text-gray-400 mt-1">
              Sube imágenes, videos o PDFs para esta clase
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {attachments.map(att => (
            (() => {
              const fileUrl = normalizeSupabasePublicUrl(att.file_url);
              return (
            <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(att.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {att.original_filename}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(att.file_size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Ver/Download"
                  type="button"
                >
                  <Download className="w-4 h-4" />
                </button>
                {isEditing && (
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
              );
            })()
          ))}
        </div>
      )}

      {isEditing && (
        <p className="text-xs text-gray-500">
          Se permiten archivos de cualquier tipo y tamaño.
        </p>
      )}
    </div>
  );
};

export default ClassAttachmentSection;
