import { useState } from "react";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";
import { createCustomer } from "../api/orderApi";

export default function AddCustomerModal({ show, onHide, onCreated }) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [type, setType] = useState("NORMAL");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!name.trim() || !phone.trim()) {
            setError("Name and phone are required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const result = await createCustomer({ name, phone, type });
            onCreated(result); // trả customer mới về CreateOrderPage
            handleClose();
        } catch (e) {
            setError(e.response?.data?.message || "Failed to create customer.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName("");
        setPhone("");
        setType("NORMAL");
        setError("");
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title style={{ fontSize: 16, fontWeight: 700 }}>Add New Customer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                <Form.Group className="mb-3">
                    <Form.Label>Full Name <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Control
                        placeholder="Enter full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Phone <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Control
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select value={type} onChange={e => setType(e.target.value)}>
                        <option value="NORMAL">NORMAL</option>
                        <option value="VIP">VIP</option>
                    </Form.Select>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose}>Cancel</Button>
                <Button variant="dark" onClick={handleSubmit} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : "Create Customer"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}