// Utilidades para manejo persistente de datos
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'trello-data.json');

// Datos por defecto si no existe el archivo
const defaultData = {
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡DATOS PERSISTENTES FUNCIONANDO!", 
          description: "Los datos ahora se guardan permanentemente y no se borran con cada deployment", 
          backgroundColor: "#e3f2fd",
          createdBy: "Sistema",
          createdAt: new Date().toISOString()
        },
        { 
          id: 2, 
          title: "Crear tarjetas sin perder datos", 
          description: "Los cambios ahora persisten entre actualizaciones de la aplicación", 
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
          title: "Persistencia implementada", 
          description: "Sistema de archivos JSON para datos permanentes", 
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
          title: "Problema de datos temporales resuelto", 
          description: "Los datos ahora sobreviven a deployments y reinicios", 
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

// Leer datos del archivo
export const readData = () => {
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(DATA_FILE)) {
      console.log('📄 Archivo de datos no existe, creando con datos por defecto...');
      // Crear directorio si no existe
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Escribir datos por defecto
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }

    // Leer el archivo existente
    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    
    console.log(`📖 Datos leídos exitosamente - Versión: ${data.version || 'N/A'}`);
    return data;
    
  } catch (error) {
    console.error('❌ Error leyendo datos:', error.message);
    console.log('📄 Usando datos por defecto debido al error');
    return defaultData;
  }
};

// Escribir datos al archivo
export const writeData = (data) => {
  try {
    // Asegurar que el directorio existe
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Escribir datos al archivo
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Datos guardados exitosamente - Versión: ${data.version || 'N/A'}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error guardando datos:', error.message);
    return false;
  }
};

// Crear backup de datos (opcional)
export const createBackup = (data) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(process.cwd(), 'data', `backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`🔄 Backup creado: backup-${timestamp}.json`);
    return true;
    
  } catch (error) {
    console.error('❌ Error creando backup:', error.message);
    return false;
  }
};

// Validar estructura de datos
export const validateData = (data) => {
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
};