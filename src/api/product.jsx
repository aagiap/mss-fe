import api from "./api";

const PRODUCT_API_PATH = "/product";

const product = {
    /**
     * Lấy danh sách sản phẩm (có phân trang và tìm kiếm)
     * @param {Object} params - { search, categoryId, page, size }
     */
    getAll: async (params) => {
        try {
            const response = await api.get(PRODUCT_API_PATH, { params });
            return response.data; // Trả về BaseResponse<Page<Product>>
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Tạo mới sản phẩm
     */
    create: async (productRequest) => {
        try {
            const response = await api.post(PRODUCT_API_PATH, productRequest);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Cập nhật thông tin sản phẩm
     */
    update: async (id, productRequest) => {
        try {
            const response = await api.put(`${PRODUCT_API_PATH}/${id}`, productRequest);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    /**
     * Xóa sản phẩm
     */
    delete: async (id) => {
        try {
            const response = await api.delete(`${PRODUCT_API_PATH}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    getImages: async (id) => {
        try {
            const response = await api.get(`${PRODUCT_API_PATH}/${id}/images`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    createWithImages: async (formData) => {
        try {
            const response = await api.post(PRODUCT_API_PATH, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    updateWithImages: async (id, formData) => {
        try {
            const response = await api.put(`${PRODUCT_API_PATH}/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};

export default product;