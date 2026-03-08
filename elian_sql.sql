-- ============================================================================
-- TRAIN WITH MORALE - CONSOLIDATED DATABASE SQL
-- ============================================================================
-- Archivo consolidado que contiene todos los scripts SQL del proyecto
-- Autor: Elian
-- Fecha: 2026-03-07
-- 
-- Este archivo incluye:
-- - Creación de todas las tablas
-- - Índices para optimización
-- - Triggers para actualización automática de timestamps
-- - Triggers para creación automática de tareas
-- - Datos iniciales (tipos de tareas, logros, usuario admin)
-- - Deshabilitar RLS para desarrollo
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: ELIMINAR TABLAS EXISTENTES (LIMPIEZA)
-- ============================================================================
-- Descomenta esta sección si necesitas una instalación desde cero
-- DROP TABLE IF EXISTS user_push_tokens CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS progress_reports CASCADE;
-- DROP TABLE IF EXISTS user_progress CASCADE;
-- DROP TABLE IF EXISTS user_achievements CASCADE;
-- DROP TABLE IF EXISTS achievements CASCADE;
-- DROP TABLE IF EXISTS streaks CASCADE;
-- DROP TABLE IF EXISTS habit_logs CASCADE;
-- DROP TABLE IF EXISTS exercise_logs CASCADE;
-- DROP TABLE IF EXISTS body_measurements CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS task_templates CASCADE;
-- DROP TABLE IF EXISTS task_types CASCADE;
-- DROP TABLE IF EXISTS live_classes CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS public_registrations CASCADE;
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS favorites CASCADE;
-- DROP TABLE IF EXISTS measurements CASCADE;
-- DROP TABLE IF EXISTS classes CASCADE;
-- DROP TABLE IF EXISTS web_content CASCADE;
-- DROP TABLE IF EXISTS app_users CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- SECCIÓN 2: TABLAS DE USUARIOS (BÁSICAS)
-- ============================================================================

-- Tabla de usuarios (admin y trainers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  last_names VARCHAR(255),
  id_number VARCHAR(255),
  birth_date DATE,
  birth_place VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'admin', 'trainer', 'user'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  -- Campos adicionales para perfiles de trainer
  profile_image_url VARCHAR(500),
  bio TEXT,
  specialty VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  certifications TEXT[],
  social_links JSONB DEFAULT '{}',
  is_public_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios de la aplicación (end users - clientes)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT 'temp_hash',
  email VARCHAR(255),
  full_name VARCHAR(255),
  last_names VARCHAR(255),
  id_number VARCHAR(255),
  birth_date DATE,
  birth_place VARCHAR(255),
  phone VARCHAR(50),
  tareas TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  trainer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 3: TABLAS DE CONTENIDO
-- ============================================================================

-- Contenido web dinámico
CREATE TABLE IF NOT EXISTS web_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(255) UNIQUE NOT NULL, -- 'hero', 'about', 'trainers', 'contact', etc.
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clases/Entrenamientos
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  duration INTEGER, -- en minutos
  level VARCHAR(50), -- 'Principiante', 'Intermedio', 'Avanzado'
  category VARCHAR(100), -- 'Cardio', 'Fuerza', 'Yoga', etc.
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  rating DECIMAL(3,2),
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentarios de clases
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER, -- 1-5 estrellas
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favoritos
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, class_id)
);

-- Mediciones corporales (legacy)
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  leg_perimeter DECIMAL(5,2),
  upper_body_perimeter DECIMAL(5,2),
  arm_perimeter DECIMAL(5,2),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 4: SISTEMA DE TAREAS
-- ============================================================================

