const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Datos en memoria (igual que la API de Vercel)
let data = {
  boards: [
    {
      id: 1,
      title: "📋 Por Hacer",
      color: "bg-blue-500",
      cards: [
        { 
          id: 1, 
          title: "¡SISTEMA RESTAURADO!", 
          description: "Funciona perfectamente", 
          backgroundColor: "#e3f2fd",
          createdBy: "Sistema",
          assignedTo: "Sistema",
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 2,
      title: "🔄 En Progreso", 
      color: "bg-yellow-500",
      cards: []
    },
    {
      id: 3,
      title: "✅ Completado",
      color: "bg-green-500", 
      cards: []
    }
  ],
  version: 1,
  lastUpdated: new Date().toISOString(),
  lastUpdatedBy: 'Sistema'
};

// API endpoint
app.all('/api/trello', (req, res) => {
  console.log(`🔄 ${req.method} /api/trello`);
  
  try {
    if (req.method === 'GET') {
      console.log('✅ GET - Devolviendo datos:', data.version);
      res.status(200).json({
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'POST' || req.method === 'PUT') {
      const newData = req.body;
      
      if (newData && newData.boards && Array.isArray(newData.boards)) {
        data = {
          ...newData,
          version: (data.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: newData.lastUpdatedBy || 'Usuario'
        };
        
        console.log('✅ PUT - Datos actualizados:', data.version);
        
        res.status(200).json({
          success: true,
          message: 'Datos actualizados',
          data: data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Datos inválidos',
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
    console.error('Error:', error);
    res.status(200).json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/trello`);
});