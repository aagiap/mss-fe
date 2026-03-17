import React, { useState, useEffect } from 'react';
import product from "../../api/product.jsx";
import ProductFormModal from "../../components/product/ProductFormModal.jsx";
import ToastNotification from "../../components/common/ToastNotification.jsx";
import useToast from "../../hooks/useToast";
import '../../assets/css/ProductListStyle.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const { toasts, removeToast, toast } = useToast();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await product.getAll({ page, size: 10, search: search || undefined });
            if (res && res.data) {
                setProducts(res.data.content || []);
                setTotalPages(res.data.totalPages || 0);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Không thể tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, [page]);

    const handleSearch = () => {
        if (page === 0) fetchProducts();
        else setPage(0);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            try {
                await product.delete(id);
                toast.success("Sản phẩm đã được xóa thành công");
                fetchProducts();
            } catch (error) {
                toast.error(error.message || "Xóa sản phẩm thất bại");
            }
        }
    };

    // Callback sau khi modal create/update thành công
    const handleModalSuccess = (isEdit) => {
        if (isEdit) {
            toast.success("Cập nhật sản phẩm thành công");
        } else {
            toast.success("Thêm sản phẩm mới thành công");
        }
        fetchProducts();
    };

    const filteredProducts = products.filter(p =>
        statusFilter ? p.status === statusFilter : true
    );

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '—';
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? price : `$${num.toFixed(2)}`;
    };

    return (
        <div style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            padding: '32px', background: '#f8f9fc', minHeight: '100vh', color: '#1a1a2e'
        }}>
            {/* Toast */}
            <ToastNotification toasts={toasts} removeToast={removeToast} />

            <div className="pi-container">
                {/* Header */}
                <div className="pi-header">
                    <h1 className="pi-title">Product Inventory</h1>
                    <button className="pi-create-btn" onClick={() => { setEditData(null); setIsModalOpen(true); }}>
                        Create Product
                    </button>
                </div>

                {/* Search */}
                <div className="pi-search-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        className="pi-search-input" type="text"
                        placeholder="Search products by name or barcode"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                {/* Filters */}
                <div className="pi-filters">
                    <div style={{ position: 'relative' }}>
                        <button
                            className={`pi-filter-btn ${statusFilter ? 'active' : ''}`}
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                        >
                            Status {statusFilter ? `· ${statusFilter === 'ACTIVE' ? 'In Stock' : 'Out of Stock'}` : ''}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                        {showStatusMenu && (
                            <div className="pi-dropdown">
                                <div className={`pi-dropdown-item ${!statusFilter ? 'selected' : ''}`}
                                     onClick={() => { setStatusFilter(''); setShowStatusMenu(false); }}>Tất cả</div>
                                <div className={`pi-dropdown-item ${statusFilter === 'ACTIVE' ? 'selected' : ''}`}
                                     onClick={() => { setStatusFilter('ACTIVE'); setShowStatusMenu(false); }}>In Stock</div>
                                <div className={`pi-dropdown-item ${statusFilter === 'INACTIVE' ? 'selected' : ''}`}
                                     onClick={() => { setStatusFilter('INACTIVE'); setShowStatusMenu(false); }}>Out of Stock</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Đang tải dữ liệu...</p>
                ) : (
                    <div className="pi-table-wrapper">
                        <table className="pi-table">
                            <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Barcode</th>
                                <th>Price</th>
                                <th>Category ID</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="pi-empty">Không tìm thấy kết quả nào</td></tr>
                            ) : (
                                filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td style={{ color: '#6b7280', fontSize: '13px' }}>{p.barcode || '—'}</td>
                                        <td className="pi-price">{formatPrice(p.price)}</td>
                                        <td className="pi-category">{p.categoryId ? `#${p.categoryId}` : '—'}</td>
                                        <td>
                                                <span className={`pi-badge ${p.status !== 'ACTIVE' ? 'out' : ''}`}>
                                                    {p.status === 'ACTIVE' ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                        </td>
                                        <td>
                                            <button className="pi-action-btn"
                                                    onClick={() => { setEditData(p); setIsModalOpen(true); }}>Edit</button>
                                            <span className="pi-action-sep">,</span>
                                            <button className="pi-action-btn"
                                                    onClick={() => handleDelete(p.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="pi-pagination">
                        <button className="pi-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Trước</button>
                        <span className="pi-page-info">Trang {page + 1} / {totalPages}</span>
                        <button className="pi-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Sau →</button>
                    </div>
                )}
            </div>

            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                // Truyền isEdit để biết là create hay update
                onSuccess={() => handleModalSuccess(!!editData)}
                editData={editData}
            />
        </div>
    );
};

export default ProductList;