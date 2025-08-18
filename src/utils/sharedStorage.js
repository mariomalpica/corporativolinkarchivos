// Sistema de almacenamiento compartido usando JSONBin.io API
// Esto permite que todos los usuarios compartan realmente el mismo tablero

// Usando un servicio de almacenamiento público simple
const STORAGE_URL = 'https://api.jsonbin.io/v3/b/67a72bf3ad19ca34f8de2751';
const API_KEY = '$2a$10$vlJ6DAXU7j.cfqTTNYC3tOGpDkBAYE.eE7H7/Rd0PKjh5T6xYCo/e';

// Función para cargar datos del servidor compartido
export const loadSharedData = async () => {
  try {
    const response = await fetch(STORAGE_URL, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.record;
    } else {
      console.warn('Error loading shared data:', response.status);
      return getDefaultData();
    }
  } catch (error) {
    console.warn('Error fetching shared data:', error);
    return getDefaultData();
  }
};

// Función para guardar datos en el servidor compartido
export const saveSharedData = async (data) => {
  try {
    const response = await fetch(STORAGE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      console.log('Data saved to shared storage successfully');
      return true;
    } else {
      console.warn('Error saving shared data:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('Error saving shared data:', error);
    return false;
  }
};

// Datos por defecto
export const getDefaultData = () => ({
  boards: [
    {
      id: 1,
      title: "Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "Diseñar interfaz", 
          description: "Crear mockups de la aplicación", 
          dueDate: "2025-08-20", 
          assignee: "Ana", 
          backgroundColor: "#fef3c7" 
        },
        { 
          id: 2, 
          title: "Configurar base de datos", 
          description: "Configurar MongoDB", 
          dueDate: "2025-08-22", 
          assignee: "Carlos", 
          backgroundColor: "#dbeafe" 
        }
      ]
    },
    {
      id: 2,
      title: "En Progreso",
      color: "bg-yellow-500",
      cards: [
        { 
          id: 3, 
          title: "Desarrollar API", 
          description: "Crear endpoints REST", 
          dueDate: "2025-08-25", 
          assignee: "María", 
          backgroundColor: "#fed7d7" 
        }
      ]
    },
    {
      id: 3,
      title: "Completado",
      color: "bg-green-500",
      cards: [
        { 
          id: 4, 
          title: "Investigación inicial", 
          description: "Análisis de requisitos", 
          dueDate: "2025-08-15", 
          assignee: "Pedro", 
          backgroundColor: "#d1fae5" 
        }
      ]
    }
  ],
  users: ['Ana', 'Carlos', 'María', 'Pedro'],
  lastUpdated: new Date().toISOString(),
  version: 1
});

// Función para hacer polling de cambios (opcional)
export const pollForChanges = async (currentVersion, onUpdate) => {
  try {
    const data = await loadSharedData();
    if (data.version !== currentVersion) {
      onUpdate(data);
      return data.version;
    }
    return currentVersion;
  } catch (error) {
    console.warn('Error polling for changes:', error);
    return currentVersion;
  }
};

// Función para inicializar el almacenamiento compartido
export const initializeSharedStorage = async () => {
  try {
    // Intentar cargar datos existentes
    const existingData = await loadSharedData();
    
    // Si no hay datos o hay error, inicializar con datos por defecto
    if (!existingData || !existingData.boards) {
      const defaultData = getDefaultData();
      await saveSharedData(defaultData);
      return defaultData;
    }
    
    return existingData;
  } catch (error) {
    console.warn('Error initializing shared storage:', error);
    return getDefaultData();
  }
};