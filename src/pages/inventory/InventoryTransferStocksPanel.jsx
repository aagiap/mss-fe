import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import inventoryApi from "../../api/inventory";

const HISTORY_SIZE = 20;

const initialForm = {
  fromStoreId: "",
  toStoreId: "",
  transferDate: new Date().toISOString().split("T")[0],
  referenceNo: "",
  notes: "",
  items: [],
};

export default function InventoryTransferStocksPanel({ currentUser, stores, isStoreLocked }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [transferRows, setTransferRows] = useState([]);
  const [selectedTransferRef, setSelectedTransferRef] = useState(null);
  const [selectedTransferDetailRows, setSelectedTransferDetailRows] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [productKeyword, setProductKeyword] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [stockByProductId, setStockByProductId] = useState({});

  const storeNameById = useMemo(() => {
    const map = new Map();
    stores.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [stores]);

  const transferSummaryRows = useMemo(() => {
    const grouped = new Map();

    transferRows.forEach((row) => {
      const ref = String(row.referenceId || row.transactionId || "");
      if (!ref) return;

      if (!grouped.has(ref)) {
        grouped.set(ref, {
          transferRef: Number(ref),
          fromStoreName: "-",
          toStoreName: "-",
          totalQuantity: 0,
          lineCount: 0,
          createdAt: row.createdAt || null,
        });
      }

      const bucket = grouped.get(ref);
      bucket.createdAt = bucket.createdAt || row.createdAt || null;

      if (row.type === "TRANSFER_OUT") {
        bucket.totalQuantity += Math.abs(Number(row.quantity || 0));
        bucket.lineCount += 1;
        bucket.fromStoreName = row.storeName || `Store #${row.storeId}`;
      }
      if (row.type === "TRANSFER_IN") {
        bucket.toStoreName = row.storeName || `Store #${row.storeId}`;
      }
    });

    return [...grouped.values()].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [transferRows]);

  const loadTransferRows = async (storeIdText = "") => {
    setLoading(true);
    setError("");

    try {
      const page = await inventoryApi.getTransferMovements({
        storeId: storeIdText ? Number(storeIdText) : undefined,
        page: 0,
        size: HISTORY_SIZE,
      });
      setTransferRows(page?.content || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load transfer history.");
      setTransferRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStockSnapshotByFromStore = async (fromStoreIdText) => {
    if (!fromStoreIdText) {
      setStockByProductId({});
      return;
    }

    try {
      const inventoryRes = await inventoryApi.getItems({
        storeId: Number(fromStoreIdText),
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

  useEffect(() => {
    if (!currentUser) return;

    const preStoreId =
      Number.isFinite(Number(currentUser.storeId)) && (isStoreLocked || stores.length === 1)
        ? String(currentUser.storeId)
        : "";

    setForm((prev) => ({
      ...prev,
      fromStoreId: preStoreId,
    }));

    loadTransferRows(preStoreId);
    loadStockSnapshotByFromStore(preStoreId);
  }, [currentUser?.storeId, isStoreLocked, stores.length]);

  const searchProducts = async () => {
    const keyword = productKeyword.trim();
    if (!keyword) {
      setProductResults([]);
      return;
    }

    if (!form.fromStoreId) {
      setError("Please choose source store first.");
      return;
    }

    setSearchingProducts(true);
    setError("");

    try {
      await loadStockSnapshotByFromStore(form.fromStoreId);
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
    if (form.items.some((it) => String(it.productId) === productId)) return;

    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId,
          productName: product.name || `Product #${product.id}`,
          sku: product.barcode || product.sku || `PRD-${product.id}`,
          transferQty: "1",
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

  const openTransferDetail = async (transferRef) => {
    setDetailLoading(true);
    setError("");

    try {
      const rows = await inventoryApi.getTransferDetail(transferRef);
      setSelectedTransferRef(transferRef);
      setSelectedTransferDetailRows(rows || []);
    } catch (e) {
      setError(e.response?.data?.message || "Cannot load transfer detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const submitTransfer = async () => {
    if (!form.fromStoreId || !form.toStoreId) {
      setError("Please select source and destination stores.");
      return;
    }

    if (form.fromStoreId === form.toStoreId) {
      setError("From Store and To Store must be different.");
      return;
    }

    if (!form.transferDate) {
      setError("Please select transfer date.");
      return;
    }

    if (form.items.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    const invalidLine = form.items.find((it) => Number(it.transferQty || 0) <= 0);
    if (invalidLine) {
      setError("Transfer quantity must be > 0.");
      return;
    }

    const overStockLine = form.items.find((it) => {
      const avail = Number(stockByProductId[String(it.productId)] ?? -1);
      return avail >= 0 && Number(it.transferQty || 0) > avail;
    });
    if (overStockLine) {
      setError("Some transfer quantity is greater than available stock.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        fromStoreId: Number(form.fromStoreId),
        toStoreId: Number(form.toStoreId),
        referenceNo: form.referenceNo.trim() || null,
        transferDate: form.transferDate,
        notes: form.notes.trim() || null,
        items: form.items.map((it) => ({
          productId: Number(it.productId),
          transferQty: Number(it.transferQty),
        })),
      };

      const created = await inventoryApi.createTransfer(payload);
      const newRef = created?.transferRef;
      setSuccessMessage("Transfer created successfully.");

      const keepFrom = form.fromStoreId;
      setForm((prev) => ({ ...initialForm, fromStoreId: keepFrom, transferDate: prev.transferDate }));
      setProductKeyword("");
      setProductResults([]);
      await Promise.all([loadTransferRows(keepFrom), loadStockSnapshotByFromStore(keepFrom)]);

      if (newRef) {
        await openTransferDetail(newRef);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Create transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetDraft = () => {
    setForm((prev) => ({
      ...initialForm,
      fromStoreId: prev.fromStoreId,
      transferDate: prev.transferDate,
    }));
    setProductKeyword("");
    setProductResults([]);
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Stock Transfers</h4>
        <Button variant="outline-dark" onClick={() => loadTransferRows(form.fromStoreId || "")} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <Row className="g-3 align-items-start">
        <Col xl={7}>
          <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 style={{ margin: 0, fontWeight: 700, color: "#1b283b" }}>Transfer History</h5>
                <div style={{ width: 220 }}>
                  <Form.Select
                    value={form.fromStoreId}
                    disabled={isStoreLocked}
                    onChange={async (e) => {
                      const nextStore = e.target.value;
                      setForm((prev) => ({ ...prev, fromStoreId: nextStore }));
                      await Promise.all([loadTransferRows(nextStore), loadStockSnapshotByFromStore(nextStore)]);
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
                  <Spinner size="sm" /> Loading transfer history...
                </div>
              ) : (
                <Table responsive hover>
                  <thead style={{ background: "#f2f4f8" }}>
                    <tr>
                      <th>REF</th>
                      <th>FROM</th>
                      <th>TO</th>
                      <th style={{ textAlign: "right" }}>LINES</th>
                      <th style={{ textAlign: "right" }}>QTY</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferSummaryRows.map((row) => (
                      <tr key={row.transferRef}>
                        <td>#{row.transferRef}</td>
                        <td>{row.fromStoreName}</td>
                        <td>{row.toStoreName}</td>
                        <td style={{ textAlign: "right" }}>{row.lineCount}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{Number(row.totalQuantity || 0).toLocaleString()}</td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => openTransferDetail(row.transferRef)}>
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {transferSummaryRows.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#8a94a6", padding: 18 }}>
                          No transfer records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }} className="mt-3">
            <Card.Body>
              <h6 style={{ marginBottom: 10, fontWeight: 700, color: "#1b283b" }}>Transfer Detail</h6>
              {detailLoading && (
                <div className="d-flex align-items-center gap-2" style={{ padding: "8px 0" }}>
                  <Spinner size="sm" /> Loading detail...
                </div>
              )}

              {!detailLoading && !selectedTransferRef && <div style={{ color: "#8a94a6" }}>Select a transfer to see details.</div>}

              {!detailLoading && selectedTransferRef && (
                <>
                  <div style={{ color: "#475569", fontSize: 13, marginBottom: 8 }}>Transfer #{selectedTransferRef}</div>
                  <Table size="sm" responsive>
                    <thead>
                      <tr>
                        <th>TYPE</th>
                        <th>PRODUCT</th>
                        <th>STORE</th>
                        <th style={{ textAlign: "right" }}>QTY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTransferDetailRows || []).map((row, idx) => (
                        <tr key={`${row.transactionId || idx}-${idx}`}>
                          <td>{row.type}</td>
                          <td>{row.productName || `Product #${row.productId}`}</td>
                          <td>{row.storeName || `Store #${row.storeId}`}</td>
                          <td style={{ textAlign: "right" }}>{Number(row.quantity || 0).toLocaleString()}</td>
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
              <h5 style={{ marginBottom: 14, fontWeight: 700, color: "#1b283b" }}>Transfer Stock</h5>

              <Row className="g-2">
                <Col md={6}>
                  <Form.Label>From Store / Warehouse</Form.Label>
                  <Form.Select
                    value={form.fromStoreId}
                    disabled={isStoreLocked}
                    onChange={async (e) => {
                      const nextStore = e.target.value;
                      setForm((prev) => ({ ...prev, fromStoreId: nextStore }));
                      setProductResults([]);
                      await loadStockSnapshotByFromStore(nextStore);
                    }}
                  >
                    <option value="">Select source</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label>To Store / Warehouse</Form.Label>
                  <Form.Select value={form.toStoreId} onChange={(e) => setForm((prev) => ({ ...prev, toStoreId: e.target.value }))}>
                    <option value="">Select destination</option>
                    {stores
                      .filter((store) => String(store.id) !== String(form.fromStoreId))
                      .map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                  </Form.Select>
                </Col>

                <Col md={6}>
                  <Form.Label>Date</Form.Label>
                  <Form.Control type="date" value={form.transferDate} onChange={(e) => setForm((prev) => ({ ...prev, transferDate: e.target.value }))} />
                </Col>
                <Col md={6}>
                  <Form.Label>Ref No</Form.Label>
                  <Form.Control
                    value={form.referenceNo}
                    onChange={(e) => setForm((prev) => ({ ...prev, referenceNo: e.target.value }))}
                    placeholder="TRF-0001"
                  />
                </Col>

                <Col md={12}>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Reason for transfer or special instructions..."
                  />
                </Col>
              </Row>

              <hr />

              <div style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 8 }}>PRODUCTS SELECTION</div>

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
                    const avail = Number(stockByProductId[String(p.id)] || 0);
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
                          <div style={{ fontSize: 12, color: "#475569" }}>Avail: {avail}</div>
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
                    <th style={{ width: 76, textAlign: "right" }}>AVAIL.</th>
                    <th style={{ width: 96, textAlign: "right" }}>TRANSFER</th>
                    <th style={{ width: 62 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it) => {
                    const avail = Number(stockByProductId[String(it.productId)] || 0);
                    return (
                      <tr key={it.productId}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{it.productName}</div>
                          <div style={{ color: "#64748b", fontSize: 12 }}>{it.sku}</div>
                        </td>
                        <td style={{ textAlign: "right", verticalAlign: "middle" }}>{avail}</td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="number"
                            min={1}
                            value={it.transferQty}
                            onChange={(e) => updateProductLine(it.productId, { transferQty: e.target.value })}
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
                        Add products for transfer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" onClick={resetDraft} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="dark" onClick={submitTransfer} disabled={submitting}>
                  {submitting ? "Saving..." : "Confirm Transfer"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
