import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import inventoryApi from "../../api/inventory";

const HISTORY_SIZE = 8;

const initialForm = {
  storeId: "",
  reason: "SALE",
  notes: "",
  items: [],
};

const reasonOptions = [
  "SALE",
  "DAMAGE",
  "EXPIRED",
  "INTERNAL_USE",
  "TRANSFER_OUT",
  "STOCK_COUNT_ADJUSTMENT_OUT",
  "SUPPLIER_RETURN",
];

function todayDateText() {
  return new Date().toISOString().split("T")[0];
}

export default function InventoryStockOutPanel({ currentUser, stores, isStoreLocked }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [stockOutPage, setStockOutPage] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [todayOverview, setTodayOverview] = useState(null);
  const [selectedStockOutMeta, setSelectedStockOutMeta] = useState(null);
  const [selectedDetailRows, setSelectedDetailRows] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [productKeyword, setProductKeyword] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [stockByProductId, setStockByProductId] = useState({});

  const storeNameById = useMemo(() => {
    const map = new Map();
    stores.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [stores]);

  const currentStoreId = useMemo(() => {
    if (form.storeId) return form.storeId;
    if (isStoreLocked && currentUser?.storeId) return String(currentUser.storeId);
    return "";
  }, [form.storeId, isStoreLocked, currentUser?.storeId]);

  const historyTotalQty = useMemo(() => {
    return (stockOutPage.content || []).reduce((sum, row) => sum + Number(row.totalQuantity || 0), 0);
  }, [stockOutPage.content]);

  const loadStockSnapshotByStore = async (storeIdText) => {
    if (!storeIdText) {
      setStockByProductId({});
      return;
    }

    try {
      const inventoryRes = await inventoryApi.getItems({
        storeId: Number(storeIdText),
        page: 0,
        size: 2000,
      });

      const stockMap = {};
      (inventoryRes?.content || []).forEach((item) => {
        if (!item?.productId) return;
        stockMap[String(item.productId)] = Number(item.quantity || 0);
      });
      setStockByProductId(stockMap);
    } catch {
      setStockByProductId({});
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

  const loadStockOuts = async (page = 0, storeIdText = "") => {
    setLoading(true);
    setError("");

    try {
      const data = await inventoryApi.getStockOuts({
        storeId: storeIdText ? Number(storeIdText) : undefined,
        page,
        size: HISTORY_SIZE,
      });

      setStockOutPage(
        data || {
          content: [],
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
        }
      );
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load stock-out history.");
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
    loadStockOuts(0, preStoreId);
    loadTodayOverview(preStoreId);
    loadStockSnapshotByStore(preStoreId);
  }, [currentUser?.storeId, isStoreLocked, stores.length]);

  const searchProducts = async () => {
    const keyword = productKeyword.trim();
    if (!keyword) {
      setProductResults([]);
      return;
    }

    if (!currentStoreId) {
      setError("Please select store first.");
      return;
    }

    setSearchingProducts(true);
    setError("");

    try {
      await loadStockSnapshotByStore(currentStoreId);
      const products = await inventoryApi.searchProductsByKeyword(keyword);
      setProductResults(products);
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
          quantityOut: "1",
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

  const openStockOutDetail = async (row) => {
    setDetailLoading(true);
    setError("");

    try {
      const data = await inventoryApi.getStockOutDetail(row.stockOutId);
      setSelectedStockOutMeta(row);
      setSelectedDetailRows(data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Cannot load stock-out detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const submitCreateStockOut = async () => {
    if (!form.storeId) {
      setError("Please choose store.");
      return;
    }

    if (form.items.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    const invalidLine = form.items.find((it) => Number(it.quantityOut || 0) <= 0);
    if (invalidLine) {
      setError("Quantity out must be > 0.");
      return;
    }

    const overStockLine = form.items.find((it) => {
      const stock = Number(stockByProductId[String(it.productId)] ?? -1);
      return stock >= 0 && Number(it.quantityOut || 0) > stock;
    });
    if (overStockLine) {
      setError("Some quantity out is greater than available stock.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        storeId: Number(form.storeId),
        reason: form.reason,
        notes: form.notes.trim() || null,
        items: form.items.map((it) => ({
          productId: Number(it.productId),
          quantityOut: Number(it.quantityOut),
        })),
      };

      await inventoryApi.createStockOut(payload);
      setSuccessMessage("Stock-out created successfully.");

      const keepStoreId = form.storeId;
      setForm({ ...initialForm, storeId: keepStoreId });
      setProductKeyword("");
      setProductResults([]);
      setStockByProductId({});

      await Promise.all([loadStockOuts(0, keepStoreId), loadTodayOverview(keepStoreId)]);
    } catch (e) {
      setError(e.response?.data?.message || "Create stock-out failed.");
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
    setStockByProductId({});
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Stock-Out Workspace</h4>
        <Button variant="outline-dark" onClick={() => loadStockOuts(stockOutPage.currentPage || 0, currentStoreId)} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TODAY STOCK OUT</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{Number(todayOverview?.todayStockOut || 0).toLocaleString()}</div>
          </Card>
        </Col>
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>STOCK-OUT DOCUMENTS</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{Number(stockOutPage.totalElements || 0).toLocaleString()}</div>
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
                <h5 style={{ margin: 0, fontWeight: 700, color: "#1b283b" }}>Stock-Out History</h5>
                <div style={{ width: 220 }}>
                  <Form.Select
                    value={form.storeId}
                    disabled={isStoreLocked}
                    onChange={async (e) => {
                      const nextStore = e.target.value;
                      setForm((prev) => ({ ...prev, storeId: nextStore }));
                      setProductResults([]);
                      await Promise.all([loadStockOuts(0, nextStore), loadTodayOverview(nextStore), loadStockSnapshotByStore(nextStore)]);
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
                  <Spinner size="sm" /> Loading stock-out history...
                </div>
              ) : (
                <Table responsive hover>
                  <thead style={{ background: "#f2f4f8" }}>
                    <tr>
                      <th>ID</th>
                      <th>STORE</th>
                      <th>REASON</th>
                      <th style={{ textAlign: "right" }}>LINES</th>
                      <th style={{ textAlign: "right" }}>QTY</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stockOutPage.content || []).map((row) => (
                      <tr key={row.stockOutId}>
                        <td>#{row.stockOutId}</td>
                        <td>{storeNameById.get(String(row.storeId)) || `Store #${row.storeId}`}</td>
                        <td>{row.reason || "-"}</td>
                        <td style={{ textAlign: "right" }}>{row.totalItems}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{Number(row.totalQuantity || 0).toLocaleString()}</td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => openStockOutDetail(row)}>
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {stockOutPage.content?.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#8a94a6", padding: 18 }}>
                          No stock-out records found.
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
                  disabled={(stockOutPage.currentPage || 0) === 0}
                  onClick={() => loadStockOuts((stockOutPage.currentPage || 0) - 1, currentStoreId)}
                >
                  &lt;
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  disabled={(stockOutPage.currentPage || 0) >= (stockOutPage.totalPages || 1) - 1 || (stockOutPage.totalPages || 0) === 0}
                  onClick={() => loadStockOuts((stockOutPage.currentPage || 0) + 1, currentStoreId)}
                >
                  &gt;
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }} className="mt-3">
            <Card.Body>
              <h6 style={{ marginBottom: 10, fontWeight: 700, color: "#1b283b" }}>Stock-Out Detail</h6>
              {detailLoading && (
                <div className="d-flex align-items-center gap-2" style={{ padding: "8px 0" }}>
                  <Spinner size="sm" /> Loading detail...
                </div>
              )}

              {!detailLoading && !selectedStockOutMeta && <div style={{ color: "#8a94a6" }}>Select a stock-out row to see details.</div>}

              {!detailLoading && selectedStockOutMeta && (
                <>
                  <div style={{ color: "#475569", fontSize: 13, marginBottom: 8 }}>
                    Stock-Out #{selectedStockOutMeta.stockOutId} | Store: {storeNameById.get(String(selectedStockOutMeta.storeId)) || "Unknown Store"} | Reason: {selectedStockOutMeta.reason || "-"}
                  </div>
                  <Table size="sm" responsive>
                    <thead>
                      <tr>
                        <th>PRODUCT NAME</th>
                        <th>BARCODE</th>
                        <th style={{ textAlign: "right" }}>QTY OUT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedDetailRows || []).map((mv, idx) => (
                        <tr key={`${mv.transactionId || idx}-${idx}`}>
                          <td>{mv.productName || `Product #${mv.productId}`}</td>
                          <td>{mv.sku || `PRD-${mv.productId}`}</td>
                          <td style={{ textAlign: "right" }}>{Math.abs(Number(mv.quantity || 0)).toLocaleString()}</td>
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
              <h5 style={{ marginBottom: 14, fontWeight: 700, color: "#1b283b" }}>Create Stock-Out</h5>

              <Row className="g-2">
                <Col md={6}>
                  <Form.Label>Store</Form.Label>
                  <Form.Select
                    value={form.storeId}
                    disabled={isStoreLocked}
                    onChange={async (e) => {
                      const nextStore = e.target.value;
                      setForm((prev) => ({ ...prev, storeId: nextStore }));
                      setProductResults([]);
                      await loadStockSnapshotByStore(nextStore);
                    }}
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
                    placeholder="Enter additional information..."
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
                  {productResults.map((p) => {
                    const stockQty = Number(stockByProductId[String(p.id)] || 0);
                    return (
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
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ fontSize: 12, color: "#475569" }}>Stock: {stockQty}</div>
                          <Button size="sm" variant="light" onClick={() => addProductLine(p)}>
                            Add
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Table size="sm" responsive style={{ marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th style={{ width: 80, textAlign: "right" }}>STOCK</th>
                    <th style={{ width: 96, textAlign: "right" }}>QTY OUT</th>
                    <th style={{ width: 62 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it) => {
                    const stockQty = Number(stockByProductId[String(it.productId)] || 0);
                    return (
                      <tr key={it.productId}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{it.productName}</div>
                          <div style={{ color: "#64748b", fontSize: 12 }}>{it.sku}</div>
                        </td>
                        <td style={{ textAlign: "right", verticalAlign: "middle" }}>{stockQty}</td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min={1}
                            value={it.quantityOut}
                            onChange={(e) => updateProductLine(it.productId, { quantityOut: e.target.value })}
                            style={{ textAlign: "right" }}
                          />
                        </td>
                        <td>
                          <Button size="sm" variant="link" style={{ color: "#be123c", padding: 0 }} onClick={() => removeProductLine(it.productId)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {form.items.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#94a3b8" }}>
                        Add products to create stock-out.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" onClick={resetDraft} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="dark" onClick={submitCreateStockOut} disabled={submitting}>
                  {submitting ? "Saving..." : "Create Stock-Out"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
