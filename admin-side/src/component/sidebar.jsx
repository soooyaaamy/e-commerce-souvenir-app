import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const menuItems = [
  { path: '/dashboard',     label: 'Dashboard'     },
  { path: '/products',      label: 'Products'      },
  { path: '/orders',        label: 'Orders'        },
  { path: '/notifications', label: 'Notifications' },
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

      {/* Logo — uses same font weight/size as Header title */}
      <div style={styles.logoContainer}>
        <p style={styles.logoTitle}>Hagonoy Souvenir</p>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Menu Label */}
      <p style={styles.menuLabel}>MAIN MENU</p>

      {/* Nav Items — no horizontal padding on sidebar so buttons go edge to edge */}
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.path;

          let bgColor = 'transparent';
          let textColor = 'rgba(255,255,255,0.65)';
          let fontWeight = '400';

          if (isActive) {
            bgColor = '#FDF6F0';
            textColor = '#5C4033';
            fontWeight = '700';
          } else if (isHovered) {
            bgColor = '#F5EBE0';
            textColor = '#5C4033';
            fontWeight = '600';
          }

          return (
            <button
              key={item.path}
              style={{
                ...styles.menuItem,
                backgroundColor: bgColor,
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <span style={{
                ...styles.menuText,
                color: textColor,
                fontWeight: fontWeight,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={styles.bottomSection}>
        <div style={styles.divider} />
        <button
          style={styles.logoutButton}
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F5EBE0';
            e.currentTarget.querySelector('span').style.color = '#5C4033';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.querySelector('span').style.color = '#FF8A80';
          }}
        >
          <span style={styles.logoutText}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    backgroundColor: '#5C4033',
    display: 'flex',
    flexDirection: 'column',
    // ← Only vertical padding; horizontal is handled per-element
    paddingTop: '24px',
    paddingBottom: '24px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  logoContainer: {
    // ← Horizontal padding only on logo
    paddingLeft: '20px',
    paddingRight: '20px',
    marginBottom: '8px',
  },
  logoTitle: {
    fontSize: '20px',       // ← Same as Header pageTitle
    fontWeight: '700',      // ← Same as Header pageTitle
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.4px', // ← Same as Header pageTitle
    fontFamily: 'inherit',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    margin: '12px 0',
  },
  menuLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '1px',
    // ← Horizontal padding only on label
    paddingLeft: '20px',
    paddingRight: '20px',
    marginBottom: '8px',
    fontFamily: 'inherit',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    // ← No horizontal padding — buttons are full bleed
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    // ← Inner text padding so label isn't flush against edge
    paddingTop: '11px',
    paddingBottom: '11px',
    paddingLeft: '20px',
    paddingRight: '20px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '0px',     // ← No border radius = true edge-to-edge
    transition: 'all 0.15s ease',
  },
  menuText: {
    fontSize: '14px',
    fontFamily: 'inherit',
    width: '100%',
  },
  bottomSection: {
    marginTop: 'auto',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '11px',
    paddingBottom: '11px',
    paddingLeft: '20px',
    paddingRight: '20px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '0px',
    transition: 'all 0.15s ease',
  },
  logoutText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#FF8A80',
    fontFamily: 'inherit',
    transition: 'color 0.15s ease',
  },
};