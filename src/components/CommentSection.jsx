import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Edit2, Trash2, User, Shield } from 'lucide-react';
import { apiClient } from '../apiClient';

const CommentSection = ({ taskId, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      loadComments();
    }
  }, [isOpen, taskId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getTaskComments(taskId);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      // Show toast notification for error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.createTaskComment(taskId, newComment.trim());

      setComments(prev => [...prev, response.data]);
      setNewComment('');

      // Show success toast
    } catch (error) {
      console.error('Error creating comment:', error);
      // Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const response = await apiClient.updateTaskComment(commentId, editText.trim());

      setComments(prev => prev.map(comment =>
        comment.id === commentId ? response.data : comment
      ));
      setEditingComment(null);
      setEditText('');

      // Show success toast
    } catch (error) {
      console.error('Error updating comment:', error);
      // Show error toast
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      await apiClient.deleteTaskComment(commentId);

      setComments(prev => prev.filter(comment => comment.id !== commentId));

      // Show success toast
    } catch (error) {
      console.error('Error deleting comment:', error);
      // Show error toast
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Hace menos de una hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
      } else {
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Comentarios de la Tarea
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Cargando comentarios...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay comentarios aún</p>
              <p className="text-sm text-gray-400 mt-1">Sé el primero en comentar</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {comment.is_trainer ? (
                        <Shield className="w-4 h-4 text-blue-600" />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {comment.user.name}
                        {comment.is_trainer && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Entrenador
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                        {comment.updated_at !== comment.created_at && (
                          <span className="ml-1">(editado)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Comment actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(comment)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar comentario"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar comentario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                      placeholder="Edita tu comentario..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* New Comment Form */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar Comentario
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Escribe tu comentario aquí..."
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Comentar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;