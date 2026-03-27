import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞', emoji: '📊' },
  { path: '/products', label: 'Products', icon: '◈', emoji: '🛍️' },
  { path: '/orders', label: 'Orders', icon: '◫', emoji: '📦' },
  { path: '/notifications', label: 'Notifications', icon: '◎', emoji: '🔔' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>
          <span style={{ fontSize: '22px' }}>🏪</span>
        </div>
        <div>
          <p style={styles.logoTitle}>SouvenirShop</p>
          <p style={styles.logoSubtitle}>Seller Portal</p>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Menu Label */}
      <p style={styles.menuLabel}>MAIN MENU</p>

      {/* Nav Items */}
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.path;
          return (
            <button
              key={item.path}
              style={{
                ...styles.menuItem,
                ...(isActive ? styles.menuItemActive : {}),
                ...(isHovered && !isActive ? styles.menuItemHover : {}),
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {isActive && <div style={styles.activeBar} />}
              <span style={styles.menuEmoji}>{item.emoji}</span>
              <span style={{
                ...styles.menuText,
                color: isActive ? '#5C4033' : '#64748B',
                fontWeight: isActive ? '600' : '500',
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={styles.activeDot} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={styles.bottomSection}>
        <div style={styles.divider} />

        {/* Help Card */}
        <div style={styles.helpCard}>
          <p style={styles.helpTitle}>Need Help?</p>
          <p style={styles.helpText}>Check our documentation or contact support.</p>
        </div>

        {/* Logout */}
        <button
          style={styles.logoutButton}
          onClick={handleLogout}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF0F0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span>🚪</span>
          <span style={styles.logoutText}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    boxShadow: '1px 0 0 0 #F1F5F9',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    marginBottom: '8px',
  },
  logoIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    backgroundColor: '#FDF6F0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid #F0E0D6',
  },
  logoTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1A1A2E',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  logoSubtitle: {
    fontSize: '11px',
    color: '#94A3B8',
    margin: 0,
    fontWeight: '500',
  },
  divider: {
    height: '1px',
    backgroundColor: '#F1F5F9',
    margin: '12px 0',
  },
  menuLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: '1px',
    padding: '0 12px',
    marginBottom: '8px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
    width: '100%',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  menuItemActive: {
    backgroundColor: '#FDF6F0',
  },
  menuItemHover: {
    backgroundColor: '#F8F9FA',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    height: '60%',
    width: '3px',
    backgroundColor: '#5C4033',
    borderRadius: '0 4px 4px 0',
  },
  menuEmoji: {
    fontSize: '18px',
    width: '24px',
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: '14px',
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#5C4033',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  helpCard: {
    backgroundColor: '#FDF6F0',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '8px',
    border: '1px solid #F0E0D6',
  },
  helpTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#5C4033',
    margin: '0 0 4px 0',
  },
  helpText: {
    fontSize: '11px',
    color: '#94A3B8',
    margin: 0,
    lineHeight: '1.5',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  logoutText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#E53935',
  },
};