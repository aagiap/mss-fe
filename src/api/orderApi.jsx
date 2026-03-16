import api from "./api";

// Search products qua OrderService
export const searchProducts = async (keyword) => {
    const response = await api.get("/order/search-product", {
        params: { keyword }
    });
    return response.data.data;
};

// Search customer by phone
export const searchCustomer = async (phone) => {
    const response = await api.get("/customer/search", {
        params: { phone }
    });
    return response.data.data;
};

// Create order (hold=false) hoặc hold order (hold=true)
export const createOrder = async (orderData) => {
    const response = await api.post("/order", orderData);
    return response.data.data;
};

// Get hold orders by store
export const getHoldOrders = async (storeId) => {
    const response = await api.get("/order/hold", {
        params: { storeId }
    });
    return response.data.data;
};

// Process payment
export const processPayment = async (paymentData) => {
    const response = await api.post("/order/payment", paymentData);
    return response.data.data;
};

// Generate invoice
export const generateInvoice = async (orderId) => {
    const response = await api.get(`/order/${orderId}/invoice`);
    return response.data.data;
};

// Search orders
export const searchOrders = async (params) => {
    const response = await api.get("/order/search", { params });
    return response.data.data;
};

// Get order detail
export const getOrderDetail = async (orderId) => {
    const response = await api.get(`/order/${orderId}/detail`);
    return response.data.data;
};

// Cancel order
export const cancelOrder = async (orderId) => {
    const response = await api.patch(`/order/${orderId}/cancel`);
    return response.data.data;
};

export const createCustomer = async (customerData) => {
    const response = await api.post("/customer", customerData);
    return response.data.data;
};

export const getCustomerById = async (customerId) => {
    const response = await api.get(`/customer/${customerId}`);
    return response.data.data;
};