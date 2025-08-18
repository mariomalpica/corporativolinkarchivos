// Utilidades para autenticación y manejo de usuarios

// Simulación simple de hash para localStorage (en producción usar bcrypt)
export const hashPassword = (password) => {
  // Simple hash simulation - en producción usar una librería real
  return btoa(password + 'salt_secreto_2024').replace(/[^a-zA-Z0-9]/g, '');
};

export const verifyPassword = (password, hash) => {
  return hashPassword(password) === hash;
};

// Generar ID único
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validaciones
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateUsername = (username) => {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

// Gestión de usuarios en localStorage
export const saveUsers = (users) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('trello_users', JSON.stringify(users));
  }
};

export const loadUsers = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('trello_users');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
};

export const saveCurrentUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('trello_current_user', JSON.stringify(user));
    localStorage.setItem('trello_session_start', Date.now().toString());
  }
};

export const loadCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('trello_current_user');
    const sessionStart = localStorage.getItem('trello_session_start');
    
    if (stored && sessionStart) {
      // Verificar que la sesión no haya expirado (24 horas)
      const sessionAge = Date.now() - parseInt(sessionStart);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (sessionAge < maxAge) {
        return JSON.parse(stored);
      } else {
        // Sesión expirada
        clearSession();
      }
    }
  }
  return null;
};

export const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('trello_current_user');
    localStorage.removeItem('trello_session_start');
  }
};

// Crear usuario por defecto admin
export const createDefaultAdmin = () => {
  const users = loadUsers();
  
  // Si no hay usuarios, crear admin por defecto
  if (users.length === 0) {
    const adminUser = {
      id: generateId(),
      username: 'admin',
      email: 'admin@trello.com',
      password: hashPassword('admin123'),
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    saveUsers([adminUser]);
    return adminUser;
  }
  
  return null;
};

// Funciones de autenticación
export const loginUser = (username, password) => {
  const users = loadUsers();
  const user = users.find(u => 
    (u.username === username || u.email === username) && 
    u.active === true
  );
  
  if (user && verifyPassword(password, user.password)) {
    // Actualizar último login
    user.lastLogin = new Date().toISOString();
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    saveUsers(updatedUsers);
    
    // Guardar sesión (sin la contraseña)
    const userSession = { ...user };
    delete userSession.password;
    saveCurrentUser(userSession);
    
    return userSession;
  }
  
  return null;
};

export const registerUser = (userData) => {
  const users = loadUsers();
  
  // Verificar que username y email no existan
  const existingUser = users.find(u => 
    u.username === userData.username || u.email === userData.email
  );
  
  if (existingUser) {
    return { error: 'Usuario o email ya existe' };
  }
  
  // Crear nuevo usuario
  const newUser = {
    id: generateId(),
    username: userData.username,
    email: userData.email,
    password: hashPassword(userData.password),
    role: 'user', // Los nuevos usuarios son 'user' por defecto
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  
  // Auto-login después del registro
  const userSession = { ...newUser };
  delete userSession.password;
  saveCurrentUser(userSession);
  
  return { success: true, user: userSession };
};

export const updateUserPassword = (userId, newPassword, currentUser) => {
  const users = loadUsers();
  
  // Solo admin o el mismo usuario pueden cambiar contraseña
  if (currentUser.role !== 'admin' && currentUser.id !== userId) {
    return { error: 'Sin permisos para cambiar contraseña' };
  }
  
  const updatedUsers = users.map(user => 
    user.id === userId 
      ? { ...user, password: hashPassword(newPassword) }
      : user
  );
  
  saveUsers(updatedUsers);
  return { success: true };
};

export const resetPassword = (email) => {
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { error: 'Email no encontrado' };
  }
  
  // Generar contraseña temporal
  const tempPassword = generateId().substr(0, 8);
  
  const updatedUsers = users.map(u => 
    u.id === user.id 
      ? { ...u, password: hashPassword(tempPassword) }
      : u
  );
  
  saveUsers(updatedUsers);
  
  // En un sistema real, aquí se enviaría el email
  return { 
    success: true, 
    tempPassword, 
    message: `Contraseña temporal: ${tempPassword}` 
  };
};