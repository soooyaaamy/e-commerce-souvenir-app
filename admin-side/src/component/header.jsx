import React, { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your store performance' },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/orders': { title: 'Orders', subtitle: 'Track and manage customer orders' },
  '/notifications': { title: 'Notifications', subtitle: 'Stay updated with new orders' },
};

export default function Header() {
  const [sellerName, setSellerName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'Dashboard', subtitle: '' };

  useEffect(() => {
    const fetchSeller = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSellerName(docSnap.data().name);
        } else {
          setSellerName(user.email?.split('@')[0]);
        }
      }
    };
    fetchSeller();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.header}>
      {/* Left - Page Title */}
      <div style={styles.pageTitleSection}>
        <h1 style={styles.pageTitle}>{page.title}</h1>
        <p style={styles.pageSubtitle}>{page.subtitle}</p>
      </div>

      {/* Right - Actions */}
      <div style={styles.rightSection}>
        {/* Time */}
        <div style={styles.timeCard}>
          <span style={styles.timeIcon}>🕐</span>
          <span style={styles.timeText}>
            {currentTime.toLocaleTimeString('en-PH', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Notification Bell */}
        <button style={styles.iconButton}>
          <span style={{ fontSize: '18px' }}>🔔</span>
        </button>

        {/* Divider */}
        <div style={styles.verticalDivider} />

        {/* User Profile */}
        <div style={styles.profileSection}>
          <div style={styles.avatar}>
            <span style={styles.avatarText}>
              {sellerName ? sellerName.charAt(0).toUpperCase() : 'S'}
            </span>
          </div>
          <div style={styles.profileInfo}>
            <p style={styles.profileName}>{sellerName || 'Seller'}</p>
            <p style={styles.profileRole}>Shop Owner</p>
          </div>
          <span style={{ color: '#94A3B8', fontSize: '12px' }}>▼</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#FFFFFF',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 0 0 #F1F5F9',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  pageTitleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1A2E',
    margin: 0,
    letterSpacing: '-0.4px',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: 0,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8F9FA',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid #F1F5F9',
  },
  timeIcon: {
    fontSize: '14px',
  },
  timeText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#5C4033',
  },
  iconButton: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #F1F5F9',
    backgroundColor: '#F8F9FA',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#F1F5F9',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 12px 6px 6px',
    borderRadius: '12px',
    border: '1px solid #F1F5F9',
    cursor: 'pointer',
    backgroundColor: '#F8F9FA',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #5C4033, #8B6355)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1A1A2E',
    margin: 0,
  },
  profileRole: {
    fontSize: '11px',
    color: '#94A3B8',
    margin: 0,
  },
};