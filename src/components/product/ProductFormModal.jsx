import React, {useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import productApi from '../../api/product';
import '../../assets/css/ProductFormModalStyle.css';

// NHẬN THÊM PROP "categories" VÀO ĐÂY
const ProductFormModal = ({ isOpen, onClose, onSuccess, editData, categories = [] }) => {
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

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                barcode: editData.barcode || '',
                price: editData.price !== undefined && editData.price !== null ? String(editData.price) : '',
                categoryId: editData.categoryId ? String(editData.categoryId) : '',
                status: editData.status || 'ACTIVE',
                description: editData.description || '',
            });
            fetchExistingImages(editData.id);
        } else {
            setFormData(initialFormState);
            setExistingImages([]);
        }
        setNewImages([]);
        setError(null);
    }, [editData, isOpen]);

    const fetchExistingImages = async (id) => {
        try {
            const res = await productApi.getImages(id);
            if (res && res.data) {
                setExistingImages(res.data.map(img => img.imageUrl));
            }
        } catch (err) {
            console.error("Failed to fetch images", err);
        }
    };

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(prev => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeExistingImage = (urlToRemove) => {
        setExistingImages(prev => prev.filter(url => url !== urlToRemove));
    };

    const removeNewImage = (indexToRemove) => {
        setNewImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.categoryId) {
            setError("Vui lòng chọn Category");
            setLoading(false); return;
        }

        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            categoryId: parseInt(formData.categoryId),
            status: formData.status,
            barcode: formData.barcode.trim(),
        };

        const submitData = new FormData();
        submitData.append("product", new Blob([JSON.stringify(payload)], { type: "application/json" }));

        Array.from(newImages || []).forEach(file => {
            submitData.append("images", file);
        });

        Array.from(existingImages || []).forEach(url => {
            submitData.append("retainedImageUrls", url);
        });

        try {
            if (editData) {
                await productApi.updateWithImages(editData.id, submitData);
            } else {
                await productApi.createWithImages(submitData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra trong quá trình lưu dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 24px' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '1000px', fontFamily: "'Inter', sans-serif", background: '#f1f5f9', borderRadius: '20px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                            {editData ? 'Edit Product' : 'Create New Product'}
                        </h1>
                    </div>
                    <button type="button" className="pf-cancel-btn" onClick={onClose}>Discard</button>
                </div>

                {error && <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
                        <div>
                            <div className="pf-card">
                                <p className="pf-card-title">General Information</p>
                                <div style={{ marginBottom: '18px' }}>
                                    <label className="pf-label">Product Name *</label>
                                    <input className="pf-input" type="text" name="name" required value={formData.name} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="pf-label">Description</label>
                                    <textarea className="pf-input" name="description" rows="6" value={formData.description} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="pf-card">
                                <p className="pf-card-title">Pricing & Identifiers</p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="pf-label">Base Price *</label>
                                        <div style={{ position: 'relative' }}>
                                            <span className="pf-price-prefix">$</span>
                                            <input className="pf-input" type="number" name="price" required min="0" step="0.01" value={formData.price} onChange={handleChange} style={{ paddingLeft: '28px' }} />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="pf-label">Barcode *</label>
                                        <input className="pf-input" type="text" name="barcode" required value={formData.barcode} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="pf-card">
                                <p className="pf-section-label">Organization</p>
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="pf-label">Category *</label>

                                    {/* MAPPING DANH SÁCH CATEGORY TỪ API */}
                                    <select className="pf-select" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                                        <option value="">Select category...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                                <label className="pf-label">Status *</label>
                                <select className="pf-select" name="status" value={formData.status} onChange={handleChange}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>

                            <div className="pf-card">
                                <p className="pf-section-label">Product Images</p>

                                <div className="pf-upload-area" onClick={() => fileInputRef.current.click()}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" style={{ margin: '0 auto 8px', display: 'block' }}>
                                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                                    </svg>
                                    <p style={{ fontSize: '13px', margin: '0', color: '#6366f1', fontWeight: 600 }}>Click to upload multiple images</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />

                                {(existingImages.length > 0 || newImages.length > 0) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px' }}>
                                        {existingImages.map((url, idx) => (
                                            <div key={`old-${idx}`} style={{ position: 'relative', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                                <img src={url} alt="old-img" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeExistingImage(url)} className="pf-remove-img-btn">×</button>
                                            </div>
                                        ))}

                                        {newImages.map((file, idx) => (
                                            <div key={`new-${idx}`} style={{ position: 'relative', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px dashed #a5b4fc' }}>
                                                <img src={URL.createObjectURL(file)} alt="new-img" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeNewImage(idx)} className="pf-remove-img-btn">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

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