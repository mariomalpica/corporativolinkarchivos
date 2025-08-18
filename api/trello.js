// Vercel Serverless Function - Backend real para el tablero compartido
// Este archivo se ejecuta en Vercel como API endpoint

import { readData, writeData, validateData } from './utils/database.js';

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
      // Leer datos de Vercel KV
      const currentData = await readData();
      console.log('🔥 GET request - returning data from KV:', currentData.version);
      res.status(200).json({
        success: true,
        data: currentData,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Actualizar datos en Vercel KV
      const newData = req.body;
      
      if (newData && newData.boards && validateData(newData)) {
        console.log('🔥 PUT request - updating data in KV:', {
          boardsCount: newData.boards.length,
          totalCards: newData.boards.reduce((sum, b) => sum + b.cards.length, 0)
        });
        
        // Leer versión actual de KV
        const currentData = await readData();
        
        const updatedData = {
          ...newData,
          version: (currentData.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: newData.lastUpdatedBy || 'Usuario'
        };
        
        // Guardar en KV
        const success = await writeData(updatedData);
        
        if (success) {
          console.log('🔥 POST/PUT request - data updated in KV:', updatedData.version, 'by:', updatedData.lastUpdatedBy);
          
          res.status(200).json({
            success: true,
            message: 'Datos actualizados y guardados en KV exitosamente',
            data: updatedData,
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Error guardando datos en KV',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('❌ Invalid data received:', { hasBoards: !!newData?.boards });
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