-- Tipos de tareas
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE, -- 'measurement', 'exercise', 'habit', 'goal'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plantillas de tareas
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id UUID REFERENCES task_types(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tareas principales
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES task_templates(id),
  -- IMPORTANTE: user_id referencia a app_users (usuarios de la app móvil)
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES users(id), -- Entrenador que asignó la tarea
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'measurement', 'exercise', 'habit', 'goal'
  config JSONB, -- Configuración específica por tipo
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  progress_percentage INTEGER DEFAULT 0,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  completed_at TIMESTAMP,
  last_reminder_at TIMESTAMP,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sistema de comentarios en tareas
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_trainer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sistema de adjuntos en tareas
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document'
    file_size INTEGER NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECCIÓN 5: MEDICIONES Y EJERCICIOS
-- ============================================================================

-- Mediciones corporales detalladas
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  weight DECIMAL(5,2), -- kg
  height DECIMAL(5,2), -- cm
  bmi DECIMAL(4,2),
  -- Perímetros corporales
  neck_perimeter DECIMAL(5,2),
  chest_perimeter DECIMAL(5,2),
  waist_perimeter DECIMAL(5,2),
  hip_perimeter DECIMAL(5,2),
  thigh_perimeter DECIMAL(5,2),
  calf_perimeter DECIMAL(5,2),
  bicep_perimeter DECIMAL(5,2),
  forearm_perimeter DECIMAL(5,2),
  -- Notas y fotos
  notes TEXT,
  front_photo_url VARCHAR(500),
  side_photo_url VARCHAR(500),
  back_photo_url VARCHAR(500),
  measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registro de ejercicios realizados
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  exercise_name VARCHAR(255) NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL(6,2), -- kg
  duration INTEGER, -- segundos
  distance DECIMAL(6,2), -- km
  calories_burned INTEGER,
  notes TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registro de hábitos diarios
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  habit_type VARCHAR(100) NOT NULL, -- 'water_intake', 'sleep_hours', 'meal_logging', etc.
  value DECIMAL(8,2), -- cantidad
  unit VARCHAR(20), -- 'liters', 'hours', 'meals', etc.
  logged_at DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, habit_type, logged_at)
);

-- ============================================================================
-- SECCIÓN 6: GAMIFICACIÓN
-- ============================================================================

-- Logros/Logros disponibles
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(50), -- 'streak', 'measurement', 'exercise', 'habit'
  requirement_type VARCHAR(50), -- 'streak_days', 'weight_loss', 'exercises_completed', etc.
  requirement_value INTEGER,
  points INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logros desbloqueados por usuarios
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress_value INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Rachas de actividad
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  streak_type VARCHAR(50) NOT NULL, -- 'task_completion', 'measurement_logging', 'habit_tracking'
  current_count INTEGER DEFAULT 0,
  longest_count INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, streak_type)
);

-- Progreso del usuario
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE UNIQUE,
  classes_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  total_minutes_trained INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 7: COMUNICACIÓN
-- ============================================================================

-- Mensajes/Chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'task_reminder', 'achievement', 'motivational', 'progress_report'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 8: CLASES EN VIVO
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES users(id),
  scheduled_at TIMESTAMP,
  duration INTEGER,
  max_participants INTEGER DEFAULT 50,
  enrolled_users UUID[] DEFAULT '{}',
  meeting_url VARCHAR(500),
  meeting_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed'
  stream_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 9: MONETIZACIÓN Y SUSCRIPCIONES
-- ============================================================================

-- Suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL, -- 'basic', 'premium', 'pro'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'expired'
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'manual'
  stripe_subscription_id VARCHAR(255),
  paypal_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  paypal_payment_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registros públicos desde sitio web
CREATE TABLE IF NOT EXISTS public_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  interests TEXT,
  trainer_preference VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'assigned', 'completed'
  assigned_trainer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 10: NOTIFICACIONES PUSH
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  push_token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) DEFAULT 'ios', -- 'ios', 'android'
  device_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, push_token)
);

-- ============================================================================
-- SECCIÓN 11: REPORTES DE PROGRESO
-- ============================================================================

