import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, RefreshCw, Info, Wifi, WifiOff } from 'lucide-react';
import { 
  saveFirebaseData, 
  loadFirebaseData, 
  subscribeToFirebaseChanges,
  getFirebaseStats,
  initializeFirebase,
  getFirebaseInstructions
} from './utils/firebaseStorage';
import { logCardAction, logBoardAction, AUDIT_ACTIONS } from './utils/audit';

const FirebaseTrello = ({ currentUser }) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [stats, setStats] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  
  // Estados para formularios
  const [showCardForm, setShowCardForm] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedOverBoard, setDraggedOverBoard] = useState(null);

  // Función para cargar datos inicial
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔥 Cargando datos iniciales desde Firebase...');
      const data = await initializeFirebase();
      
      setBoards(data.boards || []);
      setCurrentVersion(data.version || 0);
      setConnectionStatus('connected');
      
      // Cargar estadísticas
      const statsData = await getFirebaseStats();
      setStats(statsData);
      
      console.log('✅ Datos iniciales cargados correctamente');
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
      setError('Error conectando con Firebase. Revisa tu conexión a internet.');
      setConnectionStatus('error');
    }
    
    setLoading(false);
  }, []);

  // Función para guardar datos
  const saveData = useCallback(async (newBoards) => {
    try {
      const dataToSave = {
        boards: newBoards,
        version: currentVersion + 1
      };
      
      const success = await saveFirebaseData(dataToSave, currentUser?.username || 'Usuario');
      if (success) {
        setCurrentVersion(prev => prev + 1);
        setLastSaved(new Date().toLocaleTimeString());
        
        // Actualizar estadísticas
        const statsData = await getFirebaseStats();
        setStats(statsData);
        
        console.log('💾 Datos guardados exitosamente en Firebase');
        return true;
      } else {
        throw new Error('Error guardando datos');
      }
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      setError('Error guardando cambios. Intenta de nuevo.');
      return false;
    }
  }, [currentUser, currentVersion]);

  // Función para manejar cambios en tiempo real
  const handleRealtimeUpdate = useCallback((data) => {
    console.log('🔄 Actualización en tiempo real recibida');
    setBoards(data.boards || []);
    setCurrentVersion(data.version || 0);
    setConnectionStatus('connected');
    setError(null);
    
    // Actualizar estadísticas sin hacer llamada adicional
    if (data.boards) {
      setStats({
        version: data.version || 0,
        lastUpdatedBy: data.lastUpdatedBy || 'Desconocido',
        lastUpdated: data.lastUpdated || 'Nunca',
        totalBoards: data.boards.length,
        totalCards: data.boards.reduce((sum, board) => sum + board.cards.length, 0),
        timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Ahora'
      });
    }
  }, []);

  // Inicialización y listener de cambios
  useEffect(() => {
    setMounted(true);
    loadInitialData();

    // Configurar listener para cambios en tiempo real
    const unsubscribe = subscribeToFirebaseChanges(handleRealtimeUpdate);

    // Cleanup al desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [loadInitialData, handleRealtimeUpdate]);

  // Función para agregar nueva tarjeta
  const addCard = async (boardId) => {
    if (!newCardTitle.trim()) return;

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
    
    // Guardar en Firebase
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
  };

  // Función para eliminar tarjeta
  const deleteCard = async (boardId, cardId) => {
    const board = boards.find(b => b.id === boardId);
    const card = board?.cards.find(c => c.id === cardId);

    const newBoards = boards.map(board =>
      board.id === boardId
        ? { ...board, cards: board.cards.filter(c => c.id !== cardId) }
        : board
    );

    // Actualizar estado local inmediatamente
    setBoards(newBoards);
    
    // Guardar en Firebase
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
      
      // Guardar en Firebase
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
    }
    setDraggedCard(null);
  };

  // Función para reconectar manualmente
  const handleReconnect = () => {
    setError(null);
    loadInitialData();
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">🔥 Conectando con Firebase...</div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🔥 Tablero Firebase - Real Time
              </h1>
              <p className="text-gray-600">Sincronización automática entre todas las computadoras</p>
              <div className="flex items-center space-x-4 mt-2">
                {/* Status de conexión */}
                <div className={`flex items-center space-x-1 text-sm ${
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {connectionStatus === 'connected' ? <Wifi size={16} /> : <WifiOff size={16} />}
                  <span>
                    {connectionStatus === 'connected' ? 'Conectado' : 
                     connectionStatus === 'error' ? 'Error de conexión' : 'Conectando...'}
                  </span>
                </div>
                
                <div className="text-sm text-blue-600">
                  ✅ Versión: {currentVersion} | Por: {stats?.lastUpdatedBy || 'Sistema'}
                </div>
                
                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Última acción: {lastSaved}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Botón de instrucciones */}
              <button
                onClick={() => setShowInstructions(true)}
                className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                title="Ver instrucciones"
              >
                <Info size={16} />
                <span className="hidden sm:inline">Instrucciones</span>
              </button>

              {/* Botón de reconectar si hay error */}
              {connectionStatus === 'error' && (
                <button
                  onClick={handleReconnect}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  title="Intentar reconectar"
                >
                  <RefreshCw size={16} />
                  <span>Reconectar</span>
                </button>
              )}
              
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
              <div className={`${board.color} p-4`}>
                <div className="flex justify-between items-center">
                  <h2 className="text-white font-semibold text-lg">{board.title}</h2>
                  <span className="bg-white bg-opacity-30 text-white px-2 py-1 rounded-full text-sm">
                    {board.cards.length}
                  </span>
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
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-2">🔥 Estadísticas Firebase en Tiempo Real</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">{stats.totalBoards}</div>
                <div className="text-gray-600">Tableros</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{stats.totalCards}</div>
                <div className="text-gray-600">Tarjetas</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">v{stats.version}</div>
                <div className="text-gray-600">Versión</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">{stats.lastUpdatedBy}</div>
                <div className="text-gray-600">Último usuario</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🔥 Firebase - Tablero Real</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
              {getFirebaseInstructions()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseTrello;