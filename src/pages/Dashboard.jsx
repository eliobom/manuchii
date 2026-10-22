import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import Chat from '../components/Chat';
import UserModal from '../components/UserModal';
import TaskModal from '../components/TaskModal';
import ClassesManager from '../components/ClassesManager';
import { apiClient } from '../apiClient';
import {
  UserGrowthChart,
  ClassesDistributionChart,
  EngagementChart,
  RevenueChart,
} from '../components/Charts';
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  LayoutDashboard,
  CheckSquare,
  Video,
  FileText,
  MessageSquare,
  Search,
  Download,
  Menu,
  X,
} from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [webContent, setWebContent] = useState({});
  const [contentLoading, setContentLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalLoading, setTaskModalLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    liveSessions: 0,
    totalRevenue: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [appUsers, setAppUsers] = useState([]);
  const [appUsersLoading, setAppUsersLoading] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    profile_image_url: '',
    bio: '',
    specialty: '',
    experience_years: 0,
    certifications: [],
    is_public_profile: false
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch web content
  useEffect(() => {
    const fetchWebContent = async () => {
      try {
        const data = await apiClient.getWebContent();
        const contentMap = {};
        data.forEach(item => {
          contentMap[item.section] = item.content;
        });
        setWebContent(contentMap);
      } catch (error) {
        console.error('Error fetching web content:', error);
      }
    };

    fetchWebContent();
  }, []);

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const data = await apiClient.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const data = await apiClient.getUsers();
        setFetchedUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setFetchedUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    if (user?.role === 'admin' || user?.role === 'trainer') {
      fetchUsers();
    } else {
      setFetchedUsers([]);
      setUsersLoading(false);
    }
  }, [user]);

  // Fetch app users
  const fetchAppUsers = useCallback(async () => {
    setAppUsersLoading(true);
    try {
      console.log('🔍 [DEBUG] Dashboard - Fetching app users for user:', {
        id: user?.id,
        role: user?.role,
        username: user?.username
      });

      const data = await apiClient.getAppUsers();
      console.log('✅ [SUCCESS] App users fetched:', data?.length || 0);
      setAppUsers(data);
    } catch (error) {
      console.error('❌ [ERROR] Error fetching app users:', error);
      setAppUsers([]);
    } finally {
      setAppUsersLoading(false);
    }
  }, [user?.id, user?.role, user?.username]);

  useEffect(() => {
    if (user?.id) {
      fetchAppUsers();
    }
  }, [user?.id, fetchAppUsers]);

  // Fetch tasks when user is trainer
  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchTasks();
    }
  }, [user?.role]);

  // Load profile data for trainers
  useEffect(() => {
    if (user?.role === 'trainer') {
      setProfileData({
        profile_image_url: user.profile_image_url || '',
        bio: user.bio || '',
        specialty: user.specialty || '',
        experience_years: user.experience_years || 0,
        certifications: user.certifications || [],
        is_public_profile: user.is_public_profile || false
      });
    }
  }, [user]);

  // Save web content
  const saveWebContent = async (section, content) => {
    setContentLoading(true);
    try {
      await apiClient.updateWebContent(section, content);
      setWebContent(prev => ({ ...prev, [section]: content }));
      alert('Contenido guardado exitosamente');
    } catch (error) {
      console.error('Error saving web content:', error);
      alert('Error al guardar el contenido');
    } finally {
      setContentLoading(false);
    }
  };

  // Save trainer profile
  const saveProfile = async () => {
    setProfileLoading(true);
    try {
      await apiClient.updateUser(user.id, {
        profile_image_url: profileData.profile_image_url,
        bio: profileData.bio,
        specialty: profileData.specialty,
        experience_years: profileData.experience_years,
        certifications: profileData.certifications,
        is_public_profile: profileData.is_public_profile
      });

      alert('Perfil guardado exitosamente');
      // Note: In a real app, you'd update the user context/state
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Error al guardar el perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  // User modal functions
  const handleOpenUserModal = (user = null, defaultRole = 'app-user') => {
    console.log('Opening user modal with:', { user, defaultRole });
    setSelectedUser(user || { role: defaultRole });
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  // Task modal functions
  const handleOpenTaskModal = (task = null) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  // Fetch tasks
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      // Use different endpoint based on user role
      const data = user?.role === 'trainer'
        ? await apiClient.getTrainerTasks()
        : await apiClient.getTasks();
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleSaveUser = async (userData) => {
    setUserModalLoading(true);
    try {
      const isAppUser = selectedUser?.role === 'app-user' || userData.role === 'app-user';

      // Normalize payload to match DB schema
      const payload = { ...userData };

      // UI uses a temporary `password` field, but DB expects `password_hash`
      if (Object.prototype.hasOwnProperty.call(payload, 'password')) {
        const passwordNormalized = String(payload.password ?? '').trim();
        if (passwordNormalized) {
          payload.password_hash = passwordNormalized;
        }
        delete payload.password;
      }

      // `app-user` is a UI-only marker. DB uses `app_users` table and has no `role`.
      if (payload.role === 'app-user') {
        delete payload.role;
      }

      // `tareas` only exists on `app_users` (not on `users`)
      if (!isAppUser && Object.prototype.hasOwnProperty.call(payload, 'tareas')) {
        delete payload.tareas;
      }

      if (isAppUser) {
        // Handle app_users
        if (selectedUser && selectedUser.id) {
          // Update existing app user
          await apiClient.updateAppUser(selectedUser.id, payload);
        } else {
          // Create new app user
          await apiClient.createAppUser(payload);
        }
        // Refresh app users list
        const refreshedAppUsers = await apiClient.getAppUsers();
        setAppUsers(refreshedAppUsers);
      } else {
        // Handle users table (admins/trainers)
        if (selectedUser && selectedUser.id) {
          // Update existing user
          await apiClient.updateUser(selectedUser.id, payload);
        } else {
          // Create new user
          await apiClient.createUser(payload);
        }
        // Refresh users list
        const refreshedUsers = await apiClient.getUsers();
        setFetchedUsers(refreshedUsers);
      }

      alert(selectedUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
      handleCloseUserModal();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.message || 'Error al guardar usuario');
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleSaveTask = async (taskData) => {
    setTaskModalLoading(true);
    try {
      if (selectedTask && selectedTask.id) {
        // Update existing task
        await apiClient.updateTask(selectedTask.id, taskData);
      } else {
        // Create new task
        await apiClient.createTask(taskData);
      }

      // Refresh tasks list
      await fetchTasks();

      alert(selectedTask ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente');
      handleCloseTaskModal();
    } catch (error) {
      console.error('Error saving task:', error);
      alert(error.message || 'Error al guardar tarea');
    } finally {
      setTaskModalLoading(false);
    }
  };

  // Definir menú según rol
  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Administradores', icon: Users },
        { id: 'trainers', label: 'Entrenadores', icon: Users },
        { id: 'app-users', label: 'Usuarios App', icon: Users },
        { id: 'classes', label: 'Clases', icon: BookOpen },
        { id: 'content', label: 'Contenido Web', icon: FileText },
      ];
    } else {
      // Trainer menu - con clases, tareas y live
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'profile', label: 'Mi Perfil', icon: Users },
        { id: 'app-users', label: 'Mis Usuarios App', icon: Users },
        { id: 'classes', label: 'Clases', icon: BookOpen },
        { id: 'tasks', label: 'Tareas', icon: CheckSquare },
        { id: 'live', label: 'Clases en Vivo', icon: Video },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
      ];
    }
  };

  const menuItems = getMenuItems();

  // Export functions
  const exportToCSV = () => {
    const headers = ['Nombre Completo', 'Usuario', 'Email', 'Rol', 'ID', 'Fecha de Registro'];
    const csvData = filteredUsers.map(user => [
      `${user.full_name} ${user.last_names}`,
      user.username,
      user.email || '',
      user.role,
      user.id_number,
      new Date(user.created_at).toLocaleDateString('es-ES')
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    // For PDF export, we'll use a simple HTML-to-PDF approach
    // In a real app, you'd use jsPDF or similar library
    const printContent = `
      <html>
        <head>
          <title>Lista de Usuarios - Train with Morale</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .role-admin { background-color: #fef3c7; }
            .role-trainer { background-color: #dbeafe; }
            .role-user { background-color: #f0fdf4; }
          </style>
        </head>
        <body>
          <h1>Lista de Usuarios - Train with Morale</h1>
          <p>Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}</p>
          <p>Total de usuarios: ${filteredUsers.length}</p>
          <table>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>ID</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map(user => `
                <tr class="role-${user.role}">
                  <td>${user.full_name} ${user.last_names}</td>
                  <td>${user.username}</td>
                  <td>${user.email || ''}</td>
                  <td>${user.role}</td>
                  <td>${user.id_number}</td>
                  <td>${new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter users based on search and role
  const filteredUsers = (fetchedUsers || []).filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id_number?.includes(searchTerm);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        if (user?.role !== 'trainer') return null;
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Mi Perfil</h2>
              <p className="text-gray-600 mt-1">Gestiona tu información personal y perfil público</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-6 text-gray-900">Información del Perfil</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de Perfil
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      {profileData.profile_image_url ? (
                        <img
                          src={profileData.profile_image_url}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="url"
                        placeholder="URL de la imagen"
                        value={profileData.profile_image_url}
                        onChange={(e) => setProfileData(prev => ({ ...prev, profile_image_url: e.target.value }))}
                        className="text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ingresa la URL de tu imagen de perfil</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biografía
                  </label>
                  <textarea
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cuéntanos sobre ti, tu experiencia y especialidades..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Entrenamiento Funcional, Yoga, CrossFit"
                    value={profileData.specialty}
                    onChange={(e) => setProfileData(prev => ({ ...prev, specialty: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Años de Experiencia
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    value={profileData.experience_years}
                    onChange={(e) => setProfileData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificaciones
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lista tus certificaciones separadas por comas..."
                    value={profileData.certifications.join(', ')}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      certifications: e.target.value.split(',').map(cert => cert.trim()).filter(cert => cert)
                    }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="public-profile"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={profileData.is_public_profile}
                      onChange={(e) => setProfileData(prev => ({ ...prev, is_public_profile: e.target.checked }))}
                    />
                    <label htmlFor="public-profile" className="ml-2 block text-sm text-gray-900">
                      Mostrar mi perfil en el sitio web público
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Si activas esta opción, tu información aparecerá en la sección de entrenadores del sitio web
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveProfile}
                  disabled={profileLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-md transition-colors"
                >
                  {profileLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600 mt-1">Bienvenido, {user?.username || 'Admin'}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Usuarios de App"
                value={statsLoading ? "..." : (stats?.totalUsers ?? 0).toString()}
                change={0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Clases Subidas"
                value={statsLoading ? "..." : (stats?.totalClasses ?? 0).toString()}
                change={0}
                icon={BookOpen}
                color="green"
              />
              <StatCard
                title="Sesiones en Vivo"
                value={statsLoading ? "..." : (stats?.liveSessions ?? 0).toString()}
                change={0}
                icon={Activity}
                color="purple"
              />
              <StatCard
                title="Ingresos"
                value={statsLoading ? "..." : `${stats?.totalRevenue ?? 0}`}
                change={0}
                icon={TrendingUp}
                color="orange"
              />
            </div>

            {/* Charts - Placeholder for future implementation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Análisis de Usuarios"
                subtitle="Próximamente"
              >
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Gráficos de análisis próximamente</p>
                  </div>
                </div>
              </ChartCard>

              <ChartCard
                title="Estadísticas de Clases"
                subtitle="Próximamente"
              >
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Estadísticas de clases próximamente</p>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {user?.role === 'admin' ? 'Gestión de Usuarios' : 'Mis Usuarios'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {user?.role === 'admin'
                    ? 'Administra todos los usuarios del sistema'
                    : 'Gestiona los usuarios asignados a ti'
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {user?.role === 'admin' && (
                  <>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={exportToCSV}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        title="Exportar a CSV"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">CSV</span>
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        title="Exportar a PDF"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar usuarios
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, apellido, usuario, email o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por rol
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los roles</option>
                    <option value="admin">Administradores</option>
                    <option value="trainer">Entrenadores</option>
                    <option value="user">Usuarios</option>
                  </select>
                </div>
              </div>
              {(searchTerm || roleFilter !== 'all') && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <span>Resultados: {filteredUsers.length} de {fetchedUsers.length} usuarios</span>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre Completo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rol</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha de Registro</th>
                    {user?.role === 'admin' && (
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                    )}
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : fetchedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {u.full_name} {u.last_names}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.email || 'Sin email'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'trainer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin' : u.role === 'trainer' ? 'Entrenador' : 'Usuario'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(u.created_at).toLocaleDateString('es-ES')}
                        </td>
                        {user?.role === 'admin' && (
                          <td className="px-6 py-4 text-sm text-gray-600">{u.id_number}</td>
                        )}
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'trainers':
        if (user?.role !== 'admin') return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Gestión de Entrenadores</h2>
                <p className="text-gray-600 mt-1">Administra los entrenadores del sistema</p>
              </div>
              <button
                onClick={() => handleOpenUserModal(null, 'trainer')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Entrenador
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Lista de entrenadores desde la base de datos */}
              {fetchedUsers.filter(u => u.role === 'trainer').map(trainer => (
                <div key={trainer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{trainer.full_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trainer.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trainer.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{trainer.email || 'Sin especialidad'}</p>
                  <p className="text-gray-500 text-xs mb-4">Usuario: {trainer.username}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenUserModal(trainer)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {fetchedUsers.filter(u => u.role === 'trainer').length === 0 && (
                <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center col-span-full">
                  <div className="text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No hay entrenadores registrados</p>
                    <p className="text-gray-500 text-xs mt-1">Haz clic en "Crear Entrenador" para agregar uno</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'app-users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {user?.role === 'admin' ? 'Usuarios de la App' : 'Mis Usuarios de App'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {user?.role === 'admin'
                    ? 'Gestiona todos los usuarios que usan la aplicación móvil'
                    : 'Gestiona los usuarios asignados a ti'
                  }
                </p>
              </div>
              {user?.role !== 'admin' && (
                <button
                  onClick={() => handleOpenUserModal(null, 'app-user')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Crear Usuario App
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre Completo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha de Registro</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appUsersLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : appUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No hay usuarios de app registrados
                      </td>
                    </tr>
                  ) : (
                    appUsers.map((appUser) => (
                      <tr key={appUser.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {appUser.full_name} {appUser.last_names}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{appUser.email || 'Sin email'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              appUser.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {appUser.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(appUser.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          {user?.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenUserModal(appUser, 'app-user')}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Editar usuario"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-800 transition-colors" title="Eliminar usuario">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'tasks':
        if (user?.role !== 'trainer') return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Gestión de Tareas</h2>
                <p className="text-gray-600 mt-1">Asigna tareas a tus usuarios</p>
              </div>
              <button
                onClick={() => handleOpenTaskModal()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Tarea
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Título</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usuario</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha Límite</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasksLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Cargando tareas...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No hay tareas asignadas
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const userName = appUsers.find(u => u.id === task.user_id);
                      return (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {task.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {userName ? `${userName.full_name} ${userName.last_names}` : 'Usuario desconocido'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              task.type === 'exercise' ? 'bg-green-100 text-green-800' :
                              task.type === 'measurement' ? 'bg-blue-100 text-blue-800' :
                              task.type === 'habit' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {task.type === 'exercise' ? 'Ejercicio' :
                               task.type === 'measurement' ? 'Medición' :
                               task.type === 'habit' ? 'Hábito' : 'Meta'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status === 'completed' ? 'Completada' :
                               task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => handleOpenTaskModal(task)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Editar tarea"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'live':
        if (user?.role !== 'trainer') return null;
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Clases en Vivo</h2>
              <p className="text-gray-600 mt-1">Administra las sesiones en vivo</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Contenido de clases en vivo en desarrollo...</p>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Gestión de Contenido Web</h2>
              <p className="text-gray-600 mt-1">Edita el contenido del sitio web público</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hero Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Sección Hero</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal</label>
                    <input
                      type="text"
                      value={webContent.hero?.title || ''}
                      onChange={(e) => setWebContent(prev => ({
                        ...prev,
                        hero: { ...prev.hero, title: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingresa el título principal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                    <textarea
                      value={webContent.hero?.subtitle || ''}
                      onChange={(e) => setWebContent(prev => ({
                        ...prev,
                        hero: { ...prev.hero, subtitle: e.target.value }
                      }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingresa el subtítulo"
                    />
                  </div>
                  <button
                    onClick={() => saveWebContent('hero', webContent.hero || {})}
                    disabled={contentLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
                  >
                    {contentLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>

              {/* About Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Sección Sobre Nosotros</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Misión</label>
                    <textarea
                      value={webContent.about?.mission || ''}
                      onChange={(e) => setWebContent(prev => ({
                        ...prev,
                        about: { ...prev.about, mission: e.target.value }
                      }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingresa la misión"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visión</label>
                    <textarea
                      value={webContent.about?.vision || ''}
                      onChange={(e) => setWebContent(prev => ({
                        ...prev,
                        about: { ...prev.about, vision: e.target.value }
                      }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingresa la visión"
                    />
                  </div>
                  <button
                    onClick={() => saveWebContent('about', webContent.about || {})}
                    disabled={contentLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
                  >
                    {contentLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>

              {/* Trainers Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Entrenadores</h3>
                <div className="space-y-4">
                  {/* Available Trainers from Database */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Entrenadores Disponibles en la Base de Datos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {fetchedUsers.filter(u => u.role === 'trainer').map(trainer => (
                        <div key={trainer.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{trainer.full_name}</h5>
                              <p className="text-sm text-gray-600">{trainer.specialty || 'Sin especialidad'}</p>
                              <p className="text-xs text-gray-500">Usuario: {trainer.username}</p>
                            </div>
                            <button
                              onClick={() => {
                                const newTrainer = {
                                  name: trainer.full_name,
                                  specialty: trainer.specialty || 'Entrenamiento Personal',
                                  image: trainer.profile_image_url || 'https://via.placeholder.com/300x200/4c669f/white?text=Entrenador'
                                };
                                const newTrainers = [...(webContent.trainers?.list || []), newTrainer];
                                setWebContent(prev => ({
                                  ...prev,
                                  trainers: { ...prev.trainers, list: newTrainers }
                                }));
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      ))}
                      {fetchedUsers.filter(u => u.role === 'trainer').length === 0 && (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          No hay entrenadores registrados en el sistema
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Trainers in Web Content */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Entrenadores en el Contenido Web</h4>
                    {(webContent.trainers?.list || []).map((trainer, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={trainer.name || ''}
                            onChange={(e) => {
                              const newTrainers = [...(webContent.trainers?.list || [])];
                              newTrainers[index] = { ...newTrainers[index], name: e.target.value };
                              setWebContent(prev => ({
                                ...prev,
                                trainers: { ...prev.trainers, list: newTrainers }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                          <input
                            type="text"
                            value={trainer.specialty || ''}
                            onChange={(e) => {
                              const newTrainers = [...(webContent.trainers?.list || [])];
                              newTrainers[index] = { ...newTrainers[index], specialty: e.target.value };
                              setWebContent(prev => ({
                                ...prev,
                                trainers: { ...prev.trainers, list: newTrainers }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen URL</label>
                          <input
                            type="url"
                            value={trainer.image || ''}
                            onChange={(e) => {
                              const newTrainers = [...(webContent.trainers?.list || [])];
                              newTrainers[index] = { ...newTrainers[index], image: e.target.value };
                              setWebContent(prev => ({
                                ...prev,
                                trainers: { ...prev.trainers, list: newTrainers }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newTrainers = [...(webContent.trainers?.list || []), { name: '', specialty: '', image: '' }];
                      setWebContent(prev => ({
                        ...prev,
                        trainers: { ...prev.trainers, list: newTrainers }
                      }));
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Agregar Entrenador
                  </button>
                  <button
                    onClick={() => saveWebContent('trainers', webContent.trainers || { list: [] })}
                    disabled={contentLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
                  >
                    {contentLoading ? 'Guardando...' : 'Guardar Entrenadores'}
                  </button>
                 </div>
               </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Información de Contacto</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={webContent.contact?.email || ''}
                      onChange={(e) => setWebContent(prev => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingresa el email de contacto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={webContent.contact?.phone || ''}
                      onChange={(e) => setWebContent(prev => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingresa el teléfono de contacto"
                    />
                  </div>
                  <button
                    onClick={() => saveWebContent('contact', webContent.contact || {})}
                    disabled={contentLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
                  >
                    {contentLoading ? 'Guardando...' : 'Actualizar Contacto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Chat con Usuarios</h2>
              <p className="text-gray-600 mt-1">Comunícate directamente con tus usuarios</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Selecciona un usuario para iniciar una conversación</p>
            </div>
          </div>
        );

      case 'classes':
        return <ClassesManager />;

      default:
        return <div>Contenido de {activeTab}</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Train with Morale</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl">
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }}
              onLogout={onLogout}
              menuItems={menuItems}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
          menuItems={menuItems}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {renderContent()}
        </div>
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:shadow-xl z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Component */}
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        user={selectedUser}
        onSave={handleSaveUser}
        isLoading={userModalLoading}
        hideTareas={selectedUser?.role === 'trainer' || (user?.role === 'admin' && selectedUser?.role === 'trainer')}
        // Si se está creando/edita un entrenador, fijamos el rol y ocultamos el selector
        fixedRole={selectedUser?.role === 'trainer' ? 'trainer' : null}
        hideRole={selectedUser?.role === 'trainer'}
        // Para entrenadores y administradores, el email debe ser obligatorio
        requireEmail={selectedUser?.role === 'trainer' || user?.role === 'admin'}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={selectedTask}
        onSave={handleSaveTask}
        isLoading={taskModalLoading}
        appUsers={appUsers}
      />
    </div>
  );
};

export default Dashboard;