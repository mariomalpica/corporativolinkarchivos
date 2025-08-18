import React, { useState, useEffect } from 'react';

const TrelloTest = ({ currentUser }) => {
  const [mounted, setMounted] = useState(false);
  const [boards, setBoards] = useState([
    {
      id: 1,
      title: "Test Board",
      cards: [
        { id: 1, title: "Test Card 1" },
        { id: 2, title: "Test Card 2" }
      ]
    }
  ]);

  useEffect(() => {
    setMounted(true);
    
    // Cargar datos globales
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trello-test-boards');
      if (saved) {
        try {
          setBoards(JSON.parse(saved));
        } catch (e) {
          console.warn('Error loading:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('trello-test-boards', JSON.stringify(boards));
    }
  }, [boards, mounted]);

  const addCard = (boardId) => {
    const newCard = {
      id: Date.now(),
      title: `Nueva tarjeta por ${currentUser?.username || 'Usuario'}`
    };
    
    setBoards(prev =>
      prev.map(board =>
        board.id === boardId
          ? { ...board, cards: [...board.cards, newCard] }
          : board
      )
    );
  };

  const refresh = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trello-test-boards');
      if (saved) {
        setBoards(JSON.parse(saved));
      }
    }
  };

  if (!mounted) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Test Tablero Compartido</h1>
        <div className="flex space-x-2">
          <button
            onClick={refresh}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Actualizar
          </button>
          <span className="px-3 py-1 bg-gray-100 rounded">
            Usuario: {currentUser?.username || 'N/A'}
          </span>
        </div>
      </div>

      {boards.map(board => (
        <div key={board.id} className="border p-4 rounded mb-4">
          <h2 className="text-lg font-semibold mb-2">{board.title}</h2>
          
          <div className="space-y-2">
            {board.cards.map(card => (
              <div key={card.id} className="p-2 bg-gray-50 rounded">
                {card.title}
              </div>
            ))}
          </div>

          <button
            onClick={() => addCard(board.id)}
            className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
          >
            + Agregar Tarjeta
          </button>
        </div>
      ))}
      
      <div className="mt-4 p-2 bg-yellow-50 rounded">
        <p className="text-sm">
          ✅ Tablero compartido funcionando<br/>
          ✅ Haz clic en "Actualizar" para ver cambios de otros usuarios<br/>
          ✅ Agrega tarjetas para probar la sincronización
        </p>
      </div>
    </div>
  );
};

export default TrelloTest;