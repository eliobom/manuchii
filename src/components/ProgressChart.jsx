import React from 'react';

const ProgressChart = ({ userTasks, userName }) => {
  // Calculate completion data for the last 7 days
  const getLast7DaysData = () => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Count tasks completed on this date
      const completedOnDate = userTasks.filter(task =>
        task.status === 'completed' &&
        task.completed_at &&
        task.completed_at.split('T')[0] === dateStr
      ).length;

      // Count total tasks created before or on this date
      const totalTasksByDate = userTasks.filter(task => {
        const createdDate = new Date(task.created_at).toISOString().split('T')[0];
        return createdDate <= dateStr;
      }).length;

      data.push({
        date: dateStr,
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        completed: completedOnDate,
        total: totalTasksByDate,
        percentage: totalTasksByDate > 0 ? Math.round((completedOnDate / totalTasksByDate) * 100) : 0
      });
    }

    return data;
  };

  const chartData = getLast7DaysData();
  const maxTasks = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Progreso de {userName} - Últimos 7 días
        </h3>
        <div className="text-sm text-gray-600">
          Total completadas: {userTasks.filter(t => t.status === 'completed').length} de {userTasks.length}
        </div>
      </div>

      <div className="space-y-3">
        {chartData.map((day, index) => (
          <div key={day.date} className="flex items-center gap-3">
            <div className="w-12 text-xs text-gray-600 font-medium">
              {day.day}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">
                  {day.completed}/{day.total} tareas
                </span>
                <span className="text-xs font-medium text-gray-900">
                  {day.percentage}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${day.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {userTasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-600">Completadas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {userTasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-600">Pendientes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((userTasks.filter(t => t.status === 'completed').length / Math.max(userTasks.length, 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-600">Tasa de éxito</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;