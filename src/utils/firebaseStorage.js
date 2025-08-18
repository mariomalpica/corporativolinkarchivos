// Firebase Real-time Database storage
import { database } from './firebaseConfig';
import { ref, set, get, onValue, off } from 'firebase/database';

// Referencia principal para los datos del tablero
const BOARD_DATA_REF = 'trelloBoards';

// Datos por defecto
export const getFirebaseDefaultData = () => ({
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡Bienvenido al tablero REAL compartido!", 
          description: "Este tablero se sincroniza automáticamente entre TODAS las computadoras", 
          backgroundColor: "#e3f2fd",
          createdBy: "Sistema",
          createdAt: new Date().toISOString()
        },
        { 
          id: 2, 
          title: "Prueba crear una tarjeta desde tu dispositivo", 
          description: "Otros usuarios en diferentes computadoras la verán automáticamente", 
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
          title: "Firebase Database funcionando", 
          description: "Sincronización en tiempo real entre dispositivos", 
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
          title: "Problema de localStorage resuelto", 
          description: "Ahora usa Firebase - funciona entre todas las computadoras", 
          backgroundColor: "#e8f5e8",
          createdBy: "Sistema",
          createdAt: new Date().toISOString()
        }
      ]
    }
  ],
  version: 1,
  lastUpdated: new Date().toISOString(),
  lastUpdatedBy: 'Sistema',
  metadata: {
    totalUsers: 0,
    totalActions: 0,
    created: new Date().toISOString()
  }
});

// Función para guardar datos en Firebase
export const saveFirebaseData = async (data, username = 'Usuario') => {
  try {
    const dataWithMeta = {
      ...data,
      version: (data.version || 0) + 1,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: username,
      timestamp: Date.now()
    };

    const boardRef = ref(database, BOARD_DATA_REF);
    await set(boardRef, dataWithMeta);
    
    console.log(`🔥 Datos guardados en Firebase - Versión: ${dataWithMeta.version} por ${username}`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando en Firebase:', error);
    return false;
  }
};

// Función para cargar datos desde Firebase
export const loadFirebaseData = async () => {
  try {
    const boardRef = ref(database, BOARD_DATA_REF);
    const snapshot = await get(boardRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(`🔥 Datos cargados desde Firebase - Versión: ${data.version} por ${data.lastUpdatedBy}`);
      return data;
    } else {
      // Si no hay datos, inicializar con datos por defecto
      const defaultData = getFirebaseDefaultData();
      await saveFirebaseData(defaultData, 'Sistema');
      return defaultData;
    }
  } catch (error) {
    console.error('❌ Error cargando desde Firebase:', error);
    return getFirebaseDefaultData();
  }
};

// Función para escuchar cambios en tiempo real
export const subscribeToFirebaseChanges = (callback) => {
  try {
    const boardRef = ref(database, BOARD_DATA_REF);
    
    const unsubscribe = onValue(boardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log(`🔄 Cambio detectado en Firebase - Versión: ${data.version} por ${data.lastUpdatedBy}`);
        callback(data);
      }
    }, (error) => {
      console.error('❌ Error en listener de Firebase:', error);
    });

    // Retornar función para cancelar la suscripción
    return () => {
      off(boardRef);
      unsubscribe();
    };
  } catch (error) {
    console.error('❌ Error configurando listener:', error);
    return () => {}; // Función vacía como fallback
  }
};

// Función para obtener estadísticas
export const getFirebaseStats = async () => {
  try {
    const data = await loadFirebaseData();
    return {
      version: data.version || 0,
      lastUpdatedBy: data.lastUpdatedBy || 'Desconocido',
      lastUpdated: data.lastUpdated || 'Nunca',
      totalBoards: data.boards ? data.boards.length : 0,
      totalCards: data.boards ? data.boards.reduce((sum, board) => sum + board.cards.length, 0) : 0,
      timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Nunca'
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      version: 0,
      lastUpdatedBy: 'Error',
      lastUpdated: 'Error',
      totalBoards: 0,
      totalCards: 0,
      timestamp: 'Error'
    };
  }
};

// Función para inicializar Firebase (verificar conectividad)
export const initializeFirebase = async () => {
  try {
    console.log('🔥 Inicializando conexión con Firebase...');
    const data = await loadFirebaseData();
    console.log('✅ Firebase conectado exitosamente');
    return data;
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    throw error;
  }
};

export const getFirebaseInstructions = () => `
🔥 TABLERO COMPARTIDO CON FIREBASE - INSTRUCCIONES:

✅ FUNCIONAMIENTO REAL:
   - Los cambios se ven AUTOMÁTICAMENTE en todas las computadoras
   - No necesitas hacer clic en "actualizar"  
   - Funciona entre diferentes dispositivos, navegadores y ubicaciones

🧪 CÓMO PROBAR:
1. Abre esta aplicación en tu computadora
2. Pídele a otra persona que la abra en SU computadora (diferente)
3. Cualquiera hace un cambio (crear, mover, eliminar tarjeta)
4. El cambio aparece AUTOMÁTICAMENTE en todas las pantallas

📱 FUNCIONA ENTRE:
   - Diferentes computadoras
   - Diferentes navegadores  
   - Diferentes ubicaciones geográficas
   - Dispositivos móviles y escritorio

🚀 TECNOLOGÍA:
   - Firebase Realtime Database
   - Sincronización automática en tiempo real
   - Sin necesidad de hacer refresh manual
`;