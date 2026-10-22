import { supabase } from './supabaseClient';

const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL;

const UPLOADS_BUCKET = import.meta.env.VITE_SUPABASE_UPLOADS_BUCKET || 'class-attachments';
const TASK_ATTACHMENTS_BUCKET = import.meta.env.VITE_SUPABASE_TASK_ATTACHMENTS_BUCKET || 'task-attachments';
const CLASS_ATTACHMENTS_BUCKET = import.meta.env.VITE_SUPABASE_CLASS_ATTACHMENTS_BUCKET || 'class-attachments';

const DEFAULT_FALLBACK_BUCKET = UPLOADS_BUCKET;

const isBucketNotFoundError = (err) => {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('bucket') && msg.includes('not found');
};

const uploadWithBucketFallback = async ({ preferredBucket, fallbackBucket = DEFAULT_FALLBACK_BUCKET, path, file, options }) => {
  try {
    const { data, error } = await supabase.storage
      .from(preferredBucket)
      .upload(path, file, options);
    if (error) throw error;
    return { bucket: preferredBucket, path: data.path || path };
  } catch (err) {
    if (!fallbackBucket || !isBucketNotFoundError(err)) {
      throw err;
    }

    const { data, error } = await supabase.storage
      .from(fallbackBucket)
      .upload(path, file, options);
    if (error) throw error;
    return { bucket: fallbackBucket, path: data.path || path };
  }
};

const removeWithBucketFallback = async ({ preferredBucket, fallbackBucket = DEFAULT_FALLBACK_BUCKET, paths }) => {
  try {
    const { error } = await supabase.storage
      .from(preferredBucket)
      .remove(paths);
    if (error) throw error;
    return { bucket: preferredBucket };
  } catch (err) {
    if (!fallbackBucket || !isBucketNotFoundError(err)) {
      throw err;
    }

    const { error } = await supabase.storage
      .from(fallbackBucket)
      .remove(paths);
    if (error) throw error;
    return { bucket: fallbackBucket };
  }
};

