import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {Container, Row, Col, Form, Button, Spinner, Alert} from "react-bootstrap";
import {getUser} from "../../api/auth.jsx";
import {searchCustomer, createOrder} from "../../api/orderApi.jsx";
import api from "../../api/api.jsx";
import AddCustomerModal from "../../components/AddCustomerModal.jsx";
import OrderNavbar from "./OrderNavbar.jsx";
import Logout from "../../components/Logout.jsx";
export default function CreateOrderPage() {
    const navigate = useNavigate();
    const [showAddCustomer, setShowAddCustomer] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);

    // Product search
    const [productKeyword, setProductKeyword] = useState("");
    const [productResults, setProductResults] = useState([]);
    const [searchingProduct, setSearchingProduct] = useState(false);
    const [productError, setProductError] = useState("");

    // Cart
    const [orderItems, setOrderItems] = useState([]);

    // Customer
    const [customerPhone, setCustomerPhone] = useState("");
    const [customer, setCustomer] = useState(null);
    const [searchingCustomer, setSearchingCustomer] = useState(false);
    const [customerError, setCustomerError] = useState("");
    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

    // Submit
    const [submitting, setSubmitting] = useState(false);
    const [orderError, setOrderError] = useState("");

    useEffect(() => {
        getUser().then(setCurrentUser);
    }, []);

    const subtotal = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const discount = useLoyaltyPoints && customer ? customer.points * 100 : 0;
    const totalAmount = Math.max(0, subtotal - discount);

    // Product search - gọi thẳng /product/search qua gateway
    const handleSearchProduct = async () => {
        const kw = productKeyword.trim();
        if (!kw) return;
        setSearchingProduct(true);
        setProductError("");
        setProductResults([]);
        try {
            const res = await api.get("/product/search", {params: {keyword: kw}});
            const results = res.data?.data || [];
            if (results.length === 0) setProductError("No products found.");
            else setProductResults(results);
        } catch (e) {
            setProductError(e.response?.data?.message || "Product not found.");
        } finally {
            setSearchingProduct(false);
        }
    };

    const handleAddToCart = (product) => {
        const existing = orderItems.find(i => i.productId === product.id);
        if (existing) {
            setOrderItems(orderItems.map(i =>
                i.productId === product.id ? {...i, quantity: i.quantity + 1} : i
            ));
        } else {
            setOrderItems([...orderItems, {
                productId: product.id,
                productName: product.name,
                unitPrice: product.price,
                quantity: 1,
                imageUrl: product.imageUrl || null
            }]);
        }
    };

    const handleQtyChange = (productId, val) => {
        const qty = parseInt(val);
        if (isNaN(qty) || qty < 1) return;
        setOrderItems(orderItems.map(i =>
            i.productId === productId ? {...i, quantity: qty} : i
        ));
    };

    const handleRemoveItem = (productId) => {
        setOrderItems(orderItems.filter(i => i.productId !== productId));
    };

    const handleSearchCustomer = async () => {
        const phone = customerPhone.trim();
        if (!phone) return;
        setSearchingCustomer(true);
        setCustomerError("");
        setCustomer(null);
        setUseLoyaltyPoints(false);
        try {
            const result = await searchCustomer(phone);
            setCustomer(result);
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            setCustomerError("Customer not found. Create new customer?");
        } finally {
            setSearchingCustomer(false);
        }
    };

    const handleSubmit = async (isHold = false) => {
        if (orderItems.length === 0) {
            setOrderError("Please add at least one item.");
            return;
        }
        if (!currentUser) {
            setOrderError("User session expired. Please login again.");
            return;
        }
        setSubmitting(true);
        setOrderError("");
        try {
            const result = await createOrder({
                storeId: currentUser.storeId,
                employeeId: currentUser.employeeId,
                customerId: customer?.id || null,
                useLoyaltyPoints,
                hold: isHold,
                paymentMethod: null,
                items: orderItems.map(i => ({
                    productId: i.productId,
                    productName: i.productName,
                    unitPrice: i.unitPrice,
                    quantity: i.quantity
                }))
            });

            if (isHold) {
                setOrderItems([]);
                setCustomer(null);
                setCustomerPhone("");
                setUseLoyaltyPoints(false);
                setProductResults([]);
            } else {
                navigate(`/orders/payment/${result.id}`, {state: {order: result}});
            }
        } catch (e) {
            setOrderError(e.response?.data?.message || "Failed to create order.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{minHeight: "100vh", background: "#f5f5f5"}}>
            {/* Navbar */}
            <OrderNavbar currentUser={currentUser} activePage="POS" onLogout={() => navigate("/logout")} />
            <Container fluid className="py-3 px-4">
                <Row>
                    {/* LEFT: Product Search + Grid */}
                    <Col md={7} style={{paddingRight: 20}}>
                        <h5 className="mb-3" style={{fontWeight: 700}}>New Order</h5>

                        {/* Search bar */}
                        <div style={{display: "flex", gap: 8, marginBottom: 16}}>
                            <div style={{position: "relative", flex: 1}}>
                                <span style={{
                                    position: "absolute", left: 12, top: "50%",
                                    transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none"
                                }}>🔍</span>
                                <Form.Control
                                    placeholder="Search product by name, SKU or barcode"
                                    value={productKeyword}
                                    onChange={e => setProductKeyword(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSearchProduct()}
                                    style={{paddingLeft: 36, borderRadius: 20, border: "1px solid #ddd"}}
                                />
                            </div>
                            <Button
                                variant="dark"
                                onClick={handleSearchProduct}
                                disabled={searchingProduct}
                                style={{borderRadius: 20, paddingInline: 24}}
                            >
                                {searchingProduct ? <Spinner size="sm"/> : "Search"}
                            </Button>
                        </div>

                        {productError && (
                            <Alert variant="warning" className="py-2 px-3" style={{fontSize: 13}}>
                                {productError}
                            </Alert>
                        )}

                        {/* Product Grid */}
                        <Row xs={2} md={3} className="g-3">
                            {(productResults.length > 0 ? productResults : Array.from({length: 6})).map((p, i) => (
                                <Col key={p?.id ?? i}>
                                    <div style={{
                                        background: "#fff", borderRadius: 10,
                                        border: "1px solid #e5e5e5", padding: 12,
                                        display: "flex", flexDirection: "column", gap: 6,
                                        opacity: p ? 1 : 0.35,
                                        height: "100%"
                                    }}>
                                        <div style={{
                                            width: "100%", aspectRatio: "1",
                                            background: "#f4f4f4", borderRadius: 8,
                                            overflow: "hidden",
                                            display: "flex", alignItems: "center",
                                            justifyContent: "center", fontSize: 32
                                        }}>
                                            {p?.imageUrl ? (
                                                <img
                                                    src={p.imageUrl}
                                                    alt={p.name}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    onError={e => { e.target.style.display = "none"; }}
                                                />
                                            ) : (
                                                p ? "📦" : "🖼️"
                                            )}
                                        </div>
                                        <div style={{fontWeight: 600, fontSize: 13, lineHeight: 1.4}}>
                                            {p?.name ?? ""}
                                        </div>
                                        <div style={{fontSize: 11, color: "#999"}}>{p?.barcode ?? ""}</div>
                                        <div style={{fontWeight: 700, fontSize: 14}}>
                                            {p ? `${Number(p.price).toLocaleString()} đ` : ""}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline-dark"
                                            onClick={() => p && handleAddToCart(p)}
                                            disabled={!p}
                                            style={{borderRadius: 6, marginTop: "auto"}}
                                        >
                                            Add Item
                                        </Button>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Col>

                    {/* RIGHT: Cart + Customer + Summary */}
                    <Col md={5}>
                        <div style={{
                            background: "#fff", borderRadius: 12,
                            border: "1px solid #e5e5e5", padding: 20,
                            position: "sticky", top: 16
                        }}>
                            {/* Cart Header */}
                            <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 14}}>
                                <span style={{fontSize: 20}}>🛒</span>
                                <h5 style={{margin: 0, fontWeight: 700}}>Order Item List</h5>
                            </div>

                            {/* Cart Items */}
                            {orderItems.length === 0 ? (
                                <p style={{color: "#bbb", textAlign: "center", padding: "16px 0", fontSize: 13}}>
                                    No items added yet
                                </p>
                            ) : (
                                <div style={{maxHeight: 220, overflowY: "auto", marginBottom: 12}}>
                                    {orderItems.map(item => (
                                        <div key={item.productId} style={{
                                            display: "flex", alignItems: "center", gap: 10,
                                            padding: "8px 0", borderBottom: "1px solid #f3f3f3"
                                        }}>
                                            {/*<div style={{*/}
                                            {/*    width: 44, height: 44, background: "#f4f4f4",*/}
                                            {/*    borderRadius: 6, flexShrink: 0,*/}
                                            {/*    display: "flex", alignItems: "center", justifyContent: "center"*/}
                                            {/*}}>📦*/}
                                            {/*</div>*/}
                                            <div style={{
                                                width: 44, height: 44, background: "#f4f4f4",
                                                borderRadius: 6, flexShrink: 0,
                                                overflow: "hidden",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                {item.imageUrl ? (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.productName}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        onError={e => { e.target.style.display = "none"; }}
                                                    />
                                                ) : "📦"}
                                            </div>
                                            <div style={{flex: 1, minWidth: 0}}>
                                                <div style={{
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }}>
                                                    {item.productName}
                                                </div>
                                                <div style={{fontSize: 11, color: "#999"}}>
                                                    {Number(item.price).toLocaleString()} đ
                                                </div>
                                            </div>
                                            <Form.Control
                                                type="number" size="sm" min={1}
                                                value={item.quantity}
                                                onChange={e => handleQtyChange(item.productId, e.target.value)}
                                                style={{width: 52, textAlign: "center", padding: "2px 4px"}}
                                            />
                                            <div style={{fontWeight: 700, fontSize: 13, width: 72, textAlign: "right"}}>
                                                ${Number(item.unitPrice * item.quantity).toLocaleString()}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.productId)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#ccc",
                                                    cursor: "pointer",
                                                    fontSize: 14,
                                                    padding: "0 2px"
                                                }}
                                            >✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <hr style={{margin: "10px 0"}}/>

                            {/* Customer Search */}
                            <div style={{marginBottom: 12}}>
                                <div style={{display: "flex", gap: 6, marginBottom: 6}}>
                                    <Form.Control
                                        size="sm"
                                        placeholder="Search Customer"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleSearchCustomer()}
                                        style={{flex: 1}}
                                    />
                                    <Button size="sm" variant="outline-secondary" onClick={handleSearchCustomer}
                                            disabled={searchingCustomer}>
                                        {searchingCustomer ? <Spinner size="sm"/> : "Search"}
                                    </Button>
                                    <Button size="sm" variant="outline-primary"
                                            onClick={() => setShowAddCustomer(true)}>
                                        Add new customer
                                    </Button>
                                </div>

                                {customerError && (
                                    <Alert variant="warning" className="py-1 px-2"
                                           style={{fontSize: 12, marginBottom: 6}}>
                                        {customerError}
                                    </Alert>
                                )}

                                {customer && (
                                    <div style={{
                                        background: "#f8f9fa", borderRadius: 8,
                                        padding: "10px 12px", fontSize: 13
                                    }}>
                                        <div
                                            style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
                                            <strong>{customer.name}</strong>
                                            <span style={{color: "#888"}}>{customer.phone}</span>
                                        </div>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}>
                                            <span style={{color: "#666"}}>
                                                Loyalty points: <strong>{customer.points}</strong>
                                            </span>
                                            {customer.points > 0 && (
                                                <Form.Check
                                                    type="checkbox"
                                                    label="Use Loyalty points"
                                                    checked={useLoyaltyPoints}
                                                    onChange={e => setUseLoyaltyPoints(e.target.checked)}
                                                    style={{fontSize: 12}}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr style={{margin: "10px 0"}}/>

                            {/* Summary */}
                            <div style={{fontSize: 14, marginBottom: 14}}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 6,
                                    color: "#555"
                                }}>
                                    <span>Subtotal</span>
                                    <span>${subtotal.toLocaleString()}</span>
                                </div>
                                {discount > 0 && (
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: 6,
                                        color: "#e53e3e"
                                    }}>
                                        <span>Discount</span>
                                        <span>-${discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    marginTop: 8
                                }}>
                                    <span>Total Amount</span>
                                    <span>${totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {orderError && (
                                <Alert variant="danger" className="py-2 px-3" style={{fontSize: 13}}>
                                    {orderError}
                                </Alert>
                            )}

                            {/* Buttons */}
                            <div style={{display: "flex", gap: 8}}>
                                <Button
                                    variant="outline-secondary"
                                    style={{flex: 1, fontWeight: 600}}
                                    onClick={() => handleSubmit(true)}
                                    disabled={submitting || orderItems.length === 0}
                                >
                                    HOLD ORDER
                                </Button>
                                <Button
                                    variant="dark"
                                    style={{flex: 1, fontWeight: 600}}
                                    onClick={() => handleSubmit(false)}
                                    disabled={submitting || orderItems.length === 0}
                                >
                                    {submitting ? <Spinner size="sm"/> : "CREATE ORDER"}
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>

            <AddCustomerModal
                show={showAddCustomer}
                onHide={() => setShowAddCustomer(false)}
                onCreated={(newCustomer) => {
                    setCustomer(newCustomer);
                    setCustomerPhone(newCustomer.phone);
                    setCustomerError("");
                    setShowAddCustomer(false);
                }}
            />
        </div>
    );
}