CREATE TABLE IF NOT EXISTS progress_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES users(id),
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'custom'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_assigned INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  weight_change DECIMAL(4,2) DEFAULT 0,
  streak_current INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  summary TEXT,
  recommendations TEXT,
  data JSONB,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 12: ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices de usuarios
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Índices de app_users
CREATE INDEX IF NOT EXISTS idx_app_users_trainer ON app_users(trainer_id);
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);

-- Índices de contenido
CREATE INDEX IF NOT EXISTS idx_web_content_section ON web_content(section);
CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_category ON classes(category);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);

-- Índices de tareas
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- Índices de mediciones
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON exercise_logs(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, logged_at);

-- Índices de notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent_at);

-- Índices de gamificación
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_type ON streaks(user_id, streak_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);

-- Índices de reportes
CREATE INDEX IF NOT EXISTS idx_progress_reports_user_period ON progress_reports(user_id, period_start, period_end);

-- Índices de comentarios y favoritos
CREATE INDEX IF NOT EXISTS idx_comments_class ON comments(class_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_user ON measurements(user_id);

-- Índices de clases en vivo
CREATE INDEX IF NOT EXISTS idx_live_classes_trainer ON live_classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_status ON live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled_at ON live_classes(scheduled_at);

-- Índices de mensajes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Índices de suscripciones y pagos
CREATE INDEX IF NOT EXISTS idx_public_registrations_status ON public_registrations(status);
CREATE INDEX IF NOT EXISTS idx_public_registrations_email ON public_registrations(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Índices de push tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON user_push_tokens(push_token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON user_push_tokens(is_active);

-- Índices de task comments y attachments
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_attachments_created_at ON task_attachments(created_at DESC);

-- ============================================================================
-- SECCIÓN 13: FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Triggers para actualización de timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_web_content_updated_at ON web_content;
CREATE TRIGGER update_web_content_updated_at BEFORE UPDATE ON web_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_classes_updated_at ON live_classes;
CREATE TRIGGER update_live_classes_updated_at BEFORE UPDATE ON live_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar updated_at en task_comments
CREATE OR REPLACE FUNCTION update_task_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_comment_updated_at ON task_comments;
CREATE TRIGGER trigger_update_task_comment_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_comment_updated_at();

-- ============================================================================
-- TRIGGER PARA CREACIÓN AUTOMÁTICA DE TAREAS INICIALES
-- ============================================================================
-- Esta función crea 4 tareas iniciales cuando se crea un nuevo usuario app:
-- 1. Medición Corporal Inicial
-- 2. Consumo de Agua Diario (hábito recurrente)
-- 3. Rutina de Ejercicio Inicial
-- 4. Meta Personal: Primer Mes

CREATE OR REPLACE FUNCTION create_initial_tasks_for_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
    trainer_id UUID;
BEGIN
    new_user_id := NEW.id;
    trainer_id := NEW.trainer_id;
    
    -- Si no hay trainer_id asignado, no crear tareas
    IF trainer_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Crear tarea de medición corporal inicial
    INSERT INTO tasks (
        user_id,
        trainer_id,
        title,
        description,
        type,
        config,
        status,
        priority,
        assigned_at,
        due_date
    ) VALUES (
        new_user_id,
        trainer_id,
        'Medición Corporal Inicial',
        'Registra tus medidas corporales iniciales para poder seguir tu progreso',
        'measurement',
        '{"require_photos": true, "measurements": ["weight", "height", "neck_perimeter", "chest_perimeter", "waist_perimeter", "hip_perimeter", "thigh_perimeter", "bicep_perimeter"]}',
        'pending',
        'high',
        NOW(),
        NOW() + INTERVAL '7 days'
    );
    
    -- Crear tarea de hábito diario (agua)
    INSERT INTO tasks (
        user_id,
        trainer_id,
        title,
        description,
        type,
        config,
        status,
        priority,
        assigned_at,
        due_date,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date
    ) VALUES (
        new_user_id,
        trainer_id,
        'Consumo de Agua Diario',
        'Bebe al menos 8 vasos de agua al día',
        'habit',
        '{"target_value": 8, "unit": "vasos", "habit_type": "water_intake"}',
        'pending',
        'medium',
        NOW(),
        NOW() + INTERVAL '1 day',
        true,
        'daily',
        NOW() + INTERVAL '30 days'
    );
    
    -- Crear tarea de ejercicio inicial
    INSERT INTO tasks (
        user_id,
        trainer_id,
        title,
        description,
        type,
        config,
        status,
        priority,
        assigned_at,
        due_date
    ) VALUES (
        new_user_id,
        trainer_id,
        'Rutina de Ejercicio Inicial',
        'Completa tu primera rutina de ejercicios',
        'exercise',
        '{"exercises": [{"name": "Sentadillas", "sets": 3, "reps": 10}, {"name": "Flexiones", "sets": 3, "reps": 8}, {"name": "Plancha", "sets": 3, "duration": 30}]}',
        'pending',
        'high',
        NOW(),
        NOW() + INTERVAL '3 days'
    );
    
    -- Crear tarea de meta personalizada
    INSERT INTO tasks (
        user_id,
        trainer_id,
        title,
        description,
        type,
        config,
        status,
        priority,
        assigned_at,
        due_date
    ) VALUES (
        new_user_id,
        trainer_id,
        'Meta Personal: Primer Mes',
        'Establece tus objetivos para el primer mes de entrenamiento',
        'goal',
        '{"goal_type": "monthly", "target_weight_loss": 2, "target_muscle_gain": 1}',
        'pending',
        'medium',
        NOW(),
        NOW() + INTERVAL '30 days'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función al crear un nuevo app_user
DROP TRIGGER IF EXISTS trigger_create_initial_tasks ON app_users;
CREATE TRIGGER trigger_create_initial_tasks
    AFTER INSERT ON app_users
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_tasks_for_user();

-- ============================================================================
-- SECCIÓN 14: VISTAS ÚTILES
-- ============================================================================

-- Vista para obtener clases con información del instructor
CREATE OR REPLACE VIEW classes_with_instructor AS
SELECT
  c.id,
  c.title,
  c.description,
  c.duration,
  c.level,
  c.category,
  c.rating,
  c.reviews_count,
  u.full_name as instructor_name,
  u.id as instructor_id
FROM classes c
LEFT JOIN users u ON c.instructor_id = u.id;

-- Vista para obtener progreso del usuario
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id,
  u.username,
  u.full_name,
  up.classes_completed,
  up.tasks_completed,
  up.total_minutes_trained,
  up.current_streak,
  COUNT(DISTINCT f.class_id) as favorite_classes
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN favorites f ON u.id = f.user_id
GROUP BY u.id, u.username, u.full_name, up.classes_completed, up.tasks_completed, up.total_minutes_trained, up.current_streak;

-- ============================================================================
-- SECCIÓN 15: DATOS INICIALES
-- ============================================================================

-- Tipos de tareas
INSERT INTO task_types (name, display_name, description, icon, color) VALUES
('measurement', 'Medición Corporal', 'Registro de medidas corporales y peso', 'scale', '#3B82F6'),
('exercise', 'Ejercicio', 'Rutinas de ejercicio con series y repeticiones', 'dumbbell', '#10B981'),
('habit', 'Hábito Diario', 'Seguimiento de hábitos saludables', 'heart', '#F59E0B'),
('goal', 'Meta Personalizada', 'Objetivos específicos a largo plazo', 'target', '#8B5CF6');

-- Logros/Achievements iniciales
INSERT INTO achievements (name, description, category, requirement_type, requirement_value, points, rarity) VALUES
('Primer Paso', 'Completa tu primera tarea', 'streak', 'tasks_completed', 1, 10, 'common'),
('Racha de 7 días', 'Completa tareas durante 7 días consecutivos', 'streak', 'streak_days', 7, 50, 'rare'),
('Racha de 30 días', 'Completa tareas durante 30 días consecutivos', 'streak', 'streak_days', 30, 200, 'epic'),
('Medidor Profesional', 'Registra 10 mediciones corporales', 'measurement', 'measurements_logged', 10, 25, 'common'),
('Atleta Comprometido', 'Completa 50 ejercicios', 'exercise', 'exercises_completed', 50, 75, 'rare'),
('Hábitos Saludables', 'Mantén 5 hábitos diarios por 14 días', 'habit', 'habit_streak', 14, 100, 'rare'),
('Transformación Total', 'Pierde 5kg y gana 2kg de músculo', 'measurement', 'body_transformation', 1, 500, 'legendary');

-- Usuario administrador por defecto
-- Contraseña: 123456 (bcrypt hash: $2b$10$R6DYCm03VHVz8xenHOlE..yb9aKd/au2JiAmuzJGlBrsn0MPQlF9y)
INSERT INTO users (username, password_hash, email, full_name, role) VALUES
('elian', '$2b$10$R6DYCm03VHVz8xenHOlE..yb9aKd/au2JiAmuzJGlBrsn0MPQlF9y', 'elian@trainwithmorale.com', 'Elian Administrador', 'admin');

-- Usuarios de prueba para la app móvil
-- Contraseña para todos: 123456
INSERT INTO app_users (username, password_hash, email, full_name, last_names, id_number, birth_date, birth_place, phone, status) VALUES
('usuario1', '$2b$10$R6DYCm03VHVz8xenHOlE..yb9aKd/au2JiAmuzJGlBrsn0MPQlF9y', 'usuario1@email.com', 'Juan', 'Pérez', '123456789', '1990-01-01', 'Bogotá', '3001234567', 'active'),
('usuario2', '$2b$10$R6DYCm03VHVz8xenHOlE..yb9aKd/au2JiAmuzJGlBrsn0MPQlF9y', 'usuario2@email.com', 'María', 'García', '987654321', '1985-05-15', 'Medellín', '3019876543', 'active'),
('testuser', '$2b$10$R6DYCm03VHVz8xenHOlE..yb9aKd/au2JiAmuzJGlBrsn0MPQlF9y', 'test@example.com', 'Usuario', 'Test', '111111111', '1995-12-25', 'Cali', '3021112222', 'active');

-- Progreso de usuarios de prueba
INSERT INTO user_progress (user_id, classes_completed, tasks_completed, total_minutes_trained, current_streak, longest_streak, last_activity_date) VALUES
((SELECT id FROM app_users WHERE username = 'usuario1'), 5, 12, 240, 3, 7, CURRENT_DATE),
((SELECT id FROM app_users WHERE username = 'usuario2'), 8, 20, 360, 5, 12, CURRENT_DATE),
((SELECT id FROM app_users WHERE username = 'testuser'), 2, 5, 90, 1, 2, CURRENT_DATE);

-- ============================================================================
-- SECCIÓN 16: DESHABILITAR ROW LEVEL SECURITY (DESARROLLO)
-- ============================================================================
-- IMPORTANTE: Para producción, configura políticas RLS apropiadas

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE web_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE measurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECCIÓN 17: CORRECCIONES ADICIONALES
-- ============================================================================

-- Convertir usernames existentes a minúsculas (solución problemas de login)
-- UPDATE users SET username = LOWER(username);
-- UPDATE app_users SET username = LOWER(username);

-- ============================================================================
-- FIN DEL ARCHIVO SQL CONSOLIDADO
-- ============================================================================
-- La base de datos está ahora completamente configurada con todas las tablas,
-- índices, triggers, funciones y datos iniciales necesarios para el proyecto
-- Train With Morale.
--
-- Para ejecutar este archivo:
-- 1. Abre el SQL Editor en Supabase
-- 2. Copia y pega todo el contenido
-- 3. Ejecuta el script
--
-- Contraseña por defecto para usuarios de prueba: 123456
-- hash bcrypt: $2b$10$R6DYCm03VHVz8xenHOlE..yb9aKd/au2JiAmuzJGlBrsn0MPQlF9y
-- ============================================================================
