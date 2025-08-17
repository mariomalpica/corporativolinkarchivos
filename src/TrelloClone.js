import React, { useState, useRef } from 'react';
import { Plus, X, Edit3, Trash2, Calendar, User } from 'lucide-react';

const TrelloClone = () => {
  const [boards, setBoards] = useState([
    {
      id: 1,
      title: "Por Hacer",
      color: "bg-blue-500",
      cards: [
        { id: 1, title: "Diseñar interfaz", description: "Crear mockups de la aplicación", dueDate: "2025-08-20", assignee: "Ana" },
        { id: 2, title: "Configurar base de datos", description: "Configurar MongoDB", dueDate: "2025-08-22", assignee: "Carlos" }
      ]
    },
    {
      id: 2,
      title: "En Progreso",
      color: "bg-yellow-500",
      cards: [
        { id: 3, title: "Desarrollar API", description: "Crear endpoints REST", dueDate: "2025-08-25", assignee: "María" }
      ]
    },
    {
      id: 3,
      title: "Completado",
      color: "bg-green-500",
      cards: [
        { id: 4, title: "Investigación inicial", description: "Análisis de requisitos", dueDate: "2025-08-15", assignee: "Pedro" }
      ]
    }
  ]);

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
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const dragRef = useRef(null);

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
  const addCard = (boardId) => {
    if (newCardTitle.trim()) {
      const newCard = {
        id: Date.now(),
        title: newCardTitle,
        description: newCardDescription,
        dueDate: newCardDueDate,
        assignee: newCardAssignee
      };

      setBoards(prevBoards =>
        prevBoards.map(board =>
          board.id === boardId
            ? { ...board, cards: [...board.cards, newCard] }
            : board
        )
      );

      // Limpiar formulario
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardDueDate('');
      setNewCardAssignee('');
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
    setBoards(prevBoards =>
      prevBoards.map(board =>
        board.id === boardId
          ? { ...board, cards: board.cards.filter(card => card.id !== cardId) }
          : board
      )
    );
  };

  // Eliminar tablero
  const deleteBoard = (boardId) => {
    setBoards(prev => prev.filter(board => board.id !== boardId));
  };

  // Editar tarjeta
  const updateCard = (boardId, cardId, updatedCard) => {
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
    setEditingCard(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Mi Tablero de Tareas</h1>
          <p className="text-gray-600">Organiza tus proyectos de manera eficiente</p>
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
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-move group"
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
                      <input
                        type="text"
                        placeholder="Asignado a"
                        value={newCardAssignee}
                        onChange={(e) => setNewCardAssignee(e.target.value)}
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
            <input
              type="text"
              value={editingCard.assignee}
              onChange={(e) => setEditingCard({ ...editingCard, assignee: e.target.value })}
              className="w-full mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Asignado a"
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
    </div>
  );
};

export default TrelloClone;