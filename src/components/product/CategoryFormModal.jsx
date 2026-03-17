import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import categoryApi from '../../api/category';
import '../../assets/css/CategoryFormModalStyle.css';

const ICONS = ['🔧', '⚙️', '🚶', '🛍️', '👗', '📱', '🍔', '📚'];

const CategoryFormModal = ({ isOpen, onClose, onSuccess, editData }) => {
    const initialFormState = { name: '', description: '' };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedIcon, setSelectedIcon] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || ''
            });
        } else {
            setFormData(initialFormState);
            setSelectedIcon(0);
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

        // Build đúng CategoryRequest cho backend: { name, description }
        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
        };

        try {
            if (editData) {
                await categoryApi.update(editData.id, payload);
            } else {
                await categoryApi.create(payload);
            }
            onSuccess(); // CategoryList sẽ show toast + refetch
            onClose();
        } catch (err) {
            // Hiển thị lỗi từ backend (ví dụ: tên bị trùng, validation...)
            const msg = err?.message || err?.error || "Có lỗi xảy ra, vui lòng kiểm tra lại!";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="cf-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="cf-modal" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="cf-header">
                    <h3 className="cf-title">{editData ? 'Edit Category' : 'Add New Category'}</h3>
                    <button className="cf-close-btn" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="cf-body">
                    {/* Lỗi từ backend hiển thị trong modal */}
                    {error && <div className="cf-error">{error}</div>}

                    <form id="cf-form" onSubmit={handleSubmit}>
                        {/* Category Name */}
                        <div className="cf-field">
                            <label className="cf-label">
                                Category Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                className="cf-input"
                                type="text"
                                name="name"
                                required
                                placeholder="e.g., Sports Equipment"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Description */}
                        <div className="cf-field">
                            <label className="cf-label">Description</label>
                            <textarea
                                className="cf-input cf-textarea"
                                name="description"
                                placeholder="Items used for sports and exercise, including gear, apparel, and footwear."
                                value={formData.description}
                                onChange={handleChange}
                                maxLength={200}
                            />
                            <p className="cf-char-count">{formData.description.length}/200 characters</p>
                        </div>

                        {/* Icon Picker — chỉ UI, backend Category không lưu icon */}
                        <div className="cf-field cf-icon-section">
                            <label className="cf-label">Icon <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(display only)</span></label>
                            <div className="cf-icon-grid">
                                {ICONS.map((icon, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`cf-icon-btn ${selectedIcon === idx ? 'selected' : ''}`}
                                        onClick={() => setSelectedIcon(idx)}
                                    >
                                        {icon}
                                    </button>
                                ))}
                                <button type="button" className="cf-icon-btn add">+</button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="cf-footer">
                    <button type="button" className="cf-cancel-btn" onClick={onClose}>Cancel</button>
                    <button type="submit" form="cf-form" className="cf-submit-btn" disabled={loading}>
                        {loading && (
                            <svg style={{ animation: 'cf-spin 0.8s linear infinite', width: 15, height: 15 }} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" strokeDasharray="30 70" strokeLinecap="round"/>
                            </svg>
                        )}
                        {editData ? 'Save Changes' : 'Add Category'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CategoryFormModal;