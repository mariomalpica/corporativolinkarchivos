// Utilidades para manejar la papelera de reciclaje

const TRASH_KEY = 'trello_clone_trash';
const TRASH_EXPIRY_HOURS = 24;

// Obtener todas las tarjetas eliminadas
export const getDeletedCards = () => {
  try {
    const saved = localStorage.getItem(TRASH_KEY);
    if (saved) {
      const trash = JSON.parse(saved);
      // Filtrar tarjetas que no han expirado
      const validCards = trash.filter(item => !isCardExpired(item.deletedAt));
      
      // Si hay tarjetas expiradas, limpiar y guardar
      if (validCards.length !== trash.length) {
        localStorage.setItem(TRASH_KEY, JSON.stringify(validCards));
      }
      
      return validCards;
    }
  } catch (error) {
    console.error('Error loading trash:', error);
  }
  return [];
};

// Agregar tarjeta a la papelera
export const addCardToTrash = (card, boardId, boardTitle, workspaceId) => {
  try {
    const trash = getDeletedCards();
    const deletedCard = {
      ...card,
      deletedAt: new Date().toISOString(),
      originalBoardId: boardId,
      originalBoardTitle: boardTitle,
      workspaceId: workspaceId,
      trashId: generateTrashId()
    };
    
    trash.push(deletedCard);
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    return true;
  } catch (error) {
    console.error('Error adding card to trash:', error);
    return false;
  }
};

// Restaurar tarjeta desde la papelera
export const restoreCardFromTrash = (trashId) => {
  try {
    const trash = getDeletedCards();
    const cardIndex = trash.findIndex(item => item.trashId === trashId);
    
    if (cardIndex !== -1) {
      const [restoredCard] = trash.splice(cardIndex, 1);
      localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
      
      // Remover propiedades específicas de la papelera
      const { deletedAt, originalBoardId, originalBoardTitle, workspaceId, trashId: _, ...cleanCard } = restoredCard;
      
      return {
        card: cleanCard,
        originalBoardId,
        originalBoardTitle,
        workspaceId
      };
    }
  } catch (error) {
    console.error('Error restoring card from trash:', error);
  }
  return null;
};

// Eliminar permanentemente tarjeta de la papelera
export const deleteCardPermanently = (trashId) => {
  try {
    const trash = getDeletedCards();
    const filteredTrash = trash.filter(item => item.trashId !== trashId);
    localStorage.setItem(TRASH_KEY, JSON.stringify(filteredTrash));
    return true;
  } catch (error) {
    console.error('Error deleting card permanently:', error);
    return false;
  }
};

// Limpiar toda la papelera
export const clearTrash = () => {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing trash:', error);
    return false;
  }
};

// Limpiar automáticamente tarjetas expiradas
export const cleanupExpiredCards = () => {
  try {
    const trash = getDeletedCards();
    const validCards = trash.filter(item => !isCardExpired(item.deletedAt));
    
    if (validCards.length !== trash.length) {
      localStorage.setItem(TRASH_KEY, JSON.stringify(validCards));
      console.log(`🗑️ Se eliminaron ${trash.length - validCards.length} tarjetas expiradas`);
    }
    
    return trash.length - validCards.length;
  } catch (error) {
    console.error('Error cleaning up expired cards:', error);
    return 0;
  }
};

// Verificar si una tarjeta ha expirado
export const isCardExpired = (deletedAt) => {
  const deleted = new Date(deletedAt);
  const now = new Date();
  const hoursDiff = (now - deleted) / (1000 * 60 * 60);
  return hoursDiff >= TRASH_EXPIRY_HOURS;
};

// Obtener tiempo restante para una tarjeta
export const getTimeUntilExpiry = (deletedAt) => {
  const deleted = new Date(deletedAt);
  const now = new Date();
  const hoursDiff = (now - deleted) / (1000 * 60 * 60);
  const hoursRemaining = TRASH_EXPIRY_HOURS - hoursDiff;
  
  if (hoursRemaining <= 0) return 'Expirado';
  
  if (hoursRemaining >= 1) {
    return `${Math.floor(hoursRemaining)}h ${Math.floor((hoursRemaining % 1) * 60)}m`;
  } else {
    return `${Math.floor(hoursRemaining * 60)}m`;
  }
};

// Formatear fecha de eliminación
export const formatDeletedDate = (deletedAt) => {
  const date = new Date(deletedAt);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    return `Hace ${Math.floor(diffHours * 60)} minutos`;
  } else if (diffHours < 24) {
    return `Hace ${Math.floor(diffHours)} horas`;
  } else {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Generar ID único para elementos en la papelera
const generateTrashId = () => {
  return 'trash_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Obtener estadísticas de la papelera
export const getTrashStats = () => {
  const trash = getDeletedCards();
  const expiringSoon = trash.filter(item => {
    const hoursDiff = (new Date() - new Date(item.deletedAt)) / (1000 * 60 * 60);
    return (TRASH_EXPIRY_HOURS - hoursDiff) <= 2; // Expiran en 2 horas o menos
  });
  
  return {
    total: trash.length,
    expiringSoon: expiringSoon.length
  };
};