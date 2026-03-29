import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
// import { auth } from '../config/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

// ── Status config ────────────────────────────────────────────────
const statusConfig = {
  pending:   { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', label: 'Pending' },
  confirmed: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'Confirmed' },
  shipped:   { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6', label: 'Shipped' },
  completed: { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', label: 'Completed' },
  cancelled: { bg: '#FFF1F2', color: '#BE123C', dot: '#F43F5E', label: 'Cancelled' },
};

// ── Icon Box ─────────────────────────────────────────────────────
function IconBox({ emoji, bg, size = 44 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 14,
      backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.48,
      flexShrink: 0,
    }}>
      {emoji}
    </div>
  );
}

// ── Status Pill ──────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = statusConfig[status] || { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8', label: status };
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

// ── Order Detail Modal ───────────────────────────────────────────
function OrderModal({ order, users = [], onClose }) {
  if (!order) return null;
  const date = order.createdAt?.toDate
  ? order.createdAt.toDate().toLocaleDateString('en-PH', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric'
    })
  : '—';

  const parsePrice = (val) => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/[₱,]/g, '')) || 0;
  };
  const parseQty = (val) => parseInt(val, 10) || 1;

  const subtotal = order.items?.reduce((s, item) => {
    return s + parsePrice(item.price) * parseQty(item.quantity);
  }, 0) || 0;
  const grandTotal = parsePrice(order.grandTotal);
  const shipping = Math.max(grandTotal - subtotal, 0);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Order Details</h2>
            <p style={styles.modalOrderId}>
              Order <span style={{ fontFamily: 'monospace', color: '#5C4033' }}>#{order.id}</span>
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Order Info Row */}
        <div style={styles.modalInfoRow}>
          <div style={styles.modalInfoItem}>
            <span style={styles.modalInfoLabel}>Customer</span>
            {(() => {
              const u = users.find(
                (u) =>
                  u.id === order.userId ||
                  u.uid === order.userId ||
                  u.email === order.userEmail
              );

              const name =
                u?.displayName ||
                u?.name ||
                u?.fullName ||
                u?.username ||
                order.userEmail?.split('@')[0] ||
                '—';

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                      {name}
                    </p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                      {order.userEmail || ''}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
          <div style={styles.modalInfoItem}>
            <span style={styles.modalInfoLabel}>Date Placed</span>
            <span style={styles.modalInfoValue}>{date}</span>
          </div>

          <div style={styles.modalInfoItem}>
          <span style={styles.modalInfoLabel}>Date Received</span>
          <span style={{ ...styles.modalInfoValue, color: '#15803D', fontWeight: 700 }}>
            {order.dateReceived?.toDate
              ? order.dateReceived.toDate().toLocaleDateString('en-PH', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Not received yet'}
          </span>
        </div>
        </div>

        {/* Shipping Address */}
        {order.address && (
          <div style={styles.modalSection}>
            <p style={styles.modalSectionTitle}>📍 Shipping Address</p>
            <p style={styles.modalAddressText}>
              {[order.address.street, order.address.barangay, order.address.city, order.address.province, order.address.zip]
                .filter(Boolean).join(', ')}
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
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} onError={(e) => { e.target.style.display = 'none'; }} />
                    : <span style={{ fontSize: 18 }}>🛍️</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.modalItemName}>{item.name}</p>
                  {item.variant && <p style={styles.modalItemVariant}>Variant: {item.variant}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.modalItemPrice}>₱{(parsePrice(item.price))}</p>
                  <p style={styles.modalItemQty}>x{parseQty(item.quantity)}</p>
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
          <div style={{ ...styles.modalTotalRow, borderTop: '2px solid #F1F5F9', paddingTop: 10, marginTop: 4 }}>
            <span style={{ ...styles.modalTotalLabel, fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#5C4033' }}>₱{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Revenue Chart (Daily / Weekly toggle) ────────────────────────
function RevenueChart({ orders }) {
  const [view, setView] = useState('weekly');
  const CHART_H = 130;

  const bars = React.useMemo(() => {
    const now = new Date();
    if (view === 'daily') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const label = d.toLocaleDateString('en-PH', { weekday: 'short' });
        const revenue = orders.reduce((sum, o) => {
          const od = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          const sameDay =
            od.getDate() === d.getDate() &&
            od.getMonth() === d.getMonth() &&
            od.getFullYear() === d.getFullYear();
          return sameDay && o.status === 'completed' ? sum + (o.grandTotal || 0) : sum;
        }, 0);
        return { label, revenue, isLatest: i === 6 };
      });
    } else {
      return Array.from({ length: 6 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() - (5 - i) * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const label = weekStart.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
        const revenue = orders.reduce((sum, o) => {
          const od = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return od >= weekStart && od <= weekEnd && o.status === 'completed' ? sum + (o.grandTotal || 0) : sum;
        }, 0);
        return { label, revenue, isLatest: i === 5 };
      });
    }
  }, [orders, view]);

  const maxRevenue = Math.max(...bars.map((b) => b.revenue), 1);
  const last = bars[bars.length - 1]?.revenue || 0;
  const prev = bars[bars.length - 2]?.revenue || 0;
  const trendUp = last >= prev;
  const trendPct = prev === 0 ? 100 : Math.abs(((last - prev) / prev) * 100).toFixed(1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={styles.toggleGroup}>
          {['daily', 'weekly'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ ...styles.toggleBtn, ...(view === v ? styles.toggleBtnActive : {}) }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: trendUp ? '#16A34A' : '#DC2626' }}>
            {trendUp ? '▲' : '▼'} {trendPct}%
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            vs previous {view === 'daily' ? 'day' : 'week'}
          </span>
        </div>
      </div>

      {/* Fixed-height chart area to prevent layout shift */}
      <div style={{ height: CHART_H + 48, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: view === 'daily' ? 12 : 8, height: CHART_H }}>
          {bars.map((b, i) => {
            const barH = Math.max((b.revenue / maxRevenue) * CHART_H, 4);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 0 }}>
                {b.revenue > 0 && (
                  <span style={{ fontSize: 9, color: '#5C4033', fontWeight: 700, whiteSpace: 'nowrap', marginBottom: 4 }}>
                    ₱{b.revenue >= 1000 ? `${(b.revenue / 1000).toFixed(1)}k` : b.revenue}
                  </span>
                )}
                <div
                  title={`₱${b.revenue.toLocaleString()}`}
                  style={{
                    width: '100%',
                    height: barH,
                    borderRadius: '6px 6px 0 0',
                    backgroundColor: b.isLatest ? '#5C4033' : '#D4B8A8',
                    transition: 'height 0.4s ease',
                    cursor: 'default',
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* Labels row — fixed height so it never shifts */}
        <div style={{ display: 'flex', gap: view === 'daily' ? 12 : 8, paddingTop: 6 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{
                fontSize: view === 'daily' ? 11 : 9,
                color: b.isLatest ? '#5C4033' : '#94A3B8',
                fontWeight: b.isLatest ? 700 : 500,
                whiteSpace: 'nowrap',
              }}>
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Top Selling Products This Week ───────────────────────────────
function TopSellingProducts({ orders }) {
  const topProducts = React.useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const map = {};
    orders.forEach((o) => {
      const od = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      if (od < weekStart) return;
      o.items?.forEach((item) => {
        const key = item.name;
        if (!map[key]) map[key] = { name: item.name, image: item.image, qty: 0, revenue: 0 };
        map[key].qty += item.quantity || 1;
        const parsedPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || '0').replace(/[₱,]/g, '')) || 0;
        map[key].revenue += parsedPrice * (item.quantity || 1);
      });
    });

    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const maxQty = Math.max(...topProducts.map((p) => p.qty), 1);

  if (topProducts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: 13 }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>📊</div>
        No sales recorded this week yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {topProducts.map((p, i) => (
        <div key={p.name}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {/* Rank badge */}
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              backgroundColor: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7C2F' : '#E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: i < 3 ? '#fff' : '#64748B',
            }}>
              {i + 1}
            </div>
            {/* Thumb */}
            <div style={styles.productThumb}>
              {p.image
                ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} onError={(e) => { e.target.style.display = 'none'; }} />
                : <span style={{ fontSize: 16 }}>🛍️</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>₱{p.revenue.toLocaleString()} revenue</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5C4033', flexShrink: 0 }}>{p.qty} sold</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, backgroundColor: '#F1F5F9', borderRadius: 4, marginLeft: 32 }}>
            <div style={{
              height: '100%',
              width: `${(p.qty / maxQty) * 100}%`,
              backgroundColor: i === 0 ? '#5C4033' : '#D4B8A8',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const [products, setProducts]               = useState([]);
  const [orders, setOrders]                   = useState([]);
  const [users, setUsers]                     = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders]     = useState(true);
  const [loadingUsers, setLoadingUsers]       = useState(true);
  const [selectedOrder, setSelectedOrder]     = useState(null);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), orderBy('name')),
      (snap) => { setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoadingProducts(false); },
      (err) => { console.error(err); setLoadingProducts(false); }
    );
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => { setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoadingOrders(false); },
      (err) => { console.error(err); setLoadingOrders(false); }
    );
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => { setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoadingUsers(false); },
      (err) => { console.error(err); setLoadingUsers(false); }
    );
    return () => { unsubProducts(); unsubOrders(); unsubUsers(); };
  }, []);

  const loading = loadingProducts || loadingOrders || loadingUsers;
  const totalRevenue = orders.filter((o) => o.status === 'completed').reduce((s, o) => s + (o.grandTotal || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const lowStock     = products.filter((p) => p.stock > 0 && p.stock <= 5);

  const stats = [
    { label: 'Total Products', value: products.length,                     emoji: '🛍️', bg: '#FDF6F0', accent: '#5C4033' },
    { label: 'Total Orders',   value: orders.length,                       emoji: '📦', bg: '#EFF6FF', accent: '#2563EB' },
    { label: 'Total Users',    value: users.length,                        emoji: '👥', bg: '#F0FDF4', accent: '#16A34A' },
    { label: 'Total Revenue',  value: `₱${totalRevenue.toLocaleString()}`, emoji: '💰', bg: '#FEFCE8', accent: '#CA8A04' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 400, gap: 12 }}>
        <div style={{ fontSize: 32 }}>⟳</div>
        <p style={{ fontSize: 14, color: '#94A3B8' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* ── Stats Grid ────────────────────────────────────────── */}
      <div style={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...styles.statCard, backgroundColor: s.bg }}>
            <div style={styles.statCardTop}>
              <IconBox emoji={s.emoji} bg={`${s.accent}18`} size={48} />
              <div style={{ textAlign: 'right' }}>
                <p style={{ ...styles.statValue, color: s.accent }}>{s.value}</p>
                <p style={styles.statLabel}>{s.label}</p>
              </div>
            </div>
            {s.label === 'Total Orders' && (
              <p style={styles.statSub}>🕐 {pendingCount} pending</p>
            )}
            {s.label === 'Total Products' && (
              <p style={styles.statSub}>⚠️ {lowStock.length} low stock</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Middle Row ────────────────────────────────────────── */}
      <div style={styles.midGrid}>

        {/* Revenue Chart */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Revenue Overview</h3>
              <p style={styles.cardSub}>All time · ₱{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <RevenueChart orders={orders} />
        </div>

        {/* This Week's Top Selling Products */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>This Week's Top Selling</h3>
              <p style={styles.cardSub}>Based on units sold</p>
            </div>
          </div>
          <TopSellingProducts orders={orders} />
        </div>
      </div>

      {/* ── Recent Orders Table ────────────────────────────────── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>Recent Orders</h3>
            <p style={styles.cardSub}>{orders.length} total orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
            <div style={{ fontSize: 36 }}>📦</div>
            <p style={{ margin: '8px 0 0', fontSize: 14 }}>No orders yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Status', 'Action'].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => {
                  const date = order.createdAt?.toDate
                  ? order.createdAt.toDate().toLocaleDateString('en-PH', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Not yet received';
                  return (
                    <tr key={order.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#5C4033', fontWeight: 700 }}>
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {(() => {
                          const u = users.find((u) => u.id === order.userId || u.uid === order.userId || u.email === order.userEmail);
                          const name = u?.displayName || u?.name || u?.fullName || u?.username || order.userEmail?.split('@')[0] || '—';
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>
                                  {name}
                                </p>
                                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                                  {order.userEmail || ''}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#5C4033' }}>
                          ₱{order.grandTotal?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{date}</span>
                      </td>
                      <td style={styles.td}>
                        <StatusPill status={order.status} />
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={styles.viewBtn}
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

      {/* ── Order Detail Modal ─────────────────────────────────── */}
      <OrderModal order={selectedOrder} users={users} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0' },

  // Page header
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#1A1A2E', margin: 0 },
  adminProfile: { display: 'flex', alignItems: 'center', gap: 10 },
  adminAvatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  adminAvatarFallback: {
    width: 36, height: 36, borderRadius: '50%',
    backgroundColor: '#5C4033', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, fontWeight: 700, flexShrink: 0,
  },
  adminName: { fontSize: 14, fontWeight: 600, color: '#374151' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  statCard: { borderRadius: 16, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' },
  statLabel: { fontSize: 12, color: '#374151', margin: '2px 0 0', fontWeight: 600 },
  statSub: { fontSize: 11, color: '#94A3B8', margin: 0, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)' },

  midGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  cardSub: { fontSize: 12, color: '#94A3B8', margin: '2px 0 0' },

  toggleGroup: { display: 'flex', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 3, gap: 3 },
  toggleBtn: { padding: '5px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: 'transparent', color: '#94A3B8', transition: 'all 0.2s' },
  toggleBtnActive: { backgroundColor: '#5C4033', color: '#fff', boxShadow: '0 1px 3px rgba(92,64,51,0.3)' },

  productThumb: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#FDF6F0', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, padding: '0 12px 12px', borderBottom: '1px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F9FAFB' },
  td: { padding: 12, verticalAlign: 'middle' },
  viewBtn: {
    background: '#5C4033', border: 'none', borderRadius: 8,
    padding: '6px 14px', fontSize: 12, color: '#fff', fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
  },

  // Modal
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
    color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  modalInfoRow: {
    display: 'flex', gap: 50, flexWrap: 'wrap',
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: '14px 16px',
    marginBottom: 18,
  },
  modalInfoItem: { display: 'flex', flexDirection: 'column', gap: 4 },
  modalInfoLabel: { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInfoValue: { fontSize: 13, fontWeight: 600, color: '#1A1A2E' },
  modalSection: { marginBottom: 18 },
  modalSectionTitle: { fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 10px' },
  modalAddressText: { fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 },
  modalItemRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 0', borderBottom: '1px solid #F9FAFB',
  },
  modalItemThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FDF6F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  modalItemName: { fontSize: 13, fontWeight: 600, color: '#1A1A2E', margin: '0 0 2px' },
  modalItemVariant: { fontSize: 11, color: '#94A3B8', margin: 0 },
  modalItemPrice: { fontSize: 14, fontWeight: 700, color: '#5C4033', margin: '0 0 2px' },
  modalItemQty: { fontSize: 11, color: '#94A3B8', margin: 0 },
  modalTotals: { borderTop: '1px solid #F1F5F9', paddingTop: 16, marginTop: 4 },
  modalTotalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTotalLabel: { fontSize: 13, color: '#64748B' },
  modalTotalValue: { fontSize: 13, fontWeight: 600, color: '#374151' },
};