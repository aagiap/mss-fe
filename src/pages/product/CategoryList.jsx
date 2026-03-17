import React, { useState, useEffect } from 'react';
import categoryApi from '../../api/category';
import CategoryFormModal from "../../components/product/CategoryFormModal.jsx";
import ToastNotification from "../../components/common/ToastNotification.jsx";
import useToast from "../../hooks/useToast.jsx";
import '../../assets/css/CategoryListStyle.css';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sortOrder, setSortOrder] = useState('A-Z');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const { toasts, removeToast, toast } = useToast();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Backend nhận: search, page, size
            const res = await categoryApi.getAll({
                page,
                size: 5,
                search: search || undefined
            });

            // Backend trả BaseResponse → res.data = Page<Category>
            // Category entity: { id, name, description, createdAt, updatedAt }
            if (res && res.data) {
                setCategories(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
                setTotalElements(res.data.totalElements || 0);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Không thể tải danh sách danh mục");
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 0) fetchCategories();
            else setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { fetchCategories(); }, [page]);

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            try {
                await categoryApi.delete(id);
                toast.success("Xóa danh mục thành công");
                fetchCategories();
            } catch (error) {
                // Backend throw "Không thể xóa danh mục đang có sản phẩm"
                const msg = error?.message || error?.error || "Xóa thất bại! Vui lòng kiểm tra lại.";
                toast.error(msg, "Không thể xóa");
            }
        }
    };

    const handleModalSuccess = (isEdit) => {
        if (isEdit) {
            toast.success("Cập nhật danh mục thành công");
        } else {
            toast.success("Thêm danh mục mới thành công");
        }
        fetchCategories();
    };

    // Category entity không có productCount, chỉ có: id, name, description, createdAt, updatedAt
    const categoryIcons = ['🛍️', '👗', '🛋️', '⚽', '💄', '📱', '🍔', '📚'];

    return (
        <div className="cl-page">
            {/* Toast */}
            <ToastNotification toasts={toasts} removeToast={removeToast} />

            {/* Page Header */}
            <div className="cl-page-header">
                <div>
                    <h1 className="cl-page-title">All Categories</h1>
                    <p className="cl-page-subtitle">Manage your product categories, sub-categories, and visibility.</p>
                </div>
                <button className="cl-add-btn" onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Category
                </button>
            </div>

            {/* Toolbar */}
            <div className="cl-toolbar">
                <span className="cl-showing-text">
                    Showing <strong>{categories.length}</strong> of <strong>{totalElements}</strong> categories
                </span>
            </div>

            {/* Main Card */}
            <div className="cl-card">
                {/* Search */}
                <div className="cl-search-bar">
                    <svg className="cl-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        className="cl-search-input"
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <table className="cl-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Thumbnail</th>
                        <th>Category Name</th>
                        <th>Description</th>
                        {/* ⚠️ Backend Category entity không có productCount
                                Bỏ cột Products hoặc fetch riêng nếu cần */}
                        <th className="th-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="cl-empty">Loading data...</td></tr>
                    ) : categories.length === 0 ? (
                        <tr><td colSpan="5" className="cl-empty">No categories found.</td></tr>
                    ) : (
                        categories.map((cat, idx) => (
                            <tr key={cat.id}>
                                <td>
                                        <span className="cl-id-badge">
                                            #CAT-{String(cat.id).padStart(3, '0')}
                                        </span>
                                </td>
                                <td>
                                    <div className="cl-thumbnail">
                                        {categoryIcons[idx % categoryIcons.length]}
                                    </div>
                                </td>
                                <td><span className="cl-cat-name">{cat.name}</span></td>
                                <td>
                                        <span className="cl-description">
                                            {cat.description || 'N/A'}
                                        </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        className="cl-action-btn edit"
                                        title="Edit"
                                        onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                    <button
                                        className="cl-action-btn delete"
                                        title="Delete"
                                        onClick={() => handleDelete(cat.id)}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                            <path d="M10 11v6M14 11v6"/>
                                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="cl-pagination">
                    <p className="cl-pagination-info">
                        Showing <span>{categories.length > 0 ? page * 5 + 1 : 0}</span> to{' '}
                        <span>{Math.min((page + 1) * 5, totalElements)}</span> of{' '}
                        <span>{totalElements}</span> results
                    </p>
                    {totalPages > 0 && (
                        <div className="cl-pagination-controls">
                            <button className="cl-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, idx) => (
                                <button key={idx}
                                        className={`cl-page-btn ${page === idx ? 'active' : ''}`}
                                        onClick={() => setPage(idx)}>
                                    {idx + 1}
                                </button>
                            ))}
                            <button className="cl-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <CategoryFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => handleModalSuccess(!!editingCategory)}
                editData={editingCategory}
            />
        </div>
    );
};

export default CategoryList;