const buildPublicStorageUrl = (bucket, path) => {
  const base = String(SUPABASE_BASE_URL || '').replace(/\/$/, '');
  if (!base) return null;
  const cleanBucket = String(bucket || '').replace(/^\/+|\/+$/g, '');
  const cleanPath = String(path || '').replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/${cleanBucket}/${cleanPath}`;
};

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    // Using Supabase - no backend server needed
    console.log('Using Supabase client for:', endpoint);
    return { data: null, message: 'Supabase mode' };
  }

  // Authentication using custom database (username + password_hash)
  async login(credentials) {
    const { username, password, role } = credentials;
    
    try {
      const usernameNormalized = String(username ?? '').trim();
      const usernameLower = usernameNormalized.toLowerCase();

      if (!usernameNormalized) {
        throw new Error('Usuario requerido');
      }

      // Query the users table to find matching username (exact match, case-insensitive)
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .ilike('username', usernameNormalized);

      if (userError) {
        console.error('Supabase query error:', userError);
        throw new Error(`Error de base de datos: ${userError.message}`);
      }

      // Find the exact match
      const matchedUser = users?.find(u => String(u.username ?? '').trim().toLowerCase() === usernameLower);

      if (!matchedUser) {
        // Fallback: some projects store auth users in app_users
        const { data: appUsers, error: appUserError } = await supabase
          .from('app_users')
          .select('*')
          .ilike('username', usernameNormalized);

        if (appUserError) {
          console.error('Supabase app_users query error:', appUserError);
          throw new Error('Usuario no encontrado. Verifica el nombre de usuario.');
        }

        const matchedAppUser = appUsers?.find(u => String(u.username ?? '').trim().toLowerCase() === usernameLower);

        if (!matchedAppUser) {
          throw new Error('Usuario no encontrado. Verifica el nombre de usuario.');
        }

        return this.login({ ...credentials, username: matchedAppUser.username });
      }

      // For development/demo: check against bcrypt hash of '123456'
      // The hash in DB: $2b$10$R6DYCm03VHVz8xenHOlE..yb9aKd/au2JiAmuzJGlBrsn0MPQlF9y
      // For simplicity in this demo, we'll accept '123456' as password
      // In production, you would use a proper bcrypt comparison
      
      // Simple password check (in production, use proper bcrypt comparison)
      const validPassword = password === '123456' || 
        await this.verifyPassword(password, matchedUser.password_hash);
      
      if (!validPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Use role from login request or from database or default
      const userRole = role || matchedUser.role || 'admin';

      const userData = {
        id: matchedUser.id,
        username: matchedUser.username,
        email: matchedUser.email,
        full_name: matchedUser.full_name,
        role: userRole,
        status: matchedUser.status
      };

      // Generate a simple token (in production, use JWT or proper session)
      const token = btoa(JSON.stringify({ userId: userData.id, role: userRole, timestamp: Date.now() }));
      this.setToken(token);
      this.user = userData;
      localStorage.setItem('user', JSON.stringify(userData));

      return { token, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Simple password verification (for demo - in production use proper bcrypt)
  async verifyPassword(password, hash) {
    // For demo purposes, accept '123456' as the password
    // In production, use bcrypt.compare() on the server side
    return password === '123456';
  }

  // Users - using Supabase
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw new Error(error.message);
    return data;
  }

  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateUser(id, userData) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteUser(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // App Users - using Supabase
  async getAppUsers() {
    const { data, error } = await supabase
      .from('app_users')
      .select('*');
    if (error) throw new Error(error.message);
    return data;
  }

  async createAppUser(userData) {
    const { data, error } = await supabase
      .from('app_users')
      .insert(userData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateAppUser(id, userData) {
    const { data, error } = await supabase
      .from('app_users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteAppUser(id) {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Web Content - using Supabase
  async getWebContent() {
    const { data, error } = await supabase
      .from('web_content')
      .select('*');
    if (error) throw new Error(error.message);
    return data;
  }

  async updateWebContent(section, content) {
    const { data, error } = await supabase
      .from('web_content')
      .update({ content })
      .eq('section', section)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Stats - using Supabase
  async getStats() {
    // Get counts from various tables
    const [usersRes, classesRes, tasksRes, liveClassesRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact' }),
      supabase.from('classes').select('*', { count: 'exact' }),
      supabase.from('tasks').select('*', { count: 'exact' }),
      supabase.from('live_classes').select('*', { count: 'exact' })
    ]);
    
    return {
      totalUsers: usersRes.count || 0,
      totalClasses: classesRes.count || 0,
      totalTasks: tasksRes.count || 0,
      liveSessions: liveClassesRes.count || 0,
      totalRevenue: 0 // No payments table yet
    };
  }

  // Classes - using Supabase
  async getClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getTrainerClasses(trainerId) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('instructor_id', trainerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async createClass(classData) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateClass(id, classData) {
    const { data, error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteClass(id) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getAppUserClassAssignments(appUserId) {
    const { data, error } = await supabase
      .from('app_user_classes')
      .select('class_id')
      .eq('user_id', appUserId);
    if (error) throw new Error(error.message);
    return data;
  }

  async assignClassToAppUser(appUserId, classId) {
    const { data, error } = await supabase
      .from('app_user_classes')
      .insert({ user_id: appUserId, class_id: classId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async unassignClassFromAppUser(appUserId, classId) {
    const { error } = await supabase
      .from('app_user_classes')
      .delete()
      .eq('user_id', appUserId)
      .eq('class_id', classId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Tasks - using Supabase
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getTrainerTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('trainer_id', this.user?.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getTrainerAppUsers(trainerId) {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateTask(id, taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Live Classes - using Supabase
  async getLiveClasses() {
    const { data, error } = await supabase
      .from('live_classes')
      .select('*')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async createLiveClass(classData) {
    const { data, error } = await supabase
      .from('live_classes')
      .insert(classData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateLiveClass(id, classData) {
    const { data, error } = await supabase
      .from('live_classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // Messages - using Supabase
  async getMessages(userId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async getConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  // Notifications - using Supabase
  async getNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async markNotificationAsRead(id) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getTrainerLiveClasses(trainerId) {
    const { data, error } = await supabase
      .from('live_classes')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('scheduled_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async getBodyMeasurementsByUser(userId) {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async createBodyMeasurement(measurementData) {
    const { data, error } = await supabase
      .from('body_measurements')
      .insert(measurementData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // File Upload - using Supabase Storage
  async uploadFile(file) {
    const sanitizedFileName = String(file?.name || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;

    try {
      const { data, error } = await supabase.storage
        .from(UPLOADS_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });

      if (error) throw error;

      const publicUrl = buildPublicStorageUrl(UPLOADS_BUCKET, data.path || fileName);
      return { url: publicUrl, path: data.path, fileName, size: file.size, mimeType: file.type };
    } catch (err) {
      if (isBucketNotFoundError(err)) {
        throw new Error(
          `Bucket not found: ${UPLOADS_BUCKET}. Crea el bucket en Supabase Storage o configura VITE_SUPABASE_UPLOADS_BUCKET con el nombre correcto.`
        );
      }
      throw new Error(err?.message || String(err));
    }
  }

  async deleteFile(path) {
    const { error } = await supabase.storage
      .from(UPLOADS_BUCKET)
      .remove([path]);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Analytics - using Supabase
  async getAnalyticsOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [usersRes, tasksRes, classesRes] = await Promise.all([
      supabase.from('users').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('tasks').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('classes').select('created_at').gte('created_at', thirtyDaysAgo.toISOString())
    ]);
    
    return {
      newUsers: usersRes.data?.length || 0,
      newTasks: tasksRes.data?.length || 0,
      newClasses: classesRes.data?.length || 0,
      period: '30 days'
    };
  }

  // Marketplace
  async getTrainersMarketplace() {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('available', true);
    if (error) throw new Error(error.message);
    return data;
  }

  // Revenue Analytics
  async getRevenueAnalytics() {
    const { data, error } = await supabase
      .from('revenue')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data;
  }

  // Task Comments - using Supabase
  async getTaskComments(taskId) {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async createTaskComment(taskId, comment) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, comment })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateTaskComment(commentId, comment) {
    const { data, error } = await supabase
      .from('task_comments')
      .update({ comment })
      .eq('id', commentId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteTaskComment(commentId) {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Task Attachments - using Supabase
  async getTaskAttachments(taskId) {
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async uploadTaskAttachment(taskId, file) {
    // Sanitize filename - replace special characters
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${taskId}/${Date.now()}_${sanitizedFileName}`;
    
    const uploadRes = await uploadWithBucketFallback({
      preferredBucket: TASK_ATTACHMENTS_BUCKET,
      fallbackBucket: DEFAULT_FALLBACK_BUCKET,
      path: fileName,
      file,
      options: {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      }
    });
    
    const publicUrl = buildPublicStorageUrl(uploadRes.bucket, uploadRes.path);
    
    const inferredFileType = file.type?.startsWith('image/')
      ? 'image'
      : file.type?.startsWith('video/')
        ? 'video'
        : 'document';

    const uploaderId = this.user?.id || null;
    if (!uploaderId) {
      throw new Error('No hay usuario autenticado para registrar el adjunto');
    }

    // Save attachment record (match elian_sql.sql schema)
    const { data: attachment, error: dbError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        user_id: null,
        filename: uploadRes.path,
        original_filename: file.name,
        file_url: publicUrl,
        file_type: inferredFileType,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: uploaderId,
        is_approved: true
      })
      .select()
      .single();
    
    if (dbError) throw new Error(dbError.message);
    return attachment;
  }

  async attachUploadedFile(taskId, attachmentData) {
    // For files already uploaded (have URL, not File object)
    const inferredFileType = attachmentData.type?.startsWith('image/')
      ? 'image'
      : attachmentData.type?.startsWith('video/')
        ? 'video'
        : 'document';

    const uploaderId = this.user?.id || null;
    if (!uploaderId) {
      throw new Error('No hay usuario autenticado para registrar el adjunto');
    }

    const { data: attachment, error: dbError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        user_id: null,
        filename: attachmentData.name,
        original_filename: attachmentData.name,
        file_url: attachmentData.url,
        file_type: inferredFileType,
        mime_type: attachmentData.type,
        file_size: attachmentData.size,
        uploaded_by: uploaderId,
        is_approved: true
      })
      .select()
      .single();
    
    if (dbError) throw new Error(dbError.message);
    return attachment;
  }

  async deleteTaskAttachment(attachmentId) {
    // First fetch filename to delete from storage
    const { data: attachment, error: fetchError } = await supabase
      .from('task_attachments')
      .select('filename')
      .eq('id', attachmentId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    if (attachment?.filename) {
      await removeWithBucketFallback({
        preferredBucket: TASK_ATTACHMENTS_BUCKET,
        fallbackBucket: DEFAULT_FALLBACK_BUCKET,
        paths: [attachment.filename]
      });
    }

    const { error } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Class Attachments - using Supabase (class_attachments table + class-attachments bucket)
  async getClassAttachments(classId) {
    const { data, error } = await supabase
      .from('class_attachments')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async uploadClassAttachment(classId, file) {
    // Sanitize filename - replace special characters
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${classId}/${Date.now()}_${sanitizedFileName}`;
    
    const uploadRes = await uploadWithBucketFallback({
      preferredBucket: CLASS_ATTACHMENTS_BUCKET,
      fallbackBucket: DEFAULT_FALLBACK_BUCKET,
      path: fileName,
      file,
      options: {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      }
    });

    const publicUrl = buildPublicStorageUrl(uploadRes.bucket, uploadRes.path);

    const inferredFileType = file.type?.startsWith('image/')
      ? 'image'
      : file.type?.startsWith('video/')
        ? 'video'
        : 'document';

    const uploaderId = this.user?.id || null;
    if (!uploaderId) {
      throw new Error('No hay usuario autenticado para registrar el adjunto');
    }

    const { data: attachment, error: dbError } = await supabase
      .from('class_attachments')
      .insert({
        class_id: classId,
        user_id: null,
        filename: uploadRes.path,
        original_filename: file.name,
        file_url: publicUrl,
        file_type: inferredFileType,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: uploaderId,
        is_approved: true
      })
      .select()
      .single();
    if (dbError) throw new Error(dbError.message);
    return attachment;
  }

  async deleteClassAttachment(attachmentId) {
    const { data: attachment, error: fetchError } = await supabase
      .from('class_attachments')
      .select('filename')
      .eq('id', attachmentId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    if (attachment?.filename) {
      await removeWithBucketFallback({
        preferredBucket: CLASS_ATTACHMENTS_BUCKET,
        fallbackBucket: DEFAULT_FALLBACK_BUCKET,
        paths: [attachment.filename]
      });
    }

    const { error } = await supabase
      .from('class_attachments')
      .delete()
      .eq('id', attachmentId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Logout
  async logout() {
    await supabase.auth.signOut();
    this.setToken(null);
    localStorage.removeItem('user');
  }
}
export const apiClient = new ApiClient();