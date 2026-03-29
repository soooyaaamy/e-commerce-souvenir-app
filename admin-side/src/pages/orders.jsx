import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';

// ── Must match Dashboard.jsx statusConfig keys exactly ───────────
const statusOptions = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

const statusColors = {
  pending:   { bg: '#FFF7ED', color: '#C2410C' },
  confirmed: { bg: '#EFF6FF', color: '#1D4ED8' },
  shipped:   { bg: '#F5F3FF', color: '#6D28D9' },
  completed: { bg: '#F0FDF4', color: '#15803D' },
  cancelled: { bg: '#FFF1F2', color: '#BE123C' },
};

// Strip ₱ symbol and parse to number safely
const parsePrice = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/[₱,]/g, '')) || 0;
};

export default function Orders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus]   = useState('all');
  const [search, setSearch]               = useState('');

  // ── Real-time listener ──────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(data);
        setLoading(false);
        setSelectedOrder((prev) =>
          prev ? data.find((o) => o.id === prev.id) || null : null
        );
      },
      (error) => {
        console.error('Orders listener error:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Update status — saves completedAt when marked completed ─────
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const updateData = { status: newStatus };

      // Save timestamp when order is marked as completed
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesSearch =
      (o.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={styles.container}>

      {/* ── Page Header ──────────────────────────────────── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Orders</h1>
          <p style={styles.pageSubtitle}>{orders.length} total orders</p>
        </div>
      </div>

      {/* ── Live indicator ─────────────────────────────── */}
      <div style={styles.liveBar}>
        <span style={styles.liveDot} />
        <span style={styles.liveText}>
          Real-time sync — new orders appear automatically
        </span>
      </div>

      {/* ── Search & Filter ──────────────────────────────── */}
      <div style={styles.filterRow}>
        <input
          style={styles.searchInput}
          placeholder="🔍 Search by email or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={styles.statusFilters}>
          {['all', ...statusOptions].map((status) => (
            <button
              key={status}
              style={{
                ...styles.statusBtn,
                ...(filterStatus === status ? styles.statusBtnActive : {}),
              }}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>

        {/* ── Orders Table ─────────────────────────────── */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.emptyState}>
              <p>Connecting to live orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📦</span>
              <p style={styles.emptyText}>No orders found</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    style={{
                      ...styles.tableRow,
                      ...(selectedOrder?.id === order.id ? styles.tableRowSelected : {}),
                    }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td style={styles.td}>
                      <span style={styles.orderId}>#{order.id.slice(0, 8)}</span>
                    </td>
                    <td style={styles.td}>{order.userEmail}</td>
                    <td style={styles.td}>{order.items?.length || 0} items</td>
                    <td style={styles.td}>
                      <span style={styles.price}>
                        ₱{(order.grandTotal || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {order.paymentMethod === 'cod' ? '💵 COD' : '📱 GCash'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: statusColors[order.status]?.bg || '#F5F5F5',
                        color: statusColors[order.status]?.color || '#666',
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        style={styles.statusSelect}
                        value={order.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(order.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Order Detail Panel ───────────────────────── */}
        {selectedOrder && (
          <div style={styles.detailPanel}>
            <div style={styles.detailHeader}>
              <h3 style={styles.detailTitle}>Order Details</h3>
              <button style={styles.closeButton} onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div style={styles.detailContent}>

              <div style={styles.detailSection}>
                <p style={styles.detailLabel}>Order ID</p>
                <p style={styles.detailOrderId}>#{selectedOrder.id}</p>
              </div>

              <div style={styles.detailSection}>
                <p style={styles.detailLabel}>Customer</p>
                <p style={styles.detailValue}>{selectedOrder.userEmail}</p>
              </div>

              {/* Date Ordered */}
              <div style={styles.detailSection}>
                <p style={styles.detailLabel}>Date Ordered</p>
                <p style={styles.detailValue}>
                  {selectedOrder.createdAt?.toDate
                    ? selectedOrder.createdAt.toDate().toLocaleDateString('en-PH', {
                        month: 'long', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>

              {/* Date Received — only shows when completed */}
              {selectedOrder.status === 'completed' && (
                <div style={styles.detailSection}>
                  <p style={styles.detailLabel}>Date Received</p>
                  <p style={{ ...styles.detailValue, color: '#15803D', fontWeight: 700 }}>
                    {selectedOrder.completedAt?.toDate
                      ? selectedOrder.completedAt.toDate().toLocaleDateString('en-PH', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              )}

              <div style={styles.detailSection}>
                <p style={styles.detailLabel}>Payment Method</p>
                <p style={styles.detailValue}>
                  {selectedOrder.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '📱 GCash'}
                </p>
              </div>

              <div style={styles.detailSection}>
                <p style={styles.detailLabel}>Status</p>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: statusColors[selectedOrder.status]?.bg || '#F5F5F5',
                  color: statusColors[selectedOrder.status]?.color || '#666',
                }}>
                  {selectedOrder.status}
                </span>
              </div>

              <div style={styles.detailSection}>
                <p style={styles.detailLabel}>Items Ordered</p>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} style={styles.detailItem}>
                    <div style={styles.detailItemImage}>
                      {item.image
                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} onError={(e) => { e.target.style.display = 'none'; }} />
                        : <span>🛍️</span>}
                    </div>
                    <div style={styles.detailItemInfo}>
                      <p style={styles.detailItemName}>{item.name}</p>
                      <p style={styles.detailItemQty}>x{item.quantity}</p>
                    </div>
                    <p style={styles.detailItemPrice}>
                      ₱{(parsePrice(item.price) * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div style={styles.detailSection}>
                <div style={styles.priceRow}>
                  <p style={styles.priceLabel}>Subtotal</p>
                  <p style={styles.priceValue}>
                    ₱{(selectedOrder.totalPrice || 0).toLocaleString()}
                  </p>
                </div>
                <div style={styles.priceRow}>
                  <p style={styles.priceLabel}>Shipping Fee</p>
                  <p style={styles.priceValue}>₱{selectedOrder.shippingFee || 30}</p>
                </div>
                <div style={styles.priceDivider} />
                <div style={styles.priceRow}>
                  <p style={styles.priceTotalLabel}>Total</p>
                  <p style={styles.priceTotalValue}>
                    ₱{(selectedOrder.grandTotal || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={styles.detailSection}>
                <p style={styles.detailLabel}>Update Status</p>
                <div style={styles.statusButtonsGrid}>
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      style={{
                        ...styles.statusUpdateBtn,
                        backgroundColor:
                          selectedOrder.status === status
                            ? statusColors[status]?.bg : '#F5F5F5',
                        color:
                          selectedOrder.status === status
                            ? statusColors[status]?.color : '#666',
                        border:
                          selectedOrder.status === status
                            ? `2px solid ${statusColors[status]?.color}`
                            : '2px solid transparent',
                      }}
                      onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: '28px', fontWeight: 'bold', color: '#333', margin: 0 },
  pageSubtitle: { fontSize: '14px', color: '#999', margin: 0 },
  liveBar: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 16px' },
  liveDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)', flexShrink: 0 },
  liveText: { fontSize: '13px', color: '#15803D', fontWeight: '500' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '14px', outline: 'none', minWidth: '200px' },
  statusFilters: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  statusBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #E0E0E0', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#666' },
  statusBtnActive: { backgroundColor: '#5C4033', color: '#fff', border: '1px solid #5C4033' },
  mainContent: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
  tableContainer: { flex: 1, backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'auto' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '12px' },
  emptyIcon: { fontSize: '48px' },
  emptyText: { fontSize: '16px', color: '#999', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#F5F5F5' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' },
  tableRow: { borderBottom: '1px solid #F5F5F5', cursor: 'pointer' },
  tableRowSelected: { backgroundColor: '#FDF6F0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  orderId: { fontFamily: 'monospace', backgroundColor: '#F5F5F5', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' },
  price: { fontWeight: 'bold', color: '#5C4033' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  statusSelect: { padding: '6px 10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '13px', cursor: 'pointer', outline: 'none' },
  detailPanel: { width: '320px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', flexShrink: 0 },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0 20px' },
  detailTitle: { fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 },
  closeButton: { backgroundColor: '#F5F5F5', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' },
  detailContent: { padding: '16px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' },
  detailSection: { borderBottom: '1px solid #F5F5F5', paddingBottom: '16px' },
  detailLabel: { fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 6px 0' },
  detailOrderId: { fontSize: '13px', fontFamily: 'monospace', color: '#333', margin: 0, wordBreak: 'break-all' },
  detailValue: { fontSize: '14px', color: '#333', margin: 0 },
  detailItem: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  detailItemImage: { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#E8D5B7', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', overflow: 'hidden', flexShrink: 0 },
  detailItemInfo: { flex: 1 },
  detailItemName: { fontSize: '13px', fontWeight: '600', color: '#333', margin: 0 },
  detailItemQty: { fontSize: '12px', color: '#999', margin: 0 },
  detailItemPrice: { fontSize: '13px', fontWeight: 'bold', color: '#5C4033', margin: 0 },
  priceRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  priceLabel: { fontSize: '13px', color: '#999', margin: 0 },
  priceValue: { fontSize: '13px', color: '#333', fontWeight: '600', margin: 0 },
  priceDivider: { height: '1px', backgroundColor: '#F0E8E0', margin: '8px 0' },
  priceTotalLabel: { fontSize: '15px', fontWeight: 'bold', color: '#333', margin: 0 },
  priceTotalValue: { fontSize: '15px', fontWeight: 'bold', color: '#5C4033', margin: 0 },
  statusButtonsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' },
  statusUpdateBtn: { padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
};