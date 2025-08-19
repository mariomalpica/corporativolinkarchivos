import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VercelTrelloSimple from './VercelTrelloSimple';
import TestAPI from './TestAPI';
import DebugAuth from './DebugAuth';
import AuthModal from './components/AuthModal';
import UserAdminPanel from './components/UserAdminPanel';
import AuditPanel from './components/AuditPanel';
import GanttChart from './components/GanttChart';
import CalendarView from './components/CalendarView';
import ExcelManager from './components/ExcelManager';
import TitleSettings from './components/TitleSettings';
import EmailSettings from './components/EmailSettings';
import AISettings from './components/AISettings';
import AIDashboard from './components/AIDashboard';
import WorkspaceSelector from './components/WorkspaceSelector';
import TrashManager from './components/TrashManager';
import LanguageSelector from './components/LanguageSelector';
import { 
  loadCurrentUser, 
  clearSession, 
  createDefaultAdmin 
} from './utils/auth';
import { logUserAction, AUDIT_ACTIONS } from './utils/audit';
import { getCurrentWorkspaceId, getWorkspaceById, updateWorkspace } from './utils/workspaces';
import { LogOut, Users, Calendar, BarChart3, Search, FileSpreadsheet, Settings, Trash2, Mail, Brain } from 'lucide-react';
import './index.css';

