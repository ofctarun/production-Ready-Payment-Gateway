import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Webhooks = () => {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [secret, setSecret] = useState('whsec_test_abc123'); 
    const [logs, setLogs] = useState([]);

    // Mock API Base
    const API_URL = 'http://localhost:8000/api/v1';
    
    // Auth Headers (Demo)
    const headers = { 
        'X-Api-Key': 'key_test_abc123',
        'X-Api-Secret': 'secret_test_xyz789'
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API_URL}/webhooks`, { headers });
            setLogs(res.data.data);
        } catch (err) {
            console.error('Error fetching logs', err);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleRetry = async (id) => {
        try {
            await axios.post(`${API_URL}/webhooks/${id}/retry`, {}, { headers });
            alert('Retry scheduled');
            fetchLogs();
        } catch (err) {
            console.error('Retry failed', err);
            alert('Retry failed');
        }
    };

    const getStatusStyle = (status) => {
        const base = { padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' };
        if (status === 'success') return { ...base, backgroundColor: '#dcfce7', color: '#166534' };
        if (status === 'failed') return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
        return { ...base, backgroundColor: '#f3f4f6', color: '#374151' };
    };

    return (
        <div data-test-id="webhook-config">
            
            {/* Configuration Card */}
            <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', 
                padding: '24px', 
                marginBottom: '30px' 
            }}>
                 <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', marginTop: 0 }}>Webhook Configuration</h2>
                 
                 <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Webhook URL</label>
                    <input 
                        data-test-id="webhook-url-input"
                        type="url" 
                        value={webhookUrl} 
                        onChange={e => setWebhookUrl(e.target.value)}
                        placeholder="https://yoursite.com/webhook"
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            border: '1px solid #d1d5db', 
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                 </div>

                 <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Webhook Secret</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <code data-test-id="webhook-secret" style={{ 
                            fontFamily: 'monospace', 
                            backgroundColor: '#f3f4f6', 
                            padding: '10px 12px', 
                            borderRadius: '6px', 
                            border: '1px solid #e5e7eb',
                            color: '#6b7280',
                            flex: 1
                        }}>{secret}</code>
                        <button 
                            data-test-id="regenerate-secret-button"
                            onClick={() => alert('Regenerated (Demo)')}
                            style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #d1d5db',  borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#374151' }}
                        >
                            Regenerate
                        </button>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        data-test-id="save-webhook-button" 
                        onClick={() => alert('Saved (Demo)')}
                        style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Save Configuration
                    </button>
                    <button 
                        data-test-id="test-webhook-button" 
                        onClick={() => alert('Test Webhook Sent (Demo)')}
                        style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#374151' }}
                    >
                        Send Test Webhook
                    </button>
                 </div>
            </div>

            {/* Logs Card */}
            <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', 
                overflow: 'hidden'
            }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Recent Deliveries</h3>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table data-test-id="webhook-logs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                <th style={{ padding: '12px 24px', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' }}>Event</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600', color: '#6b7280' }}>Attempts</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' }}>Last Attempt</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600', color: '#6b7280' }}>Code</th>
                                <th style={{ padding: '12px 24px', fontWeight: '600', color: '#6b7280', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} data-test-id="webhook-log-item" data-webhook-id={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td data-test-id="webhook-event" style={{ padding: '16px 24px', fontWeight: '500', color: '#111827' }}>{log.event}</td>
                                    <td data-test-id="webhook-status" style={{ padding: '16px 24px' }}>
                                        <span style={getStatusStyle(log.status)}>{log.status}</span>
                                    </td>
                                    <td data-test-id="webhook-attempts" style={{ padding: '16px 24px', color: '#6b7280' }}>{log.attempts}</td>
                                    <td data-test-id="webhook-last-attempt" style={{ padding: '16px 24px', color: '#6b7280' }}>
                                        {new Date(log.last_attempt_at).toLocaleString()}
                                    </td>
                                    <td data-test-id="webhook-response-code" style={{ padding: '16px 24px', color: '#6b7280', fontFamily: 'monospace' }}>
                                        {log.response_code || '-'}
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <button 
                                            data-test-id="retry-webhook-button"
                                            data-webhook-id={log.id}
                                            onClick={() => handleRetry(log.id)}
                                            style={{ 
                                                fontSize: '13px', 
                                                color: '#2563eb', 
                                                fontWeight: '500', 
                                                background: 'none', 
                                                border: 'none', 
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                borderRadius: '4px'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#eff6ff'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            Retry
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        No logs yet. Make a payment to see events here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Webhooks;
