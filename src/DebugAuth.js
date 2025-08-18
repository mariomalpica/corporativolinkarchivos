import React, { useState, useEffect } from 'react';
import { loadUsers, hashPassword, verifyPassword, loginUser } from './utils/auth';

const DebugAuth = () => {
  const [users, setUsers] = useState([]);
  const [testResult, setTestResult] = useState('');
  const [testEmail, setTestEmail] = useState('mariomalpica@hotmail.com');
  const [testPassword, setTestPassword] = useState('123456');

  useEffect(() => {
    const loadedUsers = loadUsers();
    setUsers(loadedUsers);
  }, []);

  const testLogin = () => {
    console.log('🔍 Testing login...');
    console.log('Email to test:', testEmail);
    console.log('Password to test:', testPassword);
    
    const users = loadUsers();
    console.log('All users in localStorage:', users);
    
    // Buscar usuario
    const user = users.find(u => 
      (u.username === testEmail || u.email === testEmail) && 
      u.active === true
    );
    
    if (!user) {
      setTestResult('❌ Usuario no encontrado');
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:', user);
    console.log('Password hash stored:', user.password);
    
    // Test hash
    const testHash = hashPassword(testPassword);
    console.log('Password hash generated:', testHash);
    
    const passwordMatch = verifyPassword(testPassword, user.password);
    console.log('Password match:', passwordMatch);
    
    if (passwordMatch) {
      setTestResult('✅ Login debería funcionar - password correcto');
    } else {
      setTestResult('❌ Password incorrecto');
    }
    
    // Test función completa
    const loginResult = loginUser(testEmail, testPassword);
    console.log('Login result:', loginResult);
    
    if (loginResult) {
      setTestResult(prev => prev + '\n✅ loginUser() funciona correctamente');
    } else {
      setTestResult(prev => prev + '\n❌ loginUser() falló');
    }
  };

  const clearAllUsers = () => {
    localStorage.removeItem('trello_users');
    localStorage.removeItem('trello_current_user');
    localStorage.removeItem('trello_session_start');
    setUsers([]);
    setTestResult('🗑️ Todos los usuarios eliminados');
  };

  const createTestUser = () => {
    const users = loadUsers();
    const testUser = {
      id: Date.now().toString(),
      username: 'mario',
      email: 'mariomalpica@hotmail.com',
      password: hashPassword('123456'),
      role: 'user',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    const updatedUsers = [...users, testUser];
    localStorage.setItem('trello_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setTestResult('✅ Usuario de prueba creado: mariomalpica@hotmail.com / 123456');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">🔍 Debug Autenticación</h1>
      
      <div className="mb-6 space-y-2">
        <input
          type="text"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Email/Username a probar"
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={testPassword}
          onChange={(e) => setTestPassword(e.target.value)}
          placeholder="Password a probar"
          className="w-full p-2 border rounded"
        />
        <div className="space-x-2">
          <button
            onClick={testLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🧪 Probar Login
          </button>
          <button
            onClick={createTestUser}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            ➕ Crear Usuario Test
          </button>
          <button
            onClick={clearAllUsers}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            🗑️ Limpiar Todo
          </button>
        </div>
      </div>

      {testResult && (
        <div className="mb-6 bg-gray-50 border border-gray-200 p-4 rounded">
          <h3 className="font-bold mb-2">Resultado:</h3>
          <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-bold mb-2">👥 Usuarios en localStorage ({users.length}):</h3>
        <div className="space-y-2">
          {users.map((user, index) => (
            <div key={user.id || index} className="bg-gray-50 p-3 rounded border">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Username:</strong> {user.username}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Password Hash:</strong> {user.password?.substring(0, 20)}...</div>
              <div><strong>Role:</strong> {user.role}</div>
              <div><strong>Active:</strong> {user.active ? '✅' : '❌'}</div>
              <div><strong>Created:</strong> {user.createdAt}</div>
            </div>
          ))}
        </div>
        
        {users.length === 0 && (
          <div className="text-gray-500">No hay usuarios en localStorage</div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h3 className="font-bold mb-2">📝 Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Revisa qué usuarios existen en localStorage</li>
          <li>Si no existe tu usuario, créalo con "Crear Usuario Test"</li>
          <li>Prueba el login con "Probar Login"</li>
          <li>Revisa la consola del navegador (F12) para más detalles</li>
          <li>Si algo está mal, usa "Limpiar Todo" y empieza de nuevo</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugAuth;