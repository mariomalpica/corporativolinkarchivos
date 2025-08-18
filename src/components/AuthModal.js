import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  validateEmail, 
  validatePassword, 
  validateUsername, 
  loginUser, 
  registerUser, 
  resetPassword 
} from '../utils/auth';
import { logUserAction, AUDIT_ACTIONS } from '../utils/audit';

const AuthModal = ({ onLogin, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Campos del formulario
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Errores de validación
  const [errors, setErrors] = useState({});

  const clearForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (mode === 'register') {
      if (!validateUsername(formData.username)) {
        newErrors.username = 'Usuario debe tener al menos 3 caracteres y solo letras, números y _';
      }
      
      if (!validateEmail(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      
      if (!validatePassword(formData.password)) {
        newErrors.password = 'Contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else if (mode === 'login') {
      if (!formData.username.trim()) {
        newErrors.username = 'Usuario o email requerido';
      }
      
      if (!formData.password.trim()) {
        newErrors.password = 'Contraseña requerida';
      }
    } else if (mode === 'forgot') {
      if (!validateEmail(formData.email)) {
        newErrors.email = 'Email inválido';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (mode === 'login') {
        const user = loginUser(formData.username, formData.password);
        
        if (user) {
          logUserAction(user, AUDIT_ACTIONS.USER_LOGIN, user.username, user.id);
          setMessage({ type: 'success', text: '¡Bienvenido!' });
          setTimeout(() => onLogin(user), 1000);
        } else {
          setMessage({ type: 'error', text: 'Usuario o contraseña incorrectos' });
        }
      } else if (mode === 'register') {
        const result = registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        
        if (result.success) {
          logUserAction(result.user, AUDIT_ACTIONS.USER_REGISTER, result.user.username, result.user.id);
          setMessage({ type: 'success', text: '¡Cuenta creada exitosamente!' });
          setTimeout(() => onLogin(result.user), 1000);
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      } else if (mode === 'forgot') {
        const result = resetPassword(formData.email);
        
        if (result.success) {
          logUserAction(null, AUDIT_ACTIONS.RESET_PASSWORD, '', null, { email: formData.email });
          setMessage({ 
            type: 'success', 
            text: `${result.message}. Usa esta contraseña para ingresar.` 
          });
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error del sistema. Intenta de nuevo.' });
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error específico cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'register' && 'Crear Cuenta'}
            {mode === 'forgot' && 'Recuperar Contraseña'}
          </h2>
          <p className="text-gray-600 mt-1">
            {mode === 'login' && 'Accede a tu tablero de tareas'}
            {mode === 'register' && 'Únete al sistema de gestión'}
            {mode === 'forgot' && 'Te enviaremos una contraseña temporal'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Mensaje de resultado */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Username field (login y register) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'login' ? 'Usuario o Email' : 'Usuario'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={mode === 'login' ? 'usuario o email@dominio.com' : 'nombreusuario'}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
          )}

          {/* Email field (register y forgot) */}
          {(mode === 'register' || mode === 'forgot') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="email@dominio.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          )}

          {/* Password field (login y register) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          )}

          {/* Confirm Password field (solo register) */}
          {mode === 'register' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Repite la contraseña"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'register' && 'Crear Cuenta'}
                {mode === 'forgot' && 'Enviar Contraseña'}
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="px-6 pb-6">
          {mode === 'login' && (
            <div className="text-center space-y-2">
              <button
                onClick={() => switchMode('forgot')}
                className="text-blue-600 hover:text-blue-800 text-sm"
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <div className="text-gray-600 text-sm">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={loading}
                >
                  Regístrate aquí
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="text-center">
              <div className="text-gray-600 text-sm">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={loading}
                >
                  Inicia sesión aquí
                </button>
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="text-center">
              <div className="text-gray-600 text-sm">
                ¿Recordaste tu contraseña?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  disabled={loading}
                >
                  Inicia sesión aquí
                </button>
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;