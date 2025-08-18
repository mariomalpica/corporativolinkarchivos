import React, { useState } from 'react';

const TestAPI = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // URL de nuestra API de Vercel
  const API_URL = '/api/trello';

  const testLoadData = async () => {
    setLoading(true);
    setTestResult('Probando carga de datos desde Vercel...');
    
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setTestResult(`✅ CARGA EXITOSA desde Vercel:\n${JSON.stringify(result, null, 2)}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ ERROR EN CARGA: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testSaveData = async () => {
    setLoading(true);
    setTestResult('Probando guardado de datos en Vercel...');
    
    const testData = {
      boards: [
        {
          id: 999,
          title: 'Tablero de Prueba TestAPI',
          color: 'bg-orange-500',
          cards: [
            { 
              id: 999, 
              title: `Tarjeta de prueba ${new Date().toLocaleTimeString()}`,
              description: 'Generada desde TestAPI',
              backgroundColor: '#fed7aa',
              createdBy: 'TestAPI',
              assignedTo: 'TestAPI',
              createdAt: new Date().toISOString()
            }
          ]
        }
      ],
      lastUpdatedBy: 'TestAPI'
    };

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(`✅ GUARDADO EXITOSO en Vercel:\n${JSON.stringify(result, null, 2)}`);
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      setTestResult(`❌ ERROR EN GUARDADO: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testFullCycle = async () => {
    setLoading(true);
    setTestResult('Probando ciclo completo Vercel (guardar + cargar)...');
    
    const testTimestamp = Date.now();
    const testData = {
      boards: [
        {
          id: 888,
          title: `Ciclo Completo ${testTimestamp}`,
          color: 'bg-purple-500',
          cards: [
            { 
              id: 888, 
              title: `Prueba completa ${new Date().toLocaleTimeString()}`,
              description: `Ciclo de prueba ${testTimestamp}`,
              backgroundColor: '#ddd6fe',
              createdBy: 'TestAPI-Cycle',
              assignedTo: 'TestAPI-Cycle',
              createdAt: new Date().toISOString()
            }
          ]
        }
      ],
      lastUpdatedBy: 'TestAPI-Cycle'
    };

    try {
      // Paso 1: Guardar
      setTestResult('📤 Paso 1: Guardando datos en Vercel...');
      const saveResponse = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (!saveResponse.ok) {
        throw new Error(`Error en guardado: ${saveResponse.status}`);
      }

      // Paso 2: Esperar un poco
      setTestResult('⏱️ Paso 2: Esperando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Paso 3: Cargar y verificar
      setTestResult('📥 Paso 3: Cargando datos de Vercel...');
      const loadResponse = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!loadResponse.ok) {
        throw new Error(`Error en carga: ${loadResponse.status}`);
      }

      const loadResult = await loadResponse.json();
      const loadedData = loadResult.data;
      
      if (loadedData && loadedData.boards && loadedData.boards[0]?.title.includes(testTimestamp.toString())) {
        setTestResult(`✅ CICLO COMPLETO EXITOSO!\n✅ Guardado: Ciclo ${testTimestamp}\n✅ Cargado: ${loadedData.boards[0]?.title}\n✅ Versión final: ${loadedData.version}`);
      } else {
        setTestResult(`❌ ERROR: Los datos no coinciden\nEsperado: Ciclo ${testTimestamp}\nEncontrado: ${loadedData?.boards?.[0]?.title || 'null'}`);
      }
    } catch (error) {
      setTestResult(`❌ ERROR EN CICLO COMPLETO: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔧 Diagnóstico API Vercel</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testLoadData}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          🔽 Probar Carga Vercel
        </button>
        
        <button
          onClick={testSaveData}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          🔼 Probar Guardado Vercel
        </button>
        
        <button
          onClick={testFullCycle}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          🔄 Ciclo Completo Vercel
        </button>
      </div>

      {loading && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
          <p className="text-yellow-800">⏳ Ejecutando prueba...</p>
        </div>
      )}

      {testResult && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded">
          <h3 className="font-bold mb-2">Resultado:</h3>
          <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
        </div>
      )}

      {data && (
        <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded">
          <h3 className="font-bold mb-2">Datos Actuales en Servidor:</h3>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-64">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded">
        <h3 className="font-bold mb-2">Instrucciones API Vercel:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ejecuta "Probar Carga Vercel" para ver si el backend responde</li>
          <li>Ejecuta "Probar Guardado Vercel" para ver si podemos escribir datos</li>
          <li>Ejecuta "Ciclo Completo Vercel" para verificar el flujo completo</li>
          <li>Si algo falla, revisa la consola del navegador (F12)</li>
          <li>🔗 Backend: {API_URL}</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAPI;