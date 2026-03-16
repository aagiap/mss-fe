import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Table, Badge, Button, Spinner, Modal } from "react-bootstrap";
import { getUser } from "../../api/auth";
import { getOrderDetail, cancelOrder } from "../../api/orderApi";
import api from "../../api/api";
import OrderNavbar from "./OrderNavbar.jsx";

const STATUS_BADGE = {
    NEW: "primary",
    HOLD: "warning",
    SUCCESSFUL: "success",
    CANCELLED: "danger"
};

export default function OrderDetailPage() {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [currentUser, setCurrentUser] = useState(null);
    const [order, setOrder] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Cancel modal
    const [showCancel, setShowCancel] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    useEffect(() => {
        getUser().then(setCurrentUser);
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        setLoading(true);
        setError("");
        try {
            const result = await getOrderDetail(orderId);
            setOrder(result);

            // Load payment info nếu order đã SUCCESSFUL
            if (result.status === "SUCCESSFUL") {
                try {
                    const payRes = await api.get(`/order/payment/${orderId}`);
                    setPayment(payRes.data?.data);
                } catch {
                    // payment not available
                }
            }
        } catch (e) {
            setError(e.response?.data?.message || "Order not found.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelConfirm = async () => {
        setCancelling(true);
        setCancelError("");
        try {
            await cancelOrder(orderId);
            setShowCancel(false);
            loadOrder(); // reload để cập nhật status
        } catch (e) {
            setCancelError(e.response?.data?.message || "Failed to cancel order.");
        } finally {
            setCancelling(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric"
        }) + "  " + d.toLocaleTimeString("vi-VN", {
            hour: "2-digit", minute: "2-digit"
        });
    };

    const canPayOrHold = order?.status === "NEW" || order?.status === "HOLD";
    const canCancel = order?.status === "NEW" || order?.status === "HOLD";

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner />
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "#dc3545" }}>
                <div style={{ fontSize: 48 }}>⚠️</div>
                <p>{error}</p>
                <Button variant="dark" onClick={() => navigate("/orders")}>Back to Orders</Button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            {/* Navbar */}
            {/*<OrderNavbar currentUser={currentUser} activePage="Order History" />*/}
            <OrderNavbar currentUser={currentUser} activePage="Order History" onLogout={() => navigate("/logout")} />
            <Container fluid className="py-3 px-4">
                <Row>
                    {/* LEFT */}
                    <Col md={7}>
                        {/* Order Header */}
                        <div style={{
                            background: "#d0d0d0", borderRadius: 8,
                            padding: "14px 20px", marginBottom: 16,
                            display: "flex", alignItems: "center", justifyContent: "space-between"
                        }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontWeight: 700, fontSize: 18 }}>Order #{order?.id}</span>
                                    <Badge bg={STATUS_BADGE[order?.status] || "secondary"} style={{ fontSize: 12 }}>
                                        {order?.status}
                                    </Badge>
                                </div>
                                <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
                                    {formatDate(order?.createdAt)}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                {canPayOrHold && (
                                    <Button
                                        variant="outline-dark"
                                        size="sm"
                                        onClick={() => navigate(`/orders/payment/${order.id}`, {
                                            state: { order }
                                        })}
                                    >
                                        Payment
                                    </Button>
                                )}
                                {canCancel && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => setShowCancel(true)}
                                    >
                                        Cancel Order
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div style={{
                            background: "#d0d0d0", borderRadius: 8,
                            padding: "16px 20px", marginBottom: 16
                        }}>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Order Summary</div>
                            <Row>
                                <Col xs={6}>
                                    <div style={{ fontSize: 13, marginBottom: 8 }}>
                                        <strong>Store:</strong> {order?.storeId ? `#${order.storeId}` : "-"}
                                    </div>
                                    <div style={{ fontSize: 13 }}>
                                        <strong>Customer Name:</strong> {order?.customerName || "-"}
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div style={{ fontSize: 13, marginBottom: 8 }}>
                                        <strong>Cashier:</strong> {order?.employeeId ? `#${order.employeeId}` : "-"}
                                    </div>
                                    <div style={{ fontSize: 13 }}>
                                        <strong>Total:</strong>{" "}
                                        <span style={{ fontWeight: 700 }}>
                                            {Number(order?.totalAmount || 0).toLocaleString()} đ
                                        </span>
                                    </div>
                                </Col>
                                {order?.customerPhone && (
                                    <Col xs={12} style={{ marginTop: 8 }}>
                                        <div style={{ fontSize: 13 }}>
                                            <strong>Customer Phone:</strong> {order.customerPhone}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </div>

                        {/* Order Items */}
                        <div style={{
                            background: "#d0d0d0", borderRadius: 8,
                            overflow: "hidden"
                        }}>
                            <div style={{ padding: "12px 20px", fontWeight: 700, fontSize: 15 }}>
                                Order Items
                            </div>
                            <Table style={{ margin: 0, background: "#fff" }}>
                                <thead style={{ background: "#e8e8e8" }}>
                                <tr>
                                    <th style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>Product name</th>
                                    <th style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>Quantity</th>
                                    <th style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>Unit Price</th>
                                    <th style={{ padding: "10px 16px", fontWeight: 600, fontSize: 13 }}>Subtotal</th>
                                </tr>
                                </thead>
                                <tbody>
                                {order?.items?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#aaa" }}>
                                            No items
                                        </td>
                                    </tr>
                                ) : (
                                    order?.items?.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ padding: "10px 16px", fontSize: 13 }}>{item.productName}</td>
                                            <td style={{ padding: "10px 16px", fontSize: 13 }}>{item.quantity}</td>
                                            <td style={{ padding: "10px 16px", fontSize: 13 }}>
                                                {Number(item.unitPrice).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>
                                                {Number(item.subtotal).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </Table>
                        </div>
                    </Col>

                    {/* RIGHT: Payment Info */}
                    <Col md={5}>
                        <div style={{
                            background: "#d0d0d0", borderRadius: 8,
                            padding: "16px 20px"
                        }}>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Payment Info</div>
                            {payment ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span><strong>Method</strong></span>
                                        <span>{payment.method}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span><strong>Status</strong></span>
                                        <Badge bg="success">{payment.status}</Badge>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span><strong>Time</strong></span>
                                        <span>{formatDate(payment.paidAt)}</span>
                                    </div>
                                    <hr style={{ margin: "4px 0" }} />
                                    {(() => {
                                        const subtotal = order?.items?.reduce((s, i) => s + Number(i.subtotal), 0) || 0;
                                        const total = Number(payment.amount);
                                        const discount = subtotal - total;
                                        return (
                                            <>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <span><strong>Subtotal</strong></span>
                                                    <span>{subtotal.toLocaleString()} đ</span>
                                                </div>
                                                {discount > 0 && (
                                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#e53e3e" }}>
                                                        <span><strong>Discount</strong></span>
                                                        <span>-{discount.toLocaleString()} đ</span>
                                                    </div>
                                                )}
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <span><strong>Total</strong></span>
                                                    <span style={{ fontWeight: 700 }}>{total.toLocaleString()} đ</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div style={{ color: "#666", fontSize: 13 }}>
                                    <div style={{ marginBottom: 8 }}><strong>Method</strong></div>
                                    <div style={{ marginBottom: 8 }}><strong>Status</strong></div>
                                    <div style={{ marginBottom: 8 }}><strong>Time</strong></div>
                                    <div style={{ marginBottom: 8 }}><strong>Subtotal</strong></div>
                                    <div style={{ marginBottom: 8 }}><strong>Discount</strong></div>
                                    <div><strong>Total</strong></div>
                                    <div style={{ marginTop: 16, color: "#aaa", fontSize: 12 }}>
                                        {order?.status === "CANCELLED"
                                            ? "Order cancelled"
                                            : "Payment not processed yet"}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Cancel Confirm Modal */}
            <Modal show={showCancel} onHide={() => setShowCancel(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: 16, fontWeight: 700 }}>Cancel Order</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to cancel <strong>Order #{orderId}</strong>?</p>
                    <p style={{ fontSize: 13, color: "#666" }}>
                        This will restore inventory stock. This action cannot be undone.
                    </p>
                    {cancelError && (
                        <div style={{ color: "#dc3545", fontSize: 13 }}>{cancelError}</div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowCancel(false)}>
                        Back
                    </Button>
                    <Button variant="danger" onClick={handleCancelConfirm} disabled={cancelling}>
                        {cancelling ? <Spinner size="sm" /> : "Confirm Cancel"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}