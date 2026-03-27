import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const statusColors = {
  pending: { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  confirmed: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  shipped: { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  delivered: { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  cancelled: { bg: '#FFF1F2', color: '#BE123C', dot: '#F43F5E' },
};

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const ordersSnap = await getDocs(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
        );
        setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      icon: '🛍️',
      change: 'Active listings',
      color: '#FDF6F0',
      border: '#F0E0D6',
      accent: '#5C4033',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: '📦',
      change: `${pendingOrders} pending`,
      color: '#EFF6FF',
      border: '#BFDBFE',
      accent: '#2563EB',
    },
    {
      label: 'Delivered',
      value: deliveredOrders,
      icon: '✅',
      change: 'Successfully done',
      color: '#F0FDF4',
      border: '#BBF7D0',
      accent: '#16A34A',
    },
    {
      label: 'Total Revenue',
      value: `₱${totalRevenue.toLocaleString()}`,
      icon: '💰',
      change: 'All time earnings',
      color: '#FEFCE8',
      border: '#FEF08A',
      accent: '#CA8A04',
    },
  ];

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>⟳</div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Welcome Banner */}
      <div style={styles.welcomeBanner}>
        <div>
          <h2 style={styles.welcomeTitle}>Good day! 👋</h2>
          <p style={styles.welcomeSubtitle}>Here's what's happening with your store today.</p>
        </div>
        <div style={styles.bannerDecor}>📊</div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            ...styles.statCard,
            backgroundColor: stat.color,
            border: `1px solid ${stat.border}`,
          }}>
            <div style={styles.statHeader}>
              <span style={styles.statIcon}>{stat.icon}</span>
              <span style={{ ...styles.statAccent, color: stat.accent }}>↗</span>
            </div>
            <p style={{ ...styles.statValue, color: stat.accent }}>{stat.value}</p>
            <p style={styles.statLabel}>{stat.label}</p>
            <p style={styles.statChange}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div style={styles.bottomGrid}>

        {/* Recent Orders */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Recent Orders</h3>
            <span style={styles.cardBadge}>{orders.length} total</span>
          </div>

          {orders.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📦</span>
              <p style={styles.emptyText}>No orders yet</p>
            </div>
          ) : (
            <div style={styles.ordersList}>
              {orders.slice(0, 6).map((order) => (
                <div key={order.id} style={styles.orderItem}>
                  <div style={styles.orderLeft}>
                    <div style={styles.orderAvatar}>
                      <span style={{ fontSize: '14px' }}>👤</span>
                    </div>
                    <div>
                      <p style={styles.orderEmail} title={order.userEmail}>
                        {order.userEmail?.split('@')[0]}
                      </p>
                      <p style={styles.orderId}>#{order.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div style={styles.orderRight}>
                    <p style={styles.orderAmount}>₱{order.grandTotal}</p>
                    <span style={{
                      ...styles.statusPill,
                      backgroundColor: statusColors[order.status]?.bg || '#F5F5F5',
                      color: statusColors[order.status]?.color || '#666',
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: statusColors[order.status]?.dot || '#666',
                        display: 'inline-block', marginRight: '4px',
                      }} />
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Products</h3>
            <span style={styles.cardBadge}>{products.length} listed</span>
          </div>

          {products.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>🛍️</span>
              <p style={styles.emptyText}>No products yet</p>
            </div>
          ) : (
            <div style={styles.ordersList}>
              {products.slice(0, 6).map((product) => (
                <div key={product.id} style={styles.orderItem}>
                  <div style={styles.orderLeft}>
                    <div style={styles.productThumb}>
                      <span style={{ fontSize: '18px' }}>🛍️</span>
                    </div>
                    <div>
                      <p style={styles.orderEmail}>{product.name}</p>
                      <p style={styles.orderId}>{product.category}</p>
                    </div>
                  </div>
                  <div style={styles.orderRight}>
                    <p style={styles.orderAmount}>{product.price}</p>
                    <span style={{
                      ...styles.statusPill,
                      backgroundColor: product.stock > 10 ? '#F0FDF4' : '#FFF7ED',
                      color: product.stock > 10 ? '#15803D' : '#C2410C',
                    }}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    gap: '12px',
  },
  loadingSpinner: {
    fontSize: '32px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#94A3B8',
  },
  welcomeBanner: {
    background: 'linear-gradient(135deg, #5C4033 0%, #7D5A4F 100%)',
    borderRadius: '16px',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
  },
  welcomeTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    color: '#fff',
  },
  welcomeSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
  },
  bannerDecor: {
    fontSize: '48px',
    opacity: 0.6,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  statCard: {
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  statIcon: {
    fontSize: '24px',
  },
  statAccent: {
    fontSize: '18px',
    fontWeight: '700',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#374151',
    margin: 0,
    fontWeight: '600',
  },
  statChange: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #F1F5F9',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1A1A2E',
    margin: 0,
  },
  cardBadge: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    padding: '3px 10px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: '600',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '36px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 8px',
    borderRadius: '10px',
    transition: 'background 0.15s',
  },
  orderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  orderAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productThumb: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#FDF6F0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderEmail: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A2E',
    margin: 0,
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  orderId: {
    fontSize: '11px',
    color: '#94A3B8',
    margin: 0,
    textTransform: 'capitalize',
  },
  orderRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  orderAmount: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#5C4033',
    margin: 0,
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '100px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
};