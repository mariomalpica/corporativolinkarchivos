// Vercel Serverless Function - Backend real para el tablero compartido
// Este archivo se ejecuta en Vercel como API endpoint

import { readData, writeData, validateData, createBackup } from './utils/dataManager.js';

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Leer datos del archivo persistente
      const currentData = readData();
      console.log('GET request - returning data:', currentData.version);
      res.status(200).json({
        success: true,
        data: currentData,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Actualizar datos
      const newData = req.body;
      
      if (newData && newData.boards && validateData(newData)) {
        // Leer datos actuales para obtener la versión
        const currentData = readData();
        
        // Crear backup antes de actualizar (opcional)
        if (currentData.version > 1) {
          createBackup(currentData);
        }
        
        // Preparar nuevos datos
        const updatedData = {
          ...newData,
          version: (currentData.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: newData.lastUpdatedBy || 'Usuario'
        };
        
        // Guardar en archivo persistente
        const saveSuccess = writeData(updatedData);
        
        if (saveSuccess) {
          console.log('POST/PUT request - data updated and saved:', updatedData.version, 'by:', updatedData.lastUpdatedBy);
          
          res.status(200).json({
            success: true,
            message: 'Datos actualizados y guardados exitosamente',
            data: updatedData,
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Error guardando datos en el servidor',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        res.status(400).json({
          success: false,
          message: 'Datos inválidos - se requiere estructura válida con "boards"',
          timestamp: new Date().toISOString()
        });
      }
      
    } else {
      res.status(405).json({
        success: false,
        message: 'Método no permitido',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}