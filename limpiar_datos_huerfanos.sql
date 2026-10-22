-- ============================================================================
-- LIMPIEZA DE DATOS HUÉRFANOS
-- ============================================================================
-- Eliminar registros huérfanos que referencian usuarios inexistentes
-- Ejecute este script para corregir errores de foreign key

-- Limpiar user_progress con user_id que no existe en app_users
DELETE FROM user_progress WHERE user_id NOT IN (SELECT id FROM app_users);

-- Limpiar user_achievements con user_id que no existe en users
DELETE FROM user_achievements WHERE user_id NOT IN (SELECT id FROM users);

-- Limpiar streaks con user_id que no existe en users
DELETE FROM streaks WHERE user_id NOT IN (SELECT id FROM users);

-- Limpiar messages con from_user_id o to_user_id que no existe en users
DELETE FROM messages WHERE from_user_id NOT IN (SELECT id FROM users) OR to_user_id NOT IN (SELECT id FROM users);

-- Limpiar notifications con user_id que no existe en users
DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM users);

-- Limpiar progress_reports con user_id que no existe en users
DELETE FROM progress_reports WHERE user_id NOT IN (SELECT id FROM users);

-- Limpiar exercise_logs con user_id que no existe en app_users
DELETE FROM exercise_logs WHERE user_id NOT IN (SELECT id FROM app_users);

-- Limpiar habit_logs con user_id que no existe en app_users
DELETE FROM habit_logs WHERE user_id NOT IN (SELECT id FROM app_users);

-- Limpiar body_measurements con user_id que no existe en app_users
DELETE FROM body_measurements WHERE user_id NOT IN (SELECT id FROM app_users);

-- Limpiar comments con user_id que no existe en users
DELETE FROM comments WHERE user_id NOT IN (SELECT id FROM users);

-- Limpiar favorites con user_id que no existe en users
DELETE FROM favorites WHERE user_id NOT IN (SELECT id FROM users);

-- Limpiar task_attachments con task_id que no existe en tasks
DELETE FROM task_attachments WHERE task_id NOT IN (SELECT id FROM tasks);

-- Limpiar task_comments con task_id que no existe en tasks
DELETE FROM task_comments WHERE task_id NOT IN (SELECT id FROM tasks);

-- Limpiar subscriptions con user_id que no existe en users
DELETE FROM subscriptions WHERE user_id NOT IN (SELECT id FROM users);

-- Limpiar payments con user_id que no existe en users
DELETE FROM payments WHERE user_id NOT IN (SELECT id FROM users);
