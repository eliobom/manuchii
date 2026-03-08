import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Image, Video, Download, Trash2 } from 'lucide-react';
import { apiClient } from '../apiClient';

const AttachmentSection = ({ taskId, isEditing = false }) => {
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadAttachments();
    }
  }, [taskId]);

  const loadAttachments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getTaskAttachments(taskId);
      setAttachments(response.data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 50MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo imágenes, videos y PDFs.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await apiClient.uploadTaskAttachment(taskId, file);
      setAttachments(prev => [response, ...prev]);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      alert('Error al subir el archivo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este adjunto?')) return;

    try {
      await apiClient.deleteTaskAttachment(attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    } catch (error) {
      console.error('Error deleting attachment:', error);
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAttachment = (attachment) => {
    const isImage = attachment.file_type === 'image';
    const isVideo = attachment.file_type === 'video';

    return (
      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getFileIcon(attachment.file_type)}

          <div className="flex-1 min-w-0">
            {isImage ? (
              <div className="flex items-center gap-3">
                <img
                  src={attachment.file_url}
                  alt={attachment.original_filename}
                  className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(attachment.file_url, '_blank')}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {attachment.original_filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {attachment.original_filename}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(attachment.file_url, '_blank')}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Ver/Download"
          >
            <Download className="w-4 h-4" />
          </button>

          {isEditing && (
            <button
              onClick={() => handleDeleteAttachment(attachment.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Adjuntos</h3>
        {isEditing && (
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

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Cargando adjuntos...</p>
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay adjuntos</p>
          {isEditing && (
            <p className="text-xs text-gray-400 mt-1">
              Sube imágenes, videos o documentos para esta tarea
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {attachments.map(renderAttachment)}
        </div>
      )}

      {isEditing && (
        <p className="text-xs text-gray-500">
          Tipos permitidos: Imágenes (JPG, PNG, GIF, WebP), Videos (MP4, AVI, MOV), PDFs. Máximo 50MB por archivo.
        </p>
      )}

      {!isEditing && attachments.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">📎 Adjuntos disponibles</p>
          <p className="text-xs text-blue-600">
            {attachments.length} archivo{attachments.length !== 1 ? 's' : ''} adjunto{attachments.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default AttachmentSection;