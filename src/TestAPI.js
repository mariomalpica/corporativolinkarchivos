import React, { useState, useEffect } from 'react';
import { loadSharedData, saveSharedData, getDefaultData } from './utils/sharedStorage';

const TestAPI = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const testLoadData = async () => {
    setLoading(true);
    setTestResult('Probando carga de datos...');
    
    try {
      const result = await loadSharedData();
      setData(result);
      setTestResult(`✅ CARGA EXITOSA: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ ERROR EN CARGA: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testSaveData = async () => {
    setLoading(true);
    setTestResult('Probando guardado de datos...');
    
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Prueba de guardado desde TestAPI',
      boards: [
        {
          id: 999,
          title: 'Tablero de Prueba',
          cards: [
            { id: 999, title: `Tarjeta de prueba ${new Date().toLocaleTimeString()}` }
          ]
        }
      ]
    };

    try {
      const success = await saveSharedData(testData);
      if (success) {
        setTestResult(`✅ GUARDADO EXITOSO: ${JSON.stringify(testData, null, 2)}`);
      } else {
        setTestResult('❌ ERROR: El guardado falló');
      }
    } catch (error) {
      setTestResult(`❌ ERROR EN GUARDADO: ${error.message}`);
    }
    
    setLoading(false);
  };

  const testFullCycle = async () => {
    setLoading(true);
    setTestResult('Probando ciclo completo (guardar + cargar)...');
    
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      cycleTest: `Ciclo completo ${Date.now()}`,
      boards: [
        {
          id: 888,
          title: 'Ciclo Completo',
          cards: [
            { id: 888, title: `Prueba completa ${new Date().toLocaleTimeString()}` }
          ]
        }
      ]
    };

    try {
      // Paso 1: Guardar
      const saveSuccess = await saveSharedData(testData);
      if (!saveSuccess) {
        setTestResult('❌ ERROR: Fallo en paso 1 (guardar)');
        setLoading(false);
        return;
      }

      // Paso 2: Esperar un poco
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Paso 3: Cargar y verificar
      const loadedData = await loadSharedData();
      
      if (loadedData && loadedData.cycleTest === testData.cycleTest) {
        setTestResult(`✅ CICLO COMPLETO EXITOSO!\nGuardado: ${testData.cycleTest}\nCargado: ${loadedData.cycleTest}`);
      } else {
        setTestResult(`❌ ERROR: Los datos no coinciden\nGuardado: ${testData.cycleTest}\nCargado: ${loadedData?.cycleTest || 'null'}`);
      }
    } catch (error) {
      setTestResult(`❌ ERROR EN CICLO COMPLETO: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔧 Diagnóstico de API Compartida</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testLoadData}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          🔽 Probar Carga
        </button>
        
        <button
          onClick={testSaveData}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          🔼 Probar Guardado
        </button>
        
        <button
          onClick={testFullCycle}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          🔄 Probar Ciclo Completo
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
        <h3 className="font-bold mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ejecuta "Probar Carga" para ver si el servidor responde</li>
          <li>Ejecuta "Probar Guardado" para ver si podemos escribir datos</li>
          <li>Ejecuta "Ciclo Completo" para verificar el flujo completo</li>
          <li>Si algo falla, revisa la consola del navegador (F12)</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAPI;