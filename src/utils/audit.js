// Sistema de auditoría para rastrear todas las acciones

import { generateId } from './auth';

// Tipos de acciones para auditoría
export const AUDIT_ACTIONS = {
  // Acciones de tarjetas
  CREATE_CARD: 'CREATE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  EDIT_CARD: 'EDIT_CARD',
  MOVE_CARD: 'MOVE_CARD',
  
  // Acciones de tableros
  CREATE_BOARD: 'CREATE_BOARD',
  DELETE_BOARD: 'DELETE_BOARD',
  EDIT_BOARD: 'EDIT_BOARD',
  
  // Acciones de usuarios
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  CREATE_USER: 'CREATE_USER',
  EDIT_USER: 'EDIT_USER',
  DELETE_USER: 'DELETE_USER',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD',
  
  // Acciones del sistema
  SYSTEM_ACCESS: 'SYSTEM_ACCESS'
};

// Tipos de objetivos
export const TARGET_TYPES = {
  CARD: 'CARD',
  BOARD: 'BOARD', 
  USER: 'USER',
  SYSTEM: 'SYSTEM'
};

// Simulación de IP (en sistema real se obtendría del servidor)
const getSimulatedIP = () => {
  const ips = ['192.168.1.10', '192.168.1.15', '10.0.0.5', '172.16.0.10'];
  return ips[Math.floor(Math.random() * ips.length)];
};

// Guardar y cargar auditorías
export const saveAuditLog = (auditEntries) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('trello_audit_log', JSON.stringify(auditEntries));
  }
};

export const loadAuditLog = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('trello_audit_log');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
};

// Crear entrada de auditoría
export const createAuditEntry = (user, action, details, targetType = null, targetId = null, additionalData = {}) => {
  const auditEntry = {
    id: generateId(),
    userId: user?.id || 'unknown',
    username: user?.username || 'Sistema',
    userRole: user?.role || 'unknown',
    action,
    details,
    targetType,
    targetId,
    timestamp: new Date().toISOString(),
    ipAddress: getSimulatedIP(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
    ...additionalData
  };
  
  return auditEntry;
};

// Registrar acción en auditoría
export const logAuditAction = (user, action, details, targetType = null, targetId = null, additionalData = {}) => {
  const auditLog = loadAuditLog();
  const newEntry = createAuditEntry(user, action, details, targetType, targetId, additionalData);
  
  // Mantener solo los últimos 1000 registros para no sobrecargar localStorage
  const updatedLog = [newEntry, ...auditLog].slice(0, 1000);
  saveAuditLog(updatedLog);
  
  return newEntry;
};

// Obtener auditorías filtradas
export const getAuditLog = (filters = {}) => {
  const auditLog = loadAuditLog();
  
  let filtered = auditLog;
  
  // Filtrar por usuario
  if (filters.userId) {
    filtered = filtered.filter(entry => entry.userId === filters.userId);
  }
  
  // Filtrar por acción
  if (filters.action) {
    filtered = filtered.filter(entry => entry.action === filters.action);
  }
  
  // Filtrar por tipo de objetivo
  if (filters.targetType) {
    filtered = filtered.filter(entry => entry.targetType === filters.targetType);
  }
  
  // Filtrar por rango de fechas
  if (filters.startDate) {
    filtered = filtered.filter(entry => new Date(entry.timestamp) >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    filtered = filtered.filter(entry => new Date(entry.timestamp) <= new Date(filters.endDate));
  }
  
  // Filtrar por texto de búsqueda
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    filtered = filtered.filter(entry => 
      entry.details.toLowerCase().includes(searchLower) ||
      entry.username.toLowerCase().includes(searchLower) ||
      entry.action.toLowerCase().includes(searchLower)
    );
  }
  
  // Limitar resultados
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }
  
  return filtered;
};

// Funciones específicas para acciones comunes
export const logCardAction = (user, action, cardTitle, boardTitle, cardId, boardId, additionalInfo = {}) => {
  let details = '';
  
  switch (action) {
    case AUDIT_ACTIONS.CREATE_CARD:
      details = `Creó la tarjeta "${cardTitle}" en el tablero "${boardTitle}"`;
      break;
    case AUDIT_ACTIONS.DELETE_CARD:
      details = `Eliminó la tarjeta "${cardTitle}" del tablero "${boardTitle}"`;
      break;
    case AUDIT_ACTIONS.EDIT_CARD:
      details = `Editó la tarjeta "${cardTitle}" en el tablero "${boardTitle}"`;
      if (additionalInfo.changes) {
        details += ` - Cambios: ${additionalInfo.changes}`;
      }
      break;
    case AUDIT_ACTIONS.MOVE_CARD:
      details = `Movió la tarjeta "${cardTitle}" ${additionalInfo.fromBoard ? `del tablero "${additionalInfo.fromBoard}"` : ''} al tablero "${boardTitle}"`;
      break;
    default:
      details = `Acción ${action} en tarjeta "${cardTitle}"`;
  }
  
  return logAuditAction(
    user, 
    action, 
    details, 
    TARGET_TYPES.CARD, 
    cardId,
    {
      boardId,
      boardTitle,
      cardTitle,
      ...additionalInfo
    }
  );
};

export const logBoardAction = (user, action, boardTitle, boardId, additionalInfo = {}) => {
  let details = '';
  
  switch (action) {
    case AUDIT_ACTIONS.CREATE_BOARD:
      details = `Creó el tablero "${boardTitle}"`;
      break;
    case AUDIT_ACTIONS.DELETE_BOARD:
      details = `Eliminó el tablero "${boardTitle}"`;
      if (additionalInfo.cardCount) {
        details += ` (contenía ${additionalInfo.cardCount} tarjetas)`;
      }
      break;
    case AUDIT_ACTIONS.EDIT_BOARD:
      details = `Editó el tablero "${boardTitle}"`;
      break;
    default:
      details = `Acción ${action} en tablero "${boardTitle}"`;
  }
  
  return logAuditAction(
    user, 
    action, 
    details, 
    TARGET_TYPES.BOARD, 
    boardId,
    {
      boardTitle,
      ...additionalInfo
    }
  );
};

export const logUserAction = (user, action, targetUsername, targetUserId, additionalInfo = {}) => {
  let details = '';
  
  switch (action) {
    case AUDIT_ACTIONS.USER_LOGIN:
      details = `Inició sesión en el sistema`;
      break;
    case AUDIT_ACTIONS.USER_LOGOUT:
      details = `Cerró sesión`;
      break;
    case AUDIT_ACTIONS.USER_REGISTER:
      details = `Se registró en el sistema`;
      break;
    case AUDIT_ACTIONS.CREATE_USER:
      details = `Creó el usuario "${targetUsername}"`;
      break;
    case AUDIT_ACTIONS.EDIT_USER:
      details = `Editó el usuario "${targetUsername}"`;
      break;
    case AUDIT_ACTIONS.DELETE_USER:
      details = `Eliminó el usuario "${targetUsername}"`;
      break;
    case AUDIT_ACTIONS.CHANGE_PASSWORD:
      details = `Cambió la contraseña ${targetUsername === user?.username ? 'propia' : `del usuario "${targetUsername}"`}`;
      break;
    case AUDIT_ACTIONS.RESET_PASSWORD:
      details = `Solicitó recuperación de contraseña${targetUsername ? ` para "${targetUsername}"` : ''}`;
      break;
    default:
      details = `Acción ${action} en usuario "${targetUsername}"`;
  }
  
  return logAuditAction(
    user, 
    action, 
    details, 
    TARGET_TYPES.USER, 
    targetUserId,
    {
      targetUsername,
      ...additionalInfo
    }
  );
};

// Función para obtener estadísticas de auditoría
export const getAuditStats = (user = null) => {
  const auditLog = user?.role === 'admin' ? loadAuditLog() : getAuditLog({ userId: user?.id });
  
  const stats = {
    totalActions: auditLog.length,
    actionsByType: {},
    actionsByUser: {},
    recentActions: auditLog.slice(0, 10),
    todayActions: 0,
    thisWeekActions: 0
  };
  
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  auditLog.forEach(entry => {
    // Contar por tipo de acción
    stats.actionsByType[entry.action] = (stats.actionsByType[entry.action] || 0) + 1;
    
    // Contar por usuario
    stats.actionsByUser[entry.username] = (stats.actionsByUser[entry.username] || 0) + 1;
    
    // Contar acciones de hoy
    const entryDate = new Date(entry.timestamp);
    if (entryDate >= todayStart) {
      stats.todayActions++;
    }
    
    // Contar acciones de esta semana
    if (entryDate >= weekAgo) {
      stats.thisWeekActions++;
    }
  });
  
  return stats;
};

// Limpiar auditorías antiguas (mantener solo los últimos N días)
export const cleanOldAudits = (daysToKeep = 30) => {
  const auditLog = loadAuditLog();
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const filteredLog = auditLog.filter(entry => 
    new Date(entry.timestamp) > cutoffDate
  );
  
  saveAuditLog(filteredLog);
  return auditLog.length - filteredLog.length; // Retorna cantidad de registros eliminados
};