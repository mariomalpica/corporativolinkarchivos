// Utilidades para manejar la configuración de la aplicación

const SETTINGS_KEY = 'trello_clone_settings';

// Configuración por defecto
const DEFAULT_SETTINGS = {
  appTitle: {
    text: 'Trello Clone - Drag & Drop Test',
    visible: true,
    customizable: true
  },
  theme: {
    primaryColor: '#3B82F6',
    backgroundColor: '#F8FAFC'
  },
  version: '1.0.0'
};

// Cargar configuración desde localStorage
export const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const settings = JSON.parse(saved);
      // Combinar con configuración por defecto para asegurar que todas las propiedades existan
      return {
        ...DEFAULT_SETTINGS,
        ...settings,
        appTitle: {
          ...DEFAULT_SETTINGS.appTitle,
          ...settings.appTitle
        },
        theme: {
          ...DEFAULT_SETTINGS.theme,
          ...settings.theme
        }
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
};

// Guardar configuración en localStorage
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Actualizar solo el título de la aplicación
export const updateAppTitle = (titleConfig) => {
  const currentSettings = loadSettings();
  const updatedSettings = {
    ...currentSettings,
    appTitle: {
      ...currentSettings.appTitle,
      ...titleConfig
    }
  };
  return saveSettings(updatedSettings);
};

// Restablecer configuración a valores por defecto
export const resetSettings = () => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return false;
  }
};

// Exportar configuraciones específicas
export const getTitleConfig = () => {
  const settings = loadSettings();
  return settings.appTitle;
};

export const getThemeConfig = () => {
  const settings = loadSettings();
  return settings.theme;
};