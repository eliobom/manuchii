import React, { useState, useEffect } from 'react';
import { LogIn, Mail, Lock, Shield, Users } from 'lucide-react';
import { apiClient } from '../apiClient';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');

  // Check for existing session on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    if (userData && token) {
      onLogin(userData);
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedRole) {
      setError('Por favor selecciona un rol (Administrador o Entrenador)');
      return;
    }
    
    if (username && password) {
      setIsLoading(true);
      try {
        const data = await apiClient.login({ username, password, role: selectedRole });

        // Use the role from login response or selected role
        const userRole = data.user.role || selectedRole;
        
        // Store user data with role
        const userData = { 
          username: data.user.username, 
          role: userRole, 
          id: data.user.id,
          email: data.user.email
        };
        localStorage.setItem('user', JSON.stringify(userData));
        onLogin(userData);
      } catch (err) {
        console.error('Error en login:', err);
        setError(err.message || 'Error de conexión. Verifica tus credenciales.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Train with Morale</h1>
            <p className="text-blue-100">Panel Administrativo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Usuario
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Selecciona tu rol
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Admin Button */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedRole === 'admin'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-400'
                  }`}
                >
                  <Shield className={`w-6 h-6 ${selectedRole === 'admin' ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-semibold ${selectedRole === 'admin' ? 'text-blue-600' : 'text-gray-700'}`}>
                    Administrador
                  </span>
                </button>

                {/* Trainer Button */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('trainer')}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedRole === 'trainer'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 bg-white hover:border-green-400'
                  }`}
                >
                  <Users className={`w-6 h-6 ${selectedRole === 'trainer' ? 'text-green-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-semibold ${selectedRole === 'trainer' ? 'text-green-600' : 'text-gray-700'}`}>
                    Entrenador
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-8 text-blue-100">
          <p className="text-sm">© 2024 Train with Morale. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;