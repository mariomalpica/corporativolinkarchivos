import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Mail, 
  Settings, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle,
  Send,
  TestTube2,
  Shield
} from 'lucide-react';

// Utilidad para gestionar configuración de email
const getEmailConfig = () => {
  try {
    const config = localStorage.getItem('emailConfig');
    return config ? JSON.parse(config) : {
      smtpHost: '',
      smtpPort: '587',
      email: '',
      password: '',
      senderName: '',
      enableNotifications: true,
      autoSendOnCompletion: false,
      defaultRecipients: []
    };
  } catch (error) {
    console.error('Error loading email config:', error);
    return {
      smtpHost: '',
      smtpPort: '587',
      email: '',
      password: '',
      senderName: '',
      enableNotifications: true,
      autoSendOnCompletion: false,
      defaultRecipients: []
    };
  }
};

const saveEmailConfig = (config) => {
  try {
    localStorage.setItem('emailConfig', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving email config:', error);
    return false;
  }
};

const EmailSettings = ({ onClose }) => {
  const { t } = useTranslation();
  const [emailConfig, setEmailConfig] = useState(getEmailConfig());
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [newRecipient, setNewRecipient] = useState('');

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Validaciones
    if (emailConfig.enableNotifications) {
      if (!emailConfig.email || !emailConfig.smtpHost) {
        showMessage(t('email_and_smtp_required'), 'error');
        setSaving(false);
        return;
      }
      
      if (!validateEmail(emailConfig.email)) {
        showMessage(t('invalid_email_format'), 'error');
        setSaving(false);
        return;
      }
    }
    
    const success = saveEmailConfig(emailConfig);
    
    if (success) {
      showMessage(t('email_settings_saved'), 'success');
    } else {
      showMessage(t('error_saving_email_settings'), 'error');
    }
    
    setSaving(false);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTestEmail = async () => {
    if (!emailConfig.email || !emailConfig.smtpHost) {
      showMessage(t('configure_email_first'), 'error');
      return;
    }

    setTesting(true);
    
    // Simular prueba de email (en una implementación real, esto haría una llamada a la API)
    try {
      // Aquí iría la lógica real de prueba de email
      await new Promise(resolve => setTimeout(resolve, 2000));
      showMessage(t('test_email_sent_successfully'), 'success');
    } catch (error) {
      showMessage(t('test_email_failed'), 'error');
    }
    
    setTesting(false);
  };

  const addRecipient = () => {
    if (!newRecipient.trim()) return;
    
    if (!validateEmail(newRecipient)) {
      showMessage(t('invalid_email_format'), 'error');
      return;
    }
    
    if (emailConfig.defaultRecipients.includes(newRecipient)) {
      showMessage(t('email_already_added'), 'error');
      return;
    }
    
    setEmailConfig({
      ...emailConfig,
      defaultRecipients: [...emailConfig.defaultRecipients, newRecipient]
    });
    setNewRecipient('');
  };

  const removeRecipient = (email) => {
    setEmailConfig({
      ...emailConfig,
      defaultRecipients: emailConfig.defaultRecipients.filter(r => r !== email)
    });
  };

  const presetConfigs = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: '587' },
    { name: 'Outlook', host: 'smtp.live.com', port: '587' },
    { name: 'Yahoo', host: 'smtp.mail.yahoo.com', port: '587' },
    { name: 'Custom', host: '', port: '587' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('email_settings')}</h2>
              <p className="text-sm text-gray-600">{t('configure_email_notifications')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Enable Notifications Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Settings size={20} />
              <div>
                <h4 className="font-medium text-gray-800">{t('enable_email_notifications')}</h4>
                <p className="text-sm text-gray-600">{t('enable_email_notifications_desc')}</p>
              </div>
            </div>
            <button
              onClick={() => setEmailConfig({...emailConfig, enableNotifications: !emailConfig.enableNotifications})}
              className={`px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
                emailConfig.enableNotifications
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {emailConfig.enableNotifications ? t('enabled') : t('disabled')}
            </button>
          </div>
        </div>

        {/* Email Configuration (only show if notifications are enabled) */}
        {emailConfig.enableNotifications && (
          <>
            {/* SMTP Provider Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('email_provider')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presetConfigs.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setEmailConfig({
                      ...emailConfig,
                      smtpHost: preset.host,
                      smtpPort: preset.port
                    })}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      emailConfig.smtpHost === preset.host
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SMTP Configuration */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('smtp_configuration')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('smtp_host')} *
                  </label>
                  <input
                    type="text"
                    value={emailConfig.smtpHost}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpHost: e.target.value})}
                    placeholder="smtp.gmail.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('smtp_port')} *
                  </label>
                  <input
                    type="text"
                    value={emailConfig.smtpPort}
                    onChange={(e) => setEmailConfig({...emailConfig, smtpPort: e.target.value})}
                    placeholder="587"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Email Credentials */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('email_credentials')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sender_name')}
                  </label>
                  <input
                    type="text"
                    value={emailConfig.senderName}
                    onChange={(e) => setEmailConfig({...emailConfig, senderName: e.target.value})}
                    placeholder={t('your_name_or_company')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('email_address')} *
                  </label>
                  <input
                    type="email"
                    value={emailConfig.email}
                    onChange={(e) => setEmailConfig({...emailConfig, email: e.target.value})}
                    placeholder="your-email@example.com"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('email_password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={emailConfig.password}
                      onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                      placeholder={t('email_app_password')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <Shield size={12} className="inline mr-1" />
                    {t('app_password_recommendation')}
                  </p>
                </div>
              </div>
            </div>

            {/* Default Recipients */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('default_recipients')}</h3>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder={t('add_recipient_email')}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                  <button
                    onClick={addRecipient}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {t('add')}
                  </button>
                </div>
                
                {emailConfig.defaultRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {emailConfig.defaultRecipients.map((email, index) => (
                      <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auto-send Options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('notification_options')}</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={emailConfig.autoSendOnCompletion}
                    onChange={(e) => setEmailConfig({...emailConfig, autoSendOnCompletion: e.target.checked})}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('auto_send_on_completion')}</span>
                </label>
              </div>
            </div>

            {/* Test Email */}
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-yellow-800">{t('test_email_configuration')}</h4>
                    <p className="text-sm text-yellow-700">{t('send_test_email_desc')}</p>
                  </div>
                  <button
                    onClick={handleTestEmail}
                    disabled={testing || !emailConfig.email || !emailConfig.smtpHost}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {testing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>{t('sending')}</span>
                      </>
                    ) : (
                      <>
                        <TestTube2 size={16} />
                        <span>{t('send_test')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check size={16} className="flex-shrink-0" />
            ) : (
              <AlertTriangle size={16} className="flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>{t('saving')}</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{t('save_settings')}</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="sm:w-auto px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50 rounded-lg touch-manipulation"
          >
            {t('close')}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🔒 {t('security_notice')}</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('security_tip_1')}</li>
            <li>• {t('security_tip_2')}</li>
            <li>• {t('security_tip_3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;
export { getEmailConfig, saveEmailConfig };