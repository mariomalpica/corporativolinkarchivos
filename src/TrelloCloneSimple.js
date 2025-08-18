import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Edit3, Trash2, Calendar, User, Settings, Mail, Clock, Activity, RefreshCw } from 'lucide-react';
import { logCardAction, logBoardAction, AUDIT_ACTIONS } from './utils/audit';
import { loadSharedData, saveSharedData, getDefaultData } from './utils/sharedStorage';

const TrelloClone = ({ currentUser }) => {
  // Estados
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [users, setUsers] = useState(['Ana', 'Carlos', 'María', 'Pedro']);
  const [emailConfig, setEmailConfig] = useState({
    email: 'corporativolinkarchivos@gmail.com',
    password: 'M1q2w3e4r5t6y7u8i($'
  });
  const [dataVersion, setDataVersion] = useState(1);
  const [lastSaved, setLastSaved] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
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

  // Funciones de localStorage simplificadas
  const saveData = useCallback((key, data) => {
    if (mounted && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn('Error saving to localStorage:', e);
      }
    }
  }, [mounted]);

  const loadData = useCallback((key, fallback) => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (e) {
        console.warn('Error loading from localStorage:', e);
        return fallback;
      }
    }
    return fallback;
  }, []);

  // Efecto de montaje y carga inicial desde servidor compartido
  useEffect(() => {
    const initializeData = async () => {
      setMounted(true);
      setLoading(true);
      
      try {
        // Cargar datos del servidor compartido
        const sharedData = await loadSharedData();
        
        if (sharedData && sharedData.boards) {
          setBoards(sharedData.boards);
          setUsers(sharedData.users || ['Ana', 'Carlos', 'María', 'Pedro']);
          setDataVersion(sharedData.version || 1);
          console.log('Datos cargados del servidor compartido');
        } else {
          // Si no hay datos, inicializar con datos por defecto
          const defaultData = getDefaultData();
          setBoards(defaultData.boards);
          setUsers(defaultData.users);
          setDataVersion(defaultData.version);
        }
      } catch (error) {
        console.warn('Error loading shared data, using defaults:', error);
        const defaultData = getDefaultData();
        setBoards(defaultData.boards);
        setUsers(defaultData.users);
      }
      
      setLoading(false);
    };

    initializeData();
  }, []);

  // Función para guardar datos en el servidor compartido
  const saveToSharedStorage = useCallback(async (newBoards, newUsers = users) => {
    if (!mounted) return;
    
    try {
      const dataToSave = {
        boards: newBoards,
        users: newUsers,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: currentUser?.username || 'Usuario',
        version: dataVersion + 1
      };
      
      const success = await saveSharedData(dataToSave);
      if (success) {
        setDataVersion(prev => prev + 1);
        setLastSaved(new Date().toLocaleTimeString());
        console.log('Datos guardados en servidor compartido');
      }
    } catch (error) {
      console.warn('Error saving to shared storage:', error);
    }
  }, [mounted, currentUser, users, dataVersion]);

  // Función para actualizar datos desde servidor compartido
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const sharedData = await loadSharedData();
      
      if (sharedData && sharedData.boards) {
        setBoards(sharedData.boards);
        setUsers(sharedData.users || users);
        setDataVersion(sharedData.version || 1);
        console.log('Datos actualizados desde servidor compartido');
      }
    } catch (error) {
      console.warn('Error refreshing data:', error);
    }
    setLoading(false);
  }, [users]);

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

  // Función para registrar actividad (mantenida para compatibilidad local)
  const logActivity = (action, details) => {
    // Ya no se usa - la auditoría se maneja con el nuevo sistema
    console.log(`[LEGACY] ${action}: ${details}`);
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

  const handleDrop = async (e, targetBoardId) => {
    e.preventDefault();
    setDraggedOverBoard(null);

    if (draggedCard && draggedCard.fromBoardId !== targetBoardId) {
      const fromBoard = boards.find(b => b.id === draggedCard.fromBoardId);
      const toBoard = boards.find(b => b.id === targetBoardId);
      
      const newBoards = boards.map(board => {
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

      setBoards(newBoards);
      
      // Guardar en servidor compartido
      await saveToSharedStorage(newBoards);

      // Registrar en auditoría
      logCardAction(
        currentUser,
        AUDIT_ACTIONS.MOVE_CARD,
        draggedCard.card.title,
        toBoard?.title || 'Tablero',
        draggedCard.card.id,
        targetBoardId,
        {
          fromBoard: fromBoard?.title,
          fromBoardId: draggedCard.fromBoardId
        }
      );
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

      const newBoards = boards.map(board =>
        board.id === boardId
          ? { ...board, cards: [...board.cards, newCard] }
          : board
      );

      setBoards(newBoards);
      
      // Guardar en servidor compartido
      await saveToSharedStorage(newBoards);

      const boardName = boards.find(b => b.id === boardId)?.title || 'Tablero';
      
      // Registrar en auditoría
      logCardAction(
        currentUser,
        AUDIT_ACTIONS.CREATE_CARD,
        newCardTitle,
        boardName,
        newCard.id,
        boardId,
        {
          description: newCardDescription,
          assignee: newCardAssignee,
          dueDate: newCardDueDate
        }
      );

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

      // Registrar en auditoría
      logBoardAction(
        currentUser,
        AUDIT_ACTIONS.CREATE_BOARD,
        newBoardTitle,
        newBoard.id
      );

      setNewBoardTitle('');
      setShowBoardForm(false);
    }
  };

  // Eliminar tarjeta
  const deleteCard = async (boardId, cardId) => {
    const board = boards.find(b => b.id === boardId);
    const card = board?.cards.find(c => c.id === cardId);
    
    const newBoards = boards.map(board =>
      board.id === boardId
        ? { ...board, cards: board.cards.filter(card => card.id !== cardId) }
        : board
    );
    
    setBoards(newBoards);
    
    // Guardar en servidor compartido
    await saveToSharedStorage(newBoards);
    
    if (card && board) {
      // Registrar en auditoría
      logCardAction(
        currentUser,
        AUDIT_ACTIONS.DELETE_CARD,
        card.title,
        board.title,
        cardId,
        boardId
      );
    }
  };

  // Eliminar tablero
  const deleteBoard = (boardId) => {
    const board = boards.find(b => b.id === boardId);
    setBoards(prev => prev.filter(board => board.id !== boardId));
    
    if (board) {
      // Registrar en auditoría
      logBoardAction(
        currentUser,
        AUDIT_ACTIONS.DELETE_BOARD,
        board.title,
        boardId,
        { cardCount: board.cards.length }
      );
    }
  };

  // Editar tarjeta
  const updateCard = (boardId, cardId, updatedCard) => {
    const originalCard = boards.find(b => b.id === boardId)?.cards.find(c => c.id === cardId);
    
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
    
    const boardName = boards.find(b => b.id === boardId)?.title || 'Tablero';
    
    // Calcular cambios para auditoría
    const changes = [];
    if (originalCard?.title !== updatedCard.title) changes.push('título');
    if (originalCard?.description !== updatedCard.description) changes.push('descripción');
    if (originalCard?.assignee !== updatedCard.assignee) changes.push('asignado');
    if (originalCard?.dueDate !== updatedCard.dueDate) changes.push('fecha límite');
    if (originalCard?.backgroundColor !== updatedCard.backgroundColor) changes.push('color');

    // Registrar en auditoría
    logCardAction(
      currentUser,
      AUDIT_ACTIONS.EDIT_CARD,
      updatedCard.title,
      boardName,
      cardId,
      boardId,
      { changes: changes.join(', ') || 'detalles menores' }
    );
    
    setEditingCard(null);
  };

  // Agregar nuevo usuario (función legacy - ahora se maneja en UserAdminPanel)
  const addUser = () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      setUsers(prev => [...prev, newUserName.trim()]);
      // Nota: La gestión de usuarios ahora se hace en el panel de administración
      setNewUserName('');
    }
  };

  // Si no está montado, mostrar loading
  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-xl text-gray-600">Cargando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Mi Tablero de Tareas</h1>
              <p className="text-gray-600">Organiza tus proyectos de manera eficiente</p>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-green-600">✅ Tablero compartido via servidor externo</p>
                {lastSaved && (
                  <p className="text-xs text-gray-500">Última sincronización: {lastSaved}</p>
                )}
                {loading && (
                  <p className="text-xs text-blue-600">🔄 Sincronizando...</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Botón de actualizar */}
              <button
                onClick={refreshData}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                title="Actualizar tablero (ver cambios de otros usuarios)"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline text-sm">Actualizar</span>
              </button>
              
              {/* Información del usuario actual */}
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <User className="text-gray-600" size={20} />
                <span className="text-gray-700 font-medium">{currentUser?.username || 'Usuario'}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentUser?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentUser?.role || 'user'}
                </span>
              </div>
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

    </div>
  );
};

export default TrelloClone;