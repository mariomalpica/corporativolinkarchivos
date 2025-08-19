// Utilidades para manejar workspaces (áreas de trabajo)

const WORKSPACES_KEY = 'trello_clone_workspaces';
const CURRENT_WORKSPACE_KEY = 'trello_clone_current_workspace';
const WORKSPACE_SESSIONS_KEY = 'trello_clone_workspace_sessions';

// Workspace por defecto
const DEFAULT_WORKSPACE = {
  id: 'trabajo',
  name: 'Trabajo',
  description: 'Área de trabajo principal',
  hasPassword: false,
  password: null,
  createdAt: new Date().toISOString(),
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡SISTEMA DE WORKSPACES LISTO!", 
          description: "Ahora puedes crear múltiples áreas de trabajo", 
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
  ]
};

// Cargar todos los workspaces
export const loadWorkspaces = () => {
  try {
    const saved = localStorage.getItem(WORKSPACES_KEY);
    if (saved) {
      const workspaces = JSON.parse(saved);
      // Asegurar que existe al menos el workspace por defecto
      if (workspaces.length === 0) {
        return [DEFAULT_WORKSPACE];
      }
      return workspaces;
    }
  } catch (error) {
    console.error('Error loading workspaces:', error);
  }
  return [DEFAULT_WORKSPACE];
};

// Guardar workspaces
export const saveWorkspaces = (workspaces) => {
  try {
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
    return true;
  } catch (error) {
    console.error('Error saving workspaces:', error);
    return false;
  }
};

// Obtener workspace actual
export const getCurrentWorkspaceId = () => {
  try {
    const saved = localStorage.getItem(CURRENT_WORKSPACE_KEY);
    return saved || 'trabajo';
  } catch (error) {
    console.error('Error loading current workspace:', error);
    return 'trabajo';
  }
};

// Establecer workspace actual
export const setCurrentWorkspaceId = (workspaceId) => {
  try {
    localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId);
    return true;
  } catch (error) {
    console.error('Error setting current workspace:', error);
    return false;
  }
};

// Obtener workspace por ID
export const getWorkspaceById = (workspaceId) => {
  const workspaces = loadWorkspaces();
  return workspaces.find(ws => ws.id === workspaceId) || workspaces[0];
};

// Crear nuevo workspace
export const createWorkspace = (workspaceData) => {
  const workspaces = loadWorkspaces();
  const newWorkspace = {
    id: generateWorkspaceId(),
    name: workspaceData.name,
    description: workspaceData.description || '',
    hasPassword: workspaceData.hasPassword || false,
    password: workspaceData.password || null,
    createdAt: new Date().toISOString(),
    boards: [
      {
        id: 1,
        title: "📋 Por Hacer",
        color: "bg-blue-500",
        cards: []
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
    ]
  };
  
  workspaces.push(newWorkspace);
  saveWorkspaces(workspaces);
  return newWorkspace;
};

// Actualizar workspace
export const updateWorkspace = (workspaceId, updates) => {
  const workspaces = loadWorkspaces();
  const index = workspaces.findIndex(ws => ws.id === workspaceId);
  
  if (index !== -1) {
    workspaces[index] = { ...workspaces[index], ...updates };
    saveWorkspaces(workspaces);
    return workspaces[index];
  }
  
  return null;
};

// Eliminar workspace
export const deleteWorkspace = (workspaceId) => {
  const workspaces = loadWorkspaces();
  
  // No permitir eliminar si es el último workspace
  if (workspaces.length <= 1) {
    return false;
  }
  
  // No permitir eliminar el workspace de "Trabajo"
  if (workspaceId === 'trabajo') {
    return false;
  }
  
  const filteredWorkspaces = workspaces.filter(ws => ws.id !== workspaceId);
  saveWorkspaces(filteredWorkspaces);
  
  // Si era el workspace actual, cambiar al primero disponible
  if (getCurrentWorkspaceId() === workspaceId) {
    setCurrentWorkspaceId(filteredWorkspaces[0].id);
  }
  
  return true;
};

// Generar ID único para workspace
const generateWorkspaceId = () => {
  return 'workspace_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Verificar contraseña de workspace
export const verifyWorkspacePassword = (workspaceId, password) => {
  const workspace = getWorkspaceById(workspaceId);
  
  if (!workspace.hasPassword) {
    return true; // No requiere contraseña
  }
  
  return workspace.password === password;
};

// Manejar sesiones de workspaces con contraseña
export const getWorkspaceSessions = () => {
  try {
    const saved = localStorage.getItem(WORKSPACE_SESSIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Error loading workspace sessions:', error);
    return {};
  }
};

export const setWorkspaceSession = (workspaceId, sessionData) => {
  const sessions = getWorkspaceSessions();
  sessions[workspaceId] = {
    ...sessionData,
    timestamp: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(WORKSPACE_SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Error saving workspace session:', error);
    return false;
  }
};

export const clearWorkspaceSession = (workspaceId) => {
  const sessions = getWorkspaceSessions();
  delete sessions[workspaceId];
  
  try {
    localStorage.setItem(WORKSPACE_SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Error clearing workspace session:', error);
    return false;
  }
};

export const isWorkspaceSessionValid = (workspaceId) => {
  const sessions = getWorkspaceSessions();
  const session = sessions[workspaceId];
  
  if (!session) return false;
  
  // Verificar si la sesión ha expirado (opcional: 24 horas)
  const sessionTime = new Date(session.timestamp);
  const now = new Date();
  const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
  
  return hoursDiff < 24; // Sesión válida por 24 horas
};