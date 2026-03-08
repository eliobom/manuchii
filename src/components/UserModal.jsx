import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Calendar, MapPin, Phone, Hash, Lock } from 'lucide-react';

const UserModal = ({ isOpen, onClose, user, onSave, isLoading, hideRole = false, fixedRole = null, requireEmail = false, hideTareas = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    last_names: '',
    id_number: '',
    birth_date: '',
    birth_place: '',
    role: 'user',
    email: '',
    tareas: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '', // Don't show existing password for security
        full_name: user.full_name || '',
        last_names: user.last_names || '',
        id_number: user.id_number || '',
        birth_date: user.birth_date || '',
        birth_place: user.birth_place || '',
        role: fixedRole || user.role || 'user',
        email: user.email || '',
        tareas: Array.isArray(user.tareas) ? user.tareas.join('\n') : (user.tareas || '')
      });
    } else {
      setFormData({
        username: '',
        password: '',
        full_name: '',
        last_names: '',
        id_number: '',
        birth_date: '',
        birth_place: '',
        role: fixedRole || 'user',
        email: '',
        tareas: ''
      });
    }
    setErrors({});
  }, [user, isOpen, fixedRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const effectiveRole = fixedRole || formData.role;
    const isAppUser = effectiveRole === 'user' || effectiveRole === 'app-user';
    const shouldRequireEmail = requireEmail || effectiveRole === 'trainer' || effectiveRole === 'admin';

    if (!formData.username.trim()) newErrors.username = 'Usuario es requerido';
    if (!formData.full_name.trim()) newErrors.full_name = 'Nombre es requerido';
    if (isAppUser) {
      if (!formData.last_names.trim()) newErrors.last_names = 'Apellidos son requeridos';
      if (!formData.id_number.trim()) newErrors.id_number = 'Número de identificación es requerido';
      if (!formData.birth_date) newErrors.birth_date = 'Fecha de nacimiento es requerida';
      if (!formData.birth_place.trim()) newErrors.birth_place = 'Lugar de nacimiento es requerido';
    }
    if (!fixedRole && !formData.role) newErrors.role = 'Rol es requerido';

    // Password validation for new users
    if (!user && !formData.password.trim()) {
      newErrors.password = 'Contraseña es requerida para nuevos usuarios';
    } else if (!user && formData.password.length < 6) {
      newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (shouldRequireEmail && !String(formData.email || '').trim()) newErrors.email = 'Email es requerido';
    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = 'Email inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSave = {
        ...formData,
        role: fixedRole || formData.role,
      };

      // Only include tareas for app users (role 'user')
      if (dataToSave.role === 'user' || dataToSave.role === 'app-user') {
        const tareasArray = String(formData.tareas || '')
          .split(/\r?\n/)
          .map(t => t.trim())
          .filter(Boolean);
        dataToSave.tareas = tareasArray;
      }

      onSave(dataToSave);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {(user && user.id)
              ? ((fixedRole || formData.role) === 'trainer' ? 'Editar Entrenador' : 'Editar Usuario')
              : ((fixedRole || formData.role) === 'trainer' ? 'Crear Entrenador' : 'Crear Nuevo Usuario')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Username and Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre de usuario"
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            {!hideRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="user">Usuario</option>
                  <option value="trainer">Entrenador</option>
                  <option value="admin">Administrador</option>
                </select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>
            )}
          </div>

          {/* Password - only for new users */}
          {!user || !user.id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Contraseña segura"
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
          )}

          {/* Tareas */}
          {!hideTareas && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tareas
              </label>
              <textarea
                name="tareas"
                value={formData.tareas}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe 1 tarea por línea"
              />
              <p className="text-xs text-gray-500 mt-1">Cada línea se guardará como una tarea para este usuario.</p>
            </div>
          )}

          {/* Full Name and Last Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombres *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombres completos"
              />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos *
              </label>
              <input
                type="text"
                name="last_names"
                value={formData.last_names}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_names ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Apellidos completos"
              />
              {errors.last_names && <p className="text-red-500 text-sm mt-1">{errors.last_names}</p>}
            </div>
          </div>

          {/* ID Number and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Identificación *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.id_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Cédula o documento"
                />
              </div>
              {errors.id_number && <p className="text-red-500 text-sm mt-1">{errors.id_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Birth Date and Birth Place */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Nacimiento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.birth_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.birth_date && <p className="text-red-500 text-sm mt-1">{errors.birth_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lugar de Nacimiento *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="birth_place"
                  value={formData.birth_place}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.birth_place ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ciudad, País"
                />
              </div>
              {errors.birth_place && <p className="text-red-500 text-sm mt-1">{errors.birth_place}</p>}
            </div>
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
                  {user ? 'Actualizar' : 'Crear'} Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;