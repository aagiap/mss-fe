import api from "./api";

const unwrap = (response) => response.data?.data;

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

  createStockOut: async (payload) => {
    const response = await api.post("/inventory/stock-outs", payload);
    return unwrap(response);
  },

  getStockOuts: async (params) => {
    const response = await api.get("/inventory/stock-outs", { params });
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

  getSuppliers: async (params) => {
    const response = await api.get("/inventory/suppliers", { params });
    return unwrap(response);
  },

  createSupplier: async (payload) => {
    const response = await api.post("/inventory/suppliers", payload);
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
