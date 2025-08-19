import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Edit3, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff, 
  Shield, 
  ShieldOff, 
  Key,
  Search,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  loadUsers, 
  saveUsers, 
  generateId, 
  hashPassword, 
  validateEmail, 
  validateUsername, 
  validatePassword,
  updateUserPassword
} from '../utils/auth';
import { logUserAction, AUDIT_ACTIONS } from '../utils/audit';

const UserAdminPanel = ({ currentUser, onClose }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para formularios
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    active: true
  });
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({});
  
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const userData = loadUsers();
    setUsers(userData);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = () => {
    // Validaciones
    if (!validateUsername(newUser.username)) {
      showMessage('error', t('invalid_username'));
      return;
    }
    
    if (!validateEmail(newUser.email)) {
      showMessage('error', t('invalid_email'));
      return;
    }
    
    if (!validatePassword(newUser.password)) {
      showMessage('error', t('password_min_6_chars'));
      return;
    }
    
    // Verificar que no exista el usuario
    const existingUser = users.find(u => 
      u.username === newUser.username || u.email === newUser.email
    );
    
    if (existingUser) {
      showMessage('error', t('user_email_exists'));
      return;
    }
    
    // Crear usuario
    const userToCreate = {
      id: generateId(),
      username: newUser.username,
      email: newUser.email,
      password: hashPassword(newUser.password),
      role: newUser.role,
      active: newUser.active,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    const updatedUsers = [...users, userToCreate];
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    
    // Log de auditoría
    logUserAction(currentUser, AUDIT_ACTIONS.CREATE_USER, newUser.username, userToCreate.id, {
      role: newUser.role,
      active: newUser.active
    });
    
    showMessage('success', t('user_created_successfully', { username: newUser.username }));
    
    // Limpiar formulario
    setNewUser({
      username: '',
      email: '',
      password: '',
      role: 'user',
      active: true
    });
    setShowAddForm(false);
  };

  const handleUpdateUser = (userId, updates) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    );
    
    saveUsers(updatedUsers);
    setUsers(updatedUsers);
    
    const user = users.find(u => u.id === userId);
    logUserAction(currentUser, AUDIT_ACTIONS.EDIT_USER, user.username, userId, updates);
    
    showMessage('success', t('user_updated_successfully'));
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    const user = users.find(u => u.id === userId);
    
    if (user.id === currentUser.id) {
      showMessage('error', t('cannot_delete_own_account'));
      return;
    }
    
    if (window.confirm(t('confirm_delete_user', { username: user.username }))) {
      const updatedUsers = users.filter(u => u.id !== userId);
      saveUsers(updatedUsers);
      setUsers(updatedUsers);
      
      logUserAction(currentUser, AUDIT_ACTIONS.DELETE_USER, user.username, userId);
      showMessage('success', t('user_deleted', { username: user.username }));
    }
  };

  const handleChangePassword = (userId) => {
    if (!validatePassword(passwordForm.newPassword)) {
      showMessage('error', t('password_min_6_chars'));
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', t('passwords_dont_match'));
      return;
    }
    
    const result = updateUserPassword(userId, passwordForm.newPassword, currentUser);
    
    if (result.success) {
      const user = users.find(u => u.id === userId);
      logUserAction(currentUser, AUDIT_ACTIONS.CHANGE_PASSWORD, user.username, userId);
      showMessage('success', t('password_updated_successfully'));
      setShowPasswordForm(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      loadUserData(); // Recargar datos
    } else {
      showMessage('error', result.error);
    }
  };

  const toggleShowPassword = (fieldId) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('access_denied')}</h3>
            <p className="text-gray-600 mb-4">{t('no_admin_permissions')}</p>
            <button
              onClick={onClose}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('user_admin_panel')}</h2>
            <p className="text-gray-600">{t('manage_system_users')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Controls */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={t('search_users')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                {t('users_found', { count: filteredUsers.length })}
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>{t('new_user')}</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('last_login')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">ID: {user.id.substr(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? <Shield size={12} className="mr-1" /> : <User size={12} className="mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : t('never')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-800"
                      title={t('edit_user')}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => setShowPasswordForm(user.id)}
                      className="text-green-600 hover:text-green-800"
                      title={t('change_password')}
                    >
                      <Key size={16} />
                    </button>
                    <button
                      onClick={() => handleUpdateUser(user.id, { active: !user.active })}
                      className={user.active ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
                      title={user.active ? t('deactivate_user') : t('activate_user')}
                    >
                      {user.active ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                        title={t('delete_user')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_users_found')}</h3>
              <p className="text-gray-500">
                {searchTerm ? t('try_different_search') : t('no_registered_users')}
              </p>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{t('create_new_user')}</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={t('username')}
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder={t('email')}
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="relative">
                  <input
                    type={showPasswords.newUser ? 'text' : 'password'}
                    placeholder={t('password')}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('newUser')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.newUser ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">{t('user')}</option>
                  <option value="admin">{t('admin')}</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.active}
                    onChange={(e) => setNewUser({...newUser, active: e.target.checked})}
                    className="rounded"
                  />
                  <span>{t('active_user')}</span>
                </label>
              </div>
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={handleCreateUser}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  {t('create_user')}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {selectedUser && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{t('edit_user_title', { username: selectedUser.username })}</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('username')}
                />
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('email')}
                />
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">{t('user')}</option>
                  <option value="admin">{t('admin')}</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUser.active}
                    onChange={(e) => setSelectedUser({...selectedUser, active: e.target.checked})}
                    className="rounded"
                  />
                  <span>{t('active_user')}</span>
                </label>
              </div>
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => handleUpdateUser(selectedUser.id, selectedUser)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  {t('save_changes')}
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {t('change_password_for', { username: users.find(u => u.id === showPasswordForm)?.username })}
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPasswords.changePass1 ? 'text' : 'password'}
                    placeholder={t('new_password')}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('changePass1')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.changePass1 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswords.changePass2 ? 'text' : 'password'}
                    placeholder={t('confirm_password')}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('changePass2')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.changePass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => handleChangePassword(showPasswordForm)}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                >
                  {t('change_password')}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(null);
                    setPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAdminPanel;