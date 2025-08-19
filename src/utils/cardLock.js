// Utilidades para el sistema de bloqueo de tarjetas

const CARD_LOCKS_KEY = 'trello_clone_card_locks';
const LOCK_SESSIONS_KEY = 'trello_clone_lock_sessions';
const SESSION_DURATION_HOURS = 24;

// Obtener todos los bloqueos de tarjetas
export const getCardLocks = () => {
  try {
    const saved = localStorage.getItem(CARD_LOCKS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Error loading card locks:', error);
    return {};
  }
};

// Guardar bloqueos de tarjetas
export const saveCardLocks = (locks) => {
  try {
    localStorage.setItem(CARD_LOCKS_KEY, JSON.stringify(locks));
    return true;
  } catch (error) {
    console.error('Error saving card locks:', error);
    return false;
  }
};

// Bloquear una tarjeta
export const lockCard = (cardId, password, createdBy, userEmail) => {
  try {
    const locks = getCardLocks();
    const lockId = generateLockId();
    
    locks[cardId] = {
      lockId,
      password: password,
      createdBy: createdBy,
      userEmail: userEmail,
      lockedAt: new Date().toISOString(),
      isLocked: true
    };
    
    saveCardLocks(locks);
    return { success: true, lockId };
  } catch (error) {
    console.error('Error locking card:', error);
    return { success: false, error: error.message };
  }
};

// Desbloquear una tarjeta
export const unlockCard = (cardId, password, currentUser) => {
  try {
    const locks = getCardLocks();
    const cardLock = locks[cardId];
    
    if (!cardLock || !cardLock.isLocked) {
      return { success: false, error: 'La tarjeta no está bloqueada' };
    }
    
    // Solo el creador del bloqueo o el admin pueden desbloquear
    if (currentUser.role !== 'admin' && currentUser.username !== cardLock.createdBy) {
      return { success: false, error: 'No tienes permisos para desbloquear esta tarjeta' };
    }
    
    // Verificar contraseña
    if (cardLock.password !== password) {
      return { success: false, error: 'Contraseña incorrecta' };
    }
    
    // Crear sesión temporal para el usuario (antes de desbloquear)
    setUnlockSession(cardId, currentUser.username);
    
    // Desbloquear
    delete locks[cardId];
    saveCardLocks(locks);
    
    return { success: true };
  } catch (error) {
    console.error('Error unlocking card:', error);
    return { success: false, error: error.message };
  }
};

// Verificar si una tarjeta está bloqueada
export const isCardLocked = (cardId) => {
  const locks = getCardLocks();
  const cardLock = locks[cardId];
  return !!(cardLock && cardLock.isLocked);
};

// Obtener información del bloqueo de una tarjeta
export const getCardLockInfo = (cardId) => {
  const locks = getCardLocks();
  return locks[cardId] || null;
};

// Verificar si el usuario puede editar/mover una tarjeta
export const canUserEditCard = (cardId, currentUser, cardCreator) => {
  // Si la tarjeta no está bloqueada, cualquiera puede editar
  if (!isCardLocked(cardId)) {
    return { canEdit: true, reason: 'unlocked' };
  }
  
  // Si la tarjeta está bloqueada, SOLO se puede editar con sesión válida (después de desbloquear con contraseña)
  const lockInfo = getCardLockInfo(cardId);
  
  // Si el usuario actual es el creador original de la tarjeta y tiene sesión válida
  if (cardCreator === currentUser.username && hasValidUnlockSession(cardId, currentUser.username)) {
    return { canEdit: true, reason: 'card_creator_with_session' };
  }
  
  // Si es admin y tiene sesión válida (debe haber desbloqueado con contraseña)
  if (currentUser.role === 'admin' && hasValidUnlockSession(cardId, currentUser.username)) {
    return { canEdit: true, reason: 'admin_with_session' };
  }
  
  // Si el usuario creó el bloqueo y tiene sesión válida
  if (lockInfo && lockInfo.createdBy === currentUser.username && hasValidUnlockSession(cardId, currentUser.username)) {
    return { canEdit: true, reason: 'lock_creator_with_session' };
  }
  
  return { canEdit: false, reason: 'locked' };
};

// Generar ID único para bloqueo
const generateLockId = () => {
  return 'lock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Manejar sesiones de desbloqueo temporal
export const getUnlockSessions = () => {
  try {
    const saved = localStorage.getItem(LOCK_SESSIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Error loading unlock sessions:', error);
    return {};
  }
};

export const setUnlockSession = (cardId, username) => {
  const sessions = getUnlockSessions();
  const sessionKey = `${cardId}_${username}`;
  
  sessions[sessionKey] = {
    cardId,
    username,
    unlockedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString()
  };
  
  try {
    localStorage.setItem(LOCK_SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Error saving unlock session:', error);
    return false;
  }
};

export const hasValidUnlockSession = (cardId, username) => {
  const sessions = getUnlockSessions();
  const sessionKey = `${cardId}_${username}`;
  const session = sessions[sessionKey];
  
  if (!session) return false;
  
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  
  return now < expiresAt;
};

export const clearExpiredSessions = () => {
  const sessions = getUnlockSessions();
  const now = new Date();
  const validSessions = {};
  
  Object.keys(sessions).forEach(sessionKey => {
    const session = sessions[sessionKey];
    const expiresAt = new Date(session.expiresAt);
    
    if (now < expiresAt) {
      validSessions[sessionKey] = session;
    }
  });
  
  try {
    localStorage.setItem(LOCK_SESSIONS_KEY, JSON.stringify(validSessions));
    return true;
  } catch (error) {
    console.error('Error clearing expired sessions:', error);
    return false;
  }
};

// Sistema de recuperación de contraseña por email (simulado)
export const requestPasswordRecovery = async (cardId, userEmail) => {
  try {
    const lockInfo = getCardLockInfo(cardId);
    
    if (!lockInfo) {
      return { success: false, error: 'Esta tarjeta no está bloqueada' };
    }
    
    if (lockInfo.userEmail !== userEmail) {
      return { success: false, error: 'El email no coincide con el registrado para este bloqueo' };
    }
    
    // Simular envío de email
    console.log(`📧 Email enviado a ${userEmail} con la contraseña: ${lockInfo.password}`);
    
    // En un sistema real, aquí se enviaría un email con la contraseña o un enlace de recuperación
    return { 
      success: true, 
      message: `Se ha enviado la contraseña a ${userEmail}. Revisa tu bandeja de entrada.`,
      // Solo para desarrollo - NO hacer esto en producción
      password: lockInfo.password 
    };
  } catch (error) {
    console.error('Error requesting password recovery:', error);
    return { success: false, error: error.message };
  }
};

// Obtener estadísticas de bloqueos
export const getLockStats = () => {
  const locks = getCardLocks();
  const totalLocks = Object.keys(locks).length;
  const sessions = getUnlockSessions();
  const activeSessions = Object.keys(sessions).filter(sessionKey => {
    const session = sessions[sessionKey];
    const expiresAt = new Date(session.expiresAt);
    return new Date() < expiresAt;
  }).length;
  
  return {
    totalLockedCards: totalLocks,
    activeUnlockSessions: activeSessions
  };
};

// Limpiar automáticamente sesiones expiradas
export const autoCleanup = () => {
  clearExpiredSessions();
};