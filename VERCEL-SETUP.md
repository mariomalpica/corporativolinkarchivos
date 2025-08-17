# Configuración de Vercel Functions

## Configurar Variables de Entorno en Vercel

### 1. Ve a tu proyecto en Vercel
- Entra a [vercel.com/dashboard](https://vercel.com/dashboard)
- Selecciona tu proyecto `corporativolinkarchivos`

### 2. Ir a Settings
- Click en la pestaña "Settings"
- En el menú lateral, click en "Environment Variables"

### 3. Agregar variables de entorno
Agrega estas variables:

**EMAIL_USER**
- Value: `corporativolinkarchivos@gmail.com`
- Environments: Production, Preview, Development

**EMAIL_PASS**
- Value: `M1q2w3e4r5t6y7u8i($`
- Environments: Production, Preview, Development

### 4. Redesplegar
- Ve a la pestaña "Deployments"
- Click en los 3 puntos del último deployment
- "Redeploy"

## Probar las APIs

Una vez desplegado, puedes probar:

- **Health check**: `https://corporativolinkarchivos.vercel.app/api/check-reminders`
- **Email config**: `https://corporativolinkarchivos.vercel.app/api/email-config`
- **Reminders**: `https://corporativolinkarchivos.vercel.app/api/reminders`

## URLs finales:
- **Frontend + Backend**: https://corporativolinkarchivos.vercel.app
- **API Base**: https://corporativolinkarchivos.vercel.app/api

¡Todo funcionará desde la misma URL de Vercel! 🎉