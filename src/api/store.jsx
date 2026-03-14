import api from "./api";

const STORE_API_PATH = "/auth/stores";

const storeService = {
    /**
     * Lấy chi tiết một cửa hàng theo ID
     * Roles: ROLE_STAFF, ROLE_ADMIN, ROLE_CASHIER, ROLE_MANAGER
     */
    getOne: async (id) => {
        try {
            const response = await api.get(`${STORE_API_PATH}/${id}`);
            return response.data; // Trả về BaseResponse<StoreDTO>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Lấy danh sách tất cả cửa hàng
     * Roles: ROLE_ADMIN
     */
    getAll: async () => {
        try {
            const response = await api.get(STORE_API_PATH);
            return response.data; // Trả về BaseResponse<List<StoreDTO>>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Tạo mới một cửa hàng
     * Roles: ROLE_ADMIN
     * @param {Object} storeRequest - Dữ liệu cửa hàng (name, address, status)
     */
    create: async (storeRequest) => {
        try {
            const response = await api.post(`${STORE_API_PATH}/create`, storeRequest);
            return response.data; // Trả về BaseResponse<StoreDTO>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Cập nhật thông tin cửa hàng
     * Roles: ROLE_ADMIN
     * @param {Object} storeRequest - Dữ liệu (phải bao gồm id, name, address, status)
     */
    update: async (storeRequest) => {
        try {
            const response = await api.put(`${STORE_API_PATH}/update`, storeRequest);
            return response.data; // Trả về BaseResponse<StoreDTO>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Xóa cửa hàng theo ID
     * Roles: ROLE_ADMIN
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`${STORE_API_PATH}/${id}`);
            return response.data; // Trả về BaseResponse<Void>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default storeService;