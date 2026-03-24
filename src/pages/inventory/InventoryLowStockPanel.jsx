import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import inventoryApi from "../../api/inventory";

const PAGE_SIZE = 10;

const initialFilters = {
  keyword: "",
  storeId: "",
  thresholdLevel: "ALL",
  page: 0,
  size: PAGE_SIZE,
};

export default function InventoryLowStockPanel({ currentUser, stores, isStoreLocked, onRestock }) {
  const [filters, setFilters] = useState(initialFilters);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    totalLowStock: 0,
    criticalCount: 0,
    warningCount: 0,
  });

  const [pageData, setPageData] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const loadLowStock = async (override = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        keyword: override.keyword || undefined,
        storeId: override.storeId ? Number(override.storeId) : undefined,
        thresholdLevel: override.thresholdLevel && override.thresholdLevel !== "ALL" ? override.thresholdLevel : undefined,
        page: override.page,
        size: override.size,
      };

      const [summaryRes, itemsRes] = await Promise.all([
        inventoryApi.getLowStockSummary(params),
        inventoryApi.getLowStockItems(params),
      ]);

      setSummary(
        summaryRes || {
          totalLowStock: 0,
          criticalCount: 0,
          warningCount: 0,
        }
      );

      setPageData(
        itemsRes || {
          content: [],
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
        }
      );
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load low stock alerts.");
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

    const next = {
      ...initialFilters,
      storeId: preStoreId,
    };

    setFilters(next);
    setSearchKeyword("");
    loadLowStock(next);
  }, [currentUser?.storeId, isStoreLocked, stores.length]);

  const applyFilters = async () => {
    const next = {
      ...filters,
      keyword: searchKeyword.trim(),
      page: 0,
    };
    setFilters(next);
    await loadLowStock(next);
  };

  const clearFilters = async () => {
    const lockedStore = isStoreLocked && currentUser?.storeId ? String(currentUser.storeId) : "";
    const next = {
      ...initialFilters,
      storeId: lockedStore,
    };
    setFilters(next);
    setSearchKeyword("");
    await loadLowStock(next);
  };

  const goToPage = async (page) => {
    const bounded = Math.max(0, Math.min(page, Math.max(0, (pageData.totalPages || 1) - 1)));
    const next = { ...filters, page: bounded };
    setFilters(next);
    await loadLowStock(next);
  };

  const exportCsv = () => {
    const rows = pageData.content || [];
    const header = ["product", "barcode", "store", "current_stock", "min_level", "supplier", "severity"];

    const toCell = (value) => {
      const text = value == null ? "" : String(value);
      return `"${text.replaceAll('"', '""')}"`;
    };

    const lines = rows.map((row) => [
      toCell(row.productName || `Product #${row.productId}`),
      toCell(row.sku || "-"),
      toCell(row.storeName || `Store #${row.storeId}`),
      toCell(row.currentStock ?? 0),
      toCell(row.minLevel ?? 0),
      toCell(row.supplierName || "-"),
      toCell(row.severity || "-"),
    ]);

    const csv = [header.join(","), ...lines.map((line) => line.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "low-stock-alerts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityLabel = useMemo(() => {
    return {
      CRITICAL: "Critical",
      WARNING: "Warning",
    };
  }, []);

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Low Stock Alert</h4>
        <Button variant="outline-dark" onClick={exportCsv} disabled={(pageData.content || []).length === 0}>
          Export CSV
        </Button>
      </div>

      <Row className="g-3 mb-3">
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TOTAL LOW STOCK</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{Number(summary.totalLowStock || 0).toLocaleString()}</div>
          </Card>
        </Col>
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>CRITICAL</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{Number(summary.criticalCount || 0).toLocaleString()}</div>
          </Card>
        </Col>
        <Col md={4}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>WARNING</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{Number(summary.warningCount || 0).toLocaleString()}</div>
          </Card>
        </Col>
      </Row>

      <Card body className="mb-3" style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
        <Row className="g-2 align-items-center">
          <Col md={6}>
            <Form.Control
              placeholder="Search products..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={filters.storeId}
              disabled={isStoreLocked}
              onChange={(e) => setFilters((prev) => ({ ...prev, storeId: e.target.value }))}
            >
              <option value="">Store: All</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select value={filters.thresholdLevel} onChange={(e) => setFilters((prev) => ({ ...prev, thresholdLevel: e.target.value }))}>
              <option value="ALL">Threshold: All</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
            </Form.Select>
          </Col>
        </Row>
        <div className="d-flex gap-2 mt-2">
          <Button size="sm" variant="dark" onClick={applyFilters}>Apply</Button>
          <Button size="sm" variant="outline-secondary" onClick={clearFilters}>Clear</Button>
        </div>
      </Card>

      <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
        <Card.Body style={{ paddingBottom: 12 }}>
          {loading ? (
            <div className="d-flex align-items-center gap-2" style={{ padding: "26px 0" }}>
              <Spinner size="sm" /> Loading low stock table...
            </div>
          ) : (
            <Table hover responsive>
              <thead style={{ background: "#f2f4f8" }}>
                <tr>
                  <th>PRODUCT</th>
                  <th>STORE</th>
                  <th>CURRENT STOCK</th>
                  <th>MIN LEVEL</th>
                  <th>SUPPLIER</th>
                  <th>SEVERITY</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {(pageData.content || []).map((row) => (
                  <tr key={row.inventoryId || `${row.productId}-${row.storeId}`}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{row.productName || `Product #${row.productId}`}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.sku || "-"}</div>
                    </td>
                    <td>{row.storeName || `Store #${row.storeId}`}</td>
                    <td style={{ fontWeight: 700 }}>{Number(row.currentStock || 0).toLocaleString()}</td>
                    <td>{Number(row.minLevel || 0).toLocaleString()}</td>
                    <td>{row.supplierName || "-"}</td>
                    <td>{severityLabel[row.severity] || row.severity || "-"}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="dark"
                        onClick={() =>
                          onRestock?.({
                            productId: row.productId,
                            storeId: row.storeId,
                            lowStockThreshold: row.minLevel,
                          })
                        }
                      >
                        Restock
                      </Button>
                    </td>
                  </tr>
                ))}
                {pageData.content?.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#8a94a6", padding: 20 }}>
                      No low stock items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}

          <div className="d-flex align-items-center justify-content-between" style={{ color: "#7a8598", fontSize: 13 }}>
            <div>
              Showing {pageData.totalElements === 0 ? 0 : (pageData.currentPage || 0) * PAGE_SIZE + 1} to {Math.min(((pageData.currentPage || 0) + 1) * PAGE_SIZE, pageData.totalElements || 0)} of {pageData.totalElements || 0} items
            </div>
            <div className="d-flex gap-1 align-items-center">
              <Button size="sm" variant="light" disabled={(pageData.currentPage || 0) === 0} onClick={() => goToPage((pageData.currentPage || 0) - 1)}>
                &lt;
              </Button>
              <Button
                size="sm"
                variant="light"
                disabled={(pageData.currentPage || 0) >= (pageData.totalPages || 1) - 1 || (pageData.totalPages || 0) === 0}
                onClick={() => goToPage((pageData.currentPage || 0) + 1)}
              >
                &gt;
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
