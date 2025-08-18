import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, RefreshCw, Info, Wifi, WifiOff, Server } from 'lucide-react';
import { logCardAction, AUDIT_ACTIONS } from './utils/audit';

const VercelTrello = ({ currentUser }) => {
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
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('bg-blue-500');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedOverBoard, setDraggedOverBoard] = useState(null);

  // API endpoint - será nuestra propia API en Vercel
  const API_URL = '/api/trello';

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
      
      console.log('💾 Guardando datos en Vercel backend...');
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
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
    setError(null);
    try {
      await loadData();
    } catch (error) {
      // Error ya manejado en loadData
    }
  };

  // Función para agregar nueva tarjeta
  const addCard = async (boardId) => {
    if (!newCardTitle.trim()) return;

    setIsPerformingAction(true);
    
    try {
      const newCard = {
        id: Date.now(),
        title: newCardTitle.trim(),
        description: newCardDescription.trim(),
        backgroundColor: '#ffffff',
        createdBy: currentUser?.username || 'Usuario',
        createdAt: new Date().toISOString()
      };

      const newBoards = boards.map(board =>
        board.id === boardId
          ? { ...board, cards: [...board.cards, newCard] }
          : board
      );

      // Actualizar estado local inmediatamente para UX
      setBoards(newBoards);
      
      // Guardar en servidor
      const success = await saveData(newBoards);
      if (!success) {
        // Si falla, revertir cambio local
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
      setShowCardForm(null);
    } finally {
      // Reactivar auto-refresh después de 2 segundos
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Función para eliminar tarjeta
  const deleteCard = async (boardId, cardId) => {
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

    if (draggedCard && draggedCard.fromBoardId !== targetBoardId) {
      setIsPerformingAction(true);
      
      try {
        const fromBoard = boards.find(b => b.id === draggedCard.fromBoardId);
        const toBoard = boards.find(b => b.id === targetBoardId);

        const newBoards = boards.map(board => {
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
            fromBoardId: draggedCard.fromBoardId
          }
        );
      } finally {
        // Reactivar auto-refresh después de 2 segundos
        setTimeout(() => setIsPerformingAction(false), 2000);
      }
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-4 mt-2">
                {/* Status de conexión */}
                <div className={`flex items-center space-x-1 text-sm ${
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {connectionStatus === 'connected' ? <Server size={16} /> : <WifiOff size={16} />}
                  <span>
                    {connectionStatus === 'connected' ? 'Conectado' : 
                     connectionStatus === 'error' ? 'Error de conexión' : 'Conectando...'}
                  </span>
                </div>
                
                <div className="text-sm text-blue-600">
                  ✅ Versión: {currentVersion} | Por: {stats?.lastUpdatedBy || 'Sistema'}
                </div>
                
                <div className={`text-xs ${isPerformingAction ? 'text-orange-600' : 'text-gray-500'}`}>
                  🔄 Auto-refresh: {isPerformingAction ? 'PAUSADO' : autoRefresh ? '3s' : 'OFF'}
                </div>
                
                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Guardado: {lastSaved}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Toggle auto-refresh */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Activar/Desactivar actualización automática"
              >
                🔄 Auto
              </button>

              {/* Botón de instrucciones */}
              <button
                onClick={() => setShowInstructions(true)}
                className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                title="Ver instrucciones"
              >
                <Info size={16} />
                <span className="hidden sm:inline">Info</span>
              </button>

              {/* Botón de actualizar */}
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                title="Actualizar ahora"
              >
                <RefreshCw size={16} />
                <span>Actualizar</span>
              </button>
              
              {/* Info del usuario */}
              <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  👤 {currentUser?.username || 'Usuario'}
                </span>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-red-800 text-sm">
                ⚠️ {error}
              </div>
            </div>
          )}
        </div>

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
                      style={{ backgroundColor: card.backgroundColor || '#f9fafb' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800 flex-1">{card.title}</h3>
                        <button
                          onClick={() => deleteCard(board.id, card.id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {card.description && (
                        <p className="text-gray-600 text-sm mb-2">{card.description}</p>
                      )}

                      {card.createdBy && (
                        <div className="text-xs text-gray-500">
                          Por: {card.createdBy}
                        </div>
                      )}
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => addCard(board.id)}
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
    </div>
  );
};

export default VercelTrello;