import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, Lock, Unlock, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { 
  loadWorkspaces, 
  getCurrentWorkspaceId, 
  getWorkspaceById,
  setCurrentWorkspaceId,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  verifyWorkspacePassword,
  setWorkspaceSession,
  clearWorkspaceSession,
  isWorkspaceSessionValid
} from '../utils/workspaces';

const WorkspaceSelector = ({ onWorkspaceChange }) => {
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState(getCurrentWorkspaceId());
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState(null);
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);
  const [settingsWorkspaceId, setSettingsWorkspaceId] = useState(null);
  
  // Estados para crear workspace
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [newWorkspaceHasPassword, setNewWorkspaceHasPassword] = useState(false);
  const [newWorkspacePassword, setNewWorkspacePassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Estados para contraseña
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  
  // Estados para configuración de contraseña
  const [settingsHasPassword, setSettingsHasPassword] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState('');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [showSettingsCurrentPassword, setShowSettingsCurrentPassword] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const dropdownRef = useRef(null);

  useEffect(() => {
    setWorkspaces(loadWorkspaces());
  }, []);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentWorkspace = () => {
    return workspaces.find(ws => ws.id === currentWorkspaceId) || workspaces[0];
  };

  const handleWorkspaceSelect = async (workspaceId) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    
    if (!workspace) return;

    // Si tiene contraseña y no hay sesión válida, mostrar prompt
    if (workspace.hasPassword && !isWorkspaceSessionValid(workspaceId)) {
      setPendingWorkspaceId(workspaceId);
      setShowPasswordPrompt(true);
      setShowDropdown(false);
      setPasswordError('');
      setPasswordInput('');
      return;
    }

    // Cambiar workspace
    switchToWorkspace(workspaceId);
  };

  const switchToWorkspace = (workspaceId) => {
    setCurrentWorkspaceIdState(workspaceId);
    setCurrentWorkspaceId(workspaceId);
    setShowDropdown(false);
    
    const workspace = getWorkspaceById(workspaceId);
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace);
    }
  };

  const handlePasswordSubmit = () => {
    const workspace = workspaces.find(ws => ws.id === pendingWorkspaceId);
    
    if (verifyWorkspacePassword(pendingWorkspaceId, passwordInput)) {
      // Contraseña correcta, establecer sesión
      setWorkspaceSession(pendingWorkspaceId, { authenticated: true });
      switchToWorkspace(pendingWorkspaceId);
      setShowPasswordPrompt(false);
      setPendingWorkspaceId(null);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError(t('incorrect_password'));
    }
  };

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;

    const workspaceData = {
      name: newWorkspaceName.trim(),
      description: newWorkspaceDescription.trim(),
      hasPassword: newWorkspaceHasPassword,
      password: newWorkspaceHasPassword ? newWorkspacePassword : null
    };

    const newWorkspace = createWorkspace(workspaceData);
    const updatedWorkspaces = loadWorkspaces();
    setWorkspaces(updatedWorkspaces);
    
    // Cambiar automáticamente al nuevo workspace
    switchToWorkspace(newWorkspace.id);
    
    // Limpiar formulario
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setNewWorkspaceHasPassword(false);
    setNewWorkspacePassword('');
    setShowCreateForm(false);
    setShowDropdown(false);
  };

  const handleDeleteWorkspace = (workspaceId, event) => {
    event.stopPropagation();
    
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    const confirmDelete = window.confirm(
      t('confirm_delete_workspace', { workspaceName: workspace.name })
    );
    
    if (confirmDelete) {
      if (deleteWorkspace(workspaceId)) {
        const updatedWorkspaces = loadWorkspaces();
        setWorkspaces(updatedWorkspaces);
        
        // Si era el workspace actual, cambiar al primero disponible
        if (currentWorkspaceId === workspaceId) {
          const newCurrentId = updatedWorkspaces[0]?.id || 'trabajo';
          switchToWorkspace(newCurrentId);
        }
      }
    }
  };

  const handlePasswordSettings = (workspaceId, event) => {
    event.stopPropagation();
    
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    setSettingsWorkspaceId(workspaceId);
    setSettingsHasPassword(workspace.hasPassword || false);
    setSettingsPassword('');
    setSettingsCurrentPassword('');
    setSettingsError('');
    setShowPasswordSettings(true);
    setShowDropdown(false);
  };

  const handleSavePasswordSettings = () => {
    const workspace = workspaces.find(ws => ws.id === settingsWorkspaceId);
    
    // Si ya tiene contraseña, verificar la contraseña actual
    if (workspace.hasPassword && !verifyWorkspacePassword(settingsWorkspaceId, settingsCurrentPassword)) {
      setSettingsError(t('current_password_incorrect'));
      return;
    }

    // Actualizar la configuración
    const updatedData = {
      hasPassword: settingsHasPassword,
      password: settingsHasPassword ? settingsPassword : null
    };

    const updatedWorkspace = updateWorkspace(settingsWorkspaceId, updatedData);
    
    if (updatedWorkspace) {
      const updatedWorkspaces = loadWorkspaces();
      setWorkspaces(updatedWorkspaces);
      
      // Limpiar sesión si se deshabilitó la contraseña
      if (!settingsHasPassword && workspace.hasPassword) {
        clearWorkspaceSession(settingsWorkspaceId);
      }
      
      // Cerrar modal
      setShowPasswordSettings(false);
      setSettingsWorkspaceId(null);
      setSettingsError('');
    } else {
      setSettingsError(t('error_updating_settings'));
    }
  };

  const currentWorkspace = getCurrentWorkspace();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector principal */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-colors touch-manipulation min-w-64"
      >
        <div className="flex items-center space-x-2 min-w-0">
          {currentWorkspace?.hasPassword && (
            <Lock size={14} className="text-gray-500 flex-shrink-0" />
          )}
          <span className="font-medium text-gray-800 truncate">
            {currentWorkspace?.name || t('work')}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {!showCreateForm ? (
            <>
              {/* Lista de workspaces */}
              <div className="p-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 px-2 py-1">{t('workspaces')}</h3>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className={`group flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                      workspace.id === currentWorkspaceId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => handleWorkspaceSelect(workspace.id)}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {workspace.hasPassword ? (
                        <Lock size={14} className="text-gray-500 flex-shrink-0" />
                      ) : (
                        <Unlock size={14} className="text-gray-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-800 truncate">
                          {workspace.name}
                        </div>
                        {workspace.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {workspace.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {workspace.id === currentWorkspaceId && (
                      <span className="text-blue-600 text-xs font-medium">{t('current')}</span>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handlePasswordSettings(workspace.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-opacity"
                        title={t('configure_password')}
                      >
                        <Settings size={14} />
                      </button>
                      
                      {workspace.id !== 'trabajo' && (
                        <button
                          onClick={(e) => handleDeleteWorkspace(workspace.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                          title={t('delete_workspace')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón crear nuevo */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors touch-manipulation"
                >
                  <Plus size={16} />
                  <span className="text-sm">{t('create_new_workspace')}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Formulario de creación */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('new_workspace')}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('name')} *
                    </label>
                    <input
                      type="text"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder={t('workspace_name_placeholder')}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('description_optional')}
                    </label>
                    <input
                      type="text"
                      value={newWorkspaceDescription}
                      onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                      placeholder={t('workspace_description_placeholder')}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                    />
                  </div>
                  
                  {/* Opción de contraseña */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newWorkspaceHasPassword}
                        onChange={(e) => setNewWorkspaceHasPassword(e.target.checked)}
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {t('password_protect')}
                      </span>
                    </label>
                  </div>
                  
                  {newWorkspaceHasPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newWorkspacePassword}
                          onChange={(e) => setNewWorkspacePassword(e.target.value)}
                          placeholder={t('enter_secure_password')}
                          className="w-full p-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-6">
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={!newWorkspaceName.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {t('create')}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewWorkspaceName('');
                      setNewWorkspaceDescription('');
                      setNewWorkspaceHasPassword(false);
                      setNewWorkspacePassword('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de contraseña */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Lock className="mr-2" size={20} />
              {t('protected_workspace')}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {t('workspace_requires_password')}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPasswordInput ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder={t('enter_current_password')}
                  className="w-full p-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordInput ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-600 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handlePasswordSubmit}
                disabled={!passwordInput.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {t('access')}
              </button>
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPendingWorkspaceId(null);
                  setPasswordInput('');
                  setPasswordError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración de contraseña */}
      {showPasswordSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="mr-2" size={20} />
              {t('configure_password')}
            </h3>
            
            <div className="space-y-4">
              {/* Contraseña actual si ya tiene */}
              {workspaces.find(ws => ws.id === settingsWorkspaceId)?.hasPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('current_password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showSettingsCurrentPassword ? 'text' : 'password'}
                      value={settingsCurrentPassword}
                      onChange={(e) => {
                        setSettingsCurrentPassword(e.target.value);
                        setSettingsError('');
                      }}
                      placeholder={t('enter_current_password')}
                      className="w-full p-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowSettingsCurrentPassword(!showSettingsCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSettingsCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Checkbox para habilitar/deshabilitar contraseña */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settingsHasPassword}
                    onChange={(e) => setSettingsHasPassword(e.target.checked)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t('password_protect')}
                  </span>
                </label>
              </div>

              {/* Nueva contraseña si está habilitado */}
              {settingsHasPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {workspaces.find(ws => ws.id === settingsWorkspaceId)?.hasPassword ? t('new_password') : t('password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showSettingsPassword ? 'text' : 'password'}
                      value={settingsPassword}
                      onChange={(e) => setSettingsPassword(e.target.value)}
                      placeholder={t('enter_secure_password')}
                      className="w-full p-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSettingsPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {settingsError && (
                <p className="text-red-600 text-sm">{settingsError}</p>
              )}
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleSavePasswordSettings}
                disabled={
                  (workspaces.find(ws => ws.id === settingsWorkspaceId)?.hasPassword && !settingsCurrentPassword.trim()) ||
                  (settingsHasPassword && !settingsPassword.trim())
                }
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {t('save')}
              </button>
              <button
                onClick={() => {
                  setShowPasswordSettings(false);
                  setSettingsWorkspaceId(null);
                  setSettingsError('');
                  setSettingsCurrentPassword('');
                  setSettingsPassword('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSelector;