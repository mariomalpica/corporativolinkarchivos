import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Settings, Eye, EyeOff, Type, RotateCcw, Check } from 'lucide-react';
import { getTitleConfig, updateAppTitle, resetSettings } from '../utils/settings';

const TitleSettings = ({ onClose, onTitleUpdate }) => {
  const { t } = useTranslation();
  const [titleConfig, setTitleConfig] = useState(getTitleConfig());
  const [tempTitle, setTempTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setTempTitle(titleConfig.text);
  }, [titleConfig]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const updatedConfig = {
      ...titleConfig,
      text: tempTitle.trim() || t('my_task_board')
    };

    const success = updateAppTitle(updatedConfig);
    
    if (success) {
      setTitleConfig(updatedConfig);
      onTitleUpdate(updatedConfig);
      showMessage(t('settings_saved_successfully'), 'success');
    } else {
      showMessage(t('error_saving_settings'), 'error');
    }
    
    setSaving(false);
  };

  const handleVisibilityToggle = async () => {
    const updatedConfig = {
      ...titleConfig,
      visible: !titleConfig.visible
    };

    const success = updateAppTitle(updatedConfig);
    
    if (success) {
      setTitleConfig(updatedConfig);
      onTitleUpdate(updatedConfig);
      showMessage(
        updatedConfig.visible ? t('title_shown') : t('title_hidden'),
        'success'
      );
    } else {
      showMessage(t('error_updating_visibility'), 'error');
    }
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      '¿Estás seguro de que quieres restablecer toda la configuración a los valores por defecto?'
    );
    
    if (confirmReset) {
      const success = resetSettings();
      if (success) {
        const defaultConfig = getTitleConfig();
        setTitleConfig(defaultConfig);
        setTempTitle(defaultConfig.text);
        onTitleUpdate(defaultConfig);
        showMessage(t('settings_reset_successfully'), 'success');
      } else {
        showMessage(t('error_resetting_settings'), 'error');
      }
    }
  };

  const presetTitles = [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('title_settings')}</h2>
              <p className="text-sm text-gray-600">{t('customize_app_name')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Title Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Eye className="mr-2" size={20} />
{t('preview')}
          </h3>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg border-2 border-dashed border-blue-300">
            {titleConfig.visible ? (
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
{tempTitle || t('my_task_board')}
              </h1>
            ) : (
              <div className="text-gray-500 italic text-lg">
{t('title_hidden')}
              </div>
            )}
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {titleConfig.visible ? <Eye size={20} /> : <EyeOff size={20} />}
              <div>
                <h4 className="font-medium text-gray-800">{t('title_visibility')}</h4>
                <p className="text-sm text-gray-600">
                  {titleConfig.visible ? t('title_shown_in_app') : t('title_is_hidden')}
                </p>
              </div>
            </div>
            <button
              onClick={handleVisibilityToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
                titleConfig.visible
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {titleConfig.visible ? t('hide') : t('show')}
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Type className="mr-2" size={20} />
{t('custom_title')}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              placeholder={t('custom_title_placeholder')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg touch-manipulation"
              maxLength={50}
            />
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{tempTitle.length}/50 {t('characters')}</span>
              <span>{t('title_appears_top')}</span>
            </div>
          </div>
        </div>


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
              <X size={16} className="flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleSave}
            disabled={saving || tempTitle.trim() === titleConfig.text}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{t('save_changes')}</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="sm:w-auto px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center justify-center space-x-2 touch-manipulation"
          >
            <RotateCcw size={16} />
            <span>{t('reset')}</span>
          </button>
          
          <button
            onClick={onClose}
            className="sm:w-auto px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50 rounded-lg touch-manipulation"
          >
            {t('close')}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 {t('tips')}</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('tip_descriptive')}</li>
            <li>• {t('tip_hide')}</li>
            <li>• {t('tip_auto_save')}</li>
            <li>• El título personalizado aparece en la parte superior de la aplicación</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TitleSettings;