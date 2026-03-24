import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import inventoryApi from "../../api/inventory";

const PAGE_SIZE = 10;

const initialFilters = {
  keyword: "",
  storeId: "",
  status: "",
  page: 0,
  size: PAGE_SIZE,
};

function badgeVariant(status) {
  if (status === "OUT_OF_STOCK") return "dark";
  if (status === "LOW_STOCK") return "secondary";
  return "light";
}

function buildSummaryFromRows(rows) {
  const safeRows = rows || [];
  return {
    totalItems: safeRows.length,
    lowStockCount: safeRows.filter((row) => row?.status === "LOW_STOCK").length,
    outOfStockCount: safeRows.filter((row) => row?.status === "OUT_OF_STOCK").length,
    totalQuantity: safeRows.reduce((sum, row) => sum + Number(row?.quantity || 0), 0),
  };
}

export default function InventoryManagementPanel({ currentUser, stores, isStoreLocked, onNavigateUpdateStock }) {
  const [filters, setFilters] = useState(initialFilters);
  const [summary, setSummary] = useState(null);
  const [pageData, setPageData] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [productMetaById, setProductMetaById] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const storeNameById = useMemo(() => {
    const map = new Map();
    stores.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [stores]);

  const totalPages = pageData.totalPages || 0;
  const currentPage = pageData.currentPage || 0;

  const loadInventory = async (overrideFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const normalizedKeyword = String(overrideFilters.keyword || "").trim();
      const params = {
        keyword: normalizedKeyword || undefined,
        storeId: overrideFilters.storeId ? Number(overrideFilters.storeId) : undefined,
        status: overrideFilters.status || undefined,
        page: overrideFilters.page,
        size: overrideFilters.size,
      };

      const [summaryRes, itemsRes] = await Promise.all([inventoryApi.getSummary(params), inventoryApi.getItems(params)]);

      let finalSummary = summaryRes;
      let finalPageData =
        itemsRes || {
          content: [],
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
        };

      if (normalizedKeyword && (itemsRes?.content || []).length === 0) {
        const matchedProducts = await inventoryApi.searchProductsByKeyword(normalizedKeyword);

        if ((matchedProducts || []).length > 0) {
          const matchedProductIdSet = new Set(matchedProducts.map((p) => String(p.id)).filter(Boolean));

          const allItemsRes = await inventoryApi.getItems({
            storeId: params.storeId,
            status: params.status,
            page: 0,
            size: 2000,
          });

          const filteredRows = (allItemsRes?.content || []).filter((row) => matchedProductIdSet.has(String(row.productId)));

          const pageSize = Number(overrideFilters.size || PAGE_SIZE);
          const pageIndex = Math.max(0, Number(overrideFilters.page || 0));
          const start = pageIndex * pageSize;
          const end = start + pageSize;

          finalPageData = {
            content: filteredRows.slice(start, end),
            currentPage: pageIndex,
            totalPages: Math.ceil(filteredRows.length / pageSize),
            totalElements: filteredRows.length,
          };
          finalSummary = buildSummaryFromRows(filteredRows);

          setProductMetaById((prev) => {
            const next = { ...prev };
            matchedProducts.forEach((item) => {
              if (!item?.id) return;
              next[String(item.id)] = {
                name: item.name || `Product #${item.id}`,
                barcode: item.barcode || item.sku || `PRD-${item.id}`,
              };
            });
            return next;
          });
        }
      }

      setSummary(finalSummary);
      setPageData(finalPageData);

      const rows = finalPageData?.content || [];
      const uniqueProductIds = [...new Set(rows.map((r) => r.productId).filter(Boolean))];
      const missingProductIds = uniqueProductIds.filter((id) => !productMetaById[String(id)]);

      if (missingProductIds.length > 0) {
        try {
          const topStocked = await inventoryApi.getReportTopStocked({
            storeId: overrideFilters.storeId ? Number(overrideFilters.storeId) : undefined,
            limit: 2000,
          });

          setProductMetaById((prev) => {
            const next = { ...prev };
            (topStocked || []).forEach((item) => {
              if (!item?.productId) return;
              next[String(item.productId)] = {
                name: item.productName || `Product #${item.productId}`,
                barcode: item.barcode || item.sku || `PRD-${item.productId}`,
              };
            });
            return next;
          });
        } catch {
          // keep fallback labels
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const preselectStore =
      Number.isFinite(Number(currentUser.storeId)) && (isStoreLocked || stores.length === 1)
        ? String(currentUser.storeId)
        : "";

    const nextFilters = {
      ...initialFilters,
      storeId: preselectStore,
    };
    setFilters(nextFilters);
    loadInventory(nextFilters);
  }, [currentUser?.storeId, isStoreLocked, stores.length]);

  const applyFilters = async () => {
    const next = { ...filters, page: 0 };
    setFilters(next);
    await loadInventory(next);
  };

  const clearFilters = async () => {
    const lockedStore = isStoreLocked && currentUser?.storeId ? String(currentUser.storeId) : "";
    const next = {
      ...initialFilters,
      storeId: lockedStore,
    };
    setFilters(next);
    await loadInventory(next);
  };

  const goToPage = async (page) => {
    const bounded = Math.max(0, Math.min(page, Math.max(0, totalPages - 1)));
    const next = { ...filters, page: bounded };
    setFilters(next);
    await loadInventory(next);
  };

  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages = [];
    const start = Math.max(0, currentPage - 1);
    const end = Math.min(totalPages - 1, start + 2);
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Inventory Management</h4>
        <Button variant="dark" onClick={() => onNavigateUpdateStock?.(null)} style={{ borderRadius: 6, paddingInline: 16, fontWeight: 600 }}>
          + Update Stock
        </Button>
      </div>

      <Row className="g-3 mb-3">
        <Col md={3}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TOTAL ITEMS</div>
            <div style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 800 }}>{summary?.totalItems ?? 0}</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>LOW STOCK</div>
            <div style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 800 }}>{summary?.lowStockCount ?? 0}</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>OUT OF STOCK</div>
            <div style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 800 }}>{summary?.outOfStockCount ?? 0}</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TOTAL QUANTITY</div>
            <div style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 800 }}>{summary?.totalQuantity ?? 0}</div>
          </Card>
        </Col>
      </Row>

      <Card body className="mb-3" style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
        <Row className="g-2 align-items-center">
          <Col md={7}>
            <Form.Control
              placeholder="Search products or barcodes..."
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            />
          </Col>
          <Col md={2}>
            <Form.Select
              value={filters.storeId}
              disabled={isStoreLocked}
              onChange={(e) => setFilters((prev) => ({ ...prev, storeId: e.target.value }))}
            >
              <option value="">Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={1}>
            <Form.Select disabled>
              <option>Category</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="">All Status</option>
              <option value="IN_STOCK">IN_STOCK</option>
              <option value="LOW_STOCK">LOW_STOCK</option>
              <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
            </Form.Select>
          </Col>
        </Row>
        <div className="d-flex gap-2 mt-2">
          <Button size="sm" variant="dark" onClick={applyFilters}>
            Apply
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
        <Card.Body style={{ paddingBottom: 12 }}>
          <h5 style={{ fontWeight: 700, marginBottom: 14, color: "#1b283b" }}>Inventory List</h5>

          {loading ? (
            <div className="d-flex align-items-center gap-2" style={{ padding: "26px 0" }}>
              <Spinner size="sm" /> Loading table...
            </div>
          ) : (
            <Table hover responsive>
              <thead style={{ background: "#f2f4f8" }}>
                <tr>
                  <th>PRODUCT</th>
                  <th>BARCODE</th>
                  <th>STORE</th>
                  <th>QUANTITY</th>
                  <th>MIN LEVEL</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(pageData.content || []).map((row) => {
                  const productMeta = productMetaById[String(row.productId)];
                  return (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600 }}>{productMeta?.name || `Product #${row.productId}`}</td>
                      <td>{productMeta?.barcode || `PRD-${row.productId}`}</td>
                      <td>{storeNameById.get(String(row.storeId)) || `Store #${row.storeId}`}</td>
                      <td>{row.quantity}</td>
                      <td>{row.lowStockThreshold}</td>
                      <td>
                        <Badge
                          bg={badgeVariant(row.status)}
                          style={{
                            fontSize: 11,
                            color: row.status === "IN_STOCK" ? "#1f2937" : "#fff",
                            border: row.status === "IN_STOCK" ? "1px solid #c9d2df" : "none",
                          }}
                        >
                          {row.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-secondary" onClick={() => onNavigateUpdateStock?.(row)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline-dark" onClick={() => loadInventory()}>
                            Refresh
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageData.content?.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#8a94a6", padding: 20 }}>
                      No inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}

          <div className="d-flex align-items-center justify-content-between" style={{ color: "#7a8598", fontSize: 13 }}>
            <div>
              Showing {pageData.totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1} to {Math.min((currentPage + 1) * PAGE_SIZE, pageData.totalElements || 0)} of {pageData.totalElements || 0} items
            </div>
            <div className="d-flex gap-1 align-items-center">
              <Button size="sm" variant="light" disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>
                &lt;
              </Button>
              {pageButtons.map((p) => (
                <Button key={p} size="sm" variant={p === currentPage ? "dark" : "light"} onClick={() => goToPage(p)}>
                  {p + 1}
                </Button>
              ))}
              <Button
                size="sm"
                variant="light"
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
                onClick={() => goToPage(currentPage + 1)}
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
