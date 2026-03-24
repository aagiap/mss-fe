import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from "react-bootstrap";
import inventoryApi from "../../api/inventory";
import api from "../../api/api";

const PAGE_SIZE = 10;

function toDateInput(date) {
  return date.toISOString().split("T")[0];
}

function formatAxisNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1000000) {
    const formatted = (value / 1000000).toFixed(abs >= 10000000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, "")}M`;
  }
  if (abs >= 1000) {
    const formatted = (value / 1000).toFixed(abs >= 10000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, "")}K`;
  }
  return Math.round(value).toLocaleString();
}

export default function InventoryDashboardPanel({ stores, isStoreLocked, canViewReports }) {
  const [error, setError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [hoveredMovementIndex, setHoveredMovementIndex] = useState(null);
  const [isMovementZoomOpen, setIsMovementZoomOpen] = useState(false);

  const [reportFilters, setReportFilters] = useState(() => {
    const now = new Date();
    return {
      storeId: "",
      fromDate: toDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)),
      toDate: toDateInput(now),
      groupBy: "day",
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

      setReportOverview(overviewTask.status === "fulfilled" ? overviewTask.value : null);
      setReportMovement(movementTask.status === "fulfilled" ? movementTask.value || [] : []);
      setReportTopStocked(topTask.status === "fulfilled" ? topTask.value || [] : []);
      setReportActivity(
        activityTask.status === "fulfilled"
          ? activityTask.value || { content: [], currentPage: 0, totalPages: 0, totalElements: 0 }
          : { content: [], currentPage: 0, totalPages: 0, totalElements: 0 }
      );

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
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load inventory reports.");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [canViewReports]);

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

  const movementChart = useMemo(() => {
    const rows = reportMovement || [];
    const chartLeft = 10;
    const chartRight = 98;
    const chartTop = 8;
    const chartBottom = 92;

    if (rows.length === 0) {
      return {
        chartLeft,
        chartRight,
        chartTop,
        chartBottom,
        points: [],
        polylinePoints: "",
        min: 0,
        mid: 0,
        max: 0,
        tickValues: [0, 0, 0, 0, 0],
        xStartLabel: "-",
        xMidLabel: "-",
        xEndLabel: "-",
      };
    }

    const values = rows.map((m) => Number(m.netChange || 0));
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values);
    const spread = rawMax - rawMin;
    const padding = spread === 0 ? Math.max(1, Math.abs(rawMax) * 0.2) : spread * 0.15;
    const paddedMax = rawMax + padding;
    const paddedMin = rawMin - padding;
    const range = paddedMax - paddedMin;
    const tickValues = Array.from({ length: 5 }, (_, idx) => paddedMax - (idx * range) / 4);

    const points = rows.map((m, i) => {
      const x = chartLeft + (i / Math.max(1, rows.length - 1)) * (chartRight - chartLeft);
      const y = chartBottom - ((Number(m.netChange || 0) - paddedMin) / range) * (chartBottom - chartTop);
      const label =
        m.label ||
        m.period ||
        m.date ||
        m.logDate ||
        (m.year && m.month ? `${m.year}-${String(m.month).padStart(2, "0")}` : null) ||
        `Point ${i + 1}`;

      return {
        index: i,
        x,
        y,
        label,
        netChange: Number(m.netChange || 0),
        stockIn: Number(m.stockIn || 0),
        stockOut: Number(m.stockOut || 0),
      };
    });

    const polylinePoints =
      points.length === 1
        ? `${chartLeft},${points[0].y} ${chartRight},${points[0].y}`
        : points.map((p) => `${p.x},${p.y}`).join(" ");

    const midIndex = Math.floor((points.length - 1) / 2);
    return {
      chartLeft,
      chartRight,
      chartTop,
      chartBottom,
      points,
      polylinePoints,
      min: paddedMin,
      mid: (paddedMin + paddedMax) / 2,
      max: paddedMax,
      tickValues,
      xStartLabel: points[0]?.label || "-",
      xMidLabel: points[midIndex]?.label || "-",
      xEndLabel: points[points.length - 1]?.label || "-",
    };
  }, [reportMovement]);

  const hasMovementData = movementChart.points.length > 0;
  const hoveredMovementPoint =
    hoveredMovementIndex !== null ? movementChart.points[hoveredMovementIndex] || null : null;

  const onMovementChartMouseMove = (event) => {
    if (!movementChart.points.length) {
      setHoveredMovementIndex(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;

    const ratioX = (event.clientX - rect.left) / rect.width;
    const xInChart = Math.max(0, Math.min(100, ratioX * 100));

    let nearestIndex = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    movementChart.points.forEach((point, index) => {
      const distance = Math.abs(point.x - xInChart);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    setHoveredMovementIndex((prev) => (prev === nearestIndex ? prev : nearestIndex));
  };

  const renderMovementChart = ({ height, expanded = false }) => (
    <div
      style={{ position: "relative", cursor: expanded ? "default" : "zoom-in" }}
      onMouseMove={onMovementChartMouseMove}
      onMouseLeave={() => setHoveredMovementIndex(null)}
      onClick={expanded ? undefined : () => setIsMovementZoomOpen(true)}
      title={expanded ? undefined : "Click to zoom"}
    >
      <svg viewBox="0 0 100 100" width="100%" height={height} preserveAspectRatio="none">
        <line
          x1={movementChart.chartLeft}
          y1={movementChart.chartTop}
          x2={movementChart.chartLeft}
          y2={movementChart.chartBottom}
          stroke="#cbd5e1"
          strokeWidth="0.7"
        />
        <line
          x1={movementChart.chartLeft}
          y1={movementChart.chartBottom}
          x2={movementChart.chartRight}
          y2={movementChart.chartBottom}
          stroke="#cbd5e1"
          strokeWidth="0.7"
        />

        {movementChart.tickValues.map((tick, idx) => {
          const ratio = (tick - movementChart.min) / Math.max(1, movementChart.max - movementChart.min);
          const y = movementChart.chartBottom - ratio * (movementChart.chartBottom - movementChart.chartTop);
          return (
            <g key={`tick-${idx}`}>
              <line
                x1={movementChart.chartLeft}
                y1={y}
                x2={movementChart.chartRight}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                strokeDasharray="1.5 1.5"
              />
            </g>
          );
        })}

        {hasMovementData && (
          <polyline fill="none" stroke="#2f3f54" strokeWidth="0.9" points={movementChart.polylinePoints} />
        )}

        {movementChart.points.map((point) => (
          <circle
            key={`movement-point-${point.index}`}
            cx={point.x}
            cy={point.y}
            r={hoveredMovementIndex === point.index ? 1.6 : 1.2}
            fill={hoveredMovementIndex === point.index ? "#0f172a" : "#64748b"}
            onMouseEnter={() => setHoveredMovementIndex(point.index)}
          />
        ))}
      </svg>

      {hoveredMovementPoint && (
        <div
          style={{
            position: "absolute",
            left: `${hoveredMovementPoint.x}%`,
            top: `${Math.max(6, hoveredMovementPoint.y - 2)}%`,
            transform: "translate(-50%, -105%)",
            background: "#0f172a",
            color: "#f8fafc",
            padding: "8px 10px",
            borderRadius: 8,
            fontSize: expanded ? 13 : 12,
            lineHeight: 1.3,
            minWidth: 170,
            pointerEvents: "none",
            boxShadow: "0 10px 24px rgba(2,6,23,.25)",
            zIndex: 5,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{hoveredMovementPoint.label}</div>
          <div>Net: {hoveredMovementPoint.netChange.toLocaleString()}</div>
          <div>Stock In: +{hoveredMovementPoint.stockIn.toLocaleString()}</div>
          <div>Stock Out: -{hoveredMovementPoint.stockOut.toLocaleString()}</div>
        </div>
      )}

      {movementChart.tickValues.map((tick, idx) => {
        const ratio = (tick - movementChart.min) / Math.max(1, movementChart.max - movementChart.min);
        const y = movementChart.chartBottom - ratio * (movementChart.chartBottom - movementChart.chartTop);
        return (
          <div
            key={`tick-label-${idx}`}
            style={{
              position: "absolute",
              left: 0,
              top: `${y}%`,
              transform: "translateY(-50%)",
              width: `${Math.max(8, movementChart.chartLeft - 1)}%`,
              textAlign: "right",
              paddingRight: 6,
              color: "#64748b",
              fontSize: expanded ? 13 : 12,
              lineHeight: 1,
              pointerEvents: "none",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatAxisNumber(tick)}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

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
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{(reportOverview?.totalInventoryValue || 0).toLocaleString()}</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>TOTAL PRODUCTS</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{(reportOverview?.totalProducts || 0).toLocaleString()}</div>
          </Card>
        </Col>
        <Col md={3}>
          <Card body style={{ borderRadius: 10, borderColor: "#dde1e8" }}>
            <div style={{ fontSize: 12, color: "#8792a5", fontWeight: 700 }}>LOW STOCK COUNT</div>
            <div style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 800 }}>{(reportOverview?.lowStockCount || 0).toLocaleString()}</div>
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
              <div className="d-flex align-items-center justify-content-between">
                <h5 style={{ fontWeight: 700, marginBottom: 2 }}>Stock Movement</h5>
                <Button size="sm" variant="outline-secondary" onClick={() => setIsMovementZoomOpen(true)}>
                  Zoom
                </Button>
              </div>
              <div style={{ color: "#8792a5", fontSize: 13, marginBottom: 10 }}>
                Net change trend (hover for details, click chart to zoom)
              </div>
              {renderMovementChart({ height: 190 })}
              <div className="d-flex justify-content-between" style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                <span>{movementChart.xStartLabel}</span>
                <span>{movementChart.xMidLabel}</span>
                <span>{movementChart.xEndLabel}</span>
              </div>
              {!hasMovementData && <div style={{ color: "#94a3b8", fontSize: 12 }}>No movement data in selected period.</div>}
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
                      <div style={{ fontSize: 11, color: "#6d7789" }}>{item.sku || `BAR_${item.productId}`}</div>
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

      <Modal show={isMovementZoomOpen} onHide={() => setIsMovementZoomOpen(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Stock Movement (Zoom View)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ color: "#8792a5", fontSize: 13, marginBottom: 8 }}>
            Hover each point to inspect milestone data.
          </div>
          {renderMovementChart({ height: 420, expanded: true })}
          <div className="d-flex justify-content-between" style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>
            <span>{movementChart.xStartLabel}</span>
            <span>{movementChart.xMidLabel}</span>
            <span>{movementChart.xEndLabel}</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsMovementZoomOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
