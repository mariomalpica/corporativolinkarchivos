// Vercel Serverless Function - Backend real para el tablero compartido
// Este archivo se ejecuta en Vercel como API endpoint

// Datos en memoria (temporal mientras configuramos KV)
let globalData = {
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡SISTEMA FUNCIONANDO!", 
          description: "Backend temporal activo", 
          backgroundColor: "#e3f2fd",
          createdBy: "Sistema",
          assignedTo: "Sistema",
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 2,
      title: "🔄 En Progreso", 
      color: "bg-yellow-500",
      cards: []
    },
    {
      id: 3,
      title: "✅ Completado",
      color: "bg-green-500", 
      cards: []
    }
  ],
  version: 1,
  lastUpdated: new Date().toISOString(),
  lastUpdatedBy: 'Sistema'
};

// Validar estructura de datos
function validateData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  if (!Array.isArray(data.boards)) {
    return false;
  }
  
  // Validar cada board
  for (const board of data.boards) {
    if (!board.id || !board.title || !Array.isArray(board.cards)) {
      return false;
    }
  }
  
  return true;
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Devolver datos en memoria
      console.log('🔥 GET request - returning data:', globalData.version);
      res.status(200).json({
        success: true,
        data: globalData,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Actualizar datos en memoria
      const newData = req.body;
      
      if (newData && newData.boards && validateData(newData)) {
        console.log('🔥 PUT request - updating data:', {
          boardsCount: newData.boards.length,
          totalCards: newData.boards.reduce((sum, b) => sum + b.cards.length, 0)
        });
        
        // Actualizar datos globales
        globalData = {
          ...newData,
          version: (globalData.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: newData.lastUpdatedBy || 'Usuario'
        };
        
        console.log('✅ Data updated successfully:', globalData.version, 'by:', globalData.lastUpdatedBy);
        
        res.status(200).json({
          success: true,
          message: 'Datos actualizados exitosamente',
          data: globalData,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ Invalid data received:', { hasBoards: !!newData?.boards });
        res.status(400).json({
          success: false,
          message: 'Datos inválidos - se requiere estructura válida con "boards"',
          timestamp: new Date().toISOString()
        });
      }
      
    } else {
      res.status(405).json({
        success: false,
        message: 'Método no permitido',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}