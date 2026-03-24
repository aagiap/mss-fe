import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import api from "../../api/api";
import inventoryApi from "../../api/inventory";

const HISTORY_SIZE = 200;

function statusVariant(status) {
  if (status === "MISSING") return "dark";
  if (status === "EXTRA") return "secondary";
  return "light";
}

export default function InventoryPerformAuditPanel({ currentUser, stores, isStoreLocked }) {
  const [auditStoreId, setAuditStoreId] = useState("");
  const [auditKeyword, setAuditKeyword] = useState("");
  const [auditLoadId, setAuditLoadId] = useState("");

  const [auditSession, setAuditSession] = useState(null);
  const [auditDraftRows, setAuditDraftRows] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);

  const [auditHistory, setAuditHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [busy, setBusy] = useState(false);

  const [productMetaById, setProductMetaById] = useState({});

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canAudit = useMemo(() => {
    return currentUser?.role === "ROLE_MANAGER" || currentUser?.role === "ROLE_ADMIN";
  }, [currentUser?.role]);

  const prefillDraftFromSession = (session) => {
    setAuditSession(session);
    setAuditDraftRows(
      (session?.items || []).map((item) => ({
        inventoryId: item.inventoryId,
        productId: item.productId,
        systemQty: item.systemQty ?? 0,
        countedQty: item.countedQty ?? item.systemQty ?? 0,
        rowNotes: item.rowNotes || "",
        status: item.status || null,
      }))
    );
  };

  const ensureProductMeta = async (productIds) => {
    const unique = [...new Set((productIds || []).filter(Boolean).map((id) => String(id)))];
    const missing = unique.filter((id) => !productMetaById[id]);
    if (missing.length === 0) return;

    const entries = await Promise.all(
      missing.map(async (id) => {
        try {
          const res = await api.get(`/product/${id}`);
          return [id, {
            name: res.data?.data?.name || `Product #${id}`,
            sku: res.data?.data?.barcode || `PRD-${id}`,
          }];
        } catch {
          return [id, { name: `Product #${id}`, sku: `PRD-${id}` }];
        }
      })
    );

    setProductMetaById((prev) => {
      const next = { ...prev };
      entries.forEach(([id, meta]) => {
        next[id] = meta;
      });
      return next;
    });
  };

  const loadAuditHistory = async (storeIdText = auditStoreId) => {
    setLoadingHistory(true);
    setError("");

    try {
      const page = await inventoryApi.getStockMovements({
        storeId: storeIdText ? Number(storeIdText) : undefined,
        type: "ADJUSTMENT",
        page: 0,
        size: HISTORY_SIZE,
      });

      const rows = page?.content || [];
      const grouped = new Map();

      rows.forEach((row) => {
        const ref = Number(row.referenceId || 0);
        if (!ref) return;

        if (!grouped.has(ref)) {
          grouped.set(ref, {
            auditId: ref,
            storeName: row.storeName || `Store #${row.storeId}`,
            startedAt: row.createdAt || null,
            totalItems: 0,
            matchedCount: 0,
            missingCount: 0,
            extraCount: 0,
            adjustedCount: 0,
          });
        }

        const bucket = grouped.get(ref);
        bucket.totalItems += 1;

        const diff = Number(row.quantity || 0);
        if (diff === 0) bucket.matchedCount += 1;
        if (diff < 0) {
          bucket.missingCount += 1;
          bucket.adjustedCount += 1;
        }
        if (diff > 0) {
          bucket.extraCount += 1;
          bucket.adjustedCount += 1;
        }
      });

      const history = [...grouped.values()]
        .filter((item) => item.auditId >= 1_000_000_000_000)
        .sort((a, b) => {
          const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
          const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
          return bTime - aTime;
        });

      setAuditHistory(history);
    } catch (e) {
      setError(e.response?.data?.message || "Cannot load audit history.");
      setAuditHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const preStore = isStoreLocked && currentUser?.storeId ? String(currentUser.storeId) : "";
    setAuditStoreId(preStore);
    loadAuditHistory(preStore);
  }, [currentUser?.storeId, isStoreLocked]);

  const startAudit = async () => {
    if (!canAudit) {
      setError("You do not have permission to start audit.");
      return;
    }

    if (!auditStoreId) {
      setError("Please select store for audit.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    setAuditSummary(null);

    try {
      const session = await inventoryApi.startAudit({
        storeId: Number(auditStoreId),
        searchKeyword: auditKeyword.trim() || null,
      });

      await ensureProductMeta((session?.items || []).map((i) => i.productId));
      prefillDraftFromSession(session);
      setMessage(`Started audit #${session?.auditId || ""}`);
    } catch (e) {
      setError(e.response?.data?.message || "Start audit failed.");
    } finally {
      setBusy(false);
    }
  };

  const loadAuditSessionById = async (manualId = null) => {
    const targetId = manualId || Number(auditLoadId.trim());
    if (!targetId) {
      setError("Please input audit ID.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const session = await inventoryApi.getAuditSession(Number(targetId));
      await ensureProductMeta((session?.items || []).map((i) => i.productId));
      prefillDraftFromSession(session);
      setAuditLoadId(String(targetId));
      setMessage(`Loaded audit #${session?.auditId || ""}`);
    } catch (e) {
      setError(e.response?.data?.message || "Load audit session failed.");
    } finally {
      setBusy(false);
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

    setBusy(true);
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
      await ensureProductMeta((refreshed?.items || []).map((i) => i.productId));
      prefillDraftFromSession(refreshed);
      await loadAuditHistory(auditStoreId);
    } catch (e) {
      setError(e.response?.data?.message || "Finalize audit failed.");
    } finally {
      setBusy(false);
    }
  };

  const updateDraftRow = (inventoryId, patch) => {
    setAuditDraftRows((prev) => prev.map((row) => (row.inventoryId === inventoryId ? { ...row, ...patch } : row)));
  };

  const totalCounted = useMemo(() => {
    return auditDraftRows.reduce((sum, row) => sum + Number(row.countedQty || 0), 0);
  }, [auditDraftRows]);

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Perform Audit</h4>
        <div className="d-flex gap-2">
          <Button variant="outline-dark" onClick={() => loadAuditHistory(auditStoreId)} disabled={loadingHistory}>
            {loadingHistory ? "Loading..." : "Refresh History"}
          </Button>
          <Button variant="dark" onClick={finalizeAudit} disabled={busy || !canAudit || !auditSession}>
            {busy ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card body className="mb-3" style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
        <Row className="g-2 align-items-end">
          <Col md={3}>
            <Form.Label>Store</Form.Label>
            <Form.Select value={auditStoreId} disabled={isStoreLocked} onChange={(e) => setAuditStoreId(e.target.value)}>
              <option value="">Choose store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Keyword</Form.Label>
            <Form.Control value={auditKeyword} onChange={(e) => setAuditKeyword(e.target.value)} placeholder="Product keyword" />
          </Col>
          <Col md={2}>
            <Button variant="dark" onClick={startAudit} disabled={busy || !canAudit}>Start Audit</Button>
          </Col>
          <Col md={3}>
            <Form.Label>Load Audit ID</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control value={auditLoadId} onChange={(e) => setAuditLoadId(e.target.value)} placeholder="Audit ID" />
              <Button variant="outline-secondary" onClick={() => loadAuditSessionById()} disabled={busy}>Load</Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }} className="mb-3">
        <Card.Body>
          <h5 style={{ marginBottom: 12, fontWeight: 700, color: "#1b283b" }}>Inventory Audit Sheet</h5>

          {auditSession ? (
            <>
              <div style={{ marginBottom: 8, color: "#475569", fontSize: 13 }}>
                Audit #{auditSession.auditId} | Store #{auditSession.storeId} | Items: {auditSession.totalItems} | Sum Counted: {totalCounted}
              </div>

              <Table responsive>
                <thead style={{ background: "#f2f4f8" }}>
                  <tr>
                    <th>PRODUCT NAME</th>
                    <th>BARCODE</th>
                    <th>SYSTEM QTY</th>
                    <th>COUNTED QTY</th>
                    <th>DIFFERENCE</th>
                    <th>STATUS</th>
                    <th>NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {auditDraftRows.map((row) => {
                    const diff = Number(row.countedQty || 0) - Number(row.systemQty || 0);
                    const status = diff === 0 ? "MATCH" : diff > 0 ? "EXTRA" : "MISSING";
                    const meta = productMetaById[String(row.productId)] || { name: `Product #${row.productId}`, sku: `PRD-${row.productId}` };

                    return (
                      <tr key={row.inventoryId}>
                        <td style={{ fontWeight: 700 }}>{meta.name}</td>
                        <td>{meta.sku}</td>
                        <td>{row.systemQty}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            value={row.countedQty}
                            onChange={(e) => updateDraftRow(row.inventoryId, { countedQty: e.target.value })}
                            style={{ minWidth: 94 }}
                          />
                        </td>
                        <td style={{ fontWeight: 700, color: diff === 0 ? "#334155" : diff > 0 ? "#15803d" : "#b91c1c" }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td>
                          <Badge bg={statusVariant(status)} style={{ color: status === "MATCH" ? "#1f2937" : "#fff", border: status === "MATCH" ? "1px solid #cbd5e1" : "none" }}>
                            {status}
                          </Badge>
                        </td>
                        <td>
                          <Form.Control
                            value={row.rowNotes}
                            onChange={(e) => updateDraftRow(row.inventoryId, { rowNotes: e.target.value })}
                            placeholder="Notes"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </>
          ) : (
            <div style={{ color: "#8a94a6" }}>Start or load an audit session to begin counting.</div>
          )}
        </Card.Body>
      </Card>

      <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
        <Card.Body>
          <h5 style={{ marginBottom: 12, fontWeight: 700, color: "#1b283b" }}>Audit History</h5>

          {loadingHistory ? (
            <div className="d-flex align-items-center gap-2" style={{ padding: "16px 0" }}>
              <Spinner size="sm" /> Loading audit history...
            </div>
          ) : (
            <Table responsive hover>
              <thead style={{ background: "#f2f4f8" }}>
                <tr>
                  <th>AUDIT ID</th>
                  <th>STORE</th>
                  <th>ITEMS</th>
                  <th>MATCH</th>
                  <th>MISSING</th>
                  <th>EXTRA</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {auditHistory.map((item) => (
                  <tr key={item.auditId}>
                    <td>#{item.auditId}</td>
                    <td>{item.storeName}</td>
                    <td>{item.totalItems}</td>
                    <td>{item.matchedCount}</td>
                    <td>{item.missingCount}</td>
                    <td>{item.extraCount}</td>
                    <td>
                      <Button size="sm" variant="outline-secondary" onClick={() => loadAuditSessionById(item.auditId)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
                {auditHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#8a94a6", padding: 18 }}>
                      No finalized audit history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {auditSummary && (
        <Alert variant="info" className="mt-3 mb-0">
          Finalized: adjusted {auditSummary.adjustedCount}, matched {auditSummary.matchedCount}, missing {auditSummary.missingCount}, extra {auditSummary.extraCount}.
        </Alert>
      )}
    </>
  );
}
