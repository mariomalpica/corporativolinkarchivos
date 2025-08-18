import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Trash2, RefreshCw, Info } from 'lucide-react';
import { 
  saveSimpleSharedData, 
  loadSimpleSharedData, 
  hasUpdates,
  forceRefresh,
  getStorageStats,
  initializeStorageListener,
  getInstructions
} from './utils/simpleSharedStorage';
import { logCardAction, logBoardAction, AUDIT_ACTIONS } from './utils/audit';

const SimpleTrello = ({ currentUser }) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [stats, setStats] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Estados para formularios
  const [showCardForm, setShowCardForm] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedOverBoard, setDraggedOverBoard] = useState(null);

  // Función para cargar datos
  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const data = loadSimpleSharedData();
      setBoards(data.boards || []);
      setCurrentVersion(data.version || 0);
      setStats(getStorageStats());
      console.log('📥 Datos cargados:', data);
    } catch (error) {
      console.error('Error cargando datos:', error);
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
      
      const success = saveSimpleSharedData(dataToSave, currentUser?.username || 'Usuario');
      if (success) {
        setCurrentVersion(prev => prev + 1);
        setLastSaved(new Date().toLocaleTimeString());
        setStats(getStorageStats());
        console.log('💾 Datos guardados exitosamente');
      }
      return success;
    } catch (error) {
      console.error('Error guardando datos:', error);
      return false;
    }
  }, [currentUser, currentVersion]);

  // Función para actualizar datos manualmente
  const handleRefresh = useCallback(() => {
    console.log('🔄 Actualizando datos...');
    const data = forceRefresh();
    setBoards(data.boards || []);
    setCurrentVersion(data.version || 0);
    setStats(getStorageStats());
    setLastSaved(new Date().toLocaleTimeString());
  }, []);

  // Inicialización
  useEffect(() => {
    setMounted(true);
    loadData();

    // Configurar listener para cambios automáticos
    const cleanup = initializeStorageListener((data) => {
      setBoards(data.boards || []);
      setCurrentVersion(data.version || 0);
      setStats(getStorageStats());
      console.log('🔄 Datos actualizados automáticamente');
    });

    return cleanup;
  }, [loadData]);

  // Agregar nueva tarjeta
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

    setBoards(newBoards);
    await saveData(newBoards);

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

  // Eliminar tarjeta
  const deleteCard = async (boardId, cardId) => {
    const board = boards.find(b => b.id === boardId);
    const card = board?.cards.find(c => c.id === cardId);

    const newBoards = boards.map(board =>
      board.id === boardId
        ? { ...board, cards: board.cards.filter(c => c.id !== cardId) }
        : board
    );

    setBoards(newBoards);
    await saveData(newBoards);

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

  // Drag and Drop
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

      setBoards(newBoards);
      await saveData(newBoards);

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

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">🔄 Cargando tablero compartido...</div>
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
                🌐 Tablero Compartido Simple
              </h1>
              <p className="text-gray-600">Sistema simplificado - todos ven la misma información</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="text-sm text-green-600">
                  ✅ Versión: {currentVersion} | Actualizado por: {stats?.lastUpdatedBy || 'Sistema'}
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

              {/* Botón de actualizar */}
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                title="Actualizar datos desde servidor"
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
            <h3 className="font-semibold mb-2">📊 Estadísticas del Tablero Compartido</h3>
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
              <h3 className="text-lg font-semibold">📖 Instrucciones de Uso</h3>
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

export default SimpleTrello;