# Trello Clone

Una aplicación completa de gestión de tareas inspirada en Trello, con sistema de usuarios, recordatorios por email y bitácora de actividades.

## Características Principales

- ✅ **Gestión de Tableros y Tarjetas**
  - Crear, editar y eliminar tableros
  - Crear, editar y eliminar tarjetas
  - Arrastrar y soltar tarjetas entre tableros
  
- ✅ **Sistema de Usuarios**
  - Gestión de usuarios sin autenticación
  - Asignación de responsables a las tarjetas
  - Selector de usuario activo
  
- ✅ **Personalización Visual**
  - Colores de fondo personalizables para cada tarea
  - 8 colores predefinidos disponibles
  - Interfaz moderna y responsiva
  
- ✅ **Recordatorios por Email**
  - Configuración de recordatorios con fecha y hora
  - Envío automático de emails usando Gmail
  - Configuración de email central personalizable
  
- ✅ **Bitácora de Actividades**
  - Registro completo de todas las acciones
  - Timestamps y usuario responsable
  - Historial de movimientos y cambios

## Tecnologías utilizadas

### Frontend
- React 18
- Tailwind CSS
- Lucide React (iconos)
- JavaScript ES6+

### Backend
- Node.js
- Express
- Nodemailer (Gmail)
- Node-cron (programación de tareas)
- CORS

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/mariomalpica/corporativolinkarchivos.git
cd corporativolinkarchivos
```

2. Instala las dependencias del frontend:
```bash
npm install
```

3. Instala las dependencias del backend:
```bash
./install-backend.sh
```

## Ejecución

Para ejecutar la aplicación completa necesitas dos terminales:

**Terminal 1 - Backend (Puerto 3001):**
```bash
cd server
npm start
```

**Terminal 2 - Frontend (Puerto 3000):**
```bash
npm start
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

## Scripts disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm build` - Construye la aplicación para producción
- `npm test` - Ejecuta las pruebas
- `npm eject` - Expone la configuración (irreversible)

## Funcionalidades Detalladas

### 👥 Gestión de Usuarios
- **Selector de usuario activo**: Selecciona quién está trabajando actualmente
- **Agregar usuarios**: Añade nuevos miembros del equipo desde configuración
- **Sin autenticación**: Sistema simple sin passwords para uso interno

### 🎨 Personalización Visual
- **8 colores disponibles**: Blanco, Amarillo, Azul, Verde, Rojo, Morado, Rosa, Gris
- **Fácil selección**: Paleta de colores en formularios de creación y edición
- **Identificación visual**: Diferencia tareas por tipo, prioridad o categoría

### 📧 Sistema de Recordatorios
- **Configuración de email**: Configura tu cuenta Gmail corporativa una sola vez
- **Recordatorios automáticos**: Programa fecha y hora específica para cada tarea
- **Emails HTML**: Recordatorios con formato profesional y información completa
- **Verificación automática**: El sistema verifica cada minuto si hay recordatorios pendientes

### 📋 Bitácora de Actividades
- **Registro completo**: Todas las acciones quedan registradas
- **Información detallada**: Usuario, acción, detalles y timestamp
- **Historial navegable**: Visualiza las últimas 100 actividades
- **Transparencia total**: Sabe quién hizo qué y cuándo

### 🔧 Configuración
- **Email personalizable**: Cambia la cuenta de Gmail cuando necesites
- **Gestión de usuarios**: Agrega o elimina usuarios del sistema
- **Configuración persistente**: Los ajustes se mantienen durante la sesión

## Contribuir

Las contribuciones son bienvenidas. Para cambios importantes, por favor abre un issue primero para discutir qué te gustaría cambiar.

## Licencia

MIT