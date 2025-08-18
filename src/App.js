import React, { useState, useEffect } from 'react';
import VercelTrello from './VercelTrello';
import TestAPI from './TestAPI';
import DebugAuth from './DebugAuth';
import AuthModal from './components/AuthModal';
import UserAdminPanel from './components/UserAdminPanel';
import AuditPanel from './components/AuditPanel';
import { 
  loadCurrentUser, 
  clearSession, 
  createDefaultAdmin 
} from './utils/auth';
import { logUserAction, AUDIT_ACTIONS } from './utils/audit';
import { LogOut, Users, Activity, Shield } from 'lucide-react';
import './index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showTestAPI, setShowTestAPI] = useState(false);
  const [showDebugAuth, setShowDebugAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Crear admin por defecto si no existe
    createDefaultAdmin();
    
    // Cargar usuario actual
    const user = loadCurrentUser();
    setCurrentUser(user);
    setLoading(false);
    
    // Si no hay usuario, mostrar modal de login
    if (!user) {
      setShowAuthModal(true);
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    if (currentUser) {
      logUserAction(currentUser, AUDIT_ACTIONS.USER_LOGOUT, currentUser.username, currentUser.id);
    }
    clearSession();
    setCurrentUser(null);
    setShowAuthModal(true);
    setShowUserAdmin(false);
    setShowAuditPanel(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando aplicación...</div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar solo el modal de login
  if (!currentUser) {
    return (
      <div className="App">
        {showAuthModal && (
          <AuthModal 
            onLogin={handleLogin} 
            onClose={() => setShowAuthModal(false)} 
          />
        )}
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Mi Tablero de Tareas</h1>
            <p className="text-gray-600 mb-8">Sistema de gestión de tareas con autenticación</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
            >
              Iniciar Sesión
            </button>
            <div className="mt-8 text-sm text-gray-500">
              <p>Usuario de prueba: <strong>admin</strong></p>
              <p>Contraseña: <strong>admin123</strong></p>
              <button
                onClick={() => setShowDebugAuth(true)}
                className="mt-4 text-blue-500 hover:text-blue-700 underline"
              >
                🔍 Debug Autenticación
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Header con información del usuario */}
      <div className="bg-white shadow-sm border-b px-6 py-3">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-800">
              Mi Tablero de Tareas
            </h1>
            <span className="text-sm text-gray-500">|</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                currentUser.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {currentUser.username}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentUser.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botón de administración (solo para admin) */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setShowUserAdmin(true)}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Administrar usuarios"
              >
                <Users size={16} />
                <span className="hidden sm:inline">Usuarios</span>
              </button>
            )}

            {/* Botón de logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Componente principal */}
      <VercelTrello 
        currentUser={currentUser} 
        onShowTestAPI={() => setShowTestAPI(true)}
        onShowAuditPanel={() => setShowAuditPanel(true)}
      />

      {/* Modales */}
      {showAuthModal && (
        <AuthModal 
          onLogin={handleLogin} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}

      {showUserAdmin && (
        <UserAdminPanel 
          currentUser={currentUser}
          onClose={() => setShowUserAdmin(false)} 
        />
      )}

      {showAuditPanel && (
        <AuditPanel 
          currentUser={currentUser}
          onClose={() => setShowAuditPanel(false)} 
        />
      )}

      {showTestAPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Diagnóstico de API Compartida</h2>
              <button
                onClick={() => setShowTestAPI(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <TestAPI />
          </div>
        </div>
      )}

      {showDebugAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">🔍 Debug Autenticación</h2>
              <button
                onClick={() => setShowDebugAuth(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <DebugAuth />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;