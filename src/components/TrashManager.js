import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2, RotateCcw, AlertTriangle, Clock, Folder, User, Calendar } from 'lucide-react';
import { 
  getDeletedCards, 
  restoreCardFromTrash, 
  deleteCardPermanently, 
  clearTrash,
  formatDeletedDate,
  getTimeUntilExpiry,
  isCardExpired,
  cleanupExpiredCards
} from '../utils/trash';
import { updateWorkspace, getCurrentWorkspaceId } from '../utils/workspaces';

const TrashManager = ({ onClose, onCardRestore }) => {
  const { t } = useTranslation();
  const [deletedCards, setDeletedCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all', 'expiring', 'workspace'
  const [sortBy, setSortBy] = useState('deletedAt'); // 'deletedAt', 'title', 'workspace'

  useEffect(() => {
    loadDeletedCards();
  }, []);

  const loadDeletedCards = () => {
    setLoading(true);
    try {
      // Primero limpiar tarjetas expiradas
      cleanupExpiredCards();
      // Luego cargar las tarjetas válidas
      const cards = getDeletedCards();
      setDeletedCards(cards);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCard = async (trashId) => {
    setLoading(true);
    try {
      const restoredData = restoreCardFromTrash(trashId);
      
      if (restoredData && onCardRestore) {
        const { card, originalBoardId, workspaceId } = restoredData;
        
        // Llamar callback para restaurar en la interfaz
        const success = await onCardRestore(card, originalBoardId, workspaceId);
        
        if (success) {
          // Recargar la lista de tarjetas eliminadas
          loadDeletedCards();
          console.log(t('card_restored_successfully', { title: card.title }));
        } else {
          console.error(t('error_restoring_card'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermanently = (trashId) => {
    const card = deletedCards.find(c => c.trashId === trashId);
    const confirmDelete = window.confirm(
      t('confirm_delete_permanently', { title: card?.title })
    );
    
    if (confirmDelete) {
      deleteCardPermanently(trashId);
      loadDeletedCards();
    }
  };

  const handleClearAllTrash = () => {
    const confirmClear = window.confirm(
      t('confirm_clear_trash')
    );
    
    if (confirmClear) {
      clearTrash();
      loadDeletedCards();
    }
  };

  const handleSelectCard = (trashId) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(trashId)) {
      newSelected.delete(trashId);
    } else {
      newSelected.add(trashId);
    }
    setSelectedCards(newSelected);
  };

  const handleBulkRestore = async () => {
    if (selectedCards.size === 0) return;
    
    setLoading(true);
    try {
      for (const trashId of selectedCards) {
        await handleRestoreCard(trashId);
      }
      setSelectedCards(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCards.size === 0) return;
    
    const confirmDelete = window.confirm(
      t('confirm_bulk_delete', { count: selectedCards.size })
    );
    
    if (confirmDelete) {
      selectedCards.forEach(trashId => {
        deleteCardPermanently(trashId);
      });
      setSelectedCards(new Set());
      loadDeletedCards();
    }
  };

  // Filtrar tarjetas
  const filteredCards = deletedCards.filter(card => {
    if (filter === 'expiring') {
      const hoursDiff = (new Date() - new Date(card.deletedAt)) / (1000 * 60 * 60);
      return (24 - hoursDiff) <= 2; // Expiran en 2 horas o menos
    }
    if (filter === 'workspace') {
      return card.workspaceId === getCurrentWorkspaceId();
    }
    return true; // 'all'
  });

  // Ordenar tarjetas
  const sortedCards = [...filteredCards].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'workspace':
        return (a.originalBoardTitle || '').localeCompare(b.originalBoardTitle || '');
      case 'deletedAt':
      default:
        return new Date(b.deletedAt) - new Date(a.deletedAt);
    }
  });

  const expiringCount = deletedCards.filter(card => {
    const hoursDiff = (new Date() - new Date(card.deletedAt)) / (1000 * 60 * 60);
    return (24 - hoursDiff) <= 2;
  }).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Trash2 className="text-gray-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('trash_bin')}</h2>
              <p className="text-sm text-gray-600">
                {t('deleted_cards_count', { count: deletedCards.length })}
                {expiringCount > 0 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    • {t('expiring_soon_count', { count: expiringCount })}
                  </span>
                )}
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

        {/* Filtros y controles */}
        <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-200 gap-4">
          <div className="flex items-center space-x-4">
            {/* Filtros */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('all_cards')}</option>
              <option value="workspace">{t('current_workspace')}</option>
              <option value="expiring">{t('expiring_soon')}</option>
            </select>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="deletedAt">{t('deletion_date')}</option>
              <option value="title">{t('name')}</option>
              <option value="workspace">{t('board')}</option>
            </select>
          </div>

          {/* Controles de selección múltiple */}
          <div className="flex items-center space-x-2">
            {selectedCards.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {t('selected_count', { count: selectedCards.size })}
                </span>
                <button
                  onClick={handleBulkRestore}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {t('restore')}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {t('delete')}
                </button>
              </>
            )}
            
            <button
              onClick={handleClearAllTrash}
              disabled={loading || deletedCards.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 touch-manipulation"
            >
              {t('empty_trash')}
            </button>
          </div>
        </div>

        {/* Lista de tarjetas */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : sortedCards.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {filter === 'all' ? t('no_cards_in_trash') : t('no_cards_match_filter')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCards.map(card => {
                const isExpired = isCardExpired(card.deletedAt);
                const timeRemaining = getTimeUntilExpiry(card.deletedAt);
                const isSelected = selectedCards.has(card.trashId);
                
                return (
                  <div
                    key={card.trashId}
                    className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
                    } ${isExpired ? 'opacity-60' : ''}`}
                  >
                    {/* Checkbox de selección */}
                    <div className="flex items-start justify-between mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectCard(card.trashId)}
                        className="mt-1 rounded border-gray-300 focus:ring-blue-500"
                      />
                      
                      {/* Indicador de expiración */}
                      <div className="flex items-center space-x-1">
                        {timeRemaining !== t('expired') && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            timeRemaining.includes('h') && parseInt(timeRemaining) <= 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Clock size={12} className="inline mr-1" />
                            {timeRemaining}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenido de la tarjeta */}
                    <div
                      className="p-3 rounded mb-3"
                      style={{ backgroundColor: card.backgroundColor || '#ffffff' }}
                    >
                      <h4 className="font-medium text-gray-800 mb-2 line-clamp-2">
                        {card.title}
                      </h4>
                      {card.description && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                          {card.description}
                        </p>
                      )}
                      
                      {/* Meta información */}
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <div className="flex items-center">
                          <Folder size={12} className="mr-1" />
                          {card.originalBoardTitle}
                        </div>
                        {card.assignedTo && (
                          <div className="flex items-center">
                            <User size={12} className="mr-1" />
                            {card.assignedTo}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información de eliminación */}
                    <div className="text-xs text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {t('deleted_date', { date: formatDeletedDate(card.deletedAt) })}
                      </div>
                      {card.createdBy && (
                        <div className="mt-1">{t('created_by', { user: card.createdBy })}</div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRestoreCard(card.trashId)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 touch-manipulation"
                      >
                        <RotateCcw size={14} className="mr-1" />
                        {t('restore')}
                      </button>
                      <button
                        onClick={() => handleDeletePermanently(card.trashId)}
                        disabled={loading}
                        className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 touch-manipulation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con información */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center text-sm text-gray-600">
            <AlertTriangle size={16} className="mr-2 text-orange-500" />
            <span>
              {t('auto_delete_warning', { count: expiringCount })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrashManager;