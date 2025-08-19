import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Trash2, RefreshCw, Edit3, Lock, Unlock, Mail } from 'lucide-react';
import UserSelector from './components/UserSelector';
import CardLockModal from './components/CardLockModal';
import SendEmailModal from './components/SendEmailModal';
import { getTitleConfig } from './utils/settings';
import { getCurrentWorkspaceId, getWorkspaceById, updateWorkspace } from './utils/workspaces';
import { addCardToTrash, cleanupExpiredCards } from './utils/trash';
import { isCardLocked, canUserEditCard } from './utils/cardLock';

const VercelTrelloSimple = ({ currentUser, onBoardsUpdate, searchTerm, onImportBoards }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [error, setError] = useState(null);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  
  // Estados para formularios
  const [showCardForm, setShowCardForm] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardColor, setNewCardColor] = useState('#ffffff');
  const [newCardDueDate, setNewCardDueDate] = useState('');
  const [newCardAssignedTo, setNewCardAssignedTo] = useState('');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedOverBoard, setDraggedOverBoard] = useState(null);
  const [draggedOverCard, setDraggedOverCard] = useState(null);
  const [dropPosition, setDropPosition] = useState('after');
  
  // Estados para edición de tarjetas
  const [editingCard, setEditingCard] = useState(null);
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardColor, setEditCardColor] = useState('#ffffff');
  const [editCardDueDate, setEditCardDueDate] = useState('');
  const [editCardAssignedTo, setEditCardAssignedTo] = useState('');
  
  // Estados para bloqueo de tarjetas
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockModalCard, setLockModalCard] = useState(null);
  const [lockModalMode, setLockModalMode] = useState('lock'); // 'lock' | 'unlock'
  
  // Estados para tableros
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('bg-blue-500');
  const [editingBoard, setEditingBoard] = useState(null);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  
  // Estado para la configuración del título
  const [titleConfig, setTitleConfig] = useState(getTitleConfig());
  
  // Estados para email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailCard, setEmailCard] = useState(null);
  const [emailBoardTitle, setEmailBoardTitle] = useState('');

  const API_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api/trello' 
    : '/api/trello';

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

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      console.log('🔄 Cargando datos del workspace...');
      
      // Cargar datos del workspace actual
      const currentWorkspaceId = getCurrentWorkspaceId();
      const workspace = getWorkspaceById(currentWorkspaceId);
      
      if (workspace) {
        setBoards(workspace.boards || []);
        setCurrentVersion(0);
        setError(null);
        console.log(`✅ Datos cargados del workspace: ${workspace.name}`);
        return { boards: workspace.boards || [], version: 0 };
      } else {
        throw new Error('Workspace no encontrado');
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError(`Error cargando workspace: ${error.message}`);
      throw error;
    }
  }, []);

  // Función para guardar datos
  const saveData = useCallback(async (newBoards) => {
    try {
      console.log('💾 Guardando datos en workspace...');
      
      // Obtener workspace actual y actualizar sus boards
      const currentWorkspaceId = getCurrentWorkspaceId();
      const updatedWorkspace = updateWorkspace(currentWorkspaceId, {
        boards: newBoards,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: currentUser?.username || 'Usuario'
      });
      
      if (updatedWorkspace) {
        setCurrentVersion(prev => prev + 1);
        setError(null);
        console.log(`✅ Datos guardados en workspace: ${updatedWorkspace.name}`);
        return true;
      } else {
        throw new Error('Error actualizando workspace');
      }
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
      setError(`Error guardando: ${error.message}`);
      return false;
    }
  }, [currentUser, currentVersion]);

  // Inicialización
  useEffect(() => {
    setMounted(true);
    loadData().finally(() => setLoading(false));
    
    // Limpiar tarjetas expiradas al cargar
    cleanupExpiredCards();
  }, [loadData]);

  // Actualizar datos en el componente padre cuando cambien los boards
  useEffect(() => {
    if (onBoardsUpdate && boards.length > 0) {
      onBoardsUpdate(boards);
    }
  }, [boards, onBoardsUpdate]);

  // Función para manejar la importación de boards desde Excel
  const handleImportedBoards = useCallback(async (importedBoards) => {
    try {
      const newBoards = [...boards, ...importedBoards];
      setBoards(newBoards);
      const success = await saveData(newBoards);
      if (!success) {
        setBoards(boards); // Revertir en caso de error
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error al importar boards:', error);
      return false;
    }
  }, [boards, saveData]);

  // Exponer la función para que el componente padre pueda llamarla
  useEffect(() => {
    window.handleBoardsImport = handleImportedBoards;
    return () => {
      delete window.handleBoardsImport;
    };
  }, [handleImportedBoards]);

  // Función para actualizar la configuración del título
  const handleTitleUpdate = (newTitleConfig) => {
    setTitleConfig(newTitleConfig);
  };

  // Exponer la función para que otros componentes puedan actualizar el título
  useEffect(() => {
    window.handleTitleUpdate = handleTitleUpdate;
    return () => {
      delete window.handleTitleUpdate;
    };
  }, []);

  // Función para manejar el cambio de workspace
  const handleWorkspaceChange = useCallback((workspace) => {
    console.log('🔄 Cambiando a workspace:', workspace.name);
    setBoards(workspace.boards || []);
    setCurrentVersion(0); // Reiniciar versión para el nuevo workspace
    setError(null);
  }, []);

  // Exponer la función para que el componente padre pueda cambiar workspace
  useEffect(() => {
    window.handleWorkspaceChange = handleWorkspaceChange;
    return () => {
      delete window.handleWorkspaceChange;
    };
  }, [handleWorkspaceChange]);

  // Filtrar boards y cards basado en el término de búsqueda
  const filteredBoards = React.useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return boards;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return boards.map(board => {
      // Filtrar tarjetas que coincidan con el término de búsqueda
      const filteredCards = board.cards.filter(card => {
        return (
          card.title.toLowerCase().includes(term) ||
          (card.description && card.description.toLowerCase().includes(term)) ||
          (card.assignedTo && card.assignedTo.toLowerCase().includes(term)) ||
          (card.createdBy && card.createdBy.toLowerCase().includes(term))
        );
      });

      // Incluir el board si:
      // 1. El nombre del board coincide con la búsqueda, O
      // 2. Tiene tarjetas que coinciden con la búsqueda
      const boardMatches = board.title.toLowerCase().includes(term);
      
      if (boardMatches || filteredCards.length > 0) {
        return {
          ...board,
          cards: boardMatches ? board.cards : filteredCards
        };
      }
      
      return null;
    }).filter(Boolean);
  }, [boards, searchTerm]);

  // Función para resaltar texto que coincide con la búsqueda
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
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
        backgroundColor: newCardColor,
        dueDate: newCardDueDate || null,
        createdBy: currentUser?.username || 'Usuario',
        assignedTo: newCardAssignedTo || currentUser?.username || 'Usuario',
        createdAt: new Date().toISOString()
      };

      const newBoards = boards.map(board =>
        board.id === boardId
          ? { ...board, cards: [...board.cards, newCard] }
          : board
      );

      setBoards(newBoards);
      const success = await saveData(newBoards);
      
      if (!success) {
        setBoards(boards);
        return;
      }

      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardColor('#ffffff');
      setNewCardDueDate('');
      setNewCardAssignedTo('');
      setShowCardForm(null);
    } finally {
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Función para manejar la eliminación con confirmación
  const handleDeleteCard = (boardId, cardId, cardTitle, cardCreatedBy) => {
    console.log('🗑️ Intentando eliminar tarjeta:', { cardId, cardTitle, cardCreatedBy, currentUser });
    
    // Verificar si el usuario puede eliminar esta tarjeta
    const { canEdit, reason } = canUserEditCard(cardId, currentUser, cardCreatedBy);
    console.log('🔒 Resultado validación:', { canEdit, reason });
    
    if (!canEdit) {
      alert('🔒 No puedes eliminar esta tarjeta porque está bloqueada. Solo el creador del bloqueo o los administradores pueden eliminarla.');
      return;
    }

    // Mostrar warning de confirmación
    const isConfirmed = window.confirm(
      `⚠️ ADVERTENCIA ⚠️\n\n¿Estás seguro de que quieres eliminar permanentemente la tarjeta:\n\n"${cardTitle}"\n\nEsta acción no se puede deshacer.`
    );
    
    if (isConfirmed) {
      deleteCard(boardId, cardId);
    }
  };

  // Función para eliminar tarjeta (enviar a papelera)
  const deleteCard = async (boardId, cardId) => {
    setIsPerformingAction(true);
    
    try {
      // Encontrar la tarjeta y el tablero
      const board = boards.find(b => b.id === boardId);
      const card = board?.cards.find(c => c.id === cardId);
      
      if (!card || !board) {
        console.error('Tarjeta o tablero no encontrado');
        return;
      }

      // Agregar a la papelera
      const currentWorkspaceId = getCurrentWorkspaceId();
      const addedToTrash = addCardToTrash(card, boardId, board.title, currentWorkspaceId);
      
      if (addedToTrash) {
        // Remover de los tableros
        const newBoards = boards.map(b =>
          b.id === boardId
            ? { ...b, cards: b.cards.filter(c => c.id !== cardId) }
            : b
        );

        setBoards(newBoards);
        const success = await saveData(newBoards);
        if (!success) {
          setBoards(boards);
        }
        
        console.log(`🗑️ Tarjeta "${card.title}" enviada a la papelera`);
      } else {
        console.error('Error al enviar tarjeta a la papelera');
      }
    } finally {
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
  };

  // Función para agregar nuevo tablero
  const addBoard = async () => {
    if (!newBoardTitle.trim()) return;

    setIsPerformingAction(true);
    
    try {
      const newBoard = {
        id: Date.now(),
        title: newBoardTitle.trim(),
        color: newBoardColor,
        cards: []
      };

      const newBoards = [...boards, newBoard];
      setBoards(newBoards);
      
      const success = await saveData(newBoards);
      if (!success) {
        setBoards(boards);
      } else {
        // Limpiar formulario
        setNewBoardTitle('');
        setNewBoardColor('bg-blue-500');
        setShowNewBoardForm(false);
        console.log(`✅ Tablero "${newBoard.title}" creado exitosamente`);
      }
    } finally {
      setTimeout(() => setIsPerformingAction(false), 1000);
    }
  };

  // Función para iniciar edición de tablero
  const startEditBoard = (board) => {
    setEditingBoard(board.id);
    setEditBoardTitle(board.title);
  };

  // Función para guardar edición de tablero
  const saveEditBoard = async () => {
    if (!editBoardTitle.trim() || !editingBoard) return;

    setIsPerformingAction(true);
    
    try {
      const newBoards = boards.map(board =>
        board.id === editingBoard
          ? { ...board, title: editBoardTitle.trim() }
          : board
      );

      setBoards(newBoards);
      const success = await saveData(newBoards);
      if (!success) {
        setBoards(boards);
      } else {
        setEditingBoard(null);
        setEditBoardTitle('');
        console.log(`✅ Tablero renombrado exitosamente`);
      }
    } finally {
      setTimeout(() => setIsPerformingAction(false), 1000);
    }
  };

  // Función para cancelar edición de tablero
  const cancelEditBoard = () => {
    setEditingBoard(null);
    setEditBoardTitle('');
  };

  // Función para abrir modal de edición de tarjeta
  const openEditCard = (boardId, card) => {
    console.log('✏️ Abriendo edición de tarjeta:', { boardId, cardId: card.id });
    
    // Verificar si el usuario puede editar esta tarjeta
    const { canEdit, reason } = canUserEditCard(card.id, currentUser, card.createdBy);
    if (!canEdit) {
      alert('🔒 No puedes editar esta tarjeta porque está bloqueada. Solo el creador del bloqueo o los administradores pueden editarla.');
      return;
    }
    
    setEditingCard({ boardId, cardId: card.id });
    setEditCardTitle(card.title);
    setEditCardDescription(card.description || '');
    setEditCardColor(card.backgroundColor || '#ffffff');
    setEditCardDueDate(card.dueDate || '');
    setEditCardAssignedTo(card.assignedTo || '');
  };

  // Función para cerrar modal de edición
  const closeEditCard = () => {
    setEditingCard(null);
    setEditCardTitle('');
    setEditCardDescription('');
    setEditCardColor('#ffffff');
    setEditCardDueDate('');
    setEditCardAssignedTo('');
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
      dueDate: editCardDueDate || null,
      assignedTo: editCardAssignedTo || null
    };

    const success = await updateCard(editingCard.boardId, editingCard.cardId, updates);
    if (success) {
      closeEditCard();
    }
  };

  // Funciones para el sistema de bloqueo de tarjetas
  const handleLockCard = (boardId, card) => {
    setLockModalCard({ boardId, card });
    setLockModalMode('lock');
    setShowLockModal(true);
  };

  const handleUnlockCard = (boardId, card) => {
    setLockModalCard({ boardId, card });
    setLockModalMode('unlock');
    setShowLockModal(true);
  };

  const handleLockToggle = async (isLocked) => {
    // La función de bloqueo/desbloqueo ya maneja el localStorage
    // Solo necesitamos actualizar la UI forzando un re-render
    setCurrentVersion(prev => prev + 1);
  };

  const closeLockModal = () => {
    setShowLockModal(false);
    setLockModalCard(null);
    setLockModalMode('lock');
  };

  // Función para manejar el envío de email
  const handleEmailCard = (card, boardTitle) => {
    setEmailCard(card);
    setEmailBoardTitle(boardTitle);
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailCard(null);
    setEmailBoardTitle('');
  };

  // Debug function - temporary
  const debugCardLock = (cardId) => {
    console.log('🐛 Debug cardLock para cardId:', cardId);
    
    // Test directo de localStorage ANTES de usar las funciones
    const locksRaw = localStorage.getItem('trello_clone_card_locks');
    const locksObj = locksRaw ? JSON.parse(locksRaw) : {};
    console.log('🐛 localStorage raw:', locksRaw);
    console.log('🐛 localStorage parsed:', locksObj);
    console.log('🐛 cardId específico en locks:', locksObj[cardId]);
    
    // Ahora test de las funciones
    const locked = isCardLocked(cardId);
    console.log('🐛 isCardLocked resultado:', locked, typeof locked);
    
    const permissions = canUserEditCard(cardId, currentUser, 'test');
    console.log('🐛 canUserEditCard:', permissions);
    
    // Test manual de la lógica
    const cardLock = locksObj[cardId];
    const manualTest = !!(cardLock && cardLock.isLocked);
    console.log('🐛 Manual test:', manualTest);
  };

  // Drag and Drop functions
  const handleDragStart = (e, card, boardId) => {
    console.log('🎯 Drag iniciado:', { cardId: card.id, fromBoard: boardId, card, currentUser });
    
    // Verificar si el usuario puede editar/mover esta tarjeta
    const { canEdit, reason } = canUserEditCard(card.id, currentUser, card.createdBy);
    console.log('🔒 Resultado validación drag:', { canEdit, reason });
    
    if (!canEdit) {
      e.preventDefault();
      console.log('🔒 Tarjeta bloqueada - No se puede mover');
      alert('🔒 No puedes mover esta tarjeta porque está bloqueada.');
      return;
    }
    
    setDraggedCard({ card, fromBoardId: boardId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, boardId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverBoard !== boardId) {
      setDraggedOverBoard(boardId);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOverBoard(null);
      setDraggedOverCard(null);
    }
  };

  const handleCardDragOver = (e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCard && draggedCard.card.id !== cardId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const cardHeight = rect.height;
      const position = y < cardHeight / 2 ? 'before' : 'after';
      
      console.log('🎯 Card drag over:', { cardId, position, y, cardHeight });
      
      setDraggedOverCard(cardId);
      setDropPosition(position);
    }
  };

  const handleCardDragLeave = (e, cardId) => {
    e.stopPropagation();
    // Solo resetear si realmente salimos de la tarjeta y es la tarjeta actual
    if (!e.currentTarget.contains(e.relatedTarget) && draggedOverCard === cardId) {
      console.log('🎯 Card drag leave:', cardId);
      setDraggedOverCard(null);
    }
  };

  const handleDrop = async (e, targetBoardId) => {
    e.preventDefault();
    setDraggedOverBoard(null);
    setDraggedOverCard(null);

    if (!draggedCard) return;

    // Verificación adicional: asegurar que la tarjeta se puede mover
    const { canEdit } = canUserEditCard(draggedCard.card.id, currentUser, draggedCard.card.createdBy);
    if (!canEdit) {
      console.log('🔒 Drop cancelado - tarjeta bloqueada');
      setDraggedCard(null);
      return;
    }

    console.log('🎯 Drop ejecutado:', { 
      fromBoard: draggedCard.fromBoardId, 
      toBoard: targetBoardId,
      dropPosition,
      draggedOverCard
    });

    setIsPerformingAction(true);
    
    try {
      let newBoards;

      if (draggedCard.fromBoardId === targetBoardId) {
        // Reordenamiento en el mismo tablero
        console.log('🔄 Reordenando en mismo tablero');
        newBoards = boards.map(board => {
          if (board.id === targetBoardId) {
            const filteredCards = board.cards.filter(c => c.id !== draggedCard.card.id);
            
            if (draggedOverCard && draggedOverCard !== draggedCard.card.id) {
              const targetIndex = filteredCards.findIndex(c => c.id === draggedOverCard);
              console.log('🎯 Reordenamiento:', { 
                targetIndex, 
                dropPosition, 
                draggedOverCard,
                filteredCardsLength: filteredCards.length
              });
              if (targetIndex >= 0) {
                const insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
                console.log('🎯 Insertando en posición:', insertIndex);
                filteredCards.splice(insertIndex, 0, draggedCard.card);
                return { ...board, cards: filteredCards };
              }
            }
            
            return { ...board, cards: [...filteredCards, draggedCard.card] };
          }
          return board;
        });
      } else {
        // Movimiento entre tableros
        console.log('🔄 Moviendo entre tableros');
        newBoards = boards.map(board => {
          if (board.id === draggedCard.fromBoardId) {
            return {
              ...board,
              cards: board.cards.filter(c => c.id !== draggedCard.card.id)
            };
          }
          if (board.id === targetBoardId) {
            if (draggedOverCard) {
              const targetIndex = board.cards.findIndex(c => c.id === draggedOverCard);
              if (targetIndex >= 0) {
                const newCards = [...board.cards];
                const insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
                newCards.splice(insertIndex, 0, draggedCard.card);
                return { ...board, cards: newCards };
              }
            }
            return { ...board, cards: [...board.cards, draggedCard.card] };
          }
          return board;
        });
      }

      setBoards(newBoards);
      const success = await saveData(newBoards);
      if (!success) {
        setBoards(boards);
      }
    } catch (error) {
      console.error('❌ Error en drag & drop:', error);
      setBoards(boards);
    } finally {
      setTimeout(() => setIsPerformingAction(false), 2000);
    }
    
    setDraggedCard(null);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">🚀 Conectando...</div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {titleConfig.visible && (
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 px-2 sm:px-0">
            {titleConfig.text}
          </h1>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-800 text-sm">⚠️ {error}</div>
          </div>
        )}

        {/* Search results indicator */}
        {searchTerm && searchTerm.trim() !== '' && (
          <div className="mb-4 px-2 sm:px-0">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-blue-800 text-sm">
                🔍 Mostrando resultados para: "<strong>{searchTerm}</strong>" 
                ({filteredBoards.length} tablero{filteredBoards.length !== 1 ? 's' : ''} encontrado{filteredBoards.length !== 1 ? 's' : ''})
              </div>
            </div>
          </div>
        )}

        {/* No results message */}
        {searchTerm && searchTerm.trim() !== '' && filteredBoards.length === 0 && (
          <div className="mb-4 px-2 sm:px-0">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-yellow-800">
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-medium mb-1">No se encontraron resultados</div>
                <div className="text-sm">Intenta con otras palabras clave o revisa la ortografía</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 lg:overflow-x-auto pb-6">
          {filteredBoards.map(board => (
            <div
              key={board.id}
              className={`w-full lg:flex-shrink-0 lg:w-80 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
                draggedOverBoard === board.id 
                  ? 'ring-4 ring-blue-300 bg-blue-50 scale-105' 
                  : 'bg-white'
              }`}
              onDragOver={(e) => handleDragOver(e, board.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, board.id)}
              style={{ minHeight: '400px' }}
            >
              {/* Board Header */}
              <div className={`${board.color} p-4`}>
                <div className="flex justify-between items-center group">
                  {editingBoard === board.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editBoardTitle}
                        onChange={(e) => setEditBoardTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEditBoard()}
                        onBlur={saveEditBoard}
                        className="bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded text-lg font-semibold flex-1 focus:outline-none focus:bg-white"
                        autoFocus
                      />
                      <button
                        onClick={saveEditBoard}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded touch-manipulation"
                        title={t('save')}
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditBoard}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded touch-manipulation"
                        title={t('cancel')}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 flex-1">
                      <h2 className="text-white font-semibold text-lg">
                        {highlightText(board.title, searchTerm)}
                      </h2>
                      <button
                        onClick={() => startEditBoard(board)}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                        title={t('edit_name')}
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                  <span className="bg-white bg-opacity-30 text-white px-2 py-1 rounded-full text-sm ml-2">
                    {board.cards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="bg-white p-3 sm:p-4 min-h-80 sm:min-h-96 max-h-80 sm:max-h-96 lg:max-h-screen overflow-y-auto">
                <div className="space-y-3">
                  {board.cards.map((card, index) => {
                    // Debug: verificar estado de bloqueo
                    const cardIsLocked = isCardLocked(card.id);
                    if (cardIsLocked) console.log('🔒 Card locked detected:', card.id, card.title);
                    
                    return (<div key={card.id} className="relative">
                      {/* Área de drop ANTES de la tarjeta */}
                      <div
                        className={`h-2 -mb-1 transition-all duration-200 ${
                          draggedOverCard === card.id && dropPosition === 'before'
                            ? 'bg-blue-100 border-t-2 border-blue-500 rounded-t'
                            : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedCard && draggedCard.card.id !== card.id) {
                            setDraggedOverCard(card.id);
                            setDropPosition('before');
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDraggedOverCard(card.id);
                          setDropPosition('before');
                          handleDrop(e, board.id);
                        }}
                      />
                      
                      <div
                        draggable={canUserEditCard(card.id, currentUser, card.createdBy).canEdit}
                        onDragStart={(e) => handleDragStart(e, card, board.id)}
                        onDragOver={(e) => handleCardDragOver(e, card.id)}
                        onDragLeave={(e) => handleCardDragLeave(e, card.id)}
                        className={`rounded-lg p-2 sm:p-3 border transition-all duration-200 group ${
                          isCardLocked(card.id) 
                            ? 'cursor-not-allowed border-red-300 bg-red-50' 
                            : 'cursor-move'
                        } ${
                          draggedOverCard === card.id 
                            ? 'border-blue-400 shadow-lg border-2' 
                            : isCardLocked(card.id) 
                              ? 'border-red-300' 
                              : 'border-gray-200 hover:shadow-md'
                        }`}
                        style={{ 
                          backgroundColor: isCardOverdue(card.dueDate) 
                            ? '#fecaca' // Rojo claro para tarjetas vencidas
                            : card.backgroundColor || '#f9fafb' 
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2 flex-1">
                            <h3 className="font-medium text-sm sm:text-base text-gray-800 flex-1 pr-2">
                              {highlightText(card.title, searchTerm)}
                            </h3>
                            {isCardLocked(card.id) && (
                              <Lock size={14} className="text-red-500 flex-shrink-0" title="Tarjeta bloqueada" />
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {/* Botón de bloqueo/desbloqueo */}
                            {isCardLocked(card.id) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlockCard(board.id, card);
                                }}
                                className="text-gray-400 hover:text-green-500 opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity p-1 rounded touch-manipulation"
                                title="Desbloquear tarjeta"
                              >
                                <Unlock size={14} className="sm:w-3.5 sm:h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockCard(board.id, card);
                                }}
                                className="text-gray-400 hover:text-red-500 opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity p-1 rounded touch-manipulation"
                                title="Bloquear tarjeta"
                              >
                                <Lock size={14} className="sm:w-3.5 sm:h-3.5" />
                              </button>
                            )}
                            {/* Botón de editar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCard(board.id, card);
                              }}
                              className="text-gray-400 hover:text-blue-500 opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity p-1 rounded touch-manipulation"
                              title={t('edit_card')}
                            >
                              <Edit3 size={14} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                            {/* Botón de email */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmailCard(card, board.title);
                              }}
                              className="text-gray-400 hover:text-blue-500 opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity p-1 rounded touch-manipulation"
                              title={t('send_email')}
                            >
                              <Mail size={14} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                            {/* Debug button - temporary */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                debugCardLock(card.id);
                              }}
                              className="text-red-400 hover:text-red-600 opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity p-1 rounded touch-manipulation"
                              title="Debug"
                            >
                              🐛
                            </button>
                          </div>
                        </div>
                        
                        {card.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {highlightText(card.description, searchTerm)}
                          </p>
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

                        <div className="flex justify-between items-end">
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500">
                              {card.createdBy && (
                                <div>Por: {highlightText(card.createdBy, searchTerm)}</div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(board.id, card.id, card.title, card.createdBy);
                              }}
                              className="text-gray-400 hover:text-red-500 opacity-0 sm:group-hover:opacity-100 sm:opacity-0 opacity-100 transition-opacity p-1 rounded touch-manipulation"
                              title={t('delete_card')}
                            >
                              <Trash2 size={14} className="sm:w-3 sm:h-3" />
                            </button>
                          </div>
                          
                          {card.assignedTo && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              👤 {highlightText(card.assignedTo, searchTerm)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Área de drop DESPUÉS de la tarjeta */}
                      <div
                        className={`h-2 -mt-1 transition-all duration-200 ${
                          draggedOverCard === card.id && dropPosition === 'after'
                            ? 'bg-blue-100 border-b-2 border-blue-500 rounded-b'
                            : ''
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedCard && draggedCard.card.id !== card.id) {
                            setDraggedOverCard(card.id);
                            setDropPosition('after');
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDraggedOverCard(card.id);
                          setDropPosition('after');
                          handleDrop(e, board.id);
                        }}
                      />
                    </div>
                    );
                  })}

                  {/* Add Card Form */}
                  {showCardForm === board.id ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-3">
                      <input
                        type="text"
                        placeholder={t('card_title')}
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded"
                        autoFocus
                      />
                      <textarea
                        placeholder={t('description_optional')}
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
{t('background_color')}
                        </label>
                        <div className="grid grid-cols-10 sm:flex sm:flex-wrap gap-1">
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
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asignar a
                        </label>
                        <UserSelector
                          assignedTo={newCardAssignedTo}
                          onAssignUser={(userId) => setNewCardAssignedTo(userId)}
                          currentUser={currentUser}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => addCard(board.id)}
                          className="w-full sm:flex-1 bg-blue-500 text-white py-2 sm:py-2 px-3 rounded hover:bg-blue-600 touch-manipulation"
                          disabled={!newCardTitle.trim()}
                        >
{t('add')}
                        </button>
                        <button
                          onClick={() => setShowCardForm(null)}
                          className="w-full sm:w-auto px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded sm:border-0 touch-manipulation"
                        >
                          <X size={16} className="mx-auto sm:mx-0" />
                          <span className="ml-2 sm:hidden">{t('cancel')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCardForm(board.id)}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center space-x-2 touch-manipulation"
                    >
                      <Plus size={18} className="sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">{t('add_card')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Add New Board Button */}
          {showNewBoardForm ? (
            <div className="w-full lg:flex-shrink-0 lg:w-80 bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">➕ Nuevo Tablero</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del tablero *
                  </label>
                  <input
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    placeholder="ej. Ideas, Pendientes, Proyecto X..."
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
{t('header_color')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
                      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'
                    ].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewBoardColor(color)}
                        className={`h-8 rounded border-2 ${
                          newBoardColor === color ? 'border-gray-400' : 'border-gray-200'
                        } ${color} hover:border-gray-400 transition-colors touch-manipulation`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={addBoard}
                  disabled={!newBoardTitle.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
{t('create')}
                </button>
                <button
                  onClick={() => {
                    setShowNewBoardForm(false);
                    setNewBoardTitle('');
                    setNewBoardColor('bg-blue-500');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
                >
{t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewBoardForm(true)}
              className="w-full lg:flex-shrink-0 lg:w-80 h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
            >
              <Plus size={48} className="mb-2" />
              <span className="text-lg font-medium">{t('add_new_board')}</span>
              <span className="text-sm">{t('create_new_board_desc')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">✏️ {t('edit_card')}</h3>
              <button
                onClick={closeEditCard}
                className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
              >
                <X size={20} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
{t('card_title')}
                </label>
                <input
                  type="text"
                  value={editCardTitle}
                  onChange={(e) => setEditCardTitle(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded text-sm sm:text-base touch-manipulation"
                  placeholder={t('card_title')}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
{t('description_optional')}
                </label>
                <textarea
                  value={editCardDescription}
                  onChange={(e) => setEditCardDescription(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded h-16 sm:h-20 resize-none text-sm sm:text-base touch-manipulation"
                  placeholder={t('description_optional')}
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
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded text-sm touch-manipulation"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
{t('background_color')}
                </label>
                <div className="grid grid-cols-8 sm:flex sm:flex-wrap gap-1 sm:gap-2">
                  {[
                    '#ffffff', '#f0f9ff', '#ecfdf5', '#fefce8', '#fef2f2',
                    '#f3f4f6', '#dbeafe', '#dcfce7', '#fef3c7', '#fecaca',
                    '#e5e7eb', '#93c5fd', '#86efac', '#fcd34d', '#f87171',
                    '#6b7280', '#3b82f6', '#22c55e', '#eab308', '#ef4444'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => setEditCardColor(color)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded border-2 touch-manipulation ${
                        editCardColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
{t('assign_to')}
                </label>
                <UserSelector
                  assignedTo={editCardAssignedTo}
                  onAssignUser={(userId) => setEditCardAssignedTo(userId)}
                  currentUser={currentUser}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-3 sm:pt-4">
                <button
                  onClick={saveCardEdit}
                  className="w-full sm:flex-1 bg-blue-500 text-white py-3 sm:py-2 px-4 rounded hover:bg-blue-600 text-sm sm:text-base touch-manipulation"
                  disabled={!editCardTitle.trim()}
                >
💾 {t('save')}
                </button>
                <button
                  onClick={closeEditCard}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded text-sm sm:text-base touch-manipulation"
                >
{t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de bloqueo/desbloqueo de tarjetas */}
      {showLockModal && lockModalCard && (
        <CardLockModal
          isOpen={showLockModal}
          onClose={closeLockModal}
          cardId={lockModalCard.card.id}
          cardTitle={lockModalCard.card.title}
          currentUser={currentUser}
          mode={lockModalMode}
          onLockToggle={handleLockToggle}
        />
      )}

      {/* Modal de envío de email */}
      {showEmailModal && emailCard && (
        <SendEmailModal
          card={emailCard}
          boardTitle={emailBoardTitle}
          onClose={closeEmailModal}
          onEmailSent={() => {
            console.log('Email enviado exitosamente');
            closeEmailModal();
          }}
        />
      )}
    </div>
  );
};

export default VercelTrelloSimple;