import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import inventoryApi from "../../api/inventory";

const PAGE_SIZE = 5;

const initialSupplierFormV2 = {
  name: "",
  phone: "",
  address: "",
};

function sanitizeSupplierFormV2(form) {
  return {
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
  };
}

export default function SupplierManagementPanel({ currentUser }) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [pageData, setPageData] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [supplierForm, setSupplierForm] = useState(initialSupplierFormV2);

  const canManage = useMemo(() => {
    return currentUser?.role === "ROLE_MANAGER" || currentUser?.role === "ROLE_ADMIN";
  }, [currentUser?.role]);

  const isAdmin = currentUser?.role === "ROLE_ADMIN";

  const loadSuppliersForManagementV2 = async (page = 0, search = appliedSearch) => {
    if (!canManage) {
      setError("You do not have permission to access supplier management.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await inventoryApi.getSuppliersForManagementV2({
        search: search || undefined,
        page,
        size: PAGE_SIZE,
      });

      setPageData(
        data || {
          content: [],
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
        }
      );
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliersForManagementV2(0, "");
  }, [canManage]);

  const applySearch = async () => {
    const normalized = searchKeyword.trim();
    setAppliedSearch(normalized);
    await loadSuppliersForManagementV2(0, normalized);
  };

  const clearSearch = async () => {
    setSearchKeyword("");
    setAppliedSearch("");
    await loadSuppliersForManagementV2(0, "");
  };

  const goPage = async (nextPage) => {
    const bounded = Math.max(0, Math.min(nextPage, Math.max(0, (pageData.totalPages || 1) - 1)));
    await loadSuppliersForManagementV2(bounded, appliedSearch);
  };

  const openCreateModal = () => {
    setEditingSupplierId(null);
    setSupplierForm(initialSupplierFormV2);
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setShowModal(true);
  };

  const submitSupplier = async () => {
    const payload = sanitizeSupplierFormV2(supplierForm);
    if (!payload.name) {
      setError("Supplier name is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (editingSupplierId) {
        await inventoryApi.updateSupplier(editingSupplierId, payload);
        setSuccessMessage("Supplier updated successfully.");
      } else {
        await inventoryApi.createSupplier(payload);
        setSuccessMessage("Supplier created successfully.");
      }

      setShowModal(false);
      await loadSuppliersForManagementV2(pageData.currentPage || 0, appliedSearch);
    } catch (e) {
      setError(e.response?.data?.message || "Supplier action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSupplierForManagementV2 = async (supplier) => {
    if (!isAdmin) {
      setError("Only admin can delete supplier.");
      return;
    }

    const confirmed = window.confirm(`Delete supplier ${supplier.name}?`);
    if (!confirmed) return;

    setError("");
    setSuccessMessage("");

    try {
      await inventoryApi.deleteSupplierForManagementV2(supplier.id);
      setSuccessMessage("Supplier deleted successfully.");

      const nextPage =
        pageData.content.length === 1 && (pageData.currentPage || 0) > 0
          ? (pageData.currentPage || 0) - 1
          : pageData.currentPage || 0;

      await loadSuppliersForManagementV2(nextPage, appliedSearch);
    } catch (e) {
      setError(e.response?.data?.message || "Delete supplier failed.");
    }
  };

  const totalPages = pageData.totalPages || 0;
  const currentPage = pageData.currentPage || 0;
  const visiblePageNumbers = useMemo(() => {
    if (totalPages <= 0) return [];
    const maxButtons = 3;
    const start = Math.max(0, Math.min(currentPage - 1, totalPages - maxButtons));
    const end = Math.min(totalPages, start + maxButtons);
    const pages = [];
    for (let i = start; i < end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const pageStart = pageData.totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const pageEnd = Math.min((currentPage + 1) * PAGE_SIZE, pageData.totalElements || 0);

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3" style={{ padding: "0 2px" }}>
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a", letterSpacing: "0.1px" }}>Supplier Management</h4>
        <Button
          variant="dark"
          onClick={openCreateModal}
          disabled={!canManage}
          style={{ borderRadius: 10, paddingInline: 18, fontWeight: 600, minHeight: 40 }}
        >
          + Add Supplier
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Card style={{ borderRadius: 12, borderColor: "#dfe4ec", boxShadow: "0 2px 8px rgba(17,24,39,0.04)" }}>
        <Card.Body style={{ padding: 18 }}>
          <Row className="g-2 align-items-center mb-3">
            <Col md={9}>
              <Form.Control
                placeholder="Search suppliers..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                style={{ borderRadius: 10, minHeight: 42 }}
              />
            </Col>
            <Col md={3} className="d-flex gap-2 justify-content-end">
              <Button variant="dark" onClick={applySearch} style={{ borderRadius: 9, minWidth: 82 }}>Search</Button>
              <Button variant="outline-secondary" onClick={clearSearch} style={{ borderRadius: 9, minWidth: 82 }}>Clear</Button>
            </Col>
          </Row>

          {loading ? (
            <div className="d-flex align-items-center gap-2" style={{ padding: "20px 0" }}>
              <Spinner size="sm" /> Loading suppliers...
            </div>
          ) : (
            <Table hover responsive style={{ marginBottom: 12, borderCollapse: "separate", borderSpacing: 0 }}>
              <thead style={{ background: "#f4f6f9" }}>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>SUPPLIER NAME</th>
                  <th>PHONE NUMBER</th>
                  <th>PHYSICAL ADDRESS</th>
                  <th style={{ textAlign: "center" }}>PRODUCTS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(pageData.content || []).map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          background: "#e9eef5",
                          color: "#1f334f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                        title="Supplier"
                      >
                        {supplier.name?.slice(0, 1)?.toUpperCase() || "S"}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{supplier.name}</td>
                    <td>{supplier.phone || "-"}</td>
                    <td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={supplier.address || ""}>
                      {supplier.address || "-"}
                    </td>
                    <td style={{ fontWeight: 700, textAlign: "center" }}>{Number(supplier.productCount || 0).toLocaleString()}</td>
                    <td>
                      <div className="d-flex gap-3">
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => openEditModal(supplier)}
                          style={{ padding: 0, color: "#0f172a", textDecoration: "none", fontWeight: 600 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => deleteSupplierForManagementV2(supplier)}
                          disabled={!isAdmin}
                          style={{
                            padding: 0,
                            color: isAdmin ? "#be123c" : "#9ca3af",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageData.content?.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#8a94a6", padding: 20 }}>
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}

          <div className="d-flex align-items-center justify-content-between" style={{ color: "#7a8598", fontSize: 13 }}>
            <div>
              Showing {pageStart} to {pageEnd} of {pageData.totalElements || 0} suppliers
            </div>
            <div className="d-flex gap-1 align-items-center" style={{ minWidth: 190, justifyContent: "flex-end" }}>
              <Button size="sm" variant="light" disabled={currentPage === 0} onClick={() => goPage(currentPage - 1)} style={{ width: 30 }}>
                {"<"}
              </Button>
              {visiblePageNumbers.map((pageNo) => (
                <Button
                  key={pageNo}
                  size="sm"
                  variant={pageNo === currentPage ? "dark" : "light"}
                  onClick={() => goPage(pageNo)}
                  style={{ width: 34, fontWeight: pageNo === currentPage ? 700 : 500 }}
                >
                  {pageNo + 1}
                </Button>
              ))}
              <Button
                size="sm"
                variant="light"
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
                onClick={() => goPage(currentPage + 1)}
                style={{ width: 30 }}
              >
                {">"}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingSupplierId ? "Edit Supplier" : "Add Supplier"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Supplier Name</Form.Label>
            <Form.Control
              value={supplierForm.name}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Physical Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={supplierForm.address}
              onChange={(e) => setSupplierForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" disabled={submitting} onClick={submitSupplier}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}