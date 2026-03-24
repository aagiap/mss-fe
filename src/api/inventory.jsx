import api from "./api";

const unwrap = (response) => response.data?.data;

function normalizeProductList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function dedupeProducts(products) {
  const map = new Map();
  (products || []).forEach((item) => {
    if (!item?.id) return;
    map.set(String(item.id), item);
  });
  return [...map.values()];
}

function matchesProductKeyword(product, keywordLower) {
  const name = String(product?.name || "").toLowerCase();
  const barcode = String(product?.barcode || "").toLowerCase();
  const sku = String(product?.sku || "").toLowerCase();
  return name.includes(keywordLower) || barcode.includes(keywordLower) || sku.includes(keywordLower);
}

const inventoryApi = {
  getItems: async (params) => {
    const response = await api.get("/inventory/items", { params });
    return unwrap(response);
  },

  getSummary: async (params) => {
    const response = await api.get("/inventory/items/summary", { params });
    return unwrap(response);
  },

  adjustStock: async (payload) => {
    const response = await api.post("/inventory/adjustments", payload);
    return unwrap(response);
  },

  searchProductsByKeyword: async (keyword) => {
    const normalizedKeyword = String(keyword || "").trim();
    if (!normalizedKeyword) return [];

    let searchItems = [];
    try {
      const searchRes = await api.get("/product/search", {
        params: {
          keyword: normalizedKeyword,
          barcode: normalizedKeyword,
        },
      });
      searchItems = normalizeProductList(unwrap(searchRes));
    } catch {
      searchItems = [];
    }

    const keywordLower = normalizedKeyword.toLowerCase();
    const hasBarcodeMatch = searchItems.some((item) => matchesProductKeyword(item, keywordLower));
    if (searchItems.length > 0 && hasBarcodeMatch) {
      return dedupeProducts(searchItems);
    }

    try {
      const listRes = await api.get("/product", {
        params: {
          page: 0,
          size: 2000,
        },
      });

      const allItems = normalizeProductList(unwrap(listRes));
      const fallbackMatched = allItems.filter((item) => matchesProductKeyword(item, keywordLower));
      return dedupeProducts([...searchItems, ...fallbackMatched]);
    } catch {
      return dedupeProducts(searchItems);
    }
  },

  getLowStockItems: async (params) => {
    const response = await api.get("/inventory/alerts/low-stock", { params });
    return unwrap(response);
  },

  getLowStockSummary: async (params) => {
    const response = await api.get("/inventory/alerts/low-stock/summary", { params });
    return unwrap(response);
  },

  createStockIn: async (payload) => {
    const response = await api.post("/inventory/stock-ins", payload);
    return unwrap(response);
  },

  getStockIns: async (params) => {
    const response = await api.get("/inventory/stock-ins", { params });
    return unwrap(response);
  },

  getStockInDetail: async (stockInId) => {
    const response = await api.get(`/inventory/stock-ins/${stockInId}`);
    return unwrap(response);
  },

  createStockOut: async (payload) => {
    const response = await api.post("/inventory/stock-outs", payload);
    return unwrap(response);
  },

  getStockOuts: async (params) => {
    const response = await api.get("/inventory/stock-outs", { params });
    return unwrap(response);
  },

  getStockOutDetail: async (stockOutId) => {
    const response = await api.get(`/inventory/stock-outs/${stockOutId}`);
    return unwrap(response);
  },

  createTransfer: async (payload) => {
    const response = await api.post("/inventory/transfers", payload);
    return unwrap(response);
  },

  getTransferMovements: async (params) => {
    const response = await api.get("/inventory/transfers", { params });
    return unwrap(response);
  },

  getTransferDetail: async (transferRef) => {
    const response = await api.get(`/inventory/transfers/${transferRef}`);
    return unwrap(response);
  },

  getStockMovements: async (params) => {
    const response = await api.get("/inventory/stock-movements", { params });
    return unwrap(response);
  },

  startAudit: async (payload) => {
    const response = await api.post("/inventory/audits", payload);
    return unwrap(response);
  },

  getAuditSession: async (auditId) => {
    const response = await api.get(`/inventory/audits/${auditId}`);
    return unwrap(response);
  },

  finalizeAudit: async (auditId, payload) => {
    const response = await api.post(`/inventory/audits/${auditId}/finalize`, payload);
    return unwrap(response);
  },

  getSuppliers: async (params) => {
    const response = await api.get("/inventory/suppliers", { params });
    return unwrap(response);
  },

  getSuppliersForManagementV2: async (params) => {
    const response = await api.get("/inventory/suppliers/management", { params });
    return unwrap(response);
  },

  createSupplier: async (payload) => {
    const response = await api.post("/inventory/suppliers", payload);
    return unwrap(response);
  },

  updateSupplier: async (supplierId, payload) => {
    const response = await api.put(`/inventory/suppliers/${supplierId}`, payload);
    return unwrap(response);
  },

  deleteSupplierForManagementV2: async (supplierId) => {
    const response = await api.delete(`/inventory/suppliers/${supplierId}/management`);
    return unwrap(response);
  },

  getReportOverview: async (params) => {
    const response = await api.get("/inventory/reports/overview", { params });
    return unwrap(response);
  },

  getReportStockMovement: async (params) => {
    const response = await api.get("/inventory/reports/stock-movement", { params });
    return unwrap(response);
  },

  getReportTopStocked: async (params) => {
    const response = await api.get("/inventory/reports/top-stocked", { params });
    return unwrap(response);
  },

  getReportActivityLogs: async (params) => {
    const response = await api.get("/inventory/reports/activity-logs", { params });
    return unwrap(response);
  },
};

export default inventoryApi;
