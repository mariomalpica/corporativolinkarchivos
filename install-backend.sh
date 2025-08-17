#!/bin/bash

echo "Instalando dependencias del backend..."
cd server
npm install

echo "¡Backend instalado correctamente!"
echo ""
echo "Para ejecutar el proyecto completo:"
echo "1. Terminal 1: cd server && npm start"
echo "2. Terminal 2: npm start (en el directorio raíz)"
echo ""
echo "El frontend estará en: http://localhost:3000"
echo "El backend estará en: http://localhost:3001"