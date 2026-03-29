import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore';
const categories = ['crafts', 'clothing', 'food', 'decor'];

const emptyForm = {
  name: '', price: '', category: 'crafts',
  description: '', stock: '', rating: '4.5', seller: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Products listener error:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price.replace('₱', ''),
      category: product.category,
      description: product.description,
      stock: product.stock.toString(),
      rating: product.rating,
      seller: product.seller,
    });
    setImageFile(null);
    setImagePreview(product.image || '');
    setUploadProgress(0);
    setShowModal(true);
  };

  const uploadImage = async (file) => {
  const API_KEY = '041fc834bd83e283520a7c5e4dc9fe3e'; 
  const formData = new FormData();
  formData.append('image', file);

  setUploading(true);
  setUploadProgress(30);

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${API_KEY}`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();
    setUploadProgress(100);
    setUploading(false);
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    setUploading(false);
    throw error;
  }
};

  const handleSave = async () => {
    if (!form.name || !form.price || !form.description || !form.stock || !form.seller) {
      alert('Please fill in all fields!');
      return;
    }
    if (!editingProduct && !imageFile) {
      alert('Please upload a product image!');
      return;
    }
    setSaving(true);
    try {
      let imageUrl = editingProduct?.image || '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const productData = {
        name: form.name,
        price: `₱${form.price}`,
        category: form.category,
        description: form.description,
        stock: parseInt(form.stock),
        rating: form.rating,
        seller: form.seller,
        image: imageUrl,
      };
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setShowModal(false);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setDeleteConfirm(null);
    } catch (err) {
      alert('Error deleting product: ' + err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.seller || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={styles.container}>

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Products</h1>
          <p style={styles.pageSubtitle}>
            {products.length} products · updates live in the buyer app
          </p>
        </div>
        <button style={styles.addButton} onClick={handleOpenAdd}>
          + Add Product
        </button>
      </div>

      {/* Live Indicator */}
      <div style={styles.liveBar}>
        <span style={styles.liveDot} />
        <span style={styles.liveText}>
          Real-time sync enabled — changes appear instantly in the buyer app
        </span>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Search by name or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={styles.clearSearch} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div style={styles.categoryFilters}>
          {['all', ...categories].map((cat) => (
            <button
              key={cat}
              style={{
                ...styles.catBtn,
                ...(selectedCategory === cat ? styles.catBtnActive : {}),
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>
            <div style={styles.spinner}>⟳</div>
            <p style={styles.emptyText}>Connecting to real-time data...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🛍️</span>
            <p style={styles.emptyTitle}>No products found</p>
            <p style={styles.emptyText}>
              {search || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first product to get started'}
            </p>
            {!search && selectedCategory === 'all' && (
              <button style={styles.addButton} onClick={handleOpenAdd}>
                + Add Product
              </button>
            )}
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Seller</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr
                  key={product.id}
                  style={{
                    ...styles.tr,
                    backgroundColor: index % 2 === 0 ? '#fff' : '#FAFAFA',
                  }}
                >
                  <td style={styles.td}>
                    <div style={styles.productCell}>
                      <div style={styles.productThumb}>
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={styles.thumbImg}
                          />
                        ) : (
                          <span style={{ fontSize: '22px' }}>🛍️</span>
                        )}
                      </div>
                      <div>
                        <p style={styles.productName}>{product.name}</p>
                        <p style={styles.productDesc}>
                          {(product.description || '').slice(0, 40)}
                          {(product.description || '').length > 40 ? '…' : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.categoryBadge}>{product.category}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.priceText}>{product.price}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.stockBadge,
                      backgroundColor: product.stock === 0 ? '#FFF1F2'
                        : product.stock <= 5 ? '#FFF7ED' : '#F0FDF4',
                      color: product.stock === 0 ? '#BE123C'
                        : product.stock <= 5 ? '#C2410C' : '#15803D',
                      border: `1px solid ${product.stock === 0 ? '#FECDD3'
                        : product.stock <= 5 ? '#FED7AA' : '#BBF7D0'}`,
                    }}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.ratingText}>⭐ {product.rating}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.sellerText}>{product.seller || '—'}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionBtns}>
                      <button style={styles.editBtn} onClick={() => handleOpenEdit(product)}>
                        ✏️ Edit
                      </button>
                      <button style={styles.deleteBtn} onClick={() => setDeleteConfirm(product)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p style={styles.modalSubtitle}>
                  {editingProduct
                    ? 'Changes sync immediately to the buyer app'
                    : 'New product will appear instantly in the buyer app'}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGrid}>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Product Name *</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. Handwoven Basket"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Price (₱) *</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. 250"
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Category *</label>
                  <select
                    style={styles.formInput}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Stock *</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. 50"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Seller Name *</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. Artisan Crafts PH"
                    value={form.seller}
                    onChange={(e) => setForm({ ...form, seller: e.target.value })}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Rating (0–5)</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. 4.5"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  />
                </div>

                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.formLabel}>Description *</label>
                  <textarea
                    style={{ ...styles.formInput, height: '90px', resize: 'vertical' }}
                    placeholder="Describe your product..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.formLabel}>Product Image *</label>

                  {imagePreview ? (
                    <div style={styles.imagePreviewContainer}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={styles.imagePreviewImg}
                      />
                      <button
                        style={styles.removeImageBtn}
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <label style={styles.uploadArea}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <span style={styles.uploadIcon}>📁</span>
                      <p style={styles.uploadText}>Click to upload image</p>
                      <p style={styles.uploadSubtext}>PNG, JPG, WEBP up to 5MB</p>
                    </label>
                  )}

                  {uploading && (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: `${uploadProgress}%`,
                        }} />
                      </div>
                      <span style={styles.progressText}>{uploadProgress}%</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : editingProduct ? '✓ Save Changes' : '+ Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.deleteModal}>
            <div style={styles.deleteIconWrapper}>
              <span style={{ fontSize: '36px' }}>🗑️</span>
            </div>
            <h3 style={styles.deleteTitle}>Delete Product?</h3>
            <p style={styles.deleteMsg}>
              Are you sure you want to delete{' '}
              <strong>"{deleteConfirm.name}"</strong>? This will immediately
              remove it from the buyer app.
            </p>
            <div style={styles.deleteBtns}>
              <button style={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                style={styles.confirmDeleteBtn}
                onClick={() => handleDelete(deleteConfirm.id)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A2E',
    margin: 0,
    letterSpacing: '-0.4px',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: '4px 0 0 0',
  },
  addButton: {
    background: 'linear-gradient(135deg, #5C4033, #7D5A4F)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 22px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(92,64,51,0.25)',
  },
  liveBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '10px',
    padding: '10px 16px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22C55E',
    boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
    flexShrink: 0,
  },
  liveText: {
    fontSize: '13px',
    color: '#15803D',
    fontWeight: '500',
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fff',
    border: '1.5px solid #E5E7EB',
    borderRadius: '10px',
    padding: '0 16px',
    flex: 1,
    minWidth: '200px',
  },
  searchIcon: { fontSize: '16px' },
  searchInput: {
    flex: 1,
    padding: '11px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#1A1A2E',
  },
  clearSearch: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    fontSize: '14px',
    padding: '4px',
  },
  categoryFilters: {
    display: 'flex',
    gap: '8px',
  },
  catBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1.5px solid #E5E7EB',
    backgroundColor: '#fff',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#64748B',
  },
  catBtnActive: {
    backgroundColor: '#5C4033',
    color: '#fff',
    border: '1.5px solid #5C4033',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #F1F5F9',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px',
    gap: '10px',
  },
  spinner: {
    fontSize: '32px',
    color: '#5C4033',
  },
  emptyIcon: { fontSize: '48px' },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: { transition: 'background 0.15s' },
  td: {
    padding: '14px 20px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #F8FAFC',
    verticalAlign: 'middle',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productThumb: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#FDF6F0',
    border: '1px solid #F0E0D6',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  productName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1A2E',
    margin: 0,
  },
  productDesc: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
  },
  categoryBadge: {
    backgroundColor: '#F0F9FF',
    color: '#0369A1',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
    border: '1px solid #BAE6FD',
  },
  priceText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#5C4033',
  },
  stockBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  ratingText: {
    fontSize: '13px',
    color: '#92400E',
    fontWeight: '600',
  },
  sellerText: {
    fontSize: '13px',
    color: '#64748B',
  },
  actionBtns: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    border: '1px solid #BFDBFE',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: '#FFF1F2',
    color: '#BE123C',
    border: '1px solid #FECDD3',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    width: '580px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 0 24px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1A2E',
    margin: 0,
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#94A3B8',
    margin: '4px 0 0 0',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#F1F5F9',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748B',
  },
  modalBody: { padding: '20px 24px' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  formInput: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    color: '#1A1A2E',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#FAFAFA',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: '180px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1.5px solid #E5E7EB',
  },
  imagePreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: '#E53E3E',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #E5E7EB',
    borderRadius: '10px',
    padding: '32px',
    cursor: 'pointer',
    backgroundColor: '#FAFAFA',
    gap: '8px',
  },
  uploadIcon: { fontSize: '32px' },
  uploadText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  uploadSubtext: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
  },
  progressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '100px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5C4033',
    borderRadius: '100px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#5C4033',
    minWidth: '36px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px 24px 24px',
    borderTop: '1px solid #F1F5F9',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 22px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #5C4033, #7D5A4F)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 22px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(92,64,51,0.25)',
  },
  saveBtnDisabled: {
    background: '#CBD5E0',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  deleteModal: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '36px',
    width: '400px',
    maxWidth: '90%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  deleteIconWrapper: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#FFF1F2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1A2E',
    margin: 0,
  },
  deleteMsg: {
    fontSize: '14px',
    color: '#64748B',
    lineHeight: '1.6',
    margin: 0,
  },
  deleteBtns: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  confirmDeleteBtn: {
    backgroundColor: '#E53E3E',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 22px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};