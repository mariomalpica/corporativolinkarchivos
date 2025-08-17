// Configuración para desarrollo y producción
const config = {
  development: {
    API_URL: 'http://localhost:3001'
  },
  production: {
    API_URL: 'https://corporativolinkarchivos-backend.up.railway.app'
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];