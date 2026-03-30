import React, { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard':     { title: 'Dashboard' },
  '/products':      { title: 'Products' },
  '/orders':        { title: 'Orders' },
  '/notifications': { title: 'Notifications' },
};

export default function Header() {
  const [sellerName, setSellerName] = useState('');
  const [sellerPhoto, setSellerPhoto] = useState('');
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'Dashboard' };

  useEffect(() => {
    const fetchSeller = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSellerName(docSnap.data().name || user.email?.split('@')[0]);
          setSellerPhoto(docSnap.data().photoURL || '');
        } else {
          setSellerName(user.email?.split('@')[0]);
        }
      }
    };
    fetchSeller();
  }, []);

  return (
    <div style={styles.header}>
      {/* Left — Page Title only */}
      <h1 style={styles.pageTitle}>{page.title}</h1>

      {/* Right — Profile only */}
      <div style={styles.profileSection}>
        {sellerPhoto ? (
          <img src={sellerPhoto} alt={sellerName} style={styles.avatarImg} />
        ) : (
          <div style={styles.avatarFallback}>
            <span style={styles.avatarText}>
              {sellerName ? sellerName.charAt(0).toUpperCase() : 'S'}
            </span>
          </div>
        )}
        <p style={styles.profileName}>{sellerName || 'Seller'}</p>
      </div>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#5C4033',
    padding: '14px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(92,64,51,0.15)',
  },
  pageTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.4px',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarImg: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.4)',
  },
  avatarFallback: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
};