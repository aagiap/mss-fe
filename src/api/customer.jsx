import api from "./api";

const CUSTOMER_API_PATH = "/customer";

const customerApi = {
  /**
   * Lấy danh sách khách hàng (phân trang / tìm kiếm)
   * @param {Object} params - { search, page, size, ... }
   */
  getAll: async (params) => {
    try {
      const response = await api.get(CUSTOMER_API_PATH, { params });
      return response.data.data; // BaseResponse { data: Page<Customer> }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lấy chi tiết khách hàng theo id
   */
  getById: async (id) => {
    try {
      const response = await api.get(`${CUSTOMER_API_PATH}/${id}`);
      return response.data; // BaseResponse<Customer>
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Tạo mới khách hàng
   */
  create: async (customerRequest) => {
    try {
      const response = await api.post(CUSTOMER_API_PATH, customerRequest);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Cập nhật khách hàng
   */
  update: async (id, customerRequest) => {
    try {
      const response = await api.put(
        `${CUSTOMER_API_PATH}/${id}`,
        customerRequest,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Xóa khách hàng
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`${CUSTOMER_API_PATH}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  findByPhone: async (phone) => {
    try {
      const response = await api.get(`${CUSTOMER_API_PATH}/search`, {
        params: { phone },
      });
      return response.data; // BaseResponse<Customer>
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  addPoints: async (id, points) => {
    try {
      const response = await api.put(
        `${CUSTOMER_API_PATH}/${id}/add-points`,
        null,
        {
          params: { points },
        },
      );
      return response.data; // BaseResponse<Void>
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  dedauctPoints: async (id, points) => {
    try {
      const response = await api.put(
        `${CUSTOMER_API_PATH}/${id}/deduct-points`,
        null,
        {
          params: { points },
        },
      );
      return response.data; // BaseResponse<Void>
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  findById: async (id) => {
    try {
      const response = await api.get(`${CUSTOMER_API_PATH}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default customerApi;
