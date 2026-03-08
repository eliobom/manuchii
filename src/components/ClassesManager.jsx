import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Image as ImageIcon, Video, Clock, Target } from 'lucide-react';
import { apiClient } from '../apiClient';

const ClassesManager = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'strength',
    duration: 30,
    difficulty: 'intermediate',
    status: 'active'
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
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' }
  ];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await apiClient.put(`/classes/${editingClass.id}`, formData);
      } else {
        await apiClient.post('/classes', formData);
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
      difficulty: classItem.difficulty || 'intermediate',
      status: classItem.status || 'active'
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta clase?')) {
      try {
        await apiClient.delete(`/classes/${classId}`);
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
      difficulty: 'intermediate',
      status: 'active'
    });
    setEditingClass(null);
    setShowForm(false);
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
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Press de banca con barra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe los ejercicios y técnicas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Video/GIF *
                </label>
                <input
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://fitcron.com/wp-content/uploads/2021/03/00251301-Barbell-Bench-Press_Chest-FIX_720.gif"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Pega la URL del video o GIF de ejercicios (YouTube, GIF, MP4, etc.)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
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
                <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(classItem.difficulty)}`}>
                  {difficulties.find(d => d.value === classItem.difficulty)?.label || classItem.difficulty}
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
