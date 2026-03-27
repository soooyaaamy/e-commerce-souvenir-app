import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';

const statusColors = {
  pending: { bg: '#FFF3E0', color: '#E65100' },
  confirmed: { bg: '#E3F2FD', color: '#1565C0' },
  shipped: { bg: '#F3E5F5', color: '#6A1B9A' },
  delivered: { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
};

export default function Notifications() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      );
      setOrders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Notifications</h1>
          <p style={styles.pageSubtitle}>{orders.length} total orders received</p>
        </div>
        <button style={styles.refreshButton} onClick={fetchOrders}>
          🔄 Refresh
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={styles.emptyState}>
          <p>Loading notifications...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🔔</span>
          <p style={styles.emptyText}>No notifications yet</p>
          <p style={styles.emptySubtext}>
            When buyers place orders, they will appear here!
          </p>
        </div>
      ) : (
        <div style={styles.notificationsList}>
          {orders.map((order) => (
            <div key={order.id} style={styles.notificationCard}>

              {/* Icon */}
              <div style={styles.notifIcon}>
                <span style={styles.notifIconText}>
                  {order.status === 'delivered' ? '✅' :
                   order.status === 'cancelled' ? '❌' :
                   order.status === 'shipped' ? '🚚' :
                   order.status === 'confirmed' ? '✔️' : '🛒'}
                </span>
              </div>

              {/* Content */}
              <div style={styles.notifContent}>
                <div style={styles.notifHeader}>
                  <p style={styles.notifTitle}>
                    New Order from <strong>{order.userEmail}</strong>
                  </p>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: statusColors[order.status]?.bg || '#F5F5F5',
                    color: statusColors[order.status]?.color || '#666',
                  }}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div style={styles.itemsList}>
                  {order.items?.map((item, index) => (
                    <span key={index} style={styles.itemChip}>
                      🛍️ {item.name} x{item.quantity}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div style={styles.notifFooter}>
                  <span style={styles.orderId}>#{order.id.slice(0, 8)}</span>
                  <span style={styles.payment}>
                    {order.paymentMethod === 'cod' ? '💵 COD' : '📱 GCash'}
                  </span>
                  <span style={styles.totalAmount}>₱{order.grandTotal}</span>
                  <span style={styles.notifDate}>{formatDate(order.createdAt)}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  refreshButton: {
    backgroundColor: '#fff',
    color: '#5C4033',
    border: '2px solid #5C4033',
    borderRadius: '12px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px',
    gap: '12px',
    backgroundColor: '#fff',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '56px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
    textAlign: 'center',
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    alignItems: 'flex-start',
  },
  notifIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#FDF6F0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifIconText: {
    fontSize: '24px',
  },
  notifContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  notifTitle: {
    fontSize: '14px',
    color: '#333',
    margin: 0,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 0,
  },
  itemsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  itemChip: {
    backgroundColor: '#F5F5F5',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#555',
  },
  notifFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  orderId: {
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#666',
  },
  payment: {
    fontSize: '13px',
    color: '#666',
  },
  totalAmount: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#5C4033',
  },
  notifDate: {
    fontSize: '12px',
    color: '#999',
    marginLeft: 'auto',
  },
};