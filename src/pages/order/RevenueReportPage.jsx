import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getUser } from "../../api/auth.jsx";
import { getRevenue } from "../../api/orderApi.jsx";
import api from "../../api/api.jsx";
import OrderNavbar from "./OrderNavbar.jsx";

// Helper functions
const formatCurrency = (val) => `${Number(val).toLocaleString()} đ`;
const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: "#fff", border: "1px solid #e5e5e5",
                borderRadius: 8, padding: "10px 14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 13
            }}>
                <p style={{ margin: 0, fontWeight: 700, marginBottom: 4 }}>{label}</p>
                <p style={{ margin: 0, color: "#4f46e5" }}>
                    Doanh thu: {formatCurrency(payload[0]?.value || 0)}
                </p>
                <p style={{ margin: 0, color: "#888" }}>
                    Đơn hàng: {payload[0]?.payload?.orderCount || 0}
                </p>
            </div>
        );
    }
    return null;
};

export default function RevenueReportPage() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [stores, setStores] = useState([]);

    // Cấu hình ngày mặc định
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(firstOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [storeId, setStoreId] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    // Hàm lấy doanh thu (dùng useCallback để tránh re-render thừa)
    const handleGetRevenue = useCallback(async (currentStoreId = storeId) => {
        if (!startDate || !endDate) {
            setError("Vui lòng chọn đầy đủ từ ngày và đến ngày.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const params = { startDate, endDate };
            // Chỉ gửi storeId nếu nó có giá trị (không phải "Tất cả")
            if (currentStoreId) params.storeId = currentStoreId;

            const result = await getRevenue(params);
            setData(result);
        } catch (e) {
            setError(e.response?.data?.message || "Không tìm thấy dữ liệu trong khoảng thời gian này.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, storeId]);

    // Khởi tạo dữ liệu người dùng và danh sách cửa hàng
    useEffect(() => {
        const initData = async () => {
            try {
                // 1. Lấy thông tin User
                const user = await getUser();
                setCurrentUser(user);

                let initialStoreId = "";
                if (user?.role === "ROLE_CASHIER") {
                    initialStoreId = String(user.storeId);
                    setStoreId(initialStoreId);
                }

                // 2. Lấy danh sách Store (Chỉ ADMIN/MANAGER mới thực sự cần nhưng lấy luôn cho chắc)
                const res = await api.get("/auth/stores");
                setStores(res.data?.data || []);

                // 3. Tự động load dữ liệu lần đầu
                handleGetRevenue(initialStoreId);
            } catch (err) {
                console.error("Init failed:", err);
            }
        };
        initData();
    }, [handleGetRevenue]);

    const isCashier = currentUser?.role === "ROLE_CASHIER";
    const canSelectStore = currentUser?.role === "ROLE_MANAGER" || currentUser?.role === "ROLE_ADMIN";

    const getBarColor = (value, max) => {
        const ratio = max > 0 ? value / max : 0;
        if (ratio > 0.7) return "#4f46e5";
        if (ratio > 0.3) return "#818cf8";
        return "#c7d2fe";
    };

    const maxRevenue = data?.dailyRevenue?.length
        ? Math.max(...data.dailyRevenue.map(d => Number(d.revenue)))
        : 0;

    const inputStyle = {
        width: "100%", padding: "6px 12px",
        border: "1px solid #dee2e6", borderRadius: 6,
        fontSize: 14, height: 38, outline: "none"
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
            <OrderNavbar currentUser={currentUser} activePage="Revenue" onLogout={() => navigate("/logout")} />

            <Container fluid className="py-4 px-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Báo Cáo Doanh Thu</h5>
                    {currentUser && (
                        <span className="badge bg-light text-dark border">
                            Quyền: {currentUser.role}
                        </span>
                    )}
                </div>

                {/* Bộ lọc */}
                <div style={{
                    background: "#fff", borderRadius: 12,
                    border: "1px solid #eee", padding: "20px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    marginBottom: 24
                }}>
                    <Row className="align-items-end g-3">
                        <Col lg={3} md={6}>
                            <Form.Label style={{ fontSize: 13, fontWeight: 600 }}>Từ ngày</Form.Label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                style={inputStyle}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <Form.Label style={{ fontSize: 13, fontWeight: 600 }}>Đến ngày</Form.Label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                style={inputStyle}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <Form.Label style={{ fontSize: 13, fontWeight: 600 }}>Cửa hàng</Form.Label>
                            <Form.Select
                                value={storeId}
                                onChange={e => setStoreId(e.target.value)}
                                disabled={isCashier}
                                style={{ height: 38, fontSize: 14, borderRadius: 6 }}
                            >
                                {canSelectStore && <option value="">--- Tất cả cửa hàng ---</option>}
                                {stores.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col lg={3} md={6}>
                            <Button
                                variant="dark"
                                style={{ width: "100%", fontWeight: 600, height: 38, borderRadius: 6 }}
                                onClick={() => handleGetRevenue()}
                                disabled={loading}
                            >
                                {loading ? <Spinner size="sm" className="me-2" /> : "Xem báo cáo"}
                            </Button>
                        </Col>
                    </Row>
                </div>

                {error && <Alert variant="danger" className="py-2" style={{ borderRadius: 8 }}>{error}</Alert>}

                {data && (
                    <>
                        {/* Thẻ tóm tắt */}
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "24px" }}>
                                    <div style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Tổng đơn hàng</div>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: "#111" }}>{data.totalOrders}</div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div style={{ background: "#4f46e5", borderRadius: 12, padding: "24px", color: "#fff" }}>
                                    <div style={{ fontSize: 13, color: "#c7d2fe", fontWeight: 500 }}>Tổng doanh thu</div>
                                    <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(data.totalRevenue)}</div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "24px" }}>
                                    <div style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Trung bình/Đơn</div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>
                                        {data.totalOrders > 0 ? formatCurrency(Math.round(data.totalRevenue / data.totalOrders)) : "0 đ"}
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Biểu đồ */}
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "24px", marginBottom: 24 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Doanh thu theo ngày</div>
                            <div style={{ width: "100%", height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart
                                        data={data.dailyRevenue.map(d => ({
                                            ...d,
                                            revenue: Number(d.revenue),
                                            name: formatShortDate(d.date)
                                        }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "#999" }}
                                            axisLine={false} tickLine={false}
                                            tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8f9ff" }} />
                                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                                            {data.dailyRevenue.map((entry, index) => (
                                                <Cell key={index} fill={getBarColor(Number(entry.revenue), maxRevenue)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bảng chi tiết */}
                        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
                            <div style={{ padding: "16px 20px", fontWeight: 700, background: "#fafafa", borderBottom: "1px solid #eee" }}>
                                Chi tiết theo ngày
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                <tr style={{ background: "#fcfcfc", borderBottom: "1px solid #eee" }}>
                                    <th style={{ padding: "12px 20px", fontSize: 13, color: "#666" }}>Ngày</th>
                                    <th style={{ padding: "12px 20px", fontSize: 13, color: "#666", textAlign: "center" }}>Số đơn</th>
                                    <th style={{ padding: "12px 20px", fontSize: 13, color: "#666", textAlign: "right" }}>Doanh thu</th>
                                </tr>
                                </thead>
                                <tbody>
                                {data.dailyRevenue.filter(d => d.orderCount > 0).reverse().map((d, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
                                        <td style={{ padding: "12px 20px", fontSize: 14 }}>{d.date}</td>
                                        <td style={{ padding: "12px 20px", fontSize: 14, textAlign: "center" }}>{d.orderCount}</td>
                                        <td style={{ padding: "12px 20px", fontSize: 14, textAlign: "right", fontWeight: 600 }}>{formatCurrency(d.revenue)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
}