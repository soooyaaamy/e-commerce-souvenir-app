import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore';

const categories = ['crafts', 'clothing', 'food', 'decor'];

const emptyForm = {
  name: '', price: '', category: 'crafts',
  description: '', stock: '', seller: '',
};

export default function Products() {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);
  const [search, setSearch]             = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading]       = useState(false);

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
      seller: product.seller || '',
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
      if (data.success) return data.data.url;
      else throw new Error('Upload failed');
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
      if (imageFile) imageUrl = await uploadImage(imageFile);
      const productData = {
        name: form.name,
        price: `₱${form.price}`,
        category: form.category,
        description: form.description,
        stock: parseInt(form.stock),
        rating: editingProduct?.rating || '4.5',
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
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.seller || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={styles.container}>

      {/* ── Search + Add Product ─────────────────────────────── */}
      <div style={styles.searchRow}>
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
        <button style={styles.addButton} onClick={handleOpenAdd}>
          + Add Product
        </button>
      </div>

      {/* ── Category filter pills ────────────────────────────── */}
      <div style={styles.filterRow}>
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
            <span style={{
              marginLeft: 6,
              fontSize: 10, fontWeight: 700,
              backgroundColor: selectedCategory === cat ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
              color: selectedCategory === cat ? '#fff' : '#94A3B8',
              padding: '1px 6px', borderRadius: 20,
            }}>
              {cat === 'all'
                ? products.length
                : products.filter((p) => p.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table card ───────────────────────────────────────── */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 32, color: '#5C4033' }}>⟳</div>
            <p style={styles.emptyText}>Connecting to real-time data...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 48 }}>🛍️</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>
              No products found
            </p>
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
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={styles.tr}>

                  {/* Product */}
                  <td style={styles.td}>
                    <div style={styles.productCell}>
                      <div style={styles.productThumb}>
                        {product.image ? (
                          <img src={product.image} alt={product.name} style={styles.thumbImg} />
                        ) : (
                          <span style={{ fontSize: 22 }}>🛍️</span>
                        )}
                      </div>
                      <div>
                        <p style={styles.productName}>{product.name}</p>
                        <p style={styles.productDesc}>
                          {(product.description || '').slice(0, 52)}
                          {(product.description || '').length > 52 ? '…' : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={styles.td}>
                    <span style={styles.categoryBadge}>{product.category}</span>
                  </td>

                  {/* Price */}
                  <td style={styles.td}>
                    <span style={styles.priceText}>{product.price}</span>
                  </td>

                  {/* Stock */}
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
                      {product.stock === 0
                        ? '✕ Out of stock'
                        : product.stock <= 5
                          ? `⚠ ${product.stock} left`
                          : `${product.stock} in stock`}
                    </span>
                  </td>

                  {/* Actions */}
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

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
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

                <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                  <label style={styles.formLabel}>Seller Name *</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. Artisan Crafts PH"
                    value={form.seller}
                    onChange={(e) => setForm({ ...form, seller: e.target.value })}
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
                      <img src={imagePreview} alt="Preview" style={styles.imagePreviewImg} />
                      <button
                        style={styles.removeImageBtn}
                        onClick={() => { setImagePreview(''); setImageFile(null); }}
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
                      <span style={{ fontSize: 32 }}>📁</span>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>
                        Click to upload image
                      </p>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </label>
                  )}
                  {uploading && (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
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

      {/* ── Delete Confirm Modal ─────────────────────────────── */}
      {deleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.deleteModal}>
            <div style={styles.deleteIconWrapper}>
              <span style={{ fontSize: 36 }}>🗑️</span>
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
  container: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Search row
  searchRow: { display: 'flex', gap: 12, alignItems: 'center' },
  searchWrapper: {
    flex: 1,
    display: 'flex', alignItems: 'center', gap: 10,
    backgroundColor: '#fff',
    border: '1.5px solid #F1F5F9',
    borderRadius: 12, padding: '0 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, padding: '11px 0',
    border: 'none', outline: 'none',
    fontSize: 14, backgroundColor: 'transparent', color: '#1A1A2E',
  },
  clearSearch: {
    background: 'none', border: 'none',
    cursor: 'pointer', color: '#94A3B8', fontSize: 14, padding: 4,
  },
  addButton: {
    background: 'linear-gradient(135deg, #5C4033, #7D5A4F)',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '11px 22px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(92,64,51,0.25)',
    whiteSpace: 'nowrap',
  },

  // Filter pills
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catBtn: {
    display: 'inline-flex', alignItems: 'center',
    padding: '7px 14px', borderRadius: 100,
    border: '1.5px solid #F1F5F9',
    backgroundColor: '#fff', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', color: '#64748B', transition: 'all 0.15s',
  },
  catBtnActive: {
    backgroundColor: '#5C4033', color: '#fff',
    border: '1.5px solid #5C4033', fontWeight: 700,
  },

  // Table card
  tableCard: {
    backgroundColor: '#fff', borderRadius: 16,
    border: '1px solid #F1F5F9', overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: 60, gap: 10,
  },
  emptyText: { fontSize: 14, color: '#94A3B8', margin: 0 },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 20px', textAlign: 'left',
    fontSize: 11, fontWeight: 700, color: '#94A3B8',
    backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  tr: { borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' },
  td: { padding: '14px 20px', fontSize: 14, color: '#374151', verticalAlign: 'middle' },

  productCell: { display: 'flex', alignItems: 'center', gap: 12 },
  productThumb: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: '#FDF6F0', border: '1px solid #F0E0D6',
    overflow: 'hidden', display: 'flex', justifyContent: 'center',
    alignItems: 'center', flexShrink: 0,
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  productName: { fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: 0 },
  productDesc: { fontSize: 12, color: '#94A3B8', margin: 0 },

  categoryBadge: {
    backgroundColor: '#F0F9FF', color: '#0369A1',
    padding: '4px 10px', borderRadius: 6,
    fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    border: '1px solid #BAE6FD',
  },
  priceText: { fontSize: 14, fontWeight: 700, color: '#5C4033' },
  stockBadge: { padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },

  actionBtns: { display: 'flex', gap: 8, alignItems: 'center' },
  editBtn: {
    backgroundColor: '#EFF6FF', color: '#1D4ED8',
    border: '1px solid #BFDBFE', borderRadius: 8,
    padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: '#FFF1F2', color: '#BE123C',
    border: '1px solid #FECDD3', borderRadius: 8,
    padding: '6px 10px', fontSize: 14, cursor: 'pointer',
  },

  // Modals
  modalOverlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 20,
    width: 580, maxWidth: '90%',
    maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '24px 24px 0 24px',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  modalSubtitle: { fontSize: 13, color: '#94A3B8', margin: '4px 0 0' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8, border: 'none',
    backgroundColor: '#F1F5F9', cursor: 'pointer',
    fontSize: 14, color: '#64748B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: '20px 24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  formLabel: {
    fontSize: 12, fontWeight: 600, color: '#374151',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  formInput: {
    padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #E5E7EB', fontSize: 14,
    color: '#1A1A2E', outline: 'none',
    width: '100%', boxSizing: 'border-box', backgroundColor: '#FAFAFA',
  },
  imagePreviewContainer: {
    position: 'relative', width: '100%', height: 180,
    borderRadius: 10, overflow: 'hidden', border: '1.5px solid #E5E7EB',
  },
  imagePreviewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#E53E3E', color: '#fff',
    border: 'none', borderRadius: 6,
    padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  uploadArea: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', border: '2px dashed #E5E7EB',
    borderRadius: 10, padding: 32, cursor: 'pointer',
    backgroundColor: '#FAFAFA', gap: 8,
  },
  progressContainer: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 },
  progressBar: {
    flex: 1, height: 6, backgroundColor: '#E5E7EB',
    borderRadius: 100, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: '#5C4033',
    borderRadius: 100, transition: 'width 0.3s ease',
  },
  progressText: { fontSize: 12, fontWeight: 600, color: '#5C4033', minWidth: 36 },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 12,
    padding: '16px 24px 24px', borderTop: '1px solid #F1F5F9',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9', color: '#64748B', border: 'none',
    borderRadius: 10, padding: '11px 22px', fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #5C4033, #7D5A4F)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '11px 22px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(92,64,51,0.25)',
  },
  saveBtnDisabled: { background: '#CBD5E0', boxShadow: 'none', cursor: 'not-allowed' },
  deleteModal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 36,
    width: 400, maxWidth: '90%',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  deleteIconWrapper: {
    width: 72, height: 72, borderRadius: '50%',
    backgroundColor: '#FFF1F2',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  deleteTitle: { fontSize: 20, fontWeight: 700, color: '#1A1A2E', margin: 0 },
  deleteMsg: { fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: 0 },
  deleteBtns: { display: 'flex', gap: 12, marginTop: 8 },
  confirmDeleteBtn: {
    backgroundColor: '#E53E3E', color: '#fff', border: 'none',
    borderRadius: 10, padding: '11px 22px', fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
  },
};