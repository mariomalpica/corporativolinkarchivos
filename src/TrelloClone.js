import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2, Calendar, User, Settings, Mail, Clock, Activity } from 'lucide-react';
import config from './config';

const TrelloClone = () => {
  // Funciones para persistencia de datos
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  };

  const loadFromLocalStorage = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error cargando de localStorage:', error);
      return defaultValue;
    }
  };

  // Estados principales con datos persistidos
  const [currentUser, setCurrentUser] = useState(() => loadFromLocalStorage('trello-currentUser', ''));
  const [users, setUsers] = useState(() => loadFromLocalStorage('trello-users', ['Ana', 'Carlos', 'María', 'Pedro']));
  const [activityLog, setActivityLog] = useState(() => loadFromLocalStorage('trello-activityLog', []));
  const [emailConfig, setEmailConfig] = useState(() => loadFromLocalStorage('trello-emailConfig', {
    email: 'corporativolinkarchivos@gmail.com',
    password: 'M1q2w3e4r5t6y7u8i($'
  }));
  const [showSettings, setShowSettings] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  
  const [boards, setBoards] = useState(() => loadFromLocalStorage('trello-boards', [
    {
      id: 1,
      title: "Por Hacer",
      color: "bg-blue-500",
      cards: [
        { id: 1, title: "Diseñar interfaz", description: "Crear mockups de la aplicación", dueDate: "2025-08-20", assignee: "Ana", backgroundColor: "#fef3c7", reminderEmail: "", reminderDateTime: "" },
        { id: 2, title: "Configurar base de datos", description: "Configurar MongoDB", dueDate: "2025-08-22", assignee: "Carlos", backgroundColor: "#dbeafe", reminderEmail: "", reminderDateTime: "" }
      ]
    },
    {
      id: 2,
      title: "En Progreso",
      color: "bg-yellow-500",
      cards: [
        { id: 3, title: "Desarrollar API", description: "Crear endpoints REST", dueDate: "2025-08-25", assignee: "María", backgroundColor: "#fed7d7", reminderEmail: "", reminderDateTime: "" }
      ]
    },
    {
      id: 3,
      title: "Completado",
      color: "bg-green-500",
      cards: [
        { id: 4, title: "Investigación inicial", description: "Análisis de requisitos", dueDate: "2025-08-15", assignee: "Pedro", backgroundColor: "#d1fae5", reminderEmail: "", reminderDateTime: "" }
      ]
    }
  ]));

  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedOverBoard, setDraggedOverBoard] = useState(null);
  const [showCardForm, setShowCardForm] = useState(null);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Estados para formularios
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardDueDate, setNewCardDueDate] = useState('');
  const [newCardAssignee, setNewCardAssignee] = useState('');
  const [newCardBackgroundColor, setNewCardBackgroundColor] = useState('#ffffff');
  const [newCardReminderEmail, setNewCardReminderEmail] = useState('');
  const [newCardReminderDateTime, setNewCardReminderDateTime] = useState('');
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // useEffect para guardar datos en localStorage cuando cambien
  useEffect(() => {
    saveToLocalStorage('trello-boards', boards);
  }, [boards]);

  useEffect(() => {
    saveToLocalStorage('trello-users', users);
  }, [users]);

  useEffect(() => {
    saveToLocalStorage('trello-activityLog', activityLog);
  }, [activityLog]);

  useEffect(() => {
    saveToLocalStorage('trello-currentUser', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveToLocalStorage('trello-emailConfig', emailConfig);
  }, [emailConfig]);

  // Colores predefinidos para las tareas
  const cardColors = [
    { name: 'Blanco', value: '#ffffff' },
    { name: 'Amarillo', value: '#fef3c7' },
    { name: 'Azul', value: '#dbeafe' },
    { name: 'Verde', value: '#d1fae5' },
    { name: 'Rojo', value: '#fed7d7' },
    { name: 'Morado', value: '#e9d5ff' },
    { name: 'Rosa', value: '#fce7f3' },
    { name: 'Gris', value: '#f3f4f6' }
  ];

  // Función para registrar actividad
  const logActivity = (action, details) => {
    const newActivity = {
      id: Date.now(),
      user: currentUser || 'Usuario Anónimo',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLog(prev => [newActivity, ...prev].slice(0, 100)); // Mantener solo las últimas 100 actividades
  };

  // Drag and Drop handlers
  const handleDragStart = (e, card, boardId) => {
    setDraggedCard({ card, fromBoardId: boardId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, boardId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverBoard(boardId);
  };

  const handleDragLeave = () => {
    setDraggedOverBoard(null);
  };

  const handleDrop = (e, targetBoardId) => {
    e.preventDefault();
    setDraggedOverBoard(null);

    if (draggedCard && draggedCard.fromBoardId !== targetBoardId) {
      setBoards(prevBoards => {
        const newBoards = prevBoards.map(board => {
          if (board.id === draggedCard.fromBoardId) {
            return {
              ...board,
              cards: board.cards.filter(card => card.id !== draggedCard.card.id)
            };
          }
          if (board.id === targetBoardId) {
            return {
              ...board,
              cards: [...board.cards, draggedCard.card]
            };
          }
          return board;
        });
        return newBoards;
      });
    }
    setDraggedCard(null);
  };

  // Agregar nueva tarjeta
  const addCard = async (boardId) => {
    if (newCardTitle.trim()) {
      const newCard = {
        id: Date.now(),
        title: newCardTitle,
        description: newCardDescription,
        dueDate: newCardDueDate,
        assignee: newCardAssignee,
        backgroundColor: newCardBackgroundColor,
        reminderEmail: newCardReminderEmail,
        reminderDateTime: newCardReminderDateTime
      };

      setBoards(prevBoards =>
        prevBoards.map(board =>
          board.id === boardId
            ? { ...board, cards: [...board.cards, newCard] }
            : board
        )
      );

      // Registrar actividad y programar recordatorio
      const boardName = boards.find(b => b.id === boardId)?.title || 'Tablero';
      logActivity('Tarjeta creada', `"${newCardTitle}" en ${boardName}`);
      
      // Programar recordatorio si se configuró
      if (newCardReminderEmail && newCardReminderDateTime) {
        await scheduleReminder(newCardTitle, newCardReminderEmail, newCardReminderDateTime, boardName);
      }

      // Limpiar formulario
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardDueDate('');
      setNewCardAssignee('');
      setNewCardBackgroundColor('#ffffff');
      setNewCardReminderEmail('');
      setNewCardReminderDateTime('');
      setShowCardForm(null);
    }
  };

  // Agregar nueva lista/tablero
  const addBoard = () => {
    if (newBoardTitle.trim()) {
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
      const newBoard = {
        id: Date.now(),
        title: newBoardTitle,
        color: colors[Math.floor(Math.random() * colors.length)],
        cards: []
      };

      setBoards(prev => [...prev, newBoard]);
      setNewBoardTitle('');
      setShowBoardForm(false);
    }
  };

  // Eliminar tarjeta
  const deleteCard = (boardId, cardId) => {
    const board = boards.find(b => b.id === boardId);
    const card = board?.cards.find(c => c.id === cardId);
    
    setBoards(prevBoards =>
      prevBoards.map(board =>
        board.id === boardId
          ? { ...board, cards: board.cards.filter(card => card.id !== cardId) }
          : board
      )
    );
    
    // Registrar actividad
    if (card) {
      logActivity('Tarjeta eliminada', `"${card.title}" de ${board?.title}`);
    }
  };

  // Eliminar tablero
  const deleteBoard = (boardId) => {
    const board = boards.find(b => b.id === boardId);
    setBoards(prev => prev.filter(board => board.id !== boardId));
    
    // Registrar actividad
    if (board) {
      logActivity('Tablero eliminado', `"${board.title}" con ${board.cards.length} tarjetas`);
    }
  };

  // Editar tarjeta
  const updateCard = async (boardId, cardId, updatedCard) => {
    setBoards(prevBoards =>
      prevBoards.map(board =>
        board.id === boardId
          ? {
              ...board,
              cards: board.cards.map(card =>
                card.id === cardId ? { ...card, ...updatedCard } : card
              )
            }
          : board
      )
    );
    
    // Registrar actividad y programar recordatorio
    const boardName = boards.find(b => b.id === boardId)?.title || 'Tablero';
    logActivity('Tarjeta editada', `"${updatedCard.title}" en ${boardName}`);
    
    // Programar recordatorio si se configuró
    if (updatedCard.reminderEmail && updatedCard.reminderDateTime) {
      await scheduleReminder(updatedCard.title, updatedCard.reminderEmail, updatedCard.reminderDateTime, boardName);
    }
    
    setEditingCard(null);
  };

  // Agregar nuevo usuario
  const addUser = () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      setUsers(prev => [...prev, newUserName.trim()]);
      logActivity('Usuario agregado', newUserName.trim());
      setNewUserName('');
    }
  };

  // Actualizar configuración de email
  const updateEmailConfig = async (newConfig) => {
    try {
      const response = await fetch(`${config.API_URL}/email-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig)
      });
      
      if (response.ok) {
        setEmailConfig(newConfig);
        logActivity('Configuración actualizada', 'Email de recordatorios configurado');
        alert('Configuración de email guardada correctamente');
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor');
    }
  };

  // Programar recordatorio
  const scheduleReminder = async (cardTitle, reminderEmail, reminderDateTime, boardTitle) => {
    if (!reminderEmail || !reminderDateTime) return;
    
    try {
      const response = await fetch(`${config.API_URL}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardTitle,
          reminderEmail,
          reminderDateTime,
          boardTitle
        })
      });
      
      if (response.ok) {
        logActivity('Recordatorio programado', `Para "${cardTitle}" en ${reminderEmail}`);
      }
    } catch (error) {
      console.error('Error programando recordatorio:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Mi Tablero de Tareas</h1>
              <p className="text-gray-600">Organiza tus proyectos de manera eficiente</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Selector de usuario */}
              <div className="flex items-center space-x-2">
                <User className="text-gray-600" size={20} />
                <select
                  value={currentUser}
                  onChange={(e) => setCurrentUser(e.target.value)}
                  className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar usuario</option>
                  {users.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
              
              {/* Botón de configuración */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Configuración"
              >
                <Settings size={20} />
              </button>
              
              {/* Botón de bitácora */}
              <button
                onClick={() => setShowActivityLog(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Bitácora de actividades"
              >
                <Activity size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Boards Container */}
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {boards.map(board => (
            <div
              key={board.id}
              className={`flex-shrink-0 w-80 rounded-lg shadow-lg overflow-hidden ${
                draggedOverBoard === board.id ? 'ring-4 ring-blue-300' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, board.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, board.id)}
            >
              {/* Board Header */}
              <div className={`${board.color} p-4 flex justify-between items-center`}>
                <h2 className="text-white font-semibold text-lg">{board.title}</h2>
                <div className="flex space-x-2">
                  <span className="bg-white bg-opacity-30 text-white px-2 py-1 rounded-full text-sm">
                    {board.cards.length}
                  </span>
                  <button
                    onClick={() => deleteBoard(board.id)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="bg-white p-4 min-h-96 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {board.cards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card, board.id)}
                      className="rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-move group"
                      style={{ backgroundColor: card.backgroundColor || '#f9fafb' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800 flex-1">{card.title}</h3>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingCard({ ...card, boardId: board.id })}
                            className="text-gray-400 hover:text-blue-500 p-1"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteCard(board.id, card.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {card.description && (
                        <p className="text-gray-600 text-sm mb-3">{card.description}</p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex space-x-3">
                          {card.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar size={12} />
                              <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {card.assignee && (
                            <div className="flex items-center space-x-1">
                              <User size={12} />
                              <span>{card.assignee}</span>
                            </div>
                          )}
                        </div>
                        {card.reminderEmail && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Mail size={12} />
                            <Clock size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Card Form */}
                  {showCardForm === board.id ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="text"
                        placeholder="Título de la tarjeta"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <textarea
                        placeholder="Descripción (opcional)"
                        value={newCardDescription}
                        onChange={(e) => setNewCardDescription(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="2"
                      />
                      <input
                        type="date"
                        value={newCardDueDate}
                        onChange={(e) => setNewCardDueDate(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newCardAssignee}
                        onChange={(e) => setNewCardAssignee(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Asignar a...</option>
                        {users.map(user => (
                          <option key={user} value={user}>{user}</option>
                        ))}
                      </select>
                      
                      {/* Selector de color */}
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color de fondo:</label>
                        <div className="flex flex-wrap gap-2">
                          {cardColors.map(color => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setNewCardBackgroundColor(color.value)}
                              className={`w-6 h-6 rounded border-2 ${
                                newCardBackgroundColor === color.value 
                                  ? 'border-gray-800' 
                                  : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Recordatorio por email */}
                      <input
                        type="email"
                        placeholder="Email para recordatorio (opcional)"
                        value={newCardReminderEmail}
                        onChange={(e) => setNewCardReminderEmail(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="datetime-local"
                        placeholder="Fecha y hora del recordatorio"
                        value={newCardReminderDateTime}
                        onChange={(e) => setNewCardReminderDateTime(e.target.value)}
                        className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => addCard(board.id)}
                          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                        >
                          Agregar
                        </button>
                        <button
                          onClick={() => setShowCardForm(null)}
                          className="px-4 py-2 text-gray-500 hover:text-gray-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCardForm(board.id)}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus size={20} />
                      <span>Agregar tarjeta</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Board */}
          <div className="flex-shrink-0 w-80">
            {showBoardForm ? (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <input
                  type="text"
                  placeholder="Título de la lista"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={addBoard}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                  >
                    Agregar Lista
                  </button>
                  <button
                    onClick={() => setShowBoardForm(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowBoardForm(true)}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={24} />
                <span className="text-lg">Agregar lista</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Tarjeta</h3>
            <input
              type="text"
              value={editingCard.title}
              onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Título"
            />
            <textarea
              value={editingCard.description}
              onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
              placeholder="Descripción"
            />
            <input
              type="date"
              value={editingCard.dueDate}
              onChange={(e) => setEditingCard({ ...editingCard, dueDate: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={editingCard.assignee || ''}
              onChange={(e) => setEditingCard({ ...editingCard, assignee: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Asignar a...</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            
            {/* Selector de color */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de fondo:</label>
              <div className="flex flex-wrap gap-2">
                {cardColors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setEditingCard({ ...editingCard, backgroundColor: color.value })}
                    className={`w-6 h-6 rounded border-2 ${
                      (editingCard.backgroundColor || '#ffffff') === color.value 
                        ? 'border-gray-800' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            {/* Recordatorio por email */}
            <input
              type="email"
              value={editingCard.reminderEmail || ''}
              onChange={(e) => setEditingCard({ ...editingCard, reminderEmail: e.target.value })}
              className="w-full mb-3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email para recordatorio"
            />
            <input
              type="datetime-local"
              value={editingCard.reminderDateTime || ''}
              onChange={(e) => setEditingCard({ ...editingCard, reminderDateTime: e.target.value })}
              className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => updateCard(editingCard.boardId, editingCard.id, editingCard)}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingCard(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Configuración</h3>
            
            {/* Configuración de Email */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Email para Recordatorios</h4>
              <input
                type="email"
                value={emailConfig.email}
                onChange={(e) => setEmailConfig({...emailConfig, email: e.target.value})}
                className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
              />
              <input
                type="password"
                value={emailConfig.password}
                onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contraseña"
              />
              <button
                onClick={() => updateEmailConfig(emailConfig)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
            
            {/* Gestión de Usuarios */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Usuarios</h4>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nuevo usuario"
                  onKeyPress={(e) => e.key === 'Enter' && addUser()}
                />
                <button
                  onClick={addUser}
                  className="bg-green-500 text-white px-4 rounded-r hover:bg-green-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {users.map(user => (
                  <div key={user} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span>{user}</span>
                    <button
                      onClick={() => setUsers(prev => prev.filter(u => u !== user))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Bitácora */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Bitácora de Actividades</h3>
            
            {activityLog.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay actividades registradas</p>
            ) : (
              <div className="space-y-3">
                {activityLog.map(activity => (
                  <div key={activity.id} className="border-b border-gray-200 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{activity.action}</p>
                        <p className="text-gray-600 text-sm">{activity.details}</p>
                        <p className="text-xs text-gray-500">Por: {activity.user}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setShowActivityLog(false)}
              className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrelloClone;