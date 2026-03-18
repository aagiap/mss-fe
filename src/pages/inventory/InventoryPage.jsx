import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import { getUser } from "../../api/auth";
import inventoryApi from "../../api/inventory";
import api from "../../api/api";

const PAGE_SIZE = 10;

const initialFilters = {
  keyword: "",
  storeId: "",
  status: "",
  page: 0,
  size: PAGE_SIZE,
};

const initialAdjustForm = {
  productId: "",
  storeId: "",
  adjustmentType: "INCREASE",
  quantity: "",
  lowStockThreshold: "",
  reason: "MANUAL_UPDATE",
  notes: "",
};

function toDateInput(date) {
  return date.toISOString().split("T")[0];
}

function badgeVariant(status) {
  if (status === "OUT_OF_STOCK") return "dark";
  if (status === "LOW_STOCK") return "secondary";
  return "light";
}

export default function InventoryPage() {
  const [activeMenu, setActiveMenu] = useState("Inventory");
  const [currentUser, setCurrentUser] = useState(null);
  const [stores, setStores] = useState([]);

  const [filters, setFilters] = useState(initialFilters);
  const [summary, setSummary] = useState(null);
  const [pageData, setPageData] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [productMetaById, setProductMetaById] = useState({});

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState(initialAdjustForm);
  const [adjusting, setAdjusting] = useState(false);
  const [productSearchKeyword, setProductSearchKeyword] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState("");

  const [reportFilters, setReportFilters] = useState(() => {
    const now = new Date();
    return {
      storeId: "",
      fromDate: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
      toDate: toDateInput(now),
      groupBy: "month",
      page: 0,
      size: PAGE_SIZE,
    };
  });
  const [reportOverview, setReportOverview] = useState(null);
  const [reportMovement, setReportMovement] = useState([]);
  const [reportTopStocked, setReportTopStocked] = useState([]);
  const [reportActivity, setReportActivity] = useState({
    content: [],
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
  });
  const [reportSearchKeyword, setReportSearchKeyword] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const storeNameById = useMemo(() => {
    const map = new Map();
    stores.forEach((s) => map.set(String(s.id), s.name));
    return map;
  }, [stores]);

  const isStoreLocked = useMemo(() => {
    return currentUser?.role === "ROLE_STAFF" || currentUser?.role === "ROLE_MANAGER";
  }, [currentUser]);

  const canViewReports = useMemo(() => {
    return currentUser?.role === "ROLE_MANAGER" || currentUser?.role === "ROLE_ADMIN";
  }, [currentUser]);

  const totalPages = pageData.totalPages || 0;
  const currentPage = pageData.currentPage || 0;

  useEffect(() => {
    const init = async () => {
      setInitLoading(true);
      setError("");

      try {
        const user = await getUser();
        setCurrentUser(user);

        const defaultStoreId = user?.storeId ? String(user.storeId) : "";

        let loadedStores = [];
        try {
          const storesRes = await api.get("/auth/stores");
          loadedStores = storesRes.data?.data || [];
        } catch {
          if (defaultStoreId) {
            const oneStoreRes = await api.get(`/auth/stores/${defaultStoreId}`);
            const oneStore = oneStoreRes.data?.data;
            loadedStores = oneStore ? [oneStore] : [];
          }
        }

        setStores(loadedStores);

        const preselectStore =
          isFinite(Number(defaultStoreId)) && (isStoreLocked || loadedStores.length === 1) ? defaultStoreId : "";

        const nextFilters = {
          ...initialFilters,
          storeId: preselectStore,
        };

        const nextReportFilters = {
          ...reportFilters,
          storeId: preselectStore,
        };

        setFilters(nextFilters);
        setReportFilters(nextReportFilters);

        await loadInventory(nextFilters);
      } catch (e) {
        setError(e.response?.data?.message || "Cannot load inventory page.");
      } finally {
        setInitLoading(false);
      }
    };

    init();
  }, []);

  const loadInventory = async (overrideFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        keyword: overrideFilters.keyword || undefined,
        storeId: overrideFilters.storeId ? Number(overrideFilters.storeId) : undefined,
        status: overrideFilters.status || undefined,
        page: overrideFilters.page,
        size: overrideFilters.size,
      };

      const [summaryRes, itemsRes] = await Promise.all([
        inventoryApi.getSummary(params),
        inventoryApi.getItems(params),
      ]);

      setSummary(summaryRes);
      setPageData(
        itemsRes || {
          content: [],
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
        }
      );

      const rows = itemsRes?.content || [];
      const uniqueProductIds = [...new Set(rows.map((r) => r.productId).filter(Boolean))];
      const missingProductIds = uniqueProductIds.filter((id) => !productMetaById[String(id)]);

      if (missingProductIds.length > 0) {
        try {
          // top-stocked returns productName reliably; use it to hydrate list labels.
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
                barcode: item.sku || `PRD-${item.productId}`,
              };
            });

            return next;
          });
        } catch {
          // Keep fallback labels if report metadata is unavailable.
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (override = reportFilters) => {
    if (!canViewReports) {
      setError("You do not have permission to view inventory reports.");
      setReportOverview(null);
      setReportMovement([]);
      setReportTopStocked([]);
      setReportActivity({ content: [], currentPage: 0, totalPages: 0, totalElements: 0 });
      return;
    }

    setReportLoading(true);
    setError("");

    try {
      const params = {
        storeId: override.storeId ? Number(override.storeId) : undefined,
        fromDate: override.fromDate || undefined,
        toDate: override.toDate || undefined,
      };

      const [overviewTask, movementTask, topTask, activityTask] = await Promise.allSettled([
        inventoryApi.getReportOverview(params),
        inventoryApi.getReportStockMovement({ ...params, groupBy: override.groupBy }),
        inventoryApi.getReportTopStocked({ storeId: params.storeId, limit: 5 }),
        inventoryApi.getReportActivityLogs({ ...params, page: override.page, size: override.size }),
      ]);

      const failedTasks = [overviewTask, movementTask, topTask, activityTask].filter((t) => t.status === "rejected");

      if (overviewTask.status === "fulfilled") {
        setReportOverview(overviewTask.value);
      } else {
        setReportOverview(null);
      }
      if (movementTask.status === "fulfilled") {
        setReportMovement(movementTask.value || []);
      } else {
        setReportMovement([]);
      }
      if (topTask.status === "fulfilled") {
          setReportTopStocked(topTask.value || []);
      } else {
        setReportTopStocked([]);
      }
      if (activityTask.status === "fulfilled") {
        setReportActivity(
          activityTask.value || {
            content: [],
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
          }
        );
      } else {
        setReportActivity({
          content: [],
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
        });
      }

      if (failedTasks.length > 0) {
        const firstError = failedTasks[0].reason;
        const status = firstError?.response?.status;
        const message = firstError?.response?.data?.message || firstError?.message;
        const allFailed = failedTasks.length === 4;

        if (status === 403) {
          setError("You do not have permission to view inventory reports.");
        } else if (status === 401) {
          setError("Your session is unauthorized for report APIs. Please login again.");
        } else if (allFailed && status >= 500) {
          setError("Report service is temporarily unavailable (server error). Please try again later.");
        } else if (allFailed && message) {
          setError(message);
        } else if (allFailed) {
          setError("Some report sections could not be loaded.");
        } else {
          // Partial failures are tolerated to avoid blocking the whole dashboard.
          setError("");
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load inventory reports.");
    } finally {
      setReportLoading(false);
    }
  };

  const changeMenu = async (menu) => {
    setActiveMenu(menu);
    if (menu === "Dashboard") {
      await loadDashboard();
    } else {
      setError("");
    }
  };

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

  const applyReportFilters = async () => {
    const next = { ...reportFilters, page: 0 };
    setReportFilters(next);
    await loadDashboard(next);
  };

  const goToReportPage = async (page) => {
    const bounded = Math.max(0, Math.min(page, Math.max(0, (reportActivity.totalPages || 1) - 1)));
    const next = { ...reportFilters, page: bounded };
    setReportFilters(next);
    await loadDashboard(next);
  };

  const exportReport = async () => {
    if (!canViewReports) {
      setError("You do not have permission to export inventory reports.");
      return;
    }

    try {
      const params = {
        storeId: reportFilters.storeId ? Number(reportFilters.storeId) : undefined,
        fromDate: reportFilters.fromDate || undefined,
        toDate: reportFilters.toDate || undefined,
      };

      const response = await api.get("/inventory/reports/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "inventory-report.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const status = e?.response?.status;

      if (status === 401) {
        setError("Export failed: unauthorized. Please login again.");
        return;
      }
      if (status === 403) {
        setError("Export failed: you do not have permission.");
        return;
      }
      if (status >= 500) {
        setError("Export failed due to server error. Please try again later.");
        return;
      }

      setError("Export report failed.");
    }
  };

  const openAdjustModal = (item = null) => {
    if (!item) {
      setAdjustForm({
        ...initialAdjustForm,
        storeId: filters.storeId || (currentUser?.storeId ? String(currentUser.storeId) : ""),
      });
      setProductSearchKeyword("");
      setProductSearchResults([]);
      setShowAdjustModal(true);
      return;
    }

    setAdjustForm({
      ...initialAdjustForm,
      productId: String(item.productId),
      storeId: String(item.storeId),
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : "",
    });
    setProductSearchKeyword(String(item.productId));
    setProductSearchResults([
      {
        id: item.productId,
        name: `Product #${item.productId}`,
        barcode: null,
      },
    ]);
    setShowAdjustModal(true);
  };

  const searchProducts = async () => {
    const keyword = productSearchKeyword.trim();
    if (!keyword) {
      setProductSearchResults([]);
      return;
    }

    setSearchingProducts(true);
    setError("");
    try {
      const res = await api.get("/product/search", { params: { keyword } });
      setProductSearchResults(res.data?.data || []);
    } catch (e) {
      setProductSearchResults([]);
      setError(e.response?.data?.message || "Cannot search product.");
    } finally {
      setSearchingProducts(false);
    }
  };

  const submitAdjustStock = async () => {
    if (!adjustForm.productId || !adjustForm.storeId || !adjustForm.quantity) {
      setError("Please select product, store and quantity.");
      return;
    }

    setAdjusting(true);
    setError("");
    try {
      await inventoryApi.adjustStock({
        productId: Number(adjustForm.productId),
        storeId: Number(adjustForm.storeId),
        adjustmentType: adjustForm.adjustmentType,
        quantity: Number(adjustForm.quantity),
        lowStockThreshold: adjustForm.lowStockThreshold === "" ? null : Number(adjustForm.lowStockThreshold),
        reason: adjustForm.reason || null,
        notes: adjustForm.notes || null,
      });

      setShowAdjustModal(false);
      await loadInventory();
    } catch (e) {
      setError(e.response?.data?.message || "Update stock failed.");
    } finally {
      setAdjusting(false);
    }
  };

  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages = [];
    const start = Math.max(0, currentPage - 1);
    const end = Math.min(totalPages - 1, start + 2);
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  const startIndex = pageData.totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const endIndex = Math.min((currentPage + 1) * PAGE_SIZE, pageData.totalElements || 0);

  const filteredReportRows = useMemo(() => {
    if (!reportSearchKeyword.trim()) return reportActivity.content || [];
    const key = reportSearchKeyword.trim().toLowerCase();

    return (reportActivity.content || []).filter((row) => {
      const product = (row.productName || "").toLowerCase();
      const type = (row.type || "").toLowerCase();
      const dateText = row.logDate ? new Date(row.logDate).toLocaleDateString().toLowerCase() : "";
      return product.includes(key) || type.includes(key) || dateText.includes(key);
    });
  }, [reportActivity.content, reportSearchKeyword]);

  const movementPoints = useMemo(() => {
    const values = (reportMovement || []).map((m) => Number(m.netChange || 0));
    if (values.length === 0) return "";

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return values
      .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * 100;
        const y = 90 - ((v - min) / range) * 70;
        return `${x},${y}`;
      })
      .join(" ");
  }, [reportMovement]);

  if (initLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="d-flex align-items-center gap-2">
          <Spinner size="sm" /> Loading inventory...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9" }}>
      <div style={{ background: "#fff", minHeight: "100vh", display: "flex", overflow: "hidden" }}>
        <aside
          style={{
            width: 220,
            borderRight: "1px solid #e6e9ef",
            background: "#f8f9fb",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ padding: "18px 16px", fontWeight: 700, fontSize: 22, color: "#16253a" }}>RCMS</div>
            <div style={{ padding: "0 10px" }}>
              {["Dashboard", "Inventory", "Orders", "Suppliers", "Analytics"].map((item) => {
                const clickable = item === "Dashboard" || item === "Inventory";
                return (
                  <div
                    key={item}
                    onClick={() => clickable && changeMenu(item)}
                    style={{
                      padding: "11px 12px",
                      borderRadius: 8,
                      background: item === activeMenu ? "#e8ecf2" : "transparent",
                      color: "#334155",
                      fontWeight: item === activeMenu ? 700 : 500,
                      marginBottom: 4,
                      fontSize: 14,
                      cursor: clickable ? "pointer" : "default",
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e6e9ef", padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser?.fullName || "Inventory User"}</div>
            <div style={{ color: "#8a94a6", fontSize: 12 }}>{currentUser?.role?.replace("ROLE_", "") || "User"}</div>
          </div>
        </aside>

        <main style={{ flex: 1, padding: 22 }}>
          {error && <Alert variant="danger">{error}</Alert>}

          {activeMenu === "Dashboard" ? (
            <>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Inventory Reports</h4>
                <Button variant="outline-dark" onClick={exportReport}>
                  Export (CSV)
                </Button>
              </div>

              <Card body className="mb-3" style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
                <Row className="g-2 align-items-end">
                  <Col md={3}>
                    <Form.Label>Store</Form.Label>
                    <Form.Select
                      value={reportFilters.storeId}
                      disabled={isStoreLocked}
                      onChange={(e) => setReportFilters((prev) => ({ ...prev, storeId: e.target.value }))}
                    >
                      <option value="">All stores</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label>From Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={reportFilters.fromDate}
                      onChange={(e) => setReportFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Label>To Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={reportFilters.toDate}
                      onChange={(e) => setReportFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Label>Group</Form.Label>
                    <Form.Select
                      value={reportFilters.groupBy}
                      onChange={(e) => setReportFilters((prev) => ({ ...prev, groupBy: e.target.value }))}
                    >
                      <option value="month">month</option>
                      <option value="day">day</option>
                    </Form.Select>
                  </Col>
                  <Col md={1}>
                    <Button variant="dark" onClick={applyReportFilters}>
                      Apply
                    </Button>
                  </Col>
                </Row>
              </Card>

              <Row className="g-3 mb-3">
                <Col md={3}>
                  <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
                    <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TOTAL INVENTORY VALUE</div>
                    <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>
                      {(reportOverview?.totalInventoryValue || 0).toLocaleString()}
                    </div>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
                    <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TOTAL PRODUCTS</div>
                    <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>
                      {(reportOverview?.totalProducts || 0).toLocaleString()}
                    </div>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
                    <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>LOW STOCK COUNT</div>
                    <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>
                      {(reportOverview?.lowStockCount || 0).toLocaleString()}
                    </div>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
                    <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TODAY IN/OUT</div>
                    <div style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 800 }}>
                      +{(reportOverview?.todayStockIn || 0).toLocaleString()} / -{(reportOverview?.todayStockOut || 0).toLocaleString()}
                    </div>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Card style={{ borderRadius: 10, borderColor: "#dde1e8", minHeight: 280 }}>
                    <Card.Body>
                      <h5 style={{ fontWeight: 700, marginBottom: 2 }}>Stock Movement</h5>
                      <div style={{ color: "#8792a5", fontSize: 13, marginBottom: 10 }}>Monthly Net Growth</div>
                      <svg viewBox="0 0 100 100" width="100%" height="190" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#2f3f54"
                          strokeWidth="0.8"
                          points={movementPoints || "0,50 100,50"}
                        />
                      </svg>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card style={{ borderRadius: 10, borderColor: "#dde1e8", minHeight: 280 }}>
                    <Card.Body>
                      <h5 style={{ fontWeight: 700, marginBottom: 2 }}>Most Stocked Products</h5>
                      <div style={{ color: "#8792a5", fontSize: 13, marginBottom: 16 }}>Top product inventory count</div>
                      <div className="d-flex align-items-end justify-content-around" style={{ height: 185 }}>
                        {(reportTopStocked || []).slice(0, 5).map((item) => {
                          const max = Math.max(1, ...reportTopStocked.map((x) => Number(x.quantity || 0)));
                          const h = Math.max(20, (Number(item.quantity || 0) / max) * 140);
                          return (
                            <div key={`${item.productId}-${item.sku}`} className="text-center" style={{ width: 120 }}>
                              <div style={{ height: h, background: "#ccd3db", borderRadius: 4, marginBottom: 8 }} />
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#2f3f54",
                                  fontWeight: 600,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={item.productName || `Product ${item.productId}`}
                              >
                                {item.productName || `Product ${item.productId}`}
                              </div>
                              <div style={{ fontSize: 11, color: "#6d7789" }}>{item.sku || `SKU_${item.productId}`}</div>
                            </div>
                          );
                        })}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 style={{ margin: 0, fontWeight: 700 }}>Detailed Activity Log</h5>
                    <Form.Control
                      style={{ width: 260 }}
                      placeholder="Search report..."
                      value={reportSearchKeyword}
                      onChange={(e) => setReportSearchKeyword(e.target.value)}
                    />
                  </div>

                  {reportLoading ? (
                    <div className="d-flex align-items-center gap-2" style={{ padding: "26px 0" }}>
                      <Spinner size="sm" /> Loading report...
                    </div>
                  ) : (
                    <Table hover responsive>
                      <thead style={{ background: "#f2f4f8" }}>
                        <tr>
                          <th>DATE</th>
                          <th>STOCK IN</th>
                          <th>STOCK OUT</th>
                          <th>NET CHANGE</th>
                          <th>INVENTORY VALUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReportRows.map((row, index) => (
                          <tr key={`${row.logDate}-${row.productId}-${index}`}>
                            <td>{row.logDate ? new Date(row.logDate).toLocaleDateString() : "-"}</td>
                            <td style={{ fontWeight: 700, color: "#2f3f54" }}>+{(row.stockIn || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: "#2f3f54" }}>-{(row.stockOut || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 700 }}>{(row.netChange || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 700 }}>{(row.inventoryValue || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        {filteredReportRows.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", color: "#8a94a6", padding: 20 }}>
                              No report records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )}

                  <div className="d-flex justify-content-end gap-1">
                    <Button
                      size="sm"
                      variant="light"
                      disabled={!reportActivity.currentPage}
                      onClick={() => goToReportPage((reportActivity.currentPage || 0) - 1)}
                    >
                      &lt;
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      disabled={(reportActivity.currentPage || 0) >= (reportActivity.totalPages || 1) - 1}
                      onClick={() => goToReportPage((reportActivity.currentPage || 0) + 1)}
                    >
                      &gt;
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 style={{ margin: 0, fontWeight: 700, color: "#16253a" }}>Inventory Management</h4>
                <Button variant="dark" onClick={() => openAdjustModal(null)} style={{ borderRadius: 6, paddingInline: 16, fontWeight: 600 }}>
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
                      placeholder="Search products, SKUs, or barcodes..."
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
                    <Form.Select
                      value={filters.status}
                      onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">Status</option>
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
                          <th>SKU</th>
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
                                <Button size="sm" variant="outline-secondary" onClick={() => openAdjustModal(row)}>
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
          )}
        </main>
      </div>

      <Modal show={showAdjustModal} onHide={() => setShowAdjustModal(false)} centered size="xl" dialogClassName="modal-90w">
        <Modal.Header closeButton>
          <Modal.Title>Update Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-2">
            <Col md={7}>
              <Form.Label>Search Product (name/barcode)</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  value={productSearchKeyword}
                  placeholder="Type product name or barcode"
                  onChange={(e) => setProductSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                />
                <Button variant="outline-secondary" onClick={searchProducts} disabled={searchingProducts}>
                  {searchingProducts ? "..." : "Search"}
                </Button>
              </div>
            </Col>

            <Col md={5}>
              <Form.Label>Product</Form.Label>
              <Form.Select value={adjustForm.productId} onChange={(e) => setAdjustForm((prev) => ({ ...prev, productId: e.target.value }))}>
                <option value="">Choose product</option>
                {productSearchResults.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.barcode ? ` - ${p.barcode}` : ""}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={6}>
              <Form.Label>Store</Form.Label>
              <Form.Select
                value={adjustForm.storeId}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, storeId: e.target.value }))}
                disabled={isStoreLocked}
              >
                <option value="">Choose store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Adjustment</Form.Label>
              <Form.Select
                value={adjustForm.adjustmentType}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, adjustmentType: e.target.value }))}
              >
                <option value="INCREASE">INCREASE</option>
                <option value="DECREASE">DECREASE</option>
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Low Stock Threshold</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={adjustForm.lowStockThreshold}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Reason</Form.Label>
              <Form.Control
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </Col>
            <Col md={12}>
              <Form.Label>Notes</Form.Label>
              <Form.Control value={adjustForm.notes} onChange={(e) => setAdjustForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAdjustModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" disabled={adjusting} onClick={submitAdjustStock}>
            {adjusting ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
