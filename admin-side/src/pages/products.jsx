import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';

const categories = ['crafts', 'clothing', 'food', 'decor'];

const emptyForm = {
  name: '', price: '', category: 'crafts',
  description: '', stock: '', rating: '4.5',
  seller: '', image: 'https://via.placeholder.com/300/E8D5B7/000000?text=Product',
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

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
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
      image: product.image,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.description || !form.stock || !form.seller) {
      alert('Please fill in all fields!');
      return;
    }
    setSaving(true);
    try {
      const productData = {
        name: form.name,
        price: `₱${form.price}`,
        category: form.category,
        description: form.description,
        stock: parseInt(form.stock),
        rating: form.rating,
        seller: form.seller,
        image: form.image,
      };
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      await fetchProducts();
      setShowModal(false);
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await fetchProducts();
      setDeleteConfirm(null);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={styles.container}>

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Products</h1>
          <p style={styles.pageSubtitle}>{products.length} total products in your catalog</p>
        </div>
        <button style={styles.addButton} onClick={handleOpenAdd}>
          + Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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

      {/* Products Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🛍️</span>
            <p style={styles.emptyTitle}>No products found</p>
            <p style={styles.emptyText}>Add your first product to get started</p>
            <button style={styles.addButton} onClick={handleOpenAdd}>
              + Add Product
            </button>
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
                <tr key={product.id} style={{
                  ...styles.tr,
                  backgroundColor: index % 2 === 0 ? '#fff' : '#FAFAFA',
                }}>
                  <td style={styles.td}>
                    <div style={styles.productCell}>
                      <div style={styles.productThumb}>
                        <span style={{ fontSize: '22px' }}>🛍️</span>
                      </div>
                      <div>
                        <p style={styles.productName}>{product.name}</p>
                        <p style={styles.productDesc}>
                          {product.description?.slice(0, 35)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.categoryBadge}>
                      {product.category}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.priceText}>{product.price}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.stockBadge,
                      backgroundColor: product.stock > 10 ? '#F0FDF4' : '#FFF7ED',
                      color: product.stock > 10 ? '#15803D' : '#C2410C',
                      border: `1px solid ${product.stock > 10 ? '#BBF7D0' : '#FED7AA'}`,
                    }}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.ratingText}>⭐ {product.rating}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.sellerText}>{product.seller}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionBtns}>
                      <button
                        style={styles.editBtn}
                        onClick={() => handleOpenEdit(product)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => setDeleteConfirm(product)}
                      >
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p style={styles.modalSubtitle}>
                  {editingProduct ? 'Update product details' : 'Fill in the product information'}
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
                  <label style={styles.formLabel}>Rating</label>
                  <input
                    style={styles.formInput}
                    placeholder="e.g. 4.5"
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
                  <label style={styles.formLabel}>Image URL</label>
                  <input
                    style={styles.formInput}
                    placeholder="https://..."
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
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
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
              This will also remove it from the buyer app.
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
  searchIcon: {
    fontSize: '16px',
  },
  searchInput: {
    flex: 1,
    padding: '11px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: 'transparent',
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
  emptyIcon: {
    fontSize: '48px',
  },
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
  tr: {
    transition: 'background 0.15s',
  },
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: '20px 24px',
  },
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
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '0 24px 24px 24px',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
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
    marginBottom: '4px',
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