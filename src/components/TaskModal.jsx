import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Play, FileText, Image, Video, Plus, Trash2, MessageCircle } from 'lucide-react';
import { apiClient } from '../apiClient';
import CommentSection from './CommentSection';
import AttachmentSection from './AttachmentSection';

const TaskModal = ({ isOpen, onClose, task, onSave, isLoading, appUsers }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    description: '',
    type: 'exercise',
    priority: 'medium',
    due_date: '',
    config: {
      media: [],
      instructions: '',
      goals: [],
      notes: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [urlInputs, setUrlInputs] = useState({
    video: '',
    image: '',
    document: ''
  });
  const [pendingAttachments, setPendingAttachments] = useState([]);

  const taskTypes = [
    { value: 'exercise', label: 'Ejercicio', icon: '🏋️', color: 'bg-green-100 text-green-800' },
    { value: 'measurement', label: 'Medición Corporal', icon: '📏', color: 'bg-blue-100 text-blue-800' },
    { value: 'habit', label: 'Hábito Diario', icon: '🎯', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'goal', label: 'Meta Personalizada', icon: '⭐', color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    if (task) {
      setFormData({
        user_id: task.user_id || '',
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'exercise',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        config: task.config || {
          media: [],
          instructions: '',
          goals: [],
          notes: ''
        }
      });
      // Cargar URL del video desde config si existe
      setUrlInputs({
        video: task.config?.video_url || '',
        image: '',
        document: ''
      });
    } else {
      setFormData({
        user_id: '',
        title: '',
        description: '',
        type: 'exercise',
        priority: 'medium',
        due_date: '',
        config: {
          media: [],
          instructions: '',
          goals: [],
          notes: ''
        }
      });
      // Resetear URLs
      setUrlInputs({
        video: '',
        image: '',
        document: ''
      });
    }
    setErrors({});
  }, [task, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [field]: value }
    }));
  };

  const addMedia = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'video' ? 'video/*' : type === 'image' ? 'image/*' : 'application/pdf,.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setUploading(true);
        try {
          const result = await apiClient.uploadFile(file);
          const newMedia = {
            type,
            url: result.url,
            name: result.fileName,
            size: result.size
          };
          handleConfigChange('media', [...formData.config.media, newMedia]);
        } catch (error) {
          alert('Error al subir archivo: ' + error.message);
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await apiClient.uploadFile(file);
      setPendingAttachments(prev => [...prev, {
        url: result.url,
        name: result.fileName,
        size: result.size,
        type: file.type
      }]);
    } catch (error) {
      alert('Error al subir archivo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removePendingAttachment = (index) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addMediaFromUrl = (type) => {
    const url = urlInputs[type];
    if (!url || !url.trim()) {
      alert(`Por favor ingresa una URL para el ${type === 'video' ? 'video' : type === 'image' ? 'imagen' : 'documento'}`);
      return;
    }

    try {
      // Validate URL format
      new URL(url.trim());
      const urlObj = new URL(url.trim());
      const filename = urlObj.pathname.split('/').pop() || `archivo-${Date.now()}`;
      const newMedia = {
        type,
        url: url.trim(),
        name: filename,
        size: 0 // URLs don't have size
      };
      handleConfigChange('media', [...formData.config.media, newMedia]);
      // Clear the input
      setUrlInputs(prev => ({ ...prev, [type]: '' }));
    } catch (error) {
      alert('URL inválida. Por favor ingresa una URL válida.');
    }
  };

  const handleUrlInputChange = (type, value) => {
    setUrlInputs(prev => ({ ...prev, [type]: value }));
  };

  const removeMedia = (index) => {
    const newMedia = formData.config.media.filter((_, i) => i !== index);
    handleConfigChange('media', newMedia);
  };

  const addGoal = () => {
    handleConfigChange('goals', [...formData.config.goals, '']);
  };

  const updateGoal = (index, value) => {
    const newGoals = [...formData.config.goals];
    newGoals[index] = value;
    handleConfigChange('goals', newGoals);
  };

  const removeGoal = (index) => {
    const newGoals = formData.config.goals.filter((_, i) => i !== index);
    handleConfigChange('goals', newGoals);
  };

  const validateForm = () => {
    const newErrors = {};

    // user_id no es requerido si es "all" o está vacío
    if (!formData.user_id || formData.user_id === 'all') {
      // OK - tarea para todos o sin asignar
    }
    if (!formData.title.trim()) newErrors.title = 'Título es requerido';
    if (!formData.description.trim()) newErrors.description = 'Descripción es requerida';
    if (!formData.type) newErrors.type = 'Tipo de tarea es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSave = {
        ...formData,
        // Si user_id es "all", lo dejamos como null (sin asignar)
        user_id: formData.user_id === 'all' ? null : formData.user_id,
        config: {
          ...formData.config,
          video_url: urlInputs.video || null,
          goals: formData.config.goals.filter(goal => goal.trim()),
          pendingAttachments: pendingAttachments // Save pending attachments
        }
      };
      onSave(dataToSave);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Editar Tarea' : 'Crear Nueva Tarea'}
          </h2>
          <div className="flex items-center gap-3">
            {task && (
              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver comentarios"
              >
                <MessageCircle className="w-5 h-5" />
                Comentarios
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <select
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.user_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="all">Todos los usuarios</option>
                <option value="">Seleccionar usuario específico</option>
                {appUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} {user.last_names}
                  </option>
                ))}
              </select>
              {errors.user_id && <p className="text-red-500 text-sm mt-1">{errors.user_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Tarea *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {taskTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Título de la tarea"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'low', label: 'Baja', color: 'bg-green-500 border-green-600', hoverColor: 'hover:bg-green-600' },
                  { value: 'medium', label: 'Media', color: 'bg-orange-500 border-orange-600', hoverColor: 'hover:bg-orange-600' },
                  { value: 'high', label: 'Alta', color: 'bg-red-500 border-red-600', hoverColor: 'hover:bg-red-600' }
                ].map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                    className={`px-4 py-3 rounded-lg border-2 font-medium text-white transition-colors ${
                      formData.priority === priority.value
                        ? `${priority.color} ring-2 ring-offset-2 ring-blue-500`
                        : `bg-gray-300 border-gray-400 ${priority.hoverColor} hover:border-gray-500`
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe la tarea en detalle"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Límite
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Media Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contenido Multimedia</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => addMedia('video')}
                disabled={uploading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Video className="w-4 h-4" />
                Subir Video
              </button>
              <button
                type="button"
                onClick={() => addMedia('image')}
                disabled={uploading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image className="w-4 h-4" />
                Subir Imagen
              </button>
              <button
                type="button"
                onClick={() => addMedia('document')}
                disabled={uploading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                Subir PDF
              </button>
            </div>

            <div className="space-y-4 mb-4">
              {/* Video URL Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="Ingresa URL del video (YouTube, Vimeo, etc.)"
                    value={urlInputs.video}
                    onChange={(e) => handleUrlInputChange('video', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addMediaFromUrl('video')}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Video className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {/* Image URL Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="Ingresa URL de la imagen (GIF, PNG, JPG, etc.)"
                    value={urlInputs.image}
                    onChange={(e) => handleUrlInputChange('image', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addMediaFromUrl('image')}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Image className="w-4 h-4" />
                  Agregar
                </button>
              </div>

              {/* Document URL Input */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="Ingresa URL del documento o archivo"
                    value={urlInputs.document}
                    onChange={(e) => handleUrlInputChange('document', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addMediaFromUrl('document')}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <FileText className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>

            {formData.config.media.length > 0 && (
              <div className="space-y-2">
                {formData.config.media.map((media, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {media.type === 'video' && <Play className="w-5 h-5 text-red-500" />}
                      {media.type === 'image' && <Image className="w-5 h-5 text-blue-500" />}
                      {media.type === 'document' && <FileText className="w-5 h-5 text-gray-500" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{media.name}</p>
                        <p className="text-xs text-gray-500">
                          {media.size > 0 ? `${(media.size / 1024 / 1024).toFixed(2)} MB` : 'URL externa'}
                        </p>
                        {media.size === 0 && (
                          <p className="text-xs text-blue-600 truncate max-w-xs">{media.url}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Archivos Adjuntos</h3>

            {/* Upload button - works even before saving */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <button
                  type="button"
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors w-full"
                >
                  {uploading ? (
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
              <p className="text-xs text-gray-500 mt-2">
                Sube archivos antes o después de guardar la tarea
              </p>
            </div>

            {/* Pending attachments (not yet saved to DB) */}
            {pendingAttachments.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Archivos pendientes de guardar ({pendingAttachments.length})
                </p>
                <div className="space-y-2">
                  {pendingAttachments.map((att, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{att.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments already saved (only if task exists) */}
            {task?.id && (
              <AttachmentSection taskId={task.id} isEditing={true} />
            )}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instrucciones Adicionales
            </label>
            <textarea
              value={formData.config.instructions}
              onChange={(e) => handleConfigChange('instructions', e.target.value)}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instrucciones específicas para completar la tarea"
            />
          </div>

          {/* Goals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Objetivos Específicos
              </label>
              <button
                type="button"
                onClick={addGoal}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-4 h-4" />
                Agregar Objetivo
              </button>
            </div>
            {formData.config.goals.map((goal, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateGoal(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe el objetivo"
                />
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Internas
            </label>
            <textarea
              value={formData.config.notes}
              onChange={(e) => handleConfigChange('notes', e.target.value)}
              rows="2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas privadas para el entrenador"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors order-2 sm:order-1"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {task ? 'Actualizar' : 'Crear'} Tarea
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comments Section */}
      {task && (
        <CommentSection
          taskId={task.id}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
};

export default TaskModal;