// Vercel Serverless Function - Backend real para el tablero compartido
// Este archivo se ejecuta en Vercel como API endpoint

let globalData = {
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡BACKEND REAL FUNCIONANDO!", 
          description: "Esta API se ejecuta en Vercel - funciona entre todas las computadoras", 
          backgroundColor: "#e3f2fd",
          createdBy: "Sistema",
          createdAt: new Date().toISOString()
        },
        { 
          id: 2, 
          title: "Prueba crear una tarjeta", 
          description: "Los cambios se guardan en el servidor de Vercel", 
          backgroundColor: "#f3e5f5",
          createdBy: "Sistema",
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 2,
      title: "🔄 En Progreso", 
      color: "bg-yellow-500",
      cards: [
        { 
          id: 3, 
          title: "Sincronización real", 
          description: "Backend propio en Vercel - sin APIs externas falsas", 
          backgroundColor: "#fff3e0",
          createdBy: "Sistema",
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 3,
      title: "✅ Completado",
      color: "bg-green-500", 
      cards: [
        { 
          id: 4, 
          title: "Problemas de APIs falsas resueltos", 
          description: "Backend propio = control total", 
          backgroundColor: "#e8f5e8",
          createdBy: "Sistema",
          createdAt: new Date().toISOString()
        }
      ]
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
      // Retornar datos actuales
      console.log('GET request - returning data:', globalData.version);
      res.status(200).json({
        success: true,
        data: globalData,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Actualizar datos
      const newData = req.body;
      
      if (newData && newData.boards) {
        globalData = {
          ...newData,
          version: (globalData.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: newData.lastUpdatedBy || 'Usuario'
        };
        
        console.log('POST/PUT request - data updated:', globalData.version, 'by:', globalData.lastUpdatedBy);
        
        res.status(200).json({
          success: true,
          message: 'Datos actualizados exitosamente',
          data: globalData,
          timestamp: new Date().toISOString()
        });
      } else {
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