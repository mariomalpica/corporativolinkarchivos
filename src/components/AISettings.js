import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Brain, 
  Settings, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle,
  TestTube2,
  Shield,
  Zap,
  MessageCircle,
  Mic,
  Globe,
  ExternalLink
} from 'lucide-react';

// Utilidad para gestionar configuración de AI
const getAIConfig = () => {
  try {
    const config = localStorage.getItem('aiConfig');
    return config ? JSON.parse(config) : {
      enableAI: false,
      selectedProvider: 'openai',
      openai: {
        apiKey: '',
        model: 'gpt-4',
        enabled: false
      },
      claude: {
        apiKey: '',
        model: 'claude-3-sonnet-20240229',
        enabled: false
      },
      gemini: {
        apiKey: '',
        model: 'gemini-pro',
        enabled: false
      },
      features: {
        smartAnalysis: true,
        taskRecommendations: true,
        autoAssignment: false,
        contentGeneration: true,
        voiceIntegration: false,
        messagingIntegration: false
      },
      automationIntegrations: {
        zapier: {
          enabled: false,
          webhookUrl: ''
        },
        n8n: {
          enabled: false,
          webhookUrl: ''
        },
        make: {
          enabled: false,
          webhookUrl: ''
        }
      },
      messagingIntegrations: {
        whatsapp: {
          enabled: false,
          phoneNumber: '',
          apiKey: ''
        },
        telegram: {
          enabled: false,
          botToken: '',
          chatId: ''
        }
      }
    };
  } catch (error) {
    console.error('Error loading AI config:', error);
    return getDefaultAIConfig();
  }
};

const getDefaultAIConfig = () => ({
  enableAI: false,
  selectedProvider: 'openai',
  openai: { apiKey: '', model: 'gpt-4', enabled: false },
  claude: { apiKey: '', model: 'claude-3-sonnet-20240229', enabled: false },
  gemini: { apiKey: '', model: 'gemini-pro', enabled: false },
  features: {
    smartAnalysis: true,
    taskRecommendations: true,
    autoAssignment: false,
    contentGeneration: true,
    voiceIntegration: false,
    messagingIntegration: false
  },
  automationIntegrations: {
    zapier: { enabled: false, webhookUrl: '' },
    n8n: { enabled: false, webhookUrl: '' },
    make: { enabled: false, webhookUrl: '' }
  },
  messagingIntegrations: {
    whatsapp: { enabled: false, phoneNumber: '', apiKey: '' },
    telegram: { enabled: false, botToken: '', chatId: '' }
  }
});

