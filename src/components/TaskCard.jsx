import React from 'react';
import { CheckSquare, Square, Calendar } from 'lucide-react';

const TaskCard = ({ title, dueDate, priority, completed, onToggle, selectable = false, selected = false, onSelect, rawDueDate, category }) => {
  const getDueDateStatus = () => {
    if (!rawDueDate || completed) return null;

    const dueDateObj = new Date(rawDueDate);
    const now = new Date();
    const timeDiff = dueDateObj.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: 'overdue', text: `Vencida hace ${Math.abs(daysDiff)} día${Math.abs(daysDiff) !== 1 ? 's' : ''}`, color: 'text-red-600 bg-red-50' };
    } else if (daysDiff === 0) {
      return { status: 'due_today', text: 'Vence hoy', color: 'text-orange-600 bg-orange-50' };
    } else if (daysDiff <= 3) {
      return { status: 'due_soon', text: `Vence en ${daysDiff} día${daysDiff !== 1 ? 's' : ''}`, color: 'text-yellow-600 bg-yellow-50' };
    }

    return null;
  };

  const dueDateStatus = getDueDateStatus();
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'bg-red-500 text-white border-red-600';
      case 'medium':
      case 'media':
        return 'bg-orange-500 text-white border-orange-600';
      case 'low':
      case 'baja':
        return 'bg-green-500 text-white border-green-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getPriorityBorder = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'alta':
        return 'border-l-4 border-red-500';
      case 'medium':
      case 'media':
        return 'border-l-4 border-orange-500';
      case 'low':
      case 'baja':
        return 'border-l-4 border-green-500';
      default:
        return 'border-l-4 border-gray-500';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return priority || 'Baja';
    }
  };

  const getCategoryInfo = (categoryId) => {
    const categories = [
      { id: 'fitness', name: 'Fitness', color: 'bg-green-100 text-green-800', icon: '💪' },
      { id: 'nutrition', name: 'Nutrición', color: 'bg-orange-100 text-orange-800', icon: '🥗' },
      { id: 'rest', name: 'Descanso', color: 'bg-blue-100 text-blue-800', icon: '😴' },
      { id: 'motivation', name: 'Motivación', color: 'bg-purple-100 text-purple-800', icon: '🎯' },
      { id: 'measurement', name: 'Medición', color: 'bg-pink-100 text-pink-800', icon: '📏' },
      { id: 'general', name: 'General', color: 'bg-gray-100 text-gray-800', icon: '📝' }
    ];
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '📝', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div
      className={`bg-white border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow ${
        completed ? 'bg-gray-50 border-gray-200' : 'border-gray-200'
      } ${selected ? 'ring-2 ring-blue-500' : ''} ${
        dueDateStatus?.status === 'overdue' ? 'border-red-300 bg-red-50' :
        dueDateStatus?.status === 'due_today' ? 'border-orange-300 bg-orange-50' :
        dueDateStatus?.status === 'due_soon' ? 'border-yellow-300 bg-yellow-50' : ''
      } ${getPriorityBorder(priority)}`}
      onClick={selectable ? onSelect : onToggle}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <div className="mt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => {}} // Controlled by onClick
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        )}
        <div className="mt-1">
          {completed ? (
            <CheckSquare className="w-5 h-5 text-green-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <div className="flex-1">
          <h4
            className={`font-medium text-gray-900 mb-2 ${
              completed ? 'line-through text-gray-500' : ''
            }`}
          >
            {title}
          </h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className={dueDateStatus ? 'font-medium' : 'text-gray-600'}>
                {dueDate || 'Sin fecha'}
              </span>
              {dueDateStatus && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${dueDateStatus.color}`}>
                  {dueDateStatus.text}
                </span>
              )}
            </div>

            {category && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {getCategoryInfo(category)?.icon} {getCategoryInfo(category)?.name}
              </span>
            )}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}
            >
              {getPriorityText(priority)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;