# Guía de Despliegue - Backend en Railway

## Pasos para desplegar el backend:

### 1. Crear cuenta en Railway
1. Ve a [railway.app](https://railway.app)
2. Regístrate con tu cuenta de GitHub
3. Conecta tu repositorio

### 2. Crear nuevo proyecto
1. Click "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona `mariomalpica/corporativolinkarchivos`
4. Railway detectará automáticamente que hay un backend en `/server`

### 3. Configurar variables de entorno
En la sección "Variables" de Railway, agrega:

```
EMAIL_USER=corporativolinkarchivos@gmail.com
EMAIL_PASS=M1q2w3e4r5t6y7u8i($
PORT=3001
```

### 4. Configurar directorio raíz
1. Ve a "Settings" del servicio
2. En "Source" cambia el "Root Directory" a: `server`
3. Guarda los cambios

### 5. Desplegar
1. Railway automáticamente desplegará
2. Obtendrás una URL como: `https://tu-proyecto.up.railway.app`
3. Copia esta URL

### 6. Actualizar configuración del frontend
Edita el archivo `src/config.js` y reemplaza la URL de producción:

```javascript
production: {
  API_URL: 'https://TU-URL-DE-RAILWAY.up.railway.app'
}
```

### 7. Verificar funcionamiento
- Ve a tu URL de Railway
- Deberías ver la documentación de la API
- Prueba: `https://tu-url.up.railway.app/health`

## URL final:
- **Frontend**: https://corporativolinkarchivos.vercel.app
- **Backend**: https://TU-URL-DE-RAILWAY.up.railway.app

¡Listo! Tu aplicación estará completamente online.