// Solución alternativa simple para tablero compartido
// Usa un enfoque híbrido con localStorage y sincronización manual

// Clave especial para datos compartidos globales
const SHARED_KEY = 'TRELLO_GLOBAL_SHARED_DATA';
const VERSION_KEY = 'TRELLO_GLOBAL_VERSION';
const LAST_UPDATE_KEY = 'TRELLO_GLOBAL_LAST_UPDATE';

// Datos por defecto
export const getSimpleDefaultData = () => ({
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { id: 1, title: "Bienvenido al tablero compartido", description: "Todos los usuarios ven esta misma información", backgroundColor: "#e3f2fd" },
        { id: 2, title: "Crea una nueva tarjeta para probar", description: "Los demás usuarios podrán ver tus cambios", backgroundColor: "#f3e5f5" }
      ]
    },
    {
      id: 2,
      title: "🔄 En Progreso", 
      color: "bg-yellow-500",
      cards: [
        { id: 3, title: "Prueba mover esta tarjeta", description: "Usa drag & drop para moverla", backgroundColor: "#fff3e0" }
      ]
    },
    {
      id: 3,
      title: "✅ Completado",
      color: "bg-green-500", 
      cards: [
        { id: 4, title: "Haz clic en 'Actualizar' para ver cambios", description: "Los cambios de otros usuarios aparecerán aquí", backgroundColor: "#e8f5e8" }
      ]
    }
  ],
  version: 1,
  lastUpdated: new Date().toISOString(),
  lastUpdatedBy: 'Sistema'
});

// Función para simular un "servidor" usando localStorage con timestamp
export const saveSimpleSharedData = (data, username = 'Usuario') => {
  try {
    const timestamp = Date.now();
    const dataWithMeta = {
      ...data,
      version: (getCurrentVersion() || 0) + 1,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: username,
      timestamp: timestamp
    };

    localStorage.setItem(SHARED_KEY, JSON.stringify(dataWithMeta));
    localStorage.setItem(VERSION_KEY, dataWithMeta.version.toString());
    localStorage.setItem(LAST_UPDATE_KEY, timestamp.toString());
    
    // Disparar evento personalizado para notificar otros componentes
    window.dispatchEvent(new CustomEvent('trelloDataUpdated', { 
      detail: dataWithMeta 
    }));
    
    console.log(`✅ Datos guardados - Versión: ${dataWithMeta.version} por ${username}`);
    return true;
  } catch (error) {
    console.error('Error guardando datos:', error);
    return false;
  }
};

// Función para cargar datos compartidos
export const loadSimpleSharedData = () => {
  try {
    const stored = localStorage.getItem(SHARED_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      console.log(`✅ Datos cargados - Versión: ${data.version} actualizado por ${data.lastUpdatedBy}`);
      return data;
    } else {
      // Si no hay datos, inicializar con datos por defecto
      const defaultData = getSimpleDefaultData();
      saveSimpleSharedData(defaultData, 'Sistema');
      return defaultData;
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
    return getSimpleDefaultData();
  }
};

// Función para obtener versión actual
export const getCurrentVersion = () => {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    return version ? parseInt(version) : 0;
  } catch (error) {
    return 0;
  }
};

// Función para verificar si hay actualizaciones
export const hasUpdates = (currentVersion) => {
  const latestVersion = getCurrentVersion();
  return latestVersion > currentVersion;
};

// Función para forzar actualización
export const forceRefresh = () => {
  const data = loadSimpleSharedData();
  window.dispatchEvent(new CustomEvent('trelloForceRefresh', { 
    detail: data 
  }));
  return data;
};

// Función para limpiar todos los datos (solo para testing)
export const clearAllData = () => {
  localStorage.removeItem(SHARED_KEY);
  localStorage.removeItem(VERSION_KEY);
  localStorage.removeItem(LAST_UPDATE_KEY);
  console.log('🗑️ Todos los datos han sido limpiados');
};

// Función para obtener estadísticas
export const getStorageStats = () => {
  const data = loadSimpleSharedData();
  const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
  
  return {
    version: data.version || 0,
    lastUpdatedBy: data.lastUpdatedBy || 'Desconocido',
    lastUpdated: data.lastUpdated || 'Nunca',
    totalBoards: data.boards ? data.boards.length : 0,
    totalCards: data.boards ? data.boards.reduce((sum, board) => sum + board.cards.length, 0) : 0,
    lastUpdateTimestamp: lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : 'Nunca'
  };
};

// Función para inicializar listener de cambios
export const initializeStorageListener = (onUpdate) => {
  const handleUpdate = (event) => {
    console.log('📡 Evento de actualización detectado:', event.detail);
    onUpdate(event.detail);
  };

  const handleForceRefresh = (event) => {
    console.log('🔄 Refresh forzado detectado:', event.detail);
    onUpdate(event.detail);
  };

  window.addEventListener('trelloDataUpdated', handleUpdate);
  window.addEventListener('trelloForceRefresh', handleForceRefresh);

  // Retornar función de cleanup
  return () => {
    window.removeEventListener('trelloDataUpdated', handleUpdate);
    window.removeEventListener('trelloForceRefresh', handleForceRefresh);
  };
};

// Función para mostrar instrucciones al usuario
export const getInstructions = () => `
🔧 INSTRUCCIONES PARA PROBAR EL TABLERO COMPARTIDO:

1. MISMA COMPUTADORA (diferentes pestañas):
   - Abre esta aplicación en 2 pestañas del navegador
   - Los cambios se verán automáticamente entre pestañas

2. DIFERENTES COMPUTADORAS:
   - Persona A: Hace un cambio (crear, mover, eliminar tarjeta)
   - Persona B: Hace clic en el botón "🔄 Actualizar" 
   - Persona B: Ve los cambios que hizo Persona A

3. VERIFICAR QUE FUNCIONA:
   - Crea una tarjeta con tu nombre
   - Pide a otra persona que actualice
   - Deberían ver tu tarjeta

NOTA: Esta solución usa localStorage compartido del navegador.
Para computadoras diferentes, se requiere hacer clic en "Actualizar".
`;