import React from 'react';
import Webhooks from './pages/Webhooks';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#1f2937',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '8px' 
          }}>Merchant Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Manage your payment gateway integrations and logs</p>
        </header>
        <Webhooks />
      </div>
    </div>
  );
}

export default App;
