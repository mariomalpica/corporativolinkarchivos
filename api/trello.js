// Vercel Serverless Function - Backend real para el tablero compartido
// Este archivo se ejecuta en Vercel como API endpoint

// Datos temporales en memoria mientras se configura KV
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
          description: "Backend restaurado y operativo", 
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

// Función para intentar usar KV si está disponible, sino usar memoria
async function readDataSafe() {
  try {
    // Intentar importar y usar KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get('trello_boards_data');
      if (data) {
        console.log('✅ KV - Datos leídos desde KV:', data.version);
        return data;
      }
    }
  } catch (error) {
    console.log('⚠️ KV no disponible, usando memoria:', error.message);
  }
  
  console.log('📝 Usando datos de memoria temporal');
  return globalData;
}

async function writeDataSafe(data) {
  try {
    // Intentar importar y usar KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv');
      await kv.set('trello_boards_data', data);
      console.log('✅ KV - Datos guardados en KV:', data.version);
      return true;
    }
  } catch (error) {
    console.log('⚠️ KV no disponible, guardando en memoria:', error.message);
  }
  
  // Actualizar memoria global
  globalData = { ...data };
  console.log('📝 Datos guardados en memoria temporal:', data.version);
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
      // Leer datos (KV o memoria)
      const currentData = await readDataSafe();
      console.log('🔥 GET request - returning data:', currentData.version);
      res.status(200).json({
        success: true,
        data: currentData,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Actualizar datos (KV o memoria)
      const newData = req.body;
      
      if (newData && newData.boards && validateData(newData)) {
        console.log('🔥 PUT request - updating data:', {
          boardsCount: newData.boards.length,
          totalCards: newData.boards.reduce((sum, b) => sum + b.cards.length, 0)
        });
        
        // Leer versión actual
        const currentData = await readDataSafe();
        
        const updatedData = {
          ...newData,
          version: (currentData.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: newData.lastUpdatedBy || 'Usuario'
        };
        
        // Guardar datos
        const success = await writeDataSafe(updatedData);
        
        if (success) {
          console.log('🔥 POST/PUT request - data updated:', updatedData.version, 'by:', updatedData.lastUpdatedBy);
          
          res.status(200).json({
            success: true,
            message: 'Datos actualizados exitosamente',
            data: updatedData,
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Error guardando datos',
            timestamp: new Date().toISOString()
          });
        }
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