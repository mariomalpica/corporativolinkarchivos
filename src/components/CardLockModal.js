import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Lock, Unlock, Mail, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { lockCard, unlockCard, requestPasswordRecovery } from '../utils/cardLock';

const CardLockModal = ({ 
  isOpen, 
  onClose, 
  cardId, 
  cardTitle, 
  currentUser, 
  mode, // 'lock' | 'unlock'
  onLockToggle 
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'lock') {
        // Validar campos para bloquear
        if (!password.trim()) {
          setError(t('password_required'));
          return;
        }
        
        if (password.length < 4) {
          setError(t('password_min_length'));
          return;
        }
        
        if (password !== confirmPassword) {
          setError(t('passwords_dont_match'));
          return;
        }
        
        if (!userEmail.trim()) {
          setError(t('email_required'));
          return;
        }

        const result = lockCard(cardId, password, currentUser.username, userEmail);
        
        if (result.success) {
          setSuccess(t('card_locked_successfully'));
          setTimeout(() => {
            onLockToggle(true);
            onClose();
          }, 1500);
        } else {
          setError(result.error);
        }
        
      } else if (mode === 'unlock') {
        // Validar campos para desbloquear
        if (!password.trim()) {
          setError(t('password_required'));
          return;
        }

        const result = unlockCard(cardId, password, currentUser);
        
        if (result.success) {
          setSuccess(t('card_unlocked_successfully'));
          setTimeout(() => {
            onLockToggle(false);
            onClose();
          }, 1500);
        } else {
          setError(result.error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!recoveryEmail.trim()) {
setError(t('enter_registered_email_msg'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await requestPasswordRecovery(cardId, recoveryEmail);
      
      if (result.success) {
        setSuccess(result.message);
        // En desarrollo, mostrar la contraseña
        if (result.password) {
setSuccess(`${result.message} \n\n🔑 ${t('password')}: ${result.password}`);
        }
        setShowRecovery(false);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setUserEmail(currentUser?.email || '');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccess('');
    setShowRecovery(false);
    setRecoveryEmail('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            {mode === 'lock' ? (
              <Lock className="text-red-600" size={24} />
            ) : (
              <Unlock className="text-green-600" size={24} />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {mode === 'lock' ? t('lock_card_title') : t('unlock_card_title')}
              </h3>
              <p className="text-sm text-gray-600 truncate">"{cardTitle}"</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {!showRecovery ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {mode === 'lock' && (
                <>
                  {/* Advertencia de seguridad */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <strong>{t('security_warning')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Email para recuperación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('recovery_email')} *
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="tu@email.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('email_for_recovery')}
                    </p>
                  </div>
                </>
              )}

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {mode === 'lock' ? t('new_password') + ' *' : t('card_password') + ' *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={mode === 'lock' ? t('create_secure_password') : t('enter_password')}
                    required
                    minLength={mode === 'lock' ? 4 : 1}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña (solo para bloquear) */}
              {mode === 'lock' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('confirm_password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('confirm_your_password')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Mensajes de error/éxito */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm whitespace-pre-line">{success}</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col space-y-2 mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded font-medium transition-colors ${
                  mode === 'lock'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>{t('processing')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    {mode === 'lock' ? <Lock size={16} /> : <Unlock size={16} />}
                    <span>{mode === 'lock' ? t('lock_card') : t('unlock_card')}</span>
                  </div>
                )}
              </button>

              {mode === 'unlock' && (
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="w-full py-2 px-4 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <Mail size={14} />
                    <span>{t('forgot_password')}</span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
{t('cancel')}
              </button>
            </div>
          </form>
        ) : (
          /* Modal de recuperación de contraseña */
          <div className="space-y-4">
            <div className="text-center">
              <Mail size={48} className="text-blue-600 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
{t('password_recovery')}
              </h4>
              <p className="text-sm text-gray-600">
{t('enter_registered_email')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
{t('registered_email')}
              </label>
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu@email.com"
              />
            </div>

            {/* Mensajes de error/éxito */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm whitespace-pre-line">{success}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handlePasswordRecovery}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
{loading ? t('sending') : t('send_password')}
              </button>
              <button
                onClick={() => setShowRecovery(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
              >
{t('back')}
              </button>
            </div>
          </div>
        )}

        {/* Información de seguridad */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <Shield size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600">
<strong>{t('security_note')}</strong> {mode === 'lock' ? t('lock') : t('unlock')} {t('this_card')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardLockModal;