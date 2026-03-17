import React, { useState, useEffect } from 'react';
import attributeApi from '../../api/attribute';
import productApi from '../../api/product';
import ToastNotification from "../../components/common/ToastNotification.jsx";
import useToast from "../../hooks/useToast.jsx";
import '../../assets/css/AttributeListStyle.css';

const VALUE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#111827', '#8b5cf6', '#f97316', '#06b6d4'];

const AttributeList = () => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Danh sách products cho dropdown
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // { id, name }

    // Form state
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrValues, setNewAttrValues] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Edit state
    const [editingAttr, setEditingAttr] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [editProductId, setEditProductId] = useState('');

    const { toasts, removeToast, toast } = useToast();

    // ── Fetch products cho dropdown ──
    const fetchProducts = async (search = '') => {
        setProductsLoading(true);
        try {
            const res = await productApi.getAll({
                page: 0,
                size: 50,
                search: search || undefined
            });
            if (res && res.data) {
                setProducts(res.data.content || []);
            }
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setProductsLoading(false);
        }
    };

    // Debounce search trong dropdown
    useEffect(() => {
        const timer = setTimeout(() => {
            if (showProductDropdown) fetchProducts(productSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [productSearch, showProductDropdown]);

    // Mở dropdown thì fetch luôn
    const handleOpenProductDropdown = () => {
        setShowProductDropdown(true);
        fetchProducts(productSearch);
    };

    const handleSelectProduct = (p) => {
        setSelectedProduct(p);
        setProductSearch('');
        setShowProductDropdown(false);
        setFormError('');
    };

    // ── Fetch attributes ──
    const fetchAttributes = async () => {
        setLoading(true);
        try {
            const res = await attributeApi.getAll({ page, size: 10 });
            if (res && res.data) {
                setAttributes(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
                setTotalElements(res.data.totalElements || 0);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách thuộc tính");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAttributes(); }, [page]);

    // ── Tag input ──
    const handleTagKeyDown = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const val = tagInput.trim().replace(/,$/, '');
            if (val && !newAttrValues.includes(val)) {
                setNewAttrValues(prev => [...prev, val]);
            }
            setTagInput('');
        }
        if (e.key === 'Backspace' && !tagInput && newAttrValues.length > 0) {
            setNewAttrValues(prev => prev.slice(0, -1));
        }
    };

    const removeTag = (tag) => setNewAttrValues(prev => prev.filter(v => v !== tag));

    // ── Save ──
    const handleSave = async () => {
        setFormError('');
        if (!selectedProduct) { setFormError('Vui lòng chọn sản phẩm'); return; }
        if (!newAttrName.trim()) { setFormError('Vui lòng nhập Attribute Name'); return; }
        if (newAttrValues.length === 0) { setFormError('Vui lòng thêm ít nhất 1 giá trị'); return; }

        setSaving(true);
        let successCount = 0;
        let firstError = null;

        for (const val of newAttrValues) {
            try {
                await attributeApi.create({
                    productId: selectedProduct.id,
                    attributeName: newAttrName.trim(),
                    attributeValue: val,
                });
                successCount++;
            } catch (err) {
                if (!firstError) firstError = err?.message || err?.error || 'Lưu thất bại';
            }
        }

        setSaving(false);

        if (successCount > 0) {
            toast.success(`Đã thêm ${successCount} giá trị cho "${newAttrName.trim()}" — ${selectedProduct.name}`);
            setSelectedProduct(null);
            setNewAttrName('');
            setNewAttrValues([]);
            setTagInput('');
            fetchAttributes();
        }
        if (firstError) toast.error(firstError, 'Một số giá trị không thể lưu');
    };

    // ── Delete ──
    const handleDelete = async (id) => {
        if (window.confirm("Xóa record thuộc tính này?")) {
            try {
                await attributeApi.delete(id);
                toast.success("Đã xóa thuộc tính thành công");
                fetchAttributes();
            } catch (error) {
                toast.error(error?.message || "Xóa thất bại!", "Không thể xóa");
            }
        }
    };

    // ── Edit inline ──
    const startEdit = (attr) => {
        setEditingAttr(attr);
        setEditValue(attr.attributeValue);
        setEditProductId(String(attr.productId));
    };
    const cancelEdit = () => { setEditingAttr(null); setEditValue(''); };

    const handleUpdate = async (rec) => {
        if (!editValue.trim()) { toast.warning("Giá trị không được để trống"); return; }
        try {
            await attributeApi.update(rec.id, {
                productId: rec.productId,
                attributeName: rec.attributeName,
                attributeValue: editValue.trim(),
            });
            toast.success("Cập nhật thuộc tính thành công");
            setEditingAttr(null);
            fetchAttributes();
        } catch (err) {
            toast.error(err?.message || "Cập nhật thất bại");
        }
    };

    // Group by attributeName
    const grouped = attributes.reduce((acc, attr) => {
        const key = attr.attributeName;
        if (!acc[key]) acc[key] = { attributeName: key, records: [] };
        acc[key].records.push({ id: attr.id, productId: attr.productId, attributeValue: attr.attributeValue, attributeName: attr.attributeName });
        return acc;
    }, {});
    const groupedList = Object.values(grouped);

    const attrIcons = [
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg>,
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    ];

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('.al-product-select-wrapper')) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="al-page">
            <ToastNotification toasts={toasts} removeToast={removeToast} />

            {/* Page Header */}
            <div className="al-page-header">
                <div>
                    <h1 className="al-page-title">Product Attributes</h1>
                    <p className="al-page-subtitle">Define and manage characteristics like Size, Color, and Material.</p>
                </div>
                <button className="al-export-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Export Data
                </button>
            </div>

            {/* Add New Attribute Card */}
            <div className="al-add-card">
                <p className="al-add-card-title">
                    <span className="al-add-card-title-icon">+</span>
                    Add New Attribute
                </p>

                {formError && (
                    <div style={{
                        marginBottom: '14px', padding: '10px 14px',
                        background: '#fef2f2', border: '1.5px solid #fecaca',
                        borderRadius: '8px', color: '#dc2626', fontSize: '13px'
                    }}>
                        {formError}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '220px 200px 1fr auto', gap: '16px', alignItems: 'flex-start' }}>

                    {/* ── Product Selector ── */}
                    <div>
                        <label className="al-field-label">
                            Product <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="al-product-select-wrapper" style={{ position: 'relative' }}>
                            {/* Trigger button */}
                            <div
                                onClick={handleOpenProductDropdown}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    border: `1.5px solid ${showProductDropdown ? '#6366f1' : selectedProduct ? '#6366f1' : '#e5e7eb'}`,
                                    borderRadius: '8px', padding: '9px 12px', cursor: 'pointer',
                                    background: '#fff', minHeight: '42px',
                                    boxShadow: showProductDropdown ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {selectedProduct ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            width: '22px', height: '22px', borderRadius: '6px',
                                            background: '#eef2ff', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                                                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                                            </svg>
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {selectedProduct.name}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>ID: {selectedProduct.id}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '13.5px', color: '#9ca3af' }}>Select a product...</span>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
                                    {selectedProduct && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); }}
                                            style={{ fontSize: '16px', color: '#9ca3af', lineHeight: 1, cursor: 'pointer', padding: '0 2px' }}
                                        >×</span>
                                    )}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"
                                         style={{ transform: showProductDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </div>
                            </div>

                            {/* Dropdown panel */}
                            {showProductDropdown && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                                    background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 500, overflow: 'hidden',
                                }}>
                                    {/* Search input */}
                                    <div style={{ padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                                                 width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
                                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                            </svg>
                                            <input
                                                autoFocus
                                                style={{
                                                    width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '7px',
                                                    padding: '7px 10px 7px 30px', fontSize: '13px', outline: 'none',
                                                    fontFamily: 'Inter', boxSizing: 'border-box',
                                                    transition: 'border-color 0.15s'
                                                }}
                                                placeholder="Search by name or barcode..."
                                                value={productSearch}
                                                onChange={e => setProductSearch(e.target.value)}
                                                onFocus={e => e.target.style.borderColor = '#6366f1'}
                                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                            />
                                        </div>
                                    </div>

                                    {/* Product list */}
                                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                        {productsLoading ? (
                                            <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                                                Loading...
                                            </div>
                                        ) : products.length === 0 ? (
                                            <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
                                                No products found
                                            </div>
                                        ) : (
                                            products.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleSelectProduct(p)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '10px 14px', cursor: 'pointer',
                                                        background: selectedProduct?.id === p.id ? '#eef2ff' : 'transparent',
                                                        borderBottom: '1px solid #f9fafb',
                                                        transition: 'background 0.1s',
                                                    }}
                                                    onMouseEnter={e => { if (selectedProduct?.id !== p.id) e.currentTarget.style.background = '#f9fafb'; }}
                                                    onMouseLeave={e => { if (selectedProduct?.id !== p.id) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    {/* Product avatar */}
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        background: '#f3f4f6', border: '1px solid #e5e7eb',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0, fontSize: '14px'
                                                    }}>
                                                        📦
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {p.name}
                                                        </div>
                                                        <div style={{ fontSize: '11.5px', color: '#9ca3af', display: 'flex', gap: '8px' }}>
                                                            <span>ID: {p.id}</span>
                                                            {p.barcode && <span>· {p.barcode}</span>}
                                                        </div>
                                                    </div>
                                                    {selectedProduct?.id === p.id && (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round">
                                                            <polyline points="20 6 9 17 4 12"/>
                                                        </svg>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="al-field-hint">Select the product to attach to.</p>
                    </div>

                    {/* Attribute Name */}
                    <div>
                        <label className="al-field-label">
                            Attribute Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            className="al-input"
                            type="text"
                            placeholder="e.g. Color"
                            value={newAttrName}
                            onChange={e => { setNewAttrName(e.target.value); setFormError(''); }}
                        />
                        <p className="al-field-hint">The public name of the attribute.</p>
                    </div>

                    {/* Values Tag Input */}
                    <div>
                        <label className="al-field-label">
                            Values <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div className="al-tag-input-wrapper" onClick={() => document.getElementById('al-tag-input').focus()}>
                            {newAttrValues.map(tag => (
                                <span key={tag} className="al-tag">
                                    {tag}
                                    <button type="button" className="al-tag-remove" onClick={() => removeTag(tag)}>×</button>
                                </span>
                            ))}
                            <input
                                id="al-tag-input"
                                className="al-tag-input"
                                placeholder="Type & press Enter"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                            />
                        </div>
                        <p className="al-field-hint">Press enter to add a new value.</p>
                    </div>

                    {/* Save */}
                    <div>
                        <label className="al-field-label" style={{ visibility: 'hidden' }}>_</label>
                        <button className="al-save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Existing Attributes */}
            <h2 className="al-existing-title">Existing Attributes</h2>

            {loading ? (
                <div className="al-empty">Loading data...</div>
            ) : groupedList.length === 0 ? (
                <div className="al-empty">No attributes found.</div>
            ) : (
                <div className="al-attr-card">
                    {groupedList.map((group, idx) => (
                        <div key={group.attributeName} className="al-attr-row">
                            <div className="al-attr-icon">{attrIcons[idx % attrIcons.length]}</div>
                            <div>
                                <div className="al-attr-name">{group.attributeName}</div>
                                <div className="al-attr-count">{group.records.length} value{group.records.length !== 1 ? 's' : ''}</div>
                            </div>
                            <div className="al-attr-values" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                {group.records.map((rec, vi) => (
                                    <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {editingAttr?.id === rec.id ? (
                                            <>
                                                <input
                                                    style={{ border: '1.5px solid #6366f1', borderRadius: '6px', padding: '4px 10px', fontSize: '13px', outline: 'none', fontFamily: 'Inter', width: '140px' }}
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(rec); if (e.key === 'Escape') cancelEdit(); }}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdate(rec)}
                                                        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>✓</button>
                                                <button onClick={cancelEdit}
                                                        style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="al-value-pill">
                                                    <span className="al-value-dot" style={{ background: VALUE_COLORS[vi % VALUE_COLORS.length] }} />
                                                    {rec.attributeValue}
                                                    <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '4px' }}>(P#{rec.productId})</span>
                                                </span>
                                                <button className="al-action-btn edit" style={{ width: '24px', height: '24px' }}
                                                        onClick={() => startEdit(rec)}>
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                    </svg>
                                                </button>
                                                <button className="al-action-btn delete" style={{ width: '24px', height: '24px' }}
                                                        onClick={() => handleDelete(rec.id)}>
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <polyline points="3 6 5 6 21 6"/>
                                                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                                        <path d="M10 11v6M14 11v6"/>
                                                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 0 && (
                <div className="al-pagination">
                    <p className="al-pagination-info">
                        Showing <span>{attributes.length > 0 ? page * 10 + 1 : 0}</span> to <span>{Math.min((page + 1) * 10, totalElements)}</span> of <span>{totalElements}</span> entries
                    </p>
                    <div className="al-pagination-controls">
                        <button className="al-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
                        {[...Array(totalPages)].map((_, idx) => (
                            <button key={idx} className={`al-page-btn ${page === idx ? 'active' : ''}`} onClick={() => setPage(idx)}>{idx + 1}</button>
                        ))}
                        <button className="al-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttributeList;