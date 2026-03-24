import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import inventoryApi from "../../api/inventory";

const HISTORY_SIZE = 5;

function toStoreFilter(currentUser, isStoreLocked, explicitStoreId = "") {
  if (explicitStoreId) return Number(explicitStoreId);
  if (isStoreLocked && currentUser?.storeId) return Number(currentUser.storeId);
  return undefined;
}

export default function InventoryOperationsPanel({ currentUser, stores, isStoreLocked }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [stockIns, setStockIns] = useState([]);
  const [stockOuts, setStockOuts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [detailModal, setDetailModal] = useState({
    open: false,
    title: "",
    mode: "",
    data: null,
  });

  const [auditStoreId, setAuditStoreId] = useState("");
  const [auditKeyword, setAuditKeyword] = useState("");
  const [auditLoadId, setAuditLoadId] = useState("");
  const [auditSession, setAuditSession] = useState(null);
  const [auditDraftRows, setAuditDraftRows] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [auditBusy, setAuditBusy] = useState(false);

  const canAudit = useMemo(() => {
    return currentUser?.role === "ROLE_MANAGER" || currentUser?.role === "ROLE_ADMIN";
  }, [currentUser?.role]);

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const storeId = toStoreFilter(currentUser, isStoreLocked);

      const [ins, outs, trfs] = await Promise.all([
        inventoryApi.getStockIns({ storeId, page: 0, size: HISTORY_SIZE }),
        inventoryApi.getStockOuts({ storeId, page: 0, size: HISTORY_SIZE }),
        inventoryApi.getTransferMovements({ storeId, page: 0, size: HISTORY_SIZE }),
      ]);

      setStockIns(ins?.content || []);
      setStockOuts(outs?.content || []);
      setTransfers(trfs?.content || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load operation flows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    if (isStoreLocked && currentUser?.storeId) {
      setAuditStoreId(String(currentUser.storeId));
    }
    loadHistory();
  }, [currentUser?.storeId, isStoreLocked]);

  const openStockInDetail = async (stockInId) => {
    setError("");
    try {
      const data = await inventoryApi.getStockInDetail(stockInId);
      setDetailModal({
        open: true,
        title: `Stock-In Detail #${stockInId}`,
        mode: "stock-in",
        data,
      });
    } catch (e) {
      setError(e.response?.data?.message || "Cannot load stock-in detail.");
    }
  };

  const openStockOutDetail = async (stockOutId) => {
    setError("");
    try {
      const data = await inventoryApi.getStockOutDetail(stockOutId);
      setDetailModal({
        open: true,
        title: `Stock-Out Detail #${stockOutId}`,
        mode: "movement",
        data,
      });
    } catch (e) {
      setError(e.response?.data?.message || "Cannot load stock-out detail.");
    }
  };

  const openTransferDetail = async (transferRef) => {
    setError("");
    try {
      const data = await inventoryApi.getTransferDetail(transferRef);
      setDetailModal({
        open: true,
        title: `Transfer Detail #${transferRef}`,
        mode: "movement",
        data,
      });
    } catch (e) {
      setError(e.response?.data?.message || "Cannot load transfer detail.");
    }
  };

  const startAudit = async () => {
    if (!canAudit) {
      setError("You do not have permission to start audit.");
      return;
    }

    if (!auditStoreId) {
      setError("Please select store for audit.");
      return;
    }

    setAuditBusy(true);
    setError("");
    setMessage("");
    setAuditSummary(null);

    try {
      const session = await inventoryApi.startAudit({
        storeId: Number(auditStoreId),
        searchKeyword: auditKeyword.trim() || null,
      });

      setAuditSession(session);
      setAuditDraftRows(
        (session?.items || []).map((item) => ({
          inventoryId: item.inventoryId,
          productId: item.productId,
          systemQty: item.systemQty ?? 0,
          countedQty: item.countedQty ?? item.systemQty ?? 0,
          rowNotes: item.rowNotes || "",
        }))
      );
      setMessage(`Started audit #${session?.auditId || ""}`);
    } catch (e) {
      setError(e.response?.data?.message || "Start audit failed.");
    } finally {
      setAuditBusy(false);
    }
  };

  const loadAuditSessionById = async () => {
    if (!auditLoadId.trim()) {
      setError("Please input audit ID.");
      return;
    }

    setAuditBusy(true);
    setError("");
    setMessage("");

    try {
      const session = await inventoryApi.getAuditSession(Number(auditLoadId.trim()));
      setAuditSession(session);
      setAuditDraftRows(
        (session?.items || []).map((item) => ({
          inventoryId: item.inventoryId,
          productId: item.productId,
          systemQty: item.systemQty ?? 0,
          countedQty: item.countedQty ?? item.systemQty ?? 0,
          rowNotes: item.rowNotes || "",
        }))
      );
      setMessage(`Loaded audit #${session?.auditId || ""}`);
    } catch (e) {
      setError(e.response?.data?.message || "Load audit session failed.");
    } finally {
      setAuditBusy(false);
    }
  };

  const finalizeAudit = async () => {
    if (!canAudit) {
      setError("You do not have permission to finalize audit.");
      return;
    }

    if (!auditSession?.auditId || auditDraftRows.length === 0) {
      setError("No audit session data to finalize.");
      return;
    }

    setAuditBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        items: auditDraftRows.map((row) => ({
          inventoryId: row.inventoryId,
          countedQty: Math.max(0, Number(row.countedQty || 0)),
          rowNotes: row.rowNotes || null,
        })),
      };

      const result = await inventoryApi.finalizeAudit(auditSession.auditId, payload);
      setAuditSummary(result);
      setMessage(`Audit #${auditSession.auditId} finalized successfully.`);

      const refreshed = await inventoryApi.getAuditSession(auditSession.auditId);
      setAuditSession(refreshed);
    } catch (e) {
      setError(e.response?.data?.message || "Finalize audit failed.");
    } finally {
      setAuditBusy(false);
    }
  };

  const updateDraftRow = (inventoryId, patch) => {
    setAuditDraftRows((prev) =>
      prev.map((row) => (row.inventoryId === inventoryId ? { ...row, ...patch } : row))
    );
  };

  const detailRows = Array.isArray(detailModal.data) ? detailModal.data : detailModal.data?.items || [];

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }} className="mt-3">
        <Card.Body>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Operation Detail Flows</h5>
            <Button size="sm" variant="outline-dark" onClick={loadHistory} disabled={loading}>
              {loading ? "Loading..." : "Refresh Flows"}
            </Button>
          </div>

          <Row className="g-3">
            <Col md={4}>
              <Card style={{ borderRadius: 10, borderColor: "#e3e8f0", height: "100%" }}>
                <Card.Body>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Stock-In History</div>
                  <Table size="sm" responsive>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockIns.map((item) => (
                        <tr key={item.stockInId}>
                          <td>#{item.stockInId}</td>
                          <td>{item.totalQuantity}</td>
                          <td>
                            <Button size="sm" variant="link" style={{ padding: 0 }} onClick={() => openStockInDetail(item.stockInId)}>
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {stockIns.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ color: "#94a3b8", textAlign: "center" }}>No records</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card style={{ borderRadius: 10, borderColor: "#e3e8f0", height: "100%" }}>
                <Card.Body>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Stock-Out History</div>
                  <Table size="sm" responsive>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockOuts.map((item) => (
                        <tr key={item.stockOutId}>
                          <td>#{item.stockOutId}</td>
                          <td>{item.totalQuantity}</td>
                          <td>
                            <Button size="sm" variant="link" style={{ padding: 0 }} onClick={() => openStockOutDetail(item.stockOutId)}>
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {stockOuts.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ color: "#94a3b8", textAlign: "center" }}>No records</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card style={{ borderRadius: 10, borderColor: "#e3e8f0", height: "100%" }}>
                <Card.Body>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Transfer History</div>
                  <Table size="sm" responsive>
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((item) => (
                        <tr key={item.transactionId}>
                          <td>#{item.referenceId || item.transactionId}</td>
                          <td>{Math.abs(Number(item.quantity || 0))}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="link"
                              style={{ padding: 0 }}
                              onClick={() => openTransferDetail(item.referenceId || item.transactionId)}
                            >
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {transfers.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ color: "#94a3b8", textAlign: "center" }}>No records</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }} className="mt-3">
        <Card.Body>
          <h5 style={{ fontWeight: 700, marginBottom: 14, color: "#16253a" }}>Audit Flows</h5>

          <Row className="g-2 align-items-end mb-3">
            <Col md={3}>
              <Form.Label>Store</Form.Label>
              <Form.Select value={auditStoreId} disabled={isStoreLocked} onChange={(e) => setAuditStoreId(e.target.value)}>
                <option value="">Choose store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Search Keyword</Form.Label>
              <Form.Control value={auditKeyword} onChange={(e) => setAuditKeyword(e.target.value)} placeholder="Optional product keyword" />
            </Col>
            <Col md={2}>
              <Button variant="dark" onClick={startAudit} disabled={auditBusy || !canAudit}>
                Start Audit
              </Button>
            </Col>
            <Col md={3}>
              <Form.Label>Load Audit By ID</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control value={auditLoadId} onChange={(e) => setAuditLoadId(e.target.value)} placeholder="Audit ID" />
                <Button variant="outline-secondary" onClick={loadAuditSessionById} disabled={auditBusy}>
                  Load
                </Button>
              </div>
            </Col>
          </Row>

          {auditSession && (
            <>
              <div style={{ marginBottom: 8, color: "#475569", fontSize: 13 }}>
                Audit #{auditSession.auditId} | Store #{auditSession.storeId} | Items: {auditSession.totalItems}
              </div>

              <Table responsive size="sm">
                <thead>
                  <tr>
                    <th>Inventory ID</th>
                    <th>Product ID</th>
                    <th>System Qty</th>
                    <th>Counted Qty</th>
                    <th>Difference</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditDraftRows.map((row) => {
                    const diff = Number(row.countedQty || 0) - Number(row.systemQty || 0);
                    return (
                      <tr key={row.inventoryId}>
                        <td>{row.inventoryId}</td>
                        <td>{row.productId}</td>
                        <td>{row.systemQty}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            value={row.countedQty}
                            onChange={(e) => updateDraftRow(row.inventoryId, { countedQty: e.target.value })}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td style={{ fontWeight: 700, color: diff === 0 ? "#334155" : diff > 0 ? "#15803d" : "#b91c1c" }}>{diff}</td>
                        <td>
                          <Form.Control
                            value={row.rowNotes}
                            onChange={(e) => updateDraftRow(row.inventoryId, { rowNotes: e.target.value })}
                            placeholder="Optional"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              <div className="d-flex justify-content-end">
                <Button variant="dark" onClick={finalizeAudit} disabled={auditBusy || !canAudit}>
                  {auditBusy ? "Processing..." : "Finalize Audit"}
                </Button>
              </div>
            </>
          )}

          {auditSummary && (
            <Alert variant="info" className="mt-3 mb-0">
              Finalized: adjusted {auditSummary.adjustedCount}, matched {auditSummary.matchedCount}, missing {auditSummary.missingCount}, extra {auditSummary.extraCount}.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Modal show={detailModal.open} onHide={() => setDetailModal({ open: false, title: "", mode: "", data: null })} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{detailModal.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailModal.mode === "stock-in" && detailModal.data && (
            <>
              <div style={{ marginBottom: 10, color: "#475569" }}>
                Store #{detailModal.data.storeId} | Supplier #{detailModal.data.supplierId || "-"}
              </div>
              <Table size="sm" responsive>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailModal.data.items || []).map((it, idx) => (
                    <tr key={`${it.productId}-${idx}`}>
                      <td>{it.productId}</td>
                      <td>{it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}

          {detailModal.mode === "movement" && (
            <Table size="sm" responsive>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Store</th>
                  <th>Qty</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(detailRows || []).map((mv, idx) => (
                  <tr key={`${mv.transactionId || idx}-${idx}`}>
                    <td>{mv.type}</td>
                    <td>{mv.productName || `#${mv.productId}`}</td>
                    <td>{mv.storeName || `#${mv.storeId}`}</td>
                    <td>{mv.quantity}</td>
                    <td>{mv.createdAt ? new Date(mv.createdAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
