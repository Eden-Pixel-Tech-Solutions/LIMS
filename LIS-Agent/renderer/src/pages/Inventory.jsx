import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE = 'http://172.16.11.160:7005';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'stock') endpoint = '/api/v2/inventory/procurement/stock-status?branch_id=1';
      if (activeTab === 'purchase') endpoint = '/api/v2/inventory/procurement/purchase-orders?branch_id=1';
      if (activeTab === 'transfers') endpoint = '/api/v2/inventory/transfers?branch_id=1';
      if (activeTab === 'transactions') endpoint = '/api/v2/inventory/transactions?branch_id=1';

      const res = await axios.get(`${API_BASE}${endpoint}`);
      if (res.data.success) {
        setData(res.data.data || res.data.purchaseOrders || res.data.transfers || res.data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'stock', name: 'Item Wise Stock', icon: '📦' },
    { id: 'purchase', name: 'Purchase Orders', icon: '🛒' },
    { id: 'transfers', name: 'Stock Transfers', icon: '🚚' },
    { id: 'transactions', name: 'Transactions', icon: '📑' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Inventory Management</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Real-time stock tracking and procurement</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#0f172a' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <span>{tab.icon}</span> {tab.name}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>Loading {activeTab} data...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                {activeTab === 'stock' && (
                  <>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>ITEM NAME</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>CATEGORY</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>CURRENT STOCK</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>MIN STOCK</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>STATUS</th>
                  </>
                )}
                {activeTab === 'purchase' && (
                  <>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>PO NUMBER</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>VENDOR</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>TOTAL AMOUNT</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>DATE</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>STATUS</th>
                  </>
                )}
                {activeTab === 'transfers' && (
                  <>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>TRANS ID</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>FROM / TO</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>ITEMS</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>DATE</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>STATUS</th>
                  </>
                )}
                {activeTab === 'transactions' && (
                  <>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>TYPE</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>ITEM</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>QUANTITY</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>PERFORMED BY</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>DATE</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>No records found</td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    {activeTab === 'stock' && (
                      <>
                        <td style={{ padding: '16px 24px', fontWeight: '700', color: '#1e293b' }}>{item.item_name}</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{item.category_name}</td>
                        <td style={{ padding: '16px 24px', fontWeight: '800', color: item.current_stock <= item.min_stock_level ? '#ef4444' : '#0f172a' }}>{item.current_stock} {item.unit}</td>
                        <td style={{ padding: '16px 24px', color: '#94a3b8' }}>{item.min_stock_level}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                            background: item.current_stock <= item.min_stock_level ? '#fef2f2' : '#f0fdf4',
                            color: item.current_stock <= item.min_stock_level ? '#ef4444' : '#16a34a'
                          }}>
                            {item.current_stock <= item.min_stock_level ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === 'purchase' && (
                      <>
                        <td style={{ padding: '16px 24px', fontWeight: '700' }}>#{item.po_number}</td>
                        <td style={{ padding: '16px 24px' }}>{item.vendor_name}</td>
                        <td style={{ padding: '16px 24px', fontWeight: '800' }}>₹{item.total_amount?.toLocaleString()}</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{new Date(item.po_date).toLocaleDateString()}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: '#eff6ff', color: '#2563eb' }}>{item.status}</span>
                        </td>
                      </>
                    )}
                    {activeTab === 'transfers' && (
                      <>
                        <td style={{ padding: '16px 24px', fontWeight: '700' }}>#{item.id}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>From: {item.from_branch_name}</div>
                          <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>To: {item.to_branch_name}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>{item.item_count} Items</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{new Date(item.transfer_date).toLocaleDateString()}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: '#fef3c7', color: '#92400e' }}>{item.status}</span>
                        </td>
                      </>
                    )}
                    {activeTab === 'transactions' && (
                      <>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', background: item.transaction_type === 'IN' ? '#f0fdf4' : '#fef2f2', color: item.transaction_type === 'IN' ? '#16a34a' : '#ef4444' }}>
                            {item.transaction_type}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontWeight: '600' }}>{item.item_name}</td>
                        <td style={{ padding: '16px 24px', fontWeight: '800' }}>{item.quantity}</td>
                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{item.performed_by_name}</td>
                        <td style={{ padding: '16px 24px', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleString()}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Inventory;
