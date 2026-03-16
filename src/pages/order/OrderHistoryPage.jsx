import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Table, Badge, Spinner } from "react-bootstrap";
import { getUser } from "../../api/auth.jsx";
import { searchOrders, getCustomerById } from "../../api/orderApi.jsx";
import api from "../../api/api";
import OrderNavbar from "./OrderNavbar.jsx";

const STATUS_OPTIONS = ["ALL STATUS", "NEW", "HOLD", "SUCCESSFUL", "CANCELLED"];

const STATUS_BADGE = {
    NEW: "primary",
    HOLD: "warning",
    SUCCESSFUL: "success",
    CANCELLED: "danger"
};

const DEFAULT_FILTERS = {
    orderId: "",
    customerPhone: "",
    status: "",
    storeId: "",
    dateFrom: "",
    dateTo: "",
    page: 0,
    size: 10
};

export default function OrderHistoryPage() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [stores, setStores] = useState([]);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [applied, setApplied] = useState(DEFAULT_FILTERS);
    const [orders, setOrders] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [customerNames, setCustomerNames] = useState({});
    useEffect(() => {
        getUser().then(setCurrentUser);
        // Load store list cho dropdown
        api.get("/auth/stores").then(res => {
            setStores(res.data?.data || []);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        fetchOrders(applied);
    }, [applied]);

    const fetchOrders = async (params) => {
        setLoading(true);
        setError("");
        try {
            const query = {};
            if (params.orderId) query.orderId = params.orderId;
            if (params.customerPhone) query.customerPhone = params.customerPhone;
            if (params.status) query.status = params.status;
            if (params.storeId) query.storeId = params.storeId;
            if (params.dateFrom) query.dateFrom = params.dateFrom;
            if (params.dateTo) query.dateTo = params.dateTo;
            query.page = params.page;
            query.size = params.size;

            const result = await searchOrders(query);
            const content = result?.content || [];
            setOrders(content);
            setTotalPages(result?.totalPages || 0);
            setTotalElements(result?.totalElements || 0);

            // Fetch customer names
            const uniqueIds = [...new Set(content.map(o => o.customerId).filter(Boolean))];
            const nameMap = {};
            await Promise.allSettled(
                uniqueIds.map(async (id) => {
                    try {
                        const customer = await getCustomerById(id);
                        nameMap[id] = customer?.name || `#${id}`;
                    } catch {
                        nameMap[id] = `#${id}`;
                    }
                })
            );
            setCustomerNames(nameMap);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load orders.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        setApplied({ ...filters, page: 0 });
    };

    const handleClear = () => {
        setFilters(DEFAULT_FILTERS);
        setApplied(DEFAULT_FILTERS);
    };

    const handlePageChange = (newPage) => {
        const updated = { ...applied, page: newPage };
        setApplied(updated);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            {/* Navbar */}
            <OrderNavbar currentUser={currentUser} activePage="Order History" onLogout={() => navigate("/logout")} />

            <Container fluid className="py-3 px-4">
                {/* Filter Bar */}
                <div style={{
                    background: "#e8e8e8", borderRadius: 8,
                    padding: "16px 20px", marginBottom: 20
                }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                        {/* Order ID */}
                        <div style={{ minWidth: 120 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Search Order</div>
                            <Form.Control
                                size="sm"
                                placeholder="Order ID"
                                value={filters.orderId}
                                onChange={e => setFilters({ ...filters, orderId: e.target.value })}
                                style={{ background: "#fff" }}
                            />
                        </div>

                        {/* Status */}
                        <div style={{ minWidth: 140 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</div>
                            <Form.Select
                                size="sm"
                                value={filters.status}
                                onChange={e => setFilters({ ...filters, status: e.target.value === "ALL STATUS" ? "" : e.target.value })}
                                style={{ background: "#fff" }}
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s === "ALL STATUS" ? "" : s}>{s}</option>
                                ))}
                            </Form.Select>
                        </div>

                        {/* Store */}
                        <div style={{ minWidth: 140 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Store</div>
                            <Form.Select
                                size="sm"
                                value={filters.storeId}
                                onChange={e => setFilters({ ...filters, storeId: e.target.value })}
                                style={{ background: "#fff" }}
                            >
                                <option value="">Store</option>
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </Form.Select>
                        </div>

                        {/* Date From */}
                        <div style={{ minWidth: 140 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Date From</div>
                            <Form.Control
                                size="sm"
                                type="date"
                                value={filters.dateFrom}
                                onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                                style={{ background: "#fff" }}
                            />
                        </div>

                        {/* Date To */}
                        <div style={{ minWidth: 140 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Date To</div>
                            <Form.Control
                                size="sm"
                                type="date"
                                value={filters.dateTo}
                                onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                                style={{ background: "#fff" }}
                            />
                        </div>

                        {/* Customer Phone */}
                        <div style={{ minWidth: 140 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Customer Phone</div>
                            <Form.Control
                                size="sm"
                                placeholder="(+84)"
                                value={filters.customerPhone}
                                onChange={e => setFilters({ ...filters, customerPhone: e.target.value })}
                                style={{ background: "#fff" }}
                            />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                            <Button size="sm" variant="secondary" onClick={handleClear}>Clear</Button>
                            <Button size="sm" variant="dark" onClick={handleApply}>Apply</Button>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ color: "#dc3545", marginBottom: 12, fontSize: 13 }}>{error}</div>
                )}

                {/* Table */}
                <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e5e5" }}>
                    <Table hover style={{ margin: 0, fontSize: 14 }}>
                        <thead style={{ background: "#f8f9fa" }}>
                        <tr>
                            <th style={{ padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #dee2e6" }}>Order ID</th>
                            <th style={{ padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #dee2e6" }}>Customer</th>
                            <th style={{ padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #dee2e6" }}>Status</th>
                            <th style={{ padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #dee2e6" }}>Store</th>
                            <th style={{ padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #dee2e6" }}>Date</th>
                            <th style={{ padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #dee2e6" }}>Total Amount</th>
                            <th style={{ padding: "12px 16px", fontWeight: 600, borderBottom: "2px solid #dee2e6" }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 32 }}>
                                    <Spinner size="sm" className="me-2" />Loading...
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>#{order.id}</td>
                                    <td style={{ padding: "10px 16px", color: "#666" }}>
                                        {order.customerId
                                            ? customerNames[order.customerId] || <Spinner size="sm" />
                                            : "-"}
                                    </td>
                                    <td style={{ padding: "10px 16px" }}>
                                        <Badge bg={STATUS_BADGE[order.status] || "secondary"}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td style={{ padding: "10px 16px", color: "#666" }}>
                                        {stores.find(s => s.id === order.storeId)?.name || `#${order.storeId}`}
                                    </td>
                                    <td style={{ padding: "10px 16px", color: "#666" }}>
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                                        {Number(order.totalAmount).toLocaleString()} đ
                                    </td>
                                    <td style={{ padding: "10px 16px" }}>
                                            <span
                                                style={{ color: "#0d6efd", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                                                onClick={() => navigate(`/orders/${order.id}/detail`)}
                                            >
                                                View Details
                                            </span>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
                        <button
                            onClick={() => handlePageChange(applied.page - 1)}
                            disabled={applied.page === 0}
                            style={{
                                width: 40, height: 40, borderRadius: "50%",
                                background: applied.page === 0 ? "#e0e0e0" : "#333",
                                color: applied.page === 0 ? "#999" : "#fff",
                                border: "none", cursor: applied.page === 0 ? "default" : "pointer",
                                fontWeight: 700, fontSize: 16
                            }}
                        >‹</button>

                        <div style={{
                            background: "#333", color: "#fff",
                            borderRadius: 20, padding: "8px 20px",
                            fontSize: 13, fontWeight: 600
                        }}>
                            {applied.page + 1} / {totalPages}
                        </div>

                        <button
                            onClick={() => handlePageChange(applied.page + 1)}
                            disabled={applied.page >= totalPages - 1}
                            style={{
                                width: 40, height: 40, borderRadius: "50%",
                                background: applied.page >= totalPages - 1 ? "#e0e0e0" : "#333",
                                color: applied.page >= totalPages - 1 ? "#999" : "#fff",
                                border: "none", cursor: applied.page >= totalPages - 1 ? "default" : "pointer",
                                fontWeight: 700, fontSize: 16
                            }}
                        >›</button>
                    </div>
                )}

                {/* Total count */}
                {totalElements > 0 && (
                    <div style={{ textAlign: "center", color: "#888", fontSize: 12, marginTop: 8 }}>
                        {totalElements} order{totalElements > 1 ? "s" : ""} found
                    </div>
                )}
            </Container>
        </div>
    );
}