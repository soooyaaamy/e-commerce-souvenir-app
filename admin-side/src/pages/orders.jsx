import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

// ── Status config (matches Dashboard) ────────────────────────────
const statusConfig = {
  pending:   { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', label: 'Pending' },
  confirmed: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'Confirmed' },
  shipped:   { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6', label: 'Shipped' },
  completed: { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', label: 'Completed' },
  cancelled: { bg: '#FFF1F2', color: '#BE123C', dot: '#F43F5E', label: 'Cancelled' },
};

const statusOptions = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

// ── Status Pill (same as Dashboard) ──────────────────────────────
function StatusPill({ status }) {
  const cfg = statusConfig[status] || {
    bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8', label: status,
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      backgroundColor: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ── Parse price safely ────────────────────────────────────────────
const parsePrice = (val) => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/[₱,]/g, '')) || 0;
};

// ── Order Detail Modal ────────────────────────────────────────────
function OrderModal({ order, onClose }) {
  if (!order) return null;

  const date = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : '—';

  const subtotal = order.items?.reduce((s, item) =>
    s + parsePrice(item.price) * (parseInt(item.quantity, 10) || 1), 0) || 0;
  const grandTotal = parsePrice(order.grandTotal);
  const shipping = Math.max(grandTotal - subtotal, 0);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Order Details</h2>
            <p style={styles.modalOrderId}>
              Order{' '}
              <span style={{ fontFamily: 'monospace', color: '#5C4033' }}>
                #{order.id}
              </span>
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Info grid — 2×2 so all four items are always balanced */}
        <div style={styles.modalInfoRow}>
          <div style={styles.modalInfoItem}>
            <span style={styles.modalInfoLabel}>Customer</span>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '2px 0 0', color: '#1A1A2E' }}>
              {order.userEmail?.split('@')[0] || '—'}
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
              {order.userEmail || ''}
            </p>
          </div>
          <div style={styles.modalInfoItem}>
            <span style={styles.modalInfoLabel}>Payment</span>
            <span style={styles.modalInfoValue}>
              {order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '📱 GCash'}
            </span>
          </div>
          <div style={styles.modalInfoItem}>
            <span style={styles.modalInfoLabel}>Date Placed</span>
            <span style={styles.modalInfoValue}>{date}</span>
          </div>
          <div style={styles.modalInfoItem}>
            <span style={styles.modalInfoLabel}>Date Received</span>
            <span style={{ ...styles.modalInfoValue, color: '#15803D', fontWeight: 700 }}>
              {order.completedAt?.toDate
                ? order.completedAt.toDate().toLocaleDateString('en-PH', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })
                : 'Not received yet'}
            </span>
          </div>
        </div>

        {/* Shipping address */}
        {order.address && (
          <div style={styles.modalSection}>
            <p style={styles.modalSectionTitle}>📍 Shipping Address</p>
            <p style={styles.modalAddressText}>
              {[
                order.address.street,
                order.address.barangay,
                order.address.city,
                order.address.province,
                order.address.zip,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}

        {/* Items */}
        <div style={styles.modalSection}>
          <p style={styles.modalSectionTitle}>🛍️ Items Ordered</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={styles.modalItemRow}>
                <div style={styles.modalItemThumb}>
                  {item.image
                    ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )
                    : <span style={{ fontSize: 18 }}>🛍️</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.modalItemName}>{item.name}</p>
                  {item.variant && (
                    <p style={styles.modalItemVariant}>Variant: {item.variant}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.modalItemPrice}>
                    ₱{(parsePrice(item.price) * (parseInt(item.quantity, 10) || 1)).toLocaleString()}
                  </p>
                  <p style={styles.modalItemQty}>x{item.quantity || 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div style={styles.modalTotals}>
          <div style={styles.modalTotalRow}>
            <span style={styles.modalTotalLabel}>Subtotal</span>
            <span style={styles.modalTotalValue}>₱{subtotal.toLocaleString()}</span>
          </div>
          {shipping > 0 && (
            <div style={styles.modalTotalRow}>
              <span style={styles.modalTotalLabel}>Shipping</span>
              <span style={styles.modalTotalValue}>₱{shipping.toLocaleString()}</span>
            </div>
          )}
          <div style={{
            ...styles.modalTotalRow,
            borderTop: '2px solid #F1F5F9',
            paddingTop: 10,
            marginTop: 4,
          }}>
            <span style={{ ...styles.modalTotalLabel, fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>
              Total
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#5C4033' }}>
              ₱{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>


      </div>
    </div>
  );
}

// ── Main Orders Page ──────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus]   = useState('all');
  const [search, setSearch]               = useState('');

  // Real-time listener
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

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesSearch =
      (o.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={styles.container}>

      {/* ── Search + Export row ──────────────────────────────── */}
      <div style={styles.searchRow}>
        <input
          style={styles.searchInput}
          placeholder="🔍  Search by email or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Status filter pills ──────────────────────────────── */}
      <div style={styles.filterRow}>
        {['all', ...statusOptions].map((status) => {
          const isActive = filterStatus === status;
          const cfg = statusConfig[status];
          return (
            <button
              key={status}
              style={{
                ...styles.filterPill,
                backgroundColor: isActive
                  ? (cfg ? cfg.bg : '#1A1A2E')
                  : '#F8FAFC',
                color: isActive
                  ? (cfg ? cfg.color : '#fff')
                  : '#94A3B8',
                border: isActive
                  ? `1.5px solid ${cfg ? cfg.color : '#1A1A2E'}`
                  : '1.5px solid #F1F5F9',
                fontWeight: isActive ? 700 : 500,
              }}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' && <span style={{ marginRight: 4 }}>📋</span>}
              {status !== 'all' && cfg && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: cfg.dot, display: 'inline-block', marginRight: 5,
                }} />
              )}
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {/* Count badge */}
              <span style={{
                marginLeft: 6,
                backgroundColor: isActive
                  ? (cfg ? `${cfg.color}20` : 'rgba(255,255,255,0.2)')
                  : '#F1F5F9',
                color: isActive ? (cfg ? cfg.color : '#fff') : '#94A3B8',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 20,
              }}>
                {status === 'all'
                  ? orders.length
                  : orders.filter((o) => o.status === status).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table card ───────────────────────────────────────── */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 28 }}>⟳</div>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
              Connecting to live orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 36 }}>📦</div>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '4px 0 0' }}>
              No orders found
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Payment', 'Status', 'Action'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const date = order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString('en-PH', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={order.id} style={styles.tr}>
                      {/* Order ID */}
                      <td style={styles.td}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 12,
                          color: '#5C4033', fontWeight: 700,
                        }}>
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td style={styles.td}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>
                            {order.userEmail?.split('@')[0] || '—'}
                          </p>
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                            {order.userEmail || ''}
                          </p>
                        </div>
                      </td>

                      {/* Items */}
                      <td style={styles.td}>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Total */}
                      <td style={styles.td}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#5C4033' }}>
                          ₱{(order.grandTotal || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={styles.td}>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{date}</span>
                      </td>

                      {/* Payment */}
                      <td style={styles.td}>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: order.paymentMethod === 'cod' ? '#C2410C' : '#1D4ED8',
                        }}>
                          {order.paymentMethod === 'cod' ? '💵 COD' : '📱 GCash'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={styles.td}>
                        <StatusPill status={order.status} />
                      </td>

                      {/* Action */}
                      <td style={styles.td}>
                        <button
                          style={styles.viewBtn}
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Order
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ───────────────────────────────── */}
      <OrderModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Search row
  searchRow: { display: 'flex', gap: 12, alignItems: 'center' },
  searchInput: {
    flex: 1, padding: '11px 16px',
    borderRadius: 12, border: '1.5px solid #F1F5F9',
    fontSize: 14, outline: 'none', color: '#374151',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },


  // Filter pills
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterPill: {
    display: 'inline-flex', alignItems: 'center',
    padding: '6px 14px', borderRadius: 100,
    fontSize: 12, cursor: 'pointer',
    transition: 'all 0.15s',
  },

  // Table card
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #F1F5F9',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 0', gap: 8,
  },

  // Table — matches Dashboard exactly
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6,
    padding: '0 12px 12px', borderBottom: '1px solid #F1F5F9',
  },
  tr: { borderBottom: '1px solid #F9FAFB' },
  td: { padding: 12, verticalAlign: 'middle' },
  viewBtn: {
    background: '#5C4033', border: 'none', borderRadius: 8,
    padding: '6px 14px', fontSize: 12, color: '#fff', fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
  },

  // Modal — matches Dashboard exactly
  modalOverlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 20,
    width: '100%', maxWidth: 560,
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    padding: 28,
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: 800, color: '#1A1A2E', margin: '0 0 4px' },
  modalOrderId: { fontSize: 12, color: '#94A3B8', margin: 0 },
  closeBtn: {
    background: '#F1F5F9', border: 'none', borderRadius: 8,
    width: 32, height: 32, cursor: 'pointer', fontSize: 13,
    color: '#64748B', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  modalInfoRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px',
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: '14px 16px',
    marginBottom: 18,
  },
  modalInfoItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  modalInfoLabel: {
    fontSize: 10, fontWeight: 700, color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  modalInfoValue: { fontSize: 13, fontWeight: 600, color: '#1A1A2E' },
  modalSection: { marginBottom: 18 },
  modalSectionTitle: { fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 10px' },
  modalAddressText: { fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 },
  modalItemRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 0', borderBottom: '1px solid #F9FAFB',
  },
  modalItemThumb: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#FDF6F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  modalItemName: { fontSize: 13, fontWeight: 600, color: '#1A1A2E', margin: '0 0 2px' },
  modalItemVariant: { fontSize: 11, color: '#94A3B8', margin: 0 },
  modalItemPrice: { fontSize: 14, fontWeight: 700, color: '#5C4033', margin: '0 0 2px' },
  modalItemQty: { fontSize: 11, color: '#94A3B8', margin: 0 },
  modalTotals: { borderTop: '1px solid #F1F5F9', paddingTop: 16, marginTop: 4 },
  modalTotalRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  modalTotalLabel: { fontSize: 13, color: '#64748B' },
  modalTotalValue: { fontSize: 13, fontWeight: 600, color: '#374151' },
};