// Configuración para desarrollo y producción
const config = {
  development: {
    API_URL: 'http://localhost:3001/api'
  },
  production: {
    API_URL: 'https://corporativolinkarchivos.vercel.app/api'
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];