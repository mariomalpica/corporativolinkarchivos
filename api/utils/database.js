// Database utilities with Vercel KV for persistent storage
import { kv } from '@vercel/kv';

const DATA_KEY = 'trello_boards_data';

// Datos por defecto
const defaultData = {
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡DATOS PERSISTENTES!", 
          description: "Ahora los datos nunca se borran con actualizaciones", 
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

// Leer datos de Vercel KV
export async function readData() {
  try {
    console.log('🔥 KV - Leyendo datos de Vercel KV...');
    const data = await kv.get(DATA_KEY);
    
    if (!data) {
      console.log('🔥 KV - No hay datos, usando defaults...');
      await writeData(defaultData);
      return defaultData;
    }
    
    console.log('🔥 KV - Datos leídos exitosamente:', data.version);
    return data;
  } catch (error) {
    console.error('❌ KV - Error leyendo:', error);
    return defaultData;
  }
}

// Escribir datos a Vercel KV
export async function writeData(data) {
  try {
    console.log('🔥 KV - Guardando datos en Vercel KV...', {
      version: data.version,
      boardsCount: data.boards?.length,
      totalCards: data.boards?.reduce((sum, b) => sum + b.cards.length, 0)
    });
    
    await kv.set(DATA_KEY, data);
    console.log('✅ KV - Datos guardados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ KV - Error guardando:', error);
    return false;
  }
}

// Validar estructura de datos
export function validateData(data) {
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