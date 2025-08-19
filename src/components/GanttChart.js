import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';

const GanttChart = ({ boards, onClose }) => {
  const [allTasks, setAllTasks] = useState([]);
  const [timelineRange, setTimelineRange] = useState({ start: null, end: null });

  useEffect(() => {
    // Extraer todas las tarjetas de todos los tableros
    const tasks = [];
    boards.forEach(board => {
      board.cards.forEach(card => {
        if (card.dueDate) {
          tasks.push({
            ...card,
            boardTitle: board.title,
            boardColor: board.color,
            startDate: card.createdAt ? new Date(card.createdAt) : new Date(),
            endDate: new Date(card.dueDate)
          });
        }
      });
    });

    // Ordenar por fecha de inicio
    tasks.sort((a, b) => a.startDate - b.startDate);
    setAllTasks(tasks);

    // Calcular rango de fechas para la línea de tiempo
    if (tasks.length > 0) {
      const startDates = tasks.map(t => t.startDate);
      const endDates = tasks.map(t => t.endDate);
      const earliestStart = new Date(Math.min(...startDates));
      const latestEnd = new Date(Math.max(...endDates));
      
      // Agregar margen de una semana antes y después
      const start = new Date(earliestStart);
      start.setDate(start.getDate() - 7);
      const end = new Date(latestEnd);
      end.setDate(end.getDate() + 7);
      
      setTimelineRange({ start, end });
    }
  }, [boards]);

  const getDaysBetween = (start, end) => {
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTaskPosition = (task) => {
    if (!timelineRange.start || !timelineRange.end) return { left: 0, width: 0 };
    
    const totalDays = getDaysBetween(timelineRange.start, timelineRange.end);
    const startOffset = getDaysBetween(timelineRange.start, task.startDate);
    const taskDuration = getDaysBetween(task.startDate, task.endDate);
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max((taskDuration / totalDays) * 100, 2); // Mínimo 2% de ancho
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getTaskStatus = (task) => {
    const now = new Date();
    const due = new Date(task.endDate);
    
    if (due < now) {
      return { status: 'overdue', color: 'bg-red-500', textColor: 'text-red-100' };
    } else if (getDaysBetween(now, due) <= 3) {
      return { status: 'urgent', color: 'bg-orange-500', textColor: 'text-orange-100' };
    } else {
      return { status: 'normal', color: 'bg-blue-500', textColor: 'text-blue-100' };
    }
  };

  const generateTimelineHeaders = () => {
    if (!timelineRange.start || !timelineRange.end) return [];
    
    const headers = [];
    const current = new Date(timelineRange.start);
    
    while (current <= timelineRange.end) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 7); // Incrementar por semana
    }
    
    return headers;
  };

  if (allTasks.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="mr-2" size={20} />
              Gráfica de Gantt
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No hay tareas con fechas programadas</p>
            <p className="text-gray-500 text-sm">
              Agrega fechas de entrega a las tarjetas para visualizar el cronograma
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timelineHeaders = generateTimelineHeaders();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg w-full h-full sm:h-5/6 max-w-7xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-6 border-b flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Calendar className="text-blue-600" size={24} />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Gráfica de Gantt</h2>
              <p className="text-xs sm:text-sm text-gray-600">{allTasks.length} tareas programadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Gantt Chart Content */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            {/* Timeline Header */}
            <div className="sticky top-0 bg-gray-50 border-b z-10">
              <div className="flex">
                {/* Task names column */}
                <div className="w-64 sm:w-80 flex-shrink-0 p-2 sm:p-4 bg-gray-100 border-r">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Tareas</h3>
                </div>
                
                {/* Timeline dates */}
                <div className="flex-1 relative">
                  <div className="flex h-12 sm:h-16">
                    {timelineHeaders.map((date, index) => (
                      <div
                        key={index}
                        className="flex-1 border-r border-gray-200 p-1 sm:p-2 text-center"
                        style={{ minWidth: '80px' }}
                      >
                        <div className="text-xs sm:text-sm font-medium text-gray-700">
                          {formatDate(date)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks and bars */}
            <div className="divide-y divide-gray-200">
              {allTasks.map((task, index) => {
                const position = getTaskPosition(task);
                const taskStatus = getTaskStatus(task);
                
                return (
                  <div key={task.id || index} className="flex hover:bg-gray-50 transition-colors">
                    {/* Task info column */}
                    <div className="w-64 sm:w-80 flex-shrink-0 p-2 sm:p-4 border-r bg-white">
                      <div className="space-y-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <div className={`w-2 h-2 rounded-full ${task.boardColor.replace('bg-', 'bg-')}`}></div>
                          <span className="truncate">{task.boardTitle}</span>
                        </div>
                        {task.assignedTo && (
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <User size={12} />
                            <span className="truncate">{task.assignedTo}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Clock size={12} />
                          <span>{formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gantt bar */}
                    <div className="flex-1 relative p-2 sm:p-4" style={{ minHeight: '80px' }}>
                      <div
                        className={`absolute top-1/2 transform -translate-y-1/2 h-6 sm:h-8 ${taskStatus.color} rounded shadow-sm flex items-center justify-center`}
                        style={position}
                        title={`${task.title} (${formatDate(task.startDate)} - ${formatDate(task.endDate)})`}
                      >
                        <span className={`text-xs font-medium ${taskStatus.textColor} truncate px-1 sm:px-2`}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with legend */}
        <div className="border-t p-3 sm:p-4 bg-gray-50 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-gray-600">Próximo a vencer (≤3 días)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">Vencido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;