import React from 'react';

function AppMinimal() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Básico</h1>
      <p>Si puedes ver esto, React está funcionando</p>
      <button onClick={() => alert('JavaScript funcionando!')}>
        Test JS
      </button>
    </div>
  );
}

export default AppMinimal;