import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import productApi from '../../api/product';
import '../../assets/css/ProductFormModalStyle.css';

const ProductFormModal = ({ isOpen, onClose, onSuccess, editData }) => {
    const initialFormState = {
        name: '',
        barcode: '',
        price: '',
        categoryId: '',
        status: 'ACTIVE',
        description: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                barcode: editData.barcode || '',
                // price từ backend là BigDecimal → có thể là number hoặc string
                price: editData.price !== undefined && editData.price !== null ? String(editData.price) : '',
                categoryId: editData.categoryId ? String(editData.categoryId) : '',
                status: editData.status || 'ACTIVE',
                description: editData.description || '',
            });
        } else {
            setFormData(initialFormState);
        }
        setError(null);
    }, [editData, isOpen]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate
        if (!formData.categoryId) {
            setError("Vui lòng chọn Category");
            setLoading(false);
            return;
        }

        // Build đúng ProductRequest cho backend
        // Backend @NotNull categoryId (Long), price (BigDecimal)
        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),           // BigDecimal
            categoryId: parseInt(formData.categoryId),   // Long
            status: formData.status,                     // "ACTIVE" | "INACTIVE"
            barcode: formData.barcode.trim(),
        };

        try {
            if (editData) {
                await productApi.update(editData.id, payload);
            } else {
                await productApi.create(payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            // Backend trả lỗi dạng object hoặc string
            let msg = "Có lỗi xảy ra";

            if (err?.message) {
                if (err.message.includes("must not be blank") && err.message.includes("name")) {
                    msg = "Tên sản phẩm không được để trống";
                } else {
                    msg = err.message;
                }
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                overflowY: 'auto', padding: '40px 24px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: '1000px',
                    fontFamily: "'Inter', sans-serif",
                    background: '#f1f5f9', borderRadius: '20px', padding: '32px',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                            {editData ? 'Edit Product' : 'Create New Product'}
                        </h1>
                        <p style={{ fontSize: '14px', color: '#6366f1', margin: 0 }}>
                            {editData ? 'Update the details of this product.' : 'Fill in the details below to add a new item to your inventory.'}
                        </p>
                    </div>
                    <button className="pf-cancel-btn" onClick={onClose}>Discard</button>
                </div>

                {error && (
                    <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

                        {/* LEFT COLUMN */}
                        <div>
                            {/* General Information */}
                            <div className="pf-card">
                                <p className="pf-card-title">General Information</p>
                                <div style={{ marginBottom: '18px' }}>
                                    <label className="pf-label">
                                        Product Name <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input className="pf-input" type="text" name="name" required
                                           placeholder="e.g., Wireless Headphones"
                                           value={formData.name} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="pf-label">Description</label>
                                    <textarea className="pf-input" name="description" rows="6"
                                              placeholder="Enter product description..."
                                              value={formData.description} onChange={handleChange}
                                              style={{ resize: 'vertical', lineHeight: '1.6' }} />
                                    <p style={{ fontSize: '12px', color: '#6366f1', marginTop: '6px', marginBottom: 0 }}>
                                        Use rich text to describe the product features.
                                    </p>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="pf-card">
                                <p className="pf-card-title">Pricing</p>
                                <div>
                                    <label className="pf-label">
                                        Base Price <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <span className="pf-price-prefix">$</span>
                                        <input className="pf-input" type="number" name="price" required min="0" step="0.01"
                                               placeholder="0.00" value={formData.price} onChange={handleChange}
                                               style={{ paddingLeft: '28px' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Identification */}
                            <div className="pf-card">
                                <p className="pf-card-title">Identification</p>
                                <label className="pf-label">
                                    Barcode <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input className="pf-input" type="text" name="barcode" required
                                       placeholder="e.g., 8934588011008"
                                       value={formData.barcode} onChange={handleChange} />
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div>
                            {/* Status */}
                            <div className="pf-card">
                                <p className="pf-section-label">Status</p>
                                {[
                                    { value: 'ACTIVE', label: 'Active', sub: 'Product is live in store.' },
                                    { value: 'INACTIVE', label: 'Inactive', sub: 'Product is hidden.' }
                                ].map(opt => (
                                    <div key={opt.value}
                                         className={`pf-radio-option ${formData.status === opt.value ? 'selected' : ''}`}
                                         onClick={() => setFormData(prev => ({ ...prev, status: opt.value }))}>
                                        <div className="pf-radio-dot">
                                            {formData.status === opt.value && <div className="pf-radio-inner" />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{opt.label}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{opt.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Organization — categoryId (Long) bắt buộc */}
                            <div className="pf-card">
                                <p className="pf-section-label">Organization</p>
                                <div>
                                    <label className="pf-label">
                                        Category <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select className="pf-select" name="categoryId"
                                            value={formData.categoryId} onChange={handleChange} required>
                                        <option value="">Select category...</option>
                                        {/*
                                            ── GHI CHÚ ──
                                            Lý tưởng nhất là fetch danh sách category từ API:
                                            GET /category → rồi map ra option
                                            Tạm thời hardcode, bạn thay bằng state categories từ categoryApi.getAll()
                                        */}
                                        <option value="1">Electronics</option>
                                        <option value="2">Clothing</option>
                                        <option value="3">Food & Beverage</option>
                                        <option value="4">Home & Garden</option>
                                    </select>
                                </div>
                            </div>

                            {/* Product Images — placeholder, chưa có API upload */}
                            <div className="pf-card">
                                <p className="pf-section-label">Product Images</p>
                                <div className="pf-upload-area">
                                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5" style={{ margin: '0 auto 10px', display: 'block' }}>
                                        <polyline points="16 16 12 12 8 16"/>
                                        <line x1="12" y1="12" x2="12" y2="21"/>
                                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                                    </svg>
                                    <p style={{ fontSize: '13px', margin: '0', color: '#6b7280' }}>
                                        <span style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>Upload a file</span>
                                        {' '}or drag and drop
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>PNG, JPG, GIF up to 10MB</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '20px', borderTop: '1.5px solid #e5e7eb' }}>
                        <button type="button" className="pf-cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="pf-submit-btn" disabled={loading}>
                            {loading && (
                                <svg style={{ animation: 'pf-spin 0.8s linear infinite', width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="30 70" strokeLinecap="round"/>
                                </svg>
                            )}
                            {editData ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ProductFormModal;