const saveAIConfig = (config) => {
  try {
    localStorage.setItem('aiConfig', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving AI config:', error);
    return false;
  }
};

const AISettings = ({ onClose }) => {
  const { t } = useTranslation();
  const [aiConfig, setAIConfig] = useState(getAIConfig());
  const [showApiKeys, setShowApiKeys] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('providers');

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Validaciones
    if (aiConfig.enableAI) {
      const hasValidProvider = ['openai', 'claude', 'gemini'].some(provider => 
        aiConfig[provider].enabled && aiConfig[provider].apiKey
      );
      
      if (!hasValidProvider) {
        showMessage(t('ai_provider_required'), 'error');
        setSaving(false);
        return;
      }
    }
    
    const success = saveAIConfig(aiConfig);
    
    if (success) {
      showMessage(t('ai_settings_saved'), 'success');
    } else {
      showMessage(t('error_saving_ai_settings'), 'error');
    }
    
    setSaving(false);
  };

  const handleTestAI = async () => {
    const currentProvider = aiConfig.selectedProvider;
    if (!aiConfig[currentProvider].enabled || !aiConfig[currentProvider].apiKey) {
      showMessage(t('configure_ai_first'), 'error');
      return;
    }

    setTesting(true);
    
    try {
      // Simular prueba de AI (en implementación real, esto haría llamada a la API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      showMessage(t('test_ai_successful'), 'success');
    } catch (error) {
      showMessage(t('test_ai_failed'), 'error');
    }
    
    setTesting(false);
  };

  const toggleApiKeyVisibility = (provider) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const updateProviderConfig = (provider, field, value) => {
    setAIConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const updateFeature = (feature, value) => {
    setAIConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: value
      }
    }));
  };

  const updateAutomationIntegration = (platform, field, value) => {
    setAIConfig(prev => ({
      ...prev,
      automationIntegrations: {
        ...prev.automationIntegrations,
        [platform]: {
          ...prev.automationIntegrations[platform],
          [field]: value
        }
      }
    }));
  };

  const updateMessagingIntegration = (platform, field, value) => {
    setAIConfig(prev => ({
      ...prev,
      messagingIntegrations: {
        ...prev.messagingIntegrations,
        [platform]: {
          ...prev.messagingIntegrations[platform],
          [field]: value
        }
      }
    }));
  };

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI (ChatGPT)',
      description: t('openai_description'),
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      docsUrl: 'https://platform.openai.com/docs'
    },
    {
      id: 'claude',
      name: 'Anthropic (Claude)',
      description: t('claude_description'),
      models: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
      docsUrl: 'https://docs.anthropic.com'
    },
    {
      id: 'gemini',
      name: 'Google (Gemini)',
      description: t('gemini_description'),
      models: ['gemini-pro', 'gemini-pro-vision'],
      docsUrl: 'https://ai.google.dev'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="text-purple-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t('ai_integration')}</h2>
              <p className="text-sm text-gray-600">{t('configure_ai_features')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Enable AI Toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-3">
              <Brain size={20} className="text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-800">{t('enable_ai_features')}</h4>
                <p className="text-sm text-gray-600">{t('enable_ai_features_desc')}</p>
              </div>
            </div>
            <button
              onClick={() => setAIConfig({...aiConfig, enableAI: !aiConfig.enableAI})}
              className={`px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
                aiConfig.enableAI
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {aiConfig.enableAI ? t('enabled') : t('disabled')}
            </button>
          </div>
        </div>

        {/* AI Configuration (only show if AI is enabled) */}
        {aiConfig.enableAI && (
          <>
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'providers', label: t('ai_providers'), icon: Brain },
                  { id: 'features', label: t('ai_features'), icon: Zap },
                  { id: 'automation', label: t('automation'), icon: Settings },
                  { id: 'messaging', label: t('messaging'), icon: MessageCircle }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Providers Tab */}
            {activeTab === 'providers' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('ai_providers')}</h3>
                  
                  {providers.map((provider) => (
                    <div key={provider.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-800">{provider.name}</h4>
                          <a
                            href={provider.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <button
                          onClick={() => updateProviderConfig(provider.id, 'enabled', !aiConfig[provider.id].enabled)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            aiConfig[provider.id].enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {aiConfig[provider.id].enabled ? t('enabled') : t('disabled')}
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{provider.description}</p>
                      
                      {aiConfig[provider.id].enabled && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('api_key')} *
                            </label>
                            <div className="relative">
                              <input
                                type={showApiKeys[provider.id] ? 'text' : 'password'}
                                value={aiConfig[provider.id].apiKey}
                                onChange={(e) => updateProviderConfig(provider.id, 'apiKey', e.target.value)}
                                placeholder={t('enter_api_key')}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => toggleApiKeyVisibility(provider.id)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showApiKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('model')}
                            </label>
                            <select
                              value={aiConfig[provider.id].model}
                              onChange={(e) => updateProviderConfig(provider.id, 'model', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              {provider.models.map(model => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Test AI */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-yellow-800">{t('test_ai_configuration')}</h4>
                      <p className="text-sm text-yellow-700">{t('send_test_ai_desc')}</p>
                    </div>
                    <button
                      onClick={handleTestAI}
                      disabled={testing}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {testing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>{t('testing')}</span>
                        </>
                      ) : (
                        <>
                          <TestTube2 size={16} />
                          <span>{t('test_ai')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('ai_features')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'smartAnalysis', title: t('smart_analysis'), desc: t('smart_analysis_desc') },
                    { key: 'taskRecommendations', title: t('task_recommendations'), desc: t('task_recommendations_desc') },
                    { key: 'autoAssignment', title: t('auto_assignment'), desc: t('auto_assignment_desc') },
                    { key: 'contentGeneration', title: t('content_generation'), desc: t('content_generation_desc') }
                  ].map(feature => (
                    <div key={feature.key} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">{feature.title}</h4>
                        <button
                          onClick={() => updateFeature(feature.key, !aiConfig.features[feature.key])}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            aiConfig.features[feature.key]
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {aiConfig.features[feature.key] ? t('enabled') : t('disabled')}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automation Tab */}
            {activeTab === 'automation' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('automation_integrations')}</h3>
                
                {['zapier', 'n8n', 'make'].map(platform => (
                  <div key={platform} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-800 capitalize">{platform}</h4>
                      <button
                        onClick={() => updateAutomationIntegration(platform, 'enabled', !aiConfig.automationIntegrations[platform].enabled)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          aiConfig.automationIntegrations[platform].enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {aiConfig.automationIntegrations[platform].enabled ? t('enabled') : t('disabled')}
                      </button>
                    </div>
                    
                    {aiConfig.automationIntegrations[platform].enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('webhook_url')}
                        </label>
                        <input
                          type="url"
                          value={aiConfig.automationIntegrations[platform].webhookUrl}
                          onChange={(e) => updateAutomationIntegration(platform, 'webhookUrl', e.target.value)}
                          placeholder={`https://hooks.${platform}.com/...`}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Messaging Tab */}
            {activeTab === 'messaging' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('messaging_integrations')}</h3>
                
                {/* WhatsApp */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-800">WhatsApp</h4>
                    <button
                      onClick={() => updateMessagingIntegration('whatsapp', 'enabled', !aiConfig.messagingIntegrations.whatsapp.enabled)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        aiConfig.messagingIntegrations.whatsapp.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {aiConfig.messagingIntegrations.whatsapp.enabled ? t('enabled') : t('disabled')}
                    </button>
                  </div>
                  
                  {aiConfig.messagingIntegrations.whatsapp.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('phone_number')}
                        </label>
                        <input
                          type="tel"
                          value={aiConfig.messagingIntegrations.whatsapp.phoneNumber}
                          onChange={(e) => updateMessagingIntegration('whatsapp', 'phoneNumber', e.target.value)}
                          placeholder="+1234567890"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('whatsapp_api_key')}
                        </label>
                        <input
                          type="password"
                          value={aiConfig.messagingIntegrations.whatsapp.apiKey}
                          onChange={(e) => updateMessagingIntegration('whatsapp', 'apiKey', e.target.value)}
                          placeholder={t('enter_api_key')}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Telegram */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-800">Telegram</h4>
                    <button
                      onClick={() => updateMessagingIntegration('telegram', 'enabled', !aiConfig.messagingIntegrations.telegram.enabled)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        aiConfig.messagingIntegrations.telegram.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {aiConfig.messagingIntegrations.telegram.enabled ? t('enabled') : t('disabled')}
                    </button>
                  </div>
                  
                  {aiConfig.messagingIntegrations.telegram.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('bot_token')}
                        </label>
                        <input
                          type="password"
                          value={aiConfig.messagingIntegrations.telegram.botToken}
                          onChange={(e) => updateMessagingIntegration('telegram', 'botToken', e.target.value)}
                          placeholder="123456789:ABC..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('chat_id')}
                        </label>
                        <input
                          type="text"
                          value={aiConfig.messagingIntegrations.telegram.chatId}
                          onChange={(e) => updateMessagingIntegration('telegram', 'chatId', e.target.value)}
                          placeholder="123456789"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
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
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">🤖 {t('ai_security_notice')}</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• {t('ai_security_tip_1')}</li>
            <li>• {t('ai_security_tip_2')}</li>
            <li>• {t('ai_security_tip_3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
export { getAIConfig, saveAIConfig };