function App() {
  const { t, i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showTestAPI, setShowTestAPI] = useState(false);
  const [showDebugAuth, setShowDebugAuth] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showGanttChart, setShowGanttChart] = useState(false);
  const [showExcelManager, setShowExcelManager] = useState(false);
  const [showTitleSettings, setShowTitleSettings] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAIDashboard, setShowAIDashboard] = useState(false);
  const [showTrashManager, setShowTrashManager] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [boardsData, setBoardsData] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const moreMenuRef = useRef(null);

  // Debug i18n
  useEffect(() => {
    console.log('🌍 i18n Debug Info:');
    console.log('🌍 Current language:', i18n.language);
    console.log('🌍 Available languages:', i18n.languages);
    console.log('🌍 Is initialized:', i18n.isInitialized);
    console.log('🌍 Test translation "login":', t('login'));
    console.log('🌍 Resources en:', i18n.getResourceBundle('en'));
    console.log('🌍 Resources es:', i18n.getResourceBundle('es'));
  }, [i18n, t]);

  useEffect(() => {
    // Crear admin por defecto si no existe
    createDefaultAdmin();
    
    // Cargar usuario actual
    const user = loadCurrentUser();
    setCurrentUser(user);
    
    // Cargar workspace actual
    const currentWorkspaceId = getCurrentWorkspaceId();
    const workspace = getWorkspaceById(currentWorkspaceId);
    setCurrentWorkspace(workspace);
    setBoardsData(workspace.boards || []);
    
    setLoading(false);
    
    // Si no hay usuario, mostrar modal de login
    if (!user) {
      setShowAuthModal(true);
    }
  }, []);

  // Cerrar menú "Más" cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    setShowGanttChart(false);
    setShowCalendarView(false);
    setShowExcelManager(false);
    setShowTitleSettings(false);
    setShowEmailSettings(false);
    setShowAISettings(false);
    setShowAIDashboard(false);
    setShowTrashManager(false);
    setShowMoreMenu(false);
  };

  const handleBoardsUpdate = (boards) => {
    setBoardsData(boards);
  };

  const handleExcelImport = async (importedBoards) => {
    // Actualizar los datos locales
    setBoardsData(prevBoards => [...prevBoards, ...importedBoards]);
    
    // Notificar al componente VercelTrelloSimple que hay nuevos boards
    // Esto se hará a través de un callback que pasaremos
    if (window.handleBoardsImport) {
      window.handleBoardsImport(importedBoards);
    }
    
    setShowExcelManager(false);
  };

  const handleTitleUpdate = (newTitleConfig) => {
    // Notificar al componente VercelTrelloSimple sobre el cambio de título
    if (window.handleTitleUpdate) {
      window.handleTitleUpdate(newTitleConfig);
    }
  };

  const handleWorkspaceChange = (workspace) => {
    setCurrentWorkspace(workspace);
    setBoardsData(workspace.boards || []);
    
    // Notificar al componente VercelTrelloSimple sobre el cambio de workspace
    if (window.handleWorkspaceChange) {
      window.handleWorkspaceChange(workspace);
    }
  };

  const handleCardRestore = async (card, originalBoardId, workspaceId) => {
    try {
      // Obtener el workspace donde se debe restaurar la tarjeta
      const workspace = getWorkspaceById(workspaceId);
      if (!workspace) {
        console.error('Workspace no encontrado para restaurar tarjeta');
        return false;
      }

      // Buscar el tablero original
      const boardIndex = workspace.boards.findIndex(board => board.id === originalBoardId);
      if (boardIndex === -1) {
        console.error('Tablero original no encontrado para restaurar tarjeta');
        return false;
      }

      // Agregar la tarjeta al tablero original
      const updatedBoards = [...workspace.boards];
      updatedBoards[boardIndex] = {
        ...updatedBoards[boardIndex],
        cards: [...updatedBoards[boardIndex].cards, card]
      };

      // Actualizar el workspace
      const updatedWorkspace = updateWorkspace(workspaceId, {
        boards: updatedBoards
      });

      if (updatedWorkspace) {
        // Si es el workspace actual, actualizar los boards en la interfaz
        if (workspaceId === getCurrentWorkspaceId()) {
          setBoardsData(updatedBoards);
          
          // Notificar al componente VercelTrelloSimple
          if (window.handleWorkspaceChange) {
            window.handleWorkspaceChange(updatedWorkspace);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al restaurar tarjeta:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">{t('loading_app')}</div>
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
            {/* Selector de idioma en login */}
            <div className="absolute top-4 right-4">
              <LanguageSelector />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('login_title')}</h1>
            <p className="text-gray-600 mb-8">{t('task_management_system')}</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
            >
              {t('login')}
            </button>
            <div className="mt-8 text-sm text-gray-500">
              <p>{t('test_user')} <strong>admin</strong></p>
              <p>{t('password')} <strong>admin123</strong></p>
              <button
                onClick={() => setShowDebugAuth(true)}
                className="mt-4 text-blue-500 hover:text-blue-700 underline"
              >
                {t('debug_auth')}
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
      <div className="bg-white shadow-sm border-b px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center max-w-7xl mx-auto gap-2 sm:gap-4">
          {/* Left section: Workspace selector and user info */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <WorkspaceSelector onWorkspaceChange={handleWorkspaceChange} />
            <span className="text-sm text-gray-500 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                currentUser.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
              }`}></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-20 sm:max-w-none">
                {currentUser.username}
              </span>
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                currentUser.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Middle section: Search bar */}
          <div className="flex-1 max-w-md sm:max-w-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <span className="h-4 w-4 text-gray-400 hover:text-gray-600">✕</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 relative">
            {/* Selector de idioma */}
            <LanguageSelector />
            
            {/* Botón Gantt Chart */}
            <button
              onClick={() => setShowGanttChart(true)}
              className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded touch-manipulation"
              title={t('gantt')}
            >
              <BarChart3 size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm">{t('gantt')}</span>
            </button>

            {/* Botón Calendario */}
            <button
              onClick={() => setShowCalendarView(true)}
              className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded touch-manipulation"
              title={t('calendar')}
            >
              <Calendar size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm">{t('calendar')}</span>
            </button>

            {/* Botón AI Dashboard */}
            <button
              onClick={() => setShowAIDashboard(true)}
              className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded touch-manipulation"
              title={t('ai_dashboard')}
            >
              <Brain size={16} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm">{t('ai_dashboard')}</span>
            </button>

            {/* Menú desplegable "Opciones" */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center space-x-1 px-2 sm:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded touch-manipulation"
                title={t('options')}
              >
                <Settings size={16} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-sm">{t('options')}</span>
              </button>

              {/* Dropdown del menú Opciones */}
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {/* Botón Titulo Config */}
                  <button
                    onClick={() => {
                      setShowTitleSettings(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <Settings size={16} />
                    <span>{t('title_config')}</span>
                  </button>

                  {/* Botón de administración (solo para admin) */}
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserAdmin(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left"
                    >
                      <Users size={16} />
                      <span>{t('manage_users')}</span>
                    </button>
                  )}

                  {/* Botón Excel */}
                  <button
                    onClick={() => {
                      setShowExcelManager(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <FileSpreadsheet size={16} />
                    <span>{t('import_export_excel')}</span>
                  </button>

                  {/* Botón Email Settings */}
                  <button
                    onClick={() => {
                      setShowEmailSettings(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <Mail size={16} />
                    <span>{t('email_settings')}</span>
                  </button>

                  {/* Botón AI Settings */}
                  <button
                    onClick={() => {
                      setShowAISettings(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left"
                  >
                    <Brain size={16} />
                    <span>{t('ai_integration')}</span>
                  </button>

                  {/* Botón Papelera */}
                  <button
                    onClick={() => {
                      setShowTrashManager(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 text-left border-b border-gray-100"
                  >
                    <Trash2 size={16} />
                    <span>{t('trash')}</span>
                  </button>

                  {/* Botón de logout */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut size={16} />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Componente principal */}
      <VercelTrelloSimple 
        currentUser={currentUser}
        onBoardsUpdate={handleBoardsUpdate}
        searchTerm={searchTerm}
        onImportBoards={handleExcelImport}
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

      {showGanttChart && (
        <GanttChart 
          boards={boardsData}
          onClose={() => setShowGanttChart(false)}
        />
      )}

      {showCalendarView && (
        <CalendarView 
          boards={boardsData}
          onClose={() => setShowCalendarView(false)}
        />
      )}

      {showExcelManager && (
        <ExcelManager 
          boards={boardsData}
          onClose={() => setShowExcelManager(false)}
          onImport={handleExcelImport}
        />
      )}

      {showTitleSettings && (
        <TitleSettings 
          onClose={() => setShowTitleSettings(false)}
          onTitleUpdate={handleTitleUpdate}
        />
      )}

      {showTrashManager && (
        <TrashManager
          onClose={() => setShowTrashManager(false)}
          onCardRestore={handleCardRestore}
        />
      )}

      {showEmailSettings && (
        <EmailSettings
          onClose={() => setShowEmailSettings(false)}
        />
      )}

      {showAISettings && (
        <AISettings
          onClose={() => setShowAISettings(false)}
        />
      )}

      {showAIDashboard && (
        <AIDashboard
          boards={boardsData}
          onClose={() => setShowAIDashboard(false)}
        />
      )}
    </div>
  );
}

export default App;