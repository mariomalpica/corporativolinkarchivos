import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, RefreshCw, Info, Server, Edit3 } from 'lucide-react';
import { logCardAction, AUDIT_ACTIONS } from './utils/audit';
import UserSelector from './components/UserSelector';

const VercelTrello = ({ currentUser, onShowTestAPI, onShowAuditPanel, showControlPanel, setShowControlPanel }) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [stats, setStats] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Estados para formularios
  const [showCardForm, setShowCardForm] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardColor, setNewCardColor] = useState('#ffffff');
  const [newCardDueDate, setNewCardDueDate] = useState('');
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('bg-blue-500');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedOverBoard, setDraggedOverBoard] = useState(null);
  
  // Estados para edición de tarjetas
  const [editingCard, setEditingCard] = useState(null);
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardColor, setEditCardColor] = useState('#ffffff');
  const [editCardDueDate, setEditCardDueDate] = useState('');

  // API endpoint - será nuestra propia API en Vercel
  const API_URL = '/api/trello';

  // Función utilitaria para verificar si una tarjeta está vencida
  const isCardOverdue = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  // Función utilitaria para formatear fecha para display
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Vencida hace ${Math.abs(diffDays)} día(s)`;
    } else if (diffDays === 0) {
      return `Vence hoy a las ${due.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Vence mañana`;
    } else {
      return `Vence en ${diffDays} día(s)`;
    }
  };

  // Función para cargar datos desde nuestro backend
  const loadData = useCallback(async () => {
    try {
      console.log('🔄 Cargando datos desde Vercel backend...');
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          
          setBoards(data.boards || []);
          setCurrentVersion(data.version || 0);
          setConnectionStatus('connected');
          setError(null);
          
          // Calcular estadísticas
          const statsData = {
            version: data.version || 0,
            lastUpdatedBy: data.lastUpdatedBy || 'Sistema',
            lastUpdated: data.lastUpdated || 'Nunca',
            totalBoards: data.boards ? data.boards.length : 0,
            totalCards: data.boards ? data.boards.reduce((sum, board) => sum + board.cards.length, 0) : 0,
            timestamp: data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Nunca'
          };
          setStats(statsData);
          
          console.log(`✅ Datos cargados desde Vercel - Versión: ${data.version} por ${data.lastUpdatedBy}`);
          return data;
        } else {
          throw new Error(result.message || 'Respuesta inválida del servidor');
        }
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setConnectionStatus('error');
      setError(`Error de conexión: ${error.message}`);
      throw error;
    }
  }, []);

  // Función para guardar datos en nuestro backend
  const saveData = useCallback(async (newBoards) => {
    try {
      const dataToSave = {
        boards: newBoards,
        version: currentVersion + 1,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: currentUser?.username || 'Usuario'
      };
      
      console.log('💾 Guardando datos:', {
        API_URL,
        boardsCount: newBoards.length,
        totalCards: newBoards.reduce((sum, b) => sum + b.cards.length, 0),
        version: dataToSave.version
      });
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });
      
      console.log('📡 Respuesta del servidor:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCurrentVersion(prev => prev + 1);
          setLastSaved(new Date().toLocaleTimeString());
          setConnectionStatus('connected');
          setError(null);
          
          console.log(`✅ Datos guardados en Vercel - Versión: ${result.data.version} por ${result.data.lastUpdatedBy}`);
          
          // Actualizar estadísticas locales
          setStats({
            version: result.data.version,
            lastUpdatedBy: result.data.lastUpdatedBy,
            lastUpdated: result.data.lastUpdated,
            totalBoards: newBoards.length,
            totalCards: newBoards.reduce((sum, board) => sum + board.cards.length, 0),
            timestamp: new Date().toLocaleString()
          });
          
          return true;
        } else {
          throw new Error(result.message || 'Error guardando en servidor');
        }
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      setConnectionStatus('error');
      setError(`Error guardando: ${error.message}`);
      return false;
    }
  }, [currentUser, currentVersion]);

  // Auto-refresh para detectar cambios de otros usuarios
  useEffect(() => {
    if (!autoRefresh || !mounted || isPerformingAction) return;
    
    const interval = setInterval(async () => {
      // No auto-refresh si el usuario está realizando una acción
      if (isPerformingAction) {
        console.log('⏸️ Auto-refresh pausado - usuario realizando acción');
        return;
      }
      
      try {
        const data = await loadData();
        if (data && data.version > currentVersion) {
          console.log('🔄 Cambios detectados de otros usuarios en Vercel');
          // Los datos ya se actualizaron en loadData
        }
      } catch (error) {
        // Error silencioso para auto-refresh
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, mounted, currentVersion, loadData, isPerformingAction]);

  // Inicialización
  useEffect(() => {
    setMounted(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Función para actualizar manualmente
  const handleRefresh = async () => {
    console.log('🔍 handleRefresh called - manual refresh initiated');
    setError(null);
    try {
      console.log('🔍 Calling loadData...');
      await loadData();
      console.log('✅ Manual refresh completed successfully');
    } catch (error) {
      console.log('❌ Manual refresh failed:', error);
      // Error ya manejado en loadData
    }
  };

  // Función para agregar nueva tarjeta
  const addCard = async (boardId) => {
    console.log('➕ Agregando tarjeta:', { 
      boardId, 
      title: newCardTitle.trim(),
      currentBoards: boards.length,
      isPerformingAction,
      currentUser: currentUser?.username 
    });
    
    if (!newCardTitle.trim()) {
      console.log('❌ Título vacío, cancelando');
      return;
    }

    console.log('✅ Título válido, continuando...');
    setIsPerformingAction(true);
    
    try {
      const newCard = {
        id: Date.now(),
        title: newCardTitle.trim(),
        description: newCardDescription.trim(),
        backgroundColor: newCardColor,
        dueDate: newCardDueDate || null,
        createdBy: currentUser?.username || 'Usuario',
        assignedTo: currentUser?.username || 'Usuario', // Asignar al creador por defecto
        createdAt: new Date().toISOString()
      };

      console.log('✨ Nueva tarjeta creada:', newCard);

      const newBoards = boards.map(board =>
        board.id === boardId
          ? { ...board, cards: [...board.cards, newCard] }
          : board
      );

      console.log('📊 Boards actualizados:', { 
        originalBoardsCount: boards.length,
        newBoardsCount: newBoards.length,
        targetBoardCards: newBoards.find(b => b.id === boardId)?.cards.length
      });

      // Actualizar estado local inmediatamente para UX
      console.log('🔄 Actualizando estado local...');
      setBoards(newBoards);
      
      // Guardar en servidor
      console.log('💾 Guardando en servidor...');
      const success = await saveData(newBoards);
      console.log('✅ Resultado guardado:', success);
      
      if (!success) {
        console.log('❌ Error al guardar, revirtiendo...');
        setBoards(boards);
        return;
      }

      // Registrar en auditoría
      const boardName = boards.find(b => b.id === boardId)?.title || 'Tablero';
      logCardAction(
        currentUser,
        AUDIT_ACTIONS.CREATE_CARD,
        newCardTitle,
        boardName,
        newCard.id,
        boardId
      );

      // Limpiar formulario
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardColor('#ffffff');
      setNewCardDueDate('');
      setShowCardForm(null);
    } finally {
      // Reactivar auto-refresh después de 2 segundos
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Función para actualizar usuario asignado a una tarjeta
  const updateCardAssignment = async (boardId, cardId, newAssignedTo) => {
    console.log('👤 Actualizando asignación:', { boardId, cardId, newAssignedTo });
    setIsPerformingAction(true);
    
    try {
      const newBoards = boards.map(board => {
        if (board.id === boardId) {
          return {
            ...board,
            cards: board.cards.map(card => 
              card.id === cardId 
                ? { ...card, assignedTo: newAssignedTo }
                : card
            )
          };
        }
        return board;
      });

      // Actualizar estado local
      setBoards(newBoards);
      
      // Guardar en servidor
      const success = await saveData(newBoards);
      if (!success) {
        setBoards(boards);
        return;
      }

      // Registrar en auditoría
      const board = boards.find(b => b.id === boardId);
      const card = board?.cards.find(c => c.id === cardId);
      if (card && board) {
        logCardAction(
          currentUser,
          AUDIT_ACTIONS.EDIT_CARD,
          card.title,
          board.title,
          cardId,
          boardId,
          { assignedTo: newAssignedTo }
        );
      }
    } finally {
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Función para abrir modal de edición de tarjeta
  const openEditCard = (boardId, card) => {
    console.log('✏️ Abriendo edición de tarjeta:', { boardId, cardId: card.id });
    setEditingCard({ boardId, cardId: card.id });
    setEditCardTitle(card.title);
    setEditCardDescription(card.description || '');
    setEditCardColor(card.backgroundColor || '#ffffff');
    setEditCardDueDate(card.dueDate || '');
  };

  // Función para cerrar modal de edición
  const closeEditCard = () => {
    setEditingCard(null);
    setEditCardTitle('');
    setEditCardDescription('');
    setEditCardColor('#ffffff');
    setEditCardDueDate('');
  };

  // Función para actualizar tarjeta
  const updateCard = async (boardId, cardId, updates) => {
    console.log('📝 Actualizando tarjeta:', { boardId, cardId, updates });
    setIsPerformingAction(true);
    
    try {
      const newBoards = boards.map(board => {
        if (board.id === boardId) {
          return {
            ...board,
            cards: board.cards.map(card => 
              card.id === cardId 
                ? { ...card, ...updates }
                : card
            )
          };
        }
        return board;
      });

      // Actualizar estado local
      setBoards(newBoards);
      
      // Guardar en servidor
      const success = await saveData(newBoards);
      if (!success) {
        setBoards(boards);
        return false;
      }

      // Registrar en auditoría
      const board = boards.find(b => b.id === boardId);
      const card = board?.cards.find(c => c.id === cardId);
      if (card && board) {
        logCardAction(
          currentUser,
          AUDIT_ACTIONS.EDIT_CARD,
          card.title,
          board.title,
          cardId,
          boardId,
          updates
        );
      }

      return true;
    } finally {
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Función para guardar cambios de edición
  const saveCardEdit = async () => {
    if (!editingCard || !editCardTitle.trim()) return;

    const updates = {
      title: editCardTitle,
      description: editCardDescription,
      backgroundColor: editCardColor,
      dueDate: editCardDueDate || null
    };

    const success = await updateCard(editingCard.boardId, editingCard.cardId, updates);
    if (success) {
      closeEditCard();
    }
  };

  // Función para eliminar tarjeta
  const deleteCard = async (boardId, cardId) => {
    console.log('🗑️ Eliminando tarjeta:', { boardId, cardId });
    setIsPerformingAction(true);
    
    try {
      const board = boards.find(b => b.id === boardId);
      const card = board?.cards.find(c => c.id === cardId);

      const newBoards = boards.map(board =>
        board.id === boardId
          ? { ...board, cards: board.cards.filter(c => c.id !== cardId) }
          : board
      );

      // Actualizar estado local inmediatamente
      setBoards(newBoards);
      
      // Guardar en servidor
      const success = await saveData(newBoards);
      if (!success) {
        // Si falla, revertir
        setBoards(boards);
        return;
      }

      // Registrar en auditoría
      if (card && board) {
        logCardAction(
          currentUser,
          AUDIT_ACTIONS.DELETE_CARD,
          card.title,
          board.title,
          cardId,
          boardId
        );
      }
    } finally {
      // Reactivar auto-refresh después de 2 segundos
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Drag and Drop functions
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

    if (!draggedCard) {
      return;
    }

    console.log('🎯 Drag & Drop ejecutado:', { 
      fromBoard: draggedCard.fromBoardId, 
      toBoard: targetBoardId,
      sameBoardReorder: draggedCard.fromBoardId === targetBoardId
    });

    setIsPerformingAction(true);
    
    try {
      const fromBoard = boards.find(b => b.id === draggedCard.fromBoardId);
      const toBoard = boards.find(b => b.id === targetBoardId);

      let newBoards;

      // Si es el mismo tablero (reordenamiento), insertar al principio para efecto visual
      if (draggedCard.fromBoardId === targetBoardId) {
        console.log('🔄 Reordenando en mismo tablero');
        newBoards = boards.map(board => {
          if (board.id === targetBoardId) {
            const filteredCards = board.cards.filter(c => c.id !== draggedCard.card.id);
            return {
              ...board,
              cards: [draggedCard.card, ...filteredCards] // Agregar al PRINCIPIO para efecto visual
            };
          }
          return board;
        });
      } else {
        // Movimiento entre tableros diferentes
        console.log('🔄 Moviendo entre tableros');
        newBoards = boards.map(board => {
          if (board.id === draggedCard.fromBoardId) {
            return {
              ...board,
              cards: board.cards.filter(c => c.id !== draggedCard.card.id)
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
      }

      // Actualizar estado local
      setBoards(newBoards);
      
      // Guardar en servidor
      const success = await saveData(newBoards);
      if (!success) {
        // Revertir si falla
        setBoards(boards);
        setDraggedCard(null);
        return;
      }

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
          fromBoardId: draggedCard.fromBoardId,
          action: draggedCard.fromBoardId === targetBoardId ? 'reorder' : 'move'
        }
      );
    } catch (error) {
      console.error('❌ Error en drag & drop:', error);
      setBoards(boards);
    } finally {
      // Reactivar auto-refresh después de 2 segundos
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
    
    setDraggedCard(null);
  };

  // Función para agregar nuevo tablero/columna
  const addBoard = async () => {
    console.log('🔍 addBoard called with title:', newBoardTitle);
    if (!newBoardTitle.trim()) {
      console.log('❌ Empty title, returning');
      return;
    }

    console.log('🔍 Setting isPerformingAction to true');
    setIsPerformingAction(true);
    
    try {
      const newBoard = {
        id: Date.now(),
        title: newBoardTitle.trim(),
        color: newBoardColor,
        cards: []
      };

      const newBoards = [...boards, newBoard];
      console.log('🔍 New board created:', newBoard);
      console.log('🔍 New boards array:', newBoards);

      // Actualizar estado local inmediatamente
      setBoards(newBoards);
      console.log('🔍 Local state updated');
      
      // Guardar en servidor
      console.log('🔍 Saving to server...');
      const success = await saveData(newBoards);
      console.log('🔍 Save result:', success);
      if (!success) {
        // Si falla, revertir cambio local
        setBoards(boards);
        return;
      }

      // Registrar en auditoría
      console.log('🔍 Registrando creación de tablero:', newBoardTitle);
      logCardAction(
        currentUser,
        AUDIT_ACTIONS.CREATE_BOARD,
        `Nuevo tablero: ${newBoardTitle}`,
        'Sistema',
        newBoard.id,
        0, // boardId 0 para tableros
        { boardTitle: newBoardTitle }
      );

      // Limpiar formulario
      setNewBoardTitle('');
      setShowBoardForm(false);
      console.log('🔍 Form cleared and hidden');
    } finally {
      // Reactivar auto-refresh después de 2 segundos
      console.log('🔍 Setting timeout to reset isPerformingAction');
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Función para eliminar tablero/columna
  const deleteBoard = async (boardId) => {
    console.log('🔍 deleteBoard called with boardId:', boardId);
    const boardToDelete = boards.find(b => b.id === boardId);
    console.log('🔍 Board to delete:', boardToDelete);
    if (!boardToDelete) {
      console.log('❌ Board not found');
      return;
    }

    // Confirmación para evitar eliminaciones accidentales
    const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar el tablero "${boardToDelete.title}" y todas sus tarjetas?`);
    console.log('🔍 User confirmation:', confirmed);
    if (!confirmed) {
      return;
    }

    setIsPerformingAction(true);
    
    try {
      const newBoards = boards.filter(board => board.id !== boardId);

      // Actualizar estado local inmediatamente
      setBoards(newBoards);
      
      // Guardar en servidor
      const success = await saveData(newBoards);
      if (!success) {
        // Si falla, revertir
        setBoards(boards);
        return;
      }

      // Registrar en auditoría
      console.log('🔍 Registrando eliminación de tablero:', boardToDelete.title);
      logCardAction(
        currentUser,
        AUDIT_ACTIONS.DELETE_BOARD,
        `Tablero eliminado: ${boardToDelete.title}`,
        'Sistema',
        boardId,
        0,
        { boardTitle: boardToDelete.title, cardCount: boardToDelete.cards.length }
      );
    } finally {
      // Reactivar auto-refresh después de 2 segundos
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">🚀 Conectando con backend Vercel...</div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
      </div>
    );
  }

  const getInstructions = () => `
🚀 TABLERO COMPARTIDO CON BACKEND VERCEL

✅ CÓMO FUNCIONA:
   - Backend propio ejecutándose en Vercel
   - Base de datos en memoria del servidor
   - Actualización automática cada 3 segundos
   - Control total del servidor

🧪 CÓMO PROBAR:
1. Abre esta app en tu computadora
2. Pide a otra persona que la abra desde otra computadora
3. Cualquiera crea/mueve/elimina una tarjeta
4. En máximo 3 segundos aparece en todas las pantallas
5. También puedes hacer clic en "Actualizar" para sincronizar inmediatamente

📱 FUNCIONA ENTRE:
   ✓ Diferentes computadoras en todo el mundo
   ✓ Móviles y escritorio
   ✓ Todos los navegadores
   ✓ Sin dependencias de APIs externas

🔄 AUTO-REFRESH: ${autoRefresh ? 'ACTIVADO (3s)' : 'DESACTIVADO'}

🚀 TECNOLOGÍA: 
   - Vercel Serverless Functions (backend propio)
   - Sin APIs externas falsas
   - Control total del servidor
`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-800 text-sm">
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* Boards */}
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
              <div className={`${board.color} p-4 group/header`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-white font-semibold text-lg">{board.title}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="bg-white bg-opacity-30 text-white px-2 py-1 rounded-full text-sm">
                      {board.cards.length}
                    </span>
                    <button
                      onClick={() => deleteBoard(board.id)}
                      className="text-white hover:text-red-200 opacity-0 group-hover/header:opacity-100 transition-opacity p-1"
                      title="Eliminar tablero"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="bg-white p-4 min-h-80 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {board.cards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card, board.id)}
                      className="rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow cursor-move group"
                      style={{ 
                        backgroundColor: isCardOverdue(card.dueDate) 
                          ? '#fecaca' // Rojo claro para tarjetas vencidas
                          : card.backgroundColor || '#f9fafb' 
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800 flex-1">{card.title}</h3>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditCard(board.id, card);
                            }}
                            className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Editar tarjeta"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              console.log('🗑️ Click en eliminar detectado');
                              deleteCard(board.id, card.id);
                            }}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar tarjeta"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {card.description && (
                        <p className="text-gray-600 text-sm mb-2">{card.description}</p>
                      )}

                      {card.dueDate && (
                        <div className={`text-xs px-2 py-1 rounded mb-2 ${
                          isCardOverdue(card.dueDate) 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          📅 {formatDueDate(card.dueDate)}
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {card.createdBy && (
                            <div>Por: {card.createdBy}</div>
                          )}
                        </div>
                        
                        <UserSelector
                          assignedTo={card.assignedTo}
                          onAssignUser={(userId) => updateCardAssignment(board.id, card.id, userId)}
                          currentUser={currentUser}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Card Form */}
                  {showCardForm === board.id ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3">
                      <input
                        type="text"
                        placeholder="Título de la tarjeta"
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded"
                        autoFocus
                      />
                      <textarea
                        placeholder="Descripción (opcional)"
                        value={newCardDescription}
                        onChange={(e) => setNewCardDescription(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded resize-none"
                        rows="2"
                      />
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha y hora de entrega (opcional)
                        </label>
                        <input
                          type="datetime-local"
                          value={newCardDueDate}
                          onChange={(e) => setNewCardDueDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color de fondo
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {[
                            '#ffffff', '#f0f9ff', '#ecfdf5', '#fefce8', '#fef2f2',
                            '#f3f4f6', '#dbeafe', '#dcfce7', '#fef3c7', '#fecaca',
                            '#e5e7eb', '#93c5fd', '#86efac', '#fcd34d', '#f87171',
                            '#6b7280', '#3b82f6', '#22c55e', '#eab308', '#ef4444'
                          ].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewCardColor(color)}
                              className={`w-6 h-6 rounded border ${
                                newCardColor === color ? 'border-gray-400 border-2' : 'border-gray-200'
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            console.log('➕ Click en agregar detectado:', { 
                              boardId: board.id, 
                              title: newCardTitle,
                              titleLength: newCardTitle?.length,
                              disabled: !newCardTitle.trim(),
                              event: e.type
                            });
                            console.log('📝 Ejecutando addCard...');
                            addCard(board.id);
                          }}
                          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600"
                          disabled={!newCardTitle.trim()}
                        >
                          Agregar
                        </button>
                        <button
                          onClick={() => setShowCardForm(null)}
                          className="px-3 py-2 text-gray-500 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCardForm(board.id)}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center space-x-2"
                    >
                      <Plus size={20} />
                      <span>Agregar tarjeta</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add New Board */}
          {showBoardForm ? (
            <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold mb-3 text-gray-800">📋 Nuevo Tablero</h3>
              <input
                type="text"
                placeholder="Nombre del tablero"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="w-full mb-3 p-2 border border-gray-300 rounded"
                autoFocus
              />
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Color:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    'bg-blue-500',
                    'bg-green-500', 
                    'bg-yellow-500',
                    'bg-red-500',
                    'bg-purple-500',
                    'bg-pink-500',
                    'bg-indigo-500',
                    'bg-gray-500'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewBoardColor(color)}
                      className={`h-8 ${color} rounded ${
                        newBoardColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={addBoard}
                  className="flex-1 bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600"
                  disabled={!newBoardTitle.trim()}
                >
                  ➕ Crear Tablero
                </button>
                <button
                  onClick={() => setShowBoardForm(false)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-80">
              <button
                onClick={() => setShowBoardForm(true)}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50"
              >
                <Plus size={32} />
                <span className="font-medium">Agregar Tablero</span>
              </button>
            </div>
          )}
        </div>


      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">✏️ Editar Tarjeta</h3>
              <button
                onClick={closeEditCard}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={editCardTitle}
                  onChange={(e) => setEditCardTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Título de la tarjeta"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editCardDescription}
                  onChange={(e) => setEditCardDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded h-20 resize-none"
                  placeholder="Descripción opcional"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y hora de entrega (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={editCardDueDate}
                  onChange={(e) => setEditCardDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color de fondo
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    '#ffffff', '#f0f9ff', '#ecfdf5', '#fefce8', '#fef2f2',
                    '#f3f4f6', '#dbeafe', '#dcfce7', '#fef3c7', '#fecaca',
                    '#e5e7eb', '#93c5fd', '#86efac', '#fcd34d', '#f87171',
                    '#6b7280', '#3b82f6', '#22c55e', '#eab308', '#ef4444'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setEditCardColor(color)}
                      className={`w-8 h-8 rounded border-2 ${
                        editCardColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  onClick={saveCardEdit}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                  disabled={!editCardTitle.trim()}
                >
                  💾 Guardar
                </button>
                <button
                  onClick={closeEditCard}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🚀 Backend Vercel Real</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
              {getInstructions()}
            </pre>
          </div>
        </div>
      )}

      {/* Control Panel Modal */}
      {showControlPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span>Panel de Control</span>
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    {connectionStatus === 'connected' ? 'Sistema operativo' : 
                     connectionStatus === 'error' ? 'Error de conexión' : 'Conectando...'}
                  </div>
                  <button
                    onClick={() => setShowControlPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* Información del sistema */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Server size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Versión</div>
                      <div className="text-xl font-bold text-gray-900">v{currentVersion}</div>
                      <div className="text-xs text-gray-500">Por {stats?.lastUpdatedBy || 'Sistema'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isPerformingAction ? 'bg-orange-100 border-orange-200' : autoRefresh ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'
                    }`}>
                      <RefreshCw size={20} className={`${
                        isPerformingAction ? 'text-orange-600' : autoRefresh ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Auto-sync</div>
                      <div className={`text-xl font-bold ${
                        isPerformingAction ? 'text-orange-600' : autoRefresh ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {isPerformingAction ? 'PAUSADO' : autoRefresh ? 'ACTIVO' : 'OFF'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isPerformingAction ? 'Procesando...' : autoRefresh ? 'Cada 3 segundos' : 'Manual'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-xl">👤</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Usuario</div>
                      <div className="text-xl font-bold text-gray-900 truncate max-w-32">
                        {currentUser?.username || 'Usuario'}
                      </div>
                      {lastSaved && (
                        <div className="text-xs text-gray-500">Último: {lastSaved}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Controles de acción */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Controles de Sistema</h4>
                <div className="flex flex-wrap gap-3 justify-center">
                  {/* Botón principal de actualizar */}
                  <button
                    onClick={handleRefresh}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 transform hover:scale-105"
                    title="Actualizar datos ahora"
                  >
                    <RefreshCw size={18} />
                    <span className="font-medium">Actualizar</span>
                  </button>
                  
                  {/* Toggle auto-refresh */}
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      autoRefresh 
                        ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                    }`}
                    title="Activar/Desactivar actualización automática"
                  >
                    <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Auto-sync</span>
                  </button>

                  {/* Botón de instrucciones */}
                  <button
                    onClick={() => {
                      setShowControlPanel(false);
                      setShowInstructions(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Ver instrucciones"
                  >
                    <Info size={18} />
                    <span className="font-medium">Ayuda</span>
                  </button>

                  {/* Botón de diagnóstico de API */}
                  {onShowTestAPI && (
                    <button
                      onClick={() => {
                        setShowControlPanel(false);
                        onShowTestAPI();
                      }}
                      className="flex items-center space-x-2 px-4 py-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200"
                      title="Diagnosticar API"
                    >
                      <RefreshCw size={18} />
                      <span className="font-medium">Test API</span>
                    </button>
                  )}

                  {/* Botón de auditoría */}
                  {onShowAuditPanel && (
                    <button
                      onClick={() => {
                        setShowControlPanel(false);
                        onShowAuditPanel();
                      }}
                      className="flex items-center space-x-2 px-4 py-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200"
                      title="Ver auditoría"
                    >
                      <RefreshCw size={18} />
                      <span className="font-medium">Auditoría</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VercelTrello;