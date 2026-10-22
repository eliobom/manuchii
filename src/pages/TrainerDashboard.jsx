import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import Chat from '../components/Chat';
import UserModal from '../components/UserModal';
import TaskModal from '../components/TaskModal';
import ClassAttachmentSection from '../components/ClassAttachmentSection';
import Toast from '../components/Toast';
import TaskCard from '../components/TaskCard';
import LoadingSkeleton, { UserTaskSkeleton } from '../components/LoadingSkeleton';
import { apiClient } from '../apiClient';
import {
  Users,
  Video,
  Upload,
  MessageSquare,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Menu,
  X,
  LogOut,
  BarChart3,
  Clock,
  CheckSquare,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  Image,
} from 'lucide-react';

const normalizeSupabasePublicUrl = (url) => {
  const raw = String(url || '');
  if (!raw) return raw;
  if (raw.includes('/storage/v1/object/public/')) return raw;
  return raw.replace('/storage/v1/object/', '/storage/v1/object/public/');
};

const TrainerDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [taskDrafts, setTaskDrafts] = useState({});
  const [taskSavingId, setTaskSavingId] = useState(null);

  const [trainerTasks, setTrainerTasks] = useState([]);
  const [trainerTasksLoading, setTrainerTasksLoading] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  const [measurements, setMeasurements] = useState({});
  const [measurementsLoading, setMeasurementsLoading] = useState({});
  const [showMeasurements, setShowMeasurements] = useState(new Set());
  const [showProgressChart, setShowProgressChart] = useState(new Set());
  const [showTemplates, setShowTemplates] = useState(false);

  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'pending', 'completed', 'active', 'due_soon', 'overdue'
  const [taskSort, setTaskSort] = useState('due_date'); // 'due_date', 'priority', 'created_at', 'title'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' or category name

  const taskCategories = [
    { id: 'fitness', name: 'Fitness', color: 'bg-green-100 text-green-800', icon: '💪' },
    { id: 'nutrition', name: 'Nutrición', color: 'bg-orange-100 text-orange-800', icon: '🥗' },
    { id: 'rest', name: 'Descanso', color: 'bg-blue-100 text-blue-800', icon: '😴' },
    { id: 'motivation', name: 'Motivación', color: 'bg-purple-100 text-purple-800', icon: '🎯' },
    { id: 'measurement', name: 'Medición', color: 'bg-pink-100 text-pink-800', icon: '📏' },
    { id: 'general', name: 'General', color: 'bg-gray-100 text-gray-800', icon: '📝' }
  ];

  const taskTemplates = [
    {
      id: 'drink_water',
      title: 'Beber 2L de agua al día',
      description: 'Mantén una hidratación adecuada bebiendo al menos 2 litros de agua diariamente. Esto es crucial para el rendimiento físico y la recuperación.',
      category: 'nutrition',
      priority: 'high',
      type: 'habit'
    },
    {
      id: 'cardio_session',
      title: 'Sesión de cardio de 30 minutos',
      description: 'Realiza una sesión de ejercicio cardiovascular durante 30 minutos. Puede ser correr, nadar, ciclismo o cualquier actividad que eleve tu ritmo cardíaco.',
      category: 'fitness',
      priority: 'high',
      type: 'exercise'
    },
    {
      id: 'strength_training',
      title: 'Entrenamiento de fuerza',
      description: 'Completa una rutina de entrenamiento de fuerza enfocándote en ejercicios compuestos como sentadillas, press de banca y dominadas.',
      category: 'fitness',
      priority: 'medium',
      type: 'exercise'
    },
    {
      id: 'healthy_meal',
      title: 'Preparar comida saludable',
      description: 'Prepara una comida balanceada con proteínas, carbohidratos complejos, grasas saludables y abundantes verduras.',
      category: 'nutrition',
      priority: 'medium',
      type: 'habit'
    },
    {
      id: 'body_measurement',
      title: 'Tomar medidas corporales',
      description: 'Registra tus medidas corporales: peso, perímetros de brazo, cintura, cadera y muslos. Esto te ayudará a seguir tu progreso.',
      category: 'measurement',
      priority: 'medium',
      type: 'measurement'
    },
    {
      id: 'rest_day',
      title: 'Día de descanso activo',
      description: 'Toma un día de descanso del entrenamiento intenso. Realiza actividades ligeras como caminar, yoga suave o estiramientos.',
      category: 'rest',
      priority: 'low',
      type: 'habit'
    },
    {
      id: 'motivation_check',
      title: 'Revisar metas y motivación',
      description: 'Tómate tiempo para reflexionar sobre tus metas, celebrar logros y mantener alta tu motivación.',
      category: 'motivation',
      priority: 'medium',
      type: 'goal'
    },
    {
      id: 'sleep_8_hours',
      title: 'Dormir 8 horas',
      description: 'Asegúrate de dormir al menos 8 horas por noche. El sueño adecuado es fundamental para la recuperación y el rendimiento.',
      category: 'rest',
      priority: 'high',
      type: 'habit'
    }
  ];

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const openCreateClassModal = () => {
    setSelectedClass(null);
    setClassForm({
      title: '',
      description: '',
      duration: 30,
      level: 'Intermedio',
      category: 'General',
      video_url: '',
      thumbnail_url: '',
    });
    setIsClassModalOpen(true);
  };

  const openEditClassModal = (c) => {
    setSelectedClass(c);
    setClassForm({
      title: c?.title || '',
      description: c?.description || '',
      duration: Number.isFinite(Number(c?.duration)) ? Number(c.duration) : 30,
      level: c?.level || 'Intermedio',
      category: c?.category || 'General',
      video_url: normalizeSupabasePublicUrl(c?.video_url || ''),
      thumbnail_url: normalizeSupabasePublicUrl(c?.thumbnail_url || ''),
    });
    setIsClassModalOpen(true);
  };

  const closeClassModal = () => {
    setIsClassModalOpen(false);
    setSelectedClass(null);
  };

  const handleUploadClassFileToUrlField = async (field, accept) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Sin restricción de tamaño

      setClassModalLoading(true);
      try {
        const result = await apiClient.uploadFile(file);
        setClassForm(prev => ({ ...prev, [field]: result.url }));
        showToast('Archivo subido correctamente', 'success');
      } catch (error) {
        console.error('Error uploading file:', error);
        showToast(error?.message || 'Error al subir archivo', 'error');
      } finally {
        setClassModalLoading(false);
      }
    };
    input.click();
  };

  const handleUploadClassAttachmentQuick = async (accept) => {
    if (!selectedClass?.id) {
      showToast('Guarda la clase primero para subir adjuntos', 'warning');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Sin restricción de tamaño

      setClassModalLoading(true);
      try {
        await apiClient.uploadClassAttachment(selectedClass.id, file);
        showToast('Adjunto subido correctamente', 'success');
      } catch (error) {
        console.error('Error uploading class attachment:', error);
        showToast(error?.message || 'Error al subir adjunto', 'error');
      } finally {
        setClassModalLoading(false);
      }
    };
    input.click();
  };

  const handleSaveClass = async () => {
    if (!String(classForm.title || '').trim()) {
      showToast('Título es requerido', 'warning');
      return;
    }

    setClassModalLoading(true);
    try {
      const payload = {
        title: String(classForm.title || '').trim(),
        description: classForm.description || null,
        duration: Number(classForm.duration) || null,
        level: classForm.level || null,
        category: classForm.category || null,
        video_url: classForm.video_url || null,
        thumbnail_url: classForm.thumbnail_url || null,
        instructor_id: user?.id,
      };

      if (selectedClass?.id) {
        await apiClient.updateClass(selectedClass.id, payload);
        showToast('Clase actualizada', 'success');
      } else {
        await apiClient.createClass(payload);
        showToast('Clase creada', 'success');
      }

      await fetchTrainerClasses();
      closeClassModal();
    } catch (error) {
      console.error('Error saving class:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setClassModalLoading(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('¿Eliminar esta clase?')) return;
    try {
      await apiClient.deleteClass(classId);
      showToast('Clase eliminada', 'success');
      await fetchTrainerClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    }
  };

  const hideToast = () => {
    setToast(null);
  };

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalLoading, setTaskModalLoading] = useState(false);

  const [liveClasses, setLiveClasses] = useState([]);
  const [liveClassesLoading, setLiveClassesLoading] = useState(false);

  const [messagesCount, setMessagesCount] = useState(0);

  const [trainerClasses, setTrainerClasses] = useState([]);
  const [trainerClassesLoading, setTrainerClassesLoading] = useState(false);
  const [classAssignments, setClassAssignments] = useState({});
  const [classAssignLoading, setClassAssignLoading] = useState({});

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classModalLoading, setClassModalLoading] = useState(false);
  const [classForm, setClassForm] = useState({
    title: '',
    description: '',
    duration: 30,
    level: 'Intermedio',
    category: 'General',
    video_url: '',
    thumbnail_url: '',
  });

  const [isLiveClassModalOpen, setIsLiveClassModalOpen] = useState(false);
  const [liveClassFormLoading, setLiveClassFormLoading] = useState(false);
  const [liveClassFormErrors, setLiveClassFormErrors] = useState({});
  const [liveClassForm, setLiveClassForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    meeting_url: '',
    status: 'scheduled',
  });

  const [profileData, setProfileData] = useState({
    profile_image_url: '',
    bio: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch users created by this trainer
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const data = await apiClient.getTrainerAppUsers(user?.id);
        setFetchedUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setFetchedUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    if (user?.role === 'trainer') {
      fetchUsers();
    }
  }, [user]);

  const fetchLiveClasses = async () => {
    setLiveClassesLoading(true);
    try {
      const data = await apiClient.getTrainerLiveClasses(user?.id);
      setLiveClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching live classes:', error);
      setLiveClasses([]);
    } finally {
      setLiveClassesLoading(false);
    }
  };

  const buildTrainerTasksView = (tasks, users) => {
    const usersById = new Map((Array.isArray(users) ? users : []).filter(Boolean).map(u => [u.id, u]));
    const grouped = new Map();

    (Array.isArray(tasks) ? tasks : []).filter(Boolean).forEach(t => {
      const userId = t.user_id;
      if (!userId) return;
      if (!grouped.has(userId)) grouped.set(userId, []);
      grouped.get(userId).push(t);
    });

    return Array.from(grouped.entries())
      .map(([userId, userTasks]) => {
        const u = usersById.get(userId);
        if (!u) return null;

        const total = userTasks.length;
        const completed = userTasks.filter(t => t.status === 'completed').length;
        const completionPercentage = total ? Math.round((completed / total) * 100) : 0;

        return {
          user: {
            id: u.id,
            name: [u.full_name, u.last_names].filter(Boolean).join(' ').trim() || u.username,
            email: u.email || '',
          },
          tasks: userTasks,
          stats: { total, completed, completionPercentage },
        };
      })
      .filter(Boolean);
  };

  const fetchTrainerTasks = async (opts = {}) => {
    const { usersOverride } = opts;
    setTrainerTasksLoading(true);
    try {
      const data = await apiClient.getTrainerTasks();
      const view = buildTrainerTasksView(data, usersOverride ?? fetchedUsers);
      setTrainerTasks(view);
    } catch (error) {
      console.error('Error fetching trainer tasks:', error);
      setTrainerTasks([]);
    } finally {
      setTrainerTasksLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchLiveClasses();
      fetchTrainerTasks();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchTrainerTasks({ usersOverride: fetchedUsers });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedUsers]);

  useEffect(() => {
    const fetchMessagesCount = async () => {
      try {
        const data = await apiClient.getMessages(user?.id);
        setMessagesCount(Array.isArray(data) ? data.length : 0);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessagesCount(0);
      }
    };

    if (user?.id && user?.role === 'trainer') {
      fetchMessagesCount();
    }
  }, [user?.id, user?.role]);

  const fetchTrainerClasses = async () => {
    setTrainerClassesLoading(true);
    try {
      const data = await apiClient.getTrainerClasses(user?.id);
      setTrainerClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setTrainerClasses([]);
    } finally {
      setTrainerClassesLoading(false);
    }
  };

  const fetchClassAssignments = async (users) => {
    try {
      const entries = await Promise.all(
        (Array.isArray(users) ? users : [])
          .filter(u => u?.id)
          .map(async (u) => {
            const rows = await apiClient.getAppUserClassAssignments(u.id);
            const ids = new Set((Array.isArray(rows) ? rows : []).map(r => r.class_id).filter(Boolean));
            return [u.id, ids];
          })
      );

      const next = {};
      entries.forEach(([userId, ids]) => {
        next[userId] = ids;
      });
      setClassAssignments(next);
    } catch (error) {
      console.error('Error fetching class assignments:', error);
      if (String(error?.message || '').toLowerCase().includes('app_user_classes')) {
        showToast('Falta crear la tabla app_user_classes en Supabase (SQL pendiente)', 'warning');
      }
      setClassAssignments({});
    }
  };

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchTrainerClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user?.role === 'trainer') {
      fetchClassAssignments(fetchedUsers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedUsers]);

  const toggleAssignClass = async (appUserId, classId) => {
    const key = `${appUserId}:${classId}`;
    setClassAssignLoading(prev => ({ ...prev, [key]: true }));
    try {
      const assigned = classAssignments?.[appUserId]?.has(classId);
      if (assigned) {
        await apiClient.unassignClassFromAppUser(appUserId, classId);
      } else {
        await apiClient.assignClassToAppUser(appUserId, classId);
      }

      setClassAssignments(prev => {
        const next = { ...(prev || {}) };
        const setForUser = new Set(next[appUserId] || []);
        if (assigned) setForUser.delete(classId);
        else setForUser.add(classId);
        next[appUserId] = setForUser;
        return next;
      });
    } catch (error) {
      console.error('Error assigning class:', error);
      if (String(error?.message || '').toLowerCase().includes('app_user_classes')) {
        showToast('Falta crear la tabla app_user_classes en Supabase (SQL pendiente)', 'warning');
      } else {
      showToast(error?.message || 'Error de conexión', 'error');
      }
    } finally {
      setClassAssignLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const openCreateLiveClassModal = () => {
    setLiveClassForm({
      title: '',
      description: '',
      scheduled_at: '',
      meeting_url: '',
      status: 'scheduled',
    });
    setLiveClassFormErrors({});
    setIsLiveClassModalOpen(true);
  };

  const closeCreateLiveClassModal = () => {
    if (liveClassFormLoading) return;
    setIsLiveClassModalOpen(false);
    setLiveClassFormErrors({});
  };

  const handleLiveClassFormChange = (e) => {
    const { name, value } = e.target;
    setLiveClassForm(prev => ({ ...prev, [name]: value }));
    if (liveClassFormErrors[name]) {
      setLiveClassFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLiveClassForm = () => {
    const next = {};
    if (!liveClassForm.title.trim()) next.title = 'Título es requerido';
    if (!liveClassForm.meeting_url.trim()) next.meeting_url = 'Link es requerido';
    if (!liveClassForm.scheduled_at) next.scheduled_at = 'Fecha y hora es requerida';
    setLiveClassFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitCreateLiveClass = async (e) => {
    e.preventDefault();
    if (!validateLiveClassForm()) return;

    setLiveClassFormLoading(true);
    try {
      await apiClient.createLiveClass({
        title: liveClassForm.title.trim(),
        description: (liveClassForm.description || '').trim(),
        meeting_url: liveClassForm.meeting_url.trim(),
        scheduled_at: new Date(liveClassForm.scheduled_at).toISOString(),
        status: liveClassForm.status || 'scheduled',
        trainer_id: user?.id,
      });

      await fetchLiveClasses();
      showToast('Clase en vivo creada exitosamente', 'success');
      closeCreateLiveClassModal();
    } catch (error) {
      console.error('Error creating live class:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setLiveClassFormLoading(false);
    }
  };

  const handleEditLiveClassLink = async (liveClass) => {
    const meeting_url = window.prompt('Nuevo link de Zoom/Meet (meeting_url):', liveClass?.meeting_url || '');
    if (!meeting_url || !meeting_url.trim()) return;

    try {
      if (liveClass?.id) {
        await apiClient.updateLiveClass(liveClass.id, {
          meeting_url: meeting_url.trim(),
        });
      } else {
        await apiClient.createLiveClass({
          title: (liveClass?.title || 'Clase en Vivo').trim(),
          description: liveClass?.description || '',
          meeting_url: meeting_url.trim(),
          scheduled_at: liveClass?.scheduled_at || new Date().toISOString(),
          status: liveClass?.status || 'scheduled',
          trainer_id: user?.id,
        });
      }

      await fetchLiveClasses();
      showToast('Clase en vivo actualizada exitosamente', 'success');
    } catch (error) {
      console.error('Error updating live class:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    }
  };

  const handleOpenMeetingLink = (meetingUrl) => {
    if (!meetingUrl) {
      showToast('Esta clase no tiene link', 'warning');
      return;
    }
    try {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer');
    } catch {
      showToast('No se pudo abrir el link', 'error');
    }
  };

  useEffect(() => {
    if (user?.role === 'trainer') {
      setProfileData({
        profile_image_url: user.profile_image_url || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const { value } = e.target;
    setProfileData(prev => ({ ...prev, profile_image_url: value }));
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      await apiClient.updateUser(user?.id, {
        profile_image_url: profileData.profile_image_url,
        bio: profileData.bio,
      });
      showToast('Perfil guardado exitosamente', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // User modal functions
  const handleOpenUserModal = (userItem = null) => {
    setSelectedUser(userItem || { role: 'user' });
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (userData) => {
    setUserModalLoading(true);
    try {
      const payload = {
        username: userData.username,
        full_name: userData.full_name,
        last_names: userData.last_names,
        id_number: userData.id_number,
        birth_date: userData.birth_date,
        birth_place: userData.birth_place,
        email: userData.email,
        phone: userData.phone,
      };

      const passwordNormalized = String(userData.password ?? '').trim();
      if (passwordNormalized) {
        payload.password_hash = passwordNormalized;
      }

      // Ensure this app user is tied to the trainer
      if (!selectedUser?.id) {
        payload.trainer_id = user?.id;
      }

      if (selectedUser?.id) {
        await apiClient.updateAppUser(selectedUser.id, payload);
      } else {
        await apiClient.createAppUser(payload);
      }

      const refreshedUsers = await apiClient.getTrainerAppUsers(user?.id);
      setFetchedUsers(Array.isArray(refreshedUsers) ? refreshedUsers : []);

      showToast(selectedUser?.id ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente', 'success');
      handleCloseUserModal();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await apiClient.deleteAppUser(userId);
        setFetchedUsers(fetchedUsers.filter(u => u.id !== userId));
        showToast('Usuario eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        showToast(error?.message || 'Error de conexión', 'error');
      }
    }
  };

  // Filter users by search
  const filteredUsers = fetchedUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveUserTasks = async (appUserId) => {
    const raw = taskDrafts[appUserId] ?? '';
    const tareasArray = String(raw)
      .split(/\r?\n/)
      .map(t => t.trim())
      .filter(Boolean);

    setTaskSavingId(appUserId);
    try {
      await apiClient.updateAppUser(appUserId, { tareas: tareasArray });

      const refreshedUsers = await apiClient.getTrainerAppUsers(user?.id);
      setFetchedUsers(Array.isArray(refreshedUsers) ? refreshedUsers : []);

      showToast('Tareas guardadas exitosamente', 'success');
    } catch (error) {
      console.error('Error saving tasks:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setTaskSavingId(null);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      await apiClient.updateTask(taskId, {
        status: currentStatus === 'completed' ? 'pending' : 'completed',
        completed_at: currentStatus === 'completed' ? null : new Date().toISOString(),
      });
      await fetchTrainerTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    }
  };

  const handleOpenTaskModal = (task = null, userId = null) => {
    setSelectedTask(task ? { ...task, user_id: userId || task.user_id } : { user_id: userId });
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = async (taskData) => {
    setTaskModalLoading(true);
    try {
      const payload = { ...taskData };
      // Remove UI-only fields that are not in `tasks`
      if (Object.prototype.hasOwnProperty.call(payload, 'category')) {
        delete payload.category;
      }

      payload.trainer_id = payload.trainer_id || user?.id;
      payload.assigned_at = payload.assigned_at || new Date().toISOString();

      if (selectedTask?.id) {
        await apiClient.updateTask(selectedTask.id, payload);
      } else {
        await apiClient.createTask(payload);
      }

      await fetchTrainerTasks();
      showToast(selectedTask?.id ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente', 'success');
      handleCloseTaskModal();
    } catch (error) {
      console.error('Error saving task:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setTaskModalLoading(false);
    }
  };

  const toggleUserExpansion = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const toggleTaskSelection = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const selectAllTasks = (tasks) => {
    const allTaskIds = new Set(tasks.map(task => task.id));
    setSelectedTasks(allTaskIds);
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  const bulkMarkComplete = async () => {
    if (selectedTasks.size === 0) return;

    try {
      const promises = Array.from(selectedTasks).map(taskId =>
        apiClient.updateTask(taskId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
      );

      await Promise.all(promises);
      await fetchTrainerTasks();
      setSelectedTasks(new Set());
      showToast(`${selectedTasks.size} tareas marcadas como completadas`, 'success');
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      showToast(error?.message || 'Error al actualizar tareas', 'error');
    }
  };

  const bulkMarkPending = async () => {
    if (selectedTasks.size === 0) return;

    try {
      const promises = Array.from(selectedTasks).map(taskId =>
        apiClient.updateTask(taskId, {
          status: 'pending',
          completed_at: null,
        })
      );

      await Promise.all(promises);
      await fetchTrainerTasks();
      setSelectedTasks(new Set());
      showToast(`${selectedTasks.size} tareas marcadas como pendientes`, 'success');
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      showToast(error?.message || 'Error al actualizar tareas', 'error');
    }
  };

  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      let aValue, bValue;

      switch (taskSort) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          bValue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority?.toLowerCase()] || 0;
          bValue = priorityOrder[b.priority?.toLowerCase()] || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const filterAndSortTasks = (tasks) => {
      // First filter by status
      let filteredTasks = tasks;
      if (taskFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.status === 'completed');
      } else if (taskFilter === 'pending') {
        filteredTasks = tasks.filter(task => task.status === 'pending');
      } else if (taskFilter === 'active') {
        // Active: pending tasks that are not overdue
        filteredTasks = tasks.filter(task => {
          if (task.status !== 'pending') return false;
          if (!task.due_date) return true; // No due date = active

          const dueDate = new Date(task.due_date);
          const now = new Date();
          return dueDate >= now; // Not overdue
        });
      } else if (taskFilter === 'due_soon') {
        // Due soon: pending tasks due within 3 days
        filteredTasks = tasks.filter(task => {
          if (task.status !== 'pending' || !task.due_date) return false;

          const dueDate = new Date(task.due_date);
          const now = new Date();
          const timeDiff = dueDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return daysDiff >= 0 && daysDiff <= 3;
        });
      } else if (taskFilter === 'overdue') {
        // Overdue: pending tasks past due date
        filteredTasks = tasks.filter(task => {
          if (task.status !== 'pending' || !task.due_date) return false;

          const dueDate = new Date(task.due_date);
          const now = new Date();
          return dueDate < now;
        });
      }

      // Then filter by category
      if (selectedCategory !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === selectedCategory);
      }

      // Then filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredTasks = filteredTasks.filter(task =>
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.priority?.toLowerCase().includes(query) ||
          task.category?.toLowerCase().includes(query)
        );
      }

      // Then sort
      return sortTasks(filteredTasks);
    };

  const toggleMeasurementsVisibility = (userId) => {
    const newShowMeasurements = new Set(showMeasurements);
    if (newShowMeasurements.has(userId)) {
      newShowMeasurements.delete(userId);
    } else {
      newShowMeasurements.add(userId);
      fetchUserMeasurements(userId);
    }
    setShowMeasurements(newShowMeasurements);
  };

  const toggleProgressChartVisibility = (userId) => {
    const newShowProgressChart = new Set(showProgressChart);
    if (newShowProgressChart.has(userId)) {
      newShowProgressChart.delete(userId);
    } else {
      newShowProgressChart.add(userId);
    }
    setShowProgressChart(newShowProgressChart);
  };

  const createTaskFromTemplate = async (userId, templateId) => {
    const template = taskTemplates.find(t => t.id === templateId);
    if (!template) return;

    const taskData = {
      user_id: userId,
      title: template.title,
      description: template.description,
      type: template.type,
      priority: template.priority,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      status: 'pending',
      assigned_at: new Date().toISOString(),
    };

    setTaskModalLoading(true);
    try {
      await apiClient.createTask({
        ...taskData,
        trainer_id: user?.id,
      });
      await fetchTrainerTasks();
      showToast(`Tarea "${template.title}" creada exitosamente`, 'success');
    } catch (error) {
      console.error('Error creating task from template:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setTaskModalLoading(false);
    }
  };

  const fetchUserMeasurements = async (userId) => {
    setMeasurementsLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const data = await apiClient.getBodyMeasurementsByUser(userId);
      setMeasurements(prev => ({ ...prev, [userId]: Array.isArray(data) ? data : [] }));
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setMeasurementsLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSaveMeasurements = async (userId) => {
    const userMeasurements = measurements[userId] || {};
    if (!userMeasurements.legPerimeter || !userMeasurements.upperBodyPerimeter || !userMeasurements.armPerimeter) {
      showToast('Por favor completa todos los campos de medición', 'warning');
      return;
    }

    setMeasurementsLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const measurementData = {
        user_id: userId,
        thigh_perimeter: parseFloat(userMeasurements.legPerimeter),
        chest_perimeter: parseFloat(userMeasurements.upperBodyPerimeter),
        bicep_perimeter: parseFloat(userMeasurements.armPerimeter),
        measured_at: new Date().toISOString(),
      };

      await apiClient.createBodyMeasurement(measurementData);
      showToast('Medidas guardadas correctamente', 'success');
      setMeasurements(prev => ({
        ...prev,
        [userId]: {
          legPerimeter: '',
          upperBodyPerimeter: '',
          armPerimeter: '',
        }
      }));
      fetchUserMeasurements(userId);
    } catch (error) {
      console.error('Error saving measurements:', error);
      showToast(error?.message || 'Error de conexión', 'error');
    } finally {
      setMeasurementsLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Menu items for trainer
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Mis Usuarios', icon: Users },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
    { id: 'classes', label: 'Clases', icon: BookOpen },
    { id: 'live-classes', label: 'Clases en Vivo', icon: Video },
    { id: 'profile', label: 'Perfil', icon: UserIcon },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        menuItems={menuItems}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel del Entrenador</h1>
            <p className="text-sm text-gray-600">Bienvenido, {user?.username}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Mis Usuarios</p>
                      <p className="text-3xl font-bold text-gray-900">{fetchedUsers.length}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Clases en Vivo</p>
                      <p className="text-3xl font-bold text-gray-900">{liveClasses.length}</p>
                    </div>
                    <Video className="w-12 h-12 text-green-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Mensajes</p>
                      <p className="text-3xl font-bold text-gray-900">{messagesCount}</p>
                    </div>
                    <MessageSquare className="w-12 h-12 text-purple-500 opacity-20" />
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {bulkMode && selectedTasks.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedTasks.size} tarea{selectedTasks.size !== 1 ? 's' : ''} seleccionada{selectedTasks.size !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={bulkMarkComplete}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Marcar Completadas
                      </button>
                      <button
                        onClick={bulkMarkPending}
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        <Clock className="w-4 h-4" />
                        Marcar Pendientes
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                      >
                        Limpiar Selección
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Task Templates */}
              {showTemplates && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-indigo-900">Plantillas de Tareas</h3>
                    <button
                      onClick={() => setShowTemplates(false)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {taskTemplates.map(template => {
                      const categoryInfo = taskCategories.find(cat => cat.id === template.category);
                      return (
                        <div key={template.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-lg">{categoryInfo?.icon}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo?.color}`}>
                              {categoryInfo?.name}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2 text-sm">{template.title}</h4>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              template.priority === 'high' ? 'bg-red-100 text-red-800' :
                              template.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {template.priority === 'high' ? 'Alta' : template.priority === 'medium' ? 'Media' : 'Baja'}
                            </span>
                            <button
                              onClick={() => {
                                // For now, create for first user. In a real app, you'd select a user
                                if (fetchedUsers.length > 0) {
                                  createTaskFromTemplate(template.id, fetchedUsers[0].id);
                                }
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              Usar Plantilla
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Users className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="font-semibold text-gray-900">Gestionar Usuarios</p>
                    <p className="text-sm text-gray-600">Ver y editar tus usuarios</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('live-classes')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Video className="w-6 h-6 text-green-600 mb-2" />
                    <p className="font-semibold text-gray-900">Clases en Vivo</p>
                    <p className="text-sm text-gray-600">Crear y gestionar clases</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('classes')}
                    className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <BookOpen className="w-6 h-6 text-indigo-600 mb-2" />
                    <p className="font-semibold text-gray-900">Clases</p>
                    <p className="text-sm text-gray-600">Asignar clases a usuarios</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {isClassModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-indigo-600">
                  <h2 className="text-lg font-semibold text-white">{selectedClass ? 'Editar Clase' : 'Nueva Clase'}</h2>
                  <button onClick={closeClassModal} className="text-white hover:text-indigo-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                    <input
                      type="text"
                      value={classForm.title}
                      onChange={(e) => setClassForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ej: Rutina de Fuerza"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={classForm.description}
                      onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="¿En qué consiste esta clase?"
                    />
                  </div>

                  {/* Nivel y Categoría */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                      <select
                        value={classForm.level}
                        onChange={(e) => setClassForm(prev => ({ ...prev, level: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Principiante">Principiante</option>
                        <option value="Intermedio">Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={classForm.duration}
                        onChange={(e) => setClassForm(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                    <div className="flex flex-wrap gap-2">
                      {['Cardio', 'Fuerza', 'Flexibilidad', 'Yoga', 'HIIT', ' funcional'].map((cat) => {
                        const selected = classForm.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setClassForm(prev => ({ ...prev, category: selected ? '' : cat }))}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              selected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Botones de subir archivos */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Multimedia</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUploadClassFileToUrlField('video_url', 'video/*')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        disabled={classModalLoading}
                      >
                        <Video className="w-4 h-4" />
                        Video
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUploadClassFileToUrlField('thumbnail_url', 'image/*')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        disabled={classModalLoading}
                      >
                        <Image className="w-4 h-4" />
                        Imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUploadClassAttachmentQuick('application/pdf,.pdf')}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        disabled={classModalLoading}
                        title={!selectedClass?.id ? 'Guarda la clase primero' : undefined}
                      >
                        <Upload className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                    {/* Mostrar URLs si existen */}
                    {(classForm.video_url || classForm.thumbnail_url) && (
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        {classForm.video_url && <div className="truncate">✓ Video asignado</div>}
                        {classForm.thumbnail_url && <div className="truncate">✓ Imagen asignada</div>}
                      </div>
                    )}
                  </div>

                  {/* Adjuntos (solo si ya se guardó la clase) */}
                  {selectedClass?.id && (
                    <div className="mt-2">
                      <ClassAttachmentSection classId={selectedClass.id} isEditing={true} />
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeClassModal}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={classModalLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveClass}
                      disabled={classModalLoading}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {classModalLoading ? 'Guardando...' : selectedClass ? 'Actualizar' : 'Crear Clase'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Clases</h2>
                <button
                  onClick={openCreateClassModal}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Crear Clase
                </button>
              </div>

              {trainerClassesLoading ? (
                <div className="p-8 text-center text-gray-600">Cargando clases...</div>
              ) : trainerClasses.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600 mb-4">No hay clases creadas aún</p>
                  <button
                    onClick={openCreateClassModal}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Crear tu primera clase
                  </button>
                </div>
              ) : (
                <>
                  {/* Vista de clases como tarjetas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trainerClasses.map((c) => (
                      <div key={c.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 truncate flex-1" title={c.title}>
                            {c.title}
                          </h3>
                          <div className="flex gap-1 ml-2">
                            <button
                              type="button"
                              onClick={() => openEditClassModal(c)}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClass(c.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {c.category && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              {c.category}
                            </span>
                          )}
                          {c.level && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {c.level}
                            </span>
                          )}
                          {c.duration && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              {c.duration} min
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            {fetchedUsers.length} usuario(s) asignado(s)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {isLiveClassModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Crear Clase en Vivo</h2>
                  <button
                    onClick={closeCreateLiveClassModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={liveClassFormLoading}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={submitCreateLiveClass} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                    <input
                      type="text"
                      name="title"
                      value={liveClassForm.title}
                      onChange={handleLiveClassFormChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        liveClassFormErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Yoga Relajante"
                    />
                    {liveClassFormErrors.title && <p className="text-red-500 text-sm mt-1">{liveClassFormErrors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                    <textarea
                      name="description"
                      value={liveClassForm.description}
                      onChange={handleLiveClassFormChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe la clase (opcional)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y hora *</label>
                      <input
                        type="datetime-local"
                        name="scheduled_at"
                        value={liveClassForm.scheduled_at}
                        onChange={handleLiveClassFormChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          liveClassFormErrors.scheduled_at ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {liveClassFormErrors.scheduled_at && <p className="text-red-500 text-sm mt-1">{liveClassFormErrors.scheduled_at}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select
                        name="status"
                        value={liveClassForm.status}
                        onChange={handleLiveClassFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="scheduled">Programada</option>
                        <option value="live">En vivo</option>
                        <option value="ended">Finalizada</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link Zoom/Meet *</label>
                    <input
                      type="url"
                      name="meeting_url"
                      value={liveClassForm.meeting_url}
                      onChange={handleLiveClassFormChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        liveClassFormErrors.meeting_url ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://meet.google.com/... o https://zoom.us/j/..."
                    />
                    {liveClassFormErrors.meeting_url && <p className="text-red-500 text-sm mt-1">{liveClassFormErrors.meeting_url}</p>}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={closeCreateLiveClassModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors order-2 sm:order-1"
                      disabled={liveClassFormLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={liveClassFormLoading}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                    >
                      {liveClassFormLoading ? 'Guardando...' : 'Crear Clase'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Mis Usuarios</h2>
                <button
                  onClick={() => handleOpenUserModal()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Usuario
                </button>
              </div>

              {/* Search */}
              <div className="bg-white rounded-lg shadow p-4">
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {usersLoading ? (
                  <div className="p-8 text-center text-gray-600">Cargando usuarios...</div>
                ) : filteredUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usuario</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((userItem) => (
                          <tr key={userItem.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{`${userItem.full_name || ''} ${userItem.last_names || ''}`.trim()}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{userItem.username}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{userItem.email}</td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleOpenUserModal(userItem)}
                                  className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-600">No hay usuarios</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      bulkMode
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {bulkMode ? 'Salir Modo Masivo' : 'Modo Masivo'}
                  </button>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      showTemplates
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    📋 Plantillas
                  </button>
                  <button
                    onClick={() => handleOpenTaskModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Nueva Tarea
                  </button>
                </div>
              </div>

              {/* Task Filters, Search and Sorting */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar tareas por título, descripción o prioridad..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filters and Sorting */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Status Filters */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 mr-2">Estado:</span>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => setTaskFilter('all')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            taskFilter === 'all'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setTaskFilter('active')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            taskFilter === 'active'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Activas
                        </button>
                        <button
                          onClick={() => setTaskFilter('due_soon')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            taskFilter === 'due_soon'
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Próximas
                        </button>
                        <button
                          onClick={() => setTaskFilter('overdue')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            taskFilter === 'overdue'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Vencidas
                        </button>
                        <button
                          onClick={() => setTaskFilter('pending')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            taskFilter === 'pending'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Pendientes
                        </button>
                        <button
                          onClick={() => setTaskFilter('completed')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            taskFilter === 'completed'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Completadas
                        </button>
                      </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 mr-2">Categoría:</span>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedCategory === 'all'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Todas
                        </button>
                        {taskCategories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                              selectedCategory === category.id
                                ? `${category.color.replace('bg-', 'bg-').replace('text-', 'text-')} ring-2 ring-offset-1 ring-gray-400`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span>{category.icon}</span>
                            <span className="hidden sm:inline">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sorting */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 mr-2">Ordenar:</span>
                      <select
                        value={taskSort}
                        onChange={(e) => setTaskSort(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="due_date">Fecha límite</option>
                        <option value="priority">Prioridad</option>
                        <option value="created_at">Fecha creación</option>
                        <option value="title">Título</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                {trainerTasksLoading ? (
                  <div className="divide-y divide-gray-200">
                    <UserTaskSkeleton />
                    <UserTaskSkeleton />
                    <UserTaskSkeleton />
                  </div>
                ) : trainerTasks.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {trainerTasks.map((userTasks) => {
                      const { user, tasks, stats } = userTasks;
                      const isExpanded = expandedUsers.has(user.id);

                      return (
                        <div key={user.id} className="p-4">
                          {/* User Header */}
                          <div
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                            onClick={() => toggleUserExpansion(user.id)}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>

                            {/* Progress Overview */}
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-gray-600">Progreso</div>
                                <div className="text-lg font-bold text-gray-900">
                                  {stats.completed} de {stats.total}
                                </div>
                              </div>
                              <div className="relative w-12 h-12">
                                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="3"
                                    strokeDasharray={`${stats.completionPercentage}, 100`}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-900">
                                    {stats.completionPercentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tasks List */}
                          {isExpanded && (
                            <div className="mt-4 pl-8">
                              {(() => {
                                const processedTasks = filterAndSortTasks(tasks);
                                return processedTasks.length > 0 ? (
                                  <div className="space-y-2">
                                    {processedTasks.map((task) => (
                                      <TaskCard
                                        key={task.id}
                                        title={task.title}
                                        dueDate={task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                                        priority={task.priority}
                                        completed={task.status === 'completed'}
                                        onToggle={() => toggleTaskCompletion(task.id, task.status)}
                                        selectable={bulkMode}
                                        selected={selectedTasks.has(task.id)}
                                        onSelect={() => toggleTaskSelection(task.id)}
                                        rawDueDate={task.due_date}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No hay tareas {
                                      taskFilter === 'pending' ? 'pendientes' :
                                      taskFilter === 'completed' ? 'completadas' :
                                      taskFilter === 'active' ? 'activas' :
                                      taskFilter === 'due_soon' ? 'próximas a vencer' :
                                      taskFilter === 'overdue' ? 'vencidas' :
                                      ''
                                    } asignadas</p>
                                  </div>
                                );
                              })()}

                              {/* Progress Chart Section */}
                              <div className="mt-6">
                                <button
                                  onClick={() => toggleProgressChartVisibility(user.id)}
                                  className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium"
                                >
                                  <span className="text-lg">📊</span>
                                  <span>Gráfico de Progreso</span>
                                  {showProgressChart.has(user.id) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>

                                {showProgressChart.has(user.id) && (
                                  <div className="mt-4">
                                    <ProgressChart userTasks={tasks} userName={user.name} />
                                  </div>
                                )}
                              </div>

                              {/* Measurements Section */}
                              <div className="mt-6">
                                <button
                                  onClick={() => toggleMeasurementsVisibility(user.id)}
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  <span className="text-lg">📏</span>
                                  <span>Mediciones Corporales</span>
                                  {showMeasurements.has(user.id) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>

                                {showMeasurements.has(user.id) && (
                                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-4">Registra las medidas corporales para seguimiento del progreso</p>

                                    {measurementsLoading[user.id] ? (
                                      <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-gray-600 mt-2">Cargando mediciones...</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                              Perímetro de Pierna (cm)
                                            </label>
                                            <input
                                              type="number"
                                              value={measurements[user.id]?.legPerimeter || ''}
                                              onChange={(e) => setMeasurements(prev => ({
                                                ...prev,
                                                [user.id]: { ...prev[user.id], legPerimeter: e.target.value }
                                              }))}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="Ej: 50"
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                              Perímetro de Tren Superior (cm)
                                            </label>
                                            <input
                                              type="number"
                                              value={measurements[user.id]?.upperBodyPerimeter || ''}
                                              onChange={(e) => setMeasurements(prev => ({
                                                ...prev,
                                                [user.id]: { ...prev[user.id], upperBodyPerimeter: e.target.value }
                                              }))}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="Ej: 90"
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                              Perímetro de Brazo (cm)
                                            </label>
                                            <input
                                              type="number"
                                              value={measurements[user.id]?.armPerimeter || ''}
                                              onChange={(e) => setMeasurements(prev => ({
                                                ...prev,
                                                [user.id]: { ...prev[user.id], armPerimeter: e.target.value }
                                              }))}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="Ej: 30"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex justify-end">
                                          <button
                                            onClick={() => handleSaveMeasurements(user.id)}
                                            disabled={measurementsLoading[user.id]}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {measurementsLoading[user.id] ? 'Guardando...' : 'Guardar Medidas'}
                                          </button>
                                        </div>

                                        {/* Recent Measurements History */}
                                        {measurements[user.id] && measurements[user.id].length > 0 && (
                                          <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Historial Reciente</h4>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                              {measurements[user.id].slice(0, 3).map((measurement, index) => (
                                                <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded">
                                                  {new Date(measurement.measured_at).toLocaleDateString('es-ES')} -
                                                  Pierna: {measurement.thigh_perimeter}cm,
                                                  Superior: {measurement.chest_perimeter}cm,
                                                  Brazo: {measurement.bicep_perimeter}cm
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-600">
                    <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No hay tareas</p>
                    <p className="text-sm text-gray-500 mt-1">Crea tu primera tarea para comenzar</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Classes Tab */}
          {activeTab === 'live-classes' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Clases en Vivo</h2>
                <button
                  onClick={openCreateLiveClassModal}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nueva Clase
                </button>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                {liveClassesLoading ? (
                  <div className="p-8 text-center text-gray-600">Cargando clases...</div>
                ) : liveClasses.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {liveClasses.map((lc) => {
                      const scheduled = lc?.scheduled_at ? new Date(lc.scheduled_at) : null;
                      const when = scheduled && !Number.isNaN(scheduled.getTime())
                        ? scheduled.toLocaleString()
                        : '';

                      return (
                        <div key={lc.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">{lc.title || 'Clase en Vivo'}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lc.status === 'live' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {lc.status === 'live' ? 'EN VIVO' : 'PRÓXIMA'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{lc.description || 'Sesión en vivo'}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                              <Clock className="w-4 h-4" />
                              <span>{when}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 break-all">{lc.meeting_url || 'Sin link'}</p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenMeetingLink(lc.meeting_url)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                            >
                              Abrir Link
                            </button>
                            <button
                              onClick={() => handleEditLiveClassLink(lc)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                            >
                              Editar Link
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-600">No hay clases en vivo</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
                <button
                  onClick={handleSaveProfile}
                  disabled={profileLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-64">
                    <div className="w-40 h-40 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                      {profileData.profile_image_url ? (
                        <img
                          src={profileData.profile_image_url}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL de foto de perfil</label>
                      <input
                        type="url"
                        value={profileData.profile_image_url}
                        onChange={handleProfileImageChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                      />
                      <p className="text-xs text-gray-500 mt-2">Pega el enlace de una imagen pública (JPG/PNG/WebP).</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perfil
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Escribe información sobre ti, tu experiencia, horarios, especialidad, etc."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Chat</h2>
              <Chat />
            </div>
          )}
        </main>
      </div>

      {/* User Modal */}
      {isUserModalOpen && (
        <UserModal
          isOpen={isUserModalOpen}
          user={selectedUser}
          onClose={handleCloseUserModal}
          onSave={handleSaveUser}
          isLoading={userModalLoading}
          hideRole
          fixedRole="user"
          requireEmail
        />
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          task={selectedTask}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          isLoading={taskModalLoading}
          appUsers={fetchedUsers}
        />
      )}

      {/* Chat Floating Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default TrainerDashboard;
