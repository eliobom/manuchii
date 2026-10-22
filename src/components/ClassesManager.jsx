import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Play, Image as ImageIcon, Video, Clock, Target, Upload, X } from 'lucide-react';
import { apiClient } from '../apiClient';
import ClassAttachmentSection from './ClassAttachmentSection';

const ClassesManager = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'strength',
    duration: 30,
    level: 'Intermedio',
    allow_user_uploads: false,
    media_type: 'video'
  });

  const categories = [
    { value: 'strength', label: 'Fuerza' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'flexibility', label: 'Flexibilidad' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'dance', label: 'Baile' },
    { value: 'other', label: 'Otro' }
  ];

  const difficulties = [
    { value: 'Principiante', label: 'Principiante' },
    { value: 'Intermedio', label: 'Intermedio' },
    { value: 'Avanzado', label: 'Avanzado' }
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getClasses();
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        video_url: formData.video_url,
        category: formData.category,
        duration: formData.duration,
        level: formData.level,
        allow_user_uploads: formData.allow_user_uploads,
        media_type: formData.media_type,
        instructor_id: apiClient.user?.id || null
      };

      if (editingClass) {
        await apiClient.updateClass(editingClass.id, payload);
      } else {
        await apiClient.createClass(payload);
      }
      
      resetForm();
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Error al guardar la clase');
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      title: classItem.title || '',
      description: classItem.description || '',
      video_url: classItem.video_url || '',
      category: classItem.category || 'strength',
      duration: classItem.duration || 30,
      level: classItem.level || 'Intermedio',
      allow_user_uploads: classItem.allow_user_uploads || false,
      media_type: classItem.media_type || 'video'
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
      try {
        await apiClient.deleteClass(classId);
        fetchClasses();
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error al eliminar la clase');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      category: 'strength',
      duration: 30,
      level: 'Intermedio',
      allow_user_uploads: false,
      media_type: 'video'
    });
    setEditingClass(null);
    setShowForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de archivo no válido. Solo se permiten videos, imágenes y PDF');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 50MB');
      return;
    }

    setUploading(true);
    try {
      const result = await apiClient.uploadFile(file);
      setFormData({ ...formData, video_url: result.url });
      alert('Archivo subido correctamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Intenta con una URL directamente.');
    } finally {
      setUploading(false);
    }
  };

  const isVideoUrl = (url) => {
    return url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || url.includes('.webm'));
  };

  const isGifUrl = (url) => {
    return url && url.includes('.gif');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'strength': return <Target className="w-4 h-4" />;
      case 'cardio': return <Clock className="w-4 h-4" />;
      case 'yoga': return <ImageIcon className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Principiante': return 'bg-green-100 text-green-800';
      case 'Intermedio': return 'bg-yellow-100 text-yellow-800';
      case 'Avanzado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clases</h1>
          <p className="text-gray-600">Agrega y gestiona clases con videos de ejercicios</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Clase
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingClass ? 'Editar Clase' : 'Nueva Clase'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Press de banca con barra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe los ejercicios y técnicas..."
                />
              </div>

              {/* SECCIÓN DE SUBIR VIDEO/IMAGEN - MUY VISIBLE */}
              <div className="border-2 border-dashed border-blue-500 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center">
                  <Video className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    📹 Sube tu Video o Imagen
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Selecciona un archivo de tu computadora (MP4, MOV, WebM, JPG, PNG, GIF)
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl font-bold text-lg">
                    <Upload className="w-6 h-6" />
                    Seleccionar Archivo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploading && (
                  <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-blue-700 font-medium mt-2">Subiendo archivo...</p>
                  </div>
                )}
                {formData.video_url && !uploading && (
                  <div className="mt-6 p-4 bg-green-100 border-2 border-green-400 rounded-lg">
                    <p className="text-green-800 font-bold flex items-center justify-center gap-2">
                      ✓ ¡Archivo subido exitosamente!
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dificultad
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Allow user uploads checkbox */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allow_user_uploads"
                    checked={formData.allow_user_uploads}
                    onChange={(e) => setFormData({ ...formData, allow_user_uploads: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <label htmlFor="allow_user_uploads" className="font-medium text-gray-900">
                      Permitir que usuarios suban sus propios archivos
                    </label>
                    <p className="text-sm text-gray-600">
                      Los usuarios podrán subir fotos y videos de sus ejercicios a esta clase
                    </p>
                  </div>
                </div>

                {formData.allow_user_uploads && (
                  <div className="mt-3 ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipos de archivos permitidos
                    </label>
                    <select
                      value={formData.media_type}
                      onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="video">Solo Videos</option>
                      <option value="image">Solo Imágenes</option>
                      <option value="both">Videos e Imágenes</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Preview */}
              {formData.video_url && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                  {isGifUrl(formData.video_url) ? (
                    <img
                      src={formData.video_url}
                      alt="Preview"
                      className="w-full h-48 object-contain bg-black rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                      <Video className="w-12 h-12 text-gray-400" />
                      <span className="ml-2 text-gray-500">Video preview</span>
                    </div>
                  )}
                  <div className="text-red-500 text-sm mt-2 hidden">
                    Error al cargar el video. Verifica la URL.
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <ClassAttachmentSection classId={editingClass?.id} isEditing={true} />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingClass ? 'Actualizar' : 'Crear'} Clase
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <div key={classItem.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Video/Image Preview */}
            <div className="h-48 bg-gray-100 relative">
              {classItem.video_url ? (
                isGifUrl(classItem.video_url) ? (
                  <img
                    src={classItem.video_url}
                    alt={classItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                )
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Video className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Category Badge */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                {getCategoryIcon(classItem.category)}
                {categories.find(c => c.value === classItem.category)?.label || classItem.category}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{classItem.title}</h3>
              {classItem.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{classItem.description}</p>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(classItem.level)}`}>
                  {difficulties.find(d => d.value === classItem.level)?.label || classItem.level}
                </span>
                <span className="text-gray-500 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {classItem.duration} min
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(classItem)}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(classItem.id)}
                  className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm flex items-center justify-center gap-1 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clases</h3>
          <p className="text-gray-600 mb-4">Comienza agregando tu primera clase con video</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar Primera Clase
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassesManager;
