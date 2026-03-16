import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Container, Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import { processPayment } from "../../api/orderApi.jsx";

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId } = useParams();

    // Lấy order info từ state khi navigate từ CreateOrderPage
    const order = location.state?.order;

    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // { success: bool, message: string }

    const handleConfirmPayment = async () => {
        setSubmitting(true);
        try {
            await processPayment({
                orderId: Number(orderId),
                paymentMethod
            });
            setResult({ success: true, message: "Payment successful!" });
        } catch (e) {
            setResult({
                success: false,
                message: e.response?.data?.message || "Payment failed. Please try again."
            });
        } finally {
            setSubmitting(false);
            // Redirect về create order sau 3s dù thành công hay thất bại
            setTimeout(() => navigate("/orders/create"), 3000);
        }
    };

    const handleCancel = () => navigate("/orders/create");

    // Nếu đang hiển thị kết quả
    if (result) {
        return (
            <div style={{
                minHeight: "100vh", background: "#f5f5f5",
                display: "flex", alignItems: "center", justifyContent: "center"
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>
                        {result.success ? "✅" : "❌"}
                    </div>
                    <Alert
                        variant={result.success ? "success" : "danger"}
                        style={{ fontSize: 18, fontWeight: 600, padding: "16px 32px" }}
                    >
                        {result.message}
                    </Alert>
                    <p style={{ color: "#888", fontSize: 13 }}>
                        Redirecting to POS in 3 seconds...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh", background: "#f5f5f5",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            <Container style={{ maxWidth: 480 }}>
                <Card style={{ borderRadius: 12, border: "1px solid #e5e5e5", padding: 8 }}>
                    <Card.Body>
                        <h5 style={{ fontWeight: 700, marginBottom: 24 }}>Process Payment</h5>

                        {/* Order ID */}
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: 13, color: "#888" }}>Order ID</Form.Label>
                            <Form.Control
                                value={`#${orderId}`}
                                readOnly
                                style={{ background: "#f8f9fa", fontWeight: 600 }}
                            />
                        </Form.Group>

                        {/* Total Amount */}
                        <Form.Group className="mb-4">
                            <Form.Label style={{ fontSize: 13, color: "#888" }}>Total Amount</Form.Label>
                            <Form.Control
                                value={order
                                    ? `${Number(order.totalAmount).toLocaleString()} đ`
                                    : "Loading..."}
                                readOnly
                                style={{ background: "#f8f9fa", fontWeight: 700, fontSize: 18, color: "#1a1a1a" }}
                            />
                        </Form.Group>

                        {/* Payment Method */}
                        <Form.Group className="mb-4">
                            <Form.Label style={{ fontSize: 13, color: "#888" }}>Payment Method</Form.Label>
                            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                                {["CASH", "CARD"].map(method => (
                                    <div
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        style={{
                                            flex: 1, padding: "12px 16px", borderRadius: 8, cursor: "pointer",
                                            border: paymentMethod === method ? "2px solid #222" : "2px solid #e5e5e5",
                                            background: paymentMethod === method ? "#222" : "#fff",
                                            color: paymentMethod === method ? "#fff" : "#333",
                                            fontWeight: 600, textAlign: "center",
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        {method === "CASH" ? "💵 Cash" : "💳 Card"}
                                    </div>
                                ))}
                            </div>
                        </Form.Group>

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: 10 }}>
                            <Button
                                variant="outline-secondary"
                                style={{ flex: 1 }}
                                onClick={handleCancel}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="dark"
                                style={{ flex: 2, fontWeight: 600 }}
                                onClick={handleConfirmPayment}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <><Spinner size="sm" className="me-2" />Processing...</>
                                    : "Confirm Payment"
                                }
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}