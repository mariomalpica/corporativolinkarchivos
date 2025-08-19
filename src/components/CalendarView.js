import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Filter, Clock, User } from 'lucide-react';

const CalendarView = ({ boards, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week'
  const [allTasks, setAllTasks] = useState([]);

  // Extraer todas las tarjetas con fechas de todos los tableros
  useEffect(() => {
    const tasks = [];
    boards.forEach(board => {
      board.cards.forEach(card => {
        if (card.dueDate) {
          tasks.push({
            ...card,
            boardTitle: board.title,
            boardColor: board.color,
            dueDate: new Date(card.dueDate),
            createdDate: card.createdAt ? new Date(card.createdAt) : new Date()
          });
        }
      });
    });
    setAllTasks(tasks);
  }, [boards]);

  // Filtrar tareas basado en el rango seleccionado
  useEffect(() => {
    if (!selectedRange.start && !selectedRange.end) {
      setFilteredTasks(allTasks);
    } else if (selectedRange.start && selectedRange.end) {
      const filtered = allTasks.filter(task => {
        const taskDate = task.dueDate;
        return taskDate >= selectedRange.start && taskDate <= selectedRange.end;
      });
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(allTasks);
    }
  }, [allTasks, selectedRange]);

  // Obtener días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior para completar la primera semana
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = new Date(year, month, -i);
      days.push({ date: prevDay, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      days.push({ date: dayDate, isCurrentMonth: true });
    }
    
    // Días del próximo mes para completar la última semana
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDay = new Date(year, month + 1, day);
      days.push({ date: nextDay, isCurrentMonth: false });
    }
    
    return days;
  };

  // Obtener tareas para una fecha específica
  const getTasksForDate = (date) => {
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Verificar si una fecha está en el rango seleccionado
  const isDateInRange = (date) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  // Manejar selección de rango
  const handleDateClick = (date) => {
    if (!selectedRange.start || selectedRange.end) {
      // Iniciar nuevo rango
      setSelectedRange({ start: new Date(date), end: null });
    } else {
      // Completar rango
      const start = selectedRange.start;
      const end = new Date(date);
      if (end >= start) {
        setSelectedRange({ start, end });
      } else {
        setSelectedRange({ start: end, end: start });
      }
    }
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedRange({ start: null, end: null });
  };

  // Navegar meses
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Formatear fecha
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Obtener estado de la tarea
  const getTaskStatus = (task) => {
    const now = new Date();
    const due = new Date(task.dueDate);
    
    if (due < now) {
      return { status: 'overdue', color: 'bg-red-500', textColor: 'text-red-100' };
    } else if ((due - now) / (1000 * 60 * 60 * 24) <= 3) {
      return { status: 'urgent', color: 'bg-orange-500', textColor: 'text-orange-100' };
    } else {
      return { status: 'normal', color: 'bg-blue-500', textColor: 'text-blue-100' };
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const days = getDaysInMonth(currentDate);

  if (allTasks.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="mr-2" size={20} />
              Vista Calendario
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
              Agrega fechas de entrega a las tarjetas para visualizar el calendario
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg w-full h-full sm:h-5/6 max-w-6xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-6 border-b flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="text-blue-600" size={24} />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Vista Calendario</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''} 
                  {selectedRange.start && selectedRange.end && ' en rango seleccionado'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Calendar Navigation */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 min-w-48 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Range controls */}
            <div className="flex items-center space-x-2 text-sm">
              {selectedRange.start && (
                <div className="flex items-center space-x-2 bg-blue-50 px-2 py-1 rounded-lg">
                  <Filter size={14} className="text-blue-600" />
                  <span className="text-blue-800">
                    {selectedRange.end 
                      ? `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`
                      : `Desde ${formatDate(selectedRange.start)}`
                    }
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {!selectedRange.start && (
                <span className="text-gray-500 text-xs">
                  Haz clic en fechas para seleccionar rango
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Day headers */}
            {dayNames.map((day, index) => (
              <div
                key={index}
                className="text-center text-xs sm:text-sm font-medium text-gray-600 py-2 sm:py-3"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              const tasksForDay = getTasksForDate(day.date);
              const isInRange = isDateInRange(day.date);
              const isRangeStart = selectedRange.start && 
                day.date.getTime() === selectedRange.start.getTime();
              const isRangeEnd = selectedRange.end && 
                day.date.getTime() === selectedRange.end.getTime();

              return (
                <div
                  key={index}
                  className={`min-h-20 sm:min-h-32 border border-gray-200 rounded-lg p-1 sm:p-2 cursor-pointer transition-all hover:bg-gray-50 ${
                    !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                  } ${
                    isInRange ? 'bg-blue-50 border-blue-300' : ''
                  } ${
                    isRangeStart || isRangeEnd ? 'bg-blue-100 border-blue-400' : ''
                  }`}
                  onClick={() => handleDateClick(day.date)}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${
                    !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {tasksForDay.slice(0, 3).map((task, taskIndex) => {
                      const taskStatus = getTaskStatus(task);
                      return (
                        <div
                          key={taskIndex}
                          className={`text-xs p-1 rounded ${taskStatus.color} ${taskStatus.textColor} truncate`}
                          title={`${task.title} - ${task.boardTitle}`}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {tasksForDay.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{tasksForDay.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with selected range tasks */}
        {selectedRange.start && selectedRange.end && filteredTasks.length > 0 && (
          <div className="border-t p-3 sm:p-4 bg-gray-50 max-h-40 overflow-auto flex-shrink-0">
            <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">
              Tareas en rango seleccionado ({filteredTasks.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredTasks.slice(0, 4).map((task, index) => {
                const taskStatus = getTaskStatus(task);
                return (
                  <div
                    key={index}
                    className="bg-white p-2 rounded-lg border flex items-center space-x-2"
                  >
                    <div className={`w-3 h-3 rounded-full ${taskStatus.color} flex-shrink-0`}></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{formatDate(task.dueDate)}</span>
                        {task.assignedTo && (
                          <>
                            <User size={12} />
                            <span className="truncate">{task.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredTasks.length > 4 && (
                <div className="bg-white p-2 rounded-lg border flex items-center justify-center text-sm text-gray-600">
                  +{filteredTasks.length - 4} tareas más
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;