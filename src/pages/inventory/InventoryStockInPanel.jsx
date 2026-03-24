import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import api from "../../api/api";
import inventoryApi from "../../api/inventory";

const HISTORY_SIZE = 8;

const initialForm = {
  supplierId: "",
  storeId: "",
  referenceCode: "",
  reason: "PURCHASE_RECEIPT",
  notes: "",
  items: [],
};

const reasonOptions = [
  "PURCHASE_RECEIPT",
  "CUSTOMER_RETURN",
  "TRANSFER_IN",
  "STOCK_COUNT_ADJUSTMENT_IN",
];

function todayDateText() {
  return new Date().toISOString().split("T")[0];
}

export default function InventoryStockInPanel({ currentUser, stores, isStoreLocked }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [stockInPage, setStockInPage] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [todayOverview, setTodayOverview] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [productNameById, setProductNameById] = useState({});

  const [form, setForm] = useState(initialForm);

  const [productKeyword, setProductKeyword] = useState("");
  const [productResults, setProductResults] = useState([]);

  const storeNameById = useMemo(() => {
    const map = new Map();
    stores.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [stores]);

  const supplierNameById = useMemo(() => {
    const map = new Map();
    suppliers.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [suppliers]);

  const currentStoreId = useMemo(() => {
    if (form.storeId) return form.storeId;
    if (isStoreLocked && currentUser?.storeId) return String(currentUser.storeId);
    return "";
  }, [form.storeId, isStoreLocked, currentUser?.storeId]);

  const historyTotalQty = useMemo(() => {
    return (stockInPage.content || []).reduce((sum, row) => sum + Number(row.totalQuantity || 0), 0);
  }, [stockInPage.content]);

  const loadSuppliers = async () => {
    try {
      const data = await inventoryApi.getSuppliers({ page: 0, size: 200 });
      const list = Array.isArray(data) ? data : data?.content || [];
      setSuppliers(list);
    } catch {
      setSuppliers([]);
    }
  };

  const loadTodayOverview = async (storeIdText = "") => {
    try {
      const today = todayDateText();
      const data = await inventoryApi.getReportOverview({
        storeId: storeIdText ? Number(storeIdText) : undefined,
        fromDate: today,
        toDate: today,
      });
      setTodayOverview(data || null);
    } catch {
      setTodayOverview(null);
    }
  };

  const loadStockIns = async (page = 0, storeIdText = "") => {
    setLoading(true);
    setError("");

    try {
      const data = await inventoryApi.getStockIns({
        storeId: storeIdText ? Number(storeIdText) : undefined,
        page,
        size: HISTORY_SIZE,
      });

      setStockInPage(
        data || {
          content: [],
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
        }
      );
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load stock-in history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const preStoreId =
      Number.isFinite(Number(currentUser.storeId)) && (isStoreLocked || stores.length === 1)
        ? String(currentUser.storeId)
        : "";

    setForm((prev) => ({ ...prev, storeId: preStoreId }));

    loadSuppliers();
    loadStockIns(0, preStoreId);
    loadTodayOverview(preStoreId);
  }, [currentUser?.storeId, isStoreLocked, stores.length]);

  const searchProducts = async () => {
    const keyword = productKeyword.trim();
    if (!keyword) {
      setProductResults([]);
      return;
    }

    setSearchingProducts(true);
    setError("");

    try {
      const products = await inventoryApi.searchProductsByKeyword(keyword);
      setProductResults(products || []);
    } catch (e) {
      setProductResults([]);
      setError(e.response?.data?.message || "Cannot search product.");
    } finally {
      setSearchingProducts(false);
    }
  };

  const addProductLine = (product) => {
    const productId = String(product.id);
    const existed = form.items.some((it) => String(it.productId) === productId);
    if (existed) return;

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId,
          productName: product.name || `Product #${product.id}`,
          sku: product.barcode || product.sku || `PRD-${product.id}`,
          quantity: "1",
          unitCost: "0",
        },
      ],
    }));
  };

  const updateProductLine = (productId, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => (String(it.productId) === String(productId) ? { ...it, ...patch } : it)),
    }));
  };

  const removeProductLine = (productId) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((it) => String(it.productId) !== String(productId)),
    }));
  };

  const openStockInDetail = async (stockInId) => {
    setDetailLoading(true);
    setError("");

    try {
      const data = await inventoryApi.getStockInDetail(stockInId);
      setSelectedDetail(data || null);

      const productIds = [...new Set((data?.items || []).map((item) => item.productId).filter(Boolean))];
      const missingIds = productIds.filter((id) => !productNameById[String(id)]);

      if (missingIds.length > 0) {
        const entries = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const res = await api.get(`/product/${id}`);
              const name = res.data?.data?.name || `Product #${id}`;
              return [String(id), name];
            } catch {
              return [String(id), `Product #${id}`];
            }
          })
        );

        setProductNameById((prev) => {
          const next = { ...prev };
          entries.forEach(([id, name]) => {
            next[id] = name;
          });
          return next;
        });
      }
    } catch (e) {
      setError(e.response?.data?.message || "Cannot load stock-in detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const submitCreateStockIn = async () => {
    if (!form.storeId) {
      setError("Please choose store.");
      return;
    }

    if (form.items.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    const invalidLine = form.items.find((it) => Number(it.quantity || 0) <= 0 || Number(it.unitCost || -1) < 0);
    if (invalidLine) {
      setError("Quantity must be > 0 and unit cost must be >= 0.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        storeId: Number(form.storeId),
        referenceCode: form.referenceCode.trim() || null,
        reason: form.reason,
        notes: form.notes.trim() || null,
        items: form.items.map((it) => ({
          productId: Number(it.productId),
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
        })),
      };

      await inventoryApi.createStockIn(payload);
      setSuccessMessage("Stock-in created successfully.");

      const keepStoreId = form.storeId;
      setForm({ ...initialForm, storeId: keepStoreId });
      setProductKeyword("");
      setProductResults([]);

      await Promise.all([loadStockIns(0, keepStoreId), loadTodayOverview(keepStoreId)]);
    } catch (e) {
      setError(e.response?.data?.message || "Create stock-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetDraft = () => {
    setForm((prev) => ({
      ...initialForm,
      storeId: prev.storeId,
    }));
    setProductKeyword("");
    setProductResults([]);
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Stock-In Workspace</h4>
        <Button variant="outline-dark" onClick={() => loadStockIns(stockInPage.currentPage || 0, currentStoreId)} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TODAY STOCK IN</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{Number(todayOverview?.todayStockIn || 0).toLocaleString()}</div>
          </Card>
        </Col>
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>STOCK-IN DOCUMENTS</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{Number(stockInPage.totalElements || 0).toLocaleString()}</div>
          </Card>
        </Col>
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>HISTORY PAGE QTY</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{historyTotalQty.toLocaleString()}</div>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 align-items-start">
        <Col xl={7}>
          <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 style={{ margin: 0, fontWeight: 700, color: "#1b283b" }}>Stock-In History</h5>
                <div style={{ width: 220 }}>
                  <Form.Select
                    value={form.storeId}
                    disabled={isStoreLocked}
                    onChange={async (e) => {
                      const nextStore = e.target.value;
                      setForm((prev) => ({ ...prev, storeId: nextStore }));
                      await Promise.all([loadStockIns(0, nextStore), loadTodayOverview(nextStore)]);
                    }}
                  >
                    <option value="">All stores</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>

              {loading ? (
                <div className="d-flex align-items-center gap-2" style={{ padding: "24px 0" }}>
                  <Spinner size="sm" /> Loading stock-in history...
                </div>
              ) : (
                <Table responsive hover>
                  <thead style={{ background: "#f2f4f8" }}>
                    <tr>
                      <th>ID</th>
                      <th>STORE</th>
                      <th>SUPPLIER</th>
                      <th style={{ textAlign: "right" }}>LINES</th>
                      <th style={{ textAlign: "right" }}>QTY</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stockInPage.content || []).map((row) => (
                      <tr key={row.stockInId}>
                        <td>#{row.stockInId}</td>
                        <td>{storeNameById.get(String(row.storeId)) || `Store #${row.storeId}`}</td>
                        <td>{supplierNameById.get(String(row.supplierId)) || (row.supplierId ? `Supplier #${row.supplierId}` : "-")}</td>
                        <td style={{ textAlign: "right" }}>{row.totalItems}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{Number(row.totalQuantity || 0).toLocaleString()}</td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => openStockInDetail(row.stockInId)}>
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {stockInPage.content?.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#8a94a6", padding: 18 }}>
                          No stock-in records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}

              <div className="d-flex justify-content-end gap-2">
                <Button
                  size="sm"
                  variant="light"
                  disabled={(stockInPage.currentPage || 0) === 0}
                  onClick={() => loadStockIns((stockInPage.currentPage || 0) - 1, currentStoreId)}
                >
                  &lt;
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  disabled={(stockInPage.currentPage || 0) >= (stockInPage.totalPages || 1) - 1 || (stockInPage.totalPages || 0) === 0}
                  onClick={() => loadStockIns((stockInPage.currentPage || 0) + 1, currentStoreId)}
                >
                  &gt;
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }} className="mt-3">
            <Card.Body>
              <h6 style={{ marginBottom: 10, fontWeight: 700, color: "#1b283b" }}>Stock-In Detail</h6>
              {detailLoading && (
                <div className="d-flex align-items-center gap-2" style={{ padding: "8px 0" }}>
                  <Spinner size="sm" /> Loading detail...
                </div>
              )}

              {!detailLoading && !selectedDetail && <div style={{ color: "#8a94a6" }}>Select a stock-in row to see details.</div>}

              {!detailLoading && selectedDetail && (
                <>
                  <div style={{ color: "#475569", fontSize: 13, marginBottom: 8 }}>
                    Stock-In #{selectedDetail.stockInId} | Store: {storeNameById.get(String(selectedDetail.storeId)) || "Unknown Store"} | Supplier: {supplierNameById.get(String(selectedDetail.supplierId)) || "Unknown Supplier"}
                  </div>
                  <Table size="sm" responsive>
                    <thead>
                      <tr>
                        <th>PRODUCT NAME</th>
                        <th style={{ textAlign: "right" }}>QTY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedDetail.items || []).map((it, idx) => (
                        <tr key={`${it.productId}-${idx}`}>
                          <td>{productNameById[String(it.productId)] || `Product #${it.productId}`}</td>
                          <td style={{ textAlign: "right" }}>{Number(it.quantity || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={5}>
          <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <Card.Body>
              <h5 style={{ marginBottom: 14, fontWeight: 700, color: "#1b283b" }}>Create Stock-In</h5>

              <Row className="g-2">
                <Col md={6}>
                  <Form.Label>Supplier</Form.Label>
                  <Form.Select value={form.supplierId} onChange={(e) => setForm((prev) => ({ ...prev, supplierId: e.target.value }))}>
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={6}>
                  <Form.Label>Store</Form.Label>
                  <Form.Select
                    value={form.storeId}
                    disabled={isStoreLocked}
                    onChange={(e) => setForm((prev) => ({ ...prev, storeId: e.target.value }))}
                  >
                    <option value="">Select store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={6}>
                  <Form.Label>Reference Code</Form.Label>
                  <Form.Control
                    value={form.referenceCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, referenceCode: e.target.value }))}
                    placeholder="REF-2026-001"
                  />
                </Col>

                <Col md={6}>
                  <Form.Label>Reason</Form.Label>
                  <Form.Select value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}>
                    {reasonOptions.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={12}>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional details..."
                  />
                </Col>
              </Row>

              <hr />

              <div style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 8 }}>PRODUCTS</div>

              <div className="d-flex gap-2 mb-2">
                <Form.Control
                  value={productKeyword}
                  placeholder="Search product name or barcode"
                  onChange={(e) => setProductKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                />
                <Button variant="outline-secondary" onClick={searchProducts} disabled={searchingProducts}>
                  {searchingProducts ? "..." : "Search"}
                </Button>
              </div>

              {productResults.length > 0 && (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 160, overflowY: "auto", marginBottom: 10 }}>
                  {productResults.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: "8px 10px",
                        borderBottom: "1px solid #edf2f7",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>{p.barcode || p.sku || `PRD-${p.id}`}</div>
                      </div>
                      <Button size="sm" variant="light" onClick={() => addProductLine(p)}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Table size="sm" responsive style={{ marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th style={{ width: 86, textAlign: "right" }}>QTY</th>
                    <th style={{ width: 110, textAlign: "right" }}>UNIT COST</th>
                    <th style={{ width: 62 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it) => (
                    <tr key={it.productId}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{it.productName}</div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>{it.sku}</div>
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateProductLine(it.productId, { quantity: e.target.value })}
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="number"
                          min={0}
                          value={it.unitCost}
                          onChange={(e) => updateProductLine(it.productId, { unitCost: e.target.value })}
                          style={{ textAlign: "right" }}
                        />
                      </td>
                      <td>
                        <Button size="sm" variant="link" style={{ color: "#be123c", padding: 0 }} onClick={() => removeProductLine(it.productId)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {form.items.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#94a3b8" }}>
                        Add products to create stock-in.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" onClick={resetDraft} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="dark" onClick={submitCreateStockIn} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Stock-In"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
