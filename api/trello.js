// Vercel Serverless Function - Backend real para el tablero compartido
// Este archivo se ejecuta en Vercel como API endpoint

// Datos en memoria (temporal hasta implementar DB real)
let globalData = {
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡BACKEND FUNCIONAL!", 
          description: "Sistema funcionando correctamente", 
          backgroundColor: "#e3f2fd",
          createdBy: "Sistema",
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
      // Retornar datos actuales de memoria
      console.log('🔥 GET request - returning data:', globalData.version);
      res.status(200).json({
        success: true,
        data: globalData,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Actualizar datos en memoria
      const newData = req.body;
      
      if (newData && newData.boards) {
        console.log('🔥 PUT request - updating data:', {
          boardsCount: newData.boards.length,
          totalCards: newData.boards.reduce((sum, b) => sum + b.cards.length, 0)
        });
        
        globalData = {
          ...newData,
          version: (globalData.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: newData.lastUpdatedBy || 'Usuario'
        };
        
        console.log('🔥 POST/PUT request - data updated:', globalData.version, 'by:', globalData.lastUpdatedBy);
        
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
          message: 'Datos inválidos - se requiere "boards"',
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